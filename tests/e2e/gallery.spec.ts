<<<<<<< HEAD
import { test, expect } from './fixtures'

const SECTIONS = ['colours', 'type', 'system-window', 'button', 'quest-card', 'stat-bar', 'rank-badge', 'emblems', 'shadows', 'body-map', 'exercise-card', 'set-row', 'rest-timer', 'number-stepper', 'toast', 'tabs', 'sheet', 'charts', 'ring', 'empty-state', 'icons', 'bottom-nav', 'cinematics', 'exercise-media']

test.use({ reducedMotion: 'reduce' })
// Linux WebKit on CI closes the page while rendering the full gallery (issue #94). Visual regression runs locally only.
test.skip(!!process.env.CI, 'gallery snapshots are local-only')

test.describe('component gallery visual snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-23T09:00:00'))
    await page.goto('/dev/gallery')
    await expect(page.getByRole('heading', { name: 'Component gallery' })).toBeVisible({ timeout: 15_000 })
    await page.evaluate(() => document.fonts.ready)
  })
  for (const id of SECTIONS) {
    test(id, async ({ page }) => {
      const el = page.locator(`[data-gallery="${id}"]`)
      await el.scrollIntoViewIfNeeded()
      await expect(el).toHaveScreenshot(`${id}.png`, { animations: 'disabled', maxDiffPixelRatio: 0.02 })
    })
  }
})
=======
import { test, expect } from './fixtures'

const SECTIONS = ['colours', 'type', 'system-window', 'button', 'quest-card', 'stat-bar', 'rank-badge', 'emblems', 'shadows', 'body-map', 'exercise-card', 'set-row', 'rest-timer', 'number-stepper', 'toast', 'tabs', 'sheet', 'charts', 'ring', 'empty-state', 'icons', 'bottom-nav']

test.use({ reducedMotion: 'reduce' })
// Linux WebKit on CI closes the page while rendering the full gallery (issue #94). Visual regression runs locally only.
test.skip(!!process.env.CI, 'gallery snapshots are local-only')

test.describe('component gallery visual snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-23T09:00:00'))
    await page.goto('/dev/gallery')
    await expect(page.getByRole('heading', { name: 'Component gallery' })).toBeVisible({ timeout: 15_000 })
    await page.evaluate(() => document.fonts.ready)
  })
  for (const id of SECTIONS) {
    test(id, async ({ page }) => {
      const el = page.locator(`[data-gallery="${id}"]`)
      await el.scrollIntoViewIfNeeded()
      await expect(el).toHaveScreenshot(`${id}.png`, { animations: 'disabled', maxDiffPixelRatio: 0.02 })
    })
  }
})
>>>>>>> main
