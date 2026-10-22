import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Gallery } from './screens/dev/Gallery'
import { Toaster } from './ui/feedback'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <div className="scanlines" aria-hidden="true" />
        <Toaster />
        <Routes>
          <Route path="/dev/gallery" element={<Gallery />} />
          <Route path="*" element={<h1 className="t-title p-6">[You have been chosen as a Player.]</h1>} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
