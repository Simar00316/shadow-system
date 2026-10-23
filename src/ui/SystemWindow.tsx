import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export type UiState = 'default' | 'active' | 'disabled' | 'loading' | 'error' | 'success'
export type WindowVariant = 'system' | 'alert' | 'shadow' | 'reward'

type Props = {
  tag?: string
  title?: ReactNode
  variant?: WindowVariant
  state?: UiState
  error?: string
  grid?: boolean
  /** Play the open animation (line trace + flicker). Off for windows that are always on screen. */
  animate?: boolean
  className?: string
  children?: ReactNode
  'aria-label'?: string
}

/** The holographic System window every screen is framed in (DESIGN.md §4, §5). */
export function SystemWindow({ tag, title, variant = 'system', state = 'default', error, grid, animate = true, className = '', children, ...rest }: Props) {
  return (
    <motion.section
      className={`sys-window ${className}`}
      data-variant={variant}
      data-state={state}
      data-grid={grid ? 'true' : undefined}
      aria-busy={state === 'loading' || undefined}
      aria-disabled={state === 'disabled' || undefined}
      aria-label={rest['aria-label'] ?? (typeof title === 'string' ? title : tag)}
      initial={animate ? { opacity: 0, scale: 0.96, filter: 'blur(6px)' } : false}
      animate={{ opacity: animate ? [0, 1, 0.4, 1] : 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14 } }}
      transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1], opacity: { duration: 0.26, times: [0, 0.4, 0.6, 1] } }}
    >
      {animate ? (
        <svg className="sys-trace" preserveAspectRatio="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="100%" height="100%" pathLength={1} style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }} />
        </svg>
      ) : null}
      <span className="sys-corner tl" />
      <span className="sys-corner tr" />
      <span className="sys-corner bl" />
      <span className="sys-corner br" />
      {tag ? <div className="sys-tag t-tag">{variant === 'alert' ? '⚠ ' : ''}{tag}</div> : null}
      {title ? <h2 className="t-title mb-3" style={{ color: 'var(--text)' }}>{title}</h2> : null}
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
    </motion.section>
  )
}
