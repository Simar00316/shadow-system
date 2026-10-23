import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { BottomNav, NAV } from '@/ui/layout'
import { Backdrop } from '@/ui/Backdrop'
import { ensureToday } from '@/app/game'
import { maintenance } from '@/app/progression'
import { dayOf } from '@/engine/dates'
import { say } from '@/app/notify'
import { ReadinessModal } from './ReadinessModal'

const TAB_FOR = (path: string) => (path === '/' ? 'status' : path.startsWith('/quests') || path.startsWith('/dungeons') ? 'quests' : path.startsWith('/train') || path.startsWith('/workout') || path.startsWith('/bodymap') || path.startsWith('/exercises') || path.startsWith('/plan') || path.startsWith('/cardio') ? 'train' : path.startsWith('/diet') ? 'diet' : 'system')
const ROUTE_FOR: Record<string, string> = { status: '/', quests: '/quests', train: '/train', diet: '/diet', system: '/system' }

/** App frame: requires a Player, keeps the day current, asks for readiness once a day, shows the bottom nav. */
export function Shell() {
  const loc = useLocation()
  const nav = useNavigate()
  const profile = useLiveQuery(() => db.profile.get('me').then((p) => p ?? false), [], undefined)
  const today = dayOf()
  const readiness = useLiveQuery(() => db.readiness.get(today).then((r) => r ?? false), [today], undefined)
  const pending = useLiveQuery(() => db.quests.where('day').equals(today).filter((q) => q.status === 'issued' && q.type !== 'hidden').count(), [today], 0)
  const theme = useLiveQuery(() => db.player.get('me').then((p) => p?.theme ?? 'system'), [], 'system')
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const [dismissed, setDismissed] = useState<string | null>(null)
  const readinessOpen = !!profile && readiness === false && dismissed !== today

  useEffect(() => {
    if (!profile) return
    const run = () => ensureToday().then(() => maintenance())
    void run()
    const onVis = () => { if (document.visibilityState === 'visible') void run() }
    document.addEventListener('visibilitychange', onVis)
    const onOffline = () => void say('offline', {}, { kind: 'info' })
    window.addEventListener('offline', onOffline)
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('offline', onOffline) }
  }, [profile])

  if (profile === undefined) return null
  if (profile === false) return <Navigate to="/awakening" replace />
  const tab = TAB_FOR(loc.pathname)
  return (
    <>
      <Backdrop variant={loc.pathname.startsWith('/shadows') ? 'shadow' : 'dungeon'} />
      <Outlet />
      <BottomNav active={tab} onNavigate={(id) => nav(ROUTE_FOR[id])} items={NAV.map((n) => (n.id === 'quests' ? { ...n, badge: pending > 0 } : n))} />
      <ReadinessModal open={readinessOpen} onClose={() => setDismissed(today)} />
    </>
  )
}
