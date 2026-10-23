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
const Train = page(() => import('./screens/train/Train'), 'Train')
const BodyMapScreen = page(() => import('./screens/train/BodyMapScreen'), 'BodyMapScreen')
const Exercises = page(() => import('./screens/train/Exercises'), 'Exercises')
const ExerciseDetail = page(() => import('./screens/train/ExerciseDetail'), 'ExerciseDetail')
const PlanEditor = page(() => import('./screens/train/PlanEditor'), 'PlanEditor')
const Workout = page(() => import('./screens/train/Workout'), 'Workout')
const Summary = page(() => import('./screens/train/Summary'), 'Summary')
const Cardio = page(() => import('./screens/train/Cardio'), 'Cardio')
const Progress = page(() => import('./screens/progress/Progress'), 'Progress')
const Measurements = page(() => import('./screens/progress/Measurements'), 'Measurements')
const Quests = page(() => import('./screens/quests/Quests'), 'Quests')
const Dungeons = page(() => import('./screens/dungeons/Dungeons'), 'Dungeons')
const DungeonDetail = page(() => import('./screens/dungeons/Dungeons'), 'DungeonDetail')
const Castle = page(() => import('./screens/dungeons/Dungeons'), 'Castle')
const Shadows = page(() => import('./screens/shadows/Shadows'), 'Shadows')
const Inventory = page(() => import('./screens/shadows/Items'), 'Inventory')
const Titles = page(() => import('./screens/shadows/Items'), 'Titles')
const Store = page(() => import('./screens/shadows/Items'), 'Store')
const Diet = page(() => import('./screens/diet/Diet'), 'Diet')
const MealPlan = page(() => import('./screens/diet/MealPlan'), 'MealPlan')
const Grocery = page(() => import('./screens/diet/MealPlan'), 'Grocery')

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
              <Route path="train" element={<Train />} />
              <Route path="bodymap" element={<BodyMapScreen />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="exercises/:id" element={<ExerciseDetail />} />
              <Route path="plan" element={<PlanEditor />} />
              <Route path="workout/:id" element={<Workout />} />
              <Route path="workout/:id/summary" element={<Summary />} />
              <Route path="cardio" element={<Cardio />} />
              <Route path="progress" element={<Progress />} />
              <Route path="measurements" element={<Measurements />} />
              <Route path="quests" element={<Quests />} />
              <Route path="dungeons" element={<Dungeons />} />
              <Route path="dungeons/:id" element={<DungeonDetail />} />
              <Route path="castle" element={<Castle />} />
              <Route path="shadows" element={<Shadows />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="titles" element={<Titles />} />
              <Route path="store" element={<Store />} />
              <Route path="diet" element={<Diet />} />
              <Route path="diet/plan" element={<MealPlan />} />
              <Route path="diet/grocery" element={<Grocery />} />
              <Route path="*" element={<Sealed />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  )
}
