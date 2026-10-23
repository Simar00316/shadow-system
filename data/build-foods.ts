// Builds src/data/ingredients.json from the curated list (data/src/ingredients.ts) using USDA SR Legacy (CC0)
// and IFCT 2017 numbers (via nodef/ifct2017). Rules: research/data-sources.md §2.
// Usage: node data/build-foods.ts
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cached, parseCsv, raw, SOURCES, writeJson } from './lib.ts'
import { INGREDIENTS, type Row } from './src/ingredients.ts'

const C = 'data/.cache/food'
const SR_DIR = `${C}/sr`

import type { Ingredient } from '../src/engine/model.ts'

async function loadSr() {
  const zip = await cached(SOURCES.usda_sr.url!, `${C}/sr_legacy.zip`)
  if (!existsSync(`${SR_DIR}/food.csv`)) {
    mkdirSync(SR_DIR, { recursive: true })
    writeFileSync(`${C}/sr_legacy.zip`, zip)
    // bsdtar (Windows/macOS) reads zip; fall back to unzip on Linux.
    try { execFileSync('tar', ['-xf', `${C}/sr_legacy.zip`, '-C', SR_DIR, '--strip-components=1']) } catch { execFileSync('unzip', ['-o', '-j', `${C}/sr_legacy.zip`, '-d', SR_DIR]) }
  }
  const read = (f: string) => { const [h, ...rows] = parseCsv(readFileSync(`${SR_DIR}/${f}`, 'utf8')); return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]]))) }
  const foods = read('food.csv')
  const cats = Object.fromEntries(read('food_category.csv').map((c) => [c.id, c.description]))
  const nut = new Map<string, Record<string, number>>()
  for (const r of read('food_nutrient.csv')) {
    if (!['1008', '1003', '1004', '1005', '1079'].includes(r.nutrient_id)) continue
    const m = nut.get(r.fdc_id) ?? {}
    m[r.nutrient_id] = Number(r.amount)
    nut.set(r.fdc_id, m)
  }
  const portions = new Map<string, Record<string, number>>()
  for (const r of read('food_portion.csv')) {
    const label = (r.modifier || r.portion_description || '').split(/[ ,(]/)[0].toLowerCase()
    if (!label || !Number(r.gram_weight)) continue
    const m = portions.get(r.fdc_id) ?? {}
    m[label] ??= Number(r.gram_weight) / (Number(r.amount) || 1)
    portions.set(r.fdc_id, m)
  }
  return { foods, cats, nut, portions }
}

async function loadIfct() {
  const csv = (await cached(raw('ifct', 'compositions/index.csv'), `${C}/ifct.csv`)).toString()
  const [h, ...rows] = parseCsv(csv)
  return new Map(rows.filter((r) => r.length > 1).map((r) => { const o = Object.fromEntries(h.map((k, i) => [k, r[i]])); return [o.code, o] }))
}

const NONVEG_CATS = ['Poultry Products', 'Sausages and Luncheon Meats', 'Pork Products', 'Beef Products', 'Finfish and Shellfish Products', 'Lamb, Veal, and Game Products']
const round = (x: number) => Math.round(x * 10) / 10

async function main() {
  const sr = await loadSr()
  const ifct = await loadIfct()
  const report: string[] = []
  const out: Ingredient[] = []
  const misses: string[] = []
  for (const row of INGREDIENTS as Row[]) {
    let k: number, p: number, c: number, f: number, fi: number, diet: Ingredient['diet'], src: string, unit: Record<string, number> = {}
    if (row.manual) {
      ({ k, p, c, f, fi } = row.manual)
      diet = row.diet ?? 'vegan'
      src = 'manual'
    } else if (row.q.startsWith('ifct:')) {
      const code = row.q.slice(5)
      const r = ifct.get(code)
      if (!r) { misses.push(`${row.id}: IFCT ${code}`); continue }
      p = Number(r.protcnt); f = Number(r.fatce); fi = Number(r.fibtg) || 0
      c = Number(r.choavldf) + fi // match USDA "by difference" convention
      k = Number(r.enerc) > 0 ? Number(r.enerc) / 4.184 : 4 * p + 9 * f + 4 * (c - fi)
      const tags = r.tags ?? ''
      diet = row.diet ?? (/\bveg\b/.test(tags) ? (row.g === 'dairy' ? 'vegetarian' : 'vegan') : tags.includes('eggetarian') && !tags.includes('vegetarian') ? 'eggetarian' : 'nonveg')
      src = `ifct:${code}`
      report.push(`${row.id.padEnd(18)} ← IFCT ${code} "${r.name}"`)
    } else {
      const terms = row.q.split(', ').map((t) => t.toLowerCase())
      const want = terms.filter((t) => !t.startsWith('!')), not = terms.filter((t) => t.startsWith('!')).map((t) => t.slice(1))
      const exact = sr.foods.find((x) => x.description.toLowerCase() === row.q.toLowerCase())
      const cands = exact ? [exact] : sr.foods.filter((x) => { const d = x.description.toLowerCase(); return want.every((t) => d.includes(t)) && !not.some((t) => d.includes(t)) }).sort((a, b) => a.description.length - b.description.length)
      const hit = cands[0]
      if (!hit) { misses.push(`${row.id}: "${row.q}"`); continue }
      const n = sr.nut.get(hit.fdc_id)!
      p = n['1003'] ?? 0; f = n['1004'] ?? 0; c = n['1005'] ?? 0; fi = n['1079'] ?? 0
      k = n['1008'] ?? 4 * p + 9 * f + 4 * (c - fi)
      const cat = sr.cats[hit.food_category_id]
      diet = row.diet ?? (NONVEG_CATS.includes(cat) ? 'nonveg' : cat === 'Dairy and Egg Products' ? (/egg/i.test(hit.description) ? 'eggetarian' : 'vegetarian') : 'vegan')
      src = `usda:${hit.fdc_id}`
      unit = sr.portions.get(hit.fdc_id) ?? {}
      report.push(`${row.id.padEnd(18)} ← ${exact ? 'exact' : 'match'} ${hit.fdc_id} "${hit.description}"`)
    }
    const atwater = 4 * p + 9 * f + 4 * Math.max(0, c - fi)
    if (k > 20 && Math.abs(k - atwater) / k > 0.2) report.push(`  ! ${row.id}: kcal ${round(k)} vs Atwater ${round(atwater)}`)
    out.push({ id: row.id, n: row.n, al: row.al ?? [], g: row.g, k: round(k), p: round(p), c: round(c), f: round(f), fi: round(fi), diet, tier: row.tier, unit: { ...unit, ...row.unit }, src })
  }
  if (misses.length) { console.error(`Unresolved:\n${misses.join('\n')}`); process.exit(1) }
  const ids = new Set<string>()
  for (const i of out) { if (ids.has(i.id)) throw new Error(`duplicate ingredient ${i.id}`); ids.add(i.id) }
  writeJson('src/data/ingredients.json', out)
  mkdirSync('data/reports', { recursive: true })
  writeFileSync('data/reports/ingredients.txt', report.join('\n'))
  console.log(`${out.length} ingredients. Report: data/reports/ingredients.txt`)
}

await main()
