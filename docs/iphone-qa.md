# iPhone QA checklist

Run this on a real iPhone (iOS 16.4 or later; iOS 18.4+ recommended) after each deploy. Automated tests cover the same flows in WebKit with the iPhone 15 profile, but these items need real hardware. Tick each box and note the iOS version.

iOS version: ______  Device: ______  App version (Settings → About): ______  Date: ______

## 1. Install
- [ ] Open the app URL in Safari. The "Add to Home Screen" guide appears.
- [ ] Share → Add to Home Screen. The icon is the Shadow System emblem on black (no white corners).
- [ ] Open from the Home Screen. No Safari bars; the status bar is dark and content clears the notch and the home indicator.
- [ ] iOS 26+: "Open as Web App" is on in the Add to Home Screen sheet.
- [ ] First paint shows "SHADOW SYSTEM [ SYSTEM BOOTING ]" on black, never a white flash.

## 2. Awakening and Status
- [ ] Complete the Awakening. The typing effect, sounds and class reveal play smoothly.
- [ ] The Status Window shows name, class, rank E, level and XP bar.
- [ ] The readiness check-in appears once per day.

## 3. Offline workout
- [ ] Turn on Airplane Mode. Close the app fully (swipe up) and reopen it. It loads.
- [ ] Start today's workout, log 3 sets, and use the rest timer. The screen stays awake during the session (iOS 18.4+).
- [ ] Exercise animations you viewed before going offline still show; unseen ones show the placeholder icon.
- [ ] Finish. XP, loot and the summary appear. Turn Airplane Mode off; nothing is lost.

## 4. Audio
- [ ] Sounds play after the first tap (not before).
- [ ] With the silent switch on: sounds are muted unless Settings → "Play with the silent switch on" is enabled.
- [ ] Lock the phone for 1 minute and come back. Sounds still play (AudioContext recovers).

## 5. Push reminders (needs the Worker deployed, docs/needs-owner.md §1)
- [ ] Settings → Reminders → Turn reminders on. The iOS permission prompt appears; allow.
- [ ] Set the Workout reminder 5 minutes ahead and lock the phone. A "SYSTEM" notification arrives within 15 minutes.
- [ ] Tapping it opens the Train screen.
- [ ] Log water to target, then set a water reminder a few minutes ahead. No water notification arrives.
- [ ] Next day: reopen the app. Settings shows reminders as On, with no "repair" banner.

## 6. Camera
- [ ] Form Check: Start camera. iOS asks for camera permission (it asks again on each launch; that is an iOS limitation).
- [ ] The skeleton follows your body; FPS is shown. Do 5 squats: the rep counter matches and cues make sense.
- [ ] Record one clip per lift (squat, push-up, deadlift, lunge, overhead press, curl) and note any miscounted reps.
- [ ] Diet → Scan: the rear camera opens and a real product barcode (EAN-13) is found. Manual entry works too.

## 7. Data
- [ ] Settings → Back up. The share sheet opens; "Save to Files" saves `shadow-system-backup-YYYY-MM-DD.json`.
- [ ] Settings → Restore from that file. The counts look right; after restoring, history is intact.
- [ ] Import a real Hevy or Strong CSV from Files. Review the matches; imported workouts appear in Progress.
- [ ] Progress report → Share to Notes or an AI app. The whole Markdown arrives.
- [ ] Set an app PIN, close the app fully, reopen it: the PIN is asked once.

## 8. Storage persistence (one week)
- [ ] Use the app daily for 7 days without opening Safari's copy. All data is still there on day 8.
- [ ] On day 7 or later, the System reminds you to back up.

## 9. Layout and comfort
- [ ] Every screen scrolls without horizontal overflow; the bottom nav never covers buttons.
- [ ] Toasts never block the Finish or Log buttons.
- [ ] Settings → Reduce motion stops glitch and burst animations.
- [ ] Text is readable in sunlight at full brightness; tap targets are easy to hit with sweaty fingers.

Report any failure as a GitHub issue with the iOS version, a screenshot and the steps.
