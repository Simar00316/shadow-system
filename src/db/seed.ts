// Exercise library seeding. The hashed asset URL is the version: the file is fetched and parsed only when it changed.
import exercisesUrl from '@/data/exercises.json?url'
import { db } from './schema'
import type { Exercise } from '@/engine/types'

export async function seedList(list: Exercise[], version: string) {
  await db.transaction('rw', db.exercises, db.settings, async () => {
    await db.exercises.bulkPut(list)
    await db.settings.put({ key: 'exercisesVersion', value: version })
  })
}

export async function seedFromUrl(url = exercisesUrl) {
  if ((await db.settings.get('exercisesVersion'))?.value === url) return false
  const list = (await (await fetch(url)).json()) as Exercise[]
  await seedList(list, url)
  return true
}
