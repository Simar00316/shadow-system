import { canRename, extract, rankFor, RANK_BUFF, shadowBonus } from './shadows'
import { SHADOWS } from '@/data/shadows'
import type { ShadowRec } from './model'

test('catalogue: 20 original shadows with lore', () => {
  expect(SHADOWS.length).toBeGreaterThanOrEqual(20)
  expect(new Set(SHADOWS.map((s) => s.id)).size).toBe(SHADOWS.length)
  for (const s of SHADOWS) expect(s.lore.length).toBeGreaterThan(30)
})

test('rank by achievement size', () => {
  expect(rankFor({ kind: 'pr', lift: 'squat', main: false })).toBe('normal')
  expect(rankFor({ kind: 'pr', lift: 'squat', main: true })).toBe('elite')
  expect(rankFor({ kind: 'boss', gateRank: 'D' })).toBe('knight')
  expect(rankFor({ kind: 'boss', gateRank: 'A' })).toBe('elite_knight')
  expect(rankFor({ kind: 'boss', gateRank: 'S' })).toBe('commander')
  expect(['D', 'C', 'A', 'S', 'National'].map((r) => rankFor({ kind: 'trial', toRank: r as never }))).toEqual(['knight', 'elite_knight', 'commander', 'marshal', 'grand_marshal'])
  expect([1, 50, 100].map((floor) => rankFor({ kind: 'castle', floor }))).toEqual(['knight', 'commander', 'marshal'])
})

test('extraction always succeeds and picks a themed, unowned shadow', () => {
  const a = extract({ kind: 'pr', lift: 'squat', main: true }, [], 1, 's1')
  expect([a.shadow.catalogId, a.promoted]).toEqual(['ferros', false])
  const army: ShadowRec[] = [a.shadow]
  const b = extract({ kind: 'pr', lift: 'squat', main: true }, army, 2, 's2')
  expect(b.shadow.catalogId).not.toBe('ferros')
  const nat = extract({ kind: 'trial', toRank: 'National' }, [], 3, 's3')
  expect(nat.shadow.catalogId).toBe('sable')
  expect(extract({ kind: 'castle', floor: 1 }, [], 4, 's4').def.theme).toBe('castle')
})

test('when every shadow is owned, the themed one is promoted instead', () => {
  const army = SHADOWS.map((s, i) => ({ id: `x${i}`, catalogId: s.id, name: s.name, rank: 'normal' as const, obtainedAt: 0, source: 'pr' }))
  const r = extract({ kind: 'boss', gateRank: 'D' }, army, 5, 'n')
  expect(r.promoted).toBe(true)
  expect(r.shadow.rank).toBe('knight')
  expect(r.shadow.id).toBe(army.find((s) => SHADOWS.find((d) => d.id === s.catalogId)!.theme === 'boss')!.id)
})

test('equipped shadows give category buffs (max 3); rename from Knight', () => {
  const mk = (catalogId: string, rank: ShadowRec['rank']): ShadowRec => ({ id: catalogId, catalogId, name: catalogId, rank, obtainedAt: 0, source: 'x' })
  const b = shadowBonus([mk('ferros', 'knight'), mk('vanta', 'elite'), mk('syl', 'normal'), mk('grael', 'marshal'), mk('nope', 'normal')])
  expect(b.str).toBeCloseTo(RANK_BUFF.knight + RANK_BUFF.elite)
  expect(b.agi).toBeCloseTo(0.02)
  const gm = shadowBonus([mk('sable', 'grand_marshal')])
  expect(gm.str).toBeCloseTo(0.06)
  expect(gm.int).toBeCloseTo(0.03)
  expect(shadowBonus([mk('nope', 'knight')])).toEqual({})
  expect(canRename(mk('a', 'elite'))).toBe(false)
  expect(canRename(mk('a', 'knight'))).toBe(true)
})
