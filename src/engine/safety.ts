// Safety rules shared by the plan generator and the XP engine (docs/game-design.md §11, research/science.md §2).
import { MUSCLES, type Exercise, type Experience, type Muscle } from './types'
import type { SetLog } from './model'

const C = (b: number, i: number, a: number) => ({ beginner: b, intermediate: i, advanced: a })
/** Safe weekly cap in hard sets per muscle (rolling 7 days). Absolute ceiling 25. */
export const WEEKLY_CAP: Record<Muscle, Record<Experience, number>> = {
  chest: C(12, 20, 24), lats: C(12, 22, 25), upper_back: C(12, 22, 25), lower_back: C(12, 22, 25),
  quads: C(10, 18, 20), hamstrings: C(8, 14, 18), glutes: C(10, 20, 24), side_delts: C(10, 20, 24),
  rear_delts: C(8, 16, 20), front_delts: C(4, 8, 12), biceps: C(8, 20, 25), triceps: C(8, 18, 20),
  calves: C(8, 20, 24), traps: C(6, 16, 20), abs: C(8, 16, 20), obliques: C(8, 16, 20), forearms: C(6, 12, 16),
  neck: C(6, 12, 16), adductors: C(6, 12, 16), abductors: C(6, 12, 16), hip_flexors: C(6, 12, 16),
}

/** Target weekly sets band the generator aims for (MAV band, never the cap). */
export const WEEKLY_TARGET: Record<Experience, [number, number]> = { beginner: [6, 12], intermediate: [10, 18], advanced: [12, 22] }
/** Muscles that get direct volume targets; small muscles are covered indirectly. */
export const MAIN_MUSCLES: Muscle[] = ['chest', 'lats', 'upper_back', 'quads', 'hamstrings', 'glutes', 'side_delts', 'biceps', 'triceps']

/** Hard-set credit by effort (R5 §2.2): RIR 0–3 = 1, RIR 4 = 0.5, 5+ = 0. Unknown RIR counts as hard. */
export const hardSetCredit = (rir: number | null) => (rir == null || rir <= 3 ? 1 : rir === 4 ? 0.5 : 0)

export const capFor = (m: Muscle, exp: Experience, age = 30) => Math.min(25, Math.floor(WEEKLY_CAP[m][exp] * (age >= 50 ? 0.8 : 1)))

/** Hard sets per muscle from logged sets (primary 1, synergist 0.5). */
export function weeklyHardSets(sets: Pick<SetLog, 'exerciseId' | 'rir' | 'type'>[], exercises: Map<string, Pick<Exercise, 'primary' | 'secondary'>>): Record<Muscle, number> {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>
  for (const s of sets) {
    if (s.type === 'warmup') continue
    const ex = exercises.get(s.exerciseId)
    if (!ex) continue
    const c = hardSetCredit(s.rir)
    for (const m of ex.primary) out[m] += c
    for (const m of ex.secondary) out[m] += c * 0.5
  }
  return out
}

// Nutrition floors (game-design §11.5, R5 §6.3)
export const calorieFloor = (sex: 'male' | 'female', bmr: number) => Math.max(sex === 'female' ? 1200 : 1500, Math.round(bmr))
export const maxDeficit = (tdee: number) => Math.min(0.25 * tdee, 750)
