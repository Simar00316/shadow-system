// Cardio energy and MET lookup (research/science.md §9, Compendium of Physical Activities 2024).
export const ACTIVITIES = ['treadmill_walk', 'treadmill_run', 'outdoor_walk', 'outdoor_run', 'bike', 'rower', 'elliptical', 'stair_climber', 'jump_rope', 'swim', 'hiit', 'skierg', 'hike', 'sport'] as const
export type Activity = (typeof ACTIVITIES)[number]
export const ACTIVITY_LABEL: Record<Activity, string> = {
  treadmill_walk: 'Treadmill walk', treadmill_run: 'Treadmill run', outdoor_walk: 'Walk', outdoor_run: 'Run', bike: 'Bike', rower: 'Rowing machine', elliptical: 'Elliptical',
  stair_climber: 'Stair climber', jump_rope: 'Jump rope', swim: 'Swimming', hiit: 'HIIT / circuits', skierg: 'SkiErg', hike: 'Hike', sport: 'Sport / games',
}

const interp = (x: number, pts: [number, number][]) => {
  if (x <= pts[0][0]) return pts[0][1]
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * (x - pts[i][0])) / (pts[i + 1][0] - pts[i][0])
  return pts[pts.length - 1][1]
}
const MPH = 1.609344

export type CardioIntensity = { speedKmh?: number; watts?: number; level?: number; hiit?: boolean; inclinePct?: number }

/** MET for an activity at an intensity. Machine "level" (1–20) is mapped to watts as 25 + 12 × level (common console scale). */
export function cardioMet(a: Activity, i: CardioIntensity = {}): number {
  const watts = i.watts ?? (i.level ? 25 + 12 * i.level : undefined)
  switch (a) {
    case 'treadmill_walk': case 'outdoor_walk': {
      const base = interp((i.speedKmh ?? 5) / MPH, [[2, 3.0], [3.2, 3.8], [3.7, 4.8], [4.2, 5.8], [5.25, 8.3]])
      return base + (i.inclinePct ? 0.15 * i.inclinePct : 0)
    }
    case 'treadmill_run': case 'outdoor_run':
      return interp((i.speedKmh ?? 9.7) / MPH, [[5, 8.5], [6, 9.8], [7, 11.0], [8, 12.0], [10, 14.8]]) + (i.inclinePct ? 0.2 * i.inclinePct : 0)
    case 'bike': return interp(watts ?? 100, [[50, 4.0], [95, 6.0], [138, 8.0], [175, 10.3], [240, 12.5]])
    case 'rower': return interp(watts ?? 120, [[90, 5.0], [125, 7.5], [175, 11.0], [210, 14.0]])
    case 'elliptical': return (i.level ?? 8) >= 12 ? 9.0 : 5.0
    case 'stair_climber': return 9.3
    case 'jump_rope': return 11.0
    case 'swim': return i.hiit ? 9.8 : 5.8
    case 'hiit': return i.hiit === false ? 7.0 : 11.0
    case 'skierg': return interp(watts ?? 120, [[90, 6.0], [150, 9.0], [200, 12.0]])
    case 'hike': return 6.0
    case 'sport': return 7.0
  }
}

/** Net calories burned: (MET − 1) × kg × hours (R5 §9). */
export const cardioKcal = (met: number, kg: number, minutes: number) => Math.round(Math.max(0, met - 1) * kg * (minutes / 60))

export const paceSecPerKm = (minutes: number, km: number) => (km > 0 ? Math.round((minutes * 60) / km) : undefined)
export const speedFromPace = (secPerKm: number) => (secPerKm > 0 ? 3600 / secPerKm : undefined)
export const formatPace = (sec?: number) => (sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '–')
