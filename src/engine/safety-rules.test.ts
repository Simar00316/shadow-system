// PRD §3 "Safety rules the game must never break" — one test per rule.
import { calorieTargetXp, setXp, award } from './xp'
import { recommend } from './recommend'
import { prescribe } from './prescription'
import { deloadDue } from './progression'
import { closeDay, dailyQuest, newStreak, penaltyQuest, resolvePenalty } from './quests'
import { targets } from './nutrition'
import { capFor, weeklyHardSets } from './safety'
import { generatePlan, planVolume } from './plan'
import { maybeEmergency } from './quests'
import { instantAllowed } from './dungeons'
import { trialReady } from './ranks'
import { ITEMS } from '@/data/items'
import { EXERCISES, EX_BY_ID, FULL_GYM } from './testdata'
import { MUSCLES } from './types'

describe('Rule 1: no XP for volume above the safe weekly cap per muscle', () => {
  it('set XP is 0 once the muscle is over its cap', () => {
    const bench = EXERCISES.find((e) => e.name === 'Barbell Bench Press')!
    const sets = Array.from({ length: 25 }, () => ({ exerciseId: bench.id, rir: 1, type: 'working' as const }))
    const vol = weeklyHardSets(sets, EX_BY_ID)
    const over = vol.chest > capFor('chest', 'intermediate')
    expect(over).toBe(true)
    expect(setXp({ rir: 1, type: 'working' }, { overCap: over, recoveryAtStart: 100 })).toBe(0)
  })
  it('generated plans never schedule volume above the cap', () => {
    for (const exp of ['beginner', 'intermediate', 'advanced'] as const) {
      const p = generatePlan({ experience: exp, cls: 'tank', sex: 'male', age: 30, goal: 'hypertrophy', equipment: FULL_GYM, injured: [], trainingDays: [1, 2, 3, 4, 5, 6], sessionMinutes: 120 }, EXERCISES)
      const vol = planVolume(p.exercises, EX_BY_ID)
      for (const m of MUSCLES) expect(vol[m] ?? 0).toBeLessThanOrEqual(capFor(m, exp))
    }
  })
})

describe('Rule 2: no reward for training a muscle below 30% recovery', () => {
  it('set XP is 0 and the recommender refuses the muscle', () => {
    expect(setXp({ rir: 1, type: 'working' }, { overCap: false, recoveryAtStart: 25 })).toBe(0)
    expect(recommend(EXERCISES, ['chest'], { equipment: FULL_GYM, recovery: { chest: 25 } }).filter((r) => r.ex.primary.includes('chest'))).toEqual([])
  })
  it('emergency quests and instant dungeons respect recovery', () => {
    expect(instantAllowed({ keys: 3, usedToday: false, targetMuscles: ['chest'], recovery: { chest: 10 } }).ok).toBe(false)
    expect(maybeEmergency('2026-10-23', { daysPlayed: 30, thisWeek: 0, readinessScore: 4, injured: [], recovery: Object.fromEntries(MUSCLES.map((m) => [m, 0])), baseClass: 'assassin', level: 1, seed: 1 })?.goals[0].unit ?? 'none').not.toBe('reps')
  })
})

describe('Rule 3: deloads are enforced and framed as Recovery Phase with bonus VIT', () => {
  it('a deload is due on schedule and the Daily Quest is framed as Recovery Phase', () => {
    expect(deloadDue({ experience: 'advanced', weeksSinceDeload: 5, liftDrops: [], readiness7: [], stalledLifts: 0 }).due).toBe(true)
    expect(dailyQuest({ day: '2026-10-23', session: { planDayId: 'x', name: 'Legs', exercises: 5 }, readinessScore: 4, injured: [], deload: true, waterMl: 3000, proteinG: 150 }).goals[0].label).toMatch(/Recovery Phase/)
    expect(prescribe({ mechanics: 'compound', pattern: 'squat', classTags: [] }, { cls: 'tank', experience: 'intermediate', deload: true }).rir).toBeGreaterThanOrEqual(4)
    expect(award({ type: 'recovery', refId: 'r', base: 20, ts: 0, day: 'd' }, { streak: 0, allocated: {} }, 'i').category).toBe('vit')
  })
})

describe('Rule 4: low readiness or an injury flag waives the Penalty Zone and swaps the session', () => {
  it('waived days never open a penalty and keep the streak', () => {
    const q = dailyQuest({ day: '2026-10-23', session: { planDayId: 'x', name: 'Legs', exercises: 5 }, readinessScore: 1.5, injured: [], deload: false, waterMl: 3000, proteinG: 150 })
    expect(q.goals[0].key).toBe('recovery')
    expect(q.penalty).toBeUndefined()
    const r = closeDay({ ...newStreak(), streak: 12 }, '2026-10-23', { cleared: false, waived: true, restPass: false })
    expect([r.state.streak, r.state.penalty]).toEqual([12, null])
    expect(resolvePenalty({ ...newStreak(), penalty: { day: 'd', prior: 9 } }, { cleared: false, waived: true }).state.streak).toBe(9)
    expect(trialReady(100, 'red')).toBe(false)
  })
})

describe('Rule 5: diet targets never go below safe minimums; no reward for extreme deficits', () => {
  it('floor and deficit cap hold for every profile', () => {
    for (const sex of ['male', 'female'] as const) for (const kg of [45, 60, 90, 140]) for (const act of [1.2, 1.9]) {
      const t = targets({ sex, weightKg: kg, heightCm: 170, age: 35, activity: act, goal: 'fat_loss', experience: 'intermediate', baseClass: 'tank', dietType: 'nonveg' })
      expect(t.kcal).toBeGreaterThanOrEqual(t.floor)
      expect(t.tdee - t.kcal).toBeLessThanOrEqual(Math.max(750, 0) + 10)
    }
    expect(calorieTargetXp(1100, 1150, 1200)).toBe(0)
  })
})

describe('Rule 6: no XP is ever removed as a penalty', () => {
  it('penalty quests pay nothing and streak events carry no XP', () => {
    expect(penaltyQuest('2026-10-23', 10).reward.xp).toBe(0)
    const failed = resolvePenalty({ ...newStreak(), penalty: { day: 'd', prior: 40 }, best: 40 }, { cleared: false, waived: false })
    expect(failed.state.best).toBe(40)
    expect(Object.keys(failed.state)).not.toContain('xp')
  })
})

describe('Rule 7: loot and items never affect safety or training prescription', () => {
  it('every item is cosmetic or convenience', () => {
    for (const i of ITEMS) expect(['consumable', 'key', 'theme', 'frame', 'skin', 'scroll', 'gold']).toContain(i.type)
  })
})
