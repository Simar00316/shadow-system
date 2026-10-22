# Shadow System — Gym RPG PWA PRD

Oct 23, 2026 · @Simar

## 0. Agent operating rules (read first)

This PRD is executed by an autonomous coding agent in one continuous build, with no release phases. Take as long as needed. Research comes before every design and code decision, and every finding is written down in the repo before it is used.

**Build mode**

- Build the complete product described here in one run. Section 6 gives a build order for dependency and testing reasons only. It is not a release plan, so nothing gets deferred to "later".
- Never skip research (Section 2). If a decision is not backed by a note in `/research`, stop and research it first.
- When this PRD is silent or ambiguous, choose the option that makes the app feel most like a real RPG. Then log the decision in `/docs/decisions.md` with a one-line reason.

**GitHub workflow (mandatory)**

1. Create a new **private** GitHub repo named `shadow-system` (rename later if the owner wants) using the `gh` CLI. Add a README, MIT license placeholder, `.gitignore`, and issue templates for `bug` and `feature`.
2. Create GitHub labels: `bug`, `feature`, `enhancement`, `research`, `design`, `frontend`, `backend`, `game-system`, `testing`, `blocked`, `needs-owner`.
3. Create one GitHub Milestone per build-order step in Section 6, and one issue per task under it before writing code.
4. Group related small changes into one branch and one PR (for example a whole screen, or a set of related fixes) instead of a PR per tiny change. Link every issue the PR covers (`Closes #N`) and merge it yourself with squash.
5. Keep raising issues as you go: every bug found, every enhancement idea, every research gap becomes an issue immediately, even if fixed in the same session.
6. Commit small and often with Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`).
7. Run lint, type-check and tests locally before every merge; that is enough for normal PRs. Add a GitHub Actions workflow, but trigger it only manually (`workflow_dispatch`) or on PRs labelled `full-ci`, and use that label for big changes (new engine, schema migration, major refactor).

**Unattended run (the owner is asleep)**

- Run start to finish without waiting for a human. Never stop to ask a question; pick the most reasonable option and log it in `/docs/decisions.md`.
- Skip anything that needs the owner's login, review, payment or a physical device: deploying or hosting (Cloudflare Pages, Cloudflare Access, Workers), creating accounts or API keys, VAPID keys tied to a live service, and real-iPhone testing. Instead, prepare it fully (config, scripts, step-by-step instructions) and list it in `/docs/needs-owner.md`, plus a `needs-owner` issue.
- If `gh` is not already authenticated, keep working with local git, and add "create the repo and push" to `/docs/needs-owner.md`. Write issues and milestones to `/docs/backlog.md` so they can be created later.
- Only do safe, reversible actions: no force-pushes, no deleting anything outside the repo, no changing global system settings, no paid services, no secrets committed.
- When blocked on a skipped item, mock it (for example a fake push service) and continue with the next task.

**Authorship rule (strict)**

- **Do NOT add Claude, or any AI, as a co-author.** No `Co-Authored-By:` trailers, no "Generated with" lines, and no AI attribution in commits, PR titles, PR bodies, issues, code comments or the README.
- All commits are authored by the repo owner's configured git identity only. Check `git config user.name` and `user.email` before the first commit.
- If your tooling adds attribution by default, turn it off before committing (for example, set `includeCoAuthoredBy: false` in Claude Code settings).

**Assets and licensing**

- This app is for the owner's private personal use. The repo stays private and the deployment is private (Section 5).
- Original assets designed in the Solo Leveling style are preferred. Third-party downloads are allowed for this private build, but each one goes in `/public/assets/third-party/` with its source URL logged in `/docs/asset-sources.md`.
- Before the repo is ever made public or open-sourced, every third-party asset in that manifest must be replaced. Open a tracking issue for this now, labelled `blocked`.

## 1. Product overview

Shadow System is a free, personal fitness RPG: a Solo Leveling-themed web app that plans your training and diet, tracks every set and meal, checks your form with the camera, and turns real progress into levels, ranks and loot. It replaces paid gym apps with one system that is smarter than any of them.

**The user**

- One user: the owner. Built single-user first, structured so it can become open source and multi-user later.
- Primary device: iPhone (Safari, installed to the home screen). Secondary: Windows laptop browser.

**Goals**

- One-time setup. The user answers one onboarding (the Awakening), and the System generates the workout plan, calorie and macro targets, diet plan and reminders from it. After that it only asks again when something changes.
- Feels like playing an RPG, not using a tracker. Every action is framed as the System talking to the Player.
- Training intelligence at least as good as Fitbod, Hevy, Strong and Liftosaur combined: recovery modelling, progressive overload, RIR-based autoregulation, smart swaps.
- Every exercise has an animated demo, a description and step-by-step instructions.
- Works fully offline in the gym.
- An exportable progress report the user can paste into any AI assistant for questions. There is no in-app chatbot.

**Feature list (all in scope)**

| Area | Features |
| --- | --- |
| Body map | Male and female anatomical figure, front and back view, tap any muscle to target it, recovery heatmap |
| Exercises | Searchable library with filters (muscle, equipment, difficulty, class), animated demo, description, instructions, tips, common mistakes |
| Profile | Sex, age, height, weight, goal, experience level (beginner, intermediate, advanced), class, equipment, injuries, schedule, units |
| Plans | Auto-generated personalised workout plan, fully editable; program library run as Dungeons |
| Logging | Reps, weight, RIR or RPE per set, set notes, supersets, drop sets, circuits, warm-up sets, auto-start rest timer, plate calculator, 1RM estimate |
| Progress | PRs, per-exercise charts, volume per muscle, Hunter Power Level (0–100 strength score), body measurements, progress photos |
| Recovery | Per-muscle recovery 0–100%, manual override, daily readiness check-in, auto deload weeks |
| Cardio | Detailed cardio logging (machine, level, pace, intervals, duration) feeding recovery and calories |
| Diet | TDEE and macro targets, diet plan by vegetarian, non-vegetarian, vegan or eggetarian, cuisine by chosen country, calorie and macro tracking, food search, barcode scanner, water tracker, meal swaps, grocery list, budget mode |
| Form check | Camera pose estimation, rep counter, live form cues for key lifts |
| Game layer | Ranks E to S (and National level), XP, levels, stats, classes, Job Change, Daily Quests, Penalty Zone, Dungeons and Gates, Boss Raids, Shadow Extraction, titles, inventory, System messages and sounds |
| Notifications | Workout, water, meals, calorie target, readiness check-in, streak warning, Penalty Zone, quest completion |
| Data | Full backup and restore, CSV export, import from Hevy and Strong CSV, AI-ready Markdown progress report |

**Platform and constraints**

- Installable PWA. No native app, no App Store, no Mac. The user installs it from Safari via Share, then Add to Home Screen.
- Web push on iOS only works for home-screen web apps on iOS 16.4 and later, so notifications need a small push worker (Section 5).
- iPhone web apps cannot read Apple Health or Apple Watch data. The daily readiness check-in replaces wearable input.
- All user data lives on the device (IndexedDB), with backup and export. Zero running cost: every service used must have a free tier that covers one user.

**Out of scope**

- In-app AI chatbot (replaced by the progress report export).
- Social feeds, friends, leaderboards and multi-user accounts.

## 2. Research mandate (highest priority)

Research is the first and most important step: no design token, game rule, data schema or screen is built until its research note exists in `/research` and is linked from the issue that builds it. Spend real time here. Shallow research is the main way this project can fail.

**How to research**

- Open and read primary pages, not just search snippets. Clone repos and read their actual code, schemas and algorithms.
- Every research note ends with **Findings**, **What we take**, **What we do better**, and **Sources** (links).
- Open a `research`-labelled GitHub issue per track below. Close it only when its note meets the acceptance criteria.
- Revisit research whenever implementation hits an unknown. Never guess.

**Track R1 — Solo Leveling deep dive** → `/research/solo-leveling.md`

- Sources: the manhwa, the light novel, the anime, the Solo Leveling fandom wiki, and the mobile game *Solo Leveling: Arise* (its UI is a strong reference for menus, inventory and gacha-style reveals).
- Document the System in full: the Status Window layout and fields, how System messages are worded and timed, the Daily Quest ("Preparation to Become Strong"), the Penalty Zone, the Job Change quest, stat points and their names, skills and titles, the Inventory and Store, Gates (colour, rank, Red Gates, Instant Dungeons, Double Dungeon), the Demon Castle tower, Shadow Extraction ("Arise"), the Shadow Army and shadow ranks, Hunter ranks E to S and National Level, and the Monarch arc.
- Capture the visual language: blue holographic panels, glow, scanlines, glitch reveals, notification chimes, the font feel, the purple of shadow energy, and how the anime animates System windows appearing.
- Output a mapping table: Solo Leveling concept → our fitness mechanic.

**Track R2 — RPG systems from other stories and games** → `/research/rpg-systems.md`

Study how these design progression, then combine the best ideas into our System:

- *The Gamer*, *Omniscient Reader's Viewpoint* (scenarios, constellations), *Tower of God* (floors, tests), *Leveling with the Gods* — other "System" stories.
- Final Fantasy (job system), Diablo (loot rarity tiers), Dark Souls and Elden Ring (bonfires, bosses, difficulty with fairness), Persona (calendar and daily life as gameplay), Monster Hunter (gear crafted from progress), Pokémon (collection), Duolingo (streak psychology, streak freeze).
- Output: which mechanic we adopt, how it maps to training or diet, and why it motivates without punishing.

**Track R3 — Competitor apps** → `/research/competitors.md`

- Fitbod: per-muscle recovery 0–100%, recovery heatmap, RIR, exercise preferences (more, less, exclude), equipment profiles, smart swaps.
- Hevy and Strong: set-logging speed, rest timer, supersets, CSV export formats (we must import them).
- Boostcamp: program library, Strength Score, volume heatmap.
- Liftosaur: scriptable progression rules.
- MyFitnessPal: food logging flow, barcode scanning, meal reuse.
- Read app store reviews and fitness subreddit threads for each. List the top complaints and how we avoid them.

**Track R4 — Open-source repos to clone and study** → `/research/repos.md`

Clone each, read the code, and record reusable ideas, schemas and data. Verify each repo still exists and check its license before using its data.

| Repo | Why study it |
| --- | --- |
| [wger-project/wger](https://github.com/wger-project/wger) | Full open-source fitness manager: routines with progression rules, nutrition via Open Food Facts, measurements, exercise wiki, REST API |
| astashov/liftosaur | Scriptable progression engine (Liftoscript); model our class progression rules on it |
| [hasaneyldrm/exercises-dataset](https://www.sourcepulse.org/projects/31522445) | 1,324 exercises with target muscle, equipment, instructions and animation GIFs in one JSON file |
| [ExerciseDB/exercisedb-api](https://gittrend.io/repo/ExerciseDB/exercisedb-api) | Schema reference: target and secondary muscles, variations, related exercise IDs, male and female GIF variants |
| [AshenKeep/Magni](https://github.com/AshenKeep/Magni) | Self-hosted tracker seeding from AscendAPI and WorkoutX; templates from logged workouts |
| yuhonas/free-exercise-db | Public-domain exercise JSON with images |
| react-body-highlighter (npm) | Clickable front/back muscle map; evaluate, or build our own SVG |
| google-ai-edge/mediapipe | Pose landmarker for form check and rep counting |
| openfoodfacts (APIs, SDKs) | Barcode and food data |

- Also search GitHub for: `workout tracker pwa`, `muscle map svg`, `rep counter mediapipe`, `solo leveling ui`, `rpg habit tracker` (for example Habitica's codebase). Add every useful find to the table.

**Track R5 — Exercise and nutrition science** → `/research/science.md`

- Rep ranges, load (%1RM), rest and volume per goal: strength, hypertrophy, endurance, mobility. Use position stands and reviews (for example ACSM, NSCA, Schoenfeld's volume work).
- RIR/RPE autoregulation, progressive overload models (linear, double progression, undulating), deload triggers.
- 1RM formulas (Epley, Brzycki), the muscle recovery decay model, how cardio fatigues muscles.
- TDEE (Mifflin-St Jeor plus activity multiplier), macro targets per goal, protein targets for vegetarian and vegan diets, water needs.
- Sex differences in training response that should change recommendations, and safe beginner defaults.

**Track R6 — Data sources** → `/research/data-sources.md`

- Exercises: choose the primary dataset (most exercises with animations, muscles and instructions) and merge others. Record field mapping.
- Food: USDA FoodData Central, Open Food Facts, the Indian Food Composition Tables (IFCT 2017), and a cuisine source per country for diet suggestions.
- Body map: anatomically accurate male and female SVGs, front and back, with each muscle as its own path.

**Track R7 — Platform** → `/research/platform.md`

- iOS PWA limits on the current iOS version: web push, service worker, storage eviction, camera access, wake lock, audio autoplay, haptics.
- MediaPipe performance on iPhone Safari; the barcode scanning approach in Safari.

**Acceptance criteria for research**

- [ ] All seven notes exist, each with Findings, What we take, What we do better, Sources.
- [ ] The Solo Leveling → fitness mapping table covers at least 25 concepts.
- [ ] Every repo in the table has been cloned and read, with license recorded.
- [ ] The science note gives a concrete number (with source) for every target the engines in Section 5 compute.

## 3. Game system design

The user is the Player and the app is the System: every real rep, meal and rest day moves an RPG character whose level and rank reflect real ability. The defaults below are a starting design. Refine them with Tracks R1, R2 and R5, and log every change in `/docs/game-design.md`, which becomes the single source of truth for the game rules.

**Core loop**

1. The System issues today's Daily Quest (from the plan, recovery state and readiness).
2. The Player trains, eats and logs; each logged action awards XP and stat growth.
3. Levels rise; ranks rise only by passing a Rank-Up Trial (a real fitness re-test).
4. Dungeons (multi-week programs) end in Boss Raids (test weeks). Victories trigger Shadow Extraction.

**Awakening (onboarding)**

- One cinematic onboarding: the System "chooses" the Player. It collects sex, age, height, weight, goal, experience level, class, equipment, injuries, training days and session length, diet type, cuisine country, budget, units and notification times.
- Then an Awakening Test, adjusted to experience level: max push-ups, max bodyweight squats in 60 s, plank hold, and optional e1RM entry for squat, bench, deadlift and overhead press. Beginners skip loaded tests.
- Result: starting Hunter Power Level, starting rank (most users start E or D), and a generated plan, diet and reminder schedule.

**Classes (they set rep, load and rest targets)**

| Class | Focus | Reps per set | Load (%1RM) | Rest | Progression rule |
| --- | --- | --- | --- | --- | --- |
| Fighter | Strength | 3–6 | 80–90% | 2–4 min | Add load when every set hits the top of the range at RIR 1–2 |
| Tank | Hypertrophy | 6–12 | 65–80% | 60–120 s | Double progression: reps to top of range, then add load and reset reps |
| Assassin | Endurance, conditioning | 12–20+ | 50–65% | 30–60 s | Add reps, then cut rest (density) |
| Ranger | Athletic hybrid (power, calisthenics, cardio) | 5–10 | 60–80% | 60–120 s | Undulating: heavy, medium and light days rotate |
| Healer | Mobility, rehab, flexibility | Holds and tempo | Bodyweight or light | 30–60 s | Add hold time, range of motion, then tempo |

- Experience level scales each class: beginners get lower volume, slower load jumps and more technique sets; advanced users get more volume, top sets and back-off sets.
- Load jumps default to 2.5 kg for upper body and 5 kg for lower body, and adjust to the equipment available.
- **Job Change** at level 30, after a Job Change Quest (a hard class-specific challenge): Fighter becomes Knight or Berserker, Tank becomes Juggernaut, Assassin becomes Shadow Assassin, Ranger becomes Striker, Healer becomes Monk. Advanced classes unlock new techniques (cluster sets, myo-reps, EMOMs and similar).
- A hidden class, **Shadow Monarch**, unlocks at S rank and lets the Player mix class rules per exercise.
- Changing class at any time re-generates targets, with a confirmation from the System.

**Stats**

Use Solo Leveling's stat names. Each one grows from real behaviour, and the Player gets bonus points to allocate on level-up.

- **STR**: strength gains (e1RM increases on tracked lifts).
- **AGI**: cardio and conditioning work.
- **VIT**: consistency, recovery and sleep (streaks, readiness check-ins, deload compliance).
- **INT**: nutrition (hitting calorie, protein and water targets, logging meals).
- **PER** (Sense): form quality (good reps in camera form check, mind-muscle notes).

Allocated points give small XP multipliers in that stat's category. Exact effects are defined in R2.

**XP, levels and ranks**

- XP sources: each working set (scaled by RIR effort), workout completed, PR (bonus), Daily Quest cleared, meals logged, protein, calorie and water targets hit, readiness check-in, good reps in form check, Dungeon floors and Boss Raids.
- Starting curve: XP to next level = round(100 × level^1.5). Tune it so a consistent user reaches level 10 in about 3 weeks and level 50 in about a year.
- Ranks E, D, C, B, A, S, then National Level. Rank-up needs both a level threshold and passing a Rank-Up Trial built from the Power Level tests. Rank reflects real fitness, not grinding.
- **Hunter Power Level** (0–100): computed from relative strength (e1RM divided by bodyweight on key lifts against sex- and bodyweight-based standards), conditioning and consistency. It is shown on the Status Window.

**Quests**

- **Daily Quest**: generated each morning. On training days it is the planned session; on rest days it is a 10–15 min mobility block or a step goal. Every day it also includes water, protein and the readiness check-in. Use the Solo Leveling Daily Quest window style and a countdown to midnight.
- **Penalty Zone**: miss the Daily Quest, and the next day adds a short penalty quest (for example 10 minutes of conditioning) with a dramatic System warning. No XP is ever removed. Clearing the penalty restores the streak.
- **Emergency Quest**: a surprise optional quest with high XP (for example "Complete 50 push-ups before 21:00").
- **Hidden Quests**: unlocked by secret conditions (for example training at 05:00, or a 100-day streak).
- **Job Change Quest** and **Rank-Up Trials** as above.

**Gates and Dungeons (programs)**

- Each program in the library (PPL, Upper/Lower, Full Body, 5/3/1, beginner linear progression, home calisthenics, and others found in R3) is a Gate with a rank matching its difficulty and length.
- Each week is a floor. The final week is a **Boss Raid**: a test week of AMRAPs or e1RM tests. Beating the boss clears the Gate.
- **Red Gate**: an opt-in 7-day challenge that cannot be paused once entered.
- **Instant Dungeon Keys**: earned items that open optional bonus workouts (arms, abs, conditioning).
- **Demon Castle**: a 100-floor long-term tower, where each floor is a lifetime milestone (total volume lifted, total km, total workouts).

**Shadow Extraction and the Shadow Army**

- Clearing a Boss Raid, a major PR or a Rank-Up Trial triggers the "ARISE" sequence: the defeated boss becomes a shadow soldier in the Player's army.
- Each shadow has a name, rank (Normal, Elite, Knight, Commander, Marshal) and a passive buff (for example +5% XP on leg days). Design original shadows, with names and lore in the Solo Leveling style.
- The Shadow Army screen shows the collection as a gallery.

**Titles, inventory and store**

- **Titles**: achievements the Player equips on the Status Window (for example "Iron Will" for a 30-day streak, "Leg Day Survivor", "Wolf Slayer" for a first squat PR). Design at least 60.
- **Gold**: earned from quests, spent in the System Store.
- **Store items**: Streak Freeze ("Elixir of Life"), Rest Day Pass, Instant Dungeon Keys, UI themes and cosmetic panel skins, profile frames.
- **Loot drops**: after each workout, a chance of a drop with Diablo-style rarity (Common, Rare, Epic, Legendary) and a reveal animation. Drops are cosmetic or convenience items only, never things that affect safety.

**System voice**

- Every notification, toast and empty state is a System message, for example: "\[A new Daily Quest has arrived.\]", "\[You have leveled up.\]", "\[Warning: failure to complete the Daily Quest will result in a penalty.\]"
- Keep a `system-messages.json` catalogue with variants per event so messages never feel repetitive.

**Safety rules the game must never break**

- No XP for volume above the safe weekly cap per muscle (from R5), and no reward for training a muscle below 30% recovery.
- Deloads are enforced when triggered, and the game frames them as "Recovery Phase" with bonus VIT, not as a failure.
- A low readiness check-in or an injury flag waives the Penalty Zone and swaps the session for recovery work.
- Diet targets never go below safe minimums (from R5), and there is no reward for extreme deficits.

## 4. Frontend

The frontend should look and sound like the System from Solo Leveling, run at 60 fps on an iPhone, and be fast enough to log a set with one thumb between sets. Two steps come before any screen is coded: visual and audio research with asset creation (F0), then a complete design file (F1).

### F0. Visual and audio research and asset creation

- Build on Track R1. Collect reference frames from the anime and manhwa of every System window type: Status, Quest, Notification, Warning or Penalty, Level Up, Job Change, Shadow Extraction, Inventory and Store. Save them to `/design/references/` with a short note on what each teaches.
- Study *Solo Leveling: Arise* menus for inventory, character and gacha-style reveal patterns.
- Create or source every asset, and log each in `/docs/asset-sources.md`:
  - Panel frames and borders (SVG): the holographic blue window with corner brackets, glow and scanlines.
  - Icon set (SVG): stats, muscles, equipment, quest types, item rarities, ranks E to S and National, class emblems.
  - Rank badges and class emblems, original designs in the Solo Leveling style.
  - Shadow soldier art: silhouettes in purple and black smoke, one per shadow, original designs.
  - Backgrounds: dark gate-portal and dungeon-themed backdrops, subtle animated particles.
  - Male and female anatomical body figures, front and back, every muscle as its own selectable SVG path (from R6).
  - Exercise animations: use the chosen dataset's GIFs or videos, converted to WebP or MP4 for size.
- **Sound effects**: a full set, sourced (for example from Freesound or free game-SFX packs) or synthesised with the Web Audio API. Needed: System window open and close, notification chime, button tap, quest accepted, quest complete, set logged, rest timer warning and end, level up, rank up, PR fanfare, loot reveal per rarity, penalty alarm, ARISE extraction, boss raid start, error.
- Optional ambient music loop for workouts, with a mute toggle that is remembered.

### F1. Design file (must exist before any UI code)

Create `/design/DESIGN.md` plus a live token file (`/src/styles/tokens.css`) and a component gallery page (`/dev/gallery`) that renders every component in every state. It must define:

- **Typography.** Starting choice, to be confirmed after F0: a futuristic display face for headings and System titles (for example Orbitron or Rajdhani), a clean sans for body text (for example Inter), and a monospace for numbers, timers and stats (for example JetBrains Mono). Include sizes, weights, letter-spacing and line-heights for every text style.
- **Colour palette.** Starting tokens to refine from references, with every pair checked for WCAG AA contrast:

| Token | Starting value | Use |
| --- | --- | --- |
| `--bg` | #05070F | App background, near-black navy |
| `--panel` | #0B1426 at 75% opacity | System window fill |
| `--system-blue` | #2FA8FF | Primary borders, headings |
| `--glow` | #5CC8FF | Glow, focus rings, progress bars |
| `--shadow-purple` | #7B2FF7 | Shadow army, ARISE, Monarch class |
| `--warning` | #FF3B5C | Penalty Zone, errors, low recovery |
| `--gold` | #FFC94A | Gold, legendary loot, PRs |
| `--text` | #E6F1FF | Primary text |
| `--text-dim` | #7C8DB5 | Secondary text |

- **Rank and rarity colours**: E grey, D green, C blue, B purple, A orange, S gold, National red-gold; Common, Rare, Epic and Legendary rarity colours.
- **Spacing, radius and elevation scale**; glow and blur recipes; the scanline and noise overlay.
- **Motion spec**: window open (scale from 0.96 plus glitch flicker plus border trace, under 300 ms), text typing effect for System messages, level-up burst, ARISE smoke sequence, loot reveal. Include durations, easings, and a reduced-motion fallback for each.
- **Sound map**: which sound plays on which event, volume levels, and the rule that audio unlocks on the first tap (an iOS requirement).
- **Components**: SystemWindow, QuestCard, StatBar, XPBar, RankBadge, BodyMap, ExerciseCard, SetRow, RestTimer, NumberStepper, Toast (System message), BottomNav, Sheet, Tabs, Chart wrappers, EmptyState. Show every state: default, active, disabled, loading, error, success.
- **Layout rules**: mobile-first at 390 px wide, iPhone safe-area insets, bottom navigation in the thumb zone, tap targets at least 48 px (sweaty gym hands), dark mode only.

### F2. Tech stack

- React and TypeScript with Vite, and `vite-plugin-pwa` (Workbox) for offline caching and installability.
- Tailwind CSS driven by the design tokens; Framer Motion for animation; Zustand for UI state.
- Dexie (IndexedDB) for all local data (schema in Section 5).
- Charts: Recharts or visx, themed to the System look.
- Audio: Howler.js. Camera form check: MediaPipe Tasks Vision (Pose Landmarker). Barcodes: ZXing (`@zxing/browser`), because Safari has no native BarcodeDetector. Confirm both in R7.
- iPhone Safari has no Vibration API, so do not depend on haptics.

### F3. Screens

**Navigation**: a bottom bar with Status, Quests, Train, Diet, and System (menu). Every screen uses SystemWindow framing.

1. **Awakening** (first launch): a cinematic intro ("\[You have been chosen as a Player.\]"), then the onboarding form as a series of System prompts, the Awakening Test with a built-in timer, a class selection screen with emblems and their rep-range effects, and a reveal of starting rank and Power Level.
2. **Status Window** (home): name, title, class, level, XP bar, rank badge, Power Level, the five stats with allocate buttons, streak, gold, today's Daily Quest summary, and a recovery mini-map.
3. **Quests**: the Daily Quest with a countdown to midnight, Penalty Zone state, Emergency and Hidden quests, Job Change and Rank-Up Trial progress, and a quest log.
4. **Body Map**: male or female figure (from profile, switchable), front and back toggle with a flip animation. Two modes: Target (tap muscles to pick today's targets and get ranked exercise suggestions) and Recovery (heatmap of 0–100% per muscle, tap for history, manual override).
5. **Exercise library and search**: instant fuzzy search by name or alias, filters for muscle, equipment, difficulty, class suitability and "equipment only" (for example barbell only), and preference marks (more, less, never).
6. **Exercise detail**: looping animation, target and secondary muscles highlighted on a mini body map, step-by-step instructions, tips, common mistakes, the Player's history and PRs for it, equivalent swaps, and a "Check my form" button where supported.
7. **Plan editor**: the generated weekly plan as days, then exercises, then sets. Drag to reorder, add, remove or swap exercises, edit sets, reps, load and rest. The System suggests fixes if an edit breaks volume or recovery rules. Show an estimated session duration.
8. **Workout player** (the most important screen): the current exercise with its animation, set rows pre-filled from last time and the class target, steppers for weight and reps, an RIR or RPE picker, and set notes. Ticking a set auto-starts the rest timer (with a full-screen option and a sound when it ends) and awards XP with a micro-animation. Also: supersets, drop sets and circuits, warm-up set suggestions, plate calculator, e1RM display, smart swap if equipment is taken, and PR detection with a fanfare. Screen wake lock stays on during a session.
9. **Workout summary**: XP earned, stat gains, PRs, loot drop reveal, and System messages.
10. **Dungeons**: the Gate list by rank, Gate detail (floors as weeks), Boss Raid flow, Red Gate entry warning, and the Demon Castle tower view.
11. **Progress**: charts per exercise (e1RM, best set, volume), weekly volume per muscle as a heatmap, Power Level history, bodyweight and measurements, a progress photo gallery with side-by-side compare (photos stored on device only), and a PR wall.
12. **Diet**: today's calories, macros and water as rings; the meal plan by diet type and cuisine country; meal logging by search, barcode scan, recents and saved meals; meal swaps; a grocery list built from the plan; budget mode.
13. **Form Check**: pick an exercise, place the phone, get a live skeleton overlay, a rep counter, and form cues (depth, knee tracking, back angle, lockout, tempo) for at least squat, push-up, deadlift, lunge, overhead press and curl. Produce a per-set form score that feeds PER.
14. **Shadow Army**: a gallery of extracted shadows, each with rank, buff and lore; plays the ARISE replay.
15. **Inventory, Titles and Store**: owned items, equipping a title, and buying with gold.
16. **Cardio log**: choose a machine or activity, then duration, distance, level, pace and intervals.
17. **Readiness check-in**: a 10-second modal for sleep, soreness, energy and stress, shown on first open each day.
18. **System log**: every System message and notification in history.
19. **Settings**: profile and re-run Awakening, units per section (kg or lb for lifts and bodyweight separately), notification schedule, sound and motion, backup and restore, CSV export, Hevy and Strong import, progress report export, and the about page.

**Frontend acceptance criteria**

- [ ] `DESIGN.md`, tokens and the component gallery exist before the first screen PR.
- [ ] Every screen above is built, matches the design file, and works offline.
- [ ] Lighthouse PWA installable, accessibility at least 90, performance at least 90 on mobile.
- [ ] Logging a set takes at most 2 taps when values match the target.
- [ ] Playwright WebKit iPhone emulation passes; testing on a real iPhone is an owner task.

## 5. Backend and data

The "backend" has three parts: domain engines that run on the device as pure TypeScript modules, local-first storage in IndexedDB, and one small Cloudflare Worker for push notifications. There is no paid server and no server-side user database. Before building it, finish Tracks R3, R4, R5 and R6, and write `/docs/architecture.md` explaining which ideas were taken from which repo.

### B0. Backend research step

- Clone the repos in Track R4 and study their data models, progression rules and import formats: wger's routine and progression models, Liftosaur's progression scripting, the exercise datasets' fields, and Habitica's quest and reward logic.
- Re-read R1 and R2 and turn the game rules in Section 3 into precise formulas and state machines in `/docs/game-design.md` before coding the engines.
- Get real export files from Hevy and Strong (from their docs or public samples) to build the importers against.

### B1. Architecture

- `/src/engine/*`: pure, framework-free, fully unit-tested modules. The UI calls them; they never touch the DOM.
- `/src/db/*`: Dexie schema, migrations, repositories.
- `/worker/*`: Cloudflare Worker for web push (with its own tests).
- `/data/*`: build-time scripts that download, merge and normalise exercise, food and cuisine datasets into compact JSON bundled into the app, so the app works offline from first install.

### B2. Local data model (Dexie)

| Store | Holds |
| --- | --- |
| `profile` | Sex, birth year, height, weight history, goal, experience level, class, equipment profiles, injuries, schedule, diet type, cuisine country, budget, units |
| `exercises` | Merged library: id, name, aliases, primary and secondary muscles, equipment, difficulty, mechanics, class tags, media, instructions, tips, mistakes, swap group, MET value, form-check support |
| `exercisePrefs` | More, less or never per exercise |
| `plans`, `planDays`, `planExercises` | Generated and user-edited plan, with an `edited` flag so regeneration never overwrites manual changes without asking |
| `workouts`, `sets` | Sessions and every set: exercise, weight, reps, RIR or RPE, type (warm-up, working, drop, superset group), notes, rest taken, form score |
| `cardio` | Activity, machine, duration, distance, level, pace, intervals, estimated kcal |
| `recovery`, `readiness` | Per-muscle recovery snapshots and overrides; daily check-ins |
| `foods`, `meals`, `mealLogs`, `water` | Food database (bundled plus cached Open Food Facts lookups), saved meals, daily logs, water entries |
| `measurements`, `photos` | Body measurements; progress photos as on-device blobs |
| `player`, `xpEvents` | Level, XP, rank, Power Level, stats, gold, streak; an append-only XP ledger (so everything can be recomputed) |
| `quests`, `dungeons`, `shadows`, `titles`, `inventory` | Game state |
| `systemMessages`, `settings`, `notificationSchedule` | Log, preferences, reminder times |

- Version every schema change with a Dexie migration and a test.
- Call `navigator.storage.persist()` on install, and nag gently for a backup every 7 days.

### B3. Engines

1. **Plan generator**: from the profile, class, experience level, equipment, injuries, days per week and session length, choose a split, pick exercises (respecting preferences and injuries), and set sets, reps, load and rest from the class table. Regenerate weekly from logs, and never overwrite user edits without confirmation.
2. **Progression engine**: applies the class progression rule to each exercise after every session using reps, load and RIR; handles plateaus (3 stalled sessions trigger a variation swap or deload) and auto deload weeks.
3. **Recovery engine**: per-muscle fatigue from sets × load × proximity to failure, plus cardio, decaying over time to give 0–100% recovery. Supports manual overrides and readiness adjustments. Model it on Fitbod's documented behaviour and the R5 science.
4. **Exercise recommender**: for the muscles targeted on the body map, rank exercises by muscle match, equipment, recovery, class suitability, preferences and recent variety.
5. **Smart swap**: equivalent exercises by swap group and movement pattern when equipment is busy or an injury flag is set.
6. **Power Level engine**: e1RM (Epley and Brzycki, take the more conservative), relative strength against standards by sex and bodyweight, conditioning and consistency, combined into 0–100.
7. **Nutrition engine**: BMR with Mifflin-St Jeor, TDEE with an activity multiplier refined weekly from bodyweight trend, calorie and macro targets per goal, protein targets per diet type, water target.
8. **Diet plan generator**: daily meal plans hitting targets from a bundled dish database filtered by diet type (vegetarian, non-vegetarian, vegan, eggetarian) and cuisine country, with budget mode, swaps and a grocery list. Compile at least 40 dishes for each of the 15 most common cuisines plus a generic set, with macros from USDA and IFCT.
9. **Quest engine**: generates the Daily Quest, Penalty Zone, Emergency and Hidden quests, Job Change and Rank-Up Trials, following the safety rules in Section 3.
10. **XP and level engine**: turns events into ledger entries, then levels, stats, rank eligibility, loot rolls and Shadow Extraction triggers.
11. **Form analyser**: from MediaPipe landmarks, computes joint angles per frame, counts reps by phase detection, and checks per-exercise rules (squat depth, knee valgus, back angle, lockout, tempo). Validate against recorded test clips.
12. **Report generator**: the AI-ready progress report (B5).
13. **Import and export**: full JSON backup and restore, CSV export per store, Hevy and Strong CSV import with exercise-name matching and a review screen for unmatched names.

### B4. Notifications (Cloudflare Worker)

- Web push with VAPID keys. The Worker stores the push subscription and the reminder schedule in Workers KV, and a Cron Trigger every 15 minutes sends due reminders.
- After each log, the app sends the Worker a tiny daily status (booleans like `workoutDone`, `waterHit`), so reminders already satisfied are skipped. No health data is sent.
- Reminders: workout time, water (interval), meals, calorie target check in the evening, readiness check-in, streak at risk, Penalty Zone warning, Dungeon floor due. All text comes from the System message catalogue.
- Push only works when the app is installed to the iPhone home screen, so onboarding must detect standalone mode and guide installation first.

### B5. AI-ready progress report

The report is one Markdown file, generated on demand with a period selector (2, 4 or 12 weeks), and copyable or shareable through the iOS share sheet. It contains:

- A header prompt: "You are my strength coach and nutritionist. Here is my data; answer my questions using it."
- Profile, class, goal, experience, equipment and injuries.
- The current plan, and adherence (planned vs completed sessions).
- Per-exercise trend tables (best set and e1RM per week), PRs, stalled lifts.
- Weekly volume per muscle and recovery averages; readiness averages.
- Bodyweight and measurement trend; calorie, macro and water adherence.
- Game summary: level, rank, Power Level, streak.
- Open questions the System detected (for example "Bench stalled 3 weeks", "Protein under target 5 of 7 days").

### B6. Hosting and privacy

- Prepare, but do not run, a private deploy to Cloudflare Pages: config, scripts and step-by-step instructions for the owner. HTTPS is required for PWA install, service workers, push and camera.
- Restrict access with Cloudflare Access (one allowed email). R7 must confirm it works in iOS standalone mode. If it does not, use an unlisted URL plus an app-level passcode.
- All user data stays on the device. Only the push subscription, reminder times and daily booleans reach the Worker.

**Backend acceptance criteria**

- [ ] Every engine has unit tests covering normal cases, edge cases and the Section 3 safety rules; at least 90% line coverage on `/src/engine`.
- [ ] A simulated 12-week user (a script feeding synthetic logs) produces sensible progression, deloads, levels and quests.
- [ ] Backup, restore and Hevy and Strong import round-trip without data loss.
- [ ] The push flow passes against a mocked push service; real-iPhone push is an owner task.

## 6. Build order, testing and definition of done

Build in this order, one GitHub Milestone per step, and do not start a step until the previous step's test gate is green and its PRs are merged. The order exists for dependencies and testing; the whole product still ships in this one run.

**Build order (one Milestone each)**

1. **M0 Repo and CI**: private repo, labels, issue templates, a default branch of `main`, GitHub Actions (lint, type-check, Vitest, Playwright). *Gate:* lint, type-check and tests pass locally.
2. **M1 Research**: Tracks R1–R7 in Section 2. *Gate:* every research acceptance criterion ticked; research issues closed.
3. **M2 Design system and assets**: F0 and F1. *Gate:* `DESIGN.md`, tokens, sound set and the `/dev/gallery` page with every component in every state; visual snapshots recorded.
4. **M3 Data pipeline and database**: `/data` scripts, merged exercise and food bundles, Dexie schema and migrations. *Gate:* data validation tests (no exercise without muscles, media or instructions; every food has macros).
5. **M4 Training and nutrition engines**: plan generator, progression, recovery, recommender, smart swap, Power Level, nutrition, diet plan. *Gate:* unit tests plus the 12-week simulated user passes.
6. **M5 Game engines**: XP and levels, stats, ranks, quests, Penalty Zone, Dungeons, Boss Raids, Shadow Extraction, titles, loot, store. *Gate:* unit tests including every safety rule in Section 3.
7. **M6 App shell and Awakening**: PWA install, navigation, Awakening onboarding and test, Status Window, readiness check-in, System message toasts and sounds. *Gate:* end-to-end test of a full first launch.
8. **M7 Training screens**: body map, exercise library and detail, plan editor, workout player, workout summary, cardio log. *Gate:* end-to-end test logs a full workout offline, with XP and PRs correct.
9. **M8 Progress and game screens**: progress charts, recovery map, measurements and photos, quests, Dungeons, Shadow Army, inventory, titles, store. *Gate:* end-to-end tests per screen.
10. **M9 Diet**: diet screens, food search, barcode scanner, water, meal plan, grocery list. *Gate:* end-to-end test of a full logged day hitting targets.
11. **M10 Form check**: MediaPipe integration, rep counter, form rules for the six lifts. *Gate:* rep count within ±1 on recorded test clips for every supported lift.
12. **M11 Notifications**: Worker, VAPID, cron, schedule sync, daily status skip logic. *Gate:* Worker tests pass against a mocked push service; the real-iPhone push test is listed as an owner task.
13. **M12 Data features**: backup, restore, CSV export, Hevy and Strong import, AI-ready progress report. *Gate:* round-trip tests with zero data loss.
14. **M13 Polish and release**: motion and sound pass against `DESIGN.md`, System message variety, performance tuning, deploy scripts and the manual iPhone checklist prepared for the owner (not executed). *Gate:* the definition of done below.

**Testing strategy**

- **Unit (Vitest)**: every engine function, including edge cases (zero history, injuries, missing equipment, unit conversions, timezone and midnight rollover for quests).
- **Component (React Testing Library)**: every component in the gallery.
- **End-to-end (Playwright with WebKit and iPhone emulation)**: the critical flows named in each gate, also run with the network offline.
- **Visual regression**: Playwright screenshots of the gallery and key screens against approved snapshots.
- **Simulation**: scripted synthetic users (beginner Tank, intermediate Fighter, advanced Assassin; male and female) over 12 weeks, asserting sensible targets, deloads, levels and quests.
- **Manual iPhone checklist** in `/docs/iphone-qa.md`: install to the home screen, offline workout, push, camera form check, barcode scan, audio after first tap, safe areas, wake lock, storage persistence after a week.
- Every bug found in any test becomes a `bug` issue, with a failing test written before the fix.

**Definition of done**

- [ ] Every feature in Section 1's feature list is built and reachable in the UI.
- [ ] Every research, frontend and backend acceptance criterion in Sections 2, 4 and 5 is ticked.
- [ ] CI is green on `main`; no open `bug` issues of high priority.
- [ ] Every skipped owner task (deploy, push keys, real-iPhone checklist) is listed with instructions in /docs/needs-owner.md.
- [ ] README explains install, deploy, backup, and how to regenerate data bundles.
- [ ] No commit, PR or file credits Claude or any AI as an author.
- [ ] Remaining ideas are logged as `enhancement` issues for future work.
