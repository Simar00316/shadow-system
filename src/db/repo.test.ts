import { db } from './schema'
import { getSetting, seedExercises, setSetting } from './repo'
import type { Exercise } from '@/engine/types'

const ex = (id: string) => ({ id, name: id }) as unknown as Exercise

beforeEach(async () => { await db.delete(); await db.open() })

test('seedExercises loads once per bundle version', async () => {
  expect(await seedExercises(async () => [ex('a'), ex('b')])).toBe(true)
  expect(await db.exercises.count()).toBe(2)
  expect(await seedExercises(async () => [ex('a'), ex('b')])).toBe(false)
  expect(await seedExercises(async () => [ex('a'), ex('b'), ex('c')])).toBe(true)
  expect(await db.exercises.count()).toBe(3)
})

test('settings round-trip with fallback', async () => {
  expect(await getSetting('x', 5)).toBe(5)
  await setSetting('x', { a: 1 })
  expect(await getSetting('x')).toEqual({ a: 1 })
})
