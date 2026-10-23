// Awakening: turn onboarding answers + the Awakening Test into a Player, a plan, targets and reminders (PRD §3).
import { db } from '@/db/schema'
import { seedExercises, setSetting, uid } from '@/db/repo'
import { activityFor } from '@/engine/nutrition'
import { generatePlan } from '@/engine/plan'
import { dayOf } from '@/engine/dates'
import { BASE_XP } from '@/engine/xp'
import type { NotificationPrefs, Profile } from '@/engine/model'
import { awardMany, ensureToday, newPlayer, refreshPlayer } from './game'
import { say } from './notify'
import { revealPower, type AwakeningAnswers } from './awakening-setup'

export { DEFAULT_NOTIFICATIONS, EQUIPMENT_PRESETS, suggestedClass, revealPower, type AwakeningAnswers, type EquipmentPreset } from './awakening-setup'

/** Create everything the System needs. Idempotent: re-running the Awakening replaces profile and plan, keeps the ledger. */
export async function awaken(a: AwakeningAnswers) {
  await seedExercises()
  const now = Date.now()
  const existing = await db.profile.get('me')
  const profile: Profile = {
    id: 'me', name: a.name.trim() || 'Player', sex: a.sex, birthYear: a.birthYear, heightCm: a.heightCm, weightKg: a.weightKg, goal: a.goal, experience: a.experience,
    baseClass: a.baseClass, cls: existing?.cls && existing.baseClass === a.baseClass ? existing.cls : a.baseClass,
    equipmentProfiles: [{ id: 'main', name: a.equipmentName, equipment: a.equipment }], activeEquipmentProfile: 'main',
    injuries: a.injuries.filter((i) => i.muscles.length).map((i) => ({ id: uid(), muscles: i.muscles, note: i.note, since: now })),
    trainingDays: a.trainingDays, sessionMinutes: a.sessionMinutes, activity: activityFor(a.trainingDays.length), dietType: a.dietType, cuisine: a.cuisine, budget: a.budget,
    units: a.units, notifications: a.notifications, awakening: { ...a.test, at: now }, createdAt: existing?.createdAt ?? now,
  }
  const { power, rank } = revealPower(a)
  await db.transaction('rw', [db.profile, db.player, db.measurements, db.plans, db.planDays, db.planExercises, db.notificationSchedule], async () => {
    await db.profile.put(profile)
    const p = (await db.player.get('me')) ?? newPlayer()
    await db.player.put({ ...p, rank: existing ? p.rank : rank, powerLevel: power })
    await db.measurements.put({ id: `weight-${dayOf(now)}`, day: dayOf(now), type: 'weight', value: a.weightKg })
    for (const pl of await db.plans.toArray()) await db.plans.put({ ...pl, active: false })
  })
  await buildPlan(profile)
  await scheduleReminders(profile.notifications)
  await setSetting('awakenedAt', now)
  // Hint for App routing (a device with a Player skips the Awakening gate).
  try { localStorage.setItem('shadow-awakened', '1') } catch { /* storage blocked */ }
  const day = dayOf(now)
  await awardMany([{ type: 'awakening', refId: 'test', base: BASE_XP.awakeningTest, day, category: 'vit' }], { quiet: true })
  await refreshPlayer()
  if (!existing) await say('player_accepted')
  else await say('class_changed', { cls: profile.cls.replace('_', ' ') })
  await ensureToday()
  return { profile, power, rank }
}

/** (Re)generate the active plan from the profile. A manually edited plan is replaced only when the caller confirmed. */
export async function buildPlan(profile: Profile, opts: { week?: number; deload?: boolean } = {}) {
  const exercises = await db.exercises.toArray()
  const prefs = new Map((await db.exercisePrefs.toArray()).map((p) => [p.exerciseId, p.pref]))
  const eq = profile.equipmentProfiles.find((e) => e.id === profile.activeEquipmentProfile)?.equipment ?? ['bodyweight']
  const age = Number(dayOf().slice(0, 4)) - profile.birthYear
  const lifts = profile.experience === 'beginner' ? undefined : profile.awakening?.e1rm
  const result = generatePlan({ experience: profile.experience, cls: profile.cls, sex: profile.sex, age, goal: profile.goal, equipment: eq, injured: profile.injuries.flatMap((i) => i.muscles), trainingDays: profile.trainingDays, sessionMinutes: profile.sessionMinutes, prefs, lifts, week: opts.week, deload: opts.deload }, exercises, () => uid())
  await db.transaction('rw', db.plans, db.planDays, db.planExercises, async () => {
    for (const pl of await db.plans.toArray()) await db.plans.put({ ...pl, active: false })
    await db.plans.put(result.plan)
    await db.planDays.bulkPut(result.days)
    await db.planExercises.bulkPut(result.exercises)
  })
  return result
}

export async function scheduleReminders(n: NotificationPrefs) {
  await db.notificationSchedule.clear()
  const rows = [
    { id: 'workout', kind: 'workout', time: n.workout }, { id: 'readiness', kind: 'readiness', time: n.readiness }, { id: 'calorie', kind: 'calorie_check', time: n.calorieCheck },
    { id: 'streak', kind: 'streak_risk', time: n.streak }, { id: 'penalty', kind: 'daily_warning', time: n.penalty },
    ...n.meals.map((t, i) => ({ id: `meal-${i}`, kind: 'meal', time: t })),
  ]
  const [fh, fm] = n.water.from.split(':').map(Number)
  const [th, tm] = n.water.to.split(':').map(Number)
  for (let m = fh * 60 + fm; m <= th * 60 + tm; m += n.water.everyMin) rows.push({ id: `water-${m}`, kind: 'water', time: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` })
  await db.notificationSchedule.bulkPut(rows.map((r) => ({ ...r, enabled: n.enabled })))
  const { syncSchedule } = await import('./push')
  await syncSchedule().catch(() => false)
}
