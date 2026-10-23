// 12-week synthetic users (PRD §6 testing strategy). Drives the real engines with simulated performance:
// a hidden "true 1RM" per exercise grows each week; reps achieved follow Brzycki minus fatigue and noise.
import type { ClassId, Exercise, Experience, Sex } from '@/engine/types'
import type { PlanExercise } from '@/engine/model'
import { generatePlan, type PlanInput } from '@/engine/plan'
import { prescribe } from '@/engine/prescription'
import { deloadDue, deloadTarget, exposuresSince, nextTarget, stallCount, bestE1rm, type Exposure, type Target } from '@/engine/progression'
import { equipmentStep, roundToEquipment, weightFor } from '@/engine/strength'
import { weeklyHardSets } from '@/engine/safety'
import { rng } from '@/engine/rng'

export type Persona = { name: string; sex: Sex; experience: Experience; cls: ClassId; bodyweight: number; days: number[]; minutes: number; seed: number }

export const PERSONAS: Persona[] = [
  { name: 'beginner Tank (male)', sex: 'male', experience: 'beginner', cls: 'tank', bodyweight: 78, days: [1, 3, 5], minutes: 60, seed: 1 },
  { name: 'beginner Tank (female)', sex: 'female', experience: 'beginner', cls: 'tank', bodyweight: 62, days: [1, 3, 5], minutes: 50, seed: 2 },
  { name: 'intermediate Fighter (female)', sex: 'female', experience: 'intermediate', cls: 'fighter', bodyweight: 64, days: [1, 2, 4, 5], minutes: 70, seed: 3 },
  { name: 'intermediate Fighter (male)', sex: 'male', experience: 'intermediate', cls: 'fighter', bodyweight: 85, days: [1, 2, 4, 5], minutes: 75, seed: 4 },
  { name: 'advanced Assassin (male)', sex: 'male', experience: 'advanced', cls: 'assassin', bodyweight: 75, days: [1, 2, 3, 5, 6], minutes: 45, seed: 5 },
  { name: 'advanced Assassin (female)', sex: 'female', experience: 'advanced', cls: 'assassin', bodyweight: 60, days: [1, 3, 5], minutes: 45, seed: 6 },
]

const PATTERN_RATIO: Partial<Record<Exercise['pattern'], number>> = { squat: 1.2, hinge: 1.4, lunge: 0.6, horizontal_push: 0.9, vertical_push: 0.55, horizontal_pull: 0.8, vertical_pull: 0.8, carry: 0.8 }
const LEVEL = { beginner: 0.65, intermediate: 1, advanced: 1.35 }
const WEEKLY_GAIN = { beginner: 0.025, intermediate: 0.008, advanced: 0.003 }

function true1rm(ex: Exercise, p: Persona) {
  const ratio = PATTERN_RATIO[ex.pattern] ?? (ex.mechanics === 'compound' ? 0.6 : 0.3)
  const lower = ['squat', 'hinge', 'lunge'].includes(ex.pattern)
  const sexK = p.sex === 'female' ? (lower ? 0.8 : 0.62) : 1
  const eqK = ex.equipment.includes('dumbbell') || ex.equipment.includes('kettlebell') ? 0.4 : ex.equipment.includes('bodyweight') && ex.equipment.length === 1 ? 0 : 1
  return p.bodyweight * ratio * LEVEL[p.experience] * sexK * eqK
}

export type SimSession = { week: number; day: number; deload: boolean; exercises: { exerciseId: string; target: Target; sets: { weightKg: number; reps: number; rir: number }[]; action: string }[] }
export type SimResult = { persona: Persona; sessions: SimSession[]; deloadWeeks: number[]; loadHistory: Map<string, number[]>; weeklySets: Record<string, number>[]; violations: string[]; planExercises: PlanExercise[] }

export function simulate(p: Persona, exercises: Exercise[], weeks = 12): SimResult {
  const rand = rng(p.seed)
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const input: PlanInput = { experience: p.experience, cls: p.cls, sex: p.sex, age: 30, goal: 'hypertrophy', equipment: ['bodyweight', 'dumbbell', 'barbell', 'ez_bar', 'kettlebell', 'cable', 'machine', 'bench', 'pullup_bar', 'bands'], injured: [], trainingDays: p.days, sessionMinutes: p.minutes, week: 1 }
  const plan = generatePlan(input, exercises, (x) => `${x}-${Math.floor(rand() * 1e9).toString(36)}`)
  const truth = new Map<string, number>()
  const targets = new Map<string, Target>()
  const history = new Map<string, Exposure[]>()
  const loadHistory = new Map<string, number[]>()
  const sessions: SimSession[] = []
  const deloadWeeks: number[] = []
  const weeklySets: Record<string, number>[] = []
  const violations: string[] = []
  let weeksSinceDeload = 0
  let lastDeloadAt = 0

  for (const pe of plan.exercises) {
    const ex = byId.get(pe.exerciseId)!
    truth.set(pe.id, true1rm(ex, p))
    const eq = ex.equipment.find((e) => e !== 'bench') ?? 'bodyweight'
    // The Player's first guess: a weight they think they can do for the top of the range at the target RIR, 10% conservative.
    const start = truth.get(pe.id)! ? roundToEquipment(weightFor(truth.get(pe.id)! * 0.9, pe.repMax, pe.rir), eq) : 0
    targets.set(pe.id, { loadKg: pe.loadKg ?? start, repMin: pe.repMin, repMax: pe.repMax, rir: pe.rir, sets: pe.sets, restSec: pe.restSec, holdSec: pe.holdSec })
  }

  for (let week = 1; week <= weeks; week++) {
    const readiness = Array.from({ length: 7 }, () => (rand() < 0.1 ? 2 : 3.5 + rand() * 1.5))
    const since = (id: string) => exposuresSince(history.get(id) ?? [], lastDeloadAt)
    const stalled = plan.exercises.filter((pe) => stallCount(since(pe.id)) >= 3).length
    const drops = plan.exercises.map((pe) => {
      const h = since(pe.id)
      if (h.length < 3) return 0
      const best = Math.max(...h.slice(0, -2).map(bestE1rm))
      const recent = Math.max(...h.slice(-2).map(bestE1rm))
      return best ? Math.max(0, (best - recent) / best) : 0
    })
    const d = deloadDue({ experience: p.experience, weeksSinceDeload, liftDrops: drops, readiness7: readiness, stalledLifts: stalled })
    const deload = d.due && week > 1
    if (deload) { deloadWeeks.push(week); weeksSinceDeload = 0; lastDeloadAt = week * 10 + 9 } else weeksSinceDeload++

    const weekSets: { exerciseId: string; rir: number; type: 'working' }[] = []
    for (const day of plan.days) {
      const session: SimSession = { week, day: day.order, deload, exercises: [] }
      for (const pe of plan.exercises.filter((x) => x.planDayId === day.id)) {
        const ex = byId.get(pe.exerciseId)!
        const t0 = targets.get(pe.id)!
        const rx = prescribe(ex, { cls: p.cls, experience: p.experience, sex: p.sex, week, dayType: day.dayType })
        const t = deload ? deloadTarget(t0, ex.mechanics === 'compound') : { ...t0, rir: rx.rir }
        const orm = truth.get(pe.id)!
        const sets: { weightKg: number; reps: number; rir: number }[] = []
        for (let s = 0; s < t.sets; s++) {
          let reps: number, rir: number
          if (!orm || !t.loadKg) {
            reps = t.repMax; rir = t.rir
          } else {
            const toFailure = Math.max(0, Math.floor(37 - (36 * t.loadKg) / orm - s * 0.6 + (rand() - 0.5) * 2))
            reps = Math.max(0, Math.min(t.repMax, toFailure - t.rir))
            rir = Math.max(0, Math.min(5, Math.round(toFailure - reps + (rand() - 0.5) * 2)))
          }
          sets.push({ weightKg: t.loadKg, reps, rir })
          weekSets.push({ exerciseId: pe.exerciseId, rir, type: 'working' })
        }
        let action = 'deload'
        if (!deload) {
          const h = [...(history.get(pe.id) ?? []), { at: week * 10 + day.order, sets }]
          history.set(pe.id, h)
          const next = nextTarget(ex, t0, h, { model: rx.model, experience: p.experience })
          const step = equipmentStep(ex.equipment.find((e) => e !== 'bench') ?? 'bodyweight')
          if (next.loadKg - t0.loadKg > Math.max(t0.loadKg * 0.1, step) + 1e-6) violations.push(`${ex.name}: jump ${t0.loadKg}→${next.loadKg}`)
          targets.set(pe.id, { ...next, rir: t0.rir })
          action = next.action
        }
        loadHistory.set(pe.id, [...(loadHistory.get(pe.id) ?? []), t.loadKg])
        session.exercises.push({ exerciseId: pe.exerciseId, target: t, sets, action })
      }
      sessions.push(session)
    }
    weeklySets.push(weeklyHardSets(weekSets, byId))
    for (const [k, v] of truth) truth.set(k, v * (1 + WEEKLY_GAIN[p.experience] * (deload ? 0.5 : 1)))
  }
  return { persona: p, sessions, deloadWeeks, loadHistory, weeklySets, violations, planExercises: plan.exercises }
}
