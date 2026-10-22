# Architecture

Local-first PWA. No server-side user database. Three parts: pure TypeScript engines on the device, IndexedDB storage, one small Cloudflare Worker for push. Research behind each choice is linked.

```
src/
  engine/      pure TS, no DOM, no Dexie — fully unit-tested (≥ 90% lines)
  db/          Dexie schema, migrations, repositories (the only code that touches IndexedDB)
  data/        bundled JSON produced by /data scripts + hand-authored catalogues
  state/       Zustand UI stores (session in progress, toasts, audio prefs)
  audio/       Web Audio synth + Howler playback of generated sound files
  ui/          design-system components (gallery at /dev/gallery)
  screens/     one folder per PRD F3 screen
  styles/      tokens.css (design tokens) + Tailwind entry
  sw.ts        custom service worker (Workbox injectManifest): precache, runtime cache, push
data/          build-time scripts: download → normalise → merge → validate → write src/data/*.json
worker/        Cloudflare Worker (push), its own tests
tests/         unit (Vitest), e2e (Playwright WebKit iPhone), fixtures
```

Data flow: screen → engine (pure function on plain objects) → repository writes → Dexie `liveQuery` re-renders. Game events go through one function, `applyEvents()`, which appends to the `xpEvents` ledger and folds it into the `player` row, so everything can be recomputed.

## Stack (PRD F2, adjusted by R7)

| Concern | Choice | Research |
| --- | --- | --- |
| App | React 19 + TypeScript 6 + Vite 8 | — |
| PWA | `vite-plugin-pwa` with **injectManifest** (custom SW for push + range requests) | [platform §2](../research/platform.md) |
| Styling | Tailwind 4 driven by `tokens.css` | — |
| Motion | `motion` (Framer Motion's current package) | — |
| State | Zustand (UI), Dexie + `dexie-react-hooks` (data) | — |
| Charts | Recharts themed to the System look | — |
| Audio | Original sounds synthesised in Node at build time (`data/sfx.ts` → WAV), played with Howler; Web Audio unlock on first tap; optional `audioSession.type = 'playback'` | [platform §5](../research/platform.md) |
| Pose | `@mediapipe/tasks-vision` PoseLandmarker lite, GPU → CPU fallback, model + wasm self-hosted, lazy-loaded | [platform §7](../research/platform.md), [repos](../research/repos.md) |
| Barcode | **`barcode-detector` ponyfill over self-hosted `zxing-wasm`** instead of `@zxing/browser` (Safari has no BarcodeDetector; ponyfill is smaller and maintained) + manual entry | [platform §8](../research/platform.md) |
| Fuzzy search | Fuse.js over name + aliases | — |
| Push worker | Cloudflare Worker + KV + Cron, `@block65/webcrypto-web-push` (aes128gcm, VAPID) | [platform §10](../research/platform.md) |
| Access control | Unlisted URL + app-level PIN; Worker requires a bearer token. **No Cloudflare Access** (manifest/icon fetches are cookie-less and break) | [platform §9](../research/platform.md) |

## Ideas taken from which repo (R4 [repos.md](../research/repos.md))

| Repo | License | What we took (ideas or data) |
| --- | --- | --- |
| yuhonas/free-exercise-db | Unlicense | Exercise data backbone (level, mechanic, force, category, instructions, images) — bundled |
| hasaneyldrm/exercises-dataset | MIT text, media © Gym visual | 1,324 exercises with GIFs, step instructions — **private build only**, media in `public/assets/third-party/` |
| melihcolpan/MuscleMap | MIT | Male and female, front and back muscle path data → our `BodyMap` SVG (restyled); abductors drawn by us |
| react-native-body-highlighter | MIT | Backup path data; region-id-per-path pattern |
| wger | AGPL (ideas only) | Per-iteration progression rows with requirements; set types; nutrition mapping to Open Food Facts; aliases idea |
| liftosaur | AGPL (ideas only) | `lp` / `dp` / `sum` progression semantics and per-exercise progression **state** → our `progression.ts` rewritten from scratch |
| Habitica | GPL (formulas only) | Bounded streak bonus, diminishing-returns stat bonus, drop logic structure, boss-as-quest → reshaped (no damage to the player) |
| Magni | AGPL (ideas only) | Save-workout-as-template, per-set log type |
| Strong / Hevy exports (via openweight, Bybon, Hevy-Coach fixtures) | sample data | Importer formats (`tests/fixtures/*.csv`) |
| Fitbod (docs, not code) | — | Recovery 0–100% per muscle, more/less/exclude preferences, manual override, equipment profiles |
| mediapipe-samples-web | Apache-2.0 | PoseLandmarker `detectForVideo` loop pattern |
| Open Food Facts | ODbL data | Barcode lookup v2 via plain `fetch`, cached in Dexie |
| USDA FDC SR Legacy | CC0 | Ingredient macros |
| IFCT 2017 (via nodef/ifct2017 numbers) | government data | Indian ingredient macros (numbers only; ask NIN before public release) |

## Data bundles (R6 [data-sources.md](../research/data-sources.md))

- `src/data/exercises.json` — merged library (hasaneyldrm ∪ free-exercise-db with alias table), canonical 21 muscles, equipment canon, class tags, swap groups, MET, form-check flag. Media: animated WebP (≤ 180 px) runtime-cached CacheFirst; plan exercises are prefetched; Settings has "Download all media".
- `src/data/ingredients.json` — ~450 ingredients per 100 g (kcal, protein, carbs, fat, fibre, diet, price tier).
- `src/data/dishes.json` — ≥ 40 dishes × 15 cuisines + generic, authored as gram lists in `data/dishes/*.yaml`, macros computed at build time.
- `src/data/bodymap.ts` — 4 SVG figures, one path per muscle id.
- Hand-authored: `system-messages.json`, `titles.json`, `shadows.json`, `programs.json`, `quests.json`, `store.json`.

## Storage (B2)

Dexie DB `shadow-system`, versioned migrations each with a test. Photos are unindexed Blobs. `navigator.storage.persist()` on every standalone launch; backup nag every 7 days.

## Privacy

All user data stays on the device. Only the push subscription, reminder schedule and daily booleans (`workoutDone`, `waterHit`, …) reach the Worker.
