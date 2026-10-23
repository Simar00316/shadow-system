import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button } from '@/ui/controls'
import { EmptyState } from '@/ui/feedback'
import { Icon } from '@/ui/icons'
import { ITEMS, itemById, STORE } from '@/data/items'
import { TITLES } from '@/data/titles'
import { buy, consumeItem } from '@/app/progression'
import { awardMany } from '@/app/game'
import { odds } from '@/engine/loot'
import { addDays, dayOf } from '@/engine/dates'
import type { Rarity } from '@/engine/types'

const RC: Record<Rarity, string> = { common: 'var(--rarity-common)', rare: 'var(--rarity-rare)', epic: 'var(--rarity-epic)', legendary: 'var(--rarity-legendary)' }

/** Inventory (PRD F3.15): owned items and how to use them. */
export function Inventory() {
  const nav = useNavigate()
  const inv = useLiveQuery(() => db.inventory.filter((i) => i.qty > 0).toArray(), [], [])
  const player = useLiveQuery(() => db.player.get('me'), [])
  const passes = useLiveQuery(async () => ((await db.settings.get('restPasses'))?.value as string[] | undefined) ?? [], [], [] as string[])
  return (
    <Screen tag="INVENTORY" title="Inventory" back="/system">
      {inv.length ? inv.map((i) => {
        const def = itemById.get(i.id)
        if (!def) return null
        const equipped = player?.theme === def.theme || player?.frame === def.id
        return (
          <SystemWindow key={i.id} tag={def.rarity.toUpperCase()} animate={false}>
            <div className="flex items-start gap-3">
              <Icon name={def.type === 'key' ? 'key' : def.type === 'theme' || def.type === 'skin' || def.type === 'frame' ? 'gem' : def.type === 'scroll' ? 'scroll' : 'potion'} style={{ color: RC[def.rarity] }} />
              <div className="min-w-0 flex-1">
                <div className="t-heading" style={{ color: RC[def.rarity] }}>{def.name} <span className="t-num text-dim">×{i.qty}</span></div>
                <p className="t-small text-dim">{def.description}</p>
                {def.id === 'rest_pass' ? <Button className="mt-2" variant="secondary" disabled={passes.includes(addDays(dayOf(), 1))} onClick={() => void consumeItem('rest_pass')}>{passes.includes(addDays(dayOf(), 1)) ? 'Declared for tomorrow' : 'Declare tomorrow a rest day'}</Button> : null}
                {def.id === 'instant_key' ? <Button className="mt-2" variant="secondary" onClick={() => nav('/train')}>Open from Train</Button> : null}
                {def.id === 'respec' ? <Button className="mt-2" variant="secondary" onClick={() => void consumeItem('respec')}>Return all stat points</Button> : null}
                {def.type === 'theme' || def.type === 'frame' ? <Button className="mt-2" variant={equipped ? 'ghost' : 'secondary'} disabled={equipped} onClick={() => void consumeItem(def.id)}>{equipped ? 'Equipped' : 'Equip'}</Button> : null}
                {def.id === 'elixir' ? <p className="t-small mt-1 text-glow">[Consumed automatically on a missed day.]</p> : null}
              </div>
            </div>
          </SystemWindow>
        )
      }) : <SystemWindow tag="INVENTORY"><EmptyState message="[Your inventory is empty.]" icon="inventory" action={<Button variant="secondary" onClick={() => nav('/store')}>Visit the Store</Button>} /></SystemWindow>}
      {player?.theme && player.theme !== 'system' ? <Button variant="ghost" onClick={() => db.player.update('me', { theme: 'system' })}>Restore the default System theme</Button> : null}
    </Screen>
  )
}

/** Titles: equip one for +3% XP in its category. */
export function Titles() {
  // Self-heal: grant any title already earned (an unlock can be lost if the app closes mid-workout-finish).
  useEffect(() => { void awardMany([], { quiet: true }).catch((e) => console.warn('[System] title check failed', e)) }, [])
  const owned = useLiveQuery(async () => new Set((await db.titles.toArray()).map((t) => t.id)), [], new Set<string>())
  const player = useLiveQuery(() => db.player.get('me'), [])
  return (
    <Screen tag="TITLES" title={`${owned.size} / ${TITLES.length} titles`} back="/system">
      {TITLES.map((t) => {
        const has = owned.has(t.id)
        const on = player?.title === t.id
        return (
          <SystemWindow key={t.id} tag={on ? 'EQUIPPED' : has ? 'TITLE' : 'LOCKED'} variant={on ? 'reward' : 'system'} state={has ? 'default' : 'disabled'} animate={false}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1"><div className="t-heading">{has ? t.name : '???'}</div><div className="t-small text-dim">{t.description} · +3% {t.category.toUpperCase()} XP</div></div>
              {has ? <Button variant={on ? 'ghost' : 'secondary'} onClick={() => db.player.update('me', { title: on ? undefined : t.id })}>{on ? 'Unequip' : 'Equip'}</Button> : null}
            </div>
          </SystemWindow>
        )
      })}
    </Screen>
  )
}

/** System Store: gold for convenience and cosmetics; drop odds visible. */
export function Store() {
  const player = useLiveQuery(() => db.player.get('me'), [])
  const inv = useLiveQuery(async () => new Map((await db.inventory.toArray()).map((i) => [i.id, i.qty])), [], new Map<string, number>())
  if (!player) return null
  const o = odds(player.pity)
  return (
    <Screen tag="STORE" title="System Store" back="/system" actions={<span className="t-num flex items-center gap-1 text-gold"><Icon name="gold" />{player.gold.toLocaleString()}</span>}>
      {STORE.map((i) => {
        const qty = inv.get(i.id) ?? 0
        const cosmeticOwned = (i.type === 'theme' || i.type === 'frame' || i.type === 'skin') && qty > 0
        const full = i.hold != null && qty >= i.hold
        return (
          <SystemWindow key={i.id} tag={i.rarity.toUpperCase()} animate={false}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="t-heading" style={{ color: RC[i.rarity] }}>{i.name}</div>
                <p className="t-small text-dim">{i.description}{i.hold ? ` Hold up to ${i.hold}.` : ''}</p>
              </div>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Button variant="gold" aria-label={`Buy ${i.name} for ${i.price} gold`} disabled={cosmeticOwned || full || player.gold < i.price!} onClick={() => void buy(i.id)}>{cosmeticOwned ? 'Owned' : full ? 'Full' : <><Icon name="gold" size={14} />{i.price!.toLocaleString()}</>}</Button>
                {!cosmeticOwned && !full && player.gold < i.price! ? <span className="t-micro text-faint">Need {(i.price! - player.gold).toLocaleString()} more</span> : null}
              </span>
            </div>
          </SystemWindow>
        )
      })}
      <SystemWindow tag="DROP ODDS" animate={false}>
        <ul className="t-small flex flex-col gap-1">
          {(['common', 'rare', 'epic', 'legendary'] as const).map((r) => <li key={r} className="flex justify-between"><span style={{ color: RC[r] }} className="capitalize">{r}</span><span className="t-num">{(o[r] * 100).toFixed(1)}%</span></li>)}
        </ul>
        <p className="t-small mt-2 text-dim">[Rare guaranteed within {o.guaranteedIn.rare} workouts, Epic within {o.guaranteedIn.epic}, Legendary within {o.guaranteedIn.legendary}. Legendary cosmetics are never sold.]</p>
      </SystemWindow>
      <p className="t-small text-center text-dim">{ITEMS.length} items exist in this world.</p>
    </Screen>
  )
}
