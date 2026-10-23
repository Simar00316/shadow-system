import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  globalTimeout: 20 * 60_000,
  reporter: process.env.CI ? 'list' : 'list',
  // Tutorials and the prologue are off in tests (they are covered by tests/e2e/onboarding.spec.ts).
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure', storageState: 'tests/e2e/storage-state.json' },
  projects: [{ name: 'iphone-webkit', use: { ...devices['iPhone 15'], browserName: 'webkit' } }],
  webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', port: 4173, reuseExistingServer: !process.env.CI, timeout: 180_000 },
})
