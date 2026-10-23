// Repositories: the small set of DB operations shared by several screens.
import { db } from './schema'
import type { Exercise } from '@/engine/types'
import type { Player, Profile, Setting } from '@/engine/model'

export const uid = () => (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)

let seeding: Promise<boolean> | null = null

/**
 * Load the bundled exercise library into IndexedDB when the bundle changes. Single-flight: concurrent callers share
 * one run. In the browser it runs in a Web Worker (src/db/seed.worker.ts); `load` is for tests.
 */
export function seedExercises(load?: () => Promise<Exercise[]>) {
  if (load) return seedWith(load)
  seeding ??= runSeed().finally(() => { seeding = null })
  return seeding
}

async function seedWith(load: () => Promise<Exercise[]>) {
  const list = await load()
  const version = `${list.length}:${list[0]?.id}:${list[list.length - 1]?.id}`
  if ((await getSetting<string>('exercisesVersion')) === version) return false
  const { seedList } = await import('./seed')
  await seedList(list, version)
  return true
}

async function runSeed(): Promise<boolean> {
  if (import.meta.env.MODE === 'test') return seedWith(async () => (await import('@/data/exercises.json')).default as Exercise[])
  if (typeof Worker !== 'undefined') {
    try {
      return await new Promise<boolean>((resolve, reject) => {
        const w = new Worker(new URL('./seed.worker.ts', import.meta.url), { type: 'module' })
        w.onmessage = (e: MessageEvent<{ ok: boolean; changed?: boolean; error?: string }>) => { w.terminate(); if (e.data.ok) resolve(!!e.data.changed); else reject(new Error(e.data.error)) }
        w.onerror = (e) => { w.terminate(); reject(new Error(e.message)) }
        w.postMessage('seed')
      })
    } catch { /* fall back to the main thread */ }
  }
  return (await import('./seed')).seedFromUrl()
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
