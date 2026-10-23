// Diet service (PRD B3.7, B3.8, F3.12): food search, meal and water logging, nutrition XP, barcode lookup,
// weekly meal plans with swaps, and the grocery list.
import { db } from '@/db/schema'
import { getSetting, setSetting, uid } from '@/db/repo'
import { addDays, dayOf, weekStart } from '@/engine/dates'
import { planWeek, swaps as dishSwaps, groceryList, SLOTS, type DayPlan, type PlannedMeal } from '@/engine/diet'
import { waterFor, type Targets } from '@/engine/nutrition'
import { BASE_XP, calorieTargetXp, MAX_MEALS_PER_DAY, proteinTargetXp, waterTargetXp } from '@/engine/xp'
import type { Dish, Food, Ingredient, MealItem, MealLog, MealSlot, Profile } from '@/engine/model'
import { awardMany, currentTargets, progressDaily } from './game'
import { hashSeed } from '@/engine/rng'

export type FoodHit = { id: string; name: string; k: number; p: number; c: number; f: number; unit: Record<string, number>; kind: 'ingredient' | 'dish' | 'food'; serving?: number; detail?: string }

let cache: { ingredients: Ingredient[]; dishes: Dish[] } | null = null
export async function bundles() {
  if (!cache) {
    const [i, d] = await Promise.all([import('@/data/ingredients.json'), import('@/data/dishes.json')])
    cache = { ingredients: i.default as Ingredient[], dishes: d.default as Dish[] }
  }
  return cache
}

/** Everything searchable, as per-100 g nutrients (dishes carry their serving size). */
export async function foodIndex(): Promise<FoodHit[]> {
  const { ingredients, dishes } = await bundles()
  const foods = await db.foods.toArray()
  return [
    ...dishes.map((d) => ({ id: `dish:${d.id}`, name: d.name, k: (d.kcal / d.grams) * 100, p: (d.p / d.grams) * 100, c: (d.c / d.grams) * 100, f: (d.f / d.grams) * 100, unit: { serving: d.grams }, kind: 'dish' as const, serving: d.grams, detail: d.cuisine })),
    ...ingredients.map((i) => ({ id: `ing:${i.id}`, name: i.n, k: i.k, p: i.p, c: i.c, f: i.f, unit: i.unit, kind: 'ingredient' as const, detail: i.al.join(', ') })),
    ...foods.map((f) => ({ id: `food:${f.id}`, name: f.brand ? `${f.name} (${f.brand})` : f.name, k: f.k, p: f.p, c: f.c, f: f.f, unit: f.unit ?? {}, kind: 'food' as const })),
  ]
}

export const itemFrom = (h: Pick<FoodHit, 'id' | 'name' | 'k' | 'p' | 'c' | 'f'>, grams: number): MealItem => ({ ref: h.id, name: h.name, grams, k: Math.round((h.k * grams) / 100), p: Math.round((h.p * grams) / 10) / 10, c: Math.round((h.c * grams) / 10) / 10, f: Math.round((h.f * grams) / 10) / 10 })

export function totals(logs: Pick<MealLog, 'items'>[]) {
  const t = { k: 0, p: 0, c: 0, f: 0 }
  for (const l of logs) for (const i of l.items) { t.k += i.k; t.p += i.p; t.c += i.c; t.f += i.f }
  return { k: Math.round(t.k), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f) }
}

/** Today's targets, water raised for training planned or logged today. */
export async function dayTargets(profile: Profile, day = dayOf()): Promise<Targets> {
  const t = await currentTargets(profile)
  const trained = await db.workouts.where('day').equals(day).toArray()
  const hours = trained.reduce((a, w) => a + ((w.endedAt ?? Date.now()) - w.startedAt) / 3_600_000, 0)
  return { ...t, waterMl: waterFor(t, Math.min(3, hours)) }
}

let syncQueue: Promise<unknown> = Promise.resolve()

/** Recompute the day's nutrition. Serialised: overlapping calls could otherwise write stale totals (issue #108). */
export function syncNutrition(day = dayOf()) {
  const run = syncQueue.then(() => doSync(day))
  syncQueue = run.catch(() => undefined)
  return run
}

/** Daily Quest goals and target XP (protein, water now; calories at day end). */
async function doSync(day: string) {
  const profile = await db.profile.get('me')
  if (!profile) return null
  const [logs, water, t] = await Promise.all([db.mealLogs.where('day').equals(day).toArray(), db.water.where('day').equals(day).toArray(), dayTargets(profile, day)])
  const tot = totals(logs)
  const ml = water.reduce((a, w) => a + w.ml, 0)
  if (day === dayOf()) { await progressDaily('protein', tot.p); await progressDaily('water', ml) }
  const awards = []
  if (proteinTargetXp(tot.p, t.protein)) awards.push({ type: 'protein_target' as const, refId: day, base: BASE_XP.proteinTarget, day })
  if (waterTargetXp(ml, t.waterMl)) awards.push({ type: 'water_target' as const, refId: day, base: BASE_XP.waterTarget, day })
  if (awards.length) await awardMany(awards)
  return { ...tot, water: ml, targets: t }
}

/** Calorie target XP is decided at the end of the day (needs the final intake; never paid under the safe floor). */
export async function closeNutritionDay(day: string) {
  const profile = await db.profile.get('me')
  if (!profile) return
  const logs = await db.mealLogs.where('day').equals(day).toArray()
  if (!logs.length) return
  const t = await currentTargets(profile)
  const base = calorieTargetXp(totals(logs).k, t.kcal, t.floor)
  if (base) await awardMany([{ type: 'calorie_target', refId: day, base, day }], { quiet: true })
}

export async function logMeal(meal: MealSlot, items: MealItem[], day = dayOf()) {
  if (!items.length) return null
  const log: MealLog = { id: uid(), day, meal, items, at: Date.now() }
  await db.mealLogs.add(log)
  const slots = new Set((await db.mealLogs.where('day').equals(day).toArray()).map((l) => l.meal))
  if (slots.size <= MAX_MEALS_PER_DAY) await awardMany([{ type: 'meal', refId: `${day}:${meal}`, base: BASE_XP.meal, day }], { quiet: true })
  await syncNutrition(day)
  return log
}

export async function deleteMealLog(id: string) {
  const log = await db.mealLogs.get(id)
  await db.mealLogs.delete(id)
  if (log) await syncNutrition(log.day)
}

export async function addWater(ml: number, day = dayOf()) {
  await db.water.add({ id: uid(), day, ml, at: Date.now() })
  return syncNutrition(day)
}

export async function saveMeal(name: string, items: MealItem[]) {
  await db.meals.put({ id: uid(), name, items })
}

/** Last distinct items logged (recents). */
export async function recentItems(limit = 20) {
  const logs = await db.mealLogs.orderBy('at').reverse().limit(60).toArray()
  const seen = new Map<string, MealItem>()
  for (const l of logs) for (const i of l.items) if (!seen.has(i.ref)) seen.set(i.ref, i)
  return [...seen.values()].slice(0, limit)
}

// ---------- barcode (Open Food Facts v2, R6 §2.2) ----------

/** UPC-A (12 digits) → EAN-13 by prefixing 0; strips non-digits. */
export const normalizeBarcode = (code: string) => { const d = code.replace(/\D/g, ''); return d.length === 12 ? `0${d}` : d }

type OffProduct = { product_name?: string; brands?: string; serving_quantity?: number | string; nutriments?: Record<string, number | undefined> }

export function foodFromOff(code: string, p: OffProduct): Food | { incomplete: true; name: string } {
  const n = p.nutriments ?? {}
  const k = n['energy-kcal_100g'] ?? (n['energy_100g'] != null ? Number(n['energy_100g']) / 4.184 : undefined)
  const name = p.product_name?.trim() || `Product ${code}`
  if (k == null || n.proteins_100g == null || n.carbohydrates_100g == null || n.fat_100g == null) return { incomplete: true, name }
  const serving = Number(p.serving_quantity)
  return { id: `off-${code}`, name, brand: p.brands?.split(',')[0]?.trim(), barcode: code, k: Math.round(k), p: Number(n.proteins_100g), c: Number(n.carbohydrates_100g), f: Number(n.fat_100g), fi: Number(n.fiber_100g ?? 0), src: `off:${code}`, unit: serving > 0 ? { serving } : {} }
}

/** Look up a barcode: local cache first, then Open Food Facts (CORS allowed). Results are cached for offline use. */
export async function lookupBarcode(raw: string, fetcher: typeof fetch = fetch): Promise<Food | { incomplete: true; name: string } | { notFound: true } | { offline: true }> {
  const code = normalizeBarcode(raw)
  const local = await db.foods.where('barcode').equals(code).first()
  if (local) return local
  try {
    const res = await fetcher(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,serving_quantity,nutriments`, { headers: { 'X-User-Agent': 'ShadowSystem/0.1 (personal app)' } })
    if (!res.ok) return { notFound: true }
    const json = (await res.json()) as { status?: number; product?: OffProduct }
    if (!json.product || json.status === 0) return { notFound: true }
    const food = foodFromOff(code, json.product)
    if ('id' in food) await db.foods.put(food)
    return food
  } catch {
    return { offline: true }
  }
}

export async function saveManualFood(f: Omit<Food, 'id' | 'src'>) {
  const food: Food = { ...f, id: uid(), src: 'manual' }
  await db.foods.put(food)
  return food
}

// ---------- meal plan and grocery list ----------

export type StoredPlan = { week: string; days: { meals: { slot: MealSlot; dishId: string; servings: number }[] }[] }

export async function getMealPlan(week = weekStart(dayOf())) {
  const plan = await getSetting<StoredPlan>('mealPlan')
  return plan?.week === week ? plan : null
}

export async function generateMealPlan(profile: Profile, week = weekStart(dayOf())) {
  const { dishes } = await bundles()
  const t = await currentTargets(profile)
  const days = planWeek(dishes, { kcal: t.kcal, protein: t.protein }, { dietType: profile.dietType, cuisine: profile.cuisine, budget: profile.budget, seed: hashSeed(`${week}:${profile.createdAt}`) })
  const plan: StoredPlan = { week, days: days.map((d) => ({ meals: d.meals.map((m) => ({ slot: m.slot, dishId: m.dish.id, servings: m.servings })) })) }
  await setSetting('mealPlan', plan)
  await setSetting('groceryChecked', [])
  return plan
}

/** Expand a stored plan into dishes with nutrients. */
export async function expandPlan(plan: StoredPlan): Promise<DayPlan[]> {
  const { dishes } = await bundles()
  const byId = new Map(dishes.map((d) => [d.id, d]))
  return plan.days.map((d) => {
    const meals: PlannedMeal[] = d.meals.filter((m) => byId.has(m.dishId)).map((m) => { const dish = byId.get(m.dishId)!; return { slot: m.slot, dish, servings: m.servings, kcal: dish.kcal * m.servings, p: dish.p * m.servings, c: dish.c * m.servings, f: dish.f * m.servings } })
    return { meals, kcal: Math.round(meals.reduce((a, m) => a + m.kcal, 0)), p: Math.round(meals.reduce((a, m) => a + m.p, 0)), c: Math.round(meals.reduce((a, m) => a + m.c, 0)), f: Math.round(meals.reduce((a, m) => a + m.f, 0)) }
  })
}

export async function swapOptions(profile: Profile, meal: PlannedMeal) {
  const { dishes } = await bundles()
  return dishSwaps(meal, dishes, { dietType: profile.dietType, cuisine: profile.cuisine, budget: profile.budget })
}

export async function swapPlanned(dayIndex: number, slot: MealSlot, next: PlannedMeal) {
  const plan = await getMealPlan()
  if (!plan) return
  plan.days[dayIndex].meals = plan.days[dayIndex].meals.map((m) => (m.slot === slot ? { slot, dishId: next.dish.id, servings: next.servings } : m))
  await setSetting('mealPlan', plan)
}

/** One-tap log of a planned meal. */
export async function logPlanned(meal: PlannedMeal, day = dayOf()) {
  const grams = Math.round(meal.dish.grams * meal.servings)
  const hit = { id: `dish:${meal.dish.id}`, name: meal.dish.name, k: (meal.dish.kcal / meal.dish.grams) * 100, p: (meal.dish.p / meal.dish.grams) * 100, c: (meal.dish.c / meal.dish.grams) * 100, f: (meal.dish.f / meal.dish.grams) * 100 }
  return logMeal(meal.slot, [itemFrom(hit, grams)], day)
}

export async function groceries(plan: StoredPlan) {
  const { ingredients } = await bundles()
  return groceryList(await expandPlan(plan), new Map(ingredients.map((i) => [i.id, i])))
}

export const todayIndex = (week: string, day = dayOf()) => { for (let i = 0; i < 7; i++) if (addDays(week, i) === day) return i; return 0 }
export { SLOTS }
