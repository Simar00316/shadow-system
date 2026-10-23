import { addDays, ageFrom, dayOf, daysBetween, endOf, startOf, weekStart, weekday } from './dates'

test('dayOf uses local calendar', () => {
  expect(dayOf(new Date(2026, 9, 23, 23, 59))).toBe('2026-10-23')
  expect(dayOf(new Date(2026, 9, 24, 0, 0))).toBe('2026-10-24')
})

test('addDays crosses months and years', () => {
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
})

test('daysBetween is DST safe and signed', () => {
  expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  expect(daysBetween('2026-10-30', '2026-10-24')).toBe(-6)
})

test('start/end of day are local midnights 1 day apart (24h ± DST)', () => {
  const d = '2026-10-23'
  expect(new Date(startOf(d)).getHours()).toBe(0)
  expect(dayOf(endOf(d))).toBe('2026-10-24')
  expect(dayOf(endOf(d) - 1)).toBe(d)
})

test('week helpers', () => {
  expect(weekday('2026-10-23')).toBe(5) // Friday
  expect(weekStart('2026-10-23')).toBe('2026-10-19')
  expect(weekStart('2026-10-19')).toBe('2026-10-19')
  expect(weekStart('2026-10-25')).toBe('2026-10-19') // Sunday belongs to the week starting Monday
  expect(ageFrom(1998, '2026-10-23')).toBe(28)
})
