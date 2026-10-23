// Gates, floors, Boss Raids, Red Gates, Instant Dungeons and the Demon Castle (docs/game-design.md §9).
import { RANKS, type Muscle, type Rank } from './types'
import type { Day, DungeonRun } from './model'
import { daysBetween } from './dates'
import type { BossTest, Program, ProgramDay } from '@/data/programs'

/** Resolve program exercise names to library ids. Throws on an unknown name (caught by tests). */
export function resolveDay(day: ProgramDay, idByName: Map<string, string>) {
  return day.exercises.map((e) => {
    const id = idByName.get(e.name.toLowerCase())
    if (!id) throw new Error(`Unknown exercise in program: ${e.name}`)
    return { ...e, exerciseId: id }
  })
}

const rankIdx = (r: Rank) => RANKS.indexOf(r)

/** Gates above your rank by more than one step are sealed; Red Gates need rank C or higher. */
export function gateAccess(program: Program, playerRank: Rank): { open: boolean; reason?: string } {
  if (program.red && rankIdx(playerRank) < rankIdx('C')) return { open: false, reason: '[A Red Gate requires C rank or higher.]' }
  if (rankIdx(program.rank) > rankIdx(playerRank) + 1) return { open: false, reason: `[This ${program.rank}-rank Gate is beyond your strength.]` }
  return { open: true }
}

export function startRun(program: Program, now: number, id: string): DungeonRun {
  return { id, programId: program.id, status: 'active', startedAt: now, floor: 1, floorsCleared: [], bossAttempts: 0, red: program.red }
}

/** A floor (week) clears at ≥ 75% of its planned sessions. */
export const floorCleared = (program: Program, sessionsDone: number) => sessionsDone >= Math.ceil(program.daysPerWeek * 0.75)
export const isBossFloor = (run: DungeonRun, program: Program) => run.floor >= program.weeks

/** Advance at the end of a week. The boss floor is resolved separately by bossResult. */
export function endWeek(run: DungeonRun, program: Program, sessionsDone: number): DungeonRun {
  if (run.status !== 'active' || isBossFloor(run, program)) return run
  const cleared = floorCleared(program, sessionsDone)
  return { ...run, floorsCleared: cleared ? [...run.floorsCleared, run.floor] : run.floorsCleared, floor: run.floor + 1 }
}

export type BossInput = { test: BossTest; result: number; baseline?: number }

/** Every test must meet its rule: AMRAP reps ≥ target, or e1RM ≥ baseline × target. */
export function bossResult(inputs: BossInput[]) {
  const per = inputs.map(({ test, result, baseline }) => ({ label: test.label, passed: test.kind === 'amrap' ? result >= test.target : baseline != null && baseline > 0 && result >= baseline * test.target }))
  return { passed: per.length > 0 && per.every((p) => p.passed), per }
}

export function resolveBoss(run: DungeonRun, passed: boolean, now: number): DungeonRun {
  return passed ? { ...run, status: 'cleared', endedAt: now, floorsCleared: [...run.floorsCleared, run.floor] } : { ...run, bossAttempts: run.bossAttempts + 1 }
}

/** Boss HP bar: the boss week's planned volume; each logged set deals its volume (kg × reps) as damage. */
export const bossHp = (plannedVolume: number, loggedVolume: number) => ({ max: Math.round(plannedVolume), hp: Math.max(0, Math.round(plannedVolume - loggedVolume)) })

export const BOSS_RETRY_DAYS = 7
/** Dungeon Break: 10 days without a session in an active Gate marks it unstable (nothing is lost). */
export const unstable = (lastSession: Day | null, today: Day, startedDay: Day) => daysBetween(lastSession ?? startedDay, today) >= 10

// ---------- Red Gate ----------
/** 7 days that cannot be paused; waived days (red readiness / injury) are suspended, not failed. */
export function redGateStatus(days: { day: Day; cleared: boolean; waived: boolean }[]) {
  const counted = days.filter((d) => !d.waived)
  if (counted.some((d) => !d.cleared)) return 'failed' as const
  return counted.filter((d) => d.cleared).length >= 7 ? ('cleared' as const) : ('active' as const)
}

// ---------- Instant Dungeons ----------
export function instantAllowed(o: { keys: number; usedToday: boolean; targetMuscles: Muscle[]; recovery: Partial<Record<Muscle, number>> }) {
  if (o.keys < 1) return { ok: false, reason: '[You need an Instant Dungeon Key.]' }
  if (o.usedToday) return { ok: false, reason: '[Only one Instant Dungeon may be opened per day.]' }
  if (o.targetMuscles.some((m) => (o.recovery[m] ?? 100) < 30)) return { ok: false, reason: '[Target muscles have not recovered. The dungeon refuses entry.]' }
  return { ok: true as const }
}

// ---------- Demon Castle ----------
export const CASTLE_FLOORS = 100
export const CASTLE_BOSSES: Record<number, string> = { 1: 'Cerberus, Gatekeeper', 25: "Vulcan's Herald", 50: 'Vulcan, Demon King', 75: 'Metus, Lich', 100: 'Baran, Demon Monarch' }
export const floorThreshold = (n: number) => Math.round(10 * n ** 1.6)
/** Lifetime score: tonnes lifted + km covered + 5 per workout. */
export const castleScore = (t: { volumeKg: number; cardioKm: number; workouts: number }) => t.volumeKg / 1000 + t.cardioKm + t.workouts * 5

export function castleFloor(score: number) {
  let f = 0
  while (f < CASTLE_FLOORS && score >= floorThreshold(f + 1)) f++
  return { floor: f, next: f < CASTLE_FLOORS ? floorThreshold(f + 1) : null, boss: CASTLE_BOSSES[f] ?? null }
}

/** Boss floors crossed between two scores (each triggers Shadow Extraction). */
export function bossFloorsCrossed(before: number, after: number) {
  const a = castleFloor(before).floor, b = castleFloor(after).floor
  return Object.keys(CASTLE_BOSSES).map(Number).filter((f) => f > a && f <= b)
}
