// Plain record types shared by engines (pure) and the Dexie layer (src/db). All weights are stored in kg,
// distances in km, heights in cm, times as epoch ms; days as local 'YYYY-MM-DD' strings.
import type { BaseClass, ClassId, Equipment, Experience, Goal, Muscle, Rank, Rarity, SetType, Sex, ShadowRank, Stat } from './types'

export type Day = string // 'YYYY-MM-DD' local
export type DietType = 'vegetarian' | 'nonveg' | 'vegan' | 'eggetarian'
export type Units = { lift: 'kg' | 'lb'; body: 'kg' | 'lb'; distance: 'km' | 'mi'; height: 'cm' | 'in' }

export type Injury = { id: string; muscles: Muscle[]; note: string; since: number }
export type EquipmentProfile = { id: string; name: string; equipment: Equipment[] }

export type AwakeningTest = { pushups: number; squats60s: number; plankSec: number; e1rm?: Partial<Record<'squat' | 'bench' | 'deadlift' | 'ohp', number>>; at: number }

export type NotificationPrefs = { workout: string; water: { from: string; to: string; everyMin: number }; meals: string[]; calorieCheck: string; readiness: string; streak: string; penalty: string; enabled: boolean }

export type Profile = {
  id: 'me'
  name: string
  sex: Sex
  birthYear: number
  heightCm: number
  weightKg: number
  goal: Goal
  experience: Experience
  baseClass: BaseClass
  cls: ClassId
  equipmentProfiles: EquipmentProfile[]
  activeEquipmentProfile: string
  injuries: Injury[]
  /** Weekdays the Player trains, 0 = Sunday. */
  trainingDays: number[]
  sessionMinutes: number
  activity: number
  dietType: DietType
  cuisine: string
  budget: boolean
  units: Units
  notifications: NotificationPrefs
  awakening?: AwakeningTest
  createdAt: number
}

export type ExercisePref = { exerciseId: string; pref: 'more' | 'less' | 'never' }

export type Plan = { id: string; createdAt: number; split: string; source: 'generated' | 'program'; programId?: string; active: boolean; edited: boolean; week: number }
export type PlanDay = { id: string; planId: string; order: number; weekday: number; name: string; focus: Muscle[]; dayType?: 'heavy' | 'medium' | 'light' }
export type PlanExercise = {
  id: string; planDayId: string; order: number; exerciseId: string
  sets: number; repMin: number; repMax: number; rir: number; loadKg: number | null; restSec: number
  /** Exercises sharing a group run as a superset/circuit. */
  group?: string; technique?: 'straight' | 'drop' | 'cluster' | 'myo' | 'emom' | 'top_backoff' | 'hold'
  holdSec?: number; edited: boolean
  /** Class rep ceiling before a rep extension (progression engine). */
  baseRepMax?: number
}

export type WorkoutSummary = { xp: number; gold: number; levelBefore: number; levelAfter: number; prs: { exerciseId: string; e1rm: number }[]; loot?: { itemId: string; rarity: Rarity; gold: number }; shadow?: { id: string; name: string; rank: ShadowRank; promoted: boolean }; stats: Partial<Record<Stat, number>>; titles: string[]; sets: number; volumeKg: number; durationMin: number }
export type Workout = { id: string; startedAt: number; endedAt?: number; day: Day; planDayId?: string; dungeonId?: string; kind: 'plan' | 'free' | 'instant' | 'trial' | 'boss' | 'penalty' | 'recovery'; notes?: string; name?: string; summary?: WorkoutSummary; recoveryAtStart?: Partial<Record<Muscle, number>>; items?: SessionItem[] }
export type SessionItem = { key: string; planExerciseId?: string; exerciseId: string; sets: number; repMin: number; repMax: number; rir: number; loadKg: number | null; restSec: number; holdSec?: number; group?: string; technique?: PlanExercise['technique'] }
export type SetLog = {
  id: string; workoutId: string; exerciseId: string; order: number; setIndex: number; type: SetType
  weightKg: number; reps: number; rir: number | null; rpe?: number | null; holdSec?: number
  notes?: string; restSec?: number; formScore?: number; group?: string; completedAt: number
}
export type CardioLog = {
  id: string; startedAt: number; day: Day; activity: string; machine?: string; durationMin: number; distanceKm?: number
  level?: number; paceSecPerKm?: number; watts?: number; intervals?: { workSec: number; restSec: number; rounds: number }; hiit?: boolean; met: number; kcal: number; notes?: string
}

export type RecoveryOverride = { id: string; muscle: Muscle; value: number; at: number }
export type Readiness = { day: Day; sleep: number; soreness: number; energy: number; stress: number; score: number; at: number }

export type Food = { id: string; name: string; k: number; p: number; c: number; f: number; fi: number; barcode?: string; brand?: string; src: string; unit?: Record<string, number>; diet?: DietType | 'vegan' }
export type MealItem = { ref: string; name: string; grams: number; k: number; p: number; c: number; f: number }
export type SavedMeal = { id: string; name: string; items: MealItem[] }
export type MealLog = { id: string; day: Day; meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'; items: MealItem[]; at: number }
export type WaterLog = { id: string; day: Day; ml: number; at: number }

export type Measurement = { id: string; day: Day; type: 'weight' | 'waist' | 'chest' | 'hips' | 'arm' | 'thigh' | 'neck' | 'bodyfat'; value: number }
export type Photo = { id: string; day: Day; pose: 'front' | 'side' | 'back'; blob: Blob; note?: string }

export type XpEventType =
  | 'set' | 'workout' | 'daily_quest' | 'pr' | 'readiness' | 'meal' | 'calorie_target' | 'protein_target' | 'water_target'
  | 'cardio' | 'form_rep' | 'floor' | 'streak_milestone' | 'emergency' | 'hidden' | 'boss' | 'trial' | 'job_change'
  | 'awakening' | 'instant' | 'recovery' | 'correction' | 'gold' | 'purchase' | 'loot'
export type XpEvent = { id: string; ts: number; day: Day; type: XpEventType; refId: string; base: number; mult: number; xp: number; gold: number; category: Stat; meta?: Record<string, unknown> }

export type Player = {
  id: 'me'
  level: number; xp: number; totalXp: number; rank: Rank; powerLevel: number
  stats: Record<Stat, number>; allocated: Record<Stat, number>; unspent: number
  gold: number; streak: number; bestStreak: number; activeDays: number
  title?: string; equippedShadows: string[]; theme: string; frame?: string
  pity: { rare: number; epic: number; legendary: number }
  secondWindAt?: number
  updatedAt: number
}

export type QuestType = 'daily' | 'penalty' | 'emergency' | 'hidden' | 'job_change' | 'rank_trial' | 'red_gate' | 'instant'
export type QuestGoalRec = { key: string; label: string; target: number; current: number; unit?: string; core?: boolean }
export type Quest = { id: string; day: Day; type: QuestType; title: string; status: 'issued' | 'cleared' | 'failed' | 'waived'; goals: QuestGoalRec[]; expiresAt: number; reward: { xp: number; gold: number; points?: number; items?: string[] }; penalty?: string; meta?: Record<string, unknown> }

export type DungeonRun = { id: string; programId: string; status: 'active' | 'cleared' | 'failed' | 'abandoned'; startedAt: number; floor: number; floorsCleared: number[]; bossAttempts: number; red?: boolean; endedAt?: number }
export type ShadowRec = { id: string; catalogId: string; name: string; rank: ShadowRank; obtainedAt: number; source: string }
export type TitleRec = { id: string; unlockedAt: number }
export type InventoryRec = { id: string; qty: number; rarity?: Rarity }
export type SystemMessage = { id: string; at: number; kind: 'info' | 'success' | 'warning' | 'reward' | 'shadow'; text: string; event?: string }
export type Setting = { key: string; value: unknown }
export type ScheduledReminder = { id: string; kind: string; time: string; enabled: boolean }

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
/** Bundled ingredient, nutrients per 100 g (src/data/ingredients.json). */
export type Ingredient = { id: string; n: string; al: string[]; g: string; k: number; p: number; c: number; f: number; fi: number; diet: DietType; tier: 1 | 2 | 3; unit: Record<string, number>; src: string }
/** Bundled dish, nutrients per serving (src/data/dishes.json). */
export type Dish = { id: string; name: string; cuisine: string; meal: MealSlot[]; diet: DietType; servings: number; grams: number; kcal: number; p: number; c: number; f: number; fi: number; tier: 1 | 2 | 3; ingredients: [string, number][]; tags: string[] }
