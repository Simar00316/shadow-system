import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { isWarm } from './fx'

export type UiState = 'default' | 'active' | 'disabled' | 'loading' | 'error' | 'success'
export type WindowVariant = 'system' | 'alert' | 'shadow' | 'reward'

type Props = {
  tag?: string
  title?: ReactNode
  variant?: WindowVariant
  state?: UiState
  error?: string
  /** Hero grade: the System speaking (angular, brackets, glow). One per screen. Alert/reward/shadow are always hero. */
  hero?: boolean
  /** @deprecated kept for older call sites; the hero grade carries the grid. */
  grid?: boolean
  /** Materialise on mount (design-v2 §4.7a). Skipped on the cold-start screen. */
  animate?: boolean
  /** Stagger position on the screen (0 = first). */
  index?: number
  className?: string
  /** Anchor for the first-visit tutorial (src/ui/Tour.tsx). */
  tour?: string
  children?: ReactNode
  'aria-label'?: string
}

/**
 * A System window. Default grade is a quiet card (rounded, hairline edge); `hero` is the full System frame
 * (DESIGN.md §4, research/design-v2.md §4.4). No filters or backdrop blur: depth comes from rims and gradients.
 */
export function SystemWindow({ tag, title, variant = 'system', state = 'default', error, hero, animate = true, index = 0, className = '', tour, children, ...rest }: Props) {
  // Decide once per mount so re-renders never replay the entrance.
  const [enter] = useState(() => animate && isWarm())
  const grade = hero || variant !== 'system' ? 'hero' : 'card'
  return (
    <section
      className={`sys-window ${enter ? 'sys-in' : ''} ${className}`}
      style={enter ? ({ '--i': Math.min(index, 5) } as CSSProperties) : undefined}
      data-variant={variant}
      data-grade={grade}
      data-tour={tour}
      data-state={state}
      aria-busy={state === 'loading' || undefined}
      aria-disabled={state === 'disabled' || undefined}
      aria-label={rest['aria-label'] ?? (typeof title === 'string' ? title : tag)}
    >
      {enter ? <i className="sys-beam" aria-hidden="true" /> : null}
      {variant === 'alert' ? <i className="sys-pulse" aria-hidden="true" /> : null}
      {tag ? <div className="sys-head sys-tag t-micro">{variant === 'alert' ? '⚠ ' : ''}{tag}</div> : null}
      {title ? <h2 className="sys-title t-h2 mb-3 text-text">{title}</h2> : null}
      {state === 'loading' ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ) : (
        children
      )}
      {state === 'error' && error ? <p role="alert" className="t-system mt-3" style={{ color: 'var(--warning)' }}>[{error}]</p> : null}
    </section>
  )
}
