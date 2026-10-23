// Test helpers: the real bundled data, loaded once (tests only).
import { readFileSync } from 'node:fs'
import type { Exercise } from './types'
import type { Dish, Ingredient } from './model'

const load = <T,>(f: string) => JSON.parse(readFileSync(f, 'utf8')) as T
export const EXERCISES = load<Exercise[]>('src/data/exercises.json')
export const EX_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))
export const DISHES = load<Dish[]>('src/data/dishes.json')
export const INGREDIENTS = new Map(load<Ingredient[]>('src/data/ingredients.json').map((i) => [i.id, i]))
export const FULL_GYM = ['bodyweight', 'dumbbell', 'barbell', 'ez_bar', 'kettlebell', 'cable', 'machine', 'smith_machine', 'bands', 'bench', 'pullup_bar', 'medicine_ball', 'stability_ball', 'foam_roller', 'cardio_machine', 'other'] as Exercise['equipment']
