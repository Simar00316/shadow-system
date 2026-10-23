import { canBuy, freshPity, odds, pickItem, rollLoot, rollRarity, tierChance, updatePity } from './loot'
import { rng } from './rng'
import { itemById, ITEMS, STORE } from '@/data/items'

test('base marginal odds are 70 / 22.5 / 6 / 1.5%', () => {
  const o = odds(freshPity())
  expect(o.legendary).toBeCloseTo(0.015, 4)
  expect(o.epic).toBeCloseTo(0.06, 4)
  expect(o.rare).toBeCloseTo(0.225, 4)
  expect(o.common).toBeCloseTo(0.7, 4)
  expect(o.guaranteedIn).toEqual({ rare: 6, epic: 30, legendary: 70 })
})

test('hard pity guarantees each tier', () => {
  expect(tierChance('rare', 5)).toBe(1)
  expect(tierChance('epic', 29)).toBe(1)
  expect(tierChance('legendary', 69)).toBe(1)
  expect(tierChance('legendary', 50)).toBeGreaterThan(tierChance('legendary', 10))
  const r = rng(1)
  expect(rollRarity(() => 0.999, { rare: 5, epic: 0, legendary: 0 })).toBe('rare')
  expect(rollRarity(r, { rare: 0, epic: 0, legendary: 69 })).toBe('legendary')
})

test('simulated drops: rates close to the table, worst Legendary wait ≤ 70', () => {
  const r = rng(123)
  let pity = freshPity()
  const counts = { common: 0, rare: 0, epic: 0, legendary: 0 }
  let since = 0, worst = 0
  for (let i = 0; i < 20_000; i++) {
    const { drop, pity: p } = rollLoot(r, pity, { owned: new Set(), elixirs: 2 })
    pity = p
    counts[drop.rarity]++
    since = drop.rarity === 'legendary' ? 0 : since + 1
    worst = Math.max(worst, since)
  }
  expect(worst).toBeLessThan(70)
  expect(counts.legendary / 20_000).toBeGreaterThan(0.015)
  expect(counts.legendary / 20_000).toBeLessThan(0.04)
  expect(counts.common / 20_000).toBeGreaterThan(0.5)
})

test('floors: boss guarantees Epic+, trial guarantees Legendary', () => {
  const r = rng(9)
  for (let i = 0; i < 50; i++) expect(['epic', 'legendary']).toContain(rollRarity(r, freshPity(), 'epic'))
  expect(rollRarity(() => 0.99, freshPity(), 'legendary')).toBe('legendary')
})

test('pity counters reset on that tier or better', () => {
  const p = { rare: 3, epic: 10, legendary: 40 }
  expect(updatePity(p, 'common')).toEqual({ rare: 4, epic: 11, legendary: 41 })
  expect(updatePity(p, 'rare')).toEqual({ rare: 0, epic: 11, legendary: 41 })
  expect(updatePity(p, 'epic')).toEqual({ rare: 0, epic: 0, legendary: 41 })
  expect(updatePity(p, 'legendary')).toEqual({ rare: 0, epic: 0, legendary: 0 })
})

test('smart drops: Elixir when none held; owned cosmetics excluded; gold amounts in range', () => {
  const r = rng(4)
  const rares = Array.from({ length: 200 }, () => pickItem(r, 'rare', { owned: new Set(), elixirs: 0 }))
  expect(rares.filter((d) => d.item.id === 'elixir').length).toBeGreaterThan(80)
  const owned = new Set(ITEMS.filter((i) => i.type === 'theme').map((i) => i.id))
  for (let i = 0; i < 100; i++) expect(pickItem(r, 'legendary', { owned, elixirs: 2 }).item.id).not.toBe('theme_sovereign')
  for (let i = 0; i < 100; i++) {
    const d = pickItem(r, 'common', { owned: new Set(), elixirs: 2 })
    if (d.item.type === 'gold') expect(d.gold).toBeGreaterThanOrEqual(20)
  }
})

test('every item is cosmetic or convenience; store prices match game-design', () => {
  for (const i of ITEMS) expect(['consumable', 'key', 'theme', 'frame', 'skin', 'scroll', 'gold']).toContain(i.type)
  expect(itemById.get('elixir')!.price).toBe(250)
  expect(itemById.get('rest_pass')!.price).toBe(150)
  expect(itemById.get('instant_key')!.price).toBe(400)
  expect(STORE.some((i) => i.rarity === 'legendary')).toBe(false)
})

test('store rules: gold, hold limits, owned cosmetics, drop-only items', () => {
  const elixir = itemById.get('elixir')!
  expect(canBuy(elixir, 1000, new Map())).toEqual({ ok: true, gold: 750 })
  expect(canBuy(elixir, 100, new Map())).toEqual({ ok: false, reason: 'gold' })
  expect(canBuy(elixir, 1000, new Map([['elixir', 2]]))).toEqual({ ok: false, reason: 'hold_limit' })
  expect(canBuy(itemById.get('theme_frost')!, 9999, new Map([['theme_frost', 1]]))).toEqual({ ok: false, reason: 'owned' })
  expect(canBuy(itemById.get('theme_sovereign')!, 99999, new Map())).toEqual({ ok: false, reason: 'not_for_sale' })
})
