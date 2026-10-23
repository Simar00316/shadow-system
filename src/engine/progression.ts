// Progression engine: applies the class rule after each session; detects plateaus and deloads
// (docs/game-design.md §3, §12; research/science.md §3).
import type { Exercise, Experience } from './types'
import type { Progression } from './prescription'
import { e1rm, equipmentStep, loadIncrement, toKg } from './strength'

export type WorkSet = { weightKg: number; reps: number; rir: number | null }
/** One exposure of an exercise: its working sets in order. */
export type Exposure = { at: number; sets: WorkSet[] }

export type Target = { loadKg: number; repMin: number; repMax: number; rir: number; sets: number; restSec: number; holdSec?: number
  /** The class rep ceiling before any rep extension (set when the range is first extended). */
  baseRepMax?: number }
export type NextTarget = Target & {
  action: 'start' | 'add_load' | 'add_reps' | 'hold' | 'cut_rest' | 'reduce_load' | 'add_hold' | 'swap' | 'deload_lift'
  plateau: boolean
  note: string
}

export const bestE1rm = (e: Exposure) => Math.max(0, ...e.sets.map((s) => e1rm(s.weightKg, s.reps, s.rir) ?? 0))

/** Exposures since the conservative e1RM last improved by ≥ 1% (only counts sets with RIR ≤ 3). */
export function stallCount(history: Exposure[]): number {
  let best = 0, stall = 0
  for (const e of history) {
    const top = Math.max(0, ...e.sets.filter((s) => (s.rir ?? 0) <= 3).map((s) => e1rm(s.weightKg, s.reps, s.rir) ?? 0))
    if (!top) continue
    if (top >= best * 1.01) { best = top; stall = 0 } else stall++
  }
  return stall
}

const hitTop = (e: Exposure, t: Target) => e.sets.length >= t.sets && e.sets.every((s) => s.reps >= t.repMax && (s.rir == null || s.rir >= 1)) && e.sets.every((s) => s.weightKg >= t.loadKg - 1e-6)
const missed = (e: Exposure, t: Target) => e.sets.some((s) => s.reps < t.repMin)

/**
 * Next session's target for one exercise.
 * history: past exposures oldest → newest, the last one being the session just finished.
 */
export function nextTarget(ex: Pick<Exercise, 'primary' | 'pattern' | 'equipment'>, current: Target, history: Exposure[], opts: { model: Progression; experience: Experience; unit?: 'kg' | 'lb' }): NextTarget {
  const last = history[history.length - 1]
  const out: NextTarget = { ...current, action: 'hold', plateau: false, note: '' }
  if (!last) return { ...out, action: 'start', note: 'No history yet.' }

  if (opts.model === 'hold') {
    if (last.sets.every((s) => (s.reps ?? 0) >= current.repMax)) {
      if ((current.holdSec ?? 0) && current.holdSec! < 60) return { ...out, holdSec: Math.min(60, current.holdSec! + 5), action: 'add_hold', note: 'Hold +5 s.' }
      return { ...out, action: 'add_reps', repMax: current.repMax + 1, note: 'Add range or a slower tempo.' }
    }
    return { ...out, note: 'Repeat.' }
  }

  const inc = loadIncrement(ex, current.loadKg, opts.unit)
  const newLift = history.length <= 4 && opts.experience === 'beginner'
  const consecutive = opts.experience === 'beginner' ? 1 : 2
  const recent = history.slice(-consecutive)
  const ready = recent.length === consecutive && recent.every((e) => hitTop(e, current))
  const stall = stallCount(history)

  // Autoregulation across sessions: first set 2+ RIR off target twice in a row (R5 §3.2)
  const firstRir = history.slice(-2).map((e) => e.sets[0]?.rir).filter((r): r is number => r != null)
  const tooHard = firstRir.length === 2 && firstRir.every((r) => r <= current.rir - 2) && history.slice(-2).every((e) => missed(e, current))

  if (tooHard || (opts.model === 'linear' && history.slice(-3).length === 3 && history.slice(-3).every((e) => missed(e, current)))) {
    const cut = opts.model === 'linear' ? 0.9 : 0.95
    return { ...out, loadKg: Math.round(current.loadKg * cut * 4) / 4, action: 'reduce_load', note: 'Load reduced to rebuild with clean reps.' }
  }

  if (stall >= 3 && !hitTop(last, current)) {
    if (stall >= 4) return { ...out, loadKg: Math.round(current.loadKg * 0.9 * 4) / 4, action: 'deload_lift', plateau: true, note: 'Plateau: lift deload, −10% load, rebuild.' }
    return { ...out, action: 'swap', plateau: true, note: 'Plateau: swap to a variation for one block.' }
  }

  if (opts.model === 'density') {
    if (last.sets.every((s) => s.reps >= current.repMax)) {
      if (current.restSec > 30) return { ...out, restSec: Math.max(30, current.restSec - 10), action: 'cut_rest', note: 'Same reps, 10 s less rest.' }
      if (inc) return { ...out, loadKg: current.loadKg + inc, restSec: 60, repMax: current.repMax, action: 'add_load', note: `+${inc} kg, rest reset.` }
    }
    return { ...out, repMax: current.repMax, action: 'add_reps', note: 'Add a rep per set.' }
  }

  if (ready && !newLift) {
    const baseMax = current.baseRepMax ?? current.repMax
    if (inc) return { ...out, loadKg: current.loadKg + inc, repMax: baseMax, baseRepMax: undefined, action: 'add_load', note: `All sets at the top of the range. +${inc} kg.` }
    if (current.repMax < baseMax + 4) return { ...out, repMax: current.repMax + 2, baseRepMax: baseMax, action: 'add_reps', note: 'Smallest plate is over 10%: extend the rep range.' }
    // Rep range fully extended: the extra reps have earned one equipment step.
    const eq = ex.equipment.find((e) => e !== 'bench' && e !== 'pullup_bar') ?? 'bodyweight'
    const step = toKg(equipmentStep(eq, opts.unit), opts.unit ?? 'kg')
    if (step) return { ...out, loadKg: current.loadKg + step, repMax: baseMax, baseRepMax: undefined, action: 'add_load', note: `Rep range complete. +${step} kg, reps reset.` }
    return { ...out, action: 'hold', note: 'Bodyweight: progress with a harder variation.' }
  }
  return { ...out, action: opts.model === 'linear' ? 'hold' : 'add_reps', note: opts.model === 'linear' ? 'Repeat the load.' : 'Add reps toward the top of the range.' }
}

/** Next-set load change from reported vs target RIR: 4% per rep, clamped to ±10% (R5 §3.2). */
export function autoregulate(loadKg: number, reportedRir: number, targetRir: number) {
  const pct = Math.max(-0.1, Math.min(0.1, 0.04 * (reportedRir - targetRir)))
  return Math.round(loadKg * (1 + pct) * 4) / 4
}

export const DELOAD_EVERY: Record<Experience, number> = { beginner: 8, intermediate: 6, advanced: 5 }

export type DeloadInput = {
  experience: Experience
  weeksSinceDeload: number
  /** Per key lift: best e1RM of the last two sessions vs the rolling best. */
  liftDrops: number[]
  /** Readiness scores (1–5) of the last 7 days. */
  readiness7: number[]
  stalledLifts: number
  beatUp?: boolean
  injury?: boolean
}

/** Only exposures after `since` (e.g. the last deload) — feed these to stall and drop detection. */
export const exposuresSince = (h: Exposure[], since: number) => h.filter((e) => e.at > since)

/** Whole-body deload trigger (game-design §12). */
export function deloadDue(i: DeloadInput): { due: boolean; reason: string | null } {
  if (i.weeksSinceDeload >= Math.min(8, DELOAD_EVERY[i.experience])) return { due: true, reason: 'scheduled' }
  if (i.beatUp || i.injury) return { due: true, reason: 'player_request' }
  // Reactive triggers need 3 weeks of fresh data after the last deload, so a deload never loops.
  if (i.weeksSinceDeload < 3) return { due: false, reason: null }
  if (i.liftDrops.filter((d) => d >= 0.05).length >= 2) return { due: true, reason: 'performance_drop' }
  if (i.readiness7.filter((r) => r <= 2.5).length >= 3) return { due: true, reason: 'low_readiness' }
  if (i.stalledLifts >= 2) return { due: true, reason: 'stalls' }
  return { due: false, reason: null }
}

/** Deload week prescription for a planned exercise: sets −45% (≥ 1), compounds −10% load, RIR 4–5. */
export function deloadTarget(t: Target, compound: boolean): Target {
  return { ...t, sets: Math.max(1, Math.round(t.sets * 0.55)), loadKg: compound ? Math.round(t.loadKg * 0.9 * 4) / 4 : t.loadKg, rir: Math.max(4, t.rir) }
}
