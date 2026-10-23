// Full JSON backup and restore, and CSV export per store (PRD B3.13). Everything the Player created is in the
// backup; the bundled exercise library is not (it is rebuilt from the app). Photo bytes travel as base64.
import { db } from '@/db/schema'
import { dayOf } from '@/engine/dates'
import { usePrefs } from './prefs'

export const BACKUP_FORMAT = 'shadow-system-backup'
/** Stores left out of backups: rebuilt from the app bundle. */
const SKIP = new Set(['exercises'])
export const backupTables = () => db.tables.filter((t) => !SKIP.has(t.name)).map((t) => t.name)

export type Backup = { format: typeof BACKUP_FORMAT; version: number; dbVersion: number; exportedAt: number; prefs?: Record<string, unknown>; tables: Record<string, unknown[]> }

const toB64 = (b: ArrayBuffer) => { let s = ''; const u = new Uint8Array(b); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s) }
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer

/** Realm-safe ArrayBuffer check (IndexedDB may hand back buffers from another realm). */
const isAB = (v: unknown): v is ArrayBuffer => Object.prototype.toString.call(v) === '[object ArrayBuffer]'

/** JSON-safe copy: ArrayBuffers become { $ab: base64 }. */
function encode(v: unknown): unknown {
  if (isAB(v)) return { $ab: toB64(v) }
  if (ArrayBuffer.isView(v)) return { $ab: toB64(v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer) }
  if (Array.isArray(v)) return v.map(encode)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)]))
  return v
}
function decode(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(decode)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.$ab === 'string' && Object.keys(o).length === 1) return fromB64(o.$ab)
    return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, decode(x)]))
  }
  return v
}

export async function exportBackup(now = Date.now()): Promise<Backup> {
  const tables: Record<string, unknown[]> = {}
  for (const name of backupTables()) tables[name] = encode(await db.table(name).toArray()) as unknown[]
  const prefs: Record<string, unknown> = { ...usePrefs.getState() }
  delete prefs.set
  return { format: BACKUP_FORMAT, version: 1, dbVersion: db.verno, exportedAt: now, prefs, tables }
}

export const backupFileName = (now = Date.now()) => `shadow-system-backup-${dayOf(now)}.json`

/** Check a parsed file before touching the database. */
export function validateBackup(x: unknown): { ok: true; backup: Backup; counts: Record<string, number> } | { ok: false; error: string } {
  const b = x as Backup
  if (!b || b.format !== BACKUP_FORMAT || typeof b.tables !== 'object') return { ok: false, error: 'This file is not a Shadow System backup.' }
  if (b.dbVersion > db.verno) return { ok: false, error: 'This backup comes from a newer version of the app. Update the app first.' }
  const known = new Set(backupTables())
  const counts: Record<string, number> = {}
  for (const [name, rows] of Object.entries(b.tables)) {
    if (!known.has(name)) continue
    if (!Array.isArray(rows)) return { ok: false, error: `Store ${name} is damaged.` }
    counts[name] = rows.length
  }
  if (!counts.profile) return { ok: false, error: 'The backup has no profile.' }
  return { ok: true, backup: b, counts }
}

/** Replace all Player data with the backup, in one transaction (all or nothing). */
export async function restoreBackup(b: Backup) {
  const names = backupTables().filter((n) => n in b.tables)
  await db.transaction('rw', names.map((n) => db.table(n)), async () => {
    for (const n of backupTables()) if (names.includes(n)) await db.table(n).clear()
    for (const n of names) await db.table(n).bulkPut(decode(b.tables[n]) as object[])
  })
  if (b.prefs) usePrefs.getState().set(b.prefs as Partial<ReturnType<typeof usePrefs.getState>>)
  await db.settings.put({ key: 'lastBackupAt', value: Date.now() })
}

/** Gentle backup reminder every 7 days (PRD B2). Returns true when the System spoke. */
export async function maybeNagBackup(now = Date.now()) {
  const [last, nagged, profile] = await Promise.all([db.settings.get('lastBackupAt'), db.settings.get('backupNagAt'), db.profile.get('me')])
  const since = Math.max(Number(last?.value ?? profile?.createdAt ?? now), Number(nagged?.value ?? 0))
  if (!profile || now - since < 7 * 864e5) return false
  await db.settings.put({ key: 'backupNagAt', value: now })
  const { say } = await import('./notify')
  await say('backup_nag')
  return true
}

// ---------- CSV ----------

const cell = (v: unknown) => {
  if (v == null) return ''
  const s = isAB(v) ? `[${v.byteLength} bytes]` : typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** RFC 4180 CSV; nested values as JSON. Columns are the union of row keys in first-seen order. */
export function toCsv(rows: Record<string, unknown>[]) {
  const cols: string[] = []
  for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k)
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n')
}

export async function exportCsv(table: string) {
  return toCsv((await db.table(table).toArray()) as Record<string, unknown>[])
}

/** Hand a file to the user: the iOS share sheet when possible ("Save to Files"), else a download (R7 §11). */
export async function saveFile(name: string, text: string, type: string) {
  const file = new File([text], name, { type })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: name }); return 'shared' } catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled' }
  }
  const url = URL.createObjectURL(file)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
