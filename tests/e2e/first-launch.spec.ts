import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'

/** Walk the whole Awakening as a new Player (M6 gate). Exported for later specs that need a Player. */
export async function awaken(page: Page, opts: { experience?: 'Beginner' | 'Intermediate'; diet?: string } = {}) {
  await page.goto('/')
  await expect(page).toHaveURL(/\/awakening/)
  // iPhone Safari (not installed) is first shown the Add to Home Screen guide
  await page.getByRole('button', { name: 'Continue in the browser' }).click()
  await page.getByRole('button', { name: 'Accept' }).click()
  await page.getByRole('textbox', { name: 'Name' }).fill('Jinwoo')
  const next = () => page.getByRole('button', { name: /^(Next|No injuries|Begin the test)$/ }).click()
  await next() // name
  await page.getByRole('radio', { name: 'Male', exact: true }).click()
  await next() // sex
  await next() // birth year
  await page.getByRole('radio', { name: 'Kilograms' }).first().click()
  await page.getByRole('radio', { name: 'Kilograms' }).nth(1).click()
  await next() // units
  await next() // height/weight
  await page.getByRole('radio', { name: 'Build muscle', exact: true }).click()
  await next() // goal
  await page.getByRole('radio', { name: new RegExp(`^${opts.experience ?? 'Beginner'}`) }).click()
  await next() // experience
  await page.getByRole('radio', { name: 'Full gym', exact: true }).click()
  await next() // equipment
  await next() // injuries
  await next() // schedule (Mon/Wed/Fri default)
  if (opts.diet) await page.getByRole('radio', { name: opts.diet }).click()
  await next() // diet
  await next() // reminders
  await next() // begin test
  await page.getByRole('button', { name: 'Increase Push-ups' }).click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Increase Squats' }).click()
  await page.getByRole('button', { name: 'Increase Plank' }).click()
  await page.getByRole('button', { name: 'Record results' }).click()
  await expect(page.getByText('Choose your class')).toBeVisible()
  await page.getByRole('button', { name: /^Tank/ }).click()
  await page.getByRole('button', { name: 'Confirm class' }).click()
  await expect(page.getByLabel(/Power Level \d+/)).toBeVisible()
  await page.getByRole('button', { name: 'Enter the System' }).click()
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
}

test.use({ reducedMotion: 'reduce' })

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
