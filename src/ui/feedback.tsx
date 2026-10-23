import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import { useToasts, type ToastKind } from '@/state/toasts'

/** Types System text at ~45 chars/s, brackets first; tap to finish (DESIGN.md §5). */
export function TypedText({ text, className = '', onDone }: { text: string; className?: string; onDone?: () => void }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? text.length : 0)
  const done = n >= text.length
  useEffect(() => {
    if (reduce || done) return
    const per = Math.min(1200, Math.max(250, (text.length / 45) * 1000)) / Math.max(1, text.length)
    const id = setInterval(() => setN((p) => Math.min(text.length, p + 1)), per)
    return () => clearInterval(id)
  }, [text, reduce, done])
  useEffect(() => {
    if (done) onDone?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])
  return (
    <span className={`t-system ${done ? '' : 'cursor-block'} ${className}`} onClick={() => setN(text.length)} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, n)}</span>
    </span>
  )
}

const KIND: Record<ToastKind, { color: string; icon: IconName; tag: string }> = {
  info: { color: 'var(--glow)', icon: 'info', tag: 'NOTIFICATION' },
  success: { color: 'var(--success)', icon: 'check', tag: 'QUEST' },
  warning: { color: 'var(--warning)', icon: 'emergency', tag: 'WARNING' },
  reward: { color: 'var(--gold)', icon: 'star', tag: 'REWARD' },
  shadow: { color: 'var(--shadow-purple-text)', icon: 'shadow', tag: 'SHADOW' },
}

export function ToastView({ kind, text, onClose }: { kind: ToastKind; text: string; onClose?: () => void }) {
  const k = KIND[kind]
  return (
    <div role={kind === 'warning' ? 'alert' : 'status'} className="pointer-events-none flex items-start gap-3 rounded-[var(--r-1)] border bg-panel px-4 py-3" style={{ borderColor: k.color, boxShadow: `0 0 16px color-mix(in srgb, ${k.color} 40%, transparent)` }}>
      <span style={{ color: k.color }} className="mt-0.5"><Icon name={k.icon} size={20} /></span>
      <div className="min-w-0 flex-1">
        <div className="t-tag" style={{ color: k.color }}>{k.tag}</div>
        <TypedText text={text} />
      </div>
      {onClose ? <button type="button" aria-label="Dismiss" className="pointer-events-auto -m-2 p-2 text-dim" onClick={onClose}><Icon name="close" size={18} /></button> : null}
    </div>
  )
}

/** Top toast stack; never steals focus (DESIGN.md §5 toast). */
export function Toaster() {
  const { toasts, dismiss } = useToasts()
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), t.kind === 'warning' ? 7000 : 3500))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismiss])
  return (
    <div className="pointer-events-none fixed inset-x-0 z-50 mx-auto flex max-w-[480px] flex-col gap-2 px-4" style={{ top: 'calc(env(safe-area-inset-top) + 68px)' }}>
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <ToastView kind={t.kind} text={t.text} onClose={() => dismiss(t.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Empty lists speak in the System voice. */
export function EmptyState({ message, icon = 'info', action }: { message: string; icon?: IconName; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="text-dim"><Icon name={icon} size={36} /></span>
      <p className="t-system text-dim">{message}</p>
      {action}
    </div>
  )
}
