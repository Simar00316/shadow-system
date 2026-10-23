import Dexie from 'dexie'
import { ShadowDB } from './schema'

const STORES = ['profile', 'exercises', 'exercisePrefs', 'plans', 'planDays', 'planExercises', 'workouts', 'sets', 'cardio', 'recovery', 'readiness', 'foods', 'meals', 'mealLogs', 'water', 'measurements', 'photos', 'player', 'xpEvents', 'quests', 'dungeons', 'shadows', 'titles', 'inventory', 'systemMessages', 'settings', 'notificationSchedule']

let n = 0
const fresh = () => new ShadowDB(`test-${Date.now()}-${n++}`)

test('v1 creates every PRD B2 store', async () => {
  const d = fresh()
  await d.open()
  expect(d.tables.map((t) => t.name).sort()).toEqual([...STORES].sort())
  expect(d.verno).toBe(1)
  d.close()
  await Dexie.delete(d.name)
})

test('xpEvents enforces one award per type+refId (idempotent ledger)', async () => {
  const d = fresh()
  const e = { id: 'a', ts: 1, day: '2026-10-23', type: 'workout' as const, refId: 'w1', base: 150, mult: 1, xp: 150, gold: 50, category: 'str' as const }
  await d.xpEvents.add(e)
  await expect(d.xpEvents.add({ ...e, id: 'b' })).rejects.toThrow()
  d.close()
  await Dexie.delete(d.name)
})

// Blob storage is covered by the WebKit E2E (fake-indexeddb cannot clone jsdom Blobs).
