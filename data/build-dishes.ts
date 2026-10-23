// Builds src/data/dishes.json from data/dishes/*.json (authored as raw ingredient grams per recipe).
// Macros, diet type and price tier are computed from src/data/ingredients.json (research/data-sources.md §3.3).
// Usage: node data/build-dishes.ts            (fails on any validation error)
//        node data/build-dishes.ts --only india,uk   (validate some cuisines, write nothing)
import { readFileSync } from 'node:fs'
import { writeJson } from './lib.ts'

type Src = { id: string; name: string; meal: Meal[]; servings: number; ingredients: [string, number][]; tags?: string[] }
type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'
import type { Dish, Ingredient as Ing } from '../src/engine/model.ts'
type Diet = Ing['diet']

export const CUISINES = ['india', 'usa', 'uk', 'mexico', 'italy', 'china', 'japan', 'thailand', 'lebanon', 'greece', 'korea', 'brazil', 'spain', 'france', 'pakistan', 'generic'] as const
const DIET_RANK: Diet[] = ['vegan', 'vegetarian', 'eggetarian', 'nonveg']
const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

const ing = new Map((JSON.parse(readFileSync('src/data/ingredients.json', 'utf8')) as Ing[]).map((i) => [i.id, i]))
const errors: string[] = []
const out: Dish[] = []
const ids = new Set<string>()
const r1 = (x: number) => Math.round(x * 10) / 10

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null
for (const cuisine of CUISINES.filter((c) => !only || only.includes(c))) {
  let list: Src[]
  try { list = JSON.parse(readFileSync(`data/dishes/${cuisine}.json`, 'utf8')) } catch (e) { errors.push(`${cuisine}: ${(e as Error).message}`); continue }
  if (list.length < 40) errors.push(`${cuisine}: only ${list.length} dishes (need ≥ 40)`)
  for (const d of list) {
    const where = `${cuisine}/${d.id}`
    if (ids.has(d.id)) errors.push(`${where}: duplicate id`)
    ids.add(d.id)
    if (!d.name || !(d.servings >= 1) || !d.ingredients?.length) { errors.push(`${where}: missing name/servings/ingredients`); continue }
    if (!d.meal?.length || d.meal.some((m) => !MEALS.includes(m))) errors.push(`${where}: bad meal ${d.meal}`)
    let k = 0, p = 0, c = 0, f = 0, fi = 0, grams = 0, tierW = 0, diet: Diet = 'vegan'
    for (const [id, g] of d.ingredients) {
      const i = ing.get(id)
      if (!i) { errors.push(`${where}: unknown ingredient "${id}"`); continue }
      if (!(g > 0 && g < 5000)) errors.push(`${where}: bad grams ${g} for ${id}`)
      k += (i.k * g) / 100; p += (i.p * g) / 100; c += (i.c * g) / 100; f += (i.f * g) / 100; fi += (i.fi * g) / 100
      grams += g
      if (i.k > 0) tierW += i.tier * g
      if (DIET_RANK.indexOf(i.diet) > DIET_RANK.indexOf(diet)) diet = i.diet
    }
    const s = d.servings
    const kcal = k / s
    if (kcal < 40 || kcal > 1600) errors.push(`${where}: implausible ${Math.round(kcal)} kcal/serving`)
    const heavy = d.ingredients.filter(([id]) => ing.get(id)?.k).reduce((a, [, g]) => a + g, 0)
    out.push({
      id: d.id, name: d.name, cuisine, meal: d.meal, diet, servings: s, grams: Math.round(grams / s),
      kcal: Math.round(kcal), p: r1(p / s), c: r1(c / s), f: r1(f / s), fi: r1(fi / s),
      tier: Math.max(1, Math.min(3, Math.round(tierW / Math.max(1, heavy)))) as 1 | 2 | 3,
      ingredients: d.ingredients.map(([id, g]) => [id, r1(g / s)]), tags: d.tags ?? [],
    })
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
if (only) { console.log(`OK: ${out.length} dishes valid`, out.map((d) => `${d.id} ${d.kcal}kcal P${d.p} ${d.diet}`).join('\n')); process.exit(0) }
writeJson('src/data/dishes.json', out)
const byDiet = Object.fromEntries(DIET_RANK.map((dt) => [dt, out.filter((d) => d.diet === dt).length]))
console.log(`${out.length} dishes across ${CUISINES.length} cuisines`, byDiet)
