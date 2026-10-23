import { test, expect } from './fixtures'
import { awaken } from './helpers'

test.use({ reducedMotion: 'reduce' })
test.setTimeout(120_000)

test('full first launch: Awakening → Status Window → readiness check-in → works offline', async ({ page, context }) => {
  await awaken(page)
  // Readiness check-in appears on the first open of the day
  const sheet = page.getByRole('dialog', { name: '[Readiness check-in]' })
  await expect(sheet).toBeVisible()
  await sheet.getByRole('radiogroup', { name: 'Sleep quality' }).getByRole('radio', { name: '4' }).click()
  await sheet.getByRole('button', { name: 'Report to the System' }).click()
  await expect(sheet).toBeHidden()

  // Status Window
  await expect(page.getByLabel('STATUS').first()).toBeVisible()
  await expect(page.getByText('Jinwoo')).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Experience' })).toBeVisible()
  await expect(page.getByRole('img', { name: /E rank/ })).toBeVisible()
  await expect(page.getByText('Preparation to Become Strong')).toBeVisible()
  await expect(page.getByText('Readiness check-in')).toBeVisible()
  // Awakening XP was granted, and the System spoke
  await expect(page.getByRole('progressbar', { name: 'Experience' })).not.toHaveAttribute('aria-valuenow', '0')

  // System log has the welcome message
  await page.getByRole('button', { name: /System/ }).last().click()
  await page.getByRole('link', { name: 'System log' }).click()
  await expect(page.getByText(/Player/).first()).toBeVisible()

  // Offline: reload from the service worker and the data is still there
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Jinwoo')).toBeVisible()
  await context.setOffline(false)
})
