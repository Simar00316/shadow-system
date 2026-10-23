import { test, expect } from './fixtures'
import { awaken, checkIn } from './helpers'

test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' })
test.setTimeout(240_000)

test('a full logged day hits the targets (M9 gate)', async ({ page }) => {
  // Open Food Facts is mocked: no real network in tests
  await page.route('**/world.openfoodfacts.org/**', (route) => route.fulfill({ json: { status: 1, product: { product_name: 'Test Oats', brands: 'Acme', serving_quantity: 40, nutriments: { 'energy-kcal_100g': 380, proteins_100g: 13, carbohydrates_100g: 60, fat_100g: 7 } } } }))
  await awaken(page, { diet: 'Vegetarian' })
  await checkIn(page)

  await test.step('generate the meal plan and log every planned meal with one tap', async () => {
    await page.goto('/diet/plan')
    await page.getByRole('button', { name: 'Generate this week' }).click()
    const logButtons = page.getByRole('button', { name: /^Log / })
    await expect(logButtons.first()).toBeVisible()
    const n = await logButtons.count()
    expect(n).toBe(4)
    for (let i = 0; i < n; i++) {
      await logButtons.nth(i).click()
      await expect(logButtons.nth(i)).toHaveText('Again')
    }
  })

  await test.step('water to target', async () => {
    await page.goto('/diet')
    const ring = page.getByLabel(/^Water: \d+ of \d+ ml$/)
    await expect(ring).toBeVisible()
    for (let i = 0; i < 20; i++) {
      const label = (await ring.getAttribute('aria-label'))!
      const [, have, want] = label.match(/(\d+) of (\d+)/)!.map(Number)
      if (have >= want) break
      await page.getByRole('button', { name: '+500' }).click()
      await expect(ring).not.toHaveAttribute('aria-label', label)
    }
  })

  await test.step('calories within 10% and protein at least 90% of target', async () => {
    const cal = (await page.getByLabel(/^Calories: \d+ of \d+$/).getAttribute('aria-label'))!
    const [, kcal, kcalT] = cal.match(/(\d+) of (\d+)/)!.map(Number)
    expect(Math.abs(kcal - kcalT) / kcalT).toBeLessThanOrEqual(0.1)
    const pro = (await page.getByLabel(/^Protein: \d+ of \d+ g$/).getAttribute('aria-label'))!
    const [, p, pT] = pro.match(/(\d+) of (\d+)/)!.map(Number)
    expect(p).toBeGreaterThanOrEqual(pT * 0.9)
  })

  await test.step('Daily Quest water and protein goals cleared', async () => {
    await page.goto('/quests')
    const daily = page.getByRole('region', { name: 'DAILY QUEST' })
    await expect(daily.getByText(/\[\d+\/\d+ ml\]/)).toHaveClass(/text-success/)
    await expect(daily.getByText(/\[\d+\/\d+ g\]/)).toHaveClass(/text-success/)
  })

  await test.step('barcode lookup (manual entry) logs a scanned food', async () => {
    await page.goto('/diet')
    await page.getByRole('region', { name: 'SNACKS' }).getByRole('button', { name: 'Add food' }).click()
    await page.getByRole('tab', { name: 'Scan' }).click()
    await page.getByRole('textbox', { name: 'Barcode number' }).fill('012345678905')
    await page.getByRole('button', { name: 'Look up' }).click()
    await expect(page.getByText('Test Oats')).toBeVisible()
    await page.getByRole('button', { name: 'Log', exact: true }).click()
    await expect(page.getByRole('region', { name: 'SNACKS' }).getByText(/Test Oats/)).toBeVisible()
  })

  await test.step('grocery list from the plan', async () => {
    await page.goto('/diet/grocery')
    const first = page.getByRole('checkbox').first()
    await first.click()
    await expect(first).toBeChecked()
    await page.reload()
    await expect(page.getByRole('checkbox').first()).toBeChecked()
  })
})
