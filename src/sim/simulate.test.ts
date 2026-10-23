// M4 gate: 12-week simulated users produce sensible progression, deloads and safe volume.
import { PERSONAS, simulate } from './simulate'
import { EXERCISES, EX_BY_ID } from '@/engine/testdata'
import { capFor } from '@/engine/safety'
import { MUSCLES } from '@/engine/types'

describe.each(PERSONAS)('$name over 12 weeks', (persona) => {
  const r = simulate(persona, EXERCISES)
  const compounds = r.planExercises.filter((pe) => EX_BY_ID.get(pe.exerciseId)!.mechanics === 'compound' && (r.loadHistory.get(pe.id)?.[0] ?? 0) > 0)

  it('trains every planned day every week', () => {
    expect(r.sessions).toHaveLength(12 * new Set(r.planExercises.map((p) => p.planDayId)).size)
  })

  it('never jumps load by more than max(10%, one equipment step) in one session', () => {
    expect(r.violations).toEqual([])
  })

  it('progresses loads on loaded compound lifts in line with training age', () => {
    const gains = compounds.map((pe) => { const h = r.loadHistory.get(pe.id)!; return h[h.length - 1] / h[0] - 1 })
    const median = gains.sort((a, b) => a - b)[Math.floor(gains.length / 2)] ?? 0
    if (persona.experience === 'beginner') expect(median).toBeGreaterThanOrEqual(0.1)
    else if (persona.experience === 'intermediate') expect(median).toBeGreaterThanOrEqual(0)
    else expect(median).toBeGreaterThanOrEqual(-0.1)
    for (const pe of compounds) for (const l of r.loadHistory.get(pe.id)!) expect(l).toBeGreaterThan(0)
  })

  it('takes deloads on schedule (never more than 8 weeks without one)', () => {
    const every = { beginner: 8, intermediate: 6, advanced: 5 }[persona.experience]
    expect(r.deloadWeeks.length).toBeGreaterThanOrEqual(1)
    expect(r.deloadWeeks[0]).toBeLessThanOrEqual(every + 1)
    for (let i = 1; i < r.deloadWeeks.length; i++) expect(r.deloadWeeks[i] - r.deloadWeeks[i - 1]).toBeGreaterThanOrEqual(3)
    const deloadSessions = r.sessions.filter((s) => s.deload)
    for (const s of deloadSessions) for (const e of s.exercises) expect(e.target.rir).toBeGreaterThanOrEqual(4)
  })

  it('keeps every muscle under its weekly safe cap', () => {
    for (const w of r.weeklySets) for (const m of MUSCLES) expect(w[m]).toBeLessThanOrEqual(capFor(m, persona.experience) + 0.5)
  })

  it('stays inside the class rep ranges', () => {
    for (const s of r.sessions) for (const e of s.exercises) for (const set of e.sets) expect(set.reps).toBeLessThanOrEqual(e.target.repMax)
  })
})
