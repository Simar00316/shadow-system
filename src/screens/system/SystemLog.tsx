import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Screen } from '@/ui/Screen'
import { SystemWindow } from '@/ui/SystemWindow'
import { EmptyState } from '@/ui/feedback'
import { Tabs } from '@/ui/controls'

const COLOR = { info: 'var(--glow)', success: 'var(--success)', warning: 'var(--warning)', reward: 'var(--gold)', shadow: 'var(--shadow-purple-text)' } as const

/** Every System message and notification in history (PRD F3.18). */
export function SystemLog() {
  const [filter, setFilter] = useState<'all' | 'reward' | 'warning'>('all')
  const [limit, setLimit] = useState(100)
  const msgs = useLiveQuery(() => db.systemMessages.orderBy('at').reverse().filter((m) => filter === 'all' || m.kind === filter).limit(limit).toArray(), [filter, limit], [])
  return (
    <Screen tag="SYSTEM LOG" title="System log" back="/system">
      <Tabs label="Filter" value={filter} onChange={setFilter} tabs={[{ id: 'all', label: 'All' }, { id: 'reward', label: 'Rewards' }, { id: 'warning', label: 'Warnings' }]} />
      <SystemWindow tag="MESSAGES" animate={false}>
        {msgs.length ? (
          <ul className="flex flex-col">
            {msgs.map((m) => (
              <li key={m.id} className="border-b border-[rgb(47_168_255/.08)] py-2 last:border-0">
                <div className="t-small text-dim">{new Date(m.at).toLocaleString()}</div>
                <div className="t-system" style={{ color: COLOR[m.kind] }}>{m.text}</div>
              </li>
            ))}
          </ul>
        ) : <EmptyState message="[No System messages have been recorded.]" icon="log" />}
        {msgs.length === limit ? <button type="button" className="t-label mt-3 min-h-12 w-full text-glow" onClick={() => setLimit(limit + 100)}>Load older</button> : null}
      </SystemWindow>
    </Screen>
  )
}
