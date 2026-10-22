# Backlog

Source list used to create GitHub milestones and issues (`scripts/gh-bootstrap.sh`). Format: `## Milestone` then `- [labels] Title`.

## M0 Repo and CI
- [feature,testing] Scaffold Vite + React + TypeScript app with lint, type-check, Vitest, Playwright
- [feature,testing] GitHub Actions workflow (workflow_dispatch + full-ci label)
- [feature] Repo hygiene: README, LICENSE placeholder, .gitignore, issue templates, labels
- [blocked] Replace every third-party asset before the repo is made public

## M1 Research
- [research] R1 Solo Leveling deep dive (research/solo-leveling.md)
- [research] R2 RPG systems from other stories and games (research/rpg-systems.md)
- [research] R3 Competitor apps (research/competitors.md)
- [research] R4 Open-source repos cloned and studied (research/repos.md)
- [research] R5 Exercise and nutrition science (research/science.md)
- [research] R6 Data sources: exercises, food, body map (research/data-sources.md)
- [research] R7 Platform: iOS PWA limits, MediaPipe, barcode (research/platform.md)
- [research,game-system] Game design formulas and state machines (docs/game-design.md)
- [research,backend] Architecture note: ideas taken from which repo (docs/architecture.md)

## M2 Design system and assets
- [design] F0 reference frames and notes (design/references)
- [design] DESIGN.md: typography, palette, contrast, spacing, motion, sound map, layout
- [design,frontend] tokens.css + Tailwind theme
- [design] SVG asset set: panel frames, icons, rank badges, class emblems, shadow silhouettes, backgrounds
- [design] Sound effects set (Web Audio synthesised) + ambient loop
- [design,frontend] Core components: SystemWindow, QuestCard, StatBar, XPBar, RankBadge, Toast, Sheet, Tabs, BottomNav, EmptyState
- [design,frontend] Training components: BodyMap, ExerciseCard, SetRow, RestTimer, NumberStepper, Chart wrappers
- [design,frontend,testing] /dev/gallery page with every component in every state + visual snapshots

## M3 Data pipeline and database
- [backend] Exercise dataset download, merge and normalise script (data/)
- [backend] Food bundle: USDA + IFCT ingredients
- [backend] Dish database: 40+ dishes for 15 cuisines + generic set
- [backend] Body map SVG data male/female front/back
- [backend] Dexie schema, migrations and repositories
- [testing,backend] Data validation tests

## M4 Training and nutrition engines
- [backend] Plan generator engine
- [backend] Progression engine (class rules, plateaus, deloads)
- [backend] Recovery engine (per-muscle fatigue decay, cardio, overrides, readiness)
- [backend] Exercise recommender + smart swap
- [backend] Power Level engine (e1RM, standards)
- [backend] Nutrition engine (BMR, TDEE, macros, water)
- [backend] Diet plan generator (meal plans, swaps, grocery list, budget)
- [testing] 12-week simulated users

## M5 Game engines
- [game-system] XP and level engine with append-only ledger
- [game-system] Stats, ranks, Rank-Up Trials, Job Change
- [game-system] Quest engine: Daily, Penalty Zone, Emergency, Hidden
- [game-system] Dungeons, Boss Raids, Red Gate, Instant Dungeons, Demon Castle
- [game-system] Shadow Extraction and shadow catalogue
- [game-system] Titles (60+), loot drops, inventory, store, gold
- [game-system] System message catalogue (system-messages.json)
- [testing,game-system] Safety rule tests

## M6 App shell and Awakening
- [frontend] PWA shell: manifest, service worker, install guide, navigation, routing
- [frontend] Awakening onboarding + Awakening Test + class selection + rank reveal
- [frontend] Status Window
- [frontend] Readiness check-in modal
- [frontend] System message toasts, sounds, System log
- [testing] E2E: full first launch

## M7 Training screens
- [frontend] Body Map screen (Target + Recovery modes)
- [frontend] Exercise library, search, detail
- [frontend] Plan editor
- [frontend] Workout player
- [frontend] Workout summary with loot reveal
- [frontend] Cardio log
- [testing] E2E: full workout offline with XP and PRs

## M8 Progress and game screens
- [frontend] Progress charts, PR wall, Power Level history
- [frontend] Measurements and progress photos
- [frontend] Quests screen
- [frontend] Dungeons screen + Demon Castle
- [frontend] Shadow Army
- [frontend] Inventory, Titles, Store
- [testing] E2E per screen

## M9 Diet
- [frontend] Diet dashboard: rings, water, meal logging
- [frontend] Food search + barcode scanner + Open Food Facts lookup
- [frontend] Meal plan, swaps, grocery list, budget mode
- [testing] E2E: logged day hitting targets

## M10 Form check
- [backend] Form analyser engine (angles, phases, rules)
- [frontend] Form Check screen with MediaPipe pose landmarker
- [testing] Rep count within ±1 on recorded test clips

## M11 Notifications
- [backend] Cloudflare Worker: subscriptions, schedule, cron, VAPID push
- [frontend] Client schedule sync + daily status + SW push handler
- [testing] Worker tests against mocked push service
- [needs-owner] Create VAPID keys, KV namespace and deploy the Worker

## M12 Data features
- [backend] Full JSON backup and restore
- [backend] CSV export per store
- [backend] Hevy and Strong CSV import with review screen
- [backend] AI-ready progress report
- [testing] Round-trip tests

## M13 Polish and release
- [design] Motion and sound pass against DESIGN.md
- [frontend] Performance tuning + Lighthouse audits
- [needs-owner] Deploy to Cloudflare Pages + Cloudflare Access
- [needs-owner] Manual iPhone QA checklist (docs/iphone-qa.md)
- [feature] README: install, deploy, backup, data regeneration
