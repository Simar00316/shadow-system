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

/** Bottom navigation in the thumb zone (DESIGN.md §7). */
export function BottomNav({ active, onNavigate, items = NAV, disabled, inline }: { active: string; onNavigate: (id: string) => void; items?: NavItem[]; disabled?: boolean; inline?: boolean }) {
  return (
    <nav aria-label="Main" className={`${inline ? 'relative' : 'fixed inset-x-0 bottom-0 z-30'} mx-auto max-w-[480px] border-t border-[color:var(--line)] bg-[rgb(11_20_38/.92)] backdrop-blur`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="flex h-16">
        {items.map((it) => {
          const on = it.id === active
          return (
            <li key={it.id} className="flex-1">
              <button
                type="button"
                aria-current={on ? 'page' : undefined}
                disabled={disabled}
                onClick={() => { sfx.play('tap'); onNavigate(it.id) }}
                className={`relative flex h-full w-full flex-col items-center justify-center gap-0.5 transition disabled:opacity-40 ${on ? 'text-glow' : 'text-dim'}`}
              >
                <span style={on ? { filter: 'drop-shadow(0 0 6px var(--glow))' } : undefined}><Icon name={it.icon} size={24} /></span>
                <span className="t-label text-[11px]">{it.label}</span>
                {it.badge ? <span className="absolute right-[30%] top-2 h-2 w-2 rounded-full bg-warning shadow-[0_0_6px_var(--warning)]" aria-label="Pending" /> : null}
                {on ? <span className="absolute inset-x-6 top-0 h-0.5 bg-glow shadow-[0_0_10px_var(--glow)]" /> : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
