// M3 gate: data validation. No exercise without muscles, media or instructions; every food has macros.
import { existsSync, readFileSync } from 'node:fs'
import { EQUIPMENT, FORM_LIFTS, MUSCLES, PATTERNS, BASE_CLASSES, type Exercise } from '@/engine/types'
import type { Dish, Ingredient } from '@/engine/model'

const load = <T,>(f: string) => JSON.parse(readFileSync(f, 'utf8')) as T
const exercises = load<Exercise[]>('src/data/exercises.json')
const ingredients = load<Ingredient[]>('src/data/ingredients.json')
const dishes = existsSync('src/data/dishes.json') ? load<Dish[]>('src/data/dishes.json') : []

describe('exercises', () => {
  it('has a large merged library with unique ids', () => {
    expect(exercises.length).toBeGreaterThan(1500)
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length)
  })
  it('every exercise has muscles, media, description and step-by-step instructions', () => {
    const bad = exercises.filter((e) => !e.primary.length || !e.media.src.length || !e.media.thumb || !e.instructions.length || !e.description || e.tips.length < 2 || e.mistakes.length < 2)
    expect(bad.map((e) => e.id)).toEqual([])
  })
  it('every media file referenced exists on disk', () => {
    const missing = exercises.flatMap((e) => [...e.media.src, e.media.thumb]).filter((p) => !existsSync(`public${p}`))
    expect(missing.slice(0, 10)).toEqual([])
  })
  it('uses only canonical enums', () => {
    for (const e of exercises) {
      for (const m of [...e.primary, ...e.secondary]) expect(MUSCLES).toContain(m)
      for (const q of e.equipment) expect(EQUIPMENT).toContain(q)
      for (const c of e.classTags) expect(BASE_CLASSES).toContain(c)
      expect(PATTERNS).toContain(e.pattern)
      if (e.formCheck) expect(FORM_LIFTS).toContain(e.formCheck)
      expect(e.met).toBeGreaterThan(1)
      expect(e.primary.some((m) => e.secondary.includes(m))).toBe(false)
    }
  })
  it('covers every muscle and every form-check lift', () => {
    const muscles = new Set(exercises.flatMap((e) => e.primary))
    expect([...muscles].sort()).toEqual([...MUSCLES].sort())
    expect(new Set(exercises.map((e) => e.formCheck).filter(Boolean)).size).toBe(FORM_LIFTS.length)
  })
  it('third-party media carries attribution', () => {
    expect(exercises.filter((e) => e.id.startsWith('hx') && !e.media.credit)).toEqual([])
  })
})

describe('ingredients', () => {
  it('every food has complete, plausible macros', () => {
    for (const i of ingredients) {
      for (const k of ['k', 'p', 'c', 'f', 'fi'] as const) expect(Number.isFinite(i[k]) && i[k] >= 0).toBe(true)
      expect(i.p + i.c + i.f).toBeLessThanOrEqual(101)
      expect(i.k).toBeLessThanOrEqual(902)
      expect(['vegan', 'vegetarian', 'eggetarian', 'nonveg']).toContain(i.diet)
      expect([1, 2, 3]).toContain(i.tier)
    }
  })
  it('includes Indian staples from IFCT', () => {
    const ids = new Set(ingredients.map((i) => i.id))
    for (const id of ['atta', 'paneer', 'toor_dal', 'moong_dal', 'ghee', 'curd', 'besan', 'rajma']) expect(ids).toContain(id)
  })
  it('diet tags are sane', () => {
    const by = Object.fromEntries(ingredients.map((i) => [i.id, i.diet]))
    expect(by.chicken_breast).toBe('nonveg')
    expect(by.paneer).toBe('vegetarian')
    expect(by.egg).toBe('eggetarian')
    expect(by.tofu).toBe('vegan')
    expect(ingredients.filter((i) => (i.g === 'meat' || i.g === 'fish') && i.diet !== 'nonveg').map((i) => i.id)).toEqual([])
  })
})

describe('dishes', () => {
  const cuisines = ['india', 'usa', 'uk', 'mexico', 'italy', 'china', 'japan', 'thailand', 'lebanon', 'greece', 'korea', 'brazil', 'spain', 'france', 'pakistan', 'generic']
  it.each(cuisines)('%s has at least 40 dishes covering every meal slot', (c) => {
    const list = dishes.filter((d) => d.cuisine === c)
    expect(list.length).toBeGreaterThanOrEqual(40)
    for (const m of ['breakfast', 'lunch', 'dinner', 'snack']) expect(list.some((d) => d.meal.includes(m as never))).toBe(true)
  })
  it('every dish has macros and known ingredients', () => {
    const ids = new Set(ingredients.map((i) => i.id))
    for (const d of dishes) {
      expect(d.kcal).toBeGreaterThan(30)
      expect(d.p + d.c + d.f).toBeGreaterThan(0)
      for (const [id] of d.ingredients) expect(ids).toContain(id)
    }
  })
  it('every diet type has options in every cuisine', () => {
    for (const c of cuisines) {
      const list = dishes.filter((d) => d.cuisine === c)
      expect(list.filter((d) => d.diet === 'vegan').length).toBeGreaterThanOrEqual(5)
      expect(list.filter((d) => d.diet === 'vegan' || d.diet === 'vegetarian').length).toBeGreaterThanOrEqual(10)
    }
  })
})
