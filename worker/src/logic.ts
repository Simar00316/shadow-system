// Pure push-reminder logic (PRD B4): which reminders are due now, which are already satisfied, and the payload.
// No health data reaches the Worker: only the schedule, a timezone and daily booleans.
import { systemMessage, type MessageEvent } from '../../src/engine/messages'

export type Reminder = { id: string; kind: string; time: string; enabled: boolean }
export type PushSub = { endpoint: string; expirationTime: number | null; keys: { auth: string; p256dh: string } }
/** Daily booleans sent by the app after each log. `day` is the device's local YYYY-MM-DD. */
export type DailyStatus = { day: string; workoutDone?: boolean; restDay?: boolean; readinessDone?: boolean; kcalHit?: boolean; waterHit?: boolean; mealsLogged?: number; dailyCleared?: boolean; streak?: number }
export type Device = { subscription: PushSub; tz: string; schedule: Reminder[]; status?: DailyStatus; sent?: { day: string; ids: string[] } }

/** Reminders fire at most this late (cron runs every 15 min; a missed run still delivers within one more). */
export const WINDOW_MIN = 30

/** Local date and minute-of-day for an IANA timezone. */
export function localClock(now: number, tz: string): { day: string; min: number } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now)).map((p) => [p.type, p.value]))
  return { day: `${parts.year}-${parts.month}-${parts.day}`, min: Number(parts.hour) * 60 + Number(parts.minute) }
}

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

/** True when today's status already covers this reminder, so sending it would be noise. */
export function satisfied(r: Reminder, s: DailyStatus | undefined): boolean {
  if (!s) return false
  switch (r.kind) {
    case 'workout': return !!(s.workoutDone || s.restDay)
    case 'readiness': return !!s.readinessDone
    case 'calorie_check': return !!s.kcalHit
    case 'water': return !!s.waterHit
    case 'meal': return (s.mealsLogged ?? 0) > Number(r.id.split('-')[1] ?? 0)
    case 'streak_risk': case 'daily_warning': return !!s.dailyCleared
    default: return false
  }
}

/** Reminders to send now: enabled, time passed within the window, not sent today, not satisfied. */
export function dueReminders(d: Device, now: number): Reminder[] {
  const { day, min } = localClock(now, d.tz)
  const sent = d.sent?.day === day ? d.sent.ids : []
  const status = d.status?.day === day ? d.status : undefined
  return d.schedule.filter((r) => {
    const t = toMin(r.time)
    return r.enabled && min >= t && min - t < WINDOW_MIN && !sent.includes(r.id) && !satisfied(r, status)
  })
}

const EVENT: Record<string, MessageEvent> = { workout: 'workout_reminder', readiness: 'readiness_prompt', calorie_check: 'calorie_check', water: 'water_reminder', meal: 'meal_reminder', streak_risk: 'streak_risk', daily_warning: 'daily_warning' }
const NAV: Record<string, string> = { workout: '/train', readiness: '/', calorie_check: '/diet', water: '/diet', meal: '/diet', streak_risk: '/quests', daily_warning: '/quests' }
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']

/** One payload valid as Declarative Web Push (iOS 18.4+) and readable by our SW push handler (research/platform.md §1). */
export function payload(r: Reminder, s: DailyStatus | undefined, rand: () => number = Math.random) {
  const vars: Record<string, string | number> = { cover: 'Clear the Daily Quest before midnight.' }
  if (r.kind === 'meal') vars.meal = MEALS[Number(r.id.split('-')[1] ?? 0)] ?? 'meal'
  if (s?.streak) vars.streak = s.streak
  // Variants that need numbers the Worker never receives (e.g. kcal) fall back to a fixed line.
  const msg = systemMessage(EVENT[r.kind] ?? 'daily_issued', vars, new Map(), rand)
  const body = /\{\w+\}/.test(msg) ? '[Evening report due. Open the System to review today\'s nutrition.]' : msg
  return { web_push: 8030, notification: { title: 'SYSTEM', body, tag: r.kind, navigate: NAV[r.kind] ?? '/', lang: 'en' }, navigate: NAV[r.kind] ?? '/' }
}
