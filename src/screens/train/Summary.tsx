import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen, Row } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { Button } from '@/ui/controls'
import { AriseSequence, LevelUpBurst, LootReveal } from '@/ui/cinematics'
import { TypedText } from '@/ui/feedback'
import { useUnits } from '@/app/units'
import { itemById } from '@/data/items'
import { shadowById } from '@/data/shadows'
import { titleById } from '@/data/titles'

/** Workout summary (PRD F3.9): XP, stat gains, PRs, loot reveal, ARISE, System messages. */
export function Summary() {
  const { id } = useParams()
  const nav = useNavigate()
  const u = useUnits()
  const w = useLiveQuery(() => db.workouts.get(id!), [id])
  const names = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e.name])), [], new Map())
  const [arise, setArise] = useState(true)
  if (!w?.summary) return null
  const s = w.summary
  const shadowDef = s.shadow ? [...shadowById.values()].find((d) => d.name === s.shadow!.name) : undefined
  return (
    <Screen tag="DUNGEON CLEARED" title={w.name}>
      {s.shadow && arise && shadowDef ? <AriseSequence name={s.shadow.name} rank={s.shadow.rank.replace('_', ' ')} archetype={shadowDef.archetype} seed={s.shadow.id} lore={shadowDef.lore} onAccept={() => setArise(false)} /> : null}
      <SystemWindow tag="REWARDS" variant="reward">
        <TypedText text={`[The dungeon has been cleared. ${s.xp} XP acquired.]`} />
        {s.levelAfter > s.levelBefore ? <LevelUpBurst level={s.levelAfter} /> : null}
        <div className="mt-3">
          <Row label="XP"><span className="t-num text-gold">+{s.xp}</span></Row>
          <Row label="Gold"><span className="t-num text-gold">+{s.gold}</span></Row>
          <Row label="Sets"><span className="t-num">{s.sets}</span></Row>
          <Row label="Volume"><span className="t-num">{u.w(s.volumeKg)?.toLocaleString()} {u.lift}</span></Row>
          <Row label="Time"><span className="t-num">{s.durationMin} min</span></Row>
          {Object.entries(s.stats).map(([k, v]) => <Row key={k} label={k === 'per' ? 'SENSE' : k.toUpperCase()}><span className="t-num text-success">+{v}</span></Row>)}
        </div>
      </SystemWindow>
      {s.prs.length ? (
        <SystemWindow tag="PERSONAL RECORDS" variant="reward" animate={false}>
          <ul className="flex flex-col gap-1">{s.prs.map((p) => <li key={p.exerciseId} className="flex justify-between"><span>{names.get(p.exerciseId)}</span><span className="t-num text-gold">{u.w(p.e1rm)} {u.lift} e1RM</span></li>)}</ul>
        </SystemWindow>
      ) : null}
      {s.loot ? (
        <SystemWindow tag="LOOT" animate={false}>
          <LootReveal rarity={s.loot.rarity} name={itemById.get(s.loot.itemId)?.name ?? s.loot.itemId} detail={s.loot.gold ? `+${s.loot.gold} gold` : itemById.get(s.loot.itemId)?.description} />
        </SystemWindow>
      ) : null}
      {s.titles.length ? (
        <SystemWindow tag="TITLES ACQUIRED" animate={false}>
          <ul>{s.titles.map((t) => <li key={t} className="t-heading text-gold">{titleById.get(t)?.name}</li>)}</ul>
        </SystemWindow>
      ) : null}
      <Button className="w-full" onClick={() => nav('/')}>Return to Status</Button>
    </Screen>
  )
}
