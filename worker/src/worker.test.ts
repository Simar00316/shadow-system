// @vitest-environment node
// Worker tests against a mocked push service: the mock decrypts the RFC 8291 body with the client's keys and
// verifies the RFC 8292 VAPID JWT, so a pass means a real push service could read the message.
import { describe, expect, it } from 'vitest'
import worker, { handleFetch, runCron, type Env, type KV } from './index'
import { dueReminders, localClock, payload, satisfied, type Device } from './logic'

const enc = new TextEncoder()
const b64u = (b: ArrayBuffer | Uint8Array) => Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b)).toString('base64url')
const unb64u = (s: string) => new Uint8Array(Buffer.from(s, 'base64url'))
const cat = (...a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length } return o }
async function hmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data))
}

function memKV(): KV & { m: Map<string, string> } {
  const m = new Map<string, string>()
  return {
    m,
    get: async (k) => (m.has(k) ? JSON.parse(m.get(k)!) : null),
    put: async (k, v) => { m.set(k, v) },
    delete: async (k) => { m.delete(k) },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
  }
}

async function setup() {
  const vapid = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair
  const vapidPub = new Uint8Array(await crypto.subtle.exportKey('raw', vapid.publicKey))
  const vapidD = (await crypto.subtle.exportKey('jwk', vapid.privateKey)).d!
  const client = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair
  const clientPub = new Uint8Array(await crypto.subtle.exportKey('raw', client.publicKey))
  const auth = crypto.getRandomValues(new Uint8Array(16))
  const env: Env & { DEVICES: ReturnType<typeof memKV> } = { DEVICES: memKV(), API_TOKEN: 'test-token', ALLOWED_ORIGIN: 'https://app.example', VAPID_PUBLIC_KEY: b64u(vapidPub), VAPID_PRIVATE_KEY: vapidD, VAPID_SUBJECT: 'https://app.example' }
  const subscription = { endpoint: 'https://web.push.apple.com/abc123', expirationTime: null, keys: { auth: b64u(auth), p256dh: b64u(clientPub) } }

  /** Mock push service: checks VAPID, decrypts aes128gcm, records the JSON payload. */
  const received: { url: string; body: Record<string, unknown>; headers: Record<string, string> }[] = []
  let status = 201
  const push = (async (url: string, init: { headers: Record<string, string>; body: Uint8Array }) => {
    const h = init.headers
    const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(h.authorization)!
    expect(k).toBe(env.VAPID_PUBLIC_KEY)
    const [hd, cl, sig] = jwt.split('.')
    const pub = await crypto.subtle.importKey('raw', unb64u(k), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, unb64u(sig), enc.encode(`${hd}.${cl}`))).toBe(true)
    const claims = JSON.parse(Buffer.from(cl, 'base64url').toString())
    expect(claims.aud).toBe('https://web.push.apple.com')
    expect(h['content-encoding']).toBe('aes128gcm')
    const b = init.body
    const salt = b.slice(0, 16), idlen = b[20], asPub = b.slice(21, 21 + idlen), ct = b.slice(21 + idlen)
    const asKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
    const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, client.privateKey, 256))
    const ikm = await hmac(await hmac(auth, ecdh), cat(enc.encode('WebPush: info\0'), clientPub, asPub, new Uint8Array([1])))
    const prk = await hmac(salt, ikm)
    const cek = (await hmac(prk, enc.encode('Content-Encoding: aes128gcm\0\x01'))).slice(0, 16)
    const nonce = (await hmac(prk, enc.encode('Content-Encoding: nonce\0\x01'))).slice(0, 12)
    const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt'])
    let plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, ct))
    let end = plain.length - 1
    while (plain[end] === 0) end--
    expect(plain[end]).toBe(2)
    plain = plain.slice(0, end)
    received.push({ url, body: JSON.parse(new TextDecoder().decode(plain)), headers: h })
    return new Response(status === 400 ? '{"reason":"VapidPkHashMismatch"}' : '', { status })
  }) as unknown as typeof fetch
  return { env, subscription, push, received, setStatus: (s: number) => { status = s } }
}

const req = (env: Env, path: string, body: unknown, token = env.API_TOKEN) => new Request(`https://push.example${path}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
const schedule = [
  { id: 'workout', kind: 'workout', time: '18:00', enabled: true },
  { id: 'water-600', kind: 'water', time: '10:00', enabled: true },
  { id: 'meal-1', kind: 'meal', time: '13:00', enabled: true },
  { id: 'penalty', kind: 'daily_warning', time: '21:00', enabled: true },
]
// 2026-10-23 18:05 in Asia/Kolkata (UTC+5:30) = 12:35 UTC
const AT_1805_IST = Date.UTC(2026, 9, 23, 12, 35)

describe('logic', () => {
  it('computes local time in the device timezone', () => {
    expect(localClock(AT_1805_IST, 'Asia/Kolkata')).toEqual({ day: '2026-10-23', min: 18 * 60 + 5 })
    expect(localClock(AT_1805_IST, 'America/New_York')).toEqual({ day: '2026-10-23', min: 8 * 60 + 35 })
  })
  it('selects reminders inside the window only, once per day, and skips satisfied ones', () => {
    const d: Device = { subscription: { endpoint: 'https://x', expirationTime: null, keys: { auth: '', p256dh: '' } }, tz: 'Asia/Kolkata', schedule }
    expect(dueReminders(d, AT_1805_IST).map((r) => r.id)).toEqual(['workout'])
    expect(dueReminders({ ...d, sent: { day: '2026-10-23', ids: ['workout'] } }, AT_1805_IST)).toEqual([])
    expect(dueReminders({ ...d, sent: { day: '2026-10-22', ids: ['workout'] } }, AT_1805_IST)).toHaveLength(1)
    expect(dueReminders({ ...d, status: { day: '2026-10-23', workoutDone: true } }, AT_1805_IST)).toEqual([])
    // yesterday's status does not suppress today's reminder
    expect(dueReminders({ ...d, status: { day: '2026-10-22', workoutDone: true } }, AT_1805_IST)).toHaveLength(1)
    expect(dueReminders({ ...d, schedule: schedule.map((r) => ({ ...r, enabled: false })) }, AT_1805_IST)).toEqual([])
    expect(dueReminders(d, AT_1805_IST + 40 * 60_000)).toEqual([]) // past the 30 min window
  })
  it('maps each kind to its daily boolean', () => {
    const day = '2026-10-23'
    expect(satisfied({ id: 'workout', kind: 'workout', time: '', enabled: true }, { day, restDay: true })).toBe(true)
    expect(satisfied({ id: 'meal-1', kind: 'meal', time: '', enabled: true }, { day, mealsLogged: 1 })).toBe(false)
    expect(satisfied({ id: 'meal-1', kind: 'meal', time: '', enabled: true }, { day, mealsLogged: 2 })).toBe(true)
    expect(satisfied({ id: 'streak', kind: 'streak_risk', time: '', enabled: true }, { day, dailyCleared: true })).toBe(true)
    expect(satisfied({ id: 'water-1', kind: 'water', time: '', enabled: true }, { day })).toBe(false)
  })
  it('builds a declarative-push payload with no unfilled placeholders', () => {
    for (const kind of ['workout', 'readiness', 'calorie_check', 'water', 'meal', 'streak_risk', 'daily_warning']) {
      for (let i = 0; i < 20; i++) {
        const p = payload({ id: kind === 'meal' ? 'meal-2' : kind, kind, time: '09:00', enabled: true }, undefined)
        expect(p.web_push).toBe(8030)
        expect(p.notification.body).toMatch(/^\[.*\]$/)
        expect(p.notification.body).not.toMatch(/\{\w+\}/)
        expect(JSON.stringify(p).length).toBeLessThan(3993)
      }
    }
  })
})

describe('endpoints', () => {
  it('rejects a wrong token and answers CORS preflight', async () => {
    const { env } = await setup()
    expect((await handleFetch(req(env, '/subscribe', {}, 'nope'), env)).status).toBe(401)
    const pre = await handleFetch(new Request('https://push.example/subscribe', { method: 'OPTIONS' }), env)
    expect(pre.status).toBe(204)
    expect(pre.headers.get('access-control-allow-origin')).toBe('https://app.example')
  })
  it('validates input at the boundary', async () => {
    const { env, subscription } = await setup()
    expect((await handleFetch(req(env, '/subscribe', { id: 'x', subscription, tz: 'UTC', schedule }), env)).status).toBe(400)
    expect((await handleFetch(req(env, '/subscribe', { id: 'device-0001', subscription: { ...subscription, endpoint: 'http://evil' }, tz: 'UTC', schedule }), env)).status).toBe(400)
    expect((await handleFetch(req(env, '/subscribe', { id: 'device-0001', subscription, tz: 'Mars/Base', schedule }), env)).status).toBe(400)
    expect((await handleFetch(req(env, '/status', { id: 'device-0001', status: { day: 'today' } }), env)).status).toBe(404)
  })
  it('subscribes, stores only daily booleans, and unsubscribes', async () => {
    const { env, subscription } = await setup()
    expect((await handleFetch(req(env, '/subscribe', { id: 'device-0001', subscription, tz: 'Asia/Kolkata', schedule }), env)).status).toBe(200)
    expect((await handleFetch(req(env, '/status', { id: 'device-0001', status: { day: '2026-10-23', workoutDone: true, weightKg: 80 } }), env)).status).toBe(200)
    const stored = JSON.parse(env.DEVICES.m.get('dev:device-0001')!)
    expect(stored.status.workoutDone).toBe(true)
    expect(JSON.stringify(stored)).not.toContain('weightKg')
    expect((await handleFetch(req(env, '/unsubscribe', { id: 'device-0001' }), env)).status).toBe(200)
    expect(env.DEVICES.m.size).toBe(0)
  })
})

describe('cron against a mocked push service', () => {
  it('sends a decryptable, VAPID-signed reminder once, and skips it after the status says done', async () => {
    const { env, subscription, push, received } = await setup()
    await handleFetch(req(env, '/subscribe', { id: 'device-0001', subscription, tz: 'Asia/Kolkata', schedule }), env)
    expect(await runCron(env, AT_1805_IST, push)).toEqual({ sent: 1, removed: 0, failed: 0 })
    expect(received[0].url).toBe(subscription.endpoint)
    expect(received[0].headers.urgency).toBe('high')
    expect((received[0].body.notification as { tag: string }).tag).toBe('workout')
    expect(received[0].body.navigate).toBe('/train')
    // second run in the same window: already sent
    expect((await runCron(env, AT_1805_IST + 15 * 60_000, push)).sent).toBe(0)
    // next day, workout already logged: skipped
    await handleFetch(req(env, '/status', { id: 'device-0001', status: { day: '2026-10-24', workoutDone: true } }), env)
    expect((await runCron(env, AT_1805_IST + 86_400_000, push)).sent).toBe(0)
  })
  it('deletes dead subscriptions on 410 and on VapidPkHashMismatch', async () => {
    for (const code of [410, 404, 400]) {
      const { env, subscription, push, setStatus } = await setup()
      await handleFetch(req(env, '/subscribe', { id: 'device-0001', subscription, tz: 'Asia/Kolkata', schedule }), env)
      setStatus(code)
      expect((await runCron(env, AT_1805_IST, push)).removed).toBe(1)
      expect(env.DEVICES.m.size).toBe(0)
    }
  })
  it('retries a reminder after a transient failure', async () => {
    const { env, subscription, push, setStatus } = await setup()
    await handleFetch(req(env, '/subscribe', { id: 'device-0001', subscription, tz: 'Asia/Kolkata', schedule }), env)
    setStatus(429)
    expect(await runCron(env, AT_1805_IST, push)).toEqual({ sent: 0, removed: 0, failed: 1 })
    setStatus(201)
    expect((await runCron(env, AT_1805_IST + 15 * 60_000, push)).sent).toBe(1)
  })
  it('exposes the Worker entry points', () => {
    expect(typeof worker.fetch).toBe('function')
    expect(typeof worker.scheduled).toBe('function')
  })
})
