import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import Fuse from 'fuse.js'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button, IconButton, NumberStepper, Tabs } from '@/ui/controls'
import { Ring } from '@/ui/game'
import { Sheet } from '@/ui/layout'
import { EmptyState } from '@/ui/feedback'
import { Icon } from '@/ui/icons'
import { useProfile, useToday } from '@/app/hooks'
import { addWater, dayTargets, deleteMealLog, foodIndex, itemFrom, logMeal, lookupBarcode, recentItems, saveManualFood, saveMeal, totals, type FoodHit } from '@/app/diet'
import type { MealItem, MealSlot } from '@/engine/model'
import { Scanner } from './Scanner'

const SLOT_LABEL: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

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
  return (
    <Screen tag="NUTRITION" title="Diet" actions={<IconButton icon="log" label="Meal plan" onClick={() => nav('/diet/plan')} />}>
      <SystemWindow tag="TODAY" grid>
        <div className="grid grid-cols-2 gap-2">
          <Ring label="Calories" value={t.k} target={targets.kcal} unit="" />
          <Ring label="Protein" value={t.p} target={targets.protein} color="var(--success)" unit="g" />
          <Ring label="Carbs" value={t.c} target={targets.carbs} color="var(--glow)" unit="g" />
          <Ring label="Fat" value={t.f} target={targets.fat} color="var(--gold)" unit="g" />
        </div>
        {targets.warnings.length ? <p className="t-small mt-2 text-amber">{targets.warnings.join(' ')}</p> : null}
        <p className="t-small mt-2 text-dim">[Target {targets.kcal} kcal ({targets.phase}). Safe minimum {targets.floor} kcal.]</p>
      </SystemWindow>
      <SystemWindow tag="WATER" animate={false}>
        <div className="flex items-center gap-4">
          <Ring label="Water" value={water} target={targets.waterMl} color="var(--system-blue)" unit="ml" size={96} />
          <div className="grid flex-1 grid-cols-2 gap-2">
            {[250, 500].map((ml) => <Button key={ml} variant="secondary" icon="water" onClick={() => void addWater(ml)}>+{ml}</Button>)}
          </div>
        </div>
      </SystemWindow>
      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]).map((s) => {
        const mine = logs.filter((l) => l.meal === s)
        const k = totals(mine).k
        return (
          <SystemWindow key={s} tag={SLOT_LABEL[s].toUpperCase()} animate={false}>
            {mine.length ? (
              <ul className="mb-2 flex flex-col gap-1">
                {mine.flatMap((l) => l.items.map((i, j) => (
                  <li key={`${l.id}-${j}`} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate">{i.name} <span className="t-small text-dim">{i.grams} g</span></span>
                    <span className="t-num text-[13px]">{i.k} kcal · {i.p}p</span>
                    {j === 0 ? <IconButton icon="trash" label={`Delete ${i.name}`} onClick={() => void deleteMealLog(l.id)} /> : <span className="w-12" />}
                  </li>
                )))}
              </ul>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="t-num text-dim">{k} kcal</span>
              <Button variant="secondary" icon="plus" onClick={() => setSlot(s)}>Add food</Button>
            </div>
          </SystemWindow>
        )
      })}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon="diet" onClick={() => nav('/diet/plan')}>Meal plan</Button>
        <Button variant="secondary" icon="inventory" onClick={() => nav('/diet/grocery')}>Grocery list</Button>
      </div>
      <Sheet open={!!slot} onClose={() => setSlot(null)} title={slot ? `Add to ${SLOT_LABEL[slot]}` : ''}>
        {slot ? <AddFood slot={slot} onDone={() => setSlot(null)} /> : null}
      </Sheet>
    </Screen>
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
      <Tabs label="Add food by" value={tab} onChange={setTab} tabs={[{ id: 'search', label: 'Search' }, { id: 'recent', label: 'Recent' }, { id: 'saved', label: 'Saved' }, { id: 'scan', label: 'Scan' }, { id: 'quick', label: 'Quick' }]} />
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
