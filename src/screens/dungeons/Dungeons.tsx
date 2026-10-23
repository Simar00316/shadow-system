import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { getSetting } from '@/db/repo'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, NumberStepper } from '@/ui/controls'
import { RankBadge } from '@/ui/RankBadge'
import { Sheet } from '@/ui/layout'
import { EmptyState } from '@/ui/feedback'
import { Icon } from '@/ui/icons'
import { abandonGate, activeRun, enterGate, programById, startFloor, submitBoss } from '@/app/progression'
import { gateAccess, isBossFloor, unstable, castleFloor, floorThreshold, CASTLE_BOSSES, CASTLE_FLOORS } from '@/engine/dungeons'
import { dayOf } from '@/engine/dates'
import { PROGRAMS } from '@/data/programs'
import { RANKS } from '@/engine/types'
import { sfx } from '@/audio/sfx'

const COLOR = { blue: 'system', purple: 'shadow', red: 'alert' } as const

/** Gate list by rank (PRD F3.10). */
export function Dungeons() {
  const nav = useNavigate()
  const player = useLiveQuery(() => db.player.get('me'), [])
  const run = useLiveQuery(() => activeRun(), [])
  if (!player) return null
  const byRank = RANKS.filter((r) => PROGRAMS.some((p) => p.rank === r))
  return (
    <Screen tag="GATES" title="Dungeons" back="/system">
      {run ? (
        <SystemWindow tag="ACTIVE GATE" variant={COLOR[programById.get(run.programId)!.color]}>
          <div className="t-heading">{programById.get(run.programId)!.name}</div>
          <div className="t-small text-dim">Floor {run.floor} of {programById.get(run.programId)!.weeks}</div>
          <Button className="mt-3 w-full" onClick={() => nav(`/dungeons/${run.programId}`)}>Open</Button>
        </SystemWindow>
      ) : null}
      <Link to="/castle" className="block"><SystemWindow tag="DEMON CASTLE" variant="alert" animate={false}><div className="flex items-center gap-3"><Icon name="crown" className="text-warning" /><span>A 100-floor tower of lifetime milestones.</span></div></SystemWindow></Link>
      {byRank.map((r) => (
        <section key={r} aria-label={`${r}-rank Gates`} className="flex flex-col gap-2">
          <h2 className="t-tag flex items-center gap-2 text-dim"><RankBadge rank={r} size="sm" /> {r}-RANK GATES</h2>
          {PROGRAMS.filter((p) => p.rank === r).map((p) => {
            const access = gateAccess(p, player.rank)
            return (
              <button key={p.id} type="button" aria-label={`${p.name}: ${p.rank}-rank, ${p.weeks} weeks${access.open ? "" : " (sealed)"}`} onClick={() => nav(`/dungeons/${p.id}`)} className="text-left">
                <SystemWindow tag={p.red ? 'RED GATE' : p.color === 'purple' ? 'PURPLE GATE' : 'GATE'} variant={COLOR[p.color]} state={access.open ? 'default' : 'disabled'} animate={false}>
                  <div className="t-heading">{p.name}</div>
                  <div className="t-small text-dim">{p.weeks} week{p.weeks > 1 ? 's' : ''} · {p.daysPerWeek}×/week · {p.level} · {p.classes.join(', ')}</div>
                  {!access.open ? <div className="t-small mt-1 text-warning">{access.reason}</div> : null}
                </SystemWindow>
              </button>
            )
          })}
        </section>
      ))}
    </Screen>
  )
}

/** Gate detail: floors as weeks, Boss Raid, Red Gate entry warning. */
export function DungeonDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const program = programById.get(id!)
  const player = useLiveQuery(() => db.player.get('me'), [])
  const run = useLiveQuery(() => activeRun(), [])
  const lastSession = useLiveQuery(async () => (run ? (await db.workouts.filter((w) => w.dungeonId === run.id && !!w.endedAt).toArray()).map((w) => w.day).sort().pop() ?? null : null), [run])
  const [warn, setWarn] = useState(false)
  const [boss, setBoss] = useState(false)
  const [results, setResults] = useState<Record<string, number>>({})
  if (!program || !player) return null
  const mine = run?.programId === program.id ? run : null
  const access = gateAccess(program, player.rank)
  const enter = async () => { sfx.play('boss'); await enterGate(program.id); setWarn(false) }
  return (
    <Screen tag={program.red ? 'RED GATE' : 'GATE'} title={program.name} back="/dungeons">
      <SystemWindow tag={`${program.rank}-RANK`} variant={COLOR[program.color]}>
        <div className="flex items-start gap-3"><RankBadge rank={program.rank} /><p className="t-system flex-1">{program.description}</p></div>
        {mine ? (
          <>
            {unstable(lastSession ?? null, dayOf(), dayOf(mine.startedAt)) ? <p className="t-system mt-2 text-warning">[Warning: the Gate is unstable. Return within days or take a catch-up week.]</p> : null}
            {isBossFloor(mine, program)
              ? <Button variant="danger" className="mt-3 w-full" icon="crown" onClick={() => { sfx.play('boss'); setBoss(true) }}>Challenge the Boss</Button>
              : <Button className="mt-3 w-full" icon="play" onClick={async () => nav(`/workout/${await startFloor()}`)}>Enter floor {mine.floor}</Button>}
            {!program.red ? <Button variant="ghost" className="mt-2 w-full" onClick={() => void abandonGate()}>Leave the Gate</Button> : null}
          </>
        ) : run ? <p className="t-small mt-3 text-dim">[Another Gate is active. Clear or leave it first.]</p>
          : <Button className="mt-3 w-full" disabled={!access.open} onClick={() => (program.red ? setWarn(true) : void enter())}>{access.open ? 'Enter the Gate' : access.reason}</Button>}
      </SystemWindow>
      <SystemWindow tag="FLOORS" animate={false}>
        <ol className="flex flex-col gap-1">
          {Array.from({ length: program.weeks }, (_, i) => i + 1).map((f) => {
            const cleared = mine?.floorsCleared.includes(f)
            const current = mine?.floor === f
            return <li key={f} className={`flex min-h-10 items-center justify-between rounded-[var(--r-1)] px-2 ${current ? 'bg-[rgb(47_168_255/.12)]' : ''}`}><span>{f === program.weeks ? 'Boss Raid' : `Floor ${f}`}</span><span className={`t-label ${cleared ? 'text-success' : current ? 'text-glow' : 'text-dim'}`}>{cleared ? 'Cleared' : current ? 'Current' : ''}</span></li>
          })}
        </ol>
      </SystemWindow>
      <SystemWindow tag="BOSS TESTS" variant="reward" animate={false}>
        <ul className="flex flex-col gap-1">{program.boss.map((b) => <li key={b.label} className="t-small">{b.label}</li>)}</ul>
      </SystemWindow>
      <Sheet open={warn} onClose={() => setWarn(false)} title="[WARNING]">
        <p className="t-system mb-3 text-warning">[This is a Red Gate. Once you enter, it cannot be paused for 7 days. Only low readiness or an injury suspends a day. Do you accept?]</p>
        <div className="flex gap-2"><Button variant="danger" className="flex-1" onClick={() => void enter()}>Enter</Button><Button variant="ghost" onClick={() => setWarn(false)}>Retreat</Button></div>
      </Sheet>
      <Sheet open={boss} onClose={() => setBoss(false)} title="Boss Raid results">
        <div className="flex flex-col gap-3">
          {program.boss.map((b) => (
            <div key={b.label}>
              <div className="t-label text-dim">{b.label}</div>
              <NumberStepper label={b.label} value={results[b.label] ?? 0} step={b.kind === 'e1rm' ? 2.5 : 1} onChange={(v) => setResults({ ...results, [b.label]: v })} max={1000} unit={b.kind === 'e1rm' ? 'kg e1RM' : 'reps'} />
            </div>
          ))}
          <Button variant="gold" onClick={async () => { await submitBoss(results); setBoss(false) }}>Strike</Button>
        </div>
      </Sheet>
    </Screen>
  )
}

/** Demon Castle tower view: lifetime milestones, bosses at 1/25/50/75/100. */
export function Castle() {
  const score = useLiveQuery(async () => (await getSetting<number>('castleScore')) ?? 0, [], 0)
  const { floor, next } = castleFloor(score)
  const shown = Array.from({ length: 11 }, (_, i) => Math.min(CASTLE_FLOORS, Math.max(1, floor - 4) + i)).filter((v, i, a) => a.indexOf(v) === i).reverse()
  return (
    <Screen tag="DEMON CASTLE" title={`Floor ${floor} / ${CASTLE_FLOORS}`} back="/dungeons">
      <SystemWindow tag="ASCENT" variant="alert" animate={false}>
        <p className="t-system">[Score {Math.round(score)}: tonnes lifted + km covered + 5 per workout.]</p>
        {next ? <p className="t-small text-dim">Next floor at {next}.</p> : <p className="t-system text-gold">[The tower has been conquered.]</p>}
      </SystemWindow>
      <SystemWindow tag="TOWER" animate={false}>
        <ol className="flex flex-col gap-1" aria-label="Tower floors">
          {shown.map((f) => (
            <li key={f} className={`flex min-h-10 items-center justify-between rounded-[var(--r-1)] border px-3 ${f <= floor ? 'border-[rgb(255_59_92/.4)] text-text' : 'border-[color:var(--line)] text-dim'} ${f === floor ? 'shadow-[var(--glow-alert)]' : ''}`}>
              <span>Floor {f}{CASTLE_BOSSES[f] ? ` · ${CASTLE_BOSSES[f]}` : ''}</span>
              <span className="t-num text-[12px]">{f <= floor ? 'cleared' : floorThreshold(f)}</span>
            </li>
          ))}
        </ol>
      </SystemWindow>
      {floor === 0 ? <EmptyState message="[Train to climb. The Gatekeeper waits on the first floor.]" icon="crown" /> : null}
    </Screen>
  )
}
