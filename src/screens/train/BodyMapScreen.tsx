import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { uid } from '@/db/repo'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { BodyMap, MUSCLE_LABEL, recoveryColor } from '@/ui/BodyMap'
import { Button, Tabs } from '@/ui/controls'
import { ExerciseCard } from '@/ui/training'
import { Sheet } from '@/ui/layout'
import { EmptyState } from '@/ui/feedback'
import { useExercises, useProfile, useRecovery } from '@/app/hooks'
import { activeWorkout, freeItem, startWorkout, updateItems } from '@/app/training'
import { recommend } from '@/engine/recommend'
import { recoveryBand } from '@/engine/recovery'
import { baseOf } from '@/engine/prescription'
import type { Muscle, Sex } from '@/engine/types'

/** Body Map (PRD F3.4): Target mode ranks exercises for tapped muscles; Recovery mode shows the heatmap with overrides. */
export function BodyMapScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const profile = useProfile()
  const exercises = useExercises()
  const rec = useRecovery()
  const prefs = useLiveQuery(async () => new Map((await db.exercisePrefs.toArray()).map((p) => [p.exerciseId, p.pref])), [], new Map())
  const [mode, setMode] = useState<'target' | 'recovery'>(params.get('mode') === 'recovery' ? 'recovery' : 'target')
  const [sex, setSex] = useState<Sex | null>(null)
  const [targets, setTargets] = useState<Muscle[]>([])
  const [focus, setFocus] = useState<Muscle | null>(null)
  const [override, setOverride] = useState(100)
  const history = useLiveQuery(async () => {
    if (!focus) return []
    const ids = new Set(exercises.filter((e) => e.primary.includes(focus)).map((e) => e.id))
    const sets = await db.sets.orderBy('completedAt').reverse().filter((s) => ids.has(s.exerciseId) && s.type !== 'warmup').limit(10).toArray()
    return sets.map((s) => ({ s, name: exercises.find((e) => e.id === s.exerciseId)?.name ?? '' }))
  }, [focus, exercises], [])
  if (!profile) return null
  const body = sex ?? profile.sex
  const equipment = profile.equipmentProfiles.find((e) => e.id === profile.activeEquipmentProfile)?.equipment ?? ['bodyweight']
  const ranked = targets.length ? recommend(exercises, targets, { equipment, recovery: rec?.rec, baseClass: baseOf(profile.cls), prefs, injured: profile.injuries.flatMap((i) => i.muscles), experience: profile.experience }, 15) : []

  const addToWorkout = async (exerciseId: string) => {
    const item = await freeItem(exerciseId)
    const w = await activeWorkout()
    if (w) { await updateItems(w.id, [...(w.items ?? []), item]); nav(`/workout/${w.id}`) }
    else nav(`/workout/${await startWorkout({ items: [item], name: `Targeted: ${targets.map((m) => MUSCLE_LABEL[m]).join(', ')}` })}`)
  }

  return (
    <Screen tag="BODY MAP" title={mode === 'target' ? 'Target muscles' : 'Recovery'} back="/train">
      <Tabs label="Mode" value={mode} onChange={setMode} tabs={[{ id: 'target', label: 'Target' }, { id: 'recovery', label: 'Recovery' }]} />
      <SystemWindow tag={mode === 'target' ? 'SELECT' : 'HEATMAP'} animate={false}>
        <div className="mb-2 flex justify-end">
          <button type="button" className="t-label min-h-12 px-2 text-glow" onClick={() => setSex(body === 'male' ? 'female' : 'male')}>Show {body === 'male' ? 'female' : 'male'} figure</button>
        </div>
        <BodyMap
          sex={body}
          mode={mode}
          selected={targets}
          recovery={rec?.rec}
          onSelect={(m) => (mode === 'target' ? setTargets((t) => (t.includes(m) ? t.filter((x) => x !== m) : [...t, m])) : (setFocus(m), setOverride(rec?.rec[m] ?? 100)))}
          height={380}
        />
        {mode === 'recovery' ? (
          <div className="t-small mt-2 flex justify-center gap-4 text-dim">
            <span><span className="inline-block h-2 w-2 rounded-full bg-warning" /> under 30%</span>
            <span><span className="inline-block h-2 w-2 rounded-full bg-amber" /> 30–70%</span>
            <span><span className="inline-block h-2 w-2 rounded-full bg-success" /> ready</span>
          </div>
        ) : null}
      </SystemWindow>
      {mode === 'target' ? (
        <SystemWindow tag="RECOMMENDED" animate={false}>
          {ranked.length ? (
            <div className="flex flex-col gap-2">
              {ranked.map(({ ex, reasons }) => (
                <div key={ex.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1"><ExerciseCard name={ex.name} muscles={ex.primary.map((m) => MUSCLE_LABEL[m])} equipment={ex.equipment.join(', ')} difficulty={ex.difficulty} thumb={ex.media.thumb} pref={prefs.get(ex.id)} onClick={() => nav(`/exercises/${ex.id}`)} /></div>
                  <Button variant="secondary" className="px-3" icon="plus" aria-label={`Add ${ex.name} to workout`} onClick={() => addToWorkout(ex.id)} />
                  <span className="sr-only">{reasons.join(', ')}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState message="[Tap muscles on the figure. The System will rank exercises by match, equipment, recovery, class and your preferences.]" icon="status" />}
        </SystemWindow>
      ) : null}
      <Sheet open={!!focus} onClose={() => setFocus(null)} title={focus ? MUSCLE_LABEL[focus] : ''}>
        {focus && rec ? (
          <div className="flex flex-col gap-3">
            <div className="t-num-lg" style={{ color: recoveryColor(rec.rec[focus]) }}>{rec.rec[focus]}% <span className="t-small text-dim">{recoveryBand(rec.rec[focus])}</span></div>
            <label className="flex flex-col gap-1">
              <span className="t-label text-dim">Manual override</span>
              <input type="range" min={0} max={100} step={5} value={override} onChange={(e) => setOverride(Number(e.target.value))} aria-label="Override recovery" />
              <span className="t-num">{override}%</span>
            </label>
            <Button onClick={async () => { await db.recovery.add({ id: uid(), muscle: focus, value: override, at: Date.now() }); setFocus(null) }}>Set recovery</Button>
            <div className="t-label text-dim">Recent sets</div>
            {history.length ? <ul className="t-small flex flex-col gap-1">{history.map(({ s, name }) => <li key={s.id}>{new Date(s.completedAt).toLocaleDateString()} · {name} · {s.weightKg} kg × {s.reps}</li>)}</ul> : <p className="t-small text-dim">[No history for this muscle.]</p>}
          </div>
        ) : null}
      </Sheet>
    </Screen>
  )
}
