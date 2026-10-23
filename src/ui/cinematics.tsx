// Cinematic sequences from the motion spec (DESIGN.md §5): loot reveal, ARISE, level-up burst.
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { Rarity } from '@/engine/types'
import { ShadowArt, type Archetype } from './ShadowArt'
import { Button } from './controls'
import { Icon } from './icons'
import { TypedText } from './feedback'
import { sfx } from '@/audio/sfx'

const RARITY_COLOR: Record<Rarity, string> = { common: 'var(--rarity-common)', rare: 'var(--rarity-rare)', epic: 'var(--rarity-epic)', legendary: 'var(--rarity-legendary)' }

/** Box shakes, cracks with rarity light, item springs in. Tap to open. */
export function LootReveal({ rarity, name, detail, onDone }: { rarity: Rarity; name: string; detail?: string; onDone?: () => void }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(!!reduce)
  const color = RARITY_COLOR[rarity]
  useEffect(() => { if (open) sfx.play(`loot-${rarity}`) }, [open, rarity])
  return (
    <div className="relative flex min-h-64 flex-col items-center justify-center gap-3 overflow-hidden" aria-live="polite">
      {!open ? (
        <motion.button type="button" aria-label="Open the loot box" onClick={() => setOpen(true)} animate={{ rotate: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.8 }} className="flex h-28 w-28 items-center justify-center rounded-[var(--r-2)] border-2" style={{ borderColor: color, boxShadow: `0 0 24px ${color}` }}>
          <Icon name="inventory" size={56} style={{ color }} />
        </motion.button>
      ) : (
        <>
          {!reduce ? Array.from({ length: 12 }, (_, i) => (
            <motion.span key={i} className="ray" style={{ background: color, rotate: `${i * 30}deg` }} initial={{ scaleY: 0 }} animate={{ scaleY: 1, opacity: [0.7, 0] }} transition={{ duration: 0.9 }} />
          )) : null}
          <motion.div initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="relative flex flex-col items-center gap-2 text-center">
            <Icon name={rarity === 'legendary' ? 'crown' : 'gem'} size={64} style={{ color, filter: `drop-shadow(0 0 12px ${color})` }} />
            <div className="t-tag" style={{ color }}>{rarity}</div>
            <div className="t-heading text-text">{name}</div>
            {detail ? <div className="t-small text-dim">{detail}</div> : null}
          </motion.div>
          {onDone ? <Button variant="secondary" onClick={onDone}>Continue</Button> : null}
        </>
      )}
      <p className="sr-only">{open ? `${rarity} item: ${name}` : 'A loot box dropped.'}</p>
    </div>
  )
}

/** ARISE: dim, purple smoke rises, three attempt pulses, silhouette fades in, name types in (DESIGN.md §5). */
export function AriseSequence({ name, rank, archetype, seed, lore, onAccept }: { name: string; rank: string; archetype: Archetype; seed: string; lore?: string; onAccept: () => void }) {
  const reduce = useReducedMotion()
  const [stage, setStage] = useState(reduce ? 4 : 0)
  useEffect(() => {
    if (reduce) return
    sfx.play('arise')
    const ts = [400, 800, 1200, 1800].map((t, i) => setTimeout(() => setStage(i + 1), t))
    return () => ts.forEach(clearTimeout)
  }, [reduce])
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[rgb(2_3_9/.92)] px-6 text-center" role="dialog" aria-label="Shadow Extraction">
      <div className="t-tag text-purple-text">[ SHADOW EXTRACTION ]</div>
      <div className="relative flex h-72 items-end justify-center">
        <div className={reduce ? '' : 'smoke-rise'} style={{ opacity: stage >= 1 ? 1 : 0 }}>
          <motion.div animate={stage < 4 && !reduce ? { opacity: [0.2, 0.6, 0.2] } : { opacity: 1 }} transition={{ duration: 0.4, repeat: stage < 4 ? Infinity : 0 }}>
            <ShadowArt archetype={archetype} seed={seed} size={200} animate={!reduce} />
          </motion.div>
        </div>
      </div>
      {stage >= 4 ? (
        <>
          <motion.h2 className="t-hero glitch" style={{ color: 'var(--shadow-purple-text)', textShadow: '0 0 18px var(--shadow-purple)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>ARISE</motion.h2>
          <TypedText text={`[${name} has joined your army. Rank: ${rank}.]`} />
          {lore ? <p className="t-small max-w-sm text-dim">{lore}</p> : null}
          <Button variant="shadow" onClick={onAccept}>Accept</Button>
        </>
      ) : <p className="t-system text-purple-text">[Attempt {Math.max(1, stage)} of 3…]</p>}
    </div>
  )
}

/** Gold numeral, expanding ring and flash for a level-up. */
export function LevelUpBurst({ level }: { level: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden" aria-label={`Level up: ${level}`}>
      {!reduce ? <motion.span className="burst-ring" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.9 }} /> : null}
      <motion.div className="text-center" initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
        <div className="t-tag glitch text-gold">LEVEL UP</div>
        <div className="t-num-xl text-gold" style={{ textShadow: '0 0 20px var(--gold)' }}>{level}</div>
      </motion.div>
    </div>
  )
}
