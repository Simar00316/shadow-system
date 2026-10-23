// Hevy and Strong CSV import (PRD B3.13, research/competitors.md §4). Columns are read by header name, never by
// position; dates are naive local times. Imported history adds sets and workouts but awards no XP.
import { db } from '@/db/schema'
import { dayOf } from '@/engine/dates'
import { hashSeed } from '@/engine/rng'
import { toKg } from '@/engine/strength'
import { cardioKcal } from '@/engine/cardio'
import type { CardioLog, SetLog, Workout } from '@/engine/model'
import type { Exercise, SetType } from '@/engine/types'

export type ImportSource = 'strong' | 'hevy'
export type ImportedSet = { exercise: string; setIndex: number; type: SetType; weightKg: number; reps: number; rpe: number | null; seconds: number | null; distanceKm: number | null; notes?: string; group?: string }
export type ImportedWorkout = { key: string; title: string; start: number; durationSec: number | null; notes?: string; sets: ImportedSet[] }
export type ParsedImport = { source: ImportSource; workouts: ImportedWorkout[]; skipped: number; warnings: string[] }

// ---------- CSV ----------

/** RFC 4180 parser with delimiter sniffing (`,` or `;` outside quotes on the header line), BOM and CRLF handling. */
export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const first = text.slice(0, text.search(/\r?\n|$/))
  let inQ = false, commas = 0, semis = 0
  for (const ch of first) { if (ch === '"') inQ = !inQ; else if (!inQ && ch === ',') commas++; else if (!inQ && ch === ';') semis++ }
  const d = semis > commas ? ';' : ','
  const rows: string[][] = []
  let row: string[] = [], f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += ch
    } else if (ch === '"') q = true
    else if (ch === d) { row.push(f); f = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = '' }
    else f += ch
  }
  if (f || row.length) { row.push(f); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}

const num = (s: string | undefined) => { if (s == null || s.trim() === '') return null; const n = Number(s.replace(',', '.')); return Number.isFinite(n) ? n : null }
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** Naive local date text → epoch ms in the device timezone. Supports Strong, Hevy and Hevy US formats. */
export function parseDate(s: string): number | null {
  s = s.trim()
  let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)).getTime()
  m = /^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4}),? (\d{1,2}):(\d{2})/.exec(s)
  if (m && MONTHS.includes(m[2].toLowerCase())) return new Date(+m[3], MONTHS.indexOf(m[2].toLowerCase()), +m[1], +m[4], +m[5]).getTime()
  m = /^([A-Za-z]{3})[a-z]* (\d{1,2}), (\d{4}),? (\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(s)
  if (m && MONTHS.includes(m[1].toLowerCase())) {
    let h = +m[4]
    if (m[6]) h = (h % 12) + (m[6].toUpperCase() === 'PM' ? 12 : 0)
    return new Date(+m[3], MONTHS.indexOf(m[1].toLowerCase()), +m[2], h, +m[5]).getTime()
  }
  return null
}

/** "1h 43m", "35m", "38min", "20m 15s", "1h", "1:02:03" or bare seconds → seconds. */
export function parseDuration(s: string | undefined): number | null {
  if (!s?.trim()) return null
  s = s.trim()
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s))
  const c = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(s)
  if (c) return c[3] ? +c[1] * 3600 + +c[2] * 60 + +c[3] : +c[1] * 60 + +c[2]
  let t = 0, any = false
  for (const m of s.matchAll(/(\d+)\s*(h|hr|hours?|m|min|minutes?|s|sec|seconds?)\b/gi)) { any = true; const u = m[2][0].toLowerCase(); t += +m[1] * (u === 'h' ? 3600 : u === 'm' ? 60 : 1) }
  return any ? t : null
}

function table(text: string) {
  const [head, ...rows] = parseCsv(text)
  const h = head.map((x) => x.trim())
  const col = (...names: string[]) => { for (const n of names) { const i = h.findIndex((x) => x.toLowerCase() === n.toLowerCase()); if (i >= 0) return i } return -1 }
  return { h, rows, col }
}

export function detectSource(text: string): ImportSource | null {
  const { h } = table(text.slice(0, 2000))
  if (h.includes('exercise_title') && h.includes('set_type')) return 'hevy'
  if (h.includes('Exercise Name') && h.includes('Set Order')) return 'strong'
  return null
}

const mi = (km: number | null, miles: boolean) => (km == null ? null : miles ? km * 1.609344 : km)

/** Strong (iOS comma and Android semicolon variants). `unit` is used only when the header carries no unit. */
export function parseStrong(text: string, unit: 'kg' | 'lb' = 'kg'): ParsedImport {
  const { h, rows, col } = table(text)
  const c = { id: col('Workout #'), date: col('Date'), name: col('Workout Name'), dur: col('Duration', 'Duration (sec)', 'Workout Duration'), ex: col('Exercise Name'), order: col('Set Order'), w: col('Weight', 'Weight (kg)', 'Weight (lb)', 'Weight (lbs)', 'lbs', 'kg'), reps: col('Reps'), rpe: col('RPE'), dist: col('Distance', 'Distance (meters)', 'Distance (m)', 'mi.', 'km'), sec: col('Seconds'), notes: col('Notes'), wnotes: col('Workout Notes') }
  const wh = h[c.w]?.toLowerCase() ?? ''
  const wUnit: 'kg' | 'lb' = wh.includes('lb') ? 'lb' : wh.includes('kg') ? 'kg' : unit
  const dh = h[c.dist]?.toLowerCase() ?? ''
  const distKm = (v: number | null) => (v == null || v === 0 ? null : dh.includes('meter') || dh.includes('(m)') ? v / 1000 : dh.startsWith('mi') ? v * 1.609344 : v)
  const out = new Map<string, ImportedWorkout>()
  const warnings: string[] = []
  let skipped = 0
  for (const r of rows) {
    const order = (r[c.order] ?? '').trim()
    if (/^(rest timer|note)$/i.test(order)) { skipped++; continue }
    const start = parseDate(r[c.date] ?? '')
    const ex = (r[c.ex] ?? '').trim()
    if (start == null || !ex) { skipped++; continue }
    const key = `strong:${c.id >= 0 ? r[c.id] : ''}:${r[c.date]}:${r[c.name]}`
    let w = out.get(key)
    if (!w) {
      const dur = (r[c.dur] ?? '').trim()
      w = { key, title: (r[c.name] ?? '').trim() || 'Imported workout', start, durationSec: h[c.dur]?.includes('sec') ? num(dur) : parseDuration(dur), notes: (r[c.wnotes] ?? '').trim() || undefined, sets: [] }
      out.set(key, w)
    }
    const type: SetType = order === 'W' ? 'warmup' : order === 'D' ? 'drop' : order === 'F' ? 'failure' : 'working'
    const weight = num(r[c.w]) ?? 0
    const secs = num(r[c.sec])
    w.sets.push({ exercise: ex, setIndex: w.sets.filter((s) => s.exercise === ex).length, type, weightKg: toKg(weight, wUnit), reps: num(r[c.reps]) ?? 0, rpe: num(r[c.rpe]) || null, seconds: secs || null, distanceKm: distKm(num(r[c.dist])), notes: (r[c.notes] ?? '').trim() || undefined })
  }
  if (c.w < 0) warnings.push('No weight column found.')
  return { source: 'strong', workouts: [...out.values()], skipped, warnings }
}

/** Hevy workout export. */
export function parseHevy(text: string): ParsedImport {
  const { h, rows, col } = table(text)
  const c = { title: col('title'), start: col('start_time'), end: col('end_time'), desc: col('description'), ex: col('exercise_title'), ss: col('superset_id'), exNotes: col('exercise_notes'), idx: col('set_index'), type: col('set_type'), w: col('weight_kg', 'weight_lbs', 'weight_lb'), reps: col('reps'), dist: col('distance_km', 'distance_miles'), dur: col('duration_seconds', 'duration_s'), rpe: col('rpe') }
  const lb = h[c.w]?.includes('lb') ?? false
  const miles = h[c.dist]?.includes('mile') ?? false
  const TYPES: Record<string, SetType> = { normal: 'working', '1': 'working', warmup: 'warmup', '2': 'warmup', failure: 'failure', '3': 'failure', dropset: 'drop', '4': 'drop' }
  const out = new Map<string, ImportedWorkout>()
  let skipped = 0
  for (const r of rows) {
    const start = parseDate(r[c.start] ?? '')
    const ex = (r[c.ex] ?? '').trim()
    if (start == null || !ex) { skipped++; continue }
    const key = `hevy:${r[c.title]}:${r[c.start]}`
    let w = out.get(key)
    if (!w) {
      const end = parseDate(r[c.end] ?? '')
      w = { key, title: (r[c.title] ?? '').trim() || 'Imported workout', start, durationSec: end != null && end > start ? Math.round((end - start) / 1000) : null, notes: (r[c.desc] ?? '').trim() || undefined, sets: [] }
      out.set(key, w)
    }
    const ss = (r[c.ss] ?? '').trim()
    w.sets.push({ exercise: ex, setIndex: num(r[c.idx]) ?? w.sets.filter((s) => s.exercise === ex).length, type: TYPES[(r[c.type] ?? '').trim().toLowerCase()] ?? 'working', weightKg: toKg(num(r[c.w]) ?? 0, lb ? 'lb' : 'kg'), reps: num(r[c.reps]) ?? 0, rpe: num(r[c.rpe]), seconds: num(r[c.dur]), distanceKm: mi(num(r[c.dist]), miles), notes: (r[c.exNotes] ?? '').trim() || undefined, group: ss ? `ss-${ss}` : undefined })
  }
  return { source: 'hevy', workouts: [...out.values()], skipped, warnings: [] }
}

export function parseImport(text: string, unit: 'kg' | 'lb' = 'kg'): ParsedImport | null {
  const s = detectSource(text)
  return s === 'hevy' ? parseHevy(text) : s === 'strong' ? parseStrong(text, unit) : null
}

// ---------- exercise matching ----------

const STEM: Record<string, string> = { biceps: 'bicep', triceps: 'tricep', dumbbells: 'dumbbell', ez: 'ez', pulldowns: 'pulldown', raises: 'raise', curls: 'curl', presses: 'press', rows: 'row', extensions: 'extension', flyes: 'fly', flys: 'fly', flies: 'fly', pushups: 'pushup', 'push-ups': 'pushup', pullups: 'pullup' }
const tokens = (s: string) => new Set(s.toLowerCase().replace(/push[- ]?ups?/g, 'pushup').replace(/pull[- ]?ups?/g, 'pullup').replace(/chin[- ]?ups?/g, 'chinup').split(/[^a-z0-9]+/).filter(Boolean).map((t) => STEM[t] ?? t))
const norm = (s: string) => [...tokens(s)].join(' ')
/** Equipment words in a library name the import name does not mention usually mean a different lift. */
const GEAR = new Set(['bench', 'cable', 'machine', 'smith', 'band', 'bands', 'kettlebell', 'ball', 'lever', 'sled', 'trx', 'ez'])

/** Hevy/Strong library names a token matcher gets wrong (generic names that mean the standard variant). */
const COMMON: Record<string, string> = {
  'Squat (Barbell)': 'Barbell Full Squat', 'Front Squat (Barbell)': 'Barbell Front Squat', 'Lat Pulldown (Cable)': 'Wide-Grip Lat Pulldown', 'Lat Pulldown (Machine)': 'Wide-Grip Lat Pulldown',
  'Overhead Press (Barbell)': 'Barbell Shoulder Press', 'Strict Military Press (Barbell)': 'Barbell Shoulder Press', 'Overhead Press (Dumbbell)': 'Dumbbell Shoulder Press', 'Shoulder Press (Dumbbell)': 'Dumbbell Shoulder Press',
  'Leg Press': 'Leg Press', 'Leg Press (Machine)': 'Leg Press', 'Leg Extension (Machine)': 'Lever Leg Extension', 'Lying Leg Curl (Machine)': 'Lever Lying Leg Curl', 'Seated Leg Curl (Machine)': 'Lever Lying Leg Curl',
  'Triceps Pushdown': 'Cable Pushdown', 'Triceps Pushdown (Cable - Straight Bar)': 'Cable Pushdown', 'Seated Cable Row - V Grip (Cable)': 'Cable Seated Row', 'Seated Row (Cable)': 'Cable Seated Row',
  'Chest Dip': 'Chest Dip', 'Triceps Dip': 'Chest Dip', 'Hip Thrust (Barbell)': 'Barbell Hip Thrust', 'Deadlift (Barbell)': 'Barbell Deadlift', 'Pull Up': 'Pull-Up', 'Chin Up': 'Chin-Up', 'Push Up': 'Push-Up',
}

export type Match = { name: string; exerciseId: string | null; confidence: 'exact' | 'suggested' | 'none'; suggestions: string[] }

/** Match import names to the library: exact name/alias first, then token overlap (core lifts and shorter names win). */
export function matchExercises(names: string[], library: Pick<Exercise, 'id' | 'name' | 'aliases' | 'core'>[]): Match[] {
  const exact = new Map<string, string>()
  const byName = new Map(library.map((e) => [e.name, e.id]))
  for (const [k, v] of Object.entries(COMMON)) if (byName.has(v)) exact.set(norm(k), byName.get(v)!)
  for (const e of library) for (const n of [e.name, ...e.aliases]) { const k = norm(n); if (!exact.has(k)) exact.set(k, e.id) }
  const toks = library.map((e) => ({ e, t: tokens(e.name) }))
  return names.map((name) => {
    const id = exact.get(norm(name))
    if (id) return { name, exerciseId: id, confidence: 'exact', suggestions: [id] }
    const q = tokens(name)
    const scored = toks.map(({ e, t }) => {
      let inter = 0
      let gear = 0
      for (const x of q) if (t.has(x)) inter++
      for (const x of t) if (GEAR.has(x) && !q.has(x)) gear++
      return { e, s: inter / (q.size + t.size - inter) + (e.core ? 0.05 : 0) - gear * 0.1 - t.size * 0.001 }
    }).filter((x) => x.s > 0.3).sort((a, b) => b.s - a.s).slice(0, 5)
    return { name, exerciseId: scored[0]?.e.id ?? null, confidence: scored[0] && scored[0].s >= 0.5 ? 'suggested' : 'none', suggestions: scored.map((x) => x.e.id) }
  })
}

// ---------- commit ----------

const CARDIO = (s: ImportedSet) => s.distanceKm != null && !s.weightKg && !s.reps

/** Write imported workouts. `mapping` maps import name → exercise id (null = skip that exercise). Re-imports are skipped. */
export async function commitImport(p: ParsedImport, mapping: Record<string, string | null>) {
  const exercises = new Map((await db.exercises.toArray()).map((e) => [e.id, e]))
  const bodyKg = (await db.profile.get('me'))?.weightKg ?? 75
  const res = { workouts: 0, sets: 0, cardio: 0, duplicates: 0, skippedSets: 0 }
  for (const w of p.workouts) {
    const id = `imp-${hashSeed(w.key).toString(36)}`
    if (await db.workouts.get(id)) { res.duplicates++; continue }
    const sets: SetLog[] = []
    const cardio: CardioLog[] = []
    const order = new Map<string, number>()
    w.sets.forEach((s, i) => {
      const exerciseId = mapping[s.exercise]
      if (!exerciseId) { res.skippedSets++; return }
      if (CARDIO(s)) {
        const ex = exercises.get(exerciseId)
        const min = (s.seconds ?? 0) / 60
        const met = ex?.met ?? 6
        cardio.push({ id: `${id}-c${i}`, startedAt: w.start + i * 60_000, day: dayOf(w.start), activity: exerciseId, durationMin: Math.round(min * 10) / 10, distanceKm: s.distanceKm ?? undefined, met, kcal: cardioKcal(met, bodyKg, min), notes: `Imported from ${p.source}: ${s.exercise}` })
        return
      }
      if (!order.has(exerciseId)) order.set(exerciseId, order.size)
      sets.push({ id: `${id}-s${i}`, workoutId: id, exerciseId, order: order.get(exerciseId)!, setIndex: s.setIndex, type: s.type, weightKg: Math.round(s.weightKg * 100) / 100, reps: s.reps, rir: s.rpe != null ? Math.max(0, Math.round(10 - s.rpe)) : null, rpe: s.rpe, holdSec: !s.reps && s.seconds ? s.seconds : undefined, notes: s.notes, group: s.group, completedAt: w.start + (i + 1) * 90_000 })
    })
    if (!sets.length && !cardio.length) continue
    const workout: Workout = { id, startedAt: w.start, endedAt: w.start + (w.durationSec ?? Math.max(1, sets.length) * 180) * 1000, day: dayOf(w.start), kind: 'free', name: w.title, notes: [w.notes, `Imported from ${p.source === 'hevy' ? 'Hevy' : 'Strong'}.`].filter(Boolean).join('\n') }
    await db.transaction('rw', db.workouts, db.sets, db.cardio, async () => {
      if (sets.length) { await db.workouts.put(workout); await db.sets.bulkPut(sets) }
      if (cardio.length) await db.cardio.bulkPut(cardio)
    })
    res.workouts++; res.sets += sets.length; res.cardio += cardio.length
  }
  return res
}
