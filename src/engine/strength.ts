// Strength math: e1RM, load increments, plates, warm-ups, unit conversion (research/science.md §3.3, §4).
import type { Equipment, Exercise, Muscle } from './types'

export const KG_PER_LB = 0.45359237
export const toKg = (v: number, unit: 'kg' | 'lb') => (unit === 'kg' ? v : v * KG_PER_LB)
export const fromKg = (kg: number, unit: 'kg' | 'lb') => (unit === 'kg' ? kg : kg / KG_PER_LB)
/** Round a displayed weight to a sensible precision (0.25 kg / 0.5 lb). */
export const roundDisplay = (v: number, unit: 'kg' | 'lb') => (unit === 'kg' ? Math.round(v * 4) / 4 : Math.round(v * 2) / 2)

export const epley = (w: number, r: number) => (r <= 1 ? w : w * (1 + r / 30))
export const brzycki = (w: number, r: number) => (r <= 1 ? w : (w * 36) / (37 - r))

/**
 * Conservative e1RM: min(Epley, Brzycki) on effective reps (reps + RIR) in 1..10.
 * Returns null when the set is not valid for estimation (R5 §4 engine rules).
 */
export function e1rm(weightKg: number, reps: number, rir: number | null = 0): number | null {
  if (weightKg <= 0 || reps < 1) return null
  if (rir != null && rir >= 4) return null
  const eff = reps + (rir ?? 0)
  if (eff > 10) return null
  return Math.min(epley(weightKg, eff), brzycki(weightKg, eff))
}

/** Weight for a target rep count at a target RIR from a known 1RM (inverse Brzycki). */
export const weightFor = (oneRm: number, reps: number, rir = 0) => {
  const eff = Math.min(36, reps + rir)
  return (oneRm * (37 - eff)) / 36
}

const LOWER: Muscle[] = ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves']
export const isLowerBody = (ex: Pick<Exercise, 'primary' | 'pattern'>) => ex.pattern === 'squat' || ex.pattern === 'hinge' || ex.pattern === 'lunge' || ex.primary.some((m) => LOWER.includes(m))

/** Smallest loadable step for the equipment (kg; lb in brackets). Dumbbell/kettlebell steps are per implement. */
export function equipmentStep(eq: Equipment, unit: 'kg' | 'lb' = 'kg'): number {
  const kg: Partial<Record<Equipment, number>> = { barbell: 2.5, ez_bar: 2.5, smith_machine: 2.5, dumbbell: 2, kettlebell: 4, machine: 5, cable: 2.5, medicine_ball: 1, bands: 0, bodyweight: 0 }
  const lb: Partial<Record<Equipment, number>> = { barbell: 5, ez_bar: 5, smith_machine: 5, dumbbell: 5, kettlebell: 9, machine: 10, cable: 5, medicine_ball: 2, bands: 0, bodyweight: 0 }
  return (unit === 'kg' ? kg : lb)[eq] ?? (unit === 'kg' ? 2.5 : 5)
}

/**
 * Next load increment in kg: base 2.5 upper / 5 lower, clamped to 2–10% of the working load (ACSM 2–10%),
 * rounded to the equipment step. Returns 0 when even one step exceeds 10% — progress with reps instead.
 */
export function loadIncrement(ex: Pick<Exercise, 'primary' | 'pattern' | 'equipment'>, loadKg: number, unit: 'kg' | 'lb' = 'kg'): number {
  const eq = ex.equipment.find((e) => e !== 'bench' && e !== 'pullup_bar') ?? 'bodyweight'
  const stepKg = toKg(equipmentStep(eq, unit), unit)
  if (stepKg === 0 || loadKg <= 0) return 0
  const base = isLowerBody(ex) ? 5 : 2.5
  const target = Math.min(Math.max(base, loadKg * 0.02), loadKg * 0.1)
  const rounded = Math.max(stepKg, Math.round(target / stepKg) * stepKg)
  return rounded > loadKg * 0.1 + 1e-9 ? 0 : rounded
}

/** Round a load to what the equipment can actually make. */
export function roundToEquipment(kg: number, eq: Equipment, unit: 'kg' | 'lb' = 'kg') {
  const step = toKg(equipmentStep(eq, unit), unit)
  return step ? Math.max(0, Math.round(kg / step) * step) : kg
}

export const DEFAULT_PLATES = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] }

/** Plates per side for a barbell target. Greedy works for standard plate sets. */
export function plates(total: number, unit: 'kg' | 'lb' = 'kg', bar = unit === 'kg' ? 20 : 45, available = DEFAULT_PLATES[unit]) {
  let side = (total - bar) / 2
  const out: number[] = []
  if (side < 0) return { perSide: out, achieved: bar, remainder: total - bar }
  for (const p of available) while (side >= p - 1e-9) { out.push(p); side -= p }
  const achieved = bar + 2 * out.reduce((a, b) => a + b, 0)
  return { perSide: out, achieved, remainder: Math.round((total - achieved) * 100) / 100 }
}

/** Warm-up ramp for a compound working weight (common coaching practice: 40/60/80% with falling reps). */
export function warmups(workingKg: number, ex: Pick<Exercise, 'equipment' | 'mechanics'>): { weightKg: number; reps: number }[] {
  if (ex.mechanics !== 'compound' || workingKg <= 0) return []
  const eq = ex.equipment.find((e) => e !== 'bench') ?? 'bodyweight'
  if (eq === 'bodyweight' || eq === 'bands') return []
  const floor = eq === 'barbell' ? 20 : 0
  const ramp: [number, number][] = workingKg >= 60 ? [[0.4, 8], [0.6, 5], [0.8, 3]] : [[0.5, 8], [0.75, 4]]
  const sets = ramp.map(([pct, reps]) => ({ weightKg: Math.max(floor, roundToEquipment(workingKg * pct, eq)), reps }))
  return sets.filter((s, i) => s.weightKg < workingKg && (i === 0 || s.weightKg > sets[i - 1].weightKg))
}
