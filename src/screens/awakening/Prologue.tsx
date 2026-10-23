import { useEffect, useState } from 'react'
import { Backdrop } from '@/ui/Backdrop'
import { TypedText } from '@/ui/feedback'
import { sfx, type SoundName } from '@/audio/sfx'

type Scene = { text: string; tone: 'portal' | 'red' | 'shadow'; big?: boolean; sound?: SoundName }

/** The story before the System appears (owner brief): the Gates open, you are ordinary, you nearly die, you wake up. */
const SCENES: Scene[] = [
  { text: 'Ten years ago, the first Gate opened.', tone: 'portal', big: true },
  { text: 'Rifts tore open above every city. Monsters poured through.', tone: 'red', sound: 'boss' },
  { text: 'A few people awakened strange powers. The world called them Hunters.', tone: 'portal' },
  { text: 'You were not one of them. Just an ordinary person, the weakest in any room.', tone: 'shadow' },
  { text: 'Then came the day you should have died.', tone: 'red', big: true, sound: 'arise' },
  { text: 'Somehow, you survived.', tone: 'shadow' },
  { text: 'The next morning, when you opened your eyes, something was waiting for you.', tone: 'portal', sound: 'notify' },
]

export const PROLOGUE_KEY = 'shadow-prologue-seen'
export const prologueSeen = () => { try { return localStorage.getItem(PROLOGUE_KEY) === '1' } catch { return true } }

/** Full-screen story intro: lines type in, auto-advance, tap to continue, Skip any time. Plays once per device. */
export function Prologue({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState(false)
  const scene = SCENES[i]
  const finish = () => { try { localStorage.setItem(PROLOGUE_KEY, '1') } catch { /* blocked */ } onDone() }
  const next = () => { if (i + 1 >= SCENES.length) finish(); else { setTyped(false); setI(i + 1) } }

  useEffect(() => { if (scene.sound) sfx.play(scene.sound) }, [i, scene.sound])
  // Auto-advance a moment after each line has finished typing.
  useEffect(() => {
    if (!typed) return
    const id = setTimeout(next, 2200)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, i])

  return (
    <main className="relative flex min-h-[100dvh] cursor-pointer select-none flex-col items-center justify-center px-6" onClick={() => (typed ? next() : undefined)} aria-live="polite">
      <Backdrop key={scene.tone} variant={scene.tone} />
      <div className="rift" data-tone={scene.tone} aria-hidden="true"><i /><i /><i /></div>
      <button type="button" onClick={(e) => { e.stopPropagation(); finish() }} className="press t-label absolute right-4 top-[calc(env(safe-area-inset-top)+12px)] rounded-full border border-[color:var(--edge)] px-4 py-2 text-dim">Skip</button>
      <div key={i} className="sys-in relative z-[1] w-full max-w-[420px] text-center" style={{ '--c-glow': scene.tone === 'red' ? '#ff7a90' : 'var(--glow)' } as React.CSSProperties}>
        <i className="sys-beam" aria-hidden="true" />
        <TypedText text={scene.text} onDone={() => setTyped(true)} className={`block text-text ${scene.big ? 't-moment text-[28px] leading-[36px]' : 'text-[21px] leading-[32px]'} ${scene.tone === 'red' ? 'text-[#ffd0d8] [text-shadow:0_0_18px_rgb(255_59_92/.55)]' : 'glow-text'}`} />
      </div>
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+28px)] flex flex-col items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">{SCENES.map((_, k) => <span key={k} className={`h-1 rounded-full transition-all ${k === i ? 'w-6 bg-glow' : 'w-2 bg-[rgb(47_168_255/.25)]'}`} />)}</div>
        <span className={`t-micro text-faint transition-opacity ${typed ? 'opacity-100' : 'opacity-0'}`}>Tap to continue</span>
      </div>
    </main>
  )
}
