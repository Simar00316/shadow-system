import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { ExerciseCard } from '@/ui/training'
import { EmptyState } from '@/ui/feedback'
import { MUSCLE_LABEL } from '@/ui/BodyMap'
import { Icon } from '@/ui/icons'
import { useExercises, useProfile } from '@/app/hooks'
import { BASE_CLASSES, EQUIPMENT, MUSCLES, type Equipment, type Exercise } from '@/engine/types'
import { available } from '@/engine/recommend'

const sel = 'min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-2 text-[14px]'

/** Exercise library (PRD F3.5): instant fuzzy search by name or alias, filters and preference marks. */
export function Exercises() {
  const nav = useNavigate()
  const exercises = useExercises()
  const profile = useProfile()
  const prefs = useLiveQuery(async () => new Map((await db.exercisePrefs.toArray()).map((p) => [p.exerciseId, p.pref])), [], new Map())
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equip, setEquip] = useState('')
  const [onlyEquip, setOnlyEquip] = useState(false)
  const [mine, setMine] = useState(false)
  const [difficulty, setDifficulty] = useState('')
  const [cls, setCls] = useState('')
  const [pref, setPref] = useState('')
  const [limit, setLimit] = useState(60)
  const fuse = useMemo(() => new Fuse(exercises, { keys: [{ name: 'name', weight: 2 }, 'aliases'], threshold: 0.35, ignoreLocation: true }), [exercises])
  const have = useMemo(() => profile?.equipmentProfiles.find((e) => e.id === profile.activeEquipmentProfile)?.equipment ?? [], [profile])
  const list = useMemo(() => {
    let l: Exercise[] = q.trim() ? fuse.search(q.trim()).map((r) => r.item) : [...exercises].sort((a, b) => Number(b.core) - Number(a.core) || a.name.localeCompare(b.name))
    if (muscle) l = l.filter((e) => e.primary.includes(muscle as never) || e.secondary.includes(muscle as never))
    if (equip) l = l.filter((e) => (onlyEquip ? e.equipment.every((x) => x === equip || x === 'bench') : e.equipment.includes(equip as Equipment)))
    if (mine) l = l.filter((e) => available(e, have))
    if (difficulty) l = l.filter((e) => e.difficulty === difficulty)
    if (cls) l = l.filter((e) => e.classTags.includes(cls as never))
    if (pref) l = l.filter((e) => prefs.get(e.id) === pref)
    return l
  }, [q, fuse, exercises, muscle, equip, onlyEquip, mine, have, difficulty, cls, pref, prefs])

  return (
    <Screen tag="ARCHIVE" title="Exercises" back="/train">
      <label className="relative block">
        <span className="sr-only">Search exercises</span>
        <Icon name="search" className="absolute left-3 top-3 text-dim" />
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(60) }} placeholder="Search by name or alias" className="min-h-12 w-full rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel pl-11 pr-3" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Muscle" className={sel} value={muscle} onChange={(e) => setMuscle(e.target.value)}><option value="">All muscles</option>{MUSCLES.map((m) => <option key={m} value={m}>{MUSCLE_LABEL[m]}</option>)}</select>
        <select aria-label="Equipment" className={sel} value={equip} onChange={(e) => setEquip(e.target.value)}><option value="">All equipment</option>{EQUIPMENT.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}</select>
        <select aria-label="Difficulty" className={sel} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="">Any difficulty</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
        <select aria-label="Class" className={sel} value={cls} onChange={(e) => setCls(e.target.value)}><option value="">Any class</option>{BASE_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select aria-label="Preference" className={sel} value={pref} onChange={(e) => setPref(e.target.value)}><option value="">Any preference</option><option value="more">More often</option><option value="less">Less often</option><option value="never">Never</option></select>
        <label className="flex min-h-12 items-center gap-2 text-[14px]"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> My equipment</label>
      </div>
      {equip ? <label className="flex min-h-12 items-center gap-2 text-[14px]"><input type="checkbox" checked={onlyEquip} onChange={(e) => setOnlyEquip(e.target.checked)} /> Only {equip.replace('_', ' ')}</label> : null}
      <SystemWindow tag={`${list.length} RESULTS`} animate={false}>
        {list.length ? (
          <div className="flex flex-col gap-2">
            {list.slice(0, limit).map((e) => <ExerciseCard key={e.id} name={e.name} muscles={e.primary.map((m) => MUSCLE_LABEL[m])} equipment={e.equipment.join(', ')} difficulty={e.difficulty} thumb={e.media.thumb} pref={prefs.get(e.id)} onClick={() => nav(`/exercises/${e.id}`)} />)}
            {list.length > limit ? <button type="button" className="t-label min-h-12 text-glow" onClick={() => setLimit(limit + 60)}>Show more</button> : null}
          </div>
        ) : <EmptyState message="[No exercise matches. Loosen the filters.]" icon="search" />}
      </SystemWindow>
    </Screen>
  )
}
