// Renders the app icon (original: a glowing System hexagon with a shadow eye) to public/icons/*.png.
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const svg = (pad: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#173c8c"/><stop offset="1" stop-color="#05070f"/></radialGradient>
    <filter id="b"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(256 256) scale(${(512 - pad * 2) / 512}) translate(-256 -256)">
    <polygon points="256,72 416,164 416,348 256,440 96,348 96,164" fill="none" stroke="#5cc8ff" stroke-width="22" filter="url(#b)"/>
    <polygon points="256,72 416,164 416,348 256,440 96,348 96,164" fill="rgb(11 20 38 / .6)" stroke="#2fa8ff" stroke-width="12"/>
    <path d="M150 256s45-70 106-70 106 70 106 70-45 70-106 70-106-70-106-70z" fill="none" stroke="#e6f1ff" stroke-width="14"/>
    <circle cx="256" cy="256" r="34" fill="#7b2ff7"/>
    <circle cx="256" cy="256" r="34" fill="#a77bff" filter="url(#b)"/>
    <circle cx="256" cy="256" r="12" fill="#f2e9ff"/>
  </g>
</svg>`

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon.svg', svg(0))
for (const size of [180, 192, 512]) await sharp(Buffer.from(svg(0))).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
await sharp(Buffer.from(svg(60))).resize(512, 512).png().toFile('public/icons/maskable-512.png')
console.log('icons written')
