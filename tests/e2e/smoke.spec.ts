import { test, expect } from './fixtures'

test('app boots', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/chosen as a Player/)).toBeVisible()
})
