// AI-ready progress report (PRD B5): one Markdown file the Player pastes into any AI assistant. Generated on device.
import { db } from '@/db/schema'
import { addDays, dayOf, startOf, weekStart } from '@/engine/dates'
import { e1rm, fromKg } from '@/engine/strength'
import { stallCount, type Exposure } from '@/engine/progression'
import type { Muscle } from '@/engine/types'
import { currentTargets } from './game'
import { totals } from './diet'
import { recoveryNow } from './training'

export const REPORT_WEEKS = [2, 4, 12] as const
const PROMPT = 'You are my strength coach and nutritionist. Here is my data; answer my questions using it.'

const r1 = (n: number) => Math.round(n * 10) / 10
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const label = (s: string) => s.replace(/_/g, ' ')
const row = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`
const tableMd = (head: string[], rows: (string | number)[][]) => (rows.length ? [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n') : '_No data in this period._')

export async function progressReport(weeks: number = 4, now = Date.now()) {
  const profile = await db.profile.get('me')
  if (!profile) return '# Shadow System progress report\n\nNo profile yet. Complete the Awakening first.'
  const today = dayOf(now)
  const first = addDays(weekStart(today), -7 * (weeks - 1))
  const since = startOf(first)
  const weekKeys = Array.from({ length: weeks }, (_, i) => addDays(first, i * 7))
  const lu = profile.units.lift as 'kg' | 'lb', bu = profile.units.body as 'kg' | 'lb'
  const w = (kg: number) => `${r1(fromKg(kg, lu))} ${lu}`

  const [exercises, plan, workouts, allSets, readiness, measurements, mealLogs, water, player, quests] = await Promise.all([
    db.exercises.toArray(), db.plans.filter((p) => p.active).first(), db.workouts.toArray(), db.sets.toArray(), db.readiness.where('day').aboveOrEqual(first).toArray(),
    db.measurements.toArray(), db.mealLogs.where('day').aboveOrEqual(first).toArray(), db.water.where('day').aboveOrEqual(first).toArray(), db.player.get('me'), db.quests.where('day').aboveOrEqual(first).toArray(),
  ])
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const planDays = plan ? await db.planDays.where('planId').equals(plan.id).sortBy('order') : []
  const planEx = plan ? await db.planExercises.where('planDayId').anyOf(planDays.map((d) => d.id)).toArray() : []
  const t = await currentTargets(profile)
  const questions: string[] = []
  const out: string[] = []

  out.push(`# Shadow System progress report`, '', `> ${PROMPT}`, '', `Period: ${first} to ${today} (${weeks} weeks). Units: lifts ${lu}, bodyweight ${bu}. Generated ${new Date(now).toISOString().slice(0, 16).replace('T', ' ')}.`)

  // Profile
  const age = Number(today.slice(0, 4)) - profile.birthYear
  const eq = profile.equipmentProfiles.find((e) => e.id === profile.activeEquipmentProfile) ?? profile.equipmentProfiles[0]
  out.push('', '## Profile', '', `- ${profile.sex}, ${age} years, ${profile.heightCm} cm, ${r1(fromKg(profile.weightKg, bu))} ${bu}`, `- Class: ${label(profile.cls)} (base ${profile.baseClass}). Goal: ${label(profile.goal)}. Experience: ${profile.experience}.`, `- Training days per week: ${profile.trainingDays.length}, sessions of ${profile.sessionMinutes} min. Equipment: ${eq?.equipment.map(label).join(', ') ?? 'none'}.`, `- Injuries: ${profile.injuries.length ? profile.injuries.map((i) => `${i.muscles.map(label).join('/')}${i.note ? ` (${i.note})` : ''}`).join('; ') : 'none'}.`, `- Diet: ${profile.dietType}, ${profile.cuisine} cuisine. Targets: ${t.kcal} kcal, ${t.protein} g protein, ${t.carbs} g carbs, ${t.fat} g fat, ${t.waterMl} ml water.`)

  // Plan and adherence
  const done = workouts.filter((x) => x.startedAt >= since && x.endedAt && x.kind !== 'recovery')
  out.push('', '## Current plan', '')
  if (plan) {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (const d of planDays) {
      const items = planEx.filter((p) => p.planDayId === d.id).sort((a, b) => a.order - b.order).map((p) => `${byId.get(p.exerciseId)?.name ?? p.exerciseId} ${p.sets}×${p.repMin}-${p.repMax} @RIR ${p.rir}`)
      out.push(`- **${DAYS[d.weekday]} · ${d.name}**: ${items.join('; ')}`)
    }
  } else out.push('_No active plan._')
  const perWeek = weekKeys.map((wk) => done.filter((x) => weekStart(x.day) === wk).length)
  const planned = planDays.length * weeks
  const adherence = planned ? Math.round((done.length / planned) * 100) : 0
  out.push('', `Adherence: ${done.length} of ${planned} planned sessions (${adherence}%).`, '', tableMd(['Week of', 'Sessions done', 'Planned'], weekKeys.map((wk, i) => [wk, perWeek[i], planDays.length])))
  if (planned && adherence < 80) questions.push(`Adherence is ${adherence}% of planned sessions.`)

  // Per-exercise trends
  const sets = allSets.filter((s) => s.type !== 'warmup' && s.reps > 0)
  const inPeriod = sets.filter((s) => s.completedAt >= since)
  const counts = new Map<string, number>()
  for (const s of inPeriod) counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? 0) + 1)
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id]) => id)
  out.push('', '## Lifts', '', 'Best set and estimated 1RM (e1RM) per week, working sets only.')
  const prs: string[] = []
  for (const id of top) {
    const name = byId.get(id)?.name ?? id
    const mine = sets.filter((s) => s.exerciseId === id)
    const rows: (string | number)[][] = []
    for (const wk of weekKeys) {
      const ws = mine.filter((s) => s.completedAt >= since && weekStart(dayOf(s.completedAt)) === wk)
      if (!ws.length) continue
      const best = ws.reduce((b, s) => ((e1rm(s.weightKg, s.reps, s.rir) ?? 0) > (e1rm(b.weightKg, b.reps, b.rir) ?? 0) ? s : b))
      rows.push([wk, `${w(best.weightKg)} × ${best.reps}${best.rir != null ? ` @RIR ${best.rir}` : ''}`, w(e1rm(best.weightKg, best.reps, best.rir) ?? 0), ws.length])
    }
    out.push('', `### ${name}`, '', tableMd(['Week of', 'Best set', 'e1RM', 'Sets'], rows))
    const before = Math.max(0, ...mine.filter((s) => s.completedAt < since).map((s) => e1rm(s.weightKg, s.reps, s.rir) ?? 0))
    const during = Math.max(0, ...mine.filter((s) => s.completedAt >= since).map((s) => e1rm(s.weightKg, s.reps, s.rir) ?? 0))
    if (during > before * 1.005 && before > 0) prs.push(`${name}: e1RM ${w(before)} → ${w(during)}`)
    const byWorkout = new Map<string, Exposure>()
    for (const s of mine) { const e = byWorkout.get(s.workoutId) ?? { at: s.completedAt, sets: [] }; e.sets.push(s); byWorkout.set(s.workoutId, e) }
    const stall = stallCount([...byWorkout.values()].sort((a, b) => a.at - b.at))
    if (stall >= 3) questions.push(`${name} has not improved for ${stall} sessions.`)
  }
  out.push('', '### PRs in this period', '', prs.length ? prs.map((p) => `- ${p}`).join('\n') : '_None._')

  // Volume per muscle
  const vol = new Map<Muscle, number[]>()
  for (const s of inPeriod) {
    const ex = byId.get(s.exerciseId)
    if (!ex) continue
    const i = weekKeys.indexOf(weekStart(dayOf(s.completedAt)))
    if (i < 0) continue
    for (const m of ex.primary) { const a = vol.get(m) ?? Array(weeks).fill(0); a[i] += 1; vol.set(m, a) }
    for (const m of ex.secondary) { const a = vol.get(m) ?? Array(weeks).fill(0); a[i] += 0.5; vol.set(m, a) }
  }
  const rec = await recoveryNow(now)
  out.push('', '## Weekly volume and recovery', '', 'Hard sets per muscle per week (secondary muscles count half). Recovery is the current estimate (100 = fully recovered).', '', tableMd(['Muscle', ...weekKeys.map((k) => k.slice(5)), 'Avg', 'Recovery now'], [...vol.entries()].sort((a, b) => avg(b[1]) - avg(a[1])).map(([m, a]) => [label(m), ...a.map(r1), r1(avg(a)), `${Math.round(rec[m] ?? 100)}%`])))

  // Readiness
  const rWeeks = weekKeys.map((wk) => readiness.filter((x) => weekStart(x.day) === wk))
  out.push('', '## Readiness', '', `Check-ins: ${readiness.length} of ${weeks * 7} days. Scores 1-5 (higher is better).`, '', tableMd(['Week of', 'Check-ins', 'Score', 'Sleep', 'Soreness', 'Energy', 'Stress'], weekKeys.map((wk, i) => [wk, rWeeks[i].length, ...(['score', 'sleep', 'soreness', 'energy', 'stress'] as const).map((k) => (rWeeks[i].length ? r1(avg(rWeeks[i].map((x) => x[k]))) : '–'))]).filter((r) => r[1] !== 0)))
  if (readiness.length >= 5 && avg(readiness.map((x) => x.score)) < 3) questions.push(`Average readiness is ${r1(avg(readiness.map((x) => x.score)))} of 5.`)

  // Body
  const body = measurements.filter((m) => m.day >= first).sort((a, b) => a.day.localeCompare(b.day))
  const types = [...new Set(body.map((m) => m.type))]
  const unitOf = (ty: string, v: number) => (ty === 'weight' ? `${r1(fromKg(v, bu))} ${bu}` : ty === 'bodyfat' ? `${v}%` : `${v} cm`)
  out.push('', '## Body', '', tableMd(['Measure', 'First', 'Latest', 'Change', 'Entries'], types.map((ty) => { const xs = body.filter((m) => m.type === ty); const a = xs[0].value, b = xs[xs.length - 1].value; return [ty, `${unitOf(ty, a)} (${xs[0].day})`, `${unitOf(ty, b)} (${xs[xs.length - 1].day})`, ty === 'weight' ? `${r1(fromKg(b - a, bu))} ${bu}` : r1(b - a), xs.length] })))

  // Nutrition
  const days = [...new Set(mealLogs.map((l) => l.day))].filter((d) => d < today).sort()
  const daily = days.map((d) => ({ d, ...totals(mealLogs.filter((l) => l.day === d)), water: water.filter((x) => x.day === d).reduce((a, x) => a + x.ml, 0) }))
  const pHit = daily.filter((x) => x.p >= t.protein * 0.95).length
  const kHit = daily.filter((x) => Math.abs(x.k - t.kcal) <= t.kcal * 0.1).length
  const wHit = daily.filter((x) => x.water >= t.waterMl).length
  out.push('', '## Nutrition', '', daily.length ? `Logged days: ${daily.length}. Averages: ${Math.round(avg(daily.map((x) => x.k)))} kcal, ${Math.round(avg(daily.map((x) => x.p)))} g protein, ${Math.round(avg(daily.map((x) => x.c)))} g carbs, ${Math.round(avg(daily.map((x) => x.f)))} g fat, ${Math.round(avg(daily.map((x) => x.water)))} ml water.\n\nTarget hit: calories (±10%) ${kHit}/${daily.length} days, protein ${pHit}/${daily.length}, water ${wHit}/${daily.length}.` : '_No complete logged days in this period._')
  if (daily.length) out.push('', tableMd(['Day', 'kcal', 'Protein g', 'Carbs g', 'Fat g', 'Water ml'], daily.slice(-14).map((x) => [x.d, x.k, x.p, x.c, x.f, x.water])))
  if (daily.length >= 3 && pHit < daily.length * 0.7) questions.push(`Protein under target ${daily.length - pHit} of ${daily.length} logged days.`)
  if (daily.length >= 3 && kHit < daily.length * 0.5) questions.push(`Calories off target (more than 10%) on ${daily.length - kHit} of ${daily.length} logged days.`)

  // Game
  const dailies = quests.filter((q) => q.type === 'daily' && q.day < today)
  out.push('', '## Game summary', '', player ? `Level ${player.level}, rank ${player.rank}, Power Level ${player.powerLevel}. Streak ${player.streak} days (best ${player.bestStreak}). Gold ${player.gold}.` : '_No player yet._', `Daily Quests cleared: ${dailies.filter((q) => q.status === 'cleared').length} of ${dailies.length}.`)

  out.push('', '## Open questions the System detected', '', questions.length ? questions.map((q) => `- ${q}`).join('\n') : '- None. Ask me anything about the data above.')
  return out.join('\n') + '\n'
}
