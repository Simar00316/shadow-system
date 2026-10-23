import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, NumberStepper } from '@/ui/controls'
import { TypedText } from '@/ui/feedback'
import { useUnits } from '@/app/units'
import { activeWorkout, logSet, startWorkout, freeItem, updateItems } from '@/app/training'
import { awardMany } from '@/app/game'
import { goodReps, initialForm, LIFTS, setScore, step, type FormState, type Landmark } from '@/engine/form'
import { BASE_XP, MAX_FORM_REPS } from '@/engine/xp'
import { FORM_LIFTS, type FormLift } from '@/engine/types'
import { sfx } from '@/audio/sfx'

const PLACEMENT: Record<FormLift, string> = {
  squat: 'Place the phone at hip height, 2–3 m away, side-on. Your whole body must be visible.',
  pushup: 'Place the phone on the floor, side-on, about 2 m away, so head to feet are in frame.',
  deadlift: 'Side-on at hip height, 2–3 m away. Keep the bar path in view.',
  lunge: 'Side-on at hip height, 2–3 m away. Step forward, not across.',
  ohp: 'Side-on at chest height, 2 m away, so the lockout overhead stays in frame.',
  curl: 'Side-on at chest height, 1.5–2 m away. Upper arm and elbow must be visible.',
}
const BONES: [number, number][] = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]]

type Landmarker = { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: Landmark[][] }; close: () => void }

/** Load MediaPipe Pose Landmarker from self-hosted files; GPU delegate with CPU fallback (research/platform.md §7). */
async function loadLandmarker(): Promise<Landmarker> {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks('/wasm/mediapipe')
  const make = (delegate: 'GPU' | 'CPU') => PoseLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate }, runningMode: 'VIDEO', numPoses: 1 })
  try { return (await make('GPU')) as unknown as Landmarker } catch { return (await make('CPU')) as unknown as Landmarker }
}

/** Form Check (PRD F3.13): live skeleton, rep counter, form cues, per-set form score feeding SENSE. */
export function FormCheck() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const u = useUnits()
  const preset = useLiveQuery(async () => (params.get('exercise') ? db.exercises.get(params.get('exercise')!) : undefined), [params])
  const [chosen, setLift] = useState<FormLift | null>(null)
  const lift: FormLift = chosen ?? preset?.formCheck ?? 'squat'
  const [status, setStatus] = useState<'idle' | 'loading' | 'live' | 'error'>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(initialForm())
  const [fps, setFps] = useState(0)
  const [weight, setWeight] = useState(0)
  const [saved, setSaved] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const stream = useRef<MediaStream | null>(null)
  const model = useRef<Landmarker | null>(null)
  const state = useRef<FormState>(initialForm())

  useEffect(() => () => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); model.current?.close() }, [])

  const draw = (lm: Landmark[]) => {
    const c = canvas.current, v = video.current
    if (!c || !v) return
    c.width = v.videoWidth; c.height = v.videoHeight
    const g = c.getContext('2d')!
    g.clearRect(0, 0, c.width, c.height)
    g.strokeStyle = '#5cc8ff'; g.lineWidth = 4; g.shadowColor = '#5cc8ff'; g.shadowBlur = 8
    for (const [a, b] of BONES) { if (!lm[a] || !lm[b]) continue; g.beginPath(); g.moveTo(lm[a].x * c.width, lm[a].y * c.height); g.lineTo(lm[b].x * c.width, lm[b].y * c.height); g.stroke() }
    g.fillStyle = '#e6f1ff'
    for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) if (lm[i]) { g.beginPath(); g.arc(lm[i].x * c.width, lm[i].y * c.height, 5, 0, Math.PI * 2); g.fill() }
  }

  const start = async () => {
    setStatus('loading'); setError(''); setSaved('')
    try {
      // Ask for the camera inside the tap (iOS re-prompts per launch, R7 §3).
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      const v = video.current!
      v.srcObject = stream.current
      await v.play()
      model.current ??= await loadLandmarker()
      state.current = initialForm(); setForm(state.current)
      setStatus('live')
      let last = -1, frames = 0, since = performance.now()
      const loop = () => {
        if (v.currentTime !== last && v.readyState >= 2) {
          last = v.currentTime
          const res = model.current!.detectForVideo(v, performance.now())
          const lm = res.landmarks[0]
          if (lm) {
            draw(lm)
            const before = state.current.reps.length
            state.current = step(state.current, { t: performance.now(), lm }, lift)
            if (state.current.reps.length > before) { sfx.play(state.current.reps[state.current.reps.length - 1].score >= 80 ? 'set-logged' : 'error'); setForm(state.current) }
          }
          frames++
          if (performance.now() - since > 1000) { setFps(frames); frames = 0; since = performance.now() }
        }
        raf.current = requestAnimationFrame(loop)
      }
      loop()
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error && e.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'The camera or pose model could not start on this device.')
    }
  }

  const stop = () => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); setStatus('idle'); setForm(state.current) }

  const save = async () => {
    const reps = form.reps
    if (!reps.length) return
    const score = setScore(reps)
    const exerciseId = preset?.formCheck === lift ? preset.id : (await db.exercises.filter((e) => e.formCheck === lift && e.core).first())?.id
    if (!exerciseId) return
    let w = await activeWorkout()
    if (!w) w = (await db.workouts.get(await startWorkout({ items: [await freeItem(exerciseId)], name: `Form check: ${LIFTS[lift].label}` })))!
    else if (!(w.items ?? []).some((i) => i.exerciseId === exerciseId)) await updateItems(w.id, [...(w.items ?? []), await freeItem(exerciseId)])
    const done = await db.sets.where('workoutId').equals(w.id).filter((s) => s.exerciseId === exerciseId).count()
    const res = await logSet(w.id, { exerciseId, order: 0, setIndex: done, type: 'working', weightKg: u.kg(weight), reps: reps.length, rir: null, formScore: score })
    const already = (await db.xpEvents.where('type').equals('form_rep').filter((e) => e.day === w!.day).toArray()).reduce((a, e) => a + e.base, 0)
    const good = Math.min(goodReps(reps), MAX_FORM_REPS - already)
    if (good > 0) await awardMany([{ type: 'form_rep', refId: res.set.id, base: good * BASE_XP.formRep }])
    setSaved(`[Set recorded: ${reps.length} reps, form score ${score}. +${good} SENSE XP.]`)
    state.current = initialForm(); setForm(state.current)
  }

  const lastRep = form.reps[form.reps.length - 1]
  return (
    <Screen tag="FORM CHECK" title={LIFTS[lift].label} back>
      <SystemWindow tag="SETUP" animate={false}>
        <label className="flex flex-col gap-1">
          <span className="t-label text-dim">Lift</span>
          <select aria-label="Lift" value={lift} disabled={status === 'live'} onChange={(e) => setLift(e.target.value as FormLift)} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3">
            {FORM_LIFTS.map((l) => <option key={l} value={l}>{LIFTS[l].label}</option>)}
          </select>
        </label>
        <p className="t-system mt-2">[{PLACEMENT[lift]}]</p>
      </SystemWindow>
      <SystemWindow tag={status === 'live' ? `LIVE · ${fps} FPS` : 'CAMERA'} animate={false}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--r-1)] bg-black" style={{ transform: 'scaleX(-1)' }}>
          <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" aria-label="Camera preview" />
          <canvas ref={canvas} className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div><div className="t-label text-dim">Reps</div><div className="t-num-xl text-glow" aria-live="polite">{form.reps.length}</div></div>
          <div className="text-right"><div className="t-label text-dim">Set score</div><div className="t-num-lg text-gold">{form.reps.length ? setScore(form.reps) : '–'}</div></div>
        </div>
        {lastRep ? (lastRep.cues.length ? <ul className="mt-2 flex flex-col gap-1">{lastRep.cues.map((c) => <li key={c} className="t-system text-amber">[{c}]</li>)}</ul> : <p className="t-system mt-2 text-success">[Clean repetition.]</p>) : null}
        {status === 'error' ? <p role="alert" className="t-system mt-2 text-warning">[{error}]</p> : null}
        <div className="mt-3 flex gap-2">
          {status === 'live' ? <Button variant="danger" className="flex-1" onClick={stop}>Stop</Button> : <Button className="flex-1" icon="camera" loading={status === 'loading'} onClick={start}>{status === 'error' ? 'Retry' : 'Start camera'}</Button>}
        </div>
      </SystemWindow>
      {form.reps.length && status !== 'live' ? (
        <SystemWindow tag="RECORD SET" variant="reward" animate={false}>
          <NumberStepper label="Weight" value={weight} step={u.step} max={500} onChange={setWeight} unit={u.lift} />
          <Button variant="gold" className="mt-2 w-full" onClick={save}>Record this set</Button>
        </SystemWindow>
      ) : null}
      {saved ? <SystemWindow tag="SYSTEM" animate={false}><TypedText text={saved} /><Button variant="ghost" className="mt-2 w-full" onClick={() => nav('/train')}>Back to Train</Button></SystemWindow> : null}
    </Screen>
  )
}
