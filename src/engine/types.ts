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
