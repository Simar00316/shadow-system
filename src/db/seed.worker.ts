/// <reference lib="webworker" />
// Seeds the bundled exercise library off the main thread: downloading and parsing 2.9 MB of JSON and writing
// 1,900 rows would otherwise block taps and first render (Lighthouse TBT).
import { seedFromUrl } from './seed'

self.onmessage = async () => {
  try { self.postMessage({ ok: true, changed: await seedFromUrl() }) } catch (e) { self.postMessage({ ok: false, error: String(e) }) }
}
