import { capFor, hardSetCredit, WEEKLY_CAP, weeklyHardSets } from './safety'
import { hashSeed, rng } from './rng'
import { MUSCLES } from './types'

test('every muscle has a cap per level, never above 25, increasing with experience', () => {
  for (const m of MUSCLES) {
    const c = WEEKLY_CAP[m]
    expect(c.beginner).toBeLessThanOrEqual(c.intermediate)
    expect(c.intermediate).toBeLessThanOrEqual(c.advanced)
    expect(capFor(m, 'advanced')).toBeLessThanOrEqual(25)
  }
  expect(capFor('chest', 'intermediate', 55)).toBe(16)
})

test('hard set credit by RIR', () => {
  expect([0, 3, 4, 5, null].map(hardSetCredit)).toEqual([1, 1, 0.5, 0, 1])
})

test('weekly hard sets: primary 1, secondary 0.5, warm-ups 0', () => {
  const ex = new Map([['b', { primary: ['chest' as const], secondary: ['triceps' as const] }]])
  const v = weeklyHardSets([{ exerciseId: 'b', rir: 2, type: 'working' }, { exerciseId: 'b', rir: 4, type: 'working' }, { exerciseId: 'b', rir: 1, type: 'warmup' }, { exerciseId: 'x', rir: 1, type: 'working' }], ex)
  expect(v.chest).toBe(1.5)
  expect(v.triceps).toBe(0.75)
})

test('rng is deterministic and uniform-ish', () => {
  const a = rng(42), b = rng(42)
  const xs = Array.from({ length: 1000 }, () => a())
  expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b()))
  expect(xs.every((x) => x >= 0 && x < 1)).toBe(true)
  expect(Math.abs(xs.reduce((s, x) => s + x, 0) / 1000 - 0.5)).toBeLessThan(0.05)
  expect(hashSeed('a')).not.toBe(hashSeed('b'))
})
