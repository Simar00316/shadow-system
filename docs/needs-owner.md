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

## 2. Deploy the app

Prepared in M13 (see that section once written).

## 3. Real-iPhone QA

See `docs/iphone-qa.md` (M13).

## 4. Form check validation on real video

The form analyser is validated on synthetic pose clips only. Record one short side-on clip per lift on the iPhone and check that reps and cues match what you did.
