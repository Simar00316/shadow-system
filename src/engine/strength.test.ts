import { brzycki, e1rm, epley, equipmentStep, fromKg, isLowerBody, loadIncrement, plates, roundDisplay, roundToEquipment, toKg, warmups, weightFor } from './strength'
import type { Exercise } from './types'

const ex = (o: Partial<Exercise>) => ({ primary: ['chest'], pattern: 'horizontal_push', equipment: ['barbell'], mechanics: 'compound', ...o }) as Exercise

describe('e1RM', () => {
  it('Epley and Brzycki agree at 10 reps; conservative = Brzycki below', () => {
    expect(epley(100, 10)).toBeCloseTo(133.33, 1)
    expect(brzycki(100, 10)).toBeCloseTo(133.33, 1)
    expect(e1rm(100, 5)).toBeCloseTo(112.5, 1)
    expect(e1rm(100, 5)).toBeLessThan(epley(100, 5))
  })
  it('a single is the 1RM', () => {
    expect(e1rm(140, 1)).toBe(140)
    expect(epley(140, 1)).toBe(140)
    expect(brzycki(140, 1)).toBe(140)
  })
  it('uses reps + RIR as effective reps', () => {
    expect(e1rm(100, 5, 2)).toBeCloseTo(brzycki(100, 7), 5)
  })
  it('rejects invalid sets', () => {
    expect(e1rm(100, 11)).toBeNull()
    expect(e1rm(100, 8, 3)).toBeNull()
    expect(e1rm(100, 5, 4)).toBeNull()
    expect(e1rm(0, 5)).toBeNull()
    expect(e1rm(100, 0)).toBeNull()
  })
  it('weightFor inverts Brzycki', () => {
    expect(weightFor(112.5, 5)).toBeCloseTo(100, 5)
    expect(weightFor(100, 8, 2)).toBeCloseTo((100 * 27) / 36, 5)
  })
})

describe('units', () => {
  it('converts kg and lb', () => {
    expect(toKg(225, 'lb')).toBeCloseTo(102.06, 2)
    expect(fromKg(100, 'lb')).toBeCloseTo(220.46, 2)
    expect(toKg(80, 'kg')).toBe(80)
    expect(fromKg(80, 'kg')).toBe(80)
    expect(roundDisplay(81.13, 'kg')).toBe(81.25)
    expect(roundDisplay(220.46, 'lb')).toBe(220.5)
  })
})

describe('increments', () => {
  it('2.5 kg upper / 5 kg lower on a heavy barbell', () => {
    expect(loadIncrement(ex({}), 80)).toBe(2.5)
    expect(loadIncrement(ex({ primary: ['quads'], pattern: 'squat' }), 120)).toBe(5)
  })
  it('scales up to 2% of very heavy loads', () => {
    expect(loadIncrement(ex({ primary: ['quads'], pattern: 'squat' }), 300)).toBe(5)
    expect(loadIncrement(ex({}), 200)).toBe(5)
  })
  it('never exceeds 10% of the load: returns 0 so reps progress instead', () => {
    expect(loadIncrement(ex({ equipment: ['dumbbell'], pattern: 'curl', primary: ['biceps'], mechanics: 'isolation' }), 12)).toBe(0)
    expect(loadIncrement(ex({ equipment: ['dumbbell'] }), 24)).toBe(2)
  })
  it('bodyweight and bands have no load step', () => {
    expect(loadIncrement(ex({ equipment: ['bodyweight'] }), 80)).toBe(0)
    expect(loadIncrement(ex({}), 0)).toBe(0)
  })
  it('lb steps', () => {
    expect(equipmentStep('barbell', 'lb')).toBe(5)
    expect(equipmentStep('machine')).toBe(5)
    expect(equipmentStep('foam_roller')).toBe(2.5)
    expect(loadIncrement(ex({}), 100, 'lb')).toBeCloseTo(toKg(5, 'lb'), 5)
  })
  it('lower-body detection', () => {
    expect(isLowerBody(ex({ pattern: 'hinge', primary: ['hamstrings'] }))).toBe(true)
    expect(isLowerBody(ex({ pattern: 'raise', primary: ['calves'] }))).toBe(true)
    expect(isLowerBody(ex({}))).toBe(false)
  })
  it('rounds to equipment', () => {
    expect(roundToEquipment(81.3, 'barbell')).toBe(82.5)
    expect(roundToEquipment(13.1, 'dumbbell')).toBe(14)
    expect(roundToEquipment(13.1, 'bodyweight')).toBe(13.1)
  })
})

describe('plates and warm-ups', () => {
  it('loads a 100 kg bar', () => {
    expect(plates(100)).toEqual({ perSide: [25, 15], achieved: 100, remainder: 0 })
    expect(plates(142.5).perSide).toEqual([25, 25, 10, 1.25])
  })
  it('reports what cannot be made and bar-only', () => {
    expect(plates(101).remainder).toBe(1)
    expect(plates(15)).toEqual({ perSide: [], achieved: 20, remainder: -5 })
    expect(plates(225, 'lb').perSide).toEqual([45, 45])
  })
  it('warm-up ramp for compounds only, ascending, below working weight', () => {
    const w = warmups(100, ex({}))
    expect(w.map((s) => s.weightKg)).toEqual([40, 60, 80])
    expect(warmups(40, ex({}))).toEqual([{ weightKg: 20, reps: 8 }, { weightKg: 30, reps: 4 }])
    expect(warmups(20, ex({}))).toEqual([])
    expect(warmups(100, ex({ mechanics: 'isolation' }))).toEqual([])
    expect(warmups(100, ex({ equipment: ['bodyweight'] }))).toEqual([])
    expect(warmups(0, ex({}))).toEqual([])
  })
})
