# R2 - RPG systems from other stories and games

Track R2 of the Shadow System PRD. Written 2026-10-23. Scope: study how other "System" stories, games, habit apps and motivation research design progression, then decide what goes into `docs/game-design.md`.

Honesty note on sourcing. Pages marked "(opened)" in Sources were fetched and read in this session. Fandom wikis (Habitica, The Gamer, ORV, Diablo) returned HTTP 402/403, so for the System-story mechanics I could only open Wikipedia, which is thin on mechanics. Where a mechanic below comes from my background knowledge rather than an opened page, it is tagged **[bg]** and should be re-verified before it is quoted as fact. Numbers in section 3 are our own design proposals, not sourced facts.

---

## 1. Per-source analysis

### 1.1 "System" stories

**The Gamer (Han Ji-han, Naver Webtoon 2013-2024).** Opened: Wikipedia confirms the premise (the protagonist treats the world as a game, a dialogue box appears, levelling raises stats, and real study/training also raises stats, e.g. studying raises Intelligence). From background knowledge **[bg]**: *Gamer's Mind* is a passive that keeps him calm and immune to mental disorders, *Gamer's Body* gives game-style healing (sleeping in a bed restores HP/MP and clears status effects), stats are STR / VIT / DEX / INT / WIS / LUK, and skills level by use. The fan-wiki page that lists this was blocked, so only the "sleep restores everything" and the six stat names were seen via search summaries.
- Core mechanics: quest log as the story engine, stats that rise from real activity, skills that level from use, sleep/rest as a full heal.
- Insight: *Gamer's Mind* is the fantasy of "emotional regulation is a stat". For us that maps to the readiness check-in and the rule that a bad day never punishes. *Rest = full recovery* supports framing deloads and rest days as an HP/MP refill ("Recovery Phase", PRD section 3) rather than lost time.

**Omniscient Reader's Viewpoint (ORV).** Opened (Wikipedia): scenarios begin when a dokkaebi announces them ("Kill one or more living organisms"); Constellations are cosmic beings in nebulae (Uriel, Sun Wukong, Hades, Persephone, the Abyssal Black Flame Dragon) who sponsor "incarnations" they find entertaining; the protagonist later becomes a Constellation himself. The page does not cover coins or stories. From background knowledge **[bg]**: scenarios have clear-conditions, a time limit, and a reward in coins; Constellations send coins as "sponsorship" when the audience (their channel) is entertained; coins buy skills/stat upgrades in a shop; a "story" (narrative-based skill) gives a player an identity-bound perk; failing a scenario can have a stiff penalty.
- Core mechanics: a stream of time-boxed scenarios with explicit clear conditions, an audience that rewards entertaining play, a currency spent on upgrades.
- Insight: the engaging part is the audience reaction, not the penalty. A cheap, safe imitation is "System commentary": the System (our only narrator) reacts to a PR, a streak milestone or a comeback with a message and a small gold "sponsorship". Scenario format (clear condition, deadline, reward) is exactly our Daily/Emergency Quest. We deliberately skip the lethal failure side.

**Tower of God.** Opened (Wikipedia): a tower of floors, each with an Outer area, an Inner area where tests are held, and a middle linking area; climbers are Regulars, those who reach the top become Rankers/High Rankers; battle positions are Fisherman (direct fighter), Spear-bearer (support), Light-bearer (recon), Scout, Wave-controller; Irregulars break the rules.
- Core mechanics: floors gate content, each floor's test has a different *type* (strength, agility, cleverness), position (role) defines how you contribute to the team.
- Insight: floors as tests of different skills, not only "more of the same". A Dungeon floor (training week) can have a distinct test flavour (volume week, technique week, AMRAP week, cardio week). Positions map to classes and Job Change. The Demon Castle tower (PRD) is our Tower of God: 100 floors of lifetime milestones, each floor a different *type* of milestone so the climb does not feel like one number.

**Leveling with the Gods (Level Up with the Gods).** Opened (kcomicsbeat summary only; Wikipedia 404): a student pulled into a Tower, once an elite backed by the Inner Gods, crushed by Outer Gods, then regresses to an earlier time to train smarter. From background knowledge **[bg]**: gods act as sponsors who grant blessings and gear, floors have god-guarded bosses, characters are ranked.
- Core mechanics: tower floors, divine sponsors, regression (retry with accumulated knowledge).
- Insight: **regression** is the best narrative frame for our deload/comeback flow: "you return stronger because you remember". After a lapse the System restores the Player's knowledge (previous working weights, previous plan) instead of demoting. Sponsor = our Shadow Army passive buffs (each shadow is a "patron" with a small buff).

### 1.2 Games

**Final Fantasy V job system / FFXIV job change.** Opened (Wikipedia, FFV): everyone starts as Freelancer; jobs unlock via crystal shards; AP accrues alongside XP; job levels are per job and unlock abilities; abilities can be carried across jobs (a Knight using Black Magic as a secondary command); the design goal was deeper customisation. FFXIV (not opened) **[bg]**: one character can swap class by swapping weapon, each class has its own level, so no character is locked in.
- Insight: **separating character level from job level** makes class change cheap and exciting. The player is not trapped by an early choice. Our classes (Fighter, Tank, Assassin, Ranger, Healer) should each keep a *class mastery level* with its own small unlock track, and Job Change at level 30 is a class-specific quest, not a reset. Carry-over of one ability from a past class (e.g. keep cluster sets after leaving Fighter) is the "Shadow Monarch mixes class rules" hook.

**Diablo II / III / IV loot rarity.** Opened: Wikipedia Diablo II gives the tiers Normal (white), Magic (blue, 1-2 affixes), Rare (yellow, 2-6), Set (green), Unique (gold, 3-8 fixed props), plus the Horadric Cube for crafting. Wikipedia Diablo III: magic up to 3 properties, rare up to 6, legendary up to ~8; higher monster level drops higher item level. Shacknews on Loot 2.0 (patch 2.0.1): Blizzard buffed legendaries so they really are the best items, "Smart Drop" tunes drops to the class that finds them, auction house removed so loot is the reward. Opened Wikipedia Diablo IV: rarity is a power signal, rarest items add unique effects; no bad-luck protection mentioned. A search surfaced Blizzard's own Diablo Immortal support page about "unlucky" players and a forum thread about bad-luck protection for Ubers, but the support page redirected to a login and the thread was only seen as a snippet, so I treat "Blizzard is looking at BLP" as **unverified**. "Loot pinata" (an elite/boss that showers many items) **[bg]** is community slang for the Diablo III elite-pack drop style; not verified in an opened page.
- Insight: (a) colour-coded rarity is instantly legible, (b) fewer but meaningful drops beat a flood (Loot 2.0 traded quantity for quality), (c) *Smart Drop* = relevance filter: our drops should be relevant to what the Player does (theme for their class, a Streak Freeze when they have none). (d) Unmitigated pure-random odds create very long dry streaks. I simulated a flat 1.5% legendary roll: mean 69 rolls but the 90th percentile is 162 and the worst of 2,000 runs was 673. That is why pity exists.

**Gacha pity (for bad-luck protection design).** Opened (Wikipedia, Gacha game): soft pity (rate rises gradually after a threshold), hard pity (guaranteed at a max count), hard pity acts as a price ceiling; many jurisdictions force odds to be published; critics link pity to sunk-cost pressure and gambling-like behaviour; HoYoverse paid a $20M FTC settlement over obscured odds.
- Insight: use soft + hard pity but with no money in the loop, publish the odds in-app, show the pity counter, and keep drops cosmetic/convenience.

**Dark Souls / Elden Ring.** Opened (Wikipedia): bonfires heal and checkpoint but respawn enemies; dying drops souls at a bloodstain and you recover them if you reach it without dying again ("the harshest punishment is not dying once, but twice"); Elden Ring Sites of Grace are checkpoints that also let you level up, change spells and fast travel; Spirit Ashes are optional help; no easy mode but reviewers called it the most accessible Souls game because you can avoid threats, return stronger, and fast travel between checkpoints.
- Insight: difficulty is acceptable when (1) failure has a cheap, readable cost, (2) the loss is *recoverable* (the bloodstain), (3) a safe place exists to level up and plan, (4) help is optional (Spirit Ashes). Maps to: the Status Window is the bonfire; a failed Boss Raid costs a retry, not XP; a missed day makes a Penalty quest that *recovers* the streak (the bloodstain) and is only second-chance, never a permanent loss. Fairness rule: the boss (test week) must be telegraphed (the System states the test, weights and passing rule in advance) so a loss is the player's information, not the game's trick.

**Persona (3/4/5).** Opened (Wikipedia Persona 5): one school-year calendar with day/night slots, free time spent on part-time jobs, leisure and crafting, activities raise social stats which unlock options, confidants (social links) rank up and give combat abilities or bonuses, palace deadlines have consequences. The stat names (Knowledge, Guts, Proficiency, Kindness, Charm) are **[bg]**; the opened page did not list them.
- Insight: **daily life is the game**. Every day has a small number of slots, and the choice of slot is the strategy. For us: a visible "Today" calendar where training, meal logging, water, readiness and recovery are slots, with the System giving a one-line recommendation. Social stats = our five stats; confidants without social features can map to a small NPC roster (Shadow Army) with rank-ups tied to long-term habits ("Igris reaches Rank 3 after 12 weeks of leg days").

**Monster Hunter.** Opened (Wikipedia): the hunter has no levels or intrinsic stats; power comes entirely from gear; monster parts and resources are forged or upgraded into stronger gear; rewards are partly random so players repeat a hunt for a specific part; hunter rank gates harder missions; the series' "compulsion loop" is hunt, parts, craft, hunt.
- Insight: **progress you can see on your body/character, crafted from specific accomplishments**. For us: gear and cosmetics are crafted from "monster parts" earned by a specific *type* of work (Leg Day Survivor shards from squats, Iron Lung shards from cardio). Crafting recipes show a progress bar ("3 of 5 Wolf Fangs") so the player has a goal that variance cannot take away.

**Pokemon.** Opened (Wikipedia Pokedex): endgame goal is completing the Pokedex (at least one of each species); collection scope grew from 151 to 493+ species; shiny variants are rarer; trading is central. The page does not cover seen-vs-caught or Tajiri's intent.
- Insight: **completion is a goal that never punishes**. A collection can only grow. Our Shadow Army gallery with silhouettes of undiscovered shadows (and a "seen" hint of what unlocks them) gives long-horizon goals without any loss mechanic. Collections to complete: shadows, titles (60+), exercise mastery ("every squat variation logged"), muscle-group badges, cuisine dishes tried.

**Duolingo (streak psychology).** Opened: Duolingo blog posts and a Lenny's Newsletter episode page.
- Streak = consecutive days with one lesson; users with a 7-day streak are 3.6x more likely to complete the course (how-duolingo-streak-builds-habit); separately 2.4x more likely to return next day (improving-the-streak).
- Early in a streak each extension is a big relative gain (2 to 3 days is +50%, 200 to 201 is +0.5%), so motivation shifts toward loss aversion as it grows; reminders then say "protect your streak".
- Streak Freeze (pause one day): equipping up to **two** at once raised relative daily active learners **+0.38%** with no increase in days off. Duolingo cites a UPenn/UCLA study that some slack beats rigid rules.
- Experiments (2017 post): Streak Wager (stake gems, double if you keep a 7-day streak) gave +14% Day-7 retention; Weekend Amulet (store item to keep a streak through the weekend) made learners 4% more likely to return a week later and 5% less likely to lose their streak; learners who binge lessons are much more likely to quit than those who pace themselves.
- Splitting the streak from the daily goal (one lesson extends the streak, not hitting an XP goal) raised Day-14 retention +3.3% (relative), DAUs +1%, daily learners on a streak +10.5% within 20 days, and 7+ day streaks over +40%; the trade-off was fewer people reached their full daily goal.
- Lenny's page: 600+ streak experiments; tying the streak to XP confused users, one lesson a day worked better; letting users choose their streak length (opt-out/commitment) raised retention; "Streaks can't compensate for a product users don't find valuable."
- Not verified by any opened page: broad churn/DAU claims (e.g. "churn -40%", "47% to 28%") from third-party blogs seen in search snippets; I do not rely on them.
- Insight: **streak = lowest possible bar (one action) + forgiveness (freeze, weekend amulet, repair) + celebrations at milestones**. The bar matters more than the penalty: simplify what counts. Loss aversion is a *real lever* but it is a bigger lever when the user chose the goal; we keep the loss aversion on streak and remove the permanent-loss part.

**Habitica.** Opened: Wikipedia Habitica (Habits earn XP/gold, negative habits cost health; To-dos do no damage; levelling restores health; Tavern and guilds removed Aug 2023); GitHub source of `statHelpers.js` and `scoreTask.js`.
- XP to next level: `25 x level` below level 5, 150 at level 5, then `round((level^2 x 0.25 + 10 x level + 139.75) / 10) x 10`. This is a *quadratic*, flatter than our `100 x level^1.5`. Example, level 6 = 210, level 50 = 1,260 (our computation from the formula).
- Task scoring: each task has a "value" that drifts with completion; missed Dailies deal HP damage `delta x conBonus x priority x 2` (Constitution divisor 250, floor 0.1); XP uses an intelligence bonus `1 + int x 0.025`, gold uses perception `1 + per x 0.02`; **streak bonus on gold: `currStreak/100 + 1`**; `diminishingReturns(bonus, max, halfway)` is a hyperbolic cap so bonuses cannot grow unbounded.
- From search snippets only (the fandom Death page returned HTTP 402, so not opened): dying costs a level, gold and an equipment piece; damage from missed Dailies also hits the whole party; players game it by un-assigning Dailies from all days so they cannot be damaged. That avoidance behaviour is the textbook "punishment backfires" signal: the player edits the rules rather than the behaviour. There is no controlled study of Habitica's punishments, so this is an observation, not evidence.
- Insight: copy the **diminishing-returns formula** for stat bonuses (a proven, simple cap), the **streak bonus as a small per-day increment** (Habitica +1% gold per streak day uncapped; we cap), and the party-boss loop only as a single-player Boss Raid. Do not copy HP loss, level loss or equipment loss.

### 1.3 Research

**Self-determination theory (SDT).** Opened (Wikipedia SDT): three basic needs, autonomy, competence, relatedness; controlling rewards undermine intrinsic motivation, informational rewards that signal competence can enhance it; identified regulation (valuing exercise) is more consistently associated with regular activity than enjoyment alone.
Teixeira et al. 2012 (opened full-text PMC, systematic review of 66 studies / 72 samples):
- Autonomous regulation is positively associated with exercise in ~82-91% of samples; **controlled regulations show no bivariate association and, in multivariate models, are negative in a few and null in the rest**.
- **External regulation** (doing it for rewards/pressure) is *negatively* associated with exercise in 43% of multivariate samples; none show a positive association.
- **Introjected regulation** (guilt/shame/avoiding disapproval) is mixed (30% positive, 5% negative, 65% none) and "SDT expects introjection to be an unstable basis for long-term motivation".
- Identified regulation predicts early adoption; intrinsic motivation predicts long-term adherence. Caveat: mostly cross-sectional, mostly Western samples.
- Design rule: motivation should shift from external (gold, loot) in week 1 to identified (this is who I am: titles, Hunter identity, class) and intrinsic (mastery, body awareness) later. Rewards must *inform* ("you added 5 kg") not *control* ("do this or lose").

**Overjustification effect.** Opened (Wikipedia): expected, tangible, task-contingent rewards for an activity people already enjoy can lower intrinsic motivation; non-contingent and informational rewards have little or positive effect; the article reports Cameron and Pierce 1994 as a counterweight (rewards for outperforming others or uninteresting tasks raised intrinsic motivation). The size of the effect depends on how controlling the reward is felt to be. It is **not** established that every gamified reward kills motivation; the safe pattern is: rewards signal competence, are partly unexpected, and sit *on top of* a purpose the user chose.
- Design rule: keep the gold/loot streams modest, make some of them surprise (Emergency Quests, Hidden Quests, unexpected titles), and always pair a reward with an informational message (what changed in the user's training).

**Variable-ratio rewards and ethics.** Opened: Wikipedia Reinforcement (variable ratio gives high, steady responding and is the most resistant to extinction; slot machines; Skinner argued positive reinforcement beats punishment, but later work finds the two can be about equally effective) and Hopson's "Behavioral Game Design" (variable ratio: random drops; fixed ratio: XP thresholds; avoid long reward gaps; sudden drops in reward cause anger and feel unfair; avoidance mechanics build momentum, example Ultima Online houses that decay). Gacha page: pity and odds disclosure.
- Ethics rule for us (single-user, private): variable rewards are acceptable only if (1) no money, (2) the roll is attached to a *completed healthy session* and capped at one per day, (3) odds and the pity counter are visible, (4) the rewards are cosmetic or convenience, (5) the variable reward never sits next to extra volume (no "one more set for a chance at a drop"). XP, which must be predictable, stays on a fixed schedule.

**Why punishment demotivates exercise adherence.** Teixeira (above) is the direct evidence that controlled/external regulation does not help and sometimes hurts; Hopson's cautions on sudden reward drops and frustration; the Lally study below shows that a single miss is not a practical threat to a habit so a harsh penalty is unwarranted. I did not find a controlled trial of punishment in gamified fitness apps, so "punishment demotivates" is supported by SDT and by observed avoidance behaviour in Habitica (see above), not by a head-to-head experiment.

**Loss aversion.** Opened (Wikipedia): losses weigh roughly twice as much as equal gains in prospect theory; some critics argue it is smaller or absent with small stakes (Gal and Rucker), but a 2020 replication across five samples found it with predictable magnitude. Implication: a streak is a legitimately powerful lever, but because it is a lever it is also the source of anxiety; apply it to *something recoverable*.

**Habit formation (Lally et al. 2010).** Opened (BPS research digest, Wikipedia Habit, abstract via search): 96 volunteers, 82 analysed, 84 days, a chosen daily behaviour tied to a cue; median **66 days** to plateau of automaticity, individual range **18-254 days**; about half had not reached a habit-level score after 84 days; exercise habits took about 1.5x longer than eating/drinking habits; **missing one day had no material effect**, though many misses lowered the final automaticity. Limitation: self-report, small original sample, not yet replicated per a later preprint (seen only in a search snippet).
- Design rules: (1) never treat one missed day as catastrophic (supports freezes and a forgiving reset); (2) expect 2-3 months to become automatic and ~3-4 months for exercise (1.5 x 66 days ~ 100 days), which is why the first 100 days carry the most scaffolding (streak milestones at 7, 21, 66, 100); (3) tie the habit to a cue (a set daily slot and reminder time).

---

## 2. Adopted mechanics

| Mechanic | Source | How it maps to training or diet in our app | Why it motivates without punishing |
| --- | --- | --- | --- |
| Daily Quest as time-boxed scenario with explicit clear condition | ORV scenarios, Solo Leveling | Today's planned session (or rest-day mobility/step goal) plus water/protein/readiness. Countdown to midnight | Clear target, the deadline is visible, nothing is lost for missing it except an optional streak bonus; low readiness waives it |
| System "sponsorship" commentary | ORV constellations | The System comments on PRs, comeback sessions, 4-week consistency with a short in-voice message and a small gold bonus | Praise is informational (SDT) and shows competence; no failure messaging beyond a warning |
| Floors with distinct test types | Tower of God | Dungeon weeks differ in flavour (volume week, technique week, AMRAP/boss week, cardio week); Demon Castle floors are different lifetime milestone types | Variety avoids one-metric grind; the final week is a pre-announced test (fairness) |
| Positions/roles | Tower of God | Class (Fighter, Tank, Assassin, Ranger, Healer) | Self-chosen identity supports autonomy; can change class any time |
| Regression/comeback | Leveling with the Gods **[bg]** | After a lapse (more than 7 days) the System restores last working weights and offers a "Regression Week" at 80% load with XP bonus | Re-entry feels like returning stronger, not starting over; avoids the "what-the-hell" quit |
| Rest = full heal | The Gamer **[bg]** | Rest days and deloads are "Recovery Phase", grant bonus VIT XP and a recovery tick on the body map | Rest is rewarded, which removes the incentive to train sore or injured |
| Separate class level from character level | Final Fantasy V | Class mastery level (XP in that class's training style) unlocks class techniques; Job Change at character level 30 via quest | Changing class is cheap, not a restart; avoids lock-in regret |
| Ability carry-over | Final Fantasy V | After Job Change, keep one technique from the old class (e.g. cluster sets) as a "secondary command" | Reward for exploration; Shadow Monarch generalises this |
| Rarity tiers with colour-coding | Diablo II/III/IV | Loot after each workout: Common (white), Rare (blue), Epic (purple), Legendary (orange/gold) | Instantly legible; items are cosmetic/convenience so no safety stake |
| Smart drop (relevance) | Diablo III Loot 2.0 | Drop table is weighted by what the Player lacks (no Streak Freeze in inventory raises the odds of one among Rare drops) and by class (Fighter themes) | Rewards are useful, less random frustration |
| Bad-luck protection (soft + hard pity) | Gacha, Diablo debate | Counters per rarity (section 3.4) | Removes long dry streaks and the feeling of an unfair game |
| Odds and pity counter visible | Gacha regulation | Loot screen shows odds and "Epic guaranteed in N workouts" | Transparency prevents manipulation |
| Safe checkpoint | Dark Souls bonfire / Elden Ring grace | Status Window as the safe place: level up, allocate stats, plan the week, change class; a Rest Day is a bonfire | A known safe place makes difficulty acceptable |
| Recoverable loss | Dark Souls bloodstain | A missed day triggers a Penalty quest, and clearing it restores the streak to what it was | The loss is real but recoverable; no XP is ever removed |
| Telegraphed, fair bosses | Dark Souls/Elden Ring | Boss Raid (test week) announces exact tests, weights and pass rule a week ahead; failing means a retry after 7 days | Failure is information, not ambush; no permanent cost |
| Optional help | Elden Ring Spirit Ashes | Smart swap, lighter variant, "Shadow ally" auto-regulation for a bad day | Autonomy-supportive; aid never lowers rewards |
| Calendar/slots | Persona | A Today screen with slots: Train, Eat, Water, Readiness, Recover; System suggests the next best slot | Daily life is the game; the choice is the strategy; no empty-day guilt, empty slots are just open |
| Social stats / confidants without social | Persona | 5 stats (STR/AGI/VIT/INT/PER) and a Shadow roster that ranks up with long-term habits | Gives long-horizon goals without leaderboards |
| Gear crafted from progress | Monster Hunter | "Parts" earned by work type (e.g. Wolf Fangs from squats) craft cosmetic gear/frames with visible recipe progress | Deterministic goal, so randomness cannot block a determined user |
| Collection/completion | Pokemon | Shadow Army gallery with silhouettes, 60+ titles, exercise-variation mastery, muscle badges | Collections only grow, never shrink; drives exploration |
| Streak with a low bar | Duolingo | A day counts when the *Daily Quest core* is cleared (one session or rest-day quest), not every sub-target | Duolingo found one-lesson-a-day beat an XP target; more people on streaks |
| Streak Freeze, hold two | Duolingo | "Elixir of Life": up to 2 held, auto-consumed on a missed day | Duolingo +0.38% DAU with two Freezes and no rise in days off |
| Weekend/planned rest pass | Duolingo Weekend Amulet | Rest Day Pass declared in advance (and 1 free per week) | Amulet: +4% return, -5% lost streaks; planned rest feels like autonomy |
| Streak milestone celebrations | Duolingo | Titles/animations at 7, 21, 66, 100, 365 days | Early gains are large in relative terms; animations raised 7-day retention |
| Small per-day streak bonus with cap | Habitica `streak/100 + 1` | +1% XP per 7 streak days, capped at +15% | Habitica's is uncapped, ours is bounded so bonuses never dominate |
| Diminishing-returns stat bonus | Habitica `diminishingReturns` | Stat-point XP bonus: linear to 30 points then half rate to a hard cap | Prevents runaway scaling without a hard wall |
| Boss as a quest | Habitica | Boss Raid shows a damage bar from set volume across the Dungeon | Single-player; pure feedback, no party damage |
| Autonomy-supportive framing | SDT | Every reward message names the real-world improvement; rewards are partly unexpected; no "you must" language except safety | Teixeira: autonomous motivation predicts exercise; external pressure does not |
| Habit scaffolding to ~100 days | Lally 2010 | Heavier reminders and celebrations in first 100 days, fading after | 66 days median, exercise ~1.5x longer |
| Variable reward capped to once a day | Hopson / ethics | Loot roll once per completed session | No grinding, no "one more set" |

Mechanics explicitly rejected: HP loss, level loss, equipment loss and shared-damage (Habitica); lethal failure (ORV); losing runes permanently on second death (Elden Ring) because our "second miss" must never wipe progress; paid luck or any currency tied to real money (gacha); leaderboards (out of scope).

---

## 3. Concrete numeric proposals (for `docs/game-design.md`)

All numbers are proposals. Where they depend on R5 (safe volume caps, protein targets) a placeholder is named. Re-verify after the 12-week simulation.

### 3.1 XP curve check (PRD formula vs target)

PRD curve: `XP(L to L+1) = round(100 x L^1.5)`. Cumulative XP to reach level N = sum for L = 1..N-1.

| Level reached | PRD cumulative XP | XP for the next level |
| --- | --- | --- |
| 5 | 1,703 | 1,118 |
| 10 | **11,106** | 3,162 |
| 20 | 67,135 | 8,944 |
| 30 | 189,029 | 16,432 |
| 40 | 392,197 | 25,298 |
| 50 | **689,513** | 35,355 |
| 100 | 3,950,120 | 100,000 |

Required daily XP under the PRD curve:
- Level 10 in 21 days: 11,106 / 21 = **529 XP/day**.
- Level 50 in 365 days: 689,513 / 365 = **1,889 XP/day**, which is 3.6x the early budget. The remaining 40 levels would need (689,513 - 11,106) / 344 = 1,972 XP/day.
- A fixed per-activity budget cannot be both. The reasons are structural: a 1.5 exponent makes the L50/L10 cumulative ratio 62x, while a consistent user's daily budget grows only ~1.3x over a year (streak and stat multipliers). Simulation with the budget below and 90% adherence puts the PRD curve at level 10 on day 23 but level 50 on day ~1,270 (about 3.5 years). **The PRD curve gets level 10 right and level 50 wrong by 3.5x.**

Proposed curve: `XP(L to L+1) = round(285 x L^0.84)`.

| Level reached | Cumulative XP | XP for the next level | Typical day (90% adherence) |
| --- | --- | --- | --- |
| 5 | 2,425 | 1,101 | day 3 |
| 10 | **9,711** | 1,972 | **day 20** |
| 20 | 36,580 | 3,529 | day 72 |
| 30 | 78,395 | 4,962 | day 150 |
| 35 | 104,582 | ~5,640 | day 195 |
| 40 | 134,167 | 6,318 | day 246 |
| 50 | **203,246** | 7,620 | **day 363** |
| 70 | 379,522 | ~10,100 | day 672 |
| 100 | 734,513 | ~13,600 | day 1,298 |

Same simulation at 80% adherence: level 10 on day 22, level 50 on day 403. At 100%: day 18 and day 332. So the target band holds from 80 to 100% adherence (levels 10 and 50 in about 3 weeks and about 1 year).

Why a lower exponent: with the PRD curve a typical day buys 1/7 of a level at level 40; with 0.84 it is about 1/10 to 1/14. Early levels are still fast (level 2 needs 285 XP, below one day of play: the first day should give 1-2 level-ups), and a level at 40 takes about 14 days, not a quarter. For reference Habitica's curve is quadratic and much flatter.

Model assumptions (simulation): base budget 460 XP/day at 100% adherence (below), x(1 + streak bonus ramping to +15% by day 105) x(1 + stat bonus ramping to +12% by day 300), x adherence, plus a one-time Awakening bonus of 1,500 XP, a Boss Raid reward of 1,500 XP every 42 days, and Rank-Up Trial rewards of 2,000 XP on days 60, 150, 240 and 330.

### 3.2 Daily XP budget per activity (base, before multipliers)

| Activity | XP | Notes |
| --- | --- | --- |
| Readiness check-in | 15 | once per day |
| Meal logged (up to 3 main meals) | 15 each (45) | for logging, not for how much was eaten |
| Calorie target within +-10% and above safe minimum | 40 | no XP if below the R5 safe minimum |
| Protein target at 90% or more | 40 | |
| Water target | 25 | |
| **Daily subtotal, every day** | **165** | |
| Working set | 8 x effort factor | effort: RIR 0-1 = 1.0, RIR 2 = 0.9, RIR 3+ = 0.6, warm-up = 0 |
| Working sets per session (typical 16, factor 0.9) | ~115 | **0 XP** past the weekly per-muscle cap (R5) or when that muscle is under 30% recovery |
| Workout completed (80% or more of planned sets) | 150 | |
| Daily Quest cleared | 100 on training day | |
| PR (e1RM on tracked lift) | 75 each | max 3 per session; average ~0.4 per session, ~30 XP |
| Good rep in Form Check | 1 each, max 40 per session | optional, not in the budget |
| **Training day total (with the daily subtotal)** | **~560** | 115 + 150 + 100 + 30 + 165 |
| Rest-day quest (10-15 min mobility or step goal) | 60 | rest day total with daily subtotal: 225 |
| Cardio session | 40 + 2 per minute above 20 min | counts as the rest-day quest if on a rest day |
| Weekly plan cleared (a Dungeon floor) | 200 | per week |
| 7-day streak | 100 | per week of streak |
| Dungeon Boss Raid | 1,500 | every 6 weeks |
| Rank-Up Trial | 2,000 | one-time |
| Awakening (Test, first workout, first PR, first full day) | 1,500 | one-time total |

Weekly maths for a consistent user (4 workouts, daily logging): 4 x 560 + 3 x 225 = 2,240 + 675 = 2,915; plus 200 + 100 = 300; weekly total **3,215 XP**, which is **~459/day**.

Check: 3 weeks = 21 x 459 = 9,639 plus Awakening 1,500 = 11,139, versus level 10 at 9,711, so reached at about day 18-20 with a typical miss or two. Year: 365 x 459 x 0.9 x average multiplier 1.22 = ~184k, plus events (about 9 Boss Raids x 1,500 + 4 trials x 2,000 + Awakening = ~23k) = ~207k, versus level 50 at 203,246. The curve and budget agree.

Safety guard rails baked into the budget: one session per day counts for XP, set XP is zero past the cap or below 30% recovery, calories below safe minimum earn no XP, no XP for extreme deficits.

### 3.3 Stat point allocation

- Points: 3 per level-up (level 50 total = 147), plus 5 at each Rank-Up and 5 at Job Change.
- Stats stay five: STR (sets, PRs), AGI (cardio), VIT (readiness, recovery, streak), INT (nutrition logging and targets), PER (form check).
- Each allocated point gives **+0.5% XP in that stat's category**, linear to 30 points (+15%), then **+0.25% per point from 31 to 60 points (+22.5% max)**, hard cap at 60 points (Habitica uses a hyperbolic diminishing-returns function; this is a piecewise version that players can read). Behaviour-driven base stats, which show on the Status Window, do not themselves multiply XP; only allocated points do.
- Check: at level 50 with 147 points spread evenly (about 29 each) each category has about +14.5%; a specialist with 60 points in STR gets +22.5% on STR sources, which is about +9% on total daily XP. Max boost is bounded so no combination changes the level 50 date by more than about 6 weeks.
- Respec: free at each Rank-Up and at Job Change, otherwise 300 gold. Autonomy: players should be able to try builds.
- Safety: XP multipliers never raise the set cap, never apply to XP that is already zero by safety rules.

### 3.4 Loot drops

One roll per completed workout (max one a day), the drop is guaranteed at least Common so there is no empty reveal. Rarity table:

| Rarity | Base rate | What it gives (cosmetic or convenience only) |
| --- | --- | --- |
| Common (white) | 70% | 20-60 gold, a title fragment, a small cosmetic |
| Rare (blue) | 22.5% | Streak Freeze, Rest Day Pass, 120-250 gold, theme fragment |
| Epic (purple) | 6% | Instant Dungeon Key, panel skin, 400-800 gold |
| Legendary (gold/orange) | 1.5% | Animated theme, profile frame, shadow-soldier skin |

Pity (counters per tier, reset when that tier or higher drops, hidden counters shown on the loot screen):
- **Rare or better:** base 30% combined; soft pity from workout 4 (+15% per workout), hard at 6. Simulated mean wait 2.8 workouts, worst 6.
- **Epic or better:** base 7.5%; soft pity from workout 20 (+4% per workout), **hard at 30**. Simulated mean wait 11.3 workouts, 90th percentile 24, max 30.
- **Legendary:** base 1.5%; soft pity from workout 45 (+2% per workout), **hard at 70**. Simulated mean wait 36 workouts (about 9 weeks at 4 per week), median 45, 90th percentile 56, max 70. Without pity the mean is 69 but the 90th percentile is 162 and the worst of 2,000 runs was 673.
- Guaranteed drops independent of RNG: Boss Raid victory is **Epic or better**, Rank-Up Trial is a **Legendary**, a 100-day streak is a Rare.
- Smart drop: within a tier, items the Player does not own and items matching their class are weighted 2x; if the Player holds no Streak Freeze, Rare-tier drops are 50% Streak Freeze.
- Expected per year at 4 workouts a week (208 sessions): Common ~146, Rare ~47, Epic ~12, Legendary ~5-6 (including pity), plus guaranteed milestones.
- Ethics: odds and pity counters visible in-app, no purchasable rolls, no one-more-set bait, drops never affect training prescription.

### 3.5 Gold economy

Earn rates (base):

| Source | Gold |
| --- | --- |
| Daily Quest cleared | 40 |
| All daily targets hit (water, protein, calories, readiness) | 15 |
| Workout completed | 50 (4 per week = 29/day) |
| Weekly plan cleared | 150 (21/day) |
| PR | 25 each |
| Level up | 10 x new level |
| Boss Raid victory | 500 |
| Rank-Up Trial | 1,000 |
| Emergency Quest | 100 |
| Loot (Common) | 20-60 |

About 105 gold/day (735/week) from routine play, ~38k per year, plus ~13k from level-ups, ~10k from bosses/trials, so **~60k a year**.

Store prices:

| Item | Price | Rule |
| --- | --- | --- |
| Streak Freeze (Elixir of Life) | **250** (about 2.4 days of earning) | hold max 2, auto-used on a missed day |
| Rest Day Pass | **150** | declare before the day starts; counts as a cleared day, 50% of daily logging XP; 1 free per week, hold max 2 |
| Instant Dungeon Key | **400** | opens a bonus workout (arms/abs/conditioning) for 150 XP; max 1 per day, excluded when recovery is under 30% |
| Respec | 300 (free at Rank-Up/Job Change) | |
| UI theme | **1,500 / 3,000 / 6,000** (Common-skin / Rare / Epic) | cosmetic only |
| Profile frame | 2,500 | cosmetic |
| Panel skin (rank-coloured) | 4,000 | cosmetic |
| Legendary cosmetics | not sold, drop or milestone only | so they stay special |

Rationale: functional items are cheap enough that nobody is blocked from protecting a streak (250 is ~2 days of play); the large sink is cosmetics (about 40 items x ~3,000 = 120k, two years of earning), which is the long-term goal rather than something users need. No gold is ever removed by failure; gold only goes out when the Player buys.

### 3.6 Streak rules

- **What counts:** the streak increments on a day when the Daily Quest core is cleared (the planned session, or the rest-day quest). Calorie, protein, water and readiness are separate Daily Quest sub-items that give XP but do not gate the streak (Duolingo: a one-action bar beat a stricter goal).
- **Planned rest:** every plan day marked rest is automatically a cleared streak day when the readiness check-in is done or when a Rest Day Pass is declared. One Rest Day Pass is granted free each week.
- **Streak Freeze:** up to 2 held; consumed automatically on a missed day; the System says "[Elixir of Life consumed. Streak preserved.]". Duolingo's evidence for two held freezes is +0.38% DAUs without more days off.
- **Missed day with no Freeze:** next day opens the **Penalty Zone**: one short penalty quest (10 minutes of conditioning scaled by level; 15 minutes at most). Clearing it **repairs** the streak to its prior value (the missed day is bridged, not counted as +1). No XP is removed.
- **Penalty not cleared:** the streak drops to 50% (rounded down), not to zero. Lally found a single missed day has no material effect on habit formation, so zeroing a 60-day streak after one miss has no basis; "Best streak" and "Total training days" are never reset and are shown beside the live streak.
- **Waived entirely:** low readiness, an injury flag or illness mode (safety rule in PRD section 3): no penalty quest, streak preserved.
- **Comeback bonus:** the first 3 cleared days after a streak drop earn +25% XP (regression, "you return stronger").
- **Milestones:** titles and animations at 7, 21, 66 (Lally median), 100 and 365 days; a free Rare drop at 7 and 100.
- **XP effect:** +1% XP for every 7 streak days, capped at +15% (105 days), applied to XP only, never gold or loot odds (so a broken streak does not change the drop table).
- **Notifications:** one "streak at risk" push per day, at 20:00 local, only if the Daily Quest is not cleared and no Freeze or Pass will cover it. No guilt copy; copy states the cover available.
- **Edge cases to unit-test:** midnight rollover with timezone change, freeze consumed at 00:00 local not UTC, Penalty quest cleared exactly at midnight, injury flag set after a miss (retroactive waiver for the previous day only).

### 3.7 Rank-up thresholds

Rank reflects real fitness: a level threshold *and* a Rank-Up Trial (re-test of Power Level lifts). Levels keep accumulating even before the Trial, so there is no stalled progress bar; the Trial is just a gate on the badge. Retake after 7 days free of charge.

| Rank | Min level | Typical day (90%) | Power Level gate (placeholder, calibrate with R5) | Trial |
| --- | --- | --- | --- | --- |
| E | 1 | day 0 | none | none (start) |
| D | 10 | day 20 | 15 | Awakening Test repeated: push-ups, squats, plank beat starting values |
| C | 20 | day 72 | 30 | Class-specific benchmark (e.g. bodyweight-ratio on one lift) |
| B | 35 | day 195 | 45 | Two-lift benchmark and a conditioning test |
| A | 50 | day 363 | 60 | e1RM standards on key lifts by sex and bodyweight |
| S | 70 | day 672 | 78 | Full test week plus consistency (e.g. 80% of sessions for 12 weeks) |
| National | 100 | day 1,298 | 90 | Boss Raid at S-tier plus a year-long consistency record |

Job Change stays at level 30 (day ~150), A rank at the one-year mark, S as a multi-year goal. The Shadow Monarch hidden class unlocks at S.

---

## Findings

1. **The PRD XP curve fails its own targets.** `round(100 x L^1.5)` needs 529 XP/day for level 10 in 3 weeks (reasonable) and 1,889 XP/day for level 50 in a year, 3.6x higher. A flatter curve, `round(285 x L^0.84)`, fits both targets (day 20 and day 363 at 90% adherence) from a single fixed daily XP budget of about 460.
2. **Punishment and external pressure do not help adherence.** Teixeira et al. 2012: controlled regulation is never positively associated with exercise; external regulation is negative in 43% of multivariate samples; introjected (guilt) motivation is unstable. Habitica players avoid damage by un-assigning dailies (observed behaviour, not a trial).
3. **A missed day is not a real risk to a habit.** Lally 2010: one missed opportunity had no material effect; the median plateau is 66 days (18-254) and exercise takes ~1.5x longer than eating/drinking behaviours.
4. **Duolingo's measurable wins came from lowering the bar and adding slack, not stiffer penalties.** One lesson extends a streak: Day-14 retention +3.3%, streak users +10.5%; two Streak Freezes: DAU +0.38% with no more days off; Weekend Amulet: +4% return, -5% lost streaks; Streak Wager: Day-7 retention +14%.
5. **Variable ratio is powerful and resistant to extinction**, so it is used for loot only, with a once-per-day cap, visible odds, pity and no money. XP stays fixed-ratio and predictable.
6. **Souls-style difficulty is only acceptable when failure is recoverable and announced.** The bloodstain is the model for our Penalty quest, which repairs rather than punishes.
7. **Pure random drops have heavy tails.** A flat 1.5% roll has a 90th percentile of 162 workouts and a max of 673; pity (soft from 45, hard at 70) brings the 90th percentile to 56 and the max to 70.
8. **Collections and crafted gear are deterministic goals** (Pokedex, Monster Hunter), the only rewards where the effort of the Player alone decides the outcome.
9. **Limits of this research.** Fandom wikis (Habitica death mechanics, The Gamer, ORV coins, Diablo) were blocked; ORV coin mechanics, Leveling with the Gods floors/sponsors, Persona stat names and the FFXIV job swap are from background knowledge and need re-verification. No controlled trial of "punishment in gamified fitness apps" was found, and loss aversion has partial replication disputes at small stakes.

## What we take

- XP curve `round(285 x L^0.84)` with a daily XP budget of ~460 and the activity table in 3.2; log it in `docs/game-design.md` and replace the PRD's 1.5 exponent.
- Stat points: 3 per level, +0.5% per point to 30, +0.25% to 60, then capped; free respec at Rank-Up and Job Change.
- Streak: one-action bar (Daily Quest core), 2 held Freezes, a free weekly Rest Day Pass, Penalty quest that repairs, 50% fall instead of reset to zero, comeback bonus, milestone titles at 7/21/66/100/365, XP bonus +1% per 7 days (cap 15%).
- Loot: 4-tier table 70 / 22.5 / 6 / 1.5, pity at Rare 6, Epic 30, Legendary 70, guaranteed milestone drops, smart drop weighting, odds and counters visible.
- Gold: ~105/day earnings, Freeze 250, Rest Pass 150, Key 400, themes 1,500-6,000, cosmetic-heavy sinks.
- Rank thresholds: D L10, C L20, B L35, A L50, S L70, National L100, each with a Power Level gate and a Rank-Up Trial; retake after 7 days free.
- Fairness rules from Souls: telegraphed Boss Raid, recoverable loss, safe place (Status Window), optional help.
- Persona-style "Today" slots; Monster Hunter crafting recipes with visible progress; Pokemon-style silhouettes for shadows and titles; FFV-style class mastery levels separate from character level.
- Habitica's `diminishingReturns` idea for bonus caps, and the `streak/100 + 1` bonus idea (capped).

## What we do better

- **Same budget for early and late game.** Habitica and the PRD curve both assume a progression that outruns the user's real available XP; we fit the curve to a simulated budget with a stated adherence band (80-100%) so the targets hold.
- **Recoverable instead of destructive failure.** Habitica takes HP, levels, gold and gear; Duolingo zeros the streak; we repair the streak with a short quest, drop to 50% if the player does not, and keep Best streak and Total days forever.
- **Rest is rewarded and rest never costs a streak.** Weekly free pass, rest-day quest counts, low readiness or injury waives everything. Habitica and Duolingo treat missing as failing.
- **Evidence-tied.** Every motivational choice is tied to an opened source (Teixeira 2012, Lally 2010, Duolingo experiments) with its caveats stated, and the loot odds are simulated, not guessed.
- **Ethical variable rewards.** Odds and counters shown, no money, one roll per healthy session, cosmetic or convenience only, never next to extra volume.
- **Safety-aware economy.** XP is zero beyond per-muscle caps or under 30% recovery, below-minimum calories earn nothing, and Instant Dungeon Keys are blocked at low recovery; none of the reference games have a physical-safety layer.

## Sources

Opened and read in this session:

- Duolingo, How Duolingo streak builds habit: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Duolingo, Improving the streak: https://blog.duolingo.com/improving-the-streak
- Duolingo, How streaks keep Duolingo learners committed to their language goals (Streak Wager, Weekend Amulet): https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals
- Lenny's Newsletter, Behind the product: Duolingo streaks (show notes): https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks
- BPS Research Digest, How to form a habit (Lally et al. 2010 summary): https://bps.org.uk/research-digest/how-form-habit
- Wikipedia, Habit (psychology): https://en.wikipedia.org/wiki/Habit_(psychology)
- Teixeira et al. 2012, Exercise, physical activity, and self-determination theory (PMC3441783): https://pmc.ncbi.nlm.nih.gov/articles/PMC3441783/
- Wikipedia, Self-determination theory: https://en.wikipedia.org/wiki/Self-determination_theory
- Wikipedia, Overjustification effect: https://en.wikipedia.org/wiki/Overjustification_effect
- Wikipedia, Reinforcement: https://en.wikipedia.org/wiki/Reinforcement
- Wikipedia, Loss aversion: https://en.wikipedia.org/wiki/Loss_aversion
- Wikipedia, Gamification: https://en.wikipedia.org/wiki/Gamification
- Wikipedia, Gacha game: https://en.wikipedia.org/wiki/Gacha_game
- Hopson, Behavioral Game Design (Game Developer): https://www.gamedeveloper.com/design/behavioral-game-design
- Habitica source, statHelpers.js: https://github.com/HabitRPG/habitica/blob/develop/website/common/script/statHelpers.js
- Habitica source, scoreTask.js: https://github.com/HabitRPG/habitica/blob/develop/website/common/script/ops/scoreTask.js
- Wikipedia, Habitica: https://en.wikipedia.org/wiki/Habitica
- Wikipedia, Diablo II: https://en.wikipedia.org/wiki/Diablo_II
- Wikipedia, Diablo III: https://en.wikipedia.org/wiki/Diablo_III
- Wikipedia, Diablo IV: https://en.wikipedia.org/wiki/Diablo_IV
- Shacknews, Diablo 3 patch 2.0.1 Loot 2.0: https://www.shacknews.com/article/83266/diablo-3-patch-201-deploys-with-loot-20
- Wikipedia, Dark Souls: https://en.wikipedia.org/wiki/Dark_Souls
- Wikipedia, Elden Ring: https://en.wikipedia.org/wiki/Elden_Ring
- Wikipedia, Final Fantasy V: https://en.wikipedia.org/wiki/Final_Fantasy_V
- Wikipedia, Persona 5: https://en.wikipedia.org/wiki/Persona_5
- Wikipedia, Monster Hunter: https://en.wikipedia.org/wiki/Monster_Hunter
- Wikipedia, Pokedex: https://en.wikipedia.org/wiki/Pok%C3%A9dex
- Wikipedia, The Gamer: https://en.wikipedia.org/wiki/The_Gamer
- Wikipedia, Omniscient Reader's Viewpoint: https://en.wikipedia.org/wiki/Omniscient_Reader%27s_Viewpoint
- Wikipedia, Tower of God: https://en.wikipedia.org/wiki/Tower_of_God
- Comics Beat, Yen Press licenses Level Up with the Gods: https://kcomicsbeat.com/2025/02/07/yen-press-licenses-level-up-with-the-gods/

Seen only as search snippets, not opened (used only where flagged "search snippet" or "unverified"): Habitica Death page (habitica.fandom.com/wiki/Death, HTTP 402), Blizzard Diablo Immortal "unlucky" support page (us.support.blizzard.com/en/article/312657, login redirect), Blizzard forum thread on bad-luck protection for Ubers, Sensor Tower and Substack Duolingo growth write-ups, the Wiley page for Lally et al. 2010 (HTTP 402; figures were taken from the BPS digest and Wikipedia instead).

Simulation scripts for the XP and pity numbers were run in the session scratchpad and are reproducible from the formulas stated in sections 3.1 and 3.4; port them into the Vitest suite for the XP and level engine when it is built.
