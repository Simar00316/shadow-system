import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { ShadowArt } from '@/ui/ShadowArt'
import { AriseSequence } from '@/ui/cinematics'
import { Button } from '@/ui/controls'
import { Sheet } from '@/ui/layout'
import { EmptyState } from '@/ui/feedback'
import { shadowById } from '@/data/shadows'
import { canRename, RANK_BUFF } from '@/engine/shadows'
import type { ShadowRec } from '@/engine/model'

const STAT = { str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', per: 'SENSE' } as const

/** Shadow Army (PRD F3.14): gallery with rank, buff and lore; equip up to 3; rename Knights and above; ARISE replay. */
export function Shadows() {
  const army = useLiveQuery(() => db.shadows.orderBy('rank').reverse().toArray(), [], [] as ShadowRec[])
  const player = useLiveQuery(() => db.player.get('me'), [])
  const [open, setOpen] = useState<ShadowRec | null>(null)
  const [replay, setReplay] = useState(false)
  const [name, setName] = useState('')
  if (!player) return null
  const equipped = player.equippedShadows
  const toggle = async (id: string) => db.player.update('me', { equippedShadows: equipped.includes(id) ? equipped.filter((x) => x !== id) : [...equipped, id].slice(-3) })
  const def = open ? shadowById.get(open.catalogId) : undefined
  return (
    <Screen tag="SHADOW ARMY" title={`${army.length} shadows`} back="/system">
      <SystemWindow tag="EQUIPPED" variant="shadow" animate={false}>
        <p className="t-small text-dim">Up to 3 shadows lend their passive buff to XP in their stat.</p>
        <p className="t-num mt-1 text-purple-text">{equipped.length}/3 equipped</p>
      </SystemWindow>
      {army.length ? (
        <div className="grid grid-cols-2 gap-3">
          {army.map((s) => {
            const d = shadowById.get(s.catalogId)!
            return (
              <button key={s.id} type="button" onClick={() => { setOpen(s); setName(s.name) }} className={`flex flex-col items-center rounded-[var(--r-1)] border bg-panel p-2 ${equipped.includes(s.id) ? 'border-purple shadow-[var(--glow-shadow)]' : 'border-[color:var(--line)]'}`} aria-label={`${s.name}, ${s.rank.replace('_', ' ')}`}>
                <ShadowArt archetype={d.archetype} seed={s.id} size={120} animate={false} />
                <span className="t-heading text-purple-text">{s.name}</span>
                <span className="t-tag text-dim">{s.rank.replace('_', ' ')}</span>
              </button>
            )
          })}
        </div>
      ) : <SystemWindow tag="ARMY" variant="shadow"><EmptyState message="[You have no shadows. Defeat a boss or break a major record to extract one.]" icon="shadow" /></SystemWindow>}
      <Sheet open={!!open && !replay} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open && def ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <ShadowArt archetype={def.archetype} seed={open.id} size={180} />
            <div className="t-tag text-purple-text">{open.rank.replace('_', ' ')} · {def.epithet}</div>
            <p className="t-system">{def.lore}</p>
            <p className="t-num text-gold">+{Math.round(RANK_BUFF[open.rank] * 100)}% {STAT[def.category]} XP</p>
            {canRename(open) ? (
              <div className="flex w-full gap-2"><input aria-label="Shadow name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} className="min-h-12 flex-1 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel px-3" /><Button variant="secondary" onClick={() => db.shadows.update(open.id, { name: name.trim() || def.name })}>Rename</Button></div>
            ) : <p className="t-small text-dim">[Shadows of Knight rank or higher can be named.]</p>}
            <div className="flex w-full gap-2">
              <Button variant="shadow" className="flex-1" onClick={() => void toggle(open.id)}>{equipped.includes(open.id) ? 'Unequip' : 'Equip'}</Button>
              <Button variant="ghost" onClick={() => setReplay(true)}>Replay ARISE</Button>
            </div>
          </div>
        ) : null}
      </Sheet>
      {replay && open && def ? <AriseSequence name={open.name} rank={open.rank.replace('_', ' ')} archetype={def.archetype} seed={open.id} lore={def.lore} onAccept={() => setReplay(false)} /> : null}
    </Screen>
  )
}
