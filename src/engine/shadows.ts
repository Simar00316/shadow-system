// Shadow Extraction ("ARISE") and the Shadow Army (game-design §10). Outcomes are deterministic: a real
// achievement always yields a shadow; the three "attempts" are cinematic only.
import { SHADOW_RANKS, type Rank, type ShadowRank, type Stat } from './types'
import type { ShadowRec } from './model'
import { SHADOWS, type ShadowDef, type ShadowTheme } from '@/data/shadows'

export type ExtractionTrigger =
  | { kind: 'pr'; lift: 'squat' | 'bench' | 'deadlift' | 'ohp' | 'pull' | 'other'; main: boolean }
  | { kind: 'boss'; gateRank: Rank }
  | { kind: 'trial'; toRank: Rank }
  | { kind: 'castle'; floor: number }

/** Shadow rank by size of the achievement (game-design §10). */
export function rankFor(t: ExtractionTrigger): ShadowRank {
  switch (t.kind) {
    case 'pr': return t.main ? 'elite' : 'normal'
    case 'boss': return ['E', 'D', 'C'].includes(t.gateRank) ? 'knight' : ['B', 'A'].includes(t.gateRank) ? 'elite_knight' : 'commander'
    case 'trial': return t.toRank === 'National' ? 'grand_marshal' : t.toRank === 'S' ? 'marshal' : t.toRank === 'A' ? 'commander' : t.toRank === 'B' || t.toRank === 'C' ? 'elite_knight' : 'knight'
    case 'castle': return t.floor >= 100 ? 'marshal' : t.floor >= 50 ? 'commander' : 'knight'
  }
}

const themeOf = (t: ExtractionTrigger): ShadowTheme => (t.kind === 'pr' ? (t.lift === 'other' ? 'any' : t.lift) : t.kind)

const higher = (a: ShadowRank, b: ShadowRank) => (SHADOW_RANKS.indexOf(a) >= SHADOW_RANKS.indexOf(b) ? a : b)

/**
 * Extract a shadow for a trigger: the first unowned shadow of the matching theme (then 'any', then anything);
 * when every candidate is owned, the matching shadow is promoted one rank instead.
 */
export function extract(t: ExtractionTrigger, army: ShadowRec[], now: number, id: string): { shadow: ShadowRec; promoted: boolean; def: ShadowDef } {
  const rank = rankFor(t)
  const theme = themeOf(t)
  const owned = new Set(army.map((s) => s.catalogId))
  // Sable, the Grand Marshal, only answers a National Level Hunter.
  const pool = SHADOWS.filter((s) => (s.id === 'sable') === (rank === 'grand_marshal'))
  const pick = pool.find((s) => s.theme === theme && !owned.has(s.id)) ?? pool.find((s) => s.theme === 'any' && !owned.has(s.id)) ?? pool.find((s) => !owned.has(s.id))
  if (pick) return { shadow: { id, catalogId: pick.id, name: pick.name, rank, obtainedAt: now, source: t.kind }, promoted: false, def: pick }
  const existing = army.find((s) => SHADOWS.find((d) => d.id === s.catalogId)?.theme === theme) ?? army[0]
  const next = SHADOW_RANKS[Math.min(SHADOW_RANKS.length - 1, SHADOW_RANKS.indexOf(existing.rank) + 1)]
  const def = SHADOWS.find((d) => d.id === existing.catalogId)!
  return { shadow: { ...existing, rank: higher(next, rank) }, promoted: true, def }
}

/** Passive buff per equipped shadow in its category (game-design §10). Max 3 equipped. */
export const RANK_BUFF: Record<ShadowRank, number> = { normal: 0.02, elite: 0.03, knight: 0.04, elite_knight: 0.05, commander: 0.05, marshal: 0.06, grand_marshal: 0.06 }

export function shadowBonus(equipped: ShadowRec[]): Partial<Record<Stat, number>> {
  const out: Partial<Record<Stat, number>> = {}
  for (const s of equipped.slice(0, 3)) {
    const def = SHADOWS.find((d) => d.id === s.catalogId)
    if (!def) continue
    out[def.category] = (out[def.category] ?? 0) + RANK_BUFF[s.rank]
    if (s.rank === 'grand_marshal') for (const k of ['str', 'agi', 'vit', 'int', 'per'] as Stat[]) out[k] = (out[k] ?? 0) + (k === def.category ? 0 : 0.03)
  }
  return out
}

export const canRename = (s: ShadowRec) => SHADOW_RANKS.indexOf(s.rank) >= SHADOW_RANKS.indexOf('knight')
