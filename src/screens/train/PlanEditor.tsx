import { useState } from 'react'
import { Reorder } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import Fuse from 'fuse.js'
import { db } from '@/db/schema'
import { uid } from '@/db/repo'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, IconButton, NumberStepper } from '@/ui/controls'
import { Sheet } from '@/ui/layout'
import { Icon } from '@/ui/icons'
import { EmptyState } from '@/ui/feedback'
import { useExercises, useProfile } from '@/app/hooks'
import { useUnits } from '@/app/units'
import { buildPlan } from '@/app/awakening'
import { estimateDuration, validatePlan } from '@/engine/plan'
import { prescribe } from '@/engine/prescription'
import { smartSwap } from '@/engine/recommend'
import type { PlanExercise } from '@/engine/model'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Plan editor (PRD F3.7): days → exercises → sets; drag to reorder; System warnings when an edit breaks the rules. */
export function PlanEditor() {
  const profile = useProfile()
  const exercises = useExercises()
  const u = useUnits()
  const data = useLiveQuery(async () => {
    const plan = (await db.plans.toArray()).find((p) => p.active)
    if (!plan) return null
    const days = await db.planDays.where('planId').equals(plan.id).sortBy('order')
    const pes = (await db.planExercises.toArray()).filter((p) => days.some((d) => d.id === p.planDayId))
    return { plan, days, pes }
  }, [])
  const [edit, setEdit] = useState<PlanExercise | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [swapping, setSwapping] = useState<PlanExercise | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [q, setQ] = useState('')
  if (!profile || data === undefined) return null
  if (!data) return <Screen tag="PLAN" back="/train"><SystemWindow tag="PLAN"><EmptyState message="[No plan exists. Complete the Awakening.]" /></SystemWindow></Screen>
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const age = Number(new Date().getFullYear()) - profile.birthYear
  const warnings = validatePlan(data.days, data.pes, byId, { experience: profile.experience, age, sessionMinutes: profile.sessionMinutes, injured: profile.injuries.flatMap((i) => i.muscles) })
  const markEdited = () => db.plans.update(data.plan.id, { edited: true })
  const save = async (pe: PlanExercise) => { await db.planExercises.put({ ...pe, edited: true }); await markEdited() }
  const reorder = async (ids: string[]) => { for (const [i, id] of ids.entries()) await db.planExercises.update(id, { order: i, edited: true }); await markEdited() }
  const add = async (dayId: string, exId: string) => {
    const ex = byId.get(exId)!
    const rx = prescribe(ex, { cls: profile.cls, experience: profile.experience, sex: profile.sex, age })
    const order = data.pes.filter((p) => p.planDayId === dayId).length
    await db.planExercises.put({ id: uid(), planDayId: dayId, order, exerciseId: exId, sets: rx.sets, repMin: rx.repMin, repMax: rx.repMax, rir: rx.rir, loadKg: null, restSec: rx.restSec, holdSec: rx.holdSec, edited: true, technique: 'straight' })
    await markEdited()
    setAdding(null); setQ('')
  }
  const fuse = new Fuse(exercises, { keys: ['name', 'aliases'], threshold: 0.35, ignoreLocation: true })
  const results = q ? fuse.search(q).slice(0, 15).map((r) => r.item) : exercises.filter((e) => e.core).slice(0, 15)
  const regenerate = async () => { await buildPlan(profile); setConfirm(false) }

  return (
    <Screen tag="PLAN" title={`Week ${data.plan.week} · ${data.plan.split.replace('_', ' ')}`} back="/train">
      {warnings.length ? (
        <SystemWindow tag="WARNING" variant="alert" animate={false}>
          <ul className="flex flex-col gap-2">{warnings.map((w, i) => <li key={i}><div className="t-system text-warning">{w.message}</div><div className="t-small text-dim">Suggested fix: {w.fix}</div></li>)}</ul>
        </SystemWindow>
      ) : null}
      {data.days.map((d) => {
        const mine = data.pes.filter((p) => p.planDayId === d.id).sort((a, b) => a.order - b.order)
        return (
          <SystemWindow key={d.id} tag={`${DAYS[d.weekday].toUpperCase()} · ~${estimateDuration(mine)} MIN`} title={d.name} animate={false}>
            <label className="mb-2 flex items-center gap-2"><span className="t-label text-dim">Day</span>
              <select aria-label={`${d.name} weekday`} value={d.weekday} onChange={async (e) => { await db.planDays.update(d.id, { weekday: Number(e.target.value) }); await markEdited() }} className="min-h-10 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-2">{DAYS.map((x, i) => <option key={x} value={i}>{x}</option>)}</select>
            </label>
            <Reorder.Group axis="y" values={mine.map((m) => m.id)} onReorder={(ids) => void reorder(ids)} className="flex flex-col gap-2">
              {mine.map((pe) => {
                const ex = byId.get(pe.exerciseId)
                return (
                  <Reorder.Item key={pe.id} value={pe.id} className="flex items-center gap-2 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-2">
                    <span className="cursor-grab text-dim" aria-label="Drag to reorder"><Icon name="drag" /></span>
                    <button type="button" className="min-h-12 min-w-0 flex-1 text-left" onClick={() => setEdit(pe)}>
                      <div className="truncate">{ex?.name}</div>
                      <div className="t-num text-[12px] text-dim">{pe.sets} × {pe.holdSec ? `${pe.holdSec}s` : `${pe.repMin}–${pe.repMax}`} · {pe.loadKg ? `${u.w(pe.loadKg)} ${u.lift} · ` : ''}RIR {pe.rir} · {pe.restSec}s</div>
                    </button>
                    <IconButton icon="swap" label={`Swap ${ex?.name}`} onClick={() => setSwapping(pe)} />
                    <IconButton icon="trash" label={`Remove ${ex?.name}`} onClick={async () => { await db.planExercises.delete(pe.id); await markEdited() }} />
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
            <Button variant="ghost" icon="plus" className="mt-2 w-full" onClick={() => setAdding(d.id)}>Add exercise</Button>
          </SystemWindow>
        )
      })}
      <Button variant="secondary" icon="swap" onClick={() => (data.plan.edited ? setConfirm(true) : void regenerate())}>Regenerate plan</Button>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit ? byId.get(edit.exerciseId)?.name ?? '' : ''}>
        {edit ? (
          <div className="flex flex-col gap-3">
            <div><div className="t-label text-dim">Sets</div><NumberStepper label="Sets" value={edit.sets} min={1} max={10} onChange={(v) => setEdit({ ...edit, sets: v })} /></div>
            <div><div className="t-label text-dim">Min reps</div><NumberStepper label="Min reps" value={edit.repMin} min={1} max={edit.repMax} onChange={(v) => setEdit({ ...edit, repMin: v })} /></div>
            <div><div className="t-label text-dim">Max reps</div><NumberStepper label="Max reps" value={edit.repMax} min={edit.repMin} max={50} onChange={(v) => setEdit({ ...edit, repMax: v })} /></div>
            <div><div className="t-label text-dim">Load</div><NumberStepper label="Load" value={u.w(edit.loadKg) ?? 0} step={u.step} max={1000} onChange={(v) => setEdit({ ...edit, loadKg: v ? u.kg(v) : null })} unit={u.lift} /></div>
            <div><div className="t-label text-dim">Target RIR</div><NumberStepper label="RIR" value={edit.rir} min={0} max={5} onChange={(v) => setEdit({ ...edit, rir: v })} /></div>
            <div><div className="t-label text-dim">Rest</div><NumberStepper label="Rest" value={edit.restSec} step={15} min={15} max={600} onChange={(v) => setEdit({ ...edit, restSec: v })} unit="s" /></div>
            <Button onClick={async () => { await save(edit); setEdit(null) }}>Save</Button>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={!!adding} onClose={() => setAdding(null)} title="Add exercise">
        <input autoFocus type="search" aria-label="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="mb-2 min-h-12 w-full rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" />
        <div className="flex flex-col gap-1">{results.map((e) => <button key={e.id} type="button" onClick={() => void add(adding!, e.id)} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left">{e.name}</button>)}</div>
      </Sheet>

      <Sheet open={!!swapping} onClose={() => setSwapping(null)} title="Swap exercise">
        {swapping && byId.get(swapping.exerciseId) ? (
          <div className="flex flex-col gap-1">
            {smartSwap(byId.get(swapping.exerciseId)!, exercises, { equipment: profile.equipmentProfiles.find((e) => e.id === profile.activeEquipmentProfile)?.equipment ?? [], injured: profile.injuries.flatMap((i) => i.muscles) }, 10).map((s) => (
              <button key={s.id} type="button" className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left" onClick={async () => { await save({ ...swapping, exerciseId: s.id, loadKg: null }); setSwapping(null) }}>{s.name} <span className="t-small text-dim">· {s.equipment.join(', ')}</span></button>
            ))}
          </div>
        ) : null}
      </Sheet>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="[Confirm regeneration]">
        <p className="t-system mb-3">[Your plan contains manual changes. Regenerating will replace them. Proceed?]</p>
        <div className="flex gap-2"><Button variant="danger" className="flex-1" onClick={() => void regenerate()}>Replace my plan</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Keep it</Button></div>
      </Sheet>
    </Screen>
  )
}
