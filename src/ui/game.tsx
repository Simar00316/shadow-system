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
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const STATUS_STATE: Record<QuestStatus, UiState> = { active: 'default', cleared: 'success', failed: 'error', waived: 'disabled', locked: 'disabled' }

/** The canonical four-part quest window: Goal / Time limit / Reward / Penalty (R1 §4). */
export function QuestCard({ tag, title, goals, until, reward, penalty, status = 'active', variant = 'system', loading, onOpen }: {
  tag: string; title: string; goals: QuestGoal[]; until?: number; reward?: string[]; penalty?: string; status?: QuestStatus; variant?: WindowVariant; loading?: boolean; onOpen?: () => void
}) {
  const left = useCountdown(status === 'active' ? until : undefined)
  return (
    <SystemWindow tag={tag} variant={variant} state={loading ? 'loading' : STATUS_STATE[status]} animate={false}>
      <button type="button" className="block w-full text-left disabled:cursor-default" onClick={onOpen} disabled={!onOpen || status === 'locked'}>
        <h3 className="t-heading mb-3 text-text">{status === 'locked' ? '???' : title}</h3>
        <div className="t-label mb-1 text-dim">Goal</div>
        <ul className="mb-3 flex flex-col gap-1.5">
          {goals.map((g) => {
            const done = g.current >= g.target
            return (
              <li key={g.label} className="flex items-center justify-between gap-3">
                <span className={`flex items-center gap-2 ${done ? 'text-success' : 'text-text'}`}>
                  <Icon name={done ? 'check' : 'next'} size={16} />
                  {g.label}
                </span>
                <span className={`t-num ${done ? 'text-success' : 'text-glow'}`}>
                  [{Math.min(g.current, g.target)}/{g.target}{g.unit ? ` ${g.unit}` : ''}]
                </span>
              </li>
            )
          })}
        </ul>
        {left ? (
          <div className="mb-2 flex items-center justify-between">
            <span className="t-label text-dim">Time limit</span>
            <span className="t-num text-text" aria-label={`Time left ${left}`}>{left}</span>
          </div>
        ) : null}
        {reward?.length ? (
          <div className="mb-2 flex items-start justify-between gap-3">
            <span className="t-label text-dim">Reward</span>
            <span className="t-small text-right text-gold">{reward.join(' · ')}</span>
          </div>
        ) : null}
        {penalty ? (
          <div className="flex items-start justify-between gap-3">
            <span className="t-label text-dim">Penalty</span>
            <span className="t-small text-right text-warning">{penalty}</span>
          </div>
        ) : null}
        {status === 'cleared' ? <div className="t-title glitch mt-3 text-center text-success">Quest clear</div> : null}
        {status === 'waived' ? <div className="t-small mt-3 text-center text-dim">[Penalty waived. Recovery takes priority.]</div> : null}
      </button>
    </SystemWindow>
  )
}

const STAT_META: Record<Stat, { label: string; icon: IconName }> = {
  str: { label: 'STR', icon: 'str' }, agi: { label: 'AGI', icon: 'agi' }, vit: { label: 'VIT', icon: 'vit' }, int: { label: 'INT', icon: 'int' }, per: { label: 'SENSE', icon: 'per' },
}

export function StatBar({ stat, value, allocated = 0, canAllocate, onAllocate, max = 100 }: { stat: Stat; value: number; allocated?: number; canAllocate?: boolean; onAllocate?: () => void; max?: number }) {
  const m = STAT_META[stat]
  return (
    <div className="flex items-center gap-3">
      <span className="text-glow"><Icon name={m.icon} size={20} /></span>
      <span className="t-label w-14 text-text">{m.label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(47_168_255/.12)]">
        <div className="h-full rounded-full bg-glow shadow-[0_0_8px_var(--glow)]" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
      <span className="t-num w-10 text-right text-text">{value}</span>
      {allocated ? <span className="t-small w-8 text-gold">+{allocated}</span> : <span className="w-8" />}
      <button type="button" aria-label={`Allocate a point to ${m.label}`} disabled={!canAllocate} onClick={onAllocate} className="flex h-12 w-12 items-center justify-center rounded-[var(--r-2)] border border-[color:var(--line)] text-glow active:scale-95 disabled:opacity-30">
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}

export function XPBar({ level, xp, xpToNext, gain }: { level: number; xp: number; xpToNext: number; gain?: number }) {
  const pct = Math.min(100, (xp / xpToNext) * 100)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="t-label text-dim">LV <span className="t-num-lg text-gold">{level}</span></span>
        <span className="t-num text-dim">{xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
      </div>
      <div className="relative h-2.5 overflow-visible rounded-full bg-[rgb(47_168_255/.12)]" role="progressbar" aria-label="Experience" aria-valuemin={0} aria-valuemax={xpToNext} aria-valuenow={xp}>
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--system-blue), var(--glow))', boxShadow: '0 0 10px var(--glow)' }} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        {gain ? (
          <motion.span key={`${xp}`} className="t-num absolute -top-6 right-0 text-gold" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -24 }} transition={{ duration: 0.7 }}>
            +{gain} XP
          </motion.span>
        ) : null}
      </div>
    </div>
  )
}

/** Progress ring for calories, macros and water. */
export function Ring({ value, target, label, color = 'var(--glow)', size = 88, unit }: { value: number; target: number; label: string; color?: string; size?: number; unit?: string }) {
  const r = 40, c = 2 * Math.PI * r, pct = target > 0 ? Math.min(1, value / target) : 0
  const over = target > 0 && value > target * 1.1
  return (
    <figure className="flex flex-col items-center gap-1" aria-label={`${label}: ${Math.round(value)} of ${Math.round(target)}${unit ? ' ' + unit : ''}`}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(47 168 255 / .12)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={over ? 'var(--warning)' : color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 50 50)" style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset .4s' }} />
        <text x="50" y="48" textAnchor="middle" fill="var(--text)" style={{ font: '700 20px var(--font-mono)' }}>{Math.round(value)}</text>
        <text x="50" y="66" textAnchor="middle" fill="var(--text-dim)" style={{ font: '500 11px var(--font-mono)' }}>/ {Math.round(target)}{unit ?? ''}</text>
      </svg>
      <figcaption className="t-label text-dim">{label}</figcaption>
    </figure>
  )
}
