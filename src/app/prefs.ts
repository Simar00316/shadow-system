// UI preferences: remembered per device (localStorage) and mirrored into the Dexie settings table for backups.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sfx } from '@/audio/sfx'

export type Prefs = {
  sound: boolean
  volume: number
  ambient: boolean
  silentMode: boolean
  reduceMotion: boolean
  effortMode: 'rir' | 'rpe'
  set: (p: Partial<Omit<Prefs, 'set'>>) => void
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({ sound: true, volume: 0.8, ambient: false, silentMode: false, reduceMotion: false, effortMode: 'rir', set: (p) => set(p) }),
    { name: 'shadow-prefs' },
  ),
)

/** Push preferences into the audio layer and the document (reduced motion attribute for CSS). */
export function applyPrefs(p: Pick<Prefs, 'sound' | 'volume' | 'ambient' | 'silentMode' | 'reduceMotion'>) {
  sfx.setEnabled(p.sound)
  sfx.setVolume(p.volume)
  sfx.setPlayInSilentMode(p.silentMode)
  sfx.ambient(p.ambient)
  if (typeof document !== 'undefined') document.documentElement.dataset.reduceMotion = String(p.reduceMotion)
}

usePrefs.subscribe((p) => applyPrefs(p))
