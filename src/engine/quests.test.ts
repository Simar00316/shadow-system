import { allGoalsDone, closeDay, dailyQuest, HIDDEN, isWaived, maybeEmergency, newHidden, newStreak, penaltyQuest, progress, resolvePenalty, type DailyInput, type Snapshot } from './quests'
import { addDays, endOf } from './dates'

const base: DailyInput = { day: '2026-10-23', session: { planDayId: 'p1', name: 'Upper A', exercises: 6 }, readinessScore: 4, injured: [], deload: false, waterMl: 3000, proteinG: 150 }

describe('Daily Quest', () => {
  it('training day: session core + water, protein, readiness; expires at local midnight', () => {
    const q = dailyQuest(base)
    expect(q.goals.map((g) => g.key)).toEqual(['session', 'water', 'protein', 'readiness'])
    expect(q.goals[0].core).toBe(true)
    expect(q.expiresAt).toBe(endOf('2026-10-23'))
    expect(q.reward.xp).toBe(100)
    expect(q.penalty).toBe('Penalty Zone')
    expect(q.goals[3].current).toBe(1)
  })
  it('rest day: mobility core and rest-day XP', () => {
    const q = dailyQuest({ ...base, session: null, readinessScore: null })
    expect(q.goals[0].key).toBe('recovery')
    expect(q.reward.xp).toBe(60)
    expect(q.goals[3].current).toBe(0)
  })
  it('red readiness or injury swaps the session for recovery and waives the penalty', () => {
    for (const q of [dailyQuest({ ...base, readinessScore: 2 }), dailyQuest({ ...base, injured: ['quads'] })]) {
      expect(q.goals[0].key).toBe('recovery')
      expect(q.penalty).toBeUndefined()
      expect(q.meta?.waived).toBe(true)
    }
    expect(isWaived(2.4, [])).toBe(true)
    expect(isWaived(null, [])).toBe(false)
  })
  it('deload is framed as Recovery Phase; Rest Day Pass clears the core immediately', () => {
    expect(dailyQuest({ ...base, deload: true }).goals[0].label).toMatch(/^Recovery Phase/)
    const pass = dailyQuest({ ...base, restPass: true })
    expect(pass.goals[0].current).toBe(1)
  })
  it('progress clears the quest on the core goal only', () => {
    let q = dailyQuest(base)
    q = progress(q, 'water', 1500, 'add')
    q = progress(q, 'water', 1500, 'add')
    expect(q.status).toBe('issued')
    q = progress(q, 'session', 1)
    expect(q.status).toBe('cleared')
    expect(allGoalsDone(q)).toBe(false)
    q = progress(q, 'protein', 150)
    expect(allGoalsDone(q)).toBe(true)
  })
})

describe('streak and Penalty Zone', () => {
  const d0 = '2026-10-01'
  it('counts cleared days and milestones; best never resets', () => {
    let s = newStreak()
    for (let i = 0; i < 7; i++) s = closeDay(s, addDays(d0, i), { cleared: true, waived: false, restPass: false }).state
    expect([s.streak, s.best, s.activeDays]).toEqual([7, 7, 7])
    const r = closeDay({ ...s, streak: 20 }, addDays(d0, 7), { cleared: true, waived: false, restPass: false })
    expect(r.events).toContain('milestone')
  })
  it('miss order: waived → Elixir → Second Wind (30 days) → Penalty', () => {
    const s = { ...newStreak(), streak: 10, best: 10, freezes: 1 }
    const w = closeDay(s, d0, { cleared: false, waived: true, restPass: false })
    expect([w.state.streak, w.events]).toEqual([10, ['waived']])
    const f = closeDay(s, d0, { cleared: false, waived: false, restPass: false })
    expect([f.state.freezes, f.events]).toEqual([0, ['freeze_used']])
    const sw = closeDay(f.state, addDays(d0, 1), { cleared: false, waived: false, restPass: false })
    expect(sw.events).toEqual(['second_wind'])
    const pen = closeDay(sw.state, addDays(d0, 2), { cleared: false, waived: false, restPass: false })
    expect(pen.events).toEqual(['penalty_issued'])
    expect(pen.state.penalty).toEqual({ day: addDays(d0, 3), prior: 10 })
    const sw2 = closeDay({ ...pen.state, penalty: null }, addDays(d0, 32), { cleared: false, waived: false, restPass: false })
    expect(sw2.events).toEqual(['second_wind'])
  })
  it('Rest Day Pass counts as cleared', () => {
    expect(closeDay(newStreak(), d0, { cleared: false, waived: false, restPass: true }).state.streak).toBe(1)
  })
  it('clearing the penalty restores the streak; failing halves it (never zero, never XP)', () => {
    const s = { ...newStreak(), streak: 0, best: 30, penalty: { day: d0, prior: 30 } }
    expect(resolvePenalty(s, { cleared: true, waived: false })).toMatchObject({ state: { streak: 30, penalty: null }, event: 'penalty_cleared' })
    expect(resolvePenalty(s, { cleared: false, waived: true }).event).toBe('waived')
    const failed = resolvePenalty(s, { cleared: false, waived: false })
    expect([failed.state.streak, failed.state.best, failed.state.comebackDays]).toEqual([15, 30, 3])
    expect(resolvePenalty(newStreak(), { cleared: true, waived: false }).event).toBeNull()
  })
  it('comeback bonus days count down on cleared days', () => {
    const s = closeDay({ ...newStreak(), comebackDays: 3 }, d0, { cleared: true, waived: false, restPass: false }).state
    expect(s.comebackDays).toBe(2)
  })
  it('penalty quest scales by level and pays nothing (anti-farm)', () => {
    expect(penaltyQuest(d0, 5).goals[0].target).toBe(10)
    expect(penaltyQuest(d0, 30).goals[0].target).toBe(12)
    expect(penaltyQuest(d0, 80).goals[0].target).toBe(15)
    expect(penaltyQuest(d0, 5).reward).toEqual({ xp: 0, gold: 0 })
  })
})

describe('Emergency Quests', () => {
  const ctx = { daysPlayed: 30, thisWeek: 0, readinessScore: 4, injured: [], recovery: {}, baseClass: 'ranger' as const, level: 20 }
  it('about 15% of days, optional, never on waived days or over 2 per week', () => {
    const days = Array.from({ length: 400 }, (_, i) => addDays('2026-01-01', i))
    const hits = days.filter((d) => maybeEmergency(d, ctx)).length
    expect(hits / 400).toBeGreaterThan(0.09)
    expect(hits / 400).toBeLessThan(0.21)
    expect(days.some((d) => maybeEmergency(d, { ...ctx, readinessScore: 2 }))).toBe(false)
    expect(days.some((d) => maybeEmergency(d, { ...ctx, thisWeek: 2 }))).toBe(false)
    expect(days.some((d) => maybeEmergency(d, { ...ctx, daysPlayed: 3 }))).toBe(false)
    const q = days.map((d) => maybeEmergency(d, ctx)).find(Boolean)!
    expect(q.meta?.optional).toBe(true)
    expect(q.reward.xp).toBeGreaterThanOrEqual(150)
    expect(q.expiresAt).toBeLessThan(endOf(q.day))
  })
  it('never targets a muscle below 70% recovery', () => {
    const tired = { ...ctx, recovery: { chest: 50, triceps: 50, quads: 50, glutes: 50, abs: 50, lats: 50, biceps: 50, calves: 50 } }
    const days = Array.from({ length: 300 }, (_, i) => addDays('2026-01-01', i))
    for (const d of days) {
      const q = maybeEmergency(d, tired)
      if (q) expect(['Easy cardio', 'Meals logged', 'Mobility']).toContain(q.goals[0].label)
    }
  })
})

test('hidden quests trigger once on their secret conditions', () => {
  const s = { streak: 0, bestStreak: 100, earlyWorkouts: 1, lateWorkouts: 0, overachieverDays: 0, waterStreak: 0, perfectWeeks: 0, equipmentTypesThisWeek: 0, cardioKmThisWeek: 0, formGoodSets: 0, comebacks: 0 } as unknown as Snapshot
  const got = newHidden(s, new Set())
  expect(got.map((h) => h.id).sort()).toEqual(['dawn_hunter', 'iron_will_100'])
  expect(newHidden(s, new Set(['dawn_hunter', 'iron_will_100']))).toEqual([])
  expect(HIDDEN.length).toBeGreaterThanOrEqual(10)
})
