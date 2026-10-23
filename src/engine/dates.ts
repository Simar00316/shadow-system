// Local-calendar day helpers. Days are 'YYYY-MM-DD' in the device's local time at the moment of the event,
// so a timezone change never rewrites history (game-design.md §8).
import type { Day } from './model'

const pad = (n: number) => String(n).padStart(2, '0')

export function dayOf(ts: number | Date = Date.now()): Day {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Local midnight at the start of a day. */
export function startOf(day: Day): number {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

/** Local midnight at the end of a day (start of the next one). */
export const endOf = (day: Day) => startOf(addDays(day, 1))

export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number)
  return dayOf(new Date(y, m - 1, d + n))
}

/** Whole days from a to b (b − a), DST-safe. */
export function daysBetween(a: Day, b: Day): number {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

export const weekday = (day: Day) => new Date(startOf(day)).getDay()

/** Monday of the ISO week containing `day`. */
export function weekStart(day: Day): Day {
  const wd = weekday(day)
  return addDays(day, -((wd + 6) % 7))
}

export const ageFrom = (birthYear: number, day: Day = dayOf()) => Number(day.slice(0, 4)) - birthYear
