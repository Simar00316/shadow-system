import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { MiniBar, QuestCard, StatBar, XPBar } from '@/ui/game'
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
import { Tour, type TourStep } from '@/ui/Tour'

const CLASS_NAME = (c: string) => c.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())

/** One vital (HP / MP / fatigue): value over a segmented bar. */
function Vital({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="min-w-0 flex-1" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-baseline justify-between">
        <span className="t-micro text-dim">{label}</span>
        <span className="t-num text-[15px]" style={{ color }}>{value}%</span>
      </div>
      <MiniBar className="mt-2" pct={value} color={color} />
    </div>
  )
}

const STATUS_TOUR: TourStep[] = [
  { title: 'Welcome, Player', body: 'This is your Status Window: the System tracks your training and food as an RPG. Here is a quick tour of what everything means.' },
  { target: 'hunter', title: 'Your Hunter card', body: 'Your rank (E is the start; it rises to S and beyond), your class and title. Your level goes up with XP from workouts, meals and quests. Power is your overall strength score.' },
  { target: 'vitals', title: 'Vitals', body: 'HP = how recovered your muscles are. MP = how ready you feel today (from the morning check-in). Fatigue = how much training you are still recovering from.' },
  { target: 'daily', title: 'Daily Quest', body: 'Clear these goals before midnight for XP and gold. Miss the core goal and the System sends you to the Penalty Zone, a short catch-up task the next day. Tap the quest to open Quests.' },
  { target: 'stats', title: 'Stats and points', body: 'STR, AGI, VIT, INT and SENSE grow from what you do (lifting, cardio, recovery, nutrition, good form). Level-ups give points: tap the gold + to spend them on any stat.' },
  { target: 'recovery', title: 'Recovery map', body: 'Green muscles are ready, yellow are recovering, red need rest. The plan uses this to pick exercises. Tap it for details.' },
  { target: 'topbar', title: 'Gold and settings', body: 'Gold buys items in the Store. The gear icon opens Settings (units, reminders, backup, and replaying these tutorials).' },
]

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
    <Screen tag="Hunter status" plain actions={
      <div className="flex items-center gap-2" data-tour="topbar">
        <Link to="/store" className="chip press" data-tone="gold" aria-label={`${player.gold} gold`}><Icon name="gold" size={14} /><span className="t-num text-[13px] tracking-normal">{player.gold.toLocaleString()}</span></Link>
        <Link to="/settings" className="press well h-9 w-9" aria-label="Settings"><Icon name="settings" size={18} /></Link>
      </div>
    }>
      <SystemWindow tag="STATUS" hero tour="hunter">
        <div className="flex items-center gap-4">
          <Link to="/quests" aria-label={`Rank ${player.rank}`} className="press shrink-0" data-glitch=""><RankBadge rank={player.rank} size="lg" /></Link>
          <div className="min-w-0 flex-1">
            <div className="t-micro text-dim">Player</div>
            <div className="t-screen truncate text-text glow-text">{profile.name}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="chip">{CLASS_NAME(profile.cls)}</span>
              <Link to="/titles" className="chip press" data-tone={title ? 'gold' : 'dim'}>{title ?? 'No title'}</Link>
            </div>
          </div>
        </div>
        <div className="mt-5"><XPBar level={player.level} xp={player.xp} xpToNext={xpToNext(player.level)} /></div>
        <div className="mt-4 flex items-end justify-between border-t border-[color:var(--hairline)] pt-3">
          <span className="flex items-center gap-2 text-dim"><Icon name="flame" size={16} className="text-gold" /><span className="t-num text-[15px] text-text">{player.streak}</span><span className="t-micro">day streak · best {player.bestStreak}</span></span>
          <span className="text-right"><span className="t-micro block text-dim">Power</span><span className="t-num-lg text-[24px] leading-none text-gold">{player.powerLevel.toLocaleString()}</span></span>
        </div>
      </SystemWindow>

      <SystemWindow tag="VITALS" index={1} tour="vitals">
        <div className="flex gap-4">
          <Vital label="HP" value={hp} color="var(--success)" />
          <Vital label="MP" value={mp} color="var(--glow)" />
          <Vital label="Fatigue" value={100 - hp} color="var(--warning)" />
        </div>
      </SystemWindow>

      {penalty && penalty.status === 'issued' ? (
        <QuestCard tag="PENALTY QUEST" variant="alert" title={penalty.title} until={penalty.expiresAt} goals={penalty.goals} reward={['Streak restored']} penalty={penalty.penalty} onOpen={() => nav('/quests')} />
      ) : null}
      {daily ? (
        <QuestCard tour="daily" tag="DAILY QUEST" title={daily.title} until={endOf(today)} goals={daily.goals} status={daily.status === 'issued' ? (daily.meta?.waived ? 'waived' : 'active') : daily.status === 'cleared' ? 'cleared' : 'failed'} reward={[`${daily.reward.xp} XP`, `${daily.reward.gold} Gold`]} penalty={daily.penalty} onOpen={() => nav('/quests')} />
      ) : null}

      <section aria-label="STATS" data-tour="stats">
        <div className="section-head">
          <span className="t-label text-dim">Stats</span>
          {player.unspent ? <span className="chip" data-tone="gold">{player.unspent} points</span> : <span className="t-micro text-faint">Available points <span className="t-num text-dim">0</span></span>}
        </div>
        <div className="flex flex-col gap-2">
          {STATS.map((s) => <StatBar key={s} stat={s} value={player.stats[s] + player.allocated[s]} allocated={player.allocated[s]} max={Math.max(100, player.stats[s] + player.allocated[s])} canAllocate={player.unspent > 0} onAllocate={() => { sfx.play('set-logged'); void allocatePoint(s) }} />)}
        </div>
      </section>

      <SystemWindow tag="RECOVERY" index={2} tour="recovery">
        <button type="button" className="press flex w-full items-center justify-around" onClick={() => nav('/bodymap?mode=recovery')} aria-label="Open recovery map">
          <BodyMap sex={profile.sex} face="front" mode="recovery" recovery={recovery?.rec} height={180} showFlip={false} />
          <BodyMap sex={profile.sex} face="back" mode="recovery" recovery={recovery?.rec} height={180} showFlip={false} />
        </button>
      </SystemWindow>
      <Tour id="status" steps={STATUS_TOUR} />
    </Screen>
  )
}
