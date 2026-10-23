// Game layer over the 12-week training simulation: daily quests, streaks, penalties, XP, levels, loot.
import type { SimResult } from './simulate'
import type { Exercise } from '@/engine/types'
import type { XpEvent } from '@/engine/model'
import { addDays, weekday } from '@/engine/dates'
import { award, BASE_XP, foldLedger, setXp, type MultContext } from '@/engine/xp'
import { closeDay, dailyQuest, newStreak, progress, resolvePenalty, type StreakState } from '@/engine/quests'
import { capFor, weeklyHardSets } from '@/engine/safety'
import { freshPity, rollLoot } from '@/engine/loot'
import { rng } from '@/engine/rng'

export type GameDay = { day: string; level: number; streak: number; cleared: boolean; penalty: boolean }
export type GameResult = { days: GameDay[]; ledger: XpEvent[]; penaltiesIssued: number; penaltiesFailed: number; drops: string[]; streak: StreakState }

export function simulateGame(r: SimResult, exercises: Map<string, Exercise>, opts: { adherence: number; nutrition: number; seed: number; start?: string }): GameResult {
  const rand = rng(opts.seed)
  const start = opts.start ?? '2026-01-05' // a Monday
  const ledger: XpEvent[] = []
  let streak = newStreak()
  let pity = freshPity()
  const drops: string[] = []
  const days: GameDay[] = []
  let penaltiesIssued = 0, penaltiesFailed = 0, n = 0
  const add = (e: Parameters<typeof award>[0], ctx: MultContext) => ledger.push(award(e, ctx, `e${n++}`))
  const trainingWeekdays = r.persona.days
  const weekSets = new Map<number, { exerciseId: string; rir: number; type: 'working' }[]>()

  for (let i = 0; i < 84; i++) {
    const day = addDays(start, i)
    const week = Math.floor(i / 7) + 1
    const ctx: MultContext = { streak: streak.streak, allocated: {}, comeback: streak.comebackDays > 0 }
    const isTraining = trainingWeekdays.includes(weekday(day))
    const session = isTraining ? r.sessions.filter((s) => s.week === week)[trainingWeekdays.indexOf(weekday(day))] : undefined
    const readiness = rand() < 0.08 ? 2 : 4
    let q = dailyQuest({ day, session: session ? { planDayId: 'x', name: 'Session', exercises: session.exercises.length } : null, readinessScore: readiness, injured: [], deload: !!session?.deload, waterMl: 3000, proteinG: 150 })
    add({ type: 'readiness', refId: day, base: BASE_XP.readiness, ts: i, day }, ctx)
    const shows = rand() < opts.adherence
    const waived = !!q.meta?.waived
    if (shows) {
      if (session && !waived) {
        const ws = weekSets.get(week) ?? []
        let prs = 0
        for (const ex of session.exercises) {
          for (const s of ex.sets) {
            const vol = weeklyHardSets(ws, exercises)
            const e = exercises.get(ex.exerciseId)!
            const overCap = e.primary.some((m) => vol[m] >= capFor(m, r.persona.experience))
            add({ type: 'set', refId: `${day}:${ex.exerciseId}:${ws.length}`, base: setXp({ rir: s.rir, type: 'working' }, { overCap, recoveryAtStart: 80 }), ts: i, day }, ctx)
            ws.push({ exerciseId: ex.exerciseId, rir: s.rir, type: 'working' })
          }
          if (ex.action === 'add_load' && prs < 3) { prs++; add({ type: 'pr', refId: `${day}:${ex.exerciseId}`, base: BASE_XP.pr, gold: 25, ts: i, day }, ctx) }
        }
        weekSets.set(week, ws)
        add({ type: 'workout', refId: day, base: BASE_XP.workout, gold: 50, ts: i, day }, ctx)
        const loot = rollLoot(rand, pity, { owned: new Set(), elixirs: streak.freezes })
        pity = loot.pity
        drops.push(loot.drop.rarity)
        if (loot.drop.item.id === 'elixir') streak.freezes = Math.min(2, streak.freezes + 1)
        q = progress(q, 'session', 1)
      } else q = progress(q, 'recovery', 1)
      if (q.status === 'cleared') add({ type: 'daily_quest', refId: day, base: q.reward.xp, gold: q.reward.gold, ts: i, day }, ctx)
    }
    if (rand() < opts.nutrition) {
      for (const m of ['b', 'l', 'd']) add({ type: 'meal', refId: `${day}:${m}`, base: BASE_XP.meal, ts: i, day }, ctx)
      add({ type: 'calorie_target', refId: day, base: BASE_XP.calorieTarget, ts: i, day }, ctx)
      add({ type: 'protein_target', refId: day, base: BASE_XP.proteinTarget, ts: i, day }, ctx)
      add({ type: 'water_target', refId: day, base: BASE_XP.waterTarget, ts: i, day }, ctx)
    }
    // A penalty issued yesterday is resolved today (cleared by showing up 60% of the time).
    let penalty = false
    if (streak.penalty?.day === day) {
      penalty = true
      const cleared = shows && rand() < 0.6
      const res = resolvePenalty(streak, { cleared, waived })
      if (res.event === 'penalty_failed') penaltiesFailed++
      streak = res.state
    }
    const closed = closeDay(streak, day, { cleared: q.status === 'cleared', waived, restPass: false })
    if (closed.events.includes('penalty_issued')) penaltiesIssued++
    if (closed.events.includes('milestone') && closed.state.streak % 7 === 0) add({ type: 'streak_milestone', refId: `${day}`, base: BASE_XP.streak7, ts: i, day }, ctx)
    streak = closed.state
    days.push({ day, level: foldLedger(ledger).level, streak: streak.streak, cleared: q.status === 'cleared', penalty })
  }
  return { days, ledger, penaltiesIssued, penaltiesFailed, drops, streak }
}
