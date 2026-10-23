import { baseOf, prescribe, secondsPerSet } from './prescription'
import type { Exercise } from './types'

const compound = { mechanics: 'compound', pattern: 'squat', classTags: ['fighter'] } as Pick<Exercise, 'mechanics' | 'pattern' | 'classTags'>
const iso = { mechanics: 'isolation', pattern: 'curl', classTags: ['tank'] } as Pick<Exercise, 'mechanics' | 'pattern' | 'classTags'>

test('class table: Fighter intermediate is 3-6 reps, long rest, double progression', () => {
  const rx = prescribe(compound, { cls: 'fighter', experience: 'intermediate' })
  expect([rx.repMin, rx.repMax, rx.rir, rx.restSec, rx.model]).toEqual([3, 6, 2, 180, 'double'])
  expect(rx.pct).toEqual([80, 88])
})

test('Tank isolation uses the higher rep band and shorter rest', () => {
  const rx = prescribe(iso, { cls: 'tank', experience: 'intermediate' })
  expect([rx.repMin, rx.repMax, rx.restSec]).toEqual([10, 20, 75])
})

test('Assassin density, Healer holds, Fighter advanced top set + back-off', () => {
  expect(prescribe(compound, { cls: 'assassin', experience: 'advanced' }).model).toBe('density')
  expect(prescribe({ ...iso, pattern: 'stretch' }, { cls: 'healer', experience: 'beginner' }).holdSec).toBe(30)
  expect(prescribe(compound, { cls: 'healer', experience: 'beginner' }).holdSec).toBeUndefined()
  expect(prescribe(compound, { cls: 'fighter', experience: 'advanced' }).technique).toBe('top_backoff')
})

test('Ranger undulating day types', () => {
  expect(prescribe(compound, { cls: 'ranger', experience: 'intermediate', dayType: 'heavy' }).repMax).toBe(5)
  expect(prescribe(compound, { cls: 'ranger', experience: 'intermediate', dayType: 'light' }).repMin).toBe(10)
  expect(prescribe(compound, { cls: 'ranger', experience: 'intermediate' }).repMin).toBe(6)
})

test('beginner on-ramp: weeks 1-2 at 8-12 reps, RIR 4, 2 sets', () => {
  const rx = prescribe(compound, { cls: 'fighter', experience: 'beginner', week: 1 })
  expect([rx.repMin, rx.repMax, rx.rir, rx.sets]).toEqual([8, 12, 4, 2])
  expect(prescribe(compound, { cls: 'fighter', experience: 'beginner', week: 3 }).rir).toBe(3)
  expect(prescribe(compound, { cls: 'fighter', experience: 'beginner', week: 9 }).repMax).toBe(8)
})

test('women get higher isolation rep ceilings; age adjusts RIR, reps and rest', () => {
  expect(prescribe(iso, { cls: 'fighter', experience: 'intermediate', sex: 'female' }).repMax).toBe(15)
  const old = prescribe(compound, { cls: 'fighter', experience: 'intermediate', age: 64 })
  expect(old.rir).toBeGreaterThanOrEqual(2)
  expect(old.repMin).toBe(10)
  expect(old.restSec).toBe(210)
  expect(prescribe(compound, { cls: 'fighter', experience: 'advanced', age: 52 }).rir).toBe(2)
})

test('readiness yellow trims sets and adds RIR; deload halves sets with RIR ≥ 4', () => {
  const normal = prescribe(compound, { cls: 'tank', experience: 'advanced' })
  const yellow = prescribe(compound, { cls: 'tank', experience: 'advanced', readiness: 'yellow' })
  expect(yellow.sets).toBeLessThan(normal.sets)
  expect(yellow.rir).toBe(normal.rir + 1)
  const de = prescribe(compound, { cls: 'tank', experience: 'advanced', deload: true })
  expect(de.sets).toBe(Math.round(normal.sets * 0.55))
  expect(de.rir).toBe(4)
})

test('advanced classes map to base classes; Shadow Monarch uses the exercise class', () => {
  expect(baseOf('berserker')).toBe('fighter')
  expect(baseOf('juggernaut')).toBe('tank')
  expect(baseOf('monk')).toBe('healer')
  expect(baseOf('shadow_monarch', { classTags: ['assassin'] })).toBe('assassin')
  expect(baseOf('shadow_monarch')).toBe('fighter')
  expect(prescribe(iso, { cls: 'shadow_monarch', experience: 'intermediate' }).repMax).toBe(20)
})

test('seconds per set', () => {
  expect(secondsPerSet({ repMax: 10 })).toBe(45)
  expect(secondsPerSet({ repMax: 10, holdSec: 30 })).toBe(60)
})
