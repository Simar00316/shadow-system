# Research: sound effects (replacement for the synthesised set)

Goal: replace the code-synthesised `public/sfx/*.wav` set (judged "very bad") with professionally made, legally shippable sounds that fit the Solo Leveling "System" character (design/DESIGN.md section 6). Machine-readable picks: `data/sfx-sources.json`. Candidate files (untrusted downloads, gitignored): `data/.cache/sfx-candidates/`, with pre-rendered, trimmed and gain-matched previews of every primary (`_preview/<name>.wav`) and alternate (`_preview/<name>__alt.wav`), plus `_preview/ambient-loop.wav`.

## Findings

**Caveat first.** Nobody has listened to these. Picks were made from file names and descriptions, durations, amplitude envelopes (onset count, attack/decay position), spectral centroid (bright vs dark, rising vs falling) and loudness measured with ffmpeg. Audition `_preview/` before shipping; the per-name alternates and the "other candidates" below are there for swaps.

Sources checked:

| Source | Result |
| --- | --- |
| Kenney (Interface Sounds, Digital Audio, UI Audio, Sci-fi Sounds, Impact Sounds, RPG Audio, Music Jingles) | All CC0 (License.txt in every zip). Downloaded without login from kenney.nl. Excellent clean UI material (open/close, select, glass ping, confirmation, error). Lacks cinematic/dark-fantasy weight, choir, brass and rank/loot-style reward stings. Digital Audio and Music Jingles are sfxr/NES-flavoured retro, so used only where nothing better fit (`rest-end`). Sci-fi Sounds has a sub boom (`lowFrequency_explosion_000/001`, centroid about 100 Hz) and low metal impacts (`impactMetal_*`, 75-380 Hz) usable as layers for boss/rank-up/arise. |
| Mixkit Sound Effects (mixkit.co) | Free licence that allows commercial use including games/apps, no attribution, no account. Direct WAV download URLs, professionally produced. Fills everything Kenney lacks: sci-fi bleeps, level-up/win stings, choir/bell blessings, trailer impacts, war horns and drums, dark ambience. Not CC0 (see licence notes). |
| Pixabay | Returns HTTP 403 to automated fetches (Cloudflare); not used. Its licence would be acceptable if the owner wants to hand-pick files in a browser. |
| Freesound | Downloads need a logged-in account; not used. |
| OpenGameArt | Nothing found that is both CC0 and cinematic. CC0 candidates seen but not downloaded: "Interface beeps" (bart), "Level up, power up, Coin get" (wobbleboxx), "7 Assorted Sound Effects (Menu, Level Up)" (Joth). The best thematic pack, "Sci-Fi UI SFX" (Urizen Composer), is OGA-BY 4.0 (attribution required), so skipped. |
| Sonniss GDC Game Audio Bundles | Licence is fine (royalty-free, commercial, no attribution) but the bundles are multi-GB archives; not downloaded. A good route later for a premium cinematic layer (arise/boss/rank-up). |

Shape of the pick: 7 sounds from one CC0 family (Kenney: tap, window-open, window-close, notify, quest-accept, rest-end, error) for consistency of everyday UI, and 14 from Mixkit for the reward and cinematic tier. The tiers come from different recordings, so the cinematic sounds are bigger and brighter in character than the UI ones; that is intended (escalation).

## Per-sound table

Gain is the suggested `gain_db` after trimming. Targets: sounds under 0.6 s peak at -3 dBFS and at most -12 LUFS; longer ones -16 LUFS integrated with sample peak at most -1.5 dBFS; ambient -20 LUFS. Trims, fades, measured post-gain loudness and full licence data are in `data/sfx-sources.json`. Durations are the trimmed lengths.

| Name | Primary (pack) | Dur (s) | Licence | Gain dB | Alternate | Character / notes |
| --- | --- | --- | --- | --- | --- | --- |
| `tap` | `select_001.ogg` (Kenney Interface Sounds) | 0.05 | CC0 | -1.9 | `click4.ogg` | Soft digital tick, 50 ms. |
| `window-open` | `maximize_002.ogg` (Kenney Interface Sounds) | 0.26 | CC0 | +0.6 | `2578.wav` | Rising digital swell, pairs with window-close. Alt is Mixkit "Opening software interface" (trim 0.36 s). |
| `window-close` | `minimize_002.ogg` (Kenney Interface Sounds) | 0.26 | CC0 | -2.0 | `drop_003.ogg` | Falling counterpart to window-open (same pack, same length). Alt is a softer low thump. |
| `notify` | `glass_004.ogg` (Kenney Interface Sounds) | 0.55 | CC0 | -1.7 | `confirmation_002.ogg` | Single glassy ping with shimmer, trimmed to 0.55 s. |
| `quest-accept` | `confirmation_004.ogg` (Kenney Interface Sounds) | 0.50 | CC0 | -2.1 | `253.wav` | Three-onset rising confirmation. Alt is Mixkit "Unlock game notification" (0-0.9 s). |
| `quest-clear` | `2021.wav` (Mixkit "Instant win") | 0.86 | Mixkit Free | -0.5 | `2063.wav` | Quick rising sparkle arpeggio. Alt is the longer "Completion of a level". |
| `set-logged` | `2868.wav` (Mixkit "Double beep tone alert") | 0.45 | Mixkit Free | -6.9 | `2520.wav` | Double beep; gain cut so it sits near -12 LUFS (tonal beeps are loud per peak). |
| `rest-warn` | `221.wav` (Mixkit "Positive interface beep") | 0.47 | Mixkit Free | -2.3 | `2519.wav` | Two soft low pips (low centroid about 1.1 kHz). |
| `rest-end` | `threeTone2.ogg` (Kenney Digital Audio) | 0.62 | CC0 | -3.0 | `2521.wav` | Bright triple beep; sfxr-like timbre, intentionally attention-grabbing. Alt is a very bright Mixkit bleep. |
| `level-up` | `2062.wav` (Mixkit "Game experience level increased") | 1.60 | Mixkit Free | -4.8 | `3164.wav` | Rising sparkle arpeggio with swell, 0.4 s fade-out. Alt is a shorter power-up. |
| `rank-up` | `2290.wav` (Mixkit "Epic orchestra transition") | 2.40 | Mixkit Free | -4.3 | `2901.wav` | Impact at t=0 (peak at 0.1 s) with dark orchestral bed, 0.6 s fade-out. Alt: "Epic movie impact". |
| `pr` | `226.wav` (Mixkit "Medieval show fanfare announcement") | 1.37 | Mixkit Free | -5.8 | `2016.wav` | Brass fanfare, first phrase only (0.13-1.5 s, 180 ms fade); cut point is a guess. Alt: "Video game win". |
| `loot-common` | `3212.wav` (Mixkit "Item chirp") | 0.33 | Mixkit Free | +3.5 | `powerUp2.ogg` | Single short pickup chirp. Alt: Kenney Digital Audio powerUp2. |
| `loot-rare` | `2013.wav` (Mixkit "Game loot win") | 0.85 | Mixkit Free | -2.0 | `3205.wav` | Bright multi-note sparkle. Alt: "Robot positive item acquired". |
| `loot-epic` | `2349.wav` (Mixkit "Video game magic item unlock") | 1.10 | Mixkit Free | -4.5 | `2066.wav` | Magical sparkle rise. Alt: "Video game treasure". |
| `loot-legendary` | `656.wav` (Mixkit "Choir bell bless") | 2.40 | Mixkit Free | -3.4 | `657.wav` | Choir pad with bell chimes; longest and richest of the loot set. Alt: "Choir harp bless". |
| `penalty` | `908.wav` (Mixkit "Facility alarm") | 1.60 | Mixkit Free | +5.5 | `1004.wav` | Alarm pulses trimmed to about 3 pulses (count not verified). Alt: "Critical alarm". |
| `arise` | `2291.wav` (Mixkit "Eerie trailer horn transition") | 2.80 | Mixkit Free | -1.6 | `1143.mp3` | Dark horn hit (peak at 0.04 s) with pad-like decay; no separate whoosh. Alt: "Cinematic whoosh deep impact" (source is MP3). Other candidates: 2630 "Terror sweep of darkness", 563 "Drum deep impact", 660 "Horror choir transition". |
| `boss` | `3111.wav` (Mixkit "Warfare horn trailer hit") | 1.80 | Mixkit Free | -5.0 | `2780.wav` | Low brass trailer hit. Alt: "Drums of war call" (drums); consider layering both. |
| `error` | `error_006.ogg` (Kenney Interface Sounds) | 0.26 | CC0 | -2.2 | `error_005.ogg` | Descending low buzz (centroid about 1.5 kHz falling to 0.2 kHz), trimmed to 0.26 s. |
| `ambient` | `2744.wav` (Mixkit "Tactical drone ambience") | 24.00 | Mixkit Free | -7.4 | `2510.wav` | Flat dark drone (centroid about 300 Hz). 24 s seamless loop via crossfade recipe below. Alt: "Cinematic suspense ambience". |

Lower-confidence picks (check by ear first): `set-logged` (described as "double beep", measured as one dominant onset), `penalty` (pulse count and dissonance unverified), `pr` (cut inside a longer fanfare), `arise` (horn/pad hit; layer Kenney Sci-fi Sounds `lowFrequency_explosion_000` under it for the sub drop, or try 2630 / 563 / 660), `boss` (horn only; layering with 2780 war drums or the Kenney sub boom would match "war drum hits + low brass" better) and `rest-end` (retro timbre).

Hardest names to fill well: `arise`, `boss`, `penalty` (trailer/alarm material trimmed to length, musical structure not verified). `ambient` is filled but needs the crossfade below.

## Processing recipe

Per sound: `ffmpeg -ss <start_s> -to <end_s> -i <file> -af "afade=t=in:d=0.002,afade=t=out:st=<end-start-fade_out_s>:d=<fade_out_s>,volume=<gain_db>dB" -ar 22050 -ac 1 <name>.wav`. Mixkit files are 44.1 kHz stereo 16-bit WAV; mono at 22.05 kHz is fine for most, but keep 44.1 kHz for choir/bell/brass if 22.05 kHz sounds dull. Kenney files are .ogg and must be converted (iOS Safari does not play Ogg Vorbis in older versions).

Ambient seamless loop (source `mixkit/2744.wav`, 54 s, flat envelope):

```
ffmpeg -ss 10 -t 25 -i mixkit/2744.wav -filter_complex "[0:a]atrim=0:1,asetpts=PTS-STARTPTS[h];[0:a]atrim=24:25,asetpts=PTS-STARTPTS[t];[0:a]atrim=1:24,asetpts=PTS-STARTPTS[b];[t][h]acrossfade=d=1[x];[x][b]concat=n=2:v=0:a=1,volume=-7.4dB" ambient.wav
```

Result is exactly 24.000 s (rendered as `_preview/ambient-loop.wav`).

## Licence notes (for docs/asset-sources.md)

- **Kenney** Interface Sounds, Digital Audio, UI Audio: CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/. Created and distributed by Kenney (www.kenney.nl); credit not required. Pages: https://kenney.nl/assets/interface-sounds, https://kenney.nl/assets/digital-audio, https://kenney.nl/assets/ui-audio. Files used: `select_001`, `maximize_002`, `minimize_002`, `glass_004`, `confirmation_004`, `error_006` (Interface Sounds) and `threeTone2` (Digital Audio). Alternates: `click4` (UI Audio), `drop_003`, `confirmation_002`, `error_005` (Interface Sounds), `powerUp2` (Digital Audio).
- **Mixkit** Sound Effects Free License, https://mixkit.co/license/#sfxFree. The licence text is loaded dynamically in a modal and could not be fetched verbatim by script, so the owner should read it once in a browser. From Mixkit's own pages: free for commercial and non-commercial projects (games and apps included), no attribution, no sign-up. The restriction that matters: items may not be resold, sublicensed or redistributed on their own in original form (embedding in a product is fine, offering a sound pack is not). Consequences: do not publish the trimmed WAVs as a standalone pack, keep the repo private or ship them only inside the built app, and keep the per-file record. Mixkit has no per-item page, so `data/sfx-sources.json` stores the category URL, item id/title and the exact `download_url`. Primary files (id, title): 221 Positive interface beep, 908 Facility alarm, 2013 Game loot win, 2021 Instant win, 2062 Game experience level increased, 226 Medieval show fanfare announcement, 2290 Epic orchestra transition, 2291 Eerie trailer horn transition, 2349 Video game magic item unlock, 2744 Tactical drone ambience, 2868 Double beep tone alert, 3111 Warfare horn trailer hit, 3212 Item chirp, 656 Choir bell bless. Alternates are in the JSON.
- Fallback to avoid Mixkit entirely: Kenney `confirmation_*`, `maximize_*`/`minimize_*`, Digital Audio `powerUp*`/`phaserUp*`, Music Jingles (HIT/STEEL), plus Sci-fi Sounds `lowFrequency_explosion_*` and `impactMetal_*` for sub drops. The reward and dark-fantasy tier would then sound retro and thin; a Sonniss bundle or a purchased pack is the next step.

## Sources

- https://kenney.nl/assets/interface-sounds
- https://kenney.nl/assets/sci-fi-sounds
- https://kenney.nl/assets/digital-audio
- https://kenney.nl/assets/rpg-audio
- https://kenney.nl/assets/impact-sounds
- https://kenney.nl/assets/ui-audio
- https://kenney.nl/assets/music-jingles
- https://creativecommons.org/publicdomain/zero/1.0/
- https://mixkit.co/free-sound-effects/ (categories game, technology, transition, warfare, instrument; tag pages notification, alarm, bell, choir, magic, impact, drum, win, interface, ambience)
- https://mixkit.co/license/
- https://opengameart.org/content/interface-beeps, https://opengameart.org/content/level-up-power-up-coin-get-13-sounds, https://opengameart.org/content/sci-fi-ui-sfx (seen in search, not downloaded)
- https://www.sonniss.com/gameaudiogdc (not downloaded)
