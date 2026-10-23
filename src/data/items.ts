// Inventory items, store catalogue and loot tables (game-design §13). Cosmetic or convenience only — never safety.
import type { Rarity } from '@/engine/types'

export type ItemType = 'consumable' | 'key' | 'theme' | 'frame' | 'skin' | 'scroll' | 'gold'
export type ItemDef = { id: string; name: string; type: ItemType; rarity: Rarity; description: string; price?: number; hold?: number; gold?: [number, number]; theme?: string }

export const ITEMS: ItemDef[] = [
  // convenience
  { id: 'elixir', name: 'Elixir of Life', type: 'consumable', rarity: 'rare', price: 250, hold: 2, description: 'Protects the streak for one missed day. Consumed automatically.' },
  { id: 'rest_pass', name: 'Rest Day Pass', type: 'consumable', rarity: 'rare', price: 150, hold: 2, description: 'Declare before the day begins. The day counts as cleared.' },
  { id: 'instant_key', name: 'Instant Dungeon Key', type: 'key', rarity: 'epic', price: 400, description: 'Opens a bonus dungeon: arms, abs or conditioning.' },
  { id: 'respec', name: 'Orb of Rebirth', type: 'consumable', rarity: 'rare', price: 300, description: 'Return every allocated stat point.' },
  { id: 'blessed_box', name: 'Blessed Random Box', type: 'consumable', rarity: 'epic', price: 1200, description: 'Choose one of three cosmetics you do not own.' },
  { id: 'scroll_cluster', name: 'Scroll: Cluster Sets', type: 'scroll', rarity: 'epic', description: 'Unlocks the cluster-set technique for one block.' },
  { id: 'scroll_myo', name: 'Scroll: Myo-Reps', type: 'scroll', rarity: 'epic', description: 'Unlocks myo-reps for one block.' },
  // gold pouches (loot only)
  { id: 'gold_small', name: 'Pouch of Gold', type: 'gold', rarity: 'common', gold: [20, 60], description: 'A handful of gold.' },
  { id: 'gold_medium', name: 'Bag of Gold', type: 'gold', rarity: 'rare', gold: [120, 250], description: 'A heavy bag of gold.' },
  { id: 'gold_large', name: 'Chest of Gold', type: 'gold', rarity: 'epic', gold: [400, 800], description: 'A chest overflowing with gold.' },
  // cosmetics
  { id: 'theme_ember', name: 'Theme: Ember Gate', type: 'theme', rarity: 'common', price: 1500, theme: 'ember', description: 'Panels glow like a cooling gate.' },
  { id: 'theme_frost', name: 'Theme: Frost Dungeon', type: 'theme', rarity: 'common', price: 1500, theme: 'frost', description: 'Ice-white System windows.' },
  { id: 'theme_jade', name: 'Theme: Jade Tower', type: 'theme', rarity: 'rare', price: 3000, theme: 'jade', description: 'Green light from an ancient tower.' },
  { id: 'theme_crimson', name: 'Theme: Red Gate', type: 'theme', rarity: 'rare', price: 3000, theme: 'crimson', description: 'Windows stained by a sealed gate.' },
  { id: 'theme_void', name: 'Theme: Void Throne', type: 'theme', rarity: 'epic', price: 6000, theme: 'void', description: 'Purple light of the Monarch.' },
  { id: 'theme_sovereign', name: 'Theme: Sovereign Gold', type: 'theme', rarity: 'legendary', theme: 'sovereign', description: 'Animated gold. Drop only.' },
  { id: 'frame_hunter', name: 'Frame: Hunter License', type: 'frame', rarity: 'common', price: 2500, description: 'A licensed hunter frame.' },
  { id: 'frame_guild', name: 'Frame: Guild Crest', type: 'frame', rarity: 'rare', price: 2500, description: 'A guild-master crest.' },
  { id: 'frame_monarch', name: 'Frame: Monarch Crown', type: 'frame', rarity: 'legendary', description: 'Crown of the Shadow Monarch. Drop only.' },
  { id: 'skin_rank', name: 'Panel Skin: Rank Aura', type: 'skin', rarity: 'epic', price: 4000, description: 'Panels glow in your rank colour.' },
  { id: 'skin_scanline', name: 'Panel Skin: Old Terminal', type: 'skin', rarity: 'common', description: 'Heavy scanlines and amber text.' },
  { id: 'skin_glitch', name: 'Panel Skin: Glitch', type: 'skin', rarity: 'rare', description: 'Windows that never quite settle.' },
  { id: 'skin_shadow_smoke', name: 'Shadow Skin: Black Smoke', type: 'skin', rarity: 'legendary', description: 'Your shadows trail black smoke. Drop only.' },
]

export const itemById = new Map(ITEMS.map((i) => [i.id, i]))
export const STORE = ITEMS.filter((i) => i.price != null)
