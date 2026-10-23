import { test, expect } from './fixtures'

test('app boots', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Install the System' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue in the browser' }).click()
  await expect(page.getByLabel(/qualifications to be a Player/)).toBeVisible()
})
