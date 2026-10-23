import { jobChangeAvailable, jobChangeGoals, monarchAvailable, nextRank, RANK_GATES, startingRank, trialAvailable, trialGoals, trialReady, ADVANCED_OPTIONS } from './ranks'
import { RANKS } from './types'

test('rank ladder and gates are monotonic', () => {
  expect(RANKS.map(nextRank)).toEqual(['D', 'C', 'B', 'A', 'S', 'National', null])
  for (let i = 1; i < RANKS.length; i++) {
    expect(RANK_GATES[RANKS[i]].level).toBeGreaterThan(RANK_GATES[RANKS[i - 1]].level)
    expect(RANK_GATES[RANKS[i]].power).toBeGreaterThan(RANK_GATES[RANKS[i - 1]].power)
  }
})

test('starting rank: beginners E, others D at PL ≥ 15', () => {
  expect(startingRank(40, 'beginner')).toBe('E')
  expect(startingRank(14, 'intermediate')).toBe('E')
  expect(startingRank(15, 'advanced')).toBe('D')
})

test('rank needs BOTH level and Power Level (rank reflects real fitness, not grinding)', () => {
  expect(trialAvailable('E', 10, 15)).toBe('D')
  expect(trialAvailable('E', 99, 14)).toBeNull()
  expect(trialAvailable('E', 9, 99)).toBeNull()
  expect(trialAvailable('S', 100, 90)).toBe('National')
  expect(trialAvailable('National', 200, 100)).toBeNull()
})

test('trial goals per rank and class', () => {
  const d = trialGoals('D', { baseClass: 'fighter', awakening: { pushups: 20, squats60s: 30, plankSec: 60 } })
  expect(d.map((g) => g.target)).toEqual([21, 31, 65])
  expect(trialGoals('D', { baseClass: 'fighter' })[0].target).toBe(1)
  expect(trialGoals('C', { baseClass: 'tank' })[0].key).toBe('power_strength')
  expect(trialGoals('C', { baseClass: 'healer' })[0].key).toBe('mobility_battery')
  expect(trialGoals('C', { baseClass: 'assassin' })[0].key).toBe('conditioning_12min')
  expect(trialGoals('B', { baseClass: 'ranger' })).toHaveLength(2)
  expect(trialGoals('A', { baseClass: 'ranger' })[0].target).toBe(50)
  expect(trialGoals('S', { baseClass: 'tank', adherence12w: 0.85 })[1].current).toBe(85)
  expect(trialGoals('National', { baseClass: 'tank', weeksConsistent: 40 })[1].current).toBe(40)
  expect(trialGoals('E', { baseClass: 'tank' })).toEqual([])
})

test('trials are postponed, not failed, unless recovered and green', () => {
  expect(trialReady(80, 'green')).toBe(true)
  expect(trialReady(60, 'green')).toBe(false)
  expect(trialReady(90, 'yellow')).toBe(false)
})

test('job change at level 30 for base classes only; Monarch at S', () => {
  expect(jobChangeAvailable('fighter', 30)).toBe(true)
  expect(jobChangeAvailable('fighter', 29)).toBe(false)
  expect(jobChangeAvailable('knight', 40)).toBe(false)
  expect(ADVANCED_OPTIONS.fighter).toEqual(['knight', 'berserker'])
  for (const c of ['fighter', 'tank', 'assassin', 'ranger', 'healer'] as const) expect(jobChangeGoals(c)[0].core).toBe(true)
  expect(monarchAvailable('S')).toBe(true)
  expect(monarchAvailable('A')).toBe(false)
})
