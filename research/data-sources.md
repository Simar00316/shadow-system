# R6 - Data sources (exercises, food, cuisines, body map)

Researched 2026-10-23. Every URL below was fetched or HEAD-tested from this machine on that date. Real samples are in `data/.cache/` (gitignored): `fedb.json`, `hasan.json`, `exdb.json`, `wger_all.json`, `sr/`, `foundation/`, `ifct/`, `repos/`, `bodymap/`. Numbers marked "measured" were computed from those files; "est." means extrapolated.

Contents: 0 Decisions at a glance, 1 Exercises, 2 Food, 3 Cuisines and dishes, 4 Body map, 5 `/data` build layout, 6 Risks and open items, then Findings / What we take / What we do better / Sources.

---

## 0. Decisions at a glance

| Area | Choice | Why in one line |
| --- | --- | --- |
| Exercise data (primary) | **hasaneyldrm/exercises-dataset** (1,324, GIF for every one, primary + secondary muscles, 10-language steps incl. Hindi) | Only source with animation + muscles + instructions at 100% coverage |
| Exercise data (merge) | **yuhonas/free-exercise-db** (876, Unlicense) | Supplies `level`, `mechanic`, `force`, `category`, tips, plus ~600 exercises the other lacks (stretching, strongman, olympic) and a clean-licence fallback for media |
| Exercise data (reference only) | wger (CC-BY-SA), ExerciseDB oss API (AGPL / unclear data terms) | Share-alike and unclear terms would contaminate a bundled dataset; use for name aliases and cross-checking only |
| Media shipping | Convert at build time with `sharp`: GIF to animated WebP (-71%), JPG stills to 400 px WebP (-81%). Precache thumbs + core exercises, runtime-cache the rest, plus a "download full library" button | Measured: 93 KB to 27 KB per animation |
| Food (international) | **USDA SR Legacy CSV** (7,793 foods, all 5 nutrients, CC0) | Complete, stable, small (6 MB zip) |
| Food (Indian) | **IFCT 2017 via `nodef/ifct2017` CSV** (542 foods, includes veg/non-veg tags) | Only machine-readable Indian composition table; has atta, dals, paneer, milk |
| Barcodes | **Open Food Facts v2** called live from the browser (CORS `*`), result cached in Dexie | 13 GB bulk dump is not bundle-able; barcode reads are cheap |
| Cuisines | 15 + generic; dishes authored as gram lists, macros computed at build time | No open dish-macro dataset is accurate; computing from CC0/IFCT keeps data legal and auditable |
| Body map | **Reuse `melihcolpan/MuscleMap` path data (MIT)**: male + female x front + back, 36 regions; convert Swift strings to our JSON/SVG; draw our own paths for the gaps (abductors, lats split, side delt) | Only MIT source with both sexes and sub-muscles (front/rear delt, rhomboids, upper/lower chest) |

---

## 1. Exercises

### 1.1 Candidate comparison (measured)

| | free-exercise-db | hasaneyldrm/exercises-dataset | ExerciseDB open API | wger |
| --- | --- | --- | --- | --- |
| URL | https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json (200, 1.0 MB) | https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json (200, 17.4 MB because 10 languages) | https://oss.exercisedb.dev/api/v1/exercises?limit=100&cursor=... (200; `meta.total` = 1500) | https://wger.de/api/v2/exerciseinfo/?limit=100 (200, 932 exercises) |
| Exercises | 876 | 1,324 (1,315 unique names) | 1,500 on the open tier (README advertises 11,000+ on paid tiers) | 932 |
| (a) Animation | 0 true animations. 873 have 2 still frames (start/end), 3 have none | **1,324 GIF** (180x180) + 1,324 JPG thumbs | all sampled (650 of 1,500) have a GIF, 180x180; 1 of 10 sampled GIF URLs returned 404 | 46 with video (.MOV), 279 with an image (png/webp), 0 GIF |
| (b) Muscles | 876 (primary always; 604 have secondary) | 1,324 (`target` + `secondary_muscles` both populated, 100%) | all (`targetMuscles`, `secondaryMuscles`) | 770 of 932 |
| (c) Instructions | 871 (5 missing); 228 contain a "Tip:" sentence | 1,324 in 10 languages, pre-split `instruction_steps` (avg 5.8 steps) | all sampled | 899 have >40 chars of HTML description |
| Other fields | `level` (525 beginner / 294 intermediate / 57 expert), `mechanic` (491 compound / 298 isolation / 87 null), `force`, `category` (strength, stretching, plyometrics, powerlifting, olympic weightlifting, strongman, cardio) | `category`/`body_part`, `equipment`, `gif_url`, `image`, `attribution`; **no level, no mechanic, no force** | `bodyParts`, `equipments`, `gifUrl` | `category`, `equipment`, `muscles`, `muscles_secondary`, translations, aliases |
| Complete (muscle + media + text) | 873 | 1,324 | ~1,500 (est.) | 244 |
| Licence | **Unlicense** (public domain) for data and images (images' upstream provenance is not documented by the repo; treat as low risk, unverified) | Data and instruction text **MIT**; media **(c) Gym visual**, redistributed "with permission" at **180x180 only**, attribution `(c) Gym visual - https://gymvisual.com/` required, "cloning this repo is not a license" (`NOTICE.md`, `LICENSE` MEDIA EXCEPTION) | API code **AGPL-3.0**; data/media governed by ExerciseDB Terms of Use (https://dub.sh/exercisedb-api-tos, not read); hosted `exercisedb-api.vercel.app` is dead (HTTP 402 DEPLOYMENT_DISABLED); `v2.exercisedb.io` needs a key (401); `oss.exercisedb.dev` rate-limited (HTTP 429 after ~7 pages in 3 s) | Per-exercise CC-BY-SA 4 (779), CC-BY-SA 3 (132), CC0 (21): share-alike, per-author attribution |
| Repo health | 2,035 stars, last push 2026-09-27 | 23,165 stars, last push 2026-07-16 | 727 stars, last push 2025-11-25 | very active |

Overlap (measured, token-Jaccard >= 0.8 on normalised names): ~270 of the 876 free-exercise-db entries match a hasan entry; exact normalised-name match is only 202. Hasan uses "dumbbell alternate hammer preacher curl" style names and free-exercise-db uses "Alternate Hammer Curl", so name matching is partial (a further ~150 are 0.6-0.8 and need review). Expect a union of about **1,900 exercises** (1,324 + ~560-600 unmatched free-exercise-db entries, mostly stretching 101, plyometrics 58, powerlifting 35, olympic 33, strongman 20, cardio 14 and 413 plain strength).

ExerciseDB open data is the same lineage as hasan (identical field taxonomy: `pectorals`, `latissimus dorsi`, `cardiovascular system`, 180x180 GIFs). Hasan gives us the 1,324 with a permissive data licence and a bulk file, so ExerciseDB adds nothing worth its rate limits and AGPL/ToS risk.

### 1.2 Decision and merge strategy

**Primary = hasan (spine of the library). Enrichment = free-exercise-db. wger = alias source only.**

Pipeline (`data/build-exercises.mjs`), all inputs pinned by commit SHA (hasan `7455efae41`, free-exercise-db `f00c92c7dc`) in `data/sources.lock.json`:

1. Load hasan (1,324) and free-exercise-db (876). Normalise names: lowercase, strip punctuation, drop "the/with/a/of", singularise, expand `db`, `ez`, `kb`, `smr`, sort tokens.
2. Auto-match at Jaccard >= 0.8 and same primary-muscle family. Emit the 0.6-0.8 band to `data/src/exercise-match-review.json` for a one-time manual pass; confirmed pairs live in `data/src/exercise-overrides.json` (`{"hasanId":"0001","fedbId":"3_4_Sit-Up"}` plus per-exercise patches). Re-runs never lose the manual work.
3. Matched: hasan supplies media, muscles, steps and 10-language text; free-exercise-db supplies `level`, `mechanic`, `force`, `category`, and tips extracted from its "Tip:" sentences.
4. Unmatched free-exercise-db entries are kept with their 2 still frames (`media.kind = "frames"`, rendered as a 2-frame cross-fade).
5. Unmatched hasan entries get `mechanic`/`difficulty` from rules (below), flagged `derived: true`.
6. Quality filter: drop exact duplicates, entries without a mappable primary muscle, and "(male)"-only variants (29 hasan names carry "(male)", only 4 "(female)"; these are stance variants, not different content, so keep one).
7. Write `src/data/exercises.json` (compact arrays; drop the 8 non-selected languages and keep `en` + `hi` only. The 17.4 MB source file shrinks to an estimated 2-3 MB raw, under 1 MB gzipped; not yet measured) and `public/media/ex/`.

Core/extended tiers: tag ~400 common gym lifts `tier: "core"` (hand-reviewed list in `exercise-overrides.json`). Only core exercises get hand-authored `mistakes` and `tips`, are precached with media, and are eligible for plan generation by default. This keeps first install small and quality high.

### 1.3 Field mapping to our `exercises` store

| Our field | Source (hasan) | Source (free-exercise-db) | Rule |
| --- | --- | --- | --- |
| `id` | `"hx" + id` (e.g. `hx0025`) | `"fx_" + id` | Stable slug; keep both source ids in `src: {hasan, fedb}` |
| `name` | `name` (Title Case it) | `name` | Prefer free-exercise-db casing when matched |
| `aliases` | other source's name, wger `aliases`, a few auto variants (`db`/`dumbbell`) | - | Used for fuzzy search and Hevy/Strong import matching |
| `primaryMuscles` | `target` mapped via 1.4 | `primaryMuscles` mapped via 1.4 | Union when matched; shoulders split by heuristic |
| `secondaryMuscles` | `secondary_muscles` mapped | `secondaryMuscles` mapped | Dedupe; remove any also in primary |
| `equipment` | `equipment` via 1.5 | `equipment` via 1.5 | Array of canonical ids (some exercises need 2, e.g. `bench` + `barbell`; `bench` inferred from name) |
| `difficulty` | none: derive | `level`: beginner/intermediate/expert -> 1/2/3 | Derive: expert if name matches `muscle.?up|pistol|snatch|clean and|handstand|one.arm|planche|front lever|archer|dragon flag`, beginner if machine/cable/band/stretch, else intermediate |
| `mechanics` | derive | `mechanic` | Derive: compound if secondary muscle count >= 2 or pattern is squat/hinge/press/row/pull/lunge; else isolation. `null` in free-exercise-db (87) gets the derived value |
| `classTags` | derive | `category` + `force` | Fighter: powerlifting, olympic, barbell compound. Tank: strength with machine, cable, dumbbell or isolation. Assassin: bodyweight, cardio, band, light compound for high reps. Ranger: plyometrics, calisthenics, kettlebell, strongman, cardio. Healer: stretching, mobility, foam roll, rehab. Multi-tag allowed |
| `media` | `gif_url` + `image` | `images[]` | `{kind:"anim"\|"frames", thumb, src, credit}`; credit string `(c) Gym visual - https://gymvisual.com/` where applicable |
| `instructions` | `instruction_steps.en` (array) and `.hi` | `instructions[]` minus "Tip:" sentences | Steps array of strings; keep `en` and `hi` |
| `tips` | - | sentences containing "Tip:" (228 exercises) | Extract with regex, strip prefix. Core exercises get authored tips for the rest |
| `mistakes` | none in any source | none | **Gap**: authored for the ~400 core exercises (draft with an LLM, review by hand). Others show none |
| `swapGroup` | derive | derive | `"<pattern>:<primaryMuscle>"`, pattern in squat, hinge, lunge, horizontal-push, vertical-push, horizontal-pull, vertical-pull, curl, extension, raise, fly, crunch, rotation, carry, plyo, cardio, stretch, other; pattern from name regex plus `force`. Smart swap picks same swapGroup, different equipment |
| `met` | derive | derive | Compendium of Physical Activities 2024 (verified table below) |
| `formCheck` | - | - | Hand allowlist `data/src/form-check.json` (squat, push-up, pull-up, deadlift, lunge, overhead press, bicep curl, plank, dip; MediaPipe rules in B3.11). Everything else false |
| `category` (extra) | `category` | `category` | strength, stretching, plyometrics, cardio, ... drives filters and the Healer class |
| `force` (extra) | derive | `force` | push/pull/static, used by swap logic |

MET assignment (values verified at https://pacompendium.com/conditioning-exercise/, 2024 Adult Compendium): resistance training general 3.5 (code 02054); heavy squats/deadlift 5.0 (02052); vigorous power/bodybuilding 6.0 (02050); body-weight resistance 3.0, high intensity 6.5 (02056/02057); calisthenics moderate 3.8, vigorous 7.5 (02022/02020); circuit 5.0 (02035); stretching 2.3 (02101); kettlebell swings 9.8 (02058); HIIT burpees/Tabata 11.0 (02214); rowing machine 5.0-7.3 (02071/02070); elliptical 5.0 (02048). Rule: isolation 3.5, compound 5.0, powerlifting/olympic/strongman 6.0, plyometrics 8.0, stretching 2.3, cardio by activity table. kcal = MET x kg x hours.

### 1.4 Canonical muscle list (21) and the body-map link

Chosen to match what the body-map art can show and what the recovery engine tracks. Ids are snake_case; `view` says where the map draws it.

| # | id | Label | View | MuscleMap region(s) that light up |
| --- | --- | --- | --- | --- |
| 1 | `neck` | Neck | both | `neck` |
| 2 | `traps` | Trapezius | both | `trapezius`, `upperTrapezius`, `lowerTrapezius` |
| 3 | `chest` | Chest | front | `chest`, `upperChest`, `lowerChest` |
| 4 | `front_delts` | Front delts | front | `frontDeltoid` |
| 5 | `side_delts` | Side delts | both | `deltoids` (the part not covered by front/rear sub-regions) |
| 6 | `rear_delts` | Rear delts | back | `rearDeltoid`, `rotatorCuff` |
| 7 | `biceps` | Biceps | front | `biceps` |
| 8 | `triceps` | Triceps | both | `triceps` |
| 9 | `forearms` | Forearms | both | `forearm` (hands/grip folded in) |
| 10 | `abs` | Abs | front | `abs`, `upperAbs`, `lowerAbs` |
| 11 | `obliques` | Obliques and serratus | front | `obliques`, `serratus` |
| 12 | `lats` | Lats | back | `upperBack` (the large orange region in our render is lats + teres) |
| 13 | `upper_back` | Mid back (rhomboids) | back | `rhomboids` |
| 14 | `lower_back` | Lower back | back | `lowerBack` |
| 15 | `glutes` | Glutes | back | `gluteal` |
| 16 | `hip_flexors` | Hip flexors | front | `hipFlexors` |
| 17 | `quads` | Quads | front | `quadriceps`, `innerQuad`, `outerQuad` |
| 18 | `hamstrings` | Hamstrings | back | `hamstring` |
| 19 | `adductors` | Adductors (inner thigh) | both | `adductors` |
| 20 | `abductors` | Abductors (glute med, outer hip) | back/side | **not drawn by MuscleMap: we draw our own path (section 4.4)** |
| 21 | `calves` | Calves and shins | both | `calves`, `tibialis`, `ankles` |

Not tracked as separate recovery muscles: head, hair, hands, feet, knees (art only).

#### Dataset muscle name -> canonical

free-exercise-db (17 values, counts over primary + secondary):

| Source | Canonical | Notes |
| --- | --- | --- |
| abdominals | abs | |
| abductors | abductors | |
| adductors | adductors | |
| biceps | biceps | |
| calves | calves | |
| chest | chest | |
| forearms | forearms | |
| glutes | glutes | |
| hamstrings | hamstrings | |
| lats | lats | |
| lower back | lower_back | |
| middle back | upper_back | 100 uses; rows also load lats, so rows get lats as primary when the name contains "row" and a lat/pulldown cue |
| neck | neck | 9 uses |
| quadriceps | quads | |
| shoulders | **split** (see delt rules) | 339 uses |
| traps | traps | |
| triceps | triceps | |

hasan `target` (19 values) and `secondary_muscles` (40 values; ExerciseDB `targetMuscles` uses the same vocabulary):

| Source | Canonical |
| --- | --- |
| abs, abdominals, core, lower abs, upper abs | abs |
| obliques, serratus anterior, serratus | obliques |
| pectorals, chest, upper chest | chest |
| delts, deltoids, shoulders | **split** (delt rules) |
| rear deltoids | rear_delts |
| rotator cuff | rear_delts |
| biceps, brachialis | biceps |
| triceps | triceps |
| forearms, wrists, wrist flexors, wrist extensors, hands, grip muscles | forearms |
| lats, latissimus dorsi | lats |
| upper back, rhomboids, back | upper_back |
| traps, trapezius | traps |
| spine, erector spinae, lower back | lower_back |
| glutes | glutes |
| hip flexors, groin (hip) | hip_flexors |
| quads, quadriceps | quads |
| hamstrings | hamstrings |
| adductors, inner thighs, groin | adductors |
| abductors | abductors |
| calves, soleus, ankles, ankle stabilizers, feet, shins | calves |
| levator scapulae, sternocleidomastoid, neck | neck |
| cardiovascular system | none: sets `category: "cardio"`, no muscle |

wger (`name_en`): Glutes, Shoulders (split), Lats, Quads, Chest, Abs, Biceps, Triceps, Trapezius, Hamstrings, Obliquus externus abdominis (obliques), Calves, Brachialis (biceps), Serratus anterior (obliques), Soleus (calves). wger has no neck, lower back, forearms, adductors, abductors.

#### Delt rules (the only lossy mapping; every source says just "shoulders/delts")

Apply in order, on the exercise name (lowercase), then on context:

1. `lateral raise|side raise|upright row|y-raise|cable lateral|abduction` (shoulder) -> `side_delts` primary.
2. `rear|reverse fly|reverse pec|face pull|bent.?over (raise|fly)|reverse (peck|flye)|band pull.?apart` -> `rear_delts` primary.
3. `front raise|plate raise|front (dumbbell|barbell) raise` -> `front_delts` primary.
4. `overhead|military|shoulder press|arnold|push press|handstand` -> `front_delts` primary + `side_delts` secondary.
5. Otherwise for a delt that appears only as a **secondary**: if `force == push` (or primary is chest/triceps) -> `front_delts`; if `force == pull` (or primary is lats/upper_back/biceps) -> `rear_delts`; else `side_delts`.
6. If delts is the **primary** and no rule fires -> `front_delts` + `side_delts`.

Manual overrides in `exercise-overrides.json` fix the leftovers (list produced by a build report of "delt guessed by rule 5/6").

### 1.5 Equipment canon

`bodyweight, dumbbell, barbell, ez_bar, kettlebell, cable, machine, smith_machine, bands, bench, pullup_bar, medicine_ball, stability_ball, foam_roller, cardio_machine, other`.

| Source value | Canonical |
| --- | --- |
| free-exercise-db: body only / None (77) | bodyweight (None with "machine/cable" in the name -> that) |
| barbell, e-z curl bar | barbell, ez_bar |
| dumbbell, kettlebells | dumbbell, kettlebell |
| cable | cable |
| machine | machine |
| bands | bands |
| medicine ball, exercise ball, foam roll, other | medicine_ball, stability_ball, foam_roller, other |
| hasan: body weight, weighted | bodyweight |
| leverage machine, assisted, sled machine | machine |
| ez barbell, olympic barbell, trap bar | ez_bar, barbell, barbell |
| smith machine | smith_machine |
| band, resistance band | bands |
| stability ball, bosu ball | stability_ball |
| roller, wheel roller | foam_roller, other |
| rope | cable |
| skierg machine, stationary bike, elliptical machine, stepmill machine, upper body ergometer | cardio_machine |
| hammer, tire | other |

Add `bench` and `pullup_bar` by name rules (`bench|incline|decline|preacher` -> bench; `pull-up|chin-up|hanging` -> pullup_bar). This feeds the "equipment only" filters and equipment profiles.

### 1.6 Media size and offline shipping (measured)

Sampled 20 random hasan exercises and 20 random free-exercise-db exercises (40 images):

| Asset | Avg size | After `sharp` | Whole library (raw -> converted) |
| --- | --- | --- | --- |
| hasan GIF, 180x180 | **92.9 KB** | animated WebP q60 effort 4: **26.6 KB** (-71%) | 1,324 x 92.9 KB = ~120 MB -> **~35 MB** |
| hasan JPG thumb, 180x180 | 6.6 KB | WebP q70 est. 2-3 KB | 8.7 MB -> ~3.5 MB (est.) |
| free-exercise-db JPG (e.g. 850x567) | 56.7 KB; ~113 KB per exercise (2 frames) | resize 400 px wide, WebP q65: **10.5 KB** | 1,746 images -> **~18 MB** |
| ExerciseDB GIF, 180x180 | 76.8 KB (10 samples) | n/a (not used) | |

`sharp` 0.35.5 installed and ran on this Windows 11 box under Node 24 with no native build step (prebuilt binaries); `sharp(buf,{animated:true}).webp({quality:60})` converts animated GIF to animated WebP. Do conversion once in the data build, commit nothing generated (`public/media` is a build output, gitignored), and cache the output by source hash so rebuilds are seconds.

Shipping plan:

1. **Precache (app shell, ~6 MB)**: `exercises.json`, all thumbnails (hasan WebP thumbs ~3.5 MB), core-tier animated WebPs only if size budget allows (400 x 27 KB = ~11 MB; decide against the install budget; default: not precached).
2. **Runtime cache** (Workbox `CacheFirst`, cache name `ex-media-v1`, 1,600 entries, no expiry by age): animated WebP and free-exercise-db frames fetched on first view.
3. **Settings > Offline library**: one button "Download all exercise animations (~55 MB)" that fetches the manifest and fills the cache; show progress. Call `navigator.storage.persist()` first (B2). iOS home-screen PWAs have ample quota for this; R7 verifies eviction.
4. **Display size**: show hasan media at <= 180 CSS px (that is the licence's resolution limit; do not upscale).
5. **Do not hotlink GitHub raw at runtime.** Build copies files into our own hosting so the app works offline and does not depend on a third party staying up.

Why not bundle everything in the precache: ~55 MB on first install breaks the "instant first launch" feel and burns mobile data for a user who may only ever see 40 exercises.

### 1.7 Licence handling for exercise data

| Item | Obligation | What we do |
| --- | --- | --- |
| free-exercise-db data + images | Unlicense, none | Credit in About screen anyway |
| hasan data + instruction text | MIT: keep copyright notice | `THIRD_PARTY_NOTICES.md` and About screen |
| hasan media (c) Gym visual | Attribution on every use; 180x180 only; "no rights beyond Gym visual's terms" | Per-exercise credit line in the detail view and a `media.credit` field; do not upscale. **The app is private and personal, so risk is low, but the redistribution grant is the repo's, not ours.** Isolate behind `media.provider = "gymvisual"` so it can be dropped (fall back to free-exercise-db frames or our own art) with a single flag. If the app is ever opened to the public, email Gym visual for a licence first |
| GIF to WebP conversion | Possibly a derivative; terms not explicit | Keep resolution and attribution intact; flagged in section 6 |
| wger | CC-BY-SA: share-alike | Not bundled. Used only to harvest alias strings (names are facts, not creative text) |
| ExerciseDB | AGPL (code), ToS (data) | Not used |

---

## 2. Food

### 2.1 USDA FoodData Central

Licence: public domain, **CC0 1.0** (fdc.nal.usda.gov; data.gov lists `us-pd`). Citation is requested, not required: "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central." Keep it in About.

Downloads (all HEAD-tested 200 on 2026-10-23; the index page is https://fdc.nal.usda.gov/download-datasets/, base path `https://fdc.nal.usda.gov/fdc-datasets/`):

| Dataset | URL | Size | Foods |
| --- | --- | --- | --- |
| **SR Legacy CSV** (use this) | https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip | 6.07 MB | **7,793** |
| SR Legacy JSON | https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip | 13.5 MB | 7,793 |
| Foundation Foods CSV | https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip | 3.83 MB | 469 `foundation_food` rows (plus 87k sub-sample rows) |
| Foundation Foods JSON | https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2026-04-30.zip | 0.47 MB | 469 |
| FNDDS (survey/mixed dishes) CSV | https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip | 3.33 MB | prepared dishes, American |
| Branded CSV | https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2026-04-30.zip | **448.8 MB** | US packaged; not needed |

Nutrient ids (confirmed in `nutrient.csv` of both sets):

| Nutrient | id | Unit | SR Legacy foods that have it |
| --- | --- | --- | --- |
| Energy | **1008** | kcal | 7,793 (100%) |
| Protein | **1003** | g | 7,793 |
| Total fat | **1004** | g | 7,793 |
| Carbohydrate, by difference | **1005** | g | 7,793 (includes fibre) |
| Fibre, total dietary | **1079** | g | 7,231 (93%; treat missing as 0) |
| Water | 1051 | g | 7,793 |

Foundation Foods mostly does **not** populate 1008 (only 135 foods): kcal is in **2047** (Atwater General, 347 foods) and **2048** (Atwater Specific, 312 foods). Rule: `kcal = 1008 ?? 2047 ?? 2048 ?? 4P+9F+4C`.

Decision: **SR Legacy is the backbone** (complete, no gaps in the five nutrients, 6 MB, frozen since 2018 so builds are reproducible). Use Foundation only to override a handful of staples where it is newer. SR Legacy has no paneer, atta, or desi dal names: that is what IFCT is for. Join keys: `food.csv` (`fdc_id`, `description`), `food_nutrient.csv` (`fdc_id`, `nutrient_id`, `amount` per 100 g), `food_portion.csv` (gram weights for "1 cup", "1 slice"; use for the unit picker), `food_category.csv`.

### 2.2 Open Food Facts

| Item | Finding |
| --- | --- |
| Barcode lookup | `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=code,product_name,brands,quantity,serving_size,serving_quantity,nutriments,image_front_small_url,nutriscore_grade,nova_group` (tested with 3017620422003: 200) |
| Per-100g keys in `nutriments` | `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g`, also `sugars_100g`, `saturated-fat_100g`, `salt_100g`, `sodium_100g`; `*_serving` variants when a serving exists. Use `energy-kcal_100g` (not `energy_100g`, which is kJ) |
| CORS from a browser | **Yes**: response carries `Access-Control-Allow-Origin: *`, allows methods GET/POST/OPTIONS and headers including `User-Agent`, `X-User-Agent`, `Content-Type`, `Authorization`, so a preflight succeeds. Browsers forbid setting `User-Agent`, so send `X-User-Agent: ShadowSystem/0.1 (contact email)` (the docs ask for "AppName/Version (email)") |
| Rate limits (docs, https://openfoodfacts.github.io/openfoodfacts-server/api/) | product reads 15/min per IP, search 10/min per IP, no search-as-you-type; limits apply per user when requests come from user devices, so a personal app is fine. Global overload returns 503 (we saw 503 on the legacy `cgi/search.pl` during the test) |
| Text search | Not available in v2 server-side; use search-a-licious (https://search.openfoodfacts.org) if ever needed. We do not need it: text search runs over our bundled table |
| India coverage | `https://in.openfoodfacts.org/api/v2/search?countries_tags_en=india&page_size=1&fields=code` returned `count: 24915` products |
| Bulk | JSONL 13.2 GB, CSV 1.49 GB (`https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz`), Parquet 7.98 GB (Hugging Face): **not bundle-able** |
| Licence | Database ODbL, contents DbCL, product images CC BY-SA (may include third-party graphics). Attribution "Open Food Facts" in the scan result screen. We store only numbers (facts) from a user-triggered scan in the user's own IndexedDB, which is share-alike safe |

Design: scanning a barcode fetches once, normalises to our `foods` schema (`src: "off:<barcode>"`), stores in Dexie, and works offline thereafter. Missing `energy-kcal_100g` or all macros -> show "incomplete, enter manually" (OFF data is crowd-sourced; some products lack nutrition).

### 2.3 IFCT 2017 (Indian Food Composition Tables)

The book (NIN Hyderabad / ICMR-NIN, 2017) has no official machine-readable release. The practical route is the **`nodef/ifct2017`** repo (also the `ifct2017` org, site https://ifct2017.github.io):

| Item | Value |
| --- | --- |
| Compositions CSV | https://raw.githubusercontent.com/nodef/ifct2017/main/compositions/index.csv (1.15 MB, **542 foods**, tested 200) |
| Companion files | `descriptions/index.csv` (153 KB: code, name, scientific name, group, local-language names), `columns/index.csv` (column legend), `groups/index.csv` (20 food groups) at the same raw base path |
| Code licence | **AGPL-3.0-or-later** (repo, npm `ifct2017`); `@ifct2017/compositions` on npm says MIT. The underlying numbers come from a published government book |
| Our stance | We copy **numeric facts** (not code) into our own ingredient table and credit "Indian Food Composition Tables 2017, ICMR-NIN Hyderabad, via nodef/ifct2017". Do not vendor the AGPL repo code. Private app; if it is ever distributed publicly, ask NIN for permission to be safe (flagged in section 6) |
| Pinned commit | `b65621ddcf` (2026-09-09) |

Fields we need (per 100 g edible portion; all columns have an `_e` standard-error twin):

| IFCT column | Meaning | Unit | Our field |
| --- | --- | --- | --- |
| `code` | Food code, e.g. `A019` | - | `src: "ifct:A019"` |
| `name`, `scie`, `lang` | English name, scientific name, local names | - | `name`, `aliases` (local names give us "atta", "bajra", "rajmah") |
| `grup` | Food group (Cereals and Millets, Grain Legumes, Milk and Milk Products, ...) | - | `group` |
| `enerc` | Energy | **kJ** | `kcal = enerc / 4.184` |
| `protcnt` | Protein | g | `p` |
| `fatce` | Total fat | g | `f` |
| `choavldf` | **Available** carbohydrate (excludes fibre) | g | `c = choavldf + fibtg` to match USDA's by-difference convention |
| `fibtg` | Dietary fibre | g | `fi` |
| `tags` | `vegetarian eggetarian fishetarian veg` / `eggetarian fishetarian nonveg` / `fishetarian nonveg` / `nonveg` | - | Drives our diet filters directly |

Data quirks found (measured) and the build rules:

- **Fats and oils have `enerc = 0`** (ghee, groundnut oil, mustard oil, ...), so `kcal = 4P + 9F + 4C` when `enerc = 0`.
- **All values are raw/uncooked.** No cooked-weight yields: add a yield table for dal (about 1:2.5 with water), rice (1:2.8-3), atta to roti (dough about 1.5x), chana soaked, etc., stored in `ingredient.yield`.
- Occasional implausible rows (chicken leg skinless 384 kcal vs breast 168): build report flags any food where `|kcal - (4P+9F+4C)| / kcal > 0.15`, to be reviewed or replaced by the SR Legacy equivalent.
- Fish rows are 100+ regional species (Ari, Kite, Moon, Raai...). Keep a handful of common ones (rohu, catla, pomfret, sardine, prawns, tuna) and drop the rest.

IFCT contents we want (verified present): atta (A019), refined flour (A018), brown/milled/parboiled rice (A013-A015), bajra, ragi, jowar, bengal gram dal (B001), whole (B002), black gram (B003/B004), green gram (B010/B011), masur (B013), rajmah (B018-B020), toor dal (B021), soya (B024/B025), milk cow/buffalo (L001/L002), **paneer (L003)**, ghee (T013), oils (T001-T012), eggs (M001-M015), chicken cuts (N001-N006), prawns, jaggery (I001), onion, tomato, garlic, ginger, spices (turmeric G033, cumin G025, coriander G024). Not in IFCT: curd/yoghurt (SR `Yogurt, plain, whole milk` 61 kcal), butter (SR), whey protein, roti/dosa (compose from atta).

### 2.4 Recommended compact ingredient table (`src/data/ingredients.json`)

Target: **~450 rows, ~60 KB gzipped**: ~150 from IFCT, ~280 from SR Legacy, ~20 hand-authored (whey, protein bars, "roti (home)", "idli batter").

Row shape (array form in the bundle, object form in source):

```json
{ "id":"atta", "n":"Wheat flour (atta)", "al":["whole wheat flour","chakki atta"], "g":"cereal",
  "k":320, "p":10.57, "c":75.53, "f":1.53, "fi":11.36,
  "diet":"vegan", "tier":1, "yield":null, "unit":{"cup":120,"tbsp":8},
  "src":"ifct:A019" }
```

- `diet` in `vegan | vegetarian | eggetarian | nonveg` derived from IFCT `tags` and SR `food_category` (dairy/honey/egg group -> not vegan; meat/fish/poultry -> nonveg); a dish's diet is the strictest of its ingredients.
- `tier` = **price tier** 1 staple/cheap, 2 mid, 3 premium. No open price dataset fits; hand-assign by group with overrides. Tier 1: atta, rice, dals, chana, potato, onion, tomato, seasonal vegetables, eggs, bananas, oats, peanuts, milk, curd. Tier 2: paneer, chicken, tofu, ghee, cheese, butter, yoghurt (Greek), most fruit, nuts (almonds are 3), olive oil, tinned fish. Tier 3: fish fillets (salmon), beef, lamb, prawns, avocado, berries, nuts (almond, cashew, pistachio), whey. Budget mode = prefer tier 1-2.
- `unit` = common gram weights (`cup`, `tbsp`, `piece`) from SR `food_portion.csv` where available, hand-set for Indian items (1 roti = 40 g from 28 g atta, 1 katori dal = 150 g cooked).
- Selection list (~450): all staples named in the prompt (atta, maida, besan, rice varieties, poha, oats, bread, dals x10, rajma, chana (white and black), soya chunks, paneer, tofu, curd, milk x3, ghee, butter, oils x6, eggs, chicken x4 cuts, mutton, fish x8, prawn, vegetables x70, fruit x40, nuts and seeds x20, spices x25, sugar/jaggery/honey, sauces, plus international staples (pasta, tortilla, beef cuts, bacon, cheeses, olive oil, avocado, quinoa, hummus, tahini, kimchi, miso, noodles, nori, coconut milk, etc.).
- The ingredient builder (`data/build-foods.mjs`) reads `data/src/ingredients.curated.json` (id, name, aliases, src ref, tier, unit overrides) and fills nutrients from the cached downloads. Adding an ingredient is one line; nutrient numbers are never typed by hand except for the ~20 manual ones.

Also bundle a **search-only foods table** (SR Legacy ~2,500 common raw/cooked entries, ~250 KB gz) behind the same schema for meal logging beyond the 450 recipe ingredients. Optional; defer if size matters.

---

## 3. Cuisines and dishes

### 3.1 The 15 cuisines (+ generic)

Selection logic: (1) the owner is Indian and India is the largest user group by far, so India gets 4x the depth; (2) top English-speaking markets for fitness apps (USA, UK); (3) the cuisines with the largest global restaurant/home-cooking reach and strong protein dishes; (4) a spread across regions so the dropdown feels like "my country is here".

| # | Cuisine (user picks country) | Reason | Sub-tags |
| --- | --- | --- | --- |
| 1 | **India** | owner, biggest audience; 120+ dishes, not 40 | north, south, bengali, gujarati, punjabi, street |
| 2 | USA | biggest app market | |
| 3 | UK | English-speaking market; Indian/South-Asian diaspora | |
| 4 | Mexico | high-protein, bean/rice, huge US/LatAm audience | |
| 5 | Italy | most recognised; pasta/carbs management matters for macros | |
| 6 | China | largest population; stir-fries are easy macro-wise | |
| 7 | Japan | rice + fish + soy; lean | |
| 8 | Thailand | widely known, popular with fitness travellers | |
| 9 | Middle East / Lebanon | hummus, grilled meats, large Gulf diaspora (many Indian users live in the Gulf) | |
| 10 | Mediterranean / Greece | health-driven, olive oil, legumes | |
| 11 | South Korea | growing audience, high protein BBQ and fermented foods | |
| 12 | Brazil | big market; rice-beans-meat plates | |
| 13 | Spain | tapas, tortilla, seafood | |
| 14 | France | fundamental Western cuisine | |
| 15 | **Pakistan** | shares ~70% of dish vocabulary with India so authoring is cheap; large Urdu-speaking audience and Gulf/UK diaspora. (Vietnam was the alternative: lean pho/bun dishes, but a smaller likely audience. Make it #16 as a stretch goal) | |
| - | **Generic / global** | country-agnostic meals (oats, eggs, chicken-rice-veg bowl, protein shake, Greek yoghurt) so the planner always has something that hits the macros | |

PRD wants >= 40 dishes per cuisine: 15 x 40 = 600 + 100 generic + 80 extra India = **~780 dishes**. Each dish carries `meal: breakfast|lunch|dinner|snack`, `diet` (derived), `prepMin`, `cost tier` (derived from ingredients), `servings`, `ingredients[{id,g}]`, `tags` (high-protein, low-carb, quick, one-pot).

### 3.2 Where dish names come from

| Source | What it gives | Findings |
| --- | --- | --- |
| Wikipedia "List of X dishes" (CC-BY-SA text, but dish names are facts) | Authoritative name lists, regional notes | 200 OK: https://en.wikipedia.org/wiki/List_of_Indian_dishes, `List_of_American_foods`, `List_of_Mexican_dishes`, `List_of_Italian_dishes`, `List_of_Chinese_dishes`, `List_of_Japanese_dishes`, `List_of_Thai_dishes`, `List_of_Middle_Eastern_dishes`, `List_of_Greek_dishes`, `List_of_Korean_dishes`, `List_of_Brazilian_dishes`, `List_of_Spanish_dishes`, `List_of_French_dishes`, `List_of_Vietnamese_dishes`, `List_of_Pakistani_dishes`, `List_of_English_dishes`, `List_of_Turkish_dishes`, `Lebanese_cuisine`. 404: `List_of_British_dishes`, `List_of_Lebanese_dishes` |
| **TheMealDB** (https://www.themealdb.com/api/json/v1/1/filter.php?a=...) | Name + thumbnail + full recipe with quantities (text, not grams) | **The prompt's URL `a=Indian` now returns `{"meals":null}`**: the API changed `strArea` from demonyms to country names. Working values: `a=India` 15, `United States` 34, `United Kingdom` 60, Mexico 6, Italy 21, China 27, Japan 9, Thailand 27, Greece 8, Brazil 11, Spain 48, France 28, Vietnam 27, Egypt 8, Turkey 30, Morocco 6; **Lebanon, South Korea and Pakistan return 0**. Free test key `1` is for "development or educational use" and the site asks for a supporter key before an app-store release; no open licence on recipe content. Verdict: too sparse (6-60 per country) and legal status unclear; use only as a prompt for dish names, never as bundled data |
| LLM-assisted drafting from the above name lists | Ingredient lists in grams for a dish | Fast, then validated by the build checks in 3.4 and spot-reviewed by hand |

### 3.3 Method: author as grams, compute macros at build time

Recommended and confirmed by the three worked examples below:

1. Authors write `data/src/dishes/<country>.yaml`: dish id, name, meal type, servings, ingredient ids and **raw grams**, optional `notes`.
2. `data/build-dishes.mjs` looks every ingredient id up in the ingredient table (section 2.4), computes totals and per-serving kcal/P/C/F/fibre, derives `diet` and `costTier`, and writes `src/data/dishes.<country>.json` (lazy-loaded per chosen country; ~40 dishes ~ 10 KB).
3. Authors never type macros, so a changed ingredient value or a typo fix flows everywhere.
4. Raw-weight convention: all gram amounts are raw/dry (as bought). Cooked weight is shown as `servingG` from `yield` factors, not used for macros. Cooking fat is counted as added, with no absorption/loss model (state this in the UI as "estimates, +-10%").

### 3.4 Build-time validation

Per dish: kcal per serving in 120-1,100; protein >= 2 g; `|kcal - (4P+9F+4C)| / kcal` <= 0.2 (fibre and rounding differences allowed); every ingredient id resolves; servings integer 1-8; total grams > 100; veg dishes contain no `nonveg` ingredient. Fail the build with a readable list; this is cheap and catches the bulk of authoring mistakes.

### 3.5 Worked example dishes (computed from the cached data, per-100 g values x grams)

Column key: kcal, protein g, fat g, carbs g (total, incl. fibre), fibre g. IFCT kcal = kJ/4.184; IFCT carbs = `choavldf + fibtg`; ghee/oil kcal = 9 x fat.

**1. Dal Tadka (India, vegetarian, 4 servings)**

| Ingredient | g | kcal | P | F | C | Fibre |
| --- | --- | --- | --- | --- | --- | --- |
| Toor dal, raw (IFCT B021) | 150 | 496 | 32.5 | 2.3 | 96.4 | 13.6 |
| Onion, big (IFCT G017) | 100 | 48 | 1.5 | 0.2 | 12.0 | 2.5 |
| Tomato, local (IFCT D076) | 120 | 24 | 1.1 | 0.6 | 5.4 | 2.1 |
| Garlic (IFCT G011) | 12 | 15 | 0.8 | 0.0 | 3.3 | 0.6 |
| Ginger (IFCT G014) | 10 | 5 | 0.2 | 0.1 | 1.4 | 0.5 |
| Turmeric powder (IFCT G033) | 2 | 6 | 0.2 | 0.1 | 1.4 | 0.4 |
| Cumin seeds (IFCT G025) | 3 | 9 | 0.4 | 0.5 | 1.6 | 0.9 |
| Ghee (IFCT T013, 9 kcal/g) | 20 | 180 | 0.0 | 20.0 | 0.0 | 0.0 |
| Coriander leaves (IFCT G009) | 10 | 3 | 0.4 | 0.1 | 0.7 | 0.5 |
| **Total** | 427 | **786** | 37.1 | 23.9 | 122.2 | 21.1 |
| **Per serving (1/4, about 1.5 cup)** | | **196** | **9.3** | **6.0** | **30.5** | **5.3** |

(Atwater cross-check 213 kcal vs 196 reported; the gap is the fibre that IFCT does not count at 4 kcal/g. Fine.)

**2. Chicken Burrito Bowl (Mexico, non-veg, 2 servings)**

| Ingredient | g | kcal | P | F | C | Fibre |
| --- | --- | --- | --- | --- | --- | --- |
| Chicken breast, raw (SR 171077) | 300 | 360 | 67.5 | 7.9 | 0.0 | 0.0 |
| White rice, raw (SR 168877) | 100 | 365 | 7.1 | 0.7 | 80.0 | 1.3 |
| Black beans, cooked (SR 173735) | 160 | 211 | 14.2 | 0.9 | 37.9 | 13.9 |
| Sweet corn, raw (SR 169998) | 100 | 86 | 3.3 | 1.4 | 18.7 | 2.0 |
| Tomato (SR 170457) | 120 | 22 | 1.1 | 0.2 | 4.7 | 1.4 |
| Onion (SR 170000) | 40 | 16 | 0.4 | 0.0 | 3.7 | 0.7 |
| Avocado (SR 171705) | 100 | 160 | 2.0 | 14.7 | 8.5 | 6.7 |
| Cheddar (SR 170899) | 40 | 164 | 9.7 | 13.5 | 0.9 | 0.0 |
| Olive oil (SR 171413) | 10 | 88 | 0.0 | 10.0 | 0.0 | 0.0 |
| Lime juice (SR 168156) | 15 | 4 | 0.1 | 0.0 | 1.3 | 0.1 |
| **Total** | 985 | **1,476** | 105.3 | 49.2 | 155.6 | 26.1 |
| **Per serving (1/2)** | | **738** | **52.7** | **24.6** | **77.8** | **13.0** |

**3. Spaghetti Bolognese (Italy, non-veg, 4 servings)**

| Ingredient | g | kcal | P | F | C | Fibre |
| --- | --- | --- | --- | --- | --- | --- |
| Pasta, dry (SR 169736) | 320 | 1,187 | 41.7 | 4.8 | 238.9 | 10.2 |
| Ground beef 85/15, raw (SR 171796) | 400 | 860 | 74.4 | 60.0 | 0.0 | 0.0 |
| Tomato sauce, canned (SR 170054) | 400 | 96 | 4.8 | 1.2 | 21.2 | 6.0 |
| Onion (SR 170000) | 120 | 48 | 1.3 | 0.1 | 11.2 | 2.0 |
| Carrot (SR 170393) | 80 | 33 | 0.7 | 0.2 | 7.7 | 2.2 |
| Celery (SR 169988) | 60 | 8 | 0.4 | 0.1 | 1.8 | 1.0 |
| Garlic (SR 169230) | 10 | 15 | 0.6 | 0.1 | 3.3 | 0.2 |
| Olive oil (SR 171413) | 20 | 177 | 0.0 | 20.0 | 0.0 | 0.0 |
| Parmesan (SR 171247) | 30 | 126 | 8.5 | 8.4 | 4.2 | 0.0 |
| **Total** | 1,440 | **2,550** | 132.5 | 94.8 | 288.3 | 21.7 |
| **Per serving (1/4)** | | **638** | **33.1** | **23.7** | **72.1** | **5.4** |

Atwater cross-checks (634 vs 638 kcal; 743 vs 738) pass the 20% rule easily, which shows SR and IFCT-derived dishes are internally consistent. Note the Mexican bowl lands at 53 g protein per serving, so the planner will correctly use it as a high-protein dinner, and the dal tadka (9 g protein) as a side that needs a protein partner (curd, paneer, eggs), which is the sort of rule the diet generator should learn from the computed numbers rather than from authored labels.

---

## 4. Body map SVG

### 4.1 Candidates (cloned to `data/.cache/repos/`, licences read)

| Repo | Licence | Sexes | Views | Regions | Format | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **melihcolpan/MuscleMap** (Swift SDK, 279 stars, pushed 2026-10-16, pinned `5f576a5d3d`) | **MIT** (c) 2026 Melih Colpan | **male + female** | front + back | **36 regions** (22 base + 14 sub-groups): upper/lower chest, front deltoid, rear deltoid, rhomboids, rotator cuff, upper/lower trapezius, serratus, hip flexors, inner/outer quad, upper/lower abs, adductors, neck | SVG path strings inside `Sources/MuscleMap/Data/{Male,Female}{Front,Back}Paths.swift`, with `left`/`right` arrays and per-sex viewBoxes (male 727x1280, female 650x1450) | **Best source.** Strings are plain SVG `d` data, easy to extract with a 20-line script (done: see `data/.cache/bodymap/musclemap_*.svg`) |
| HichamELBSI/react-native-body-highlighter (297 stars, pushed 2026-10-18, `8ed39ac2ae`) | MIT (c) 2022 ELABBASSI Hicham | male + female | front + back | ~20 per view: abs, adductors, biceps, calves, chest, deltoids, forearm, gluteal, hamstring, lower-back, neck, obliques, quadriceps, tibialis, trapezius, triceps, upper-back, hands, feet, head, hair, knees, ankles | TypeScript arrays of `{slug, path:{common,left,right}}` (`assets/body*.ts`) | The original lineage (MuscleMap's slugs match it). Fewer regions; pure TS data, so a direct fallback |
| giavinh79/react-body-highlighter (53 stars) | MIT | male (anterior/posterior polygons) | front + back | ~14 | polygons "leveraged from react-native-body-highlighter" | Derivative; male only; no gain |
| soroojshehryar/react-muscle-highlighter (48 stars, 2026-01-07) | MIT | male + female | front + back | same slugs as HichamELBSI | TS path arrays | Derivative of the same art; no gain |
| vulovix/body-muscles (35 stars) | Apache-2.0 | male only (no "female" anywhere in `src`) | front + back | **70+ regions** | TS path data (`muscles.front.ts`, `muscles.back.ts`) | Most granular, no female model. Possible source for extra male detail |
| crmapache/js-rich-body-highlighter | MIT | male + female, light + dark | front + back | 14 muscle groups as masks over **raster PNG** illustration | PNG + masks | Prettiest but raster (not per-muscle SVG paths, bigger, harder to theme to the Solo Leveling look) |
| wger muscle images (https://wger.de/static/images/muscles/main/muscle-1.svg etc., 200) | CC-BY-SA (wger) | single | front/back overlays | 15 muscles | SVG overlays | Share-alike; skip |
| Wikimedia Commons (e.g. `File:Muscles_anterior_labeled.svg`) | varies, many CC-BY-SA or PD (unverified per file) | one sex, labelled anatomical | | | SVG/PNG | Not checked per file; labelled diagrams are poor as UI art. Skip |

### 4.2 What the real art looks like

I rendered all four MuscleMap models, one colour per region, to `data/.cache/bodymap/musclemap_{MaleFront,MaleBack,FemaleFront,FemaleBack}.png/.svg`. Measured SVG sizes: male front 38 KB, male back 26 KB, female front 46 KB, female back 28 KB (about 138 KB raw, ~25 KB gzipped for all four). Looking at the renders: a flat, stylised, anatomically plausible muscle layout; each muscle is its own path (`left`/`right` split). The male back shows the lat region as one large path ("upperBack"), traps split into upper/lower around the rhomboids, and a separate rear deltoid. The female models are real female proportions (hips, bust), not a re-scaled male.

### 4.3 Recommendation: reuse and adapt

1. Add `data/build-bodymap.mjs`: read the four Swift files from the pinned MuscleMap commit (download `https://raw.githubusercontent.com/melihcolpan/MuscleMap/5f576a5d3d.../Sources/MuscleMap/Data/<File>.swift`), regex out `slug` and the path strings, and emit `src/assets/bodymap/{male,female}-{front,back}.svg` with one `<path data-muscle="chest" data-side="left" d="...">` per region, plus `bodymap.json` (viewBox, slug -> canonical muscle id from the section 1.4 table).
2. Render with plain React + SVG and CSS variables (`fill: var(--heat-0..100)` for recovery colour, glow filter for selection, hit-testing by `data-muscle`). No dependency on a body-highlighter package: the data is the asset, and the component is ~60 lines.
3. Keep `THIRD_PARTY_NOTICES.md` entry: "Body map paths derived from MuscleMap (c) 2026 Melih Colpan, MIT, and the paths of react-native-body-highlighter (c) 2022 ELABBASSI Hicham, MIT." Include both MIT texts.
4. Restyle: strip fills and strokes, apply our palette (Solo Leveling blue holographic panels, purple shadow glow) with CSS only. The art becomes ours visually without redrawing anything.

### 4.4 Gaps we must fill ourselves (original paths)

| Gap | Fix |
| --- | --- |
| `abductors` (gluteus medius/outer hip) not drawn | Draw an original path overlapping the upper outer glute on the back view (sub-region of `gluteal`) and a lateral hip sliver on the front. Small work: one path per side per sex, 4 paths total |
| `lats` vs `upper_back` | MuscleMap `upperBack` is the lat region; `rhomboids` is the mid-back. Map `upperBack` -> `lats`, `rhomboids` -> `upper_back` (section 1.4). No new art |
| `side_delts` | MuscleMap `deltoids` is the parent; `frontDeltoid` and `rearDeltoid` are sub-regions drawn above it. Render order = deltoid first, then front/rear sub-paths on top, leaving the lateral head showing: correct without new art. Needs a visual check once rendered at phone size |
| `hip_flexors` visible only on front | Fine for the map; recovery engine still tracks it |
| Neck is two small shapes on the female back model, hair covers head | Accept; recovery is about muscles, not the head |
| Quality at small sizes | Verify tap targets: forearm slivers and calves split into 4 pieces each. Use a transparent hit-area path (stroke 12 px) per muscle group |

---

## 5. `/data` build layout (proposal for B1)

```
data/
  sources.lock.json            # url + sha256 + git commit of every download
  fetch.mjs                    # downloads to data/.cache/ (gitignored); verifies hashes
  build-exercises.mjs          # 1.2; sharp media conversion
  build-foods.mjs              # 2.4
  build-dishes.mjs             # 3.3 + validation 3.4
  build-bodymap.mjs            # 4.3
  src/
    muscle-map.json            # 1.4 dataset -> canonical
    equipment-map.json         # 1.5
    exercise-overrides.json    # manual matches, tier:core list, delt fixes, formCheck
    ingredients.curated.json   # ~450 ids -> source ref, tier, units, yield
    dishes/<country>.yaml      # ~40+ dishes each
  .cache/                      # downloads (gitignored; already in .gitignore)
src/data/                      # generated, committed or built in CI
  exercises.json  ingredients.json  dishes.<country>.json  bodymap.json
public/media/ex/               # generated WebP (not committed)
```

Pin everything: `fetch.mjs` refuses a changed file hash without `--update`, so a dataset change is a reviewed event, not a surprise.

---

## 6. Risks and open items

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Gym visual media terms | Redistribution rights are the hasan repo's; we convert and deploy copies | Private app; attribution everywhere; provider flag to swap; email Gym visual before any public launch |
| Name matching hasan <-> free-exercise-db only partly automatic | ~150 pairs need one-time human review | Review file generated by the build; decisions persisted in overrides |
| Delt split heuristic | Some shoulder exercises will map to the wrong delt head | Build report lists every guessed one; override file for fixes; core tier reviewed fully |
| `mistakes` field exists in no dataset | Empty for non-core exercises | Author for ~400 core exercises (LLM draft + review); UI hides the section when empty |
| IFCT numbers are raw only, ghee/oil energy missing, a few outliers | Wrong macros if unhandled | Atwater fallback and outlier report in the build (2.3); yield table |
| IFCT / nodef licence ambiguity (AGPL code; book data) | Public release could need NIN permission | Copy numbers only, credit properly, ask NIN before any public distribution |
| TheMealDB changed area vocabulary and is sparse | Not usable as a data source | Not used; section 3.2 documents the working query values |
| OFF availability (503 under load) | Scan sometimes fails | Offline cache, retry, manual entry fallback |
| ExerciseDB oss API throttling and dead hosted URLs | Not relied on | Not used |
| Image upstream provenance for free-exercise-db unverified | Low | Unlicense declared by the repo; keep credit |
| Equipment-less "None" in free-exercise-db (77) and 87 null mechanics | Wrong filter results | Rules in 1.3 and 1.5, plus override file |

---

## Findings

1. **hasan/exercises-dataset is the best single exercise source**: 1,324 exercises, 100% with GIF, primary + secondary muscles and step-split instructions in 10 languages including Hindi (useful for the Indian owner). It lacks `level`, `mechanic`, `force`, tips; the repo's media is (c) Gym visual, redistributed at 180x180 with mandatory attribution; data and text are MIT.
2. **free-exercise-db (Unlicense, 876 exercises)** has no animation (873 two-frame stills) but has the fields hasan lacks (`level`, `mechanic`, `force`, `category`, 228 tips) and ~600 exercises hasan lacks. Only ~270 match hasan automatically on names, so the union is about 1,900 exercises, with ~150 entries needing a one-time manual match.
3. **ExerciseDB** open tier is the same data family as hasan (identical taxonomy, 180x180 GIFs), caps at 1,500, is rate-limited (429 after ~700 rows), the hosted vercel API is dead (402), v2 needs a key, and the code is AGPL: not worth using. **wger** has only 932 exercises, 770 with muscles, 279 with an image, 46 with video (MOV), no GIFs, and share-alike licences: reference only.
4. **No source distinguishes front/side/rear delts**; every dataset says "shoulders/delts". A name/context rule set (section 1.4) is needed; it is the single lossy mapping.
5. **Media can be shrunk massively with sharp**: animated GIF to animated WebP is -71% (92.9 KB to 26.6 KB), JPG stills to 400 px WebP -81%. The whole library is ~35 MB (hasan) + ~18 MB (free-exercise-db) after conversion, versus ~220 MB raw. sharp runs on Windows 11 / Node 24 without a build toolchain.
6. **USDA SR Legacy is the right food backbone**: 7,793 foods, all five nutrients (1008, 1003, 1004, 1005; 1079 on 93%), CC0, 6 MB zip. Foundation Foods lacks id 1008 for most foods (kcal is in 2047/2048). Branded is 449 MB and unnecessary.
7. **IFCT 2017 is available machine-readable via `nodef/ifct2017` (542 foods)** with veg/non-veg tags, local names and all macros, but: raw values only, kJ energy, `choavldf` excludes fibre, oils and ghee have zero energy, and some outliers. Paneer, atta, 10+ dals, milk and eggs are present; curd and butter are not (use SR).
8. **Open Food Facts v2 barcode lookup works from a browser** (`Access-Control-Allow-Origin: *`, `X-User-Agent` header allowed). Search is throttled (10/min) and returned 503 in testing; the bulk dumps are 1.5-13 GB. Licence is ODbL/DbCL (data) and CC BY-SA (images).
9. **TheMealDB's `a=Indian` now returns null**; area values are now country names (`India` = 15 meals). Counts per country range 0-60, and Lebanon, South Korea, Pakistan have none. It cannot supply 40 dishes per cuisine.
10. **MuscleMap (MIT) has the best body-map art**: male and female, front and back, 36 regions as plain SVG path strings; we extracted and rendered all four (25-46 KB each). It lacks abductors; lats/rhomboids/delt heads map cleanly onto its regions.
11. **A three-dish computation confirmed the "grams in, macros out" method**: results (196 kcal/9 g protein dal tadka serving, 738 kcal/53 g protein burrito bowl, 638 kcal/33 g protein bolognese) are plausible and within ~8% of an Atwater check.
12. The MET values for each exercise class are verifiable in the 2024 Compendium (codes 02050, 02052, 02054, 02056, 02057, 02022, 02020, 02101, 02214, 02058).

## What we take

- **hasan/exercises-dataset** `data/exercises.json` (names, target, secondary muscles, equipment, `instruction_steps` en + hi, GIF + thumb) as the exercise spine, with its attribution.
- **free-exercise-db** `dist/exercises.json` for `level`, `mechanic`, `force`, `category`, tips, its ~600 extra exercises, and its still frames as media fallback.
- **Pinned downloads**: hasan `7455efae41`, free-exercise-db `f00c92c7dc`, nodef/ifct2017 `b65621ddcf`, MuscleMap `5f576a5d3d`, USDA SR Legacy 2018-04 and Foundation 2026-04-30 zips, with hashes in `sources.lock.json`.
- **USDA SR Legacy CSV** (nutrients 1008/1003/1004/1005/1079) and **IFCT compositions CSV** (`enerc`, `protcnt`, `fatce`, `choavldf`, `fibtg`, `tags`, `lang`) as nutrient sources, with the Atwater fallback and carbs-by-difference normalisation.
- **Open Food Facts v2** barcode endpoint, `X-User-Agent`, cached into Dexie.
- **MuscleMap path data** (MIT) for the four body models and their sub-regions; HichamELBSI original as a backup.
- The Compendium MET table and the 21-muscle list, delt rules, equipment canon and dataset mappings defined here.
- The "author in grams, compute at build time" dish pipeline with a validation gate.

## What we do better

- **Merge with an audit trail instead of picking one dataset**: spine + enrichment, overrides file, a review list for fuzzy matches, source ids kept on every row, and a provider flag on media so a licence problem is a one-line fix.
- **Real animation at a fraction of the weight**: GIF to animated WebP (-71%) with a "download full library" button and runtime caching; competitors either stream GIFs from a server or ship huge bundles.
- **Delt heads and abductors tracked individually** (21 muscles, front/side/rear delts, lats vs mid back) where the sources and most apps say just "shoulders" and "back"; the map highlights them, the recovery engine tracks them, and swap logic uses them.
- **Correct Indian nutrition**: IFCT numbers (atta, dals, paneer) instead of US approximations, with diet tags straight from IFCT, local names as search aliases, and Hindi instructions available.
- **Dish macros are computed, never typed**, validated at build time, with the diet type and price tier derived from ingredients, so the diet generator can filter vegetarian/eggetarian/vegan and budget mode reliably.
- **Honest data gaps**: `mistakes`, price tier and form-check support are authored where they matter (core tier) rather than faked from a dataset that does not have them.
- **Pinned, hashed downloads** so a dataset update is a reviewed change and builds are reproducible.

## Sources

Exercises
- yuhonas/free-exercise-db: https://github.com/yuhonas/free-exercise-db ; data https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json ; images base https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/ ; licence https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/LICENSE.md ; lineage https://github.com/wrkout/exercises.json
- hasaneyldrm/exercises-dataset: https://github.com/hasaneyldrm/exercises-dataset ; data https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json ; schema https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.schema.json ; GIF pattern `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/<file>.gif` ; `NOTICE.md` and `LICENSE` in the repo ; media owner https://gymvisual.com/ (terms https://gymvisual.com/content/3-terms-and-conditions-of-use) ; third-party summary https://www.sourcepulse.org/projects/31522445
- ExerciseDB: https://github.com/ExerciseDB/exercisedb-api (AGPL-3.0) ; open API https://oss.exercisedb.dev/api/v1/exercises?limit=100 ; GIF host https://static.exercisedb.dev/media/ ; ToS https://dub.sh/exercisedb-api-tos ; dead hosted API https://exercisedb-api.vercel.app/api/v1/exercises (HTTP 402)
- wger: https://wger.de/api/v2/exerciseinfo/ ; muscle overlays https://wger.de/static/images/muscles/main/muscle-1.svg ; licences https://creativecommons.org/licenses/by-sa/4.0/
- Compendium of Physical Activities (2024): https://pacompendium.com/ and https://pacompendium.com/conditioning-exercise/
- sharp: https://sharp.pixelplumbing.com/ (npm `sharp` 0.35.5 tested)

Food
- USDA FoodData Central downloads: https://fdc.nal.usda.gov/download-datasets/ ; SR Legacy CSV https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip ; Foundation CSV https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip ; FNDDS https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip ; licence statement https://fdc.nal.usda.gov/ and https://catalog.data.gov/dataset/fooddata-central
- Open Food Facts API docs https://openfoodfacts.github.io/openfoodfacts-server/api/ ; product https://world.openfoodfacts.org/api/v2/product/3017620422003.json ; bulk https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz ; search-a-licious https://search.openfoodfacts.org
- IFCT 2017: https://github.com/nodef/ifct2017 ; https://raw.githubusercontent.com/nodef/ifct2017/main/compositions/index.csv ; https://raw.githubusercontent.com/nodef/ifct2017/main/descriptions/index.csv ; https://raw.githubusercontent.com/nodef/ifct2017/main/columns/index.csv ; site https://ifct2017.github.io ; npm https://www.npmjs.com/package/ifct2017 and https://www.npmjs.com/package/@ifct2017/compositions ; JSR https://jsr.io/@nodef/ifct2017

Cuisines
- TheMealDB: https://www.themealdb.com/api.php ; https://www.themealdb.com/api/json/v1/1/list.php?a=list ; https://www.themealdb.com/api/json/v1/1/filter.php?a=India
- Wikipedia dish lists: https://en.wikipedia.org/wiki/List_of_Indian_dishes (and the sibling `List_of_*_dishes` pages tested in section 3.2)

Body map
- https://github.com/melihcolpan/MuscleMap (MIT) ; https://github.com/HichamELBSI/react-native-body-highlighter (MIT) ; https://github.com/giavinh79/react-body-highlighter ; https://github.com/soroojshehryar/react-muscle-highlighter ; https://github.com/vulovix/body-muscles (Apache-2.0) ; https://github.com/crmapache/js-rich-body-highlighter
- Local renders: `C:\shadow-systen-project\data\.cache\bodymap\musclemap_*.svg|png`
