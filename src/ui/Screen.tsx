import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './icons'
import { isWarm } from './fx'

/**
 * Page frame (design-v2 §4.2, §5): a compact header with an optional back button and actions. The `tag` is a small
 * context label; the title is the screen name and glitches once on entry. Screens without a title show the tag as title.
 */
export function Screen({ tag, title, back, actions, children, wide, plain }: { tag: string; title?: string; back?: string | boolean; actions?: ReactNode; children: ReactNode; wide?: boolean; /** No big title: the hero panel carries the screen (Status). */ plain?: boolean }) {
  const nav = useNavigate()
  const heading = title ?? tag
  const ref = useRef<HTMLHeadingElement>(null)
  const [enter] = useState(isWarm)
  useEffect(() => { if (enter) ref.current?.classList.add('go') }, [enter])
  return (
    <main className={`mx-auto flex w-full flex-col gap-3 px-4 ${wide ? 'max-w-[720px]' : 'max-w-[480px]'}`} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + var(--nav-h) + 32px)' }}>
      <header className="flex min-h-14 items-center gap-2">
        {back ? (
          <button type="button" aria-label="Back" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="press -ml-2 flex h-11 w-11 items-center justify-center rounded-full text-glow">
            <Icon name="back" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          {title || plain ? <div className="t-micro text-dim">{tag}</div> : null}
          {plain ? <h1 className="sr-only">{heading}</h1> : <h1 ref={ref} className="glitch-title t-screen truncate text-text">{heading}<span className="gt-a" aria-hidden="true">{heading}</span><span className="gt-b" aria-hidden="true">{heading}</span></h1>}
        </div>
        {actions}
      </header>
      {children}
    </main>
  )
}

/** A labelled row inside a window. */
export function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-[color:var(--hairline)] py-1 last:border-0">
      <span className="t-label text-dim">{label}</span>
      <span className="text-right text-text">{children}</span>
    </div>
  )
}
