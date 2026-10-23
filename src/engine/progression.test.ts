import { autoregulate, bestE1rm, deloadDue, deloadTarget, exposuresSince, nextTarget, stallCount, type Exposure, type Target } from './progression'
import type { Exercise } from './types'

const bench = { primary: ['chest'], pattern: 'horizontal_push', equipment: ['barbell'] } as Pick<Exercise, 'primary' | 'pattern' | 'equipment'>
const squat = { primary: ['quads'], pattern: 'squat', equipment: ['barbell'] } as Pick<Exercise, 'primary' | 'pattern' | 'equipment'>
const curl = { primary: ['biceps'], pattern: 'curl', equipment: ['dumbbell'] } as Pick<Exercise, 'primary' | 'pattern' | 'equipment'>
const T: Target = { loadKg: 80, repMin: 6, repMax: 10, rir: 2, sets: 3, restSec: 120 }
const exp = (w: number, reps: number[], rir: number | null = 2, at = 0): Exposure => ({ at, sets: reps.map((r) => ({ weightKg: w, reps: r, rir })) })

test('no history → start', () => {
  expect(nextTarget(bench, T, [], { model: 'double', experience: 'intermediate' }).action).toBe('start')
})

test('double progression needs the top of the range on 2 sessions (intermediate)', () => {
  const once = [exp(80, [8, 8, 7]), exp(80, [10, 10, 10])]
  expect(nextTarget(bench, T, once, { model: 'double', experience: 'intermediate' }).action).toBe('add_reps')
  const twice = [exp(80, [10, 10, 10]), exp(80, [10, 10, 10])]
  const n = nextTarget(bench, T, twice, { model: 'double', experience: 'intermediate' })
  expect(n.action).toBe('add_load')
  expect(n.loadKg).toBe(82.5)
})

test('beginners progress after one successful session, but not during the first 4 exposures of a lift', () => {
  const four = [exp(60, [9, 9, 9]), exp(60, [9, 9, 9]), exp(60, [10, 10, 10]), exp(60, [10, 10, 10])].map((e, i) => ({ ...e, at: i }))
  expect(nextTarget(squat, { ...T, loadKg: 60 }, four, { model: 'double', experience: 'beginner' }).action).not.toBe('add_load')
  const five = [...four, exp(60, [10, 10, 10])]
  const n = nextTarget(squat, { ...T, loadKg: 60 }, five, { model: 'double', experience: 'beginner' })
  expect(n.action).toBe('add_load')
  expect(n.loadKg).toBe(65)
})

test('failure-to-RIR-0 does not count as hitting the top (needs RIR ≥ 1)', () => {
  const h = [exp(80, [10, 10, 10], 0), exp(80, [10, 10, 10], 0)]
  expect(nextTarget(bench, T, h, { model: 'double', experience: 'intermediate' }).action).not.toBe('add_load')
})

test('when one plate step is over 10% of load, extend reps instead', () => {
  const h = [exp(12, [10, 10, 10]), exp(12, [10, 10, 10])]
  const n = nextTarget(curl, { ...T, loadKg: 12 }, h, { model: 'double', experience: 'intermediate' })
  expect(n.action).toBe('add_reps')
  expect(n.repMax).toBe(12)
})

test('linear: three misses in a row drop 10%', () => {
  const h = [exp(100, [5, 4, 4]), exp(100, [5, 4, 3]), exp(100, [4, 4, 3])]
  const n = nextTarget(squat, { ...T, loadKg: 100 }, h, { model: 'linear', experience: 'beginner' })
  expect(n.action).toBe('reduce_load')
  expect(n.loadKg).toBe(90)
  expect(nextTarget(squat, { ...T, loadKg: 100 }, [exp(100, [7, 7, 7])], { model: 'linear', experience: 'beginner' }).action).toBe('hold')
})

test('autoregulation: two too-hard sessions drop 5%', () => {
  const h = [exp(80, [5, 5, 4], 0), exp(80, [5, 4, 4], 0)]
  const n = nextTarget(bench, T, h, { model: 'double', experience: 'intermediate' })
  expect(n.action).toBe('reduce_load')
  expect(n.loadKg).toBe(76)
})

test('plateau: 3 stalled exposures → swap, 4 → lift deload', () => {
  const stalled = [exp(80, [8, 8, 8], 2), exp(80, [8, 8, 8], 2), exp(80, [8, 8, 8], 2), exp(80, [8, 8, 8], 2)]
  expect(stallCount(stalled)).toBe(3)
  const n = nextTarget(bench, T, stalled, { model: 'double', experience: 'intermediate' })
  expect([n.action, n.plateau]).toEqual(['swap', true])
  const more = [...stalled, exp(80, [8, 8, 8], 2)]
  const d = nextTarget(bench, T, more, { model: 'double', experience: 'intermediate' })
  expect([d.action, d.loadKg]).toEqual(['deload_lift', 72])
  expect(stallCount([exp(80, [8], 2), exp(82.5, [8], 2)])).toBe(0)
  expect(stallCount([exp(80, [12], 2)])).toBe(0)
})

test('density: cut rest to 30 s, then add load', () => {
  const T2 = { ...T, repMin: 12, repMax: 20, restSec: 45 }
  expect(nextTarget(bench, T2, [exp(40, [20, 20, 20])], { model: 'density', experience: 'intermediate' }).restSec).toBe(35)
  const at30 = nextTarget(bench, { ...T2, loadKg: 40, restSec: 30 }, [exp(40, [20, 20, 20])], { model: 'density', experience: 'intermediate' })
  expect([at30.action, at30.loadKg, at30.restSec]).toEqual(['add_load', 42.5, 60])
  expect(nextTarget(bench, T2, [exp(40, [15, 14, 12])], { model: 'density', experience: 'intermediate' }).action).toBe('add_reps')
})

test('hold progression adds 5 s up to 60 s, then range', () => {
  const H = { ...T, repMin: 2, repMax: 2, holdSec: 30 }
  expect(nextTarget(bench, H, [exp(0, [2, 2])], { model: 'hold', experience: 'beginner' }).holdSec).toBe(35)
  expect(nextTarget(bench, { ...H, holdSec: 60 }, [exp(0, [2, 2])], { model: 'hold', experience: 'beginner' }).action).toBe('add_reps')
  expect(nextTarget(bench, H, [exp(0, [1, 1])], { model: 'hold', experience: 'beginner' }).action).toBe('hold')
})

test('autoregulate next set ±4% per RIR, clamped to ±10%', () => {
  expect(autoregulate(100, 4, 2)).toBe(108)
  expect(autoregulate(100, 0, 2)).toBe(92)
  expect(autoregulate(100, 5, 0)).toBe(110)
  expect(autoregulate(100, 2, 2)).toBe(100)
})

test('deload triggers', () => {
  const base = { experience: 'intermediate' as const, weeksSinceDeload: 3, liftDrops: [], readiness7: [], stalledLifts: 0 }
  expect(deloadDue(base).due).toBe(false)
  expect(deloadDue({ ...base, weeksSinceDeload: 6 }).reason).toBe('scheduled')
  expect(deloadDue({ ...base, experience: 'beginner', weeksSinceDeload: 7 }).due).toBe(false)
  expect(deloadDue({ ...base, liftDrops: [0.06, 0.05] }).reason).toBe('performance_drop')
  expect(deloadDue({ ...base, readiness7: [2, 2.5, 2, 4] }).reason).toBe('low_readiness')
  expect(deloadDue({ ...base, stalledLifts: 2 }).reason).toBe('stalls')
  expect(deloadDue({ ...base, beatUp: true }).reason).toBe('player_request')
  expect(deloadDue({ ...base, weeksSinceDeload: 1, stalledLifts: 5, liftDrops: [0.2, 0.2] }).due).toBe(false)
  expect(deloadDue({ ...base, weeksSinceDeload: 0, injury: true }).due).toBe(true)
  expect(exposuresSince([{ at: 1, sets: [] }, { at: 5, sets: [] }], 2)).toHaveLength(1)
  const d = deloadTarget({ ...T, sets: 4, rir: 1 }, true)
  expect([d.sets, d.loadKg, d.rir]).toEqual([2, 72, 4])
  expect(deloadTarget(T, false).loadKg).toBe(80)
  expect(bestE1rm(exp(100, [5, 3]))).toBeCloseTo(100 * 36 / 30, 1)
})
