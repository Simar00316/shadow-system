import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import Fuse from 'fuse.js'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, IconButton, NumberStepper, RirPicker } from '@/ui/controls'
import { RestTimer, SetRow, type SetRowData } from '@/ui/training'
import { Sheet } from '@/ui/layout'
import { ExerciseMedia } from '@/ui/ExerciseMedia'
import { MUSCLE_LABEL } from '@/ui/BodyMap'
import { Icon } from '@/ui/icons'
import { useExercises, useProfile } from '@/app/hooks'
import { useUnits } from '@/app/units'
import { usePrefs } from '@/app/prefs'
import { finishWorkout, freeItem, lastWorkingSets, logSet, undoSet, updateItems, bestE1rmBefore } from '@/app/training'
import { e1rm, plates, roundToEquipment, warmups } from '@/engine/strength'
import { smartSwap } from '@/engine/recommend'
import type { Exercise, SetType } from '@/engine/types'
import type { SessionItem, SetLog } from '@/engine/model'
import { sfx } from '@/audio/sfx'

const nowMs = () => Date.now()

type Pending = { weightKg: number; reps: number; rir: number | null; type: SetType; notes?: string }

/** Keep the screen awake during a session (Safari 18.4+ in installed apps, R7 §4). */
function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    const get = async () => { try { lock = (await nav.wakeLock?.request('screen')) ?? null } catch { lock = null } }
    void get()
    const onVis = () => { if (document.visibilityState === 'visible') void get() }
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); void lock?.release().catch(() => {}) }
  }, [])
}

export function Workout() {
  const { id } = useParams()
  const nav = useNavigate()
  const u = useUnits()
  const profile = useProfile()
  const exercises = useExercises()
  const effortMode = usePrefs((p) => p.effortMode)
  const workout = useLiveQuery(() => db.workouts.get(id!), [id])
  const logged = useLiveQuery(() => db.sets.where('workoutId').equals(id!).toArray(), [id], [] as SetLog[])
  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const [current, setCurrent] = useState(0)
  const [pending, setPending] = useState<Record<string, Pending[]>>({})
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [restTotal, setRestTotal] = useState(0)
  const [full, setFull] = useState(false)
  const [editing, setEditing] = useState<{ key: string; index: number } | null>(null)
  const [sheet, setSheet] = useState<'plates' | 'swap' | 'add' | 'notes' | null>(null)
  const [gain, setGain] = useState<{ key: string; xp: number; pr: boolean } | null>(null)
  const [last, setLast] = useState<Record<string, SetLog[]>>({})
  const [best, setBest] = useState<Record<string, number>>({})
  const [finishing, setFinishing] = useState(false)
  const [clock, setClock] = useState(nowMs)
  useEffect(() => { const t = setInterval(() => setClock(nowMs()), 30_000); return () => clearInterval(t) }, [])
  useWakeLock()

  const items = useMemo(() => workout?.items ?? [], [workout])
  const groups = useMemo(() => {
    const out: SessionItem[][] = []
    for (const it of items) {
      const g = it.group ? out.find((b) => b[0].group === it.group) : undefined
      if (g) g.push(it); else out.push([it])
    }
    return out
  }, [items])

  // Prefill from last time and the class target once per item.
  useEffect(() => {
    if (!workout) return
    for (const it of items) {
      if (pending[it.key] || !byId.size) continue
      void (async () => {
        const prev = await lastWorkingSets(it.exerciseId, workout.id)
        const b = await bestE1rmBefore(it.exerciseId, workout.startedAt)
        const ex = byId.get(it.exerciseId)
        const load = it.loadKg ?? prev[0]?.weightKg ?? 0
        const eq = ex?.equipment.find((e) => e !== 'bench') ?? 'bodyweight'
        const rows = Array.from({ length: it.sets }, (_, i) => {
          const p = prev[i] ?? prev[prev.length - 1]
          const reps = p && Math.abs(p.weightKg - load) < 0.01 ? Math.min(it.repMax, p.reps + (p.reps < it.repMax ? 1 : 0)) : p && load > p.weightKg ? it.repMin : it.repMax
          return { weightKg: roundToEquipment(load, eq), reps: it.holdSec ? 1 : reps, rir: it.rir, type: 'working' as SetType }
        })
        setPending((x) => (x[it.key] ? x : { ...x, [it.key]: rows }))
        setLast((x) => ({ ...x, [it.key]: prev }))
        setBest((x) => ({ ...x, [it.key]: b }))
      })()
    }
  }, [items, byId, workout, pending])

  if (!workout || !profile) return null
  if (workout.endedAt) { nav(`/workout/${workout.id}/summary`, { replace: true }); return null }
  const group = groups[Math.min(current, Math.max(0, groups.length - 1))] ?? []

  const rowsFor = (it: SessionItem) => {
    const done = logged.filter((s) => s.exerciseId === it.exerciseId).sort((a, b) => a.completedAt - b.completedAt)
    const pend = (pending[it.key] ?? []).slice(0)
    const workingDone = done.length
    return { done, pend: pend.slice(Math.min(workingDone, pend.length)) }
  }

  const tick = async (it: SessionItem, p: Pending, idx: number) => {
    const ex = byId.get(it.exerciseId)!
    const res = await logSet(workout.id, { exerciseId: it.exerciseId, order: items.indexOf(it), setIndex: idx, type: p.type, weightKg: p.weightKg, reps: p.reps, rir: p.rir, notes: p.notes, group: it.group, holdSec: it.holdSec })
    setGain({ key: res.set.id, xp: res.xp, pr: !!res.pr })
    setTimeout(() => setGain(null), 900)
    if (res.pr) sfx.play('pr')
    // Rest starts after the last exercise of a superset/circuit round.
    const isLastInGroup = group[group.length - 1].key === it.key
    if (p.type !== 'drop' && isLastInGroup) { setRestTotal(it.restSec); setRestEnd(nowMs() + it.restSec * 1000) }
    void ex
  }

  const updatePending = (key: string, index: number, patch: Partial<Pending>) => setPending((x) => ({ ...x, [key]: (x[key] ?? []).map((r, i) => (i === index || (patch.weightKg && r.weightKg <= 0 && r.type === 'working' && i > index) ? { ...r, ...patch, type: i === index ? (patch.type ?? r.type) : r.type } : r)) }))
  const addRow = (it: SessionItem, row?: Partial<Pending>) => setPending((x) => { const l = x[it.key] ?? []; const base = l[l.length - 1] ?? { weightKg: it.loadKg ?? 0, reps: it.repMax, rir: it.rir, type: 'working' as SetType }; return { ...x, [it.key]: [...l, { ...base, type: 'working', ...row }] } })
  const addWarmups = (it: SessionItem) => {
    const ex = byId.get(it.exerciseId)!
    const working = (pending[it.key] ?? [])[0]?.weightKg ?? it.loadKg ?? 0
    const w = warmups(working, ex).map((s) => ({ weightKg: s.weightKg, reps: s.reps, rir: null, type: 'warmup' as SetType }))
    if (!w.length) return
    const doneCount = rowsFor(it).done.length
    setPending((x) => { const l = x[it.key] ?? []; return { ...x, [it.key]: [...l.slice(0, doneCount), ...w, ...l.slice(doneCount)] } })
  }
  const swapTo = async (it: SessionItem, exId: string) => {
    const fresh = await freeItem(exId)
    await updateItems(workout.id, items.map((x) => (x.key === it.key ? { ...fresh, key: it.key, sets: it.sets, repMin: it.repMin, repMax: it.repMax, rir: it.rir, restSec: it.restSec, group: it.group } : x)))
    setPending((x) => { const n = { ...x }; delete n[it.key]; return n })
    setSheet(null)
  }
  const finish = async () => { setFinishing(true); sfx.play('quest-clear'); await finishWorkout(workout.id); nav(`/workout/${workout.id}/summary`, { replace: true }) }
  const elapsed = Math.max(0, Math.round((clock - workout.startedAt) / 60000))
  const editRow = editing ? (pending[editing.key] ?? [])[editing.index] : null
  const editItem = editing ? items.find((i) => i.key === editing.key) : null
  const cur = group[0]
  const curEx = cur ? byId.get(cur.exerciseId) : undefined

  return (
    <Screen tag="DUNGEON" title={workout.name} back="/train" actions={<Button variant="gold" className="px-3" loading={finishing} onClick={finish}>Finish</Button>}>
      <div className="t-small -mt-2 text-dim">{elapsed} min · {logged.filter((s) => s.type !== 'warmup').length} sets logged</div>
      {groups.length > 1 ? (
        <nav aria-label="Exercises" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {groups.map((g, i) => {
            const done = g.every((it) => rowsFor(it).pend.length === 0 && rowsFor(it).done.length > 0)
            return <button key={g[0].key} type="button" aria-current={i === current ? 'step' : undefined} onClick={() => setCurrent(i)} className={`t-label min-h-10 shrink-0 rounded-[var(--r-2)] border px-3 text-[12px] ${i === current ? 'border-glow text-glow' : done ? 'border-[rgb(61_220_132/.5)] text-success' : 'border-[color:var(--line)] text-dim'}`}>{i + 1}. {byId.get(g[0].exerciseId)?.name.split(' ').slice(0, 2).join(' ')}{g.length > 1 ? ` +${g.length - 1}` : ''}</button>
          })}
        </nav>
      ) : null}

      {!items.length ? (
        <SystemWindow tag="EMPTY DUNGEON"><p className="t-system mb-3">[Add exercises to begin.]</p><Button icon="plus" onClick={() => setSheet('add')}>Add exercise</Button></SystemWindow>
      ) : null}

      {group.map((it) => {
        const ex = byId.get(it.exerciseId)
        if (!ex) return null
        const { done, pend } = rowsFor(it)
        const lastStr = last[it.key]?.length ? last[it.key].map((s) => `${u.w(s.weightKg)}×${s.reps}`).join(', ') : null
        const todayBest = Math.max(0, ...done.map((s) => e1rm(s.weightKg, s.reps, s.rir) ?? 0))
        return (
          <SystemWindow key={it.key} tag={group.length > 1 ? `SUPERSET · ${group.indexOf(it) + 1}/${group.length}` : 'EXERCISE'} animate={false}>
            <div className="flex gap-3">
              <button type="button" onClick={() => nav(`/exercises/${ex.id}`)} aria-label={`${ex.name} details`}><ExerciseMedia ex={ex} size={96} credit={false} /></button>
              <div className="min-w-0 flex-1">
                <h2 className="t-heading text-text">{ex.name}</h2>
                <div className="t-small text-dim">{ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}</div>
                <div className="t-num mt-1 text-[13px] text-glow">{it.sets} × {it.holdSec ? `${it.holdSec}s hold` : `${it.repMin}–${it.repMax}`} · RIR {it.rir} · rest {it.restSec}s</div>
                {lastStr ? <div className="t-small text-dim">Last: {lastStr} {u.lift}</div> : null}
                <div className="t-small text-dim">e1RM best {best[it.key] ? `${u.w(best[it.key])}` : '–'}{todayBest ? ` · today ${u.w(todayBest)}` : ''} {u.lift}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {done.map((s, i) => (
                <div key={s.id} className="relative">
                  <SetRow set={{ index: i + 1, type: s.type, weight: u.w(s.weightKg)!, reps: s.reps, rir: s.rir, done: true, pr: gain?.key === s.id && gain.pr }} unit={u.lift} onToggle={() => void undoSet(s.id)} />
                  <AnimatePresence>{gain?.key === s.id && gain.xp > 0 ? <motion.span className="t-num pointer-events-none absolute right-20 top-2 text-gold" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -24 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>+{gain.xp} XP</motion.span> : null}</AnimatePresence>
                </div>
              ))}
              {pend.map((p, j) => {
                const idx = done.length + j
                const pi = (pending[it.key] ?? []).length - pend.length + j
                const row: SetRowData = { index: idx + 1, type: p.type, weight: u.w(p.weightKg)!, reps: p.reps, rir: p.rir, done: false, target: { weight: u.w(it.loadKg) ?? 0, reps: it.repMax } }
                const needsLoad = p.weightKg <= 0 && !ex.equipment.every((e) => e === 'bodyweight' || e === 'pullup_bar' || e === 'bands')
                return <SetRow key={`p${j}`} set={row} unit={u.lift} onToggle={() => (needsLoad ? setEditing({ key: it.key, index: pi }) : void tick(it, p, idx))} onEdit={() => setEditing({ key: it.key, index: pi })} />
              })}
            </div>
            {pend[0] && pend[0].weightKg <= 0 && !ex.equipment.every((e) => e === 'bodyweight' || e === 'pullup_bar' || e === 'bands') ? <p className="t-system mt-2 text-amber">[Choose a starting weight: tap a set. Pick one you can lift for {it.repMax} reps with {it.rir} in reserve.]</p> : null}
            <div className="mt-2">
              <div className="t-label mb-1 text-dim">{effortMode === 'rir' ? 'Reps in reserve' : 'RPE'} for remaining sets</div>
              <RirPicker mode={effortMode} value={pend[0]?.rir ?? it.rir} onChange={(v) => setPending((x) => ({ ...x, [it.key]: (x[it.key] ?? []).map((r, i) => (i >= (x[it.key] ?? []).length - pend.length && r.type !== 'warmup' ? { ...r, rir: v } : r)) }))} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1">
              <IconButton icon="plus" label="Add set" onClick={() => addRow(it)} />
              <IconButton icon="down" label="Add drop set" onClick={() => { const l = pending[it.key] ?? []; const w = l[l.length - 1]?.weightKg ?? it.loadKg ?? 0; addRow(it, { type: 'drop', weightKg: roundToEquipment(w * 0.8, ex.equipment[0]), rir: 0 }) }} />
              <IconButton icon="flame" label="Add warm-up sets" onClick={() => addWarmups(it)} />
              <IconButton icon="swap" label="Swap exercise" onClick={() => { setEditing({ key: it.key, index: -1 }); setSheet('swap') }} />
            </div>
          </SystemWindow>
        )
      })}

      {items.length ? (
        <SystemWindow tag="REST" animate={false}>
          <RestTimer endsAt={restEnd} total={restTotal} onAdjust={(d) => setRestEnd((e) => (e ? e + d * 1000 : e))} onSkip={() => setRestEnd(null)} fullscreen={full} onToggleFullscreen={() => setFull((f) => !f)} />
        </SystemWindow>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" icon="back" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Prev</Button>
        <Button variant="secondary" icon="barbell" onClick={() => setSheet('plates')}>Plates</Button>
        <Button variant="secondary" disabled={current >= groups.length - 1} onClick={() => setCurrent(current + 1)}>Next <Icon name="next" size={18} /></Button>
      </div>
      <Button variant="ghost" icon="plus" onClick={() => setSheet('add')}>Add exercise</Button>

      <Sheet open={!!editRow && !!editItem} onClose={() => setEditing(null)} title="Edit set">
        {editRow && editItem && editing ? (
          <div className="flex flex-col gap-3">
            <NumberStepper label="Weight" value={u.w(editRow.weightKg) ?? 0} step={u.step} onChange={(v) => updatePending(editing.key, editing.index, { weightKg: u.kg(v) })} unit={u.lift} max={1000} />
            <NumberStepper label={editItem.holdSec ? 'Holds' : 'Reps'} value={editRow.reps} onChange={(v) => updatePending(editing.key, editing.index, { reps: v })} max={100} />
            <RirPicker mode={effortMode} value={editRow.rir} onChange={(v) => updatePending(editing.key, editing.index, { rir: v })} />
            <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Set type">
              {(['working', 'warmup', 'drop', 'failure'] as SetType[]).map((t) => <button key={t} type="button" role="radio" aria-checked={editRow.type === t} onClick={() => updatePending(editing.key, editing.index, { type: t })} className={`t-label min-h-12 rounded-[var(--r-2)] border text-[12px] ${editRow.type === t ? 'border-glow text-glow' : 'border-[color:var(--line)] text-dim'}`}>{t}</button>)}
            </div>
            <input aria-label="Set note" placeholder="Note (optional)" value={editRow.notes ?? ''} onChange={(e) => updatePending(editing.key, editing.index, { notes: e.target.value })} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setEditing(null)}>Done</Button>
              <Button variant="danger" onClick={() => { setPending((x) => ({ ...x, [editing.key]: (x[editing.key] ?? []).filter((_, i) => i !== editing.index) })); setEditing(null) }}>Remove</Button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={sheet === 'plates'} onClose={() => setSheet(null)} title="Plate calculator">
        <PlateCalc initial={u.w(curEx ? (pending[cur!.key] ?? [])[0]?.weightKg ?? cur!.loadKg ?? 60 : 60) ?? 60} unit={u.lift} />
      </Sheet>

      <Sheet open={sheet === 'swap'} onClose={() => { setSheet(null); setEditing(null) }} title="Smart swap">
        {editing && byId.get(items.find((i) => i.key === editing.key)?.exerciseId ?? '') ? <SwapList ex={byId.get(items.find((i) => i.key === editing.key)!.exerciseId)!} all={exercises} equipment={profile.equipmentProfiles.find((e) => e.id === profile.activeEquipmentProfile)?.equipment ?? []} injured={profile.injuries.flatMap((i) => i.muscles)} onPick={(exId) => swapTo(items.find((i) => i.key === editing.key)!, exId)} /> : null}
      </Sheet>

      <Sheet open={sheet === 'add'} onClose={() => setSheet(null)} title="Add exercise">
        <AddExercise all={exercises} onPick={async (exId) => { const it = await freeItem(exId); await updateItems(workout.id, [...items, it]); setCurrent(groups.length); setSheet(null) }} />
      </Sheet>
    </Screen>
  )
}

function PlateCalc({ initial, unit }: { initial: number; unit: 'kg' | 'lb' }) {
  const [w, setW] = useState(initial)
  const [bar, setBar] = useState(unit === 'kg' ? 20 : 45)
  const r = plates(w, unit, bar)
  return (
    <div className="flex flex-col gap-3">
      <NumberStepper label="Target" value={w} step={unit === 'kg' ? 2.5 : 5} onChange={setW} unit={unit} max={1000} />
      <NumberStepper label="Bar" value={bar} step={unit === 'kg' ? 5 : 10} onChange={setBar} unit={unit} max={60} />
      <p className="t-system">{r.perSide.length ? `[Load per side: ${r.perSide.join(' + ')} ${unit}.]` : '[The empty bar is enough.]'}</p>
      {r.remainder ? <p className="t-small text-warning">[{Math.abs(r.remainder)} {unit} cannot be made with standard plates. Closest: {r.achieved} {unit}.]</p> : null}
    </div>
  )
}

function SwapList({ ex, all, equipment, injured, onPick }: { ex: Exercise; all: Exercise[]; equipment: Exercise['equipment']; injured: Exercise['primary']; onPick: (id: string) => void }) {
  const [busy, setBusy] = useState(false)
  const list = smartSwap(ex, all, { equipment, injured, busy: busy ? ex.equipment.filter((e) => e !== 'bench' && e !== 'bodyweight') : undefined }, 8)
  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={busy} onChange={(e) => setBusy(e.target.checked)} /> {ex.equipment[0].replace('_', ' ')} is taken</label>
      {list.length ? list.map((s) => <button key={s.id} type="button" onClick={() => onPick(s.id)} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left">{s.name} <span className="t-small text-dim">· {s.equipment.join(', ')}</span></button>) : <p className="t-system text-dim">[No equivalent exercise with your equipment.]</p>}
    </div>
  )
}

function AddExercise({ all, onPick }: { all: Exercise[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const fuse = useMemo(() => new Fuse(all, { keys: ['name', 'aliases'], threshold: 0.35, ignoreLocation: true }), [all])
  const list = q ? fuse.search(q).slice(0, 20).map((r) => r.item) : all.filter((e) => e.core).slice(0, 20)
  return (
    <div className="flex flex-col gap-2">
      <input autoFocus type="search" aria-label="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" />
      {list.map((e) => <button key={e.id} type="button" onClick={() => onPick(e.id)} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left">{e.name}</button>)}
    </div>
  )
}
