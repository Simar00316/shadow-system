import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { uid } from '@/db/repo'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, NumberStepper, Tabs } from '@/ui/controls'
import { LineChart } from '@/ui/charts'
import { EmptyState } from '@/ui/feedback'
import { Icon } from '@/ui/icons'
import { useProfile } from '@/app/hooks'
import { useUnits } from '@/app/units'
import { dayOf } from '@/engine/dates'
import { trendWeight } from '@/engine/nutrition'
import type { Measurement, Photo } from '@/engine/model'

const TYPES: Measurement['type'][] = ['waist', 'chest', 'hips', 'arm', 'thigh', 'neck', 'bodyfat']

function PhotoImg({ photo, label }: { photo: Photo; label: string }) {
  const url = useMemo(() => URL.createObjectURL(new Blob([photo.data], { type: photo.type })), [photo.data, photo.type])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return url ? <img src={url} alt={label} className="aspect-[3/4] w-full rounded-[var(--r-1)] object-cover" /> : null
}

/** Body weight, measurements and progress photos (stored on this device only). PRD F3.11. */
export function Measurements() {
  const u = useUnits()
  const profile = useProfile()
  const [tab, setTab] = useState<'weight' | 'measure' | 'photos'>('weight')
  const [type, setType] = useState<Measurement['type']>('waist')
  const [value, setValue] = useState<number | null>(null)
  const [pose, setPose] = useState<Photo['pose']>('front')
  const [compare, setCompare] = useState<string[]>([])
  const weights = useLiveQuery(() => db.measurements.where('type').equals('weight').sortBy('day'), [], [])
  const others = useLiveQuery(() => db.measurements.where('type').equals(type).sortBy('day'), [type], [])
  const photos = useLiveQuery(() => db.photos.orderBy('day').reverse().toArray(), [], [])
  if (!profile) return null
  const lastW = weights[weights.length - 1]?.value ?? profile.weightKg
  const wv = value ?? u.bw(lastW)
  const trend = trendWeight(weights)
  const lenUnit = u.height === 'cm' ? 'cm' : 'in'
  const addWeight = async () => {
    const kg = u.bwKg(wv)
    await db.measurements.put({ id: `weight-${dayOf()}`, day: dayOf(), type: 'weight', value: kg })
    await db.profile.update('me', { weightKg: kg })
    setValue(null)
  }
  return (
    <Screen tag="BODY" title="Body & photos" back="/system">
      <Tabs label="Body view" value={tab} onChange={setTab} tabs={[{ id: 'weight', label: 'Weight' }, { id: 'measure', label: 'Measurements' }, { id: 'photos', label: 'Photos' }]} />
      {tab === 'weight' ? (
        <>
          <SystemWindow tag="WEIGH-IN">
            <NumberStepper label="Body weight" value={wv} step={u.body === 'kg' ? 0.1 : 0.2} onChange={setValue} unit={u.body} max={600} />
            <Button className="mt-3 w-full" onClick={addWeight}>Record today</Button>
            {trend ? <p className="t-system mt-3">[Trend weight (7-day average): {u.bw(trend)} {u.body}.]</p> : null}
          </SystemWindow>
          <SystemWindow tag="TREND" animate={false}><LineChart data={weights.map((w) => ({ day: w.day.slice(5), weight: u.bw(w.value) }))} x="day" y="weight" unit={` ${u.body}`} /></SystemWindow>
        </>
      ) : null}
      {tab === 'measure' ? (
        <>
          <SystemWindow tag="MEASURE">
            <select aria-label="Measurement" value={type} onChange={(e) => setType(e.target.value as Measurement['type'])} className="mb-3 min-h-12 w-full rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3 capitalize">
              {TYPES.map((t) => <option key={t} value={t}>{t === 'bodyfat' ? 'Body fat %' : t}</option>)}
            </select>
            <NumberStepper label={type} value={value ?? others[others.length - 1]?.value ?? (type === 'bodyfat' ? 20 : 80)} step={type === 'bodyfat' ? 0.5 : 0.5} onChange={setValue} unit={type === 'bodyfat' ? '%' : lenUnit} max={300} />
            <Button className="mt-3 w-full" onClick={async () => { await db.measurements.put({ id: `${type}-${dayOf()}`, day: dayOf(), type, value: value ?? others[others.length - 1]?.value ?? 0 }); setValue(null) }}>Record</Button>
          </SystemWindow>
          <SystemWindow tag="HISTORY" animate={false}><LineChart data={others.map((m) => ({ day: m.day.slice(5), v: m.value }))} x="day" y="v" /></SystemWindow>
        </>
      ) : null}
      {tab === 'photos' ? (
        <>
          <SystemWindow tag="NEW PHOTO">
            <p className="t-small mb-2 text-dim">[Photos never leave this device.]</p>
            <div className="mb-3 flex gap-2">{(['front', 'side', 'back'] as const).map((p) => <button key={p} type="button" aria-pressed={pose === p} onClick={() => setPose(p)} className={`t-label min-h-12 flex-1 rounded-[var(--r-2)] border ${pose === p ? 'border-glow text-glow' : 'border-[color:var(--line)] text-dim'}`}>{p}</button>)}</div>
            <label className="t-button flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[var(--r-2)] bg-blue text-ink">
              <Icon name="camera" /> Take or choose photo
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Progress photo" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await db.photos.add({ id: uid(), day: dayOf(), pose, data: await f.arrayBuffer(), type: f.type || 'image/jpeg' }); e.target.value = '' }} />
            </label>
          </SystemWindow>
          {compare.length === 2 ? (
            <SystemWindow tag="COMPARE" animate={false}>
              <div className="grid grid-cols-2 gap-2">{compare.map((id) => { const p = photos.find((x) => x.id === id); return p ? <div key={id}><PhotoImg photo={p} label={`${p.pose} ${p.day}`} /><div className="t-small text-center text-dim">{p.day}</div></div> : null })}</div>
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setCompare([])}>Clear comparison</Button>
            </SystemWindow>
          ) : null}
          <SystemWindow tag="GALLERY" animate={false}>
            {photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <button key={p.id} type="button" aria-pressed={compare.includes(p.id)} aria-label={`${p.pose} photo ${p.day}${compare.includes(p.id) ? ' (selected)' : ''}`} onClick={() => setCompare((c) => (c.includes(p.id) ? c.filter((x) => x !== p.id) : [...c, p.id].slice(-2)))} className={`relative rounded-[var(--r-1)] border-2 ${compare.includes(p.id) ? 'border-gold' : 'border-transparent'}`}>
                    <PhotoImg photo={p} label={`${p.pose} ${p.day}`} />
                    <span className="t-small absolute bottom-1 left-1 rounded bg-[rgb(2_3_9/.7)] px-1">{p.day.slice(5)}</span>
                  </button>
                ))}
              </div>
            ) : <EmptyState message="[No progress photos. They are stored only on this device.]" icon="photo" />}
            {photos.length ? <p className="t-small mt-2 text-dim">Tap two photos to compare side by side.</p> : null}
          </SystemWindow>
        </>
      ) : null}
    </Screen>
  )
}
