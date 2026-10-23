import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { Icon, type IconName } from '@/ui/icons'
import { RankBadge } from '@/ui/RankBadge'
import { usePlayer, useProfile } from '@/app/hooks'

const TILES: { to: string; label: string; icon: IconName; group: string }[] = [
  { to: '/progress', label: 'Progress', icon: 'chart', group: 'Hunter' },
  { to: '/measurements', label: 'Body & photos', icon: 'scale', group: 'Hunter' },
  { to: '/bodymap', label: 'Body map', icon: 'status', group: 'Hunter' },
  { to: '/titles', label: 'Titles', icon: 'title', group: 'Hunter' },
  { to: '/dungeons', label: 'Dungeons', icon: 'dungeon', group: 'World' },
  { to: '/shadows', label: 'Shadow Army', icon: 'shadow', group: 'World' },
  { to: '/inventory', label: 'Inventory', icon: 'inventory', group: 'World' },
  { to: '/store', label: 'Store', icon: 'store', group: 'World' },
  { to: '/exercises', label: 'Exercises', icon: 'search', group: 'Training' },
  { to: '/plan', label: 'Plan editor', icon: 'edit', group: 'Training' },
  { to: '/cardio', label: 'Cardio log', icon: 'cardio', group: 'Training' },
  { to: '/form', label: 'Form check', icon: 'pose', group: 'Training' },
  { to: '/log', label: 'System log', icon: 'log', group: 'System' },
  { to: '/settings', label: 'Settings', icon: 'settings', group: 'System' },
]

/** System menu (design-v2 §5.5): a profile strip, then inset groups of rows with one live value each. */
export function SystemMenu() {
  const profile = useProfile()
  const player = usePlayer()
  const live = useLiveQuery(async () => {
    const [weight, shadows, titles, items] = await Promise.all([
      db.measurements.where('type').equals('weight').sortBy('day').then((m) => m.at(-1)?.value),
      db.shadows.count(), db.titles.count(), db.inventory.filter((i) => i.qty > 0).count(),
    ])
    return { weight, shadows, titles, items } as Record<string, number | undefined>
  }, [], {} as Record<string, number | undefined>)
  const value: Partial<Record<string, string>> = {
    '/progress': live.weight ? `${live.weight} kg` : undefined,
    '/shadows': live.shadows !== undefined ? String(live.shadows) : undefined,
    '/titles': live.titles !== undefined ? String(live.titles) : undefined,
    '/inventory': live.items !== undefined ? `${live.items} items` : undefined,
  }
  const groups = [...new Set(TILES.map((t) => t.group))]
  return (
    <Screen tag="SYSTEM" title="System">
      {profile && player ? (
        <Link to="/" data-glitch="" className="press flex items-center gap-3 rounded-[var(--r-card)] border border-[color:var(--edge-hi)] bg-[image:var(--surface-hero)] p-3 shadow-[var(--elev-card)]">
          <RankBadge rank={player.rank} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="t-h2 truncate text-text">{profile.name}</div>
            <div className="t-micro text-dim">LV {player.level} · {profile.cls.replace('_', ' ')}</div>
          </div>
          <span className="chip" data-tone="gold"><Icon name="gold" size={14} /><span className="t-num text-[13px] tracking-normal">{player.gold.toLocaleString()}</span></span>
        </Link>
      ) : null}
      {groups.map((g) => (
        <section key={g} aria-label={g}>
          <h2 className="section-head t-label text-dim">{g}</h2>
          <ul className="group">
            {TILES.filter((t) => t.group === g).map((t) => (
              <li key={t.to}>
                <Link to={t.to} data-glitch="" className="group-row press">
                  <span className="well"><Icon name={t.icon} size={18} /></span>
                  <span className="glitch-label t-row min-w-0 flex-1 truncate text-text">{t.label}</span>
                  {value[t.to] ? <span className="t-num text-[13px] text-dim">{value[t.to]}</span> : null}
                  <Icon name="next" size={16} className="text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Screen>
  )
}
