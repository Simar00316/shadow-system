import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

test('a new device sees the prologue, then the System offer', async () => {
  localStorage.clear()
  render(<App />)
  expect(await screen.findByText(/Ten years ago, the first Gate opened/, {}, { timeout: 5000 })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
  expect(await screen.findByText(/qualifications to be a Player/, {}, { timeout: 5000 })).toBeInTheDocument()
})
