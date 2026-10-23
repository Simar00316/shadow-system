import type { Exercise } from '@/engine/types'
import { Icon } from './icons'

/** Looping demo: animated WebP, or a 2-frame crossfade for still pairs. Never upscaled past 180 px for licensed GIFs. */
export function ExerciseMedia({ ex, size = 180, credit = true }: { ex: Pick<Exercise, 'name' | 'media'>; size?: number; credit?: boolean }) {
  const px = ex.media.kind === 'anim' ? Math.min(size, 180) : size
  return (
    <figure className="flex flex-col items-center gap-1">
      <div className="overflow-hidden rounded-[var(--r-1)] bg-white" style={{ width: px, height: px }}>
        {ex.media.kind === 'anim' ? (
          <img src={ex.media.src[0]} alt={`${ex.name} demonstration`} width={px} height={px} className="h-full w-full object-contain" loading="lazy" />
        ) : ex.media.src.length ? (
          <div className="frames h-full w-full" role="img" aria-label={`${ex.name} demonstration`}>
            {ex.media.src.map((s) => <img key={s} src={s} alt="" loading="lazy" />)}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-dim"><Icon name="train" size={48} /></div>
        )}
      </div>
      {credit && ex.media.credit ? <figcaption className="text-[10px] text-dim">{ex.media.credit}</figcaption> : null}
    </figure>
  )
}
