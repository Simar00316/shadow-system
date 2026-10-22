# Decisions

One line per decision: what, and why.

- Git `user.name` was unset globally; set repo-local identity to the GitHub account name "Simarpreet Singh" with the global email. Why: PRD requires owner identity only; no global changes allowed.
- Claude Code attribution disabled in `.claude/settings.json` (`includeCoAuthoredBy: false`, empty `attribution`). Why: PRD authorship rule.
- TypeScript pinned to ~6.0 instead of 7.0. Why: typescript-eslint supports `<6.1`.
- Playwright project uses WebKit with the `iPhone 15` device profile. Why: PRD requires WebKit iPhone emulation.
- Playwright WebKit browser installed into the user's existing Playwright cache (AppData\Local\ms-playwright), which already held Chromium. Why: needed for E2E; user-level, removable.
- XP curve changed to `285 × L^0.84` (docs/game-design.md §4.1). Why: PRD curve reaches level 50 in ~3.5 years, missing its own 1-year target (R2).
- Class prescriptions split by experience level with R5 corrections (beginner lane, Ranger loads, longer compound rest). Why: R5 §0.
- Barcode scanning uses the `barcode-detector` ponyfill over self-hosted `zxing-wasm` instead of `@zxing/browser`. Why: R7 §8 — Safari lacks BarcodeDetector; the ponyfill is maintained and the wasm is ~1 MB.
- No Cloudflare Access; unlisted URL + app PIN + bearer-token Worker. Why: R7 §9 — Access breaks cookie-less manifest/icon fetches in standalone mode (PRD fallback).
- Push from the Worker with `@block65/webcrypto-web-push`; VAPID subject must be an `https:` URL. Why: R7 §1, §10.
- Service worker uses Workbox injectManifest. Why: custom push handler + range requests (R7 §2).
- Exercise library = hasaneyldrm (GIFs, private build) ∪ free-exercise-db (Unlicense). Why: most exercises with animation + public-domain backbone (R4, R6).
- Body map from MuscleMap (MIT) male/female path data. Why: only MIT source with both sexes, front/back, delt heads (R6).
- Cuisines: India, USA, UK, Mexico, Italy, China, Japan, Thailand, Lebanon/Middle East, Greece/Mediterranean, Korea, Brazil, Spain, France, Pakistan + generic. Why: R6 §3 (owner is Indian; Pakistan shares dish vocabulary).
- Audio: original sounds synthesised in Node at build time to WAV, played with Howler. Why: PRD names Howler; synthesis keeps all sound assets original.
- Exercise media committed as converted animated WebP under public/assets/third-party/, runtime-cached (not precached). Why: deterministic offline-capable build without network at deploy time; precaching ~50 MB on install is hostile on iOS.
- Red Gate minimum rank C (canon B). Why: B rank arrives ~day 195; the challenge should be reachable earlier.
- Fonts self-hosted via Fontsource (Orbitron display, Rajdhani UI, Inter body, JetBrains Mono numbers). Why: works offline; matches fan consensus (R1 §12.2).
- `--shadow-purple` (#7B2FF7, 3.4:1) limited to borders/fills/large text; `--shadow-purple-text` (#A77BFF) for text. Why: WCAG AA.
- Shadow art is procedural SVG per archetype with seeded variants instead of hand-painted art. Why: original, tiny, infinitely many unique shadows.
- Visual snapshots taken with reduced motion and a fixed clock. Why: deterministic screenshots.
