import { useCallback, useEffect, useState } from 'react'
import { Button } from './controls'
import { Icon } from './icons'
import { sfx } from '@/audio/sfx'

/** One tutorial step: highlights the element with `data-tour={target}` (or nothing, for an intro card). */
export type TourStep = { target?: string; title: string; body: string }

const KEY = 'shadow-tours'
const read = (): string[] | 'off' => { try { const v = localStorage.getItem(KEY); return v === 'off' ? 'off' : v ? JSON.parse(v) : [] } catch { return [] } }
export const tourSeen = (id: string) => { const s = read(); return s === 'off' || s.includes(id) }
const markSeen = (id: string) => { const s = read(); if (s === 'off') return; try { localStorage.setItem(KEY, JSON.stringify([...new Set([...s, id])])) } catch { /* storage blocked */ } }
/** Settings → "Replay tutorials". */
export const resetTours = () => { try { localStorage.removeItem(KEY) } catch { /* storage blocked */ } }

type Rect = { top: number; left: number; width: number; height: number }

/**
 * First-visit tutorial for a screen, like a game's coach marks: the screen dims except the highlighted element, and a
 * System card explains it, with ✕ to close and Next to continue. Shown once per screen (`id`), after any open dialog
 * (for example the readiness check-in) has closed.
 */
export function Tour({ id, steps }: { id: string; steps: TourStep[] }) {
  const [i, setI] = useState<number | null>(null)
  const [rect, setRect] = useState<Rect | null>(null)

  // Start once, when nothing else is on top of the screen.
  useEffect(() => {
    if (tourSeen(id)) return
    let t = 0
    const tick = () => {
      if (document.querySelector('[role="dialog"]')) { t = window.setTimeout(tick, 600); return }
      setI(0)
    }
    t = window.setTimeout(tick, 900)
    return () => clearTimeout(t)
  }, [id])

  const step = i == null ? null : steps[i]
  const measure = useCallback(() => {
    const el = step?.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  useEffect(() => {
    if (!step) return
    const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null
    el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
    const raf = requestAnimationFrame(measure) // after the scroll above has applied
    addEventListener('resize', measure)
    addEventListener('scroll', measure, true)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', measure); removeEventListener('scroll', measure, true) }
  }, [step, measure])

  if (i == null || !step) return null
  const close = () => { markSeen(id); setI(null); sfx.play('window-close') }
  const next = () => { sfx.play('tap'); if (i + 1 >= steps.length) close(); else setI(i + 1) }
  const pad = 8
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  // Card goes below the highlight if there is room, else above, else pinned to the bottom (tall targets).
  const CARD = 250
  const spaceBelow = rect ? vh - (rect.top + rect.height + pad) : 0
  const spaceAbove = rect ? rect.top - pad : 0
  const cardStyle = !rect ? { top: '50%', transform: 'translateY(-50%)' }
    : spaceBelow >= CARD ? { top: rect.top + rect.height + pad + 12 }
    : spaceAbove >= CARD ? { bottom: vh - rect.top + pad + 12 }
    : { bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }
  // Keep the spotlight inside the viewport when the target is taller than the screen.
  const spot = rect ? { top: Math.max(4, rect.top - pad), bottom: Math.min(vh - 4, rect.top + rect.height + pad) } : null

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Tutorial: ${step.title}`}>
      {rect && spot ? (
        <div className="pointer-events-none fixed rounded-[var(--r-card)] transition-all duration-200" aria-hidden="true"
          style={{ top: spot!.top, left: rect.left - pad, width: rect.width + pad * 2, height: spot!.bottom - spot!.top, boxShadow: '0 0 0 9999px rgb(2 3 9 / .78), 0 0 0 2px var(--glow), 0 0 24px 4px rgb(47 168 255 / .5)' }} />
      ) : <div className="fixed inset-0 bg-[rgb(2_3_9/.78)]" aria-hidden="true" />}
      <div className="fixed inset-x-4 mx-auto max-w-[448px]" style={cardStyle}>
        <section className="sys-window sys-in tour-card" data-grade="hero" data-variant="system">
          <i className="sys-beam" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div className="sys-head sys-tag t-micro flex-1">TUTORIAL · {i + 1}/{steps.length}</div>
            <button type="button" aria-label="Close tutorial" onClick={close} className="press -mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-dim"><Icon name="close" size={18} /></button>
          </div>
          <h2 className="sys-title t-h2 text-text">{step.title}</h2>
          <p className="t-system mt-2 text-dim">{step.body}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-1" aria-hidden="true">{steps.map((_, k) => <span key={k} className={`h-1.5 w-1.5 rounded-full ${k === i ? 'bg-glow' : 'bg-[rgb(47_168_255/.25)]'}`} />)}</div>
            <Button className="min-w-28" icon={i + 1 >= steps.length ? 'check' : 'next'} onClick={next}>{i + 1 >= steps.length ? 'Got it' : 'Next'}</Button>
          </div>
        </section>
      </div>
    </div>
  )
}
