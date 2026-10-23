import { award, calorieTargetXp, cardioXp, foldLedger, levelFromTotal, levelUpGold, multiplier, proteinTargetXp, setXp, statBonus, streakBonus, waterTargetXp, xpForLevel, xpToNext, MAX_MULT } from './xp'

test('curve matches game-design §4.1 (level 10 ≈ 9.7k, level 50 ≈ 203k)', () => {
  expect(xpToNext(1)).toBe(285)
  expect(xpForLevel(10)).toBe(9711)
  expect(Math.abs(xpForLevel(50) - 203_246)).toBeLessThan(50)
  expect(xpForLevel(1)).toBe(0)
})

test('level from total XP, with remainder', () => {
  expect(levelFromTotal(0)).toEqual({ level: 1, xp: 0, toNext: 285 })
  expect(levelFromTotal(285)).toEqual({ level: 2, xp: 0, toNext: xpToNext(2) })
  expect(levelFromTotal(-50).level).toBe(1)
  const l = levelFromTotal(xpForLevel(10) + 5)
  expect([l.level, l.xp]).toEqual([10, 5])
})

test('set XP: 8 × effort, flat for RIR 0–1, zero for warm-ups and every safety gate', () => {
  const ok = { overCap: false, recoveryAtStart: 80 }
  expect([0, 1, 2, 3, 4, 5].map((rir) => setXp({ rir, type: 'working' }, ok))).toEqual([8, 8, 7, 5, 2, 0])
  expect(setXp({ rir: null, type: 'working' }, ok)).toBe(7)
  expect(setXp({ rir: 1, type: 'warmup' }, ok)).toBe(0)
  expect(setXp({ rir: 1, type: 'working' }, { ...ok, overCap: true })).toBe(0)
  expect(setXp({ rir: 1, type: 'working' }, { ...ok, recoveryAtStart: 29 })).toBe(0)
  expect(setXp({ rir: 1, type: 'working' }, { ...ok, overSessionCap: true })).toBe(0)
})

test('cardio XP and nutrition gates', () => {
  expect([10, 20, 30, 200].map(cardioXp)).toEqual([40, 40, 60, 120])
  expect(calorieTargetXp(2300, 2400, 1500)).toBe(40)
  expect(calorieTargetXp(2000, 2400, 1500)).toBe(0)
  expect(calorieTargetXp(1300, 1250, 1500)).toBe(0) // under the floor never pays
  expect([proteinTargetXp(135, 150), proteinTargetXp(100, 150)]).toEqual([40, 0])
  expect([waterTargetXp(3000, 3000), waterTargetXp(2000, 3000)]).toEqual([25, 0])
})

test('multipliers: streak +1%/7 days to 15%, stat points with diminishing returns, total capped', () => {
  expect([0, 7, 70, 500].map(streakBonus)).toEqual([0, 0.01, 0.1, 0.15])
  expect(statBonus(30)).toBeCloseTo(0.15)
  expect(statBonus(60)).toBeCloseTo(0.225)
  expect(statBonus(200)).toBeCloseTo(0.225)
  expect(multiplier('str', { streak: 14, allocated: { str: 10 } })).toBeCloseTo(1.02 * 1.05, 3)
  expect(multiplier('str', { streak: 999, allocated: { str: 60 }, titleCategory: 'str', shadowBonus: { str: 0.18 }, comeback: true })).toBe(MAX_MULT)
})

test('award: safety-zeroed XP and corrections are never multiplied', () => {
  const ctx = { streak: 70, allocated: { str: 30 } }
  const e = award({ type: 'set', refId: 's1', base: 8, ts: 1, day: 'd' }, ctx, 'x')
  expect(e.xp).toBe(Math.round(8 * e.mult))
  expect(e.category).toBe('str')
  expect(award({ type: 'set', refId: 's2', base: 0, ts: 1, day: 'd' }, ctx, 'y').mult).toBe(1)
  expect(award({ type: 'correction', refId: 's3', base: -8, ts: 1, day: 'd' }, ctx, 'z').xp).toBe(-8)
  expect(award({ type: 'meal', refId: 'm', base: 15, ts: 1, day: 'd', category: 'int' }, ctx, 'm').category).toBe('int')
})

test('ledger fold recomputes everything: level, gold, stats, points', () => {
  const events = [
    { xp: 10_000, gold: 500, category: 'str' as const, type: 'workout' as const },
    { xp: 500, gold: 0, category: 'int' as const, type: 'meal' as const },
    { xp: 2000, gold: 1000, category: 'str' as const, type: 'trial' as const },
    { xp: -8, gold: 0, category: 'str' as const, type: 'correction' as const },
    { xp: 0, gold: -250, category: 'vit' as const, type: 'purchase' as const },
  ]
  const s = foldLedger(events)
  expect(s.totalXp).toBe(12_492)
  expect(s.gold).toBe(1250)
  expect(s.level).toBe(levelFromTotal(12_492).level)
  expect(s.stats.str).toBe(10 + Math.floor(12_000 / 250) + s.level - 1)
  expect(s.stats.int).toBe(10 + 2 + s.level - 1)
  expect(s.pointsEarned).toBe(3 * (s.level - 1) + 5)
  expect(foldLedger([]).level).toBe(1)
  expect(levelUpGold(1, 3)).toBe(50)
})
