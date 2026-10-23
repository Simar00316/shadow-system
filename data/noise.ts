// Pre-rendered 96 px grain tile for the ambient light layer (research/design-v2.md §4.3): hides gradient banding
// without running feTurbulence in Safari. Deterministic (seeded), so rebuilds produce the same file.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const N = 96
let seed = 1337
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
const px = Buffer.alloc(N * N * 4)
for (let i = 0; i < N * N; i++) {
  const v = Math.round(rnd() * 255)
  px.set([v, v, v, 255], i * 4)
}
mkdirSync('public/img', { recursive: true })
await sharp(px, { raw: { width: N, height: N, channels: 4 } }).webp({ quality: 60 }).toFile('public/img/noise-96.webp')
console.log('public/img/noise-96.webp')
