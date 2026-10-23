import { activityFor, adaptTdee, bmr, macroKcal, phaseFor, targets, trendWeight, waterFor, type NutritionInput } from './nutrition'
import { calorieFloor, maxDeficit } from './safety'

const man: NutritionInput = { sex: 'male', weightKg: 80, heightCm: 180, age: 30, activity: 1.55, goal: 'hypertrophy', experience: 'intermediate', baseClass: 'tank', dietType: 'nonveg' }

test('Mifflin-St Jeor', () => {
  expect(bmr('male', 80, 180, 30)).toBe(1780)
  expect(bmr('female', 60, 165, 30)).toBeCloseTo(1320.25, 2)
})

test('activity mapping and phases', () => {
  expect([0, 2, 4, 6].map((d) => activityFor(d))).toEqual([1.2, 1.375, 1.55, 1.725])
  expect(activityFor(6, true)).toBe(1.9)
  expect([phaseFor('fat_loss'), phaseFor('recomp'), phaseFor('hypertrophy'), phaseFor('strength'), phaseFor('mobility'), phaseFor('endurance')]).toEqual(['cut', 'recomp', 'bulk', 'bulk', 'maintain', 'maintain'])
})

test('bulk targets for an intermediate Tank: +10%, protein 1.8 g/kg, fat ≥ 0.8 g/kg, carbs remainder', () => {
  const t = targets(man)
  expect(t.tdee).toBe(Math.round(1780 * 1.55))
  expect(t.kcal).toBe(Math.round((t.tdee * 1.1) / 10) * 10)
  expect(t.protein).toBe(144)
  expect(t.fat).toBeGreaterThanOrEqual(64)
  expect(Math.abs(macroKcal(t.protein, t.carbs, t.fat) - t.kcal)).toBeLessThan(10)
  expect(t.fibre).toBe(Math.round(14 * t.kcal / 1000))
  expect(t.waterMl).toBe(2800)
  expect(waterFor(t, 1)).toBe(3300)
})

test('cut: −20%, capped at 750 kcal and never below the safe floor', () => {
  const cut = targets({ ...man, goal: 'fat_loss' })
  expect(cut.kcal).toBe(Math.round((cut.tdee - Math.min(0.2 * cut.tdee, maxDeficit(cut.tdee))) / 10) * 10)
  expect(cut.protein).toBe(Math.round(2.2 * 80))
  const big = targets({ ...man, goal: 'fat_loss', weightKg: 150, heightCm: 190, activity: 1.9 })
  expect(big.tdee - big.kcal).toBeLessThanOrEqual(750)
  const small = targets({ ...man, sex: 'female', weightKg: 45, heightCm: 150, age: 50, activity: 1.2, goal: 'fat_loss' })
  expect(small.kcal).toBeGreaterThanOrEqual(1200)
  expect(small.kcal).toBe(small.floor)
  expect(small.warnings.join()).toMatch(/safe minimum/)
})

test('no deficit when underweight or under 18', () => {
  const thin = targets({ ...man, weightKg: 52, goal: 'fat_loss' })
  expect(thin.kcal).toBe(Math.round(thin.tdee / 10) * 10)
  expect(thin.warnings.join()).toMatch(/not permitted/)
  expect(targets({ ...man, age: 16, goal: 'fat_loss' }).warnings.join()).toMatch(/not permitted/)
})

test('protein per diet type, class and age; capped at 2.4 g/kg', () => {
  expect(targets({ ...man, dietType: 'vegetarian' }).protein).toBe(Math.round(1.8 * 1.1 * 80))
  expect(targets({ ...man, dietType: 'vegan' }).protein).toBe(Math.round(1.8 * 1.2 * 80))
  expect(targets({ ...man, dietType: 'vegan', goal: 'fat_loss' }).protein).toBe(Math.round(2.4 * 80))
  expect(targets({ ...man, baseClass: 'healer', goal: 'mobility', age: 70 }).protein).toBe(Math.round(1.4 * 80))
  expect(targets({ ...man, baseClass: 'assassin', goal: 'recomp' }).kcal).toBeLessThan(targets({ ...man, goal: 'mobility' }).kcal)
  expect(targets({ ...man, experience: 'beginner' }).kcal).toBeGreaterThan(targets({ ...man, experience: 'advanced' }).kcal)
})

test('warns when carbs fall below 3 g/kg for strength classes', () => {
  expect(targets({ ...man, goal: 'fat_loss', activity: 1.2 }).warnings.join()).toMatch(/Carbohydrate/)
  expect(targets({ ...man, tdeeOverride: 500 }).kcal).toBe(calorieFloor('male', 1780))
})

test('floors and deficit cap', () => {
  expect(calorieFloor('female', 1100)).toBe(1200)
  expect(calorieFloor('male', 1700)).toBe(1700)
  expect(maxDeficit(2000)).toBe(500)
  expect(maxDeficit(4000)).toBe(750)
})

test('adaptive TDEE: blends, clamps ±150 kcal and needs enough data', () => {
  const week = (kg: number) => Array(5).fill(kg)
  expect(adaptTdee(2500, 1780, week(80), [80, 80], [2500, 2500, 2500, 2500, 2500])).toBe(2500)
  expect(adaptTdee(2500, 1780, week(79.5), week(80), Array(7).fill(2500))).toBe(2650)
  expect(adaptTdee(2500, 1780, week(80.5), week(80), Array(7).fill(2500))).toBe(2380)
  expect(adaptTdee(2500, 1780, week(81.5), week(80), Array(7).fill(2500))).toBe(2350)
  expect(adaptTdee(2500, 1780, week(80), week(80), Array(7).fill(2400))).toBe(2470)
  expect(adaptTdee(2000, 1780, week(82), week(80), Array(7).fill(1000))).toBe(Math.round(1780 * 1.1))
})

test('trend weight is a 7-day mean', () => {
  expect(trendWeight([])).toBeNull()
  expect(trendWeight(Array.from({ length: 9 }, (_, i) => ({ day: `2026-10-0${i + 1}`, value: 80 + i })))).toBe(85)
})
