import { motion } from 'motion/react'
import { useState } from 'react'
import bodymap from '@/data/bodymap.json'
import type { Muscle, Sex } from '@/engine/types'
import { Icon } from './icons'

type Face = 'front' | 'back'
type Part = { muscle: string | null; slug: string; side: string; d: string }
const MAP = bodymap as Record<Sex, Record<Face, { viewBox: string; parts: Part[] }>>

export const MUSCLE_LABEL: Record<Muscle, string> = {
  neck: 'Neck', traps: 'Traps', chest: 'Chest', front_delts: 'Front delts', side_delts: 'Side delts', rear_delts: 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs', obliques: 'Obliques', lats: 'Lats',
  upper_back: 'Upper back', lower_back: 'Lower back', glutes: 'Glutes', hip_flexors: 'Hip flexors', quads: 'Quads',
  hamstrings: 'Hamstrings', adductors: 'Adductors', abductors: 'Abductors', calves: 'Calves',
}

/** 0–100 recovery → red (0–30) → amber (30–70) → green (70–100), DESIGN.md §3.2. */
export function recoveryColor(pct: number) {
  return pct < 30 ? 'var(--warning)' : pct < 70 ? 'var(--amber)' : 'var(--success)'
}

export function musclesOnFace(sex: Sex, face: Face) {
  return [...new Set(MAP[sex][face].parts.map((p) => p.muscle).filter(Boolean))] as Muscle[]
}

/**
 * Anatomical figure with every muscle as its own selectable path (MuscleMap MIT data, restyled).
 * mode "target": tap to toggle muscles. mode "recovery": heatmap; tap reports the muscle.
 */
export function BodyMap({ sex, face: faceProp, mode = 'target', selected = [], recovery, highlight, onSelect, height = 420, showFlip = true, disabled }: {
  sex: Sex; face?: Face; mode?: 'target' | 'recovery' | 'view'; selected?: Muscle[]; recovery?: Partial<Record<Muscle, number>>; highlight?: { primary: Muscle[]; secondary: Muscle[] }; onSelect?: (m: Muscle) => void; height?: number; showFlip?: boolean; disabled?: boolean
}) {
  const [own, setOwn] = useState<Face>('front')
  const face = faceProp ?? own
  const view = MAP[sex][face]
  const fill = (m: Muscle | null) => {
    if (!m) return 'rgb(124 141 181 / .12)'
    if (mode === 'recovery') return recoveryColor(recovery?.[m] ?? 100)
    if (highlight) return highlight.primary.includes(m) ? 'var(--system-blue)' : highlight.secondary.includes(m) ? 'rgb(47 168 255 / .4)' : 'rgb(47 168 255 / .08)'
    return selected.includes(m) ? 'var(--glow)' : 'rgb(47 168 255 / .14)'
  }
  return (
    <div className="flex flex-col items-center gap-2" style={{ opacity: disabled ? 0.4 : 1 }}>
      <motion.svg
        key={`${sex}-${face}`}
        viewBox={view.viewBox}
        height={height}
        style={{ maxWidth: '100%' }}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.21, ease: 'easeOut' }}
        role="group"
        aria-label={`${sex} body, ${face} view`}
      >
        {view.parts.map((p, i) => {
          const m = p.muscle as Muscle | null
          const interactive = m && onSelect && !disabled && mode !== 'view'
          const label = m ? `${MUSCLE_LABEL[m]}${mode === 'recovery' ? ` ${Math.round(recovery?.[m] ?? 100)}% recovered` : selected.includes(m) ? ' (selected)' : ''}` : undefined
          return (
            <path
              key={i}
              d={p.d}
              data-muscle={m ?? undefined}
              fill={fill(m)}
              fillOpacity={mode === 'recovery' && m ? 0.85 : 1}
              stroke={m ? 'rgb(92 200 255 / .55)' : 'rgb(124 141 181 / .3)'}
              strokeWidth={2}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive && p.side !== 'right' ? 0 : undefined}
              aria-label={interactive && p.side !== 'right' ? label : undefined}
              aria-pressed={interactive && mode === 'target' && p.side !== 'right' ? selected.includes(m!) : undefined}
              style={{ cursor: interactive ? 'pointer' : undefined, transition: 'fill .2s' }}
              onClick={interactive ? () => onSelect!(m!) : undefined}
              onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect!(m!) } } : undefined}
            >
              {label ? <title>{label}</title> : null}
            </path>
          )
        })}
      </motion.svg>
      {showFlip && !faceProp ? (
        <button type="button" className="t-label flex min-h-12 items-center gap-2 px-4 text-glow" onClick={() => setOwn(face === 'front' ? 'back' : 'front')}>
          <Icon name="flip" size={20} /> {face === 'front' ? 'Show back' : 'Show front'}
        </button>
      ) : null}
    </div>
  )
}
