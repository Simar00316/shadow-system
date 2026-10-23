import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, NumberStepper } from '@/ui/controls'
import { EmptyState } from '@/ui/feedback'
import { useProfile } from '@/app/hooks'
import { useUnits } from '@/app/units'
import { logCardio } from '@/app/training'
import { ACTIVITIES, ACTIVITY_LABEL, cardioKcal, cardioMet, formatPace, paceSecPerKm, type Activity } from '@/engine/cardio'

const MACHINES: Activity[] = ['bike', 'rower', 'elliptical', 'skierg']

/** Cardio log (PRD F3.16): machine or activity, duration, distance, level, pace and intervals. */
export function Cardio() {
  const nav = useNavigate()
  const u = useUnits()
  const profile = useProfile()
  const recent = useLiveQuery(() => db.cardio.orderBy('startedAt').reverse().limit(10).toArray(), [], [])
  const [activity, setActivity] = useState<Activity>('treadmill_run')
  const [minutes, setMinutes] = useState(30)
  const [dist, setDist] = useState(0)
  const [level, setLevel] = useState(8)
  const [incline, setIncline] = useState(0)
  const [intervals, setIntervals] = useState(false)
  const [work, setWork] = useState(30)
  const [rest, setRest] = useState(30)
  const [rounds, setRounds] = useState(8)
  const [saving, setSaving] = useState(false)
  const km = u.toKm(dist)
  const pace = paceSecPerKm(minutes, km)
  const speed = pace ? 3600 / pace : undefined
  const machine = MACHINES.includes(activity)
  const met = cardioMet(activity, { speedKmh: speed, level: machine ? level : undefined, hiit: intervals || undefined, inclinePct: incline || undefined })
  const kcal = cardioKcal(met, profile?.weightKg ?? 75, minutes)
  return (
    <Screen tag="CARDIO" title="Log cardio" back="/train">
      <SystemWindow tag="SESSION">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="t-label text-dim">Activity or machine</span>
            <select aria-label="Activity" value={activity} onChange={(e) => setActivity(e.target.value as Activity)} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3">
              {ACTIVITIES.map((a) => <option key={a} value={a}>{ACTIVITY_LABEL[a]}</option>)}
            </select>
          </label>
          <div><div className="t-label text-dim">Duration</div><NumberStepper label="Duration" value={minutes} step={5} min={1} max={600} onChange={setMinutes} unit="min" /></div>
          <div><div className="t-label text-dim">Distance (optional)</div><NumberStepper label="Distance" value={dist} step={0.5} max={300} onChange={setDist} unit={u.distance} /></div>
          {machine ? <div><div className="t-label text-dim">Level</div><NumberStepper label="Level" value={level} min={1} max={25} onChange={setLevel} /></div> : null}
          {activity.startsWith('treadmill') ? <div><div className="t-label text-dim">Incline</div><NumberStepper label="Incline" value={incline} max={15} onChange={setIncline} unit="%" /></div> : null}
          <label className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={intervals} onChange={(e) => setIntervals(e.target.checked)} /> Intervals</label>
          {intervals ? (
            <div className="grid grid-cols-1 gap-2">
              <NumberStepper label="Work" value={work} step={5} onChange={setWork} unit="s" max={600} />
              <NumberStepper label="Rest" value={rest} step={5} onChange={setRest} unit="s" max={600} />
              <NumberStepper label="Rounds" value={rounds} onChange={setRounds} max={50} />
            </div>
          ) : null}
          <div className="t-system">[Pace {formatPace(pace)} /km · MET {met.toFixed(1)} · about {kcal} kcal.]</div>
          <Button loading={saving} onClick={async () => {
            setSaving(true)
            await logCardio({ activity, label: ACTIVITY_LABEL[activity], met, durationMin: minutes, distanceKm: km || undefined, level: machine ? level : undefined, paceSecPerKm: pace, intervals: intervals ? { workSec: work, restSec: rest, rounds } : undefined, hiit: intervals })
            setSaving(false)
            nav('/train')
          }}>Record session</Button>
        </div>
      </SystemWindow>
      <SystemWindow tag="RECENT" animate={false}>
        {recent.length ? <ul className="flex flex-col gap-1">{recent.map((c) => <li key={c.id} className="t-small flex justify-between"><span>{c.day} · {c.activity}</span><span className="t-num">{c.durationMin} min{c.distanceKm ? ` · ${u.km(c.distanceKm).toFixed(1)} ${u.distance}` : ''} · {c.kcal} kcal</span></li>)}</ul> : <EmptyState message="[No cardio has been recorded.]" icon="cardio" />}
      </SystemWindow>
    </Screen>
  )
}
