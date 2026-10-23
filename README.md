# Shadow System

A personal, Solo Leveling-style fitness RPG for iPhone. It's an installable web app (PWA) that works offline. The System issues Daily Quests, plans your training from your recovery, tracks nutrition, checks your form with the camera and levels you up from E-rank onward. All data stays on your phone.

- Spec: [PRD.md](PRD.md) · game rules: [docs/game-design.md](docs/game-design.md) · architecture: [docs/architecture.md](docs/architecture.md) · design: [design/DESIGN.md](design/DESIGN.md)
- Decisions made during the build: [docs/decisions.md](docs/decisions.md)
- **Things only the owner can do** (deploy, keys, iPhone tests): [docs/needs-owner.md](docs/needs-owner.md)

## What's inside

| Area | Highlights |
| --- | --- |
| Game | Status Window, 5 stats (STR, AGI, VIT, INT, PER), levels and ranks E→S→National, classes and Job Change, Daily/Penalty/Emergency/Hidden quests, streaks with Elixir and Second Wind, loot with pity, 68 titles, 20 shadows, 14 Gates (dungeon programs), Demon Castle, Store |
| Training | 1,915 exercises with animations, plan generator, recovery body map, RIR/RPE autoregulation, progressive overload and deloads, supersets, rest timer, plate math, PRs, cardio log |
| Diet | Calorie, macro and water targets; 305 ingredients and 755 dishes from 16 cuisines; barcode scan (Open Food Facts); weekly meal plans with swaps and a grocery list |
| Form Check | MediaPipe pose tracking with rep counting and cues for squat, push-up, deadlift, lunge, overhead press and curl |
| Data | JSON backup and restore, CSV export, Hevy and Strong import, an AI-ready Markdown progress report, optional app PIN |
| Reminders | Web push through a small Cloudflare Worker; reminders that are already satisfied are skipped |

## Run it locally

Requires Node 24 and npm.

```bash
npm ci
npm run dev          # http://localhost:5173 with hot reload
```

On a desktop browser the app shows an "Add to Home Screen" guide first. Choose "Continue in the browser" to try it.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run preview` | Production build (with service worker) / serve it on port 4173 |
| `npm run check` | Lint, type-check and unit tests |
| `npm test` / `npm run test:cov` | Unit tests (Vitest) / with coverage (engines need 90%+ lines) |
| `npm run e2e` | End-to-end tests in WebKit with the iPhone 15 profile (Playwright; run `npx playwright install webkit` once) |
| `npm run data` | Rebuild every data bundle (see below) |
| `npm run deploy` | Build and deploy to Cloudflare Pages (owner; see [docs/needs-owner.md](docs/needs-owner.md)) |
| `npm run worker:deploy` / `npm run vapid:keys` | Deploy the push Worker / generate its keys |

## Install on iPhone

1. Deploy (below), then open the URL in **Safari**.
2. Share → **Add to Home Screen** (on iOS 26+, keep "Open as Web App" on).
3. Open it from the Home Screen. Push reminders, offline play and storage protection only work in the installed app.

The full manual test list is [docs/iphone-qa.md](docs/iphone-qa.md).

## Deploy

The app is a static site on **Cloudflare Pages**, plus one Cloudflare Worker for push. Both run on free plans. Step-by-step: [docs/needs-owner.md](docs/needs-owner.md) sections 1 and 2. In short:

```bash
npx wrangler login
npx wrangler pages project create shadow-system --production-branch main
npm run deploy
```

Without the push Worker the app still works fully; reminders run in "offline mode" and nothing is sent.

Live: **https://shadow-system.pages.dev** (project created once; updates are just `npm run deploy`).

## Backups

All records live in IndexedDB on the phone. iOS keeps installed-app data while you use it, but deleting the Home Screen icon deletes the data.

- **Back up:** Settings → Data → Back up. On iPhone the share sheet opens: choose "Save to Files" (or AirDrop it). The file is `shadow-system-backup-YYYY-MM-DD.json` and contains everything, including progress photos.
- **Restore:** Settings → Data → Restore, then pick the file. Everything on the device is replaced, in one all-or-nothing step.
- The System reminds you if you haven't backed up for 7 days.
- **CSV export** of any table and **Hevy/Strong import** are in the same section.

## Regenerate the data bundles

The app ships with prebuilt JSON in `src/data/` and media in `public/`. To rebuild them from the original open datasets (pinned to exact commits in [data/sources.lock.json](data/sources.lock.json)):

```bash
npm run data
```

This needs internet the first time; downloads are cached in `data/.cache/`. Each step can also run alone:

| Script | Output |
| --- | --- |
| `node data/copy-wasm.ts` | zxing and MediaPipe wasm, pose model → `public/wasm`, `public/models` |
| `node data/build-exercises.ts` | `src/data/exercises.json` + WebP media in `public/assets/third-party/exercises` |
| `node data/build-foods.ts` | `src/data/ingredients.json` (USDA SR Legacy + IFCT 2017) |
| `node data/build-dishes.ts` | `src/data/dishes.json` from the recipes in `data/dishes/*.json` |
| `node data/bodymap.ts` | `src/data/bodymap.json` (MuscleMap paths) |
| `node data/sfx-import.ts` / `node data/icons.ts` | Sound effects from the sourced files in `data/sfx-sources.json` (needs ffmpeg) / app icons |

`data/data.test.ts` validates the bundles; run `npm test` afterwards. Asset sources and licences: [docs/asset-sources.md](docs/asset-sources.md).

## Project layout

```
src/engine/     pure game and training engines (strength, recovery, progression, XP, quests, loot, diet, form…)
src/app/        services that connect engines to the database (training, diet, game, push, backup, import, report)
src/db/         Dexie (IndexedDB) schema and repositories
src/screens/    app screens;  src/ui/  components (see /dev/gallery)
src/sw.ts       service worker (offline cache, push)
worker/         Cloudflare Worker for push reminders (own tests)
data/           build-time dataset scripts
research/       research notes the design is based on
tests/e2e/      Playwright specs;  tests/fixtures/  Hevy/Strong CSVs, synthetic pose clips
```

## Privacy

There's no account and no server-side database. Only three things ever leave the phone: the push subscription, reminder times and daily yes/no flags (for example "workout done"), all sent to your own Worker. Barcode lookups go to Open Food Facts. The URL is unlisted (`noindex`), and an optional PIN guards the app.

## Licence notes

This is a private project. Exercise animations are © Gym Visual, used with attribution in a private build. Replace them before anything goes public (issue #4). Other data and code dependencies are open licences listed in [docs/asset-sources.md](docs/asset-sources.md).
