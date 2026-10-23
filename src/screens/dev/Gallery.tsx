import { useState, type ReactNode } from 'react'
import { SystemWindow, type UiState, type WindowVariant } from '@/ui/SystemWindow'
import { Button, IconButton, NumberStepper, RirPicker, Tabs } from '@/ui/controls'
import { EmptyState, ToastView, TypedText } from '@/ui/feedback'
import { QuestCard, Ring, StatBar, XPBar } from '@/ui/game'
import { ExerciseCard, RestTimer, SetRow, type SetRowData } from '@/ui/training'
import { BodyMap } from '@/ui/BodyMap'
import { BarChart, Heatmap, LineChart } from '@/ui/charts'
import { BottomNav, NAV, Sheet } from '@/ui/layout'
import { RankBadge } from '@/ui/RankBadge'
import { Emblem } from '@/ui/Emblem'
import { ARCHETYPES, ShadowArt } from '@/ui/ShadowArt'
import { Icon, iconNames } from '@/ui/icons'
import { Backdrop } from '@/ui/Backdrop'
import { sfx, SOUNDS } from '@/audio/sfx'
import { ADVANCED_CLASSES, BASE_CLASSES, RANKS, type Muscle } from '@/engine/types'

const STATES: UiState[] = ['default', 'active', 'disabled', 'loading', 'error', 'success']
const VARIANTS: WindowVariant[] = ['system', 'alert', 'shadow', 'reward']

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} data-gallery={id} className="mb-10">
      <h2 className="t-tag mb-4 text-glow">[ {title} ]</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

const Label = ({ children }: { children: ReactNode }) => <div className="t-small mb-1 text-dim">{children}</div>

const COLORS = ['bg', 'panel-solid', 'panel-raised', 'system-blue', 'glow', 'shadow-purple', 'shadow-purple-text', 'warning', 'gold', 'success', 'amber', 'text', 'text-dim', 'rank-e', 'rank-d', 'rank-c', 'rank-b', 'rank-a', 'rank-s', 'rank-national', 'rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary']
const TYPE = ['t-hero', 't-title', 't-tag', 't-heading', 't-label', 't-button', 't-system', 't-small', 't-num-xl', 't-num-lg', 't-num']

const baseSet: SetRowData = { index: 1, type: 'working', weight: 80, reps: 8, rir: 2, done: false, target: { weight: 80, reps: 8 } }
const series = [{ w: 'W1', e1rm: 92 }, { w: 'W2', e1rm: 95 }, { w: 'W3', e1rm: 94 }, { w: 'W4', e1rm: 99 }, { w: 'W5', e1rm: 102 }]

export function Gallery() {
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a')
  const [sheet, setSheet] = useState(false)
  const [weight, setWeight] = useState(80)
  const [rir, setRir] = useState<number | null>(2)
  const [targets, setTargets] = useState<Muscle[]>(['chest', 'triceps'])
  const [sets, setSets] = useState<SetRowData[]>([baseSet, { ...baseSet, index: 2, done: true }])
  const [restEnd, setRestEnd] = useState<number | null>(() => Date.now() + 90_000)
  const [full, setFull] = useState(false)
  const [nav, setNav] = useState('status')
  const [now] = useState(() => Date.now())
  const [midnight] = useState(() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d })

  return (
    <main className="mx-auto max-w-[480px] px-4 pb-40 pt-6">
      <Backdrop variant="portal" />
      <h1 className="t-title mb-2 text-text">Component gallery</h1>
      <p className="t-small mb-8 text-dim">Every component in every state. Source of truth: design/DESIGN.md.</p>

      <Section id="colours" title="Colour tokens">
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map((c) => (
            <div key={c} className="rounded-[var(--r-1)] border border-[color:var(--line)] p-2">
              <div className="mb-1 h-8 rounded-[var(--r-1)]" style={{ background: `var(--${c})` }} />
              <div className="t-small text-dim">--{c}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Typography">
        {TYPE.map((t) => <div key={t} className={`${t} text-text`}>{t.startsWith('t-num') ? '142.5' : t === 't-system' ? '[A new Daily Quest has arrived.]' : 'Arise'} <span className="t-small text-dim">.{t}</span></div>)}
      </Section>

      <Section id="system-window" title="SystemWindow">
        {VARIANTS.map((v) => (
          <SystemWindow key={v} tag={v === 'alert' ? 'WARNING' : v.toUpperCase()} title={`${v} variant`} variant={v} grid={v === 'system'}>
            <p className="t-system">[You have been chosen as a Player.]</p>
          </SystemWindow>
        ))}
        {STATES.map((s) => (
          <SystemWindow key={s} tag="STATE" title={s} state={s} error="The System could not load this data." animate={false}>
            <p className="t-system">[Status: {s}.]</p>
          </SystemWindow>
        ))}
      </Section>

      <Section id="button" title="Button">
        <div className="flex flex-wrap gap-2">
          {(['primary', 'secondary', 'ghost', 'danger', 'gold', 'shadow'] as const).map((v) => <Button key={v} variant={v}>{v}</Button>)}
          <Button disabled>disabled</Button>
          <Button loading>loading</Button>
          <Button icon="check" variant="secondary">with icon</Button>
          <IconButton icon="settings" label="Settings" />
          <IconButton icon="settings" label="Settings disabled" disabled />
        </div>
      </Section>

      <Section id="quest-card" title="QuestCard">
        <QuestCard tag="DAILY QUEST" title="Preparation to Become Strong" until={midnight.getTime()} goals={[{ label: 'Push day session', current: 3, target: 5, unit: 'ex' }, { label: 'Water', current: 2.0, target: 3.2, unit: 'L' }, { label: 'Protein', current: 140, target: 140, unit: 'g' }, { label: 'Readiness check-in', current: 1, target: 1 }]} reward={['450 XP', '40 Gold', '+3 points']} penalty="Penalty Zone" />
        <QuestCard tag="DAILY QUEST" title="Preparation to Become Strong" status="cleared" goals={[{ label: 'Rest-day mobility', current: 1, target: 1 }]} reward={['60 XP']} />
        <QuestCard tag="PENALTY QUEST" variant="alert" title="Survive" until={midnight.getTime()} goals={[{ label: 'Conditioning', current: 4, target: 10, unit: 'min' }]} reward={['Streak restored']} penalty="Streak halves" />
        <QuestCard tag="PENALTY QUEST" variant="alert" title="Survive" status="failed" goals={[{ label: 'Conditioning', current: 0, target: 10, unit: 'min' }]} />
        <QuestCard tag="DAILY QUEST" title="Recovery Phase" status="waived" goals={[{ label: 'Mobility block', current: 0, target: 1 }]} />
        <QuestCard tag="HIDDEN QUEST" variant="shadow" title="Dawn Hunter" status="locked" goals={[{ label: '???', current: 0, target: 1 }]} />
        <QuestCard tag="EMERGENCY QUEST" variant="alert" title="Complete 50 push-ups" until={now + 3 * 3600_000} goals={[{ label: 'Push-ups', current: 20, target: 50 }]} reward={['250 XP', '100 Gold']} loading />
      </Section>

      <Section id="stat-bar" title="StatBar and XPBar">
        <StatBar stat="str" value={24} canAllocate onAllocate={() => {}} />
        <StatBar stat="agi" value={17} allocated={2} canAllocate />
        <StatBar stat="vit" value={20} />
        <StatBar stat="int" value={15} />
        <StatBar stat="per" value={12} />
        <XPBar level={18} xp={2140} xpToNext={3529} />
        <XPBar level={18} xp={2400} xpToNext={3529} gain={24} />
      </Section>

      <Section id="rank-badge" title="RankBadge">
        <div className="flex flex-wrap items-end gap-3">
          {RANKS.map((r) => <RankBadge key={r} rank={r} />)}
          <RankBadge rank="S" locked />
          <RankBadge rank="E" size="sm" />
          <RankBadge rank="National" size="lg" />
        </div>
      </Section>

      <Section id="emblems" title="Class emblems">
        <div className="grid grid-cols-4 gap-3">
          {[...BASE_CLASSES, ...ADVANCED_CLASSES].map((c) => <div key={c} className="flex flex-col items-center"><Emblem cls={c} /><span className="t-small text-center text-dim">{c.replace('_', ' ')}</span></div>)}
          <div className="flex flex-col items-center"><Emblem cls="fighter" active={false} /><span className="t-small text-dim">inactive</span></div>
        </div>
      </Section>

      <Section id="shadows" title="Shadow art">
        <div className="grid grid-cols-2 gap-3">
          {ARCHETYPES.map((a) => <div key={a} className="flex flex-col items-center"><ShadowArt archetype={a} seed={a} size={140} /><span className="t-small text-purple-text">{a}</span></div>)}
        </div>
      </Section>

      <Section id="body-map" title="BodyMap">
        <Label>Target mode (male) — tap muscles</Label>
        <BodyMap sex="male" selected={targets} onSelect={(m) => setTargets((t) => (t.includes(m) ? t.filter((x) => x !== m) : [...t, m]))} height={360} />
        <Label>Recovery mode (female, back)</Label>
        <BodyMap sex="female" face="back" mode="recovery" recovery={{ glutes: 22, hamstrings: 55, lats: 80, calves: 95, upper_back: 40 }} onSelect={() => {}} height={360} />
        <Label>Highlight (exercise detail)</Label>
        <BodyMap sex="male" face="front" mode="view" highlight={{ primary: ['chest'], secondary: ['triceps', 'front_delts'] }} height={240} />
        <Label>Disabled</Label>
        <BodyMap sex="female" face="front" disabled height={200} />
      </Section>

      <Section id="exercise-card" title="ExerciseCard">
        <ExerciseCard name="Barbell Bench Press" muscles={['Chest', 'Triceps']} equipment="Barbell" difficulty="intermediate" onClick={() => {}} />
        <ExerciseCard name="Push-up" muscles={['Chest']} equipment="Bodyweight" difficulty="beginner" selected pref="more" onClick={() => {}} />
        <ExerciseCard name="Muscle-up" muscles={['Lats', 'Triceps']} equipment="Pull-up bar" difficulty="advanced" pref="never" disabled />
      </Section>

      <Section id="set-row" title="SetRow">
        {sets.map((s, i) => <SetRow key={i} set={s} unit="kg" onToggle={() => setSets((all) => all.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} onEdit={() => {}} />)}
        <SetRow set={{ ...baseSet, index: 0, type: 'warmup', weight: 40, reps: 10, rir: null }} unit="kg" onToggle={() => {}} />
        <SetRow set={{ ...baseSet, index: 3, type: 'drop', weight: 60, reps: 10 }} unit="kg" onToggle={() => {}} />
        <SetRow set={{ ...baseSet, index: 4, done: true, pr: true, weight: 85 }} unit="kg" onToggle={() => {}} />
        <SetRow set={{ ...baseSet, index: 5 }} unit="kg" onToggle={() => {}} error="Weight is above the safe jump" />
        <SetRow set={{ ...baseSet, index: 6 }} unit="kg" onToggle={() => {}} disabled />
      </Section>

      <Section id="rest-timer" title="RestTimer">
        <RestTimer endsAt={restEnd} total={90} onAdjust={(d) => setRestEnd((e) => (e ? e + d * 1000 : e))} onSkip={() => setRestEnd(null)} fullscreen={full} onToggleFullscreen={() => setFull((f) => !f)} />
        <RestTimer endsAt={null} total={90} onAdjust={() => {}} onSkip={() => {}} />
      </Section>

      <Section id="number-stepper" title="NumberStepper and RIR picker">
        <NumberStepper label="Weight" value={weight} step={2.5} unit="kg" onChange={setWeight} />
        <NumberStepper label="Reps" value={8} onChange={() => {}} disabled />
        <NumberStepper label="Reps error" value={0} onChange={() => {}} error />
        <RirPicker value={rir} onChange={setRir} />
        <RirPicker value={1} onChange={() => {}} mode="rpe" />
      </Section>

      <Section id="toast" title="Toast (System message)">
        <ToastView kind="info" text="[A new Daily Quest has arrived.]" />
        <ToastView kind="success" text="[The Daily Quest has been cleared.]" onClose={() => {}} />
        <ToastView kind="warning" text="[Warning: failure to complete the Daily Quest will result in a penalty.]" />
        <ToastView kind="reward" text="[You have leveled up.]" />
        <ToastView kind="shadow" text="[Shadow Extraction successful. Igris has joined your army.]" />
        <TypedText text="[Congratulations on becoming a Player.]" />
      </Section>

      <Section id="tabs" title="Tabs">
        <Tabs label="Example" value={tab} onChange={setTab} tabs={[{ id: 'a', label: 'Target' }, { id: 'b', label: 'Recovery' }, { id: 'c', label: 'Locked', disabled: true }]} />
      </Section>

      <Section id="sheet" title="Sheet">
        <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Plate calculator">
          <p className="t-system mb-4">[Load 20 kg bar + 2 × 20 kg + 2 × 10 kg per side.]</p>
          <Button onClick={() => setSheet(false)}>Done</Button>
        </Sheet>
      </Section>

      <Section id="charts" title="Charts">
        <LineChart data={series} x="w" y="e1rm" unit="kg" />
        <BarChart data={series} x="w" y="e1rm" />
        <Heatmap label="Weekly sets per muscle" rows={['Chest', 'Back', 'Quads']} cols={['W1', 'W2', 'W3', 'W4']} values={[[10, 12, 14, 8], [12, 16, 18, 9], [6, 8, 10, 5]]} max={20} />
        <LineChart data={[]} x="w" y="e1rm" />
      </Section>

      <Section id="ring" title="Ring">
        <div className="flex justify-around">
          <Ring label="Calories" value={1450} target={2400} unit="" />
          <Ring label="Protein" value={150} target={150} color="var(--success)" unit="g" />
          <Ring label="Fat" value={110} target={80} color="var(--gold)" unit="g" />
        </div>
      </Section>

      <Section id="empty-state" title="EmptyState">
        <SystemWindow tag="SYSTEM LOG" animate={false}><EmptyState message="[No System messages have been recorded.]" icon="log" /></SystemWindow>
        <SystemWindow tag="INVENTORY" animate={false}><EmptyState message="[Your inventory is empty.]" icon="inventory" action={<Button variant="secondary">Visit the Store</Button>} /></SystemWindow>
      </Section>

      <Section id="icons" title="Icons">
        <div className="grid grid-cols-6 gap-3 text-glow">
          {iconNames.map((n) => <div key={n} className="flex flex-col items-center gap-1" title={n}><Icon name={n} /><span className="text-[9px] text-dim">{n}</span></div>)}
        </div>
      </Section>

      <Section id="sounds" title="Sounds">
        <div className="flex flex-wrap gap-2">
          {SOUNDS.map((s) => <Button key={s} variant="secondary" className="min-h-12 px-3 text-sm" onClick={() => sfx.play(s)}>{s}</Button>)}
          <Button variant="shadow" onClick={() => sfx.ambient(true)}>ambient on</Button>
          <Button variant="ghost" onClick={() => sfx.ambient(false)}>ambient off</Button>
        </div>
      </Section>

      <Section id="bottom-nav" title="BottomNav">
        <BottomNav inline active={nav} onNavigate={setNav} items={NAV.map((n) => (n.id === 'quests' ? { ...n, badge: true } : n))} />
        <BottomNav inline active="train" onNavigate={() => {}} disabled />
      </Section>
    </main>
  )
}
