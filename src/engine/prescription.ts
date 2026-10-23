// Class × experience prescriptions (docs/game-design.md §3, research/science.md §1.2).
import type { BaseClass, ClassId, Exercise, Experience, Sex } from './types'

export type Progression = 'linear' | 'double' | 'density' | 'undulating' | 'hold'
export type DayType = 'heavy' | 'medium' | 'light'
export type Rx = { repMin: number; repMax: number; rir: number; sets: number; restSec: number; pct: [number, number]; model: Progression; holdSec?: number; technique?: 'top_backoff' }

type Row = { reps: [number, number]; isoReps?: [number, number]; pct: [number, number]; rir: number; sets: [number, number]; rest: [number, number]; model: Progression }

const T: Record<BaseClass, Record<Experience, Row>> = {
  fighter: {
    beginner: { reps: [5, 8], pct: [65, 80], rir: 2, sets: [2, 3], rest: [150, 90], model: 'linear' },
    intermediate: { reps: [3, 6], pct: [80, 88], rir: 2, sets: [3, 5], rest: [180, 120], model: 'double' },
    advanced: { reps: [1, 6], pct: [80, 92], rir: 1, sets: [3, 6], rest: [240, 120], model: 'double' },
  },
  tank: {
    beginner: { reps: [8, 12], pct: [65, 75], rir: 3, sets: [2, 3], rest: [120, 75], model: 'double' },
    intermediate: { reps: [6, 12], isoReps: [10, 20], pct: [65, 80], rir: 2, sets: [3, 4], rest: [150, 75], model: 'double' },
    advanced: { reps: [5, 12], isoReps: [10, 25], pct: [62, 82], rir: 1, sets: [3, 5], rest: [150, 75], model: 'double' },
  },
  assassin: {
    beginner: { reps: [12, 15], pct: [50, 60], rir: 3, sets: [2, 3], rest: [60, 60], model: 'density' },
    intermediate: { reps: [12, 25], pct: [45, 65], rir: 2, sets: [3, 4], rest: [75, 45], model: 'density' },
    advanced: { reps: [12, 25], pct: [45, 65], rir: 2, sets: [3, 4], rest: [75, 45], model: 'density' },
  },
  ranger: {
    beginner: { reps: [8, 12], pct: [60, 70], rir: 3, sets: [2, 3], rest: [105, 90], model: 'double' },
    intermediate: { reps: [6, 8], pct: [72, 80], rir: 2, sets: [3, 5], rest: [150, 90], model: 'undulating' },
    advanced: { reps: [6, 8], pct: [72, 80], rir: 2, sets: [3, 5], rest: [150, 90], model: 'undulating' },
  },
  healer: {
    beginner: { reps: [8, 12], pct: [0, 50], rir: 4, sets: [1, 2], rest: [45, 45], model: 'hold' },
    intermediate: { reps: [8, 12], pct: [0, 55], rir: 3, sets: [2, 3], rest: [45, 45], model: 'hold' },
    advanced: { reps: [8, 12], pct: [0, 60], rir: 3, sets: [2, 3], rest: [45, 45], model: 'hold' },
  },
}

const UNDULATING: Record<DayType, { reps: [number, number]; pct: [number, number] }> = {
  heavy: { reps: [3, 5], pct: [82, 90] },
  medium: { reps: [6, 8], pct: [72, 80] },
  light: { reps: [10, 12], pct: [65, 72] },
}

const ADVANCED_BASE: Record<string, BaseClass> = { knight: 'fighter', berserker: 'fighter', juggernaut: 'tank', shadow_assassin: 'assassin', striker: 'ranger', monk: 'healer' }

/** The base class whose rules apply. Shadow Monarch mixes classes per exercise (its best class tag). */
export function baseOf(cls: ClassId, ex?: Pick<Exercise, 'classTags'>): BaseClass {
  if (cls === 'shadow_monarch') return ex?.classTags[0] ?? 'fighter'
  return (ADVANCED_BASE[cls] ?? cls) as BaseClass
}

export type RxContext = { cls: ClassId; experience: Experience; sex?: Sex; age?: number; week?: number; dayType?: DayType; deload?: boolean; readiness?: 'green' | 'yellow' | 'red' }

/** Sets/reps/RIR/rest for one exercise in a session. */
export function prescribe(ex: Pick<Exercise, 'mechanics' | 'pattern' | 'classTags'>, ctx: RxContext): Rx {
  const base = baseOf(ctx.cls, ex)
  const row = T[base][ctx.experience]
  const iso = ex.mechanics === 'isolation'
  let [repMin, repMax] = iso && row.isoReps ? row.isoReps : row.reps
  let pct = row.pct
  let rir = row.rir
  const model = row.model
  if (base === 'ranger' && row.model === 'undulating') {
    const u = UNDULATING[ctx.dayType ?? 'medium']
    ;[repMin, repMax] = u.reps
    pct = u.pct
  }
  // Beginner on-ramp: first 4 weeks 8-12 reps at RIR 3-4 (R5 §7.2)
  if (ctx.experience === 'beginner' && (ctx.week ?? 99) <= 4 && base !== 'assassin' && base !== 'healer') {
    ;[repMin, repMax] = [8, 12]
    rir = Math.max(rir, (ctx.week ?? 99) <= 2 ? 4 : 3)
  }
  // Women: higher rep ceilings on isolation before adding load (R5 §7.1)
  if (ctx.sex === 'female' && iso && base !== 'healer') repMax = Math.max(repMax, 15)
  let rest = iso ? row.rest[1] : row.rest[0]
  // Age (R5 §7.3)
  if ((ctx.age ?? 0) >= 50) rir = Math.max(rir, 2)
  if ((ctx.age ?? 0) >= 60) { repMin = Math.max(repMin, 10); repMax = Math.max(repMax, 15); rest += 30 }
  let sets = row.sets[1] - (iso ? 1 : 0)
  sets = Math.max(row.sets[0], sets)
  if (ctx.experience === 'beginner' && (ctx.week ?? 99) <= 2) sets = 2
  if (ctx.readiness === 'yellow') { sets = Math.max(1, Math.round(sets * 0.8)); rir += 1 }
  if (ctx.deload) { sets = Math.max(1, Math.round(sets * 0.55)); rir = Math.max(rir, 4) }
  const rx: Rx = { repMin, repMax, rir, sets, restSec: rest, pct, model }
  if (base === 'healer') { rx.holdSec = ex.pattern === 'stretch' ? 30 : undefined }
  if (base === 'fighter' && ctx.experience === 'advanced' && !iso) rx.technique = 'top_backoff'
  return rx
}

/** Estimated seconds per working set (time under tension) for duration estimates. */
export const secondsPerSet = (rx: Pick<Rx, 'repMax' | 'holdSec'>) => (rx.holdSec ? rx.holdSec * 2 : Math.round(rx.repMax * 3.5 + 10))
