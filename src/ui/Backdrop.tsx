// Original backgrounds: gate portal (blue/purple/red) and dungeon grid with drifting particles. CSS-only motion.
import type { CSSProperties } from 'react'

type Variant = 'portal' | 'shadow' | 'red' | 'dungeon'

const TINT: Record<Variant, [string, string]> = {
  portal: ['rgb(47 168 255 / 0.28)', 'rgb(23 60 140 / 0.18)'],
  shadow: ['rgb(123 47 247 / 0.32)', 'rgb(50 12 110 / 0.2)'],
  red: ['rgb(255 59 92 / 0.28)', 'rgb(110 10 30 / 0.2)'],
  dungeon: ['rgb(47 168 255 / 0.1)', 'rgb(10 20 40 / 0.2)'],
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  delay: `${(i * 0.7) % 9}s`,
  dur: `${8 + ((i * 3) % 7)}s`,
  size: 1 + (i % 3),
}))

export function Backdrop({ variant = 'portal', particles = true }: { variant?: Variant; particles?: boolean }) {
  const [a, b] = TINT[variant]
  const style: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', background:
      variant === 'dungeon'
        ? `radial-gradient(ellipse at 50% 0%, ${a}, transparent 60%), var(--grid), var(--bg)`
        : `radial-gradient(ellipse 60% 38% at 50% 34%, ${a}, transparent 70%), radial-gradient(ellipse 90% 60% at 50% 40%, ${b}, transparent 80%), var(--bg)`,
    backgroundSize: variant === 'dungeon' ? 'auto, 28px 28px, auto' : undefined,
  }
  return (
    <div aria-hidden="true" style={style} className="backdrop">
      {variant !== 'dungeon' ? (
        <svg className="backdrop-swirl" viewBox="0 0 400 400" style={{ position: 'absolute', left: '50%', top: '34%', width: 520, height: 520, transform: 'translate(-50%, -50%)', opacity: 0.5 }}>
          {[150, 120, 92, 66, 42].map((r, i) => (
            <ellipse key={r} cx="200" cy="200" rx={r} ry={r * 0.82} fill="none" stroke={a.replace(/0\.\d+\)/, `${0.5 - i * 0.07})`)} strokeWidth={1.5} strokeDasharray={`${8 + i * 6} ${10 + i * 4}`} />
          ))}
        </svg>
      ) : null}
      {particles
        ? PARTICLES.map((p, i) => (
            <span key={i} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur, background: variant === 'shadow' ? '#a77bff' : variant === 'red' ? '#ff7a90' : '#5cc8ff' }} />
          ))
        : null}
    </div>
  )
}
