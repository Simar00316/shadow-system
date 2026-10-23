import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { applyPrefs, usePrefs } from './app/prefs'
import { requestPersistence } from './db/schema'
import { seedExercises } from './db/repo'
import { useToasts } from './state/toasts'
import './styles/index.css'

applyPrefs(usePrefs.getState())

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

// Ask the browser not to evict our data (R7 §2), then load the exercise library into IndexedDB.
void requestPersistence()
void seedExercises()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
