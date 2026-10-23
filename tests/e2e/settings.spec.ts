import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures'
import { awaken, checkIn } from './helpers'

test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' })
test.setTimeout(240_000)

test('settings: units, import, report, backup and restore, PIN (M12 gate)', async ({ page }) => {
  await awaken(page)
  await checkIn(page)
  await page.goto('/settings')

  await test.step('units switch per section', async () => {
    await page.getByRole('combobox', { name: 'Lifts' }).selectOption('lb')
    await expect(page.getByRole('combobox', { name: 'Lifts' })).toHaveValue('lb')
    await page.getByRole('combobox', { name: 'Lifts' }).selectOption('kg')
  })

  await test.step('import a Hevy export with review', async () => {
    await page.getByRole('link', { name: 'Import Hevy / Strong' }).click()
    await page.getByLabel('CSV file').setInputFiles('tests/fixtures/hevy-settypes-sample.csv')
    await expect(page.getByText('Hevy', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /^Import \d+ workouts$/ }).click()
    await expect(page.getByText(/Import complete: 2 workouts/)).toBeVisible()
  })

  await test.step('AI-ready report includes the imported lifts', async () => {
    await page.goto('/settings/report')
    await page.getByRole('tab', { name: '12 weeks' }).click()
    const report = page.getByRole('textbox', { name: 'Report' })
    await expect(report).toHaveValue(/You are my strength coach and nutritionist/)
    await expect(report).toHaveValue(/## Open questions the System detected/)
  })

  let backup = ''
  await test.step('back up to a file', async () => {
    await page.goto('/settings')
    const dl = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Back up' }).click()
    backup = readFileSync(await (await dl).path(), 'utf8')
    expect(JSON.parse(backup).format).toBe('shadow-system-backup')
    await expect(page.getByText('Never')).toHaveCount(0)
  })

  await test.step('restore the backup', async () => {
    await page.getByLabel('Backup file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) })
    await page.getByRole('button', { name: 'Replace and restore' }).click()
    await expect(page.getByText('[Backup restored.]')).toBeVisible()
  })

  await test.step('PIN locks the next launch', async () => {
    await page.getByRole('button', { name: 'Set PIN' }).click()
    await page.getByLabel('New PIN').fill('2468')
    await page.getByRole('button', { name: 'Save PIN' }).click()
    await expect(page.getByRole('button', { name: 'Remove PIN' })).toBeVisible()
    await page.evaluate(() => sessionStorage.clear())
    await page.goto('/')
    await expect(page.getByText('[Identify yourself, Player.]')).toBeVisible()
    await page.getByLabel('PIN').fill('1111')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page.getByText('[Incorrect PIN.]')).toBeVisible()
    await page.getByLabel('PIN').fill('2468')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})
