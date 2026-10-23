import { useEffect, useRef, useState } from 'react'
import { Button } from '@/ui/controls'

/**
 * Camera barcode scanner: the `barcode-detector` ponyfill over self-hosted zxing-wasm (research/platform.md §8;
 * Safari has no native BarcodeDetector). EAN-13 / EAN-8 / UPC-A / UPC-E. Manual entry is always available.
 */
export function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle')
  const [manual, setManual] = useState('')
  const stream = useRef<MediaStream | null>(null)

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), [])

  const start = async () => {
    setState('starting')
    try {
      const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill')
      prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? '/wasm/zxing_reader.wasm' : prefix + path) }, fireImmediately: true })
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      const v = video.current!
      v.srcObject = stream.current
      await v.play()
      setState('scanning')
      let done = false
      const tick = async () => {
        if (done || !video.current) return
        try {
          const hits = await detector.detect(v)
          if (hits[0]?.rawValue) { done = true; stream.current?.getTracks().forEach((t) => t.stop()); onCode(hits[0].rawValue); return }
        } catch { /* keep scanning */ }
        setTimeout(tick, 250)
      }
      void tick()
    } catch {
      setState('error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--r-1)] border border-[color:var(--line)] bg-black">
        {/* never display:none the live video on iOS (R7 §3) */}
        <video ref={video} playsInline muted className="h-full w-full object-cover" aria-label="Camera preview" />
        {state === 'scanning' ? <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-warning shadow-[0_0_10px_var(--warning)]" /> : null}
        {state !== 'scanning' ? <div className="absolute inset-0 flex items-center justify-center p-4 text-center"><Button variant="secondary" icon="barcode" loading={state === 'starting'} onClick={start}>{state === 'error' ? 'Camera unavailable. Retry' : 'Start camera'}</Button></div> : null}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) onCode(manual.trim()) }}>
        <input inputMode="numeric" aria-label="Barcode number" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or type the barcode" className="min-h-12 flex-1 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" />
        <Button type="submit" variant="secondary">Look up</Button>
      </form>
    </div>
  )
}
