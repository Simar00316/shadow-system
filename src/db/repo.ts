// Repositories: the small set of DB operations shared by several screens.
import { db } from './schema'
import type { Exercise } from '@/engine/types'
import type { Player, Profile, Setting } from '@/engine/model'

export const uid = () => (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)

/** Load the bundled exercise library into IndexedDB when the bundle changes. */
export async function seedExercises(load: () => Promise<Exercise[]> = async () => (await import('@/data/exercises.json')).default as Exercise[]) {
  const list = await load()
  const version = `${list.length}:${list[0]?.id}:${list[list.length - 1]?.id}`
  if ((await getSetting<string>('exercisesVersion')) === version) return false
  await db.transaction('rw', db.exercises, db.settings, async () => {
    await db.exercises.bulkPut(list)
    await db.settings.put({ key: 'exercisesVersion', value: version })
  })
  return true
}

export async function getSetting<T>(key: string, fallback?: T): Promise<T | undefined> {
  const s = await db.settings.get(key)
  return (s?.value as T | undefined) ?? fallback
}

export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value } satisfies Setting)

export const getProfile = () => db.profile.get('me')
export const saveProfile = (p: Profile) => db.profile.put(p)
export const getPlayer = () => db.player.get('me')
export const savePlayer = (p: Player) => db.player.put(p)
