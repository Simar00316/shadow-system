import { ACTIVITIES, cardioKcal, cardioMet, formatPace, paceSecPerKm, speedFromPace } from './cardio'

test('Compendium anchors', () => {
  expect(cardioMet('treadmill_run', { speedKmh: 6 * 1.609344 })).toBeCloseTo(9.8)
  expect(cardioMet('treadmill_walk', { speedKmh: 3.2 * 1.609344 })).toBeCloseTo(3.8)
  expect(cardioMet('bike', { watts: 50 })).toBeCloseTo(4)
  expect(cardioMet('bike', { watts: 300 })).toBeCloseTo(12.5)
  expect(cardioMet('rower', { watts: 210 })).toBeCloseTo(14)
  expect(cardioMet('outdoor_walk', { speedKmh: 1 })).toBeCloseTo(3)
  expect(cardioMet('treadmill_walk', { speedKmh: 5, inclinePct: 10 })).toBeGreaterThan(cardioMet('treadmill_walk', { speedKmh: 5 }))
  expect(cardioMet('treadmill_run', { inclinePct: 5 })).toBeGreaterThan(cardioMet('treadmill_run'))
})

test('machine level maps to watts; categorical activities', () => {
  expect(cardioMet('bike', { level: 6 })).toBeCloseTo(cardioMet('bike', { watts: 97 }))
  expect([cardioMet('elliptical', { level: 5 }), cardioMet('elliptical', { level: 14 })]).toEqual([5, 9])
  expect(cardioMet('swim', { hiit: true })).toBe(9.8)
  expect([cardioMet('hiit'), cardioMet('hiit', { hiit: false })]).toEqual([11, 7])
  for (const a of ACTIVITIES) expect(cardioMet(a)).toBeGreaterThan(2.9)
})

test('net kcal and pace helpers', () => {
  expect(cardioKcal(9.8, 80, 30)).toBe(352)
  expect(cardioKcal(0.5, 80, 30)).toBe(0)
  expect(paceSecPerKm(30, 5)).toBe(360)
  expect(paceSecPerKm(30, 0)).toBeUndefined()
  expect(speedFromPace(360)).toBe(10)
  expect(speedFromPace(0)).toBeUndefined()
  expect(formatPace(365)).toBe('6:05')
  expect(formatPace()).toBe('–')
})
