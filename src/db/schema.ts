// Dexie schema (PRD B2). Every schema change adds a new `this.version(n)` with an upgrade and a test in schema.test.ts.
import Dexie, { type Table } from 'dexie'
import type {
  CardioLog, DungeonRun, ExercisePref, Food, InventoryRec, MealLog, Measurement, Photo, Plan, PlanDay, PlanExercise, Player, Profile, Quest,
  Readiness, RecoveryOverride, SavedMeal, ScheduledReminder, Setting, SetLog, ShadowRec, SystemMessage, TitleRec, WaterLog, Workout, XpEvent,
} from '@/engine/model'
import type { Exercise } from '@/engine/types'

export const DB_NAME = 'shadow-system'

export class ShadowDB extends Dexie {
  profile!: Table<Profile, string>
  exercises!: Table<Exercise, string>
  exercisePrefs!: Table<ExercisePref, string>
  plans!: Table<Plan, string>
  planDays!: Table<PlanDay, string>
  planExercises!: Table<PlanExercise, string>
  workouts!: Table<Workout, string>
  sets!: Table<SetLog, string>
  cardio!: Table<CardioLog, string>
  recovery!: Table<RecoveryOverride, string>
  readiness!: Table<Readiness, string>
  foods!: Table<Food, string>
  meals!: Table<SavedMeal, string>
  mealLogs!: Table<MealLog, string>
  water!: Table<WaterLog, string>
  measurements!: Table<Measurement, string>
  photos!: Table<Photo, string>
  player!: Table<Player, string>
  xpEvents!: Table<XpEvent, string>
  quests!: Table<Quest, string>
  dungeons!: Table<DungeonRun, string>
  shadows!: Table<ShadowRec, string>
  titles!: Table<TitleRec, string>
  inventory!: Table<InventoryRec, string>
  systemMessages!: Table<SystemMessage, string>
  settings!: Table<Setting, string>
  notificationSchedule!: Table<ScheduledReminder, string>

  constructor(name = DB_NAME) {
    super(name)
    this.version(1).stores({
      profile: 'id',
      exercises: 'id, name, *primary, *equipment, pattern, swapGroup, difficulty, core',
      exercisePrefs: 'exerciseId, pref',
      plans: 'id, active, createdAt',
      planDays: 'id, planId, [planId+order]',
      planExercises: 'id, planDayId, [planDayId+order], exerciseId',
      workouts: 'id, startedAt, day, planDayId, kind',
      sets: 'id, workoutId, exerciseId, completedAt, [exerciseId+completedAt]',
      cardio: 'id, startedAt, day',
      recovery: 'id, muscle, at',
      readiness: 'day',
      foods: 'id, name, barcode, src',
      meals: 'id, name',
      mealLogs: 'id, day, meal',
      water: 'id, day',
      measurements: 'id, day, type, [type+day]',
      photos: 'id, day, pose',
      player: 'id',
      xpEvents: 'id, ts, day, type, refId, &[type+refId]',
      quests: 'id, day, type, status',
      dungeons: 'id, programId, status',
      shadows: 'id, catalogId, rank',
      titles: 'id',
      inventory: 'id',
      systemMessages: 'id, at, kind',
      settings: 'key',
      notificationSchedule: 'id, kind',
    })
    // v2: index meal logs by time for "recent foods" (issue #107). Index-only change; no data rewrite needed.
    this.version(2).stores({ mealLogs: 'id, day, meal, at' })
  }
}

export const db = new ShadowDB()

/** Ask the browser not to evict our data (R7 §2). Safe to call on every launch. */
export async function requestPersistence() {
  try { return (await navigator.storage?.persist?.()) ?? false } catch { return false }
}
