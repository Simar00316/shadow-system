import { test as base, expect } from '@playwright/test'

/** Fails a test on any uncaught page error and surfaces console errors in the report (CI diagnostics, issue #94). */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
    await use(errors)
    if (errors.length) console.log(errors.join('\n'))
    expect(errors.filter((e) => e.startsWith('pageerror'))).toEqual([])
  }, { auto: true }],
})
export { expect }
