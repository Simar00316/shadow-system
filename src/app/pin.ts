// Optional app PIN (replaces Cloudflare Access, research/platform.md Findings 11): PBKDF2-SHA-256 hash in settings.
// It keeps a casual visitor of the unlisted URL out; it is not encryption of the on-device data.
import { getSetting, setSetting } from '@/db/repo'
import { db } from '@/db/schema'

type PinRec = { salt: string; hash: string; iterations: number }
const KEY = 'pin'
const UNLOCKED = 'shadow-unlocked'
/** Per-device flag so the Shell can decide synchronously at launch (no pending render). */
const ENABLED = 'shadow-pin'
const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')

async function derive(pin: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations }, key, 256))
}

export const validPin = (pin: string) => /^\d{4,8}$/.test(pin)
export const hasPin = async () => !!(await getSetting<PinRec>(KEY))

export async function setPin(pin: string) {
  if (!validPin(pin)) throw new Error('PIN must be 4 to 8 digits.')
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
  await setSetting(KEY, { salt, hash: await derive(pin, salt, 150_000), iterations: 150_000 } satisfies PinRec)
  try { localStorage.setItem(ENABLED, '1') } catch { /* private mode */ }
  markUnlocked()
}

export async function clearPin() {
  try { localStorage.removeItem(ENABLED) } catch { /* private mode */ }
  await db.settings.delete(KEY)
}

/** True when this device has a PIN and the session is not unlocked yet. */
export function lockedAtLaunch() { try { return localStorage.getItem(ENABLED) === '1' && !isUnlocked() } catch { return false } }

export async function checkPin(pin: string) {
  const rec = await getSetting<PinRec>(KEY)
  if (!rec) return true
  const ok = (await derive(pin, rec.salt, rec.iterations)) === rec.hash
  if (ok) markUnlocked()
  return ok
}

/** Unlock lasts for this app session (sessionStorage clears when iOS kills the app). */
export function markUnlocked() { try { sessionStorage.setItem(UNLOCKED, '1') } catch { /* private mode */ } }
export function isUnlocked() { try { return sessionStorage.getItem(UNLOCKED) === '1' } catch { return false } }
