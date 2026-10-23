import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { getSetting } from '@/db/repo'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Tabs } from '@/ui/controls'
import { BarChart, Heatmap, LineChart } from '@/ui/charts'
import { EmptyState } from '@/ui/feedback'
import { MUSCLE_LABEL } from '@/ui/BodyMap'
import { useUnits } from '@/app/units'
import { addDays, dayOf, weekStart } from '@/engine/dates'
import { e1rm } from '@/engine/strength'
import { hardSetCredit } from '@/engine/safety'
import { MUSCLES, type Muscle } from '@/engine/types'
import type { SetLog } from '@/engine/model'

type Tab = 'lifts' | 'muscles' | 'power' | 'prs'

/** Progress (PRD F3.11): per-exercise charts, weekly volume heatmap, Power Level history, PR wall. */
export function Progress() {
  const nav = useNavigate()
  const u = useUnits()
  const [tab, setTab] = useState<Tab>('lifts')
  const [exId, setExId] = useState('')
  const data = useLiveQuery(async () => {
    const [sets, exercises, power] = await Promise.all([db.sets.toArray(), db.exercises.toArray(), getSetting<{ day: string; pl: number }[]>('powerHistory')])
    return { sets: sets.filter((s) => s.type !== 'warmup'), byId: new Map(exercises.map((e) => [e.id, e])), power: power ?? [] }
  }, [])
  const logged = useMemo(() => {
    if (!data) return []
    const ids = [...new Set(data.sets.map((s) => s.exerciseId))]
    return ids.map((id) => ({ id, name: data.byId.get(id)?.name ?? id, n: data.sets.filter((s) => s.exerciseId === id).length })).sort((a, b) => b.n - a.n)
  }, [data])
  if (!data) return null
  const selected = exId || logged[0]?.id || ''
  const weekly = (list: SetLog[]) => {
    const m = new Map<string, { week: string; e1rm: number; best: number; volume: number }>()
    for (const s of list) {
      const w = weekStart(dayOf(s.completedAt))
      const cur = m.get(w) ?? { week: w, e1rm: 0, best: 0, volume: 0 }
      cur.e1rm = Math.max(cur.e1rm, e1rm(s.weightKg, s.reps, s.rir) ?? 0)
      cur.best = Math.max(cur.best, s.weightKg)
      cur.volume += s.weightKg * s.reps
      m.set(w, cur)
    }
    return [...m.values()].sort((a, b) => a.week.localeCompare(b.week)).map((r) => ({ week: r.week.slice(5), e1rm: u.w(r.e1rm) ?? 0, best: u.w(r.best) ?? 0, volume: Math.round(u.w(r.volume) ?? 0) }))
  }
  const series = weekly(data.sets.filter((s) => s.exerciseId === selected))
  // weekly hard sets per muscle, last 8 weeks
  const weeks = Array.from({ length: 8 }, (_, i) => weekStart(addDays(dayOf(), -7 * (7 - i))))
  const vol: Record<string, number[]> = {}
  for (const m of MUSCLES) vol[m] = weeks.map(() => 0)
  for (const s of data.sets) {
    const w = weeks.indexOf(weekStart(dayOf(s.completedAt)))
    const ex = data.byId.get(s.exerciseId)
    if (w < 0 || !ex) continue
    for (const m of ex.primary) vol[m][w] += hardSetCredit(s.rir)
    for (const m of ex.secondary) vol[m][w] += hardSetCredit(s.rir) * 0.5
  }
  const rows = (MUSCLES as readonly Muscle[]).filter((m) => vol[m].some((v) => v > 0))
  const prs = logged.map(({ id, name }) => {
    const best = data.sets.filter((s) => s.exerciseId === id).reduce((a, s) => { const est = e1rm(s.weightKg, s.reps, s.rir) ?? 0; return est > a.e1rm ? { e1rm: est, set: s } : a }, { e1rm: 0, set: null as SetLog | null })
    return { id, name, ...best }
  }).filter((p) => p.e1rm > 0).sort((a, b) => b.e1rm - a.e1rm)

  return (
    <Screen tag="PROGRESS" title="Progress" back="/system">
      <Tabs label="Progress view" value={tab} onChange={setTab} tabs={[{ id: 'lifts', label: 'Lifts' }, { id: 'muscles', label: 'Muscles' }, { id: 'power', label: 'Power' }, { id: 'prs', label: 'PR wall' }]} />
      {tab === 'lifts' ? (
        logged.length ? (
          <>
            <select aria-label="Exercise" value={selected} onChange={(e) => setExId(e.target.value)} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3">
              {logged.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <SystemWindow tag="E1RM" animate={false}><LineChart data={series} x="week" y="e1rm" unit={` ${u.lift}`} /></SystemWindow>
            <SystemWindow tag="BEST SET" animate={false}><LineChart data={series} x="week" y="best" unit={` ${u.lift}`} color="var(--gold)" /></SystemWindow>
            <SystemWindow tag="VOLUME" animate={false}><BarChart data={series} x="week" y="volume" /></SystemWindow>
          </>
        ) : <SystemWindow tag="LIFTS"><EmptyState message="[No records exist yet. Begin your first dungeon.]" icon="chart" /></SystemWindow>
      ) : null}
      {tab === 'muscles' ? (
        <SystemWindow tag="WEEKLY HARD SETS" animate={false}>
          <Heatmap label="Weekly hard sets per muscle" rows={rows.map((m) => MUSCLE_LABEL[m])} cols={weeks.map((w) => w.slice(5))} values={rows.map((m) => vol[m].map((v) => Math.round(v)))} max={20} />
        </SystemWindow>
      ) : null}
      {tab === 'power' ? (
        <SystemWindow tag="HUNTER POWER LEVEL" animate={false}>
          <LineChart data={data.power.map((p) => ({ day: p.day.slice(5), pl: p.pl }))} x="day" y="pl" color="var(--gold)" empty="[Power Level history will appear after your first day.]" />
        </SystemWindow>
      ) : null}
      {tab === 'prs' ? (
        <SystemWindow tag="PR WALL" variant="reward" animate={false}>
          {prs.length ? (
            <ul className="flex flex-col">{prs.map((p) => (
              <li key={p.id}><button type="button" onClick={() => nav(`/exercises/${p.id}`)} className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-[rgb(255_201_74/.15)] text-left">
                <span className="min-w-0 truncate">{p.name}</span>
                <span className="t-num text-gold">{u.w(p.e1rm)} {u.lift} <span className="t-small text-dim">({p.set ? `${u.w(p.set.weightKg)}×${p.set.reps}` : ''})</span></span>
              </button></li>
            ))}</ul>
          ) : <EmptyState message="[No personal records yet.]" icon="trophy" />}
        </SystemWindow>
      ) : null}
    </Screen>
  )
}
