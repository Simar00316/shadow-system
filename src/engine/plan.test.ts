import { bigFour, chooseSplit, estimateDuration, generatePlan, planVolume, validatePlan, type PlanInput } from './plan'
import { capFor } from './safety'
import { EX_BY_ID, EXERCISES, FULL_GYM } from './testdata'
import type { Muscle } from './types'

let n = 0
const id = (p: string) => `${p}${n++}`
const base: PlanInput = { experience: 'intermediate', cls: 'tank', sex: 'male', age: 30, goal: 'hypertrophy', equipment: FULL_GYM, injured: [], trainingDays: [1, 2, 4, 5], sessionMinutes: 60 }

test('split choice by days, experience and class', () => {
  expect(chooseSplit(3, 'beginner', 'fighter').name).toBe('full_body')
  expect(chooseSplit(2, 'advanced', 'tank').days.map((d) => d.name)).toEqual(['Full Body A', 'Full Body B'])
  expect(chooseSplit(4, 'intermediate', 'tank').name).toBe('upper_lower')
  expect(chooseSplit(5, 'advanced', 'tank').name).toBe('ulppl')
  expect(chooseSplit(6, 'advanced', 'berserker').days.map((d) => d.name)).toEqual(['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'])
  expect(chooseSplit(9, 'advanced', 'tank').days).toHaveLength(6)
  expect(chooseSplit(3, 'intermediate', 'healer').name).toBe('mobility')
  expect(chooseSplit(3, 'intermediate', 'assassin').name).toBe('circuit')
  expect(chooseSplit(3, 'intermediate', 'ranger').name).toBe('athletic')
  expect(chooseSplit(3, 'beginner', 'ranger').name).toBe('full_body')
})

test('generates a 4-day upper/lower plan on the chosen weekdays within the time budget', () => {
  const p = generatePlan(base, EXERCISES, id)
  expect(p.days.map((d) => d.weekday)).toEqual([1, 2, 4, 5])
  expect(p.plan.split).toBe('upper_lower')
  for (const d of p.days) {
    const mine = p.exercises.filter((e) => e.planDayId === d.id)
    expect(mine.length).toBeGreaterThanOrEqual(3)
    expect(new Set(mine.map((e) => e.exerciseId)).size).toBe(mine.length)
    expect(estimateDuration(mine)).toBeLessThanOrEqual(75)
  }
})

test('weekly volume stays under every safe cap and main muscles are trained', () => {
  for (const experience of ['beginner', 'intermediate', 'advanced'] as const) {
    for (const days of [[1, 3, 5], [1, 2, 4, 5], [1, 2, 3, 4, 5, 6]]) {
      const p = generatePlan({ ...base, experience, trainingDays: days, sessionMinutes: 90 }, EXERCISES, id)
      const vol = planVolume(p.exercises, EX_BY_ID)
      for (const m of Object.keys(vol) as Muscle[]) expect(vol[m]!).toBeLessThanOrEqual(capFor(m, experience))
      for (const m of ['chest', 'quads', 'lats'] as Muscle[]) expect(vol[m] ?? 0).toBeGreaterThan(0)
    }
  }
})

test('respects equipment, injuries and never-prefs', () => {
  const p = generatePlan({ ...base, equipment: ['bodyweight', 'dumbbell', 'bench'], injured: ['lower_back'] }, EXERCISES, id)
  for (const pe of p.exercises) {
    const ex = EX_BY_ID.get(pe.exerciseId)!
    expect(ex.equipment.every((e) => ['bodyweight', 'dumbbell', 'bench'].includes(e))).toBe(true)
    expect([...ex.primary, ...ex.secondary]).not.toContain('lower_back')
  }
  const first = generatePlan(base, EXERCISES, id).exercises[0].exerciseId
  const again = generatePlan({ ...base, prefs: new Map([[first, 'never']]) }, EXERCISES, id)
  expect(again.exercises.some((e) => e.exerciseId === first)).toBe(false)
})

test('class rules flow into targets: Fighter heavy, Healer holds, Assassin circuits, Ranger day types', () => {
  const f = generatePlan({ ...base, cls: 'fighter' }, EXERCISES, id)
  expect(Math.min(...f.exercises.map((e) => e.repMin))).toBeLessThanOrEqual(6)
  const h = generatePlan({ ...base, cls: 'healer', trainingDays: [1, 3] }, EXERCISES, id)
  expect(h.exercises.some((e) => e.holdSec === 30)).toBe(true)
  const a = generatePlan({ ...base, cls: 'assassin', trainingDays: [1, 3, 5] }, EXERCISES, id)
  expect(a.exercises.every((e) => e.group)).toBe(true)
  const r = generatePlan({ ...base, cls: 'ranger', trainingDays: [1, 3, 5] }, EXERCISES, id)
  expect(r.days.map((d) => d.dayType)).toEqual(['heavy', 'light', 'medium'])
})

test('starting loads come from Awakening e1RM for the big four', () => {
  const p = generatePlan({ ...base, cls: 'fighter', trainingDays: [1, 3, 5], experience: 'beginner', lifts: { squat: 100, bench: 80, deadlift: 120, ohp: 50 } }, EXERCISES, id)
  const loaded = p.exercises.filter((e) => e.loadKg != null)
  expect(loaded.length).toBeGreaterThan(0)
  for (const pe of loaded) expect(pe.loadKg!).toBeLessThan(120)
  expect(bigFour(EXERCISES.find((e) => e.name === 'Barbell Bench Press')!)).toBe('bench')
  expect(bigFour(EXERCISES.find((e) => e.name === 'Barbell Deadlift')!)).toBe('deadlift')
  expect(bigFour(EXERCISES.find((e) => e.name === 'Barbell Full Squat')!)).toBe('squat')
  expect(bigFour(EXERCISES.find((e) => e.name === 'Dumbbell Bench Press')!)).toBeNull()
})

test('deload generation lowers sets', () => {
  const normal = generatePlan(base, EXERCISES, id)
  const deload = generatePlan({ ...base, deload: true }, EXERCISES, id)
  const sum = (p: typeof normal) => p.exercises.reduce((a, e) => a + e.sets, 0)
  expect(sum(deload)).toBeLessThan(sum(normal))
})

test('validatePlan flags over-cap volume, long sessions, injuries and back-to-back days', () => {
  const p = generatePlan(base, EXERCISES, id)
  expect(validatePlan(p.days, p.exercises, EX_BY_ID, { experience: 'intermediate', age: 30, sessionMinutes: 60, injured: [] }).filter((w) => w.kind === 'over_cap')).toEqual([])
  const chestEx = p.exercises.find((e) => EX_BY_ID.get(e.exerciseId)!.primary.includes('chest'))!
  const bloated = p.exercises.map((e) => (e === chestEx ? { ...e, sets: 30 } : e))
  const w = validatePlan(p.days, bloated, EX_BY_ID, { experience: 'intermediate', age: 30, sessionMinutes: 60, injured: ['chest'] })
  expect(w.some((x) => x.kind === 'over_cap' && x.muscle === 'chest')).toBe(true)
  expect(w.some((x) => x.kind === 'too_long')).toBe(true)
  expect(w.some((x) => x.kind === 'injury')).toBe(true)
  const sameDays = p.days.map((d, i) => ({ ...d, weekday: [1, 2, 4, 5][i] }))
  const lowerTwice = p.exercises.map((e) => (e.planDayId === p.days[1].id ? { ...e, planDayId: p.days[1].id } : e.planDayId === p.days[0].id ? { ...e, planDayId: p.days[1].id } : e))
  const w2 = validatePlan(sameDays, [...lowerTwice, ...p.exercises.filter((e) => e.planDayId === p.days[1].id).map((e) => ({ ...e, id: e.id + 'x', planDayId: p.days[0].id }))], EX_BY_ID, { experience: 'intermediate', age: 30, sessionMinutes: 300, injured: [] })
  expect(w2.some((x) => x.kind === 'back_to_back')).toBe(true)
  const thin = validatePlan(p.days, p.exercises.map((e) => ({ ...e, sets: 1 })), EX_BY_ID, { experience: 'advanced', age: 30, sessionMinutes: 60, injured: [] })
  expect(thin.some((x) => x.kind === 'under_target')).toBe(true)
})
