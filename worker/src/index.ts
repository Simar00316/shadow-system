// Shadow System push Worker (PRD B4, research/platform.md §10). Endpoints behind a bearer token and a CORS allowlist;
// a 15-minute cron sends due, unsatisfied reminders with VAPID + aes128gcm (@block65/webcrypto-web-push).
import { buildPushPayload } from '@block65/webcrypto-web-push'
import { dueReminders, localClock, payload, type DailyStatus, type Device, type PushSub, type Reminder } from './logic'

/** Minimal Workers KV surface we use (avoids pulling in @cloudflare/workers-types). */
export type KV = {
  get(key: string, type: 'json'): Promise<unknown>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  list(opts: { prefix: string; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>
}
export type Env = { DEVICES: KV; API_TOKEN: string; ALLOWED_ORIGIN: string; VAPID_PUBLIC_KEY: string; VAPID_PRIVATE_KEY: string; VAPID_SUBJECT: string }

/** Pushes per device per cron run: keeps CPU under the free-plan 10 ms budget (research/platform.md §9). */
const MAX_PER_RUN = 3
const key = (id: string) => `dev:${id}`
const ID = /^[A-Za-z0-9_-]{8,64}$/

function cors(env: Env) {
  return { 'access-control-allow-origin': env.ALLOWED_ORIGIN, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type', vary: 'origin' }
}
const json = (env: Env, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors(env) } })

const isSub = (s: unknown): s is PushSub => {
  const x = s as PushSub
  return !!x && typeof x.endpoint === 'string' && x.endpoint.startsWith('https://') && typeof x.keys?.auth === 'string' && typeof x.keys?.p256dh === 'string'
}
const isSchedule = (s: unknown): s is Reminder[] => Array.isArray(s) && s.length <= 100 && s.every((r: Reminder) => typeof r?.id === 'string' && typeof r.kind === 'string' && /^\d{2}:\d{2}$/.test(r.time) && typeof r.enabled === 'boolean')
const isTz = (tz: unknown): tz is string => { try { return typeof tz === 'string' && !!new Intl.DateTimeFormat('en', { timeZone: tz }) } catch { return false } }

export async function handleFetch(req: Request, env: Env): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) })
  if (req.headers.get('authorization') !== `Bearer ${env.API_TOKEN}`) return json(env, { error: 'unauthorized' }, 401)
  if (req.method !== 'POST') return json(env, { error: 'method' }, 405)
  if (Number(req.headers.get('content-length') ?? 0) > 16_384) return json(env, { error: 'too large' }, 413)
  let body: { id?: unknown; subscription?: unknown; tz?: unknown; schedule?: unknown; status?: DailyStatus }
  try { body = await req.json() } catch { return json(env, { error: 'bad json' }, 400) }
  if (typeof body.id !== 'string' || !ID.test(body.id)) return json(env, { error: 'bad id' }, 400)
  const k = key(body.id)
  const path = new URL(req.url).pathname
  if (path === '/subscribe') {
    if (!isSub(body.subscription) || !isTz(body.tz) || !isSchedule(body.schedule)) return json(env, { error: 'bad subscription' }, 400)
    const prev = (await env.DEVICES.get(k, 'json')) as Device | null
    await env.DEVICES.put(k, JSON.stringify({ ...prev, subscription: body.subscription, tz: body.tz, schedule: body.schedule } satisfies Device))
    return json(env, { ok: true })
  }
  if (path === '/status') {
    const prev = (await env.DEVICES.get(k, 'json')) as Device | null
    if (!prev) return json(env, { error: 'not subscribed' }, 404)
    const s = body.status
    if (!s || typeof s.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.day)) return json(env, { error: 'bad status' }, 400)
    // Only known booleans and counters are kept; nothing else is stored.
    const status: DailyStatus = { day: s.day, workoutDone: !!s.workoutDone, restDay: !!s.restDay, readinessDone: !!s.readinessDone, kcalHit: !!s.kcalHit, waterHit: !!s.waterHit, mealsLogged: Math.max(0, Math.min(10, Number(s.mealsLogged) || 0)), dailyCleared: !!s.dailyCleared, streak: Math.max(0, Math.min(10_000, Number(s.streak) || 0)) }
    await env.DEVICES.put(k, JSON.stringify({ ...prev, status }))
    return json(env, { ok: true })
  }
  if (path === '/unsubscribe') {
    await env.DEVICES.delete(k)
    return json(env, { ok: true })
  }
  return json(env, { error: 'not found' }, 404)
}

/** Send due reminders for every device. Returns counts for logging and tests. */
export async function runCron(env: Env, now = Date.now(), send: typeof fetch = fetch) {
  const out = { sent: 0, removed: 0, failed: 0 }
  const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
  let cursor: string | undefined
  do {
    const page = await env.DEVICES.list({ prefix: 'dev:', cursor })
    for (const { name } of page.keys) {
      const d = (await env.DEVICES.get(name, 'json')) as Device | null
      if (!d) continue
      const due = dueReminders(d, now).slice(0, MAX_PER_RUN)
      if (!due.length) continue
      const day = localClock(now, d.tz).day
      const ids = d.sent?.day === day ? [...d.sent.ids] : []
      let gone = false
      for (const r of due) {
        const init = await buildPushPayload({ data: payload(r, d.status), options: { ttl: 4 * 3600, urgency: 'high', topic: r.kind.replace(/_/g, '-').slice(0, 32) } }, d.subscription, vapid)
        const res = await send(d.subscription.endpoint, init)
        if (res.status === 404 || res.status === 410 || (res.status === 400 && (await res.text()).includes('VapidPkHashMismatch'))) { gone = true; break }
        if (res.ok) { out.sent++; ids.push(r.id) } else out.failed++
      }
      if (gone) { await env.DEVICES.delete(name); out.removed++; continue }
      await env.DEVICES.put(name, JSON.stringify({ ...d, sent: { day, ids } }))
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
  return out
}

export default {
  fetch: (req: Request, env: Env) => handleFetch(req, env),
  scheduled: (_c: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) => ctx.waitUntil(runCron(env).then((r) => console.log('cron', JSON.stringify(r)))),
}
