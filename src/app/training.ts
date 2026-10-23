// Training service: sessions, set logging with safety-gated XP, PR detection, progression, loot and ARISE.
import { db } from '@/db/schema'
import { getSetting, setSetting, uid } from '@/db/repo'
import { addDays, dayOf, daysBetween, weekStart } from '@/engine/dates'
import { e1rm } from '@/engine/strength'
import { capFor, hardSetCredit } from '@/engine/safety'
import { cardioHits, readinessTier, recovery as recoveryOf, setHits } from '@/engine/recovery'
import { baseOf, prescribe } from '@/engine/prescription'
import { bestE1rm, deloadDue, deloadTarget, exposuresSince, nextTarget, stallCount, type Exposure } from '@/engine/progression'
import { bigFour } from '@/engine/plan'
import { BASE_XP, MAX_PR_PER_SESSION, setXp } from '@/engine/xp'
import { rollLoot } from '@/engine/loot'
import { extract } from '@/engine/shadows'
import { itemById } from '@/data/items'
import { INSTANT_DUNGEONS } from '@/data/programs'
import type { Exercise, Muscle } from '@/engine/types'
import type { SessionItem, SetLog, Workout, WorkoutSummary } from '@/engine/model'
import { addItem, awardMany, progressDaily, refreshPlayer } from './game'
import { say } from './notify'

const exMap = async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e]))

export async function recoveryNow(now = Date.now()) {
  const since = now - 10 * 864e5
  const [sets, cardio, byId, overrides, readiness, profile] = await Promise.all([db.sets.where('completedAt').above(since).toArray(), db.cardio.where('startedAt').above(since).toArray(), exMap(), db.recovery.toArray(), db.readiness.get(dayOf(now)), db.profile.get('me')])
  const age = profile ? Number(dayOf(now).slice(0, 4)) - profile.birthYear : 30
  return recoveryOf([...setHits(sets, byId), ...cardioHits(cardio)], { now, age, overrides, readiness: readiness ?? null, injured: profile?.injuries.flatMap((i) => i.muscles) ?? [] })
}

/** Today's targets for a plan day, with deload and yellow-readiness adjustments applied. */
export async function itemsForPlanDay(planDayId: string): Promise<SessionItem[]> {
  const pes = await db.planExercises.where('planDayId').equals(planDayId).sortBy('order')
  const deload = (await getSetting<{ until: string } | null>('deload'))?.until
  const inDeload = !!deload && dayOf() <= deload
  const tier = readinessTier((await db.readiness.get(dayOf()))?.score)
  const byId = await exMap()
  return pes.map((pe) => {
    const ex = byId.get(pe.exerciseId)
    let t = { sets: pe.sets, repMin: pe.repMin, repMax: pe.repMax, rir: pe.rir, loadKg: pe.loadKg, restSec: pe.restSec, holdSec: pe.holdSec }
    if (inDeload) { const d = deloadTarget({ ...t, loadKg: t.loadKg ?? 0 }, ex?.mechanics === 'compound'); t = { ...t, ...d, loadKg: pe.loadKg == null ? null : d.loadKg } }
    else if (tier === 'yellow') t = { ...t, sets: Math.max(1, Math.round(t.sets * 0.8)), rir: t.rir + 1 }
    return { key: pe.id, planExerciseId: pe.id, exerciseId: pe.exerciseId, group: pe.group, technique: pe.technique, ...t }
  })
}

/** Ad-hoc item for an exercise outside the plan, using the class prescription. */
export async function freeItem(exerciseId: string): Promise<SessionItem> {
  const [ex, profile] = await Promise.all([db.exercises.get(exerciseId), db.profile.get('me')])
  const rx = prescribe(ex!, { cls: profile!.cls, experience: profile!.experience, sex: profile!.sex })
  const last = await lastWorkingSets(exerciseId)
  return { key: uid(), exerciseId, sets: rx.sets, repMin: rx.repMin, repMax: rx.repMax, rir: rx.rir, loadKg: last[0]?.weightKg ?? null, restSec: rx.restSec, holdSec: rx.holdSec }
}

export async function startWorkout(opts: { planDayId?: string; kind?: Workout['kind']; name?: string; items?: SessionItem[] } = {}): Promise<string> {
  const open = (await db.workouts.toArray()).find((w) => !w.endedAt && w.kind !== 'recovery')
  if (open) return open.id
  const items = opts.items ?? (opts.planDayId ? await itemsForPlanDay(opts.planDayId) : [])
  const pd = opts.planDayId ? await db.planDays.get(opts.planDayId) : undefined
  const w: Workout = { id: uid(), startedAt: Date.now(), day: dayOf(), planDayId: opts.planDayId, kind: opts.kind ?? (opts.planDayId ? 'plan' : 'free'), name: opts.name ?? pd?.name ?? 'Free session', items, recoveryAtStart: await recoveryNow() }
  await db.workouts.add(w)
  return w.id
}

export const activeWorkout = async () => (await db.workouts.toArray()).find((w) => !w.endedAt && w.kind !== 'recovery')

export async function updateItems(workoutId: string, items: SessionItem[]) {
  await db.workouts.update(workoutId, { items })
}

/** Most recent working sets for an exercise (prefill "last time"). */
export async function lastWorkingSets(exerciseId: string, beforeWorkout?: string) {
  const sets = (await db.sets.where('exerciseId').equals(exerciseId).toArray()).filter((s) => s.type !== 'warmup' && s.workoutId !== beforeWorkout)
  if (!sets.length) return []
  const lastWid = sets.sort((a, b) => b.completedAt - a.completedAt)[0].workoutId
  return sets.filter((s) => s.workoutId === lastWid).sort((a, b) => a.setIndex - b.setIndex)
}

export async function bestE1rmBefore(exerciseId: string, before: number) {
  const sets = await db.sets.where('exerciseId').equals(exerciseId).filter((s) => s.completedAt < before && s.type !== 'warmup').toArray()
  return Math.max(0, ...sets.map((s) => e1rm(s.weightKg, s.reps, s.rir) ?? 0))
}

export type LogResult = { set: SetLog; xp: number; pr: { e1rm: number; previous: number; major: boolean; lift: string | null } | null; gated: Muscle | null }

/** Log one set. XP is zero past the weekly safe cap, past 12 sets/muscle/session, or below 30% recovery at session start. */
export async function logSet(workoutId: string, s: Omit<SetLog, 'id' | 'workoutId' | 'completedAt'>): Promise<LogResult> {
  const w = (await db.workouts.get(workoutId))!
  const now = Date.now()
  const set: SetLog = { ...s, id: uid(), workoutId, completedAt: now }
  const [ex, profile] = await Promise.all([db.exercises.get(s.exerciseId), db.profile.get('me')])
  // volume before this set, rolling 7 days
  const week = await db.sets.where('completedAt').above(now - 7 * 864e5).toArray()
  const byId = await exMap()
  const volume = (m: Muscle, list: SetLog[]) => list.reduce((a, x) => { if (x.type === 'warmup') return a; const e = byId.get(x.exerciseId); if (!e) return a; const c = hardSetCredit(x.rir); return a + (e.primary.includes(m) ? c : e.secondary.includes(m) ? c * 0.5 : 0) }, 0)
  const exp = profile?.experience ?? 'beginner'
  const age = profile ? Number(dayOf().slice(0, 4)) - profile.birthYear : 30
  const overCap = ex?.primary.find((m) => volume(m, week) >= capFor(m, exp, age)) ?? null
  const overSession = ex?.primary.find((m) => volume(m, week.filter((x) => x.workoutId === workoutId)) >= 12) ?? null
  const lowRec = ex?.primary.find((m) => (w.recoveryAtStart?.[m] ?? 100) < 30) ?? null
  await db.sets.add(set)
  const base = setXp(set, { overCap: !!overCap, overSessionCap: !!overSession, recoveryAtStart: lowRec ? 0 : 100 })
  const gated = overCap ?? overSession ?? lowRec
  if (gated && s.type !== 'warmup') {
    const warned = (await getSetting<string[]>(`warned:${workoutId}`)) ?? []
    if (!warned.includes(gated)) {
      await setSetting(`warned:${workoutId}`, [...warned, gated])
      await say(lowRec ? 'low_recovery' : 'set_over_cap', { muscle: gated.replace('_', ' '), pct: Math.round(w.recoveryAtStart?.[gated] ?? 0) })
    }
  }
  const sum = await awardMany([{ type: 'set', refId: set.id, base, day: w.day }], { quiet: true })
  // PR: conservative e1RM beats the previous best for this exercise
  let pr: LogResult['pr'] = null
  const est = s.type === 'warmup' ? null : e1rm(s.weightKg, s.reps, s.rir)
  if (est && ex) {
    const prev = await bestE1rmBefore(s.exerciseId, w.startedAt)
    const thisSession = Math.max(0, ...(await db.sets.where('workoutId').equals(workoutId).filter((x) => x.exerciseId === s.exerciseId && x.id !== set.id).toArray()).map((x) => e1rm(x.weightKg, x.reps, x.rir) ?? 0))
    if (prev > 0 && est > prev && est > thisSession) {
      const lift = bigFour(ex)
      pr = { e1rm: est, previous: prev, major: !!lift && est >= prev * 1.05, lift }
      const prsSoFar = await db.xpEvents.where('type').equals('pr').filter((e) => e.refId.startsWith(`${workoutId}:`)).count()
      if (prsSoFar < MAX_PR_PER_SESSION) await awardMany([{ type: 'pr', refId: `${workoutId}:${s.exerciseId}`, base: BASE_XP.pr, gold: 25, day: w.day, meta: { lift, e1rm: est } }], { quiet: true })
      await say('pr', { exercise: ex.name, value: `${Math.round(est)} kg e1RM` })
    }
  }
  return { set, xp: sum.xp, pr, gated: s.type === 'warmup' ? null : gated }
}

/** Undo a logged set: remove it and append a correction for its XP (never a penalty). */
export async function undoSet(setId: string) {
  const ev = await db.xpEvents.where('[type+refId]').equals(['set', setId]).first()
  await db.sets.delete(setId)
  if (ev && ev.xp) await awardMany([{ type: 'correction', refId: `undo:${setId}`, base: -ev.xp, day: ev.day }], { quiet: true })
}

/** Finish a workout: workout XP, daily quest, progression, loot, Shadow Extraction. Returns the summary. */
export async function finishWorkout(workoutId: string): Promise<WorkoutSummary> {
  const w = (await db.workouts.get(workoutId))!
  if (w.summary) return w.summary
  const playerBefore = await refreshPlayer()
  const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
  const working = sets.filter((s) => s.type !== 'warmup')
  const planned = (w.items ?? []).reduce((a, i) => a + i.sets, 0)
  const now = Date.now()
  await db.workouts.update(workoutId, { endedAt: now })
  const completed = planned ? working.length >= planned * 0.8 : working.length >= 8
  const awards = []
  if (completed) awards.push({ type: 'workout' as const, refId: w.day, base: BASE_XP.workout, gold: 50, day: w.day })
  if (w.kind === 'instant' && working.length) awards.push({ type: 'instant' as const, refId: w.day, base: BASE_XP.instant, day: w.day })
  const summary1 = await awardMany(awards)
  if (working.length) { await progressDaily('session', 1); await progressDaily('recovery', 1) }

  // progression for plan exercises (skipped during a Recovery Phase)
  const deload = (await getSetting<{ until: string } | null>('deload'))?.until
  if (!(deload && w.day <= deload)) await progress(w, sets)

  // loot: once per day for a completed workout
  let loot: WorkoutSummary['loot']
  if (completed && !(await db.xpEvents.where('[type+refId]').equals(['loot', w.day]).count())) {
    const p = await refreshPlayer()
    const owned = new Set((await db.inventory.toArray()).filter((i) => i.qty > 0).map((i) => i.id))
    const { drop, pity } = rollLoot(Math.random, p.pity, { owned, elixirs: (await db.inventory.get('elixir'))?.qty ?? 0 })
    await db.player.update('me', { pity })
    if (drop.item.type !== 'gold') await addItem(drop.item.id, 1)
    await awardMany([{ type: 'loot', refId: w.day, base: 0, gold: drop.gold, day: w.day, meta: { item: drop.item.id, rarity: drop.rarity } }], { quiet: true })
    loot = { itemId: drop.item.id, rarity: drop.rarity, gold: drop.gold }
    await say(`loot_${drop.rarity}` as 'loot_common', { item: drop.item.name }, { quiet: true })
  }

  // Shadow Extraction on a major PR
  let shadow: WorkoutSummary['shadow']
  const prEvents = await db.xpEvents.where('type').equals('pr').filter((e) => e.refId.startsWith(`${workoutId}:`)).toArray()
  const prs = prEvents.map((e) => ({ exerciseId: e.refId.split(':')[1], e1rm: Number(e.meta?.e1rm ?? 0) }))
  for (const e of prEvents) {
    const lift = e.meta?.lift as string | null
    const prev = await bestE1rmBefore(e.refId.split(':')[1], w.startedAt)
    if (lift && Number(e.meta?.e1rm) >= prev * 1.05) {
      const r = extract({ kind: 'pr', lift: lift as 'squat', main: true }, await db.shadows.toArray(), now, uid())
      await db.shadows.put(r.shadow)
      shadow = { id: r.shadow.id, name: r.shadow.name, rank: r.shadow.rank, promoted: r.promoted }
      await say(r.promoted ? 'shadow_promoted' : 'shadow_extracted', { name: r.shadow.name, rank: r.shadow.rank.replace('_', ' ') }, { quiet: true })
      break
    }
  }

  const after = await refreshPlayer()
  const stats = Object.fromEntries((Object.keys(after.stats) as (keyof typeof after.stats)[]).map((k) => [k, after.stats[k] - playerBefore.stats[k]]).filter(([, v]) => (v as number) > 0))
  const xp = (await db.xpEvents.where('day').equals(w.day).filter((e) => e.ts >= w.startedAt).toArray()).reduce((a, e) => a + e.xp, 0)
  const summary: WorkoutSummary = {
    xp, gold: after.gold - playerBefore.gold, levelBefore: playerBefore.level, levelAfter: after.level, prs, loot, shadow, stats, titles: summary1.newTitles,
    sets: working.length, volumeKg: Math.round(working.reduce((a, s) => a + s.weightKg * s.reps, 0)), durationMin: Math.round((now - w.startedAt) / 60000),
  }
  await db.workouts.update(workoutId, { summary })
  const { updatePowerLevel, castleCheck } = await import('./progression')
  await updatePowerLevel()
  await castleCheck()
  await say('workout_complete', { xp }, { quiet: true })
  return summary
}

async function exposures(exerciseId: string): Promise<Exposure[]> {
  const sets = (await db.sets.where('exerciseId').equals(exerciseId).toArray()).filter((s) => s.type !== 'warmup')
  const byW = new Map<string, SetLog[]>()
  for (const s of sets) byW.set(s.workoutId, [...(byW.get(s.workoutId) ?? []), s])
  return [...byW.values()].map((l) => ({ at: Math.min(...l.map((s) => s.completedAt)), sets: l.sort((a, b) => a.setIndex - b.setIndex).map((s) => ({ weightKg: s.weightKg, reps: s.reps, rir: s.rir })) })).sort((a, b) => a.at - b.at)
}

async function progress(w: Workout, sets: SetLog[]) {
  const profile = await db.profile.get('me')
  if (!profile) return
  const day = w.planDayId ? await db.planDays.get(w.planDayId) : undefined
  for (const item of w.items ?? []) {
    if (!item.planExerciseId || !sets.some((s) => s.exerciseId === item.exerciseId)) continue
    const pe = await db.planExercises.get(item.planExerciseId)
    const ex = await db.exercises.get(item.exerciseId)
    if (!pe || !ex) continue
    const hist = await exposures(item.exerciseId)
    const heaviest = Math.max(0, ...sets.filter((s) => s.exerciseId === item.exerciseId && s.type !== 'warmup').map((s) => s.weightKg))
    const current = { loadKg: pe.loadKg ?? heaviest, repMin: pe.repMin, repMax: pe.repMax, rir: pe.rir, sets: pe.sets, restSec: pe.restSec, holdSec: pe.holdSec, baseRepMax: pe.baseRepMax }
    const rx = prescribe(ex, { cls: profile.cls, experience: profile.experience, dayType: day?.dayType })
    const next = nextTarget(ex, current, hist, { model: rx.model, experience: profile.experience, unit: profile.units.lift })
    await db.planExercises.update(pe.id, { loadKg: next.loadKg || null, repMax: next.repMax, restSec: next.restSec, holdSec: next.holdSec, baseRepMax: next.baseRepMax })
    if (next.plateau) await say('plateau', { exercise: ex.name }, { quiet: true })
  }
}

/** Weekly check (on the first open of a new week): scheduled or reactive Recovery Phase. */
export async function weeklyCheck(today = dayOf()) {
  const ws = weekStart(today)
  if ((await getSetting<string>('weeklyCheck')) === ws) return null
  await setSetting('weeklyCheck', ws)
  const profile = await db.profile.get('me')
  const plan = (await db.plans.toArray()).find((p) => p.active)
  if (!profile || !plan) return null
  const lastDeload = (await getSetting<string>('lastDeload')) ?? dayOf(profile.createdAt)
  const weeksSince = Math.floor(daysBetween(lastDeload, today) / 7)
  const sinceTs = new Date(lastDeload).getTime()
  const pes = await db.planExercises.toArray()
  const hists = await Promise.all([...new Set(pes.map((p) => p.exerciseId))].map(async (id) => exposuresSince(await exposures(id), sinceTs)))
  const drops = hists.map((h) => { if (h.length < 3) return 0; const best = Math.max(...h.slice(0, -2).map(bestE1rm)); const recent = Math.max(...h.slice(-2).map(bestE1rm)); return best ? Math.max(0, (best - recent) / best) : 0 })
  const readiness7 = (await db.readiness.where('day').between(addDays(today, -7), today).toArray()).map((r) => r.score)
  const d = deloadDue({ experience: profile.experience, weeksSinceDeload: weeksSince, liftDrops: drops, readiness7, stalledLifts: hists.filter((h) => stallCount(h) >= 3).length })
  await db.plans.update(plan.id, { week: plan.week + 1 })
  if (!d.due || weeksSince < 1) return null
  await setSetting('deload', { until: addDays(today, 6), reason: d.reason })
  await setSetting('lastDeload', today)
  await say('deload_start')
  return d.reason
}

/** The Player asks for a Recovery Phase ("I feel beat up"). */
export async function requestDeload() {
  const today = dayOf()
  await setSetting('deload', { until: addDays(today, 6), reason: 'player_request' })
  await setSetting('lastDeload', today)
  await say('deload_start')
}

export function instantItems(index: number, byName: Map<string, Exercise>): SessionItem[] {
  return INSTANT_DUNGEONS[index].exercises.map((e) => ({ key: uid(), exerciseId: byName.get(e.name.toLowerCase())!.id, sets: e.sets, repMin: e.reps[0], repMax: e.reps[1], rir: e.rir, loadKg: null, restSec: 60 }))
}

/** Open an Instant Dungeon with a key (game-design §9). */
export async function openInstant(index: number) {
  const key = await db.inventory.get('instant_key')
  if (!key || key.qty < 1) return null
  const byName = new Map((await db.exercises.toArray()).map((e) => [e.name.toLowerCase(), e]))
  await db.inventory.put({ id: 'instant_key', qty: key.qty - 1 })
  return startWorkout({ kind: 'instant', name: INSTANT_DUNGEONS[index].name, items: instantItems(index, byName) })
}

export const itemName = (id: string) => itemById.get(id)?.name ?? id
export const isLowRecovery = (rec: Partial<Record<Muscle, number>>, ex: Exercise) => ex.primary.some((m) => (rec[m] ?? 100) < 30)
export const baseClassOf = baseOf

/** Log a cardio session: kcal from MET, XP, recovery impact, and it counts as the rest-day quest. */
export async function logCardio(c: { activity: string; label: string; met: number; durationMin: number; distanceKm?: number; level?: number; watts?: number; paceSecPerKm?: number; intervals?: { workSec: number; restSec: number; rounds: number }; hiit?: boolean; notes?: string }) {
  const { cardioKcal } = await import('@/engine/cardio')
  const { cardioXp } = await import('@/engine/xp')
  const profile = await db.profile.get('me')
  const now = Date.now()
  const rec = { id: uid(), startedAt: now, day: dayOf(now), activity: c.label, machine: c.activity, durationMin: c.durationMin, distanceKm: c.distanceKm, level: c.level, watts: c.watts, paceSecPerKm: c.paceSecPerKm, intervals: c.intervals, hiit: c.hiit, met: c.met, kcal: cardioKcal(c.met, profile?.weightKg ?? 75, c.durationMin), notes: c.notes }
  await db.cardio.add(rec)
  await awardMany([{ type: 'cardio', refId: rec.id, base: cardioXp(c.durationMin), day: rec.day }])
  if (c.durationMin >= 10) await progressDaily('recovery', 1)
  const pq = await db.quests.get(`penalty-${rec.day}`)
  if (pq && pq.status === 'issued') {
    const { progress } = await import('@/engine/quests')
    const next = progress(pq, 'conditioning', c.durationMin, 'add')
    await db.quests.put(next)
    if (next.status === 'cleared') await say('penalty_cleared', { streak: (await refreshPlayer()).streak })
  }
  return rec
}
