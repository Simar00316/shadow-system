// XP, levels, stats and gold from the append-only ledger (docs/game-design.md §4, §5).
import { STATS, type Stat } from './types'
import type { XpEvent, XpEventType } from './model'

/** XP needed to go from level L to L+1 (tuned curve, game-design §4.1). */
export const xpToNext = (level: number) => Math.round(285 * level ** 0.84)

/** Cumulative XP needed to reach `level`. */
export function xpForLevel(level: number) {
  let t = 0
  for (let l = 1; l < level; l++) t += xpToNext(l)
  return t
}

export function levelFromTotal(total: number) {
  let level = 1, rest = Math.max(0, total)
  while (rest >= xpToNext(level)) { rest -= xpToNext(level); level++ }
  return { level, xp: rest, toNext: xpToNext(level) }
}

/** Base XP per event (game-design §4.2). Callers apply safety gates before awarding. */
export const BASE_XP = {
  workout: 150, dailyTraining: 100, dailyRest: 60, pr: 75, readiness: 15, meal: 15, calorieTarget: 40, proteinTarget: 40, waterTarget: 25,
  formRep: 1, floor: 200, streak7: 100, emergencyMin: 150, emergencyMax: 300, hiddenMin: 200, hiddenMax: 500, boss: 1500, trial: 2000,
  jobChange: 2000, awakeningTest: 500, firstWorkout: 500, firstPr: 250, firstFullDay: 250, instant: 150,
} as const

export const MAX_PR_PER_SESSION = 3
export const MAX_MEALS_PER_DAY = 3
export const MAX_FORM_REPS = 40

/** XP for one working set: 8 × effort. 0 for warm-ups, past the weekly cap, or on a muscle below 30% recovery. */
export function setXp(set: { rir: number | null; type: string }, gate: { overCap: boolean; recoveryAtStart: number; overSessionCap?: boolean }) {
  if (set.type === 'warmup' || gate.overCap || gate.overSessionCap || gate.recoveryAtStart < 30) return 0
  const r = set.rir ?? 2
  const effort = r <= 1 ? 1 : r === 2 ? 0.9 : r === 3 ? 0.6 : r === 4 ? 0.3 : 0
  return Math.round(8 * effort)
}

export const cardioXp = (minutes: number) => Math.min(120, 40 + 2 * Math.max(0, Math.round(minutes) - 20))

export const CATEGORY: Record<XpEventType, Stat> = {
  set: 'str', workout: 'str', pr: 'str', daily_quest: 'vit', readiness: 'vit', meal: 'int', calorie_target: 'int', protein_target: 'int', water_target: 'int',
  cardio: 'agi', form_rep: 'per', floor: 'str', streak_milestone: 'vit', emergency: 'agi', hidden: 'vit', boss: 'str', trial: 'str', job_change: 'str',
  awakening: 'vit', instant: 'str', recovery: 'vit', correction: 'str', gold: 'vit', purchase: 'vit', loot: 'vit',
}

export const streakBonus = (streak: number) => Math.min(0.15, 0.01 * Math.floor(streak / 7))
/** +0.5% per point to 30, +0.25% from 31 to 60, capped (game-design §4.3). */
export const statBonus = (points: number) => 0.005 * Math.min(points, 30) + 0.0025 * Math.max(0, Math.min(points, 60) - 30)
export const MAX_MULT = 1.6

export type MultContext = { streak: number; allocated: Partial<Record<Stat, number>>; titleCategory?: Stat; shadowBonus?: Partial<Record<Stat, number>>; comeback?: boolean }

export function multiplier(category: Stat, ctx: MultContext) {
  const m = (1 + streakBonus(ctx.streak)) * (1 + statBonus(ctx.allocated[category] ?? 0)) * (1 + (ctx.titleCategory === category ? 0.03 : 0)) * (1 + (ctx.shadowBonus?.[category] ?? 0)) * (ctx.comeback ? 1.25 : 1)
  return Math.min(MAX_MULT, Math.round(m * 1000) / 1000)
}

/** Build a ledger entry. Multipliers never apply to XP that safety rules made 0; corrections are never multiplied. */
export function award(e: { type: XpEventType; refId: string; base: number; gold?: number; ts: number; day: string; meta?: Record<string, unknown>; category?: Stat }, ctx: MultContext, id: string): XpEvent {
  const category = e.category ?? CATEGORY[e.type]
  const mult = e.base > 0 && e.type !== 'correction' ? multiplier(category, ctx) : 1
  return { id, ts: e.ts, day: e.day, type: e.type, refId: e.refId, base: e.base, mult, xp: Math.round(e.base * mult), gold: e.gold ?? 0, category, meta: e.meta }
}

export type LedgerState = { totalXp: number; level: number; xp: number; toNext: number; gold: number; statXp: Record<Stat, number>; stats: Record<Stat, number>; pointsEarned: number }

/** Fold the whole ledger — everything is recomputable from it. */
export function foldLedger(events: Pick<XpEvent, 'xp' | 'gold' | 'category' | 'type'>[]): LedgerState {
  let total = 0, gold = 0, rankUps = 0, jobChanges = 0
  const statXp = Object.fromEntries(STATS.map((s) => [s, 0])) as Record<Stat, number>
  for (const e of events) {
    total += e.xp
    gold += e.gold
    if (e.xp > 0) statXp[e.category] += e.xp
    if (e.type === 'trial') rankUps++
    if (e.type === 'job_change') jobChanges++
  }
  const lv = levelFromTotal(total)
  const stats = Object.fromEntries(STATS.map((s) => [s, 10 + Math.floor(statXp[s] / 250) + (lv.level - 1)])) as Record<Stat, number>
  return { totalXp: Math.max(0, total), ...lv, gold: Math.max(0, gold), statXp, stats, pointsEarned: 3 * (lv.level - 1) + 5 * rankUps + 5 * jobChanges }
}

/** Gold for a level-up: 10 × new level (game-design §13). */
export const levelUpGold = (from: number, to: number) => { let g = 0; for (let l = from + 1; l <= to; l++) g += 10 * l; return g }

/** Calorie target XP: within ±10% of target and never below the safe floor (no reward for extreme deficits). */
export const calorieTargetXp = (intake: number, target: number, floor: number) => (intake >= floor && Math.abs(intake - target) <= target * 0.1 ? BASE_XP.calorieTarget : 0)
export const proteinTargetXp = (protein: number, target: number) => (protein >= target * 0.9 ? BASE_XP.proteinTarget : 0)
export const waterTargetXp = (ml: number, target: number) => (ml >= target ? BASE_XP.waterTarget : 0)
