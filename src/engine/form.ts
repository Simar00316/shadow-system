// Form analyser (PRD B3.11): joint angles from MediaPipe Pose landmarks, rep counting by phase detection with
// hysteresis, and per-lift rules (depth, knee tracking, back angle, lockout, tempo). Pure: frames in, reps out.
import type { FormLift } from './types'

/** MediaPipe Pose landmark (normalised image coords, y grows downward). */
export type Landmark = { x: number; y: number; z?: number; visibility?: number }
export type Frame = { t: number; lm: Landmark[] }

// MediaPipe Pose indices
export const L = { nose: 0, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16, lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28 } as const

const mid = (a: Landmark, b: Landmark): Landmark => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) })

/** Angle ABC in degrees at vertex B (0–180). */
export function angle(a: Landmark, b: Landmark, c: Landmark) {
  const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y }
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1)
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
}

/** Angle of the segment a→b from vertical (0 = upright), degrees. */
export const fromVertical = (a: Landmark, b: Landmark) => (Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180) / Math.PI

/** Pick the side facing the camera (higher landmark visibility). */
function side(lm: Landmark[]) {
  const vis = (i: number) => lm[i]?.visibility ?? 1
  const left = vis(L.lShoulder) + vis(L.lHip) + vis(L.lKnee) + vis(L.lElbow)
  const right = vis(L.rShoulder) + vis(L.rHip) + vis(L.rKnee) + vis(L.rElbow)
  return left >= right ? { s: L.lShoulder, e: L.lElbow, w: L.lWrist, h: L.lHip, k: L.lKnee, a: L.lAnkle } : { s: L.rShoulder, e: L.rElbow, w: L.rWrist, h: L.rHip, k: L.rKnee, a: L.rAnkle }
}

export type Metrics = { knee: number; hip: number; elbow: number; torso: number; body: number; valgus: number; armSwing: number; wristOverShoulder: number; hipBelowKnee: number }

/** All the angles the rules need for one frame. */
export function metrics(lm: Landmark[]): Metrics {
  const j = side(lm)
  const knee = angle(lm[j.h], lm[j.k], lm[j.a])
  const hip = angle(lm[j.s], lm[j.h], lm[j.k])
  const elbow = angle(lm[j.s], lm[j.e], lm[j.w])
  const shoulders = mid(lm[L.lShoulder], lm[L.rShoulder]), hips = mid(lm[L.lHip], lm[L.rHip])
  const torso = fromVertical(hips, shoulders)
  const body = angle(lm[j.s], lm[j.h], lm[j.a])
  // frontal-view knee valgus: knees closer together than ankles, relative to hip width
  const hipW = Math.abs(lm[L.lHip].x - lm[L.rHip].x) || 1
  const valgus = (Math.abs(lm[L.lAnkle].x - lm[L.rAnkle].x) - Math.abs(lm[L.lKnee].x - lm[L.rKnee].x)) / hipW
  const armSwing = fromVertical(lm[j.s], lm[j.e])
  const wristOverShoulder = lm[j.s].y - lm[j.w].y
  const hipBelowKnee = lm[j.h].y - lm[j.k].y
  return { knee, hip, elbow, torso, body, valgus, armSwing, wristOverShoulder, hipBelowKnee }
}

type Rule = { cue: string; failAt: 'bottom' | 'top' | 'any'; test: (m: Metrics, ctx: { bottom: Metrics; top: Metrics }) => boolean }
type LiftConfig = { signal: (m: Metrics) => number; top: number; bottom: number; topIsHigh: boolean; rules: Rule[]; label: string }

/**
 * Per-lift configuration. `signal` is the joint angle that moves through each rep; `top`/`bottom` are lenient counting
 * thresholds (a rep = top → bottom → top) so partial reps still count; the rules hold the strict depth/lockout standards. Rule thresholds come from common coaching standards (NSCA technique).
 */
export const LIFTS: Record<FormLift, LiftConfig> = {
  squat: {
    label: 'Squat', signal: (m) => m.knee, top: 160, bottom: 135, topIsHigh: true,
    rules: [
      { cue: 'Squat deeper: hips to knee level', failAt: 'bottom', test: (_, c) => c.bottom.knee <= 100 || c.bottom.hipBelowKnee >= -0.02 },
      { cue: 'Push your knees out', failAt: 'bottom', test: (_, c) => c.bottom.valgus < 0.25 },
      { cue: 'Keep your chest up', failAt: 'bottom', test: (_, c) => c.bottom.torso <= 55 },
      { cue: 'Stand all the way up', failAt: 'top', test: (_, c) => c.top.knee >= 165 },
    ],
  },
  pushup: {
    label: 'Push-up', signal: (m) => m.elbow, top: 150, bottom: 125, topIsHigh: true,
    rules: [
      { cue: 'Lower your chest further', failAt: 'bottom', test: (_, c) => c.bottom.elbow <= 100 },
      { cue: 'Keep your body in a straight line', failAt: 'any', test: (_, c) => c.bottom.body >= 155 && c.top.body >= 155 },
      { cue: 'Lock out at the top', failAt: 'top', test: (_, c) => c.top.elbow >= 160 },
    ],
  },
  deadlift: {
    label: 'Deadlift', signal: (m) => m.hip, top: 145, bottom: 125, topIsHigh: true,
    rules: [
      { cue: 'Finish with hips through', failAt: 'top', test: (_, c) => c.top.hip >= 165 },
      { cue: 'Hinge at the hips, chest over the bar', failAt: 'bottom', test: (_, c) => c.bottom.torso >= 25 && c.bottom.torso <= 80 },
      { cue: 'Do not squat the lift', failAt: 'bottom', test: (_, c) => c.bottom.knee >= 100 },
    ],
  },
  lunge: {
    label: 'Lunge', signal: (m) => m.knee, top: 155, bottom: 135, topIsHigh: true,
    rules: [
      { cue: 'Lower the back knee further', failAt: 'bottom', test: (_, c) => c.bottom.knee <= 105 },
      { cue: 'Keep your torso tall', failAt: 'bottom', test: (_, c) => c.bottom.torso <= 30 },
      { cue: 'Drive back to standing', failAt: 'top', test: (_, c) => c.top.knee >= 160 },
    ],
  },
  ohp: {
    label: 'Overhead press', signal: (m) => m.elbow, top: 145, bottom: 120, topIsHigh: true,
    rules: [
      { cue: 'Lock out overhead', failAt: 'top', test: (_, c) => c.top.elbow >= 160 && c.top.wristOverShoulder > 0.1 },
      { cue: 'Do not lean back: brace and squeeze the glutes', failAt: 'any', test: (_, c) => c.top.torso <= 15 },
      { cue: 'Lower to shoulder height', failAt: 'bottom', test: (_, c) => c.bottom.elbow <= 95 },
    ],
  },
  curl: {
    label: 'Curl', signal: (m) => m.elbow, top: 140, bottom: 70, topIsHigh: true,
    rules: [
      { cue: 'Curl all the way up', failAt: 'bottom', test: (_, c) => c.bottom.elbow <= 60 },
      { cue: 'Fully extend at the bottom', failAt: 'top', test: (_, c) => c.top.elbow >= 150 },
      { cue: 'Keep your elbows still: no swinging', failAt: 'any', test: (_, c) => c.bottom.armSwing <= 25 },
    ],
  },
}

export type Rep = { index: number; start: number; bottomAt: number; end: number; score: number; cues: string[]; eccentricSec: number; concentricSec: number }
export type FormState = { phase: 'top' | 'down' | 'bottom' | 'up' | 'idle'; reps: Rep[]; repStart: number; bottomAt: number; best: Metrics | null; topBefore: Metrics | null; smoothed: number | null; lastTop: Metrics | null }

export const initialForm = (): FormState => ({ phase: 'idle', reps: [], repStart: 0, bottomAt: 0, best: null, topBefore: null, smoothed: null, lastTop: null })

const visibleEnough = (lm: Landmark[]) => [L.lShoulder, L.rShoulder, L.lHip, L.rHip].every((i) => (lm[i]?.visibility ?? 1) >= 0.5)

/**
 * Feed one frame; returns the next state. A rep completes when the signal goes past `bottom` and returns past `top`.
 * Exponential smoothing (α 0.5) removes landmark jitter; hysteresis prevents double counts.
 */
export function step(state: FormState, frame: Frame, lift: FormLift): FormState {
  if (!frame.lm?.length || !visibleEnough(frame.lm)) return state
  const cfg = LIFTS[lift]
  const m = metrics(frame.lm)
  const raw = cfg.signal(m)
  const v = state.smoothed == null ? raw : state.smoothed * 0.5 + raw * 0.5
  const s: FormState = { ...state, smoothed: v }
  const atTop = v >= cfg.top, atBottom = v <= cfg.bottom
  const deeper = (a: Metrics | null) => !a || cfg.signal(m) < cfg.signal(a)
  switch (state.phase) {
    case 'idle':
      return atTop ? { ...s, phase: 'top', lastTop: m } : s
    case 'top':
      if (atTop) return { ...s, lastTop: !s.lastTop || cfg.signal(m) > cfg.signal(s.lastTop) ? m : s.lastTop }
      return { ...s, phase: 'down', repStart: frame.t, topBefore: s.lastTop, best: m }
    case 'down':
      if (atTop) return { ...s, phase: 'top' } // aborted descent
      if (atBottom) return { ...s, phase: 'bottom', bottomAt: frame.t, best: deeper(s.best) ? m : s.best }
      return { ...s, best: deeper(s.best) ? m : s.best }
    case 'bottom':
      if (!atBottom && v > cfg.bottom + 5) return { ...s, phase: 'up', best: s.best }
      return { ...s, best: deeper(s.best) ? m : s.best, bottomAt: deeper(s.best) ? frame.t : s.bottomAt }
    case 'up':
      if (atBottom) return { ...s, phase: 'bottom' }
      if (atTop) {
        const rep = scoreRep(lift, s.reps.length + 1, s.repStart, s.bottomAt, frame.t, s.best!, m, s.topBefore ?? m)
        return { ...s, phase: 'top', reps: [...s.reps, rep], lastTop: m, best: null }
      }
      return s
  }
}

function scoreRep(lift: FormLift, index: number, start: number, bottomAt: number, end: number, bottom: Metrics, topAfter: Metrics, topBefore: Metrics): Rep {
  const top = (a: Metrics, b: Metrics) => (LIFTS[lift].signal(a) >= LIFTS[lift].signal(b) ? a : b)
  const ctx = { bottom, top: top(topAfter, topBefore) }
  const cues = LIFTS[lift].rules.filter((r) => !r.test(bottom, ctx)).map((r) => r.cue)
  const eccentricSec = Math.max(0, (bottomAt - start) / 1000)
  const concentricSec = Math.max(0, (end - bottomAt) / 1000)
  if (eccentricSec < 0.6) cues.push('Slow down the lowering phase')
  const score = Math.max(0, Math.round(100 - cues.length * 20))
  return { index, start, bottomAt, end, score, cues, eccentricSec, concentricSec }
}

/** Analyse a whole clip (array of frames). */
export function analyse(frames: Frame[], lift: FormLift) {
  let s = initialForm()
  for (const f of frames) s = step(s, f, lift)
  return { reps: s.reps, setScore: setScore(s.reps) }
}

/** Per-set form score feeding the SENSE (PER) stat. */
export const setScore = (reps: Rep[]) => (reps.length ? Math.round(reps.reduce((a, r) => a + r.score, 0) / reps.length) : 0)
export const goodReps = (reps: Rep[]) => reps.filter((r) => r.score >= 80).length
