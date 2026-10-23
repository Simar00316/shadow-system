// 12-week simulated users: levels, quests, streaks and penalties stay sensible (PRD §6 simulation).
import { PERSONAS, simulate } from './simulate'
import { simulateGame } from './game'
import { EXERCISES, EX_BY_ID } from '@/engine/testdata'
import { foldLedger } from '@/engine/xp'

describe.each(PERSONAS)('$name: 12-week game', (persona) => {
  const training = simulate(persona, EXERCISES)
  const consistent = simulateGame(training, EX_BY_ID, { adherence: 0.92, nutrition: 0.85, seed: persona.seed })
  const lapsed = simulateGame(training, EX_BY_ID, { adherence: 0.55, nutrition: 0.4, seed: persona.seed + 100 })

  it('a consistent Player reaches about level 10 in 3 weeks', () => {
    const l21 = consistent.days[20].level
    expect(l21).toBeGreaterThanOrEqual(6)
    expect(l21).toBeLessThanOrEqual(13)
  })

  it('levels never go down and keep rising over 12 weeks', () => {
    for (let i = 1; i < consistent.days.length; i++) expect(consistent.days[i].level).toBeGreaterThanOrEqual(consistent.days[i - 1].level)
    expect(consistent.days[83].level).toBeGreaterThan(consistent.days[20].level)
    expect(consistent.days[83].level).toBeLessThan(40)
  })

  it('XP is never negative and never removed', () => {
    expect(consistent.ledger.every((e) => e.xp >= 0)).toBe(true)
    expect(lapsed.ledger.every((e) => e.xp >= 0)).toBe(true)
  })

  it('consistent Players clear most Daily Quests and rarely see the Penalty Zone', () => {
    const cleared = consistent.days.filter((d) => d.cleared).length
    expect(cleared / 84).toBeGreaterThan(0.8)
    const missed = 84 - cleared
    expect(consistent.penaltiesIssued).toBeLessThan(Math.max(1, missed))
    expect(consistent.penaltiesIssued).toBeLessThanOrEqual(8)
    expect(consistent.streak.best).toBeGreaterThan(14)
  })

  it('a lapsed Player meets penalties but keeps levels and best streak', () => {
    expect(lapsed.penaltiesIssued).toBeGreaterThan(0)
    expect(foldLedger(lapsed.ledger).level).toBeGreaterThan(1)
    expect(lapsed.streak.best).toBeGreaterThanOrEqual(lapsed.streak.streak)
    expect(foldLedger(lapsed.ledger).level).toBeLessThan(foldLedger(consistent.ledger).level)
  })

  it('loot drops every workout with sensible rarity mix', () => {
    expect(consistent.drops.length).toBeGreaterThan(20)
    expect(consistent.drops.filter((d) => d === 'common').length).toBeGreaterThan(consistent.drops.length * 0.4)
  })
})
