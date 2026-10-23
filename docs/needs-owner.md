# Needs owner

Tasks the unattended build could not do because they need the owner's login, payment, review or a physical device. Each is prepared; follow the steps. Every item also has a `needs-owner` issue on GitHub.

## 1. Push reminders (Cloudflare Worker + VAPID)

The Worker (`worker/`) and client (`src/app/push.ts`) are built and tested against a mocked push service (`worker/src/worker.test.ts` decrypts every message and verifies its VAPID signature). Until the steps below are done the app runs push in **mock mode**: the toggle works, nothing is sent.

1. Install and log in: `npx wrangler login` (free Cloudflare account; Workers Free plan is enough).
2. Create the KV namespace: `npx wrangler kv namespace create DEVICES -c worker/wrangler.toml`. Paste the printed `id` into `worker/wrangler.toml` (`REPLACE_WITH_KV_NAMESPACE_ID`).
3. Generate keys once: `npm run vapid:keys`. **Back up the output in your password manager.** Changing the key pair later silently breaks every subscription.
4. In `worker/wrangler.toml` set `VAPID_PUBLIC_KEY`, and `ALLOWED_ORIGIN` / `VAPID_SUBJECT` to the app's HTTPS origin (from section 2).
5. Store secrets (never commit them): `npx wrangler secret put VAPID_PRIVATE_KEY -c worker/wrangler.toml` and `npx wrangler secret put API_TOKEN -c worker/wrangler.toml`.
6. Deploy: `npm run worker:deploy`. Note the `*.workers.dev` URL.
7. Create `.env.local` from `.env.example` with `VITE_PUSH_URL`, `VITE_PUSH_TOKEN` (= API_TOKEN) and `VITE_VAPID_PUBLIC_KEY`, then rebuild and redeploy the app.
8. Check: `npx wrangler tail -c worker/wrangler.toml` shows `cron {"sent":…}` lines every 15 minutes. Watch CPU time per run; it must stay under 10 ms on the free plan (it sends at most 3 pushes per device per run).

**Real-iPhone push test (device needed):** install the app to the Home Screen (iOS 16.4+), Settings → Reminders → turn on, accept the prompt. Set a reminder 5 minutes ahead and lock the phone. Expected: a `SYSTEM` notification arrives within 15 minutes; tapping it opens the matching screen. Then log water and confirm the water reminder is skipped. If nothing arrives, check `wrangler tail` for 400/403 responses.

## 2. Deploy the app (Cloudflare Pages, free)

**Done (2026-10-24):** live at https://shadow-system.pages.dev (Pages project `shadow-system`). To update: `npm run deploy`. Note: new Cloudflare accounts now route `wrangler pages project create` to Workers and may rewrite the project for it; the project was created with `--force` as a classic Pages project, so plain `npm run deploy` keeps working. Do not accept wrangler's offer to convert the project.

Prepared: `public/_redirects` (SPA fallback), `public/_headers` (no-cache for the service worker and HTML, `noindex`, camera allowed), and `npm run deploy`. The build is about 4,000 files and 98 MB, inside the Pages free limits (20,000 files, 25 MiB per file).

1. `npx wrangler login` (same free account as section 1).
2. Create the project once: `npx wrangler pages project create shadow-system --production-branch main`.
3. Optional: put the push settings in `.env.local` first (section 1, step 7).
4. Deploy: `npm run deploy`. The app is served at `https://shadow-system.pages.dev` (or the name Cloudflare assigns). HTTPS is automatic, which PWA install, the service worker, push and the camera all need.
5. Put that origin into `worker/wrangler.toml` (`ALLOWED_ORIGIN`, `VAPID_SUBJECT`) and redeploy the Worker.
6. Later deploys: `npm run deploy` again. Installed apps pick up the new version the next time they are closed and reopened.

**Privacy (replaces Cloudflare Access):** Access breaks offline PWAs (icon and manifest requests carry no cookie; research/platform.md Findings 11), so it was not used. Instead the URL is unlisted (`noindex`, never linked), the app has an optional PIN (Settings → Security), and the Worker needs a bearer token. All records stay on the phone. If you still want Access, protect only a different preview hostname, not the production one.

## 3. Real-iPhone QA

Work through `docs/iphone-qa.md` on your iPhone after the first deploy: install, offline workout, push, camera form check, barcode scan, audio after the first tap, safe areas, wake lock, and storage after a week. File an issue for each failure.

## 4. Form check validation on real video

The form analyser is validated on synthetic pose clips only (`tests/fixtures/form/synth.ts`). Record one short side-on clip per lift (squat, push-up, deadlift, lunge, overhead press, curl) with the iPhone, run Form Check on each, and note miscounted reps or wrong cues in an issue. Thresholds are in `src/engine/form.ts` (`LIFTS`).

## 5. Licences before anything goes public

The repo is private and the app is for personal use. Before making either public:

- **Exercise animations** (`public/assets/third-party/exercises/hx*.webp`) are © Gym Visual and are used here with attribution only. Replace them, or buy a licence from gymvisual.com (issue #4). The free-exercise-db frames (`fx-*.webp`, Unlicense) can stay.
- **IFCT 2017 numbers** (Indian food composition, ICMR-NIN) are used for personal use. Ask NIN for permission, or switch those foods to USDA equivalents, before a public release.
- Everything else is MIT, Apache-2.0, OFL, CC0 or public domain (`docs/asset-sources.md`).

## 6. Listen to the sounds and check the effects on the iPhone

- The new sound effects (`public/sfx/*.wav`) were chosen from measurements (duration, envelope, loudness), not by ear. Play each one (Settings → Sound on, then use the app, or open the files) and swap any you dislike: alternates are listed per sound in `data/sfx-sources.json` (`alt`), rendered previews are in `data/.cache/sfx-candidates/_preview/` after `node data/sfx-import.ts`. Least certain: `arise`, `boss`, `penalty`, `set-logged`, `pr`.
- Read the Mixkit Sound Effects Free License once in a browser (https://mixkit.co/license/#sfxFree): it allows use inside the app but not redistributing the raw files as a pack.
- In Safari Web Inspector → Timelines on the iPhone, open a few screens and tap buttons: the window materialise, tap glitch and route tear should stay at 60 fps. If one stutters, Settings → Reduce motion turns them into fades.

## 7. Optional: full CI on GitHub

CI runs only on demand. To run it: GitHub → Actions → CI → Run workflow (or add the `full-ci` label to a PR). It uses the free Windows runner minutes.
