// Nutrition engine (PRD B3.7; research/science.md §6; docs/game-design.md §12).
import type { BaseClass, Experience, Goal, Sex } from './types'
import type { DietType } from './model'
import { calorieFloor, maxDeficit } from './safety'

export const bmr = (sex: Sex, kg: number, cm: number, age: number) => 10 * kg + 6.25 * cm - 5 * age + (sex === 'male' ? 5 : -161)

export const ACTIVITY = [1.2, 1.375, 1.55, 1.725, 1.9] as const
/** Onboarding mapping from training days/week (R5 §6.1), starting one band lower when unsure. */
export function activityFor(trainingDays: number, physicalJob = false) {
  const i = trainingDays <= 1 ? 0 : trainingDays <= 3 ? 1 : trainingDays <= 5 ? 2 : 3
  return ACTIVITY[Math.min(4, i + (physicalJob ? 1 : 0))]
}

export type Phase = 'cut' | 'recomp' | 'maintain' | 'bulk'
export const phaseFor = (goal: Goal): Phase => (goal === 'fat_loss' ? 'cut' : goal === 'recomp' ? 'recomp' : goal === 'hypertrophy' || goal === 'strength' ? 'bulk' : 'maintain')

export type NutritionInput = { sex: Sex; weightKg: number; heightCm: number; age: number; activity: number; goal: Goal; experience: Experience; baseClass: BaseClass; dietType: DietType; tdeeOverride?: number; trainingHours?: number }
export type Targets = { bmr: number; tdee: number; kcal: number; protein: number; fat: number; carbs: number; fibre: number; waterMl: number; floor: number; phase: Phase; warnings: string[] }

const PROTEIN: Record<BaseClass, { base: number; cut: number }> = {
  fighter: { base: 1.8, cut: 2.2 }, tank: { base: 1.8, cut: 2.2 }, assassin: { base: 1.6, cut: 2.0 }, ranger: { base: 1.8, cut: 2.0 }, healer: { base: 1.4, cut: 1.8 },
}

export function targets(i: NutritionInput): Targets {
  const warnings: string[] = []
  const b = bmr(i.sex, i.weightKg, i.heightCm, i.age)
  const tdee = Math.round(i.tdeeOverride ?? b * i.activity)
  const floor = calorieFloor(i.sex, b)
  const phase = phaseFor(i.goal)
  const bmi = i.weightKg / (i.heightCm / 100) ** 2
  let kcal = tdee
  if (phase === 'cut') {
    if (bmi < 18.5 || i.age < 18) warnings.push('[A deficit is not permitted at your current body weight or age. Target set to maintenance.]')
    else kcal = tdee - Math.min(0.2 * tdee, maxDeficit(tdee))
  } else if (phase === 'recomp') kcal = tdee * 0.95
  else if (phase === 'bulk') kcal = tdee * (i.experience === 'beginner' ? 1.12 : i.experience === 'intermediate' ? 1.1 : 1.05)
  if (kcal < floor) { kcal = floor; warnings.push('[Calories raised to the safe minimum.]') }
  kcal = (phase === 'cut' ? Math.ceil(kcal / 10) : Math.round(kcal / 10)) * 10 // never round past the deficit cap

  const pc = PROTEIN[i.baseClass]
  let gkg = phase === 'cut' ? pc.cut : pc.base
  if (i.dietType === 'vegetarian' || i.dietType === 'eggetarian') gkg *= 1.1
  if (i.dietType === 'vegan') gkg = Math.max(gkg * 1.2, i.baseClass === 'fighter' || i.baseClass === 'tank' ? 1.8 : 0)
  if (i.age >= 60) gkg = Math.max(gkg, 1.2)
  gkg = Math.min(2.4, gkg)
  const protein = Math.round(gkg * i.weightKg)
  const fat = Math.round(Math.max(0.8 * i.weightKg, (0.2 * kcal) / 9))
  let carbs = Math.round((kcal - protein * 4 - fat * 9) / 4)
  if (carbs < 0) carbs = 0
  if ((i.baseClass === 'fighter' || i.baseClass === 'tank') && carbs < 3 * i.weightKg) warnings.push('[Carbohydrate is below 3 g/kg. Training performance may suffer.]')
  const fibre = Math.round((14 * kcal) / 1000)
  const waterMl = Math.round(((i.sex === 'female' ? 31 : 35) * i.weightKg + 500 * (i.trainingHours ?? 0)) / 50) * 50
  return { bmr: Math.round(b), tdee, kcal, protein, fat, carbs, fibre, waterMl, floor, phase, warnings }
}

/** Water target for a given day: base + 500 ml per hour of training logged/planned that day. */
export const waterFor = (base: Targets, trainingHours: number) => base.waterMl + Math.round(trainingHours * 500)

/**
 * Weekly adaptive TDEE from the weight trend (R5 §6.7). Returns the new TDEE, or the old one when data is insufficient.
 * weights: weigh-ins (kg) this week and last week; intakes: logged daily kcal this week.
 */
export function adaptTdee(old: number, bmrValue: number, thisWeek: number[], lastWeek: number[], intakes: number[]) {
  if (thisWeek.length < 4 || lastWeek.length < 4 || intakes.length < 5) return old
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  const dW = mean(thisWeek) - mean(lastWeek)
  const intake = mean(intakes)
  const obs = intake - (dW * (dW < 0 ? 7700 : 5600)) / 7
  let next = 0.7 * old + 0.3 * obs
  next = Math.max(old - 150, Math.min(old + 150, next))
  next = Math.max(bmrValue * 1.1, Math.min(bmrValue * 2.3, next))
  return Math.round(next)
}

/** 7-day moving average trend weight, the number we show instead of the raw scale reading. */
export function trendWeight(weights: { day: string; value: number }[]) {
  const s = [...weights].sort((a, b) => a.day.localeCompare(b.day)).slice(-7)
  return s.length ? Math.round((s.reduce((a, w) => a + w.value, 0) / s.length) * 10) / 10 : null
}

export const macroKcal = (p: number, c: number, f: number) => p * 4 + c * 4 + f * 9
