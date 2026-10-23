import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button } from '@/ui/controls'
import { Icon, type IconName } from '@/ui/icons'
import { EmptyState } from '@/ui/feedback'
import { useProfile, useToday } from '@/app/hooks'
import { BodyMap, MUSCLE_LABEL } from '@/ui/BodyMap'
import { activeWorkout, openInstant, requestDeload, startWorkout } from '@/app/training'
import { sessionFor } from '@/app/game'
import { estimateDuration } from '@/engine/plan'
import { INSTANT_DUNGEONS } from '@/data/programs'
import { getSetting } from '@/db/repo'
import { sfx } from '@/audio/sfx'

const LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: '/bodymap', label: 'Body map', icon: 'status' }, { to: '/exercises', label: 'Exercises', icon: 'search' }, { to: '/plan', label: 'Plan', icon: 'edit' },
  { to: '/cardio', label: 'Cardio', icon: 'cardio' }, { to: '/form', label: 'Form check', icon: 'pose' }, { to: '/dungeons', label: 'Dungeons', icon: 'dungeon' },
]

/** Train tab: today's dungeon, quick links, Instant Dungeons. */
export function Train() {
  const nav = useNavigate()
  const today = useToday()
  const profile = useProfile()
  const data = useLiveQuery(async () => {
    const session = await sessionFor(today)
    const pes = session ? await db.planExercises.where('planDayId').equals(session.planDayId).toArray() : []
    const deload = await getSetting<{ until: string } | null>('deload')
    const focus = session ? (await db.planDays.get(session.planDayId))?.focus ?? [] : []
    return { session, focus, minutes: estimateDuration(pes), active: await activeWorkout(), keys: (await db.inventory.get('instant_key'))?.qty ?? 0, deload: deload && today <= deload.until ? deload : null, done: (await db.workouts.where('day').equals(today).filter((w) => !!w.endedAt).count()) > 0 }
  }, [today])
  if (!data) return null
  const begin = async (planDayId?: string) => { sfx.play('boss'); const id = await startWorkout({ planDayId }); nav(`/workout/${id}`) }
  return (
    <Screen tag="TRAIN" title="Dungeon of the day" actions={<span className="chip" data-tone="gold" aria-label={`${data.keys} instant keys`}><Icon name="key" size={14} /><span className="t-num text-[13px] tracking-normal">{data.keys}</span></span>}>
      {data.active ? (
        <SystemWindow tag="IN PROGRESS" variant="reward">
          <p className="t-system mb-3">[{data.active.name} is in progress.]</p>
          <Button variant="gold" className="w-full" icon="play" onClick={() => nav(`/workout/${data.active!.id}`)}>Resume</Button>
        </SystemWindow>
      ) : null}
      {data.deload ? <SystemWindow tag="RECOVERY PHASE" variant="shadow" animate={false}><p className="t-system">[Recovery Phase until {data.deload.until}. Lighter loads, same exercises, bonus VIT.]</p></SystemWindow> : null}
      <SystemWindow tag="TODAY" hero={!data.active} aria-label="TODAY">
        {data.session ? (
          <>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="sys-title t-moment text-text glow-text">{data.session.name}</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="chip">{data.session.exercises} exercises</span>
                  <span className="chip" data-tone="dim">~{data.minutes} min</span>
                  {data.done ? <span className="chip" data-tone="green">Cleared</span> : null}
                </div>
                {data.focus.length ? <p className="t-small mt-3 text-dim">{data.focus.slice(0, 4).map((m) => MUSCLE_LABEL[m]).join(' · ')}</p> : null}
              </div>
              {profile ? (
                <div className="flex w-[88px] shrink-0 justify-center rounded-[var(--r-ctl)] border border-[color:var(--edge)] bg-[rgb(2_4_10/.5)] p-1" aria-hidden="true">
                  <BodyMap sex={profile.sex} face="front" mode="view" highlight={{ primary: data.focus, secondary: [] }} height={128} showFlip={false} />
                </div>
              ) : null}
            </div>
            <Button className="mt-5 min-h-14 w-full" icon="play" onClick={() => begin(data.session!.planDayId)} disabled={!!data.active}>Enter the dungeon</Button>
          </>
        ) : (
          <>
            <h2 className="sys-title t-moment text-text">Rest day</h2>
            <EmptyState message="[No dungeon today. Complete a 10–15 minute mobility block or log cardio to clear the Daily Quest.]" icon="moon" action={<Button variant="secondary" onClick={() => nav('/cardio')}>Log cardio or mobility</Button>} />
          </>
        )}
        <Button variant="ghost" className="mt-1 w-full" onClick={() => begin()} disabled={!!data.active}>Free session</Button>
      </SystemWindow>

      <nav aria-label="Training tools" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex w-max gap-2 pb-1">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} data-glitch="" className="press flex h-11 items-center gap-2 rounded-full border border-[color:var(--edge-hi)] bg-[image:var(--surface-1)] pl-1.5 pr-4 text-text shadow-[var(--rim-top)]">
                <span className="well h-8 w-8 rounded-full"><Icon name={l.icon} size={16} /></span>
                <span className="glitch-label t-label text-[12px]">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="INSTANT DUNGEONS">
        <div className="section-head">
          <span className="t-label text-dim">Instant dungeons</span>
          <span className="flex items-center gap-1" aria-label={`Keys held: ${data.keys}`}>
            {[0, 1, 2].map((i) => <span key={i} className={i < data.keys ? 'text-gold' : 'text-faint'}><Icon name="key" size={14} /></span>)}
            <span className="t-micro ml-1 text-faint">1 per day</span>
          </span>
        </div>
        <div className="group">
          {INSTANT_DUNGEONS.map((d, i) => (
            <button key={d.name} type="button" className="group-row press disabled:opacity-40" data-glitch="" disabled={!data.keys || !!data.active} onClick={async () => { const id = await openInstant(i); if (id) nav(`/workout/${id}`) }}>
              <span className="well"><Icon name="key" size={18} /></span>
              <span className="t-row min-w-0 flex-1 truncate">{d.name}</span>
              <Icon name="next" size={16} className="text-dim" />
            </button>
          ))}
        </div>
      </section>
      <Button variant="ghost" onClick={() => void requestDeload()}>I feel beat up: request a Recovery Phase</Button>
    </Screen>
  )
}
