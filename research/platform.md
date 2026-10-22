# R7 — Platform research (iOS PWA, MediaPipe, barcodes, Cloudflare)

Researched 2026-10-23. Every claim below was read from the sources listed at the end. Where I could not verify something it is marked **UNVERIFIED** or **TEST ON DEVICE**.

## 0. Premise correction: the current iOS is 27, not 26

- iOS 27 and iPadOS 27 shipped 14 Sep 2026; iOS 27.0.1 on 28 Sep 2026. iOS 26.7 / 26.7.1 were released alongside for devices that stay on 26 (Apple security-releases page). Safari 27.0 also released 14 Sep 2026.
- The target OS is therefore **iOS 27.0.x**, with iOS 26.x as a likely second population. The owner's phone may still be on 26.x: bug 327237 (filed 12 Oct 2026) was reproduced on an iPhone 14 running iOS 26.6.2.
- The Safari 27.0 and 26.6 feature posts contain **no changes to Web Push, Home Screen web apps, wake lock, getUserMedia permission persistence, storage quota, or BarcodeDetector**. What 27.0 does add that touches us: Service Worker static routing API; IndexedDB robustness fixes (version-0 DB after aborted upgrade, connections recovering after a network-process crash, transactions blocked by a suspended background page); camera fixes (wrong orientation after transient device rotation, `ImageCapture` queueing); Web Audio fixes (`HTMLMediaElement.volume` ignored when connected to an `AudioContext`, `preservesPitch`/`playbackRate`). WebKit bug 321693 shows an iOS 27 beta 5 regression where the GPU process crashed when a MediaStream-backed `<video>` was hidden with `display:none` while capture continued and an MP4 started decoding. It was a duplicate of fixed bug 321571, but it is a warning for the form-check screen: do not hide the live camera `<video>` while capture continues; stop the tracks instead.
- Safari 26.x fixes that matter to us: 26.0 (every site can be a web app, WebGPU, FileSystem WritableStream), 26.2 ("audio element failed to play when re-opening a Home Screen Web App", "service worker downloads not saved to Downloads folder"), 26.5 (downloaded files now take the extension from `Content-Type` instead of the URL path; "IndexedDB connections could become permanently broken until reload" fixed). Recommendation for the owner: **be on iOS 26.5 or later (ideally 27.0.1)**.

### Feature to minimum-iOS table (what we depend on)

| Feature | Minimum | Source |
| --- | --- | --- |
| Web Push (home-screen app only), Notifications, Badging | 16.4 | WebKit 13878, firt |
| Screen Wake Lock in Safari tab | 16.4 | caniuse, MDN BCD |
| Screen Wake Lock in Home Screen web app | **18.4** (bug 254545 fixed) | WebKit bug 254545, WebKit 18.4 post |
| Declarative Web Push (no SW needed) | 18.4 | WebKit 16535, firt |
| `navigator.audioSession` | 16.4 | MDN BCD |
| `<input type=checkbox switch>` haptic (trick) | 18.0 (17.4 per package docs); reportedly patched in 26.5 (UNVERIFIED) | WebKit 15865, bug 285120, ios-haptics README |
| Storage quota model (60% disk per origin) | 17.0 | WebKit 14403 |
| `storage.persist()` | 15.2 | firt, WebKit 14403 |
| WebGL2 | 15.0 | caniuse |
| WASM SIMD | 16.4 | caniuse |
| WebGPU | 26.0 | caniuse, WebKit 26.0 post |
| BarcodeDetector | not shipped (flag only, broken since 18) | bug 281848 |
| Vibration API | never | caniuse |
| Every site is a web app by default | 26.0 | WebKit 26.0 post |
| Service Worker static routing | 27.0 | WebKit 27.0 post, firt |

---

## 1. Web push on iOS

**Status.** Works, but only for an installed Home Screen web app (iOS 16.4+). Not available in a Safari tab or any in-app browser. `caniuse` marks Push API and Notifications as partial in every iOS version since 16.4 ("Requires website to first be added to the Home Screen").

**Requirements (Apple developer docs + WebKit 13878)**
- Installed to the Home Screen; manifest with `display: standalone`/`fullscreen` (before iOS 26; from iOS 26 every Home Screen site opens as a web app unless the user disables "Open as Web App", so a manifest is no longer required, but we keep one).
- `Notification.requestPermission()` / `pushManager.subscribe()` must run **inside a user gesture handler** (tap). Apple: "call the push subscription method immediately from the gesture's event handler code". Do not `await` unrelated things before it.
- `userVisibleOnly: true`. **No silent push**: show a notification for every push, immediately, or Safari revokes the permission. This is the biggest operational rule for the Worker: never send a push that the client may decide not to show.
- VAPID (RFC 8292) is mandatory. The JWT `sub` must be a URL or `mailto:`; `aud` must be the origin of the push endpoint; `exp` at most 24 h ahead; do not refresh the JWT more often than hourly (Apple: "Don't refresh your JWT more frequently than once per hour"). Apple's `k=` must equal the key used in `subscribe()`.
- Encryption: RFC 8291 `aes128gcm` only. block65 v2.0.0 states v1.x used legacy `aesgcm` + the draft `WebPush` auth scheme, "neither of which Apple accepts". `@pushforge/builder` 2.0.5 source still contains `Content-Encoding: aesgcm` strings (see §10): do not use it for iOS until proven on a device.
- Endpoint: allow `https://*.push.apple.com` (Apple). Subscriptions normally look like `https://web.push.apple.com/...`; treat the URL as opaque, and use its origin as the JWT `aud`.
- Payload limit: Apple returns `PayloadTooLarge` over 4 KB; RFC 8291 maximum plaintext is 3993 bytes. TTL: Apple may hold an undelivered notification up to 30 days depending on TTL; `Topic` (<= 32 URL-safe chars) coalesces; `Urgency` very-low/low/normal/high.
- Errors to handle: 201 ok; 400 `BadWebPushRequest`/`VapidPkHashMismatch` (key mismatch, treat as dead subscription); 403 `BadJwtToken` / `BadAuthorizationHeader`; 404 and 410 = gone, delete; 413; 429 `TooManyRequests` (many consecutive pushes to the same token).
- **Gotcha seen in the wild (siteboon/claudecodeui #1550, iOS 27):** Apple returned 403 `BadJwtToken` for `sub = mailto:noreply@something.local`; an `https:` subject fixed it. Use `sub = https://<our pages domain>` or a real-looking `mailto:`.
- **Gotcha:** subscriptions can silently die (reports of 1 to 2 weeks, cause unproven). Plan for it: on every app launch, call `registration.pushManager.getSubscription()`, compare the endpoint with what the Worker has, and re-register if different or null. Show a "Reminders are off, tap to repair" banner when permission is granted but `getSubscription()` is null. Delete on 404/410 in the Worker.

**Declarative Web Push (Safari 18.4+, iOS 18.4+)**
- A push message whose JSON has `"web_push": 8030`, a `notification` object (required non-empty `title`; `body`, `lang`, `dir`, `silent`, etc.), a required top-level `navigate` URL, and optional `app_badge`, is displayed by the OS with no service worker. If a service worker exists and shows a replacement in time it can override; otherwise the declarative notification is the fallback. Browsers without support treat the same JSON as an ordinary push (the SW `push` handler receives it).
- **Decision:** send **one payload shape** that is valid declarative JSON, and also keep a tiny `push` handler in our service worker that reads `data.json().notification` and calls `showNotification`. That covers iOS 16.4 to 18.3 (imperative), 18.4+ (declarative, works even if the SW is dead), and desktop browsers.

**Badging API (16.4+):** `navigator.setAppBadge(n)` / `clearAppBadge()` work only for Home Screen apps, and the badge is shown only if notification permission is granted. Wrap in try/catch. Use it for "quests pending" and clear it on launch.

**Detecting standalone:** `window.navigator.standalone === true` (iOS-only, Apple docs) OR `matchMedia('(display-mode: standalone)').matches` (firt recommends the media query). Use both. Gate the notification onboarding step on `standalone` and on `'PushManager' in window`; in a Safari tab show the "Share, then Add to Home Screen" instructions. On iOS 26+ also tell the user to keep "Open as Web App" switched on.

**Other iOS push quirks:** Focus modes apply to web-app notifications and sync across devices through the manifest `id` (set a stable `id`). The OS may delay low-urgency pushes, so use `Urgency: high` for time-boxed reminders and a TTL of a few hours so a stale "drink water" does not arrive the next morning.

**Decision for our app:** installed-only push, user-gesture subscribe, VAPID with `https:` subject, aes128gcm via a WebCrypto lib, one declarative-compatible payload, SW fallback handler, self-healing re-subscribe on every launch, badge for pending quests.

---

## 2. Service worker and storage

**Service worker.** Supported since iOS 11.3. No Background Sync, Periodic Background Sync, or Background Fetch (firt). So **nothing can run in the background on iOS except a push-triggered SW event**; all offline queues must flush when the app is open. Navigation Preload since 15.4. Static Routing since 27.0 (optional).

**Quota.** Since iOS 17: a browser app (and a Home Screen web app, which "has the same origin quota and overall quota as when it is opened in a browser app") gets up to ~60% of total disk per origin and 80% overall; no quota prompts. `StorageManager.estimate()` is an upper bound, handle `QuotaExceededError`. Cross-origin frames get 1/10. The old 50 MB Cache API figure is from 2021 and obsolete. Exact limits vary to avoid fingerprinting (MDN).

**Eviction and the 7-day rule (the question that matters)**
- ITP deletes script-writable storage (localStorage, IndexedDB, SW registrations, Cache API) for an origin **in Safari** after 7 days of Safari use with no user interaction on that site (MDN: "Cookies set by server are exempt").
- WebKit's own ITP post: "Web applications added to the home screen are not part of Safari and thus have their own counter of days of use", the counter resets with real use, and WebKit "does not expect website data to be deleted for first parties in these apps" and calls such deletion a serious bug. **So the 7-day cap does not apply to the installed app as long as it is opened.** Caveats: that is a 2020 statement, not a hard guarantee; one 2026 project note repeats it but flags it as unverified; and the cap does apply to the same origin if the user opens it in a Safari tab and never in the app (separate storage anyway).
- Other eviction: LRU under disk pressure, "best-effort" origins first; persistent origins are skipped (WebKit 14403). The user can also delete via Settings.
- `navigator.storage.persist()`: supported since 15.2; WebKit grants by heuristic ("whether the site is opened as a Home Screen Web App"); no prompt; MDN says Safari decides from interaction history. Call it on first standalone launch and again every launch (cheap), store the boolean in `settings`, and show it in a Platform Health screen. Do not rely on it as a guarantee.
- **Home Screen app storage is separate from Safari's** (cookies are copied once at add-to-Home-Screen since 17.2 per firt; nothing else). So the user must do onboarding inside the installed app, not in Safari. Data created in a Safari tab before install does not carry over.
- Deleting the Home Screen icon deletes all its data (standard iOS behaviour; inferred, **TEST ON DEVICE**). This is why the weekly backup nag in B2 is the real safety net.

**IndexedDB bugs worth knowing**
- WebKit 282093 (open, P1, iOS 17.4/18.0.1/macOS 15): errors like "Error looking up record in object store by key range", and binary values mixed up between keys; quitting Safari clears it. Last activity May 2025, record modified Jan 2026.
- WebKit 292142 (fixed in WebKit main 8 Jul 2025): reading a Blob through an **index** crashed the networking process on iOS 18.4.x. Workaround: `getAll()` then filter in JS.
- Fixed in 26.5 and 27.0: connections permanently broken; DB version 0 after an aborted upgrade; transactions blocked by a suspended page.
- Photos: store as `Blob` in a dedicated `photoBlobs` store keyed by id and **never index the Blob field**; keep metadata in a separate store; read by primary key. Downscale at capture (for example max edge 1600 px, JPEG 0.82 via canvas) so a year of weekly photos is small. Provide an "Export photos" path since blobs make the JSON backup large (see §11).
- Wrap Dexie open in a retry; on `UnknownError`/`AbortError` show a calm "storage hiccup, restart the app" message rather than data-loss alarms.

**Cache for the shell + data.** vite-plugin-pwa 2.0.0 (3 Oct 2026, peer `vite ^3..^8`, `workbox-build ^7.4.1`). Workbox precache default `maximumFileSizeToCacheInBytes` is **2 097 152 (2 MiB)** (workbox-build schema), so raise it for the MediaPipe wasm/model or serve those via a separate runtime cache entry. Use `injectManifest` so we can add the push handler to `sw.ts`. Media files served from the SW cache need `workbox-range-requests` and the **full** file cached first (Chrome Workbox docs), or Safari video elements will not play offline. Howler uses fetch/XHR for Web Audio so it is not affected, but any `<video>` exercise demos are. Prefer animated WebP/short MP4 loaded through `fetch` into `Blob`/objectURL, or precache them whole with RangeRequestsPlugin.

**Decision:** `persist()` on every standalone launch; IDB as source of truth + weekly backup nag; photos downscaled, blobs unindexed; `injectManifest` SW with push handler and RangeRequestsPlugin; never depend on background execution.

---

## 3. Camera (getUserMedia) in standalone mode

**Status.** `getUserMedia` supported since iOS 11 in Safari; **in Home Screen web apps it was broken until iOS 13.4** (WebKit bug 185448: regressed in 13 beta 2, "works fine again" 13.4 beta 1, still fine in 13.5.1). Today it works. (caniuse's note "Does not work in standalone running PWAs" is obsolete.)

**Permission prompts repeat — this is the current real problem**
- WebKit 215884 (resolved "CONFIGURATION CHANGED"): in standalone mode, changing `location.hash`/route reset the grant and stopped the stream. Fix is in Safari's standalone mode; reports through iOS 16.6 and 18.5 say persistence across app sessions is still missing.
- **WebKit 327237 (new, 12 Oct 2026, NEW/unassigned, iOS 26.6.2 and 27):** camera/mic permission granted to a Home Screen web app lasts **only for the current launch**. After the app is closed from the App Switcher or terminated by iOS, the next `getUserMedia()` prompts again. A Safari tab with the site set to Allow is not re-prompted. Apple has not committed to a fix. Workaround that "defeats the per-site model": the user sets Safari camera to "Allow" for all websites; not recommended.
- Apple dev forum 788518: in an SPA, intermittent re-prompts between routes even with the same origin; no answer.
- **Design consequences:** request the camera only on a user tap on a "Start camera" button, once per launch; keep **one** MediaStream in a module-level singleton that outlives route components (never `track.stop()` in route cleanup); stop it only when the form-check session ends or the app goes to the background; use client-side routing with `pushState`/memory history rather than hash routes. Before the first prompt in a launch show a one-line System message explaining "iOS asks once per launch".

**Other camera facts**
- Backgrounding: tracks can end (WebKit 204681) or the video element can stall in a Home Screen app (WebKit 252465, iOS 15.7/16.3); both bugs are known only from search-result summaries, I did not open them, so treat as plausible and TEST ON DEVICE. On `visibilitychange` to visible: check `track.readyState`/`muted`, and if ended or the `<video>` is paused call `getUserMedia` again and replace `srcObject`.
- `playsinline`, `muted` and `autoplay` attributes on the `<video>` are needed for inline camera playback on iPhone (long-standing iOS rule; not re-verified this session, **TEST ON DEVICE**). Without `playsinline` iOS goes fullscreen.
- Camera selection: `facingMode: {ideal: 'environment'}` for barcode, `{ideal: 'user'}` for form check (phone propped facing the lifter, or rear camera if the phone is leaned on a bench). iOS has no stable device IDs before permission; call `enumerateDevices()` after the grant. iOS 26.1 fixed spurious `devicechange` events.
- Resolution: ask `{width:{ideal:1280}, height:{ideal:720}, frameRate:{ideal:30}}`; do not ask for 4K. Pose models work on 256x256 anyway.
- Safari 27.0 fixes video frames having the wrong orientation after a transient device rotation. Lock our UI to portrait (manifest `orientation` is **not** supported on iOS, per firt; rely on the user's rotation lock).
- Front camera preview should be mirrored with CSS `scaleX(-1)`; run the model on the **unmirrored** frame and mirror landmarks on draw.
- Chrome and Firefox on iOS (WKWebView-based shells) cannot use the camera in home-screen mode (WebKit 185448 mentions bug 208667); we only support Safari-installed.

**Decision:** one explicit "Start camera" tap per launch, singleton stream, re-acquire on resume, portrait only, report the iOS repeat-prompt limitation honestly in the UI.

---

## 4. Screen Wake Lock

- Safari tab: supported since 16.4. **Home Screen web apps: did not work from 16.4 to 18.3, fixed in iOS 18.4** (WebKit bug 254545: resolved 2025-03-31 by Jen Simmons; "now works in Home Screen Web Apps" in the 18.4 release notes; MDN BCD marks 16.4 to 18.4 "Does not work in standalone Home Screen Web Apps").
- A reporter suspected a regression on iOS 26.1 and withdrew it (their browser-detection library was the cause), so no known current breakage.
- Behaviour per MDN: needs HTTPS and a visible document; `request()` can reject (low battery / power-saving); the sentinel is single-use and is released when the page is hidden, so re-request on `visibilitychange`. On iOS the lock is also released when the camera/audio session is interrupted; **TEST ON DEVICE** during a long form-check set.
- Fallback for iOS < 18.4 (or if `request()` rejects): hidden looping video (NoSleep trick). `nosleep.js` 0.12.0 is unmaintained (last release June 2022, last push July 2024) and, as noted by the bug thread, uses the native Wake Lock when available, so it adds nothing on 18.4+. The video trick is also reported unreliable and can show lock-screen media controls; it can also conflict with WebRTC/camera streams.
- **Decision:** request a wake lock on Workout/Form-check/Rest-timer screens after the first user gesture; re-acquire on visibility; if `navigator.wakeLock` is missing or the first request rejects, show a small "Keep screen on: ask iOS in Settings (Auto-Lock: Never)" hint. Do **not** ship a NoSleep video fallback (we ask for iOS 18.4+; the PRD owner's phone should be 26.5+ anyway). Skipped: add only if the owner's phone is on < 18.4.

---

## 5. Audio autoplay, Howler and the silent switch

- Web Audio and `<audio>` are locked until a sound is started inside a user gesture. Howler 2.2.4 (last published Sep 2023; effectively frozen, MIT) handles this: `autoUnlock` (default true) plays an empty buffer on the first `touchend`; exposes `Howler.ctx`; `html5PoolSize` pool also unlocked on first interaction; `autoSuspend` (default true) suspends the AudioContext after 30 s idle and resumes on new playback; fires `unlock` and `playerror`.
- **Silent switch.** Web Audio defaults to the "ambient" audio-session category, which mixes with other apps but is **muted by the ring/silent switch**; HTML media elements ignore the switch. `navigator.audioSession.type = 'playback'` (Safari 16.4+) makes Web Audio sound regardless of the switch (WebKit bug thread reports; MDN lists `playback`). Caveats from the same threads: some types (`transient`) misbehave; `play-and-record` pauses other apps' audio once the mic is used. For us: set `'playback'` only if the user opts into "Play System sounds even when silent"; default is `'ambient'` (respect the switch, which is the polite default in a gym, and keeps the user's Spotify playing). With `playback`, the System sounds will **interrupt/duck** background music; offer the setting off by default. A short note in Settings explains the silent switch.
- **Interrupted state.** On iOS Safari the `AudioContext.state` becomes `"interrupted"` when the user leaves the page, locks the screen, or a call/Siri takes the session; it must be `resume()`d, and `resume()` needs a user gesture on some versions (MDN BCD lists `interrupted`; WebKit 273511 "AudioContext stuck on Interrupted", open).
- **Home Screen apps specifically:** WebKit 291892 (open): after returning from the background the Web Audio context can stay silent even when `state === 'running'`; on iOS 26.0 `resume()` from a click handler never returned and `<audio>` was also silent; a user reported it fixed on 26.2 beta 3; the 26.2 release notes list "audio element failed to play when re-opening a Home Screen Web App" as fixed. Related: 27.0 fixes `HTMLMediaElement.volume` ignored when connected to an `AudioContext`.
- **Decision:** one `AudioManager` wrapper over Howler:
  1. Unlock on the first `pointerdown`/`touchend` anywhere (the PRD rule "audio unlocks on first tap").
  2. On every `visibilitychange` to visible and on `statechange`: if `ctx.state !== 'running'` call `ctx.resume()` inside the next pointer event (queue a one-shot listener); play a 1-sample silent buffer and verify `ctx.currentTime` advances after 250 ms; if not, `Howler.unload()` and recreate the context (the "recreate" workaround is not in an Apple source; **TEST ON DEVICE**).
  3. Keep SFX short (< 3 s), preload as decoded buffers, cap simultaneous voices (iOS limits).
  4. Prefer `.m4a`/AAC or `.mp3`; WebM/Opus is supported in modern Safari (Ogg Opus since 18.4) but `.m4a` has the least risk. Bundle a single sprite per category to reduce decode cost.
  5. `Howler.autoSuspend = false` only on the Rest Timer screen (optional), otherwise leave defaults.
  6. Audio is never required to understand state (every sound has a visual twin).

---

## 6. Haptics

- **Vibration API: not supported on iOS in any version** (caniuse shows "n" for iOS Safari up to 27.2). The PRD rule "do not depend on haptics" stands.
- The only trick: Safari 18.0 added a haptic tick for `<input type="checkbox" switch>` (WebKit 18.0 post). Libraries (`ios-haptics` 3.2.0, MIT) click a hidden `<label><input type=checkbox switch></label>` programmatically. WebKit bug 285120 (RESOLVED FIXED Jan 2025) asked that the haptic require user activation. The ios-haptics 3.1.1 README says it "only works on ios 17.4 to 26.4, as apple patched it in ios 26.5" (**single-source claim, UNVERIFIED**). Treat it as dead on 26.5+/27 until a device test says otherwise.
- **Decision:** a `haptic(kind)` function that is a no-op by default; feature-flagged implementation that renders a real visible `switch` control (so the native tap haptic fires when the user actually taps a switch: use `<input type=checkbox switch>` for real settings toggles; that is documented behaviour, not a trick). No programmatic haptics. Replace feedback with visual pulse + sound (already designed) and optional `navigator.vibrate` on Android/desktop only.

---

## 7. MediaPipe Pose Landmarker on iPhone Safari

**Versions and licence.** `@mediapipe/tasks-vision` **1.1.1** (14 Oct 2026; 1.0.0 on 28 Jul 2026; before that 0.10.35 on 27 Apr 2026). Apache-2.0. Unpacked package 42 MB, of which the wasm folder is:
| File | Size |
| --- | --- |
| `vision_wasm_internal.wasm` (+`.js` 334 KB) | 13.5 MB |
| `vision_wasm_module_internal.wasm` (+`.js`) | 13.5 MB |
| `vision_wasm_nosimd_internal.wasm` (+`.js`) | 12.6 MB |
| `vision_bundle.mjs` | 156 KB |

Models (Google Cloud Storage, float16 v1): `pose_landmarker_lite.task` **5.78 MB**, `full` 9.40 MB, `heavy` 30.66 MB. Model card: Apache-2.0; on a Pixel 3 lite ~44 FPS CPU / ~49 FPS GPU, full ~18 / ~40, heavy ~ lower. Inputs: detector 224x224, landmarker 256x256, float16.

**GPU delegate on iOS Safari.** Delegate `"GPU"` uses WebGL2 (iOS 15+); `delegate?: "CPU" | "GPU"` in the type definitions; `canvas` can be passed to `setOptions`. WASM SIMD works from iOS 16.4. There is **no published iPhone Safari FPS number** for the current Tasks API (I searched docs, blogs and issues). The only data: the 2021 TF.js blog table (MediaPipe WASM runtime N/A on iPhone 11 at the time; TF.js WebGL lite 34 FPS, full 30 FPS on iPhone 11), and a native iOS anecdote of GPU throttling from 30 to 18 FPS on an iPhone 12 (secondary source, not opened). **We must measure on the owner's phone.**

**Known Safari/iOS issues (GitHub, WebKit)**
- mediapipe #6142 (open, Nov 2025, iOS 18.7.1, iPhone 12 Pro, tasks-vision 0.10.22): ImageSegmenter **GPU delegate returns wrong category labels on iOS Safari**; CPU correct. Pose task not reported, but it shows the GPU path on iOS can be wrong.
- mediapipe #4499 (stale-closed 2024): `Creating a context with WebGL 2 failed` inside WKWebView on iOS 16.4.1; fix was passing a `canvas` element to `createFromOptions`; same page worked in Safari.
- mediapipe #5970 (open): even `delegate: "CPU"` fails when WebGL2 context creation fails, because pre/post-processing nodes assume a GPU service. So **CPU is not a WebGL-free fallback**; if WebGL2 fails, form check is unavailable.
- mediapipe #6223 (open, desktop): GPU delegate for Pose Landmarker causes growing memory/swap on macOS; no fix. Watch memory on long sessions.
- WebKit 321693 (iOS 27 beta 5, duplicate of fixed 321571): GPU-process crash when a camera-backed `<video>` was hidden with `display:none` while MP4 decode started, reproduced with PoseLandmarker 0.10.32 + GPU delegate. Safari reloads the page.
- Docs: `detect()`/`detectForVideo()` are synchronous and block the main thread; Google suggests a Web Worker for camera input.
- iPhone low-power mode and thermal throttling reduce frame rate (general knowledge; **TEST ON DEVICE**).

**Recommended configuration**
```ts
const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');           // self-hosted
const landmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: { modelAssetPath: '/mediapipe/pose_landmarker_lite.task', delegate: 'GPU' },
  runningMode: 'VIDEO', numPoses: 1,
  minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
});
```
- Model: **`pose_landmarker_lite.task`** (5.8 MB). Rep counting and joint-angle rules do not need `heavy`; full (9.4 MB) as an opt-in "High accuracy" toggle if the benchmark shows headroom.
- Loop: `requestVideoFrameCallback` if present (Safari 15.4+, **verify**) else `requestAnimationFrame`; cap inference at ~20 Hz (the angle engine needs about 10 Hz for rep phases), skip frames while a detection is in flight; pass monotonic timestamps from `performance.now()`.
- Start with GPU; if creation throws or `detectForVideo` averages above ~60 ms, recreate with CPU; if that also throws, disable form check with a clear message. Persist the working delegate in `settings`.
- Main thread first (simplest). Move to a module Worker only if the benchmark shows UI jank (worker needs `OffscreenCanvas`, supported since iOS 17.0 per caniuse).
- Benchmark harness to build into the Settings "Platform Health" screen: run 300 frames on a recorded clip and on the live camera, report mean/p95 `detectForVideo` ms and achieved FPS, plus `navigator.deviceMemory` unavailable on iOS, so record battery/thermal manually. Acceptance bar: p95 < 50 ms on lite for 5 minutes continuous.
- **Self-hosting for offline** (Cloudflare Pages serves static files up to 25 MiB each; both wasm files and the model fit): copy `node_modules/@mediapipe/tasks-vision/wasm/*` to `public/mediapipe/wasm/` and the model to `public/mediapipe/`. Total shipped ~ 19.6 MB for lite + the one wasm variant actually used (verify in the Network tab which of `internal` / `module_internal` / `nosimd` iPhone loads; precache only that one, plus the `.js` loader). Do **not** put them in the Workbox precache (2 MiB default limit, and they inflate every SW update): register them as a **CacheFirst runtime route with a versioned cache name** and warm the cache when the user first opens Form Check on Wi-Fi ("Download form-check pack, 20 MB"). Cloudflare `_headers`: `Content-Type: application/wasm`, long immutable cache on `/mediapipe/*`.
- Pin `@mediapipe/tasks-vision` to an exact version and keep the wasm folder and the JS bundle from the **same** version (the loader and wasm must match).

**Decision:** Pose Landmarker lite, GPU delegate with automatic CPU fallback, ~20 Hz inference loop, self-hosted model + wasm in a lazily downloaded offline pack, built-in benchmark, and an honest "unsupported on this device" path.

---

## 8. Barcode scanning in Safari

- **`BarcodeDetector` is not available in Safari.** MDN BCD lists Safari support only behind a "Shape Detection API" preference since 17; WebKit bug 281848 (NEW, unassigned, last modified 2026-07-21): worked behind the flag in 17.6, **stopped working in 18.x**, still failing on iOS 18.4/18.5 and the first iOS 26 beta, no resolution. Treat it as absent on iOS 26/27 (not re-tested on 27 by me; there is no WebKit statement either way).
- Options (all MIT/Apache, all work from a `<video>`/canvas frame):
  | Option | Version, date | Notes |
  | --- | --- | --- |
  | `@zxing/browser` 0.2.1 + `@zxing/library` 0.23.0 | Jul 2026 / Apr 2026, Apache-2.0 | `BrowserMultiFormatReader.decodeFromVideoDevice(deviceId, video, cb)` returns `controls.stop()`; `decodeFromConstraints` lets us pass `facingMode`. Pure JS on the main thread (no wasm), 11.9 MB unpacked package. Maintenance is slow: 182 open issues on the library. |
  | `zxing-wasm` 3.1.6 | 19 Oct 2026, MIT (zxing-cpp Apache-2.0) | `readBarcodes(imageData, {formats:[...]})`. `reader` build `zxing_reader.wasm` **947 KB** (full 1.5 MB). wasm lazily fetched; self-host with `prepareZXingModule({overrides:{locateFile}})`. Actively maintained (2 open issues). Supports EAN-13, EAN-8, UPC-A, UPC-E, Code 128 and QR. |
  | `barcode-detector` 3.2.3 | 19 Oct 2026, MIT | BarcodeDetector **polyfill/ponyfill built on zxing-wasm**; same `.wasm` self-host knob; formats include `ean_13`, `ean_8`, `upc_a`, `upc_e`, `ean_upc`, `qr_code`. Lets us write standard `new BarcodeDetector({formats}).detect(video)` and use the native one on Android/desktop where present. |
  | `html5-qrcode` 2.3.8 | Apr 2023, Apache-2.0 | Unmaintained since 2023 (448 open issues). Skip. |
  | `qr-scanner` 1.4.2 | Nov 2022 | QR only, unmaintained. Skip. |
  | `@ericblade/quagga2` 1.13.0 | Oct 2026 | 1D-only JS decoder; fallback candidate only. |
- EAN-13 is what Open Food Facts uses; **UPC-A is just EAN-13 with a leading 0**, so normalise: strip, left-pad to 13 digits, validate the check digit, then query. `zxing-cpp` reports UPC-A natively; EAN-13 starting with `0` and UPC-A represent the same product.
- Scan loop (any library): `getUserMedia` rear camera, `playsinline muted`, draw the video to a small canvas (crop the centre band, width ~640 px), decode at ~8 Hz, restrict `formats` to `['ean_13','ean_8','upc_a','upc_e']`, require two identical consecutive reads, stop the stream on success, torch via `track.applyConstraints({advanced:[{torch:true}]})` if `getCapabilities().torch` (Safari 18.4 notes mention `torch` settings now accurate; **TEST ON DEVICE**). Provide manual entry as the permanent fallback.
- Permission note: same per-launch camera prompt as §3.

**Decision:** replace `@zxing/browser` in F2 with **`barcode-detector` (ponyfill) over self-hosted `zxing-wasm` reader build** (947 KB, maintained, same API as the web standard, EAN-13/UPC-A native). Keep `@zxing/browser` only if bundle size of the wasm approach is a problem (it is not). This updates the PRD's stack line; flag to the owner.

---

## 9. Cloudflare Access with an iOS standalone PWA, and free-tier math

### 9a. Access + standalone PWA

**What the sources establish**
- Home Screen web app storage (cookies, localStorage, service worker) is **not shared** with Safari; only cookies are copied once at add-to-Home-Screen (since 17.2 per firt; WebKit's own Mac post says "Safari will copy the website's cookies to the web app ... no other website data is shared").
- Access authentication goes through `cloudflareaccess.com` (the team domain) with a one-time-PIN or IdP, then redirects back and sets `CF_Authorization` (default 24 h session; HttpOnly and SameSite configurable; `CF_Device` 30 days).
- Out-of-scope navigations from an installed app open in an **in-app browser (Safari View Controller)** (firt: "in-app browser for out-of-scope links since 12.0"; a 2026 project note says the same). The Access login lives on another origin, so in a standalone PWA the login screen opens in that overlay; whether the `CF_Authorization` cookie set there ends up in the installed app's cookie jar is **UNVERIFIED and TEST ON DEVICE**. I found **no Cloudflare community report that confirms or denies it**, and none from Cloudflare docs (the cookie page has no mobile/PWA section).
- **Hard evidence of a break:** WebKit fetches manifest/icon requests **without cookies**, so Access answers `/apple-touch-icon.png` (and by extension `/manifest.webmanifest`) with a 302 to the login page; the home-screen icon is blank until Bypass apps are created for those exact paths (elvisbrevi/personal-teams-assistant PR #70) and the user re-adds the app.
- **Hard evidence of a second break:** the app is offline-first with a service worker. The SW update check (`/sw.js`), precache fetches and lazy asset fetches go through Access. Once the 24 h session expires, those fetches get a cross-origin 302 and fail, so **updates silently stop** (inference from the documented session behaviour; **TEST ON DEVICE**). Re-login must happen inside an in-app overlay every day.
- The push Worker lives on another origin (`*.workers.dev` or a custom hostname) and is not behind the same Access app, so it still needs its own auth anyway.

**Recommendation (matches the PRD fallback):**
1. **Do not put Access in front of the app origin.** Ship on Cloudflare Pages/Workers at an unguessable subdomain (for example a random 12-character label) with `X-Robots-Tag: noindex` and `robots.txt` disallow; the static bundle contains only open datasets and our code, user data never leaves the device (PRD B6).
2. App-level **passcode/biometric-free lock**: a 4 to 6 digit PIN stored as a salted PBKDF2 hash in `settings`, asked on cold start and after N minutes in the background; it protects the on-device data from a borrowed phone, which is the real privacy risk. WebAuthn/passkeys are an option but "reports of flaky prompts from the Home Screen" (project note, unverified).
3. The **Worker** is protected by a shared secret: at first subscribe the app generates a random 32-byte token, sends it with the subscription (`Authorization: Bearer`), and the Worker stores only its SHA-256; every later call (`/status`, `/schedule`, `/unsubscribe`) must present it. CORS allowlist = our app origin. This is real auth for the only server-side data.
4. If the owner insists on Access, test this exact script on the phone: add Access app, bypass policies for `/manifest.webmanifest`, `/apple-touch-icon.png`, `/icon-*.png`, `/sw.js` and `/assets/*` (which makes Access moot for the shell), set session duration to the maximum (Cloudflare docs list session duration per policy; the page I read did not state the maximum), install, wait 25 h, check that the app opens offline and updates. Keep the unlisted-URL fallback ready.

### 9b. Cloudflare free-tier limits (read from docs, Oct 2026)

| Item | Free limit |
| --- | --- |
| Workers requests | 100 000 / day (reset 00:00 UTC) |
| Workers CPU | **10 ms per invocation** (HTTP and Cron) |
| Subrequests per invocation | 50 |
| Cron Triggers | **5 per account** (a 15-min trigger uses 1); Cron runs in UTC; edits take up to 15 min to propagate; syntax is 5-field |
| KV reads | 100 000 / day |
| **KV writes** | **1 000 / day**, 1 write/sec per key; eventual consistency up to 60 s |
| KV storage | 1 GB; value <= 25 MiB; key <= 512 B |
| D1 | 5 M rows read / day, 100 000 rows written / day, 5 GB |
| Durable Objects | SQLite-backed only on free; 100 000 requests/day, 5 M rows read/day, 100 000 rows written/day |
| Pages | 500 builds/month, 20 000 files per site, 25 MiB per file, 100 projects |
| Static asset requests | free and unlimited |

Pages is not deprecated; but the Cloudflare migration guide says Workers has "a distinctly broader feature set" (Cron Triggers, Durable Objects, Observability) and **Pages does not support Cron Triggers**, so the push Worker must be a separate Worker either way. Alternative worth taking: host the static app **and** the push API in one Worker with Static Assets (same origin, no CORS, one deploy); Workers static asset limits are 20 000 files / 25 MiB each. The PRD says Pages; both work. Decision: **Pages for the app + separate Worker for push**, unless the exercise media file count approaches 20 000 (it must not: ship GIFs as one pack/CDN or R2 if needed).

### 9c. Does a 15-min cron + daily status writes fit?

Assume one user, one subscription, 15 reminder types, `*/15 * * * *`.
- Cron invocations: 24 x 4 = **96 / day** (of the 100 000 request budget; whether cron counts against it is not stated in the pages I read, either way negligible).
- KV design: **one key `user` holding one JSON blob** (subscription, token hash, schedule, today's status booleans, `sentToday[]`, tz). Cron does 1 `get` per run = **96 reads/day** (limit 100 000).
- Writes: status updates from the app are coalesced client-side (send only when a boolean flips: workoutDone, waterHit, mealsLogged, kcalHit, readinessDone, streakSafe; at most ~10 per day) + a write after each push is sent to record `sentToday` (at most ~12) + schedule edits (1 to 2). **~25 to 35 writes/day vs 1 000 allowed (3%).** Even the naive "write on every log" (about 100 logs/day) is 10% of the limit. The per-key 1 write/sec limit is irrelevant at this rate (debounce 2 s on the client).
- Consistency: KV edge reads can be up to 60 s stale. A status flip at 17:59 may be invisible to a 18:00 cron. Mitigation: reminders fire only when `due <= now < due+15 min` and the check of "already satisfied" uses a 2-minute guard (skip if `statusUpdatedAt` is within 2 min of `now` and the previous read lacks the flip: delay one cycle). At 15 min granularity this is fine; if exactness matters switch the single key to D1 (strong consistency, 100 000 writes/day) or a SQLite Durable Object.
- CPU: 10 ms per invocation. Per push: ECDH + HKDF + AES-GCM + ECDSA(P-256) sign via WebCrypto is native and sub-millisecond to a few ms; the `fetch` wait is not CPU. Batch at most ~3 pushes per run and **measure with `wrangler tail`/`--cpu` before launch**; if over, send one combined message per cycle. (No source gives a per-push CPU figure; **TEST**.)
- **Verdict: fits comfortably.** Worst case 96 reads + ~100 writes + ~200 HTTP requests per day.
- Time zones: cron is UTC. Store IANA tz in the blob and compute local `HH:mm` with `Intl.DateTimeFormat(tz)` each run so DST is handled.

---

## 10. Web push inside a Cloudflare Worker

**Why not `web-push`:** Node `web-push` 3.6.7 (MPL-2.0, last release Jan 2024, repo still active) needs `https.request` and `crypto.createECDH`; issue #718 documents that it does not work on Workers even with `nodejs_compat`; one commenter reported failure on iPhone in Feb 2026. Cloudflare's WebCrypto now lists ECDH `deriveBits`, ECDSA `sign`, HKDF `deriveBits`, AES-GCM `encrypt`, HMAC, so the missing primitives are no longer the obstacle; the library is still Node-shaped. Skip it.

**Candidates (all checked via npm registry, GitHub API, and source)**

| Package | Version / date | Licence | Stars, last push | Notes |
| --- | --- | --- | --- | --- |
| **`@block65/webcrypto-web-push`** | **2.0.0**, 15 Sep 2026 | MIT | 47, pushed 21 Oct 2026 | RFC 8291 `aes128gcm` + RFC 8292 `vapid` scheme; pads to 4096 octets (max payload 3993 B); Workers/Bun/Deno/Node; ESM; `uint8array-extras` dependency; README says v1.x used `aesgcm`/`WebPush` scheme that Apple rejects and v2 fixes it. API: `buildPushPayload(message, subscription, vapid)` returns a `fetch` init. |
| `@pushforge/builder` | 2.0.5, 23 Apr 2026 | MIT | 66, pushed 23 Apr 2026 | Zero deps, Workers tested. **Source (`payload.js`, `vapid.js`) uses `Content-Encoding: aesgcm`** info strings and header, i.e. the legacy scheme; README only claims "Safari 16+" via a playground. Not trusted for Apple until proven. |
| `web-push-browser` | 1.4.2, Aug 2025 | ISC | 2 stars | Tiny, little adoption. |
| `webpush-webcrypto` | 1.0.5, Apr 2025 | MIT | n/a | Suggested in web-push #718; works on Workers; iOS not confirmed. |

**Decision:** **`@block65/webcrypto-web-push` 2.0.0** (active, MIT, Apple-compatible encodings by design). Pin the version, vendor a test that builds a payload and decrypts it with a test client key (RFC 8291 Appendix A vectors) so the Worker tests pass without Apple, and treat the first real-iPhone send as an owner acceptance step (the PRD already says so). Fallback plan: ~120 lines of our own WebCrypto code (below) if the library regresses.

**RFC 8291 aes128gcm send steps (verified against the RFC text)**
1. Subscription gives `endpoint`, `p256dh` (65-byte uncompressed UA public key) and `auth` (16 bytes), base64url.
2. Generate an ephemeral P-256 ECDH key pair `as` for **this message**; `as_public` = 65-byte raw export.
3. `ecdh_secret = ECDH(as_private, ua_public)` (`crypto.subtle.deriveBits`, 256 bits).
4. `PRK_key = HMAC-SHA-256(auth_secret, ecdh_secret)`; `key_info = "WebPush: info" || 0x00 || ua_public || as_public`; `IKM = HMAC-SHA-256(PRK_key, key_info || 0x01)` (equivalent to one HKDF-SHA256 with salt = auth, info = key_info, L = 32).
5. Random 16-byte `salt`. `PRK = HMAC-SHA-256(salt, IKM)`; `CEK = HMAC(PRK, "Content-Encoding: aes128gcm" || 0x00 || 0x01)[0..16]`; `NONCE = HMAC(PRK, "Content-Encoding: nonce" || 0x00 || 0x01)[0..12]`.
6. Plaintext = payload bytes `|| 0x02` (last record delimiter), optional zero padding after the delimiter byte only up to the record size; single record, `rs` greater than plaintext + 16.
7. Ciphertext = AES-128-GCM(CEK, NONCE, plaintext) (tag appended).
8. Body = `salt (16) || rs (4 bytes, big-endian, e.g. 4096) || idlen (1 byte = 65) || as_public (65) || ciphertext`. Header is 86 octets; max plaintext 3993 octets.
9. Request headers: `Content-Encoding: aes128gcm`, `Content-Type: application/octet-stream`, `TTL: <seconds>`, `Urgency`, `Topic`, `Authorization`.

**RFC 8292 VAPID**
1. One ECDSA P-256 signing key pair (generate once; store the private key as a Worker secret in JWK form, publish the 65-byte public key base64url in the app bundle as `applicationServerKey`). It must differ from the per-message ECDH key.
2. JWT: header `{"typ":"JWT","alg":"ES256"}`; claims `aud` = origin of the endpoint (for example `https://web.push.apple.com`), `exp` = now + at most 24 h (use 12 h and cache per origin for an hour; Apple asks for no more than one refresh per hour), `sub` = `https://<our-domain>` (not `.local`).
3. Signature: ECDSA P-256 SHA-256, **raw 64-byte R||S** (WebCrypto `sign` returns exactly that, not DER). base64url without padding for all three JWT segments.
4. Header: `Authorization: vapid t=<jwt>, k=<base64url public key>`.
5. If `k` differs from the key used in `subscribe()`, Apple replies `VapidPkHashMismatch`: keep the key pair stable forever (back it up).

Worker skeleton: `fetch` handler (`POST /subscribe`, `/status`, `/schedule`, `DELETE /subscription`, all behind the bearer token + CORS allowlist), `scheduled` handler (`*/15 * * * *`) that loads the KV blob, decides which reminders are due and unsatisfied, sends, deletes the subscription on 404/410/`VapidPkHashMismatch`, and records sent markers. System messages text comes from a catalogue file shared with the app; the payload carries `{web_push:8030, notification:{title, body, tag, icon}, navigate, app_badge}`.

---

## 11. Other platform items

**Viewport and safe area.** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; `env(safe-area-inset-*)` (iOS 11.3+, caniuse; `constant()` is the pre-11.3 name); pad the bottom nav with `padding-bottom: max(8px, env(safe-area-inset-bottom))`. Use `100dvh` (iOS 15.4+) not `100vh`; prefer `min-height: 100dvh` on the app root and let inner panes scroll. `overscroll-behavior` supported from iOS 16.0 (use `overscroll-behavior-y: none` on scroll containers; caniuse notes `none` on `body` was historically not honoured, so test).

**Status bar.** `apple-mobile-web-app-status-bar-style: black-translucent` is "still the only way to get a fullscreen app" (firt); the content then goes under the status bar, so the header needs `padding-top: env(safe-area-inset-top)`. `theme_color` manifest field is read since iOS 15; the `status-bar-style` meta is marked superseded by it. Our app is dark only: set `theme-color` and `background-color` to the near-black token and set `html{background:<token>}` so overscroll and first paint are not white.

**Icons and splash.** `<link rel="apple-touch-icon" sizes="180x180">` opaque PNG (no transparency; iOS fills it black). Manifest icons are used since 15.4; SVG manifest icons since 26.0; maskable/monochrome are recognised but ignored (firt). Splash screens only via `apple-touch-startup-image` with per-device media queries and the `apple-mobile-web-app-capable` meta (until iOS 26 it was required; 26+ no longer needs it to open as an app but startup images need it). `@vite-pwa/assets-generator` 2.0.0 produces the 180x180 Apple icon (its docs I read do not mention splash screens). **Decision:** ship no splash images; use a solid dark `html` background and an inline first-paint "System booting" shell so the blank phase is on-theme. Apple says if none is set it uses a screenshot of the last launch.

**Web Share.** `navigator.share` since 12.1, files since 14/15 (caniuse, firt "Web Share 2.0 since 15.0"). Needs transient user activation (WebKit `Navigator.cpp` consumes it; rejects `NotAllowedError` otherwise) and `canShare({files})` checks only that files are present; WebKit's `Navigator::canShare` applies **no MIME allow-list** (the OS share sheet decides). **TEST ON DEVICE** with `new File([md], 'shadow-report.md', {type:'text/markdown'})`; fallback chain: (1) `share({files})` if `canShare`, else (2) `share({title, text})` with the Markdown as text (long text can be truncated by the target app; **TEST**), else (3) `navigator.clipboard.writeText` (needs gesture), else (4) a `<textarea>` the user can long-press and copy. `share_target` in the manifest is not supported (firt), and link capturing is not supported.

**Clipboard.** `writeText` from a click handler works in standalone. Always keep the visible textarea fallback.

**File input.** `<input type="file" accept="image/*" capture="environment">` opens the camera or photo library; for backup restore use `accept=".json,application/json"` (Files app picker). File input works since iOS 6; `FileReader`/`file.text()` fine.

**Downloading a JSON backup in standalone mode.** Anchor `download` with a Blob URL works in modern Safari, including Home Screen apps, but evidence is thin and historically flaky: blob URLs reportedly broke in iOS 17.4.1 and were fixed in 17.5 beta (Apple forum 751063) and older standalone download problems exist (WebKit 167341; Apple forum 119017, 95911); those four are from search-result summaries only, not opened, and 26.2/26.5 fixed service-worker downloads not saved and wrong extensions from the URL path. Hence: (a) create the file with the right `type` and `download` name, `revokeObjectURL` after >= 1 s; (b) the **primary** backup action on iOS is `navigator.share({files:[backup.json]})` (lets the user "Save to Files" or AirDrop), with the anchor download as secondary; (c) add a "Copy backup to clipboard" path for tiny datasets. **TEST ON DEVICE** which of (a)/(b) the owner prefers. Never block on the download succeeding: verify by reading the file back through the restore input in tests.

**Other iOS facts to design around.** No Background Sync; no `beforeinstallprompt` (show manual A2HS instructions; standalone detection as in §1); manifest `orientation` unsupported; `fullscreen` and `minimal-ui` display modes fall back (firt); external links open in an in-app browser; Notification permission in Settings is per web app; the app has its own storage per install (a second install with a different `id` has separate data).

---

## Findings

1. **iOS 27.0.1 is current** (14/28 Sep 2026). Nothing in Safari 26.6 or 27.0 breaks or fixes PWA push, wake lock, or camera persistence; the relevant behaviour is set by 16.4, 17.0, 18.0, 18.4, 26.0, 26.2 and 26.5.
2. **Push works only for the installed app**; subscribe in a tap; every push must display; VAPID `sub` must be `https:`/real mailto; payload <= 4 KB (3993 B plaintext); Apple rejects legacy `aesgcm`.
3. **Declarative Web Push (18.4)** lets one JSON shape work with or without a service worker; keep an SW fallback for 16.4 to 18.3.
4. **Storage:** installed apps have their own ITP counter (no 7-day purge while used), 60% of disk quota, `persist()` granted heuristically. Real risks: user deletes the icon, IDB bugs (282093 open, 292142 fixed), disk pressure. Backup nag stays mandatory.
5. **Camera re-prompts every launch in Home Screen apps** (WebKit 327237, filed 12 Oct 2026, unresolved). Hash-navigation resets were closed as config change (215884).
6. **Wake lock works in the installed app from iOS 18.4**; no video hack needed.
7. **Audio:** unlock on first gesture; ring switch mutes Web Audio unless `audioSession.type='playback'`; `AudioContext` goes `interrupted` and in Home Screen apps can stay silent while `running` (WebKit 291892 open; partly fixed in 26.2).
8. **Haptics:** no Vibration API; the switch-checkbox trick exists (18.0) and is claimed patched in 26.5 (unverified). Do not rely.
9. **MediaPipe:** `@mediapipe/tasks-vision` 1.1.1, lite model 5.8 MB, wasm 13.5 MB. No published iPhone Safari FPS; GPU path has iOS correctness bugs for other tasks (#6142); `delegate:'CPU'` still needs WebGL2 (#5970); iOS 27 beta 5 had a GPU-process crash with hidden camera video (321693, fixed by dup).
10. **BarcodeDetector is not usable in Safari** (281848 open since Oct 2024). `zxing-wasm` reader build (947 KB) via `barcode-detector` ponyfill is maintained and supports EAN-13/UPC-A; `html5-qrcode` is abandoned.
11. **Cloudflare Access is a poor fit for an offline PWA:** icon/manifest requests are cookie-less (documented break), SW updates break at session expiry (inference), and standalone-vs-Safari cookie separation makes login flows fragile; no source proves it works. Use unlisted URL + in-app PIN + token-protected Worker.
12. **Free-tier math fits** (96 KV reads, ~30 KV writes, ~100 requests per day against 100 000 / 1 000 / 100 000); KV staleness (60 s) is tolerable; Worker CPU 10 ms needs a one-time measurement.
13. **`web-push` does not run on Workers**; `@block65/webcrypto-web-push` 2.0.0 does and is Apple-compatible by design; `@pushforge/builder` still emits `aesgcm`.
14. Pages has no Cron Triggers; the push Worker is separate regardless (or fold the app into one Worker with Static Assets).
15. Share/clipboard/download paths are thin on primary evidence; each needs one on-device check and a fallback.

## What we take

- Installed-only push with gesture-gated subscribe, `getSubscription()` self-heal on every launch, `https:` VAPID subject, delete on 404/410/`VapidPkHashMismatch`, and a **single declarative-compatible JSON payload** plus a minimal SW `push` fallback.
- `@block65/webcrypto-web-push` 2.0.0 in a separate Worker; one KV blob; `*/15 * * * *`; bearer-token auth; IANA tz handling.
- `persist()` every standalone launch; weekly backup nag; Blob photos downscaled and unindexed; `injectManifest` SW with `RangeRequestsPlugin`.
- Wake lock via the native API only (iOS 18.4+); re-acquire on visibility.
- Audio manager with unlock, `interrupted` recovery, optional `audioSession='playback'` setting, visual twin for every sound.
- No programmatic haptics; native `<input type=checkbox switch>` for real toggles only.
- `pose_landmarker_lite.task`, GPU delegate with CPU fallback, ~20 Hz loop, self-hosted lazily downloaded "form-check pack", built-in benchmark, singleton camera stream.
- `barcode-detector` ponyfill + self-hosted `zxing-wasm` reader; GTIN normalisation; manual entry fallback.
- Unlisted URL + app PIN lock + token-protected Worker instead of Cloudflare Access.
- Safe-area CSS (`viewport-fit=cover`, `env()`, `dvh`), dark solid first paint, 180x180 opaque apple-touch-icon, manifest `id`.
- Share-sheet-first export with clipboard and textarea fallbacks.

## What we do better

- A **Platform Health screen** (Settings) that actively tests and displays: standalone, notification permission + live subscription match with the Worker, `persist()` result and `estimate()`, audio context state with a round-trip test tone, camera grant, wake lock acquisition, WebGL2 + MediaPipe delegate with a measured p95 ms and FPS, barcode decode self-test, last backup age. Every failure has a one-line fix. Competing PWAs ship silent failures.
- **Self-healing instead of hoping:** push re-subscribe on launch, audio context recreation, camera re-acquire on resume, DB open retry, delegate downgrade; all logged to a local diagnostics buffer the user can paste into the AI report.
- **Honest graceful degradation ladder** (declarative push, then SW push; GPU pose, then CPU, then "unavailable"; native share, then clipboard, then textarea) with the iOS limitation named in System voice rather than a generic error.
- **Zero-trust-the-server model:** the Worker holds only a subscription, schedule, and booleans, authenticated by a per-install bearer token, so no third-party auth redirect can break the installed app, and the app still opens and updates offline.
- **Cost discipline:** KV budget computed up front (3% of the daily write cap), cron kept at 1 of 5 triggers, lazily downloaded 20 MB form-check pack so first install stays small.
- Replace the PRD's `@zxing/browser` with a maintained wasm decoder behind the standard `BarcodeDetector` interface so the code works unchanged when Safari ever ships the native one.

## Items to confirm on the owner's iPhone (acceptance checklist)

1. Cold start the installed app twice: camera prompt each launch? (327237)
2. Push: subscribe, background the app, send from the Worker, confirm delivery with the app force-quit; test declarative and SW paths.
3. `CF_Authorization` flow only if Access is chosen (§9a step 4).
4. Wake lock held through a 5-minute form-check set with the camera on.
5. Audio: ring switch on/off, background and return, lock and unlock, phone call interruption.
6. MediaPipe lite GPU p95 ms and thermal behaviour over 5 minutes; delegate fallback path.
7. Backup via share sheet and via anchor download; restore round trip; `navigator.share` with a `.md` file.
8. `persist()` result, and `estimate()` quota number.
9. Whether the checkbox-switch haptic still fires on the installed iOS version.

## Sources

Apple / WebKit
- https://support.apple.com/en-us/100100 (iOS release dates)
- https://support.apple.com/en-us/149039 (Safari 27 release date)
- https://developer.apple.com/tutorials/data/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers.json (Apple "Sending web push notifications in web apps and browsers", JSON of the doc page)
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- https://developer.apple.com/forums/thread/788518
- https://webkit.org/blog/ (index) and the feed https://webkit.org/feed/ (pages 1 to 6, used to scan the 26.x/27.0 release notes)
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://webkit.org/blog/14112/badging-for-home-screen-web-apps/ (fetched at the 14112 URL)
- https://webkit.org/blog/14205/news-from-wwdc23-webkit-features-in-safari-17-0/
- https://webkit.org/blog/14403/updates-to-storage-policy/
- https://webkit.org/blog/14445/webkit-features-in-safari-17-1/
- https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- https://webkit.org/blog/15865/webkit-features-in-safari-18-0/
- https://webkit.org/blog/16535/meet-declarative-web-push/
- https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- https://webkit.org/blog/17541/webkit-features-for-safari-26-1/ , /17640/ (26.2), /17862/ (26.4), /17938/ (26.5)
- https://webkit.org/blog/18178/webkit-features-for-safari-26-6/
- https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/
- https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/page/Navigator.cpp
- WebKit bugs: https://bugs.webkit.org/show_bug.cgi?id=254545 , 215884 , 327237 , 185448 , 321693 , 281848 , 291892 , 273511 , 282093 , 292142 , 285120

Compat data and docs
- https://firt.dev/notes/pwa-ios/ (updated 13 Oct 2026)
- https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/ (wake-lock, vibration, web-share, push-api, notifications, stream, webgl2, wasm-simd, webgpu, offscreencanvas, viewport-unit-variants, css-overscroll-behavior, css-env-function)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/ (BarcodeDetector, Navigator, StorageManager, AudioSession, BaseAudioContext)
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare
- https://developer.mozilla.org/en-US/docs/Web/API/AudioSession
- https://developer.mozilla.org/en-US/docs/Web/CSS/env
- https://www.rfc-editor.org/rfc/rfc8291 , https://www.rfc-editor.org/rfc/rfc8292
- https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video , https://developer.chrome.com/docs/workbox/modules/workbox-precaching
- https://vite-pwa-org.netlify.app/workbox/generate-sw , /guide/inject-manifest , /assets-generator/
- npm registry (vite-plugin-pwa 2.0.0, workbox-build 7.4.1 schema default 2097152, @mediapipe/tasks-vision 1.1.1 tarball, @zxing/*, zxing-wasm, barcode-detector, html5-qrcode, qr-scanner, @block65/webcrypto-web-push 2.0.0 tarball and README, @pushforge/builder 2.0.5 tarball and source, web-push-browser, webpush-webcrypto, web-push, howler 2.2.4, nosleep.js, ios-haptics); GitHub API for repo activity (block65, draphy/pushforge, zxing-js, Sec-ant, mebjas, richtr/NoSleep.js, google-ai-edge/mediapipe releases)
- https://github.com/goldfire/howler.js/blob/master/README.md

MediaPipe
- https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker and /web_js
- https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_{lite,full,heavy}/float16/1/*.task (HEAD, sizes) and the BlazePose GHUM 3D model card PDF https://storage.googleapis.com/mediapipe-assets/Model%20Card%20BlazePose%20GHUM%203D.pdf
- https://blog.tensorflow.org/2021/05/high-fidelity-pose-tracking-with-mediapipe-blazepose-and-tfjs.html
- https://github.com/google-ai-edge/mediapipe/issues/6142 , /4499 , /6223 , /5273 , /5970

Barcodes
- https://github.com/zxing-js/browser , https://github.com/Sec-ant/zxing-wasm , barcode-detector README (npm tarball)

Haptics
- https://unpkg.com/ios-haptics@3.1.1/README.md

Cloudflare and web push implementation
- https://developers.cloudflare.com/workers/platform/limits/ , /workers/platform/pricing/ , /kv/platform/limits/ , /kv/api/write-key-value-pairs/ , /d1/platform/limits/ , /d1/platform/pricing/ , /pages/platform/limits/ , /workers/configuration/cron-triggers/ , /workers/runtime-apis/web-crypto/ , /workers/static-assets/migration-guides/migrate-from-pages/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/ , /cloudflare-one/account-limits/ , /cloudflare-one/access-controls/applications/http-apps/ , https://www.cloudflare.com/plans/zero-trust-services/
- https://github.com/elvisbrevi/personal-teams-assistant/pull/70
- https://github.com/dynamisinc/pulse/issues/606
- https://github.com/KurzonDax/road-ready-tn/issues/3 (secondary, flagged unverified)
- https://github.com/siteboon/claudecodeui/issues/1550
- https://github.com/web-push-libs/web-push/issues/718
- https://github.com/block65/webcrypto-web-push
- https://www.netguru.com/blog/how-to-share-session-cookie-or-state-between-pwa-in-standalone-mode-and-safari-on-ios
- https://modernwebweekly.substack.com/p/open-files-with-a-pwa
