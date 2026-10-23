// Plan generator (PRD B3.1): split by days/week, exercises by recommender, sets/reps/load/rest by class table,
// session length fitted to the time budget, weekly volume balanced inside the MAV band and under the safe cap.
import type { ClassId, Equipment, Exercise, Experience, Goal, Muscle, Pattern, Sex } from './types'
import type { Plan, PlanDay, PlanExercise } from './model'
import { baseOf, prescribe, secondsPerSet, type DayType } from './prescription'
import { recommend, type Pref } from './recommend'
import { capFor, MAIN_MUSCLES, WEEKLY_TARGET } from './safety'
import { roundToEquipment, weightFor } from './strength'

type Slot = { muscles: Muscle[]; patterns: Pattern[] }
type DayTemplate = { name: string; slots: Slot[] }

const S = (patterns: Pattern[], muscles: Muscle[]): Slot => ({ patterns, muscles })
const SQUAT = S(['squat'], ['quads', 'glutes'])
const HINGE = S(['hinge'], ['hamstrings', 'glutes', 'lower_back'])
const LUNGE = S(['lunge', 'squat'], ['quads', 'glutes'])
const HPUSH = S(['horizontal_push'], ['chest'])
const VPUSH = S(['vertical_push'], ['front_delts', 'side_delts'])
const HPULL = S(['horizontal_pull'], ['upper_back', 'lats'])
const VPULL = S(['vertical_pull'], ['lats'])
const LATERAL = S(['raise'], ['side_delts'])
const REAR = S(['horizontal_pull', 'fly', 'raise'], ['rear_delts'])
const FLY = S(['fly'], ['chest'])
const CURL = S(['curl'], ['biceps'])
const TRI = S(['extension', 'horizontal_push'], ['triceps'])
const QUAD_ISO = S(['extension'], ['quads'])
const HAM_CURL = S(['curl'], ['hamstrings'])
const CALF = S(['raise'], ['calves'])
const CORE = S(['crunch', 'rotation'], ['abs', 'obliques'])
const SHRUG = S(['raise'], ['traps'])
const PLYO = S(['plyo'], ['quads', 'glutes', 'calves'])
const CARRY = S(['carry', 'hinge'], ['forearms', 'traps', 'glutes'])
const ST = (m: Muscle) => S(['stretch'], [m])

const FULL_A: DayTemplate = { name: 'Full Body A', slots: [SQUAT, HPUSH, HPULL, HINGE, VPUSH, CORE, CURL, CALF] }
const FULL_B: DayTemplate = { name: 'Full Body B', slots: [HINGE, VPULL, LUNGE, S(['horizontal_push'], ['chest', 'front_delts']), LATERAL, TRI, CORE, HAM_CURL] }
const FULL_C: DayTemplate = { name: 'Full Body C', slots: [LUNGE, HPUSH, VPULL, HINGE, REAR, CURL, CORE, CALF] }
const UPPER_A: DayTemplate = { name: 'Upper A', slots: [HPUSH, HPULL, VPUSH, VPULL, LATERAL, CURL, TRI, REAR] }
const UPPER_B: DayTemplate = { name: 'Upper B', slots: [VPUSH, VPULL, S(['horizontal_push'], ['chest', 'front_delts']), HPULL, FLY, TRI, CURL, SHRUG] }
const LOWER_A: DayTemplate = { name: 'Lower A', slots: [SQUAT, HINGE, LUNGE, HAM_CURL, CALF, CORE, QUAD_ISO] }
const LOWER_B: DayTemplate = { name: 'Lower B', slots: [HINGE, SQUAT, QUAD_ISO, HAM_CURL, S(['hinge', 'lunge'], ['glutes', 'abductors']), CALF, CORE] }
const PUSH: DayTemplate = { name: 'Push', slots: [HPUSH, VPUSH, S(['horizontal_push', 'fly'], ['chest']), LATERAL, TRI, S(['extension'], ['triceps'])] }
const PULL: DayTemplate = { name: 'Pull', slots: [VPULL, HPULL, REAR, CURL, SHRUG, S(['curl'], ['biceps', 'forearms'])] }
const LEGS: DayTemplate = { name: 'Legs', slots: [SQUAT, HINGE, LUNGE, QUAD_ISO, HAM_CURL, CALF, CORE] }
const MOBILITY_A: DayTemplate = { name: 'Mobility A', slots: [ST('hamstrings'), ST('hip_flexors'), ST('chest'), ST('lats'), ST('quads'), CORE, S(['hinge'], ['glutes']), S(['horizontal_pull'], ['rear_delts', 'upper_back'])] }
const MOBILITY_B: DayTemplate = { name: 'Mobility B', slots: [ST('glutes'), ST('lower_back'), ST('calves'), ST('upper_back'), ST('adductors'), S(['crunch'], ['abs']), S(['lunge', 'squat'], ['quads']), S(['raise', 'fly'], ['rear_delts', 'side_delts'])] }
const CIRCUIT_A: DayTemplate = { name: 'Circuit A', slots: [SQUAT, HPUSH, HPULL, PLYO, CORE, LUNGE, VPUSH] }
const CIRCUIT_B: DayTemplate = { name: 'Circuit B', slots: [HINGE, VPULL, S(['horizontal_push'], ['chest', 'triceps']), CARRY, CORE, LUNGE, LATERAL] }
const ATHLETE_A: DayTemplate = { name: 'Athletic A', slots: [PLYO, SQUAT, HPUSH, VPULL, CARRY, CORE] }
const ATHLETE_B: DayTemplate = { name: 'Athletic B', slots: [PLYO, HINGE, VPUSH, HPULL, LUNGE, CORE] }

export type SplitName = 'full_body' | 'upper_lower' | 'ppl' | 'ulppl' | 'mobility' | 'circuit' | 'athletic'

export function chooseSplit(days: number, experience: Experience, cls: ClassId): { name: SplitName; days: DayTemplate[] } {
  const base = baseOf(cls)
  const n = Math.max(1, Math.min(6, days))
  const cycle = (t: DayTemplate[]) => Array.from({ length: n }, (_, i) => t[i % t.length])
  if (base === 'healer') return { name: 'mobility', days: cycle([MOBILITY_A, MOBILITY_B]) }
  if (base === 'assassin') return { name: 'circuit', days: cycle([CIRCUIT_A, CIRCUIT_B]) }
  if (base === 'ranger' && experience !== 'beginner') return { name: 'athletic', days: cycle([ATHLETE_A, ATHLETE_B]) }
  if (n <= 3 || experience === 'beginner') return { name: 'full_body', days: cycle(n === 2 ? [FULL_A, FULL_B] : [FULL_A, FULL_B, FULL_C]) }
  if (n === 4) return { name: 'upper_lower', days: [UPPER_A, LOWER_A, UPPER_B, LOWER_B] }
  if (n === 5) return { name: 'ulppl', days: [UPPER_A, LOWER_A, PUSH, PULL, LEGS] }
  return { name: 'ppl', days: cycle([PUSH, PULL, LEGS]) }
}

export type PlanInput = {
  experience: Experience; cls: ClassId; sex: Sex; age: number; goal: Goal
  equipment: Equipment[]; injured: Muscle[]; trainingDays: number[]; sessionMinutes: number
  prefs?: Map<string, Pref>
  /** Known 1RM (kg) per exercise id, from history. */
  oneRm?: Map<string, number>
  /** Awakening e1RM entries for the big four. */
  lifts?: Partial<Record<'squat' | 'bench' | 'deadlift' | 'ohp', number>>
  /** 1-based training week, drives the beginner on-ramp. */
  week?: number
  deload?: boolean
}

/** Map an exercise to one of the big four if it is that barbell lift. */
export function bigFour(ex: Pick<Exercise, 'name' | 'pattern' | 'equipment'>): 'squat' | 'bench' | 'deadlift' | 'ohp' | null {
  if (!ex.equipment.includes('barbell')) return null
  const n = ex.name.toLowerCase()
  if (ex.pattern === 'squat' && /squat/.test(n) && !/front|box|hack|zercher|overhead|split/.test(n)) return 'squat'
  if (ex.pattern === 'horizontal_push' && /bench press/.test(n) && !/incline|decline|close|reverse/.test(n)) return 'bench'
  if (/deadlift/.test(n) && !/romanian|stiff|rack|deficit|single|sumo/.test(n)) return 'deadlift'
  if (ex.pattern === 'vertical_push' && /(military|overhead|shoulder) press/.test(n) && !/seated|behind|push press/.test(n)) return 'ohp'
  return null
}

const minutesFor = (pe: Pick<PlanExercise, 'sets' | 'repMax' | 'restSec' | 'holdSec'>) => (pe.sets * (secondsPerSet(pe) + pe.restSec)) / 60 + 1.5

export function estimateDuration(pes: Pick<PlanExercise, 'sets' | 'repMax' | 'restSec' | 'holdSec'>[]) {
  return Math.round(pes.reduce((a, p) => a + minutesFor(p), 0) + (pes.length ? 5 : 0))
}

let seq = 0
const defaultId = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`

export function generatePlan(input: PlanInput, exercises: Exercise[], id: (prefix: string) => string = defaultId): { plan: Plan; days: PlanDay[]; exercises: PlanExercise[] } {
  const days = [...input.trainingDays].sort((a, b) => a - b)
  const split = chooseSplit(days.length || 3, input.experience, input.cls)
  const base = baseOf(input.cls)
  const plan: Plan = { id: id('plan'), createdAt: Date.now(), split: split.name, source: 'generated', active: true, edited: false, week: input.week ?? 1 }
  const outDays: PlanDay[] = []
  const outEx: PlanExercise[] = []
  const used = new Set<string>()
  const dayTypes: DayType[] = ['heavy', 'light', 'medium']

  split.days.forEach((tpl, i) => {
    const day: PlanDay = { id: id('day'), planId: plan.id, order: i, weekday: days[i] ?? (i * 2) % 7, name: tpl.name, focus: [...new Set(tpl.slots.flatMap((s) => s.muscles))] }
    if (split.name === 'athletic') day.dayType = dayTypes[i % 3]
    outDays.push(day)
    const today = new Set<string>()
    let minutes = 5
    for (const slot of tpl.slots) {
      const pool = exercises.filter((e) => slot.patterns.includes(e.pattern) && e.primary.some((m) => slot.muscles.includes(m)) && !today.has(e.id))
      const pick = recommend(pool, slot.muscles, { equipment: input.equipment, baseClass: base, prefs: input.prefs, recent: used, injured: input.injured, experience: input.experience }, 1)[0]?.ex
      if (!pick) continue
      const rx = prescribe(pick, { cls: input.cls, experience: input.experience, sex: input.sex, age: input.age, week: input.week, dayType: day.dayType, deload: input.deload })
      const pe: PlanExercise = {
        id: id('pe'), planDayId: day.id, order: today.size, exerciseId: pick.id, sets: rx.sets, repMin: rx.repMin, repMax: rx.repMax, rir: rx.rir,
        loadKg: startLoad(pick, rx.repMax, rx.rir, input), restSec: rx.restSec, holdSec: rx.holdSec, edited: false,
        technique: rx.technique ?? (rx.holdSec ? 'hold' : 'straight'),
      }
      if (split.name === 'circuit') pe.group = `${day.id}-circuit`
      // A deload keeps the same exercises: budget time with the normal (non-deload) set count.
      const cost = minutesFor(input.deload ? { ...pe, sets: prescribe(pick, { cls: input.cls, experience: input.experience, sex: input.sex, age: input.age, week: input.week, dayType: day.dayType }).sets } : pe)
      if (today.size >= 3 && minutes + cost > input.sessionMinutes) break
      minutes += cost
      today.add(pick.id)
      used.add(pick.id)
      outEx.push(pe)
    }
  })
  balanceVolume(outEx, exercises, input)
  return { plan, days: outDays, exercises: outEx }
}

function startLoad(ex: Exercise, reps: number, rir: number, input: PlanInput): number | null {
  const big = bigFour(ex)
  const orm = input.oneRm?.get(ex.id) ?? (big ? input.lifts?.[big] : undefined)
  if (!orm) return null
  const eq = ex.equipment.find((e) => e !== 'bench') ?? 'barbell'
  return roundToEquipment(weightFor(orm, reps, rir), eq)
}

/** Weekly direct sets per muscle in a plan (primary 1, secondary 0.5). */
export function planVolume(pes: Pick<PlanExercise, 'exerciseId' | 'sets'>[], byId: Map<string, Pick<Exercise, 'primary' | 'secondary'>>) {
  const vol: Partial<Record<Muscle, number>> = {}
  for (const p of pes) {
    const ex = byId.get(p.exerciseId)
    if (!ex) continue
    for (const m of ex.primary) vol[m] = (vol[m] ?? 0) + p.sets
    for (const m of ex.secondary) vol[m] = (vol[m] ?? 0) + p.sets * 0.5
  }
  return vol
}

/** Keep every muscle under its safe cap and lift main muscles toward the bottom of the MAV band. */
function balanceVolume(pes: PlanExercise[], exercises: Exercise[], input: PlanInput) {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  for (let guard = 0; guard < 200; guard++) {
    const vol = planVolume(pes, byId)
    const over = (Object.keys(vol) as Muscle[]).find((m) => vol[m]! > capFor(m, input.experience, input.age))
    if (!over) break
    const hits = (p: PlanExercise) => byId.get(p.exerciseId)!.primary.includes(over) ? 2 : byId.get(p.exerciseId)!.secondary.includes(over) ? 1 : 0
    const victim = pes.filter((p) => hits(p) && p.sets > 1).sort((a, b) => hits(b) - hits(a) || b.sets - a.sets)[0]
    if (victim) { victim.sets--; continue }
    // Every contributor is at 1 set: drop the last-ordered one, keeping at least 3 exercises that day.
    const drop = pes.filter((p) => hits(p) && pes.filter((q) => q.planDayId === p.planDayId).length > 3).sort((a, b) => hits(a) - hits(b) || b.order - a.order)[0]
    if (!drop) break
    pes.splice(pes.indexOf(drop), 1)
  }
  if (input.deload || baseOf(input.cls) === 'healer') return
  const [lo] = WEEKLY_TARGET[input.experience]
  for (let guard = 0; guard < 100; guard++) {
    const vol = planVolume(pes, byId)
    const under = MAIN_MUSCLES.find((m) => (vol[m] ?? 0) < lo && pes.some((p) => byId.get(p.exerciseId)!.primary.includes(m)))
    if (!under) break
    const cand = pes.filter((p) => byId.get(p.exerciseId)!.primary.includes(under) && p.sets < 5).sort((a, b) => a.sets - b.sets)[0]
    if (!cand) break
    const after = planVolume([...pes.filter((p) => p !== cand), { ...cand, sets: cand.sets + 1 }], byId)
    if ((Object.keys(after) as Muscle[]).some((m) => after[m]! > capFor(m, input.experience, input.age))) break
    cand.sets++
  }
}

export type PlanWarning = { kind: 'over_cap' | 'under_target' | 'too_long' | 'back_to_back' | 'injury'; muscle?: Muscle; dayId?: string; message: string; fix: string }

/** Rule check for the plan editor: the System suggests fixes when an edit breaks volume or recovery rules. */
export function validatePlan(days: PlanDay[], pes: PlanExercise[], exercises: Map<string, Exercise>, ctx: { experience: Experience; age: number; sessionMinutes: number; injured: Muscle[] }): PlanWarning[] {
  const w: PlanWarning[] = []
  const vol = planVolume(pes, exercises)
  for (const m of Object.keys(vol) as Muscle[]) {
    const cap = capFor(m, ctx.experience, ctx.age)
    if (vol[m]! > cap) w.push({ kind: 'over_cap', muscle: m, message: `[${m.replace('_', ' ')} volume ${vol[m]} sets exceeds the safe cap of ${cap}.]`, fix: `Remove ${Math.ceil(vol[m]! - cap)} sets.` })
  }
  const [lo] = WEEKLY_TARGET[ctx.experience]
  for (const m of MAIN_MUSCLES) if ((vol[m] ?? 0) > 0 && (vol[m] ?? 0) < lo / 2) w.push({ kind: 'under_target', muscle: m, message: `[${m.replace('_', ' ')} receives only ${vol[m]} sets per week.]`, fix: `Add ${Math.ceil(lo - (vol[m] ?? 0))} sets.` })
  const ordered = [...days].sort((a, b) => a.weekday - b.weekday)
  for (const d of ordered) {
    const mine = pes.filter((p) => p.planDayId === d.id)
    const mins = estimateDuration(mine)
    if (mins > ctx.sessionMinutes * 1.2) w.push({ kind: 'too_long', dayId: d.id, message: `[${d.name} is estimated at ${mins} minutes.]`, fix: 'Remove an exercise or a set.' })
    for (const p of mine) {
      const ex = exercises.get(p.exerciseId)
      if (ex && ctx.injured.some((m) => ex.primary.includes(m) || ex.secondary.includes(m))) w.push({ kind: 'injury', dayId: d.id, message: `[${ex.name} loads an injured muscle.]`, fix: 'Swap it.' })
    }
  }
  for (let i = 0; i < ordered.length; i++) {
    const a = ordered[i], b = ordered[(i + 1) % ordered.length]
    if (a === b || (b.weekday - a.weekday + 7) % 7 !== 1) continue
    const heavy = (d: PlanDay) => { const v = planVolume(pes.filter((p) => p.planDayId === d.id), exercises); return new Set((Object.keys(v) as Muscle[]).filter((m) => v[m]! >= 6)) }
    const ha = heavy(a), hb = heavy(b)
    for (const m of ha) if (hb.has(m)) w.push({ kind: 'back_to_back', muscle: m, dayId: b.id, message: `[${m.replace('_', ' ')} is trained hard on consecutive days.]`, fix: 'Move one session or reduce its sets.' })
  }
  return w
}
