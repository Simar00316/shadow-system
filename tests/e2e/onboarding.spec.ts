import { test, expect } from './fixtures'
import { awaken, checkIn } from './helpers'

test.setTimeout(240_000)

test.describe('prologue', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('plays once before the System offer and can be skipped', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Continue in the browser' }).click()
    await expect(page.getByText(/Ten years ago, the first Gate opened/).first()).toBeVisible()
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
    await page.reload()
    await page.getByRole('button', { name: 'Continue in the browser' }).click()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
    await expect(page.getByText(/Ten years ago/)).toHaveCount(0)
  })
})

test.describe('first-visit tutorials', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:4173', localStorage: [{ name: 'shadow-prologue-seen', value: '1' }] }] } })
  test('Status explains itself once, step by step, with close and next', async ({ page }) => {
    await awaken(page)
    await checkIn(page)
    const tour = page.getByRole('dialog', { name: /^Tutorial:/ })
    await expect(tour).toHaveAccessibleName('Tutorial: Welcome, Player')
    for (let i = 0; i < 6; i++) await tour.getByRole('button', { name: 'Next' }).click()
    await expect(tour).toHaveAccessibleName('Tutorial: Gold and settings')
    await tour.getByRole('button', { name: 'Got it' }).click()
    await expect(tour).toBeHidden()
    await page.reload()
    await expect(page.getByText('Simar').or(page.getByText('Jinwoo')).first()).toBeVisible()
    await page.waitForTimeout(2000)
    await expect(page.getByRole('dialog', { name: /^Tutorial:/ })).toHaveCount(0)
    // Another tab has its own tutorial; ✕ closes it for good.
    await page.getByRole('button', { name: 'Quests' }).click()
    await expect(page.getByRole('dialog', { name: /^Tutorial:/ })).toBeVisible()
    await page.getByRole('button', { name: 'Close tutorial' }).click()
    await expect(page.getByRole('dialog', { name: /^Tutorial:/ })).toHaveCount(0)
  })
})
