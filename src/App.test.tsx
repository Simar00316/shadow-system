import { render, screen } from '@testing-library/react'
import { App } from './App'

test('renders the System greeting', () => {
  render(<App />)
  expect(screen.getByText(/chosen as a Player/)).toBeInTheDocument()
})
