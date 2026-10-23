// Self-hosts runtime wasm/model files so barcode scanning and form check work offline (research/platform.md §7, §8).
import { copyFileSync, mkdirSync } from 'node:fs'

mkdirSync('public/wasm', { recursive: true })
copyFileSync('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm', 'public/wasm/zxing_reader.wasm')
console.log('wasm copied')
