// System sound playback (DESIGN.md §6). Howler unlocks audio on the first user gesture (iOS requirement).
// Howler is loaded on first use (first tap or first sound), so it never costs startup time.
import type { Howl as HowlT } from 'howler'

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
export const SFX_EXT = 'wav'

type HowlerMod = typeof import('howler')
const cache = new Map<SoundName, HowlT>()
let mod: HowlerMod | null = null
let loading: Promise<HowlerMod> | null = null
let enabled = true
let volume = 1
let wantAmbient = false
let ambient: HowlT | null = null
const canPlay = typeof window !== 'undefined' && 'AudioContext' in window

function load() {
  loading ??= import('howler').then((m) => {
    mod = m
    m.Howler.volume(volume)
    // Recover from iOS "interrupted" AudioContext after backgrounding (R7 §5).
    document.addEventListener('visibilitychange', () => {
      const ctx = m.Howler.ctx as AudioContext | undefined
      if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') void ctx.resume().catch(() => {})
    })
    if (wantAmbient) startAmbient()
    return m
  })
  return loading
}

function howl(name: SoundName) {
  let h = cache.get(name)
  if (!h && mod) {
    h = new mod.Howl({ src: [`/sfx/${name}.${SFX_EXT}`], volume: VOLUME[name], preload: true })
    cache.set(name, h)
  }
  return h
}

function startAmbient() {
  if (!mod || !enabled || !wantAmbient) return
  ambient ??= new mod.Howl({ src: [`/sfx/ambient.${SFX_EXT}`], loop: true, volume: 0.25 })
  if (!ambient.playing()) ambient.play()
}

// The first tap anywhere loads the engine so the first real sound is not delayed.
if (canPlay) addEventListener('pointerdown', () => void load().catch(() => {}), { once: true, capture: true })

export const sfx = {
  play(name: SoundName) {
    if (!enabled || !canPlay) return
    const go = () => { try { howl(name)?.play() } catch { /* audio is never critical */ } }
    if (mod) go()
    else void load().then(go).catch(() => {})
  },
  setEnabled(on: boolean) { enabled = on; if (!on) ambient?.stop(); else startAmbient() },
  setVolume(v: number) { volume = v; mod?.Howler.volume(v) },
  /** iOS: let sounds play with the ring switch on silent (opt-in setting). */
  setPlayInSilentMode(on: boolean) {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = on ? 'playback' : 'ambient'
  },
  ambient(on: boolean) {
    if (!canPlay) return
    wantAmbient = on
    if (on) { if (mod) startAmbient(); else if (enabled) void load().catch(() => {}) } else ambient?.stop()
  },
  preload() { if (canPlay) void load().then(() => SOUNDS.forEach(howl)).catch(() => {}) },
}
