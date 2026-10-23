import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { getSetting, setSetting } from '@/db/repo'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, IconButton } from '@/ui/controls'
import { Sheet } from '@/ui/layout'
import { EmptyState } from '@/ui/feedback'
import { useProfile, useToday } from '@/app/hooks'
import { expandPlan, generateMealPlan, getMealPlan, groceries, logPlanned, swapOptions, swapPlanned, todayIndex } from '@/app/diet'
import { addDays, weekStart } from '@/engine/dates'
import type { PlannedMeal } from '@/engine/diet'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Meal plan by diet type and cuisine with swaps and one-tap logging (PRD F3.12). */
export function MealPlan() {
  const profile = useProfile()
  const today = useToday()
  const week = weekStart(today)
  const plan = useLiveQuery(async () => { const p = await getMealPlan(week); return p ? { stored: p, days: await expandPlan(p) } : null }, [week])
  const logged = useLiveQuery(async () => new Set((await db.mealLogs.where('day').equals(today).toArray()).map((l) => l.meal)), [today], new Set<string>())
  const [day, setDay] = useState(() => todayIndex(week, today))
  const [swap, setSwap] = useState<{ meal: PlannedMeal; options: PlannedMeal[] } | null>(null)
  if (!profile) return null
  const d = plan?.days[day]
  const isToday = addDays(week, day) === today
  return (
    <Screen tag="MEAL PLAN" title="This week" back="/diet">
      <SystemWindow tag="SETTINGS" animate={false}>
        <p className="t-small text-dim">{profile.dietType} · {profile.cuisine} cuisine{profile.budget ? ' · budget mode' : ''}</p>
        <label className="mt-2 flex min-h-12 items-center gap-2"><input type="checkbox" checked={profile.budget} onChange={async (e) => { await db.profile.update('me', { budget: e.target.checked }); await generateMealPlan({ ...profile, budget: e.target.checked }, week) }} /> Budget mode</label>
        <Button className="mt-2 w-full" variant="secondary" icon="swap" onClick={() => void generateMealPlan(profile, week)}>{plan ? 'Generate a new plan' : 'Generate this week'}</Button>
      </SystemWindow>
      {plan ? (
        <>
          <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Day">{DAYS.map((x, i) => <button key={x} type="button" role="tab" aria-selected={day === i} onClick={() => setDay(i)} className={`t-label h-12 rounded-[var(--r-1)] border text-[12px] ${day === i ? 'border-glow text-glow' : 'border-[color:var(--line)] text-dim'}`}>{x}</button>)}</div>
          {d ? (
            <SystemWindow tag={`${d.kcal} KCAL · ${d.p} G PROTEIN`} animate={false}>
              <ul className="flex flex-col gap-2">
                {d.meals.map((m) => (
                  <li key={m.slot} className="flex items-center gap-2 border-b border-[rgb(47_168_255/.08)] pb-2">
                    <div className="min-w-0 flex-1">
                      <div className="t-label text-dim">{m.slot}</div>
                      <div>{m.dish.name} <span className="t-small text-dim">×{m.servings}</span></div>
                      <div className="t-num text-[12px] text-dim">{Math.round(m.kcal)} kcal · {Math.round(m.p)}p · {Math.round(m.c)}c · {Math.round(m.f)}f</div>
                    </div>
                    <IconButton icon="swap" label={`Swap ${m.dish.name}`} onClick={async () => setSwap({ meal: m, options: await swapOptions(profile, m) })} />
                    {isToday ? <Button variant={logged.has(m.slot) ? 'ghost' : 'secondary'} className="px-3" aria-label={`Log ${m.dish.name}`} onClick={() => void logPlanned(m)}>{logged.has(m.slot) ? 'Again' : 'Log'}</Button> : null}
                  </li>
                ))}
              </ul>
            </SystemWindow>
          ) : null}
        </>
      ) : <SystemWindow tag="PLAN"><EmptyState message="[No meal plan for this week. Generate one.]" icon="diet" /></SystemWindow>}
      <Sheet open={!!swap} onClose={() => setSwap(null)} title="Swap meal">
        {swap ? (swap.options.length ? <ul className="flex flex-col gap-1">{swap.options.map((o) => <li key={o.dish.id}><button type="button" className="flex min-h-12 w-full items-center justify-between rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left" onClick={async () => { await swapPlanned(day, swap.meal.slot, o); setSwap(null) }}><span>{o.dish.name} <span className="t-small text-dim">×{o.servings}</span></span><span className="t-num text-[12px]">{Math.round(o.kcal)} kcal · {Math.round(o.p)}p</span></button></li>)}</ul> : <EmptyState message="[No equivalent dish found.]" />) : null}
      </Sheet>
    </Screen>
  )
}

/** Grocery list built from this week's plan, with ticks remembered. */
export function Grocery() {
  const today = useToday()
  const week = weekStart(today)
  const list = useLiveQuery(async () => { const p = await getMealPlan(week); return p ? groceries(p) : null }, [week])
  const checked = useLiveQuery(async () => new Set((await getSetting<string[]>('groceryChecked')) ?? []), [], new Set<string>())
  const toggle = async (id: string) => { const s = new Set(checked); if (s.has(id)) s.delete(id); else s.add(id); await setSetting('groceryChecked', [...s]) }
  const groups = list ? [...new Set(list.map((i) => i.group))] : []
  return (
    <Screen tag="GROCERY" title="Grocery list" back="/diet">
      {list ? groups.map((g) => (
        <SystemWindow key={g} tag={g.toUpperCase()} animate={false}>
          <ul className="flex flex-col">{list.filter((i) => i.group === g).map((i) => (
            <li key={i.id}><label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={checked.has(i.id)} onChange={() => void toggle(i.id)} /><span className={`flex-1 ${checked.has(i.id) ? 'text-dim line-through' : ''}`}>{i.name}</span><span className="t-num text-[13px] text-dim">{i.grams >= 1000 ? `${(i.grams / 1000).toFixed(1)} kg` : `${i.grams} g`}</span></label></li>
          ))}</ul>
        </SystemWindow>
      )) : <SystemWindow tag="GROCERY"><EmptyState message="[Generate a meal plan first.]" icon="inventory" /></SystemWindow>}
    </Screen>
  )
}
