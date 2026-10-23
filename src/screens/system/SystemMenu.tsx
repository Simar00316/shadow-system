import { Link } from 'react-router-dom'
import { Screen } from '@/ui/Screen'
import { Icon, type IconName } from '@/ui/icons'

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

export function SystemMenu() {
  const groups = [...new Set(TILES.map((t) => t.group))]
  return (
    <Screen tag="SYSTEM" title="System">
      {groups.map((g) => (
        <section key={g} aria-label={g}>
          <h2 className="t-tag mb-2 text-dim">{g}</h2>
          <div className="grid grid-cols-3 gap-2">
            {TILES.filter((t) => t.group === g).map((t) => (
              <Link key={t.to} to={t.to} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-[var(--r-1)] border border-[color:var(--line)] bg-panel p-2 text-center text-glow transition active:scale-95">
                <Icon name={t.icon} size={28} />
                <span className="t-label text-[12px] text-text">{t.label}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Screen>
  )
}
