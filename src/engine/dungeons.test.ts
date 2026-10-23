import { bossFloorsCrossed, bossHp, bossResult, castleFloor, castleScore, endWeek, floorCleared, floorThreshold, gateAccess, instantAllowed, isBossFloor, redGateStatus, resolveBoss, resolveDay, startRun, unstable } from './dungeons'
import { INSTANT_DUNGEONS, PROGRAMS } from '@/data/programs'
import { EXERCISES } from './testdata'

const idByName = new Map(EXERCISES.map((e) => [e.name.toLowerCase(), e.id]))
const ppl = PROGRAMS.find((p) => p.id === 'ppl')!

test('every program and instant dungeon resolves to real exercises', () => {
  expect(PROGRAMS.length).toBeGreaterThanOrEqual(12)
  for (const p of PROGRAMS) {
    for (const d of p.days) expect(resolveDay(d, idByName).every((e) => e.exerciseId)).toBe(true)
    for (const b of p.boss) expect(idByName.has(b.name.toLowerCase())).toBe(true)
    expect(p.boss.length).toBeGreaterThan(0)
  }
  for (const d of INSTANT_DUNGEONS) expect(resolveDay(d, idByName)).toHaveLength(d.exercises.length)
  expect(() => resolveDay({ name: 'x', exercises: [{ name: 'Nope', sets: 1, reps: [1, 1], rir: 2 }] }, idByName)).toThrow(/Unknown exercise/)
})

test('library covers every PRD program type and Red Gates', () => {
  const ids = PROGRAMS.map((p) => p.id)
  for (const id of ['ppl', 'upper_lower', 'full_body_3', 'wendler', 'novice_linear', 'home_calisthenics']) expect(ids).toContain(id)
  expect(PROGRAMS.filter((p) => p.red).every((p) => p.weeks === 1 && p.daysPerWeek === 7)).toBe(true)
})

test('gate access: at most one rank above; Red Gate needs C+', () => {
  expect(gateAccess(ppl, 'D').open).toBe(true)
  expect(gateAccess(ppl, 'E').open).toBe(false)
  const red = PROGRAMS.find((p) => p.red)!
  expect(gateAccess(red, 'D').reason).toMatch(/Red Gate/)
  expect(gateAccess(red, 'C').open).toBe(true)
})

test('floors clear at 75% of sessions; final week is the boss', () => {
  expect(floorCleared(ppl, 5)).toBe(true)
  expect(floorCleared(ppl, 4)).toBe(false)
  let run = startRun(ppl, 0, 'r')
  for (let w = 1; w < ppl.weeks; w++) run = endWeek(run, ppl, w === 3 ? 2 : 6)
  expect(run.floor).toBe(ppl.weeks)
  expect(run.floorsCleared).not.toContain(3)
  expect(isBossFloor(run, ppl)).toBe(true)
  expect(endWeek(run, ppl, 6)).toBe(run)
})

test('boss raid: all tests must pass; failure means retry with no loss', () => {
  const [a, b] = ppl.boss
  expect(bossResult([{ test: a, result: 10 }, { test: b, result: 11 }]).passed).toBe(true)
  expect(bossResult([{ test: a, result: 9 }, { test: b, result: 11 }]).passed).toBe(false)
  const e1 = PROGRAMS.find((p) => p.id === 'wendler')!.boss[0]
  expect(bossResult([{ test: e1, result: 105, baseline: 100 }]).passed).toBe(true)
  expect(bossResult([{ test: e1, result: 104, baseline: 100 }]).passed).toBe(false)
  expect(bossResult([{ test: e1, result: 999 }]).passed).toBe(false)
  expect(bossResult([]).passed).toBe(false)
  const run = { ...startRun(ppl, 0, 'r'), floor: 8 }
  expect(resolveBoss(run, false, 1)).toMatchObject({ status: 'active', bossAttempts: 1 })
  expect(resolveBoss(run, true, 1)).toMatchObject({ status: 'cleared', endedAt: 1 })
  expect(bossHp(10_000, 4_000)).toEqual({ max: 10_000, hp: 6_000 })
  expect(bossHp(100, 400).hp).toBe(0)
})

test('dungeon break after 10 idle days', () => {
  expect(unstable('2026-10-01', '2026-10-11', '2026-09-01')).toBe(true)
  expect(unstable('2026-10-05', '2026-10-11', '2026-09-01')).toBe(false)
  expect(unstable(null, '2026-10-11', '2026-10-02')).toBe(false)
})

test('red gate: 7 cleared days; a miss fails; waived days are suspended', () => {
  const days = Array.from({ length: 7 }, (_, i) => ({ day: `d${i}`, cleared: true, waived: false }))
  expect(redGateStatus(days)).toBe('cleared')
  expect(redGateStatus(days.slice(0, 4))).toBe('active')
  expect(redGateStatus([...days.slice(0, 3), { day: 'x', cleared: false, waived: true }])).toBe('active')
  expect(redGateStatus([{ day: 'x', cleared: false, waived: false }])).toBe('failed')
})

test('instant dungeon gates: key, once a day, recovery ≥ 30%', () => {
  expect(instantAllowed({ keys: 1, usedToday: false, targetMuscles: ['biceps'], recovery: { biceps: 80 } }).ok).toBe(true)
  expect(instantAllowed({ keys: 0, usedToday: false, targetMuscles: [], recovery: {} }).ok).toBe(false)
  expect(instantAllowed({ keys: 1, usedToday: true, targetMuscles: [], recovery: {} }).ok).toBe(false)
  expect(instantAllowed({ keys: 1, usedToday: false, targetMuscles: ['biceps'], recovery: { biceps: 20 } }).ok).toBe(false)
})

test('demon castle: lifetime score → floors, bosses at 1/25/50/75/100', () => {
  expect(floorThreshold(1)).toBe(10)
  expect(castleScore({ volumeKg: 5000, cardioKm: 3, workouts: 1 })).toBe(13)
  expect(castleFloor(9)).toMatchObject({ floor: 0, next: 10 })
  expect(castleFloor(10)).toMatchObject({ floor: 1, boss: 'Cerberus, Gatekeeper' })
  expect(castleFloor(1e9)).toMatchObject({ floor: 100, next: null })
  expect(bossFloorsCrossed(0, floorThreshold(50))).toEqual([1, 25, 50])
  expect(bossFloorsCrossed(floorThreshold(50), floorThreshold(51))).toEqual([])
})
