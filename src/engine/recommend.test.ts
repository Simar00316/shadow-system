import { allowed, available, recommend, smartSwap } from './recommend'
import { EXERCISES, FULL_GYM } from './testdata'

const find = (name: string) => EXERCISES.find((e) => e.name === name)!

test('ranks chest exercises for a chest target, compound/core first', () => {
  const r = recommend(EXERCISES, ['chest'], { equipment: FULL_GYM, baseClass: 'fighter' }, 10)
  expect(r).toHaveLength(10)
  expect(r.every((s) => s.ex.primary.includes('chest') || s.ex.secondary.includes('chest'))).toBe(true)
  expect(r[0].ex.primary).toContain('chest')
  expect(r[0].score).toBeGreaterThanOrEqual(r[9].score)
})

test('respects equipment, injuries, never-prefs and beginner difficulty', () => {
  const r = recommend(EXERCISES, ['chest'], { equipment: ['bodyweight'], injured: ['triceps'], experience: 'beginner' }, 50)
  expect(r.every((s) => available(s.ex, ['bodyweight']))).toBe(true)
  expect(r.some((s) => s.ex.secondary.includes('triceps') || s.ex.primary.includes('triceps'))).toBe(false)
  expect(r.some((s) => s.ex.difficulty === 'advanced')).toBe(false)
  const top = recommend(EXERCISES, ['chest'], { equipment: FULL_GYM }, 1)[0].ex
  const prefs = new Map([[top.id, 'never' as const]])
  expect(recommend(EXERCISES, ['chest'], { equipment: FULL_GYM, prefs }, 50).some((s) => s.ex.id === top.id)).toBe(false)
})

test('never recommends a muscle under 30% recovery; partial recovery and prefs shift the score', () => {
  expect(recommend(EXERCISES, ['quads'], { equipment: FULL_GYM, recovery: { quads: 20 } }).some((s) => s.ex.primary.includes('quads'))).toBe(false)
  const ex = recommend(EXERCISES, ['biceps'], { equipment: FULL_GYM }, 1)[0]
  const partial = recommend([ex.ex], ['biceps'], { equipment: FULL_GYM, recovery: { biceps: 50 } })[0]
  expect(partial.score).toBeLessThan(ex.score)
  expect(partial.reasons).toContain('partially recovered')
  const more = recommend([ex.ex], ['biceps'], { equipment: FULL_GYM, prefs: new Map([[ex.ex.id, 'more']]) })[0]
  const less = recommend([ex.ex], ['biceps'], { equipment: FULL_GYM, prefs: new Map([[ex.ex.id, 'less']]) })[0]
  const recent = recommend([ex.ex], ['biceps'], { equipment: FULL_GYM, recent: new Set([ex.ex.id]) })[0]
  expect(more.score).toBeGreaterThan(ex.score)
  expect(less.score).toBeLessThan(ex.score)
  expect(recent.reasons).toContain('done recently')
})

test('smart swap finds equivalents in the same swap group with free equipment', () => {
  const bench = find('Barbell Bench Press')
  const swaps = smartSwap(bench, EXERCISES, { equipment: FULL_GYM, busy: ['barbell'] })
  expect(swaps.length).toBeGreaterThan(0)
  expect(swaps.every((s) => !s.equipment.includes('barbell') && s.id !== bench.id)).toBe(true)
  expect(swaps[0].swapGroup).toBe(bench.swapGroup)
  const home = smartSwap(bench, EXERCISES, { equipment: ['bodyweight'] })
  expect(home.every((s) => allowed(s, { equipment: ['bodyweight'] }))).toBe(true)
  expect(smartSwap(bench, EXERCISES, { equipment: FULL_GYM, injured: ['chest'] })).toEqual([])
})
