// Awakening: turn onboarding answers + the Awakening Test into a Player, a plan, targets and reminders (PRD §3).
import { db } from '@/db/schema'
import { seedExercises, setSetting, uid } from '@/db/repo'
import { activityFor } from '@/engine/nutrition'
import { powerLevel } from '@/engine/powerLevel'
import { startingRank } from '@/engine/ranks'
import { generatePlan } from '@/engine/plan'
import { dayOf } from '@/engine/dates'
import { BASE_XP } from '@/engine/xp'
import type { AwakeningTest, DietType, NotificationPrefs, Profile, Units } from '@/engine/model'
import type { BaseClass, Equipment, Experience, Goal, Muscle, Sex } from '@/engine/types'
import { awardMany, ensureToday, newPlayer, refreshPlayer } from './game'
import { say } from './notify'

export type EquipmentPreset = 'gym' | 'home_dumbbells' | 'bodyweight'
export const EQUIPMENT_PRESETS: Record<EquipmentPreset, { name: string; equipment: Equipment[] }> = {
  gym: { name: 'Full gym', equipment: ['bodyweight', 'dumbbell', 'barbell', 'ez_bar', 'kettlebell', 'cable', 'machine', 'smith_machine', 'bands', 'bench', 'pullup_bar', 'medicine_ball', 'stability_ball', 'foam_roller', 'cardio_machine'] },
  home_dumbbells: { name: 'Home: dumbbells + bench', equipment: ['bodyweight', 'dumbbell', 'bench', 'bands', 'pullup_bar'] },
  bodyweight: { name: 'Bodyweight only', equipment: ['bodyweight'] },
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = { workout: '18:00', water: { from: '09:00', to: '21:00', everyMin: 120 }, meals: ['08:30', '13:30', '20:00'], calorieCheck: '20:30', readiness: '08:00', streak: '20:00', penalty: '21:00', enabled: false }

export type AwakeningAnswers = {
  name: string; sex: Sex; birthYear: number; heightCm: number; weightKg: number; units: Units
  goal: Goal; experience: Experience; equipment: Equipment[]; equipmentName: string; injuries: { muscles: Muscle[]; note: string }[]
  trainingDays: number[]; sessionMinutes: number; dietType: DietType; cuisine: string; budget: boolean; notifications: NotificationPrefs
  test: AwakeningTest; baseClass: BaseClass
}

/** Class suggested by goal (the Player can pick any). */
export const suggestedClass = (goal: Goal): BaseClass => (goal === 'strength' ? 'fighter' : goal === 'hypertrophy' || goal === 'recomp' ? 'tank' : goal === 'endurance' || goal === 'fat_loss' ? 'assassin' : goal === 'mobility' ? 'healer' : 'ranger')

export function revealPower(a: Pick<AwakeningAnswers, 'sex' | 'weightKg' | 'test' | 'experience'>) {
  const pl = powerLevel({ sex: a.sex, bodyweightKg: a.weightKg, e1rm: a.experience === 'beginner' ? {} : a.test.e1rm ?? {}, awakening: a.test, cardioMinutesPerWeek: 0 })
  return { power: pl.total, rank: startingRank(pl.total, a.experience), parts: pl }
}

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
}
