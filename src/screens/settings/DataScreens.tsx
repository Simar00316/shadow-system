import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen, Row } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, Tabs } from '@/ui/controls'
import { TypedText } from '@/ui/feedback'
import { useExercises, useProfile } from '@/app/hooks'
import { commitImport, matchExercises, parseImport, type Match, type ParsedImport } from '@/app/importers'
import { progressReport, REPORT_WEEKS } from '@/app/report'
import { saveFile } from '@/app/backup'
import { dayOf } from '@/engine/dates'

const input = 'min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3'

/** Hevy / Strong CSV import with a review screen for exercise names (PRD B3.13). */
export function ImportScreen() {
  const nav = useNavigate()
  const profile = useProfile()
  const library = useExercises()
  const [unit, setUnit] = useState<'kg' | 'lb'>(profile?.units.lift ?? 'kg')
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [error, setError] = useState('')
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [matches, setMatches] = useState<Match[]>([])
  const [done, setDone] = useState('')
  const byId = useMemo(() => new Map(library.map((e) => [e.id, e])), [library])
  const sorted = useMemo(() => [...library].sort((a, b) => a.name.localeCompare(b.name)), [library])

  const read = async (t: string, u = unit) => {
    setText(t); setDone('')
    const p = parseImport(t, u)
    if (!p) { setError('This is not a Hevy or Strong export. Export the CSV from the app in English and try again.'); setParsed(null); return }
    setError('')
    const names = [...new Set(p.workouts.flatMap((w) => w.sets.map((s) => s.exercise)))]
    const m = matchExercises(names, await db.exercises.toArray())
    setMatches(m)
    setMapping(Object.fromEntries(m.map((x) => [x.name, x.confidence === 'none' ? null : x.exerciseId])))
    setParsed(p)
  }

  const review = matches.filter((m) => m.confidence !== 'exact')
  const sets = parsed?.workouts.reduce((a, w) => a + w.sets.length, 0) ?? 0
  return (
    <Screen tag="IMPORT" title="Import history" back="/settings">
      <SystemWindow tag="FILE" animate={false}>
        <p className="t-small text-dim">Hevy: Settings → Export & Import Data → Export Workouts. Strong: Settings → Export Strong Data. Imported workouts join your history and lift records; they award no XP.</p>
        <label className="mt-2 flex min-h-12 items-center justify-center rounded-[var(--r-1)] border border-[color:var(--line)] text-glow">
          Choose CSV file
          <input type="file" accept=".csv,text/csv" aria-label="CSV file" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await read(await f.text()) }} />
        </label>
        {parsed?.source === 'strong' ? (
          <label className="mt-2 flex min-h-12 items-center justify-between gap-3"><span>Weights in the file are in</span>
            <select aria-label="Weight unit" value={unit} onChange={(e) => { const u = e.target.value as 'kg' | 'lb'; setUnit(u); void read(text, u) }} className={input}><option value="kg">kg</option><option value="lb">lb</option></select>
          </label>
        ) : null}
        {error ? <p role="alert" className="t-system mt-2 text-warning">[{error}]</p> : null}
      </SystemWindow>

      {parsed ? (
        <>
          <SystemWindow tag="FOUND" animate={false}>
            <Row label="Source">{parsed.source === 'hevy' ? 'Hevy' : 'Strong'}</Row>
            <Row label="Workouts">{parsed.workouts.length}</Row>
            <Row label="Sets">{sets}</Row>
            <Row label="Exercises matched">{matches.length - review.length} of {matches.length}</Row>
          </SystemWindow>
          {review.length ? (
            <SystemWindow tag={`REVIEW · ${review.length}`} animate={false}>
              <p className="t-small mb-2 text-dim">Check each suggested match. Choose “Skip” to leave an exercise out.</p>
              <ul className="flex flex-col gap-3">
                {review.map((m) => (
                  <li key={m.name} className="flex flex-col gap-1">
                    <span>{m.name}</span>
                    <select aria-label={`Match for ${m.name}`} value={mapping[m.name] ?? ''} onChange={(e) => setMapping({ ...mapping, [m.name]: e.target.value || null })} className={input}>
                      <option value="">Skip this exercise</option>
                      {m.suggestions.length ? <optgroup label="Suggested">{m.suggestions.map((id) => <option key={id} value={id}>{byId.get(id)?.name ?? id}</option>)}</optgroup> : null}
                      <optgroup label="All exercises">{sorted.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
                    </select>
                  </li>
                ))}
              </ul>
            </SystemWindow>
          ) : null}
          <Button variant="gold" className="w-full" onClick={async () => {
            const r = await commitImport(parsed, mapping)
            setDone(`[Import complete: ${r.workouts} workouts, ${r.sets} sets, ${r.cardio} cardio sessions.${r.duplicates ? ` ${r.duplicates} already imported.` : ''}${r.skippedSets ? ` ${r.skippedSets} sets skipped.` : ''}]`)
          }}>Import {parsed.workouts.length} workouts</Button>
        </>
      ) : null}
      {done ? <SystemWindow tag="SYSTEM" animate={false}><TypedText text={done} /><Button variant="ghost" className="mt-2 w-full" onClick={() => nav('/progress')}>View progress</Button></SystemWindow> : null}
    </Screen>
  )
}

/** AI-ready progress report: copy or share one Markdown file (PRD B5). */
export function ReportScreen() {
  const [weeks, setWeeks] = useState<(typeof REPORT_WEEKS)[number]>(4)
  const [copied, setCopied] = useState(false)
  const md = useLiveQuery(() => progressReport(weeks), [weeks], '')
  const count = useLiveQuery(() => db.workouts.count(), [], 0)
  const copy = async () => {
    try { await navigator.clipboard.writeText(md); setCopied(true) } catch { setCopied(false) }
  }
  return (
    <Screen tag="REPORT" title="Progress report" back="/settings">
      <SystemWindow tag="PERIOD" animate={false}>
        <Tabs label="Period" value={String(weeks) as '2' | '4' | '12'} onChange={(v) => setWeeks(Number(v) as 2 | 4 | 12)} tabs={REPORT_WEEKS.map((w) => ({ id: String(w) as '2' | '4' | '12', label: `${w} weeks` }))} />
        <p className="t-small mt-2 text-dim">Paste this report into any AI assistant and ask about your training and nutrition. It is generated on this device{count ? '' : ' (log some workouts first for a useful report)'}.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button icon="copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          <Button variant="secondary" icon="share" onClick={() => void saveFile(`shadow-report-${dayOf()}.md`, md, 'text/markdown')}>Share</Button>
        </div>
      </SystemWindow>
      <SystemWindow tag="PREVIEW" animate={false}>
        {/* Visible text fallback: long-press to copy if the clipboard is unavailable (R7 §11). */}
        <textarea aria-label="Report" readOnly value={md} className="t-num h-96 w-full resize-y rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel p-2 text-[12px]" />
      </SystemWindow>
    </Screen>
  )
}
