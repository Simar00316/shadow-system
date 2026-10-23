import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { QuestCard } from '@/ui/game'
import { Button, NumberStepper } from '@/ui/controls'
import { Sheet } from '@/ui/layout'
import { RankBadge } from '@/ui/RankBadge'
import { EmptyState } from '@/ui/feedback'
import { Emblem } from '@/ui/Emblem'
import { Icon } from '@/ui/icons'
import { Tour, type TourStep } from '@/ui/Tour'
import { useToday } from '@/app/hooks'
import { awardMany } from '@/app/game'
import { say } from '@/app/notify'
import { completeJobChange, jobChangeState, startJobChange, startTrial, submitTrial, trialState, changeClass } from '@/app/progression'
import { HIDDEN, progress } from '@/engine/quests'
import { RANK_GATES } from '@/engine/ranks'
import { ADVANCED_OPTIONS } from '@/engine/ranks'
import { endOf } from '@/engine/dates'
import type { Quest } from '@/engine/model'
import type { AdvancedClass } from '@/engine/types'

const QUEST_TOUR: TourStep[] = [
  { target: 'daily', title: 'The Daily Quest', body: 'A new one arrives every day: train (or do recovery on rest days), drink water, eat protein and check in. Goals tick off automatically as you log. The timer shows how long until midnight.' },
  { target: 'daily', title: 'Rewards and the Penalty Zone', body: 'Gold chips are the reward. If the core goal is missed, the next day starts with a short Penalty Quest; clear it to keep your streak. A low-readiness day or an injury cancels the penalty.' },
  { target: 'trial', title: 'Rank-up Trial', body: 'When your level and Power are high enough, the System opens a trial: a set of fitness tests. Pass it to rise from E to D rank and beyond; higher ranks unlock harder Gates.' },
  { target: 'job', title: 'Job Change', body: 'At level 30 you can take the Job Change quest and choose an advanced class with its own training style.' },
  { target: 'hidden', title: 'Hidden Quests', body: 'Secret achievements. The hints tell you what the System is watching for. Clear them for big XP and titles.' },
]

/** Quests (PRD F3.3): Daily Quest, Penalty Zone, Emergency, Hidden, Job Change and Rank-Up Trial, quest log. */
export function Quests() {
  const nav = useNavigate()
  const today = useToday()
  const quests = useLiveQuery(() => db.quests.orderBy('day').reverse().toArray(), [], [] as Quest[])
  const trial = useLiveQuery(() => trialState(), [quests])
  const job = useLiveQuery(() => jobChangeState(), [quests])
  const player = useLiveQuery(() => db.player.get('me'), [])
  const [results, setResults] = useState<Quest | null>(null)
  const [values, setValues] = useState<Record<string, number>>({})
  const [jobChoice, setJobChoice] = useState<AdvancedClass | null>(null)
  const [emergencyValue, setEmergencyValue] = useState(0)
  const daily = quests.find((q) => q.id === `daily-${today}`)
  const penalty = quests.find((q) => q.id === `penalty-${today}`)
  const emergency = quests.find((q) => q.id === `emergency-${today}`)
  const hiddenDone = new Set(quests.filter((q) => q.type === 'hidden').map((q) => q.id.replace('hidden-', '')))
  const log = quests.filter((q) => q.day < today && (q.type === 'daily' || q.type === 'penalty' || q.type === 'emergency')).slice(0, 30)
  const statusOf = (q: Quest) => (q.status === 'cleared' ? 'cleared' : q.status === 'failed' ? 'failed' : q.meta?.waived ? 'waived' : 'active') as 'cleared' | 'failed' | 'waived' | 'active'

  const doEmergency = async () => {
    if (!emergency) return
    const next = progress(emergency, 'main', emergencyValue, 'add')
    await db.quests.put(next)
    if (next.status === 'cleared') { await awardMany([{ type: 'emergency', refId: emergency.id, base: emergency.reward.xp, gold: emergency.reward.gold }]); await say('emergency_cleared') }
    setEmergencyValue(0)
  }

  return (
    <Screen tag="QUESTS" title="Quest log">
      {penalty ? <QuestCard tag="PENALTY QUEST" variant="alert" title={penalty.title} until={penalty.expiresAt} goals={penalty.goals} reward={['Streak restored']} penalty={penalty.penalty} status={statusOf(penalty)} onOpen={() => nav('/cardio')} /> : null}
      {daily ? <QuestCard tour="daily" tag="DAILY QUEST" hero title={daily.title} until={endOf(today)} goals={daily.goals} reward={[`${daily.reward.xp} XP`, `${daily.reward.gold} Gold`]} penalty={daily.penalty} status={statusOf(daily)} onOpen={() => nav('/train')} /> : <SystemWindow tag="DAILY QUEST"><EmptyState message="[The Daily Quest has not been issued.]" /></SystemWindow>}
      {emergency ? (
        <>
          <QuestCard tag="EMERGENCY QUEST" variant="alert" title={emergency.title} until={emergency.expiresAt} goals={emergency.goals} reward={[`${emergency.reward.xp} XP`, `${emergency.reward.gold} Gold`, 'Optional']} status={statusOf(emergency)} />
          {emergency.status === 'issued' ? (
            <SystemWindow tag="REPORT PROGRESS" animate={false}>
              <NumberStepper label="Amount done" value={emergencyValue} onChange={setEmergencyValue} max={1000} unit={emergency.goals[0].unit} />
              <Button className="mt-2 w-full" onClick={doEmergency}>Report</Button>
            </SystemWindow>
          ) : null}
        </>
      ) : null}

      <SystemWindow tag="RANK-UP TRIAL" animate={false} tour="trial">
        {trial ? (
          <div className="flex items-center gap-4">
            <RankBadge rank={trial.rank} />
            <div className="min-w-0 flex-1">
              {trial.next ? <p className="t-small text-dim">Next: {trial.next} rank · needs level {RANK_GATES[trial.next].level} and Power Level {RANK_GATES[trial.next].power}</p> : <p className="t-system">[The highest rank has been reached.]</p>}
              {trial.quest ? <Button className="mt-2" variant="gold" onClick={() => { setResults(trial.quest!); setValues({}) }}>Record trial results</Button>
                : trial.target ? <Button className="mt-2" variant="gold" disabled={trial.blocked} onClick={() => void startTrial()}>{trial.blocked ? `Retry on ${trial.retryOn}` : `Begin the ${trial.target}-rank Trial`}</Button>
                : <p className="t-small mt-1 text-dim">[Your level: {player?.level} · Power Level: {player?.powerLevel}]</p>}
            </div>
          </div>
        ) : null}
      </SystemWindow>

      <SystemWindow tag="JOB CHANGE" animate={false} tour="job">
        {job?.quest && job.quest.status === 'issued' ? (
          <>
            <p className="t-system mb-2">[{job.quest.goals[0].label}]</p>
            <Button variant="gold" onClick={() => { setResults(job.quest!); setValues({}) }}>Record and choose your path</Button>
          </>
        ) : job?.available ? <Button variant="gold" onClick={() => void startJobChange()}>Accept the Job Change Quest</Button>
          : job?.monarch ? <Button variant="shadow" onClick={() => void changeClass('shadow_monarch')}>Become the Shadow Monarch</Button>
          : <p className="t-small text-dim">[Unlocks at level 30. Current class: {job?.cls.replace('_', ' ')}.]</p>}
      </SystemWindow>

      <section aria-label="HIDDEN QUESTS" data-tour="hidden">
        <div className="section-head"><span className="t-label text-purple-text">Hidden quests</span><span className="t-micro text-faint">{hiddenDone.size}/{HIDDEN.length} found</span></div>
        <ul className="group">
          {HIDDEN.map((h) => (
            <li key={h.id} className="flex items-center gap-3 px-3.5 py-3">
              <span className={`well ${hiddenDone.has(h.id) ? 'text-gold' : 'text-purple-text'}`}><Icon name={hiddenDone.has(h.id) ? 'check' : 'hidden'} size={18} /></span>
              <div className="min-w-0 flex-1"><div className={`t-row ${hiddenDone.has(h.id) ? 'text-gold' : 'text-dim'}`}>{hiddenDone.has(h.id) ? h.title : '???'}</div><div className="t-small text-dim">{h.hint}</div></div>
              <span className="chip shrink-0" data-tone={hiddenDone.has(h.id) ? 'gold' : 'purple'}>{hiddenDone.has(h.id) ? 'Cleared' : `${h.xp} XP`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="HISTORY">
        <div className="section-head"><span className="t-label text-dim">History</span></div>
        {log.length ? <ul className="group">{log.map((q) => <li key={q.id} className="flex items-center justify-between gap-3 px-3.5 py-3"><span className="min-w-0 truncate"><span className="t-num text-[12px] text-dim">{q.day}</span> <span className="t-row">{q.title}</span></span><span className="chip shrink-0" data-tone={q.status === 'cleared' ? 'green' : q.status === 'failed' ? 'red' : 'dim'}>{q.status}</span></li>)}</ul> : <SystemWindow><EmptyState message="[No completed quests yet.]" icon="quests" /></SystemWindow>}
      </section>

      <Sheet open={!!results} onClose={() => setResults(null)} title={results?.title ?? ''}>
        {results ? (
          <div className="flex flex-col gap-3">
            {results.goals.map((g) => (
              <div key={g.key}>
                <div className="t-label text-dim">{g.label} (target {g.target}{g.unit ? ` ${g.unit}` : ''})</div>
                {g.key === 'power_strength' || g.key === 'top_set' || g.key === 'adherence' ? <p className="t-small text-glow">[Measured by the System from your logged lifts.]</p>
                  : <NumberStepper label={g.label} value={values[g.key] ?? 0} onChange={(v) => setValues({ ...values, [g.key]: v })} max={1000} unit={g.unit} />}
              </div>
            ))}
            {results.type === 'job_change' && job ? (
              <div className="grid grid-cols-2 gap-2">
                {ADVANCED_OPTIONS[job.base].map((c) => <button key={c} type="button" aria-pressed={jobChoice === c} onClick={() => setJobChoice(c)} className={`flex flex-col items-center rounded-[var(--r-1)] border p-2 ${jobChoice === c ? 'border-glow' : 'border-[color:var(--line)]'}`}><Emblem cls={c} size={48} /><span className="t-label capitalize">{c.replace('_', ' ')}</span></button>)}
              </div>
            ) : null}
            <Button variant="gold" disabled={results.type === 'job_change' && !jobChoice} onClick={async () => {
              if (results.type === 'rank_trial') await submitTrial(results, values)
              else if (jobChoice) await completeJobChange(values, jobChoice)
              setResults(null)
            }}>Submit to the System</Button>
          </div>
        ) : null}
      </Sheet>
      <Tour id="quests" steps={QUEST_TOUR} />
    </Screen>
  )
}
