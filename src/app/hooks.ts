// Live data hooks (Dexie liveQuery): screens re-render when the database changes.
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { dayOf } from '@/engine/dates'
import { recovery, setHits, cardioHits } from '@/engine/recovery'
import { useEffect, useState } from 'react'

export const useProfile = () => useLiveQuery(() => db.profile.get('me'), [], null)
export const usePlayer = () => useLiveQuery(() => db.player.get('me'), [], null)
export const useToday = () => {
  const [day, setDay] = useState(dayOf())
  useEffect(() => {
    const id = setInterval(() => setDay(dayOf()), 30_000)
    return () => clearInterval(id)
  }, [])
  return day
}
export const useQuest = (id: string) => useLiveQuery(() => db.quests.get(id), [id], null)
export const useExercises = () => useLiveQuery(() => db.exercises.toArray(), [], [])

/** Per-muscle recovery now, from the last 10 days of sets and cardio plus overrides and today's readiness. */
export function useRecovery() {
  return useLiveQuery(async () => {
    const now = Date.now()
    const since = now - 10 * 864e5
    const [sets, cardio, exercises, overrides, readiness, profile] = await Promise.all([
      db.sets.where('completedAt').above(since).toArray(), db.cardio.where('startedAt').above(since).toArray(), db.exercises.toArray(),
      db.recovery.toArray(), db.readiness.get(dayOf()), db.profile.get('me'),
    ])
    const byId = new Map(exercises.map((e) => [e.id, e]))
    const firstSeen = new Map<string, number>()
    for (const s of await db.sets.orderBy('completedAt').toArray()) if (!firstSeen.has(s.exerciseId)) firstSeen.set(s.exerciseId, s.completedAt)
    const hits = [...setHits(sets, byId, { firstSeen }), ...cardioHits(cardio)]
    const age = profile ? Number(dayOf().slice(0, 4)) - profile.birthYear : 30
    const rec = recovery(hits, { now, age, overrides, readiness: readiness ?? null, injured: profile?.injuries.flatMap((i) => i.muscles) ?? [] })
    const trained = [...new Set(sets.flatMap((s) => byId.get(s.exerciseId)?.primary ?? []))]
    return { rec, trained }
  }, [], null)
}
