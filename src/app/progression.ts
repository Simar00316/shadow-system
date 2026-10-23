// Progress, Power Level, Rank-Up Trials, Job Change, Dungeons and the Store: services for the M8 screens.
import { db } from '@/db/schema'
import { getSetting, setSetting, uid } from '@/db/repo'
import { addDays, dayOf, weekStart } from '@/engine/dates'
import { e1rm } from '@/engine/strength'
import { bigFour } from '@/engine/plan'
import { powerLevel, type Lift } from '@/engine/powerLevel'
import { nextRank, trialAvailable, trialGoals, trialReady, jobChangeAvailable, jobChangeGoals, monarchAvailable, TRIAL_RETRY_DAYS } from '@/engine/ranks'
import { readinessTier } from '@/engine/recovery'
import { rollLoot } from '@/engine/loot'
import { extract } from '@/engine/shadows'
import { bossResult, endWeek, gateAccess, resolveBoss, startRun, resolveDay, redGateStatus, bossFloorsCrossed, castleScore } from '@/engine/dungeons'
import { canBuy } from '@/engine/loot'
import { BASE_XP } from '@/engine/xp'
import { baseOf } from '@/engine/prescription'
import { PROGRAMS, type Program } from '@/data/programs'
import { itemById } from '@/data/items'
import type { AdvancedClass, Rank, Stat } from '@/engine/types'
import type { Quest, SessionItem } from '@/engine/model'
import { addItem, awardMany, refreshPlayer, spendGold } from './game'
import { buildPlan } from './awakening'
import { recoveryNow, startWorkout } from './training'
import { say } from './notify'

// ---------- Power Level ----------

/** Best conservative e1RM per big-four lift over the last 8 weeks. */
export async function bigFourE1rm(since = Date.now() - 56 * 864e5) {
  const [sets, exercises] = await Promise.all([db.sets.where('completedAt').above(since).toArray(), db.exercises.toArray()])
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const out: Partial<Record<Lift, number>> = {}
  for (const s of sets) {
    const ex = byId.get(s.exerciseId)
    const lift = ex ? bigFour(ex) : null
    const est = s.type !== 'warmup' ? e1rm(s.weightKg, s.reps, s.rir) : null
    if (lift && est && est > (out[lift] ?? 0)) out[lift] = est
  }
  return out
}

/** Recompute the Power Level (game-design §7), store it on the player and in the daily history. */
export async function updatePowerLevel() {
  const profile = await db.profile.get('me')
  if (!profile) return 0
  const now = Date.now()
  const lifts = await bigFourE1rm()
  const e = { ...(profile.experience === 'beginner' ? {} : profile.awakening?.e1rm ?? {}), ...lifts }
  const cardio = await db.cardio.where('startedAt').above(now - 28 * 864e5).toArray()
  const plan = (await db.plans.toArray()).find((p) => p.active)
  const days = plan ? await db.planDays.where('planId').equals(plan.id).count() : profile.trainingDays.length
  const workouts = await db.workouts.where('startedAt').above(now - 56 * 864e5).filter((w) => !!w.endedAt).count()
  const weeksPlayed = Math.max(1, Math.min(8, Math.ceil((now - profile.createdAt) / (7 * 864e5))))
  const pl = powerLevel({ sex: profile.sex, bodyweightKg: profile.weightKg, e1rm: e, awakening: profile.awakening, cardioMinutesPerWeek: cardio.reduce((a, c) => a + c.durationMin, 0) / 4, adherence: now - profile.createdAt < 7 * 864e5 ? undefined : workouts / Math.max(1, days * weeksPlayed) })
  await db.player.update('me', { powerLevel: pl.total })
  const hist = (await getSetting<{ day: string; pl: number }[]>('powerHistory')) ?? []
  const today = dayOf(now)
  await setSetting('powerHistory', [...hist.filter((h) => h.day !== today), { day: today, pl: pl.total }].slice(-400))
  return pl.total
}

// ---------- Rank-Up Trials ----------

export async function trialState() {
  const [player, profile] = await Promise.all(([db.player.get('me'), db.profile.get('me')]))
  if (!player || !profile) return null
  const target = trialAvailable(player.rank, player.level, player.powerLevel)
  const quest = (await db.quests.where('type').equals('rank_trial').toArray()).find((q) => q.status === 'issued')
  const lastFail = (await db.quests.where('type').equals('rank_trial').toArray()).filter((q) => q.status === 'failed').sort((a, b) => b.day.localeCompare(a.day))[0]
  const retryOn = lastFail ? addDays(lastFail.day, TRIAL_RETRY_DAYS) : null
  return { rank: player.rank, next: nextRank(player.rank), target, quest, retryOn, blocked: !!retryOn && dayOf() < retryOn }
}

export async function startTrial(): Promise<Quest | { postponed: true } | null> {
  const s = await trialState()
  const profile = await db.profile.get('me')
  if (!s?.target || s.blocked || !profile) return null
  const rec = await recoveryNow()
  const readiness = await db.readiness.get(dayOf())
  if (!trialReady(Math.min(...Object.values(rec)), readinessTier(readiness?.score))) { await say('trial_postponed'); return { postponed: true } }
  const q: Quest = { id: `trial-${s.target}-${dayOf()}`, day: dayOf(), type: 'rank_trial', title: `${s.target}-Rank Trial`, status: 'issued', expiresAt: Date.now() + 7 * 864e5, goals: trialGoals(s.target, { baseClass: baseOf(profile.cls), awakening: profile.awakening }), reward: { xp: BASE_XP.trial, gold: 1000, points: 5, items: ['legendary'] }, meta: { rank: s.target } }
  await db.quests.put(q)
  await say('trial_available', { rank: s.target })
  return q
}

/** Score goals that the System can measure itself (strength standards from the Power Level engine). */
export async function autoScore(q: Quest) {
  const profile = await db.profile.get('me')
  if (!profile) return q
  const lifts = await bigFourE1rm()
  const { liftScore } = await import('@/engine/powerLevel')
  const scores = (Object.keys(lifts) as Lift[]).map((l) => liftScore(profile.sex, l, lifts[l]!, profile.weightKg)).sort((a, b) => b - a)
  const strength = scores.length ? Math.round(scores.slice(0, q.goals[0]?.key === 'power_strength' && q.goals.length === 1 ? 1 : 2).reduce((a, b) => a + b, 0) / Math.min(scores.length, 2)) : 0
  return { ...q, goals: q.goals.map((g) => (g.key === 'power_strength' || g.key === 'top_set' ? { ...g, current: Math.max(g.current, strength) } : g)) }
}

/** Submit trial results. Pass → rank up, +5 points (via ledger), Legendary loot, Shadow Extraction. Fail → retry in 7 days, nothing lost. */
export async function submitTrial(q: Quest, results: Record<string, number>) {
  const scored = await autoScore({ ...q, goals: q.goals.map((g) => (g.key in results ? { ...g, current: results[g.key] } : g)) })
  const passed = scored.goals.every((g) => g.current >= g.target)
  await db.quests.put({ ...scored, status: passed ? 'cleared' : 'failed' })
  if (!passed) { await say('boss_failed'); return { passed } }
  const rank = q.meta!.rank as Rank
  await db.player.update('me', { rank })
  await awardMany([{ type: 'trial', refId: rank, base: BASE_XP.trial, gold: 1000, meta: { rank } }])
  await grantLoot(`trial:${rank}`, 'legendary')
  const r = extract({ kind: 'trial', toRank: rank }, await db.shadows.toArray(), Date.now(), uid())
  await db.shadows.put(r.shadow)
  await say('rank_up', { rank })
  await say(r.promoted ? 'shadow_promoted' : 'shadow_extracted', { name: r.shadow.name, rank: r.shadow.rank.replace('_', ' ') })
  await updatePowerLevel()
  return { passed, shadowId: r.shadow.id }
}

// ---------- Job Change ----------

export async function jobChangeState() {
  const [player, profile] = await Promise.all([db.player.get('me'), db.profile.get('me')])
  if (!player || !profile) return null
  const quest = await db.quests.get('job_change')
  return { available: jobChangeAvailable(profile.cls, player.level), monarch: monarchAvailable(player.rank) && profile.cls !== 'shadow_monarch', quest, base: baseOf(profile.cls), cls: profile.cls }
}

export async function startJobChange() {
  const s = await jobChangeState()
  if (!s?.available) return null
  const q: Quest = { id: 'job_change', day: dayOf(), type: 'job_change', title: 'Job Change Quest', status: 'issued', expiresAt: Date.now() + 30 * 864e5, goals: jobChangeGoals(s.base), reward: { xp: BASE_XP.jobChange, gold: 0, points: 5 } }
  await db.quests.put(q)
  await say('job_change_available')
  return q
}

export async function completeJobChange(results: Record<string, number>, choice: AdvancedClass) {
  const q = await db.quests.get('job_change')
  if (!q) return false
  const scored = await autoScore({ ...q, goals: q.goals.map((g) => (g.key in results ? { ...g, current: results[g.key] } : g)) })
  const passed = scored.goals.every((g) => g.current >= g.target)
  await db.quests.put({ ...scored, status: passed ? 'cleared' : 'issued' })
  if (!passed) return false
  await changeClass(choice)
  await awardMany([{ type: 'job_change', refId: choice, base: BASE_XP.jobChange }])
  await say('job_change', { cls: choice.replace('_', ' ') })
  return true
}

/** Change class (any time; confirmation happens in the UI). Regenerates targets. */
export async function changeClass(cls: string) {
  const profile = await db.profile.get('me')
  if (!profile) return
  const base = ['fighter', 'tank', 'assassin', 'ranger', 'healer'].includes(cls) ? cls : profile.baseClass
  const next = { ...profile, cls: cls as typeof profile.cls, baseClass: base as typeof profile.baseClass }
  await db.profile.put(next)
  await buildPlan(next)
}

// ---------- Loot helper ----------
export async function grantLoot(refId: string, floor: 'epic' | 'legendary') {
  const p = await refreshPlayer()
  const owned = new Set((await db.inventory.toArray()).filter((i) => i.qty > 0).map((i) => i.id))
  const { drop, pity } = rollLoot(Math.random, p.pity, { owned, elixirs: (await db.inventory.get('elixir'))?.qty ?? 0 }, floor)
  await db.player.update('me', { pity })
  if (drop.item.type !== 'gold') await addItem(drop.item.id, 1)
  await awardMany([{ type: 'loot', refId, base: 0, gold: drop.gold, meta: { item: drop.item.id, rarity: drop.rarity } }], { quiet: true })
  await say(`loot_${drop.rarity}` as 'loot_epic', { item: drop.item.name })
  return drop
}

// ---------- Dungeons ----------

export const programById = new Map(PROGRAMS.map((p) => [p.id, p]))

export async function activeRun() {
  return (await db.dungeons.where('status').equals('active').toArray())[0] ?? null
}

export async function enterGate(programId: string) {
  const program = programById.get(programId)!
  const player = await db.player.get('me')
  if (!player || !gateAccess(program, player.rank).open || (await activeRun())) return null
  const run = startRun(program, Date.now(), uid())
  await db.dungeons.put(run)
  await say(program.red ? 'red_gate_warning' : 'gate_entered', { gate: program.name, rank: program.rank }, { quiet: !!program.red })
  return run
}

export async function abandonGate() {
  const run = await activeRun()
  if (run && !run.red) await db.dungeons.put({ ...run, status: 'abandoned', endedAt: Date.now() })
}

async function itemsFor(program: Program, dayIndex: number): Promise<SessionItem[]> {
  const byName = new Map((await db.exercises.toArray()).map((e) => [e.name.toLowerCase(), e.id]))
  const lifts = await bigFourE1rm(Date.now() - 365 * 864e5)
  const exById = new Map((await db.exercises.toArray()).map((e) => [e.id, e]))
  return resolveDay(program.days[dayIndex % program.days.length], byName).map((e) => {
    const lift = bigFour(exById.get(e.exerciseId)!)
    const load = e.pct && lift && lifts[lift] ? Math.round((lifts[lift]! * e.pct) / 2.5) * 2.5 : null
    return { key: uid(), exerciseId: e.exerciseId, sets: e.sets, repMin: e.reps[0], repMax: e.reps[1], rir: e.rir, loadKg: load, restSec: e.reps[1] <= 6 ? 180 : 90, technique: 'straight' as const }
  })
}

/** Start today's floor session: the next program day in rotation. */
export async function startFloor() {
  const run = await activeRun()
  if (!run) return null
  const program = programById.get(run.programId)!
  const done = await db.workouts.filter((w) => w.dungeonId === run.id && !!w.endedAt).count()
  const items = await itemsFor(program, done)
  const id = await startWorkout({ kind: 'plan', name: `${program.name}: Floor ${run.floor}`, items })
  await db.workouts.update(id, { dungeonId: run.id })
  return id
}

/** Weekly floor advance (called from the weekly check). */
export async function advanceFloors(today = dayOf()) {
  const run = await activeRun()
  if (!run) return
  const program = programById.get(run.programId)!
  const ws = weekStart(addDays(today, -7))
  const done = await db.workouts.filter((w) => w.dungeonId === run.id && !!w.endedAt && w.day >= ws && w.day < weekStart(today)).count()
  const next = endWeek(run, program, done)
  if (next.floorsCleared.length > run.floorsCleared.length) {
    await awardMany([{ type: 'floor', refId: `${run.id}:${run.floor}`, base: BASE_XP.floor, gold: 150 }])
    await say('floor_cleared', { floor: next.floor })
  }
  await db.dungeons.put(next)
  if (program.red) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(dayOf(run.startedAt), i)).filter((d) => d < today)
    const status = redGateStatus(await Promise.all(days.map(async (d) => ({ day: d, cleared: (await db.workouts.filter((w) => w.dungeonId === run.id && w.day === d && !!w.endedAt).count()) > 0, waived: ((await db.readiness.get(d))?.score ?? 5) < 2.5 }))))
    if (status !== 'active') await finishRed(run.id, status === 'cleared')
  }
}

async function finishRed(runId: string, cleared: boolean) {
  const run = (await db.dungeons.get(runId))!
  await db.dungeons.put({ ...run, status: cleared ? 'cleared' : 'failed', endedAt: Date.now() })
  if (cleared) {
    await awardMany([{ type: 'boss', refId: `red:${runId}`, base: 1000, gold: 500 }])
    await grantLoot(`red:${runId}`, 'epic')
    await db.titles.put({ id: 'red_gate_survivor', unlockedAt: Date.now() })
    await say('red_gate_cleared')
  }
}

/** Boss Raid results: every test must pass. Victory = 1,500 XP, 500 gold, Epic+ loot, Shadow Extraction. */
export async function submitBoss(results: Record<string, number>) {
  const run = await activeRun()
  if (!run) return null
  const program = programById.get(run.programId)!
  const baselines = await bigFourE1rm(run.startedAt)
  const exByName = new Map((await db.exercises.toArray()).map((e) => [e.name.toLowerCase(), e]))
  const inputs = program.boss.map((t) => { const ex = exByName.get(t.name.toLowerCase()); const lift = ex ? bigFour(ex) : null; return { test: t, result: results[t.label] ?? 0, baseline: lift ? baselines[lift] : undefined } })
  const r = bossResult(inputs)
  await db.dungeons.put(resolveBoss(run, r.passed, Date.now()))
  if (!r.passed) { await say('boss_failed'); return { ...r } }
  await awardMany([{ type: 'boss', refId: run.id, base: BASE_XP.boss, gold: 500 }])
  await grantLoot(`boss:${run.id}`, 'epic')
  const ex = extract({ kind: 'boss', gateRank: program.rank }, await db.shadows.toArray(), Date.now(), uid())
  await db.shadows.put(ex.shadow)
  await say('boss_cleared', { gate: program.name })
  await say(ex.promoted ? 'shadow_promoted' : 'shadow_extracted', { name: ex.shadow.name, rank: ex.shadow.rank.replace('_', ' ') })
  return { ...r, shadowId: ex.shadow.id }
}

/** Demon Castle: lifetime score and boss floors crossed since the last check (each triggers ARISE). */
export async function castleCheck() {
  const [sets, cardio, workouts] = await Promise.all([db.sets.toArray(), db.cardio.toArray(), db.workouts.filter((w) => !!w.endedAt).count()])
  const score = castleScore({ volumeKg: sets.filter((s) => s.type !== 'warmup').reduce((a, s) => a + s.weightKg * s.reps, 0), cardioKm: cardio.reduce((a, c) => a + (c.distanceKm ?? 0), 0), workouts })
  const before = (await getSetting<number>('castleScore')) ?? 0
  await setSetting('castleScore', score)
  for (const floor of bossFloorsCrossed(before, score)) {
    const r = extract({ kind: 'castle', floor }, await db.shadows.toArray(), Date.now(), uid())
    await db.shadows.put(r.shadow)
    await say('castle_floor', { floor })
    await say('shadow_extracted', { name: r.shadow.name, rank: r.shadow.rank.replace('_', ' ') })
  }
  return score
}

// ---------- Store and inventory ----------

export async function buy(itemId: string) {
  const item = itemById.get(itemId)!
  const p = await refreshPlayer()
  const owned = new Map((await db.inventory.toArray()).map((i) => [i.id, i.qty]))
  const res = canBuy(item, p.gold, owned)
  if (!res.ok) { if (res.reason === 'gold') await say('insufficient_gold'); return res }
  await spendGold(item.price!, `buy:${itemId}:${Date.now()}`)
  await addItem(itemId, 1)
  await say('purchase', { item: item.name })
  return res
}

/** Use a consumable. Rest Day Pass declares tomorrow (or today if no workout is planned and it is still morning). */
export async function consumeItem(itemId: string, opt?: { day?: string; stat?: Stat }) {
  const inv = await db.inventory.get(itemId)
  if (!inv || inv.qty < 1) return false
  if (itemId === 'rest_pass') {
    const day = opt?.day ?? addDays(dayOf(), 1)
    const passes = (await getSetting<string[]>('restPasses')) ?? []
    await setSetting('restPasses', [...new Set([...passes, day])])
  } else if (itemId === 'respec') {
    const p = await refreshPlayer()
    await db.player.put({ ...p, allocated: { str: 0, agi: 0, vit: 0, int: 0, per: 0 } })
  } else if (itemId.startsWith('theme_')) {
    await db.player.update('me', { theme: itemById.get(itemId)?.theme ?? 'system' })
    return true
  } else if (itemId.startsWith('frame_')) {
    await db.player.update('me', { frame: itemId })
    return true
  } else if (itemId === 'elixir' || itemId === 'instant_key') {
    return false // used automatically / from the Train screen
  }
  await db.inventory.put({ id: itemId, qty: inv.qty - 1 })
  await refreshPlayer()
  return true
}

/** One free Rest Day Pass per week (game-design §13), granted on the weekly check. */
export async function weeklyFreebies(today = dayOf()) {
  const ws = weekStart(today)
  if ((await getSetting<string>('freePassWeek')) === ws) return
  await setSetting('freePassWeek', ws)
  const cur = (await db.inventory.get('rest_pass'))?.qty ?? 0
  if (cur < 2) await db.inventory.put({ id: 'rest_pass', qty: cur + 1 })
}

/** Run on every app open (after the day rollover): weekly jobs once per week, Power Level and Demon Castle always. */
export async function maintenance(today = dayOf()) {
  const { weeklyCheck } = await import('./training')
  const ws = weekStart(today)
  if ((await getSetting<string>('maintenanceWeek')) !== ws) {
    await setSetting('maintenanceWeek', ws)
    await weeklyCheck(today)
    await advanceFloors(today)
    await weeklyFreebies(today)
  }
  await updatePowerLevel()
  await castleCheck()
}
