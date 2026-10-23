// Exercise recommender and smart swap (PRD B3.4, B3.5).
import type { BaseClass, Equipment, Exercise, Experience, Muscle } from './types'

export type Pref = 'more' | 'less' | 'never'
export type RecContext = {
  equipment: Equipment[]
  recovery?: Partial<Record<Muscle, number>>
  baseClass?: BaseClass
  prefs?: Map<string, Pref>
  recent?: Set<string>
  injured?: Muscle[]
  experience?: Experience
}
export type Scored = { ex: Exercise; score: number; reasons: string[] }

/** Can this exercise be done with the equipment at hand? Bodyweight is always available. */
export function available(ex: Pick<Exercise, 'equipment'>, have: Equipment[]) {
  return ex.equipment.every((e) => e === 'bodyweight' || have.includes(e))
}

export function allowed(ex: Exercise, ctx: RecContext) {
  if (!available(ex, ctx.equipment)) return false
  if (ctx.prefs?.get(ex.id) === 'never') return false
  if (ctx.injured?.some((m) => ex.primary.includes(m) || ex.secondary.includes(m))) return false
  if (ctx.experience === 'beginner' && ex.difficulty === 'advanced') return false
  return true
}

/** Rank exercises for the targeted muscles by match, equipment, recovery, class, preference and variety. */
export function recommend(exercises: Exercise[], targets: Muscle[], ctx: RecContext, limit = 20): Scored[] {
  const out: Scored[] = []
  for (const ex of exercises) {
    if (!allowed(ex, ctx)) continue
    const prim = ex.primary.filter((m) => targets.includes(m)).length
    const sec = ex.secondary.filter((m) => targets.includes(m)).length
    if (!prim && !sec) continue
    const reasons: string[] = []
    let score = prim * 3 + sec
    const worst = Math.min(...ex.primary.map((m) => ctx.recovery?.[m] ?? 100))
    if (worst < 30) continue
    if (worst < 70) { score -= 2; reasons.push('partially recovered') } else score += 1
    if (ctx.baseClass && ex.classTags.includes(ctx.baseClass)) { score += 1.5; reasons.push('fits your class') }
    const pref = ctx.prefs?.get(ex.id)
    if (pref === 'more') { score += 1.5; reasons.push('you like it') }
    if (pref === 'less') score -= 1.5
    if (ctx.recent?.has(ex.id)) { score -= 1; reasons.push('done recently') }
    if (ex.core) score += 1
    if (ex.mechanics === 'compound') score += 0.5
    if (ctx.experience === 'beginner' && ex.equipment.some((e) => e === 'machine' || e === 'cable')) score += 0.5
    out.push({ ex, score, reasons })
  }
  return out.sort((a, b) => b.score - a.score || a.ex.name.localeCompare(b.ex.name)).slice(0, limit)
}

/**
 * Equivalent exercises when equipment is busy or an injury flag is set: same swap group first
 * (movement pattern + primary muscle), then same pattern sharing a primary muscle.
 */
export function smartSwap(ex: Exercise, exercises: Exercise[], ctx: RecContext & { busy?: Equipment[] }, limit = 5): Exercise[] {
  const have = ctx.busy ? ctx.equipment.filter((e) => !ctx.busy!.includes(e)) : ctx.equipment
  const c = { ...ctx, equipment: have }
  const score = (o: Exercise) =>
    (o.swapGroup === ex.swapGroup ? 10 : 0) + (o.core ? 2 : 0) + (ctx.prefs?.get(o.id) === 'more' ? 1.5 : 0) - (ctx.prefs?.get(o.id) === 'less' ? 1.5 : 0) +
    (o.equipment[0] !== ex.equipment[0] ? 1 : 0) + (o.mechanics === ex.mechanics ? 1 : 0)
  return exercises
    .filter((o) => o.id !== ex.id && allowed(o, c) && (o.swapGroup === ex.swapGroup || (o.pattern === ex.pattern && o.primary.some((m) => ex.primary.includes(m)))))
    .filter((o) => !ctx.busy || !o.equipment.some((e) => ctx.busy!.includes(e)))
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
    .slice(0, limit)
}
