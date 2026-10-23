import { dayScore, eligible, groceryList, planDay, planWeek, swaps } from './diet'
import { DISHES, INGREDIENTS } from './testdata'

const T = { kcal: 2400, protein: 150 }

test('eligible respects diet type, cuisine (+generic) and budget', () => {
  const veg = eligible(DISHES, { dietType: 'vegetarian', cuisine: 'india', budget: false })
  expect(veg.every((d) => ['vegan', 'vegetarian'].includes(d.diet) && ['india', 'generic'].includes(d.cuisine))).toBe(true)
  expect(eligible(DISHES, { dietType: 'vegan', cuisine: 'japan', budget: true }).every((d) => d.diet === 'vegan' && d.tier <= 2)).toBe(true)
  expect(eligible(DISHES, { dietType: 'nonveg', cuisine: 'usa', budget: false, exclude: new Set([DISHES[0].id]) }).some((d) => d.id === DISHES[0].id)).toBe(false)
})

test.each([
  ['india', 'vegetarian'], ['india', 'nonveg'], ['usa', 'nonveg'], ['japan', 'vegan'], ['mexico', 'eggetarian'], ['italy', 'vegetarian'], ['korea', 'nonveg'],
] as const)('%s %s day plan lands within 10%% of kcal with ≥ 80%% protein', (cuisine, dietType) => {
  const d = planDay(DISHES, T, { dietType, cuisine, budget: false, seed: 7 })
  expect(d.meals).toHaveLength(4)
  expect(Math.abs(d.kcal - T.kcal) / T.kcal).toBeLessThan(0.1)
  expect(d.p).toBeGreaterThanOrEqual(T.protein * 0.8)
})

test('plans are reproducible by seed and vary across the week', () => {
  const o = { dietType: 'nonveg' as const, cuisine: 'india', budget: true, seed: 3 }
  expect(planDay(DISHES, T, o).meals.map((m) => m.dish.id)).toEqual(planDay(DISHES, T, o).meals.map((m) => m.dish.id))
  const week = planWeek(DISHES, T, o)
  expect(week).toHaveLength(7)
  expect(new Set(week.flatMap((d) => d.meals.map((m) => m.dish.id))).size).toBeGreaterThan(10)
  for (let i = 1; i < 7; i++) {
    const shared = week[i].meals.filter((m) => week[i - 1].meals.some((x) => x.dish.id === m.dish.id))
    expect(shared.length).toBeLessThanOrEqual(1)
  }
})

test('empty pool gives an empty day', () => {
  expect(planDay([], T, { dietType: 'vegan', cuisine: 'india', budget: false }).meals).toEqual([])
})

test('swaps stay in slot, diet and ±15% kcal', () => {
  const d = planDay(DISHES, T, { dietType: 'vegetarian', cuisine: 'india', budget: false, seed: 1 })
  const lunch = d.meals.find((m) => m.slot === 'lunch')!
  const s = swaps(lunch, DISHES, { dietType: 'vegetarian', cuisine: 'india', budget: false })
  expect(s.length).toBeGreaterThan(0)
  for (const m of s) {
    expect(m.dish.meal).toContain('lunch')
    expect(Math.abs(m.kcal - lunch.kcal)).toBeLessThanOrEqual(lunch.kcal * 0.15)
    expect(['vegan', 'vegetarian']).toContain(m.dish.diet)
  }
})

test('score penalises missing protein and budget tiers', () => {
  const day = planDay(DISHES, T, { dietType: 'nonveg', cuisine: 'uk', budget: false, seed: 2 })
  expect(dayScore({ ...day, p: 0 }, T)).toBeGreaterThan(dayScore(day, T))
  expect(dayScore(day, T, true)).toBeGreaterThanOrEqual(dayScore(day, T))
  expect(dayScore({ ...day, p: 1000 }, T)).toBeGreaterThan(dayScore({ ...day, p: T.protein }, T))
})

test('grocery list aggregates grams across days by ingredient', () => {
  const week = planWeek(DISHES, T, { dietType: 'vegetarian', cuisine: 'india', budget: false, seed: 9 }, 3)
  const list = groceryList(week, INGREDIENTS)
  expect(list.length).toBeGreaterThan(5)
  expect(list.every((i) => i.grams > 0 && i.grams % 10 === 0)).toBe(true)
  const sorted = [...list].sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
  expect(list).toEqual(sorted)
  expect(groceryList([{ meals: [{ slot: 'snack', dish: { ...DISHES[0], ingredients: [['nope', 10]] }, servings: 1, kcal: 0, p: 0, c: 0, f: 0 }], kcal: 0, p: 0, c: 0, f: 0 }], INGREDIENTS)[0].name).toBe('nope')
})
