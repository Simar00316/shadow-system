import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { lazy, Suspense, type ComponentType } from 'react'
import { Toaster } from './ui/feedback'
import { usePrefs } from './app/prefs'
import { Shell } from './screens/Shell'
import { Status } from './screens/status/Status'
import { Awakening } from './screens/awakening/Awakening'
import { SystemMenu } from './screens/system/SystemMenu'
import { SystemLog } from './screens/system/SystemLog'
import { Sealed } from './screens/Sealed'

const page = <T extends Record<string, ComponentType>>(load: () => Promise<T>, name: keyof T) => lazy(() => load().then((m) => ({ default: m[name] as ComponentType })))
const Gallery = page(() => import('./screens/dev/Gallery'), 'Gallery')

export function App() {
  const reduce = usePrefs((p) => p.reduceMotion)
  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'user'}>
      <BrowserRouter>
        <div className="scanlines" aria-hidden="true" />
        <Toaster />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/awakening" element={<Awakening />} />
            <Route path="/dev/gallery" element={<Gallery />} />
            <Route element={<Shell />}>
              <Route index element={<Status />} />
              <Route path="system" element={<SystemMenu />} />
              <Route path="log" element={<SystemLog />} />
              <Route path="*" element={<Sealed />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  )
}
