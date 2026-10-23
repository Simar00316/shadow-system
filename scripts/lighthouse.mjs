// Local Lighthouse check (mobile, simulated throttling): median of N runs per URL.
// Usage: node scripts/lighthouse.mjs [url...]   Needs a running `npm run preview` (port 4173) and Playwright's Chromium.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const base = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
const chromium = readdirSync(base).filter((d) => d.startsWith('chromium-')).sort().pop()
const chrome = join(base, chromium, 'chrome-win64', 'chrome.exe')
const urls = process.argv.slice(2).length ? process.argv.slice(2) : ['http://127.0.0.1:4173/awakening']
const runs = Number(process.env.RUNS ?? 3)
const dir = mkdtempSync(join(tmpdir(), 'lh-'))
const med = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]

for (const url of urls) {
  const rows = []
  for (let i = 0; i < runs; i++) {
    const out = join(dir, `r${i}.json`)
    execFileSync('npx', ['-y', 'lighthouse@12.8.2', url, '--quiet', '--chrome-flags=--headless=new', '--only-categories=performance,accessibility,best-practices', '--output=json', `--output-path=${out}`], { env: { ...process.env, CHROME_PATH: chrome }, stdio: 'ignore', shell: true })
    const r = JSON.parse(readFileSync(out, 'utf8'))
    rows.push({ perf: r.categories.performance.score * 100, a11y: r.categories.accessibility.score * 100, bp: r.categories['best-practices'].score * 100, fcp: r.audits['first-contentful-paint'].numericValue, lcp: r.audits['largest-contentful-paint'].numericValue, tbt: r.audits['total-blocking-time'].numericValue, cls: r.audits['cumulative-layout-shift'].numericValue })
  }
  const m = (k) => med(rows.map((r) => r[k]))
  console.log(`${url}\n  perf ${Math.round(m("perf"))} (runs ${rows.map((r) => Math.round(r.perf)).join("/")}), a11y ${m('a11y')}, best ${m('bp')}\n  FCP ${Math.round(m('fcp'))} ms, LCP ${Math.round(m('lcp'))} ms, TBT ${Math.round(m('tbt'))} ms, CLS ${m('cls').toFixed(3)}`)
}
