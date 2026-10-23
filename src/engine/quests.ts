// Quest engine (docs/game-design.md §8, §14): Daily Quest, streak + Penalty Zone state machine,
// Emergency and Hidden quests. All days are local 'YYYY-MM-DD'; deadlines are local midnight.
import type { BaseClass, Muscle } from './types'
import type { Day, Quest, QuestGoalRec } from './model'
import { addDays, daysBetween, endOf } from './dates'
import { BASE_XP } from './xp'
import { rng, hashSeed } from './rng'

export type DailyInput = {
  day: Day
  /** Planned session for this weekday, or null on a rest day. */
  session: { planDayId: string; name: string; exercises: number } | null
  readinessScore: number | null
  injured: Muscle[]
  deload: boolean
  waterMl: number
  proteinG: number
  restPass?: boolean
}

/** Waiver rule (game-design §11.4): red readiness or an injury flag swaps the session for recovery work. */
export const isWaived = (readinessScore: number | null, injured: Muscle[]) => (readinessScore != null && readinessScore < 2.5) || injured.length > 0

export function dailyQuest(i: DailyInput): Quest {
  const waived = isWaived(i.readinessScore, i.injured)
  const training = !!i.session && !waived && !i.restPass
  const core: QuestGoalRec = training
    ? { key: 'session', label: i.deload ? `Recovery Phase: ${i.session!.name}` : i.session!.name, target: 1, current: 0, core: true }
    : { key: 'recovery', label: waived ? 'Recovery block (mobility 10–15 min)' : i.restPass ? 'Rest Day Pass declared' : 'Rest-day mobility or step goal', target: 1, current: i.restPass ? 1 : 0, core: true }
  return {
    id: `daily-${i.day}`, day: i.day, type: 'daily', title: 'Preparation to Become Strong',
    status: 'issued', expiresAt: endOf(i.day),
    goals: [
      core,
      { key: 'water', label: 'Drink water', target: i.waterMl, current: 0, unit: 'ml' },
      { key: 'protein', label: 'Eat protein', target: i.proteinG, current: 0, unit: 'g' },
      { key: 'readiness', label: 'Readiness check-in', target: 1, current: i.readinessScore == null ? 0 : 1 },
    ],
    reward: { xp: training ? BASE_XP.dailyTraining : BASE_XP.dailyRest, gold: 40 },
    penalty: waived ? undefined : 'Penalty Zone',
    meta: { planDayId: i.session?.planDayId, waived, deload: i.deload },
  }
}

/** Update goal progress; returns a new quest. The quest clears when its core goal is met. */
export function progress(q: Quest, key: string, value: number, mode: 'set' | 'add' = 'set'): Quest {
  const goals = q.goals.map((g) => (g.key === key ? { ...g, current: mode === 'add' ? g.current + value : value } : g))
  const core = goals.find((g) => g.core)
  const cleared = q.status === 'issued' && core && core.current >= core.target
  return { ...q, goals, status: cleared ? 'cleared' : q.status }
}

export const allGoalsDone = (q: Quest) => q.goals.every((g) => g.current >= g.target)

// ---------- streak + Penalty Zone ----------
export type StreakState = {
  streak: number
  best: number
  activeDays: number
  /** Last day the core was cleared or bridged. */
  lastDay: Day | null
  freezes: number
  secondWindAt: Day | null
  penalty: { day: Day; prior: number } | null
  comebackDays: number
}

export const newStreak = (): StreakState => ({ streak: 0, best: 0, activeDays: 0, lastDay: null, freezes: 0, secondWindAt: null, penalty: null, comebackDays: 0 })

export type DayOutcome = { cleared: boolean; waived: boolean; restPass: boolean }
export type StreakEvent = 'cleared' | 'freeze_used' | 'second_wind' | 'penalty_issued' | 'penalty_cleared' | 'penalty_failed' | 'waived' | 'milestone'

const MILESTONES = [7, 21, 66, 100, 365]

/**
 * Close a day at local midnight (game-design §8.2, §14). Order: cleared → waived → Elixir (freeze) → Second Wind
 * (once per 30 days) → Penalty Quest for the next day. No XP is ever removed.
 */
export function closeDay(s: StreakState, day: Day, o: DayOutcome): { state: StreakState; events: StreakEvent[] } {
  const st = { ...s }
  const ev: StreakEvent[] = []
  if (o.cleared || o.restPass) {
    st.streak++; st.activeDays++; st.lastDay = day; ev.push('cleared')
    if (st.comebackDays > 0) st.comebackDays--
    if (MILESTONES.includes(st.streak)) ev.push('milestone')
  } else if (o.waived) {
    st.lastDay = day; ev.push('waived')
  } else if (st.freezes > 0) {
    st.freezes--; st.lastDay = day; ev.push('freeze_used')
  } else if (!st.secondWindAt || daysBetween(st.secondWindAt, day) >= 30) {
    st.secondWindAt = day; st.lastDay = day; ev.push('second_wind')
  } else {
    st.penalty = { day: addDays(day, 1), prior: st.streak }; ev.push('penalty_issued')
  }
  st.best = Math.max(st.best, st.streak)
  return { state: st, events: ev }
}

/** Penalty Quest outcome at the end of the penalty day. Waived when readiness is red or injured. */
export function resolvePenalty(s: StreakState, o: { cleared: boolean; waived: boolean }): { state: StreakState; event: StreakEvent | null } {
  if (!s.penalty) return { state: s, event: null }
  if (o.cleared || o.waived) return { state: { ...s, streak: s.penalty.prior, penalty: null }, event: o.waived ? 'waived' : 'penalty_cleared' }
  return { state: { ...s, streak: Math.floor(s.penalty.prior / 2), penalty: null, comebackDays: 3 }, event: 'penalty_failed' }
}

export function penaltyQuest(day: Day, level: number): Quest {
  const minutes = level <= 20 ? 10 : level <= 50 ? 12 : 15
  return {
    id: `penalty-${day}`, day, type: 'penalty', title: 'Survive', status: 'issued', expiresAt: endOf(day),
    goals: [{ key: 'conditioning', label: 'Conditioning (bike, jog or bodyweight circuit)', target: minutes, current: 0, unit: 'min', core: true }],
    // The Penalty Zone pays nothing (anti-farm, R1); clearing it only restores the streak.
    reward: { xp: 0, gold: 0 }, penalty: 'Streak halves',
  }
}

// ---------- Emergency Quests ----------
type Template = { title: string; goal: string; target: number; unit: string; classes?: BaseClass[]; muscles: Muscle[] }
const EMERGENCY: Template[] = [
  { title: 'Complete 50 push-ups before 21:00', goal: 'Push-ups', target: 50, unit: 'reps', muscles: ['chest', 'triceps'] },
  { title: 'Hold a 3-minute total plank', goal: 'Plank', target: 180, unit: 's', muscles: ['abs'] },
  { title: '100 bodyweight squats before sunset', goal: 'Squats', target: 100, unit: 'reps', muscles: ['quads', 'glutes'] },
  { title: '20-minute zone-2 ride or walk', goal: 'Easy cardio', target: 20, unit: 'min', muscles: [] },
  { title: 'Log every meal today', goal: 'Meals logged', target: 3, unit: 'meals', muscles: [] },
  { title: '15-minute mobility flow', goal: 'Mobility', target: 15, unit: 'min', classes: ['healer', 'ranger'], muscles: [] },
  { title: '5 × 3 explosive jumps', goal: 'Jump sets', target: 5, unit: 'sets', classes: ['ranger', 'assassin'], muscles: ['quads', 'calves'] },
  { title: '30 pull-ups in any sets', goal: 'Pull-ups', target: 30, unit: 'reps', classes: ['fighter', 'ranger', 'assassin'], muscles: ['lats', 'biceps'] },
]

/**
 * Surprise optional quest: 15% chance per day after day 7, max 2 per week, never on red readiness or injury days,
 * never targeting a muscle below 70% recovery. Deterministic per day (seeded).
 */
export function maybeEmergency(day: Day, ctx: { daysPlayed: number; thisWeek: number; readinessScore: number | null; injured: Muscle[]; recovery: Partial<Record<Muscle, number>>; baseClass: BaseClass; level: number; seed?: number }): Quest | null {
  if (ctx.daysPlayed < 7 || ctx.thisWeek >= 2 || isWaived(ctx.readinessScore, ctx.injured)) return null
  const rand = rng(hashSeed(`${day}:${ctx.seed ?? 0}`))
  if (rand() >= 0.15) return null
  const ok = EMERGENCY.filter((t) => (!t.classes || t.classes.includes(ctx.baseClass)) && t.muscles.every((m) => (ctx.recovery[m] ?? 100) >= 70))
  if (!ok.length) return null
  const t = ok[Math.floor(rand() * ok.length)]
  const scale = Math.min(2, 1 + Math.floor(ctx.level / 25) * 0.25)
  const target = Math.round(t.target * (t.unit === 'reps' || t.unit === 's' ? scale : 1))
  const xp = Math.round(BASE_XP.emergencyMin + (BASE_XP.emergencyMax - BASE_XP.emergencyMin) * Math.min(1, ctx.level / 60))
  return {
    id: `emergency-${day}`, day, type: 'emergency', title: t.title.replace(String(t.target), String(target)), status: 'issued',
    expiresAt: endOf(day) - 3 * 3_600_000, goals: [{ key: 'main', label: t.goal, target, current: 0, unit: t.unit, core: true }],
    reward: { xp, gold: 100 }, meta: { optional: true },
  }
}

// ---------- Hidden Quests ----------
export type Snapshot = {
  streak: number; bestStreak: number; workouts: number; prs: number; level: number; rank: string
  earlyWorkouts: number; lateWorkouts: number; perfectWeeks: number; waterStreak: number; proteinDays: number; mealsLogged: number
  formGoodSets: number; equipmentTypesThisWeek: number; cardioKmThisWeek: number; comebacks: number; overachieverDays: number
  totalVolumeKg: number; cardioKm: number; bossRaids: number; redGates: number; shadows: number; deloads: number; penaltiesCleared: number
  dailyCleared: number; readinessDays: number; demonFloor: number; jobChanged: boolean; firstPrLifts: string[]; instantDungeons: number; goldEarned: number; titles: number
  legDays: number; cls: string; ranksReached: string[]
}

export type HiddenDef = { id: string; title: string; hint: string; xp: number; reward?: { title?: string; item?: string }; test: (s: Snapshot) => boolean }
export const HIDDEN: HiddenDef[] = [
  { id: 'dawn_hunter', title: 'Dawn Hunter', hint: 'The System watches those who rise before the sun.', xp: 300, reward: { title: 'dawn_hunter' }, test: (s) => s.earlyWorkouts >= 1 },
  { id: 'night_owl', title: 'Night Owl', hint: 'Some hunters move only at night.', xp: 200, reward: { title: 'night_stalker' }, test: (s) => s.lateWorkouts >= 1 },
  { id: 'overachiever', title: 'Overachiever', hint: 'Do more than the System asked. Safely.', xp: 400, reward: { item: 'instant_key' }, test: (s) => s.overachieverDays >= 1 },
  { id: 'iron_will_100', title: 'Iron Will', hint: 'One hundred days without breaking.', xp: 500, reward: { title: 'unbroken' }, test: (s) => s.bestStreak >= 100 },
  { id: 'hydra', title: 'Hydra', hint: 'Thirty days of water.', xp: 300, reward: { title: 'tidecaller' }, test: (s) => s.waterStreak >= 30 },
  { id: 'perfect_week', title: 'Perfect Week', hint: 'Every Daily Quest, Monday to Sunday.', xp: 300, test: (s) => s.perfectWeeks >= 1 },
  { id: 'polymath', title: 'Polymath', hint: 'Five kinds of steel in one week.', xp: 200, test: (s) => s.equipmentTypesThisWeek >= 5 },
  { id: 'marathoner', title: 'Marathoner', hint: 'The distance of legend, in one week.', xp: 400, reward: { title: 'roadrunner' }, test: (s) => s.cardioKmThisWeek >= 42.2 },
  { id: 'form_master', title: 'Form Master', hint: 'The System sees perfect form.', xp: 300, reward: { title: 'eagle_eye' }, test: (s) => s.formGoodSets >= 5 },
  { id: 'comeback', title: 'The Return', hint: 'Return after a long absence.', xp: 250, reward: { item: 'elixir' }, test: (s) => s.comebacks >= 1 },
]

export function newHidden(s: Snapshot, done: Set<string>) {
  return HIDDEN.filter((h) => !done.has(h.id) && h.test(s))
}
