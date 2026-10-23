// Self-hosts runtime wasm/model files so barcode scanning and form check work offline (research/platform.md §7, §8).
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { cached } from './lib.ts'

mkdirSync('public/wasm/mediapipe', { recursive: true })
mkdirSync('public/models', { recursive: true })
copyFileSync('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm', 'public/wasm/zxing_reader.wasm')
// MediaPipe Tasks Vision runtime (SIMD + no-SIMD fallbacks) and the lite pose model (5.8 MB, Apache-2.0)
for (const f of readdirSync('node_modules/@mediapipe/tasks-vision/wasm')) if (!f.includes('module')) copyFileSync(`node_modules/@mediapipe/tasks-vision/wasm/${f}`, `public/wasm/mediapipe/${f}`)
await cached('https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', 'public/models/pose_landmarker_lite.task')
console.log('wasm and models copied')
