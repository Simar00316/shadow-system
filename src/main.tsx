import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { applyPrefs, usePrefs } from './app/prefs'
import { useToasts } from './state/toasts'
import './styles/index.css'
import { installTapGlitch } from './ui/fx'

applyPrefs(usePrefs.getState())
installTapGlitch()

// Service worker: offline shell + runtime media cache. A new version asks before reloading mid-workout.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const update = registerSW({
      onNeedRefresh() {
        useToasts.getState().push('info', '[A System update is ready. It will apply the next time you open the app.]')
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void update(true) }, { once: true })
      },
    })
  })
}

// Load the exercise library into IndexedDB (in a worker, after first paint) and ask the browser not to evict our data (R7 §2).
const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 2000))
addEventListener('load', () => {
  // The library seeds in a Web Worker, so it can start right away without blocking the main thread.
  void import('./db/repo').then((m) => m.seedExercises()).catch(() => undefined)
  idle(() => void import('./db/schema').then((m) => m.requestPersistence()).catch(() => undefined))
}, { once: true })

// Push reminders: heal a silently dropped subscription, then keep the Worker's daily booleans current (after load).
addEventListener('load', () => idle(() => void import('./app/push').then((p) => { void p.repairPush().catch(() => undefined); p.startStatusSync() }).catch((e) => console.warn('[System] push setup skipped', e))), { once: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
