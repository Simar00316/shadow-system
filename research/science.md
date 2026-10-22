# R5 - Exercise and nutrition science (targets for the Shadow System engines)

Track R5, feeds engines B3.1 to B3.7 and the safety rules in PRD section 3. Written 2026-10-23.

**Evidence tags used on every number**

- **[R]** read in a page I opened (URL in Sources, "Opened").
- **[S]** seen only in a search-result excerpt or a secondary summary. Page not opened or not readable. Treat as "probably right, re-verify before shipping".
- **[D]** our design parameter. No published number exists. The literature gives the direction, we pick the number and expose it as a tunable constant. Calibrate against user logs.
- **[U]** recalled from memory, not verified in this session.

**Access limits (be honest about gaps).** PubMed pages are cookie-walled, so abstracts came from Europe PMC records and PMC full texts. The Europe PMC reader paraphrases rather than quoting, so exact abstract wording is not reproduced. The ACSM 2009 stand was read in full from a PDF (text-extracted). Not openable: Kilgore/Rippetoe tables (ExRx 403), Fitbod help centre (403), EFSA full opinion (403), several RP Strength pages (HTTP 429 rate limit), Zourdos 2016 full text, Garber 2011 ACSM full text (the PDF I got was the 1998 ACSM stand).

---

## 0. Corrections to the PRD at a glance

| # | PRD item | Verdict | Fix |
|---|---|---|---|
| 1 | Fighter 3-6 reps, 80-90%, rest 2-4 min | Good for intermediate and advanced. Wrong as a day-one prescription. | Add a beginner on-ramp (8-12 reps at 60-70%, RIR 3-4) per ACSM 2009 [R]. Rest 2-3 min on core lifts, up to 3-5 min on 85%+ sets. |
| 2 | Tank 6-12 reps, 65-80%, rest 60-120 s | Reps and %1RM consistent. Rest too short for heavy compounds. | Compounds 2-3 min, isolation 60-90 s. Allow 10-20 reps on isolation and machine work. |
| 3 | Assassin 12-20+ reps, 50-65%, rest 30-60 s | OK for circuits and isolation. | 60-90 s on squat/deadlift patterns at 15+ reps. Add the 150 min/week aerobic prescription (ACSM 2011). |
| 4 | Ranger 5-10 reps at 60-80% | Internally inconsistent: 10 reps at 60% is about 10 reps short of failure. | Heavy 3-5 at 82-90%, medium 6-8 at 72-80%, light 10-12 at 65-72%, all at RIR 1-3. Power sets 3-6 reps at 30-60%, not to failure. |
| 5 | Healer "holds and tempo" | Needs numbers. | 2 x 30 s static holds per stretch (60 s total), 10-30 s minimum hold, 30-60 s for older adults. |
| 6 | Load jumps 2.5 kg upper / 5 kg lower | Fine for barbell lifts of 40 kg and above. Exceeds the ACSM 10% ceiling on light lifts. | Increment = clamp(2.5 or 5 kg, 2%, 10% of working load). Below that use 1-1.25 kg plates or add a rep. |
| 7 | "Add load at RIR 1-2" | Fine. | Require 2 consecutive sessions for intermediate and advanced (ACSM), 1 session for beginners. |
| 8 | XP "scaled by RIR effort" | Risk: rewards failure. | XP weight flat for RIR 0-1. Failure adds no benefit (ACSM 2026) and slows recovery. |
| 9 | Safe weekly cap | Not numbered. | Per-muscle caps in section 2, max 25 hard sets for any muscle at any level. |
| 10 | Bulk +5-15% | Reasonable. | Split by level: beginner +10-15%, intermediate +10%, advanced +5% (Iraki 2019). |

---

## 1. Per-goal prescription (rep range, %1RM, sets, rest, frequency)

### 1.1 What the position stands and reviews say

| Goal | Reps | Load | Sets | Rest | Frequency | Source |
|---|---|---|---|---|---|---|
| Strength, novice/intermediate | 8-12 RM | 60-70% 1RM or more | 1-3 per exercise | 2-3 min core lifts, 1-2 min assistance | 2-3 d/wk whole body (novice), 3-4 d/wk (intermediate) | ACSM 2009 [R] |
| Strength, advanced | 1-6 RM emphasis, cycled | 80-100% 1RM | 3-6 per exercise | 3-5 min heavy | 4-5 d/wk | ACSM 2009 [R] |
| Strength, current evidence | not specified | at least 80% 1RM (dose-response) | 2-3 per exercise per session | no firm recommendation (under 1 vs over 1 min no difference) | at least 2 sessions/wk | ACSM 2026 overview of reviews [R] |
| Strength rest, trained men | - | - | - | 3 min beat 1 min for squat/bench strength and quad thickness (n=21, 8 wk) | - | Schoenfeld 2016 rest [R, paraphrased abstract] |
| Hypertrophy, novice/intermediate | 8-12 | 70-85% | 1-3 per exercise | 1-2 min | 2-3 d/wk total body, or 4 d/wk upper/lower | ACSM 2009 [R] |
| Hypertrophy, advanced | 1-12, mostly 6-12 RM | 70-100% | 3-6 per exercise | 2-3 min for heavy core lifts, 1-2 min others | 4-6 d/wk split | ACSM 2009 [R] |
| Hypertrophy, current evidence | any | 30-100% 1RM gives similar growth when effort matched | at least 10 weekly sets per muscle, plateau about 18-20 | not decisive | 1 vs 5+ days equal when volume equal | ACSM 2026 [R]; Schoenfeld 2021 continuum [R] |
| Hypertrophy, volume | - | - | 12-20 weekly sets "optimum" in trained young men | - | - | Baz-Valle 2022 [S] |
| Hypertrophy, frequency | - | - | - | - | each muscle at least 2x/wk beats 1x | Schoenfeld 2016 frequency [R, paraphrased abstract] |
| Local muscular endurance | 10-15 (novice/intermediate), 10-25+ (advanced) | light, about 40-60% for 15+ reps | moderate to high volume | under 1 min for 10-15 reps, 1-2 min for 15-20+ reps | 2-3 d/wk novice, 3 d/wk intermediate, 4-6 d/wk advanced | ACSM 2009 [R] |
| Endurance (repetition continuum) | 15+ | under 60% | - | - | evidence "weak and mixed" | Schoenfeld 2021 [R] |
| Power | 3-6 reps, not to failure | 30-60% (upper body), 0-60% (lower), heavy 85-100% for force | 1-3 | 2-3 min | 2-3 d/wk novice, 3-4 intermediate, 4-5 advanced | ACSM 2009 [R] |
| Older adults (about 50-60+) | 8-12 (ACSM 2009), 10-15 (ACSM 1998) | 60-80% | 1-3 | 1-3 min | 2-3 d/wk | ACSM 2009 [R], ACSM 1998 [R] |
| Novice rule | - | 8-12 RM, 2-10% load jump when 1-2 reps over target on 2 consecutive sessions (smaller % for small muscles) | 1-3 | - | - | ACSM 2009 [R] |
| App benchmarks | Strength 1-6 reps at 85-100%, 3-5 min rest. Hypertrophy 6-12 reps, 10-20 sets per muscle per week. RIR 1-2 hypertrophy, 2-3 strength. | | | | | Fitbod [R, algorithm blog] |

**Repetitions to percent cross-check.** Use Epley: reps to failure n = 30 x (1/p - 1), where p is the fraction of 1RM [R, Wikipedia formula]. At RIR r the planned reps are n - r.

| p (%1RM) | n to failure | reps at RIR 1 | RIR 2 | RIR 3 |
|---|---|---|---|---|
| 90% | 3.3 | 2 | 1 | - |
| 85% | 5.3 | 4 | 3 | 2 |
| 80% | 7.5 | 6 | 5 | 4 |
| 75% | 10 | 9 | 8 | 7 |
| 70% | 12.9 | 11 | 10 | 9 |
| 65% | 16.2 | 15 | 14 | 13 |
| 60% | 20 | 19 | 18 | 17 |
| 50% | 30 | 29 | 28 | 27 |

Reading: the Fighter box (3-6 reps at 80-90%) is consistent only at RIR 1-3. The Ranger box (5-10 reps at 60-80%) is not: 10 reps at 60% is RIR 10, which is warm-up work.

### 1.2 Recommended engine tables (replace PRD class table values)

Level definitions (ACSM calls about 6 months of consistent training "intermediate" [R]; Strength Level uses 1 month / 6 months / 2 years / 5 years for beginner/novice/intermediate/advanced [R]):

- Beginner = under 6 months consistent training, or returning after 1+ year off.
- Intermediate = 6 months to 2 years.
- Advanced = over 2 years, or e1RM standards at Advanced (section 8).

| Class | Level | Reps | Load (%1RM / RIR target) | Sets per exercise | Rest | Session freq per muscle |
|---|---|---|---|---|---|---|
| Fighter | Beginner | 5-8 (first 4 weeks 8-12) | 65-80%, RIR 3-4 then 2-3 | 2-3 | 2-3 min | 2x/wk |
| Fighter | Intermediate | 3-6 | 80-88%, RIR 1-3 | 3-5 | 2-4 min | 2x/wk |
| Fighter | Advanced | 1-6 (top set + back-off 6-8 at 75%) | 80-92%, RIR 0.5-3 | 3-6 | 3-5 min | 2-3x/wk |
| Tank | Beginner | 8-12 | 65-75%, RIR 3-4 | 2-3 | compounds 2 min, isolation 60-90 s | 2x/wk |
| Tank | Intermediate | 6-12 compounds, 10-20 isolation | 65-80%, RIR 1-3 | 3-4 | compounds 2-3 min, isolation 60-90 s | 2x/wk |
| Tank | Advanced | 5-12 compounds, 10-25 isolation | 62-82%, RIR 0-3 | 3-5 | 2-3 min compounds | 2-3x/wk |
| Assassin | Beginner | 12-15 | 50-60%, RIR 3-4 | 2-3 | 60 s | 2-3x/wk |
| Assassin | Int/Adv | 12-25 | 45-65% | 3-4 | 30-60 s (isolation, circuits), 60-90 s (squat/deadlift patterns) | 3x/wk |
| Ranger | Beginner | 8-12 (like Tank beginner) | 60-70%, RIR 3 | 2-3 | 90-120 s | 3x/wk full body |
| Ranger | Int/Adv | Heavy day 3-5, medium 6-8, light 10-12, power 3-6 (not to failure) | 82-90 / 72-80 / 65-72 / 30-60% | 3-5 | 2-3 min heavy/power, 60-120 s others | 3-4 d/wk |
| Healer | all | Holds 30 s x 2 per stretch (total 60 s per stretch); strength: 8-12 reps at 3 s lowering | bodyweight or light, RIR 3-4 | 1-3 | 30-60 s | daily mobility, 2-3 strength sessions |

Sources for the table: ACSM 2009 [R] for the structure, ACSM 2026 [R] for effort/volume, Epley cross-check above for %1RM, and [D] for the exact beginner on-ramp numbers.

---

## 2. Weekly volume per muscle and SAFE WEEKLY CAP

### 2.1 Evidence on dose

- Schoenfeld 2017 meta-analysis: 15 studies, 34 groups. Each extra weekly set adds about 0.023 effect size, equal to about +0.37% muscle gain. More sets, more growth ("graded dose-response"). Categories under 5 / 5-9 / 10+ only trended (P=0.074) [R, paraphrased abstract].
- ACSM 2026 overview of reviews: at least 10 weekly sets per muscle (dose-response), diminishing returns beyond about 18-20 [R].
- Baz-Valle 2022: low (under 12), moderate (12-20), high (over 20) weekly sets. Moderate and high gave similar quadriceps and biceps growth. High was better only for triceps (P=0.01). Suggested optimum 12-20 sets in young trained men [S].
- ACSM 2009: about 8 sets per muscle group gave the largest effect size in athletes (meta-analysis of 37 studies); novices respond equally to 2-4 sets [R].
- RP Strength definitions: MV (maintenance) about 6 sets/muscle/week when trained at least twice weekly; MEV (minimum effective), MAV (maximum adaptive), MRV (maximum recoverable) [R, rpstrength landmarks page]. RP advises no more than about 8-12 sets per muscle per session [S, bicep page search excerpt].
- Pelland 2024 meta-regression (67 studies, 2,058 subjects): hypertrophy curve is square-root shaped, strength curve flattens fast [S, SportRxiv preprint excerpt].
- Proximity to failure: closer to failure gives more hypertrophy, strength similar across a wide RIR range (Robinson 2024 [S]). ACSM 2026: failure not needed, about 2-3 RIR suggested [R].

### 2.2 Counting rule (what is one "hard set")

[D, built on the sources above]

- Count only working sets, not warm-up.
- Load at least 30% 1RM (Schoenfeld 2021: about 30% is the minimum for hypertrophy [R]).
- Credit by effort: RIR 0-3 = 1.0 set, RIR 4 = 0.5 set, RIR 5+ = 0 (technique or warm-up).
- Direct set on the target muscle = 1.0, synergist (e.g. triceps on bench press) = 0.5. This fractional counting matches how RP says chest work covers triceps and front delts [S].
- Cap sets per muscle per session at 12 (RP 8-12 [S]); credit above this is zero in XP.

### 2.3 Landmarks and safe caps (hard sets per muscle per week)

RP values are intermediate-lifter figures (about 3-7 years training) from RP articles [S unless noted]. Where RP gave no value I mark the figure [D]. The three cap columns are what the XP engine uses.

| Muscle | MV | MEV | MAV | MRV (RP, intermediate) | **Cap Beginner** | **Cap Intermediate** | **Cap Advanced** |
|---|---|---|---|---|---|---|---|
| Chest | 2-4 | 4-6 | 6-16 | 16-24 | 12 | 20 | 24 |
| Back (lats, rhomboids, erectors) | about 6 | 10+ | 10-20 | about 20 (2 sessions/wk), more with more sessions | 12 | 22 | 25 |
| Quadriceps | 2-4 | 4-6 | 6-14 | 14-18 | 10 | 18 | 20 |
| Hamstrings | about 3 | 4+ | 6-12 [D] | 14-18 [D, third-party 16-18] | 8 | 14 | 18 |
| Glutes | 2-6 | 6-8 | 8-24 | 24-30 | 10 | 20 | 24 |
| Side delts | 0-4 [D] | 4-6 [D] | 8-20 [D] | 20-26 [D] | 10 | 20 | 24 |
| Rear delts | 0-4 | 0-4 | 4-12 | 12-20 | 8 | 16 | 20 |
| Front delts | 0-2 | 0-2 | 4-8 | 8-12 | 4 | 8 | 12 |
| Biceps | 0-4 [D] | 4-6 [D] | 8-16 [D] | about 20 (2 sessions), about 25 (3 sessions) | 8 | 20 | 25 |
| Triceps | 0-4 | 4-6 | 6-16 | 16-20 (direct only 18) | 8 | 18 | 20 |
| Calves | 2-4 | 4-6 | 6-16 | 16-24 | 8 | 20 | 24 |
| Traps | 0-4 | 0-4 | 4-12 | 12-20 | 6 | 16 | 20 |
| Abs | 0 | 0-4 | 8-16 [D] | 16-20 [D] | 8 | 16 | 20 |
| Forearms [D] | 0 | 0-4 | 4-12 | 12-16 | 6 | 12 | 16 |

Cap logic [D]: cap = RP MRV upper bound for intermediates, about 0.55-0.6x that for beginners (ACSM novice sets 1-3 per exercise, RP "beginners should expect lower numbers" [S]), about 1.2x for advanced, hard ceiling 25 sets per muscle per week for everyone. The ceiling sits just above the ACSM 2026 plateau (18-20) and Baz-Valle (over 20 helped only triceps). Rule for the XP engine: sets beyond the cap in a rolling 7-day window earn 0 XP and show a System warning. Never push the user to the cap: the plan generator targets the MAV band (about 10-20 sets) not the cap.

Plan generator defaults per level [D, from the sources above]: beginner 6-12 sets/muscle/week, intermediate 10-18, advanced 12-22. Weekly ramp inside a mesocycle: +1 set per muscle per week from MEV toward MAV, then deload (RP landmarks approach [S]).

Caveat: RP numbers are expert practice, not trial data. Chest MEV differs across RP versions (older RP versions and third-party calculators list chest 8 / 12-20 / 22+; the newer RP page lists 4-6 / 6-16 / 16-24). The caps above are the same under either version.

---

## 3. RIR/RPE, autoregulation, progression, plateau, deload

### 3.1 RIR/RPE mapping (Zourdos 2016 scale)

Zourdos et al. 2016 validated the RIR-based RPE scale in 29 squatters (RPE 10 = 0 RIR, RPE 9 = 1 RIR); velocity and RPE were strongly inversely related (r = -0.88 in experienced squatters) [S, Europe PMC and search excerpt]. Table from the RippedBody course (Helms-affiliated) [R]:

| RPE | RIR | Meaning | Engine use |
|---|---|---|---|
| 10 | 0 | no more reps possible | counts as RIR 0 |
| 9.5 | 0 | could add a little load | RIR 0 |
| 9 | 1 | one more rep | RIR 1 |
| 8.5 | 1-2 | one rep likely | RIR 1 |
| 8 | 2 | two more | RIR 2 |
| 7.5 | 2-3 | | RIR 2 |
| 7 | 3 | three more | RIR 3 |
| 6-5 | 4-6 | easy | RIR 4 / 5+ |

Accuracy notes [R, RippedBody]: a 2022 meta-analysis (n=414) found RIR ratings underestimate reps by about 1 on average. Ratings 3-4 RIR are underestimated more than 1-2 RIR. Accuracy worsens above about 12 reps per set. It is a skill that improves with practice. Engine rules [D]: input is 0, 1, 2, 3, 4, 5+; for sets over 12 reps treat RIR as approximate and do not use it to trigger load changes.

### 3.2 Autoregulation rules

From RippedBody [R]: aim 2-4 RIR set after set; reported 1 RIR = too heavy, 5+ = too light; adjust about 4% of load per rep off target (2 reps off = about 8%). Engine rules [D, built on that and ACSM 2-10%]:

1. error = reported RIR - target RIR (positive = easier than planned).
2. Next set load change = 4% x error, clamped to +-10% (ACSM 2-10% ceiling [R]), rounded to the equipment step.
3. Across sessions: if the first working set is 2+ RIR easier than target on two consecutive sessions, add load next session. If 2+ RIR harder on two consecutive sessions, drop load 5%.
4. Do not auto-add load on lifts with unknown technique quality (beginner, first 4 sessions of a new lift).
5. Daily readiness tier modifies the RIR target (section 5.4).

### 3.3 Progression models and increments

| Model | Used by | Rule | Increment |
|---|---|---|---|
| Linear | Beginners, all classes | If all prescribed reps done at RIR 1 or more, add load next session. 2 misses in a row = repeat load, 3 = drop 10% and rebuild. | 2.5 kg upper, 5 kg lower [PRD, matches ACSM 2-10%]. Rule: inc = clamp(base, 2%, 10% of load). Barbell 40 kg bench +2.5 kg = 6%. Dumbbell curl 12 kg +2.5 kg = 21% so use +1 kg or add reps. |
| Double progression | Tank, Assassin, intermediate Fighter | Fixed rep range per exercise (e.g. 6-10). When all sets hit the top at RIR 1 or more (intermediate/advanced: on 2 consecutive sessions, per ACSM), add load and reset to the bottom of the range. | +2.5 kg upper / +5 kg lower, i.e. 2-10% (ACSM: smaller % for small muscle masses, larger for big [R]) |
| Undulating | Ranger, advanced Fighter | Rotate heavy, medium, light sessions inside the week. ACSM example: 3-5 RM, 8-10 RM, 12-15 RM loads rotated [R]. Each day type has its own double progression. ACSM notes undulating beat classical periodisation over 12 weeks and helped women [R]. | same increments, per day type |
| Density (Assassin) | Assassin | Add reps, then cut rest by 5-10 s down to 30 s | - |

Typical absolute increments by lift, for the plan generator [D]: squat/deadlift/leg press +5 kg (+2.5 kg once lift is over 1.5x bodyweight), bench/row/pulldown +2.5 kg, OHP +1.25-2.5 kg, dumbbell/isolation +1-2 kg or +1 rep.

### 3.4 Plateau definition

- Stall = the conservative e1RM (section 4) of the best working set does not exceed the rolling best by at least 1%, over 3 consecutive exposures of that lift, with RIR logged at 3 or less on the top set. [D; PRD already says 3 stalled sessions.] Rogerson 2024: 46-54% of athletes deload when performance stalls [R].
- Response order: (1) check readiness/sleep/calories flags; (2) micro-load (+1.25 kg or +1 rep); (3) variation swap through smart swap; (4) 7-day lift-specific deload (-10% load, rebuild); (5) if 2 or more lifts stall in the same week, trigger the whole-body deload.

### 3.5 Deload triggers and prescription

Evidence:
- Rogerson 2024 survey (n=246 competitive athletes): deloads last 6.4 +- 1.7 days (range 1-14), every 5.6 +- 2.3 weeks (range 1-12). 47% pre-planned, 39% hybrid, 13% reactive. Main triggers: programme says so 65%, feeling beat up 63%, stalls or decreases 54% (listed; data inconsistency noted by the paper: 113/246 = 46%), old injuries flaring 31%, high external stress 31%. Weekly sets reduced by 79% of athletes, reps per set by 53%, multi-joint load by 84%, effort (RIR) lowered by 85%. Frequency unchanged for 63%. No percentage reduction published [R].
- Bell 2022 coach interviews (n=18): 5-7 days, every 4-6 weeks [R via Europe PMC summary].
- Bell 2023 Delphi consensus (34/29/21 coaches over 3 rounds): deload every mesocycle (100%), last week of a mesocycle (95.2%), unchanged exercises (100%), lower sets/reps (100%), frequency unchanged (100%), no consensus on specific %1RM or RIR targets, no sex-specific deloads (84.6% disagree) [R].

Engine rules:

| Item | Value | Source |
|---|---|---|
| Scheduled deload, beginner | every 8 weeks (low accumulated fatigue) | [D]; Delphi: depends on response |
| Scheduled deload, intermediate | every 6 weeks | [R] mean 5.6 weeks |
| Scheduled deload, advanced | every 4-5 weeks | [R] Bell 2022 4-6 weeks |
| Hard upper bound | never beyond 8 weeks without one | [D] |
| Reactive trigger A | e1RM drops 5% or more on 2 or more lifts across 2 consecutive sessions | [D] |
| Reactive trigger B | mean readiness 2.5 or lower (1-5 scale) on 3 of the last 7 days | [D], Saw 2016 [S] (subjective measures track load more sensitively than objective ones) |
| Reactive trigger C | 2 or more lifts flagged "stalled" in the same week | [D] |
| Reactive trigger D | pain/injury flag, or user taps "I feel beat up" | Rogerson [R] |
| Duration | 5-7 days (one training week), keep the training frequency | [R] 6.4 d, frequency unchanged |
| Sets | -40 to -50% vs last week, never below MV (about 6 sets/muscle/week) | [D]: direction [R] (79% cut sets), size unpublished |
| Load | -10% on multi-joint lifts (84% of athletes lower it) | [D] size, direction [R] |
| Effort | target RIR 4-5 | [D], direction [R] (85% lower effort) |
| Exercises | same as the previous block, no novelty | [R] Delphi 100% |
| Game framing | "Recovery Phase": bonus VIT, full Daily Quest XP | PRD |

---

## 4. One-rep max

Formulas (w = weight lifted, r = reps) [R, Wikipedia One-repetition maximum]:

- Epley: 1RM = w x (1 + r/30), for r > 1.
- Brzycki: 1RM = w x 36 / (37 - r). Singularity at r = 37.
- The two are identical at 10 reps; below 10 Epley is higher (100 lb x 6 gives about 120 lb Epley vs 116 lb Brzycki). Above 10 reps they diverge sharply. Estimates can be 10% or more off. Most formulas were developed on experienced lifters; novices' real 1RM may be much lower [R].
- Accuracy in the original LeSuer 1997 comparison (67 untrained students; 7 equations): r above 0.95 for all, but all equations underestimated deadlift [S, secondary].

| Reps r | Epley multiplier | Brzycki multiplier | Use (minimum) | % of 1RM (Brzycki) |
|---|---|---|---|---|
| 1 | 1.000 | 1.000 | 1.000 | 100% |
| 2 | 1.067 | 1.029 | 1.029 | 97% |
| 3 | 1.100 | 1.059 | 1.059 | 94% |
| 4 | 1.133 | 1.091 | 1.091 | 92% |
| 5 | 1.167 | 1.125 | 1.125 | 89% |
| 6 | 1.200 | 1.161 | 1.161 | 86% |
| 7 | 1.233 | 1.200 | 1.200 | 83% |
| 8 | 1.267 | 1.241 | 1.241 | 81% |
| 9 | 1.300 | 1.286 | 1.286 | 78% |
| 10 | 1.333 | 1.333 | 1.333 | 75% |

**Engine rules [D, built on the above]**

1. e1RM = min(Epley, Brzycki) for r from 1 to 10 (this equals Brzycki everywhere in the valid range). Reps above 10 are not used for e1RM (store the set, mark "not valid for 1RM"). PRD wording "take the more conservative" is confirmed.
2. If the user logs RIR, use r_eff = reps + RIR and require r_eff at most 10. If the user's RIR is 4 or more, do not update e1RM from that set. If r_eff exceeds 10, ignore.
3. Update the stored e1RM only when the new estimate is higher than the old one, or lower on 2 consecutive top sets (stops one bad day dragging the number down).
4. Bodyweight movements (push-ups, pull-ups): use added load plus bodyweight, same formula.
5. Beginners skip loaded 1RM tests (PRD). Derive e1RM only after 4 weeks and from a 5-8 rep set.
6. For Power Level (section 8) the 1RM input is the best conservative e1RM from the last 8 weeks.

---

## 5. Recovery decay model

### 5.1 Evidence anchors

- ACSM 2009: novices train the whole body 2-3 d/wk, which implies at least one rest day between sessions for the same muscle [R]. Fitbod ranks exercises lower for muscles trained within roughly 48-72 h and shows recovery 0-100% per muscle [R, Fitbod algorithm blog]. Fitbod support documentation mentions up to 6-7 days for full recovery from a very hard session [S, search excerpts conflicting].
- MacDougall 1995: muscle protein synthesis +50% at 4 h, +109% at 24 h, within 14% of control (not significant) by 36 h [R, Europe PMC abstract summary]. This is an anabolic signal timeline, not a functional recovery timeline.
- Morán-Navarro 2017: resistance training to failure slows recovery of neuromuscular function up to 24-48 h versus non-failure sets of equal or larger volume (n=10) [S].
- Pareja-Blanco 2019: squat sessions with 40% velocity loss or 60% 1RM (more reps) produced more fatigue and slower recovery than 20% loss or 80% 1RM. At 80% 1RM with 20% loss, jump height and velocity were back to baseline by 48 h; other conditions had not fully recovered by 48 h [R].
- Damas 2018 (10-week study, n=10): damage is high in week 1, attenuated by week 3, absent by week 10 (repeated bout effect) [R, Europe PMC summary].
- Muscle-size dependence is weak: I found no peer-reviewed comparison showing large muscles recover slower than small ones (a small unpublished thesis and an adolescent abstract suggest recovery depends on the exercise: bench press needed over 24 h, back squat appeared recovered at 24 h) [S]. Fitbod uses one 48-72 h window for all muscles [R]. So tiering by muscle size below is a mild [D] assumption, flagged for calibration.
- Hunter 2014: women recover power and rate of force development more slowly after maximal lengthening contractions, similar or smaller force loss for isometric/low-intensity work [R]. No numeric recovery multiplier exists, so the model has no sex modifier.

### 5.2 Model

Per muscle m the engine keeps a fatigue stock FP_m (fatigue points). Capacity K = 10 FP is "0% recovered".

```
FP_m(t) = sum_i FP_i * 0.5 ^ ((t - t_i) / T_half_m)       // exponential decay, hours
recovery_m(t) = 100 * (1 - min(1, FP_m(t) / K))          // 0-100%
```

**Per resistance set** [D]:

```
FP_set = E(RIR) * L(%1RM) * S(muscle role) * N(novelty)
E(RIR) = max(0.25, 1 - 0.15 * RIR)    // RIR0 1.00, 1: 0.85, 2: 0.70, 3: 0.55, 4: 0.40, 5+: 0.25
L: <60% 1RM -> 1.10 ; 60-80% -> 1.00 ; >80% -> 0.90   // lighter loads to the same effort mean more reps and more fatigue (Pareja-Blanco 2019)
S: primary mover 1.0 ; synergist 0.5
N: first 7 days with a new exercise x1.5, days 8-14 x1.3, days 15-21 x1.15, afterwards 1.0   // Damas 2018 repeated-bout effect
```

A typical session: 6 sets at RIR 2, 60-80%, primary = 6 x 0.70 = 4.2 FP, so recovery 58% right after. A hard session: 12 sets at RIR 1 = 10.2 FP, 0% recovery.

**Per-muscle half-lives** [D, anchored so that 90% recovery after a full-capacity session lands at 48-96 h]:

| Muscle group | T_half (h) | 90% recovered after a full session (3.32 x T_half) |
|---|---|---|
| Quads, glutes, hamstrings, back (lats/erectors) | 24 | about 80 h |
| Chest | 22 | about 73 h |
| Shoulders, triceps, traps | 20 | about 66 h |
| Biceps, forearms, calves, abs | 16 | about 53 h |

Check against the evidence: after the typical 6-set session (FP 4.2) the quads reach 90% in T_half x log2(4.2) = 50 h, matching the 48-72 h Fitbod window and ACSM's 2-3 d/wk. After a very hard session (FP = K) recovery is 75% at 48 h and 98% at 144 h (the 6-day figure).

Age 60+: multiply T_half by 1.25 [D, no sourced number]. Manual override: user sets a muscle's recovery directly, which rewrites FP so decay continues from there.

**Gates** (from PRD):
- Recovery under 30%: no XP for that muscle (PRD safety rule).
- Recommender: "ready" at 70% or more (that is the value reached 48 h after a full-capacity session with T_half 24 h), "partial" 30-70%, "avoid" under 30%.

### 5.3 Cardio fatigue

Direct acute-fatigue trials are not available in what I could open. Wilson 2012 (21 studies, 422 effect sizes): interference with hypertrophy and strength occurred with running, not cycling, and grew with endurance frequency (r = -0.26 to -0.35) and duration (r = -0.29 to -0.75) [R, Europe PMC abstract summary]. Schumann 2022 (43 studies): concurrent training did not impair maximal strength or hypertrophy, regardless of cycling vs running [S]. Combined reading: chronic interference is small, but acute leg fatigue after running is real; explosive strength is the most sensitive. Model [D]:

```
CLU = max(0, MET - 3) * hours           // Compendium MET (section 9); light walking under 3 MET adds nothing
FP_m += c(mode, m) * CLU * (1.2 if HIIT)
```

| Mode | quads | hamstrings | glutes | calves | back | arms | shoulders |
|---|---|---|---|---|---|---|---|
| Running (impact, eccentric) | 1.0 | 0.7 | 0.7 | 1.0 | 0 | 0 | 0 |
| Cycling | 0.6 | 0.4 | 0.5 | 0.2 | 0 | 0 | 0 |
| Rowing | 0.5 | 0.3 | 0.5 | 0.1 | 0.6 | 0.3 | 0.2 |
| Elliptical | 0.5 | 0.3 | 0.4 | 0.4 | 0 | 0 | 0 |
| Stair climber | 0.9 | 0.5 | 0.9 | 0.7 | 0 | 0 | 0 |
| Swimming | 0.2 | 0.1 | 0.1 | 0.1 | 0.5 | 0.3 | 0.6 |
| Jump rope | 0.6 | 0.2 | 0.3 | 1.0 | 0 | 0 | 0 |

Worked examples at K = 10: 30 min run at 9.8 MET = 3.4 CLU, quads 34% fatigued, so recovery 66%. 60 min run at 9.8 MET = 6.8, quads 68% fatigued. 60 min cycling at 6.8 MET = 3.8 x 0.6 = 2.3, 23% fatigued. 20 min stair climber at 9.3 MET = 2.1 x 0.9 = 1.9, 19%. 30 min brisk walk (4.8 MET) = 0.9 x ... about 0.5 FP: negligible. All coefficients are guesses to calibrate; keep them in a config file.

Interference guardrail [D, direction from Wilson 2012]: if a Ranger or Assassin plan has more than 3 hard running sessions a week, flag it on the plan screen. Prefer cycling or rowing before leg-heavy lifting days.

### 5.4 Readiness adjustment

Check-in: sleep quality, soreness, stress, mood, each 1-5; R = mean. Saw 2016 (56 studies): subjective self-report measures were more sensitive and consistent than objective ones and can stand alone [S]. Tiers [D]:

| R | Tier | Recovery factor | Session change |
|---|---|---|---|
| 3.5 or more | Green | x1.00 | as planned |
| 2.5-3.4 | Yellow | x0.90 | -20% sets, RIR target +1 |
| under 2.5 | Red | x0.75 | swap to recovery/mobility session (PRD: waive Penalty Zone) |

Displayed recovery = recovery_m x factor. Injury flag: that muscle is capped at 30% until cleared.

---

## 6. Nutrition

### 6.1 BMR and TDEE

- Mifflin-St Jeor: BMR = 10 x kg + 6.25 x cm - 5 x age + 5 (men) or - 161 (women) [R, Wikipedia Harris-Benedict page; original: Mifflin 1990, 498 healthy subjects, Am J Clin Nutr 51:241 [R, Europe PMC]]. It excludes body composition and was derived on normal-weight and overweight people [R].
- Frankenfield 2005 systematic review: Mifflin-St Jeor predicted measured RMR within 10% for more people than Harris-Benedict, Owen or WHO equations and had the narrowest error range, but individual errors remain notable [S].
- Activity multipliers (applied to BMR) [R gymgeek; origin cited as McArdle 1996 Exercise Physiology]:

| Activity | Multiplier | Definition |
|---|---|---|
| Sedentary | 1.2 | little or no exercise, desk job |
| Light | 1.375 | exercise 1-3 d/wk |
| Moderate | 1.55 | exercise 3-5 d/wk |
| Very active | 1.725 | hard exercise 6-7 d/wk |
| Extra active | 1.9 | twice a day, or hard physical job |

- FAO/WHO/UNU 2004 expresses TEE/BMR as PAL: sedentary/light 1.40-1.69, active 1.70-1.99, vigorous 2.00-2.40, above 2.40 hard to sustain [R, FAO table 5.3]. FAO's PAL is higher than the popular multipliers because it divides by true BMR and includes daily living. Engine default: use the 5 multipliers above, but start one band lower if the user is unsure (the source's own advice is "err lower"). Weekly adaptation (6.5) fixes the rest.
- Onboarding mapping [D]: 0-1 workouts/week and desk job = 1.2; 2-3 = 1.375; 3-5 = 1.55; 6-7 = 1.725; two sessions a day or physical job = 1.9.

### 6.2 Goal adjustment and rate limits

| Goal | Energy vs TDEE | Target rate | Source |
|---|---|---|---|
| Cut | -15% to -25% (default -20%) | 0.5-1.0% bodyweight/week (default 0.5-0.75%) | Helms 2014 [R]: 0.5-1%/week; Aragon 2017 [R]: 0.5-1%/week, lean people slower (0.7%/wk beat 1.4%/wk); Garthe 2011 [R]: SR 0.7%/wk gained 2.1% LBM, FR 1.4%/wk lost 0.2%, n=24 |
| Recomp | 0 to -10% | about 0 | [D] |
| Maintain | 0% | - | - |
| Bulk, beginner | +10% to +15% | 0.25-0.5% BW/week | Iraki 2019: novice/intermediate 10-20% surplus, 0.25-0.5%/wk [R] |
| Bulk, intermediate | +10% | 0.25-0.35% BW/week | Iraki [R] |
| Bulk, advanced | +5% to +7.5% | about 0.25% BW/week | Iraki: advanced 5-10% [R] |

Hard rules [D, built on the sources above]:

- Daily deficit cap = min(25% TDEE, 750 kcal). Allow up to 1000 kcal only if BMI 30 or more. This links 0.5-1%/wk to kcal: 7700 kcal/kg, so an 80 kg user at 0.75%/wk loses 0.6 kg/wk, about 660 kcal/day.
- No deficit when BMI is below 18.5, age under 18, pregnant or breastfeeding, or the user flags an eating-disorder history. [D, standard safety practice; BMI cut-off not re-verified.]
- Leaner users (body fat under about 15% male, 24% female [D]): cap loss at 0.5% BW/week.
- Max weekly gain: 0.5% BW/week (beginner), 0.25% (advanced). If trend exceeds it for 2 weeks, cut the surplus by 100 kcal.
- No reward (XP or stat) for a deficit beyond the cap, and no streak credit for eating under the floor.

### 6.3 Calorie floors

- Rule: floor = max(1200 kcal women / 1500 kcal men, BMR). [1200/1500 widely quoted, secondary sources only [S]; BMR floor is [D].]
- Diets under about 800 kcal/day are "very low calorie", clinically supervised, max 12 weeks (NHS) [S]. ISSN lists low-energy diets as 800-1200 and very-low-energy as 400-800 kcal and does not set a floor [R].
- When body fat is entered: energy availability EA = (intake - exercise kcal) / fat-free mass; keep at or above 30 kcal/kg FFM/day (45 considered adequate). IOC RED-S 2018/2023 anchors, secondary sources only [S].

### 6.4 Protein

| Situation | g/kg bodyweight/day | Source |
|---|---|---|
| General training adult | 1.4-2.0 | Jäger 2017 ISSN [R] |
| Maximising muscle gain | 1.6-2.2 | Iraki 2019 [R]; Morton 2018 (49 RCTs, 1,863 participants): gains plateau above about 1.6 g/kg/day [R, paraphrased] |
| Fighter / Tank | 1.8-2.2 (cut: 2.0-2.4) | as above |
| Assassin | 1.4-1.8 (cut 1.8-2.2) | Jäger: 1.2-2.4 range for endurance and strength/power athletes [R] |
| Ranger | 1.6-2.0 | [D] midpoint |
| Healer, general health | 1.2-1.6 | [D]; PROT-AGE older adults: 1.0-1.2 baseline, 1.2 or more if exercising [S] |
| Lean, resistance-trained, in a deficit | 2.3-3.1 g/kg FFM | Helms 2014 [R], Aragon 2017 [R], Jäger [R] |
| Cap | 2.5 g/kg BW (or 3.1 g/kg FFM) | [D] |

Per meal: 0.25 g/kg or 20-40 g per dose, 3-4 h apart, leucine 700-3000 mg per dose, about 40 g per dose in older people, 30-40 g casein before sleep [R, Jäger]. Iraki: 0.40-0.55 g/kg per meal, 3-6 meals [R].

**Vegetarian / vegan [D with evidence]:**
- Hevia-Larraín 2021 (19 vegans, 19 omnivores, 12 weeks): both groups at about 1.6 g/kg/day (vegans on soy, omnivores on whey) gained the same leg lean mass (1.2 kg) and strength [R, Europe PMC summary]. So adequate soy-based protein works.
- Jäger: soy gives lower MPS than whey/casein, and wheat protein needed about 60 g to match 35 g (older men); rice protein at 48 g/day matched whey in 8 weeks [R].
- Engine rule: vegetarian (dairy/eggs) = omnivore target +10%; vegan = +15-20% with a floor of 1.8 g/kg for Fighter/Tank. Add a leucine reminder: 25-40 g protein per vegan meal from at least 2 sources. The +10-20% figure is a safety margin [D]: it sits between Hevia-Larraín (no difference at 1.6 g/kg) and the single-dose gap (+70% for wheat). I found no study that states 10-20% directly.

### 6.5 Fat, carbohydrate, fibre

- Fat: 15-30% of kcal (Helms 2014 [R]), 20-35% (AMDR as cited in Aragon 2017 [R]), 0.5-1.5 g/kg (Iraki [R]). Default 0.8-1.0 g/kg (about 25-30% of kcal). Floor = max(0.6 g/kg, 20% kcal) [D]. Only a cut-prep user may go down to 15% (Helms).
- Carbohydrate = remaining kcal after protein and fat. Minimum 3 g/kg for Fighter/Tank (Iraki 3-5 g/kg or more [R]; Helms cites 4-7 g/kg for strength sports [R]); 4-6 g/kg for Assassin/Ranger (endurance athletes 6-10 g/kg [R, Jäger]). If remainder is below the minimum, warn and raise kcal, never lower protein below target.
- Fibre: 14 g per 1000 kcal (IOM DRI), i.e. about 25 g women / 38 g men [U, the IOM chapter page I opened did not show fibre text].
- Energy per gram: 4 / 4 / 9 kcal for protein / carb / fat [U].

### 6.6 Water

| Item | Value | Source |
|---|---|---|
| Total water (food + drink) adequate intake | women 2.7 L, men 3.7 L (IOM, age 19-30); women 2.0 L, men 2.5 L (EFSA, moderate temperature, PAL 1.6) | IOM page [R], EFSA press release [R] |
| Share from drinks | about 80% | IOM [R] |
| Daily drink target (engine) | 30-35 ml/kg/day (women about 31, men about 35 derived from IOM x 80%) | [D] derived from [R] |
| Training add-on | +500-750 ml per hour of exercise, more in heat | [D]. ACSM 2007 says individualise using sweat-rate (weigh before and after) and avoid over 2% body-mass loss [R]; per-hour volume figure [U] |
| Post-exercise | 1.25-1.5 L per kg lost [U] | ACSM 2007 [U] |
| Pregnancy / lactation | +300 / +700 ml | EFSA via search excerpt [S] |

### 6.7 Adaptive TDEE from weight trend

Constant: 7700 kcal/kg for loss (3500 kcal/lb rule). Hall 2011 (Lancet) gives energy densities fat 39.5 MJ/kg (9440 kcal/kg), lean tissue 7.6 MJ/kg (1820 kcal/kg), and shows the static rule overestimates long-term loss because expenditure falls as weight falls [R]. A 75% fat / 25% lean mix gives about 7500 kcal/kg, consistent with 7700. For weight gain with 50% lean, use about 5600 kcal/kg [D from Hall's densities].

Algorithm [D], run once a week:

1. Weight trend W_week = mean of weigh-ins over the 7 days. Needs at least 4 weigh-ins that week and the previous week.
2. Intake I = mean logged kcal over the same 7 days. Needs at least 5 logged days (otherwise skip).
3. dW = W_week - W_prev (kg per week).
4. TDEE_obs = I - (dW x 7700 / 7) for loss, or I - (dW x 5600 / 7) for gain.
5. TDEE_new = 0.7 x TDEE_old + 0.3 x TDEE_obs. Max change +-150 kcal per week. Never below BMR x 1.1 or above BMR x 2.3.
6. First adaptation after 14 days of data; before that use the multiplier estimate.
7. Show the user "trend weight" not the raw scale reading.

---

## 7. Sex differences, beginners and age

### 7.1 Sex differences that change the recommendations

| Finding | Number | Source | What we do |
|---|---|---|---|
| Hypertrophy response same | ES 0.07 (P=0.31), 10 studies / 12 outcomes | Roberts, Nuckols, Krieger 2020 [S, search excerpt of the abstract] | Same volume landmarks and caps for both sexes. |
| Upper-body strength gains larger in women (relative) | ES -0.60 favouring females (P=0.002, I2 72%) | Roberts 2020 [S] | Female beginners: expect faster relative upper-body load increases early; allow 1-1.25 kg increments and do not cap progression. |
| Lower-body strength same | ES -0.21 (P=0.20) | Roberts 2020 [S] | Same lower-body rules. |
| Women less fatigable (isometric, low-intensity dynamic) | e.g. strength-matched women held an intermittent isometric task about 3x longer (23.5 vs 8.6 min); at 50-90% 1RM the difference shrinks as load rises; elbow flexors torque loss 52% women vs 65% men | Hunter 2014 [R] | Do not use sex to change %1RM. Use RIR and rep targets. For female users default to the lower end of the rest range on isolation work and to higher rep ceilings (e.g. 12-15) before adding load. |
| Slower recovery of power after lengthening contractions | qualitative | Hunter 2014 [R] | Do not stack eccentric-overload sessions on consecutive days. No numeric modifier. |
| Menstrual cycle | early follicular phase performance ES -0.06 (trivial), evidence quality "low" | McNulty 2020, 51 + 73 studies [R, Europe PMC summary] | No automatic cycle-based plan changes. Offer optional cycle logging and let the readiness check-in carry the signal. |
| Deloads | 84.6% of coaches disagreed with sex-specific deloads | Bell 2023 Delphi [R] | Same deload rules. |
| Energy | floor 1200 (women) / 1500 (men) [S]; EA 30 kcal/kg FFM [S] | | Apply the floor rule in 6.3. EA warning triggers more often for small, very active women. |
| Strength standards | lower for women (section 8) | Strength Level [R] | Sex-specific tables. |
| Protein per kg | same | Jäger [R] | No sex change. |

### 7.2 Safe beginner defaults

From ACSM 2009: whole body 2-3 d/wk, 8-12 RM loads, load at least 60-70% 1RM, 1-3 sets, 8-10 exercises (ACSM 1998 [R]), increase 2-10% when 1-2 reps over target on 2 consecutive sessions, rest 1-2 min (2-3 min for core lifts), machines and free weights for beginners [R]. ACSM 2026 adds that failure is not required and effort near 2-3 RIR is suggested [R]. Damas: muscle damage is high in week 1 and attenuated by week 3 [R].

Defaults for the plan generator [D]:

| Item | Week 1-2 | Week 3-4 | Week 5-8 | Week 9+ |
|---|---|---|---|---|
| Days/week | 2-3 full body | 3 | 3 | 3-4 (upper/lower) |
| Sets per exercise | 2 | 2-3 | 3 | 3 |
| Reps | 10-12 | 8-12 | 8-12 | 6-12 |
| Target RIR | 4 | 3-4 | 2-3 | 1-3 |
| Weekly sets per muscle | 4-6 | 6-9 | 9-12 | 10-12 (cap 12) |
| Load start | pick the weight for 10 reps with 3-4 in reserve | from log | from log | from log |
| Loaded 1RM test | never | never | e1RM from a 5-8 rep set | allowed |
| Rest | 2 min compounds, 60-90 s isolation | same | same | same |
| First deload | week 8 | | | |

Safety flags that force the beginner lane: age 60+, BMI 35+, no training for 2+ years, any injury flag, resting symptoms. [D]. Include a one-line medical clearance prompt for these cases.

### 7.3 Age adjustments

- 50-60 years and older: 10-15 reps instead of 8-12 and avoid sets to volitional fatigue (ACSM 1998 [R]). ACSM 2009 older adults: 1-3 sets, 60-80% 1RM, 8-12 reps, 1-3 min rest, 2-3 d/wk, slow-moderate velocity [R]. ACSM 2026: training to fatigue may be inadvisable for older people because of vascular and injury risks [R]. NSCA 2019: 2-3 d/wk, 2-3 sets per major muscle group, 2 min rest, 6-12 reps; power work at 40-60% of 1RM (last number truncated in the excerpt) [S].
- Protein: at least 1.0-1.2 g/kg/day, 1.2 or more when exercising, 1.2-1.5 with illness, limit if eGFR under 30 (PROT-AGE) [S]; about 40 g per dose to maximise MPS (Jäger) [R].
- Engine [D]: age 50+ = RIR target at least 2, max volume cap x0.8, recovery T_half x1.25 at 60+, show power/balance work (3-6 fast reps at 40-60%) once a week for 60+, hold stretches 30-60 s.
- Under 18: no deficit, no 1RM testing (design rule).

---

## 8. Relative strength standards (bodyweight multiples)

### 8.1 Data

Strength Level standards are 1RM by bodyweight from 40,110,225 logged lifts (2015-2026), checks for implausible and duplicate data; barbell weights include the 20 kg bar; level means percentile among its users: Beginner stronger than 5% of lifters (practised at least 1 month), Novice 20% (6 months), Intermediate 50% (2 years), Advanced 80% (5+ years), Elite 95% (5+ years of competitive dedication) [R]. Caveat: its user base is gym trackers, so "Intermediate = 50th percentile" is stronger than the general population. Symmetric Strength builds levels from Wilks-point model bands, not percentiles [R].

Bodyweight multiples (1RM / bodyweight), computed by me from the published Strength Level lb tables [R]:

**Men, reference 180 lb (82 kg)**

| Lift | Beginner | Novice | Intermediate | Advanced | Elite |
|---|---|---|---|---|---|
| Squat | 0.94 | 1.27 | 1.66 | 2.09 | 2.57 |
| Bench | 0.71 | 0.94 | 1.22 | 1.54 | 1.88 |
| Deadlift | 1.12 | 1.49 | 1.93 | 2.43 | 2.97 |
| Overhead press | 0.42 | 0.58 | 0.78 | 1.01 | 1.26 |

**Women, reference 140 lb (64 kg)**

| Lift | Beginner | Novice | Intermediate | Advanced | Elite |
|---|---|---|---|---|---|
| Squat | 0.53 | 0.81 | 1.18 | 1.61 | 2.09 |
| Bench | 0.31 | 0.51 | 0.77 | 1.09 | 1.44 |
| Deadlift | 0.66 | 0.99 | 1.40 | 1.89 | 2.41 |
| Overhead press | 0.21 | 0.34 | 0.50 | 0.70 | 0.92 |

**Untrained row (Symmetric Strength, man 180 lb / woman 140 lb) [R]:** squat 0.75 / 0.61, bench 0.56 / 0.43, deadlift 0.86 / 0.75, overhead press 0.36 / 0.29. Symmetric's other levels run (man 180 lb): Novice 1.14/0.83/1.31/0.56, Intermediate 1.50/1.11/1.72/0.72, Advanced 2.19/1.64/2.53/1.06, Elite 2.83/2.11/3.25/1.36 (squat/bench/deadlift/OHP) [R, derived from their examples]. Its Intermediate sits close to Strength Level Novice-Intermediate, showing how method-dependent the labels are.

**Sensitivity to bodyweight (for the lookup).** Intermediate squat multiples for men: 1.65 at 150 lb, 1.66 at 180 lb, 1.63 at 220 lb. Bench: 1.22, 1.22, 1.20. Women intermediate squat: 1.26 at 110 lb, 1.18 at 140 lb, 1.09 at 180 lb. So multiples are flat for men (about +-3%) and fall about 7% per 40 lb for women. Engine: store the Strength Level tables at 10 lb steps (men 110-310 lb, women 90-260 lb) and interpolate; the reference-bodyweight tables above are the fallback.

### 8.2 Power Level strength sub-score [D]

For each of squat, bench, deadlift, overhead press: ratio = e1RM / bodyweight, level index by linear interpolation between thresholds, mapped to 0-100:

| Level reached | Score |
|---|---|
| Untrained (below Beginner) | 0 to 10, scaled linearly from 0.5 x Beginner |
| Beginner | 10 |
| Novice | 25 |
| Intermediate | 50 |
| Advanced | 75 |
| Elite | 95 |
| Above Elite | 95 to 100 (capped) |

The scores match the Strength Level percentile definitions (5/20/50/80/95), nudged so Intermediate = 50. Strength component = mean of the best 3 of 4 lifts (users missing a lift are not penalised). Use the conservative e1RM from section 4. Unloaded users (beginners) use the Awakening Test instead.

**Awakening Test norms (bodyweight tests)** [S, Topend Sports; page says norms are "based on ACSM research"]: max push-ups, men 20-29 average 24-29, good 39-46, excellent 47+; women 20-29 average 17-22, good 30-35, excellent 36+; 60+ men average 11-16, women 5-11. Squats in 60 s and plank norms: I did not find an authoritative source. The one plank-like source (Les Mills forearm hover) lists average 1-2 min, good 4-6 min [S, unreferenced]; use it only for relative scoring inside the app and mark it provisional.

**Gap:** The Kilgore/Rippetoe tables (ExRx) could not be opened (HTTP 403). Do not claim them as a source.

---

## 9. MET table (Compendium of Physical Activities, 2024 update)

The 2024 Compendium (J Sport Health Sci, Jan 2024) is the current edition; 2011 is the previous one. 1 MET = 1 kcal per kg per hour = 3.5 ml O2/kg/min. The Compendium says not to change MET values or mix them [R, pacompendium home]. Energy per session: gross kcal = MET x kg x hours; net (above rest) = (MET - 1) x kg x hours. Use net kcal when adding to a TDEE built from an activity multiplier, to avoid counting resting energy twice [D].

**Walking (level, 0% grade; code in brackets)** [R]

| Speed | Treadmill walking MET | Overground MET |
|---|---|---|
| 2.0-2.4 mph (3.2-3.9 km/h) | 3.0 [17349] | 2.8 (slow) [17152] |
| 2.5-2.9 mph (4.0-4.7 km/h) | 3.5 [17352] | 3.0 at 2.5 mph [17170] |
| 3.0-3.4 mph (4.8-5.5 km/h) | 3.8 [17355] | 3.8 (2.8-3.4 mph) [17190] |
| 3.5-3.9 mph (5.6-6.3 km/h) | 4.8 [17358] | 4.8 [17200] |
| 4.0-4.4 mph (6.4-7.1 km/h) | 5.8 [17361] | 5.5 [17220] |
| 4.5-4.9 mph (7.2-7.9 km/h) | 6.8 [17364] | 7.0 [17230] |
| 5.0-5.5 mph (8.0-8.9 km/h) | 8.3 [17367] | 8.5 [17231] |

**Running (by speed)** [R]

| Speed | MET |
|---|---|
| 4.0-4.2 mph (6.4-6.8 km/h) | 6.5 [12028] |
| 4.3-4.8 mph (6.9-7.7 km/h) | 7.8 [12029] |
| 5.0-5.2 mph (8.0-8.4 km/h) | 8.5 [12030] |
| 5.5-5.8 mph (8.9-9.3 km/h) | 9.0 [12045] |
| 6.0-6.3 mph (9.7-10.1 km/h) | 9.3 [12050] |
| 6.7 mph (10.8 km/h) | 10.5 [12060] |
| 7.0 mph (11.3 km/h) | 11.0 [12070] |
| 7.5 mph (12.1 km/h) | 11.8 [12080] |
| 8.0 mph (12.9 km/h) | 12.0 [12090] |
| 8.6 mph (13.8 km/h) | 12.5 [12100] |
| 9.0 mph (14.5 km/h) | 13.0 [12110] |
| 10.0 mph (16.1 km/h) | 14.8 [12120] |
| 11.0 mph (17.7 km/h) | 16.8 [12130] |
| 12.0 mph (19.3 km/h) | 18.5 [12132] |

Incline: the Compendium rows are level. For treadmill incline use the ACSM metabolic equations [U]: walking VO2 = 0.1 x v(m/min) + 1.8 x v x grade + 3.5; running VO2 = 0.2 x v + 0.9 x v x grade + 3.5; MET = VO2 / 3.5.

**Stationary bike by watts** [R]

| Power | MET |
|---|---|
| 25-30 W | 3.5 [01210] |
| 50 W | 4.0 [01214] |
| 60 W | 5.0 [01216] |
| 70-80 W | 5.8 [01218] |
| 90-100 W | 6.0 [01220] |
| 101-125 W | 6.8 [01224] |
| 126-150 W | 8.0 [01228] |
| 151-199 W | 10.3 [01232] |
| 200-229 W | 10.8 [01236] |
| 230-250 W | 12.5 [01240] |
| 270-305 W | 13.8 [01244] |
| above 325 W | 16.3 [01248] |
| general / no watts, spin class, HIIT bike | 6.8 [01200], 9.0 [01270], 8.8 [01305] |

For gym machines that show a "level" (1-20) with no watts: map level to watts from the machine's display, or ask the user to pick light / moderate / vigorous = 4.0 / 6.8 / 10.3 MET [D].

**Outdoor cycling** [R]: 5.5 mph 3.5; under 10 mph 4.0; 9.4 mph 5.8; 10-11.9 mph 6.8; 12-13.9 mph 8.0; 14-15.9 mph 10.0; 16-19 mph 12.0; over 20 mph 16.8.

**Other machines and activities** [R]

| Activity | MET | Code |
|---|---|---|
| Rowing machine, under 100 W | 5.0 | 02071 |
| Rowing, 100-149 W | 7.5 | 02072 |
| Rowing, 150-199 W | 11.0 | 02073 |
| Rowing, 200 W or more | 14.0 | 02074 |
| Rowing, general vigorous | 7.3 | 02070 |
| Elliptical, moderate / vigorous | 5.0 / 9.0 | 02048 / 02049 |
| Stair-climber (stair treadmill ergometer) | 9.3 | 02065 |
| Aerobic step 4 in / 6-8 in / 10-12 in | 5.5 / 7.3 / 9.0 | 02001-02003 |
| Jump rope (general) / 120 jumps per min | 11.0 / 9.0 | 02068 / 02069 |
| HIIT moderate / vigorous (burpees, Tabata) | 7.0 / 11.0 | 02210 / 02214 |
| Circuit, light / moderate / bodyweight / kettlebell vigorous | 3.5 / 5.0 / 6.0 / 7.5 | 02034, 02035, 02032, 02040 |
| Calisthenics light / vigorous | 2.8 / 7.5 | 02024 / 02020 |
| Kettlebell swings | 9.8 | 02058 |
| Weight training, vigorous | 6.0 | 02050 |
| Squats/deadlifts, slow or explosive | 5.0 | 02052 |
| Weight training, 8-15 reps varied | 3.5 | 02054 |
| Circuit/superset/peripheral heart action | 5.8 | 02055 |
| Bodyweight resistance general / high intensity | 3.0 / 6.5 | 02056 / 02057 |
| Swimming freestyle slow / medium / fast | 5.8 / 8.0 / 9.8 (fast 75 yd/min: 10.5) | 18240, 18290, 18230 (18280) |
| Breaststroke recreational / competitive | 5.3 / 10.3 | 18265 / 18260 |
| Backstroke recreational / competitive | 4.8 / 9.5 | 18255 / 18250 |
| Butterfly | 13.8 | 18270 |
| Treading water moderate | 3.5 | 18350 |
| Stretching, mild | 2.3 | 02101 |
| Hatha yoga / vinyasa / power yoga | 2.3 / 2.7 / 4.0 | 02150 / 02185 / 02160 |
| Pilates mat / general | 1.8 / 2.8 | 02103 / 02105 |

Foam rolling and mobility drills have no Compendium entry: use 2.3 (stretching) [D].

Weight-training METs include rest between sets. For XP, do not use METs: use sets.

---

## 10. Rest-day mobility

Evidence:
- ACSM 1998 stand: static stretches held 10-30 s at the point of mild discomfort, no greater benefit from longer holds; at least 4 repetitions per muscle group (largest ROM gain in the first four reps); at least 2-3 days a week; PNF: 6 s contraction then 10-30 s assisted stretch [R].
- ACSM 2011 (Garber): flexibility at least 2 d/wk, total 60 s of stretch per muscle-tendon group, 2-4 reps [S, Europe PMC summary]; older adults 30-60 s per hold, adults 10-30 s [S, secondary table only]. So the "30-60 s per ACSM" in the brief applies to older adults; the general-adult hold is 10-30 s, with a 60 s total per stretch.
- Behm 2016 systematic review: static stretching of 60 s or more per muscle before activity reduced performance (-4.6%) versus under 60 s (-1.1%); position stand advises against long static stretches immediately before training or competition [S]. So: long holds on rest days or after training; keep pre-lift holds under 60 s total per muscle.
- Afonso 2021 meta-analysis (11 RCTs, n=452): strength training through full ROM improved ROM as much as stretching (ES -0.22, P=0.21) [S]. So full-ROM lifting counts toward mobility.
- ACSM 2011: 150 min/week moderate aerobic activity, or 75 vigorous, or 500-1000 MET-min/week [R, Europe PMC summary]. Rest days can use a brisk walk (4.8 MET).

Daily mobility block prescription [D, built on the above]:

| Item | Value |
|---|---|
| Total duration | 10-15 min on rest days; 5-8 min after lifting |
| Structure | 3 min joint circles and dynamic moves, then 8-10 static stretches |
| Static hold | 2 x 30 s per stretch per side (60 s total per stretch). Beginner: 2 x 20 s. Age 60+: 30-60 s per hold. Stay at mild discomfort, never pain. |
| Frequency | daily on rest days; at least 2-3 days a week (ACSM) |
| Progression for Healer | +5 s per hold each week to 60 s, then add range of motion, then add a 3 s lowering tempo |
| Healer strength tempo | 8-12 reps with 3 s lowering, 30-60 s rest, RIR 3-4 |
| Rest-day step goal | 20-30 min brisk walking (4.8 MET) or 7-8k steps [U for step count] |
| XP weight | Mobility block XP flat (time-boxed), no stacking beyond one block per day |
| Joint pain | stop the stretch, flag injury, swap to recovery session |

---

## Findings

1. Position stands support a wide range of loads. ACSM 2026 says 30-100% 1RM gives similar hypertrophy when effort is matched, at least 80% 1RM is better for strength, at least 10 weekly sets per muscle for hypertrophy (plateau about 18-20), and failure is not required (about 2-3 RIR). The PRD class table matches the older ACSM 2009 stand for intermediate and advanced lifters but is missing a beginner lane and a consistent Ranger band.
2. Volume dose-response is real but flattens. Schoenfeld 2017: +0.37% growth per added weekly set. Moderate (12-20 sets) and high (over 20) volume produce similar gains for most muscles (Baz-Valle). A hard cap of 25 sets per muscle per week is conservative against every source.
3. Every progression and 1RM rule has a published backbone: ACSM 2-10% increase after 1-2 extra reps on two consecutive sessions; Epley and Brzycki are equal at 10 reps and diverge above, so valid range is up to 10 reps and the conservative choice is Brzycki. RIR is accurate near failure and degrades for high-rep sets; the average error is about 1 rep.
4. Deload evidence is behavioural, not quantitative. Duration (6.4 days) and frequency (every 5.6 weeks) are measured; the volume and load percentages are not published. Our -40-50% sets and -10% load are design parameters.
5. Recovery by muscle size is not established. The 48-72 h window is a convention (ACSM frequency, Fitbod). Evidence that matters: training to failure and high velocity loss slow recovery (Morán-Navarro 2017, Pareja-Blanco 2019); damage is high in week 1 and fades by week 3 (Damas 2018).
6. Sex differences in hypertrophy are negligible. Women show larger relative upper-body strength gains early and lower fatigability at moderate loads. Menstrual-cycle effects are trivial (ES -0.06) with low-quality evidence, so no automatic cycle adjustment.
7. Nutrition numbers are well sourced: Mifflin-St Jeor is the most accurate common equation (within 10% for most); activity multipliers 1.2 to 1.9; protein 1.6-2.2 g/kg for gain (Morton breakpoint about 1.6), 2.3-3.1 g/kg FFM for lean people in a deficit; cut rate 0.5-1% bodyweight a week with slower being better for lean mass (Garthe: 0.7% beat 1.4%); bulk 10-20% for beginners, 5-10% advanced (Iraki).
8. Gaps and honesty flags. 1200/1500 kcal floors and EA 30 kcal/kg FFM were only found in secondary sources. Vegan +10-20% is a design margin, not a published value. IOM fibre 14 g/1000 kcal and ACSM post-exercise 1.25-1.5 L/kg are recalled, not verified. Kilgore/Rippetoe standards could not be opened. RP landmarks beyond chest/triceps/glutes/traps/delts/calves/quads come from search excerpts.
9. The ACSM 2011 "30-60 s" stretch hold applies to older adults; general adults are 10-30 s per hold and 60 s total per stretch.
10. Strength standards differ by method. Strength Level Intermediate (50th percentile of gym trackers) for a 180 lb man is 1.66x bodyweight squat; Symmetric Strength's Intermediate is 1.50x. The app should state which dataset it follows.

## What we take

- ACSM 2009 structure: three training levels, 2-10% load jump rule, novice 2-3 d/wk whole body, rest 2-3 min for heavy core lifts, undulating rotation of 3-5 / 8-10 / 12-15 RM.
- ACSM 2026: at least 10 weekly sets, failure not required, aim near 2-3 RIR, loads 30-100% work, older adults avoid failure.
- Schoenfeld 2017 and Baz-Valle 2022: 12-20 weekly sets target zone; Schoenfeld 2016 rest (3 min beats 1 min for strength and quad growth).
- RIR scale (Zourdos 2016 / RippedBody), 4%-per-rep load correction, RIR error caveats.
- Epley and Brzycki with conservative min() and a 10-rep validity limit.
- Rogerson 2024 / Bell 2022 / Bell 2023 deload timing (5-7 days, every 4-8 weeks, reduce sets and load, keep frequency and exercises).
- Mifflin-St Jeor, the five multipliers (start one band low), Helms 2014 and Aragon 2017 rate limits, Garthe 2011 slow-cut evidence, Iraki 2019 bulk numbers, Jäger 2017 protein, per-meal dose and leucine, Hevia-Larraín 2021 for plant protein.
- Strength Level tables as the primary relative-strength dataset (largest, with percentile semantics), Symmetric Strength for the Untrained floor.
- Compendium of Physical Activities 2024 MET values, with net kcal = (MET-1) x kg x h.
- Fitbod's visible behaviour: 0-100% per muscle, 48-72 h window, cardio counted, manual override, RIR 1-2 for hypertrophy and 2-3 for strength.

## What we do better

- **Beginner lane and safety gates.** Fitbod and most apps start everyone on the same plan. We separate beginner, intermediate and advanced for reps, RIR, volume ramp and first deload, and refuse loaded 1RM tests for beginners.
- **Transparent recovery model.** Fitbod publishes no formula. We publish a documented exponential-decay model with per-set fatigue from RIR and relative load, a novelty factor from the repeated-bout evidence, cardio by MET, and a readiness tier. All constants are exposed for tuning.
- **No incentive to hit failure or overtrain.** XP weight is flat for RIR 0-1, sets below RIR 4 earn nothing, sets above the per-muscle cap earn nothing, and under 30% recovery earns nothing.
- **Honest 1RM.** Conservative e1RM, 10-rep validity window, RIR-adjusted reps, and no downward update from one bad day.
- **Evidence labels on every number.** The engine config carries the tag [R]/[S]/[D]/[U] so Settings can say what is a position stand and what is our tuning.
- **Adaptive TDEE with guard rails** (7700 kcal/kg, 0.7/0.3 smoothing, +-150 kcal per week, floors and deficit caps) instead of a one-shot calculator.
- **Sex-aware without stereotyping.** Same volume and deload rules (evidence says hypertrophy and deloads do not differ), sex-specific strength standards, and RIR-based progression to absorb the fatigability difference.
- **Plant-based protein handled explicitly** (+10-20% margin, leucine and meal-split prompts) rather than ignored.

## Sources

**Opened (fetched and read, in full or in part)**

- ACSM 2009 Position Stand, Progression models in resistance training for healthy adults: https://sfu.ca/~ryand/kin343/ACSMresistance.pdf (read in full via PDF text extraction)
- ACSM 2026 update (Currier et al., Resistance training prescription ... overview of reviews): https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823
- ACSM 1998 Position Stand, Quantity and Quality of Exercise (found as an appendix PDF): https://www.medicina.univr.it/documenti/OccorrenzaIns/matdid/matdid381485.pdf
- ACSM 2007 Exercise and Fluid Replacement summary (Dutch-hosted copy): https://www.sportgeneeskunde.com/files/bestanden/VSG/VSG6667.pdf
- Schoenfeld 2021, repetition continuum re-examination: https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/
- Schoenfeld 2017 dose-response (Europe PMC record 27433992): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:27433992%20AND%20SRC:MED&resultType=core&format=json
- Schoenfeld 2016 frequency (Europe PMC 27102172): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:27102172%20AND%20SRC:MED&resultType=core&format=json
- Schoenfeld 2016 rest intervals (Europe PMC 26605807): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:26605807%20AND%20SRC:MED&resultType=core&format=json
- Zourdos 2016 RIR-RPE scale (Europe PMC 26049792): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:26049792%20AND%20SRC:MED&resultType=core&format=json
- RPE to RIR table and autoregulation (RippedBody): https://rippedbody.com/rpe-course/
- Jäger 2017 ISSN protein position stand: https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/
- Morton 2018 (Europe PMC 28698222): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:28698222%20AND%20SRC:MED&resultType=core&format=json
- Mifflin 1990 (Europe PMC 2305711): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:2305711%20AND%20SRC:MED&resultType=core&format=json
- Mifflin-St Jeor coefficients (Harris-Benedict page): https://en.wikipedia.org/wiki/Harris%E2%80%93Benedict_equation
- Activity factors: https://gymgeek.com/articles/standard-activity-factor/
- FAO/WHO/UNU 2004 PAL table 5.3: https://www.fao.org/4/y5686e/y5686e07.htm and https://en.wikipedia.org/wiki/Physical_activity_level
- Helms 2014 contest prep: https://pmc.ncbi.nlm.nih.gov/articles/PMC4033492/
- Aragon 2017 ISSN diets and body composition: https://pmc.ncbi.nlm.nih.gov/articles/PMC5470183/
- Iraki 2019 off-season nutrition: https://pmc.ncbi.nlm.nih.gov/articles/PMC6680710/
- Garthe 2011 (Europe PMC 21558571): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:21558571%20AND%20SRC:MED&resultType=core&format=json
- Hall 2011 Lancet (energy densities): https://pmc.ncbi.nlm.nih.gov/articles/PMC3880593
- Hevia-Larraín 2021 (via Europe PMC search): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22plant-based%22%20AND%20%22resistance%20training%22%20AND%20AUTH:%22Hevia-Larra%C3%ADn%22&resultType=core&format=json
- Wilson 2012 concurrent training (Europe PMC 22002517): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:22002517%20AND%20SRC:MED&resultType=core&format=json
- MacDougall 1995 (Europe PMC title search): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22time%20course%22%20AND%20%22muscle%20protein%20synthesis%22%20AND%20%22heavy%20resistance%20exercise%22%20AND%20AUTH:%22MacDougall%22&resultType=core&format=json&pageSize=3
- Damas 2018 (Europe PMC search): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=AUTH:%22Damas%22%20AND%20%22muscle%20damage%22%20AND%20%22muscle%20protein%20synthesis%22%20AND%20%22resistance%22&resultType=core&format=json&pageSize=4
- Pareja-Blanco 2019 time course of recovery: https://pmc.ncbi.nlm.nih.gov/articles/PMC6473797
- Bell 2023 deloading Delphi: https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/
- Rogerson 2024 deloading survey: https://pmc.ncbi.nlm.nih.gov/articles/PMC10948666/ (Bell 2022 coach interviews via Europe PMC search: https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22Deloading%20practices%22%20AND%20%22strength%20and%20physique%22&resultType=core&format=json&pageSize=3)
- Hunter 2014 sex differences in fatigability: https://pmc.ncbi.nlm.nih.gov/articles/PMC4111134
- McNulty 2020 menstrual cycle (Europe PMC 32661839): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:32661839%20AND%20SRC:MED&resultType=core&format=json
- Fragala 2019 NSCA older adults, abstract only (Europe PMC 31343601): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:31343601%20AND%20SRC:MED&resultType=core&format=json
- Garber 2011 ACSM abstract (Europe PMC 21694556): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:21694556%20AND%20SRC:MED&resultType=core&format=json
- 1RM formulas: https://en.wikipedia.org/wiki/One-repetition_maximum
- Strength Level standards: https://strengthlevel.com/strength-standards/squat , https://strengthlevel.com/strength-standards/bench-press , https://strengthlevel.com/strength-standards/deadlift , https://strengthlevel.com/strength-standards/shoulder-press , https://strengthlevel.com/strength-standards/male/lb
- Symmetric Strength standards: https://symmetricstrength.com/standards
- Compendium of Physical Activities 2024: https://pacompendium.com/ , https://pacompendium.com/walking/ , https://pacompendium.com/running/ , https://pacompendium.com/bicycling/ , https://pacompendium.com/conditioning-exercise/ , https://pacompendium.com/water-activities/
- IOM DRI water (AI 3.7 / 2.7 L, 80% from fluids): https://www.nationalacademies.org/read/10925/chapter/6
- EFSA water AI (2.5 L men, 2.0 L women): https://www.efsa.europa.eu/en/press/news/nda100326
- Fitbod algorithm blog: https://fitbod.me/blog/fitbod-algorithm
- RP Strength landmarks definitions (MV about 6 sets): https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth
- Push-up norms (Topend Sports): https://www.topendsports.com/testing/tests/push-up.htm

**Seen only as search-result excerpts (not opened; every number from these is tagged [S])**

- Baz-Valle 2022: https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/
- Roberts, Nuckols, Krieger 2020: https://pubmed.ncbi.nlm.nih.gov/32218059/
- Robinson 2024 proximity to failure: https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/
- Pelland 2024 volume meta-regression preprint: https://sportrxiv.org/index.php/server/preprint/view/460
- Morán-Navarro 2017: https://pubmed.ncbi.nlm.nih.gov/28965198/
- Schumann 2022 concurrent training: https://researchonline.jcu.edu.au/71546/1/Schumann2021_Article_CompatibilityOfConcurrentAerob.pdf
- Behm 2016 stretching review and position stand: https://pmc.ncbi.nlm.nih.gov/articles/PMC6895680
- Afonso 2021 strength vs stretching ROM: https://estudogeral.sib.uc.pt/bitstream/10316/104612/1/Strength-training-versus-stretching-for-improving-range-of-motion-A-systematic-review-and-metaanalysisHealthcare-Switzerland.pdf
- Saw 2016 subjective vs objective monitoring: https://bjsm.bmj.com/content/50/5/281
- Frankenfield 2005: https://www.qxmd.com/r/15883556
- PROT-AGE (Bauer 2013): https://digital.library.adelaide.edu.au/dspace/handle/2440/80029
- NSCA older adults statement summary: https://www.nsca.com/about-us/position-statements/resistance-training-for-older-adults/
- NHS very low calorie diets: https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/very-low-calorie-diets/
- RP Strength per-muscle pages (landmarks): https://renaissanceperiodization.com/quad-training-tips-hypertrophy/ , https://renaissanceperiodization.com/chest-training-tips-hypertrophy/ , https://renaissanceperiodization.com/triceps-hypertrophy-training-tips/ , https://renaissanceperiodization.com/glute-training-tips-hypertrophy/ , https://rpstrength.com/calves-training-tips-hypertrophy , https://rpstrength.com/bicep-training-tips-hypertrophy , https://rpstrength.com/hamstring-training-tips-hyprtrophy/
- IOC RED-S 2018 consensus: https://www.researchgate.net/profile/Margo_Mountjoy/publication/325212903_International_Olympic_Committee_IOC_Consensus_Statement_on_Relative_Energy_Deficiency_in_Sport_RED-S_2018_Update/links/5dfe4294299bf10bc36eadd4/International-Olympic-Committee-IOC-Consensus-Statement-on-Relative-Energy-Deficiency-in-Sport-RED-S-2018-Update.pdf
- LeSuer 1997 via secondary summary: https://arxiv.org/pdf/2603.17495
