// Original procedural shadow-soldier art: a black silhouette per archetype, purple smoke and glowing eyes.
import { useReducedMotion } from 'motion/react'

// Each shadow gets a stable variant from its seed (crest, weapon, horns), so no two look identical.

export const ARCHETYPES = ['knight', 'beast', 'insect', 'wyvern', 'mage', 'giant', 'assassin', 'serpent'] as const
export type Archetype = (typeof ARCHETYPES)[number]

const BODY: Record<Archetype, string> = {
  knight: 'M100 40c-14 0-22 10-22 24v10l-26 14-8 52 16 4 8-34 6 26-6 70h22l10-56 10 56h22l-6-70 6-26 8 34 16-4-8-52-26-14V64c0-14-8-24-22-24z',
  beast: 'M40 120c0-30 20-52 50-56l10-22 12 20c30 4 50 24 50 52l8 30-14 4-10-22-8 50h-18l-2-40H82l-4 40H60l-6-50-10 22-14-4z',
  insect: 'M100 48c-12 0-18 10-18 20l-30-26-6 6 30 34-34 6 2 10 36-4c-4 10-6 20-6 32l-26 34 8 6 26-28c4 30 10 46 18 52 8-6 14-22 18-52l26 28 8-6-26-34c0-12-2-22-6-32l36 4 2-10-34-6 30-34-6-6-30 26c0-10-6-20-18-20z',
  wyvern: 'M100 70l-10-24 4-14 12 10 4 26 60-30-20 50 30-4-40 40-14 50h-20l-6-40-8 40H72l-4-56-50-34 34 2-24-46 58 30z',
  mage: 'M100 30l-16 40c-14 4-24 14-28 30l-8 120h104l-8-120c-4-16-14-26-28-30z',
  giant: 'M100 24c-20 0-30 14-30 30v8c-26 6-40 22-44 44l-6 52 20 4 10-36 6 40-10 74h34l12-60h16l12 60h34l-10-74 6-40 10 36 20-4-6-52c-4-22-18-38-44-44v-8c0-16-10-30-30-30z',
  assassin: 'M100 36c-12 0-20 10-20 22v14l-24 10-20 50 14 6 18-36 4 40-10 78h20l14-64 4 0 14 64h20l-10-78 4-40 18 36 14-6-20-50-24-10V58c0-12-8-22-20-22z',
  serpent: 'M70 220c-30-10-30-50 10-56 40-6 50-30 30-50-14-14-14-40 6-52l-8-18 18 12 10-14 4 20c18 14 16 40-2 56-20 18-10 34 22 40 30 6 34 44 4 58z',
}

const EYES: Record<Archetype, [number, number][]> = {
  knight: [[92, 60], [108, 60]],
  beast: [[118, 60], [130, 58]],
  insect: [[92, 62], [108, 62]],
  wyvern: [[98, 44], [106, 44]],
  mage: [[93, 74], [107, 74]],
  giant: [[90, 48], [110, 48]],
  assassin: [[93, 54], [107, 54]],
  serpent: [[110, 52], [120, 50]],
}

function hash(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function ShadowArt({ archetype, seed, size = 160, animate = true }: { archetype: Archetype; seed: string; size?: number; animate?: boolean }) {
  const reduce = useReducedMotion()
  const h = hash(seed)
  const anim = animate && !reduce
  const id = `sh-${h.toString(36)}`
  const horns = h % 3 === 0
  const weapon = (h >> 3) % 3 // 0 none, 1 blade, 2 spear
  const crest = (h >> 5) % 2 === 0
  return (
    <svg width={size} height={(size * 6) / 5} viewBox="0 0 200 240" role="img" aria-label={`${archetype} shadow`}>
      <defs>
        <radialGradient id={`${id}-aura`} cx="50%" cy="60%" r="55%">
          <stop offset="0" stopColor="#7b2ff7" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#3a1373" stopOpacity="0.25" />
          <stop offset="1" stopColor="#05070f" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-smoke`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={h % 1000}>
            {anim ? <animate attributeName="baseFrequency" dur="9s" values="0.035;0.05;0.035" repeatCount="indefinite" /> : null}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="14" />
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="2.5" /></filter>
      </defs>
      <ellipse cx="100" cy="140" rx="96" ry="104" fill={`url(#${id}-aura)`} />
      <g filter={`url(#${id}-smoke)`} fill="#0b0716" stroke="#7b2ff7" strokeOpacity="0.55" strokeWidth="2">
        <path d={BODY[archetype]} />
        {horns ? <path d="M84 52l-12-26 18 18M116 52l12-26-18 18" /> : null}
        {crest ? <path d="M100 28l-6 -16 6 6 6 -6z" /> : null}
        {weapon === 1 ? <path d="M160 80l8-4 -24 120-6-2z" /> : null}
        {weapon === 2 ? <path d="M36 30l4-2 10 200-6 0z M34 26l8-14 6 14z" /> : null}
      </g>
      <path d="M20 236c30-16 50-8 80-16s50 8 80-6" stroke="#7b2ff7" strokeOpacity="0.5" strokeWidth="6" fill="none" filter={`url(#${id}-glow)`} />
      {EYES[archetype].map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx="5" ry="2.4" fill="#c9a6ff" filter={`url(#${id}-glow)`} />
          <ellipse cx={x} cy={y} rx="3" ry="1.3" fill="#f2e9ff" />
        </g>
      ))}
    </svg>
  )
}
