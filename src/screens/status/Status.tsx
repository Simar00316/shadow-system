import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen, Row } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { QuestCard, StatBar, XPBar } from '@/ui/game'
import { RankBadge } from '@/ui/RankBadge'
import { BodyMap } from '@/ui/BodyMap'
import { Icon } from '@/ui/icons'
import { usePlayer, useProfile, useQuest, useRecovery, useToday } from '@/app/hooks'
import { allocatePoint } from '@/app/game'
import { titleById } from '@/data/titles'
import { overallRecovery } from '@/engine/recovery'
import { xpToNext } from '@/engine/xp'
import { endOf } from '@/engine/dates'
import { STATS } from '@/engine/types'
import { sfx } from '@/audio/sfx'

const CLASS_NAME = (c: string) => c.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())

function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="t-label w-16 text-dim">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(47_168_255/.12)]" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <span className="t-num w-12 text-right">{value}%</span>
    </div>
  )
}

export function Status() {
  const nav = useNavigate()
  const profile = useProfile()
  const player = usePlayer()
  const today = useToday()
  const daily = useQuest(`daily-${today}`)
  const penalty = useQuest(`penalty-${today}`)
  const recovery = useRecovery()
  const readiness = useLiveQuery(() => db.readiness.get(today), [today])
  if (!profile || !player) return null
  const hp = recovery ? overallRecovery(recovery.rec, recovery.trained) : 100
  const mp = readiness ? Math.round(((readiness.score - 1) / 4) * 100) : 0
  const title = player.title ? titleById.get(player.title)?.name : undefined
  return (
    <Screen tag="STATUS">
      <SystemWindow tag="STATUS" grid>
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <Row label="Name"><span className="t-heading">{profile.name}</span></Row>
            <Row label="Job"><span className="capitalize">{CLASS_NAME(profile.cls)}</span></Row>
            <Row label="Title"><Link to="/titles" className="text-glow">{title ?? '[None]'}</Link></Row>
            <Row label="Power"><span className="t-num text-gold">{player.powerLevel}</span></Row>
          </div>
          <Link to="/quests" aria-label={`Rank ${player.rank}`}><RankBadge rank={player.rank} size="md" /></Link>
        </div>
        <div className="mt-3"><XPBar level={player.level} xp={player.xp} xpToNext={xpToNext(player.level)} /></div>
        <div className="mt-4 flex flex-col gap-2">
          <Gauge label="HP" value={hp} color="var(--success)" />
          <Gauge label="MP" value={mp} color="var(--glow)" />
          <Gauge label="Fatigue" value={100 - hp} color="var(--warning)" />
        </div>
      </SystemWindow>

      <SystemWindow tag="STATS" animate={false}>
        <div className="flex flex-col gap-1">
          {STATS.map((s) => <StatBar key={s} stat={s} value={player.stats[s] + player.allocated[s]} allocated={player.allocated[s]} max={Math.max(100, player.stats[s] + player.allocated[s])} canAllocate={player.unspent > 0} onAllocate={() => { sfx.play('set-logged'); void allocatePoint(s) }} />)}
        </div>
        <div className="mt-2 flex justify-between">
          <span className="t-label text-dim">Available points</span>
          <span className={`t-num ${player.unspent ? 'text-gold' : 'text-dim'}`}>{player.unspent}</span>
        </div>
      </SystemWindow>

      <div className="grid grid-cols-2 gap-3">
        <SystemWindow tag="STREAK" animate={false}>
          <div className="flex items-center gap-2"><Icon name="flame" className="text-gold" /><span className="t-num-lg">{player.streak}</span><span className="t-small text-dim">days</span></div>
          <div className="t-small text-dim">Best {player.bestStreak}</div>
        </SystemWindow>
        <SystemWindow tag="GOLD" animate={false}>
          <Link to="/store" className="flex items-center gap-2"><Icon name="gold" className="text-gold" /><span className="t-num-lg text-gold">{player.gold.toLocaleString()}</span></Link>
          <div className="t-small text-dim">Visit the Store</div>
        </SystemWindow>
      </div>

      {penalty && penalty.status === 'issued' ? (
        <QuestCard tag="PENALTY QUEST" variant="alert" title={penalty.title} until={penalty.expiresAt} goals={penalty.goals} reward={['Streak restored']} penalty={penalty.penalty} onOpen={() => nav('/quests')} />
      ) : null}
      {daily ? (
        <QuestCard tag="DAILY QUEST" title={daily.title} until={endOf(today)} goals={daily.goals} status={daily.status === 'issued' ? (daily.meta?.waived ? 'waived' : 'active') : daily.status === 'cleared' ? 'cleared' : 'failed'} reward={[`${daily.reward.xp} XP`, `${daily.reward.gold} Gold`]} penalty={daily.penalty} onOpen={() => nav('/quests')} />
      ) : null}

      <SystemWindow tag="RECOVERY" animate={false}>
        <button type="button" className="flex w-full items-center justify-around" onClick={() => nav('/bodymap?mode=recovery')} aria-label="Open recovery map">
          <BodyMap sex={profile.sex} face="front" mode="recovery" recovery={recovery?.rec} height={180} showFlip={false} />
          <BodyMap sex={profile.sex} face="back" mode="recovery" recovery={recovery?.rec} height={180} showFlip={false} />
        </button>
      </SystemWindow>
    </Screen>
  )
}
