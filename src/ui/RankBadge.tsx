import type { Rank } from '@/engine/types'

const SIZES = { sm: 32, md: 56, lg: 96 } as const

export function rankColor(rank: Rank) {
  return rank === 'National' ? 'var(--rank-national)' : `var(--rank-${rank.toLowerCase()})`
}

/** Hexagonal rank badge E–S and National (original design). */
export function RankBadge({ rank, size = 'md', locked = false }: { rank: Rank; size?: keyof typeof SIZES; locked?: boolean }) {
  const px = SIZES[size]
  const color = locked ? 'var(--text-dim)' : rankColor(rank)
  const label = rank === 'National' ? 'N' : rank
  const id = `rb-${rank}-${size}`
  return (
    <svg width={px} height={px} viewBox="0 0 100 100" role="img" aria-label={`${rank} rank${locked ? ' (locked)' : ''}`} style={{ filter: locked ? undefined : `drop-shadow(0 0 ${px / 10}px ${color})` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {rank === 'National' && !locked ? (
            <>
              <stop offset="0" stopColor="#ff5a3c" />
              <stop offset="1" stopColor="#ffc94a" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={color} stopOpacity="0.35" />
              <stop offset="1" stopColor={color} stopOpacity="0.05" />
            </>
          )}
        </linearGradient>
      </defs>
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill={`url(#${id})`} fillOpacity={rank === 'National' && !locked ? 0.35 : 1} stroke={color} strokeWidth="3" />
      <polygon points="50,14 81,32 81,68 50,86 19,68 19,32" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
      {rank === 'S' || rank === 'National' ? <path d="M30 22l6 6M70 22l-6 6M50 8v8" stroke={color} strokeWidth="2" /> : null}
      <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fill={color} style={{ font: `900 ${label.length > 1 ? 30 : 44}px var(--font-display)` }}>
        {label}
      </text>
    </svg>
  )
}
