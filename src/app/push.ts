// Push reminders client (PRD B4, research/platform.md §1). Subscribes inside a tap, syncs the reminder schedule
// to the Worker, and sends tiny daily booleans so satisfied reminders are skipped. No health data leaves the device.
// Without VITE_PUSH_URL / VITE_PUSH_TOKEN / VITE_VAPID_PUBLIC_KEY the client runs in mock mode (nothing is sent).
import { liveQuery } from 'dexie'
import { db } from '@/db/schema'
import { getSetting, setSetting, uid } from '@/db/repo'
import { dayOf } from '@/engine/dates'
import { calorieTargetXp } from '@/engine/xp'
import type { Day } from '@/engine/model'
import { sessionFor } from './game'
import { dayTargets, totals } from './diet'

const env = import.meta.env
const URL_ = env.VITE_PUSH_URL as string | undefined
const TOKEN = env.VITE_PUSH_TOKEN as string | undefined
const VAPID = env.VITE_VAPID_PUBLIC_KEY as string | undefined
export const pushConfigured = () => !!(URL_ && TOKEN && VAPID)

export type PushState = { id: string; enabled: boolean; endpoint?: string; needsRepair?: boolean; mock?: boolean }
export type DailyStatus = { day: Day; workoutDone: boolean; restDay: boolean; readinessDone: boolean; kcalHit: boolean; waterHit: boolean; mealsLogged: number; dailyCleared: boolean; streak: number }

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
export const isStandalone = () => (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches

async function state(): Promise<PushState> {
  const s = await getSetting<PushState>('push')
  if (s) return s
  const fresh: PushState = { id: uid().replace(/[^A-Za-z0-9_-]/g, ''), enabled: false }
  await setSetting('push', fresh)
  return fresh
}

async function post(path: string, body: Record<string, unknown>, fetcher: typeof fetch = fetch) {
  if (!pushConfigured()) return true // mock mode
  const res = await fetcher(`${URL_}${path}`, { method: 'POST', headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return res.ok
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const b64uToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

/** Send the current schedule (and subscription) to the Worker. */
export async function syncSchedule(sub?: PushSubscriptionJSON) {
  const st = await state()
  if (!st.enabled) return false
  const subscription = sub ?? (await (await navigator.serviceWorker.ready).pushManager.getSubscription())?.toJSON()
  if (!subscription && !st.mock) return false
  return post('/subscribe', { id: st.id, subscription: subscription ?? { endpoint: 'https://mock.invalid/push', keys: { auth: '', p256dh: '' } }, tz: tz(), schedule: await db.notificationSchedule.toArray() })
}

/**
 * Turn reminders on. Call directly from a tap handler: iOS requires the permission prompt and subscribe()
 * to run inside the user gesture, so nothing unrelated is awaited first.
 */
export async function enablePush(): Promise<'on' | 'denied' | 'unsupported' | 'error'> {
  if (!pushSupported()) return 'unsupported'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'denied'
  const st = await state()
  try {
    if (!pushConfigured()) {
      await setSetting('push', { ...st, enabled: true, mock: true, needsRepair: false } satisfies PushState)
      await syncSchedule()
      return 'on'
    }
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(VAPID!) }))
    await setSetting('push', { ...st, enabled: true, endpoint: sub.endpoint, needsRepair: false, mock: false } satisfies PushState)
    lastStatus = ''
    return (await syncSchedule(sub.toJSON())) ? 'on' : 'error'
  } catch {
    return 'error'
  }
}

export async function disablePush() {
  const st = await state()
  try { await (await navigator.serviceWorker?.ready)?.pushManager.getSubscription().then((s) => s?.unsubscribe()) } catch { /* already gone */ }
  await post('/unsubscribe', { id: st.id }).catch(() => false)
  await setSetting('push', { ...st, enabled: false, endpoint: undefined, needsRepair: false } satisfies PushState)
}

/**
 * On every launch: subscriptions can die silently on iOS (research/platform.md §1). Re-send a live one; if it is
 * gone while permission is still granted, flag it so Settings shows "Reminders are off, tap to repair".
 */
export async function repairPush() {
  const st = await state()
  if (!st.enabled || st.mock || !pushSupported()) return
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription()
  if (!sub) { await setSetting('push', { ...st, needsRepair: true }); return }
  if (sub.endpoint !== st.endpoint) await setSetting('push', { ...st, endpoint: sub.endpoint, needsRepair: false })
  await syncSchedule(sub.toJSON()).catch(() => false)
}

/** Today's booleans for the Worker's skip logic. */
export async function dailyStatus(day: Day = dayOf()): Promise<DailyStatus | null> {
  const profile = await db.profile.get('me')
  if (!profile) return null
  const [workouts, readiness, logs, water, quest, player, session, t] = await Promise.all([
    db.workouts.where('day').equals(day).toArray(), db.readiness.get(day), db.mealLogs.where('day').equals(day).toArray(), db.water.where('day').equals(day).toArray(),
    db.quests.get(`daily-${day}`), db.player.get('me'), sessionFor(day), dayTargets(profile, day),
  ])
  return {
    day,
    workoutDone: workouts.some((w) => !!w.endedAt && w.kind !== 'recovery'),
    restDay: !session,
    readinessDone: !!readiness,
    kcalHit: calorieTargetXp(totals(logs).k, t.kcal, t.floor) > 0,
    waterHit: water.reduce((a, w) => a + w.ml, 0) >= t.waterMl,
    mealsLogged: new Set(logs.map((l) => l.meal)).size,
    dailyCleared: quest?.status === 'cleared' || quest?.status === 'waived',
    streak: player?.streak ?? 0,
  }
}

let lastStatus = ''
let timer: ReturnType<typeof setTimeout> | undefined

/** Watch today's data and send the status when a boolean flips, debounced 2 s (KV allows ~1 write/s per key). */
export function startStatusSync(delay = 2000) {
  const sub = liveQuery(() => dailyStatus()).subscribe({
    next: (s) => {
      if (!s) return
      clearTimeout(timer)
      timer = setTimeout(async () => {
        const st = await state()
        const json = JSON.stringify(s)
        if (!st.enabled || json === lastStatus) return
        if (await post('/status', { id: st.id, status: s }).catch(() => false)) lastStatus = json
      }, delay)
    },
  })
  return () => { clearTimeout(timer); sub.unsubscribe() }
}
