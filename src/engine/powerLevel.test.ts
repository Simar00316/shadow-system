import { awakeningScore, levelName, liftScore, powerLevel } from './powerLevel'

test('lift score hits the standard levels at the reference bodyweight', () => {
  expect(liftScore('male', 'squat', 0.94 * 82, 82)).toBeCloseTo(10, 5)
  expect(liftScore('male', 'squat', 1.66 * 82, 82)).toBeCloseTo(50, 5)
  expect(liftScore('male', 'bench', 1.88 * 82, 82)).toBeCloseTo(95, 5)
  expect(liftScore('female', 'deadlift', 1.4 * 64, 64)).toBeCloseTo(50, 5)
  expect(liftScore('male', 'squat', 10, 82)).toBe(0)
  expect(liftScore('male', 'squat', 0.7 * 82, 82)).toBeGreaterThan(0)
  expect(liftScore('male', 'squat', 10 * 82, 82)).toBe(100)
})

test('women standards scale down with bodyweight; men are flat', () => {
  expect(liftScore('female', 'squat', 1.18 * 90, 90)).toBeGreaterThan(50)
  expect(liftScore('male', 'squat', 1.66 * 110, 110)).toBeCloseTo(50, 5)
})

test('level names', () => {
  expect([5, 10, 30, 60, 80, 96].map(levelName)).toEqual(['Untrained', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'])
})

test('awakening test score uses sex-specific push-up norms', () => {
  const m = awakeningScore('male', { pushups: 25, squats60s: 35, plankSec: 60 })
  expect(m.push).toBeCloseTo(25)
  expect(m.mean).toBeCloseTo(25)
  expect(awakeningScore('female', { pushups: 17, squats60s: 0, plankSec: 0 }).push).toBeCloseTo(25)
  expect(awakeningScore('male', { pushups: 100, squats60s: 100, plankSec: 600 }).mean).toBe(40)
  expect(awakeningScore('male', { pushups: 5, squats60s: 10, plankSec: 15 }).mean).toBeCloseTo(5, 0)
})

test('starting Power Level: most users E or D (gate 15)', () => {
  const untrained = powerLevel({ sex: 'male', bodyweightKg: 80, e1rm: {}, awakening: { pushups: 8, squats60s: 18, plankSec: 25 }, cardioMinutesPerWeek: 0 })
  const average = powerLevel({ sex: 'male', bodyweightKg: 80, e1rm: {}, awakening: { pushups: 27, squats60s: 38, plankSec: 75 }, cardioMinutesPerWeek: 60 })
  expect(untrained.total).toBeLessThan(15)
  expect(average.total).toBeGreaterThanOrEqual(15)
  expect(average.total).toBeLessThan(40)
})

test('loaded lifts take the best three; consistency and conditioning add up; capped at 100', () => {
  const pl = powerLevel({ sex: 'male', bodyweightKg: 82, e1rm: { squat: 1.66 * 82, bench: 1.22 * 82, deadlift: 1.93 * 82, ohp: 0.1 }, cardioMinutesPerWeek: 150, adherence: 1 })
  expect(pl.strength).toBe(50)
  expect(pl.conditioning).toBe(60)
  expect(pl.consistency).toBe(100)
  expect(pl.total).toBe(Math.round(0.6 * 50 + 0.25 * 60 + 15))
  expect(powerLevel({ sex: 'male', bodyweightKg: 82, e1rm: { squat: 900, bench: 900, deadlift: 900 }, cardioMinutesPerWeek: 999, adherence: 2, awakening: { pushups: 99, squats60s: 99, plankSec: 999 } }).total).toBe(100)
  expect(powerLevel({ sex: 'female', bodyweightKg: 60, e1rm: {}, cardioMinutesPerWeek: 0 }).total).toBe(0)
})
