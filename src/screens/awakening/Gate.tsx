import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button } from '@/ui/controls'
import { TypedText } from '@/ui/feedback'
import { Backdrop } from '@/ui/Backdrop'
import { Icon } from '@/ui/icons'
import { Boot } from '@/ui/Boot'
import { sfx } from '@/audio/sfx'
import { Prologue, prologueSeen } from './Prologue'

export const isIosSafari = () => typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
export const isStandalone = () => typeof window !== 'undefined' && ((navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches)

const loadFlow = () => import('./Awakening')
const Flow = lazy(() => loadFlow().then((m) => ({ default: m.Awakening })))

/**
 * Entry to the Awakening: the install guide and the System's offer render from a tiny chunk so the first screen
 * paints fast; the full onboarding (steps, test, class choice) loads in the background and takes over on Accept.
 */
export function AwakeningGate() {
  const nav = useNavigate()
  const [phase, setPhase] = useState<'install' | 'prologue' | 'intro' | 'declined' | 'flow'>(isIosSafari() && !isStandalone() ? 'install' : prologueSeen() ? 'intro' : 'prologue')
  // A Player who already exists (e.g. installed before the awakened hint) goes back to their Status screen.
  const hasProfile = () => import('@/db/schema').then(({ db }) => db.profile.get('me')).then((p) => !!p).catch(() => false)
  useEffect(() => {
    const id = setTimeout(() => {
      void hasProfile().then((p) => { if (p) { try { localStorage.setItem('shadow-awakened', '1') } catch { /* blocked */ } nav('/', { replace: true }) } })
      void loadFlow().catch(() => undefined)
    }, 1200)
    return () => clearTimeout(id)
  }, [nav])
  const accept = async () => {
    sfx.play('quest-accept')
    if (await hasProfile()) { nav('/', { replace: true }); return }
    setPhase('flow')
  }

  if (phase === 'flow') return <Suspense fallback={<Boot />}><Flow start="form" /></Suspense>
  if (phase === 'prologue') return <Prologue onDone={() => setPhase('intro')} />
  if (phase === 'install') {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col justify-center gap-4 px-4">
        <Backdrop variant="portal" />
        <SystemWindow tag="SYSTEM" title="Install the System" hero>
          <ol className="flex flex-col">
            {[<>Tap <Icon name="share" size={18} className="inline align-text-bottom text-glow" /> Share in Safari.</>, <>Choose <b className="text-text">Add to Home Screen</b>.</>, <>Open Shadow System from your Home Screen.</>].map((step, i) => (
              <li key={i} className="flex items-center gap-3 border-t border-[color:var(--hairline)] py-3 first:border-t-0">
                <span className="well t-num h-8 w-8 text-[14px]">{i + 1}</span>
                <span className="t-row text-dim">{step}</span>
              </li>
            ))}
          </ol>
          <p className="t-small mt-2 text-faint">[Notifications, full offline play and storage protection require the installed app.]</p>
          <Button className="mt-4 w-full" variant="ghost" onClick={() => setPhase(prologueSeen() ? 'intro' : 'prologue')}>Continue in the browser</Button>
        </SystemWindow>
      </main>
    )
  }
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col justify-center gap-4 px-4 py-8">
      <Backdrop variant="portal" />
      <SystemWindow tag="NOTIFICATION" hero>
        <TypedText key={phase} text={phase === 'intro' ? '[You have acquired the qualifications to be a Player. Will you accept?]' : '[Refusal noted. The offer remains open.]'} className="block text-[19px] leading-[28px] text-text glow-text" />
        <Button className="mt-8 min-h-14 w-full" onClick={() => void accept()}>Accept</Button>
        <Button variant="ghost" className="mt-1 w-full" onClick={() => { sfx.play('error'); setPhase('declined') }}>Decline</Button>
      </SystemWindow>
    </main>
  )
}
