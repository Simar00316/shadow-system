import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { SystemWindow } from './SystemWindow'
import { Button, IconButton, NumberStepper, RirPicker, Tabs } from './controls'
import { EmptyState, Toaster, ToastView, TypedText } from './feedback'
import { QuestCard, Ring, StatBar, XPBar } from './game'
import { ExerciseCard, RestTimer, SetRow } from './training'
import { BodyMap, musclesOnFace } from './BodyMap'
import { BarChart, Heatmap, LineChart } from './charts'
import { BottomNav, Sheet } from './layout'
import { RankBadge } from './RankBadge'
import { Emblem } from './Emblem'
import { ARCHETYPES, ShadowArt } from './ShadowArt'
import { Icon, iconNames } from './icons'
import { useToasts } from '@/state/toasts'
import { AriseSequence, LevelUpBurst, LootReveal } from './cinematics'
import { ExerciseMedia } from './ExerciseMedia'
import { ADVANCED_CLASSES, BASE_CLASSES, MUSCLES, RANKS, type Muscle } from '@/engine/types'

describe('SystemWindow', () => {
  it.each(['default', 'active', 'disabled', 'success'] as const)('renders %s state', (state) => {
    render(<SystemWindow tag="STATUS" title="Window" state={state}>body</SystemWindow>)
    expect(screen.getByLabelText('Window')).toHaveAttribute('data-state', state)
    expect(screen.getByText('body')).toBeInTheDocument()
  })
  it('shows skeleton when loading and hides children', () => {
    render(<SystemWindow title="W" state="loading">body</SystemWindow>)
    expect(screen.queryByText('body')).not.toBeInTheDocument()
    expect(screen.getByLabelText('W')).toHaveAttribute('aria-busy', 'true')
  })
  it('shows the error message in System voice', () => {
    render(<SystemWindow title="W" state="error" error="Failed">x</SystemWindow>)
    expect(screen.getByRole('alert')).toHaveTextContent('[Failed]')
  })
  it('alert variant prefixes the tag', () => {
    render(<SystemWindow tag="WARNING" variant="alert">x</SystemWindow>)
    expect(screen.getByText(/WARNING/)).toHaveTextContent('⚠')
  })
})

describe('controls', () => {
  it('Button fires, and is inert while loading or disabled', async () => {
    const fn = vi.fn()
    const { rerender } = render(<Button onClick={fn}>Go</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(fn).toHaveBeenCalledOnce()
    rerender(<Button onClick={fn} loading>Go</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    rerender(<Button onClick={fn} disabled>Go</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('IconButton has an accessible label', () => {
    render(<IconButton icon="settings" label="Settings" />)
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })
  it('Tabs switch and respect disabled', async () => {
    function T() {
      const [v, setV] = useState<'a' | 'b' | 'c'>('a')
      return <Tabs label="t" value={v} onChange={setV} tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C', disabled: true }]} />
    }
    render(<T />)
    await userEvent.click(screen.getByRole('tab', { name: 'B' }))
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'C' })).toBeDisabled()
  })
  it('NumberStepper steps, clamps and accepts typed values', async () => {
    function S() {
      const [v, setV] = useState(10)
      return <NumberStepper label="Weight" value={v} onChange={setV} step={2.5} min={0} max={15} unit="kg" />
    }
    render(<S />)
    fireEvent.pointerDown(screen.getByLabelText('Increase Weight'))
    fireEvent.pointerUp(screen.getByLabelText('Increase Weight'))
    expect(screen.getByRole('button', { name: /Weight: 12.5 kg/ })).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByLabelText('Increase Weight'))
    fireEvent.pointerUp(screen.getByLabelText('Increase Weight'))
    fireEvent.pointerDown(screen.getByLabelText('Increase Weight'))
    fireEvent.pointerUp(screen.getByLabelText('Increase Weight'))
    expect(screen.getByRole('button', { name: /Weight: 15 kg/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Weight: 15/ }))
    const input = screen.getByRole('textbox', { name: 'Weight' })
    await userEvent.clear(input)
    await userEvent.type(input, '7,5{Enter}')
    expect(screen.getByRole('button', { name: /Weight: 7.5 kg/ })).toBeInTheDocument()
  })
  it('NumberStepper disabled state blocks input', () => {
    render(<NumberStepper label="Reps" value={5} onChange={() => {}} disabled />)
    expect(screen.getByLabelText('Increase Reps')).toBeDisabled()
  })
  it('RirPicker selects values, 5 shows as 5+', async () => {
    const fn = vi.fn()
    render(<RirPicker value={2} onChange={fn} />)
    expect(screen.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: '5+' }))
    expect(fn).toHaveBeenCalledWith(5)
  })
  it('RirPicker RPE mode maps RPE 9 to RIR 1', async () => {
    const fn = vi.fn()
    render(<RirPicker value={null} onChange={fn} mode="rpe" />)
    await userEvent.click(screen.getByRole('radio', { name: '9' }))
    expect(fn).toHaveBeenCalledWith(1)
  })
})

describe('feedback', () => {
  it('TypedText finishes on tap', async () => {
    render(<TypedText text="[You have leveled up.]" />)
    await userEvent.click(screen.getByLabelText('[You have leveled up.]'))
    expect(screen.getByLabelText('[You have leveled up.]')).toHaveTextContent('[You have leveled up.]')
  })
  it.each(['info', 'success', 'warning', 'reward', 'shadow'] as const)('ToastView %s', (kind) => {
    render(<ToastView kind={kind} text="[x]" />)
    expect(screen.getByRole(kind === 'warning' ? 'alert' : 'status')).toBeInTheDocument()
  })
  it('Toaster shows pushed toasts and auto-dismisses', () => {
    vi.useFakeTimers()
    render(<Toaster />)
    act(() => { useToasts.getState().push('info', '[A new Daily Quest has arrived.]') })
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(4000) })
    expect(useToasts.getState().toasts).toHaveLength(0)
    vi.useRealTimers()
  })
  it('EmptyState renders message and action', () => {
    render(<EmptyState message="[Empty.]" action={<button>Act</button>} />)
    expect(screen.getByText('[Empty.]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument()
  })
})

describe('game components', () => {
  const goals = [{ label: 'Session', current: 1, target: 1 }, { label: 'Water', current: 1, target: 3, unit: 'L' }]
  it('QuestCard shows goal progress, reward and penalty', () => {
    render(<QuestCard tag="DAILY QUEST" title="Preparation to Become Strong" goals={goals} reward={['100 XP']} penalty="Penalty Zone" until={Date.now() + 3_600_000} />)
    expect(screen.getByText('[1/1]')).toBeInTheDocument()
    expect(screen.getByText('[1/3 L]')).toBeInTheDocument()
    expect(screen.getByText('Penalty Zone')).toBeInTheDocument()
    expect(screen.getByLabelText(/Time left 0[01]:/)).toBeInTheDocument()
  })
  it('QuestCard cleared, waived, locked states', () => {
    const { rerender } = render(<QuestCard tag="Q" title="T" goals={goals} status="cleared" />)
    expect(screen.getByText(/Quest clear/i)).toBeInTheDocument()
    rerender(<QuestCard tag="Q" title="T" goals={goals} status="waived" />)
    expect(screen.getByText(/Penalty waived/)).toBeInTheDocument()
    rerender(<QuestCard tag="Q" title="Secret" goals={goals} status="locked" />)
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })
  it('StatBar allocates only when allowed', async () => {
    const fn = vi.fn()
    const { rerender } = render(<StatBar stat="str" value={20} canAllocate onAllocate={fn} />)
    await userEvent.click(screen.getByRole('button', { name: /Allocate a point to STR/ }))
    expect(fn).toHaveBeenCalled()
    rerender(<StatBar stat="per" value={20} />)
    expect(screen.getByRole('button', { name: /SENSE/ })).toBeDisabled()
  })
  it('XPBar exposes progress', () => {
    render(<XPBar level={3} xp={100} xpToNext={400} gain={20} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('+20 XP')).toBeInTheDocument()
  })
  it('Ring labels value and target', () => {
    render(<Ring label="Protein" value={150} target={140} unit="g" />)
    expect(screen.getByLabelText('Protein: 150 of 140 g')).toBeInTheDocument()
  })
  it.each(RANKS)('RankBadge %s', (r) => {
    render(<RankBadge rank={r} />)
    expect(screen.getByRole('img', { name: `${r} rank` })).toBeInTheDocument()
  })
  it('RankBadge locked', () => {
    render(<RankBadge rank="S" locked />)
    expect(screen.getByRole('img', { name: 'S rank (locked)' })).toBeInTheDocument()
  })
  it.each([...BASE_CLASSES, ...ADVANCED_CLASSES])('Emblem %s', (c) => {
    render(<Emblem cls={c} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
  it.each(ARCHETYPES)('ShadowArt %s', (a) => {
    render(<ShadowArt archetype={a} seed="x" animate={false} />)
    expect(screen.getByRole('img', { name: `${a} shadow` })).toBeInTheDocument()
  })
  it('every icon renders', () => {
    const { container } = render(<div>{iconNames.map((n) => <Icon key={n} name={n} />)}</div>)
    expect(container.querySelectorAll('svg')).toHaveLength(iconNames.length)
  })
})

describe('training components', () => {
  const set = { index: 1, type: 'working' as const, weight: 80, reps: 8, rir: 2, done: false }
  it('SetRow completes in one tap', async () => {
    const fn = vi.fn()
    render(<SetRow set={set} unit="kg" onToggle={fn} />)
    await userEvent.click(screen.getByRole('button', { name: 'Complete set 1' }))
    expect(fn).toHaveBeenCalledOnce()
  })
  it('SetRow done, warm-up and disabled states', () => {
    const { rerender } = render(<SetRow set={{ ...set, done: true, pr: true }} unit="kg" onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: 'Undo set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('PR')).toBeInTheDocument()
    rerender(<SetRow set={{ ...set, type: 'warmup' }} unit="kg" onToggle={() => {}} disabled />)
    expect(screen.getByText('W')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete set 1' })).toBeDisabled()
  })
  it('RestTimer counts down and adjusts', async () => {
    const adjust = vi.fn(), skip = vi.fn()
    render(<RestTimer endsAt={Date.now() + 90_000} total={90} onAdjust={adjust} onSkip={skip} />)
    expect(screen.getByRole('timer', { name: /Rest 1:30/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '+15' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(adjust).toHaveBeenCalledWith(15)
    expect(skip).toHaveBeenCalled()
  })
  it('RestTimer idle state disables controls', () => {
    render(<RestTimer endsAt={null} total={90} onAdjust={() => {}} onSkip={() => {}} />)
    expect(screen.getByRole('button', { name: 'Skip' })).toBeDisabled()
  })
  it('ExerciseCard shows details and selection', async () => {
    const fn = vi.fn()
    render(<ExerciseCard name="Bench" muscles={['Chest']} equipment="Barbell" difficulty="intermediate" pref="more" selected onClick={fn} />)
    await userEvent.click(screen.getByRole('button', { name: /Bench/ }))
    expect(fn).toHaveBeenCalled()
    expect(screen.getByText('more')).toBeInTheDocument()
  })
})

describe('BodyMap', () => {
  it('covers all 21 canonical muscles across front and back for both sexes', () => {
    for (const sex of ['male', 'female'] as const) {
      const all = new Set([...musclesOnFace(sex, 'front'), ...musclesOnFace(sex, 'back')])
      expect([...all].sort()).toEqual([...MUSCLES].sort())
    }
  })
  it('target mode toggles a muscle', async () => {
    function M() {
      const [sel, setSel] = useState<Muscle[]>([])
      return <BodyMap sex="male" selected={sel} onSelect={(m) => setSel((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))} />
    }
    render(<M />)
    const chest = screen.getAllByRole('button', { name: /^Chest/ })[0]
    await userEvent.click(chest)
    expect(screen.getAllByRole('button', { name: /^Chest \(selected\)/ }).length).toBeGreaterThan(0)
  })
  it('flips to the back view', async () => {
    render(<BodyMap sex="female" onSelect={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Show back/ }))
    expect(screen.getByRole('group', { name: 'female body, back view' })).toBeInTheDocument()
  })
  it('recovery mode labels percentages', () => {
    render(<BodyMap sex="male" face="back" mode="recovery" recovery={{ glutes: 22 }} onSelect={() => {}} />)
    expect(screen.getAllByRole('button', { name: 'Glutes 22% recovered' }).length).toBeGreaterThan(0)
  })
  it('disabled map is not interactive', () => {
    render(<BodyMap sex="male" disabled onSelect={() => {}} />)
    expect(screen.queryAllByRole('button', { name: /Chest/ })).toHaveLength(0)
  })
})

describe('charts and layout', () => {
  it('charts show the System empty state without data', () => {
    render(<><LineChart data={[]} x="x" y="y" /><BarChart data={[]} x="x" y="y" /><Heatmap rows={[]} cols={[]} values={[]} max={1} label="h" /></>)
    expect(screen.getAllByText('[No data has been recorded yet.]')).toHaveLength(3)
  })
  it('charts render with data', () => {
    render(<><LineChart data={[{ x: 'a', y: 1 }]} x="x" y="y" /><Heatmap rows={['Chest']} cols={['W1']} values={[[5]]} max={10} label="heat" /></>)
    expect(screen.getByRole('img', { name: /y over x/ })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'heat' })).toHaveTextContent('5')
  })
  it('BottomNav marks the active tab and navigates', async () => {
    const fn = vi.fn()
    render(<BottomNav active="status" onNavigate={fn} />)
    expect(screen.getByRole('button', { name: /Status/ })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: /Diet/ }))
    expect(fn).toHaveBeenCalledWith('diet')
  })
  it('Sheet opens as a dialog and closes on Escape', async () => {
    const close = vi.fn()
    render(<Sheet open onClose={close} title="Plates"><button>Inside</button></Sheet>)
    expect(screen.getByRole('dialog', { name: 'Plates' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(close).toHaveBeenCalled()
  })
})

describe('cinematics and media', () => {
  it('LootReveal opens on tap and announces the item', async () => {
    render(<LootReveal rarity="epic" name="Instant Dungeon Key" onDone={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open the loot box' }))
    expect(screen.getByText('Instant Dungeon Key')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })
  it('AriseSequence reaches the accept step', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    render(<AriseSequence name="Ferros" rank="elite" archetype="giant" seed="f" onAccept={fn} />)
    act(() => { vi.advanceTimersByTime(2000) })
    vi.useRealTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(fn).toHaveBeenCalled()
  })
  it('LevelUpBurst labels the new level', () => {
    render(<LevelUpBurst level={7} />)
    expect(screen.getByLabelText('Level up: 7')).toBeInTheDocument()
  })
  it('ExerciseMedia renders animation, frames and fallback with credit', () => {
    const { rerender } = render(<ExerciseMedia ex={{ name: 'Squat', media: { kind: 'anim', src: ['/a.webp'], thumb: '/t.webp', credit: '(c) X' } }} />)
    expect(screen.getByRole('img', { name: 'Squat demonstration' })).toBeInTheDocument()
    expect(screen.getByText('(c) X')).toBeInTheDocument()
    rerender(<ExerciseMedia ex={{ name: 'Row', media: { kind: 'frames', src: ['/0.webp', '/1.webp'], thumb: '' } }} />)
    expect(screen.getByRole('img', { name: 'Row demonstration' })).toBeInTheDocument()
    rerender(<ExerciseMedia ex={{ name: 'None', media: { kind: 'frames', src: [], thumb: '' } }} />)
    expect(screen.queryByRole('img', { name: 'None demonstration' })).toBeNull()
  })
})
