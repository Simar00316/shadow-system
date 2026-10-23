import { readFileSync } from 'node:fs'
import { db } from '@/db/schema'
import { dayOf } from '@/engine/dates'
import { awaken, DEFAULT_NOTIFICATIONS, type AwakeningAnswers } from './awakening'
import { addWater, logMeal } from './diet'
import { checkIn } from './game'
import { finishWorkout, logSet, startWorkout, freeItem } from './training'
import { backupTables, exportBackup, restoreBackup, toCsv, validateBackup, exportCsv } from './backup'
import { commitImport, detectSource, matchExercises, parseCsv, parseDate, parseDuration, parseHevy, parseImport, parseStrong } from './importers'
import { progressReport } from './report'

const fx = (f: string) => readFileSync(`tests/fixtures/${f}`, 'utf8')
const answers = {
  name: 'Jin', sex: 'male', birthYear: 1995, heightCm: 178, weightKg: 80, units: { lift: 'kg', body: 'kg', distance: 'km', height: 'cm' },
  goal: 'hypertrophy', experience: 'intermediate', equipment: ['barbell', 'dumbbell', 'bench', 'cable', 'machine', 'bodyweight'], equipmentName: 'Gym', injuries: [],
  trainingDays: [1, 3, 5], sessionMinutes: 60, dietType: 'omnivore', cuisine: 'indian', budget: false,
  notifications: DEFAULT_NOTIFICATIONS, test: { pushups: 30, squats60: 40, plankSec: 90 }, baseClass: 'tank',
} as unknown as AwakeningAnswers

beforeEach(async () => { await db.delete(); await db.open() })

/** Every store, sorted, as comparable JSON (ArrayBuffers as byte arrays). */
async function dump() {
  const o: Record<string, unknown> = {}
  for (const n of backupTables()) o[n] = JSON.parse(JSON.stringify((await db.table(n).toArray()).map((r) => ({ ...r, ...(Object.prototype.toString.call(r.data) === '[object ArrayBuffer]' ? { data: [...new Uint8Array(r.data)] } : {}) }))))
  return o
}

async function seedHistory() {
  await awaken(answers)
  await checkIn({ sleep: 4, soreness: 2, energy: 4, stress: 2 })
  await logMeal('lunch', [{ ref: 'x', name: 'Rice, "basmati", cooked\nplain', grams: 200, k: 260, p: 5, c: 56, f: 1 }])
  await addWater(750)
  const bench = (await db.exercises.filter((e) => e.name === 'Barbell Bench Press').first())!
  const wid = await startWorkout({ items: [await freeItem(bench.id)], name: 'Push' })
  for (let i = 0; i < 3; i++) await logSet(wid, { exerciseId: bench.id, order: 0, setIndex: i, type: 'working', weightKg: 80, reps: 8, rir: 2 })
  await finishWorkout(wid)
  await db.photos.put({ id: 'p1', day: dayOf(), pose: 'front', data: new Uint8Array([0, 1, 2, 250, 255]).buffer, type: 'image/jpeg' })
}

describe('backup and restore', () => {
  it('round-trips every store with zero data loss, including photo bytes', async () => {
    await seedHistory()
    const before = await dump()
    const file = JSON.stringify(await exportBackup())
    await db.delete(); await db.open()
    const v = validateBackup(JSON.parse(file))
    expect(v.ok).toBe(true)
    if (!v.ok) return
    await restoreBackup(v.backup)
    const after = await dump()
    ;(after.settings as unknown[]).splice((after.settings as { key: string }[]).findIndex((s) => s.key === 'lastBackupAt'), 1)
    expect(after).toEqual(before)
    const photo = await db.photos.get('p1')
    expect(Object.prototype.toString.call(photo!.data)).toBe('[object ArrayBuffer]')
    expect([...new Uint8Array(photo!.data)]).toEqual([0, 1, 2, 250, 255])
  })
  it('restore replaces existing data and rejects foreign files', async () => {
    await seedHistory()
    const b = await exportBackup()
    await db.water.add({ id: 'extra', day: dayOf(), ml: 1, at: 1 })
    await restoreBackup(b)
    expect(await db.water.get('extra')).toBeUndefined()
    expect(validateBackup({ hello: 1 })).toMatchObject({ ok: false })
    expect(validateBackup({ ...b, dbVersion: 999 })).toMatchObject({ ok: false })
    expect(validateBackup({ ...b, tables: { ...b.tables, profile: [] } })).toMatchObject({ ok: false })
  })
})

describe('CSV export', () => {
  it('escapes quotes, commas and newlines and parses back to the same cells', () => {
    const rows = [{ a: 'x, "y"\nz', b: 1, c: { n: [1, 2] } }, { a: 'plain', d: true }]
    const back = parseCsv(toCsv(rows))
    expect(back[0]).toEqual(['a', 'b', 'c', 'd'])
    expect(back[1]).toEqual(['x, "y"\nz', '1', '{"n":[1,2]}', ''])
    expect(back[2]).toEqual(['plain', '', '', 'true'])
  })
  it('exports every store', async () => {
    await seedHistory()
    for (const n of backupTables()) {
      const csv = await exportCsv(n)
      expect(Math.max(0, parseCsv(csv).length - 1)).toBe(await db.table(n).count())
    }
  })
})

describe('Hevy and Strong import', () => {
  it('parses formats and durations', () => {
    expect(new Date(parseDate('30 Jun 2025, 19:56')!).getHours()).toBe(19)
    expect(dayOf(parseDate('2 Feb 2024, 07:30')!)).toBe('2024-02-02')
    expect(dayOf(parseDate('Mar 29, 2026, 10:04 PM')!)).toBe('2026-03-29')
    expect(new Date(parseDate('Mar 29, 2026, 10:04 PM')!).getHours()).toBe(22)
    expect(dayOf(parseDate('2020-09-15 11:22:57')!)).toBe('2020-09-15')
    expect([parseDuration('1h 43m'), parseDuration('35m'), parseDuration('38min'), parseDuration('20m 15s'), parseDuration('1h'), parseDuration('4419'), parseDuration('1:02:03')]).toEqual([6180, 2100, 2280, 1215, 3600, 4419, 3723])
  })
  it('strips a UTF-8 BOM and handles CRLF and semicolons', () => {
    expect(parseCsv(String.fromCharCode(0xfeff) + 'a;"b;c"\r\n1;2\r\n')).toEqual([['a', 'b;c'], ['1', '2']])
  })
  it('detects the source from the header', () => {
    expect(detectSource(fx('hevy-sample.csv'))).toBe('hevy')
    expect(detectSource(fx('strong-sample.csv'))).toBe('strong')
    expect(detectSource(fx('strong-android-sample.csv'))).toBe('strong')
    expect(detectSource('a,b\n1,2')).toBeNull()
  })
  it('reads every set from the Hevy fixtures with set types, supersets, timed and cardio rows', () => {
    const p = parseHevy(fx('hevy-sample.csv'))
    expect(p.workouts).toHaveLength(2)
    expect(p.workouts.reduce((a, w) => a + w.sets.length, 0)).toBe(fx('hevy-sample.csv').trim().split('\n').length - 1)
    const t = parseHevy(fx('hevy-settypes-sample.csv'))
    const push = t.workouts.find((w) => w.title === 'Push day')!
    expect(push.notes).toBe('Felt strong, "easy" day')
    expect(push.durationSec).toBe(75 * 60)
    expect(push.sets.map((s) => s.type).slice(0, 3)).toEqual(['warmup', 'working', 'drop'])
    expect(push.sets[1]).toMatchObject({ weightKg: 80, reps: 8, rpe: 8, notes: 'Pause on chest' })
    expect(push.sets.find((s) => s.exercise === 'Plank')).toMatchObject({ seconds: 60, reps: 0 })
    expect(push.sets.find((s) => s.exercise === 'Running')).toMatchObject({ distanceKm: 2.5, seconds: 900 })
    expect(t.workouts.find((w) => w.title === 'Legs')!.sets[0].type).toBe('failure')
  })
  it('reads Strong iOS and Android variants, skipping Rest Timer and Note rows', () => {
    const ios = parseStrong(fx('strong-sample.csv'), 'lb')
    expect(ios.workouts).toHaveLength(2)
    expect(ios.workouts[0].durationSec).toBe(6180)
    expect(ios.workouts[0].sets[0].weightKg).toBeCloseTo(45 * 0.45359237, 3) // no unit in header: user's choice applies
    const android = parseStrong(fx('strong-android-sample.csv'), 'lb')
    expect(android.workouts[0].durationSec).toBe(4419)
    expect(android.workouts[0].sets[0]).toMatchObject({ type: 'warmup', weightKg: 20 }) // header says kg
    expect(android.skipped).toBeGreaterThan(0)
    const lbs = parseStrong('Date;Workout Name;Exercise Name;Set Order;lbs;Reps;mi.;Seconds;Notes;Workout Notes\n2018-01-02 10:00:00;A;Squat (Barbell);D;225;5;0;0;;\n2018-01-02 10:00:00;A;Squat (Barbell);F;100;3;0;0;;')
    expect(lbs.workouts[0].sets.map((s) => s.type)).toEqual(['drop', 'failure'])
    expect(lbs.workouts[0].sets[0].weightKg).toBeCloseTo(102.06, 1)
  })
  it('matches exercise names: exact via aliases, suggestions for the rest', async () => {
    const lib = (await import('@/data/exercises.json')).default as Parameters<typeof matchExercises>[1]
    const m = matchExercises(['Bench Press (Barbell)', 'Bicep Curl (Dumbbell)', 'Squat (Barbell)', 'Lat Pulldown (Machine)', 'Zorb Flinging'], lib)
    const name = (id: string | null) => lib.find((e) => e.id === id)?.name
    expect(m[0]).toMatchObject({ confidence: 'exact' })
    expect(name(m[0].exerciseId)).toBe('Barbell Bench Press')
    expect(name(m[1].exerciseId)).toBe('Dumbbell Biceps Curl')
    expect(name(m[2].exerciseId)).toBe('Barbell Full Squat')
    expect(name(m[3].exerciseId)).toMatch(/Lat Pulldown/)
    expect(m[4].confidence).toBe('none')
  })
  it('commits without data loss, is idempotent, and survives a backup round trip', async () => {
    await awaken(answers)
    const p = parseImport(fx('hevy-settypes-sample.csv'))!
    const lib = await db.exercises.toArray()
    const names = [...new Set(p.workouts.flatMap((w) => w.sets.map((s) => s.exercise)))]
    const mapping = Object.fromEntries(matchExercises(names, lib).map((x) => [x.name, x.exerciseId]))
    const res = await commitImport(p, mapping)
    const all = p.workouts.flatMap((w) => w.sets)
    expect(res.sets + res.cardio + res.skippedSets).toBe(all.length)
    expect(res.skippedSets).toBe(all.filter((s) => !mapping[s.exercise]).length)
    const imported = await db.sets.where('workoutId').startsWith('imp-').toArray()
    expect(imported.map((s) => [s.weightKg, s.reps, s.type]).sort()).toEqual(all.filter((s) => mapping[s.exercise] && !(s.distanceKm != null && !s.weightKg && !s.reps)).map((s) => [s.weightKg, s.reps, s.type]).sort())
    expect((await commitImport(p, mapping)).duplicates).toBe(res.workouts)
    const before = await dump()
    const b = await exportBackup()
    await db.delete(); await db.open()
    await restoreBackup(JSON.parse(JSON.stringify(b)))
    const after = await dump()
    ;(after.settings as { key: string }[]).splice((after.settings as { key: string }[]).findIndex((s) => s.key === 'lastBackupAt'), 1)
    expect(after).toEqual(before)
  })
})

describe('AI-ready progress report', () => {
  it('contains every PRD B5 section and the coach prompt', async () => {
    await seedHistory()
    const md = await progressReport(4)
    expect(md).toContain('You are my strength coach and nutritionist. Here is my data; answer my questions using it.')
    for (const h of ['## Profile', '## Current plan', 'Adherence:', '## Lifts', '### Barbell Bench Press', '### PRs in this period', '## Weekly volume and recovery', '## Readiness', '## Body', '## Nutrition', '## Game summary', '## Open questions the System detected']) expect(md).toContain(h)
    expect(md).toMatch(/80 kg × 8/)
  })
  it('flags stalled lifts and low protein', async () => {
    await awaken(answers)
    const bench = (await db.exercises.filter((e) => e.name === 'Barbell Bench Press').first())!
    const now = Date.now()
    for (let i = 0; i < 6; i++) {
      const at = now - (12 - i * 2) * 864e5
      await db.workouts.put({ id: `w${i}`, startedAt: at, endedAt: at + 3_600_000, day: dayOf(at), kind: 'free' })
      await db.sets.put({ id: `s${i}`, workoutId: `w${i}`, exerciseId: bench.id, order: 0, setIndex: 0, type: 'working', weightKg: 80, reps: 8, rir: 2, completedAt: at + 60_000 })
      await db.mealLogs.put({ id: `m${i}`, day: dayOf(at), meal: 'lunch', items: [{ ref: 'x', name: 'x', grams: 100, k: 900, p: 20, c: 100, f: 30 }], at })
    }
    const md = await progressReport(4, now)
    expect(md).toMatch(/Barbell Bench Press has not improved for \d+ sessions/)
    expect(md).toMatch(/Protein under target \d of \d logged days/)
  })
})
