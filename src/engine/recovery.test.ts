import { cardioHits, cardioMode, CAPACITY, effortFactor, fatigue, loadFactor, noveltyFactor, overallRecovery, readinessScore, readinessTier, recovery, recoveryBand, setHits } from './recovery'
import type { CardioLog, SetLog } from './model'
import type { Exercise } from './types'

const H = 3_600_000
const T0 = Date.UTC(2026, 9, 20, 18)
const exs = new Map<string, Pick<Exercise, 'primary' | 'secondary'>>([
  ['squat', { primary: ['quads', 'glutes'], secondary: ['hamstrings'] }],
  ['curl', { primary: ['biceps'], secondary: [] }],
])
const set = (exerciseId: string, rir: number | null, at = T0, type: SetLog['type'] = 'working'): SetLog => ({ id: Math.random().toString(), workoutId: 'w', exerciseId, order: 0, setIndex: 0, type, weightKg: 100, reps: 8, rir, completedAt: at })

test('effort, load and novelty factors match R5', () => {
  expect([0, 1, 2, 3, 4, 5, 9].map(effortFactor)).toEqual([1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.25])
  expect(effortFactor(null)).toBe(0.7)
  expect([loadFactor(0.5), loadFactor(0.7), loadFactor(0.85), loadFactor(null)]).toEqual([1.1, 1, 0.9, 1])
  expect([noveltyFactor(1), noveltyFactor(10), noveltyFactor(20), noveltyFactor(30)]).toEqual([1.5, 1.3, 1.15, 1])
})

test('typical session: 6 sets at RIR 2 leaves quads at 58% then ≥ 90% within ~50 h', () => {
  const hits = setHits(Array.from({ length: 6 }, () => set('squat', 2)), exs)
  expect(recovery(hits, { now: T0 }).quads).toBe(58)
  expect(recovery(hits, { now: T0 + 50 * H }).quads).toBeGreaterThanOrEqual(90)
  expect(recovery(hits, { now: T0 }).hamstrings).toBe(79) // synergist at half
})

test('a full-capacity session is 0% and ~75% after 48 h (half-life 24 h)', () => {
  const hits = [{ muscle: 'quads' as const, fp: CAPACITY, at: T0 }]
  expect(recovery(hits, { now: T0 }).quads).toBe(0)
  expect(recovery(hits, { now: T0 + 48 * H }).quads).toBe(75)
  expect(recovery(hits, { now: T0 + 144 * H }).quads).toBe(98)
})

test('fatigue never exceeds capacity in the display; future hits ignored; warm-ups ignored', () => {
  const hits = setHits(Array.from({ length: 20 }, () => set('squat', 0)), exs)
  expect(recovery(hits, { now: T0 }).quads).toBe(0)
  expect(recovery(hits, { now: T0 - 1 }).quads).toBe(100)
  expect(setHits([set('squat', 0, T0, 'warmup')], exs)).toEqual([])
  expect(setHits([set('unknown', 0)], exs)).toEqual([])
})

test('novelty and %1RM feed the fatigue per set', () => {
  const s = set('curl', 0)
  const hits = setHits([s], exs, { firstSeen: new Map([['curl', T0]]), oneRm: new Map([['curl', 200]]) })
  expect(hits[0].fp).toBeCloseTo(1 * 1.1 * 1.5, 5)
})

test('older lifters recover slower (×1.25 half-life at 60+)', () => {
  const hits = [{ muscle: 'quads' as const, fp: CAPACITY, at: T0 }]
  expect(recovery(hits, { now: T0 + 48 * H, age: 65 }).quads).toBeLessThan(recovery(hits, { now: T0 + 48 * H }).quads)
})

test('manual override resets the muscle at that time and decays afterwards', () => {
  const hits = setHits(Array.from({ length: 10 }, () => set('squat', 0)), exs)
  const overrides = [{ id: 'o', muscle: 'quads' as const, value: 90, at: T0 + H }]
  expect(recovery(hits, { now: T0 + H, overrides }).quads).toBe(90)
  const later = setHits([set('squat', 0, T0 + 2 * H)], exs)
  expect(recovery([...hits, ...later], { now: T0 + 2 * H, overrides }).quads).toBeLessThan(90)
  expect(fatigue(hits, { now: T0, overrides: [{ id: 'f', muscle: 'quads', value: 50, at: T0 + 5 * H }] }).quads).toBeGreaterThan(0)
})

test('readiness factor and injury cap', () => {
  expect(readinessTier(4)).toBe('green')
  expect(readinessTier(3)).toBe('yellow')
  expect(readinessTier(2)).toBe('red')
  expect(readinessTier(null)).toBe('green')
  const r = recovery([], { now: T0, readiness: { day: 'x', sleep: 1, soreness: 5, energy: 1, stress: 5, score: 1, at: 0 }, injured: ['chest'] })
  expect(r.quads).toBe(75)
  expect(r.chest).toBe(30)
  expect(readinessScore({ sleep: 5, soreness: 1, energy: 5, stress: 1 })).toBe(5)
  expect(readinessScore({ sleep: 3, soreness: 3, energy: 3, stress: 3 })).toBe(3)
})

test('cardio fatigues legs by MET and mode', () => {
  const run: CardioLog = { id: 'c', startedAt: T0, day: 'd', activity: 'Treadmill run', durationMin: 30, met: 9.8, kcal: 300 }
  const r = recovery(cardioHits([run]), { now: T0 })
  expect(r.quads).toBe(66)
  expect(r.chest).toBe(100)
  expect(cardioHits([{ ...run, met: 2.5 }])).toEqual([])
  const hiit = cardioHits([{ ...run, activity: 'Assault bike', hiit: true }])
  expect(hiit.find((h) => h.muscle === 'quads')!.fp).toBeCloseTo(0.6 * 6.8 * 0.5 * 1.2, 5)
  expect(['run', 'cycle', 'row', 'elliptical', 'stairs', 'swim', 'rope', 'walk', 'hiit']).toEqual(['Jog', 'Spin bike', 'Rowing machine', 'Elliptical', 'Stair climber', 'Swimming', 'Jump rope', 'Walk', 'Burpees'].map(cardioMode))
})

test('bands and overall recovery', () => {
  expect([recoveryBand(80), recoveryBand(50), recoveryBand(10)]).toEqual(['ready', 'partial', 'avoid'])
  const r = recovery([{ muscle: 'quads', fp: 5, at: T0 }], { now: T0 })
  expect(overallRecovery(r, ['quads', 'chest'])).toBe(75)
  expect(overallRecovery(r, [])).toBe(100)
})
