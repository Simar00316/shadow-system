import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import { sfx } from '@/audio/sfx'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'shadow'

const BTN: Record<BtnVariant, string> = {
  primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger', gold: 'btn-gold', shadow: 'btn-shadow',
}
/** Primary actions get the tap glitch (design-v2 §4.7b); quiet buttons do not. */
const GLITCH: Partial<Record<BtnVariant, true>> = { primary: true, gold: true, shadow: true, danger: true }

export function Button({ variant = 'primary', icon, loading, children, className = '', onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: IconName; loading?: boolean }) {
  return (
    <button
      type="button"
      className={`btn press t-button inline-flex min-h-12 items-center justify-center gap-2 px-5 disabled:opacity-40 ${BTN[variant]} ${className}`}
      data-glitch={GLITCH[variant] ? '' : undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        sfx.play('tap')
        onClick?.(e)
      }}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : icon ? <Icon name={icon} size={20} /> : null}
      <span className="glitch-label inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

export function IconButton({ icon, label, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={`inline-flex h-12 w-12 items-center justify-center rounded-[var(--r-2)] text-glow transition hover:bg-[rgb(47_168_255/.1)] active:scale-95 disabled:opacity-40 ${className}`} {...rest}>
      <Icon name={icon} />
    </button>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: ReactNode; disabled?: boolean }[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-[color:var(--line)]">
      {tabs.map((t) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={on}
            disabled={t.disabled}
            onClick={() => { sfx.play('tap'); onChange(t.id) }}
            className={`t-label relative min-h-12 flex-1 px-3 transition disabled:opacity-40 ${on ? 'text-glow' : 'text-dim'}`}
          >
            {t.label}
            {on ? <span className="absolute inset-x-2 -bottom-px h-0.5 bg-glow shadow-[0_-2px_10px_var(--glow)]" /> : null}
          </button>
        )
      })}
    </div>
  )
}

/** Big thumb-friendly stepper for weight/reps. Long-press repeats; tap the value to type. */
export function NumberStepper({ value, onChange, step = 1, min = 0, max = 9999, unit, label, disabled, error, caption }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; label: string; disabled?: boolean; error?: boolean; /** Show the label above the stepper (when nothing else on screen names it). */ caption?: boolean }) {
  const [editing, setEditing] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const latest = useRef(value)
  useEffect(() => { latest.current = value }, [value])
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 1000) / 1000))
  const bump = (dir: 1 | -1) => onChange(clamp(latest.current + dir * step))
  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null }
  useEffect(() => stop, [])
  const start = (dir: 1 | -1) => {
    bump(dir)
    stop()
    const started = Date.now()
    timer.current = setInterval(() => { if (Date.now() - started > 400) { latest.current = clamp(latest.current + dir * step); onChange(latest.current) } }, 90)
  }
  const hold = { onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop }
  const body = (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-40' : ''}`} role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || value <= min} className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)] text-glow active:scale-95 disabled:opacity-40" onPointerDown={() => start(-1)} {...hold}>
        <Icon name="minus" />
      </button>
      {editing ? (
        <input
          autoFocus
          inputMode="decimal"
          aria-label={label}
          defaultValue={value}
          className="t-num-lg w-24 rounded-[var(--r-1)] border border-glow bg-panel text-center"
          onBlur={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); if (!Number.isNaN(v)) onChange(clamp(v)); setEditing(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        />
      ) : (
        <button type="button" disabled={disabled} onClick={() => setEditing(true)} aria-label={`${label}: ${value}${unit ? ' ' + unit : ''}. Tap to type`} className={`t-num-lg min-w-24 text-center ${error ? 'text-warning' : 'text-text'}`}>
          {value}
          {unit ? <span className="t-small ml-1 text-dim">{unit}</span> : null}
        </button>
      )}
      <button type="button" aria-label={`Increase ${label}`} disabled={disabled || value >= max} className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)] text-glow active:scale-95 disabled:opacity-40" onPointerDown={() => start(1)} {...hold}>
        <Icon name="plus" />
      </button>
    </div>
  )
  return caption ? <div className="flex flex-col gap-1.5"><span className="t-label text-dim" aria-hidden="true">{label}</span>{body}</div> : body
}

/** Segmented picker for RIR (0, 1, 2, 3, 4, 5+). */
export function RirPicker({ value, onChange, mode = 'rir' }: { value: number | null; onChange: (v: number) => void; mode?: 'rir' | 'rpe' }) {
  const opts = mode === 'rir' ? [0, 1, 2, 3, 4, 5] : [10, 9, 8, 7, 6, 5]
  return (
    <div role="radiogroup" aria-label={mode === 'rir' ? 'Reps in reserve' : 'RPE'} className="flex gap-1">
      {opts.map((o, i) => {
        const v = mode === 'rir' ? o : i
        const on = value === v
        return (
          <button key={o} type="button" role="radio" aria-checked={on} onClick={() => onChange(v)} className={`t-num h-12 min-w-11 flex-1 rounded-[var(--r-2)] border transition ${on ? 'border-glow bg-[rgb(47_168_255/.18)] text-glow shadow-[var(--glow-1)]' : 'border-[color:var(--line)] text-dim'}`}>
            {mode === 'rir' && o === 5 ? '5+' : o}
          </button>
        )
      })}
    </div>
  )
}
