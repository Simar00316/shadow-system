// Game service: the only place where engines meet IndexedDB for XP, levels, streaks and quests.
import { db } from '@/db/schema'
import { getSetting, setSetting, uid } from '@/db/repo'
import { award, foldLedger, levelUpGold, type MultContext } from '@/engine/xp'
import { closeDay, dailyQuest, maybeEmergency, newHidden, newStreak, penaltyQuest, resolvePenalty, type Snapshot, type StreakState } from '@/engine/quests'
import { addDays, dayOf, daysBetween, weekStart, weekday } from '@/engine/dates'
import { targets as nutritionTargets } from '@/engine/nutrition'
import { castleFloor, castleScore } from '@/engine/dungeons'
import { shadowBonus } from '@/engine/shadows'
import { isLowerBody } from '@/engine/strength'
import { baseOf } from '@/engine/prescription'
import { recovery as recoveryOf, setHits, cardioHits } from '@/engine/recovery'
import { newTitles, titleById } from '@/data/titles'
import type { Day, Player, Profile, Quest, XpEvent, XpEventType } from '@/engine/model'
import type { Stat } from '@/engine/types'
import { say } from './notify'

export type AwardInput = { type: XpEventType; refId: string; base: number; gold?: number; day?: Day; category?: Stat; meta?: Record<string, unknown> }
export type AwardSummary = { xp: number; gold: number; levelBefore: number; levelAfter: number; newTitles: string[]; events: XpEvent[] }

export const getStreak = async () => (await getSetting<StreakState>('streak')) ?? newStreak()
export const saveStreak = (s: StreakState) => setSetting('streak', s)

export function newPlayer(): Player {
  return {
    id: 'me', level: 1, xp: 0, totalXp: 0, rank: 'E', powerLevel: 0, stats: { str: 10, agi: 10, vit: 10, int: 10, per: 10 }, allocated: { str: 0, agi: 0, vit: 0, int: 0, per: 0 },
    unspent: 0, gold: 0, streak: 0, bestStreak: 0, activeDays: 0, equippedShadows: [], theme: 'system', pity: { rare: 0, epic: 0, legendary: 0 }, updatedAt: Date.now(),
  }
}

async function multContext(player: Player): Promise<MultContext> {
  const streak = await getStreak()
  const equipped = player.equippedShadows.length ? await db.shadows.bulkGet(player.equippedShadows) : []
  return { streak: streak.streak, allocated: player.allocated, titleCategory: player.title ? titleById.get(player.title)?.category : undefined, shadowBonus: shadowBonus(equipped.filter(Boolean) as never), comeback: streak.comebackDays > 0 }
}

/** Recompute the player row from the whole ledger. */
export async function refreshPlayer(): Promise<Player> {
  const fold = foldLedger(await db.xpEvents.toArray())
  const streak = await getStreak()
  // Read-modify-write in one transaction: a concurrent change (equipped title, theme, pity) must not be overwritten (#126).
  return db.transaction('rw', db.player, async () => {
    const p = (await db.player.get('me')) ?? newPlayer()
    const allocated = Object.values(p.allocated).reduce((a, b) => a + b, 0)
    const next: Player = { ...p, level: fold.level, xp: fold.xp, totalXp: fold.totalXp, gold: fold.gold, stats: fold.stats, unspent: Math.max(0, fold.pointsEarned - allocated), streak: streak.streak, bestStreak: streak.best, activeDays: streak.activeDays, updatedAt: Date.now() }
    await db.player.put(next)
    return next
  })
}

/** Append ledger entries (idempotent by type+refId), level up, pay level gold, unlock titles and hidden quests. */
export async function awardMany(inputs: AwardInput[], opts: { quiet?: boolean } = {}): Promise<AwardSummary> {
  const player = (await db.player.get('me')) ?? newPlayer()
  const ctx = await multContext(player)
  const now = Date.now()
  const added: XpEvent[] = []
  for (const i of inputs) {
    if (await db.xpEvents.where('[type+refId]').equals([i.type, i.refId]).count()) continue
    const e = award({ ...i, ts: now, day: i.day ?? dayOf(now) }, ctx, uid())
    await db.xpEvents.add(e)
    added.push(e)
  }
  const before = player.level
  let after = await refreshPlayer()
  if (after.level > before) {
    await db.xpEvents.add(award({ type: 'gold', refId: `level:${before}->${after.level}`, base: 0, gold: levelUpGold(before, after.level), ts: now, day: dayOf(now), category: 'vit' }, ctx, uid()))
    after = await refreshPlayer()
    if (!opts.quiet) await say('level_up', { level: after.level })
    if (after.unspent > 0) await say('points_available', { points: after.unspent }, { quiet: true })
  }
  const titles = await unlockTitles(opts.quiet)
  await unlockHidden(opts.quiet)
  return { xp: added.reduce((a, e) => a + e.xp, 0), gold: added.reduce((a, e) => a + e.gold, 0), levelBefore: before, levelAfter: after.level, newTitles: titles, events: added }
}

export const award1 = (i: AwardInput, quiet = false) => awardMany([i], { quiet })

/** Spend gold: a negative gold ledger entry. Never touches XP. */
export async function spendGold(amount: number, refId: string) {
  await db.xpEvents.add({ id: uid(), ts: Date.now(), day: dayOf(), type: 'purchase', refId, base: 0, mult: 1, xp: 0, gold: -Math.abs(amount), category: 'vit' })
  return refreshPlayer()
}

async function unlockTitles(quiet?: boolean) {
  const owned = new Set((await db.titles.toArray()).map((t) => t.id))
  const s = await snapshot()
  const got = newTitles(s, owned)
  for (const t of got) {
    await db.titles.put({ id: t.id, unlockedAt: Date.now() })
    await say('title_unlocked', { title: t.name }, { quiet: quiet || got.length > 2 })
  }
  return got.map((t) => t.id)
}

async function unlockHidden(quiet?: boolean) {
  const done = new Set((await db.quests.where('type').equals('hidden').toArray()).map((q) => q.id.replace('hidden-', '')))
  const s = await snapshot()
  for (const h of newHidden(s, done)) {
    const day = dayOf()
    await db.quests.put({ id: `hidden-${h.id}`, day, type: 'hidden', title: h.title, status: 'cleared', goals: [{ key: 'secret', label: h.hint, target: 1, current: 1, core: true }], expiresAt: Date.now(), reward: { xp: h.xp, gold: 0, items: h.reward?.item ? [h.reward.item] : [] } })
    await db.xpEvents.add(award({ type: 'hidden', refId: h.id, base: h.xp, ts: Date.now(), day }, await multContext((await db.player.get('me')) ?? newPlayer()), uid()))
    if (h.reward?.item) await addItem(h.reward.item, 1)
    if (h.reward?.title) await db.titles.put({ id: h.reward.title, unlockedAt: Date.now() })
    await say('hidden_quest', { title: h.title }, { quiet })
  }
  await refreshPlayer()
}

export async function addItem(id: string, qty: number) {
  const cur = await db.inventory.get(id)
  await db.inventory.put({ id, qty: (cur?.qty ?? 0) + qty })
}

/** Everything the title and hidden-quest catalogues test against. */
export async function snapshot(): Promise<Snapshot> {
  const [profile, player, streak, workouts, sets, cardio, ledger, quests, meals, readiness, dungeons, shadows, titles, exercises] = await Promise.all([
    db.profile.get('me'), db.player.get('me'), getStreak(), db.workouts.toArray(), db.sets.toArray(), db.cardio.toArray(), db.xpEvents.toArray(), db.quests.toArray(), db.mealLogs.count(), db.readiness.count(), db.dungeons.toArray(), db.shadows.count(), db.titles.count(),
    db.exercises.toArray(),
  ])
  const exById = new Map(exercises.map((e) => [e.id, e]))
  const done = workouts.filter((w) => w.endedAt && w.kind !== 'penalty' && w.kind !== 'recovery')
  const thisWeek = weekStart(dayOf())
  const weekSets = sets.filter((s) => dayOf(s.completedAt) >= thisWeek)
  const working = sets.filter((s) => s.type !== 'warmup')
  const dailies = quests.filter((q) => q.type === 'daily')
  const clearedDays = new Set(dailies.filter((q) => q.status === 'cleared').map((q) => q.day))
  const waterDays = new Set(ledger.filter((e) => e.type === 'water_target').map((e) => e.day))
  let waterStreak = 0
  for (let d = waterDays.has(dayOf()) ? dayOf() : addDays(dayOf(), -1); waterDays.has(d); d = addDays(d, -1)) waterStreak++
  const weeks = new Map<string, number>()
  for (const d of clearedDays) weeks.set(weekStart(d), (weeks.get(weekStart(d)) ?? 0) + 1)
  const gaps = done.map((w) => w.day).sort().filter((d, i, a) => i > 0 && daysBetween(a[i - 1], d) >= 14).length
  const planned = new Map<string, number>()
  for (const pe of await db.planExercises.toArray()) planned.set(pe.planDayId, (planned.get(pe.planDayId) ?? 0) + pe.sets)
  const overachiever = done.filter((w) => w.planDayId && (planned.get(w.planDayId) ?? 99) * 2 <= sets.filter((s) => s.workoutId === w.id && s.type !== 'warmup').length).length
  const volume = working.reduce((a, s) => a + s.weightKg * s.reps, 0)
  const km = cardio.reduce((a, c) => a + (c.distanceKm ?? 0), 0)
  return {
    streak: streak.streak, bestStreak: streak.best, workouts: done.length, prs: ledger.filter((e) => e.type === 'pr').length, level: player?.level ?? 1, rank: player?.rank ?? 'E',
    earlyWorkouts: done.filter((w) => { const h = new Date(w.startedAt).getHours(); return h >= 4 && h < 6 }).length,
    lateWorkouts: done.filter((w) => new Date(w.startedAt).getHours() >= 22).length,
    perfectWeeks: [...weeks.values()].filter((n) => n >= 7).length, waterStreak, proteinDays: ledger.filter((e) => e.type === 'protein_target').length, mealsLogged: meals,
    formGoodSets: sets.filter((s) => (s.formScore ?? 0) >= 90).length,
    equipmentTypesThisWeek: new Set(weekSets.flatMap((s) => exById.get(s.exerciseId)?.equipment.filter((e) => e !== 'bench') ?? [])).size,
    cardioKmThisWeek: cardio.filter((c) => c.day >= thisWeek).reduce((a, c) => a + (c.distanceKm ?? 0), 0), comebacks: gaps, overachieverDays: overachiever,
    totalVolumeKg: volume, cardioKm: km, bossRaids: dungeons.filter((d) => d.status === 'cleared' && !d.red).length, redGates: dungeons.filter((d) => d.status === 'cleared' && d.red).length,
    shadows, deloads: new Set(dailies.filter((q) => q.meta?.deload && q.status === 'cleared').map((q) => weekStart(q.day))).size,
    penaltiesCleared: quests.filter((q) => q.type === 'penalty' && q.status === 'cleared').length, dailyCleared: clearedDays.size, readinessDays: readiness,
    demonFloor: castleFloor(castleScore({ volumeKg: volume, cardioKm: km, workouts: done.length })).floor,
    jobChanged: ledger.some((e) => e.type === 'job_change'), firstPrLifts: [...new Set(ledger.filter((e) => e.type === 'pr' && e.meta?.lift).map((e) => String(e.meta!.lift)))],
    instantDungeons: done.filter((w) => w.kind === 'instant').length, goldEarned: ledger.reduce((a, e) => a + Math.max(0, e.gold), 0), titles,
    legDays: done.filter((w) => sets.some((s) => s.workoutId === w.id && exById.get(s.exerciseId) && isLowerBody(exById.get(s.exerciseId)!))).length,
    cls: profile?.cls ?? '', ranksReached: ['E', ...ledger.filter((e) => e.type === 'trial' && e.meta?.rank).map((e) => String(e.meta!.rank))],
  }
}

// ---------- day rollover ----------

/** Planned session for a day (by weekday) from the active plan, or null on rest days. */
export async function sessionFor(day: Day) {
  const plan = (await db.plans.toArray()).find((p) => p.active)
  if (!plan) return null
  const pd = (await db.planDays.where('planId').equals(plan.id).toArray()).find((d) => d.weekday === weekday(day))
  if (!pd) return null
  return { planDayId: pd.id, name: pd.name, exercises: await db.planExercises.where('planDayId').equals(pd.id).count() }
}

export async function currentTargets(profile: Profile) {
  const age = Number(dayOf().slice(0, 4)) - profile.birthYear
  return nutritionTargets({ sex: profile.sex, weightKg: profile.weightKg, heightCm: profile.heightCm, age, activity: profile.activity, goal: profile.goal, experience: profile.experience, baseClass: baseOf(profile.cls), dietType: profile.dietType, tdeeOverride: await getSetting<number>('tdee') })
}

async function issueDaily(day: Day, profile: Profile): Promise<Quest> {
  const existing = await db.quests.get(`daily-${day}`)
  if (existing) return existing
  const readiness = await db.readiness.get(day)
  const t = await currentTargets(profile)
  const deload = (await getSetting<{ until: Day } | null>('deload'))?.until
  const q = dailyQuest({ day, session: await sessionFor(day), readinessScore: readiness?.score ?? null, injured: profile.injuries.flatMap((i) => i.muscles), deload: !!deload && day <= deload, waterMl: t.waterMl, proteinG: t.protein, restPass: !!(await getSetting<Day[]>('restPasses'))?.includes(day) })
  await db.quests.put(q)
  return q
}

/**
 * Bring the game up to date: close every day since the last visit (streak, Elixir, Second Wind, Penalty Zone),
 * then issue today's Daily Quest and maybe an Emergency Quest. Safe to call on every app open.
 */
export async function ensureToday(today: Day = dayOf()) {
  const profile = await db.profile.get('me')
  if (!profile) return null
  let lastClosed = (await getSetting<Day>('lastClosedDay')) ?? addDays(dayOf(profile.createdAt), -1)
  let streak = await getStreak()
  streak.freezes = (await db.inventory.get('elixir'))?.qty ?? 0
  const closing = daysBetween(lastClosed, today) - 1
  for (let i = 0; i < closing; i++) {
    const day = addDays(lastClosed, 1)
    const quiet = i < closing - 1
    if (streak.penalty?.day === day) {
      const pq = await db.quests.get(`penalty-${day}`)
      const readiness = await db.readiness.get(day)
      const res = resolvePenalty(streak, { cleared: pq?.status === 'cleared', waived: (readiness?.score ?? 5) < 2.5 || profile.injuries.length > 0 })
      streak = res.state
      if (pq && pq.status === 'issued') await db.quests.put({ ...pq, status: res.event === 'penalty_failed' ? 'failed' : 'cleared' })
      if (res.event === 'penalty_failed') await say('penalty_failed', { streak: streak.streak, best: streak.best }, { quiet })
    }
    const { closeNutritionDay } = await import('./diet')
    await closeNutritionDay(day)
    const q = (await db.quests.get(`daily-${day}`)) ?? (await issueDaily(day, profile))
    const before = streak.freezes
    const r = closeDay(streak, day, { cleared: q.status === 'cleared', waived: !!q.meta?.waived, restPass: !!(await getSetting<Day[]>('restPasses'))?.includes(day) })
    streak = r.state
    if (streak.freezes < before) {
      await db.inventory.put({ id: 'elixir', qty: streak.freezes })
      await say('freeze_used', {}, { quiet })
    }
    if (r.events.includes('second_wind')) await say('second_wind', {}, { quiet })
    if (r.events.includes('penalty_issued')) {
      await db.quests.put({ ...q, status: 'failed' })
      const pDay = addDays(day, 1)
      await db.quests.put(penaltyQuest(pDay, (await db.player.get('me'))?.level ?? 1))
      await say('penalty_issued', {}, { quiet: pDay !== today })
    }
    if (r.events.includes('milestone')) await say('streak_milestone', { streak: streak.streak }, { quiet })
    lastClosed = day
  }
  await saveStreak(streak)
  await setSetting('lastClosedDay', lastClosed)
  const fresh = !(await db.quests.get(`daily-${today}`))
  const daily = await issueDaily(today, profile)
  if (fresh) await say('daily_issued')
  if (fresh) await maybeIssueEmergency(today, profile)
  // Self-heal quest progress for protein and water: a reload can kill a sync that was still in flight.
  const { syncNutrition } = await import('./diet')
  await syncNutrition(today)
  await refreshPlayer()
  return daily
}

async function maybeIssueEmergency(day: Day, profile: Profile) {
  if (await db.quests.get(`emergency-${day}`)) return
  const ws = weekStart(day)
  const thisWeek = (await db.quests.where('type').equals('emergency').toArray()).filter((q) => q.day >= ws).length
  const now = Date.now()
  const [sets, cardio, exercises] = await Promise.all([db.sets.where('completedAt').above(now - 7 * 864e5).toArray(), db.cardio.where('startedAt').above(now - 7 * 864e5).toArray(), db.exercises.toArray()])
  const rec = recoveryOf([...setHits(sets, new Map(exercises.map((e) => [e.id, e]))), ...cardioHits(cardio)], { now })
  const q = maybeEmergency(day, { daysPlayed: daysBetween(dayOf(profile.createdAt), day), thisWeek, readinessScore: (await db.readiness.get(day))?.score ?? null, injured: profile.injuries.flatMap((i) => i.muscles), recovery: rec, baseClass: baseOf(profile.cls), level: (await db.player.get('me'))?.level ?? 1, seed: profile.createdAt })
  if (q) { await db.quests.put(q); await say('emergency_issued', { title: q.title }) }
}

/** Mark progress on today's Daily Quest; awards the quest XP once when its core clears. */
export async function progressDaily(key: string, value: number, mode: 'set' | 'add' = 'set', day: Day = dayOf()) {
  const q = await db.quests.get(`daily-${day}`)
  if (!q) return null
  const { progress } = await import('@/engine/quests')
  const next = progress(q, key, value, mode)
  await db.quests.put(next)
  if (q.status !== 'cleared' && next.status === 'cleared') {
    await awardMany([{ type: 'daily_quest', refId: day, base: next.reward.xp, gold: next.reward.gold, day }])
    await say('daily_cleared')
  }
  return next
}

/** Spend one unspent point on a stat (cap 60 allocated per stat, game-design §4.3). */
export async function allocatePoint(stat: Stat) {
  await refreshPlayer()
  await db.transaction('rw', db.player, async () => {
    const p = (await db.player.get('me'))!
    if (p.unspent <= 0 || p.allocated[stat] >= 60) return
    await db.player.update('me', { allocated: { ...p.allocated, [stat]: p.allocated[stat] + 1 }, unspent: p.unspent - 1 })
  })
  return refreshPlayer()
}

/** Readiness check-in: stores the score, re-issues today's quest (red readiness swaps to recovery), awards XP once. */
export async function checkIn(r: { sleep: number; soreness: number; energy: number; stress: number }, day: Day = dayOf()) {
  const { readinessScore } = await import('@/engine/recovery')
  const score = readinessScore(r)
  await db.readiness.put({ day, ...r, score, at: Date.now() })
  const q = await db.quests.get(`daily-${day}`)
  const profile = await db.profile.get('me')
  if (q && q.status === 'issued' && profile) {
    await db.quests.delete(q.id)
    const fresh = await issueDaily(day, profile)
    await db.quests.put({ ...fresh, goals: fresh.goals.map((g) => ({ ...g, current: g.key === 'readiness' ? 1 : (q.goals.find((x) => x.key === g.key)?.current ?? g.current) })) })
  }
  await awardMany([{ type: 'readiness', refId: day, base: 15, day }])
  if (score < 2.5) await say('penalty_waived')
  return score
}
