// Hunter Power Level 0–100 (docs/game-design.md §7, research/science.md §8).
import type { Sex } from './types'
import type { AwakeningTest } from './model'

export type Lift = 'squat' | 'bench' | 'deadlift' | 'ohp'
const LEVELS = [10, 25, 50, 75, 95] // beginner, novice, intermediate, advanced, elite

/** Strength Level bodyweight multiples at the reference bodyweight (82 kg men / 64 kg women). */
export const STANDARDS: Record<Sex, Record<Lift, number[]>> = {
  male: { squat: [0.94, 1.27, 1.66, 2.09, 2.57], bench: [0.71, 0.94, 1.22, 1.54, 1.88], deadlift: [1.12, 1.49, 1.93, 2.43, 2.97], ohp: [0.42, 0.58, 0.78, 1.01, 1.26] },
  female: { squat: [0.53, 0.81, 1.18, 1.61, 2.09], bench: [0.31, 0.51, 0.77, 1.09, 1.44], deadlift: [0.66, 0.99, 1.4, 1.89, 2.41], ohp: [0.21, 0.34, 0.5, 0.7, 0.92] },
}
const REF_BW: Record<Sex, number> = { male: 82, female: 64 }

/** Multiples are flat across bodyweight for men and fall ~7% per 18 kg for women (R5 §8.1). */
const bwFactor = (sex: Sex, bw: number) => (sex === 'female' ? (bw / REF_BW.female) ** -0.33 : 1)

/** 0–100 score for one lift from e1RM / bodyweight, interpolating between the standard levels. */
export function liftScore(sex: Sex, lift: Lift, e1rm: number, bodyweight: number): number {
  const t = STANDARDS[sex][lift].map((x) => x * bwFactor(sex, bodyweight))
  const r = e1rm / bodyweight
  if (r <= t[0] * 0.5) return 0
  if (r < t[0]) return (10 * (r - t[0] * 0.5)) / (t[0] * 0.5)
  for (let i = 0; i < t.length - 1; i++) if (r < t[i + 1]) return LEVELS[i] + ((LEVELS[i + 1] - LEVELS[i]) * (r - t[i])) / (t[i + 1] - t[i])
  return Math.min(100, 95 + (5 * (r - t[4])) / (t[4] * 0.25))
}

export const levelName = (score: number) => (score >= 95 ? 'Elite' : score >= 75 ? 'Advanced' : score >= 50 ? 'Intermediate' : score >= 25 ? 'Novice' : score >= 10 ? 'Beginner' : 'Untrained')

const piece = (x: number, pts: [number, number][]) => {
  if (x <= pts[0][0]) return (pts[0][1] * Math.max(0, x)) / Math.max(1, pts[0][0])
  for (let i = 0; i < pts.length - 1; i++) if (x < pts[i + 1][0]) return pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * (x - pts[i][0])) / (pts[i + 1][0] - pts[i][0])
  return pts[pts.length - 1][1]
}

/** Bodyweight test → 0–40 (push-up norms ACSM via Topend; squat/plank provisional, R5 §8.2). */
export function awakeningScore(sex: Sex, t: Pick<AwakeningTest, 'pushups' | 'squats60s' | 'plankSec'>) {
  const push = piece(t.pushups, sex === 'female' ? [[5, 10], [17, 25], [33, 40]] : [[10, 10], [25, 25], [43, 40]])
  const squat = piece(t.squats60s, [[20, 10], [35, 25], [50, 40]])
  const plank = piece(t.plankSec, [[30, 10], [60, 25], [150, 40]])
  return { push, squat, plank, mean: (push + squat + plank) / 3 }
}

export type PowerInput = {
  sex: Sex
  bodyweightKg: number
  e1rm: Partial<Record<Lift, number>>
  awakening?: Pick<AwakeningTest, 'pushups' | 'squats60s' | 'plankSec'>
  cardioMinutesPerWeek: number
  /** Completed / planned sessions over the last 8 weeks; undefined when there is no history yet. */
  adherence?: number
}

export function powerLevel(i: PowerInput) {
  const lifts = (Object.keys(i.e1rm) as Lift[]).filter((l) => (i.e1rm[l] ?? 0) > 0).map((l) => liftScore(i.sex, l, i.e1rm[l]!, i.bodyweightKg)).sort((a, b) => b - a)
  const aw = i.awakening ? awakeningScore(i.sex, i.awakening) : null
  const strength = lifts.length ? lifts.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, lifts.length) : (aw?.mean ?? 0)
  const test = aw ? (aw.squat + aw.plank) / 2 : 0
  const conditioning = Math.min(60, (i.cardioMinutesPerWeek / 150) * 60) + test
  const consistency = Math.max(0, Math.min(1, i.adherence ?? 0)) * 100
  const total = Math.round(Math.min(100, 0.6 * strength + 0.25 * conditioning + 0.15 * consistency))
  return { total, strength: Math.round(strength), conditioning: Math.round(conditioning), consistency: Math.round(consistency) }
}
