# R3 — Competitor apps (Fitbod, Hevy, Strong, Boostcamp, Liftosaur, MyFitnessPal)

Researched 2026-10-23. Primary sources were opened and read (help-center articles via the Zendesk JSON API, vendor feature pages, GitHub code and fixtures, Apple App Store review feeds). Where a source is third-party or unverified, it is marked **(3rd-party)** or **(unverified)**. Reddit could not be fetched (blocked: HTTP gate page), so the "complaints" evidence comes from Apple App Store reviews, vendor/aggregator write-ups and open-source issue text, not from r/fitness, r/weightroom, r/Hevy, r/fitbod or r/loseit threads. That gap is stated again at the end.

Contents: 1 Fitbod, 2 Hevy, 3 Strong, 4 Import file formats (critical), 5 Boostcamp, 6 Liftosaur, 7 MyFitnessPal, 8 Feature comparison, 9 Complaints and how we avoid them, 10 Workout Player UX patterns, then Findings / What we take / What we do better / Sources.

---

## 1. Fitbod

### 1.1 Muscle recovery 0-100% (documented behaviour)

Source: help.fitbod.me "Muscle Recovery" (updated 2026-10-13), "How does Fitbod know my muscles are still recovering?", "How Fitbod Creates Your Workout", blog posts. No formula is published; only these facts:

- Every muscle group carries a recovery percentage, **0% (fully fatigued) to 100% (fully recovered)**, shown as a **heat map on an avatar** (Body tab > Recovery tab, rotate front/back, tap a muscle for its workout and recovery history).
- Input to the estimate: **sets, reps and weight** of every logged exercise ("looks at the sets, reps, and weight of exercises performed to estimate how much each muscle group was worked"). Intensity matters: "A demanding session leaves a muscle group fatigued longer than a light one."
- After a workout the figure "climbs back toward 100% over the following days" (shape of the curve not published; the wording implies monotonic recovery).
- **Full-recovery time quoted three ways by Fitbod itself:** "fully recovered after **six days**" (Muscle Recovery help article), "up to **7 days**" (How Fitbod Creates Your Workout, recovery-percentage article, blogs), and "**48-72 hours**" as the gap before hitting the same muscle again in the algorithm blog. Practical reading: 7 days is the outer bound of the model, 48-72 h is the soft rule for selection.
- Optional modifiers: body stats (age, weight, gender) and Apple Health / Health Connect / Fitbit / Strava imports. **Cardio** (also imported runs, swims, hikes, rows) counts; "each type of exercise has its own recovery profile based on which muscles are used"; swimming works all muscle groups; "the longer or more intense the session, the more it affects recovery".
- **Selection use:** fresher muscles are prioritised. Fitbod "won't normally recommend exercises for muscles that are fully fatigued (0% recovered)" with exceptions (all muscles near 0%, or a PPL "push day" still includes chest). Fatigued muscles that must be trained get **lower-intensity or alternative movements**. "You don't have to wait for 100% recovery."
- **Recovery applies to main muscle groups only; accessory muscle groups are limited to one or two exercises per workout regardless of recovery.**
- **Manual override:** user can edit any muscle's percentage (iOS: "[#] Fresh Muscle Groups > Edit"; Android: Gym Profile > Muscle Recovery Percentage). Fitbod frames the model as "an estimate, not a measurement" and says repeated disagreement tells you your own recovery rate.
- Fitbod only knows about activity logged in-app unless a health platform is connected.

### 1.2 How it decides exercises, sets, reps, weight

- Five inputs from "My Plan": **goal** (Build Muscle, Get Lean, Get Stronger, Reduce Bodyweight, Improve Fitness, Practice Powerlifting, Practice Olympic Weightlifting), **experience level**, **equipment**, **training split** (Full Body, Upper/Lower, PPL), **preferences** (duration, warm-ups/cooldowns, cardio, exercise variability, supersets/circuits).
- Every time a workout is built, **all 800+ (help centre now says 1,600+ HD exercises)** are scored against recovery, goal and experience fit, feedback history, split structure and equipment, then ranked.
- Volume: **Weekly Set Targets** from a "smart volume model" using goal, frequency, session length, experience, sex/body composition; blog quotes **10-20 working sets per muscle group per week**.
- Rep ranges (blog): strength mostly **1-6 reps at ~85-100% 1RM, 3-5 min rest**; hypertrophy mostly **6-12 reps** with some 1-5 and 15-25; lean/general: higher reps, shorter rest.
- Load: **Estimated Strength** (a projected 1RM per exercise from logged sets, Epley-type equations), decays if the exercise is not logged for a while. New exercises start conservative from aggregate-user data. After a break weights are reduced on purpose. **mStrength** deliberately alternates heavier/lighter, lower/higher-rep sessions (users read this as "inconsistent", see complaints). **Max Effort Days**: periodic ramp-up sets then **two AMRAP sets** at full working weight marked "+ reps" to recalibrate; cannot be triggered manually.
- Duration benchmarks: **4 exercises = 27-51 min, 5 = 35-60, 6 = 39-63**.
- Equipment profiles: multiple **gym locations**, each with an Available Equipment list; for dumbbells/kettlebells/barbells you can specify the **weight increments you own**. Bodyweight-only mode.

### 1.3 RIR

- Prompted after the last set of an exercise (for supersets/circuits only after the whole group). Scale **4+, 3, 2, 1, 0** with plain-language labels: 4+ very easy/warm-up, 3 moderate (endurance/volume), 2 challenging but controlled (hypertrophy), 1 near failure (strength), 0 failure. "Use your highest-effort set or the last set."
- Effect: "If you consistently report high RiR, the app may increase weight or reps." Not applicable to distance or some timed exercises. RiR in a superset is treated as if the exercise was done fresh (a known limitation). Editable after logging.
- Blog guidance: 1-2 RiR is the hypertrophy sweet spot; about 2-3 RiR on most strength sets.

### 1.4 Exercise preferences, swaps

- Three levels: **Recommend More Often** (documented effect **+40-60% chance** to appear), **Recommend Less Often** (**-20-40%**), **Don't Recommend Again** (exclude; immediately replaces it in an unstarted workout). Set from the "..." menu in a workout or My Plan > Preferences > Manage Exercises (filter to rated; icons: down arrow = less, red = excluded). No bulk reset. Preferences are *probabilistic nudges*, not hard rules, except exclude.
- Passive learning: skipping, replacing, deleting or manually adding an exercise is feedback. Variability setting default "Balanced".
- Swap / Replace: swipe left > Replace gives alternatives for the same muscle group; "Swap" menu top-right of the Workout tab: Pick Muscle Groups (Recovered muscles / Push / Pull / Upper / Lower / Full body), or Create Workout From Scratch. Focus Exercises and Training Session Mods exist (not read in depth).

---

## 2. Hevy

Sources: help.hevyapp.com articles (rest timer, set types, previous values, workout settings, supersets, import/export), hevyapp.com feature pages.

- **Set logging UX:** each row has set number, a **PREVIOUS** column (last performance of that exercise, either from any workout or only the same routine: user setting), weight, reps, and a **check mark**; "the countdown starts automatically when you mark a set as complete". Previous values are display-only; they do not prefill (a recurring request).
- **Set types:** tap the set number to choose **W warm-up, D dropset, F failure** (normal by default). Drop sets: the auto rest timer does **not** start before a drop set. Failure: log the last *completed* rep. Warm-up sets can be excluded from stats/volume/PRs (setting). Mixed types in one exercise.
- **Rest timer:** per exercise (tap "Rest Timer" under the name), default rest timer for newly added exercises (does not retro-apply), **+15 / -15 s** buttons on the running timer, 5 sounds, volume (high/normal/low/off), separate volumes for set-check sound and PR sound, live Activity/lock-screen timer. Review complaint: cannot change rest for the next set only without tapping +15 repeatedly.
- **Supersets:** "..." > Add To Superset; each superset gets a colour; can be 3+ (circuit); **Smart Superset Scrolling** auto-scrolls to the next exercise in the superset after a set is completed and cycles back.
- **Warm-up calculator (Pro):** percentage-based warm-up sets starting at 40% (editable) with plate/dumbbell rounding. **Plate calculator:** plates to load for a target weight on barbell/EZ/short bar (barbells only).
- Other settings: Keep Awake During Workout, RPE tracking toggle (per-set), inline stopwatch for duration exercises, Live PR notification, first day of week.
- Export: Profile > Settings > Export & Import Data > Export Data > Export Workouts / Export Measurements (CSV, see section 4). **Import accepts only Strong CSV**, "direct export from Strong, in English and in Kgs", unedited; supersets are NOT imported; unmatched exercises become custom exercises; only one import can be active (must revert to import another).

## 3. Strong

Sources: App Store listing (id464254577, 4.86 from 108K ratings), third-party parsers, Boostcamp comparison page (competitor claim). help.strongapp.io did not resolve and strong.app support was not reachable, so Strong behaviour below is from the **App Store description** (vendor text) and open-source parsers.

- Features per App Store text: automatic **rest timer**, **plate calculator** (review: limited to known bar weights, no 25 lb Smith bar), **warm-up calculator**, **supersets / grouped exercises**, set tags (**warm-up, failure, drop**), routines, assisted-bodyweight and duration exercise types, PRs / est. 1RM / volume graphs, Apple Watch app, cloud sync, body measurements, CSV export, kg/lb conversion. Free: unlimited workouts, **3 custom routines**; PRO $4.99/mo or $29.99/yr.
- Export (3rd-party): Profile > Settings > Export Strong Data. Set rows also carry **rest-timer rows and exercise-note rows** (Android export), see section 4.
- Per-exercise sets use a **Set Order** column where warm-up/drop/failure sets are encoded as letters (see section 4).

---

## 4. Import file formats (CRITICAL for B3-13)

There is **no vendor documentation of the column list**. The facts below were cross-checked against real-export fixtures and importers in public GitHub repos (listed in Sources) and against Hevy's own help centre. Implement the importers by **reading columns by header name**, never by position.

### 4.1 Strong

Two real variants exist (iOS vs Android). Importer must sniff the delimiter from the header line (outside quotes), strip a UTF-8 BOM, accept CRLF/LF.

**Variant A, iOS (comma, header unquoted):**
```
Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
2020-09-15 11:22:57,"4by5 Chest And Triceps",1h 43m,"Bench Press (Barbell)",1,45.0,5,0,0,"","",
2020-09-15 11:22:57,"4by5 Chest And Triceps",1h 43m,"Bench Press (Barbell)",2,45.0,5,0,0,,,
```
- Delimiter `,`; text fields quoted with `"` (workout name, exercise name, notes), numbers unquoted; `RPE` may be empty (trailing empty field). Older versions have fewer columns, e.g. `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,RPE` (no Notes columns) or `Date,Workout Name,Exercise Name,Set Order,lbs,Reps,mi.,Seconds,Notes,Workout Notes` (2018, semicolon, weight column literally named `lbs`, distance `mi.`; **unit encoded in the header**).
- `Date`: `YYYY-MM-DD HH:mm:ss`, **local wall-clock time, no timezone** (the importer must ask for or assume a timezone).
- `Duration`: human text **per workout**, repeated on every row: `1h 43m`, `35m`, `38min`, `20m 15s`, `1h`. Parse with a regex over h/m/s units (also accept bare seconds and `h:mm:ss`).
- `Weight`: **no unit in the header** in the current iOS export; it is the unit set in the app (kg or lb). The importer must ask the user (default from profile units). Decimals use `.`.
- `Set Order`: `1..N` for working sets (resets per exercise); letters for typed sets reported by parsers: **`W` warm-up, `D` drop, `F` failure** (3rd-party parsers: Ryot, Haltera, ironterm; set-type letters were not independently confirmed in an iOS fixture, none of the iOS samples contain typed sets). Non-set rows: **`Rest Timer`** (value in `Seconds`) and **`Note`** (text in `Notes`) must be skipped/handled (seen in the Android export).
- `Distance`: metres in the Android header (`Distance (meters)`); unit unspecified in the iOS header. `Seconds`: seconds for timed sets (or rest seconds on `Rest Timer` rows). Weight `0` is used for bodyweight sets.
- `RPE`: decimal, empty if not tracked. A `Weight Unit` / `Distance Unit` column appears in some builds (3rd-party parser, unverified).
- Locale: Hevy states Strong must be set to **English** before export; other languages translate headers (a German parser exists with `Reihenfolge festlegen` for Set Order etc.).

**Variant B, Android (semicolon, everything quoted):**
```
"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"
"201";"2026-02-17 19:25:59";"Full body B";"4419";"Romanian Deadlift (Barbell)";"W";"20.0";"8";"";"";"";"";"Friday full body workout"
```
- Delimiter `;`, **every field quoted**, `Workout #` session id column, `Duration (sec)` integer seconds, `Weight (kg)` (a `Weight (lb)` sibling is plausible for lb users, unverified). Same `Date` format. Same `W`/numeric/`Rest Timer`/`Note` Set Order values (confirmed in a 2,053-row real backup, 52 sessions, in Bybon's repo). Older 2019 Android files use the same quoted semicolon layout.
- A third variant seen in the wild: `Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Workout Duration,Notes,Workout Notes` (comma, `Workout Duration` instead of `Duration`).

Workout identity: Date + Workout Name (iOS) or `Workout #` (Android). One row per set; workout-level fields are repeated on every row.

### 4.2 Hevy

**Header (verified, identical in four real exports):**
```
"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Monday ? You mean international CHEST DAY !","30 Jun 2025, 19:56","30 Jun 2025, 20:58","","Incline Bench Press (Dumbbell)",,"",0,"normal",48,13,,,
```
- Delimiter `,`; **header names and text fields double-quoted**, numeric fields unquoted, empty fields are bare (`,,`), embedded quotes doubled (`""easy""`). Emoji in titles may come through as `?`.
- `start_time` / `end_time`: **`D Mon YYYY, HH:mm`** (24 h, English month abbreviation, no seconds, day not zero-padded in some rows and zero-padded in others: `02 Jul 2025`). **Local time, no timezone.** A US-locale variant `"Mar 29, 2026, 10:04 AM"` appears in one 3rd-party fixture (unverified); importer should try both formats.
- `set_index` is **0-based** per exercise. `set_type`: **`normal`, `warmup`, `failure`, `dropset`** (Hevy API docs list the same four). Numeric aliases 1-4 seen in synthetic fixtures only.
- `superset_id`: empty for straight sets; an integer shared by exercises in the same superset (Hevy's own docs: Strong import loses supersets, so our importer must keep them from Hevy).
- Weight column is **named after the account's unit**: `weight_kg` (default) or `weight_lbs` (seen in two 3rd-party exports). Distance likewise `distance_km` (or `distance_miles`). One 3rd-party fixture uses `duration_s`. Some converters assume both `weight_kg` and `weight_lbs` columns are present (unverified). Importer: accept any of `weight_kg|weight_lbs`, `distance_km|distance_miles`, `duration_seconds|duration_s`.
- Timed sets (plank) have empty `reps` and `duration_seconds`; cardio sets use `distance_km` + `duration_seconds`; bodyweight sets have empty weight. `rpe` e.g. `8`, `8.5`; empty when RPE tracking is off.
- Exercise names follow Hevy's library: `Bench Press (Barbell)`, `Lat Pulldown (Machine)`. Strong uses the same `Name (Equipment)` convention, so one equipment-suffix parser serves both.
- Hevy also exports measurements (separate CSV); the format was not found.

### 4.3 Import design notes
- Group rows: Strong = `(Date, Workout Name)` or `Workout #`; Hevy = `(title, start_time)`.
- Duplicate protection: stable id = hash(raw date text + title); warn on re-import.
- Review screen for unmatched exercise names (the `(Barbell)` / `(Dumbbell)` / `(Machine)` / `(Cable)` suffix gives equipment for free).
- Dates are naive local times: store as local ISO plus the import timezone the user confirms.

### 4.4 Sample export files
Saved in `C:\shadow-systen-project\tests\fixtures\`:

| File | What it is | Provenance |
| --- | --- | --- |
| `strong-sample.csv` | Strong iOS variant, comma, 30 real set rows, 2 workouts, header unquoted, `1h 43m` durations | Real export committed in `radupana/openweight` (`strong-real.csv`) and `AlexandrosKyriakakis/StrongAppAnalytics` (same format) |
| `strong-android-sample.csv` | Strong Android variant, semicolon, all quoted, `Workout #`, `Duration (sec)`, `Weight (kg)`; contains `W`, numbered, `Rest Timer`, `Note` rows | First 13 rows of a real 2,053-row backup in `LordRaydenMK/Bybon` (`strong-backup-sample.csv`) |
| `hevy-sample.csv` | Hevy export, 22 real set rows, 3 workouts, all `normal` sets, `weight_kg`, `D Mon YYYY, HH:mm` | Real export in `mouadja02/Hevy-Coach` (`workout_data.csv`), also the `radupana/openweight` `hevy-real.csv` fixture |
| `hevy-settypes-sample.csv` | Same header; shows `warmup`, `dropset`, `failure`, escaped quotes, timed and cardio rows | `Dotims/GripLog` fixture. **Treated as hand-written (3rd-party)**, header and quoting match the real exports, row content is synthetic |

Source URLs are in the Sources section. Nothing here is constructed by us; the only caveat is the last file's synthetic content. No real Strong export containing `D`/`F` set types or `lb` units was found, so those are covered by the cross-checked parser behaviour above, and the importer test suite should add synthetic rows for them.

---

## 5. Boostcamp

Sources: boostcamp.app/features, /vs/strong (vendor marketing; numbers differ between pages).

- **Program library:** "14,000+ programs" (other pages say 11,000+), **130+ coach-designed** (named coaches, 5/3/1, nSuns, Reddit PPL, GZCL), the rest community-published; filter by **experience level, goal, days per week**. Library is free. Pro (from $4.99/mo with 7-day trial; $59.99/yr) adds 20+ exclusive coach programs.
- **Strength Score:** single **0-100** number from squat, deadlift, horizontal press, vertical press and pull PRs (page says 5 movements in one place, "13 lifts in five categories" in another), **bodyweight-adjusted via the DOTS formula and age-adjusted**. Base score free; Pro adds Level, Max, Balance views. The exact 0-100 mapping is not published.
- **Muscle heatmap ("Muscle Tracker", Pro):** body heatmap / radar / table of **weekly sets per muscle**, with 7-day, 30-day, 90-day, yearly views and comparison with the previous period.
- Logging: RPE 6-10 with RIR hints, per-exercise auto rest timer (lock-screen countdown on iPhone), plate calculator (10 free uses), **Swap Exercise keeps the prescription**, PR flags live, offline once a program is loaded. Auto Progression is Pro.

## 6. Liftosaur

Sources: liftosaur.com/doc/liftoscript, the program-editor blog post, github.com/astashov/liftosaur README (AGPL-3.0, PWA, TypeScript).

- Programs are text, one exercise per line, `/`-separated sections in any order: `Bench Press / 3x8-12 @8 / 90s / progress: lp(5lb, 3)`. Sets are `NxR` or a rep range; weight is omitted (RPE tables), `80%` of 1RM, or `60kg`; `@8` RPE; `90s` rest.
- **Built-in progressions:**
  - `lp(weight increase, increase attempts, current increase attempt, weight decrease, decrease attempts, current decrease attempt)` (up to 6 args, trailing optional): e.g. `lp(5lb)`, `lp(5lb, 2, 1, 10lb, 3)`, `lp(5%)`.
  - `dp(weight increase, min reps, max reps)`: reps climb inside the range, then weight rises and reps reset. e.g. `dp(5lb, 8, 12)`.
  - `sum(reps threshold, weights increase)`: weight rises when total reps across sets exceed the threshold. e.g. `sum(30, 5lb)`.
- **Custom scripts:** `progress: custom(state vars) {~ ... ~}` runs after a workout (can change weights, reps, sets; read `completedReps`, `reps`, `state.x`); `update: custom() {~ ~}` runs during a workout (cannot change state vars). A `+` after a state var name prompts the user after the last set. Units are number types (`5lb`, `10kg`, `5%`).
- Simple no-code editor for basic progression and deload; full language for advanced. Our class progression rules (R4/B3-2) can be modelled as three parameterised functions (lp / dp / sum) plus a plateau counter; we do not need a scripting language.

## 7. MyFitnessPal

Sources: support.myfitnesspal.com articles (opened via the Zendesk API).

- **Logging flow (iOS):** Today page > "Log" next to a meal > search bar with **Recently Logged / Frequent** tabs; "Quick Log" = tap the plus next to a searched food to log instantly; **Barcode Scan** button sits under the search bar (also barcode icon right of the search bar in the newer dashboard). After scan choose meal and serving size, tap Log. **Barcode scanning has been Premium-only since Oct 1, 2022.**
- **Recent / Frequent lists** are built automatically from what you log (frequency threshold not published); swipe to Hide (iOS), long-press delete (Android).
- **Quick Add:** enter calories directly with no search; macros optional but **macro entry in Quick Add is Premium**.
- **Saved meals ("My Meals"):** group of foods built once (name, photo, items) and logged in one action; also Recipes (with importer) and My Foods.
- **Copy:** iOS Edit > tick items (across meals) > Copy > pick date; web "Quick Tools" under each meal to copy to/from recent dates. A "Smart Copy" tile (copy yesterday with one swipe) was described in a design case study (3rd-party, tested not fully rolled out).
- Free tier: food and exercise logging, create own foods/meals/recipes, macro view, custom goals by percent.

---

## 8. Feature comparison

| Capability | Fitbod | Hevy | Strong | Boostcamp | Liftosaur | MyFitnessPal | **Shadow System (target)** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auto-generated workouts | Yes (core) | No (routines + Pro "Trainer") | No | Personalized Programs (Pro) | No (scripted) | n/a | **Yes, class-based, from recovery** |
| Per-muscle recovery % | Yes 0-100, heat map, override | No | No | Weekly-set heatmap only | Muscle map | n/a | **Yes, 0-100, decay model, override, readiness** |
| Exercise prefs (more/less/never) | Yes, probabilistic | Favourites | Favourites | Swap | Manual | n/a | **Yes (B2 exercisePrefs)** |
| Equipment profiles | Multiple gyms, plate increments | No | No | Per-exercise swap | Plate settings | n/a | **Yes, multiple profiles + "equipment taken" swap** |
| RIR / RPE | RIR prompt after exercise | RPE per set (toggle) | RPE column | RPE 6-10 | `@8` RPE | n/a | **Per-set optional RIR chip; defaults from class** |
| Progression | Hidden (mStrength) | Manual | Manual | Auto Progression (Pro) | Scriptable lp/dp/sum | n/a | **Visible rules (lp/dp/sum style) + plateau/deload** |
| Previous values inline | Prefilled | PREVIOUS column | PREVIOUS column | Yes | Yes | n/a | **Prefilled (not just shown)** |
| Rest timer | Yes | Yes, +/-15 s, per exercise | Yes, auto | Yes, auto, lock screen | Yes | n/a | **Auto-start on tick, full-screen option** |
| Set types W/D/F | Warm-up | W, D, F | W, D, F | n/a | Yes | n/a | **W/working/D/F + superset group** |
| Supersets | Yes | Yes + smart scroll | Yes | Yes | Yes | n/a | **Yes + smart advance** |
| Plate calculator | No | Barbell, rounding | Yes (limited bars) | 10 free uses | Yes | n/a | **Free, custom bar/plates** |
| Strength score / standards | Estimated Strength | No | No | 0-100 (DOTS) | No | n/a | **Power Level (e1RM vs standards by sex/BW)** |
| Volume heatmap | Recovery map | Muscle distribution (Pro) | No | Pro heatmap | Muscle map | n/a | **Free weekly volume heatmap + recovery map** |
| Program library | No | Routine sharing | No | 14,000+ | Built-ins | n/a | **Class/dungeon programs (generated)** |
| Nutrition | No | No | No | No | No | Core | **Yes, with barcode + saved meals + recents** |
| CSV import/export | No import | Export; imports Strong only | Export | n/a | Export | Premium export | **Imports Hevy + Strong, exports everything** |
| Gamification | Milestones | Social, PR | PR | Weekly report | No | Streak | **Full RPG** |
| Offline | Partial | Yes | Yes | After program load | PWA | Partial | **Full offline PWA** |
| Price pressure | ~$180/yr, trials charged | Pro | PRO $29.99/yr, 3 routine cap | Pro $59.99/yr | Free (AGPL) | Premium for barcode | **Private, free** |

---

## 9. Top complaints and how we avoid them

Evidence column: AS = Apple App Store review text (opened via the iTunes RSS feed, 2026), V = vendor/aggregator write-up, F = vendor help/feature page.

| App | Complaint | Evidence | How we avoid it |
| --- | --- | --- | --- |
| Fitbod | Same exercises "month after month year after year"; "generic" suggestions | AS, V (about 10% of feedback per an AI analysis, 3rd-party) | Recommender scores **recent variety** (B3-4), preference marks, variability setting, and smart swap shows alternatives in-place |
| Fitbod | Weights too light/heavy, lighter day "inconsistent" (mStrength), little explanation | V, F (Fitbod FAQ answers it) | Show **why** (target line: "back-off week", "deload", "class rule: 3x8 +2.5 kg") and make target editable per set; never hide the rule |
| Fitbod | Subscription trap: 7-day trial then **$179.99** charged, hard cancel, price change | AS | No subscription; private app. If any paid feature ever exists, show price before trial |
| Fitbod | Glitchy: timers/sets closed, data lost, Apple Watch gaps | AS | Write each set to IndexedDB **on tick**, resume active workout after reload, periodic backup nag (B2) |
| Fitbod | Confusing interface, update removed handy features | AS, V | Workout Player kept to one screen; no feature removed without migration |
| Hevy | Apple Watch / Health sync breaks after iOS updates | AS | No watch dependency; PWA only, optional Health later |
| Hevy | Rest timer cannot adjust for the next rest only; timer icon scrolls list to top | AS | Rest chips (60/90/120/180 + custom) applied to the *next* rest; timer never moves scroll position |
| Hevy | Pro paywall on warm-up calculator, analytics; Strong-only import | V, F | All free; import Hevy **and** Strong |
| Hevy | No training guidance / progression ("falls short on training guidance") | AS | Progression engine suggests next load |
| Strong | 3 custom routines on free tier, "can't do anything unless u pay" | AS | No caps |
| Strong | Workout history disappeared, sync/watch broken | AS | Local-first + JSON backup/restore and CSV export per store |
| Strong | Limited exercise library, cannot add custom machine details/photos, notes cannot be found again, no copy/paste summary | AS | Merged library + custom exercises with media; notes searchable; share summary as text |
| Strong | Plate calculator limited to known bars | AS | Configurable bar weights/plates |
| Strong | App stagnates for 5+ years, features requests ignored | AS | Own the roadmap; private app |
| Boostcamp | Lost logged sets when backgrounding the app mid-workout; update wiped data; custom program editor does not save, hard to use | AS | Autosave per set; plan editor with explicit save-diff; backups |
| Boostcamp | Deleted exercise mid-workout only undoable for 3 seconds | AS | Undo snackbar of 10 s plus a "removed exercises" tray |
| Boostcamp | Can't delete account | AS | Data on device; "delete all data" in Settings |
| MFP | Barcode scanner behind **Premium** since 2022 | F, AS, news | Free barcode via Open Food Facts (R4/R6) |
| MFP | Ads, redesign buried the food diary under many taps, log entries disappearing | AS, V | Food logging is a top-level Diet tab; recents first |
| MFP | Crowd-sourced database with many wrong duplicates | V | Bundled USDA/IFCT first, OFF second, show source and "verified" badge |
| MFP | Quick Add macros paywalled | F | Quick Add with calories + optional macros, free |
| All | Reddit sentiment (r/Hevy, r/fitbod, r/weightroom, r/loseit) | **Not read**: Reddit unreachable | Owner task: skim r/Hevy "wish list" threads before building Player polish |

---

## 10. Workout Player UX patterns to copy (goal: log a set in at most 2 taps when values match the target)

Baseline math: Hevy/Strong = open row (0) -> edit weight (type) -> edit reps (type) -> tick (1): typed values = 3-5 interactions. Fitbod prefills but asks RiR after.

1. **Pre-filled rows.** Every set row opens with weight and reps already set to the target (class rule on top of last session's result), not just a "Previous" hint. Row layout: `set#/type | prev | weight | reps | tick`. **Tap 1: tick** (logs target as actual). **Tap 2 (optional): RIR chip** from a 5-chip strip (4+/3/2/1/0) that appears inline after the tick, auto-dismisses after 4 s with the RIR defaulting to the class target. If values differ, steppers (+/- 2.5 kg / 1 rep, long-press repeats) are on the row; the stepper tap count is added but a match stays at 1-2 taps.
2. **Previous column stays visible** (Hevy PREVIOUS): "last: 80 x 8 @2", tap to copy it into the row (alternative to the target).
3. **Auto-start rest on tick** (Hevy/Strong/Boostcamp); per-exercise duration from class table; **-15/+15 s** on the running timer; full-screen option; sound and haptic at end; no timer before a drop set and between superset members (Hevy); timer survives backgrounding (end timestamp, not a counter) and lock screen notification where iOS allows.
4. **Set type switch by tapping the set number** (W / working / D / F) as Hevy and Strong: warm-up sets excluded from volume/PR by default but counted for recovery at low weight. Drop sets inherit the previous weight x 0.8 as the prefill.
5. **Smart superset scrolling + colour per superset group**; RIR prompt after the whole group (Fitbod) but per-member editable.
6. **Warm-up suggestion** (Hevy 40% start with rounding) generated as editable rows ahead of the first working set; **plate calculator** one tap on the weight field, with the user's plate inventory and bar.
7. **Live PR detection with a fanfare + sound toggle** (Hevy has separate PR volume).
8. **Smart swap** one tap on the exercise header: same-swap-group alternatives filtered by profile equipment ("equipment taken") and keep the sets/reps prescription (Boostcamp), mark the choice as a preference signal (Fitbod).
9. **Keep awake** (wake lock) during session, explicit "resume workout" banner after reload; every tick persisted immediately.
10. **Undo**: tick can be un-ticked; deleted exercise/set undo lasts long enough.
11. **Sound/haptic settings** separated: set-check, timer end, PR (Hevy).
12. **Readiness and recovery chips** at the top of the Player (not another screen) showing the muscle being worked and its current recovery %.

---

## Findings

- **Fitbod's recovery model is only partly specified**: 0-100% per muscle, driven by sets x reps x weight (plus RiR indirectly through load), full recovery bounded at 6-7 days, soft rule 48-72 h between sessions of the same muscle, cardio and imported activity affect it, manual override exists, and accessory muscles are capped at 1-2 exercises per workout regardless of recovery. No curve, per-muscle half-life or intensity multiplier is published, so our decay constants must come from R5 science, not from Fitbod.
- Fitbod preferences are **probabilistic** (+40-60% more, -20-40% less, exclude is hard). RiR scale is 0 to 4+ with a once-per-exercise prompt; RiR high leads to heavier loads. Equipment profiles are per location and include owned weight increments.
- **Strong CSV has two real layouts** (iOS comma/unquoted header/`Duration` text/`Weight` unitless; Android semicolon/all quoted/`Workout #`/`Duration (sec)`/`Weight (kg)`), with `Rest Timer` and `Note` rows on Android, `W` (and reportedly `D`, `F`) in `Set Order`, local naive datetimes `YYYY-MM-DD HH:mm:ss`. Hevy requires its Strong input to be English and kg.
- **Hevy CSV is one stable layout**: comma, quoted text, 14 columns, `D Mon YYYY, HH:mm` local times, 0-based `set_index`, `set_type` in {normal, warmup, failure, dropset}, weight column named after the account unit (`weight_kg` or `weight_lbs`).
- Hevy and Strong set-logging is **3-5 interactions per set when values differ** and about 1-2 when you tick untouched prefilled values; Hevy's PREVIOUS column is display-only so users still type. This is the opening for a <=2-tap Player.
- Hevy gates warm-up calculator behind Pro, Boostcamp heatmap, Strength Score views and Auto Progression behind Pro, MFP gates barcode and macro Quick Add behind Premium, Strong caps free routines at 3. Paywalls and subscription surprises are the single most repeated complaint across all apps; data loss and watch sync break are second.
- Liftosaur proves three parametric progression rules (lp, dp, sum) plus a plateau/deload counter cover almost every popular program; the scripting language is only needed for exotic programs.
- Boostcamp's Strength Score is a bodyweight/age-adjusted (DOTS) 0-100 composite of 5 movement patterns; its heatmap is weekly sets per muscle. Both are marketing-page descriptions without a published mapping.
- MFP's reuse flow is: Recents/Frequent tabs auto-built, Quick Log (one tap on a result), My Meals, copy items to another date. Barcode is Premium.
- Limits of this research: Reddit unreachable, Strong help centre not reachable, Hevy measurement export format not found, no real Strong sample containing `D`/`F` set types or lb values, Fitbod internal formulas unpublished.

## What we take

1. **Recovery engine (B3-3):** 0-100% per muscle, heat map on the body map, manual override, selection prefers fresh muscles, fatigued-but-needed muscles get lower-intensity alternatives, accessory muscles capped at 1-2 exercises/workout, cardio contributes, 7-day outer bound as the default decay horizon (tune with R5).
2. **Preference marks** as probabilistic weights (more x1.5, less x0.7, never = filter) with passive learning from swaps and skips.
3. **RIR scale 0-4+** with the same plain-language labels; prompt after the exercise (or whole superset), editable later.
4. **Equipment profiles** with owned weight increments; "equipment taken" swap by swap group.
5. **Weekly set targets** per muscle (10-20 sets/week band) for the volume heatmap and plan checks.
6. **Max-Effort-style AMRAP** test sets to recalibrate e1RM periodically (optional, never forced).
7. **Hevy/Strong set-logging mechanics:** PREVIOUS column, tick to complete, set-number tap for W/D/F, auto-start rest with +/-15 s, superset colours and smart scrolling, warm-up calculator at 40% start with rounding, barbell plate calculator, wake lock, separate sound volumes.
8. **Importers:** header-name-based parsers with delimiter sniffing, BOM stripping, `Rest Timer`/`Note` skipping, `W/D/F` mapping, duration regex, equipment-suffix parsing, review screen for unmatched names (fixtures in `tests/fixtures`).
9. **Liftosaur:** lp / dp / sum progression functions as data (`{type, increment, attempts, minReps, maxReps, threshold}`) rather than script; state like "attempt counter".
10. **Boostcamp:** DOTS-style bodyweight adjustment for the Power Level, weekly-sets heatmap with 7/30/90 day windows, swap keeps prescription, program filters (level, goal, days/week).
11. **MFP:** Recents + Frequent as the default food-logging tab, one-tap quick log, saved meals, copy items to another date, calories-only quick add.

## What we do better

- **Tap budget:** prefilled target rows plus a one-tap tick and an auto-dismissing RIR chip means a matching set costs 1-2 taps; Hevy/Strong need typing unless you copy previous.
- **Explainable prescription:** Fitbod hides why load changed (users call it random). We always show the rule that produced the target and allow edits that the progression engine respects.
- **Free feature parity:** warm-up calculator, plate calculator, heatmap, strength standards, barcode, quick add macros, unlimited routines, all free; no trial, no subscription.
- **Own your data:** local-first, full JSON backup, CSV export per store, **import both Hevy and Strong** (Hevy itself only imports Strong, and loses supersets).
- **Autosave on every tick** with resume after reload and background; the main fault of Boostcamp/Fitbod/Strong data-loss reviews.
- **Recovery + volume in one place** (Fitbod has recovery but no volume analytics, Boostcamp has volume but no recovery, Hevy has neither as free).
- **Readiness check-in** adjusting recovery (none of them has this) and **form check** (none).
- **Nutrition and training in one app**, with free barcode (Open Food Facts) and bundled databases, avoiding MFP's paywalled scanner and crowd-sourced duplicates.
- **Game layer** that rewards consistency without the shame mechanics, relating to the R2 safety rules.

## Sources

Opened and read (all accessed 2026-10-23):

Fitbod (help.fitbod.me articles read through the public Zendesk help-center JSON API; fitbod.me pages through WebFetch)
- https://help.fitbod.me/hc/en-us/articles/360006269014-Muscle-Recovery
- https://help.fitbod.me/hc/en-us/articles/43492170863895-How-does-Fitbod-know-my-muscles-are-still-recovering
- https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout
- https://help.fitbod.me/hc/en-us/articles/43489869175063-How-does-Fitbod-decide-my-sets-reps-and-weight
- https://help.fitbod.me/hc/en-us/articles/360033133174-Reps-in-Reserve-RiR-Formerly-Exertion-Rating-RPE
- https://help.fitbod.me/hc/en-us/articles/9093233634711-Recommend-More-Less-or-Exclude-Exercises
- https://help.fitbod.me/hc/en-us/articles/16254175592215-Fitbod-s-Algorithm-Q-A
- https://help.fitbod.me/hc/en-us/articles/34336407191191-My-Plan
- https://help.fitbod.me/hc/en-us/articles/360006335593-Editing-Workouts-in-Fitbod
- https://help.fitbod.me/hc/en-us/articles/24739986755223-Weekly-Set-Targets
- https://fitbod.me/blog/fitbod-algorithm
- https://fitbod.me/blog/muscle-recovery/
- https://fitbod.me/blog/tracking-volume-intensity-and-recovery-with-fitbod/

Hevy
- https://help.hevyapp.com/hc/en-us/articles/35385404949143-Rest-Timer-Default-Rest-Timer-How-to-Add-Adjust-Volume-and-Sound
- https://help.hevyapp.com/hc/en-us/articles/34896293707927-Set-Types-in-Hevy-Explained-Drop-Sets-Warm-Up-Sets-and-More
- https://help.hevyapp.com/hc/en-us/articles/36011896355479-How-to-Use-Previous-Workout-Values-to-Improve-Performance-in-Hevy
- https://help.hevyapp.com/hc/en-us/articles/33882110558743-Workout-Settings-Preferences-Timer-Warm-up-calculator-Plate-Calculator-Smart-Superset-Scrolling
- https://help.hevyapp.com/hc/en-us/articles/35650286563095-The-Complete-Guide-to-Supersets-and-Smart-Superset-Scrolling
- https://help.hevyapp.com/hc/en-us/articles/35687878672663-Importing-Strong-Data-into-Hevy
- https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy
- https://help.hevyapp.com/hc/en-us/articles/43708290987415-Exporting-Your-Data-from-Hevy
- https://www.hevyapp.com/features/workout-set-types/
- https://www.hevyapp.com/features/workout-settings/
- https://www.hevyapp.com/features/what-are-supersets/

Strong
- https://apps.apple.com/app/id464254577 (App Store listing and reviews)

Import formats (GitHub; real files and parser code)
- https://github.com/radupana/openweight/blob/dc1d208832dda80caad2c8c5f8acf9087525748d/tools/converters/src/__fixtures__/strong-real.csv
- https://github.com/radupana/openweight/blob/dc1d208832dda80caad2c8c5f8acf9087525748d/tools/converters/src/__fixtures__/hevy-real.csv
- https://github.com/radupana/openweight/blob/dc1d208832dda80caad2c8c5f8acf9087525748d/tools/converters/src/parsers/strong.ts
- https://github.com/radupana/openweight/blob/main/docs/migrate/strong.md
- https://github.com/radupana/openweight/blob/main/docs/migrate/hevy.md
- https://github.com/AlexandrosKyriakakis/StrongAppAnalytics/blob/1e1e371d9d9b4e3adecd0d8a783199f009ef9d4c/Data/strong.csv
- https://github.com/DaKheera47/strong-statistics/blob/60adc118f2eeb16b332a9327df090e3a9ba21759/data_sample/sample_strong_legacy.csv
- https://github.com/harrig12/strong/blob/8174336a59f25fc9a047a272649f61fdcb37a7d0/strong.csv
- https://github.com/Brandon-Valley/strong_app_export_tools/blob/2485a1fd047f575c4259def6d7914e37b9187a0c/old_exports/export_0.csv (2018 variant: `lbs`, `mi.`)
- https://github.com/mtanzim/vis-strong-go/blob/6e68832d43110d8c5b12da6903d81e876d5126f9/server/fixtures/example.csv (2019 Android variant)
- https://github.com/aimarchirico/gymruntohevy/blob/3c6ec9eb9474ea239100680804af6573f4ae36c6/strong.csv
- https://github.com/LordRaydenMK/Bybon/blob/main/app/src/test/resources/strong-backup-sample.csv and https://github.com/LordRaydenMK/Bybon/blob/main/docs/strong-import.md
- https://github.com/IgnisDa/ryot/blob/main/crates/services/importer/strong-app/src/lib.rs (delimiter `;` Android / `,` iOS, `W/F/D`, `Rest Timer`, `Note`)
- https://github.com/Rjected/ironterm/blob/main/web/shared/strong.ts
- https://github.com/Sebas1705/Haltera/blob/main/docs/IMPORT-FORMATS.md (cross-checked header table)
- https://github.com/anes7374/gymtracker/blob/main/app/js/lib/strong-csv.js (delimiter sniffing, German headers)
- https://github.com/mouadja02/Hevy-Coach/blob/8ee0b60fc8d94af897fa128622237656582a0286/workout_data.csv
- https://github.com/Dotims/GripLog/blob/157a57c871e11d8137abf246b04ea8482f55d3f7/packages/core/src/__fixtures__/hevy-export.csv
- https://github.com/inkandswitch/patchwork-experiments/blob/c9bbc88df437c28e5c439fd0aa8f25995c0062ec/strength/workout_data.csv (`weight_lbs`)
- https://github.com/adeebnawshad/LiftLedger/blob/5191455cfb913633866e71bef5728eedfa88ca9e/backend/fixtures/hevy-sample.csv (US-locale date variant)
- https://github.com/matanabudy/workout-data-sync/blob/3cdf456fb1ac13629c20748d8b9e054fa434474f/examples/hevy_export_sample.csv
- https://github.com/meltforce/FreeReps/blob/main/server/specs/hevy-api.md (set types)
- https://forum.intervals.icu/t/import-strong-data-weightlifting-app/5531 (user-quoted Strong header)

Boostcamp
- https://www.boostcamp.app/features
- http://www.boostcamp.app/vs/strong

Liftosaur
- https://www.liftosaur.com/doc/liftoscript
- https://www.liftosaur.com/blog/posts/new-experimental-program-editor
- https://github.com/astashov/liftosaur

MyFitnessPal
- https://support.myfitnesspal.com/hc/en-us/articles/360032624771-How-to-use-the-Barcode-Scanner
- https://support.myfitnesspal.com/hc/en-us/articles/360032621971-Getting-started-with-Quick-Add
- https://support.myfitnesspal.com/hc/en-us/articles/360032622131-How-do-I-copy-a-meal-from-one-day-to-another
- https://support.myfitnesspal.com/hc/en-us/articles/360032625331-Create-find-and-log-your-saved-meals
- https://support.myfitnesspal.com/hc/en-us/articles/360032622071-How-the-Recent-and-Frequent-lists-work
- https://support.myfitnesspal.com/hc/en-us/articles/15457546881805-What-is-included-in-the-free-version

Reviews and complaints
- Apple App Store customer-review RSS (https://itunes.apple.com/us/rss/customerreviews/...) for Fitbod (id1041517543), Hevy (id1458862350), Strong (id464254577), Boostcamp (id1529354455), MyFitnessPal (id341232718); Liftosaur (id1661880849) had no 1-2 star reviews in the pages read.
- https://kimola.com/reports/myfitnesspal-removes-free-barcode-scanner-feature-140890 and https://www.pocket-lint.com/apps/news/162386-wow-myfitnesspal-put-its-popular-barcode-scanner-feature-behind-a-paywall (via search summaries; barcode paywall, 3rd-party)
- https://dr-muscle.com/fitbod-app-review-alternative/ (competitor review, via search summary; use with caution)
- https://www.behance.net/gallery/34917723/MyFitnessPal-Smart-Copy (design case study, via search summary)

Not reachable: reddit.com (r/fitness, r/weightroom, r/GYM, r/Hevy, r/fitbod, r/loseit), strong.app support site.
