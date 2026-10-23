import { render, screen } from '@testing-library/react'
import { App } from './App'

test('a new device is sent to the Awakening', async () => {
  render(<App />)
  expect(await screen.findByLabelText(/qualifications to be a Player/)).toBeInTheDocument()
})
