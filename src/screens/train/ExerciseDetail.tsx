import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { ExerciseMedia } from '@/ui/ExerciseMedia'
import { BodyMap, MUSCLE_LABEL } from '@/ui/BodyMap'
import { Button } from '@/ui/controls'
import { LineChart } from '@/ui/charts'
import { ExerciseCard } from '@/ui/training'
import { Icon } from '@/ui/icons'
import { useExercises, useProfile } from '@/app/hooks'
import { useUnits } from '@/app/units'
import { activeWorkout, freeItem, startWorkout, updateItems } from '@/app/training'
import { smartSwap } from '@/engine/recommend'
import { e1rm } from '@/engine/strength'
import { dayOf } from '@/engine/dates'
import type { ExercisePref } from '@/engine/model'

/** Exercise detail (PRD F3.6). */
export function ExerciseDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const u = useUnits()
  const profile = useProfile()
  const exercises = useExercises()
  const ex = useLiveQuery(() => db.exercises.get(id!), [id])
  const pref = useLiveQuery(() => db.exercisePrefs.get(id!), [id])
  const history = useLiveQuery(async () => {
    const sets = (await db.sets.where('exerciseId').equals(id!).toArray()).filter((s) => s.type !== 'warmup')
    const byDay = new Map<string, { day: string; e1rm: number; best: string; volume: number }>()
    for (const s of sets) {
      const d = dayOf(s.completedAt)
      const cur = byDay.get(d) ?? { day: d, e1rm: 0, best: '', volume: 0 }
      const est = e1rm(s.weightKg, s.reps, s.rir) ?? 0
      if (est > cur.e1rm) { cur.e1rm = Math.round(est * 10) / 10; cur.best = `${u.w(s.weightKg)} ${u.lift} × ${s.reps}` }
      cur.volume += s.weightKg * s.reps
      byDay.set(d, cur)
    }
    return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
  }, [id, u.lift], [])
  if (!ex || !profile) return null
  const have = profile.equipmentProfiles.find((e) => e.id === profile.activeEquipmentProfile)?.equipment ?? []
  const swaps = smartSwap(ex, exercises, { equipment: have, injured: profile.injuries.flatMap((i) => i.muscles) })
  const pr = history.reduce((a, h) => (h.e1rm > a.e1rm ? h : a), { day: '', e1rm: 0, best: '', volume: 0 })
  const setPref = async (p: ExercisePref['pref'] | null) => (p ? db.exercisePrefs.put({ exerciseId: ex.id, pref: p }) : db.exercisePrefs.delete(ex.id))
  const add = async () => {
    const item = await freeItem(ex.id)
    const w = await activeWorkout()
    if (w) { await updateItems(w.id, [...(w.items ?? []), item]); nav(`/workout/${w.id}`) } else nav(`/workout/${await startWorkout({ items: [item], name: ex.name })}`)
  }
  return (
    <Screen tag="EXERCISE" title={ex.name} back>
      <SystemWindow tag="DEMONSTRATION">
        <div className="flex items-center justify-around gap-2">
          <ExerciseMedia ex={ex} size={180} />
          <BodyMap sex={profile.sex} face={ex.primary.some((m) => ['lats', 'upper_back', 'lower_back', 'glutes', 'hamstrings', 'rear_delts', 'abductors'].includes(m)) ? 'back' : 'front'} mode="view" highlight={{ primary: ex.primary, secondary: ex.secondary }} height={180} showFlip={false} />
        </div>
        <p className="t-system mt-3">{ex.description}</p>
        <div className="t-small mt-2 text-dim">Targets: <span className="text-glow">{ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}</span>{ex.secondary.length ? ` · Assists: ${ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}` : ''}</div>
        <div className="t-small text-dim">Equipment: {ex.equipment.join(', ')} · {ex.difficulty} · {ex.mechanics}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button icon="plus" onClick={add}>Add to workout</Button>
          {ex.formCheck ? <Button variant="secondary" icon="pose" onClick={() => nav(`/form?exercise=${ex.id}`)}>Check my form</Button> : null}
        </div>
      </SystemWindow>
      <SystemWindow tag="INSTRUCTIONS" animate={false}>
        <ol className="flex list-decimal flex-col gap-2 pl-5">{ex.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </SystemWindow>
      <SystemWindow tag="TIPS" animate={false}>
        <ul className="flex flex-col gap-1">{ex.tips.map((t, i) => <li key={i} className="flex gap-2"><Icon name="check" size={18} className="mt-1 shrink-0 text-success" />{t}</li>)}</ul>
      </SystemWindow>
      <SystemWindow tag="COMMON MISTAKES" variant="alert" animate={false}>
        <ul className="flex flex-col gap-1">{ex.mistakes.map((t, i) => <li key={i} className="flex gap-2"><Icon name="close" size={18} className="mt-1 shrink-0 text-warning" />{t}</li>)}</ul>
      </SystemWindow>
      <SystemWindow tag="YOUR HISTORY" animate={false}>
        {pr.e1rm ? <p className="t-system mb-2">[Personal record: {u.w(pr.e1rm)} {u.lift} e1RM ({pr.best}) on {pr.day}.]</p> : null}
        <LineChart data={history.map((h) => ({ day: h.day.slice(5), e1rm: u.w(h.e1rm) ?? 0 }))} x="day" y="e1rm" unit={` ${u.lift}`} empty="[No sets logged for this exercise yet.]" />
      </SystemWindow>
      <SystemWindow tag="PREFERENCE" animate={false}>
        <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Preference">
          {([['more', 'More'], ['less', 'Less'], ['never', 'Never'], [null, 'Normal']] as const).map(([p, l]) => (
            <button key={l} type="button" role="radio" aria-checked={(pref?.pref ?? null) === p} onClick={() => setPref(p)} className={`t-label min-h-12 rounded-[var(--r-2)] border ${(pref?.pref ?? null) === p ? 'border-glow text-glow' : 'border-[color:var(--line)] text-dim'}`}>{l}</button>
          ))}
        </div>
      </SystemWindow>
      <SystemWindow tag="EQUIVALENT SWAPS" animate={false}>
        <div className="flex flex-col gap-2">{swaps.map((s) => <ExerciseCard key={s.id} name={s.name} muscles={s.primary.map((m) => MUSCLE_LABEL[m])} equipment={s.equipment.join(', ')} difficulty={s.difficulty} thumb={s.media.thumb} onClick={() => nav(`/exercises/${s.id}`)} />)}</div>
      </SystemWindow>
    </Screen>
  )
}
