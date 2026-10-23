import { test, expect } from './fixtures'
import { awaken, checkIn } from './helpers'

test.use({ reducedMotion: 'reduce' })
test.setTimeout(240_000)

test('progress and game screens work end to end (M8 gate)', async ({ page }) => {
  await awaken(page)
  await checkIn(page)

  await test.step('seed gold through the ledger', async () => {
    await page.evaluate(() => new Promise<void>((res, rej) => {
      const req = indexedDB.open('shadow-system')
      req.onsuccess = () => {
        const tx = req.result.transaction('xpEvents', 'readwrite')
        tx.objectStore('xpEvents').add({ id: 'seed-gold', ts: Date.now(), day: new Date().toISOString().slice(0, 10), type: 'gold', refId: 'seed', base: 0, mult: 1, xp: 0, gold: 5000, category: 'vit' })
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error)
      }
    }))
    await page.reload()
  })

  await test.step('Store: buy an Elixir of Life and a theme', async () => {
    await page.goto('/store')
    const gold = page.locator('header').getByText(/\d/).last()
    await expect(gold).toContainText('5')
    await page.getByRole('button', { name: /Buy Elixir of Life for 250 gold/ }).click()
    await expect(page.getByText(/Purchased|Transaction complete|The Store thanks you/).first()).toBeVisible()
    await page.getByRole('button', { name: /Buy Theme: Frost Dungeon/ }).click()
    await expect(page.getByRole('button', { name: /Buy Theme: Frost Dungeon/ })).toContainText('Owned')
    await expect(page.getByText('DROP ODDS')).toBeVisible()
  })

  await test.step('Inventory: items listed, theme equips', async () => {
    await page.goto('/inventory')
    await expect(page.getByText('Elixir of Life')).toBeVisible()
    await page.getByRole('button', { name: 'Equip' }).first().click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'frost')
    await page.getByRole('button', { name: 'Restore the default System theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system')
  })

  await test.step('Quests: daily quest, trial panel, hidden quests', async () => {
    await page.goto('/quests')
    await expect(page.getByText('Preparation to Become Strong', { exact: true })).toBeVisible()
    await expect(page.getByText('RANK-UP TRIAL')).toBeVisible()
    await expect(page.getByText('HIDDEN QUESTS')).toBeVisible()
    await expect(page.getByText('???').first()).toBeVisible()
  })

  await test.step('Dungeons: enter an E-rank Gate and its first floor', async () => {
    await page.goto('/dungeons')
    await page.getByRole('button', { name: /Hollow Gate: Home Calisthenics/ }).click()
    await page.getByRole('button', { name: 'Enter the Gate' }).click()
    await expect(page.getByRole('button', { name: 'Enter floor 1' })).toBeVisible()
    await page.getByRole('button', { name: 'Enter floor 1' }).click()
    await expect(page).toHaveURL(/\/workout\//)
    await expect(page.getByRole('heading', { name: /Floor 1/ })).toBeVisible()
    await page.getByRole('button', { name: /^Complete set \d+$/ }).first().click()
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page).toHaveURL(/\/summary$/)
  })

  await test.step('Demon Castle tower view', async () => {
    await page.goto('/castle')
    await expect(page.getByRole('list', { name: 'Tower floors' })).toBeVisible()
    await expect(page.getByText(/Cerberus/)).toBeVisible()
  })

  await test.step('Shadow Army gallery (empty state)', async () => {
    await page.goto('/shadows')
    await expect(page.getByText(/You have no shadows/)).toBeVisible()
  })

  await test.step('Titles: unlocked by the first workout, equip one', async () => {
    await page.goto('/titles')
    await expect(page.getByRole('heading', { name: /\/ \d+ titles/ })).toBeVisible()
    await page.getByRole('button', { name: 'Equip' }).first().click()
    await expect(page.getByText('EQUIPPED').first()).toBeVisible()
  })

  await test.step('Progress: charts and PR wall', async () => {
    await page.goto('/progress')
    await expect(page.getByRole('tab', { name: 'Lifts' })).toBeVisible()
    await page.getByRole('tab', { name: 'Muscles' }).click()
    await expect(page.getByRole('table', { name: 'Weekly hard sets per muscle' })).toBeVisible()
    await page.getByRole('tab', { name: 'Power' }).click()
    await expect(page.getByText('HUNTER POWER LEVEL')).toBeVisible()
  })

  await test.step('Measurements: weigh-in and a progress photo stored on device', async () => {
    await page.goto('/measurements')
    await page.getByRole('button', { name: 'Record today' }).click()
    await expect(page.getByText(/Trend weight/)).toBeVisible()
    await page.getByRole('tab', { name: 'Photos' }).click()
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    await page.getByLabel('Progress photo').setInputFiles({ name: 'front.png', mimeType: 'image/png', buffer: png })
    await expect(page.getByRole('button', { name: /front photo/ })).toBeVisible()
  })
})
