import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { awaken, checkIn } from './helpers'

test.use({ reducedMotion: 'reduce' })
test.setTimeout(180_000)

/** Tap every pending "Complete set" check once (values prefilled = target → one tap per set). */
async function logAllSets(page: Page) {
  let logged = 0
  for (;;) {
    const next = page.getByRole('button', { name: /^Complete set \d+$/ }).first()
    if (await next.count() === 0) {
      const nextEx = page.getByRole('button', { name: 'Next' })
      if (await nextEx.isEnabled().catch(() => false)) { await nextEx.click(); continue }
      break
    }
    await next.click()
    logged++
    await expect(page.getByText(`${logged} sets logged`)).toBeVisible()
  }
  return logged
}

// Run in a time zone where it is about midday now, so hour-based hidden quests (Night Owl after 22:00,
// Dawn Hunter before 06:00) never add XP to the assertions below (#128). Etc/GMT+N means UTC-N.
const n = ((new Date().getUTCHours() - 12 + 36) % 24) - 12
test.use({ timezoneId: n === 0 ? 'Etc/GMT' : `Etc/GMT${n > 0 ? '+' : '-'}${Math.abs(n)}` })

test('logs a full workout offline with correct XP, then detects a PR', async ({ page, context }) => {
  await awaken(page)
  await checkIn(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)

  // A free session with a known exercise and explicit values (deterministic XP)
  await page.goto('/train')
  await page.getByRole('button', { name: 'Free session' }).click()
  await expect(page).toHaveURL(/\/workout\//)
  await page.getByRole('button', { name: 'Add exercise' }).first().click()
  await page.getByRole('searchbox', { name: 'Search exercises' }).fill('Barbell Bench Press')
  await page.getByRole('button', { name: 'Barbell Bench Press', exact: true }).click()
  // Set weight and reps explicitly on set 1, then log every set with one tap each
  await page.getByLabel('Set 1', { exact: true }).getByRole('button').first().click()
  const editor = page.getByRole('dialog', { name: 'Edit set' })
  await editor.getByRole('button', { name: /^Weight:/ }).click()
  await editor.getByRole('textbox', { name: 'Weight' }).fill('60')
  await editor.getByRole('textbox', { name: 'Weight' }).press('Enter')
  await editor.getByRole('button', { name: /^Reps:/ }).click()
  await editor.getByRole('textbox', { name: 'Reps' }).fill('5')
  await editor.getByRole('textbox', { name: 'Reps' }).press('Enter')
  await editor.getByRole('radiogroup', { name: 'Reps in reserve' }).getByRole('radio', { name: '1' }).click()
  await editor.getByRole('button', { name: 'Done' }).click()
  await page.getByRole('button', { name: 'Complete set 1' }).click()
  await expect(page.getByText('1 sets logged')).toBeVisible()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page).toHaveURL(/\/summary$/)
  // 8 XP (RIR 1 set) — no workout bonus for 1 set; daily quest core (session) clears → +100
  await expect(page.getByText(/\[The dungeon has been cleared\. 108 XP acquired\.\]/)).toBeVisible()

  // Second session: heavier bench → PR (75 XP) + set XP 8 = 83
  await page.goto('/train')
  await page.getByRole('button', { name: 'Free session' }).click()
  await page.getByRole('button', { name: 'Add exercise' }).first().click()
  await page.getByRole('searchbox', { name: 'Search exercises' }).fill('Barbell Bench Press')
  await page.getByRole('button', { name: 'Barbell Bench Press', exact: true }).click()
  await page.getByLabel('Set 1', { exact: true }).getByRole('button').first().click()
  await editor.getByRole('button', { name: /^Weight:/ }).click()
  await editor.getByRole('textbox', { name: 'Weight' }).fill('70')
  await editor.getByRole('textbox', { name: 'Weight' }).press('Enter')
  await editor.getByRole('button', { name: /^Reps:/ }).click()
  await editor.getByRole('textbox', { name: 'Reps' }).fill('5')
  await editor.getByRole('textbox', { name: 'Reps' }).press('Enter')
  await editor.getByRole('radiogroup', { name: 'Reps in reserve' }).getByRole('radio', { name: '1' }).click()
  await editor.getByRole('button', { name: 'Done' }).click()
  await page.getByRole('button', { name: 'Complete set 1' }).click()
  await expect(page.getByText(/New personal record|surpassed your limit|Record broken/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByText('PERSONAL RECORDS')).toBeVisible()
  await expect(page.getByText(/83 XP acquired/)).toBeVisible()

  // The planned session for today (or a free one on rest days) logs fully with one tap per set
  await page.goto('/train')
  const enter = page.getByRole('button', { name: 'Enter the dungeon' })
  if (await enter.count()) {
    await enter.click()
    const n = await logAllSets(page)
    expect(n).toBeGreaterThan(3)
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page).toHaveURL(/\/summary$/)
    await expect(page.getByText(/\d+ XP acquired/)).toBeVisible()
  }
  await context.setOffline(false)
})
