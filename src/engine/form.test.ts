// M10 gate: rep count within ±1 on recorded test clips for every supported lift, plus form-rule detection.
import { analyse, angle, fromVertical, goodReps, initialForm, LIFTS, metrics, setScore, step } from './form'
import { synthClip } from '../../tests/fixtures/form/synth'
import { FORM_LIFTS, type FormLift } from './types'

describe.each(FORM_LIFTS)('%s', (lift) => {
  it.each([[1, 1], [5, 2], [8, 3], [12, 4]])('counts %i reps within ±1 (seed %i)', (reps, seed) => {
    const { reps: got } = analyse(synthClip(lift, reps, { seed }), lift)
    expect(Math.abs(got.length - reps)).toBeLessThanOrEqual(1)
  })
  it('survives heavier landmark noise and a low frame rate', () => {
    const { reps } = analyse(synthClip(lift, 6, { seed: 9, noise: 0.008, fps: 12 }), lift)
    expect(Math.abs(reps.length - 6)).toBeLessThanOrEqual(1)
  })
  it('clean reps score well and earn SENSE', () => {
    const { reps, setScore: s } = analyse(synthClip(lift, 5, { seed: 7 }), lift)
    expect(s).toBeGreaterThanOrEqual(80)
    expect(goodReps(reps)).toBeGreaterThanOrEqual(4)
  })
})

const FAULTS: [FormLift, string, RegExp][] = [
  ['squat', 'shallow', /deeper/], ['squat', 'lean', /chest up/], ['squat', 'valgus', /knees out/],
  ['pushup', 'shallow', /Lower your chest/], ['pushup', 'sag', /straight line/],
  ['deadlift', 'soft', /hips through/],
  ['lunge', 'shallow', /back knee/], ['lunge', 'lean', /torso tall/],
  ['ohp', 'soft', /Lock out/], ['ohp', 'arch', /lean back/],
  ['curl', 'swing', /no swinging/],
]

test.each(FAULTS)('%s fault "%s" triggers its cue', (lift, fault, cue) => {
  const { reps, setScore: s } = analyse(synthClip(lift, 4, { seed: 3, fault }), lift)
  expect(reps.length).toBeGreaterThanOrEqual(3)
  expect(reps.every((r) => r.cues.some((c) => cue.test(c)))).toBe(true)
  expect(s).toBeLessThan(90)
})

test('fast lowering is flagged as tempo', () => {
  const { reps } = analyse(synthClip('squat', 4, { seed: 4, fast: true }), 'squat')
  expect(reps.some((r) => r.cues.includes('Slow down the lowering phase'))).toBe(true)
})

test('geometry helpers', () => {
  expect(angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(90)
  expect(angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 })).toBeCloseTo(180)
  expect(angle({ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBeCloseTo(90)
  expect(fromVertical({ x: 0, y: 1 }, { x: 0, y: 0 })).toBeCloseTo(0)
  expect(fromVertical({ x: 0, y: 1 }, { x: 1, y: 0 })).toBeCloseTo(45)
  expect(Object.keys(LIFTS).sort()).toEqual([...FORM_LIFTS].sort())
})

test('frames with low visibility or no landmarks are ignored', () => {
  const s = initialForm()
  expect(step(s, { t: 0, lm: [] }, 'squat')).toBe(s)
  const clip = synthClip('squat', 1)
  const hidden = clip.map((f) => ({ ...f, lm: f.lm.map((p) => ({ ...p, visibility: 0.1 })) }))
  expect(analyse(hidden, 'squat').reps).toHaveLength(0)
  expect(setScore([])).toBe(0)
  expect(metrics(clip[0].lm).knee).toBeGreaterThan(160)
})

test('an aborted descent does not count as a rep', () => {
  const frames = synthClip('squat', 2, { seed: 5 })
  // splice a half-depth dip that returns to the top
  const top = frames[0]
  const half = synthClip('squat', 1, { seed: 5, fault: 'shallow' }).slice(0, 30)
  const clip = [...frames, ...half.map((f) => ({ ...f, t: f.t + 100_000 })), { ...top, t: 200_000 }]
  expect(analyse(clip, 'squat').reps.length).toBeLessThanOrEqual(3)
})
