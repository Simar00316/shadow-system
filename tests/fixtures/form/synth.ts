// Synthetic "recorded" pose clips: a 2D kinematic stick figure driven through known reps, with MediaPipe-style
// landmarks, jitter, tempo variation and optional faults. Deterministic per seed. (Real-video validation: owner task.)
import type { Frame, Landmark } from '@/engine/form'
import { L } from '@/engine/form'
import type { FormLift } from '@/engine/types'
import { rng } from '@/engine/rng'

const D = Math.PI / 180
const dir = (deg: number) => ({ x: Math.sin(deg * D), y: -Math.cos(deg * D) }) // 0° = straight up, +x forward
const add = (p: Landmark, d: { x: number; y: number }, len: number): Landmark => ({ x: p.x + d.x * len, y: p.y + d.y * len })
const SEG = { shin: 0.2, thigh: 0.22, torso: 0.28, upper: 0.15, fore: 0.14 }

type Pose = { knee: number; shin?: number; torso: number; elbow: number; arm?: number; valgus?: number; mode?: 'stand' | 'plank' | 'hang' }

/** Build 33 landmarks for a pose (left side faces the camera). */
function landmarks(p: Pose): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.3 }))
  let shoulder: Landmark, hip: Landmark, knee: Landmark, ankle: Landmark, elbow: Landmark, wrist: Landmark
  if (p.mode === 'plank') {
    // wrist fixed on the floor, shoulder above it, body line to the ankle
    wrist = { x: 0.35, y: 0.82 }
    const d = Math.sqrt(SEG.upper ** 2 + SEG.fore ** 2 - 2 * SEG.upper * SEG.fore * Math.cos(p.elbow * D))
    shoulder = { x: wrist.x, y: wrist.y - d }
    const a = Math.acos((SEG.upper ** 2 + d ** 2 - SEG.fore ** 2) / (2 * SEG.upper * d))
    elbow = { x: shoulder.x + Math.sin(a) * SEG.upper, y: shoulder.y + Math.cos(a) * SEG.upper }
    ankle = { x: 0.92, y: 0.82 }
    const sag = p.torso // reuse: degrees of hip sag below the line
    hip = { x: (shoulder.x + ankle.x) / 2, y: (shoulder.y + ankle.y) / 2 + Math.tan(sag * D) * 0.25 }
    knee = { x: (hip.x + ankle.x) / 2, y: (hip.y + ankle.y) / 2 }
  } else {
    ankle = { x: 0.5, y: 0.9 }
    const shinA = p.shin ?? (180 - p.knee) * 0.35
    knee = add(ankle, dir(shinA), SEG.shin)
    hip = add(knee, dir(shinA + 180 + p.knee), SEG.thigh)
    shoulder = add(hip, dir(p.torso), SEG.torso)
    const armA = p.arm ?? 0
    if (p.mode === 'hang') {
      // arm hangs from the shoulder; elbow angle closes the forearm forward-up (curl) or overhead (press)
      elbow = add(shoulder, dir(180 + armA), SEG.upper)
      wrist = add(elbow, dir(180 + armA - (180 - p.elbow)), SEG.fore)
    } else {
      // pressing: the upper arm rises from forward-down (bar at the shoulders) to vertical as the elbow opens
      const prog = Math.max(0, Math.min(1, (p.elbow - 80) / 95))
      const up = 120 * (1 - prog) + armA
      elbow = add(shoulder, dir(up), SEG.upper)
      wrist = add(elbow, dir(up - (180 - p.elbow)), SEG.fore)
    }
  }
  const put = (i: number, q: Landmark, vis: number) => { lm[i] = { ...q, visibility: vis } }
  const v = p.valgus ?? 0
  // left (near) side
  put(L.lShoulder, shoulder, 0.95); put(L.lElbow, elbow, 0.95); put(L.lWrist, wrist, 0.9); put(L.lHip, hip, 0.95); put(L.lKnee, { ...knee, x: knee.x + v * 0.01 }, 0.95); put(L.lAnkle, ankle, 0.9)
  // right (far) side, offset for body width
  const off = (q: Landmark, dx: number): Landmark => ({ x: q.x + dx, y: q.y })
  put(L.rShoulder, off(shoulder, 0.08), 0.6); put(L.rElbow, off(elbow, 0.08), 0.5); put(L.rWrist, off(wrist, 0.08), 0.5); put(L.rHip, off(hip, 0.08), 0.6); put(L.rKnee, off(knee, 0.08 - v * 0.01), 0.6); put(L.rAnkle, off(ankle, 0.08), 0.5)
  put(L.nose, add(shoulder, dir(p.torso), 0.08), 0.9)
  return lm
}

type Spec = { top: Pose; bottom: Pose }
const SPECS: Record<FormLift, (fault?: string) => Spec> = {
  squat: (f) => ({ top: { knee: 175, torso: 10, elbow: 60, arm: 40 }, bottom: { knee: f === 'shallow' ? 118 : 85, torso: f === 'lean' ? 65 : 35, elbow: 60, arm: 40, valgus: f === 'valgus' ? 3 : 0 } }),
  pushup: (f) => ({ top: { mode: 'plank', knee: 180, torso: f === 'sag' ? 25 : 0, elbow: 170 }, bottom: { mode: 'plank', knee: 180, torso: f === 'sag' ? 25 : 0, elbow: f === 'shallow' ? 112 : 85 } }),
  deadlift: (f) => ({ top: { knee: 175, shin: 0, torso: f === 'soft' ? 25 : 2, elbow: 175, arm: 0, mode: 'hang' }, bottom: { knee: 150, shin: 8, torso: 60, elbow: 175, arm: 0, mode: 'hang' } }),
  lunge: (f) => ({ top: { knee: 175, torso: 5, elbow: 175, mode: 'hang' }, bottom: { knee: f === 'shallow' ? 120 : 92, torso: f === 'lean' ? 40 : 10, elbow: 175, mode: 'hang' } }),
  ohp: (f) => ({ top: { knee: 178, torso: f === 'arch' ? 25 : 2, elbow: f === 'soft' ? 150 : 175 }, bottom: { knee: 178, torso: 2, elbow: 82 } }),
  curl: (f) => ({ top: { knee: 178, torso: 2, elbow: 165, arm: 0, mode: 'hang' }, bottom: { knee: 178, torso: 2, elbow: 45, arm: f === 'swing' ? 38 : 4, mode: 'hang' } }),
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function mixPose(a: Pose, b: Pose, t: number): Pose {
  const n = (k: keyof Pose) => (typeof a[k] === 'number' && typeof b[k] === 'number' ? lerp(a[k] as number, b[k] as number, t) : (a[k] as number | undefined))
  return { ...a, knee: n('knee')!, torso: n('torso')!, elbow: n('elbow')!, arm: n('arm'), shin: n('shin'), valgus: n('valgus') }
}

/** A clip of `reps` reps at `fps`, with tempo jitter and landmark noise. Faults apply to every rep. */
export function synthClip(lift: FormLift, reps: number, opts: { seed?: number; fps?: number; fault?: string; noise?: number; fast?: boolean } = {}): Frame[] {
  const r = rng(opts.seed ?? 1)
  const fps = opts.fps ?? 20
  const noise = opts.noise ?? 0.004
  const spec = SPECS[lift](opts.fault)
  const frames: Frame[] = []
  let t = 0
  const hold = (pose: Pose, sec: number) => { for (let i = 0; i < sec * fps; i++) emit(pose) }
  const move = (a: Pose, b: Pose, sec: number) => { const n = Math.max(2, Math.round(sec * fps)); for (let i = 0; i <= n; i++) emit(mixPose(a, b, (1 - Math.cos((i / n) * Math.PI)) / 2)) }
  const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += r(); return (s - 3) / 3 }
  function emit(p: Pose) {
    const lm = landmarks(p).map((q) => ({ ...q, x: q.x + gauss() * noise, y: q.y + gauss() * noise }))
    frames.push({ t: Math.round(t), lm })
    t += 1000 / fps
  }
  hold(spec.top, 0.8)
  for (let i = 0; i < reps; i++) {
    const ecc = (opts.fast ? 0.35 : 1.2) * (0.8 + r() * 0.4), con = 0.8 * (0.8 + r() * 0.4)
    move(spec.top, spec.bottom, ecc)
    hold(spec.bottom, 0.15 + r() * 0.2)
    move(spec.bottom, spec.top, con)
    hold(spec.top, 0.3 + r() * 0.4)
  }
  hold(spec.top, 0.5)
  return frames
}
