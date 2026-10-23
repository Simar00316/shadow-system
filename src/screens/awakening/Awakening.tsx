import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, NumberStepper } from '@/ui/controls'
import { TypedText } from '@/ui/feedback'
import { Backdrop } from '@/ui/Backdrop'
import { BodyMap, MUSCLE_LABEL } from '@/ui/BodyMap'
import { Emblem } from '@/ui/Emblem'
import { RankBadge } from '@/ui/RankBadge'
import { Icon } from '@/ui/icons'
import { sfx } from '@/audio/sfx'
import { isIosSafari, isStandalone } from './Gate'
import { fromKg, toKg } from '@/engine/strength'
import { prescribe } from '@/engine/prescription'
import { BASE_CLASSES, EQUIPMENT, type BaseClass, type Equipment, type Experience, type Goal, type Muscle, type Sex } from '@/engine/types'
import type { DietType, Units } from '@/engine/model'
import { DEFAULT_NOTIFICATIONS, EQUIPMENT_PRESETS, revealPower, suggestedClass, type AwakeningAnswers, type EquipmentPreset } from '@/app/awakening-setup'

export const CUISINE_LABEL: Record<string, string> = {
  india: 'India', pakistan: 'Pakistan', usa: 'United States', uk: 'United Kingdom', mexico: 'Mexico', brazil: 'Brazil', spain: 'Spain', italy: 'Italy', france: 'France',
  greece: 'Greece / Mediterranean', lebanon: 'Lebanon / Middle East', china: 'China', japan: 'Japan', thailand: 'Thailand', korea: 'Korea', generic: 'Anywhere (simple staples)',
}
export const CLASS_INFO: Record<BaseClass, { title: string; focus: string }> = {
  fighter: { title: 'Fighter', focus: 'Strength. Heavy weights, few reps, long rest.' },
  tank: { title: 'Tank', focus: 'Hypertrophy. Build muscle with moderate weights and volume.' },
  assassin: { title: 'Assassin', focus: 'Endurance and conditioning. High reps, short rest, circuits.' },
  ranger: { title: 'Ranger', focus: 'Athletic hybrid. Power, calisthenics and cardio on rotating days.' },
  healer: { title: 'Healer', focus: 'Mobility, rehab and flexibility. Holds, tempo and control.' },
}
const GOALS: { id: Goal; label: string }[] = [
  { id: 'strength', label: 'Get stronger' }, { id: 'hypertrophy', label: 'Build muscle' }, { id: 'fat_loss', label: 'Lose fat' }, { id: 'recomp', label: 'Lose fat and build muscle' },
  { id: 'endurance', label: 'Endurance and conditioning' }, { id: 'mobility', label: 'Mobility and recovery' },
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']


function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => { sfx.play('tap'); onChange(o.id) }} className={`press flex min-h-[52px] items-center justify-between gap-3 rounded-[var(--r-ctl)] border px-4 text-left ${value === o.id ? 'border-[color:var(--edge-hi)] bg-[rgb(47_168_255/.14)] text-text shadow-[var(--rim-top),0_0_18px_-6px_rgb(47_168_255/.6)]' : 'border-[color:var(--edge)] bg-[color:var(--surface-flat)] text-dim'}`}>
          <span className="t-row">{o.label}</span>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${value === o.id ? 'border-glow bg-glow text-ink' : 'border-[color:var(--edge-hi)]'}`}>{value === o.id ? <Icon name="check" size={12} /> : null}</span>
        </button>
      ))}
    </div>
  )
}

function Step({ index, total, title, children, onNext, onBack, nextLabel = 'Next', nextDisabled }: { index: number; total: number; title: string; children: ReactNode; onNext: () => void; onBack?: () => void; nextLabel?: string; nextDisabled?: boolean }) {
  return (
    <SystemWindow tag={`QUESTION ${index}/${total}`} title={title} key={title} hero>
      <div className="-mt-1 mb-4 flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < index ? 'bg-glow shadow-[0_0_6px_var(--glow)]' : 'bg-[rgb(47_168_255/.15)]'}`} />)}
      </div>
      <div className="flex flex-col gap-4">
        {children}
        <div className="flex gap-2 pt-2">
          {onBack ? <Button variant="ghost" onClick={onBack} icon="back">Back</Button> : null}
          <Button className="flex-1" onClick={() => { sfx.play('window-open'); onNext() }} disabled={nextDisabled}>{nextLabel}</Button>
        </div>
      </div>
    </SystemWindow>
  )
}

/** 60 s countdown for the squat test; plays the rest-end sound at zero. */
function Countdown({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (left == null) return
    if (left <= 0) { sfx.play('rest-end'); onDone(); return }
    if (left === 10) sfx.play('rest-warn')
    const id = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])
  return left == null ? (
    <Button variant="secondary" icon="timer" onClick={() => setLeft(seconds)}>Start {seconds} s timer</Button>
  ) : (
    <div className="t-num-xl text-center text-glow" role="timer" aria-label={`${left} seconds left`}>{left > 0 ? left : 'TIME'}</div>
  )
}

function Stopwatch({ onStop }: { onStop: (sec: number) => void }) {
  const [start, setStart] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  if (start == null) return <Button variant="secondary" icon="play" onClick={() => { const t = Date.now(); setStart(t); setNow(t); timer.current = setInterval(() => setNow(Date.now()), 200) }}>Start plank</Button>
  const sec = Math.floor((now - start) / 1000)
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="t-num-xl text-glow" role="timer">{sec}s</div>
      <Button variant="danger" icon="pause" onClick={() => { if (timer.current) clearInterval(timer.current); onStop(sec); setStart(null) }}>Stop</Button>
    </div>
  )
}

type Phase = 'install' | 'intro' | 'declined' | 'form' | 'test' | 'class' | 'reveal' | 'saving'

/** The onboarding flow. Usually entered from AwakeningGate (./Gate) at the `form` step. */
export function Awakening({ start }: { start?: Phase } = {}) {
  const nav = useNavigate()
  const lb = typeof navigator !== 'undefined' && /^en-US/.test(navigator.language)
  const [phase, setPhase] = useState<Phase>(start ?? (isIosSafari() && !isStandalone() ? 'install' : 'intro'))
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [birthYear, setBirthYear] = useState(new Date().getFullYear() - 28)
  const [units, setUnits] = useState<Units>({ lift: lb ? 'lb' : 'kg', body: lb ? 'lb' : 'kg', distance: lb ? 'mi' : 'km', height: lb ? 'in' : 'cm' })
  const [heightCm, setHeightCm] = useState(175)
  const [weightKg, setWeightKg] = useState(75)
  const [goal, setGoal] = useState<Goal>('hypertrophy')
  const [experience, setExperience] = useState<Experience>('beginner')
  const [preset, setPreset] = useState<EquipmentPreset | 'custom'>('gym')
  const [custom, setCustom] = useState<Equipment[]>(['bodyweight', 'dumbbell'])
  const [injured, setInjured] = useState<Muscle[]>([])
  const [injuryNote, setInjuryNote] = useState('')
  const [days, setDays] = useState<number[]>([1, 3, 5])
  const [minutes, setMinutes] = useState(60)
  const [diet, setDiet] = useState<DietType>('nonveg')
  const [cuisine, setCuisine] = useState('india')
  const [budget, setBudget] = useState(false)
  const [notif, setNotif] = useState(DEFAULT_NOTIFICATIONS)
  const [test, setTest] = useState({ pushups: 0, squats60s: 0, plankSec: 0, e1rm: {} as Record<string, number> })
  const [squatDone, setSquatDone] = useState(false)
  const [cls, setCls] = useState<BaseClass>('tank')

  const equipment = preset === 'custom' ? custom : EQUIPMENT_PRESETS[preset].equipment
  const total = 13
  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => Math.max(0, s - 1))
  const answers = (): AwakeningAnswers => ({
    name, sex, birthYear, heightCm, weightKg, units, goal, experience, equipment, equipmentName: preset === 'custom' ? 'Custom' : EQUIPMENT_PRESETS[preset].name,
    injuries: injured.length ? [{ muscles: injured, note: injuryNote }] : [], trainingDays: days, sessionMinutes: minutes, dietType: diet, cuisine, budget, notifications: notif,
    test: { pushups: test.pushups, squats60s: test.squats60s, plankSec: test.plankSec, e1rm: experience === 'beginner' ? undefined : test.e1rm, at: 0 }, baseClass: cls,
  })

  const bodyUnit = units.body
  const steps: ReactNode[] = [
    <Step key="name" index={1} total={total} title="What shall the System call you?" onNext={next} nextDisabled={!name.trim()}>
      <input autoFocus aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-4 text-text" placeholder="Player" />
    </Step>,
    <Step key="sex" index={2} total={total} title="Body type for the anatomical model" onNext={next} onBack={back}>
      <Choice label="Sex" value={sex} onChange={(v) => { setSex(v); setHeightCm(v === 'female' ? 163 : 175); setWeightKg(v === 'female' ? 62 : 75) }} options={[{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }]} />
    </Step>,
    <Step key="age" index={3} total={total} title="Year of birth" onNext={next} onBack={back}>
      <NumberStepper label="Birth year" value={birthYear} onChange={setBirthYear} min={1930} max={new Date().getFullYear() - 13} />
      <p className="t-small text-dim">Age adjusts recovery and safe training targets.</p>
    </Step>,
    <Step key="units" index={4} total={total} title="Units" onNext={next} onBack={back}>
      {(['lift', 'body'] as const).map((k) => (
        <div key={k}>
          <div className="t-label mb-1 text-dim">{k === 'lift' ? 'Lifting weights' : 'Body weight'}</div>
          <Choice label={k} value={units[k]} onChange={(v) => setUnits({ ...units, [k]: v })} options={[{ id: 'kg', label: 'Kilograms' }, { id: 'lb', label: 'Pounds' }]} />
        </div>
      ))}
      <div className="t-label text-dim">Distance and height</div>
      <Choice label="Distance" value={units.distance} onChange={(v) => setUnits({ ...units, distance: v, height: v === 'km' ? 'cm' : 'in' })} options={[{ id: 'km', label: 'Kilometres / centimetres' }, { id: 'mi', label: 'Miles / inches' }]} />
    </Step>,
    <Step key="height" index={5} total={total} title="Height and weight" onNext={next} onBack={back}>
      {units.height === 'cm'
        ? <NumberStepper label="Height" value={heightCm} onChange={setHeightCm} min={120} max={230} unit="cm" />
        : <NumberStepper label="Height" value={Math.round(heightCm / 2.54)} onChange={(v) => setHeightCm(Math.round(v * 2.54))} min={48} max={90} unit="in" />}
      <NumberStepper label="Weight" value={Math.round(fromKg(weightKg, bodyUnit) * 10) / 10} step={bodyUnit === 'kg' ? 0.5 : 1} onChange={(v) => setWeightKg(toKg(v, bodyUnit))} min={30} max={bodyUnit === 'kg' ? 250 : 550} unit={bodyUnit} />
    </Step>,
    <Step key="goal" index={6} total={total} title="Your goal" onNext={() => { setCls(suggestedClass(goal)); next() }} onBack={back}>
      <Choice label="Goal" value={goal} onChange={setGoal} options={GOALS} />
    </Step>,
    <Step key="exp" index={7} total={total} title="Training experience" onNext={next} onBack={back}>
      <Choice label="Experience" value={experience} onChange={setExperience} options={[{ id: 'beginner', label: 'Beginner: under 6 months, or returning after a year off' }, { id: 'intermediate', label: 'Intermediate: 6 months to 2 years' }, { id: 'advanced', label: 'Advanced: over 2 years of consistent training' }]} />
    </Step>,
    <Step key="eq" index={8} total={total} title="Equipment available" onNext={next} onBack={back} nextDisabled={!equipment.length}>
      <Choice label="Equipment" value={preset} onChange={setPreset} options={[...(Object.keys(EQUIPMENT_PRESETS) as EquipmentPreset[]).map((k) => ({ id: k, label: EQUIPMENT_PRESETS[k].name })), { id: 'custom' as const, label: 'Custom' }]} />
      {preset === 'custom' ? (
        <div className="grid grid-cols-2 gap-2">
          {EQUIPMENT.filter((e) => e !== 'other').map((e) => (
            <label key={e} className="flex min-h-12 items-center gap-2 rounded-[var(--r-1)] border border-[color:var(--line)] px-3">
              <input type="checkbox" checked={custom.includes(e)} onChange={(ev) => setCustom(ev.target.checked ? [...custom, e] : custom.filter((x) => x !== e))} />
              <span className="t-small">{e.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      ) : null}
    </Step>,
    <Step key="inj" index={9} total={total} title="Any injuries? Tap affected muscles" onNext={next} onBack={back} nextLabel={injured.length ? 'Next' : 'No injuries'}>
      <BodyMap sex={sex} selected={injured} onSelect={(m) => setInjured((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]))} height={300} />
      {injured.length ? <p className="t-small text-warning">[{injured.map((m) => MUSCLE_LABEL[m]).join(', ')} will be protected.]</p> : null}
      {injured.length ? <input aria-label="Injury note" value={injuryNote} onChange={(e) => setInjuryNote(e.target.value)} placeholder="Note (optional)" className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-4" /> : null}
    </Step>,
    <Step key="days" index={10} total={total} title="Training schedule" onNext={next} onBack={back} nextDisabled={!days.length}>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Training days">
        {DAYS.map((d, i) => (
          <button key={d} type="button" aria-pressed={days.includes(i)} onClick={() => setDays((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i].sort()))} className={`t-label h-12 rounded-[var(--r-1)] border ${days.includes(i) ? 'border-glow bg-[rgb(47_168_255/.18)] text-glow' : 'border-[color:var(--line)] text-dim'}`}>{d}</button>
        ))}
      </div>
      <NumberStepper label="Session length" value={minutes} onChange={setMinutes} step={5} min={20} max={150} unit="min" />
    </Step>,
    <Step key="diet" index={11} total={total} title="Diet" onNext={next} onBack={back}>
      <Choice label="Diet type" value={diet} onChange={setDiet} options={[{ id: 'nonveg', label: 'Non-vegetarian' }, { id: 'eggetarian', label: 'Eggetarian' }, { id: 'vegetarian', label: 'Vegetarian' }, { id: 'vegan', label: 'Vegan' }]} />
      <label className="flex flex-col gap-1">
        <span className="t-label text-dim">Cuisine</span>
        <select aria-label="Cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3">
          {Object.entries(CUISINE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={budget} onChange={(e) => setBudget(e.target.checked)} /> Budget mode (cheaper ingredients)</label>
    </Step>,
    <Step key="notif" index={12} total={total} title="Reminder times" onNext={next} onBack={back}>
      {([['workout', 'Workout'], ['readiness', 'Readiness check-in'], ['calorieCheck', 'Evening calorie check']] as const).map(([k, l]) => (
        <label key={k} className="flex min-h-12 items-center justify-between gap-3"><span>{l}</span><input type="time" aria-label={l} value={notif[k]} onChange={(e) => setNotif({ ...notif, [k]: e.target.value })} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" /></label>
      ))}
      <p className="t-small text-dim">Push notifications need the app installed to your home screen. You can enable them later in Settings.</p>
    </Step>,
    <Step key="ready" index={13} total={total} title="The Awakening Test" onNext={() => setPhase('test')} onBack={back} nextLabel="Begin the test">
      <TypedText text="[The System will now measure your current power. Give an honest effort. Stop if anything hurts.]" />
    </Step>,
  ]

  if (phase === 'install') {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col justify-center gap-4 px-4">
        <Backdrop variant="portal" />
        <SystemWindow tag="SYSTEM" title="Install the System" hero>
          <ol className="flex flex-col">
            {[<>Tap <Icon name="share" size={18} className="inline align-text-bottom text-glow" /> Share in Safari.</>, <>Choose <b className="text-text">Add to Home Screen</b>.</>, <>Open Shadow System from your Home Screen.</>].map((step, i) => (
              <li key={i} className="flex items-center gap-3 border-t border-[color:var(--hairline)] py-3 first:border-t-0">
                <span className="well t-num h-8 w-8 text-[14px]">{i + 1}</span>
                <span className="t-row text-dim">{step}</span>
              </li>
            ))}
          </ol>
          <p className="t-small mt-2 text-faint">[Notifications, full offline play and storage protection require the installed app.]</p>
          <Button className="mt-4 w-full" variant="ghost" onClick={() => setPhase('intro')}>Continue in the browser</Button>
        </SystemWindow>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col justify-center gap-4 px-4 py-8">
      <Backdrop variant={phase === 'reveal' ? 'shadow' : 'portal'} />
      {phase === 'intro' || phase === 'declined' ? (
        <SystemWindow tag="NOTIFICATION" hero>
          <TypedText key={phase} text={phase === 'intro' ? '[You have acquired the qualifications to be a Player. Will you accept?]' : '[Refusal noted. The offer remains open.]'} className="block text-[19px] leading-[28px] text-text glow-text" />
          <Button className="mt-8 min-h-14 w-full" onClick={() => { sfx.play('quest-accept'); setPhase('form') }}>Accept</Button>
          <Button variant="ghost" className="mt-1 w-full" onClick={() => { sfx.play('error'); setPhase('declined') }}>Decline</Button>
        </SystemWindow>
      ) : null}

      {phase === 'form' ? steps[step] : null}

      {phase === 'test' ? (
        <SystemWindow tag="AWAKENING TEST" title="Measure your power">
          <div className="flex flex-col gap-5">
            <div>
              <div className="t-heading mb-2">1. Max push-ups</div>
              <p className="t-small mb-2 text-dim">Knees allowed if you cannot do one full push-up; enter what you did.</p>
              <NumberStepper label="Push-ups" value={test.pushups} onChange={(v) => setTest({ ...test, pushups: v })} max={200} unit="reps" />
            </div>
            <div>
              <div className="t-heading mb-2">2. Bodyweight squats in 60 s</div>
              {!squatDone ? <Countdown seconds={60} onDone={() => setSquatDone(true)} /> : null}
              <NumberStepper label="Squats" value={test.squats60s} onChange={(v) => setTest({ ...test, squats60s: v })} max={150} unit="reps" />
            </div>
            <div>
              <div className="t-heading mb-2">3. Plank hold</div>
              <Stopwatch onStop={(sec) => setTest((t) => ({ ...t, plankSec: sec }))} />
              <NumberStepper label="Plank" value={test.plankSec} onChange={(v) => setTest({ ...test, plankSec: v })} step={5} max={900} unit="s" />
            </div>
            {experience !== 'beginner' ? (
              <div>
                <div className="t-heading mb-1">4. Estimated 1RM (optional)</div>
                <p className="t-small mb-2 text-dim">From a recent heavy set. Leave 0 if unknown. Beginners skip loaded tests.</p>
                {(['squat', 'bench', 'deadlift', 'ohp'] as const).map((l) => (
                  <div key={l} className="mb-2">
                    <div className="t-label text-dim">{l === 'ohp' ? 'Overhead press' : l[0].toUpperCase() + l.slice(1)}</div>
                    <NumberStepper label={`${l} 1RM`} value={Math.round(fromKg(test.e1rm[l] ?? 0, units.lift))} step={units.lift === 'kg' ? 2.5 : 5} max={500} onChange={(v) => setTest({ ...test, e1rm: { ...test.e1rm, [l]: toKg(v, units.lift) } })} unit={units.lift} />
                  </div>
                ))}
              </div>
            ) : null}
            <Button onClick={() => { sfx.play('window-open'); setPhase('class') }}>Record results</Button>
          </div>
        </SystemWindow>
      ) : null}

      {phase === 'class' ? (
        <SystemWindow tag="CLASS SELECTION" title="Choose your class">
          <div className="flex flex-col gap-2">
            {BASE_CLASSES.map((c) => {
              const rx = prescribe({ mechanics: 'compound', pattern: 'squat', classTags: [c] }, { cls: c, experience })
              return (
                <button key={c} type="button" aria-label={`${CLASS_INFO[c].title}: ${CLASS_INFO[c].focus}`} aria-pressed={cls === c} onClick={() => { sfx.play('tap'); setCls(c) }} className={`flex items-center gap-3 rounded-[var(--r-1)] border p-3 text-left ${cls === c ? 'border-glow bg-[rgb(47_168_255/.12)] shadow-[var(--glow-1)]' : 'border-[color:var(--line)]'}`}>
                  <Emblem cls={c} size={56} active={cls === c} />
                  <div className="min-w-0 flex-1">
                    <div className="t-heading text-text">{CLASS_INFO[c].title}{c === suggestedClass(goal) ? <span className="t-tag ml-2 text-gold">Suggested</span> : null}</div>
                    <div className="t-small text-dim">{CLASS_INFO[c].focus}</div>
                    <div className="t-num mt-1 text-[13px] text-glow">{rx.holdSec ? `Holds ${rx.holdSec}s` : `${rx.repMin}–${rx.repMax} reps`} · RIR {rx.rir} · rest {Math.round(rx.restSec / 15) * 15}s</div>
                  </div>
                </button>
              )
            })}
            <Button className="mt-2" onClick={() => { sfx.play('rank-up'); setPhase('reveal') }}>Confirm class</Button>
          </div>
        </SystemWindow>
      ) : null}

      {phase === 'reveal' || phase === 'saving' ? <Reveal answers={answers()} saving={phase === 'saving'} onEnter={async () => { setPhase('saving'); await (await import('@/app/awakening')).awaken(answers()); nav('/', { replace: true }) }} /> : null}
    </main>
  )
}

function Reveal({ answers, onEnter, saving }: { answers: AwakeningAnswers; onEnter: () => void; saving: boolean }) {
  const { power, rank } = revealPower(answers)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= power) return
    const id = setTimeout(() => setShown((s) => Math.min(power, s + Math.max(1, Math.ceil(power / 30)))), 30)
    return () => clearTimeout(id)
  }, [shown, power])
  return (
    <SystemWindow tag="AWAKENING COMPLETE" variant="reward">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="glitch">
          <RankBadge rank={rank} size="lg" />
        </motion.div>
        <div className="t-label text-dim">Hunter Power Level</div>
        <div className="t-num-xl text-gold" aria-label={`Power Level ${power}`}>{shown}</div>
        <TypedText text={`[Congratulations on becoming a Player. Starting rank: ${rank}. Class: ${CLASS_INFO[answers.baseClass].title}.]`} />
        <Button variant="gold" className="w-full" loading={saving} onClick={onEnter}>Enter the System</Button>
      </div>
    </SystemWindow>
  )
}
