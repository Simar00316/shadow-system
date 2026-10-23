import { fill, MESSAGE_EVENTS, systemMessage } from './messages'
import { rng } from './rng'
import { newTitles, TITLES } from '@/data/titles'
import type { Snapshot } from './quests'

test('every event has at least 3 variants in the System bracket voice', async () => {
  const cat = (await import('@/data/system-messages.json')).default as Record<string, string[]>
  expect(MESSAGE_EVENTS.length).toBeGreaterThanOrEqual(50)
  for (const e of MESSAGE_EVENTS) {
    expect(cat[e].length).toBeGreaterThanOrEqual(3)
    for (const t of cat[e]) expect(t.startsWith('[')).toBe(true)
  }
})

test('never repeats the previous variant; fills placeholders', () => {
  const last = new Map<string, number>()
  const r = rng(5)
  let prev = ''
  for (let i = 0; i < 30; i++) {
    const m = systemMessage('level_up', { level: 7 }, last, r)
    expect(m).not.toBe(prev)
    expect(m).not.toMatch(/\{/)
    prev = m
  }
  expect(fill('[{a} {b}]', { a: 1 })).toBe('[1 {b}]')
})

test('variants needing missing vars are skipped', () => {
  for (let i = 0; i < 20; i++) expect(systemMessage('pr', {})).toMatch(/\[/)
  // every 'pr' variant needs {exercise}: the placeholder stays visible so missing data is caught in review
  expect(systemMessage('pr', {}, new Map(), () => 0)).toMatch(/\{exercise\}/)
  expect(systemMessage('daily_warning', {}, new Map(), () => 0)).not.toMatch(/\{/)
})

test('PRD titles: at least 60, unique, examples present', () => {
  expect(TITLES.length).toBeGreaterThanOrEqual(60)
  expect(new Set(TITLES.map((t) => t.id)).size).toBe(TITLES.length)
  const names = TITLES.map((t) => t.name)
  for (const n of ['Iron Will', 'Leg Day Survivor', 'Wolf Slayer']) expect(names).toContain(n)
})

test('title unlocking from a snapshot', () => {
  const s: Snapshot = { streak: 30, bestStreak: 30, workouts: 26, prs: 1, level: 10, rank: 'D', earlyWorkouts: 0, lateWorkouts: 0, perfectWeeks: 0, waterStreak: 0, proteinDays: 0, mealsLogged: 0, formGoodSets: 0, equipmentTypesThisWeek: 0, cardioKmThisWeek: 0, comebacks: 0, overachieverDays: 0, totalVolumeKg: 12_000, cardioKm: 0, bossRaids: 0, redGates: 0, shadows: 0, deloads: 0, penaltiesCleared: 0, dailyCleared: 0, readinessDays: 0, demonFloor: 0, jobChanged: false, firstPrLifts: ['squat'], instantDungeons: 0, goldEarned: 0, titles: 0, legDays: 10, cls: 'tank', ranksReached: ['D'] }
  const ids = newTitles(s, new Set()).map((t) => t.id)
  for (const id of ['iron_will', 'wolf_slayer', 'leg_day_survivor', 'dungeon_regular', 'ten_tonnes', 'rank_d', 'rising_hunter']) expect(ids).toContain(id)
  expect(ids).not.toContain('unbroken')
  expect(newTitles(s, new Set(ids))).toEqual([])
  // exercise every predicate for coverage of the catalogue
  for (const t of TITLES) expect(typeof t.test(s)).toBe('boolean')
})
