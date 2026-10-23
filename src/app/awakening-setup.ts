// Awakening setup data and pure helpers (no database): the Awakening screen loads this first, and the
// database-backed `awaken()` in ./awakening only when the Player submits.
import { powerLevel } from '@/engine/powerLevel'
import { startingRank } from '@/engine/ranks'
import type { AwakeningTest, DietType, NotificationPrefs, Units } from '@/engine/model'
import type { BaseClass, Equipment, Experience, Goal, Muscle, Sex } from '@/engine/types'

export type EquipmentPreset = 'gym' | 'home_dumbbells' | 'bodyweight'
export const EQUIPMENT_PRESETS: Record<EquipmentPreset, { name: string; equipment: Equipment[] }> = {
  gym: { name: 'Full gym', equipment: ['bodyweight', 'dumbbell', 'barbell', 'ez_bar', 'kettlebell', 'cable', 'machine', 'smith_machine', 'bands', 'bench', 'pullup_bar', 'medicine_ball', 'stability_ball', 'foam_roller', 'cardio_machine'] },
  home_dumbbells: { name: 'Home: dumbbells + bench', equipment: ['bodyweight', 'dumbbell', 'bench', 'bands', 'pullup_bar'] },
  bodyweight: { name: 'Bodyweight only', equipment: ['bodyweight'] },
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = { workout: '18:00', water: { from: '09:00', to: '21:00', everyMin: 120 }, meals: ['08:30', '13:30', '20:00'], calorieCheck: '20:30', readiness: '08:00', streak: '20:00', penalty: '21:00', enabled: false }

export type AwakeningAnswers = {
  name: string; sex: Sex; birthYear: number; heightCm: number; weightKg: number; units: Units
  goal: Goal; experience: Experience; equipment: Equipment[]; equipmentName: string; injuries: { muscles: Muscle[]; note: string }[]
  trainingDays: number[]; sessionMinutes: number; dietType: DietType; cuisine: string; budget: boolean; notifications: NotificationPrefs
  test: AwakeningTest; baseClass: BaseClass
}

/** Class suggested by goal (the Player can pick any). */
export const suggestedClass = (goal: Goal): BaseClass => (goal === 'strength' ? 'fighter' : goal === 'hypertrophy' || goal === 'recomp' ? 'tank' : goal === 'endurance' || goal === 'fat_loss' ? 'assassin' : goal === 'mobility' ? 'healer' : 'ranger')

export function revealPower(a: Pick<AwakeningAnswers, 'sex' | 'weightKg' | 'test' | 'experience'>) {
  const pl = powerLevel({ sex: a.sex, bodyweightKg: a.weightKg, e1rm: a.experience === 'beginner' ? {} : a.test.e1rm ?? {}, awakening: a.test, cardioMinutesPerWeek: 0 })
  return { power: pl.total, rank: startingRank(pl.total, a.experience), parts: pl }
}
