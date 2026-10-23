import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SystemWindow, type UiState, type WindowVariant } from './SystemWindow'
import { Icon, type IconName } from './icons'
import type { Stat } from '@/engine/types'

export type QuestGoal = { label: string; current: number; target: number; unit?: string }
export type QuestStatus = 'active' | 'cleared' | 'failed' | 'waived' | 'locked'

function useCountdown(until?: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!until) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [until])
  if (!until) return null
  const s = Math.max(0, Math.floor((until - now) / 1000))
  return { text: `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, urgent: s < 3600 }
}

const STATUS_STATE: Record<QuestStatus, UiState> = { active: 'default', cleared: 'success', failed: 'error', waived: 'disabled', locked: 'disabled' }

/** Thin progress bar with 10 segment ticks; designed to read well at 0% (design-v2 §4.5). */
export function MiniBar({ pct, color = 'var(--glow)', className = '' }: { pct: number; color?: string; className?: string }) {
  const p = Math.max(0, Math.min(100, pct))
  return (
    <div className={`relative h-1.5 overflow-hidden rounded-full ${className}`} style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }} aria-hidden="true">
      <div className="h-full rounded-full" style={{ width: `${p}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 70%, transparent), ${color})`, boxShadow: p ? `0 0 8px color-mix(in srgb, ${color} 60%, transparent)` : undefined, transition: 'width .6s var(--ease-out)' }} />
      <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgb(5 7 15 / .7) calc(10% - 1px) 10%)' }} />
    </div>
  )
}

/** The canonical four-part quest window: Goal / Time limit / Reward / Penalty (R1 §4), as a System hero. */
export function QuestCard({ tag, title, goals, until, reward, penalty, status = 'active', variant = 'system', hero, loading, onOpen }: {
  tag: string; title: string; goals: QuestGoal[]; until?: number; reward?: string[]; penalty?: string; status?: QuestStatus; variant?: WindowVariant; hero?: boolean; loading?: boolean; onOpen?: () => void
}) {
  const left = useCountdown(status === 'active' ? until : undefined)
  const done = goals.filter((g) => g.current >= g.target).length
  const locked = status === 'locked'
  return (
    <SystemWindow tag={tag} variant={variant} hero={hero} state={loading ? 'loading' : STATUS_STATE[status]} animate={false}>
      <button type="button" className="press block w-full text-left disabled:cursor-default" onClick={onOpen} disabled={!onOpen || locked} data-glitch={onOpen && !locked ? '' : undefined}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="t-h2 text-text">{locked ? '???' : title}</h3>
          {left ? (
            <span className={`chip shrink-0 ${left.urgent ? '' : ''}`} data-tone={left.urgent ? 'red' : 'dim'} aria-label={`Time left ${left.text}`}>
              <Icon name="timer" size={14} />
              <span className="t-num text-[13px] tracking-normal">{left.text}</span>
            </span>
          ) : null}
        </div>
        {!locked ? (
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`t-num-lg ${done === goals.length ? 'text-success' : 'text-text'}`}>{done}<span className="text-dim">/{goals.length}</span></span>
            <span className="t-micro text-dim">Goals cleared</span>
          </div>
        ) : null}
        <ul className="mt-3 flex flex-col">
          {goals.map((g) => {
            const ok = g.current >= g.target
            return (
              <li key={g.label} className="border-t border-[color:var(--hairline)] py-2.5 first:border-t-0">
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex min-w-0 items-center gap-2 ${ok ? 'text-success' : 'text-text'}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${ok ? 'border-success bg-[rgb(61_220_132/.15)]' : 'border-[color:var(--edge-hi)]'}`}>{ok ? <Icon name="check" size={12} /> : null}</span>
                    <span className="t-row truncate">{g.label}</span>
                  </span>
                  <span className={`t-num shrink-0 text-[14px] ${ok ? 'text-success' : 'text-glow'}`}>
                    [{Math.min(g.current, g.target)}/{g.target}{g.unit ? ` ${g.unit}` : ''}]
                  </span>
                </div>
                {g.target > 1 && !ok ? <MiniBar className="ml-7 mt-2" pct={(g.current / g.target) * 100} /> : null}
              </li>
            )
          })}
        </ul>
        {reward?.length || penalty ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {reward?.map((r) => <span key={r} className="chip" data-tone="gold">{r}</span>)}
            {penalty ? <span className="chip ml-auto" data-tone="red" title="Penalty"><Icon name="penalty" size={12} /><span className="normal-case tracking-normal [font-family:var(--font-body)] font-medium">{penalty}</span></span> : null}
          </div>
        ) : null}
        {status === 'cleared' ? <div className="t-moment glitch mt-4 text-center text-success glow-text">Quest clear</div> : null}
        {status === 'waived' ? <div className="t-small mt-3 text-center text-dim">[Penalty waived. Recovery takes priority.]</div> : null}
      </button>
    </SystemWindow>
  )
}

const STAT_META: Record<Stat, { label: string; icon: IconName }> = {
  str: { label: 'STR', icon: 'str' }, agi: { label: 'AGI', icon: 'agi' }, vit: { label: 'VIT', icon: 'vit' }, int: { label: 'INT', icon: 'int' }, per: { label: 'SENSE', icon: 'per' },
}

/** One stat as a compact tile: icon well, label, value, segment bar, and an allocate button that lights up with points. */
export function StatBar({ stat, value, allocated = 0, canAllocate, onAllocate, max = 100 }: { stat: Stat; value: number; allocated?: number; canAllocate?: boolean; onAllocate?: () => void; max?: number }) {
  const m = STAT_META[stat]
  return (
    <div className="flex items-center gap-3 rounded-[var(--r-ctl)] border border-[color:var(--edge)] bg-[color:var(--surface-flat)] p-2.5">
      <span className="well h-9 w-9"><Icon name={m.icon} size={18} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="t-label text-dim">{m.label}</span>
          <span className="flex items-baseline gap-1">
            <span className="t-num-lg text-[22px] leading-none text-text">{value}</span>
            {allocated ? <span className="t-num text-[12px] text-gold">+{allocated}</span> : null}
          </span>
        </div>
        <MiniBar className="mt-2" pct={(value / max) * 100} />
      </div>
      <button type="button" aria-label={`Allocate a point to ${m.label}`} disabled={!canAllocate} onClick={onAllocate} data-glitch={canAllocate ? '' : undefined}
        className={`press flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-ctl)] disabled:opacity-25 ${canAllocate ? 'btn-gold' : 'border border-[color:var(--edge)] text-dim'}`}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}

/** Level numeral + XP bar with segment ticks and "N to next level" (design-v2 §5.1). */
export function XPBar({ level, xp, xpToNext, gain }: { level: number; xp: number; xpToNext: number; gain?: number }) {
  const pct = Math.min(100, (xp / xpToNext) * 100)
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span className="t-micro text-dim">LV</span>
          <span className="t-display text-[44px] leading-none text-gold glow-gold">{level}</span>
        </span>
        <span className="text-right">
          <span className="t-num block text-[13px] text-dim">{xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
          <span className="t-micro text-faint">{(xpToNext - xp).toLocaleString()} to LV {level + 1}</span>
        </span>
      </div>
      <div className="relative h-2.5 overflow-visible rounded-full bg-[rgb(47_168_255/.12)]" role="progressbar" aria-label="Experience" aria-valuemin={0} aria-valuemax={xpToNext} aria-valuenow={xp}>
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--system-blue), var(--glow))', boxShadow: '0 0 12px rgb(92 200 255 / .6)' }} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
        <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgb(5 7 15 / .65) calc(10% - 1px) 10%)' }} />
        {gain ? (
          <motion.span key={`${xp}`} className="t-num absolute -top-6 right-0 text-gold" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -24 }} transition={{ duration: 0.7 }}>
            +{gain} XP
          </motion.span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Progress ring for calories, macros and water: tinted track, tick ring, glowing start pip (reads as a gauge at 0%),
 * stroke-based glow instead of a filter. `remaining` shows what is left to clear in the centre (design-v2 §4.5).
 */
export function Ring({ value, target, label, color = 'var(--glow)', size = 88, unit, remaining, caption = true }: { value: number; target: number; label: string; color?: string; size?: number; unit?: string; remaining?: boolean; caption?: boolean }) {
  const r = 40, c = 2 * Math.PI * r, pct = target > 0 ? Math.min(1, value / target) : 0
  const over = target > 0 && value > target * 1.1
  const full = target > 0 && value >= target && !over
  const stroke = over ? 'var(--warning)' : full ? 'var(--gold)' : color
  const left = Math.max(0, Math.round(target - value))
  const angle = pct * 360 - 90
  const big = size >= 140
  return (
    <figure className="flex flex-col items-center gap-1.5" aria-label={`${label}: ${Math.round(value)} of ${Math.round(target)}${unit ? ' ' + unit : ''}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="47.5" fill="none" stroke={color} strokeOpacity=".22" strokeWidth="1.4" strokeDasharray="0.6 4.38" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeOpacity=".13" strokeWidth="8" />
        {pct > 0 ? <circle cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeOpacity=".22" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset .7s var(--ease-out)' }} /> : null}
        <circle cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset .7s var(--ease-out)' }} />
        <circle cx={50 + r * Math.cos((angle * Math.PI) / 180)} cy={50 + r * Math.sin((angle * Math.PI) / 180)} r="4.2" fill="#e6f6ff" stroke={stroke} strokeWidth="2" />
        <text x="50" y={big ? 50 : 52} textAnchor="middle" fill={full ? 'var(--gold)' : 'var(--text)'} style={{ font: `700 ${big ? 17 : 20}px var(--font-mono)`, letterSpacing: '-0.02em' }}>
          {(remaining ? left : Math.round(value)).toLocaleString()}
        </text>
        <text x="50" y={big ? 63 : 66} textAnchor="middle" fill="var(--text-dim)" style={{ font: `700 ${big ? 6 : 9}px var(--font-ui)`, letterSpacing: '0.14em' }}>
          {remaining ? (full ? 'CLEARED' : `${(unit || 'kcal').toUpperCase()} LEFT`) : `/ ${Math.round(target).toLocaleString()}${unit ?? ''}`}
        </text>
      </svg>
      {caption ? <figcaption className="t-label text-dim">{label}</figcaption> : null}
    </figure>
  )
}
