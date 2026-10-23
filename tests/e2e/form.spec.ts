import { test, expect } from './fixtures'
import { awaken, checkIn } from './helpers'

test.use({ reducedMotion: 'reduce' })
test.setTimeout(180_000)

test('Form Check screen: lift choice, placement guide, graceful camera failure', async ({ page }) => {
  await awaken(page)
  await checkIn(page)
  await page.goto('/form')
  await expect(page.getByRole('heading', { name: 'Squat' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Lift' }).selectOption('pushup')
  await expect(page.getByRole('heading', { name: 'Push-up' })).toBeVisible()
  await expect(page.getByText(/Place the phone on the floor/)).toBeVisible()
  // Headless test browsers have no camera: the System explains instead of breaking.
  await page.getByRole('button', { name: 'Start camera' }).click()
  await expect(page.getByRole('alert')).toContainText(/camera/i)
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
})
