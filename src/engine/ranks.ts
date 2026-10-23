// Ranks, Rank-Up Trials and the Job Change Quest (docs/game-design.md §3, §6, §8.5).
import { RANKS, type AdvancedClass, type BaseClass, type ClassId, type Experience, type Rank } from './types'
import type { QuestGoalRec } from './model'

export const RANK_GATES: Record<Rank, { level: number; power: number }> = {
  E: { level: 1, power: 0 }, D: { level: 10, power: 15 }, C: { level: 20, power: 30 }, B: { level: 35, power: 45 },
  A: { level: 50, power: 60 }, S: { level: 70, power: 78 }, National: { level: 100, power: 90 },
}

export const nextRank = (r: Rank): Rank | null => RANKS[RANKS.indexOf(r) + 1] ?? null

/** Starting rank from the Awakening: beginners always E; otherwise D at Power Level ≥ 15. */
export const startingRank = (power: number, experience: Experience): Rank => (experience === 'beginner' || power < RANK_GATES.D.power ? 'E' : 'D')

/** The next rank's trial becomes available when both the level and the Power Level gate are met. */
export function trialAvailable(rank: Rank, level: number, power: number) {
  const n = nextRank(rank)
  if (!n) return null
  return level >= RANK_GATES[n].level && power >= RANK_GATES[n].power ? n : null
}

export type TrialContext = { baseClass: BaseClass; awakening?: { pushups: number; squats60s: number; plankSec: number }; adherence12w?: number; weeksConsistent?: number }

/** Concrete trial goals per target rank (game-design §6). The UI records results against these keys. */
export function trialGoals(target: Rank, ctx: TrialContext): QuestGoalRec[] {
  const a = ctx.awakening ?? { pushups: 0, squats60s: 0, plankSec: 0 }
  switch (target) {
    case 'D':
      return [
        { key: 'pushups', label: 'Max push-ups', target: a.pushups + 1, current: 0, unit: 'reps', core: true },
        { key: 'squats60s', label: 'Bodyweight squats in 60 s', target: a.squats60s + 1, current: 0, unit: 'reps', core: true },
        { key: 'plankSec', label: 'Plank hold', target: a.plankSec + 5, current: 0, unit: 's', core: true },
      ]
    case 'C':
      return ctx.baseClass === 'fighter' || ctx.baseClass === 'tank'
        ? [{ key: 'power_strength', label: 'Squat or bench e1RM at Novice standard', target: 25, current: 0, unit: 'score', core: true }]
        : ctx.baseClass === 'healer'
          ? [{ key: 'mobility_battery', label: 'Mobility battery (5 holds × 30 s)', target: 5, current: 0, unit: 'holds', core: true }]
          : [{ key: 'conditioning_12min', label: '12-minute conditioning test', target: 1, current: 0, core: true }]
    case 'B':
      return [
        { key: 'power_strength', label: 'Two lifts at Novice+ standard', target: 35, current: 0, unit: 'score', core: true },
        { key: 'conditioning_12min', label: '12-minute conditioning test', target: 1, current: 0, core: true },
      ]
    case 'A':
      return [{ key: 'power_strength', label: 'Squat, bench, deadlift, OHP at Intermediate standard', target: 50, current: 0, unit: 'score', core: true }]
    case 'S':
      return [
        { key: 'test_week', label: 'Complete the S-rank test week', target: 1, current: 0, core: true },
        { key: 'adherence', label: 'Session adherence over 12 weeks', target: 80, current: Math.round((ctx.adherence12w ?? 0) * 100), unit: '%', core: true },
      ]
    case 'National':
      return [
        { key: 'boss_s', label: 'Clear an S-rank Boss Raid', target: 1, current: 0, core: true },
        { key: 'weeks', label: 'Weeks at ≥ 75% adherence', target: 52, current: ctx.weeksConsistent ?? 0, unit: 'weeks', core: true },
      ]
    default:
      return []
  }
}

/** Trials are postponed — never failed — when recovery or readiness is not good enough. */
export const trialReady = (minRecovery: number, readinessTier: 'green' | 'yellow' | 'red') => minRecovery >= 70 && readinessTier === 'green'
export const TRIAL_RETRY_DAYS = 7

// ---------- Job Change ----------
export const JOB_CHANGE_LEVEL = 30
export const ADVANCED_OPTIONS: Record<BaseClass, AdvancedClass[]> = {
  fighter: ['knight', 'berserker'], tank: ['juggernaut'], assassin: ['shadow_assassin'], ranger: ['striker'], healer: ['monk'],
}

export function jobChangeAvailable(cls: ClassId, level: number) {
  return level >= JOB_CHANGE_LEVEL && (['fighter', 'tank', 'assassin', 'ranger', 'healer'] as string[]).includes(cls)
}

export function jobChangeGoals(base: BaseClass): QuestGoalRec[] {
  switch (base) {
    case 'fighter': return [{ key: 'top_set', label: 'Work up to a 3RM at RIR 1 on a main lift at Intermediate standard', target: 50, current: 0, unit: 'score', core: true }]
    case 'tank': return [{ key: 'volume', label: '5 × 10 at 70% 1RM with ≤ 120 s rest', target: 5, current: 0, unit: 'sets', core: true }]
    case 'assassin': return [{ key: 'amrap', label: '20-minute AMRAP circuit rounds', target: 8, current: 0, unit: 'rounds', core: true }]
    case 'ranger': return [{ key: 'complex', label: 'Heavy/power complex + 2 km row', target: 2, current: 0, unit: 'parts', core: true }]
    case 'healer': return [{ key: 'battery', label: 'Mobility battery score', target: 80, current: 0, unit: 'score', core: true }]
  }
}

/** Shadow Monarch unlocks at S rank (hidden class). */
export const monarchAvailable = (rank: Rank) => rank === 'S' || rank === 'National'
