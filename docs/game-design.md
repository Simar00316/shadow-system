# Game design — single source of truth

Every game rule the engines implement. Built from PRD Section 3 refined by research: R1 [solo-leveling.md](../research/solo-leveling.md), R2 [rpg-systems.md](../research/rpg-systems.md), R5 [science.md](../research/science.md). When this file and the PRD disagree, this file wins and the change is listed in the changelog at the bottom.

Tags: **[PRD]** from the PRD, **[R1/R2/R5]** from research, **[D]** our design value (calibrate with the simulation).

---

## 1. Vocabulary (settled once — R1 §0)

| Canon variants | We use |
| --- | --- |
| Preparation to Become Strong / Powerful | **Daily Quest: "Preparation to Become Strong"** |
| Stamina / Vitality | **VIT** (label "Vitality") |
| Sense / Perception | **SENSE** on screen, `per` in code |
| Wolf Slayer / Wolf Assassin | **Wolf Slayer** |
| One Who Overcame Adversity / Conqueror of Adversity | **One Who Overcame Adversity** |
| Commander / General | shadow grade **Commander** (novel order) |

System voice grammar (R1 §3.2): square brackets per idea, formal present tense, no contractions, no exclamation marks, talks *to* the Player ("You have…") and *about* "the Player" in rules. Quests always show **Goal / Time limit / Reward / Penalty**. Rules are announced before they apply.

---

## 2. The Status Window (R1 §2.2)

| Field | Source of value |
| --- | --- |
| Name, Title (one equipped), Job (class or advanced class) | profile/player |
| Level, XP bar | XP ledger (§4) |
| Rank badge | §6 |
| Power Level 0–100 | §7 |
| **HP** | mean recovery % across trained muscles (recovery engine) |
| **MP** | latest readiness score mapped to 0–100 (`(R-1)/4×100`) |
| **Fatigue** | `100 − HP`, shown as a gauge |
| STR AGI VIT INT SENSE + `[+]` | base stat (behaviour) + allocated points |
| Available points | unspent allocation points |
| Streak, Gold, Daily Quest progress | quests/player |

---

## 3. Classes and prescriptions (PRD table corrected by R5 §1.2)

Experience level: **beginner** < 6 months consistent training (or returning after 1 year off); **intermediate** 6 months–2 years; **advanced** > 2 years [R5].

| Class | Level | Reps | Load %1RM | RIR target | Sets/exercise | Rest (compound / isolation) | Progression |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fighter | beginner | 5–8 (weeks 1–4: 8–12) | 65–80 | 3 then 2 | 2–3 | 150 s / 90 s | linear |
| Fighter | intermediate | 3–6 | 80–88 | 2 | 3–5 | 180 s / 120 s | load when all sets hit top at RIR ≥1, 2 sessions in a row |
| Fighter | advanced | top set 1–6 + back-off 6–8 @75% | 80–92 | 1 | 3–6 | 240 s / 120 s | same, plus top/back-off |
| Tank | beginner | 8–12 | 65–75 | 3 | 2–3 | 120 s / 75 s | double progression (1 session) |
| Tank | intermediate | 6–12 (isolation 10–20) | 65–80 | 2 | 3–4 | 150 s / 75 s | double progression (2 sessions) |
| Tank | advanced | 5–12 (isolation 10–25) | 62–82 | 1 | 3–5 | 150 s / 75 s | double progression (2 sessions) |
| Assassin | beginner | 12–15 | 50–60 | 3 | 2–3 | 60 s / 60 s | add reps, then cut rest |
| Assassin | int/adv | 12–25 | 45–65 | 2 | 3–4 | 75 s / 45 s | density: reps to top, then rest −10 s down to 30 s, then +load |
| Ranger | beginner | 8–12 | 60–70 | 3 | 2–3 | 105 s / 90 s | double progression |
| Ranger | int/adv | heavy 3–5 / medium 6–8 / light 10–12 | 82–90 / 72–80 / 65–72 | 2 | 3–5 | 150 s / 90 s | undulating H/M/L rotation, double progression per day type |
| Healer | all | holds 2×30 s; strength 8–12 @ 3 s eccentric | bodyweight/light | 3–4 | 1–3 | 45 s | +5 s hold per week to 60 s, then range, then tempo |

- **Load increment** = `clamp(base, 2%, 10% of working load)` with base 2.5 kg upper / 5 kg lower, rounded to the equipment step (barbell 2.5 kg, dumbbell 2 kg, machine 5 kg, cable 2.5 kg; lb: 5/5/10/5). If the increment exceeds 10% of load, add a rep instead [R5 §3.3].
- **Beginner safety**: no auto load increase in the first 4 sessions of a new lift; no loaded 1RM tests [R5].
- **Age 60+**: reps 10–15, RIR ≥ 2, rest +30 s [R5 §7.3].

### Advanced classes (Job Change at level 30)

| Base | Advanced | Unlocked techniques |
| --- | --- | --- |
| Fighter | Knight (strength-technique) or Berserker (intensity) | cluster sets, top set + back-off / myo-reps, rest-pause |
| Tank | Juggernaut | myo-reps, drop sets, mechanical drop sets |
| Assassin | Shadow Assassin | EMOM, AMRAP circuits, density blocks |
| Ranger | Striker | complexes, contrast sets (heavy + power) |
| Healer | Monk | loaded stretching, isometrics, tempo ladders |
| any (S rank) | **Shadow Monarch** (hidden) | choose class rules per exercise |

Job Change Quest (state machine §8.5) unlocks at level 30. Changing base class at any time regenerates targets after a System confirmation; it keeps XP, level, rank and stats.

---

## 4. XP and levels

### 4.1 Curve [R2 §3.1]

`xpToNext(L) = round(285 × L^0.84)`; cumulative to level 10 = 9,711; level 50 = 203,246; level 100 ≈ 734,513. The PRD starting curve `100 × L^1.5` reaches level 50 in ~3.5 years for a consistent user, missing the PRD's own one-year target, so it is replaced (PRD explicitly allows tuning). Max level 100 is not a cap: levels keep going with `xpToNext` growing.

### 4.2 XP sources (base, before multipliers) [R2 §3.2 + R5]

| Event | XP | Guard |
| --- | --- | --- |
| Working set | `8 × effort` — effort: RIR 0–1 → 1.0, RIR 2 → 0.9, RIR 3 → 0.6, RIR 4 → 0.3, RIR 5+ → 0; warm-up 0 | **0** if the set's primary muscle is past its weekly safe cap (rolling 7 days, §11) or was below 30% recovery at session start; max 12 hard sets per muscle per session |
| Workout completed (≥ 80% of planned working sets, or ≥ 8 sets unplanned) | 150 | one per day |
| Daily Quest cleared | 100 (training day) / 60 (rest day) | |
| PR (conservative e1RM beat on a tracked lift) | 75 | max 3 per session |
| Readiness check-in | 15 | once per day |
| Meal logged | 15 | first 3 per day |
| Calorie target within ±10% **and** ≥ safe floor | 40 | 0 if intake < floor |
| Protein ≥ 90% of target | 40 | |
| Water target hit | 25 | |
| Cardio session | `40 + 2 × max(0, minutes − 20)`, cap 120 | |
| Form Check good rep | 1 | cap 40 per session |
| Weekly plan cleared (Dungeon floor) | 200 | |
| 7-day streak milestone | 100 | each 7 days |
| Emergency Quest | 150–300 by difficulty | |
| Hidden Quest | 200–500 | |
| Boss Raid cleared | 1,500 | |
| Rank-Up Trial passed | 2,000 | |
| Job Change Quest passed | 2,000 | |
| Awakening (Test 500, first workout 500, first PR 250, first full day 250) | 1,500 total | one-time |
| Instant Dungeon cleared | 150 | max 1/day |
| Deload / Recovery Phase day completed | normal Daily Quest XP + 20 VIT stat XP | |

### 4.3 Multipliers

`xp = base × (1 + streakBonus) × (1 + statBonus[category]) × (1 + titleBonus[category]) × (1 + shadowBonus[category]) × comebackBonus`

- `streakBonus = min(0.15, 0.01 × floor(streak / 7))` [R2 §3.6]
- `statBonus(points) = 0.005 × min(p, 30) + 0.0025 × clamp(p − 30, 0, 30)` → max +22.5% at 60 points [R2 §3.3]
- titles and shadows: equipped title +3% in its category; up to 3 equipped shadows, each +2–6% in its category by shadow rank (§9).
- total multiplier capped at ×1.6 [D] so no build dominates.
- `comebackBonus = 1.25` for the first 3 cleared days after a streak drop.
- multipliers never apply to XP that safety rules made 0.

Categories: STR = sets, workouts, PRs; AGI = cardio, conditioning quests; VIT = check-ins, streak, rest-day quests, deload; INT = meals, nutrition targets, water; PER = form check.

### 4.4 Ledger

Append-only `xpEvents {id, ts, day, type, base, multiplier, xp, gold, category, refId, meta}`. Level, total XP, gold, base stats are **always recomputable** by folding the ledger. Idempotency key `type:refId` prevents double awards. Corrections are new events with negative `xp` **only** to undo a logging mistake (e.g. a deleted set) — never as a penalty.

---

## 5. Stats

- **Base stats** grow from behaviour, shown on the Status Window: each stat = `10 + floor(statXp / 250)` where statXp is the XP earned in its category [D]. Level-up also adds +1 to every base stat (canon "all stats +1 per level", R1 §2.3).
- **Allocation points**: +3 per level-up, +5 per Rank-Up, +5 per Job Change. Allocated points give the multiplier in §4.3. Respec free at Rank-Up and Job Change, else 300 gold.

---

## 6. Ranks and Rank-Up Trials [R2 §3.7]

| Rank | Min level | Power Level gate | Trial |
| --- | --- | --- | --- |
| E | 1 | — | start |
| D | 10 | 15 | Awakening Test re-run beats the starting results (push-ups, 60 s squats, plank) |
| C | 20 | 30 | class benchmark: Fighter/Tank squat or bench e1RM at "novice" standard; Assassin/Ranger 12-min conditioning test; Healer mobility battery |
| B | 35 | 45 | two-lift benchmark + conditioning test |
| A | 50 | 60 | e1RM standards on squat, bench, deadlift, OHP (intermediate for sex/bodyweight) |
| S | 70 | 78 | full test week + ≥ 80% session adherence over 12 weeks |
| National | 100 | 90 | S-tier Boss Raid + 52-week consistency (≥ 75% adherence) |

- Starting rank from Awakening: E if Power Level < 15, D if ≥ 15 (beginners always E). The Trial becomes available when level and Power Level gates are met; it is a Quest; failing means retry after 7 days, no loss. Passing: rank up, +5 points, free respec, guaranteed Legendary loot, Shadow Extraction.
- Trials require recovery ≥ 70% in the tested muscles and readiness tier Green; otherwise they are postponed, not failed.

---

## 7. Hunter Power Level (0–100) [R5 §8]

`PL = round(0.6 × strength + 0.25 × conditioning + 0.15 × consistency)`

- **Strength (0–100)**: for each of squat, bench, deadlift, OHP with a valid e1RM in the last 8 weeks: ratio = e1RM / bodyweight, interpolate the ratio across the R5 standards for the user's sex (untrained → 5, beginner → 10, novice → 25, intermediate → 50, advanced → 75, elite → 95, beyond elite → up to 100). Mean of available lifts. Lifts with no data contribute the bodyweight-test estimate: push-ups/squats/plank from the Awakening Test mapped to 0–40.
- **Conditioning (0–100)**: weekly cardio minutes vs 150 (ACSM) → 0–60, plus best-effort test (Awakening plank/squat or 12-min test) → 0–40.
- **Consistency (0–100)**: sessions completed / planned over the last 8 weeks × 100.
- Standards are interpolated by bodyweight (R5 table at 180 lb men / 140 lb women scaled by `(bw/ref)^-0.33` on the ratio [D, allometric scaling]).

e1RM: `min(Epley, Brzycki)` = Brzycki for 1–10 effective reps (`reps + RIR`); sets above 10 effective reps or RIR ≥ 4 do not update e1RM [R5 §4].

---

## 8. Quests (state machines)

All "days" are the user's **local calendar day**; rollover at local midnight; timezone stored per day so a timezone change never skips or doubles a day.

### 8.1 Daily Quest — "Preparation to Become Strong"

Generated at first open of the day (or at midnight by the scheduler) from plan + recovery + readiness.

```
Goal (training day): the planned session  |  (rest day): 10–15 min mobility block OR step goal
Always also: drink water target, protein target, readiness check-in
Time limit: until 23:59:59 local
Reward: XP (§4.2), 40 gold, +3 allocation points if all items cleared, a loot roll (after a workout)
Penalty: Penalty Zone (unless waived)
```

States: `issued → in_progress → cleared | failed | waived`.
- **Core** = the session (or rest-day block). The streak counts on core cleared. Sub-items give XP but never gate the streak [R2 §3.6].
- Readiness **Red** (R < 2.5) or an injury flag → the session swaps to a recovery block, Penalty is waived for the day.
- Deload week → Daily Quest is framed as "Recovery Phase" with the deload session; full XP + VIT bonus.

### 8.2 Penalty Zone

```
missed core (no Freeze, no Pass, not waived) at rollover
  → if Elixir of Life held: consume, streak preserved, message
  → else if Second Wind available (once per 30 days): auto-use, streak preserved
  → else: issue Penalty Quest for the new day: "Survive" — 10 min conditioning (level ≤ 20), 12 min (≤ 50), 15 min (above)
        Goal / Time limit (today) / Reward: streak restored / Penalty: streak halves
Penalty Quest cleared → streak restored to prior value (missed day bridged, not +1)
Penalty Quest missed → streak = floor(streak / 2); best streak and total days never reset
```

- No XP, gold or loot from the Penalty Quest (R1 anti-farm). **No XP is ever removed.**
- Low readiness or injury on the penalty day waives it (streak preserved).
- Warning push at 21:00 if core not cleared and no cover: `[Warning: failure to complete the Daily Quest will result in a penalty.]`

### 8.3 Emergency Quest

Random, optional, red window, always skippable, never on Red readiness or injury days, never targeting a muscle below 70% recovery. Chance 15% per day after day 7, max 2 per week. Templates scale by class/level (e.g. "Complete 50 push-ups before 21:00", "20-minute zone-2 ride before sunset", "Log every meal today"). Reward 150–300 XP, 100 gold.

### 8.4 Hidden Quests

Secret conditions; revealed when triggered. At least: Dawn Hunter (workout started 04:00–06:00), Night Owl (workout after 22:00), Overachiever (2× the Daily Quest volume within caps), Iron Will 100 (100-day streak), Hydra (water target 30 days in a row), Perfect Week (all Daily Quests cleared Mon–Sun), Polymath (5 different equipment types in a week), Marathoner (42.2 km cumulative in a week), Form Master (Form Check score ≥ 90 on 5 sets), Comeback (return after ≥ 14 days off). Each grants XP, a title and sometimes an Instant Dungeon Key.

### 8.5 Job Change Quest

`locked → available (level ≥ 30) → accepted → in_trial → passed | retry(7 days)`. Class-specific hard but safe challenge, scheduled only when recovery ≥ 70% and readiness Green, e.g. Fighter: work up to a 3RM at RIR 1 on a main lift ≥ intermediate standard; Tank: 5 × 10 at 70% with ≤ 120 s rest; Assassin: 20-min AMRAP circuit beating a target; Ranger: heavy/power complex + 2 km row; Healer: mobility battery score. Rules announced up front (no swaps during the trial). Passing: choose advanced class, title "One Who Overcame Adversity", +5 points, 2,000 XP.

### 8.6 Rank-Up Trial — §6.

---

## 9. Gates, Dungeons, Boss Raids, Red Gates, Demon Castle

- **Gate** = a program from the library. Rank by difficulty × length: E (beginner ≤ 4 weeks) … S (advanced ≥ 12 weeks). Colour: blue normal, purple recovery/mobility, red Red Gate.
- **Floor** = one week. A floor is cleared when ≥ 75% of its sessions are completed. Floors can be repeated.
- **Boss Raid** = final week: AMRAP at a set load or e1RM tests announced a week ahead (load, reps, pass rule). Boss HP bar = sum of the week's target volume; each logged set deals its volume as damage. Pass = every test meets its rule (e.g. AMRAP ≥ target reps, or e1RM ≥ start e1RM). Victory: 1,500 XP, 500 gold, guaranteed Epic+ loot, Shadow Extraction. Fail: retry after 7 days, no loss.
- **Dungeon Break**: no session in the active Gate for 10 days → Gate shows "unstable" and offers a catch-up week; nothing is lost.
- **Red Gate**: opt-in 7-day challenge, entry requires rank ≥ C (canon minimum B is too late for a 1-year user) [D]; warning window states it cannot be paused; only readiness Red / injury suspends it (waiver, not failure). Daily challenge sessions; clearing = 7/7 days; reward Epic loot + title "Red Gate Survivor" + 1,000 XP.
- **Instant Dungeon**: opened with a key (inventory), a 15–25 min bonus workout (arms, abs, conditioning); blocked if target muscles < 30% recovery; 150 XP; max 1/day.
- **Demon Castle**: 100 floors, lifetime. Floor n requires `cumulative score ≥ floorThreshold(n)`, score = `volumeKg/1000 + cardioKm + workouts × 5` [D]; thresholds `round(10 × n^1.6)`. Bosses: floor 1 Cerberus, 25 Vulcan's Herald, 50 Vulcan, 75 Metus, 100 Baran (R1 §7.5) — each boss floor clear triggers Shadow Extraction.

---

## 10. Shadow Extraction and the Shadow Army

- Triggers: Boss Raid victory, Rank-Up Trial pass, major PR (e1RM +5% over the previous best on a key lift, or first PR on a lift ≥ intermediate standard), Demon Castle boss floor.
- Sequence: screen dims, purple smoke, up to three "attempts" animate; **outcome is deterministic** (always succeeds — it rewards a real achievement; R1 row 48). The Player may name Knight-rank or higher shadows.
- Shadow rank by trigger: Normal (major PR on accessory), Elite (major PR on main lift), Knight (Boss Raid E–C, Demon Castle floor 1), Elite Knight (Boss Raid B–A, Rank-Up to C/B), Commander (Boss Raid S, Rank-Up to A, floor 50/75), Marshal (Rank-Up to S, floor 100), Grand Marshal (National Level).
- Buff by rank: Normal +2%, Elite +3%, Knight +4%, Elite Knight +5%, Commander +5%, Marshal +6%, Grand Marshal +6% (all categories +3%) in the shadow's category. Up to 3 equipped.
- Catalogue: original shadows with names and lore (`src/data/shadows.json`), each tied to a source boss type (e.g. "Ferros, the Iron Squat Warden" from a squat-themed Boss Raid). Duplicate triggers promote an existing shadow one rank instead.

---

## 11. Safety rules (never broken) [PRD §3, R5]

1. **Weekly safe cap** (hard sets, rolling 7 days; RIR 0–3 = 1 set, RIR 4 = 0.5, RIR 5+ = 0; synergist 0.5): beginner / intermediate / advanced — chest 12/20/24, back (lats+upper back+lower back) 12/22/25, quads 10/18/20, hamstrings 8/14/18, glutes 10/20/24, side delts 10/20/24, rear delts 8/16/20, front delts 4/8/12, biceps 8/20/25, triceps 8/18/20, calves 8/20/24, traps 6/16/20, abs/obliques 8/16/20, forearms 6/12/16; others (neck, adductors, abductors, hip flexors) 6/12/16. Absolute ceiling 25. Sets beyond cap → 0 XP + System warning.
2. **No reward below 30% recovery** for a muscle; the recommender marks it "avoid".
3. **Deloads enforced** when triggered (§12) and framed as "Recovery Phase" with bonus VIT.
4. **Low readiness or injury** waives the Penalty Zone and swaps the session for recovery work.
5. **Diet floors**: calories never below `max(BMR, 1200 ♀ / 1500 ♂)`; deficit ≤ `min(25% TDEE, 750 kcal)`; protein ≥ 1.2 g/kg; fat ≥ `max(0.6 g/kg, 20% kcal)`. No XP for intake under the floor.
6. Loot, gold and multipliers never change training prescription.

---

## 12. Training engines (rules summary — details in R5)

- **Recovery**: per muscle `FP(t) = Σ FP_i × 0.5^((t − t_i)/T_half)`, recovery = `100 × (1 − min(1, FP/10))`; per set `FP = E(RIR) × L(%1RM) × S(role) × N(novelty)`, `E = max(0.25, 1 − 0.15 RIR)`, L = 1.1 (<60%) / 1.0 / 0.9 (>80%), S = 1 / 0.5, N = 1.5/1.3/1.15 for weeks 1/2/3 on a new exercise. Half-lives: quads, glutes, hamstrings, lats, upper back, lower back 24 h; chest 22 h; delts, triceps, traps 20 h; biceps, forearms, calves, abs, obliques, others 16 h; ×1.25 at age 60+. Cardio `FP += c(mode, muscle) × max(0, MET − 3) × hours × (1.2 if HIIT)`. Readiness factor Green 1.0 / Yellow 0.9 / Red 0.75 applied to displayed recovery. Manual override rewrites FP. Injury flag caps a muscle at 30%. Ready ≥ 70, partial 30–70, avoid < 30.
- **Autoregulation**: next-set load change = `4% × (reportedRIR − targetRIR)` clamped ±10%.
- **Plateau**: best conservative e1RM fails to beat the rolling best by ≥ 1% over 3 consecutive exposures (top-set RIR ≤ 3) → micro-load → variation swap → lift deload (−10%).
- **Deload**: scheduled every 8 / 6 / 5 weeks (beginner/intermediate/advanced), never > 8 weeks; reactive if e1RM −5% on ≥ 2 lifts over 2 sessions, mean readiness ≤ 2.5 on 3 of 7 days, ≥ 2 lifts stalled in a week, or "I feel beat up". Prescription: 1 week, sets −45% (≥ 6 sets/muscle/week), load −10% on compounds, RIR 4–5, same exercises and frequency.
- **Nutrition**: Mifflin-St Jeor; activity 1.2/1.375/1.55/1.725/1.9; cut −20% (−15…−25), bulk +10–15% beginner / +10% intermediate / +5% advanced, maintain 0; protein 1.6 (maintain) / 2.0 (cut) / 1.8 (bulk) g/kg, vegetarian ×1.10, vegan ×1.20, Fighter/Tank floor 1.8, cap 2.4 g/kg; fat 0.8 g/kg (≥ 20% kcal); carbs remainder (≥ 3 g/kg when possible); fibre 14 g/1000 kcal; water 35 ml/kg + 500 ml per training hour; adaptive TDEE weekly from 7-day weight trend `TDEE_obs = intake − ΔW × 7700 / 7`, blended 0.7/0.3, ±150 kcal/week, needs ≥ 5 logged days.

---

## 13. Titles, loot, gold, store, inventory

- **Titles**: ≥ 60 in `src/data/titles.json`, each `{id, name, description, condition, category, bonus}`. One equipped (+3% XP in its category). Unlocks evaluated after every ledger event.
- **Loot** [R2 §3.4]: one roll per completed workout (max 1/day), never empty. Rarity base: Common 70%, Rare 22.5%, Epic 6%, Legendary 1.5%. Pity: Rare+ soft from 4 (+15%/workout) hard at 6; Epic+ soft from 20 (+4%) hard at 30; Legendary soft from 45 (+2%) hard at 70. Guaranteed: Boss Raid → Epic+, Rank-Up Trial → Legendary, 100-day streak → Rare. Smart drop: unowned items ×2 weight; if no Streak Freeze held, 50% of Rare drops are a Streak Freeze. Odds and pity counters visible. Seeded RNG (reproducible, testable).
- **Gold** [R2 §3.5]: Daily Quest 40, all daily targets 15, workout 50, weekly plan cleared 150, PR 25, level-up 10 × new level, Boss Raid 500, Rank-Up 1,000, Emergency 100, Common loot 20–60, Rare loot 120–250, Epic loot 400–800. Gold only leaves when the Player buys.
- **Store**: Elixir of Life (Streak Freeze) 250, hold ≤ 2; Rest Day Pass 150 (1 free/week, hold ≤ 2, declared before the day); Instant Dungeon Key 400; Respec 300; UI themes 1,500 / 3,000 / 6,000; profile frame 2,500; panel skin 4,000; Blessed Box 1,200 (choose 1 of 3 unowned cosmetics); Legendary cosmetics are drop-only.
- **Inventory**: unlimited; item `{id, type: consumable|key|theme|frame|skin|scroll, rarity, qty}`.

---

## 14. Streaks [R2 §3.6]

Increment on core cleared (planned rest days count when the readiness check-in is done or a Rest Day Pass is declared). Freeze → Second Wind → Penalty Quest (repairs) → halve. Milestone titles/animations at 7, 21, 66, 100, 365. Best streak and total active days never reset.

---

## Changelog vs PRD

| Change | Why |
| --- | --- |
| XP curve `285 × L^0.84` instead of `100 × L^1.5` | PRD curve misses its own level-50-in-a-year target by 3.5× (R2 §3.1) |
| Class table split by experience level; Ranger loads fixed; longer compound rest | R5 §0 corrections 1–7 |
| No extra XP for RIR 0 vs 1 | failure adds no benefit, slows recovery (R5 §0 #8) |
| Streak halves (not resets) when the Penalty Quest is also missed | Lally 2010: one miss does not break habits (R2) |
| Red Gate entry rank C (not B) | B arrives ~day 195; challenge should be available earlier |
| Second Wind (once per 30 days auto streak save) | R1 mapping row 61 (Black Heart) |
| HP/MP/Fatigue on Status Window mapped to recovery/readiness | R1 §2 canon fields |
