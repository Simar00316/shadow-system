import type { ClassId } from '@/engine/types'

// Original class emblems: a shield frame + a geometric glyph per class (design/DESIGN.md §9).
const GLYPH: Record<ClassId, React.ReactNode> = {
  fighter: <><path d="M50 20v52M38 64h24M44 72h12" /><path d="M50 20l-6 10h12z" /></>,
  tank: <><path d="M30 34h40v18c0 12-9 20-20 24-11-4-20-12-20-24z" /><path d="M40 46h20M50 36v28" /></>,
  assassin: <><path d="M36 70L64 26M64 70L36 26" /><path d="M30 48h40" strokeDasharray="4 4" /></>,
  ranger: <><path d="M36 24c22 8 22 44 0 52" /><path d="M36 24v52M30 50h40M62 44l8 6-8 6" /></>,
  healer: <><path d="M50 26v48M30 50h40" /><circle cx="50" cy="50" r="14" /></>,
  knight: <><path d="M50 18v56M36 62h28" /><path d="M34 36l16-14 16 14v10H34z" /></>,
  berserker: <><path d="M32 72l36-46M68 72L32 26" /><path d="M24 30l14-6 4 12M76 30l-14-6-4 12" /></>,
  juggernaut: <><path d="M28 30h44v22c0 14-10 22-22 26-12-4-22-12-22-26z" /><path d="M38 40l12 10 12-10M38 54l12 10 12-10" /></>,
  shadow_assassin: <><path d="M34 72L66 24M66 72L34 24" /><circle cx="50" cy="48" r="20" strokeDasharray="3 5" /></>,
  striker: <><path d="M56 20L38 52h14l-6 28 20-36H52z" /></>,
  monk: <><circle cx="50" cy="48" r="20" /><path d="M50 28a10 10 0 010 20 10 10 0 000 20" /><circle cx="50" cy="38" r="2.5" /><circle cx="50" cy="58" r="2.5" /></>,
  shadow_monarch: <><path d="M28 64l4-28 10 12 8-18 8 18 10-12 4 28z" /><path d="M40 52h.01M60 52h.01" strokeWidth="5" /></>,
}

const COLOR: Partial<Record<ClassId, string>> = {
  shadow_monarch: 'var(--shadow-purple-text)',
  shadow_assassin: 'var(--shadow-purple-text)',
}

export function Emblem({ cls, size = 64, active = true }: { cls: ClassId; size?: number; active?: boolean }) {
  const color = active ? (COLOR[cls] ?? 'var(--system-blue)') : 'var(--text-dim)'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${cls.replace('_', ' ')} emblem`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: active ? `drop-shadow(0 0 6px ${color})` : undefined }}>
      <path d="M50 6l36 14v28c0 24-16 40-36 46C30 88 14 72 14 48V20z" strokeWidth="2" strokeOpacity="0.7" />
      <path d="M50 12l30 12v24c0 20-13 34-30 39-17-5-30-19-30-39V24z" strokeWidth="1" strokeOpacity="0.35" />
      {GLYPH[cls]}
    </svg>
  )
}
