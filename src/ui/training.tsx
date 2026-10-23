import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Icon } from './icons'
import { sfx } from '@/audio/sfx'

import type { SetType } from '@/engine/types'
export type { SetType }
const TYPE_BADGE: Record<SetType, string> = { warmup: 'W', working: '', drop: 'D', failure: 'F', superset: 'S' }

export type SetRowData = { index: number; type: SetType; weight: number; reps: number; rir: number | null; done: boolean; target?: { weight: number; reps: number; rir?: number }; pr?: boolean }

/** One set in the workout player. Prefilled values; the 56px check logs it in one tap (DESIGN.md §7). */
export function SetRow({ set, unit, onToggle, onEdit, disabled, error }: { set: SetRowData; unit: string; onToggle: () => void; onEdit?: () => void; disabled?: boolean; error?: string }) {
  const badge = TYPE_BADGE[set.type]
  return (
    <div className={`flex items-center gap-3 rounded-[var(--r-1)] border px-3 py-1 transition ${set.done ? 'border-[rgb(61_220_132/.5)] bg-[rgb(61_220_132/.07)]' : error ? 'border-warning' : 'border-[color:var(--line)]'} ${disabled ? 'opacity-40' : ''}`} aria-label={`Set ${set.index}`}>
      <span className="t-num w-7 text-center text-dim">{badge ? <span className={set.type === 'warmup' ? 'text-amber' : 'text-purple-text'}>{badge}</span> : set.index}</span>
      <button type="button" onClick={onEdit} disabled={disabled || !onEdit} className="flex min-h-12 flex-1 items-baseline gap-2 text-left">
        <span className="t-num-lg text-text">{set.weight}</span>
        <span className="t-small text-dim">{unit}</span>
        <span className="t-num-lg text-dim">×</span>
        <span className="t-num-lg text-text">{set.reps}</span>
        {set.rir != null ? <span className="t-small ml-1 text-glow">RIR {set.rir >= 5 ? '5+' : set.rir}</span> : null}
        {set.pr ? <span className="t-tag ml-auto text-gold">PR</span> : null}
      </button>
      {set.target && !set.done ? <span className="t-small text-dim">{set.target.reps}r</span> : null}
      <motion.button
        type="button"
        aria-pressed={set.done}
        aria-label={set.done ? `Undo set ${set.index}` : `Complete set ${set.index}`}
        disabled={disabled}
        whileTap={{ scale: 0.9 }}
        onClick={() => { if (!set.done) sfx.play('set-logged'); onToggle() }}
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--r-2)] border-2 transition ${set.done ? 'border-success bg-success text-ink shadow-[0_0_14px_rgb(61_220_132/.5)]' : 'border-[color:var(--line)] text-dim'}`}
      >
        <Icon name="check" size={28} strokeWidth={2.5} />
      </motion.button>
      {error ? <span role="alert" className="sr-only">{error}</span> : null}
    </div>
  )
}

/** Rest countdown ring with ±15 s, skip and full-screen. Plays a warning at 10 s and a sound at the end. */
export function RestTimer({ endsAt, total, onAdjust, onSkip, fullscreen, onToggleFullscreen }: { endsAt: number | null; total: number; onAdjust: (deltaSec: number) => void; onSkip: () => void; fullscreen?: boolean; onToggleFullscreen?: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  const warned = useRef(false)
  const ended = useRef(false)
  useEffect(() => {
    warned.current = false
    ended.current = false
    if (!endsAt) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])
  const left = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0
  useEffect(() => {
    if (!endsAt) return
    if (left <= 10 && left > 0 && !warned.current) { warned.current = true; sfx.play('rest-warn') }
    if (left === 0 && !ended.current) { ended.current = true; sfx.play('rest-end') }
  }, [left, endsAt])
  const size = fullscreen ? 280 : 120
  const r = 44, c = 2 * Math.PI * r, pct = total ? left / total : 0
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
  return (
    <div className={`flex items-center gap-4 ${fullscreen ? 'fixed inset-0 z-40 flex-col justify-center bg-[rgb(2_3_9/.94)]' : ''}`} role="timer" aria-label={`Rest ${mm}`}>
      <button type="button" onClick={onToggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen timer'} className="relative">
        <svg width={size} height={size} viewBox="0 0 100 100" className={left <= 10 && left > 0 ? 'animate-pulse' : ''}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(47 168 255 / .12)" strokeWidth="6" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={left === 0 ? 'var(--success)' : 'var(--glow)'} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 50 50)" style={{ filter: 'drop-shadow(0 0 4px var(--glow))' }} />
          <text x="50" y="56" textAnchor="middle" fill="var(--text)" style={{ font: `700 ${fullscreen ? 22 : 20}px var(--font-mono)` }}>{endsAt ? mm : '--:--'}</text>
        </svg>
      </button>
      <div className="flex gap-2">
        <button type="button" className="t-button h-12 rounded-[var(--r-2)] border border-[color:var(--line)] px-4 text-glow" onClick={() => onAdjust(-15)} disabled={!endsAt}>−15</button>
        <button type="button" className="t-button h-12 rounded-[var(--r-2)] border border-[color:var(--line)] px-4 text-glow" onClick={() => onAdjust(15)} disabled={!endsAt}>+15</button>
        <button type="button" className="t-button h-12 rounded-[var(--r-2)] border border-[color:var(--line)] px-4 text-dim" onClick={onSkip} disabled={!endsAt}>Skip</button>
      </div>
    </div>
  )
}

const DIFF_COLOR = { beginner: '#e6f1ff', intermediate: 'var(--rank-a)', advanced: 'var(--warning)' } as const

/** Library row. Difficulty colour follows canon monster tags: white easy, orange normal, red hard (R1 row 59). */
export function ExerciseCard({ name, muscles, equipment, difficulty, thumb, pref, onClick, selected, disabled }: { name: string; muscles: string[]; equipment: string; difficulty: keyof typeof DIFF_COLOR; thumb?: string; pref?: 'more' | 'less' | 'never'; onClick?: () => void; selected?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex w-full items-center gap-3 rounded-[var(--r-1)] border p-2 text-left transition disabled:opacity-40 ${selected ? 'border-glow bg-[rgb(47_168_255/.1)] shadow-[var(--glow-1)]' : 'border-[color:var(--line)]'}`}>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--r-1)] bg-raised">
        {thumb ? <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-dim"><Icon name="train" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-text">{name}</div>
        <div className="t-small truncate text-dim">{muscles.join(', ')} · {equipment}</div>
      </div>
      <span className="t-tag" style={{ color: DIFF_COLOR[difficulty] }}>{difficulty.slice(0, 3)}</span>
      {pref ? <span className={`t-tag ${pref === 'never' ? 'text-warning' : pref === 'more' ? 'text-success' : 'text-dim'}`}>{pref}</span> : null}
    </button>
  )
}
