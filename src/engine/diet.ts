// Diet plan generator (PRD B3.8): daily meal plans hitting kcal and protein from the bundled dishes,
// filtered by diet type and cuisine, with budget mode, swaps and a grocery list.
import type { DietType, Dish, Ingredient, MealSlot } from './model'
import type { Targets } from './nutrition'
import { rng } from './rng'

export const SLOT_SHARE: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 }
export const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
const ALLOWED: Record<DietType, DietType[]> = {
  vegan: ['vegan'], vegetarian: ['vegan', 'vegetarian'], eggetarian: ['vegan', 'vegetarian', 'eggetarian'], nonveg: ['vegan', 'vegetarian', 'eggetarian', 'nonveg'],
}

export type PlannedMeal = { slot: MealSlot; dish: Dish; servings: number; kcal: number; p: number; c: number; f: number }
export type DayPlan = { meals: PlannedMeal[]; kcal: number; p: number; c: number; f: number }
export type DietOptions = { dietType: DietType; cuisine: string; budget: boolean; seed?: number; exclude?: Set<string> }

/** Dishes the Player may eat: diet type, own cuisine plus generic staples, budget tier ≤ 2. */
export function eligible(dishes: Dish[], o: DietOptions) {
  return dishes.filter((d) => ALLOWED[o.dietType].includes(d.diet) && (d.cuisine === o.cuisine || d.cuisine === 'generic') && (!o.budget || d.tier <= 2) && !o.exclude?.has(d.id))
}

const SERVINGS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const meal = (slot: MealSlot, dish: Dish, servings: number): PlannedMeal => ({ slot, dish, servings, kcal: dish.kcal * servings, p: dish.p * servings, c: dish.c * servings, f: dish.f * servings })
const sum = (meals: PlannedMeal[]): DayPlan => ({ meals, kcal: Math.round(meals.reduce((a, m) => a + m.kcal, 0)), p: Math.round(meals.reduce((a, m) => a + m.p, 0)), c: Math.round(meals.reduce((a, m) => a + m.c, 0)), f: Math.round(meals.reduce((a, m) => a + m.f, 0)) })

/** Lower is better: calorie error dominates, missing protein is penalised, budget prefers tier 1. */
export function dayScore(d: DayPlan, t: Pick<Targets, 'kcal' | 'protein'>, budget = false) {
  const kErr = Math.abs(d.kcal - t.kcal) / t.kcal
  const pMiss = Math.max(0, t.protein - d.p) / t.protein
  const pOver = Math.max(0, d.p - t.protein * 1.4) / t.protein
  const cost = budget ? d.meals.reduce((a, m) => a + (m.dish.tier - 1) * 0.02, 0) : 0
  return kErr + 1.5 * pMiss + 0.3 * pOver + cost
}

const servingsFor = (dish: Dish, kcal: number) => SERVINGS.reduce((best, s) => (Math.abs(dish.kcal * s - kcal) < Math.abs(dish.kcal * best - kcal) ? s : best), 1)

/** One day: randomised greedy search over slot candidates, best of N trials (seeded, so reproducible). */
export function planDay(dishes: Dish[], t: Pick<Targets, 'kcal' | 'protein'>, o: DietOptions, avoid: Set<string> = new Set()): DayPlan {
  const pool = eligible(dishes, o)
  const rand = rng(o.seed ?? 1)
  const bySlot = Object.fromEntries(SLOTS.map((s) => [s, pool.filter((d) => d.meal.includes(s))])) as Record<MealSlot, Dish[]>
  let best: DayPlan | null = null, bestScore = Infinity
  for (let trial = 0; trial < 300; trial++) {
    const used = new Set<string>()
    const meals: PlannedMeal[] = []
    for (const slot of SLOTS) {
      const cands = bySlot[slot].filter((d) => !used.has(d.id) && (trial > 150 || !avoid.has(d.id)))
      if (!cands.length) continue
      // bias toward protein-dense dishes on half the trials
      const sorted = trial % 2 ? [...cands].sort((a, b) => b.p / b.kcal - a.p / a.kcal) : cands
      const dish = sorted[Math.floor(rand() ** (trial % 2 ? 2 : 1) * sorted.length)]
      used.add(dish.id)
      meals.push(meal(slot, dish, servingsFor(dish, t.kcal * SLOT_SHARE[slot])))
    }
    const d = sum(meals)
    const s = dayScore(d, t, o.budget)
    if (s < bestScore) { best = d; bestScore = s }
  }
  return best ?? sum([])
}

/** A week of days, avoiding repeats from the previous day. */
export function planWeek(dishes: Dish[], t: Pick<Targets, 'kcal' | 'protein'>, o: DietOptions, days = 7): DayPlan[] {
  const out: DayPlan[] = []
  for (let i = 0; i < days; i++) {
    const avoid = new Set(out[i - 1]?.meals.map((m) => m.dish.id) ?? [])
    out.push(planDay(dishes, t, { ...o, seed: (o.seed ?? 1) * 101 + i }, avoid))
  }
  return out
}

/** Meal swap: same slot and diet rules, scaled to within ±15% kcal, ranked by protein closeness. */
export function swaps(current: PlannedMeal, dishes: Dish[], o: DietOptions, limit = 6): PlannedMeal[] {
  return eligible(dishes, o)
    .filter((d) => d.id !== current.dish.id && d.meal.includes(current.slot))
    .map((d) => meal(current.slot, d, servingsFor(d, current.kcal)))
    .filter((m) => Math.abs(m.kcal - current.kcal) <= current.kcal * 0.15)
    .sort((a, b) => Math.abs(a.p - current.p) - Math.abs(b.p - current.p))
    .slice(0, limit)
}

export type GroceryItem = { id: string; name: string; group: string; grams: number; tier: number }

/** Grocery list aggregated over planned days (per-serving grams × servings). */
export function groceryList(days: DayPlan[], ingredients: Map<string, Ingredient>): GroceryItem[] {
  const acc = new Map<string, number>()
  for (const d of days) for (const m of d.meals) for (const [id, g] of m.dish.ingredients) acc.set(id, (acc.get(id) ?? 0) + g * m.servings)
  return [...acc]
    .map(([id, grams]) => { const i = ingredients.get(id); return { id, name: i?.n ?? id, group: i?.g ?? 'other', grams: Math.ceil(grams / 10) * 10, tier: i?.tier ?? 1 } })
    .filter((x) => x.group !== 'beverage' || x.id !== 'water')
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
}
