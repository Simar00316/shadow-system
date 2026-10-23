import { readFileSync } from 'node:fs'

const css = readFileSync('src/styles/tokens.css', 'utf8')

const tok = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))![1]

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
// --panel is #0B1426 at 75% over --bg
const panel = '#0a1120'

const body = ['text', 'text-dim', 'system-blue', 'glow', 'shadow-purple-text', 'warning', 'gold', 'success', 'rank-e', 'rank-d', 'rank-c', 'rank-b', 'rank-a', 'rank-s', 'rank-national', 'rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary']

test.each(body)('%s meets AA 4.5:1 on bg and panel', (name) => {
  expect(ratio(tok(name), tok('bg'))).toBeGreaterThanOrEqual(4.5)
  expect(ratio(tok(name), panel)).toBeGreaterThanOrEqual(4.5)
})

test('shadow-purple meets 3:1 for UI and large text', () => {
  expect(ratio(tok('shadow-purple'), panel)).toBeGreaterThanOrEqual(3)
})

test.each(['system-blue', 'gold', 'success', 'warning'])('text-on-accent on %s meets AA', (name) => {
  expect(ratio(tok('text-on-accent'), tok(name))).toBeGreaterThanOrEqual(4.5)
})

test.each(['ff8a3d', 'ffb37a', '9fd3ff', 'd6ecff', '34d399', '7ef0c2', 'ff4d6d', 'ff8fa3', 'a77bff', 'c9a6ff', 'ffc94a', 'ffe08a'])('theme accent #%s meets AA on bg and panel', (hex) => {
  expect(ratio(`#${hex}`, tok('bg'))).toBeGreaterThanOrEqual(4.5)
  expect(ratio(`#${hex}`, panel)).toBeGreaterThanOrEqual(4.5)
})
