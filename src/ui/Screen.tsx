import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './icons'

/** Page frame: System tag header with optional back button; content is a column of SystemWindows. */
export function Screen({ tag, title, back, actions, children, wide }: { tag: string; title?: string; back?: string | boolean; actions?: ReactNode; children: ReactNode; wide?: boolean }) {
  const nav = useNavigate()
  return (
    <main className={`mx-auto flex w-full flex-col gap-3 px-4 ${wide ? 'max-w-[720px]' : 'max-w-[480px]'}`} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}>
      <header className="flex min-h-12 items-center gap-2">
        {back ? (
          <button type="button" aria-label="Back" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="-ml-2 flex h-12 w-12 items-center justify-center text-glow">
            <Icon name="back" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="t-tag text-glow">[ {tag} ]</div>
          {title ? <h1 className="t-title truncate text-text">{title}</h1> : null}
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
    <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[rgb(47_168_255/.08)] py-1 last:border-0">
      <span className="t-label text-dim">{label}</span>
      <span className="text-right text-text">{children}</span>
    </div>
  )
}
