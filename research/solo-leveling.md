# R1 — Solo Leveling deep dive: the System, in full

Track R1 of `PRD.md` · written 2026-10-23 · feeds `design/DESIGN.md` (F1), `docs/game-design.md` (Section 3), `system-messages.json`, the quest engine and the F0 asset work.

---

## 0. How to read this note (source quality)

I read primary-ish pages, not snippets. The Solo Leveling fandom wiki blocks plain page fetches (HTTP 402/403), but its public MediaWiki API (`/api.php?action=parse`) returns the full page text, so every wiki page below was read in full that way. Fan UI repos were cloned and their CSS read. Where I could not confirm a thing I say so.

Confidence tags used in this note:

- **[V]** verified in a page I opened (wiki page, article, or repo file), source in Sources.
- **[V-fan]** verified as what a fan project or fan blog says (not canon, not production).
- **[U]** unverified or recalled from general knowledge of the series; treat as a hint, confirm before it becomes a hard rule.
- **[D]** our design proposal (not a claim about the show).

Hard limits found:

1. **Exact System text is thin online.** The wiki summarises windows in prose; the manhwa/anime show the windows only as images; the light novel text is copyrighted and I did not read pirated copies. The strings quoted in Section 3 are the ones I could actually confirm. Everything else must be authored by us in the System voice (that is what `system-messages.json` is for).
2. **Translation variants are everywhere.** The same quest, stat or item has different names in the novel (NV), webtoon (WB) and anime (AN). Examples are tabled below. We should pick one canonical name per concept and keep it.
3. **No production interview describes how the anime animated the System windows.** I searched English and Japanese and read the director interview (animatetimes). Motion in Section 12.4 is therefore split into "what is verifiable" and "our recommendation".
4. **I did not download any show/game images.** The reference catalogue (`design/references/README.md`) is links plus text-derived descriptions only. Pixel-level notes (exact hex of the anime windows, exact font) are marked as "confirm by eye".

### Name variants to settle once

| Concept | Variants seen | Source |
| --- | --- | --- |
| The daily quest | "The Preparation To Become Powerful" (wiki, kovofitness), "Strength Training Has Arrived" (anime ep 3, per wiki ep page and Gamerant), "Becoming Stronger" (webtoon ch 11 summary), "Preparation to Become Strong" (PRD brief), "Daily Quest" (novel chapter title) | wiki Daily Quest / Episode 3 / Chapter 11 pages [V] |
| Penalty quest | "Penalty Zone" (location), "Survival" (quest name) | wiki Penalty Zone, Survival [V] |
| Stats | Strength, Agility, Stamina or Vitality, Intelligence, Sense or Perception | wiki System page cites ch 14: Stamina, Sense; wiki Items page shows Perception and Vitality on gear [V] |
| Wolf title | "Wolf Slayer" (webtoon), "Wolf Assassin" (anime) | wiki Episode 4 [V] |
| Escape item | Hearthstone (WB), Teleportation Stone (AN), Instant Return Stone (NV) | wiki Sung Jinwoo/Items [V] |
| Instant dungeon | "Instance Dungeon" (anime/wiki), "Instant Dungeon" (PRD), "Class Advancement Quest's Dungeon" (file name) | wiki [V] |
| Shadow grade 5 and 6 | Commander/General and Marshal/Commander swap between novel and webtoon | wiki Shadows [V] |

---

## 1. What the System is

- A magical program that chose Sung Jinwoo as its **Player** after the Double Dungeon (Cartenon Temple) incident, where he volunteered to stay behind so the rest of the party could escape. [V wiki System]
- Built by **Kandiaru** (the Architect) so that **Ashborn**, the Shadow Monarch, could grow a human vessel strong enough to hold his power. It was deliberately given a **video-game interface so Jinwoo could understand it without confusion**. [V wiki System]
- Only the Player can see it: "nobody else could see it" and the windows are invisible to other characters (hospital scene, ep 3). [V]
- It protects its Player: it activates passive skills when needed, issues emergency quests when someone tries to kill him, and **warns of murderous intent** nearby. [V wiki System]
- Items in the Player's Inventory cannot be forcibly taken, and some are non-transferable (Jinwoo could not hand potions to other hunters in the Jeju raid). [V wiki System trivia]
- Messages arrive like **mail**. In the hospital scene Jinwoo asks his sister how to deal with unread notifications and is told to check his inbox; the webtoon summary says he "learns to read mail from the System". The System log therefore has canon as an **inbox**. [V wiki Episode 3, Chapter 11]
- Narrative arc of the System: Courage of the Weak (accept) → Daily Quest + Penalty Zone → Instant Dungeons and Store → Job Change (Necromancer → Shadow Monarch) → Demon Castle → return to the Double Dungeon at level 100 → Ashborn locks Kandiaru out and gives Jinwoo the Black Heart → after Jinwoo becomes the true Shadow Monarch the System **deletes itself**. Years later Jinwoo modifies it ("Tutorial") and passes it to his son Suho. [V wiki System, Monarchs]

### The accept prompt (origin scene)

- Jinwoo is about to die in the Double Dungeon. A floating screen says he fulfilled the requirements of the secret quest **"Courage of the Weak"** and warns that **his heart will stop (0.02 seconds in the webtoon) unless he accepts**. He accepts and is greeted with a welcome message. [V wiki Chapter 10 summary]
- Quest record: Type Secret Quest; Reward: Player Status, "The Great Spellcaster Kandiaru's Blessing", Temporary Effect "Will To Rehabilitate", Permanent Effect "Longevity"; Penalty: Death. [V wiki Courage of the Weak]
- Wording from the PRD brief (owner-supplied, matches the manhwa/anime shape): `[You have acquired the qualifications to be a Player. Will you accept?]`. A fan README for another app repeats the same sentence ("You have acquired the qualifications to be a Player.") but that is a fan quote, so treat the exact punctuation as **[U]**.
- The official Yen Press page for the English light novel uses `[Congratulations on becoming a Player.]` in its blurb, and the wiki System page opens with the quote "Congratulations on becoming a Player." attributed to ep 3 of the anime. [V]
- Anime direction note: the wiki ep 2 page says the System voice is **narrated in Jinwoo's conscious** and that a "freeze time effect" was removed when the System was introduced. [V wiki Episode 2]

**Takeaway for Awakening:** a binary Accept/Decline prompt with a lethal-sounding stake, then a calm "Congratulations on becoming a Player." is the exact emotional beat we want for onboarding (we use a harmless stake: "Decline" simply exits onboarding).

---

## 2. The Status Window

### 2.1 What canon gives us (field by field)

The wiki has no "Status Window" page and no transcription of the window, so the field list is assembled from what the pages say the Player sees and uses.

| Field | What I can confirm | Tag |
| --- | --- | --- |
| Name ("Player") | The System addresses him as "Player" in message text (Kill the Enemies instruction: "intend to kill the Player") | V |
| Level | Level is the headline number. Level 18 is mentioned in ep 5, Job Change Quest is received at level 40, he "reached level 51" in the Job Change Arc, he hits 100 before the Double Dungeon return, and ep 7 flashes "level 146" as foreshadowing | V |
| Job | Starts empty ("Job: None" is how the manhwa shows it **[U]**); after the Job Change quest it becomes Necromancer, upgraded to **Shadow Monarch** (the "hidden class") | V |
| Title | Titles are equipped and **switchable in combat for a buff**: "switching his Title to Wolf Assassin for a buff" (wiki Chapter 60 text). "Wolf Slayer" is activated as he fights an Ice Bear (wiki Chapter 50) | V |
| HP | Recovered by Healing Potions; level up gives "Status Recovery" and heals wounds | V |
| MP | Mana Potion "Restores 500 Mana upon consumption" | V |
| Fatigue | A separate gauge out of 100. In ep 12 Jinwoo's fatigue "skyrocketed past 90 for the first time"; Mana potions in the anime restore it; "Mythical Restoration Potion: A Potion that can restore Fatigue. Restores some Fatigue upon consumption." (10,000 gold). Fatigue also appears in the webtoon during the Job Change fight ("fatigue peaking") | V |
| Stats | STR, AGI, VIT/Stamina, INT, SENSE/Perception (descriptions in 2.3) | V |
| Available (unspent) points | The Player gets "stat points" / "ability points" to allocate: 3 from clearing a daily quest, +10 from the Kill the Enemies emergency quest, and he allocates at level-ups (ep 3: "With his new ability points, he devotes them all to Strength"; ep 5: "allocates his stat points, focusing on strength, agility, and perception") | V |
| Skills | Active, Passive, Unique; "skills can level-up along its Player" | V |
| Inventory, Store, Quest log, Mail | Separate screens reachable from the System (Store and Inventory are "within the System") | V |

**HP and MP numeric starting values and the exact on-screen labels ("Available Ability Points" vs "Remaining Points") could not be verified.** A fan Minecraft mod describes its panel as "level, title, job, fatigue, HP, MP, attributes, skill points" plus Shop, Quests, Rewards, Party, Crafting, Skills menus, which matches the above **[V-fan]**.

### 2.2 Layout we should use (our design, anchored to the fields above) [D]

```
┌─[ STATUS ]──────────────────────────────┐  corner brackets, 1px blue border, header tag
│  NAME  Simar            JOB   Fighter    │
│  LV    18               TITLE [Wolf Slayer ▾]   <- tap to equip/switch
│  RANK  [D]   POWER LEVEL 41   XP ▓▓▓▓░░  │
│  ─────────────────────────────────────── │
│  HP  ▓▓▓▓▓▓▓▓▓▓  100/100   (recovery %)  │
│  MP  ▓▓▓▓▓▓░░░░   60/100   (readiness)   │
│  FATIGUE ▓▓░░░░░░░░ 22%    (load/soreness)│
│  ─────────────────────────────────────── │
│  STR 24 [+]   AGI 17 [+]   VIT 20 [+]     │
│  INT 15 [+]   SENSE 12 [+]                │
│  AVAILABLE POINTS 3                       │
│  ─────────────────────────────────────── │
│  Today's quest 2/5 · Streak 9 · Gold 340  │
└──────────────────────────────────────────┘
```

### 2.3 Stat definitions (verbatim from the wiki System page, citing webtoon ch 14) [V]

- **Strength:** "Increases strength, speed, and attack power."
- **Agility:** "Increases dynamic vision, physical reaction speed, and evasion rate."
- **Stamina:** "Increases maximum HP and recovery speed."
- **Intelligence:** "Increases maximum MP and MP recovery speed."
- **Sense:** "Sharpens the five senses and increases danger perception ability."

Rules seen in canon:

- "Each time Jinwoo leveled up, all of his stats increased by 1. He also gets 3 stat points to distribute after doing the daily quest." (wiki System page) [V]. The "5 points per level" figure that circulates in fan discussion is **[U]**.
- Level-up also triggers "Status Recovery" (full heal). In ep 4 "his stats increase and his wounds are healed with each new level". [V]
- Gear and titles can also add stats (Gatekeeper's Necklace "Agility +20, Sense +20"; Red Knight's Helmet "Strength +20, Stamina +20"; Demon Monarch set "All Stats +5 (2 Items)", "All Stats +10 (3 Items)"). [V wiki Sung Jinwoo/Items]
- Crafting the Elixir of Life "will depend on his Intelligence stat" (ep 21). INT was auto-allocated after the job change (aniviewer, low reliability). [V / V-fan]
- Strength gates gear: "(If your strength is below 80, your movements will be slowed.)" on High Knight armour. [V]

**Mapping note:** the PRD uses STR/AGI/VIT/INT/PER. The wiki uses both Perception and Sense. Keep **SENSE (PER)** on screen: the abbreviation PER is short, the word SENSE is the one the System uses.

---

## 3. How System messages are worded and timed

### 3.1 Confirmed strings (verbatim where I could confirm)

| Where | Text | Tag |
| --- | --- | --- |
| Becoming a Player (novel blurb, ep 3 quote) | `[Congratulations on becoming a Player.]` | V |
| Courage of the Weak prompt (owner brief) | `[You have acquired the qualifications to be a Player. Will you accept?]` | U (exact punctuation) |
| Penalty Zone entry (wiki Penalty Zone infobox, which transcribes the quest text) | "Penalty from failing Daily Quest. 'Player' must survive for 4 hours; Desert with no wind, no sun, moon or even stars. Plagued with 'Poison-fanged Giant Sand Centipedes.' The Zone's difficulty is readjusted if the 'Player' attempts to hunt in Penalty Zone." | V |
| Survival quest (wiki Survival) | Instructions: "Survive for the allotted amount of time." Time limit 4 Hours. Reward +3 Stat Points, Random Loot Box | V |
| Emergency quest (wiki Kill the Enemies) | "There are enemies nearby that intend to kill the Player. Destroy all your foes to ensure your safety. If you fail to follow these orders, you will be given a penalty." | V |
| Job Change Quest (wiki) | "The Job Change Quest will now begin. You will accumulate more points the longer you stay alive. These points are needed to advance to a higher-ranking class. Good luck." | V |
| Skill window (wiki Shadow Extraction, a transcription) | `[Skill: Shadow Extraction]` `[Shadow Power. No mana required]` `[Extracts mana from a lifeless body and turns it into a Shadow Soldier. The failure rate is proportional to the target's stats and the time elapsed since their death.]` `[Level 2 effect 'Shape Transformation': You can freely change the appearance and shape of Shadow Soldiers.]` | V |
| Passive skill trigger (wiki Black Heart) | `[Passive Skill: 'Black Heart' has activated.]` | V |
| Dungeon cleared (Carl Jamilkowski's AR analysis of the anime) | "As the boss has been defeated, the dungeon will now revert to its original state." | V (article quotes the on-screen line) |
| Shadow Extraction command | The command word the Player chose: "Arise." (ep 12 is titled "Arise", the wiki quote box is `“Arise.” —Sung Jinwoo`) | V |
| Item descriptions (wiki Sung Jinwoo/Items) | "A Key that allows you to create an Instant Dungeon. You may use this in the 3rd Entrance of Hapjung Station." · "You can keep it in your Inventory or sell it in the Store." · "You may keep this item in your inventory." · "A Skill can be obtained by breaking the Rune." · "A Quest-exclusive Item. If you break the Hearthstone, you will instantly leave the Dungeon. If the Job Quest ends, the Dungeon is automatically destroyed. Cannot be stored." · "A dagger designed to fight against armored enemies. Deals an extra +25% damage against armored opponents." | V |
| Selection prompts (aniviewer, low reliability) | "Accept the Class? (Y/N)", "Enter the Dungeon?", "The Player is in danger." | V-fan |
| Job change dungeon rules (wiki ch 38 summary, paraphrased) | A notification states that in this area potions, Full Recovery and Store access are disabled, stats are not recovered on level up, and he cannot leave until the quest is finished | V |
| Job change result (wiki ep 12 summary, paraphrased) | Notification says he lasted four and a half hours; "necromancer" is suggested; the System warns that it is a hidden class and asks him to confirm his refusal | V |
| Survival end (Gamerant) | After the 4 hours "he will be teleported back to the real world" | V |

### 3.2 The grammar of a System message (derived from the strings above)

1. **Square brackets** around each message: `[ ... ]`. One idea per bracket. Several brackets can stack in one window (the Shadow Extraction skill window is four lines).
2. **Neutral, formal, present tense**, no contractions, no exclamation marks, no first person. The System talks **about** the Player in the third person in system text ("the Player"), and **to** the Player ("You have ...", "You will ...") in notifications and prompts.
3. **State, condition, consequence.** Quests list Goal, Time limit, Reward, Penalty (the wiki infobox fields for every quest are exactly Goal / Time limit / Reward / Penalty). Warnings state the penalty in the same plain tone: "If you fail to follow these orders, you will be given a penalty."
4. **Rules are announced at the point of entry** (job-change dungeon: "potions, Full Recovery, Store disabled"). The System tells you the rules before they bite, which makes it feel fair, not arbitrary.
5. **Names in title case with quotes or brackets**: Skill names, quest names, titles ("Courage of the Weak", "Wolf Slayer").
6. **Politeness at big moments only**: "Congratulations on becoming a Player.", "Good luck."

### 3.3 Timing and delivery

- **Unprompted and ambient:** windows pop up in front of the Player at any time, including while he sleeps (ep 3: jolted awake into the Penalty Zone). [V]
- **Daily Quest time limit: 24 hours.** On expiry the Player is **automatically teleported** to the Penalty Zone (no further warning). Ep 12: "as the Daily Quest he forgot to complete expires ... Jinwoo finds himself transported to the Penalty Zone". [V]
- **Emergency quest: seconds.** "Heart will stop beating in 0.02 seconds" (ch 10 summary) is the extreme; the Kill the Enemies quest has no timer but "death" as the penalty. [V]
- **Penalty quest: 4 hours.** [V]
- **Job Change Quest:** open-ended, scored by survival time ("lasted four and a half hours"). [V]
- **Dungeon end:** after a boss dies "the dungeon will now revert to its original state" and the Dungeon stays open "for about an hour before closing on its own" (wiki Dungeons). [V]
- **Windows float, they are not a HUD.** Per Carl Jamilkowski's analysis the windows "don't move with his head, so it's not a heads-up display" and are "loosely positioned relative to his body"; he can touch them, the display pixelates around a finger, and they respond to open-ended voice commands. [V]
- **The System never lets the Player delay what matters, but lets him choose when to pay.** In ch 38 Jinwoo realises he has not done his Daily Quest and "chooses to delay it until later" before entering the Job Change dungeon; the penalty arrived mid-dungeon (ep 12). [V]

### 3.4 Window colour semantics seen so far

- Standard windows are blue and translucent; **emergency quests are red pop-ups with an alert sound**; level-up text glows with a chime (nyaotaro fan blog, **[V-fan]**, corroborated by the Alert.png file name on the wiki's episode galleries). The Jamilkowski article also mentions red highlighting effects over people (a red threat overlay).
- Monster name tags are colour-coded by relative strength: **white = weaker, orange = similar, red = stronger than the Player** (ep 4 summary). Red when first met for the Lycans in the anime, white in the manhwa. [V]
- Loot rarity uses **rank letters E to S**, not Common/Rare/Epic: "Rarity: C-Rank", "Rarity: B", "Rarity: S", junk items have "Rarity: None" and a price in gold. [V wiki Items]

---

## 4. Quests

### 4.1 Types the System assigns

The wiki Quests page: "The System assigns daily quests, main quests, and urgent quests." Observed set: [V]

| Type | Example | Notes |
| --- | --- | --- |
| Secret / Hidden | Courage of the Weak (ch 10). Doing **double the daily requirements** also triggered a secret quest whose reward was a loot box containing a Demon Castle key (ep 7) | Hidden quests are tied to unusual behaviour |
| Daily | The Preparation To Become Powerful | 24 h clock, penalty = Penalty Zone |
| Penalty | Survival | 4 h |
| Emergency / Urgent | Kill the Enemies (triggers when someone attacks with intent to kill) | Reward Status Recovery, +10 Stat Points, Skill: Bloodlust; penalty Death |
| Job | Job Change Quest | at level 40 per wiki; rewards: Job Necromancer, Job The Monarch Of Shadows, Title Conqueror Of Adversity (a.k.a. One Who Overcame Adversity), Skill Shadow Extraction, Skill Save Shadow, Bonus Stats |
| Main / Long | "Collect Demon Souls!" (Demon Castle: kill 10,000 within the tower) | Ep 15: "the system assigns him a quest to kill 10,000 magic beasts" |
| Selection | Accept / Decline prompts (class, dungeon entry) | |

### 4.2 The Daily Quest: "The Preparation To Become Powerful" [V wiki, kovofitness]

| Field | Value |
| --- | --- |
| Goal | 100 Push-Ups, 100 Sit-Ups, 100 Squats, 10 Kilometer Run |
| Time limit | 24 hours |
| Reward | Status Recovery, +3 Stat Points, Random Loot Box |
| Penalty | Penalty Zone |
| Appears | Novel ch 10, Webtoon ch 11, Anime ep 3 |

- It is **not frozen**: "The System scales it as Jin-Woo levels" (kovofitness); this is a fan-site claim with no figures, so scaling curves are ours to design **[V-fan]**.
- Exercises can be done anywhere, even in a freezing Red Gate (ch 50: he trains with push-ups and sit-ups next to a campfire). The quest keeps running inside dungeons. [V]
- In the anime the quest title card is "Strength training has arrived" and the window is tracked live ("tracked meticulously by the system", ep 3 summary). Fan app Arise Workout renders it as a 0/4 counter with "QUEST CLEAR" and "SYSTEM LEVEL UP!" banners **[V-fan]**.
- Doing **more than required** pays off in hidden quests (ep 7), which is the canonical reason to include a "double quest" hidden unlock.
- He completed it while exercising "in the following days" and "checks his progress" on the quest window ("discovers that it's already completed") (ep 7). [V]

### 4.3 The Penalty Zone [V wiki Penalty Zone, Survival, ep 3, ep 12]

- Trigger: Daily Quest not complete within 24 h. Immediate teleport.
- Place: a vast desert, "no wind, no sun, moon, or stars", sky "like black ink spilled across a canvas", yet visibility is fine "despite a lack of light source". In the anime (ep 12) it is shown with a blazing sun and red clouds, so the look is **adaptable**. [V]
- Enemies: **Poison-fanged Giant Sand/Desert Centipedes**. Ep 12 has six of them at once at a higher level.
- Duration: **4 hours**, the quest is "Survive". On completion he is returned (the hospital nurses found him exhausted at the start of ep 3).
- **Difficulty is readjusted if the Player attempts to hunt in the Penalty Zone** (anti-exploit). [V]
- Players can use the Store and level up inside it (ep 12: bought Mana potions, levelled up, redeemed a rune skill, bought Knight Killer). Fan analysis says Jinwoo later "failed quests on purpose to farm levels" (aniviewer, **V-fan**), which is the exploit our version must not allow.
- Rewards listed for Survival: +3 Stat Points and Random Loot Box. [V]
- The wiki lists the death penalty for Survival as "(presumably)". Fear is the engine: the first Penalty Zone scene is the first moment the System feels dangerous.

**Design read:** the penalty is the *System proving it is serious*, not the System being cruel. The warning is polite, the stakes are physical, the duration is finite and printed. We copy that structure with a safe version (mapping table, rows 22 to 24).

### 4.4 Job Change Quest [V wiki Job Change Quest, Job Change Quest Dungeon, Job Change Arc, ep 11-12, ch 38-45]

- Trigger: notification at **level 40** (wiki). Jinwoo summons the instance dungeon in a secluded forest: "a massive purple void gate, crackling with lightning".
- Goal: **"Last as long as possible"**; points accumulate with survival time.
- Dungeon rules (announced on entry): cannot leave until cleared (except via Hearthstone or when a Penalty Quest activates), **Store disabled, potions disabled, no Status Healing on level-up**.
- Setting: a medieval-castle throne room with Knights, Assassins, Magicians, Archers, boss **Blood-Red Commander Igris** guarding an empty throne.
- Mid-quest twist: the missed Daily Quest expires and he is thrown into the Penalty Zone, then returned to the dungeon where the knights have "increased tenfold". He discovers Knights are summoned monsters (no XP) and the Mages are the real targets.
- Result screen: "lasted four and a half hours"; the System recommends **Necromancer** (a hidden class), asks to confirm his refusal, then upgrades it to **Shadow Monarch** because he lasted so long. Bonus stats and the title **One Who Overcame Adversity** are granted. First shadow: Igris. [V]
- Dungeon is destroyed when the job quest ends; "Teleportation Stone: Quest-exclusive item".

---

## 5. Skills, titles, runes

### 5.1 Skills [V wiki Skills]

"Skills are special abilities that Hunters, monsters and other beings can use in battle ... Using a skill requires the consumption of Mana ... Active ... Passive ... Unique." Unique to the System: **skills level up along with their Player and can evolve**. Level-2 examples: Shadow Extraction → Shape Transformation, Shadow Preservation → shared senses.

Examples (wiki Sung Jinwoo infobox): Will To Recover, Longevity, Immunity, Detoxification, Tenacity, Advanced Dagger Techniques, Stealth, Bloodlust, Quicksilver, Mutilation, Dagger Rush, Ruler's Authority, Dragon's Fear; job skills Shadow Extraction, Shadow Preservation, Shadow Exchange, Monarch's Domain. Skills are also gained by **breaking Runes** from loot ("Rune: Stealth", "Rune: Dominator's Touch/Ruler's Hand": "A Skill can be obtained by breaking the Rune.").

Detoxification in practice: while drinking beer he is "notified by the System that he is being detoxified" (ep 7). Passive skills speak up in notifications. Bloodlust "decreasing their stats by 50%".

### 5.2 Titles [V unless noted]

- **Wolf Slayer** (webtoon) / **Wolf Assassin** (anime): earned in the Hapjeong Subway dungeon after killing the Steel-Fanged Lycans. Activated as a buff: against beasts +40% damage (aniviewer, V-fan). Anime switches it by name before hitting an Ice Bear.
- **One Who Overcame Adversity** / "The one who overcame adversity" / Conqueror Of Adversity: from clearing the Job Change Quest Dungeon. aniviewer says it boosts stats at low HP (V-fan).
- **Demon Hunter**: earned in the Demon Castle Arc (wiki Chapter 60/Return to Demon Castle text: "Jinwoo acquired the Skill: Shadow Exchange and earned the Title: 'Demon Hunter'").
- **Shadow Monarch**: both a job and a title ("Title: Shadow Monarch").
- Pattern: a title is a **named reward for a specific, remembered feat** and **one title is equipped at a time, with an effect**. Fits the PRD (60 titles).

---

## 6. Inventory and Store

### Inventory [V wiki System, Sung Jinwoo/Items]

- **Unlimited** ("unlimited inventory that Jinwoo could use to store all sorts of magical items"), items cannot be forcibly taken, some are non-transferable.
- Item windows show: **name, Rarity (E to S letter), Type (Key, Consumable, Elixir, Rune, Armor, Accessory, Junk, Material, Container), Price (Gold), description, stat lines, set membership, set bonus**.
- Item types seen: Dungeon Key, Demon Castle Key (S), Castle Door Key (A), Unknown Black Key, Healing Potion (E), Mana Potion (E), Mythical Restoration Potion (fatigue), Elixir-type consumables with buff and debuff ("Weakened Muscles: Strength -35"), Runes, Leather Pouch, junk (Warm Fur Coat "Price: 10 gold"), Materials (Cerberus' Molar "Price: 150'000 Gold").
- Sets: "The Truth Seeker's Armament Set", "The Crown Jewels of the Monarch of Demons" with "Set bonus effect 1. All Stats +5 (2 Items)".
- Equipment is **invisible on the body** when worn from the Inventory (ch 38: "pleased to see that the pieces are invisible").
- The inventory is a window one reaches mentally: ep 4 "he discovers that he has access to his inventory provided by the System".

### Store [V wiki System]

- "Also known as the Shop, ... a digital marketplace accessible within the System. ... scaled to the Player's current level." Currency **gold**, received "whenever the Player kills a monster, completes a quest, or sells an item to the store."
- Sells consumables (health, mana, stamina), equipment and weapons (Knight Killer, B-Rank, **2,800,000 gold**), plus loot boxes:
  - **Blessed Random Box:** "obtain an item the Player wants."
  - **Cursed Random Box:** "obtain an item the Player needs."
- Not available inside the Job Change dungeon (rule), available inside the Penalty Zone.
- Item prices are big numbers (10,000 gold potion, 2.8 million gold dagger). **Currency inflation as a progression feel** is canon.

---

## 7. Gates, dungeons, Red Gates, Instant Dungeons, Double Dungeon, Demon Castle

### 7.1 Gates and dungeon ranks [V wiki Gates, Dungeons]

- Gates are "distinct blue portals" that appear at random (highways, schools). **Rank S-E** by magical energy. "D-Rank gates are about the size of large doors while S-Rank gates are so large that they appear to be like hurricanes" (although ep 5 notes size does not decide rank; "the level of magic that it emits that determines the rank").
- A gate stays open until the boss dies. If not cleared in a few days (wiki Dungeons says **7 days**), a **Dungeon Break** releases the monsters. After the boss dies the dungeon stays open "for about an hour".
- Clearing grants: mana crystals, magic stones, loot, money.

### 7.2 Red Gate [V wiki Red Gate, Gates]

- Appears blue, turns **red** once people step through; "seals off its entrance"; no one can enter or leave until the boss dies, the whole party dies, or a dungeon break happens. **Minimum B-Rank.** Harsh environments (snowfield, scorched desert, jungle), environmental death (frostbite, heatstroke, starvation). **Time dilation: one day inside is one hour outside.** Mana stops radiating once sealed.
- Canon Red Gate Arc: 12 guild members went in, 3 came back.
- **Design read:** a commitment mechanic with a known price, perfect for the PRD's 7-day non-pausable challenge.

### 7.3 Instant (Instance) Dungeons [V wiki Hapjeong Subway Station, Job Change Quest Dungeon, Dungeons]

- "Unique to Sung Jinwoo, as part of the System. These Dungeons are separate from regular Gates and serve as quests or training grounds for him."
- Entered with a **Key** from a quest reward. First one: **Hapjeong Subway Station**, an E-Rank dungeon opened with a Dungeon Key from a reward after he "completes more of his quests" (ep 3). Using the key on a door in the subway opens it and you "can no longer escape".
- Job Change dungeon is an instance dungeon; **Demon Castle** is an **S-Rank instant dungeon created by Kandiaru**.

### 7.4 Double Dungeon (Cartenon Temple) [V wiki Cartenon Temple]

- A hidden second dungeon inside two different D-Rank dungeons. No monsters, only huge statues; three commandments ("Thou shall worship God. Thou shall praise God. Thou shall prove thy faith."). Ends with one person left on the altar, who is offered Player status.
- Used by Ashborn to find a vessel. The Player returns at level 100 for the real reveal (Double Dungeon Arc).
- Teaches: a **trial with rules shown up front** and a **test of will rather than strength**.

### 7.5 Demon Castle [V wiki Demon Castle, ep 7, 15, 21]

- S-Rank instant dungeon, **100 floors**, set in a burning ruined Seoul (an alternate timeline). **Four bosses:** Cerberus (the Gatekeeper, the 1st floor), Vulcan (50th), Metus (75th), Baran (100th). After clearing, the city is restored.
- Entry: the **Demon Castle Key** is the loot-box reward of a secret quest (double daily) (ep 7); the **Castle Door Key** is dropped by the Gatekeeper.
- Goal quest: "Collect Demon Souls!" kill 10,000 beasts over the floors. Time pressure: a "week-long trip"; "Jinwoo eventually runs out of time and supplies on the 75th floor" (ep 15), returns later (ep 20-21).
- Reward target: **Elixir of Life**, three ingredients; crafting depends on INT; makes six bottles; cures his mother's Eternal Sleep Disease. Esil Radiru's father gives a permit for the upper floors.
- Progress feel: "As Jinwoo clears the castle's floors, he gains levels while progressing up the tower." (ep 15)
- Fits the PRD Demon Castle tower exactly (100 floors, four bosses at 1, 50, 75, 100).

---

## 8. Shadow Extraction, the Shadow Army, ranks

### 8.1 Extraction rules [V wiki Shadow Extraction, ep 12]

- Unique to the Shadow Monarch; triggered by a **command word** ("Arise"); **costs no mana**; works over a wide radius (hundreds at once).
- Description (see 3.1): failure rate "proportional to the target's stats and the time elapsed since their death".
- **Weaknesses:** not on contaminated mana (demons), not on targets much stronger than the user, **only three attempts per target**, not on mana-based beings (Rulers, Monarchs), not on long-dead targets.
- Ep 12 sequence: after the Job Change he "calls forth **30 shadow soldiers**, the maximum number allowed for the skill at current level" (wiki Shadows trivia says he could initially preserve **20**; treat the cap as **20 to 30, [U]**). Then "Igris": fails twice, "Only one attempt remains. Jinwoo makes an impassioned speech for Igris to join him ... The Knight Commander rises." Then **he names him**: "Jinwoo names Igris the Bloodred to simply Igris."
- **Shadow Preservation:** stores shadows inside his own shadow, "Instant Summon", "Reabsorption", level 2: shared senses.
- Anime GIF exists on the wiki: `Shadow_Extraction_Anime.gif` (see references catalogue).

### 8.2 Shadow grades [V wiki Shadows]

| Grade | Strength equivalent (wiki) | Notes |
| --- | --- | --- |
| Normal | E, D and C-Rank hunters | foot soldiers |
| Elite | about B-Rank | most common |
| Knight | about A-Rank | **can be given names** |
| Elite Knight | about basic S-Rank (Baek Yoonho) | |
| Commander (novel) / General (webtoon) | advanced S-Rank (Goto Ryuji), can speak | |
| Marshal (novel) / Commander (webtoon) | highest evolvable | |
| Grand Marshal | one only, lieutenant to the Monarch | Bellion |

- Promotion "requires direct authorization from the Shadow Monarch"; shadows grow by killing; exceptionally strong targets start high. Regenerate (cannot be killed by normal monsters), never tire, loyal, personalities grow with grade (Normal/Elite none; Knight simple emotions; General/Marshal rich).
- **Named shadows:** Bellion (Grand Marshal, purple skin, two pairs of black wings, centipede-shaped blade), Beru (Marshal, the Ant King), **Igris** (Marshal), **Tusk** (Marshal, from Kargalgan), Greed and Jima (General), **Iron** (Elite Knight, from Kim Chul, "Shout of Provocation"), **Kaisel** (Elite Knight in wiki infobox listing, a wyvern from Kaisellin), **Tank** (Knight, an ice bear named in Demon Castle, ep 15). Temporary: Kamish, Ant Queen, Min Byung-Gyu.
- Visuals: shadows have **glowing purple** accents on black (Bellion "glowing purple skin", Kaisel "glowing purple neck and underbelly, wings, horns"; Jinwoo's own eyes "glow purple" when using powers). [V]

---

## 9. Hunter ranks and National Level

[V wiki Class Ranks, Hunters, E-Rank, A-Rank, S-Rank, National Level Hunters]

- **Ranks E, D, C, B, A, S**, applied to hunters, dungeons and monsters. "A hunter's rank essentially determines everything about them, including their income and their reputations."
- Rank is **set at awakening and normally cannot increase**; only a rare **second awakening** (hence the hospital mana-meter test, Jinwoo scores **10**; "even E-ranks typically get higher than 70", wiki E-Rank: average E-rank at least 70). **Jinwoo is the unique exception**, because the System lets him train.
- S-Rank mana is "so high that it cannot be measured"; S-ranks are ranked internationally by a **point system** (Hunter Points) set by the Federal Bureau of Hunters.
- **False Rankers** hide their strength.
- **National Level Hunters** ("rival a nation's entire military"): created after the Kamish raid; five S-Rank hunters; each cleared at least one S-Rank gate; list: Thomas Andre, Liu Zhigang, Christopher Reed, Siddharth Bachchan (+ Jinwoo, "6th National Level Hunter" in the wiki infobox). They have "authority equal to that of an entire nation's".
- Six hunter classes: **Fighters, Mages, Assassins, Tankers, Rangers, Healers** (matches the PRD class list apart from Mage).
- A "Retesting Rank Arc" exists (webtoon ch 61-64, anime ep 16): rank is re-measured after growth. I did not read its detail, so use it only as the narrative model for our Rank-Up Trial **[U]**.
- Tiny stat fact for the Power Level: licence benefits (healthcare, financial aid, death insurance) were Jinwoo's motive. Licence revoked after three consecutive missed summons.

---

## 10. The Monarch arc (for the late game and the hidden class)

[V wiki Monarchs, System, Black Heart]

- At the dawn of time the Absolute Being split light into the **Rulers** and darkness into the **Monarchs**; they have been at war ever since. Gates appeared because the Rulers wanted the human world saturated with mana.
- **Ashborn**, the Shadow Monarch, was betrayed by Rakan and Baran; he built the System through Kandiaru to find a successor. Jinwoo returns to the Double Dungeon at level 100; Ashborn bestows the **Black Heart** instead of taking him over; the System locks Kandiaru out.
- The Monarchs (Antares the Destruction Monarch, Querehsha, Sillad, Rakan and others) invade; Jinwoo ascends into the true Shadow Monarch, the System **deletes itself** once its purpose is done. Epilogue: the System is modified, a "Tutorial" for Suho, then sealed. In *Ragnarok* Suho gets a corrupted System with a different Job Change that ends as "Irregular: White Shadow".
- Black Heart: when his mortal heart stops, a hidden notification fires: `[Passive Skill: 'Black Heart' has activated.]`.
- **What this gives us:** the final reveal (S rank → Shadow Monarch hidden class, the System "retires" the training wheels) is a proper endgame shape: after "National Level" the System can stop showing numbers and say less.

---

## 11. Solo Leveling: ARISE (Netmarble Neo, released 2024-05-08)

[V solo-leveling-arise.fandom.com pages: Solo Leveling: ARISE, Game Modes, Gates, Army of Shadows, Tickets, Items, Armory, Battle Tier; thegamer summoning guide; fayiette review.]

**Structure and menus (lobby):** Information Desk, Activity Funds, Gate Status Board, Rankings, Play, Shop, Draw, Management; Compass icon for Hunter Archive; Armory, Army of Shadows, Codex, Achievements, Hunter Pass. [V]

**Progression layers (the power stack):** Jinwoo's Total Power (TP) + 2/3 of the top three Hunters' TP + Army of Shadows TP + Armory TP + Remnant Power TP = **Battle Tier** (a single headline strength number; each Tier-up pays 300 Essence Stones and 10,000 Gold). Our **Hunter Power Level** can take the same "many sources into one tier" shape.

**Gate system:**
- Keys: "100 Dungeon Entry Keys are recharged daily"; gate keys consumed per successful clear (**keys only consumed on success**, a fairness detail worth copying); 10 Gate Keys free daily.
- **Three gate colours** in the Gates mode: **Blue** (growth gear and scrolls), **Purple** (shadow resources), **Green** (rune/design materials). Five types: Normal, Dungeon Breaks, Bonus (random spawn), Special, **Red Gates** (Chapter 7 unlock, harder hard-mode only, four waves, debuff sculpture).
- **Sweep** auto-clears cleared content with points (daily set number). Mining: after a clear, a **mining team** harvests for up to 24 h (idle loop).
- Daily clear bonus: "clearing at least three Gates daily grants up to 14,340 bonus XP" and "Every time the user clears 2 gates, they are rewarded with bonus experience, up to 3 times".

**Army of Shadows (collection UI):** extract, promote and upgrade; unlocked after story chapter 9; take **3 shadows into a fight**; each is on the field for 15 to 20 s then on cooldown; costs "Shades"; five ways to upgrade (Promotion, Upgrade, Skill Level Up, Armament, Army Level Up). A shadow needs rank Elite Knight to level a skill past 5; **General** rank unlocks Armament. Each shadow has a **Shadow's Authority** passive for the whole team plus an epithet title (Igris "His First Shadow": +Critical Hit Rate; Beru "Ant King": +Attack and Critical Damage; Kaisel "Wyvern": Ultimate Skill Damage; Iron "Musclebound Menace": +Max HP; Tank "Leader of the Snowy Mountain": +Defense; Tusk "Almighty Shaman"; Greed "The Soldier of Avarice": Wind damage). **That is exactly our shadow = passive buff + title + rank gallery.**

**Armory:** 18 slots in three bands named "Armory of Perseverance / Change / Transcendence", unlocked by Battle Tier. A natural "equipment wall" layout.

**Gacha (Draw) UI and rates:**
- Banners: **Rate-Up Draw** (limited time) and **Custom Draw** (permanent, player picks a boosted list: 4 hunters/weapons) and Weapon Custom Draw (2 weapons).
- Rarity names: **R, SR, SSR** with fixed grade rates **R 90%, SR 8.8%, SSR 1.2%**; SSR pity at **80 pulls**, soft pity rising +5.8% from pull 64; x10 guarantees at least SR. Special Summon: choose one of 15 ten-pulls. [V thegamer]
- Ticket flavour text is in the System voice: "Which hunter will join you?" / "If you send offers to the hunters registered in the Hunters DB... will they really respond." (wiki Tickets) [V]
- **Rarity colours and the reveal animation could not be verified from text.** Reviews never describe them. The common convention (R blue, SR purple, SSR gold) is **[U]**; do not rely on it. We use the PRD rank/rarity palette instead.
- Player complaints: some players dislike SR/SSR naming because it "takes away from the already established manhwa ranking system of National, S rank, A rank" (reviewer paraphrase in search result, not opened page) **[U]**. **Lesson:** keep gacha-like letters (R/SR/SSR) out of the game; ranks E to S mean hunters, rarity means loot (we already split them).
- Review of the live game: "the constant stuttering and loading freeze after every menu click is gone" in later versions; inventory "a mess that feels like it accumulated over years of patches" and "you genuinely do not know what 99% of the things you are receiving even are." [V fayiette] **What not to do:** unlabeled currencies, 25 item types, and slow menus.

**Menu patterns worth borrowing:** a lobby with tiles for each mode and a status board (like our Gates list); first-login free keys; a Hunter Pass (our seasonal quest line); Hunter Archive keys (story unlocks by level); achievements and challenges grouped by chapter ("Upon completing all challenges in each chapter, 10 Custom Draw Tickets").

---

## 12. Visual language

### 12.1 What is verifiable about the show

- Windows are described as "a blue holographic screen that appears anywhere and anytime" (CBR, **V**), "bluish, semi-transparent", **English text** in the anime, **red** pop-ups for emergency quests, glowing LEVEL UP text with a chime (nyaotaro, **V-fan**). The ep 3 wiki summary says "The interface, bathed in a futuristic blue hue".
- Direction: the anime director (Shunsuke Nakashige) said he "felt the series called for high-end visuals, so he avoided manga-style expression" and used "live-action-style framing, colour tones, and camera processing" (animatetimes, translated). That is the clue that the **windows are composited like real augmented-reality layers** (depth, light bloom, slight blur), not flat comic overlays. [V]
- Window language from Jamilkowski's AR analysis: dashboard, gauges, inventory, warning modals; contextual panels (a **health gauge appears only while injured**); **metadata labels floating over creatures** (name tags with colour = relative strength); the screens are touchable; virtual armour only he can see.
- **The font:** no official credit exists. A search-result snippet (not opened, **[U]**) says the logo font looks like "Eternal" by FG Studios; fan builds use *Rajdhani, Orbitron, Chakra Petch, Share Tech Mono, JetBrains Mono, Cinzel* (below). The PRD's starting stack of Orbitron/Rajdhani + Inter + JetBrains Mono is consistent with what fans converge on.

### 12.2 Fan recreations (code read, CSS values captured)

| Repo | License | Colours | Fonts | Notable CSS |
| --- | --- | --- | --- | --- |
| Doc36/the-system (workout PWA) | none stated | bg `#05060d`, panel `#0c1226`, line `#1b3b6f`, glow `#36c5ff`, accent purple `#a06bff`, gold `#ffcf5c`, text `#dbe7ff`, dim `#7e8db5`, good `#4ade80`, danger `#ff5d6c` | Segoe UI (no web font, "stays offline-friendly") | panel `box-shadow: 0 0 18px glow55, inset 0 0 24px #0a1733`; **corner ticks** with `::before/::after` 14px, 2px border + drop-shadow glow; EXP bar `linear-gradient(90deg, accent, glow)` with glow shadow; `@keyframes pop {from {translateY(-16px) scale(.95); opacity 0}}` toast |
| PranavKanungo1/Solo-leveling_UI | none | bg `#030712`, blue `#00e5ff`, glow `rgba(0,229,255,.4)`, red `#ff3333`, text `#f0f8ff`, dim `#8b9bb4`, panel `rgba(10,15,30,.85)`, border `rgba(0,229,255,.3)` | Rajdhani (system) + Inter (read) | `.system-window {border-radius:4px; backdrop-filter: blur(15px); box-shadow: 0 0 20px rgba(0,0,0,.8), inset 0 0 30px blue-bg, 0 0 10px blue-glow}`; top edge 2px gradient line `transparent → blue → transparent`; grid background `linear-gradient(rgba(0,229,255,.03) 1px,...) 30px`; **windowOpen: 0 to 100%: opacity 0, scale(.95) translateY(20px) blur(10px) → clear, 0.5 s**; active tab underline `box-shadow: 0 -2px 10px blue` |
| kartikvaghela30/hunterlog | none | bg `#030812`, panel `rgba(8,20,50,.85)`, blue `#1e6fff`, cyan `#00d4ff`, purple `#7b2fff`, gold `#ffd700`, red `#ff3355`, green `#00ff88`, text `#c8d8f0` | Orbitron (headings/numbers), Rajdhani (body), Share Tech Mono (data) | **ARISE title** gold gradient text with pulsing `drop-shadow`, 0.5 s alternate; **glitch keyframes** at 96 to 98%: `text-shadow: 3px 0 red, -3px 0 cyan; skewX(2deg)`, then purple/gold; level-up toast slides from right with `cubic-bezier(.175,.885,.32,1.275)`; rising 2px cyan particles |
| tomalmandal/Level-up_system | none | bg `#05050d`, text `#e2e8f0`; sword glow `rgba(120,130,255,.8)` | Rajdhani + Cinzel (serif for "System" tag, 9px letter-spacing 5px, colour `#1e3a5f`) | **Scanlines:** `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.04) 3px, rgba(0,0,0,.04) 4px)` as a fixed overlay; `rankBreathGlow`, `aggressiveRankFlash`, `awakeFlash` keyframes |
| ankurrera/SoloLeveling | none | tokens in HSL; dark "neutral grayscale" re-skin | Cinzel (gothic) + Rajdhani | shows the common pairing |
| suadpllana/solo-leveling PR 1 | n/a | not published | Chakra Petch, Inter, JetBrains Mono, Orbitron (self-hosted) | translucent panels, glowing edges, **HUD corner brackets**, progress rings, floating "+XP", "Quest cleared" toast with Undo, level/rank overlay, reduced-motion support |
| DlegendZ/THE-SYSTEM | MIT | rank-based theming per E-S (star avatar) | not read | app opens with the quote "You have acquired the qualifications to be a Player." |
| digishivam/sololevelingsystemui | "personal, educational, non-commercial" | bootstrap | n/a | basic status window: STR/AGI/STA/INT + XP bar + inventory |

Fan-consensus palette across repos: near-black navy `#030712 to #05070f`; System blue `#00e5ff to #36c5ff`; deep blue panel `#0c1226 to rgba(8,20,50,.85)`; purple `#7b2fff to #a06bff`; gold `#ffcf5c to #ffd700`; danger `#ff3333 to #ff5d6c`. This is within a hair of the PRD starting tokens (`--bg #05070F`, `--system-blue #2FA8FF`, `--glow #5CC8FF`, `--shadow-purple #7B2FF7`, `--warning #FF3B5C`, `--gold #FFC94A`), so the PRD palette is validated; the one thing fan builds do that we should be careful about is **`#00e5ff` pure cyan** which reads brighter than anime blue; the anime reads as a slightly **less saturated, whiter-edged blue**, so keep `--system-blue` at `#2FA8FF` and use `--glow #5CC8FF` only for light, not text.

### 12.3 Visual vocabulary to implement [D, assembled from the above]

- **Panel:** near-black navy translucent fill (75 to 85% opacity) over a blurred background, 1px blue border at 30 to 60% alpha, outer glow + inset glow, 2px gradient highlight line along the top edge, **L-shaped corner brackets** in brighter blue at the four corners, optional faint **30px grid** inside, **scanline overlay** at 4% black.
- **Header tag** above content: small caps, letter-spacing 0.25 em, glow text-shadow, like `SYSTEM`, `QUEST INFO`, `NOTIFICATION`, `ALERT`.
- **Alert / emergency / penalty:** same frame in red `#FF3B5C`, pulsing border, double alert tone, text prefixed `WARNING`.
- **Shadow energy purple:** `#7B2FF7` with a **darker, less saturated body (#1a0b33 to #0b0716)** and lilac highlights; mist/smoke particles, never flat; glowing purple eyes.
- **Gold** is reserved for rewards, level-up numerals, legendary (fans use it for ARISE text and level-up).
- **Typography:** futuristic display face (Orbitron or Rajdhani) for titles and window tags, readable sans (Inter or Rajdhani 500) for body, monospace (JetBrains Mono or Share Tech Mono) for numbers/timers. Letter-spaced uppercase for tags.

### 12.4 Motion: what is known, what we recommend

Known facts: windows float in front of the viewer, are touchable, pixelate near a finger, appear in the middle of action, composited in a live-action manner. **No source states the open transition**, timings or sound design for the anime windows, and no official sound rips are used here (fan uploads exist on MyInstants/Zedge but are unofficial). So the motion spec is ours:

| Effect | Recommended recipe [D] | Reduced-motion fallback |
| --- | --- | --- |
| Window open | scale .96 → 1, opacity 0 → 1, slight blur 6px → 0, **border line-trace** around the frame (clip-path or SVG dashoffset), 2 to 3 frames of flicker, 220 to 280 ms, ease-out (fan builds use 500 ms which is too slow for in-workout use) | fade 120 ms |
| Window close | reverse, 140 ms; scanline collapse to a thin line | fade 80 ms |
| Message typing | text types in at ~35 to 60 chars/s, brackets first, cursor block; skippable on tap | whole line fades in |
| Glitch reveal | 2 to 3 frames of RGB split (`3px red/cyan`), skewX 2°, only for rank-up, ARISE, warning | none |
| Level-up | gold numeral count-up, expanding ring, 600 ms; "LEVEL UP" header with chime | static banner |
| ARISE | screen dims, **purple smoke rises from the bottom**, silhouette appears, name types in, tap to "Accept" | still card + fade |
| Penalty | red tint pulse, screen-edge vignette, alarm tick | red border only |

Sound (see F0): designed with Web Audio, **two-tone rising chime for open**, soft low tick for close, a **three-note rising chime for quest accepted**, a **dissonant double beep for warning/penalty**, **bright arpeggio for level-up**, deep sub + choir-like pad for ARISE. None of these is claimed to match the anime exactly.

---

## 13. Why it works for fitness (design analysis)

1. The System is a **polite taskmaster**. It tells you exactly what, how much and what happens if you don't. That clarity is the motivator, not the penalty.
2. **Real exercise → real stat growth → visible numbers.** Jinwoo's Daily Quest *is* a workout; the rewards (stat points, recovery) map to what training actually does for you.
3. **Friction is front-loaded and honest**: the first Penalty Zone scene makes the player feel the quest is real. After that the System mostly rewards.
4. **Rank is rare and meaningful** in canon (only Jinwoo can grow), whereas our rank must be earned by tests, never by grinding (PRD).
5. **Collection is emotional**, not a spreadsheet: Igris joins after three attempts and a speech, then is *named*. We borrow the failure-twice-then-succeed suspense without risking the user's real progress.
6. **Secret/hidden quests exist** as a reward for going beyond the ask (double daily), so overachievement feels noticed.
7. **Safe fear:** the System frames danger with a timer and a printed rule ("Survive for the allotted amount of time"), not with arbitrary loss.

---

## 14. Mapping: Solo Leveling concept → our fitness mechanic

(Safety rules from PRD Section 3 apply to every row: no XP removal, no reward for training a muscle below 30% recovery, deloads framed as Recovery Phase, readiness or injury waives penalties.)

| # | Solo Leveling concept | Our fitness mechanic |
| --- | --- | --- |
| 1 | Accept prompt: "You have acquired the qualifications to be a Player" | Awakening onboarding: the System "chooses" the user; Accept starts onboarding, Decline exits with an in-voice message |
| 2 | Courage of the Weak (secret quest, survive) | The first Awakening Test (max push-ups, 60 s squats, plank): clearing it makes you a Player |
| 3 | Congratulations on becoming a Player | Welcome screen after the test; shows starting rank and Power Level |
| 4 | Status Window | Home screen: name, title, class, level, XP, rank, Power Level, stats, points, streak, gold |
| 5 | Level | Player level from the XP ledger (`100 x level^1.5`) |
| 6 | Job | Class (Fighter, Tank, Assassin, Ranger, Healer) that sets rep/load/rest targets |
| 7 | Title (equip one for a buff) | 60+ titles, one equipped, small passive XP bonus in a stat category |
| 8 | HP | Overall recovery % (average of the per-muscle recovery model) |
| 9 | MP | Readiness score from the daily check-in (sleep, energy, stress) |
| 10 | Fatigue (0 to 100, restore with potions) | Training load / soreness gauge; restored by rest days and a "Recovery Phase" |
| 11 | STR | Strength: e1RM increases on tracked lifts |
| 12 | AGI | Cardio and conditioning work (zone minutes, pace, intervals) |
| 13 | Stamina/VIT | Consistency, sleep and recovery compliance (streaks, check-ins, deload adherence) |
| 14 | INT | Nutrition: hitting calorie, protein, water targets and logging |
| 15 | SENSE/Perception | Form quality (camera form check scores, RIR accuracy, mind-muscle notes) |
| 16 | Stat points to allocate (+3 per daily, free points on level) | Bonus points on level-up and clean daily clears; allocate to a stat for a small XP multiplier in that category |
| 17 | Level-up Status Recovery | Level-up pops a "System Restored" message and refills the Readiness gauge visual (cosmetic, never overrides safety) |
| 18 | Daily Quest "The Preparation To Become Powerful" | Daily training session + water + protein + readiness check-in, with a 24 h countdown to midnight |
| 19 | 100/100/100/10 km | Class-scaled daily targets (never the literal 10 km); beginner mobility or step goal on rest days |
| 20 | Daily Quest scaling as Jinwoo levels | Plan engine raises targets by progression rules (double progression, undulating) |
| 21 | Daily Quest reward: Status Recovery, +3 Stat Points, loot box | XP, 3 stat points, gold, a loot-roll chance after the workout |
| 22 | Penalty Zone (4 h survival, centipede desert) | Short conditioning penalty quest (10 min: bike/jog + bodyweight circuit) the next day; no XP removed; clearing restores the streak flag |
| 23 | Penalty difficulty readjusts if you try to farm it | Penalty yields no XP, gold or loot; completing it only clears the penalty flag |
| 24 | System warning before penalty | `[Warning: failure to complete the Daily Quest will result in a penalty.]` push at 21:00 |
| 25 | Emergency/urgent quest (Kill the Enemies, red window) | Surprise optional quest with high XP ("Complete 50 push-ups before 21:00"), red frame, always skippable |
| 26 | Secret quest from doing double the daily | Hidden quest: complete 2x volume safely (within caps) or train at 05:00; unlocks a Demon Castle key or title |
| 27 | Job Change Quest at level 40 | Job Change at level 30 after a class-specific hard test (e.g. e1RM benchmark or conditioning gauntlet), unlocks advanced techniques |
| 28 | Survive "as long as possible", score by time | Job Change Quest benchmark scored by time under tension / total reps in a time cap, done only if recovered |
| 29 | Necromancer then Shadow Monarch (hidden class) | Hidden class Shadow Monarch at S rank: mix class rules per exercise |
| 30 | Job Change dungeon rules (no potions/store) | Trial rules shown up front: no deload swaps, no equipment swaps during the benchmark |
| 31 | Skills (active, passive, unique, level up) | Techniques: cluster sets, myo-reps, EMOMs; unlock by class; each gains levels with use |
| 32 | Runes (break to obtain skill) | One-time "technique scroll" items from loot that unlock a technique |
| 33 | Titles: Wolf Slayer, One Who Overcame Adversity, Demon Hunter | Squat PR, 30-day streak, 100-day streak, clear Demon Castle floor milestones; Wolf Slayer for first squat PR |
| 34 | Inventory (unlimited, E to S rarity) | Inventory of consumables, keys, skins; rarity Common/Rare/Epic/Legendary (separate from E to S ranks) |
| 35 | Store (gold, Blessed/Cursed Random Box) | System Store: gold buys Streak Freeze, Rest Day Pass, Instant Dungeon Keys, UI skins; "Blessed Box" = pick from 3 cosmetics, "Cursed Box" = random but guaranteed useful |
| 36 | Elixir of Life | Streak Freeze item ("Elixir of Life"): protects one missed day |
| 37 | Potions (Healing, Mana, Mythical Restoration) | Rest Day Pass, mobility session token, hydration boost: convenience only |
| 38 | Gold from kills and quests | Gold from sets, workouts, quests; never from unsafe volume |
| 39 | Gates E-S, colour blue, size by rank | Programs as Gates with a rank by difficulty and length; blue = normal, purple = shadow-themed (recovery/mobility), red = challenge |
| 40 | Dungeon Break if gate not cleared in 7 days | Program drift warning: if no session for N days the Gate shows "unstable" and offers a catch-up plan |
| 41 | Red Gate (sealed, harsh, time dilated, min B) | Opt-in 7-day challenge, cannot be paused (except by readiness/injury waiver), B-rank or higher programs only |
| 42 | Instant Dungeon (key from a quest reward) | Instant Dungeon Key: bonus workout (arms, abs, conditioning) earned from quests |
| 43 | Double Dungeon (hidden trial inside a gate) | A "hidden floor" appearing at the end of a program week once the boss raid is cleared with PRs |
| 44 | Demon Castle (100 floors, Cerberus at 1, bosses at 50, 75, 100) | 100-floor lifetime tower: floors = total volume, km, workouts; bosses at 1, 50, 75, 100 |
| 45 | Collect Demon Souls (10,000 kills) | Tower quest: cumulative reps or total volume milestone |
| 46 | Elixir ingredients over three bosses | Collect three Tower materials to craft a premium cosmetic or Streak Freeze bundle |
| 47 | Shadow Extraction "Arise" | After a Boss Raid, major PR or Rank-Up Trial, an ARISE sequence turns the defeated "boss" into a shadow |
| 48 | Three extraction attempts, failure chance by stats and time | Cinematic only: up to three "attempts" animate, outcome is deterministic and guaranteed after a real achievement (no gambling) |
| 49 | Shadow naming for Knight+ | Player may rename a shadow of Knight rank or higher |
| 50 | Shadow grades (Normal to Grand Marshal) | Shadow ranks: Normal, Elite, Knight, Elite Knight, Commander, Marshal, Grand Marshal, ranked by achievement size |
| 51 | Shadow growth and promotion by the Monarch | Shadows level up through related workouts; promotion needs an explicit tap and a trial |
| 52 | Shadow Preservation (stored in shadow) | Shadow Army gallery, 3 equipped shadows with passive buffs (as in ARISE) |
| 53 | Hunter ranks E to S | Player ranks E, D, C, B, A, S via Rank-Up Trials |
| 54 | Mana meter test (Jinwoo scored 10) | Awakening Test result: starting Hunter Power Level and rank |
| 55 | Second awakening / Retesting Rank Arc | Rank-Up Trial: a real re-test (strength, conditioning, consistency) |
| 56 | National Level Hunter | Rank beyond S, awarded for Power Level 95+ and long consistency |
| 57 | Hunter Points (S-rank ordering) | Power Level tie-breaker within S |
| 58 | Hunter classes: Fighter, Mage, Assassin, Tanker, Ranger, Healer | Our classes Fighter, Tank, Assassin, Ranger, Healer (no Mage; no magic in a gym) |
| 59 | Monster name colours (white/orange/red = relative strength) | Exercise difficulty tags: white easy, orange normal, red above your level |
| 60 | System inbox (mail) | System log screen: every message, searchable |
| 61 | Black Heart (revive passive) | A once-per-month "Second Wind" that auto-saves a broken streak |
| 62 | System self-deletes after purpose is done | Optional "Retired System" mode at National rank: fewer prompts, more data |
| 63 | Tutorial for Suho / modified system | Re-running Awakening, with changed class, rewrites targets after confirmation |
| 64 | ARISE draw tickets and banners | Loot reveal after workouts, **cosmetic only, no gacha purchases** |
| 65 | ARISE Battle Tier | Single Power Level that rolls up strength, conditioning, consistency |
| 66 | ARISE Hunter Pass | Seasonal quest line (4 to 6 weeks) with a free track |
| 67 | ARISE sweep | "Quick Clear" for a mobility block you already know how to do (logs automatically) |

---

## Findings

1. **Canon quest anatomy is Goal, Time limit, Reward, Penalty**, and every quest the wiki lists follows it. The Daily Quest is 100 push-ups, 100 sit-ups, 100 squats, 10 km, 24 hours, rewarding Status Recovery, +3 Stat Points and a Random Loot Box, penalised by the Penalty Zone.
2. **Penalty Zone is a defined, finite, printed ordeal** (desert, 4 hours, giant centipedes, "no wind, no sun, moon or even stars"), and its difficulty readjusts if you farm it. Canon already contains the exploit we must avoid.
3. **The System speaks in square-bracket, third-person-or-second-person, neutral, imperative statements**, announces the rules on entry, and uses polite words only at big moments ("Congratulations", "Good luck").
4. **Stat names have translation variants** (Stamina/Vitality, Sense/Perception). Stat descriptions are concrete and gameplay-facing (verbatim captured above).
5. **Level-up = +stats, full heal ("Status Recovery")**, with points to allocate; the daily quest also grants points. Fatigue is a separate 0-100 gauge restored by potions; it showed 90+ in the Job Change fight.
6. **Job Change is a survival-time test** that produces a hidden class (Necromancer → Shadow Monarch) and a title; it temporarily suspends the Store, potions and level-up healing.
7. **Shadow Extraction** is command-triggered, free, max **3 attempts per target**, fails by stat gap and time since death, and creates a named, graded soldier. Shadow grades run Normal → Elite → Knight → Elite Knight → Commander/General → Marshal/Commander → Grand Marshal; naming starts at Knight.
8. **Loot rarity in canon uses the rank letters E to S**; the ARISE game separates rarity (R/SR/SSR) from rank, and players complained about the mismatch.
9. **Demon Castle has exactly the structure the PRD describes**: 100 floors, bosses at 1/50/75/100, gated by keys, with a long-term reward (Elixir of Life).
10. **Visual language that can be stated with confidence:** blue translucent holographic floating windows; red for emergency; glowing level-up text; windows floating in 3D space (not a HUD); live-action-style compositing; purple glow for shadows/Monarch. The rest (timings, exact fonts, sounds) is not documented publicly. Fan UI repos converge on the PRD palette.
11. **ARISE** shows a robust set of menu patterns (lobby tiles, status board, keys that only drain on success, sweeps, mining/idle rewards, a single Battle Tier number, a 3-shadow loadout, passive "authority" buffs). Its inventory and loading times are the cautionary tale.
12. **Real data gaps:** the exact Status Window label text and the Courage-of-the-Weak prompt punctuation are not verified in a machine-readable source; we author our own wording in System voice (as planned).

## What we take

- The **four-part quest card** (Goal / Time limit / Reward / Penalty), with live progress counters.
- **Bracketed System voice** with the grammar in 3.2, stacked brackets in one window, and a typed reveal.
- The **Status Window field set** with HP/MP/Fatigue reinterpreted as recovery/readiness/load, five stats with allocate buttons, available points, equipped title that visibly changes effects.
- **Penalty Zone as a finite printed ordeal**: 10 minutes of conditioning, rules shown first, red alert styling, an in-voice warning at the right time.
- **Job Change** as a class-specific benchmark with the "rules are announced up front" pattern and a hidden class at S rank.
- **Titles** as one-equipped, feat-named, buff-giving cards.
- **Inventory/Store** screens with Rarity, Type, Price, description, and set bonuses; Blessed and Cursed Random Box as Store flavour.
- **Red Gate**, **Instant Dungeon Key**, **Demon Castle** (100 floors, 1/50/75/100), **Elixir of Life** exactly as in the mapping table.
- **Shadow Extraction ARISE** sequence with three attempts, naming, grade ladder, passive buffs (ARISE's Shadow Authority), 3-shadow loadout.
- **Hunter Ranks E to S + National Level**, mana-meter-style Awakening Test, and Retesting as the Rank-Up Trial.
- **Colour semantics**: blue normal, red emergency/penalty, gold reward, purple shadow; relative-difficulty tag colours (white/orange/red).
- **System inbox** as the notification history; messages appear unprompted but never block a set in progress.
- From ARISE: **keys that only drain on success**, a single Battle-Tier-style number, lobby tiles, hunter-pass style seasons.

## What we do better

- **No XP loss, no death, no real harm.** Canon penalty is death-adjacent; ours is a short conditioning quest, waived on low readiness or injury flags, and it never removes progress.
- **No exploit.** Canon lets the Player farm the Penalty Zone for levels; we pay nothing for penalty completion.
- **Safety rails in the quest generator.** Canon's 100/100/100/10 km every day is dangerous (kovofitness and others warn of overuse). Ours uses class-scaled volume, weekly caps, deloads, and recovery-aware generation.
- **Fatigue is real.** Canon fatigue is a number potions fix; ours is computed from sets, load, RIR and cardio, with per-muscle decay.
- **Ranks cannot be ground.** Canon ranks are fixed at awakening; ours are earned by real re-tests (the only way a rank rises).
- **Extraction is guaranteed and meaningful**, not a gamble. We keep the suspense animation but never gate a reward behind luck.
- **Rarity is cosmetic and honest.** No gacha, no pity counters, no spend; loot is convenience or cosmetic only.
- **A clear, small economy.** ARISE's unlabeled currencies and 25 item types are the anti-pattern; we ship gold, keys, and a few named consumables.
- **Fast UI.** Fan builds use 500 ms window opens; we hold to under 300 ms and always offer reduced motion.
- **Accessible System UI.** Contrast-checked pairs (the anime's red-on-black is not automatically AA), 48 px targets, no reliance on haptics.
- **The System is allowed to be quiet.** In canon it shuts down when finished; we add an optional Retired mode at National rank.

---

## Sources

Fandom wiki pages (read via the wiki's public MediaWiki API because plain fetch returned HTTP 402/403):

- https://solo-leveling.fandom.com/wiki/System
- https://solo-leveling.fandom.com/wiki/The_Preparation_To_Become_Powerful
- https://solo-leveling.fandom.com/wiki/Penalty_Zone
- https://solo-leveling.fandom.com/wiki/Survival
- https://solo-leveling.fandom.com/wiki/Kill_the_Enemies
- https://solo-leveling.fandom.com/wiki/Courage_of_the_Weak
- https://solo-leveling.fandom.com/wiki/Quests
- https://solo-leveling.fandom.com/wiki/Skills
- https://solo-leveling.fandom.com/wiki/Job_Change_Quest
- https://solo-leveling.fandom.com/wiki/Job_Change_Quest_Dungeon
- https://solo-leveling.fandom.com/wiki/Job_Change_Arc
- https://solo-leveling.fandom.com/wiki/Gates
- https://solo-leveling.fandom.com/wiki/Red_Gate
- https://solo-leveling.fandom.com/wiki/Dungeons
- https://solo-leveling.fandom.com/wiki/Hapjeong_Subway_Station
- https://solo-leveling.fandom.com/wiki/Instant_Dungeon_Arc
- https://solo-leveling.fandom.com/wiki/Double_Dungeon_Arc
- https://solo-leveling.fandom.com/wiki/Cartenon_Temple
- https://solo-leveling.fandom.com/wiki/Demon_Castle
- https://solo-leveling.fandom.com/wiki/Shadow_Extraction
- https://solo-leveling.fandom.com/wiki/Shadow_Preservation
- https://solo-leveling.fandom.com/wiki/Shadow_Authority
- https://solo-leveling.fandom.com/wiki/Shadows
- https://solo-leveling.fandom.com/wiki/Igris , /Bellion , /Beru , /Iron , /Tusk , /Kaisel , /Tank
- https://solo-leveling.fandom.com/wiki/Hunters
- https://solo-leveling.fandom.com/wiki/Class_Ranks
- https://solo-leveling.fandom.com/wiki/E-Rank , /A-Rank , /S-Rank
- https://solo-leveling.fandom.com/wiki/National_Level_Hunters
- https://solo-leveling.fandom.com/wiki/Monarchs
- https://solo-leveling.fandom.com/wiki/Black_Heart
- https://solo-leveling.fandom.com/wiki/Black_Market
- https://solo-leveling.fandom.com/wiki/Sung_Jinwoo and /Sung_Jinwoo/Items
- Episode pages 1 to 25 (read, notably 2, 3, 4, 5, 7, 11, 12, 15, 21): https://solo-leveling.fandom.com/wiki/Episode_3 and siblings
- Chapter pages 10, 11, 14, 38, 41, 42, 50, 57, 60: https://solo-leveling.fandom.com/wiki/Chapter_10 and siblings
- Image file pages and file URLs (links only, not downloaded): see `design/references/README.md`

Solo Leveling: ARISE wiki (same API approach):

- https://solo-leveling-arise.fandom.com/wiki/Solo_Leveling:ARISE
- https://solo-leveling-arise.fandom.com/wiki/Game_Modes
- https://solo-leveling-arise.fandom.com/wiki/Gates
- https://solo-leveling-arise.fandom.com/wiki/Army_of_Shadows
- https://solo-leveling-arise.fandom.com/wiki/Tickets
- https://solo-leveling-arise.fandom.com/wiki/Items
- https://solo-leveling-arise.fandom.com/wiki/Armory
- https://solo-leveling-arise.fandom.com/wiki/Battle_Tier
- https://solo-leveling-arise.fandom.com/wiki/Weapons , /Effects , /Lobby

Articles and others (opened):

- https://gamerant.com/solo-leveling-every-quest-sung-jin-woo-completed-anime/
- https://www.kovofitness.com/blog/solo-leveling-workout
- https://www.ariseworkout.com/
- https://www.cbr.com/solo-leveling-anime-system-create/
- https://www.cbr.com/solo-leveling-system-explained/
- https://www.carljamilkowski.com/2024/04/ar-as-seen-in-solo-leveling/
- https://aniviewer.com/logic-of-the-system-solo-leveling-analysis/
- https://nyaotaro.com/archives/2011 (fan blog, Japanese)
- https://www.animatetimes.com/news/details.php?id=1711946740 (director interview, Japanese)
- https://www.thegamer.com/solo-leveling-arise-summoning-guide/
- https://fayiette.com/review/solo-leveling-arise/
- https://yenpress.com/titles/9781975319274-solo-leveling-vol-1-novel (blurb)
- https://en.wikipedia.org/wiki/Solo_Leveling
- https://devforum.roblox.com/t/some-ui-designs-i-made-off-a-manhwa-reference-solo-leveling/941145 (captions only)
- https://github.com/suadpllana/solo-leveling/pull/1
- https://github.com/digishivam/sololevelingsystemui

GitHub repos cloned and CSS read (licence noted in 12.2): https://github.com/Doc36/the-system, https://github.com/PranavKanungo1/Solo-leveling_UI, https://github.com/kartikvaghela30/hunterlog, https://github.com/tomalmandal/Level-up_system, https://github.com/ankurrera/SoloLeveling, https://github.com/DlegendZ/THE-SYSTEM (MIT), https://github.com/raghavvxts/Solo-Leveling-System (MIT), https://github.com/hadi327/solo-leveling-system-ui-fitness-app-

Tried and unavailable: TV Tropes (403), x.com thread (402), theharemkingnoveltranslations (410). Search results snippets were used only for leads (for example the "Eternal" font guess), never as confirmation.

**Licence caveat:** the fan repos mostly carry no licence; colours and ideas above are observations, not copied code. Re-create from scratch.
