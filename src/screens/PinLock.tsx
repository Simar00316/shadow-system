import { useState } from 'react'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button } from '@/ui/controls'
import { Backdrop } from '@/ui/Backdrop'
import { checkPin } from '@/app/pin'

/** App PIN gate shown once per app session. Wrong PINs slow down after three tries. */
export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [tries, setTries] = useState(0)
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    if (tries >= 3) await new Promise((r) => setTimeout(r, 1000 * 2 ** Math.min(5, tries - 3)))
    const ok = await checkPin(pin)
    setBusy(false)
    if (ok) onUnlock()
    else { setTries(tries + 1); setPin('') }
  }
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Backdrop variant="portal" />
      <SystemWindow tag="LOCKED" className="w-full max-w-sm">
        <p className="t-system">[Identify yourself, Player.]</p>
        <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void submit() }}>
          <input type="password" inputMode="numeric" autoComplete="current-password" autoFocus aria-label="PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} className="t-num min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3 text-center text-[24px] tracking-[0.4em]" />
          {tries ? <p role="alert" className="t-system text-warning">[Incorrect PIN.]</p> : null}
          <Button type="submit" loading={busy} disabled={pin.length < 4}>Unlock</Button>
        </form>
      </SystemWindow>
    </main>
  )
}
