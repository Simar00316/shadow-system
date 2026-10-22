# Research R4: Open-source repos cloned and read

Date of research: 2026-10-23. All repos were cloned with `git clone --depth 1` into `research/_repos/` (folder holds a `.gitignore` containing `*`, so nothing in it is ever committed). Licences were read from the actual LICENSE files, not from badges. Repo "exists" means the clone succeeded and the repo is not archived (checked with the GitHub API on the same day).

Scope note: this note feeds M1 (research gate), B0 (backend research) and R6 (data sources). Where a licence limits what we may bundle, it is stated in the "License-safe to bundle" section below.

## 1. Summary table

| Repo | Exists? (last push) | Licence (read from file) | What we reuse | Notes |
| --- | --- | --- | --- | --- |
| wger-project/wger | Yes, 7.2k stars (2026-10-21) | AGPL-3.0 code; exercise data CC-BY-SA 4 per row; docs CC-BY-SA 4 | Ideas only: routine/day/slot/slot-entry model, per-iteration progression configs with requirements, set types, trophy types, OFF mapping rules, measurement categories | Do not copy code (AGPL). Muscle SVGs in repo come from Wikimedia Commons (`core/static/images/muscles/SOURCES`), licence per file unverified |
| astashov/liftosaur | Yes, 757 stars (2026-10-22) | AGPL-3.0 | The exact semantics of `lp`, `dp`, `sum`, `custom`; state-per-exercise model; synergist multiplier 0.5 | Rewrite in our own TS (ideas are free, code is AGPL). Programs under `programs/builtin/*.md` are AGPL content, use as inspiration only |
| hasaneyldrm/exercises-dataset | Yes, 23k stars (2026-07-16) | Text/data/code MIT; **media (GIF/JPG) is (c) Gym visual**, 180x180 only, attribution required, not covered by MIT | 1,324 exercises, 10-language instructions, GIFs for the private build | Same data lineage as ExerciseDB v1 and WorkoutX (same `0001` ids, same body_part/target vocabulary). Media NOT safe to bundle in a public build |
| ExerciseDB/exercisedb-api (now AscendAPI) | Yes, 727 stars (2025-11-25) | AGPL-3.0 on the repo, which now contains only `README.md` + `LICENSE` (code removed). Data served under their ToS | Schema reference only (v2 fields), plus the free V1 REST API (1,500 exercises, no key, CORS `*`) | No data licence stated anywhere. Do not bundle. Good for field-name design |
| AshenKeep/Magni | Yes, 0 stars (2026-09-01) | AGPL-3.0 | Ideas: muscle-category mapping table, seed modes (metadata only / with GIFs / download GIFs) with a seed log, save-workout-as-template, per-set `log_type` (strength/cardio/mobility) | Tiny repo but a clean data model. Depends on paid-quota APIs, which we do not want |
| yuhonas/free-exercise-db | Yes, 2.0k stars (2026-09-27) | Unlicense (public domain dedication) | `dist/exercises.json` (876 exercises, 17 muscle names, level/force/mechanic/category/equipment, instructions) and 1,746 JPG frames | The only large dataset with a clear permissive licence. Upstream `wrkout/exercises.json` is also Unlicense. No animation, 2 still frames per exercise |
| giavinh79/react-body-highlighter | Yes, 53 stars (2026-09-20) | MIT | Nothing directly | Male only, 1000x2000 low-fidelity polygons, 22 muscle ids. Its own README says the polygons come from react-native-body-highlighter |
| HichamELBSI/react-native-body-highlighter (found via the above) | Yes, 297 stars (2026-10-18) | MIT | **Best base for our body map**: male AND female, front AND back, true SVG path data, left/right split | `assets/body*.ts`. Slug list is coarse (see section 8) so we must extend it |
| google-ai-edge/mediapipe + mediapipe-samples-web | Yes, 37k / 100 stars (2026-10-22) | Apache-2.0 | `@mediapipe/tasks-vision` 1.1.1 PoseLandmarker, 3 model sizes, VIDEO mode, GPU delegate with CPU fallback, worker pattern | Sample code is in `mediapipe-samples-web`, not in `mediapipe-samples` (that repo only holds native samples) |
| openfoodfacts (server docs, `openfoodfacts-js`) | Yes, 1.2k / 265 stars (2026-10-22) | Server AGPL-3.0; SDK Apache-2.0; database ODbL, contents DbCL, images CC-BY-SA | Plain `fetch` to API v2; product JSON fields; wger's field-mapping code as a pattern | Verified live: CORS `Access-Control-Allow-Origin: *`. Read limit 15 req/min/IP, search 10 req/min/IP. Skip the SDK |
| HabitRPG/habitica | Yes, 14k stars (2026-10-21) | Code GPL-3.0; HabitRPG art CC-BY-NC-SA 3.0; BrowserQuest art CC-BY-SA 3.0 | Formulas: `tnl`, task value delta 0.9747^v, XP/HP/gold per task, drop chance, boss damage, crit | Copy formulas as ideas, write our own code (GPL). Do not use their art |
| vulovix/body-muscles (found) | Yes, 35 stars (2026-04-16) | Apache-2.0 (NOTICE file, keep attribution) | 89 anatomical regions (40 front, 49 back) with intensity 0-10 API, finer than RN | Single neutral figure, no female. Good source of sub-region ideas (upper/mid/lower traps, lats upper/mid/lower, glute med/max, soleus) |
| melihcolpan/MuscleMap (found) | Yes, 279 stars (2026-10-16) | MIT | Confirms the RN female/male paths, adds sub-group hierarchy (upper-chest, lower-abs, rear-deltoid, serratus, rhomboids, rotator-cuff...) | SwiftUI, but `Sources/MuscleMap/Data/*Paths.swift` are plain path strings. Its female neck and trapezius paths are character-for-character the same as the RN package (compared spot checks, not the whole file), so keep the RN copyright notice |
| RepDB/exercise-dataset (found) | Yes, 105 stars (2026-10-18) | Custom "Free Tier" licence: free in apps, **attribution required, no redistribution as a dataset**, no AI derivation | 650 exercises with MET, goals, tags, tips, anatomical muscle ids, 512 px WebP start/peak illustrations | Best schema match for our `exercises` store (MET, class tags). Terms make a public repo containing it risky |
| Snouzy/workout-cool (found) | Yes, 8.6k stars (2026-09-20) | MIT | Prisma schema for exercises/attributes/programs as a reference | Next.js + Postgres, not offline. Exercise media is hosted externally. Not cloned for reuse beyond schema |
| KVRYSV/ascension.fitness.app (found) | Yes, 2 stars (2026-10-15) | All rights reserved, view only | Nothing (idea check only) | A Solo Leveling fitness PWA that confirms the concept is feasible. Its `xpToNext(lv)=floor(60+45*lv^1.45)` shows a flatter curve than our PRD default |

## 2. Which datasets are license-safe to bundle

"Bundle" means shipping the file inside our build output or repo. The app is private for now, but PRD section 0 says the repo may become public, so the safe list is what can survive that.

| Dataset | Bundle in a private build | Bundle in a public repo/app | Why |
| --- | --- | --- | --- |
| yuhonas/free-exercise-db (JSON + 1,746 JPG) | Yes | **Yes** | Unlicense, public domain dedication by the repo owner. Residual risk: the repo owner dedicates the images, but we cannot independently verify the photographer. Upstream `wrkout/exercises.json` makes the same Unlicense claim |
| react-native-body-highlighter SVG paths | Yes | **Yes** (keep MIT notice in `/docs/asset-sources.md` and in the SVG file header) | MIT |
| body-muscles paths | Yes | **Yes** (keep NOTICE, state changes) | Apache-2.0 |
| MuscleMap paths | Yes | Yes (MIT, keep notice) | MIT; same geometry as RN |
| MediaPipe model files + wasm | Yes (we may self-host the `.task` file) | Yes | Apache-2.0 |
| Open Food Facts data | Cache lookups on device | Yes with attribution | ODbL for the database, DbCL for contents. Share-alike applies if we republish a derived database. Per-user on-device cache is fine |
| hasaneyldrm text fields (names, muscles, instructions in 10 languages) | Yes | Yes (MIT) | MIT covers "dataset structure and instruction text". But the names/muscles originate from ExerciseDB v1 whose own terms are unclear, so treat as medium risk |
| hasaneyldrm GIFs and JPG thumbnails | Yes, private only, with "(c) Gym visual" attribution | **No** | NOTICE.md and the MEDIA EXCEPTION in LICENSE: media is Gym visual property, 180x180 only, reuse governed by gymvisual.com terms, "cloning this repo is not a license". Log in `/docs/asset-sources.md` and replace before going public (PRD section 0) |
| ExerciseDB / AscendAPI data and GIFs | No (use only through the live API while testing) | **No** | No data licence in the repo (only an AGPL licence on code that has been removed). Commercial terms at their site |
| RepDB free tier | Only in-app use, with the visible credit "Exercise data by RepDB (repdb.co)" | Risky: term 3 forbids republishing as a dataset, term 5 forbids using images as generative-AI input | Do not commit the JSON/WebP into a public repo. Fine for a private PWA |
| wger exercise API data | Yes with attribution | Only under CC-BY-SA 4 terms | Each exercise row carries a licence (default CC-BY-SA 4, author, title, source URL). Share-alike on adapted data |
| Liftosaur `programs/` and `exercises/` markdown | No | No | AGPL content |
| Habitica art/content | No | No | CC-BY-NC-SA 3.0 |

Rule for B0/R6: the committed exercise bundle is built from free-exercise-db (the license-safe backbone). Everything else lives under `/public/assets/third-party/` with a source URL in `/docs/asset-sources.md` and a tracking issue labelled `blocked` for replacement before any public release.

## 3. wger-project/wger (read at commit 48e02bf)

Files read: `wger/manager/models/{routine,day,slot,slot_entry,abstract_config,session,log}.py`, `wger/manager/config_calculations/calculations.py`, `wger/manager/{dataclasses,consts}.py`, `wger/exercises/models/{base,muscle}.py`, `wger/exercises/fixtures/muscles.json`, `wger/nutrition/models/{ingredient,plan,log,meal_item}.py`, `wger/nutrition/extract_info/off.py`, `wger/nutrition/sync.py`, `wger/measurements/models/*`, `wger/trophies/{README.md,models/trophy.py}`, `wger/utils/{requests,models}.py`, `wger/core/static/images/muscles/`.

### 3.1 Routine model (the most advanced open model of progression)

Hierarchy: `Routine -> Day -> Slot -> SlotEntry`, with progression stored as change rows keyed by iteration.

- `Routine`: `user, name, description, start, end, is_template, is_public, fit_in_week`.
- `Day`: `type` in {custom, enom, amrap, hiit, tabata, edt, rft, afap}, `is_rest`, `need_logs_to_advance` (the routine only moves to the next iteration when logs exist), `config` JSON.
- `Slot`: `order`, `comment`, `config` JSON. A slot is "one position in the day" that can hold several entries (a superset).
- `SlotEntry`: `exercise`, `repetition_unit` (repetitions, till failure, max reps, seconds, minutes), `weight_unit`, `weight_rounding`, `repetition_rounding`, `type`, `comment`, `config`, `class_name` (a Python class can override all logic).
- `SlotEntry.type` set types: `normal, warmup, dropset, myo, partial, forced, tut, iso, jump`.

Progression fields (`PROGRESSION_FIELDS`): `weight, maxweight, repetitions, maxrepetitions, rir, maxrir, rest, maxrest, sets, maxsets`. Each has its own list of `AbstractChangeConfig` rows:

```python
class AbstractChangeConfig:  # one row per (slot_entry, iteration)
    iteration: int            # week/session number the rule takes effect on
    value: Decimal            # the increment (or the replacement value)
    operation: '+' | '-' | 'r'    # plus, minus, replace
    step: 'abs' | 'percent' | 'na'
    repeat: bool              # keeps applying every following iteration
    requirements: JSON        # {'rules': ['weight','repetitions','rir','rest','max_weight','max_repetitions'], 'all_sets': bool}
```

Evaluation (`slot_entry.py`, `_apply_config_value` and `_WalkState`):

```python
if config.replace: out = config.value
else:
    step = config.value if config.step == ABSOLUTE else out * config.value / 100
    out = out + step if config.operation == PLUS else out - step
out = min(out, max_value)        # clamp, e.g. weight 9999.99, RiR 9.5
```

A non-repeating config that has `requirements` stays "armed" until a logged session meets the rules (for example "all prescribed sets at the top of the rep range" with `all_sets: true`, which is wger's strict double progression). Iteration 1 is always forced to `replace`.

Logs: `WorkoutLog` has `weight/weight_target`, `repetitions/repetitions_target`, `rir/rir_target`, `rest/rest_target`, `slot_entry`, `iteration`, `session`, units. `WorkoutSession` has `impression` (bad/neutral/good), `datetime_start/end`, `notes`. Targets are stored beside actuals, so adherence is computable.

Trophies (`wger/trophies`): types `time, volume, count, sequence, date, pr, other`; flags `is_hidden, is_progressive, is_repeatable`; a `checker_class` plus `checker_params` JSON (example `{'count': 10}`); a denormalised `user_statistics` table so evaluation is cheap. This maps directly to our titles (we need 60+) and hidden quests.

Measurements: `Category(name, unit, metric_type, chart_type, chart_config, order, is_official, dynamic_type, dynamic_params)` and `Measurement(category, date, value, notes, source, external_id, extra_data)`. Measurement categories are user data, not hard-coded columns.

Nutrition: `Ingredient` stores per-100 g `energy (kcal int), protein, carbohydrates, carbohydrates_sugar, fat, fat_saturated, fiber, sodium`, plus `code` (barcode), `remote_id`, `source_name`, `brand`, `is_vegan`, `is_vegetarian`, `nutriscore`, `language`, licence TASL fields. `NutritionPlan` has `goal_energy/protein/carbohydrates/fiber/fat`. `LogItem(plan, meal, ingredient, weight_unit, amount, datetime)` is the diary row.

wger's Open Food Facts mapping (`extract_info/off.py`) is the best short recipe we have:

```python
OFF_REQUIRED_NUTRIMENTS = ['proteins_100g', 'carbohydrates_100g', 'fat_100g']
energy = nutriments['energy-kcal_100g'] if present else nutriments['energy-kj_100g'] / KJ_PER_KCAL
is_vegan / is_vegetarian from ingredients_analysis_tags: en:vegan, en:non-vegan, en:vegetarian, en:non-vegetarian ("maybe" and "unknown" -> null)
nutriscore from nutrition_grades in a..e
serving_size parsed with regexes into (grams, unit, amount)
user agent: f'wger/{version} - https://github.com/wger-project'
```

Muscle assets: wger has 15 muscles (ids 1 to 16, `is_front` flag, `name_en` friendly name, e.g. "Biceps brachii" -> "Biceps", "Anterior deltoid" -> "Shoulders") and per-muscle overlay SVGs `images/muscles/main/muscle-N.svg` plus `secondary/` variants over a front/back base (`muscular_system_front.svg`, `_back.svg`, from Wikimedia Commons `Muscular_system.svg`). The 200x362 Inkscape SVGs are low fidelity compared with the RN paths.

### 3.2 What wger teaches us

1. Store progression as data per slot/iteration, not as code. Our Dexie `planExercises` needs `progressionState` JSON plus the engine rule id.
2. Store target next to actual in every set row (`weightTarget`, `repsTarget`, `rirTarget`). That makes adherence and the AI report easy.
3. `need_logs_to_advance` is a good rule for us: a week only counts toward a Dungeon floor when sets were logged.
4. Keep units on the row (weight unit, repetition unit) and rounding per entry (plate rounding).

## 4. astashov/liftosaur (read at commit ba0cfbe)

Files read: `docs/features/progressions.md`, `docs/content/liftoscript.md`, `src/pages/planner/models/plannerProgramExercise.ts` (the scripts for lp/dp/sum are generated there), `src/pages/planner/plannerExerciseEvaluator.ts`, `src/types.ts` (ISet, IHistoryEntry, IProgramState), `src/models/exercise.ts` (synergist multipliers), `src/models/settings.ts`, `src/models/muscle.ts`, `programs/builtin/gzclp.md`.

### 4.1 How state per exercise is stored

There is no separate progression table. The program is text (Liftoscript), one line per exercise, and the state variables live inside the `progress:` call:

```
Bench Press / 3x5 / 155lb / progress: lp(5lb)
Squat / 3x8 / progress: lp(5lb, 2, 0, 10lb, 3)
Bent Over Row / 3x8-12 / 115lb / progress: dp(5lb, 8, 12)
Bench Press / 3x10+ / progress: sum(30, 5lb)
Overhead Press / 3x5+ / 85lb / progress: custom(increment: 5lb) {~ ... ~}
```

After the workout the app rewrites the text (`155lb` becomes `160lb`), so the program line is both the plan and the state. Each logged `IHistoryEntry` keeps a snapshot: `state`, `vars`, `progressSnapshot: {diffState, diffVars, prints}`, `isSuppressed` (user pressed "Suppress" to skip the progression once). A set (`ISet`) carries `reps, minReps, weight, rpe, isAmrap, timer, isCompleted, completedReps, completedWeight, completedRpe, label`.

For us: keep the plan row plus a `progressState` object per `planExercise` (`{successCounter, failureCounter, ...}`) and write an immutable `progressSnapshot` onto each logged exercise entry so the progression can be recomputed or undone (this matches our append-only XP ledger idea).

### 4.2 The three built-in progressions (actual semantics, from the generated scripts)

Linear `lp(increment, successes=1, successCounter=0, decrement=0, failures, failureCounter=0)`:

```
for each set i: if weights[i]==0 and completedWeights[i]!=0: weights[i]=completedWeights[i]   # adopt logged weight
if completedReps >= reps and completedRPE <= RPE:          # every set hit its target
    state.successCounter += 1
    if state.successCounter >= state.successes:
        weights[i] = completedWeights[i] + state.increment   # from what was LIFTED, not what was planned
        successCounter = 0; failureCounter = 0
if state.decrement > 0 and state.failures > 0:
    if not (completedReps >= minReps and completedRPE <= RPE):  # fell below the minimum
        failureCounter += 1
        if failureCounter >= state.failures: weights -= decrement; counters = 0
```

Key points we copy: success is judged against the target reps and the target RPE together; the new weight is built from the completed weight; `increment` can be a percentage; failure only counts when below `minReps` (so a "3x5" that did 4 4 4 is a stall, not necessarily a failure).

Double `dp(increment, minReps, maxReps)`:

```
if completedReps >= reps and completedRPE <= RPE:
    if completedReps >= state.maxReps:
        reps = state.minReps
        weights[i] = completedWeights[i] + state.increment      # reset reps, add weight
    else:
        reps[i] = min(completedReps[i] + 1, state.maxReps)     # reps climb by 1 per session
```

The `dp` range variant (`3x8-12`) raises `minReps` per set (`minReps[i] = min(completedReps[i]+1, reps[i])`) until all sets reach the top, then adds weight. This is exactly the PRD's Tank rule.

Sum of reps `sum(totalReps, increment)`: add weight when `sum(completedReps) >= state.reps`. Good for AMRAP finishers (Fighter back-off sets).

Custom: `progress: custom(state vars) {~ script ~}` with `weights, reps, minReps, RPE, timers, numberOfSets, rm1` assignable, `completedReps[ns]`, `completedWeights`, `state.*`, `for (var.i in completedReps)`. Variables ending in `+` prompt the user after the last set. A second hook `update: custom()` runs before the first set and after every completed set (`setIndex`) to change sets of the current workout only (for example "if set 2 hit target, add a 4th set").

Other details worth stealing: per-exercise `progress: none` on deload days; `Suppress` once; `Exercise Changes` preview under the sets showing exactly what the rule will do (we should show "Next time: 62.5 kg" in the summary); `settings.planner.synergistMultiplier = 0.5` (a synergist muscle counts as half a set in the volume stats); `screenMuscles` (11 groups: shoulders, triceps, back, abs, glutes, hamstrings, quadriceps, chest, biceps, calves, forearms) are the display groups over a finer internal muscle list.

### 4.3 Mapping to our classes

| Our class | Liftosaur equivalent | Our engine rule |
| --- | --- | --- |
| Fighter | `lp(2.5kg or 5kg, 1, 0, decrement, 2)` with AMRAP last set | success needs every set at top of 3-6 range and RIR 1-2 (RIR maps to `completedRPE <= RPE`, with RPE = 10 - RIR); fail twice at `minReps` then drop 10% |
| Tank | `dp(inc, 6, 12)` | double progression as above |
| Assassin | `custom` (reps, then shorter `timers`) | add reps up to 20, then cut rest by 15 s; rest is a progressed field exactly as in wger (`rest`, `maxrest`) |
| Ranger | `custom` with state `day: 0..2` rotating heavy/medium/light | wger-style per-iteration config rows or one state counter |
| Healer | `custom` on seconds | progress hold seconds, then range, then tempo |

## 5. hasaneyldrm/exercises-dataset (read at commit on 2026-07-16)

Path: `data/exercises.json` (17 MB), `data/exercises.schema.json`, `images/` (12 MB, 1,324 JPG), `videos/` (127 MB, 1,324 GIF, mean 95 KB, max 227 KB, all 180x180), `NOTICE.md`, `LICENSE` (MIT plus MEDIA EXCEPTION).

Real field list (15): `id` ("0001" zero padded), `name`, `category` (= body part), `body_part`, `equipment`, `instructions` {10 languages, one string}, `instruction_steps` {10 languages, string[]}, `muscle_group`, `secondary_muscles` (string[]), `target`, `image`, `gif_url`, `media_id`, `created_at`, `attribution`. Note `muscle_group` is a single STRING (for example "hip flexors"), not an array.

Sample record (trimmed):

```json
{ "id": "0001", "name": "3/4 sit-up", "category": "waist", "body_part": "waist",
  "equipment": "body weight", "muscle_group": "hip flexors",
  "secondary_muscles": ["hip flexors", "lower back"], "target": "abs",
  "instruction_steps": {"en": ["Lie flat on your back with your knees bent...", "..."], "es": ["..."]},
  "image": "images/0001-2gPfomN.jpg", "gif_url": "videos/0001-2gPfomN.gif", "media_id": "2gPfomN",
  "attribution": "(c) Gym visual - https://gymvisual.com/" }
```

Counts: body_part 10 values (upper arms 292, upper legs 227, back 203, waist 169, chest 163, shoulders 143, lower legs 59, lower arms 37, cardio 29, neck 2); equipment 28 values (body weight 325, dumbbell 294, cable 157, barbell 154, leverage machine 81, band 54, smith machine 48, kettlebell 41, weighted 36, stability ball 28, ...); target 19 values (abs 169, pectorals 158, biceps 151, glutes 144, delts 143, triceps 141, upper back 88, lats 81, calves 59, quads 44, forearms 37, cardiovascular system 29, hamstrings 28, spine 19, traps 15, ...). Every record has English step arrays. Weak points: no difficulty, no force/mechanic, no MET, no tips or mistakes, no female variant, the `muscle_group` vocabulary mixes synonyms (trapezius vs traps, deltoids vs shoulders, lats vs latissimus dorsi), and only 180x180 media.

Hosting: media is local files in the repo. We would copy GIFs into `/public/assets/third-party/gymvisual/` (127 MB raw; converting to animated WebP/MP4 per PRD F0 should cut roughly 50-70%, to be measured in M2) or lazy cache them with the service worker.

Verdict: the largest set with an animation per exercise, so it is the right source for the private build. Its media cannot be redistributed, and it must be replaced or relicensed before the repo is public.

## 6. ExerciseDB/exercisedb-api (read the repo, plus called the live free API)

The repo now contains only `README.md` and `LICENSE` (AGPL-3.0; the server code was removed, last commit "Update LICENSE"). The product is now AscendAPI (formerly ExerciseDB). README claims 11,000+ exercises, 15,000+ videos, 20,000+ images, 5,000+ GIFs, male and female visuals, variations and tips (paid tiers).

V2 schema (from the README sample):

```json
{ "exerciseId": "exr_41n2hZZdH9uyYFGZ", "name": "Lever Pec Deck Fly", "imageUrl": "...png",
  "equipments": ["LEVERAGE MACHINE"], "bodyParts": ["CHEST"], "gender": "male",
  "exerciseType": "STRENGTH",
  "targetMuscles": ["Pectoralis Major Clavicular Head"],
  "secondaryMuscles": ["Deltoid Anterior", "Pectoralis Major Clavicular Head"],
  "videoUrl": "...mp4", "keywords": ["..."], "overview": "...",
  "instructions": ["..."], "exerciseTips": ["..."],
  "variations": ["Cable Crossover: Uses a cable machine for constant tension..."],
  "relatedExerciseIds": ["exr_41n2hp76bAhGHCxj", "..."] }
```

Free V1 API, tested live on 2026-10-23 (no key): `GET https://oss.exercisedb.dev/api/v1/exercises?limit=1` returns `meta {total: 1500, nextCursor}` and records `{exerciseId, name, gifUrl, bodyParts[], equipments[], targetMuscles[], secondaryMuscles[], instructions[]}`; response has `Access-Control-Allow-Origin: *`; a GIF (`static.exercisedb.dev/media/01qpYSe.gif`) is 67 KB. `GET /api/v1/bodyparts` returns the same 10 body parts as hasaneyldrm (neck, lower arms, shoulders, cardio, upper arms, chest, lower legs, back, upper legs, waist). No data licence is published, and the paid tiers show the owners sell the same content, so we do not bundle it.

What we take: the schema ideas `variations`, `relatedExerciseIds` (our `swap group`), `exerciseTips`, `gender` (a male and female media variant), `exerciseType`.

## 7. AshenKeep/Magni (read `backend/app/models/models.py`, `services/*`, `api/routes/{templates,workouts}.py`)

- `Exercise`: `name, muscle_group (primary category), muscle_groups (JSON array of ALL categories), secondary_muscles (JSON), equipment, instructions, gif_url, video_url, source ("ascendapi" | "workoutx" | "manual"), ascendapi_id, workoutx_id` (external ids used for de-duplication).
- `WorkoutSet`: `log_type` strength | cardio | mobility selects which columns matter. Strength: `reps, weight_kg`. Cardio (opt-in fields): `duration_seconds, distance_m, pace_seconds_per_km, incline_pct, laps, avg_heart_rate, calories`. Common: `is_done, rpe, notes, client_id` (unique, for idempotent offline sync).
- `Template -> TemplateExercise -> TemplateSet`, where each set has its own `log_type` and `target_*` columns (set 1 can be 5 km, set 3 can be strength reps).
- `save_workout_as_template`: groups a finished workout's sets by `exercise_id` in order of first appearance, creates a `TemplateExercise` per exercise and a `TemplateSet` per logged set copying `reps/weight/duration/...` into `target_*`. That is the whole algorithm, about 30 lines. Our "saved meals" and "repeat last workout" features should work the same way.
- Seeding: `SeedLog(mode: metadata_only | with_gifs | download_gifs, status, added, skipped, gifs_downloaded, log_output)`. Quota awareness: AscendAPI free is 2,000 requests/month, WorkoutX free is 500/month (10 requests per body part with `limit=10`; Basic tier `limit=100`).
- `muscle_mapping.py`: one table `MUSCLE_TO_CATEGORY` mapping about 80 raw muscle/body-part strings (pectorals, lats, delts, quads, "upper arms", ...) onto 9 UI categories (Chest, Back, Shoulders, Biceps, Triceps, Legs, Core, Cardio, Other); an exercise can map to several categories and the first hit (target muscle) becomes primary. Known flaw we avoid: it maps "forearms" and generic "upper arms" to Biceps.

## 8. yuhonas/free-exercise-db (read `dist/exercises.json`, `schema.json`, `README.md`)

- 876 exercises in `dist/exercises.json` (the README says "800+"), one JSON per exercise in `exercises/<Id>.json`, images in `exercises/<Id>/0.jpg` and `1.jpg`. 1,746 JPG files, 850x567 px, about 55 KB each (about 100 MB total; 3 exercises have no images). Hosted path pattern: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<images[i]>`.
- Fields (11): `id` (e.g. `Alternate_Incline_Dumbbell_Curl`), `name`, `force` (push 371, pull 371, static 104, null 30), `level` (beginner 525, intermediate 294, expert 57), `mechanic` (compound 491, isolation 298, null 87), `equipment` (barbell 170, dumbbell 123, other 122, body only 111, cable 81, null 77, machine 67, kettlebells 56, bands 20, medicine ball 17, exercise ball 12, foam roll 11, e-z curl bar 9), `primaryMuscles[]`, `secondaryMuscles[]`, `instructions[]` (array of paragraphs, often with "Tip:" text inside), `category` (strength 584, stretching 123, plyometrics 61, powerlifting 38, olympic weightlifting 35, strongman 21, cardio 14), `images[]`.
- Exactly 17 muscle names: abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps. Primary muscle counts: quadriceps 148, shoulders 129, abdominals 93, chest 84, hamstrings 79, triceps 73, biceps 53, lats 38, middle back 34, calves 28, lower back 27, forearms 25, glutes 22, traps 15, adductors 13, neck 8, abductors 8.
- Licence: `LICENSE.md` = Unlicense. Source lineage: `wrkout/exercises.json` (also Unlicense, confirmed with the GitHub API).
- Weak points: no animation, no tips/mistakes fields, 17 coarse muscles (no rear delts, upper/lower chest, rhomboids), `equipment: null` for 77 rows (mostly bodyweight/stretches), no MET.

## 9. Body map: react-body-highlighter vs alternatives (read the code)

react-body-highlighter 2.0.5 (`giavinh79`, MIT):
- Storage: `src/assets/index.ts` exports `anteriorData` and `posteriorData` as arrays `{muscle, svgPoints: string[]}`. Each muscle is one or more `<polygon points="...">` in one `viewBox="0 0 1000 2000"` (`src/component/Model.tsx`). Click handler returns `{muscle, data:{exercises[], frequency}}`; fill uses `highlightedColors[frequency-1]`.
- Muscle ids (22): trapezius, upper-back, lower-back, chest, biceps, triceps, forearm, back-deltoids, front-deltoids, abs, obliques, adductor, abductors, hamstring, quadriceps, calves, gluteal, head, neck, knees, left-soleus, right-soleus.
- No female model. Polygons have 6-20 points, so shapes are rough. The README states they were taken from react-native-body-highlighter.

react-native-body-highlighter (`HichamELBSI`, MIT, 297 stars): `assets/bodyFront.ts, bodyBack.ts, bodyFemaleFront.ts, bodyFemaleBack.ts` (22-33 KB each). Format:

```ts
{ slug: "neck", color: "#454545",
  path: { common: ["m 332.05,262.18 c -0.78,8.99 ..."],   // one path for the whole muscle
          left:   ["m 290.15,290.93 ..."],                  // one path per side, so left/right are separately selectable
          right:  ["m 328.11,315.98 ..."] } }
```

Plus a separate full-body outline path per sex/side in `SvgMaleWrapper.tsx`/`SvgFemaleWrapper.tsx` (viewBox male `0 0 724 1448` front and `724 0 724 1448` back; female `-50 -40 734 1538` front and `756 0 774 1448` back). Slugs: male front 19 (chest, obliques, abs, biceps, triceps, neck, trapezius, deltoids, adductors, quadriceps, knees, tibialis, calves, forearm, hands, ankles, feet, head, hair), male back 16 (neck, trapezius, deltoids, upper-back, triceps, lower-back, forearm, gluteal, adductors, hamstring, calves, ankles, feet, hands, head, hair), female front 19, female back 14. **This is the only MIT source with a real female figure in true vector paths.**

Gaps versus our needs (our exercise datasets use lats, middle back, rear delts, upper/lower chest, serratus, rhomboids, hip flexors, glute medius): no lats (merged into `upper-back`), no rear delt (merged into `deltoids`), no serratus, no hip flexors, no rhomboids. MuscleMap (MIT) adds sub-groups on the same geometry (upper-chest, lower-chest, inner/outer-quad, upper/lower-abs, front/rear-deltoid, upper/lower-trapezius, rotator-cuff, serratus, rhomboids, hip-flexors), but as hierarchy labels over the same paths, not new geometry.

body-muscles (`vulovix`, Apache-2.0): 40 front and 49 back regions, each `{id, name, path, view}` with left/right ids (`biceps-left`, `chest-upper-right`, `abs-lower-left`, `serratus-anterior-left`, `lats-upper/mid/lower`, `traps-upper/mid/lower`, `deltoid-rear`, `gluteus-medius/maximus`, `hamstrings-medial/lateral`, `calves-gastroc-medial/lateral`, `calves-soleus`, `lower-back-erectors/ql`). The API takes `bodyState: {id: {intensity: 0..10, selected}}`. Male-neutral only, viewBox about 35 units wide.

Decision (evaluate reuse vs own SVG): do not depend on the npm package react-body-highlighter. Build our own `BodyMap` component and our own SVG asset pipeline that starts from the MIT react-native-body-highlighter paths (male and female, front and back, with left/right), and:
1. Convert each `assets/body*.ts` once with a `/data` script into four static SVG files, `<path id="muscle-<id>-<side>">` per region, plus an outline path. This keeps muscles as DOM elements so CSS (glow filters, recovery heatmap fill via CSS variables, flip animation) applies, which is better than Canvas.
2. Define our own muscle id list (about 30) and a table that maps our ids to the dataset muscle names of free-exercise-db / hasaneyldrm / RepDB.
3. Add the missing regions (lats, rear delts, serratus, rhomboids, upper/lower chest, hip flexors) as new hand-drawn paths split from the existing `upper-back`, `deltoids`, `chest`, `abs` regions, using the body-muscles region layout as a visual guide. This is the one design task that needs an artist's pass (log it as a `design` issue for M2).
4. Restyle in the System look (blue holographic outline, purple/red recovery fills), keep MIT attribution text in `/docs/asset-sources.md`.

## 10. Google MediaPipe PoseLandmarker on the web (read `mediapipe-samples-web/src/workers/pose-landmarker.worker.ts`, `src/tasks/pose-landmarker.ts`, `src/components/base-vision-task.ts`, `base-worker.ts`, and `mediapipe/tasks/web/vision/pose_landmarker/*`, `tasks/cc/.../pose_landmarks_connections.h`)

Package: `@mediapipe/tasks-vision` 1.1.1 (Apache-2.0, 42 MB unpacked, wasm files under `node_modules/@mediapipe/tasks-vision/wasm/`). Models (float16, all served with `Access-Control-Allow-Origin: *` from Google Cloud Storage, so we can self-host them to stay offline):

| Model | URL tail | Size |
| --- | --- | --- |
| lite | `pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task` | 5.78 MB |
| full | `pose_landmarker_full/float16/1/pose_landmarker_full.task` | 9.40 MB |
| heavy | `pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task` | 30.66 MB |

Usage pattern from the official sample (they run it in a Web Worker and send `ImageBitmap`s):

```ts
const vision = await FilesetResolver.forVisionTasks(wasmPath);           // wasm folder self-hosted
const landmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: { modelAssetBuffer: new Uint8Array(modelBuffer),            // or modelAssetPath
                 delegate: 'GPU' },                                        // 'CPU' | 'GPU' only
  runningMode: 'VIDEO',                                                    // 'IMAGE' | 'VIDEO'
  numPoses: 1,
  minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  outputSegmentationMasks: false });
// per frame, only when video.currentTime changed:
const bmp = await createImageBitmap(video);
const result = landmarker.detectForVideo(bmp, timestampMs);   // timestamps must strictly increase
bmp.close();
// result.landmarks[0][i] = {x, y, z, visibility} normalised 0..1; result.worldLandmarks[0][i] in metres
```

The sample falls back to CPU when GPU init fails ("GPU unavailable. Using CPU delegate"), and it forces `timestampMs = max(now, last + 1)`. Camera: `getUserMedia({video: true})`; we should request `{facingMode: 'user' | 'environment', width: 640, height: 480}` on iPhone and test (iOS needs `playsinline muted` on the video element).

The 33 landmark indices (verified against `pose_landmarks_connections.h`): 0 nose, 1/2/3 left eye inner/eye/outer, 4/5/6 right eye inner/eye/outer, 7 left ear, 8 right ear, 9 mouth left, 10 mouth right, 11 left shoulder, 12 right shoulder, 13 left elbow, 14 right elbow, 15 left wrist, 16 right wrist, 17/19/21 left pinky/index/thumb, 18/20/22 right pinky/index/thumb, 23 left hip, 24 right hip, 25 left knee, 26 right knee, 27 left ankle, 28 right ankle, 29 left heel, 30 right heel, 31 left foot index, 32 right foot index. `PoseLandmarker.POSE_CONNECTIONS` has 35 pairs for drawing the skeleton, and `DrawingUtils` draws it on a canvas.

Joint angles for our form analyser need only indices: knee angle = (23,25,27) or (24,26,28); hip angle = (11,23,25); elbow angle = (11,13,15); back angle = vector (23->11) against vertical; knee valgus = knee x relative to the ankle-hip line in the frontal plane. Use `worldLandmarks` for angles (metric, less perspective distortion) and `visibility` to skip frames where a joint is under 0.5.

Open items for R7 (not verifiable here): actual FPS of the lite model with the GPU delegate on iPhone Safari, and whether WebGL2 GPU delegate works in a standalone home-screen PWA. Our recommendation is to default to `lite` + GPU, auto fall back to CPU, and cap inference at 15-20 fps (run on every second video frame).

## 11. Open Food Facts (read the official API docs, `openfoodfacts-js` source, wger's importer; called the live API)

Live test, 2026-10-23, `GET https://world.openfoodfacts.org/api/v2/product/3017620422003?fields=code,product_name,brands,serving_size,serving_quantity,nutriments,nutrition_grades,ingredients_analysis_tags`: HTTP 200, `Access-Control-Allow-Origin: *`, allowed headers include `User-Agent` and `X-User-Agent`, `Access-Control-Max-Age: 1728000`. The `fields` parameter works and cuts the payload.

Response shape (trimmed to the fields we need):

```json
{ "code": "3017620422003", "status": 1, "status_verbose": "product found",
  "product": { "product_name": "Nutella", "brands": "Nutella, Ferrero", "nutrition_grades": "e",
    "ingredients_analysis_tags": ["en:palm-oil", "en:maybe-vegan", "en:vegetarian"],
    "nutriments": { "energy-kcal_100g": 539, "energy-kj_100g": 2252,
      "proteins_100g": 6.3, "carbohydrates_100g": 57.5, "sugars_100g": 56.3,
      "fat_100g": 30.9, "saturated-fat_100g": 10.6, "fiber_100g": 0, "sodium_100g": 0.0428, "salt_100g": 0.107 } } }
```

Rules to implement (confirmed by wger's importer): per-100 g fields end in `_100g`; prefer `energy-kcal_100g`, else `energy-kj_100g / 4.184`; reject a product missing proteins/carbs/fat; names come from `product_name`, else `product_name_<lang>`, else `product_name_en`; `serving_size` is free text ("30 g", "1 slice (25 g)") that needs a regex to grams; vegan/vegetarian only from `ingredients_analysis_tags` (`en:vegan`, `en:non-vegan`, `en:vegetarian`, `en:non-vegetarian`; treat "maybe"/"unknown" as unknown).

Rate limits (from the API docs page, read 2026-10-23): 15 req/min/IP for product reads, 10 req/min/IP for search ("do not use it for search-as-you-type"), per-user when the requests come from the user's own device (our case), global 503s possible, and bulk use should go through the CSV/JSONL dump. A live search call during this research returned an HTML "Page temporarily unavailable" page, so search must be treated as unreliable: cache every lookup in Dexie `foods` and degrade gracefully.

User agent: the docs require a custom `AppName/Version (ContactEmail)` User-Agent. Browsers do not let JS reliably set `User-Agent` (Safari ignores it), so we should send the allowed `X-User-Agent`-style identification only if the server accepts it and otherwise rely on per-user IP limits. Unverified. A follow-up for R7: test from Safari, and if blocked, route barcode lookups through our existing Cloudflare Worker with the proper User-Agent (that Worker already exists for push, no extra cost).

SDK: `@openfoodfacts/openfoodfacts-nodejs` 2.0.0-alpha.35 (Apache-2.0) wraps fetch and sets `User-Agent` itself (`src/off.ts`); it is alpha and heavy for two endpoints. Use plain `fetch` with a typed `Product` pick.

Licence duties: ODbL database (attribution "Open Food Facts contributors", share-alike for derived databases), DbCL for contents, CC-BY-SA for images (we do not store images).

## 12. HabitRPG/habitica (read `website/common/script/{statHelpers.js,constants.js,fns/{randomDrop,crit,updateStats}.js,ops/scoreTask.js}`, `website/server/libs/cron.js`, `website/server/models/group.js`, `website/common/script/content/quests/*`)

### 12.1 XP to next level (`statHelpers.js`)

```js
export function toNextLevel (lvl) {            // "tnl"
  if (lvl < 5) return 25 * lvl;
  if (lvl === 5) return 150;
  return Math.round(((lvl ** 2) * 0.25 + 10 * lvl + 139.75) / 10) * 10;
}
export function diminishingReturns (bonus, max, halfway = max / 2) {
  return max * (bonus / (bonus + halfway));    // hyperbola, never reaches max
}
```
`MAX_HEALTH = 50`, `MAX_LEVEL = 100` (stats cap), hard cap 9999. Levelling loop (`updateStats.js`): while `exp >= tnl(lvl)`: subtract, `lvl++`, **HP is restored to full on every level-up**, stat points = `lvl - allocated`.

Curve comparison that matters for our PRD ("level 10 in about 3 weeks, level 50 in about a year"), computed from the formulas:

| Curve | XP at L10 | XP at L50 | Cumulative to L10 | to L30 | to L50 |
| --- | --- | --- | --- | --- | --- |
| Habitica `tnl` | 260 | 1,260 | 1,320 | 10,080 | 28,740 |
| PRD default `round(100*L^1.5)` | 3,162 | 35,355 | 11,106 | 189,029 | 689,513 |
| ascension.fitness.app `60+45*L^1.45` | 1,328 | 13,143 | 5,092 | 75,016 | 263,413 |

At about 3 weeks to L10 the PRD curve needs about 530 XP/day, and about 1,900 XP/day on average for L50 in a year. That is workable only if XP per workout is in the hundreds to thousands; the XP ledger values in `/docs/game-design.md` and this curve must be tuned together (add a simulation test: a consistent user reaches L10 at day 18-24 and L50 at day 330-400).

### 12.2 Task scoring (`scoreTask.js`): the value/delta system

Each task has a `value` clamped to [-47.27, 21.27]. Completing it moves the value by `delta = 0.9747 ** value` (so reward shrinks as you get "bluer" and grows when you were "red", with a floor and ceiling), direction up for done and down for missed:

```js
nextDelta = (0.9747 ** clamp(task.value)) * (direction === 'down' ? -1 : 1);
// reward per completed task
exp += Math.round(delta * (1 + int * 0.025) * task.priority * crit * 6);   // INT = +2.5% XP per point
gold += ceil(delta * task.priority * crit * (1 + per * 0.02));             // PER = +2% gold per point
// streak bonus on gold: * (1 + streak / 100), minimum +1
// penalty for a missed due Daily (cron)
hpMod = delta * (1 - con / 250) * task.priority * 2;   // CON reduces HP loss, floor 10%; if hpMod > -1 then hp -= 1
```
Task `priority` values: 0.1 trivial, 1 easy, 1.5 medium, 2 hard. Crit (`fns/crit.js`): `chance = 0.03 * (1 + str/100)`, multiplier `1.5 + 4*str/(str+200)`.

For us: adopt the value/delta idea for DAILY QUEST streak "heat" (rewards diminish when everything is easy, grow after a miss) but never remove XP (PRD safety rule). We use it only to scale XP and gold, not to deal damage to the Player.

### 12.3 Drops (`fns/randomDrop.js`)

```js
chance = min(|task.value - 21.27|, 37.5) / 150 + 0.02
chance *= task.priority
        * (1 + max(0, 80 - 5*lvl) / 100)       // +75% drops for new users, fading 5% per level
        * (1 + task.streak / 100)              // +1% per streak day
        * (1 + per / 100)                      // PER stat
        * crit * (1 + 0.5 * checklistDone)
chance = diminishingReturns(chance, 0.75);     // hard asymptote at 75%
maxDropCount/day = 5 + floor(per/25)           // daily cap, prevents grinding
rarity roll: >0.6 food (40%); >0.3 egg (30%); else potion by tier: <0.02 very rare, <0.09 rare, <0.18 uncommon, else common
```
Shape we adopt for loot after a workout: base chance by effort, new-player bonus that fades with level, streak bonus, asymptotic cap (`diminishingReturns`), a daily drop cap (also a safety valve), and a single `rarity` roll against fixed thresholds (Common 60 / Rare 25 / Epic 12 / Legendary 3, tuned in game-design). A "first drops" guarantee exists (the first drop is forced) so new users see loot immediately.

### 12.4 Quests, bosses, damage (`group.js` `_processBossQuest`, `cron.js`, `scoreTask.js`)

- Boss quest data (`content/quests/*.js`): `boss: {name, hp, str, def, rage?}`, `drop: {items, gp, exp}`, `lvl` gate, `category`. Example `vice1`: `hp: 750, str: 1.5`, level 30, drops 20 gold, 100 exp and the next quest. World boss: `hp: 20,000,000`.
- Player damage to the boss: every completed task adds `quest.progress.up += ceil(delta * crit * (1 + str/200))` for todos and dailies, and `(0.5 + str/400)` for habits. Boss HP -= party progress.
- Boss damage to players: when a due Daily is missed at cron, `progress.down += delta * min(priority, 1)` (medium/hard do not increase boss damage, a documented "accident"), and every party member loses `progress.down * boss.str` HP. Boss with `rage` meter: when `progress.rage >= rage.value` the boss does a special effect (heal, shop damage).
- Perfect day (`cron.js`): if all due dailies done, `achievements.perfect += 1` and a temporary buff of `ceil(lvl/2)` to STR/INT/PER/CON for the day. This is the model for our "Recovery Phase bonus VIT".
- Streak achievement: every 21-day multiple. Streak freeze equals sleep mode (`user.preferences.sleep` pauses damage).

Mapping to Shadow System: a Dungeon floor is a quest, the Boss Raid is a boss with `hp` in "e1RM volume points". Player damage = XP of the set effort score scaled by STR stat, boss never damages the Player (we remove `down`), instead a missed day adds "rage" that heals the boss slightly (rage meter = the Penalty Zone in the PRD). This keeps the tension without removing XP.

## 13. GitHub search results (queries run 2026-10-23, via `gh search repos`)

Queries: "workout tracker pwa", "muscle map svg" (and variants: "muscle svg", "muscle-map", "body-highlighter", "anatomy svg"), "rep counter mediapipe" ("rep counter pose", "pose-landmarker fitness"), "solo leveling ui" ("solo leveling fitness"), "rpg habit tracker", "body map svg female muscles", "gamified fitness", "exercise-database", "hevy csv". Most hits are 0-5 star hobby repos; the useful ones are in the summary table. Others worth knowing, not cloned:

| Repo | Licence | Why it matters |
| --- | --- | --- |
| christianphilie/gymtracker | none stated | React + TypeScript + Tailwind + Dexie workout PWA, same stack as ours; not reusable (no licence) |
| bndct-devops/lifty | MIT | Self-hosted PWA with rest timer, themes, analytics (4 stars) |
| mortennordbye/logeverylift | Apache-2.0 | Mobile-first logging PWA (Next.js + Postgres) |
| Kieran4036/workout-log-pwa | none | PWA with 302 exercise illustrations |
| Aamina04/gym-rep-counter-pose-estimation, AdeshJP/rep-counter | none | MediaPipe rep counters (Python); angle-threshold two-state counters, nothing we cannot write in 30 lines of TS |
| kimgt0128/health-trainer | none | pose-landmark posture MVP (Android) |
| KVRYSV/ascension.fitness.app, Arezki-Cherfouh/Solo-Leveling-Fitness, vikash1630/Solo-Levelling-Fitness-Model-App, DAKSH3521/solo-leveling-rpg | all rights reserved / none | Confirm that Solo Leveling fitness PWAs exist; none has real recovery/progression engines. ascension has a stall check (3 flat sessions, same as our plateau rule), HAMR test cardio, phase planner and shadow army |
| ARTESHMAN/habit-tracker, Jeevan-0508/hakai-protocol-v2, makisacik/RPG-Habit-Tracker-Swift | none / other / none | Client-side RPG habit trackers; no better formulas than Habitica |
| MuscleMap/MuscleMap (146 stars) | MIT | Unrelated (MRI quantification), name clash. Ignore |
| haplollc/MuscleMapKit | other | 3D muscle map for iOS, not usable on web |
| wrkout/exercises.json | Unlicense | Upstream of free-exercise-db, 2,500+ exercises are only in the commercial wrkout.xyz set |
| davejt/exercise (162 stars) | none | Exercise API, not verified |
| Hevy/Strong CSV parsers (vierimaa/apollosight, hossein-jazayeri/hevy2fit) | none | Useful only as sample column names for the Hevy importer (B0 requires real export samples, which are in the competitors note) |

## 14. Schema decisions this research supports (for R6 and B2)

`exercises` store merged fields (and which source feeds each):

| Our field | Source |
| --- | --- |
| `id` (our slug) | free-exercise-db `id` when present, else `hdr-<id>` from hasaneyldrm |
| `name`, `aliases` | free-exercise-db `name` + hasaneyldrm `name` + RepDB `name_en` as aliases |
| `primaryMuscles[]`, `secondaryMuscles[]` | normalised to OUR muscle ids (about 30) through one mapping table, as Magni does with `MUSCLE_TO_CATEGORY`, but one-to-one on anatomy rather than category lumping |
| `equipment[]`, `difficulty` (`level`), `mechanic`, `force`, `category` | free-exercise-db |
| `media` | `{ stills: free-exercise-db images (public domain), gif: hasaneyldrm gif (private build, third-party flag) }` |
| `instructions[]` | hasaneyldrm `instruction_steps.en` (clean arrays) or free-exercise-db `instructions` (paragraphs) |
| `tips[]`, `mistakes[]` | RepDB `tips_en` where matched, else written by us (the PRD requires common mistakes for key lifts) |
| `met` | RepDB `met` where matched, else a table by category |
| `swapGroup` | derived from muscle + movement pattern (ExerciseDB v2 `relatedExerciseIds` shows the idea) |
| `formCheck` | our own flag for the 6 supported lifts |

Name overlap measured on normalised names: hasaneyldrm and free-exercise-db share about 266 exercises (112 exact), hasaneyldrm and RepDB about 128, free-exercise-db and RepDB about 131. The merge is therefore a union with a curated alias table, not a join. Every exercise must still have at least one still image (free-exercise-db or hasaneyldrm thumbnail) and instructions (PRD M3 gate: no exercise without muscles, media or instructions).

## Findings

1. All ten PRD repos exist and are active (pushed within the last 13 months; ExerciseDB's repo is a shell). Licences differ sharply: wger, Liftosaur, Magni and ExerciseDB are AGPL-3.0 (read, never copy); Habitica code is GPL-3.0 with CC-BY-NC-SA art; free-exercise-db is Unlicense; react-body-highlighter, react-native-body-highlighter, MuscleMap are MIT; MediaPipe and the OFF SDK are Apache-2.0.
2. The PRD's description of `hasaneyldrm/exercises-dataset` as one JSON with GIFs is right (1,324 exercises, 10 languages) but its GIFs are Gym visual's copyrighted media at 180x180, redistributed with permission only. Same lineage as ExerciseDB v1 and WorkoutX. Text is MIT. So it works for the private build and fails the "replace before going public" test.
3. ExerciseDB's repository no longer contains code, only a README with the paid v2 schema; the free V1 API still works with no key (1,500 exercises, CORS open) but has no stated data licence.
4. free-exercise-db is the only large, clearly licensed set: 876 exercises, 17 muscle names, level/force/mechanic/category, 1,746 JPG frames (about 100 MB, 850x567). It has no animations.
5. RepDB's free tier (650 exercises, MET values, goals, tags, tips, anatomical muscle ids, 512 px WebP start/peak frames) matches our `exercises` schema best, but its licence forbids republishing it as a dataset and forbids generative-AI use of the images.
6. Liftosaur's progressions are tiny scripts. `lp` counts consecutive successes, adds the increment to the weight actually lifted and optionally decrements after N failures; `dp` raises reps by 1 per session until `maxReps`, then adds weight and resets reps; `sum` adds weight when total reps pass a threshold. All three judge success on reps AND RPE together. State lives in the program text and each logged entry keeps a snapshot.
7. wger's model separates plan (per-iteration change rows with `operation`, `step`, `repeat`, `requirements`) from log (target stored next to actual), supports 9 set types, and is the only open model with rest, sets and RIR as progressable fields.
8. Habitica's formulas are small and portable: `tnl`, `0.9747^value` deltas, XP `delta*int bonus*priority*crit*6`, drop chance with an asymptote `diminishingReturns(chance, 0.75)` and a daily drop cap, boss damage from task deltas scaled by STR. The PRD default XP curve `100*L^1.5` needs about 11k XP for L10 and 690k for L50, which is 8 to 24 times Habitica's curve, so the XP values per action must be sized to it.
9. react-body-highlighter (npm) is male-only with low-fidelity 1000x2000 polygons. react-native-body-highlighter has proper male and female front/back path data split left/right; it lacks lats, rear delts, serratus, rhomboids and hip flexors.
10. MediaPipe PoseLandmarker on the web needs `@mediapipe/tasks-vision` 1.1.1, the wasm folder and a `.task` model (lite 5.8 MB, full 9.4 MB, heavy 30.7 MB); it runs in `VIDEO` mode with `detectForVideo(frame, strictlyIncreasingTimestampMs)`, GPU or CPU delegate, and 33 landmarks plus world coordinates with visibility.
11. Open Food Facts v2 returns everything we need under `product.nutriments.*_100g`, allows any origin (verified), limits product reads to 15/min/IP and search to 10/min/IP, and asks for a custom User-Agent that browsers cannot reliably set. Search was unavailable during testing, so offline caching is required.
12. Magni confirms two cheap patterns: save a finished workout as a template by copying logged values into targets, and per-set `log_type` (strength, cardio, mobility) so cardio uses the same set table.

## What we take

1. **Progression engine:** implement `lp`, `dp`, `sum` and a small `custom` hook as TypeScript pure functions in `/src/engine/progression/`, with Liftosaur's exact semantics (success = all sets at target reps and RIR/RPE; new weight from the completed weight; success and failure counters; decrement after N failures; reps-first double progression with `minReps/maxReps`). Store per exercise: `{type, increment, successCounter, failureCounter, minReps, maxReps, state{}}` in `planExercises`, and a `progressSnapshot` on each logged exercise entry (Liftosaur) so progression can be recomputed.
2. **wger ideas:** set `type` enum (normal, warmup, dropset, myo, partial, forced, tut, iso, jump); progressable fields include `rest` and `sets` as well as weight/reps/RIR (the Assassin density rule needs `rest`); `need_logs_to_advance`; targets stored beside actuals; `requirements` gating (`all_sets`) for strict double progression; trophy model (`type`, `checker_params`, hidden, progressive, repeatable) for our 60+ titles; measurement categories as data.
3. **Exercise data:** free-exercise-db as the public-domain backbone and structure donor (level, mechanic, force, category, equipment); hasaneyldrm text and GIFs for the private build (flagged third-party); RepDB for MET, goals, tips where matched, within its terms; ExerciseDB v2 field names `variations`, `relatedExerciseIds`, `exerciseTips`, `gender`.
4. **Magni:** one mapping table raw muscle string to canonical id (but anatomically exact), `source` + external id fields for de-duplication, a seed log, per-set `log_type`, save-as-template algorithm.
5. **Body map:** MIT path data from react-native-body-highlighter (male + female, front + back, left/right) converted to our own static SVGs; sub-region ideas from body-muscles (Apache-2.0) and MuscleMap hierarchy; own component, not the npm package.
6. **MediaPipe:** `@mediapipe/tasks-vision` 1.1.1 with a self-hosted lite model, `VIDEO` mode, GPU with CPU fallback, worker + `ImageBitmap` pipeline, 15-20 fps cap, `worldLandmarks` for angles, `visibility >= 0.5` gating, monotonic timestamps.
7. **Food:** plain `fetch` to OFF v2 with the `fields` parameter, wger's mapping rules (kcal fallback from kJ, required macros, vegan/vegetarian from analysis tags, serving size regex), and a Dexie cache of every lookup. OFF attribution in the About page.
8. **Habitica:** `tnl` as the shape reference for our curve; the delta-by-value idea for XP/gold scaling; `diminishingReturns` for drop chance and any bonus that must never exceed a cap; first-drop guarantee, new-player drop bonus that fades 5% per level, daily drop cap; stat-linked bonuses (INT to XP +2.5%/pt in Habitica, ours: INT to nutrition XP); crit with STR; perfect-day buff (our Recovery Phase VIT bonus); boss damage formula with STR scaling, but with no HP/XP loss to the Player.

## What we do better

- **Progression that reads the body, not only the bar.** Liftosaur and wger progress from reps/RPE only. Ours also reads per-muscle recovery (0-100%), readiness check-in and plateau count (3 stalled sessions triggers a variation swap or deload), and the class sets the rule, so a Tank and a Fighter on the same lift progress differently without writing a script.
- **No scripting required.** Liftoscript is powerful but a barrier; our five class rules ship pre-wired, with the `custom` hook reserved for Job Change techniques (cluster sets, myo-reps).
- **Muscle map that also drives recovery.** The open map libraries only highlight; ours has about 30 regions with male/female art, tap-to-target, and a 0-100% recovery heatmap fed by the recovery engine, with muscle ids shared with the exercise dataset.
- **Exercise library with a clean licence path.** One merged bundle with a per-field source and `thirdParty` flag per asset, so the public-release replacement is a build flag, not a rewrite.
- **Offline food and barcode with a politeness layer.** Cached OFF lookups, retries with backoff on 429/5xx and a Worker proxy fallback, instead of the live search-as-you-type that OFF forbids.
- **Gamification without punishment.** Habitica removes HP and levels for misses; we keep the delta/drop/boss maths but replace HP loss with Penalty Zone quests and a rage meter that only slows the boss fight, and we cap daily loot and XP by the safety rules.
- **Form check built into progression.** No open repo links rep-counting form scores to stats; ours feeds PER and can gate a load increase when form quality drops.

## Sources

Local clones (all under `C:\shadow-systen-project\research\_repos\`): `wger`, `liftosaur`, `exercises-dataset`, `exercisedb-api`, `Magni`, `free-exercise-db`, `react-body-highlighter`, `react-native-body-highlighter`, `mediapipe` (blobless clone), `mediapipe-samples`, `mediapipe-samples-web`, `openfoodfacts-js`, `habitica`, `body-muscles`, `exercise-dataset` (RepDB), `MuscleMap`, `workout-cool`, `ascension.fitness.app`.

Key files read:
- wger: `wger/manager/models/abstract_config.py`, `slot_entry.py`, `day.py`, `routine.py`, `session.py`, `log.py`; `wger/manager/dataclasses.py`; `wger/exercises/models/base.py`; `wger/nutrition/extract_info/off.py`; `wger/nutrition/models/ingredient.py`; `wger/trophies/README.md`; `wger/core/static/images/muscles/SOURCES`
- Liftosaur: `docs/features/progressions.md`, `docs/content/liftoscript.md`, `src/pages/planner/models/plannerProgramExercise.ts` (lines about 590-830), `src/types.ts`, `src/models/exercise.ts`
- Habitica: `website/common/script/statHelpers.js`, `fns/randomDrop.js`, `fns/crit.js`, `fns/updateStats.js`, `ops/scoreTask.js`; `website/server/libs/cron.js`; `website/server/models/group.js`; `website/common/script/content/quests/series.js`
- hasaneyldrm: `data/exercises.json`, `data/exercises.schema.json`, `NOTICE.md`, `LICENSE`
- free-exercise-db: `dist/exercises.json`, `schema.json`, `LICENSE.md`, `README.md`
- RepDB: `exercises.json`, `LICENSE-DATA.md`, `ATTRIBUTION.md`
- Magni: `backend/app/models/models.py`, `services/muscle_mapping.py`, `services/workoutx.py`, `api/routes/workouts.py`
- Body maps: `react-body-highlighter/src/assets/index.ts`, `src/component/{Model.tsx,metadata.ts}`; `react-native-body-highlighter/assets/*.ts`, `components/Svg*Wrapper.tsx`; `body-muscles/src/data/*`; `MuscleMap/Sources/MuscleMap/Data/*`
- MediaPipe: `mediapipe-samples-web/src/workers/pose-landmarker.worker.ts`, `src/tasks/pose-landmarker.ts`, `src/components/base-vision-task.ts`; `mediapipe/mediapipe/tasks/web/vision/pose_landmarker/pose_landmarker.ts`; `mediapipe/mediapipe/tasks/cc/vision/pose_landmarker/pose_landmarks_connections.h`; `mediapipe/mediapipe/tasks/web/core/task_runner.ts`

Links:
- https://github.com/wger-project/wger
- https://github.com/astashov/liftosaur
- https://github.com/hasaneyldrm/exercises-dataset
- https://github.com/ExerciseDB/exercisedb-api and https://docs.ascendapi.com
- https://github.com/AshenKeep/Magni
- https://github.com/yuhonas/free-exercise-db and https://github.com/wrkout/exercises.json
- https://github.com/giavinh79/react-body-highlighter
- https://github.com/HichamELBSI/react-native-body-highlighter
- https://github.com/vulovix/body-muscles
- https://github.com/melihcolpan/MuscleMap
- https://github.com/RepDB/exercise-dataset and https://repdb.co
- https://github.com/google-ai-edge/mediapipe and https://github.com/google-ai-edge/mediapipe-samples-web
- Pose model files: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task (and `_full`, `_heavy`)
- https://openfoodfacts.github.io/openfoodfacts-server/api/ and https://github.com/openfoodfacts/openfoodfacts-js
- https://github.com/HabitRPG/habitica
- https://github.com/Snouzy/workout-cool
- https://github.com/KVRYSV/ascension.fitness.app
- Live API checks run 2026-10-23: `https://world.openfoodfacts.org/api/v2/product/3017620422003`, `https://oss.exercisedb.dev/api/v1/exercises?limit=1`, `https://wger.de/api/v2/exerciseinfo/?language=2&limit=1` (932 English exercises, licence CC-BY-SA 4 per row), model files `Content-Length` checks on storage.googleapis.com
