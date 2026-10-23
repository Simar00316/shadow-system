// Loot drops with Diablo rarity tiers, soft/hard pity and smart drops (game-design §13, R2 §3.4).
import type { Rarity } from './types'
import { ITEMS, type ItemDef } from '@/data/items'

export type Pity = { rare: number; epic: number; legendary: number }
export const freshPity = (): Pity => ({ rare: 0, epic: 0, legendary: 0 })

// Bases are conditional on the higher tiers failing, so marginal odds are 70 / 22.5 / 6 / 1.5%.
const PITY = {
  legendary: { soft: 45, step: 0.02, hard: 70, base: 0.015 },
  epic: { soft: 20, step: 0.04, hard: 30, base: 0.06 / 0.985 },
  rare: { soft: 4, step: 0.15, hard: 6, base: 0.225 / 0.925 },
}
const ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary']

/** Chance of this tier given the higher tiers missed, after soft/hard pity on workouts since that tier. */
export function tierChance(tier: keyof Pity, since: number) {
  const p = PITY[tier]
  if (since + 1 >= p.hard) return 1
  return Math.min(1, p.base + Math.max(0, since + 1 - p.soft) * p.step)
}

/** Rarity roll: Legendary, then Epic, then Rare, else Common; never below `floor` (boss = epic, trial = legendary). */
export function rollRarity(rand: () => number, pity: Pity, floor: Rarity = 'common'): Rarity {
  let got: Rarity = 'common'
  for (const t of ['legendary', 'epic', 'rare'] as const) if (rand() < tierChance(t, pity[t])) { got = t; break }
  return ORDER.indexOf(got) >= ORDER.indexOf(floor) ? got : floor
}

export function updatePity(p: Pity, got: Rarity): Pity {
  const r = { rare: p.rare + 1, epic: p.epic + 1, legendary: p.legendary + 1 }
  if (got === 'legendary') return { rare: 0, epic: 0, legendary: 0 }
  if (got === 'epic') return { ...r, rare: 0, epic: 0 }
  if (got === 'rare') return { ...r, rare: 0 }
  return r
}

export type Drop = { item: ItemDef; rarity: Rarity; gold: number }
export type DropContext = { owned: Set<string>; elixirs: number }

/** Pick an item of the rarity: unowned cosmetics weighted ×2; with no Elixir held, half of Rare drops are an Elixir. */
export function pickItem(rand: () => number, rarity: Rarity, ctx: DropContext, items: ItemDef[] = ITEMS): Drop {
  if (rarity === 'rare' && ctx.elixirs === 0 && rand() < 0.5) return { item: items.find((i) => i.id === 'elixir')!, rarity, gold: 0 }
  const pool = items.filter((i) => i.rarity === rarity && (i.type === 'gold' || i.type === 'consumable' || i.type === 'key' || i.type === 'scroll' || !ctx.owned.has(i.id)))
  const weights = pool.map((i) => (i.type === 'gold' ? 1 : ctx.owned.has(i.id) ? 1 : 2))
  let x = rand() * weights.reduce((a, b) => a + b, 0)
  let item = pool[pool.length - 1]
  for (let i = 0; i < pool.length; i++) { x -= weights[i]; if (x <= 0) { item = pool[i]; break } }
  const gold = item.gold ? Math.round(item.gold[0] + rand() * (item.gold[1] - item.gold[0])) : 0
  return { item, rarity, gold }
}

/** One roll per completed workout (max one per day). Never empty. */
export function rollLoot(rand: () => number, pity: Pity, ctx: DropContext, floor: Rarity = 'common') {
  const rarity = rollRarity(rand, pity, floor)
  return { drop: pickItem(rand, rarity, ctx), pity: updatePity(pity, rarity) }
}

/** Visible odds for the loot screen (current pity applied). */
export function odds(p: Pity) {
  const legendary = tierChance('legendary', p.legendary)
  const epic = (1 - legendary) * tierChance('epic', p.epic)
  const rare = (1 - legendary - epic) * tierChance('rare', p.rare)
  return { legendary, epic, rare, common: Math.max(0, 1 - legendary - epic - rare), guaranteedIn: { rare: PITY.rare.hard - p.rare, epic: PITY.epic.hard - p.epic, legendary: PITY.legendary.hard - p.legendary } }
}

// ---------- store ----------
export type BuyResult = { ok: true; gold: number } | { ok: false; reason: 'not_for_sale' | 'gold' | 'hold_limit' | 'owned' }

export function canBuy(item: ItemDef, gold: number, owned: Map<string, number>): BuyResult {
  if (item.price == null) return { ok: false, reason: 'not_for_sale' }
  if (gold < item.price) return { ok: false, reason: 'gold' }
  const qty = owned.get(item.id) ?? 0
  if (item.hold != null && qty >= item.hold) return { ok: false, reason: 'hold_limit' }
  if ((item.type === 'theme' || item.type === 'frame' || item.type === 'skin') && qty > 0) return { ok: false, reason: 'owned' }
  return { ok: true, gold: gold - item.price }
}
