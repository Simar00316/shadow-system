import { render, screen } from '@testing-library/react'
import { App } from './App'

test('a new device is sent to the Awakening', async () => {
  render(<App />)
  expect(await screen.findByText(/qualifications to be a Player/, {}, { timeout: 5000 })).toBeInTheDocument()
})
