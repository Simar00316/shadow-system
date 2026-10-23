import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button } from '@/ui/controls'
import { Icon, type IconName } from '@/ui/icons'
import { EmptyState } from '@/ui/feedback'
import { useToday } from '@/app/hooks'
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
  const data = useLiveQuery(async () => {
    const session = await sessionFor(today)
    const pes = session ? await db.planExercises.where('planDayId').equals(session.planDayId).toArray() : []
    const deload = await getSetting<{ until: string } | null>('deload')
    return { session, minutes: estimateDuration(pes), active: await activeWorkout(), keys: (await db.inventory.get('instant_key'))?.qty ?? 0, deload: deload && today <= deload.until ? deload : null, done: (await db.workouts.where('day').equals(today).filter((w) => !!w.endedAt).count()) > 0 }
  }, [today])
  if (!data) return null
  const begin = async (planDayId?: string) => { sfx.play('boss'); const id = await startWorkout({ planDayId }); nav(`/workout/${id}`) }
  return (
    <Screen tag="TRAIN" title="Dungeon of the day">
      {data.active ? (
        <SystemWindow tag="IN PROGRESS" variant="reward">
          <p className="t-system mb-3">[{data.active.name} is in progress.]</p>
          <Button variant="gold" className="w-full" icon="play" onClick={() => nav(`/workout/${data.active!.id}`)}>Resume</Button>
        </SystemWindow>
      ) : null}
      {data.deload ? <SystemWindow tag="RECOVERY PHASE" variant="shadow" animate={false}><p className="t-system">[Recovery Phase until {data.deload.until}. Lighter loads, same exercises, bonus VIT.]</p></SystemWindow> : null}
      <SystemWindow tag="TODAY" title={data.session?.name ?? 'Rest day'}>
        {data.session ? (
          <>
            <p className="t-small mb-3 text-dim">{data.session.exercises} exercises · about {data.minutes} min{data.done ? ' · cleared' : ''}</p>
            <Button className="w-full" icon="play" onClick={() => begin(data.session!.planDayId)} disabled={!!data.active}>Enter the dungeon</Button>
          </>
        ) : (
          <EmptyState message="[No dungeon today. Complete a 10–15 minute mobility block or log cardio to clear the Daily Quest.]" icon="moon" action={<Button variant="secondary" onClick={() => nav('/cardio')}>Log cardio or mobility</Button>} />
        )}
        <Button variant="ghost" className="mt-2 w-full" onClick={() => begin()} disabled={!!data.active}>Free session</Button>
      </SystemWindow>
      <div className="grid grid-cols-3 gap-2">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel text-glow">
            <Icon name={l.icon} /><span className="t-label text-[12px] text-text">{l.label}</span>
          </Link>
        ))}
      </div>
      <SystemWindow tag="INSTANT DUNGEONS" animate={false}>
        <p className="t-small mb-2 text-dim">Keys held: <span className="t-num text-gold">{data.keys}</span>. One per day.</p>
        <div className="flex flex-col gap-2">
          {INSTANT_DUNGEONS.map((d, i) => (
            <Button key={d.name} variant="secondary" icon="key" disabled={!data.keys || !!data.active} onClick={async () => { const id = await openInstant(i); if (id) nav(`/workout/${id}`) }}>{d.name}</Button>
          ))}
        </div>
      </SystemWindow>
      <Button variant="ghost" onClick={() => void requestDeload()}>I feel beat up: request a Recovery Phase</Button>
    </Screen>
  )
}
