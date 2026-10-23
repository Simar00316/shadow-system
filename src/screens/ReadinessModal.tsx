import { useState } from 'react'
import { Sheet } from '@/ui/layout'
import { Button } from '@/ui/controls'
import { checkIn } from '@/app/game'
import { sfx } from '@/audio/sfx'

const QUESTIONS = [
  { key: 'sleep', label: 'Sleep quality', low: 'Terrible', high: 'Great' },
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Charged' },
  { key: 'soreness', label: 'Soreness', low: 'None', high: 'Very sore' },
  { key: 'stress', label: 'Stress', low: 'Calm', high: 'Overwhelmed' },
] as const

type Answers = Record<(typeof QUESTIONS)[number]['key'], number>

/** 10-second daily readiness check-in (PRD F3.17). Shown on first open each day. */
export function ReadinessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [a, setA] = useState<Answers>({ sleep: 3, energy: 3, soreness: 2, stress: 2 })
  const [saving, setSaving] = useState(false)
  return (
    <Sheet open={open} onClose={onClose} title="[Readiness check-in]">
      <div className="flex flex-col gap-4">
        {QUESTIONS.map((q) => (
          <fieldset key={q.key}>
            <legend className="t-label mb-1 text-text">{q.label}</legend>
            <div className="flex gap-1" role="radiogroup" aria-label={q.label}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} type="button" role="radio" aria-checked={a[q.key] === v} onClick={() => { sfx.play('tap'); setA({ ...a, [q.key]: v }) }} className={`t-num h-12 flex-1 rounded-[var(--r-2)] border ${a[q.key] === v ? 'border-glow bg-[rgb(47_168_255/.18)] text-glow' : 'border-[color:var(--line)] text-dim'}`}>{v}</button>
              ))}
            </div>
            <div className="t-small mt-1 flex justify-between text-dim"><span>{q.low}</span><span>{q.high}</span></div>
          </fieldset>
        ))}
        <Button loading={saving} onClick={async () => { setSaving(true); await checkIn(a); setSaving(false); onClose() }}>Report to the System</Button>
      </div>
    </Sheet>
  )
}
