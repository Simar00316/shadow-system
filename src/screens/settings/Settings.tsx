import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { getSetting, setSetting } from '@/db/repo'
import { Screen, Row } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button } from '@/ui/controls'
import { Sheet } from '@/ui/layout'
import { useToasts } from '@/state/toasts'
import { useProfile } from '@/app/hooks'
import { usePrefs } from '@/app/prefs'
import { scheduleReminders } from '@/app/awakening'
import { backupFileName, backupTables, exportBackup, exportCsv, restoreBackup, saveFile, validateBackup, type Backup } from '@/app/backup'
import { disablePush, enablePush, isStandalone, pushConfigured, pushSupported, type PushState } from '@/app/push'
import { clearPin, hasPin, setPin, validPin } from '@/app/pin'
import { dayOf } from '@/engine/dates'
import type { NotificationPrefs, Units } from '@/engine/model'
import pkg from '../../../package.json'

const input = 'min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3'
const toast = (kind: 'success' | 'warning' | 'info', text: string) => useToasts.getState().push(kind, text)

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex min-h-12 items-center justify-between gap-3"><span>{label}</span><input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[var(--glow)]" /></label>
}

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3"><span>{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)} className={input}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  )
}

function Time({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="flex min-h-12 items-center justify-between gap-3"><span>{label}</span><input type="time" aria-label={label} value={value} onChange={(e) => e.target.value && onChange(e.target.value)} className={input} /></label>
}

/** Settings (PRD F3.19): profile, units, reminders, sound and motion, data, PIN, about. */
export function Settings() {
  const profile = useProfile()
  const prefs = usePrefs()
  const push = useLiveQuery(() => getSetting<PushState>('push'), [], undefined)
  const lastBackup = useLiveQuery(() => getSetting<number>('lastBackupAt'), [], undefined)
  const pinSet = useLiveQuery(() => hasPin(), [], false)
  const [restore, setRestore] = useState<{ backup: Backup; counts: Record<string, number> } | null>(null)
  const [csvTable, setCsvTable] = useState('sets')
  const [pinSheet, setPinSheet] = useState(false)
  const [pin, setPinValue] = useState('')
  const file = useRef<HTMLInputElement>(null)
  if (!profile) return null

  const saveUnits = (u: Partial<Units>) => db.profile.update('me', { units: { ...profile.units, ...u } })
  const saveNotif = async (n: Partial<NotificationPrefs>) => {
    const next = { ...profile.notifications, ...n }
    await db.profile.update('me', { notifications: next })
    await scheduleReminders(next)
  }
  const n = profile.notifications

  const onEnablePush = async () => {
    // Must run straight from the tap (iOS user-gesture rule): enablePush asks for permission first.
    const r = await enablePush()
    if (r === 'on') { await saveNotif({ enabled: true }); toast('success', pushConfigured() ? '[Reminders enabled.]' : '[Reminders enabled in offline mode. They start once the push service is deployed.]') }
    else toast('warning', r === 'denied' ? '[Notification permission was denied. Allow it in iOS Settings, then try again.]' : r === 'unsupported' ? '[Install the app to your Home Screen to receive reminders.]' : '[The push service could not be reached. Try again later.]')
  }

  const onBackup = async () => {
    const r = await saveFile(backupFileName(), JSON.stringify(await exportBackup()), 'application/json')
    if (r !== 'cancelled') { await setSetting('lastBackupAt', Date.now()); toast('success', '[Backup created. Keep it somewhere safe.]') }
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    try {
      const v = validateBackup(JSON.parse(await f.text()))
      if (v.ok) setRestore({ backup: v.backup, counts: v.counts })
      else toast('warning', `[${v.error}]`)
    } catch { toast('warning', '[This file could not be read.]') }
    if (file.current) file.current.value = ''
  }

  return (
    <Screen tag="SETTINGS" title="Settings" back="/system">
      <SystemWindow tag="PLAYER" animate={false}>
        <Row label="Name">{profile.name}</Row>
        <Row label="Class">{profile.cls.replace(/_/g, ' ')}</Row>
        <Row label="Goal">{profile.goal.replace(/_/g, ' ')}</Row>
        <p className="t-small mt-2 text-dim">Re-running the Awakening updates your profile and rebuilds your plan. Your level, history and rewards are kept.</p>
        <Link to="/awakening" className="mt-2 flex min-h-12 items-center justify-center rounded-[var(--r-1)] border border-[color:var(--line)] text-glow">Re-run the Awakening</Link>
      </SystemWindow>

      <SystemWindow tag="UNITS" animate={false}>
        <Select label="Lifts" value={profile.units.lift} options={[['kg', 'Kilograms'], ['lb', 'Pounds']]} onChange={(v) => saveUnits({ lift: v })} />
        <Select label="Bodyweight" value={profile.units.body} options={[['kg', 'Kilograms'], ['lb', 'Pounds']]} onChange={(v) => saveUnits({ body: v })} />
        <Select label="Distance" value={profile.units.distance} options={[['km', 'Kilometres'], ['mi', 'Miles']]} onChange={(v) => saveUnits({ distance: v })} />
        <Select label="Height" value={profile.units.height} options={[['cm', 'Centimetres'], ['in', 'Inches']]} onChange={(v) => saveUnits({ height: v })} />
      </SystemWindow>

      <SystemWindow tag="REMINDERS" animate={false}>
        {push?.needsRepair ? <p role="alert" className="t-system mb-2 text-warning">[Reminders are off on this device. Tap to repair.]</p> : null}
        {push?.enabled && !push.needsRepair
          ? <><Row label="Status">{push.mock ? 'On (offline mode)' : 'On'}</Row><Button variant="ghost" className="mt-2 w-full" onClick={async () => { await disablePush(); await saveNotif({ enabled: false }) }}>Turn reminders off</Button></>
          : <Button className="w-full" icon="sound" onClick={onEnablePush}>{push?.needsRepair ? 'Repair reminders' : 'Turn reminders on'}</Button>}
        {!pushSupported() || !isStandalone() ? <p className="t-small mt-2 text-dim">Reminders need the installed app (Share, then Add to Home Screen) on iOS 16.4 or later.</p> : null}
        <div className="mt-3 flex flex-col">
          <Time label="Workout" value={n.workout} onChange={(v) => saveNotif({ workout: v })} />
          <Time label="Readiness check-in" value={n.readiness} onChange={(v) => saveNotif({ readiness: v })} />
          {n.meals.map((t, i) => <Time key={i} label={`Meal ${i + 1}`} value={t} onChange={(v) => saveNotif({ meals: n.meals.map((x, j) => (j === i ? v : x)) })} />)}
          <Time label="Evening calorie check" value={n.calorieCheck} onChange={(v) => saveNotif({ calorieCheck: v })} />
          <Time label="Streak at risk" value={n.streak} onChange={(v) => saveNotif({ streak: v })} />
          <Time label="Penalty warning" value={n.penalty} onChange={(v) => saveNotif({ penalty: v })} />
          <Time label="Water from" value={n.water.from} onChange={(v) => saveNotif({ water: { ...n.water, from: v } })} />
          <Time label="Water until" value={n.water.to} onChange={(v) => saveNotif({ water: { ...n.water, to: v } })} />
          <Select label="Water every" value={String(n.water.everyMin)} options={[['60', '1 hour'], ['90', '90 min'], ['120', '2 hours'], ['180', '3 hours']]} onChange={(v) => saveNotif({ water: { ...n.water, everyMin: Number(v) } })} />
        </div>
        <p className="t-small mt-2 text-dim">Only reminder times and yes/no flags (workout done, water target hit) leave this device. No health data is sent.</p>
      </SystemWindow>

      <SystemWindow tag="SOUND AND MOTION" animate={false}>
        <Toggle label="Sound effects" checked={prefs.sound} onChange={(v) => prefs.set({ sound: v })} />
        <label className="flex min-h-12 items-center justify-between gap-3"><span>Volume</span><input type="range" aria-label="Volume" min={0} max={1} step={0.05} value={prefs.volume} onChange={(e) => prefs.set({ volume: Number(e.target.value) })} className="w-40" /></label>
        <Toggle label="Ambient hum" checked={prefs.ambient} onChange={(v) => prefs.set({ ambient: v })} />
        <Toggle label="Play with the silent switch on" checked={prefs.silentMode} onChange={(v) => prefs.set({ silentMode: v })} />
        <Toggle label="Reduce motion" checked={prefs.reduceMotion} onChange={(v) => prefs.set({ reduceMotion: v })} />
        <Select label="Effort scale" value={prefs.effortMode} options={[['rir', 'RIR (reps in reserve)'], ['rpe', 'RPE (1-10)']]} onChange={(v) => prefs.set({ effortMode: v })} />
      </SystemWindow>

      <SystemWindow tag="DATA" animate={false}>
        <Row label="Last backup">{lastBackup ? dayOf(lastBackup) : 'Never'}</Row>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button icon="download" onClick={onBackup}>Back up</Button>
          <Button variant="secondary" icon="upload" onClick={() => file.current?.click()}>Restore</Button>
        </div>
        <input ref={file} type="file" accept=".json,application/json" aria-label="Backup file" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
        <div className="mt-3 flex gap-2">
          <select aria-label="Store to export" value={csvTable} onChange={(e) => setCsvTable(e.target.value)} className={`${input} min-w-0 flex-1`}>{backupTables().map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <Button variant="secondary" onClick={async () => { await saveFile(`shadow-system-${csvTable}-${dayOf()}.csv`, await exportCsv(csvTable), 'text/csv') }}>Export CSV</Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/settings/import" className="flex min-h-12 items-center justify-center rounded-[var(--r-1)] border border-[color:var(--line)] text-glow">Import Hevy / Strong</Link>
          <Link to="/settings/report" className="flex min-h-12 items-center justify-center rounded-[var(--r-1)] border border-[color:var(--line)] text-glow">Progress report</Link>
        </div>
      </SystemWindow>

      <SystemWindow tag="SECURITY" animate={false}>
        <Row label="App PIN">{pinSet ? 'On' : 'Off'}</Row>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => { setPinValue(''); setPinSheet(true) }}>{pinSet ? 'Change PIN' : 'Set PIN'}</Button>
          {pinSet ? <Button variant="ghost" onClick={async () => { await clearPin(); toast('info', '[PIN removed.]') }}>Remove PIN</Button> : null}
        </div>
        <p className="t-small mt-2 text-dim">The PIN is asked once each time the app starts. Forgetting it means restoring from a backup on a fresh install.</p>
      </SystemWindow>

      <SystemWindow tag="ABOUT" animate={false}>
        <Row label="Version">{pkg.version}</Row>
        <Row label="Database">v{db.verno}</Row>
        <p className="t-small mt-2 text-dim">Shadow System is a private, offline-first training app. All records stay on this device. Exercise data: hasaneyldrm/exercises-dataset (MIT) and yuhonas/free-exercise-db (Unlicense). Exercise animations © Gym Visual (gymvisual.com), used in this private build with attribution. Body map: MuscleMap (MIT). Food data: USDA SR Legacy (CC0), IFCT 2017 (ICMR-NIN) and Open Food Facts (ODbL). Pose model: Google MediaPipe (Apache-2.0). Full credits: docs/asset-sources.md.</p>
        <p className="t-small mt-2 text-dim">Not medical advice. Stop any exercise that causes pain and consult a professional for injuries.</p>
      </SystemWindow>

      <Sheet open={!!restore} onClose={() => setRestore(null)} title="Restore backup">
        {restore ? (
          <div className="flex flex-col gap-2">
            <p className="t-system text-warning">[This replaces every record on this device with the backup from {dayOf(restore.backup.exportedAt)}.]</p>
            <p className="t-small text-dim">{Object.entries(restore.counts).filter(([, c]) => c).map(([t, c]) => `${t}: ${c}`).join(' · ')}</p>
            <Button variant="danger" onClick={async () => { await restoreBackup(restore.backup); setRestore(null); toast('success', '[Backup restored.]') }}>Replace and restore</Button>
            <Button variant="ghost" onClick={() => setRestore(null)}>Cancel</Button>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={pinSheet} onClose={() => setPinSheet(false)} title="App PIN">
        <form className="flex flex-col gap-2" onSubmit={async (e) => { e.preventDefault(); if (!validPin(pin)) return; await setPin(pin); setPinSheet(false); toast('success', '[PIN set.]') }}>
          <input type="password" inputMode="numeric" autoComplete="new-password" aria-label="New PIN" placeholder="4 to 8 digits" value={pin} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 8))} className={input} />
          <Button type="submit" disabled={!validPin(pin)}>Save PIN</Button>
        </form>
      </Sheet>
    </Screen>
  )
}
