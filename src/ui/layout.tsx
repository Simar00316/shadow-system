import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import { sfx } from '@/audio/sfx'

/** Bottom sheet with scrim, close button, Escape and focus trap. (Drag-to-close removed: it never settled on Linux WebKit, #94.) */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // System window sounds (DESIGN.md §6), keyed on `open` only so re-renders do not replay them.
  useEffect(() => {
    if (!open) return
    sfx.play('window-open')
    return () => sfx.play('window-close')
  }, [open])
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const [first, last] = [f[0], f[f.length - 1]]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus() }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40">
          <motion.div className="absolute inset-0 bg-[rgb(2_3_9/.7)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[88dvh] max-w-[480px] overflow-y-auto rounded-t-[10px] border-t border-glow bg-panel px-4 pt-2 outline-none"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', boxShadow: '0 -8px 32px rgb(47 168 255 / .25)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[color:var(--line)]" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="t-heading text-text">{title}</h2>
              <button type="button" aria-label="Close" onClick={onClose} className="-mr-2 flex h-12 w-12 items-center justify-center text-dim"><Icon name="close" /></button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

export type NavItem = { id: string; label: string; icon: IconName; badge?: boolean }

export const NAV: NavItem[] = [
  { id: 'status', label: 'Status', icon: 'status' },
  { id: 'quests', label: 'Quests', icon: 'quests' },
  { id: 'train', label: 'Train', icon: 'train' },
  { id: 'diet', label: 'Diet', icon: 'diet' },
  { id: 'system', label: 'System', icon: 'system' },
]

/** Bottom navigation in the thumb zone (DESIGN.md §7, design-v2 §5.6): opaque, sliding active pill, tap glitch. */
export function BottomNav({ active, onNavigate, items = NAV, disabled, inline }: { active: string; onNavigate: (id: string) => void; items?: NavItem[]; disabled?: boolean; inline?: boolean }) {
  const idx = Math.max(0, items.findIndex((i) => i.id === active))
  const w = 100 / items.length
  return (
    <>
      {inline ? null : <div className="nav-fade" aria-hidden="true" />}
      <nav aria-label="Main" className={`nav-bar ${inline ? 'relative' : 'fixed inset-x-0 bottom-0 z-30'} mx-auto max-w-[480px]`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ul className="relative flex h-16">
          <span className="nav-pill" aria-hidden="true" style={{ left: `calc(${idx * w}% + ${w / 2}% - 28px)`, transition: 'left 260ms cubic-bezier(.2,.9,.3,1.15)' }} />
          {items.map((it) => {
            const on = it.id === active
            return (
              <li key={it.id} className="flex-1">
                <button
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  disabled={disabled}
                  data-glitch=""
                  onClick={() => { sfx.play('tap'); onNavigate(it.id) }}
                  className={`press relative flex h-full w-full flex-col items-center justify-center gap-1 pt-1 disabled:opacity-40 ${on ? 'text-glow' : 'text-dim'}`}
                >
                  <span className="relative z-[1] flex h-8 items-center"><Icon name={it.icon} size={22} /></span>
                  <span className={`glitch-label text-[11px] font-bold uppercase leading-none tracking-[.08em] [font-family:var(--font-ui)] ${on ? 'text-text' : ''}`}>{it.label}</span>
                  {it.badge ? <span className="absolute right-[calc(50%-18px)] top-2 z-[2] h-2 w-2 rounded-full bg-warning ring-2 ring-[color:var(--bg)]" aria-label="Pending" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
