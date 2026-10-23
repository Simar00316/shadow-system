import { db } from '@/db/schema'
import { dayOf } from '@/engine/dates'
import { awaken, DEFAULT_NOTIFICATIONS, type AwakeningAnswers } from './awakening'
import { addWater, logMeal } from './diet'
import { checkIn } from './game'

const answers: AwakeningAnswers = {
  name: 'Jin', sex: 'male', birthYear: 1995, heightCm: 178, weightKg: 80, units: { lift: 'kg', body: 'kg' } as AwakeningAnswers['units'],
  goal: 'hypertrophy', experience: 'intermediate', equipment: ['barbell', 'dumbbell', 'bodyweight'] as AwakeningAnswers['equipment'], equipmentName: 'Gym', injuries: [],
  trainingDays: [1, 2, 3, 4, 5, 6, 0], sessionMinutes: 60, dietType: 'omnivore' as AwakeningAnswers['dietType'], cuisine: 'indian', budget: false,
  notifications: { ...DEFAULT_NOTIFICATIONS, enabled: true }, test: { pushups: 30, squats60: 40, plankSec: 90 } as unknown as AwakeningAnswers['test'], baseClass: 'tank',
}

beforeEach(async () => {
  await db.delete(); await db.open()
  vi.unstubAllEnvs(); vi.resetModules()
})

test('daily status flips as the Player logs, and carries no health values', async () => {
  const { dailyStatus } = await import('./push')
  await awaken(answers)
  const s0 = (await dailyStatus())!
  expect(s0).toMatchObject({ day: dayOf(), readinessDone: false, waterHit: false, mealsLogged: 0, workoutDone: false, restDay: false })
  await checkIn({ sleep: 4, soreness: 2, energy: 4, stress: 2 })
  await addWater(6000)
  await logMeal('breakfast', [{ ref: 'x', name: 'Oats', grams: 100, k: 380, p: 13, c: 60, f: 7 }])
  const s1 = (await dailyStatus())!
  expect(s1).toMatchObject({ readinessDone: true, waterHit: true, mealsLogged: 1 })
  expect(Object.values(s1).every((v) => typeof v === 'boolean' || typeof v === 'number' || v === s1.day)).toBe(true)
})

test('mock mode: reminders turn on without a Worker', async () => {
  vi.stubGlobal('Notification', { requestPermission: async () => 'granted' })
  vi.stubGlobal('PushManager', function PushManager() {})
  Object.defineProperty(navigator, 'serviceWorker', { value: { ready: Promise.resolve({ pushManager: { getSubscription: async () => null } }) }, configurable: true })
  const { enablePush, pushConfigured } = await import('./push')
  expect(pushConfigured()).toBe(false)
  expect(await enablePush()).toBe('on')
  expect((await db.settings.get('push'))?.value).toMatchObject({ enabled: true, mock: true })
})

test('configured: subscribes in the tap, sends the schedule, then debounced status changes only', async () => {
  vi.stubEnv('VITE_PUSH_URL', 'https://push.example')
  vi.stubEnv('VITE_PUSH_TOKEN', 'tok')
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')
  const calls: { url: string; body: Record<string, unknown> }[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => { expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok'); calls.push({ url, body: JSON.parse(String(init.body)) }); return new Response('{}', { status: 200 }) })
  vi.stubGlobal('Notification', { requestPermission: async () => 'granted' })
  vi.stubGlobal('PushManager', function PushManager() {})
  const sub = { endpoint: 'https://web.push.apple.com/x', toJSON: () => ({ endpoint: 'https://web.push.apple.com/x', keys: { auth: 'a', p256dh: 'p' } }) }
  const subscribe = vi.fn(async () => sub)
  Object.defineProperty(navigator, 'serviceWorker', { value: { ready: Promise.resolve({ pushManager: { getSubscription: async () => null, subscribe } }) }, configurable: true })
  const push = await import('./push')
  await awaken(answers)
  expect(await push.enablePush()).toBe('on')
  expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }))
  expect(calls[0].url).toBe('https://push.example/subscribe')
  expect((calls[0].body.schedule as unknown[]).length).toBeGreaterThan(5)
  expect(calls[0].body.tz).toBeTruthy()

  const stop = push.startStatusSync(10)
  await vi.waitFor(() => expect(calls.filter((c) => c.url.endsWith('/status'))).toHaveLength(1))
  await addWater(6000)
  await vi.waitFor(() => expect(calls.filter((c) => c.url.endsWith('/status'))).toHaveLength(2))
  expect((calls.at(-1)!.body.status as { waterHit: boolean }).waterHit).toBe(true)
  stop()
})
