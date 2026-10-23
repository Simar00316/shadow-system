// Per-muscle recovery 0–100% (docs/game-design.md §12, research/science.md §5).
// FP(t) = Σ FP_i · 0.5^((t − t_i)/T_half); recovery = 100 · (1 − min(1, FP/K)).
import { MUSCLES, type Exercise, type Muscle } from './types'
import type { CardioLog, Readiness, RecoveryOverride, SetLog } from './model'

export const CAPACITY = 10
const H = 3_600_000

export const HALF_LIFE: Record<Muscle, number> = {
  quads: 24, glutes: 24, hamstrings: 24, lats: 24, upper_back: 24, lower_back: 24,
  chest: 22,
  front_delts: 20, side_delts: 20, rear_delts: 20, triceps: 20, traps: 20,
  biceps: 16, forearms: 16, calves: 16, abs: 16, obliques: 16, neck: 16, adductors: 16, abductors: 16, hip_flexors: 16,
}

export const effortFactor = (rir: number | null) => Math.max(0.25, 1 - 0.15 * Math.min(5, rir ?? 2))
export const loadFactor = (pct1rm: number | null) => (pct1rm == null ? 1 : pct1rm < 0.6 ? 1.1 : pct1rm > 0.8 ? 0.9 : 1)
/** Repeated-bout effect: new exercises cost more for three weeks (Damas 2018). */
export const noveltyFactor = (daysSinceFirst: number) => (daysSinceFirst < 7 ? 1.5 : daysSinceFirst < 14 ? 1.3 : daysSinceFirst < 21 ? 1.15 : 1)

/** Cardio → muscle fatigue coefficients per mode (R5 §5.3). */
const CARDIO: Record<string, Partial<Record<Muscle, number>>> = {
  run: { quads: 1, hamstrings: 0.7, glutes: 0.7, calves: 1 },
  cycle: { quads: 0.6, hamstrings: 0.4, glutes: 0.5, calves: 0.2 },
  row: { quads: 0.5, hamstrings: 0.3, glutes: 0.5, calves: 0.1, lats: 0.6, upper_back: 0.6, biceps: 0.3, forearms: 0.3, rear_delts: 0.2 },
  elliptical: { quads: 0.5, hamstrings: 0.3, glutes: 0.4, calves: 0.4 },
  stairs: { quads: 0.9, hamstrings: 0.5, glutes: 0.9, calves: 0.7 },
  swim: { quads: 0.2, hamstrings: 0.1, glutes: 0.1, calves: 0.1, lats: 0.5, upper_back: 0.5, triceps: 0.3, side_delts: 0.6, front_delts: 0.6 },
  rope: { quads: 0.6, hamstrings: 0.2, glutes: 0.3, calves: 1 },
  walk: { quads: 0.3, calves: 0.3, glutes: 0.2 },
  hiit: { quads: 0.7, hamstrings: 0.5, glutes: 0.6, calves: 0.6, abs: 0.3 },
}
export const cardioMode = (activity: string) => {
  const a = activity.toLowerCase()
  if (/run|jog|sprint|treadmill/.test(a)) return 'run'
  if (/bike|cycl|spin/.test(a)) return 'cycle'
  if (/row/.test(a)) return 'row'
  if (/ellip|cross.?trainer/.test(a)) return 'elliptical'
  if (/stair|step/.test(a)) return 'stairs'
  if (/swim/.test(a)) return 'swim'
  if (/rope|skip/.test(a)) return 'rope'
  if (/walk|hike/.test(a)) return 'walk'
  return 'hiit'
}

export type FatigueHit = { muscle: Muscle; fp: number; at: number }

type ExLite = Pick<Exercise, 'primary' | 'secondary'>

/** Fatigue contributions from logged sets. Warm-ups contribute nothing. */
export function setHits(sets: SetLog[], exercises: Map<string, ExLite>, opts: { firstSeen?: Map<string, number>; oneRm?: Map<string, number> } = {}): FatigueHit[] {
  const hits: FatigueHit[] = []
  for (const s of sets) {
    if (s.type === 'warmup') continue
    const ex = exercises.get(s.exerciseId)
    if (!ex) continue
    const orm = opts.oneRm?.get(s.exerciseId)
    const pct = orm && s.weightKg > 0 ? s.weightKg / orm : null
    const first = opts.firstSeen?.get(s.exerciseId)
    const n = first == null ? 1 : noveltyFactor((s.completedAt - first) / (24 * H))
    const base = effortFactor(s.rir) * loadFactor(pct) * n
    for (const m of ex.primary) hits.push({ muscle: m, fp: base, at: s.completedAt })
    for (const m of ex.secondary) hits.push({ muscle: m, fp: base * 0.5, at: s.completedAt })
  }
  return hits
}

export function cardioHits(logs: CardioLog[]): FatigueHit[] {
  const hits: FatigueHit[] = []
  for (const c of logs) {
    const clu = Math.max(0, c.met - 3) * (c.durationMin / 60) * (c.hiit ? 1.2 : 1)
    if (!clu) continue
    const coef = CARDIO[cardioMode(c.activity)]
    for (const [m, k] of Object.entries(coef)) hits.push({ muscle: m as Muscle, fp: k! * clu, at: c.startedAt })
  }
  return hits
}

export type RecoveryOptions = { now: number; age?: number; overrides?: RecoveryOverride[]; readiness?: Readiness | null; injured?: Muscle[] }

export const readinessTier = (score: number | null | undefined): 'green' | 'yellow' | 'red' => (score == null || score >= 3.5 ? 'green' : score >= 2.5 ? 'yellow' : 'red')
const TIER_FACTOR = { green: 1, yellow: 0.9, red: 0.75 }

/** Raw fatigue points per muscle at `now`. A manual override resets that muscle's stock at the override time. */
export function fatigue(hits: FatigueHit[], opts: Pick<RecoveryOptions, 'now' | 'age' | 'overrides'>): Record<Muscle, number> {
  const ageK = (opts.age ?? 0) >= 60 ? 1.25 : 1
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>
  const lastOverride = new Map<Muscle, RecoveryOverride>()
  for (const o of opts.overrides ?? []) if (o.at <= opts.now && (!lastOverride.has(o.muscle) || lastOverride.get(o.muscle)!.at < o.at)) lastOverride.set(o.muscle, o)
  const decay = (m: Muscle, fp: number, at: number) => fp * 0.5 ** ((opts.now - at) / H / (HALF_LIFE[m] * ageK))
  for (const [m, o] of lastOverride) out[m] = decay(m, CAPACITY * (1 - o.value / 100), o.at)
  for (const h of hits) {
    if (h.at > opts.now) continue
    const o = lastOverride.get(h.muscle)
    if (o && h.at <= o.at) continue
    out[h.muscle] += decay(h.muscle, h.fp, h.at)
  }
  return out
}

/** Recovery 0–100 per muscle, after readiness factor and injury cap (displayed value). */
export function recovery(hits: FatigueHit[], opts: RecoveryOptions): Record<Muscle, number> {
  const fp = fatigue(hits, opts)
  const k = TIER_FACTOR[readinessTier(opts.readiness?.score)]
  const out = {} as Record<Muscle, number>
  for (const m of MUSCLES) {
    let r = 100 * (1 - Math.min(1, fp[m] / CAPACITY)) * k
    if (opts.injured?.includes(m)) r = Math.min(r, 30)
    out[m] = Math.round(r)
  }
  return out
}

export const recoveryBand = (pct: number) => (pct >= 70 ? 'ready' : pct >= 30 ? 'partial' : 'avoid')

/** Overall recovery = mean of muscles trained in the last 7 days (or 100 if none): the Status Window HP. */
export function overallRecovery(rec: Record<Muscle, number>, trained: Muscle[]) {
  const ms = trained.length ? trained : []
  return ms.length ? Math.round(ms.reduce((a, m) => a + rec[m], 0) / ms.length) : 100
}

/** Readiness score from the 1–5 check-in (soreness and stress are inverted so higher is better). */
export const readinessScore = (r: Pick<Readiness, 'sleep' | 'soreness' | 'energy' | 'stress'>) => Math.round(((r.sleep + (6 - r.soreness) + r.energy + (6 - r.stress)) / 4) * 10) / 10
