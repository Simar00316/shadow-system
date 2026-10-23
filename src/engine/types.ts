// Core domain types shared by engines, db and UI.

export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'National'] as const
export type Rank = (typeof RANKS)[number]

export const BASE_CLASSES = ['fighter', 'tank', 'assassin', 'ranger', 'healer'] as const
export type BaseClass = (typeof BASE_CLASSES)[number]
export const ADVANCED_CLASSES = ['knight', 'berserker', 'juggernaut', 'shadow_assassin', 'striker', 'monk', 'shadow_monarch'] as const
export type AdvancedClass = (typeof ADVANCED_CLASSES)[number]
export type ClassId = BaseClass | AdvancedClass

export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const
export type Rarity = (typeof RARITIES)[number]

export const STATS = ['str', 'agi', 'vit', 'int', 'per'] as const
export type Stat = (typeof STATS)[number]

export const MUSCLES = [
  'neck', 'traps', 'chest', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'forearms',
  'abs', 'obliques', 'lats', 'upper_back', 'lower_back', 'glutes', 'hip_flexors', 'quads', 'hamstrings',
  'adductors', 'abductors', 'calves',
] as const
export type Muscle = (typeof MUSCLES)[number]

export const SHADOW_RANKS = ['normal', 'elite', 'knight', 'elite_knight', 'commander', 'marshal', 'grand_marshal'] as const
export type ShadowRank = (typeof SHADOW_RANKS)[number]

export type Sex = 'male' | 'female'
export type Experience = 'beginner' | 'intermediate' | 'advanced'
export type Goal = 'strength' | 'hypertrophy' | 'endurance' | 'mobility' | 'fat_loss' | 'recomp'

export const EQUIPMENT = ['bodyweight', 'dumbbell', 'barbell', 'ez_bar', 'kettlebell', 'cable', 'machine', 'smith_machine', 'bands', 'bench', 'pullup_bar', 'medicine_ball', 'stability_ball', 'foam_roller', 'cardio_machine', 'other'] as const
export type Equipment = (typeof EQUIPMENT)[number]

export const PATTERNS = ['squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'curl', 'extension', 'raise', 'fly', 'crunch', 'rotation', 'carry', 'plyo', 'cardio', 'stretch', 'other'] as const
export type Pattern = (typeof PATTERNS)[number]

export const FORM_LIFTS = ['squat', 'pushup', 'deadlift', 'lunge', 'ohp', 'curl'] as const
export type FormLift = (typeof FORM_LIFTS)[number]

export type Exercise = {
  id: string
  name: string
  aliases: string[]
  primary: Muscle[]
  secondary: Muscle[]
  equipment: Equipment[]
  difficulty: Experience
  mechanics: 'compound' | 'isolation'
  category: string
  force: 'push' | 'pull' | 'static' | null
  classTags: BaseClass[]
  pattern: Pattern
  swapGroup: string
  met: number
  formCheck: FormLift | null
  media: { kind: 'anim' | 'frames'; src: string[]; thumb: string; credit?: string }
  description: string
  instructions: string[]
  tips: string[]
  mistakes: string[]
  /** Common gym lift, preferred by the plan generator. */
  core: boolean
}

export type SetType = 'warmup' | 'working' | 'drop' | 'failure' | 'superset'
