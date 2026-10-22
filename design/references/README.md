# Reference frames catalogue (F0)

Links and written descriptions only. **No third-party images are stored in this repo.** Wiki file URLs are hot-links to the Solo Leveling fandom wiki CDN; each has a file page you can open to see the frame (`https://solo-leveling.fandom.com/wiki/File:<name>`).

Companion note: `research/solo-leveling.md` (Section 12 visual language, Section 3 message wording).

## How trustworthy these descriptions are

- I did not view the pixels (instruction: no downloading of copyrighted images). Descriptions come from the wiki page the file sits on (caption, episode or chapter summary), the file name, and the text sources in the research note.
- Lines marked **(text-confirmed)** are backed by a page I read. Lines marked **(confirm by eye)** are inferences to check when someone opens the link, before they harden into tokens.
- When F0 builds the real assets, treat these only as mood and structure references. Everything shipped is original (PRD asset rules).
- Colour hexes below that are not from the show come from fan repos in the research note (Section 12.2) or our PRD tokens.

Wiki CDN base: `https://static.wikia.nocookie.net/solo-leveling/images/` (full URLs given per entry). Aspect ratios are from the file metadata.

---

## 1. Status window

| Item | Value |
| --- | --- |
| Frames | `System1.jpg` 717x1028: https://static.wikia.nocookie.net/solo-leveling/images/9/95/System1.jpg (file page: https://solo-leveling.fandom.com/wiki/File:System1.jpg) · `Anime_System.png` 815x483: https://static.wikia.nocookie.net/solo-leveling/images/c/ce/Anime_System.png · `Anime_Episode_11_Picture_1.png` 1366x768: https://static.wikia.nocookie.net/solo-leveling/images/b/b1/Anime_Episode_11_Picture_1.png · `Anime_Episode_5_Jinwoo_increasing_his_stats.png` 1366x768 (stat allocation): https://solo-leveling.fandom.com/wiki/File:Anime_Episode_5_Jinwoo_increasing_his_stats.png (browse all in https://solo-leveling.fandom.com/wiki/System/Gallery) |
| Shows | The first two and the ep 11 frame are the images the wiki System page uses for the System interface (manhwa panel in portrait, anime window in landscape). Ep 5 frame is the allocation moment (text-confirmed: he "allocates his stat points, focusing on strength, agility, and perception"). Content per research: level, job, title, HP, MP, fatigue, five stats, points to spend. |
| Teaches | **Layout:** one column, label left and number right, stats stacked. Header tag on top. Level is the largest number. **Colour:** blue-white text on translucent navy, thin blue border, glow (confirm by eye). **Type:** wide, geometric sans with letter-spacing in caps for labels; tabular numerals for values (confirm by eye). **Border:** hairline, bracket corners. **Motion:** allocate with `[+]`, number ticks up, available points counts down. |

## 2. Quest window (Daily Quest)

| Item | Value |
| --- | --- |
| Frames | `DailyQuest1.jpg` 690x873: https://static.wikia.nocookie.net/solo-leveling/images/c/c7/DailyQuest1.jpg (page: https://solo-leveling.fandom.com/wiki/The_Preparation_To_Become_Powerful) · `Anime_Episode_3_Jinwoo_receives_a_quest_from_the_System.png` 1196x649: https://static.wikia.nocookie.net/solo-leveling/images/b/b3/Anime_Episode_3_Jinwoo_receives_a_quest_from_the_System.png |
| Shows | The quest window with title, Goal (100 push-ups, 100 sit-ups, 100 squats, 10 km run), reward and penalty lines (text-confirmed content from the wiki quest record: Goal / Time limit 24 hours / Reward / Penalty). Anime frame: the first moment he reads a quest in the hospital, window floating over the room "bathed in a futuristic blue hue" (text-confirmed, ep 3 summary). |
| Teaches | **Layout:** header, title, divider, goal rows with `current / target`, then Reward and Penalty blocks (the four-part card). **Colour:** same blue as status; penalty line is the only place red appears here (confirm by eye). **Type:** goal numbers big and monospaced; labels small caps. **Border:** double rule between goals and rewards. **Motion:** counters tick, complete rows turn glow-bright with a check; whole card stamps `QUEST CLEAR` on completion (fan-app pattern). |

## 3. Notification (toast / inbox message)

| Item | Value |
| --- | --- |
| Frames | `Anime_Episode_10_notification_for_job_change_quest.png` 1366x768: https://static.wikia.nocookie.net/solo-leveling/images/b/b4/Anime_Episode_10_notification_for_job_change_quest.png · `Anime_Episode_12_Jinwoo_finished_job_change_quest.png` 1366x768: https://static.wikia.nocookie.net/solo-leveling/images/a/a5/Anime_Episode_12_Jinwoo_finished_job_change_quest.png · `Alert.png` 514x514 (alert icon): https://static.wikia.nocookie.net/solo-leveling/images/d/d6/Alert.png |
| Shows | A small window in front of the character announcing an event (job change available; job change complete with survival time). Alert.png is the wiki's generic alert icon. The text pattern is `[ ... ]` stacked lines (text-confirmed in research 3.1). |
| Teaches | **Layout:** narrow, centred, 2 to 4 bracketed lines, no buttons on pure notifications. **Colour:** standard blue; header tag `NOTIFICATION`. **Type:** one size for body, regular weight, uppercase tag. **Border:** thin frame with brackets. **Motion:** appears mid-scene without dimming the background (the world stays visible); in our app use a top toast that does not steal focus during a set, with a log entry in the System inbox. |

## 4. Warning / Emergency / Penalty

| Item | Value |
| --- | --- |
| Frames | `PenaltyQuest1.jpg` 492x656 (the Survival quest window): https://static.wikia.nocookie.net/solo-leveling/images/c/cc/PenaltyQuest1.jpg · `Penalty_Zone.png` 713x981: https://static.wikia.nocookie.net/solo-leveling/images/4/49/Penalty_Zone.png · `Anime_Episode_3_Penalty_Zone.png` 1366x768: https://static.wikia.nocookie.net/solo-leveling/images/c/c8/Anime_Episode_3_Penalty_Zone.png · `Anime_Episode_12_Jinwoo_versus_penalty_zone_enemies.png`: https://static.wikia.nocookie.net/solo-leveling/images/8/89/Anime_Episode_12_Jinwoo_versus_penalty_zone_enemies.png · Red Gate (colour shift gate to red): `RedGate1.jpg`: https://static.wikia.nocookie.net/solo-leveling/images/f/f7/RedGate1.jpg and `Red_Gate_-_S2_Episode_13.png` 1920x1080: https://static.wikia.nocookie.net/solo-leveling/images/d/d7/Red_Gate_-_S2_Episode_13.png |
| Shows | The Survival window ("Survive for the allotted amount of time", 4 hours; text-confirmed). The Penalty Zone as a desert: wiki says no sun or stars, but ep 12 text says "blazing sun" and "red clouds", so the look varies. Emergency windows are red with an alert sound (fan-blog claim, nyaotaro, text-confirmed as claim only). |
| Teaches | **Layout:** same frame as quests plus a prominent countdown (`03:59:41`). **Colour:** swap the blue to red `#FF3B5C` for border, header and glow; keep body text white for AA contrast. **Type:** header `WARNING` or `PENALTY QUEST` in wide caps; countdown monospace. **Border:** thicker, pulsing every ~1.2 s (reduced-motion: static). **Motion:** 2 or 3 flicker frames on open, short alarm, screen-edge vignette; no shaking (accessibility). |

## 5. Level-up

| Item | Value |
| --- | --- |
| Frames | No single canonical level-up image was found by file name. Candidates: gallery pages https://solo-leveling.fandom.com/wiki/Episode_4/Gallery (ep 4 has the first level-ups in the Hapjeong dungeon; "His stats increase and his wounds are healed with each new level", text-confirmed) and https://solo-leveling.fandom.com/wiki/Episode_5/Gallery. `Anime_Episode_4_Hapjeong_Subway_Station.png`: https://static.wikia.nocookie.net/solo-leveling/images/6/62/Anime_Episode_4_Hapjeong_Subway_Station.png |
| Shows | The repeated "LEVEL UP" moment inside the dungeon fight: a small glowing banner and a chime in the middle of action (fan blog, text-confirmed as claim only). |
| Teaches | **Layout:** a compact banner, not a modal. Gold level numeral is our choice (fans use gold). **Colour:** blue banner with a flash of white; gold only on the number. **Type:** `LEVEL UP` wide caps, new level in the big monospace. **Motion:** burst + count-up under 600 ms, auto-dismiss in 2 s, tap for details; level-ups must never interrupt a set in progress (queue them). |

## 6. Job Change

| Item | Value |
| --- | --- |
| Frames | `JobQuest1.jpg` 719x714 (job quest window): https://static.wikia.nocookie.net/solo-leveling/images/d/d1/JobQuest1.jpg · `Class_Advancement_Quest's_Dungeon.png` 720x960: https://static.wikia.nocookie.net/solo-leveling/images/d/db/Class_Advancement_Quest%27s_Dungeon.png · `Anime_Episode_11_Job_Change_Quest_Dungeon.png` 1366x768: https://static.wikia.nocookie.net/solo-leveling/images/0/08/Anime_Episode_11_Job_Change_Quest_Dungeon.png · `Anime_Episode_10_Jinwoo_prepares_for_job_change_quest.png`: https://static.wikia.nocookie.net/solo-leveling/images/2/2f/Anime_Episode_10_Jinwoo_prepares_for_job_change_quest.png · `Anime_Episode_12_Jinwoo_finished_job_change_quest.png`: https://static.wikia.nocookie.net/solo-leveling/images/a/a5/Anime_Episode_12_Jinwoo_finished_job_change_quest.png |
| Shows | The quest text "The Job Change Quest will now begin. You will accumulate more points the longer you stay alive..." (text-confirmed), the dungeon entrance as a "massive purple void gate, crackling with lightning" (text-confirmed, ch 38 summary), the result window (lasted four and a half hours, necromancer offered, hidden class warning). |
| Teaches | **Layout:** three screens in order: (1) offer with rules listed, (2) in-progress timer or score, (3) result with class card plus Accept/Refuse. The refuse-confirm "this is a hidden class" step is a lovely pattern for our Job Change. **Colour:** purple enters here (void gate) as the first hint of shadow. **Motion:** gate opens (purple lightning) then the window opens. |

## 7. Shadow Extraction (ARISE)

| Item | Value |
| --- | --- |
| Frames | `Shadow_Extraction_Anime.gif` 600x338: https://static.wikia.nocookie.net/solo-leveling/images/2/23/Shadow_Extraction_Anime.gif · `Anime_Episode_12_Jinwoo_extracts_Igris_shadow.png` 1366x768: https://static.wikia.nocookie.net/solo-leveling/images/d/de/Anime_Episode_12_Jinwoo_extracts_Igris_shadow.png · stills `Sxe2.jpg` 766x607: https://static.wikia.nocookie.net/solo-leveling/images/6/6a/Sxe2.jpg and `SET2.jpg` 619x431: https://static.wikia.nocookie.net/solo-leveling/images/0/0e/SET2.jpg · gallery of shadows: https://solo-leveling.fandom.com/wiki/Shadows/Gallery |
| Shows | The command "Arise", the corpse's dark mana rising and forming a shadow soldier that kneels. Sequence from ep 12 text: two failures then success on the third attempt, then he names it (text-confirmed). Shadows are black with **glowing purple** accents (Bellion: glowing purple skin; Kaisel: glowing purple neck, wings, horns; text-confirmed). |
| Teaches | **Layout:** full-screen, centred silhouette, text at the bottom (`[Arise.]`, then the name typing in, then rank). **Colour:** `#7B2FF7` on near-black with smoke; gold only on the final rank badge. **Type:** single huge word `ARISE` in wide serif or spaced display. **Motion:** screen dims, vignette, smoke rises from below, silhouette resolves, particles; three-attempt pulse (2 fails, 1 success) as a pure cinematic. Reduced motion: static card. |

## 8. Inventory

| Item | Value |
| --- | --- |
| Frames | `Dungeon_Key_Iventory.png` 818x634: https://static.wikia.nocookie.net/solo-leveling/images/1/19/Dungeon_Key_Iventory.png · `Mana_Potion_Inventory.png` 604x448: https://static.wikia.nocookie.net/solo-leveling/images/d/db/Mana_Potion_Inventory.png · `Leather_Pouch_Inventory.png` 562x728: https://static.wikia.nocookie.net/solo-leveling/images/e/ed/Leather_Pouch_Inventory.png · `Demon_Castle_Key_Iventory.png` 838x516: https://static.wikia.nocookie.net/solo-leveling/images/6/6e/Demon_Castle_Key_Iventory.png · `Rune_-_Skill_-_Stealth_Inventory.png` 740x534: https://static.wikia.nocookie.net/solo-leveling/images/6/68/Rune_-_Skill_-_Stealth_Inventory.png · `Unknown_Black_Key_Iventory.png`: https://static.wikia.nocookie.net/solo-leveling/images/3/3f/Unknown_Black_Key_Iventory.png · item list page https://solo-leveling.fandom.com/wiki/Sung_Jinwoo/Items |
| Shows | The item detail window: icon, name, `Rarity`, `Type`, `Price`, description and stat lines (text-confirmed from the wiki item table: "Rarity: E", "Type: Key", "A Key that allows you to create an Instant Dungeon..."). Sets list their pieces and "Set bonus effect" lines. |
| Teaches | **Layout:** detail card is a vertical stack: icon (left) + name and rarity chip (right), type, stat rows, description in dim text, price line, action row (Use / Keep / Sell). **Colour:** rank letters are the rarity signal in canon; in ours use the PRD Common/Rare/Epic/Legendary colours and keep E to S for player ranks. **Border:** rarity colours the border and the glow of the icon cell. **Motion:** tap lifts the cell, others dim. |

## 9. Store

| Item | Value |
| --- | --- |
| Frames | `Shop.jpg` 718x630: https://static.wikia.nocookie.net/solo-leveling/images/3/3b/Shop.jpg (used on https://solo-leveling.fandom.com/wiki/System) · `Anime_Episode_12_Jinwoo_uses_shop_in_system.png` 1366x768: https://static.wikia.nocookie.net/solo-leveling/images/b/bd/Anime_Episode_12_Jinwoo_uses_shop_in_system.png · `Knight_Killer` item: https://solo-leveling.fandom.com/wiki/Knight_Killer |
| Shows | The System Store: a catalogue of purchasable items scaled to the Player's level, prices in gold (Knight Killer 2,800,000 gold, text-confirmed), consumables and weapons; "Blessed Random Box" and "Cursed Random Box" exist. Ep 12 shows him buying Mana potions in the Penalty Zone and finding Knight Killer. |
| Teaches | **Layout:** header with gold balance (top right), category tabs (Consumables, Keys, Cosmetics), a grid or list of item cards with price chips, a confirm sheet. **Colour:** gold for prices and balance; disabled items dim with the lock reason in the same System voice (`[Not available in this trial.]`). **Motion:** purchase = coin count-down, item flies into inventory icon. |

## 10. Extra frames worth a look

| Window | Frames | Why |
| --- | --- | --- |
| Demon Castle entry and floors | `Anime_Episode_7_Screenshot_14.png`, `_19.png`, `_29.png` (1920x1080): https://static.wikia.nocookie.net/solo-leveling/images/d/db/Anime_Episode_7_Screenshot_14.png , https://static.wikia.nocookie.net/solo-leveling/images/a/ac/Anime_Episode_7_Screenshot_19.png , https://static.wikia.nocookie.net/solo-leveling/images/0/0f/Anime_Episode_7_Screenshot_29.png ; `Demon_Castle_Key.png`: https://static.wikia.nocookie.net/solo-leveling/images/e/e9/Demon_Castle_Key.png (browse https://solo-leveling.fandom.com/wiki/Episode_7/Gallery) | Reward chain: secret quest, loot box, key, then the tower; the key is an inventory item with its own card. |
| Gate frames | https://solo-leveling.fandom.com/wiki/Gates , `HuntersGuildGate1.jpg`: https://static.wikia.nocookie.net/solo-leveling/images/1/11/HuntersGuildGate1.jpg | Blue gate for normal, red after sealing, purple void for instance dungeons. |
| Emergency quest (ep 6) | https://static.wikia.nocookie.net/solo-leveling/images/7/70/SoloLeveling_Anime_Episode_6_Picture_1.png (more in https://solo-leveling.fandom.com/wiki/Episode_6/Gallery) | The red window and the kill-or-be-killed prompt (text-confirmed as the Kill the Enemies quest). |
| Skill / rune | `Rune_-_Skill_-_Stealth.png` 550x768: https://static.wikia.nocookie.net/solo-leveling/images/2/25/Rune_-_Skill_-_Stealth.png | Skill window layout: skill name, type, description lines in bracket stack. |

All CDN URLs in this file were returned by the wiki's `imageinfo` API, so the paths are real; if one ever 404s, open the matching `File:` page on the wiki.

---

## 11. Solo Leveling: ARISE (game) references

Primary text sources: https://solo-leveling-arise.fandom.com/wiki/Game_Modes, /Gates, /Army_of_Shadows, /Tickets, /Items, /Armory, /Battle_Tier, /Lobby. For the frames themselves, open the pages' image galleries or the official store listing: https://play.google.com/store/apps/details?id=com.netmarble.sololv and https://apps.apple.com/us/app/id1662742277.

| Screen | What the text sources say it contains | What it teaches |
| --- | --- | --- |
| Lobby | Tiles: Information Desk, Activity Funds, Gate Status Board, Rankings, Play, Shop, Draw, Management; a lobby character | Hub with mode tiles and a status board. For us: the Quests tab grid with Daily, Dungeons, Tower, Raids. |
| Character / Hunters | Hunter list, rarity R, SR, SSR; a signature SSR weapon per hunter; bonds pages | Roster grid with rarity-framed cards. Cards: portrait, rarity border, level, element icons. |
| Army of Shadows | List of 15 named shadows with a Shadow's Authority line and an epithet (Igris "His First Shadow" etc.); 3 equipped; promote/upgrade/skills/armament | **Our Shadow Army screen**: gallery grid, tap for card with rank, passive, lore line, equip 3. |
| Armory | 18 slots in three bands "Armory of Perseverance / Change / Transcendence" | Equipment wall; progressive slot unlocks give a goal. |
| Battle Tier | One headline number from stacked sources | Our Power Level hero number. |
| Draw (gacha) | Rate-Up and Custom banners; tickets; R 90 / SR 8.8 / SSR 1.2; pity 80; 10-pull; Special Summon picks one of 15 | Reveal pattern: ticket spend, short build-up, card flip by rarity. **We reuse only the reveal pattern for loot drops, never the odds or spend.** |
| Gates | Blue, Purple, Green gate types; keys drain on success; sweep; mining | Pick a Gate from a map or list with keys count; Sweep for known content. |
| Inventory | Reviewer: "a mess ... you genuinely do not know what 99% of the things you are receiving even are" | Anti-pattern. Group by type, show source, one currency header. |

Rarity colours and the reveal animation could not be verified from text. Use PRD palette: Common grey/white, Rare blue, Epic purple, Legendary gold; verify what ARISE does by eye before copying any detail.

---

## 12. Fan recreations that read well (reference only; repos have no licence for reuse)

| Repo | What to look at |
| --- | --- |
| https://github.com/PranavKanungo1/Solo-leveling_UI | `style.css`: `.system-window` (blur 15, inset glow, top gradient line), `windowOpen` keyframes |
| https://github.com/kartikvaghela30/hunterlog | `style.css`: `glitch` and `arise-anim` keyframes, level-up toast easing, particle drift |
| https://github.com/tomalmandal/Level-up_system | `src/styles/global.css`: scanline overlay, rank glow keyframes |
| https://github.com/Doc36/the-system | `styles.css`: corner ticks via pseudo-elements, offline-friendly type stack |
| https://github.com/suadpllana/solo-leveling/pull/1 | Font list: Chakra Petch, Inter, JetBrains Mono, Orbitron; corner brackets, progress rings, reduced motion |

## 13. What the whole set teaches (cheat sheet for DESIGN.md)

- **Colour:** near-black navy base, one System blue family, red for danger, gold for reward, purple for shadow. Never more than two accent colours in one window.
- **Layout:** header tag, divider, content rows, footer actions; windows float over content (drop shadow + blur), they are not full-screen pages, except Level-up, ARISE and Penalty, which are full-screen events.
- **Type:** wide display caps for tags, readable sans for body, monospace tabular numerals for values.
- **Borders:** 1px blue line, corner brackets, faint inner grid, top highlight line.
- **Motion:** quick open (under 300 ms), typed text, glitch only for big moments, gold and purple reserved for the best events.
- **Sound:** short two-tone chime for open, alarm for penalty, rising arpeggio for level-up, deep pad for ARISE (our own synthesis; the show's exact sounds are not documented).
