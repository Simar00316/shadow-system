import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import Fuse from 'fuse.js'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, IconButton, NumberStepper, Tabs } from '@/ui/controls'
import { MiniBar, Ring } from '@/ui/game'
import { Sheet } from '@/ui/layout'
import { EmptyState } from '@/ui/feedback'
import { Icon } from '@/ui/icons'
import { useProfile, useToday } from '@/app/hooks'
import { addWater, dayTargets, deleteMealLog, foodIndex, itemFrom, logMeal, lookupBarcode, recentItems, saveManualFood, saveMeal, totals, type FoodHit } from '@/app/diet'
import type { MealItem, MealSlot } from '@/engine/model'
import { Scanner } from './Scanner'
import { Tour, type TourStep } from '@/ui/Tour'

const SLOT_LABEL: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

const DIET_TOUR: TourStep[] = [
  { target: 'kcal', title: 'Calories left today', body: 'Your daily target comes from your body, goal and training. The ring shows what is left; it turns gold when you hit it. Below: protein, carbs and fat for today.' },
  { target: 'water', title: 'Water', body: 'Tap +250 or +500 each time you drink. The target rises on training days.' },
  { target: 'meals', title: 'Log what you eat', body: 'Tap Add food under a meal: search 1,000+ foods and dishes, scan a barcode, reuse recent foods, or quick-add calories. Protein and water also tick off your Daily Quest.' },
  { target: 'plan', title: 'Meal plan', body: 'A weekly plan built for your diet and cuisine, with a grocery list. On today’s tab, tap “I ate this” to log a planned meal in one step.' },
]

/** Diet dashboard (PRD F3.12): rings, water, meals by slot, logging by search, barcode, recents, saved meals. */
export function Diet() {
  const nav = useNavigate()
  const profile = useProfile()
  const today = useToday()
  const logs = useLiveQuery(() => db.mealLogs.where('day').equals(today).toArray(), [today], [])
  const water = useLiveQuery(async () => (await db.water.where('day').equals(today).toArray()).reduce((a, w) => a + w.ml, 0), [today], 0)
  const targets = useLiveQuery(async () => (profile ? dayTargets(profile, today) : null), [profile, today, logs.length])
  const [slot, setSlot] = useState<MealSlot | null>(null)
  if (!profile || !targets) return null
  const t = totals(logs)
  const cups = 8, per = targets.waterMl / cups
  return (
    <Screen tag="NUTRITION" title="Diet" actions={<span data-tour="plan"><IconButton icon="log" label="Meal plan" onClick={() => nav('/diet/plan')} /></span>}>
      <SystemWindow tag="TODAY" hero tour="kcal">
        <div className="flex justify-center">
          <Ring label="Calories" value={t.k} target={targets.kcal} unit="" size={200} remaining caption={false} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Macro label="Protein" value={t.p} target={targets.protein} color="var(--success)" />
          <Macro label="Carbs" value={t.c} target={targets.carbs} color="var(--glow)" />
          <Macro label="Fat" value={t.f} target={targets.fat} color="var(--gold)" />
        </div>
        {targets.warnings.length ? <p className="t-small mt-3 text-amber">{targets.warnings.join(' ')}</p> : null}
        <p className="t-small mt-3 text-dim">[Target {targets.kcal.toLocaleString()} kcal ({targets.phase}). Safe minimum {targets.floor.toLocaleString()} kcal.]</p>
      </SystemWindow>

      <SystemWindow tag="WATER" index={1} tour="water">
        <figure aria-label={`Water: ${Math.round(water)} of ${Math.round(targets.waterMl)} ml`} className="flex items-center gap-3">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {Array.from({ length: cups }, (_, i) => {
              const fill = Math.max(0, Math.min(1, (water - i * per) / per))
              return <span key={i} className="relative h-9 flex-1 overflow-hidden rounded-[5px] border border-[color:var(--edge)] bg-[rgb(47_168_255/.08)]"><span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#5cc8ff,#2090e8)] transition-[height] duration-500" style={{ height: `${fill * 100}%`, boxShadow: fill ? '0 0 10px rgb(47 168 255 / .5)' : undefined }} /></span>
            })}
          </div>
          <figcaption className="t-num shrink-0 text-right text-[13px]"><span className="text-text">{water.toLocaleString()}</span><span className="text-dim"> / {targets.waterMl.toLocaleString()} ml</span></figcaption>
        </figure>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[250, 500].map((ml) => <Button key={ml} variant="secondary" icon="water" onClick={() => void addWater(ml)}>+{ml}</Button>)}
        </div>
      </SystemWindow>

      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]).map((s) => {
        const mine = logs.filter((l) => l.meal === s)
        const k = totals(mine).k
        return (
          <section key={s} aria-label={SLOT_LABEL[s].toUpperCase()} data-tour={s === 'breakfast' ? 'meals' : undefined}>
            <div className="section-head">
              <span className="t-label text-dim">{SLOT_LABEL[s]}</span>
              <span className="t-num text-[13px] text-dim">{k.toLocaleString()} kcal</span>
            </div>
            <div className="group">
              {mine.flatMap((l) => l.items.map((i, j) => (
                <div key={`${l.id}-${j}`} className="flex items-center gap-2 px-3.5 py-2">
                  <span className="min-w-0 flex-1 truncate t-row">{i.name} <span className="t-small text-dim">{i.grams} g</span></span>
                  <span className="t-num shrink-0 text-[13px] text-dim">{i.k} kcal · {i.p}p</span>
                  {j === 0 ? <IconButton icon="trash" label={`Delete ${i.name}`} onClick={() => void deleteMealLog(l.id)} /> : <span className="w-12" />}
                </div>
              )))}
              <button type="button" className="group-row press text-glow" data-glitch="" onClick={() => setSlot(s)}>
                <span className="well h-8 w-8"><Icon name="plus" size={16} /></span>
                <span className="t-label">Add food</span>
                {!mine.length ? <span className="t-small ml-auto text-faint">Nothing logged</span> : null}
              </button>
            </div>
          </section>
        )
      })}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon="diet" onClick={() => nav('/diet/plan')}>Meal plan</Button>
        <Button variant="secondary" icon="inventory" onClick={() => nav('/diet/grocery')}>Grocery list</Button>
      </div>
      <Tour id="diet" steps={DIET_TOUR} />
      <Sheet open={!!slot} onClose={() => setSlot(null)} title={slot ? `Add to ${SLOT_LABEL[slot]}` : ''}>
        {slot ? <AddFood slot={slot} onDone={() => setSlot(null)} /> : null}
      </Sheet>
    </Screen>
  )
}

/** Macro as a slim bar with value / target (rings only for the hero, design-v2 §5.4). */
function Macro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <figure aria-label={`${label}: ${Math.round(value)} of ${Math.round(target)} g`} className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-1">
        <span className="t-micro text-dim">{label}</span>
      </figcaption>
      <div className="t-num mt-1 text-[14px]"><span className="text-text">{Math.round(value)}</span><span className="text-dim">/{Math.round(target)}g</span></div>
      <MiniBar className="mt-1.5" pct={target ? (value / target) * 100 : 0} color={color} />
    </figure>
  )
}

function AddFood({ slot, onDone }: { slot: MealSlot; onDone: () => void }) {
  const [tab, setTab] = useState<'search' | 'recent' | 'saved' | 'scan' | 'quick'>('search')
  const [index, setIndex] = useState<FoodHit[]>([])
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<FoodHit | null>(null)
  const [grams, setGrams] = useState(100)
  const [basket, setBasket] = useState<MealItem[]>([])
  const [msg, setMsg] = useState('')
  const recents = useLiveQuery(() => recentItems(), [], [])
  const saved = useLiveQuery(() => db.meals.toArray(), [], [])
  const [quick, setQuick] = useState({ name: '', k: 0, p: 0, c: 0, f: 0 })
  useEffect(() => { void foodIndex().then(setIndex) }, [])
  const fuse = useMemo(() => new Fuse(index, { keys: [{ name: 'name', weight: 2 }, 'detail'], threshold: 0.35, ignoreLocation: true }), [index])
  const results = q.trim() ? fuse.search(q.trim()).slice(0, 25).map((r) => r.item) : []
  const choose = (h: FoodHit) => { setPick(h); setGrams(Math.round(h.serving ?? h.unit.serving ?? h.unit.piece ?? 100)) }
  const commit = async (items: MealItem[]) => { await logMeal(slot, items); onDone() }

  if (pick) {
    const units = Object.entries(pick.unit).filter(([, g]) => g > 0).slice(0, 4)
    return (
      <div className="flex flex-col gap-3">
        <div className="t-heading">{pick.name}</div>
        <div className="t-small text-dim">per 100 g: {Math.round(pick.k)} kcal · P {pick.p.toFixed(1)} · C {pick.c.toFixed(1)} · F {pick.f.toFixed(1)}</div>
        <NumberStepper label="Amount" value={grams} step={10} min={1} max={3000} onChange={setGrams} unit="g" />
        {units.length ? <div className="flex flex-wrap gap-2">{units.map(([u, g]) => <Button key={u} variant="ghost" className="min-h-10 px-3" onClick={() => setGrams(Math.round(g))}>1 {u} ({Math.round(g)} g)</Button>)}</div> : null}
        <p className="t-system">[{itemFrom(pick, grams).k} kcal · {itemFrom(pick, grams).p} g protein]</p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => void commit([...basket, itemFrom(pick, grams)])}>Log</Button>
          <Button variant="secondary" onClick={() => { setBasket([...basket, itemFrom(pick, grams)]); setPick(null) }}>Add another</Button>
        </div>
        <Button variant="ghost" onClick={() => setPick(null)}>Back</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs label="Add food by" value={tab} onChange={setTab} tabs={[{ id: 'search', label: 'Search' }, { id: 'recent', label: 'Recent' }, { id: 'saved', label: 'Saved' }, { id: 'scan', label: 'Scan' }, { id: 'quick', label: 'Quick add' }]} />
      {basket.length ? (
        <div className="rounded-[var(--r-1)] border border-[color:var(--line)] p-2">
          <div className="t-small text-dim">In this meal: {basket.map((b) => b.name).join(', ')}</div>
          <div className="mt-2 flex gap-2">
            <Button className="flex-1" onClick={() => void commit(basket)}>Log {basket.length} items</Button>
            <Button variant="ghost" onClick={async () => { await saveMeal(basket.map((b) => b.name).slice(0, 2).join(' + '), basket); setMsg('[Saved meal created.]') }}>Save meal</Button>
          </div>
        </div>
      ) : null}
      {msg ? <p className="t-system text-success">{msg}</p> : null}
      {tab === 'search' ? (
        <>
          <input autoFocus type="search" aria-label="Search foods" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods and dishes" className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" />
          <ul className="flex flex-col gap-1">{results.map((h) => (
            <li key={h.id}><button type="button" onClick={() => choose(h)} className="flex min-h-12 w-full items-center justify-between gap-2 rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left">
              <span className="min-w-0 flex-1"><span className="block truncate">{h.name}</span><span className="t-small text-dim">{h.kind === 'dish' ? `Dish · ${h.serving} g serving` : h.kind === 'food' ? 'Scanned food' : 'Ingredient'}</span></span>
              <span className="t-num text-[12px] text-dim">{Math.round(h.k)}/100g</span>
            </button></li>
          ))}</ul>
          {!q ? <p className="t-small text-dim">{index.length.toLocaleString()} foods and dishes available offline.</p> : null}
        </>
      ) : null}
      {tab === 'recent' ? (recents.length ? <ul className="flex flex-col gap-1">{recents.map((r) => <li key={r.ref}><button type="button" onClick={() => void commit([r])} className="flex min-h-12 w-full justify-between rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left"><span>{r.name} <span className="t-small text-dim">{r.grams} g</span></span><span className="t-num text-[12px]">{r.k} kcal</span></button></li>)}</ul> : <EmptyState message="[No recent foods.]" icon="log" />) : null}
      {tab === 'saved' ? (saved.length ? <ul className="flex flex-col gap-1">{saved.map((m) => <li key={m.id}><button type="button" onClick={() => void commit(m.items)} className="flex min-h-12 w-full justify-between rounded-[var(--r-1)] border border-[color:var(--line)] px-3 text-left"><span>{m.name}</span><span className="t-num text-[12px]">{totals([m]).k} kcal</span></button></li>)}</ul> : <EmptyState message="[No saved meals. Build one with 'Add another', then save it.]" icon="star" />) : null}
      {tab === 'scan' ? (
        <Scanner onCode={async (code) => {
          setMsg('[Searching the archive…]')
          const r = await lookupBarcode(code)
          if ('id' in r) { setMsg(''); choose({ id: `food:${r.id}`, name: r.name, k: r.k, p: r.p, c: r.c, f: r.f, unit: r.unit ?? {}, kind: 'food' }) }
          else if ('incomplete' in r) { setQuick({ ...quick, name: r.name }); setTab('quick'); setMsg('[Product found without nutrition data. Enter it manually.]') }
          else setMsg('offline' in r ? '[No connection. Try again later or use Quick add.]' : '[Product not found. Use Quick add.]')
        }} />
      ) : null}
      {tab === 'quick' ? (
        <form className="flex flex-col gap-2" onSubmit={async (e) => { e.preventDefault(); const f = await saveManualFood({ name: quick.name || 'Quick add', k: quick.k, p: quick.p, c: quick.c, f: quick.f, fi: 0 }); await commit([itemFrom({ ...f, id: `food:${f.id}` }, 100)]) }}>
          <input aria-label="Food name" placeholder="Name" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} className="min-h-12 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" />
          {(['k', 'p', 'c', 'f'] as const).map((k) => (
            <label key={k} className="flex items-center justify-between gap-2"><span className="t-label text-dim">{{ k: 'Calories', p: 'Protein g', c: 'Carbs g', f: 'Fat g' }[k]}</span><input type="number" inputMode="decimal" aria-label={{ k: 'Calories', p: 'Protein', c: 'Carbs', f: 'Fat' }[k]} value={quick[k] || ''} onChange={(e) => setQuick({ ...quick, [k]: Number(e.target.value) })} className="min-h-12 w-28 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3 text-right" /></label>
          ))}
          <Button type="submit">Log</Button>
        </form>
      ) : null}
      <span className="sr-only"><Icon name="barcode" /></span>
    </div>
  )
}
