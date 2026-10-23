// System sound playback (DESIGN.md §6). Howler unlocks audio on the first user gesture (iOS requirement).
import { Howl, Howler } from 'howler'

export const SOUNDS = [
  'window-open', 'window-close', 'notify', 'tap', 'quest-accept', 'quest-clear', 'set-logged', 'rest-warn', 'rest-end',
  'level-up', 'rank-up', 'pr', 'loot-common', 'loot-rare', 'loot-epic', 'loot-legendary', 'penalty', 'arise', 'boss', 'error',
] as const
export type SoundName = (typeof SOUNDS)[number]

const VOLUME: Record<SoundName, number> = {
  'window-open': 0.5, 'window-close': 0.35, notify: 0.55, tap: 0.25, 'quest-accept': 0.55, 'quest-clear': 0.65,
  'set-logged': 0.45, 'rest-warn': 0.5, 'rest-end': 0.75, 'level-up': 0.75, 'rank-up': 0.8, pr: 0.75,
  'loot-common': 0.5, 'loot-rare': 0.6, 'loot-epic': 0.7, 'loot-legendary': 0.8, penalty: 0.7, arise: 0.8, boss: 0.75, error: 0.5,
}

const cache = new Map<SoundName, Howl>()
let enabled = true
let ambient: Howl | null = null
const canPlay = typeof window !== 'undefined' && 'AudioContext' in window

function howl(name: SoundName) {
  let h = cache.get(name)
  if (!h) {
    h = new Howl({ src: [`/sfx/${name}.wav`], volume: VOLUME[name], preload: true })
    cache.set(name, h)
  }
  return h
}

// Recover from iOS "interrupted" AudioContext after backgrounding (R7 §5).
if (canPlay) {
  document.addEventListener('visibilitychange', () => {
    const ctx = Howler.ctx as AudioContext | undefined
    if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') void ctx.resume().catch(() => {})
  })
}

export const sfx = {
  play(name: SoundName) {
    if (!enabled || !canPlay) return
    try { howl(name).play() } catch { /* audio is never critical */ }
  },
  setEnabled(on: boolean) { enabled = on; if (!on) ambient?.stop() },
  setVolume(v: number) { if (canPlay) Howler.volume(v) },
  /** iOS: let sounds play with the ring switch on silent (opt-in setting). */
  setPlayInSilentMode(on: boolean) {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = on ? 'playback' : 'ambient'
  },
  ambient(on: boolean) {
    if (!canPlay) return
    if (on && enabled) {
      ambient ??= new Howl({ src: ['/sfx/ambient.wav'], loop: true, volume: 0.25 })
      if (!ambient.playing()) ambient.play()
    } else ambient?.stop()
  },
  preload() { if (canPlay) SOUNDS.forEach(howl) },
}
