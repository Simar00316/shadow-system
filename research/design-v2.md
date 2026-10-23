# R8 — Design v2: from "themed" to "premium"

Status: research note, to be implemented directly. Supersedes the visual parts of `design/DESIGN.md` §2, §4, §5 once adopted (tokens and motion table below replace those rows). Colour meaning (§3) is unchanged.

Owner brief: "the theme is correct but the designing is bad; it should look like a billion-dollar app; add glitch effects/animations when a System screen appears or when you tap it." Hard constraint: Lighthouse mobile >= 90.

Source tags: **[V]** verified in a page I opened this session, **[S]** from a search snippet only (page not opened or blocked), **[D]** our own design decision / opinion, **[U]** unverified, needs a device test. URLs are in the Sources section at the end as S1..S27.

---

## 0. What I checked

- Read `design/DESIGN.md`, `src/styles/tokens.css`, `src/ui/SystemWindow.tsx`, the `.sys-window` rules in `src/styles/index.css`, and the screenshots `00`–`05` in `scratchpad/ui-before/` (note: `00-awakening.png` is actually the install gate).
- Owner diagnosis confirmed by the screenshots, plus four problems you did not list, **two of which are performance bugs**:
  1. `.sys-window` has `backdrop-filter: blur(12px) saturate(120%)` on **every** window (3 to 6 per screen). Over a near-flat `#05070F` background the blur is also invisible, so we pay GPU cost for nothing.
  2. `SystemWindow` animates `filter: blur(6px)` to `0` on every mount. Safari has an open bug where a filtered ancestor is not applied while a descendant animates opacity/transform/filter (S12), and animating filter on large areas is the worst case on iOS.
  3. Each window has four `.sys-corner` elements with `filter: drop-shadow` (up to 24 filter layers on a screen).
  4. The scanline overlay is global and permanent: it lowers text crispness everywhere ("dirt on glass") while adding no hierarchy.
  5. The screen title block repeats itself: `[ STATUS ]` + `STATUS` tag, `[ QUESTS ]` + `QUEST LOG`, `[ SYSTEM ]` + `SYSTEM`.
  6. 0% rings (Diet) render as dead grey circles with `0 / 2630`; this reads as "empty/broken", not "full tank".
- What I could **not** verify, said plainly: no source describes the *Solo Leveling: ARISE* UI in detail (search returned only a fan concept portfolio and a Twinfinite impressions piece); no usable breakdowns for Honkai: Star Rail's UI art direction (only a usability-heuristics paper and fan asset packs), Apple Fitness+, or Strava; GDC's Cyberpunk UI talk is paywalled. For those I mark claims **[D]** and I recommend the owner puts 6 to 8 of their own anime/ARISE frame grabs in `design/references/` (the catalogue already exists) and we compare against them at the end of the milestone.

---

## 1. Findings

### 1.1 Premium health/fitness apps (what they actually do)

| # | Finding | Evidence |
| --- | --- | --- |
| F1 | **One answer per screen, then progressive disclosure.** WHOOP's overview is three tiles (Recovery, Strain, Sleep) with "no graphs, no charts, no noise. Just the answer"; each tile is "a doorway, not a destination"; deeper tiers are separate screens reached by deliberate taps, not accordions. Oura's 2025 redesign shows one daily insight on Today, with three data-viz levels: at-a-glance (rings, bars, colour), focused metrics, exploratory. | S1 [V], S2 [V] |
| F2 | **Size alone signals priority.** WHOOP's recovery score is about 72 pt-equivalent ("readable from arm's length") while supporting copy stays small. Destiny's UI states the same rule: "the bigger the text, the more important the information". | S1 [V], S7 [V] |
| F3 | **A narrow, semantic palette.** WHOOP: green = ready, yellow = middle, red = strained, "every hue carries meaning"; Oura: "one colour system across the product so colours carry consistent meaning". We already have this (blue/purple/red/gold/green) but spend blue on everything, so blue carries no meaning. | S1 [V], S2 [V] |
| F4 | **Information changes with context.** Gentler Streak's home reorders by time of day (morning: sleep and wellbeing; later: logged activities), and went from four tabs to three because "not everyone was discovering the health features"; the rule they cite is "how would we design it as 1.0 today". Oura's colours shift with biometrics. | S3 [V] |
| F5 | **Transitions keep spatial context.** WHOOP: "transitions between tiers use smooth animations that maintain spatial context". | S1 [V] |
| F6 | **Motion is brief, purposeful, cancellable, and paired with haptics/audio.** Apple HIG: "aim for brevity and precision in feedback animations", "generally avoid adding motion to UI interactions that occur frequently", "let people cancel motion", supplement with haptics and audio. Duolingo pairs animation, sound and haptics on small moments, treats milestones as video-game "power ups" and says "timing is everything", iterating the rhythm through multiple passes. | S6 [V], S25 [V/S] |
| F7 | **Materials create hierarchy, not decoration.** Apple's Materials page: a material "creates a sense of depth, layering and hierarchy between foreground and background"; "don't use Liquid Glass in the content layer"; use it "sparingly", only for the functional layer (tab bars, sidebars); thicker materials for text-heavy surfaces; use vibrant (brighter) foreground colours on top of materials for legibility. | S5 [V] |
| F8 | **Type hierarchy is a ladder of 8 to 10 roles with weight contrast, not letter-spacing.** iOS default (Large) sizes: Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17 semibold, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 12/11; default 17 pt, minimum 11 pt. Hierarchy is carried by size and weight; tracking is tuned per size (large = tighter, small = looser). | S4 [V] |

### 1.2 Sci-fi HUD games

| # | Finding | Evidence |
| --- | --- | --- |
| G1 | **Persona 5: the selected item gets bigger and gets colour; non-interactive info sits in the same stack but is visibly inert.** Battle UI is tiered Core (actions around the active character), Supportive (HP/SP, enemy name), Extraneous (party chatter). Button colours mirror controller colours. The menu type is chosen to "scream this is our style" and is used for **a few big items**, not everywhere. | S8 [V] |
| G2 | **Destiny: colour flashes at the periphery "yell at the player without being too noisy"; hover/cursor slows over targets; layers parallax subtly ("brevity is the soul of wit"); items map to real-world metaphors so complexity is chunked.** Colour = expandability ("colour equals expandability or more info"). | S7 [V] |
| G3 | **Cyberpunk 2077: the diegetic UI is text-first, low-fi, with glitch / reboot / document-scan animations; menus (upgrade screen) are *sparse and functional* with no decorative extras.** Glitch lives in *transitions and state changes*, while the data surfaces stay clean. GDC abstract: thousands of independent UI instances were fitted to performance budgets, i.e. the UI is engineered to be cheap. | S9 [V], S10 [S] |
| G4 | **ARISE and Honkai: Star Rail: cannot cite.** ARISE's own lobby/menu structure is in R1 §11 (tiles per mode + status board); R1 flags the inventory as the cautionary tale ("a mess", unlabeled currencies). | S22 [V] |

### 1.3 The Solo Leveling System window

- **Verified (R1 §12.1, S22/S24):** "a blue holographic screen that appears anywhere and anytime", bluish and semi-transparent, English text, red pop-ups for emergency quests, glowing LEVEL UP text with a chime; director wanted live-action framing, so windows are composited like real AR layers (depth, bloom, slight blur). Contextual panels: a health gauge only while injured; metadata labels floating over creatures; the screens are touchable.
- **New, secondary source [S], blocked from direct fetch (HTTP 403):** a GamePro piece says the anime first shows the System as a **black window with blue text** while the manhwa uses a **blue window with white text**, and after the class change the anime window takes a **purple tint** (manhwa: black with yellow text). **Take:** in the anime the *fill is dark and the light lives in the edge and the type*. Our current panels are the opposite: a flat navy fill with a lot of equal-weight outline. This is the single most important look correction: **dark glass, bright edges, glowing text.**
- **Not verifiable:** the open/close transition, timings and sound of the anime windows (R1 §12.4 already says so). The motion spec below is ours.
- **Fan recreations converge on the same ingredients** (R1 §12.2): 1-px edge, top highlight line, corner ticks, grid, scanlines, open animation 0.5 s (too slow for us), glitch keyframes at 96 to 98% of a loop with `text-shadow: 3px 0 red, -3px 0 cyan; skewX(2deg)`. Every fan build uses *all* ingredients on *every* panel, which is exactly why they look like fan builds. Show-accurate restraint = use the chrome **once**, on the System speaking.

### 1.4 Glitch effects on iPhone

| # | Finding | Evidence |
| --- | --- | --- |
| P1 | The canonical CSS glitch is: one element with `data-text`; `::before/::after` copy it via `content: attr(data-text)`, offset left/right with red/blue `text-shadow`, each clipped to a horizontal band with `clip-path: inset(...)` whose top/bottom insets jump through keyframes at two different periods; `steps()` timing gives the digital "snap". | S14 [V] |
| P2 | Only `opacity` and `transform` stay on the compositor ("to keep animations on the compositing stage"); `will-change` should be added just before and removed after, not left on; extra layers cost memory. | S11 [V] |
| P3 | **`clip-path` animation is not compositor-accelerated in WebKit** (Simon Fraser, 2019: "clip-path changes don't trigger repaints, but we don't run them in the compositor"); WebKit bug 185816 is still NEW (Jan and Jun 2026 comments mention in-progress work). So clip-path = main-thread style updates per frame but **no repaint** [per the WebKit comment]. Fine on small elements for <= 400 ms; do not run it on many large layers at once. | S13 [V] |
| P4 | **Safari bug 219729 (open since 2020, still reproduced on Safari 18.5):** a `filter` on an ancestor is not applied while a descendant animates `transform/scale/rotate/translate/opacity/filter/backdrop-filter` (also with `transition` or `will-change`), and expensive filters still cost paint/scroll performance when not visible. Workaround: animate a custom property. **Rule: never put `filter`/`backdrop-filter` on a parent of something that animates.** | S12 [V] |
| P5 | **SVG `feTurbulence` + `feDisplacementMap` is the "real" tear effect but is the most dangerous option on iOS:** a GreenSock thread reports it smooth on desktop, sluggish on iOS, sometimes reloading or crashing the tab when left running; "SVG filters are pretty horrific for performance"; advice: short bursts, small areas, `numOctaves` <= 3. Another author says noise filters "kill performance in all versions of Safari". | S15 [S], S26 [S] |
| P6 | `backdrop-filter` cost scales with blur radius and area; one project reported blank scrolling on iOS Safari after many elements became separate GPU layers, fixed by removing backdrop-filter from scroll-container children. Anecdote, but it matches our situation (every panel). | S27 [S] |
| P7 | Motion library: with `MotionConfig reducedMotion="user"` transform/layout animations are disabled and opacity/colour keep animating, i.e. the "fade only" fallback comes for free; `useReducedMotion()` for per-component fixes. Independent transforms are hardware accelerated; animating a CSS variable "always triggers paint". | S16 [V], S17 [V] |
| P8 | WCAG 2.3.1: nothing flashes more than three times in any one second (area threshold 0.006 sr, about 341 x 256 CSS px). Our flicker (2 dips in 380 ms, on one panel) must stay under that, and glitches must be rate-limited. | S20 [V] |
| P9 | `prefers-reduced-transparency` is non-Baseline ("limited availability"), so it cannot be the only gate; the app already has its own in-app "Reduce motion" attribute (`:root[data-reduce-motion='true']`), keep using it. | S19 [V] |
| P10 | iPhone web haptics: `navigator.vibrate` is ignored on iOS; the working hack is a hidden `<label><input type="checkbox" switch></label>` that is `.click()`ed (Safari 17.4+ switch control fires system haptics); `ios-haptics` wraps it (`haptic()`, `haptic.confirm()`, `haptic.error()`); fragile, "might stop working if Apple changes it". Use as best-effort, never as the only feedback. | S21 [V] |

### 1.5 Lighthouse

- Weights: TBT 30%, LCP 25%, CLS 25%, FCP 10%, SI 10% (S18 [V]). LCP "good" <= 2.5 s.
- **LCP ignores elements with `opacity: 0`** (Chromium) and text in a web font during the font-block period "isn't considered rendered" (S28 [V]). Consequences for us: (1) any entrance animation that starts at `opacity: 0` delays LCP by its duration; skip entrance animation for the first paint of a cold load; (2) web fonts must not block: `font-display: swap`, preload the 2 or 3 faces used above the fold, and a metric-matched fallback (so swap does not shift layout: CLS 25%).

---

## 2. What we take

1. **One hero per screen** (F1, F2, G1). Hero = largest type, the only panel with full chrome and glow, sits in the top third. Everything else is demoted to "supportive" or "extraneous" (Persona's three tiers).
2. **Disclose, do not list** (F1, F4). Locked / rarely-used content collapses to single-line rows; tiles become *doorways* with one live value each.
3. **Dark glass, bright edges, glowing type** (1.3, F7). Fill is dark and quiet; light comes from a 1-px rim, a top highlight, and the text itself. Vibrant (brighter) foreground on the dark material (F7).
4. **Blue means "System speaking"** (F3). Use neutral steel-grey-blue for ordinary UI chrome and reserve saturated `--system-blue` + glow for: the hero, active nav, primary CTA, focus. Gold = reward/level, red = penalty, green = cleared, purple = shadows (unchanged).
5. **Glitch lives in transitions and state changes, data surfaces stay clean** (G3). Glitch on entrance, on navigation/primary taps, on state changes (cleared, warning); never on steppers, set logging or while typing.
6. **Motion is short, cancellable, paired with sound and haptics** (F6): entrance <= 380 ms, tap <= 170 ms, a tap during an animation completes it.
7. **Type contrast through size and weight, tracking only on <= 13 px caps** (F8).
8. **Cheap depth**: ambient light gradient on a single fixed layer, translucent gradient fills, 1-px rims, one soft glow on the hero; no per-panel blur (P4, P6).
9. **Sparse and functional** menus (G3 upgrade screen; ARISE's inventory as the anti-pattern, G4).

## 3. What we do better

- Other fan builds put the full frame (brackets + grid + scanlines + tag + glow) on every panel. We use **three panel grades** so the System's frame is *earned* (only when the System is speaking: hero, alerts, rewards). Everything else is quiet.
- A **rule-based shape language**: *angular = the System speaking* (hero, alert, reward windows, radius 4 px + brackets); *rounded = app content* (cards and controls, radius 12/10 px). Players learn which is which.
- **0% is a state, not a bug**: rings and bars are designed at 0 (tick track, glowing start pip, "remaining" framing).
- **Remaining, not consumed**: Diet and quests show "what is left to clear" (a quest-giver's viewpoint); numbers go gold when complete.
- **Accessibility parity**: every glitch has a reduced-motion twin; flashes stay under WCAG 2.3.1; sound + haptic twin for every visual.
- **Performance budget as a design rule**: zero `backdrop-filter` and zero animated `filter` in the app (current code has both on every window).

---

## 4. Concrete spec

### 4.1 Type scale (replaces DESIGN.md §2 token table)

Rules: Orbitron is **demoted** to numerals-and-moments (level, rank letter, countdown hero, LEVEL UP / ARISE / WARNING titles, Awakening). Everything else is Rajdhani (UI), Inter (reading), JetBrains Mono (numbers). Adjacent display steps differ by >= 1.25x; hero numeral : body >= 3.5 : 1 (cf. WHOOP 72 pt vs small support text, S1).

| Token | Font | Size / line | Weight | Tracking | Case | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `--t-display` | Orbitron | 56 / 56 | 900 | 0.01em | — | level numeral, rank letter on Awakening. One per screen max |
| `--t-hero-num` | JetBrains Mono | 44 / 44 | 700 | -0.02em | — | ring centre, countdown, workout kcal; `font-variant-numeric: tabular-nums` |
| `--t-screen` | Rajdhani | 32 / 34 | 700 | 0.01em | upper | screen title (only if the screen needs one; Status does not) |
| `--t-moment` | Orbitron | 24 / 28 | 700 | 0.04em | upper | hero panel name (workout name), LEVEL UP etc. Wide face, used rarely |
| `--t-h2` | Rajdhani | 20 / 24 | 700 | 0.03em | upper | section / card title |
| `--t-row` | Inter | 16 / 22 | 500 | 0 | sentence | row primary text |
| `--t-body` | Inter | 16 / 24 | 400 | 0 | sentence | paragraphs (>= 16 px: no iOS input zoom) |
| `--t-num-lg` | JetBrains Mono | 28 / 32 | 700 | -0.01em | — | stat values, steppers |
| `--t-num` | JetBrains Mono | 16 / 20 | 600 | 0 | — | row values (right aligned) |
| `--t-label` | Rajdhani | 13 / 16 | 600 | 0.10em | upper | field labels, section headers (dim colour) |
| `--t-micro` | Rajdhani | 11 / 12 | 700 | 0.16em | upper | tags, units, nav labels (11 = Apple's minimum, S4) |
| `--t-system` | Inter | 15 / 22 | 500 | 0.01em | sentence in `[ ]` | System messages (unchanged) |

Changes vs today: `--type-title` 22 px / 0.08em / Orbitron removed (the repeated "QUEST LOG", "DUNGEON OF THE DAY" in wide Orbitron are why every screen shouts); `--type-tag` 0.25em -> 0.16em and only on hero panels. Colour roles: primary `--text`, secondary `--text-dim`, **tertiary new `--text-faint: #55658A`** (>= 3:1 on `--bg`, only for decorative ticks and disabled), hero numerals may use `--text` with `--glow-text`.

Fonts (Lighthouse): load Orbitron **700 and 900 only** (drop 500), Rajdhani **600 and 700** (drop 500), Inter variable, JetBrains Mono variable; all `latin` subset only, `font-display: swap`; preload the three used above the fold (Rajdhani 700, JetBrains Mono variable, Inter variable) with a `size-adjust`/`ascent-override` fallback face so swap does not move layout [D, measure CLS].

### 4.2 Spacing and layout (4-px base, unchanged tokens + roles)

- Gutter 16. Top: `max(env(safe-area-inset-top), 12px)`; **screen header is 44 px** (no big title unless the screen needs one).
- Between sections 24; between cards inside a section 12; hero margin-bottom 20.
- Card padding 16; hero padding 20; row min-height 52 (tap target >= 48).
- Thumb-zone rule: the primary action of every screen sits in the bottom 40% (Train CTA, Diet "Log food", Quest "Start").
- Bottom nav 64 + safe-area; content `padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 24px)` (also fixes the clipped last-row issue visible in every screenshot, where the last panel slides under the nav with no fade).
- Add a **scroll-edge fade**: `.screen::after { position: fixed; bottom: calc(var(--nav-h) + env(safe-area-inset-bottom)); height: 24px; background: linear-gradient(transparent, var(--bg)); pointer-events: none }` so rows dissolve into the nav instead of being cut (static gradient, no blur).

### 4.3 Depth, light and glow tokens (add to `tokens.css`)

Light source: **top centre**. Rims and highlights are on top edges, shadows below, always.

```css
:root {
  /* surfaces (dark glass: quiet fill, light in the edge) */
  --surface-1: linear-gradient(180deg, rgb(20 34 62 / .74) 0%, rgb(9 16 32 / .80) 100%);
  --surface-2: linear-gradient(180deg, rgb(28 48 88 / .82) 0%, rgb(13 23 46 / .88) 100%); /* pressed / selected */
  --surface-hero: linear-gradient(180deg, rgb(24 44 84 / .70) 0%, rgb(8 15 32 / .82) 100%);
  --surface-flat: rgb(255 255 255 / .03);                                                 /* borderless rows */

  /* edges */
  --edge:      rgb(120 170 255 / .14);   /* card hairline */
  --edge-hi:   rgb(140 205 255 / .42);   /* hero hairline */
  --rim-top:   inset 0 1px 0 rgb(180 220 255 / .12);
  --rim-bot:   inset 0 -1px 0 rgb(0 0 0 / .45);

  /* elevation = rim + short contact shadow; NO blur filters */
  --elev-card: var(--rim-top), var(--rim-bot), 0 1px 0 rgb(0 0 0 / .6), 0 12px 24px -14px rgb(0 0 0 / .9);
  --elev-hero: var(--rim-top), var(--rim-bot), 0 0 0 1px rgb(92 200 255 / .30), 0 0 36px -8px rgb(47 168 255 / .50), 0 18px 32px -16px rgb(0 0 0 / .9);
  --elev-alert:  0 0 0 1px rgb(255 59 92 / .45), 0 0 32px -8px rgb(255 59 92 / .55);
  --elev-reward: 0 0 0 1px rgb(255 201 74 / .45), 0 0 32px -8px rgb(255 201 74 / .50);
  --elev-shadow: 0 0 0 1px rgb(167 123 255 / .45), 0 0 32px -8px rgb(123 47 247 / .60);

  /* text glow: small elements only */
  --glow-text: 0 0 12px rgb(92 200 255 / .55);
  --glow-gold: 0 0 14px rgb(255 201 74 / .45);

  /* radius: angular = System speaking, rounded = app */
  --r-hero: 4px;  --r-card: 12px;  --r-ctl: 10px;  --r-chip: 999px;
}
```

**Ambient light (one fixed static layer, composited once, replaces the global scanlines and every panel's blur):**

```css
.ambient { position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(120% 55% at 50% -8%, rgb(47 168 255 / .22), transparent 62%),   /* top key light */
    radial-gradient(70% 40% at 100% 100%, rgb(123 47 247 / .10), transparent 70%),  /* purple bounce, bottom right */
    var(--bg); }
.ambient::after { /* pre-rendered 96px noise tile, ~6 kB, hides gradient banding */
  content: ""; position: absolute; inset: 0; opacity: .04; background: url(/img/noise-96.webp) 0 0 / 96px; }
```

Because panel fills are 74 to 82% opaque, the key light shows through and shifts as panels scroll over it: it reads as glass **without `backdrop-filter`**. Noise: generate the tile once with a script (or `feTurbulence` rendered offline) and ship it as a static WebP; do not run `feTurbulence` at runtime on Safari (S26 [S]). Reduced-transparency: `@media (prefers-reduced-transparency: reduce)` makes fills opaque (`--surface-1: #0B1426`) and hides the noise.

**Scanlines/grid** move *inside the hero only*: `::before` on `.panel-hero` with the existing `--scanlines` at `.035` alpha and the 28-px grid at `.03`. Delete the global `.scanlines` overlay.

### 4.4 Panel variants (replace the single `SystemWindow` with a family)

| Variant | Class | Fill / edge / shadow | Chrome | Tag/title | Per screen |
| --- | --- | --- | --- | --- | --- |
| **Hero** (System speaking) | `.panel-hero` | `--surface-hero`, 1 px `--edge-hi`, `--elev-hero`, radius `--r-hero` | **two** brackets only (top-left and bottom-right, 12 x 12 px, 1.5 px, `--glow`, **no `filter`**: draw with two `linear-gradient` backgrounds), 1-px top highlight line, inner scanlines + grid at .03 | optional `--t-micro` tag, no title duplicate | exactly 1 |
| **Card** | `.panel` | `--surface-1`, 1 px `--edge`, `--elev-card`, radius `--r-card` | none | `--t-h2` title row if needed; no tag pill | many |
| **Section** (borderless list) | `.section` | none; rows use `--surface-flat` on press only | header = `--t-label` dim text + optional right action; rows separated by 1-px `rgb(255 255 255 / .06)` hairline inset 16 | — | many |
| **Group** (inset list) | `.group` | like Card, rows inside with hairline dividers, `chevron` right | for System menu, Settings | `--t-label` header above | many |
| **Alert / Reward / Shadow** | `.panel-hero[data-variant]` | swap colour tokens (`--elev-alert` etc.) | pulse: box-shadow opacity via `::after` opacity animation, not box-shadow animation | tag `WARNING` / `REWARD` / `ARISE` | at most 1 |

Corner brackets without `filter`:

```css
.panel-hero::before { content: ""; position: absolute; inset: -1px; pointer-events: none;
  background:
    linear-gradient(var(--glow), var(--glow)) top left / 12px 1.5px no-repeat,
    linear-gradient(var(--glow), var(--glow)) top left / 1.5px 12px no-repeat,
    linear-gradient(var(--glow), var(--glow)) bottom right / 12px 1.5px no-repeat,
    linear-gradient(var(--glow), var(--glow)) bottom right / 1.5px 12px no-repeat; }
.panel-hero::after { /* top highlight */ content: ""; position: absolute; top: 0; left: 12%; right: 12%; height: 1px;
  background: linear-gradient(90deg, transparent, rgb(190 235 255 / .8), transparent); }
```

(This removes 4 elements and 4 `drop-shadow` filters per window; the `--elev-hero` glow already carries the bloom.)

Controls:

- **Primary button**: height 52, radius `--r-ctl`, fill `linear-gradient(180deg, #4DB8FF, #2090E8)`, `--rim-top` white at .35, bottom shade, text `--text-on-accent` Rajdhani 700 17/20 .04em, **sheen** = a 40%-wide diagonal highlight pseudo-element that translates once across on mount and on press (transform only). Remove the horizontal scanline stripes on the button today.
- **Secondary**: `--surface-1` + `--edge-hi` hairline + `--text`. **Ghost**: text only, `--system-blue`.
- **Chips**: height 28, radius pill, `--t-micro`, fill `rgb(47 168 255 / .12)`, 1 px `rgb(47 168 255 / .30)`; colour variants only for meaning (gold/red/green/purple).
- **Icons**: 1.75 px stroke at 22 px (nav: 24), `round` caps; icon sits in a 36-px **icon well** (radius 10, `--surface-2`, rim) when used in lists; active nav icon gets a 0.15-alpha duotone fill. No icon above a text label in a tile grid (tiles become rows or chips).
- **Press state** (all tappables): `scale: .975` (individual property) + `background` to `--surface-2`, 80 ms in, 200 ms out with `cubic-bezier(.2,.9,.3,1.25)`; `-webkit-tap-highlight-color: transparent; touch-action: manipulation`.

### 4.5 Progress visualisation that looks good at 0%

**Ring** (SVG, 180 to 220 px for hero, 56 to 72 px small):

1. Track: stroke = the ring's colour at **12% alpha** (not neutral grey), 10 px wide.
2. **Tick ring**: 60 short ticks outside the track (`stroke-dasharray: 1 5.8` on a thin circle, alpha .22). This gives the ring a "gauge" structure at 0%.
3. Fill: `stroke-linecap: round`, `linearGradient` blue -> glow (calories), plus an under-stroke 4 px wider at .22 alpha for a glow with **no `filter`**.
4. **Start pip**: a 10-px circle at 12 o'clock in the ring colour with `box-shadow` glow; visible at 0%, and it rides the stroke head while filling (rotate the group with `transform`).
5. Centre: **remaining** value in `--t-hero-num` ("2,630") + `--t-micro` "KCAL LEFT". At 100%: ring turns gold, centre shows a check and "CLEARED". Over target: a second thin lap in `--amber`.
6. Animate fill once on mount, 700 ms ease-out (`stroke-dashoffset`; paint cost on a small SVG is fine); count the numeral with rAF over the same 600 ms.

**Bars**: 8-px track at 12% tinted alpha, 10 segment ticks (a `repeating-linear-gradient` mask, 1-px dark lines every 10%), gradient fill + a moving sheen only on gain (translateX, once), pip at 0. XP bar adds the next-level label right: "280 to LV 3".

### 4.6 Motion timings (replaces DESIGN.md §5 rows for window open, press, page; others unchanged)

| Effect | Duration | Easing | Props | Reduced-motion fallback |
| --- | --- | --- | --- | --- |
| Press down / up | 80 / 200 ms | ease-out / `cubic-bezier(.2,.9,.3,1.25)` | `scale`, background | none (instant bg) |
| **System window materialise** (4.7a) | 380 ms, stagger 40 ms x <= 5 | `--ease-out` | opacity (stepped), `translate`, clip-path, beam `transform` | fade 120 ms |
| **Tap glitch** (4.7b) | 170 ms, <= 1 per 700 ms | `steps(1, end)` | `translate`, `transform: skewX`, opacity | none |
| **Route glitch** (4.7c) | 240 ms beam + 260 ms panels | `cubic-bezier(.3,0,.2,1)` | transform, opacity, clip-path (title only) | fade 120 ms |
| Window close | 120 ms | ease-in | opacity, `scale: .985` | fade 80 ms |
| Ring/bar fill | 700 ms | ease-out | dashoffset / `scaleX` | jump |
| Count-up numeral | 600 ms | ease-out | text | jump |
| Toast | 200 ms | ease-out | translateY, opacity | fade |
| Level-up / rank-up / ARISE / loot / penalty | unchanged from DESIGN.md §5 | | add tier-3 warp (4.7d) on the title only | still card |

Rules: (1) animate only `opacity`, `transform` (and individual `translate`/`scale`) on anything >= 120 x 120 px; `clip-path` only on a surface being revealed, <= 5 at once; **never animate `filter` or `backdrop-filter`**; (2) glitch budget: <= 1 glitch per 700 ms, <= 3 flashes per second (S20); (3) glitch is allowed on: screen enter (title), nav/tile/primary-CTA taps, quest accept/clear, warnings, rank/level; **never** on set logging, steppers, text entry, or anywhere inside the workout player; (4) any tap during an entrance completes it (`animation-play-state` is not needed, simply mark the screen `data-settled` after 450 ms and skip the stagger on revisit within the session); (5) sound twin: `window-open` plays on hero materialise only (not on every card), `tap` is the existing 30-ms click.

### 4.7 Glitch recipes (ready to paste)

All CSS honours the existing in-app switch `:root[data-reduce-motion='true']` plus `@media (prefers-reduced-motion: reduce)`.

#### (a) System window "materialise", 380 ms (hero and card)

Replaces the `motion` `initial/animate` (scale + `filter: blur`) in `SystemWindow` and the SVG `sys-trace` rect. Three comma-separated animations so each property has its own easing (CSS applies `animation-timing-function` *between keyframes*, so a stepped flicker and a smooth wipe must be separate animations):

```css
.sys-in {
  position: relative; overflow: hidden;           /* clips the beam; box-shadow of the element itself is not clipped */
  animation:
    sys-wipe    320ms cubic-bezier(.2,.8,.2,1) backwards,
    sys-flicker 380ms steps(1, end)            backwards,
    sys-rise    380ms cubic-bezier(.2,.8,.2,1) backwards;
  animation-delay: calc(var(--i, 0) * 40ms);
}
/* Use `backwards` (not `both`) on these three: after the end the real, un-clipped style applies,
   so the outer glow is never clipped by a lingering clip-path. */
@keyframes sys-wipe {          /* top-to-bottom reveal; negative side insets keep the glow */
  from { clip-path: inset(-32px -32px 100% -32px); }
  to   { clip-path: inset(-32px -32px -32px -32px); }
}
@keyframes sys-flicker {       /* discrete: 0 -> .9 -> .35 -> 1 */
  0% { opacity: 0 } 10% { opacity: .9 } 22% { opacity: .35 } 34% { opacity: 1 } 100% { opacity: 1 }
}
@keyframes sys-rise { from { translate: 0 6px; scale: .985; } to { translate: 0 0; scale: 1; } }

/* scan beam: a real child element <i class="sys-beam" aria-hidden></i> (the ::after slot is taken by the hero top highlight). Full-height wrapper whose bottom edge carries the bright line; compositor-only */
.sys-in > .sys-beam {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 2;
  background: linear-gradient(180deg, transparent calc(100% - 26px), rgb(92 200 255 / .22) calc(100% - 3px), rgb(200 238 255 / .95) 100%);
  animation: sys-beam 320ms cubic-bezier(.2,.8,.2,1) both;
}
@keyframes sys-beam {
  from { transform: translateY(-100%); opacity: 1; }
  85%  { opacity: 1; }
  to   { transform: translateY(0);     opacity: 0; }
}

/* RGB split on the window title / tag only (text is small) */
.sys-in .sys-title { animation: sys-rgb 220ms steps(2, end) backwards; }
@keyframes sys-rgb {
  from { text-shadow: -2px 0 rgb(255 59 92 / .85), 2px 0 rgb(92 200 255 / .85); }
  to   { text-shadow: 0 0 0 rgb(255 59 92 / 0),    0 0 0 rgb(92 200 255 / 0); }
}

@media (prefers-reduced-motion: reduce) {
  .sys-in { animation: sys-fade 120ms linear backwards; animation-delay: 0ms; }
  .sys-in > .sys-beam { display: none; }  .sys-in .sys-title { animation: none; }
}
:root[data-reduce-motion='true'] .sys-in { animation: sys-fade 120ms linear backwards; animation-delay: 0ms; }
:root[data-reduce-motion='true'] .sys-in > .sys-beam { display: none; }
:root[data-reduce-motion='true'] .sys-in .sys-title { animation: none; }
@keyframes sys-fade { from { opacity: 0 } to { opacity: 1 } }
```

React: `<section className="panel-hero sys-in" style={{ '--i': index } as CSSProperties}>`; pass `index` from the screen (0 for hero, then 1..5; cap at 5 so the whole stack settles in <= 380 + 200 = 580 ms). **Cold-load rule (Lighthouse S28):** do not add `.sys-in` to the first route rendered on a cold start (render it already visible); add it on every later navigation and for modals.

Cost: compositor (transform/opacity/`translate`/`scale`) for beam, rise and flicker; `clip-path` main-thread but no repaint (S13), on <= 5 surfaces for 320 ms. No filter, no blur, no `will-change` (the animation promotes layers itself; do not leave `will-change` set, S11).

`motion` equivalent if you prefer JS (no clip-path): `initial={{ opacity: 0, y: 6 }} animate={{ opacity: [0, .9, .35, 1], y: 0 }} transition={{ duration: .38, ease: [.2,.8,.2,1], opacity: { duration: .38, times: [0, .1, .22, .34], ease: 'linear' }, delay: i * .04 }}`. Wrap the app in `<MotionConfig reducedMotion="user">` so transforms drop out automatically (S16).

#### (b) Tap glitch, 170 ms (nav items, tiles/rows that navigate, primary CTA, quest accept)

Press uses `scale`; the jolt uses `translate` + `transform` so the two never fight. Opt-in with `data-glitch`:

```css
[data-glitch] { position: relative; }
[data-glitch].is-glitching { animation: tg-jolt 170ms steps(1, end); }
[data-glitch].is-glitching::before,
[data-glitch].is-glitching::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0; border: 1px solid;
}
[data-glitch].is-glitching::before { border-color: rgb(255 59 92 / .9);  animation: tg-r 170ms steps(1, end); }
[data-glitch].is-glitching::after  { border-color: rgb(92 200 255 / .95); animation: tg-c 170ms steps(1, end);
  /* slice: a bright band at a random height, set from JS as --gy (0%..70%) */
  background: linear-gradient(transparent var(--gy, 30%), rgb(92 200 255 / .20) var(--gy, 30%) calc(var(--gy, 30%) + 16%), transparent calc(var(--gy, 30%) + 16%)); }
@keyframes tg-jolt { 0% { translate: -2px 0; transform: skewX(-2deg) } 34% { translate: 2px 0; transform: skewX(1.5deg) } 67% { translate: -1px 0; transform: none } 100% { translate: 0 0; transform: none } }
@keyframes tg-r { 0% { opacity: .9; translate: 3px 0 } 50% { opacity: .6; translate: -2px 0 } 100% { opacity: 0; translate: 0 0 } }
@keyframes tg-c { 0% { opacity: .9; translate: -3px 0 } 50% { opacity: .6; translate: 2px 0 } 100% { opacity: 0; translate: 0 0 } }
@media (prefers-reduced-motion: reduce) { [data-glitch].is-glitching, [data-glitch].is-glitching::before, [data-glitch].is-glitching::after { animation: none; } }
:root[data-reduce-motion='true'] [data-glitch].is-glitching,
:root[data-reduce-motion='true'] [data-glitch].is-glitching::before,
:root[data-reduce-motion='true'] [data-glitch].is-glitching::after { animation: none; }
/* buttons/titles with text: add the split to the label only */
[data-glitch].is-glitching .glitch-label { text-shadow: 2px 0 var(--warning), -2px 0 var(--glow); }
```

One delegated listener (no per-component hooks), rate-limited, with the best-effort haptic and the existing `tap` sound:

```ts
// src/ui/glitch.ts
import { haptic } from 'ios-haptics'            // optional; fragile (S21). Guard with try/catch, never rely on it.
const last = new WeakMap<Element, number>()
const reduced = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.reduceMotion === 'true'

export function installTapGlitch() {
  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-glitch]')
    if (!el || reduced()) return
    const now = performance.now()
    if (now - (last.get(el) ?? 0) < 700) return
    last.set(el, now)
    el.style.setProperty('--gy', `${Math.floor(Math.random() * 70)}%`)
    el.classList.remove('is-glitching'); void el.offsetWidth   // restart
    el.classList.add('is-glitching')
    el.addEventListener('animationend', () => el.classList.remove('is-glitching'), { once: true })
    try { haptic() } catch { /* ignore */ }
  }, { passive: true })
}
```

Cost: transform/opacity only, two tiny pseudo-elements, 170 ms, only on the tapped element. (`animationend` fires for pseudo-elements too; all three share 170 ms so the first end removes the class.)

#### (c) Route / screen transition glitch, about 500 ms end to end (enter-only)

Enter-only (no exit animation, so navigation never feels slower; HIG "don't make people wait", S6): the old screen unmounts instantly, a **tear band** sweeps down once, and the new screen's panels materialise behind it with the stagger from (a); the screen title gets a one-shot data-text split.

```css
.tear { position: fixed; left: 0; right: 0; top: 0; height: 72px; z-index: 60; pointer-events: none;
  background: linear-gradient(180deg, transparent, rgb(92 200 255 / .10) 55%, rgb(200 238 255 / .55) 97%, transparent);
  animation: tear 240ms cubic-bezier(.3,0,.2,1) both; }
@keyframes tear { from { transform: translateY(-72px); opacity: 1 } 85% { opacity: 1 } to { transform: translateY(100dvh); opacity: 0 } }

.glitch-title { position: relative; }
.glitch-title::before, .glitch-title::after { content: attr(data-text); position: absolute; inset: 0; pointer-events: none; opacity: 0; }
.glitch-title::before { color: var(--warning); animation: gt-a 200ms steps(1, end) backwards; }
.glitch-title::after  { color: var(--glow);    animation: gt-b 200ms steps(1, end) backwards; }
@keyframes gt-a { 0% { opacity: .9; translate: -3px 0; clip-path: inset(10% 0 55% 0) } 40% { clip-path: inset(60% 0 8% 0); translate: 2px 0 } 100% { opacity: 0 } }
@keyframes gt-b { 0% { opacity: .9; translate:  3px 0; clip-path: inset(50% 0 20% 0) } 40% { clip-path: inset(5% 0 70% 0); translate: -2px 0 } 100% { opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .tear { display: none } .glitch-title::before, .glitch-title::after { display: none } }
:root[data-reduce-motion='true'] .tear, :root[data-reduce-motion='true'] .glitch-title::before, :root[data-reduce-motion='true'] .glitch-title::after { display: none; }
```

```tsx
// Screen.tsx (or the router outlet): key by path so it replays on each navigation
export function RouteFx({ path, first }: { path: string; first: boolean }) {
  return first ? null : <div key={path} className="tear" aria-hidden />
}
// <h1 className="t-screen glitch-title" data-text="QUESTS">QUESTS</h1>
```

Cost: one fixed 72-px layer moved by `transform` for 240 ms; clip-path only on the one title (about 30 x 200 px). `first` is true for the cold-load route (no tear, no `.sys-in`: protects LCP).

#### (d) Tier 3: displacement tear for rank-up / ARISE / Awakening titles only

Only when a moment justifies it (<= 1 per session event), on **one leaf element** (<= 320 x 64 px), <= 400 ms, `numOctaves="1"`, never on an element with animating descendants and never an ancestor of animations (S12), remove the filter afterwards (S15). **[U] untested on device: gate behind a feature flag and test on a real iPhone before enabling; fall back to (b)-style split if frame time > 16 ms.**

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="sys-warp" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.002 0.40" numOctaves="1" seed="3" result="n"/>
    <feDisplacementMap id="sys-warp-map" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

```ts
export function warp(el: HTMLElement, ms = 320) {
  const map = document.getElementById('sys-warp-map'); if (!map) return
  el.style.filter = 'url(#sys-warp)'
  const t0 = performance.now()
  const tick = (t: number) => {
    const p = Math.min((t - t0) / ms, 1)
    map.setAttribute('scale', String(Math.sin(p * Math.PI) * 26))   // 0 -> 26 -> 0
    if (p < 1) requestAnimationFrame(tick); else { el.style.filter = ''; map.setAttribute('scale', '0') }
  }
  requestAnimationFrame(tick)
}
```

Horizontal bands come from the stretched `baseFrequency` (low x, high y).

#### Cheap but premium (use freely)

Linear/radial gradients; 1-px inset rims; `box-shadow` on small elements; shadows built with a wider low-alpha stroke instead of `drop-shadow`; `text-shadow` on <= 40 characters; pre-rendered 96-px noise tile on one fixed layer; sheen = a pseudo-element translated once; SVG paths for rings (small); CSS `mask-image` only on static layers; `clip-path` reveals on small surfaces; individual `scale/translate` properties. **Avoid:** `backdrop-filter` anywhere in the content layer (S5 agrees materials belong to the functional layer; S12/S27 for cost), animated `filter`, `mix-blend-mode` on large areas, full-screen SVG filters, full-screen `canvas` particles beyond the existing <= 30, `will-change` left on.

If a blurred surface is ever needed (bottom Sheet scrim), use a flat `rgb(2 3 9 / .72)` scrim, not blur.

---

## 5. Screen-by-screen recommendations

Common to all: remove the `[ SCREEN ]` header + tag pill duplication; the bottom nav already says where you are. Header strip 44 px (left: contextual label or nothing; right: gold + one icon). Exactly one hero panel in the top third. Every list below the hero is `Section` or `Group`, not stacked bordered windows.

### 5.1 Status (hero: the Hunter)

Hero: rank hexagon 88 px (E..S colour, subtle rim) left; right: name (`--t-screen` Rajdhani 32), then job and title as two chips; **level numeral `--t-display` gold with `--glow-gold`** overlapping the hexagon's right edge; XP bar full width with "230 / 510" left and "280 to LV 3" right in mono. Power is the only other big number: placed in the hero's lower right as `--t-num-lg` with a micro label. Brackets + materialise here. Below: Vitals card (3 columns, value + 4-px bar each), then stats as a **2-column grid** (STR/AGI/VIT/INT/SENSE + unspent points chip). The `+` buttons appear only when unspent points exist, and a "3 POINTS" chip in the hero pulses (opacity) to say why; otherwise the rows are quiet.

```
┌─ 44 px header ────────────────────────┐
│ ● 1,240 G                       ⚙     │
├───────────────────────────────────────┤
│ ┌┐ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ ┐  │  HERO (brackets TL+BR,
│  ⬡E    JINWOO                 LV     │   glow, scanlines)
│  rank  [TANK] [TITLE: —]      2      │   LV = Orbitron 56 gold
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░    │
│ 230 / 510 XP        280 to LV 3  PWR 1│
│ └                                  ┘ │
├ VITALS ───────────────────────────────┤  Card
│  HP 100%      MP 63%     FATIGUE 0%   │
│  ▓▓▓▓▓▓▓      ▓▓▓▓░░     ░░░░░░░ ·    │
├ STATS ───────────── 3 POINTS ─────────┤  Section, 2 cols
│  STR  11   [+]   │  AGI  11   [+]     │
│  VIT  13   [+]   │  INT  10   [+]     │
│  SENSE 10  [+]   │                    │
└───────────────────────────────────────┘
```

### 5.2 Quests (hero: today's Daily Quest)

Hero is a `reward`-tinted System window only when it is the **active** daily; the title is the quest name (Rajdhani 28), tag `DAILY QUEST` (micro). Left: big completion fraction `--t-display` "1/4"; right: countdown in `--t-hero-num` mono, turning `--warning` under 1 h (this is the penalty tension the System uses). Goals are rows with a mini bar each (value in mono right-aligned); a cleared goal turns green, text dims, check pops (scale 0.6 -> 1, 160 ms). Footer strip: reward chips (gold) | penalty chip (red, smaller). **Other quests collapse to single-line rows** in a `Section`: "Rank-up trial · E -> D · LV 2/10 · PL 1/15" with a thin bar, "Job change · locked · LV 30" with a lock icon, dim. Tapping expands (glitch tap + slide) instead of showing full windows.

```
│ QUESTS                         [log ▸]│
│ ┌┐ DAILY QUEST ───────── ⏱ 01:56:59 ┐ │  HERO
│  PREPARATION TO BECOME STRONG        │
│  1/4  cleared                        │
│  ▸ Full Body C             0/1   ▱▱▱ │
│  ▸ Drink water      0/2650 ml   ▱▱▱  │
│  ▸ Eat protein        0/135 g   ▱▱▱  │
│  ✓ Readiness check-in      1/1   ▰▰▰ │
│  [+100 XP] [+40 G]        [⚠ PENALTY]│
│ └                                  ┘ │
├ OTHER ────────────────────────────────┤
│ ⬡ Rank-up trial · D rank   LV 2/10  › │
│ 🔒 Job change · LV 30                 │
```

### 5.3 Train (hero: today's dungeon)

Hero: workout name (`--t-moment` Orbitron 24 — one of the few legit uses), meta chips (5 EXERCISES · 47 MIN · ~+120 XP), the **BodyMap thumbnail** (already in the repo) right-aligned with target muscles lit (the real visual hero, replaces the empty space), and the **primary CTA 56 px full-width inside the hero** in the thumb zone with the sheen; "Free session" demoted to a ghost link under it. Quick links become a **horizontally scrolling chip rail** (Body map, Exercises, Plan, Cardio, Form check, Dungeons): 36-px high, icon + label; no 3x2 tile grid. "Instant dungeons" = compact card: key slots drawn as three small hex keys (filled / outlined) + "1 per day".

```
│ TRAIN                          🗝 0   │
│ ┌┐ TODAY ─────────────────────────┐  │  HERO
│  FULL BODY C            ┌────────┐   │  (Orbitron 24)
│  5 EX · 47 MIN · +120XP │ body   │   │   body map thumb
│                         │ map    │   │
│                         └────────┘   │
│  ┌─────────────────────────────────┐ │
│  │ ▶  ENTER THE DUNGEON            │ │  primary 56 px, sheen
│  └─────────────────────────────────┘ │
│            Free session              │
│ └                                  ┘ │
│ (Body map)(Exercises)(Plan)(Cardio)→  │  chip rail
│ ┌ Instant dungeons ───── ⬡ ⬡ ⬡ ──── ┐ │
```

### 5.4 Diet (hero: calories remaining)

Hero ring 208 px, `--t-hero-num` "2,630" **KCAL LEFT** in the centre, tick ring + start pip at 0% (4.5). Under it a three-column macro strip: P / C / F each a slim bar with "0 / 135 g" mono (not three more rings). Water = segmented glass: 8 pills (each 330 ml) that fill, `+250` / `+500` chips on the right, in the thumb zone. A "+ Log food" primary button is sticky above the nav. Meals = borderless `Section`s (Breakfast / Lunch / Dinner / Snacks), header shows the kcal subtotal, each with an inline `+`. Empty state = the System voice: "[ No intake logged. Hunters who skip meals lose HP. ]" + the log button.

```
│ DIET                      ≡ (history) │
│ ┌┐                                 ┐  │  HERO
│        ·  ╭────────╮  ·              │   ring 208, ticks
│       ·   │  2,630 │   ·             │   start pip at 12 o'clock
│        ·  │ KCAL   │  ·              │
│           │ LEFT   │                 │
│            ╰──────╯                  │
│   P 0/135g  ▱▱▱   C 0/388g ▱▱▱  F 0/60g ▱▱▱
│ └ [bulk target 2,630 · min 1,709]  ┘  │
├ WATER ─────────────── 0 / 2,650 ml ───┤
│ ▢▢▢▢▢▢▢▢          [+250] [+500]       │
├ BREAKFAST ───────────── 0 kcal  [+] ──┤
│ ...                                   │
│            [ + LOG FOOD ]             │  sticky above nav
```

### 5.5 System menu (hero: profile strip, then inset groups)

No tile grid. Top: a compact hero-lite strip (rank badge 40, name, `LV 2`, gold), **no brackets**. Then `Group`s with `--t-label` headers HUNTER / WORLD / TRAINING / APP; each row 52 px: 36-px icon well, label (Inter 500), secondary live value in dim mono (e.g. "Progress · 78.4 kg", "Shadow army · 0", "Inventory · 3 new" as a gold chip), chevron. Settings gets the last group. Rows use the tap glitch (b) on navigation. This also fixes the orphan single tile in every row of the current grid.

```
│ SYSTEM                                │
│ ⬡E  JINWOO · LV 2          1,240 G ›  │  hero-lite
│ HUNTER                                │
│ ┌─────────────────────────────────┐   │
│ │ 📈 Progress          78.4 kg   ›│   │
│ │ ─────────────────────────────── │   │
│ │ 📷 Body & photos               ›│   │
│ │ 👤 Body map                    ›│   │
│ │ 🏷 Titles              [1 new] ›│   │
│ └─────────────────────────────────┘   │
│ WORLD  ...                            │
```

(Emoji are wireframe placeholders; use the `icons.tsx` set.)

### 5.6 Bottom nav

Opaque, no blur: `background: rgb(7 12 24 / .96)`, top edge a 1-px gradient hairline (`transparent -> --edge-hi -> transparent`), height 64 + inset. Active item: a **56 x 30 pill behind the icon** (`rgb(47 168 255 / .16)`, rim top, 1 px `rgb(92 200 255 / .35)`), icon `--glow` with duotone fill .15, label `--text`; inactive icon `--text-dim`, label `--text-faint`-ish at 11 px (Rajdhani 700, 0.06em). The pill **slides** between tabs via a single `layoutId` (motion shared layout) or a `translate` on one absolutely-positioned element (spring 420/32, as in DESIGN.md), 220 ms. Quest badge = 8-px `--warning` dot with a 2-px `--bg` ring. Optional signature: **Train raised in the centre**, a 52-px hex button overlapping the bar by 10 px with `--elev-hero`: it is the app's primary verb and the "gate" metaphor [D]. Tap on a tab: `tap` sound + haptic + (b) glitch on the label only (text-shadow split, 120 ms).

```
├───────────────────────────────────────┤ hairline gradient
│  ◉Status   Quests•   ⬡TRAIN⬡   Diet   System │
│  (pill)                (raised)               │
```

### 5.7 Awakening (hero: the System, alone on black)

Sequence (total about 4.5 s, tap anywhere to skip to the next prompt): black -> a 1-px horizontal line draws from the centre outward (200 ms) -> expands vertically into the window with materialise (a) -> message types in (existing 45 cps) -> buttons fade in. One prompt per screen, each a single hero window with large type; **no tag pill, no title**: the System's sentence *is* the content in `--t-system` 17 px, glowing slightly.

1. `[ You have acquired the qualifications to be a Player. ]` / `[ Will you accept? ]` -> **ACCEPT** (primary), DECLINE (ghost; plays tier-3 warp + "[ Declining is not permitted. ]", then returns).
2. Name / body stats / goal: one input per hero window, step micro-label `STEP 2 / 5` and 5 pips; big mono inputs (`--t-num-lg`).
3. Result: RANK E badge scale-in with glitch reveal; stats count up; "[ Daily Quest has arrived. ]" -> toast (a).

```
│                                       │
│                                       │
│  ┌┐ ─────────────────────────────── ┐ │  HERO centred
│                                      │
│   [ You have acquired the            │
│     qualifications to be             │
│     a Player. ]                      │
│                                      │
│   [ Will you accept? ]▌              │
│                                      │
│   ┌──────────────────────────────┐   │
│   │           ACCEPT             │   │
│   └──────────────────────────────┘   │
│               decline                │
│  └ ─────────────────────────────── ┘ │
│                  ● ○ ○ ○ ○            │
```

Install gate (the screenshot `00-awakening.png`): same hero; title in Rajdhani 28 ("INSTALL THE SYSTEM"), three numbered steps as rows with a 32-px numeral well and the Share icon inline; the "Continue in the browser" ghost link below (not a bordered button); no tag pill.

---

## 6. Implementation order (by impact over cost)

1. **Perf bug fixes** (do first, they also look better): delete `backdrop-filter` from `.sys-window`; delete `filter: blur` entrance and the `sys-trace` SVG; replace corner `drop-shadow` with the gradient-bracket recipe; delete the global `.scanlines` overlay; add the `.ambient` layer.
2. Tokens (4.3) + type scale (4.1) + font trimming/preload.
3. Panel family (`Hero`, `Card`, `Section`, `Group`), shared press state; `/dev/gallery` entries for each in default/active/disabled/loading/error/success.
4. Ring and bar (4.5); Diet screen as the proof screen (biggest before/after delta).
5. Bottom nav (5.6), Status, Quests, Train, System menu, Awakening.
6. Glitch: (a) on SystemWindow/hero, (b) `installTapGlitch()` once in `main.tsx` + `data-glitch` on nav/rows/CTA, (c) `RouteFx` + `glitch-title`, (d) behind a flag.
7. Tests: unit test that `.sys-in` has `animation-fill-mode: backwards` only (regression: clip-path glow), that `data-reduce-motion` disables all four recipes, Playwright check on 390 x 844 that no element has `backdrop-filter`, `filter` animation count = 0; Lighthouse mobile run in CI (`full-ci` label) with a budget: LCP < 2.5 s, TBT < 200 ms, CLS < 0.05 [D].
8. Device checks (owner task, add to `docs/needs-owner.md`): real-iPhone frame time for (a), (b), (c) in Safari Web Inspector Timelines; whether `ios-haptics` still fires on the owner's iOS version (S21 notes sources disagree on which iOS versions it works); (d) go/no-go.

---

## Sources

- S1 WHOOP design breakdown (925 Studios): https://www.925studios.co/blog/whoop-design-breakdown [V]
- S2 Oura app redesign case study (Instrument): https://www.instrument.com/work/oura-app [V]
- S3 Gentler Streak redesign (BGR): https://bgr.com/tech/gentler-streak-gets-a-major-redesign-focused-on-your-wellbeing/ [V]
- S4 Apple HIG Typography: https://developer.apple.com/design/human-interface-guidelines/typography [V]
- S5 Apple HIG Materials (Liquid Glass, standard materials, vibrancy): https://developer.apple.com/design/human-interface-guidelines/materials [V]
- S6 Apple HIG Motion: https://developer.apple.com/design/human-interface-guidelines/motion [V]
- S7 "What to steal from Destiny's UI" (Game Developer): https://www.gamedeveloper.com/design/what-to-steal-from-destiny-s-ui [V]
- S8 Visual Design of Games: Persona 5 (Mechanics of Magic): https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/ [V]
- S9 Cyberpunk 2077 UI (HUDs & GUIs): https://www.hudsandguis.com/home/2019/cyberpunk-2077 [V]
- S10 GDC: User Interface in Cyberpunk 2077 (abstract only; paywalled): https://gdcvault.com/play/1034160/User-Interface-in-Cyberpunk-2077 [S]
- S11 web.dev, How to create high-performance CSS animations: https://web.dev/articles/animations-guide [V]
- S12 WebKit bug 219729 (filter on parent not applied during child animation; still reproducing on Safari 18.5): https://bugs.webkit.org/show_bug.cgi?id=219729 [V]
- S13 WebKit bug 185816 (clip-path animation not on the compositor; 2026 work in progress): https://bugs.webkit.org/show_bug.cgi?id=185816 [V]
- S14 CSS-Tricks, Glitch Effect on Text / Images / SVG: https://css-tricks.com/glitch-effect-text-images-svg/ [V]
- S15 GreenSock forum, GSAP and feTurbulence mobile performance: https://greensock.com/forums/topic/33075-gsap-and-feturbulence-mobile-performance/ [S]
- S16 Motion, React accessibility (`MotionConfig reducedMotion`, `useReducedMotion`): https://motion.dev/docs/react-accessibility [V]
- S17 Motion, React animation (hardware-accelerated transforms, keyframes, `times`): https://motion.dev/docs/react-animation [V]
- S18 Lighthouse performance scoring (metric weights): https://developer.chrome.com/docs/lighthouse/performance/performance-scoring [V]
- S19 MDN `prefers-reduced-transparency` (limited availability): https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency [V]
- S20 WCAG 2.2 SC 2.3.1 Three Flashes or Below Threshold: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html [V]
- S21 ios-haptics (checkbox-switch haptic trick, caveats): https://unpkg.com/ios-haptics@0.0.8/README.md [V]; discussion of iOS version caveats: https://azukiazusa.dev/en/blog/ios-safari-web-haptics [S]
- S22 Internal R1 Solo Leveling deep dive §11 to §12 (ARISE menus, anime window facts, fan CSS): `research/solo-leveling.md` [V]
- S23 GamePro DE, Solo Leveling UI colours in anime vs manhwa (black window, blue text; purple tint after class change): https://www.gamepro.de/artikel/solo-leveling-veraendert-ui,3426403.html [S, direct fetch returned 403]
- S24 CBR, fan-built anime-accurate System (status/equipment/inventory screens): https://www.cbr.com/solo-leveling-anime-system-create/ [V, text only, no colour detail]
- S25 Duolingo blog, streak milestone design and animation: https://blog.duolingo.com/streak-milestone-design-animation [V]; Duolingo core tabs redesign: https://blog.duolingo.com/core-tabs-redesign [S]; 60fps Design, Fun in Every Frame: https://60fpsdesign.substack.com/p/fun-in-every-frame [S]
- S26 SVG noise / grain data-URI technique (opacity guidance, `stitchTiles`; no benchmarks): https://cssmatic.com/gen-noise-texture.html and https://expertbeacon.com/how-to-create-grainy-css-backgrounds-using-svg-filters-an-in-depth-guide/ [S]; "noise filters kill performance in Safari": https://stuffandnonsense.co.uk/blog/toon-titles-two-quick-gotchas-about-smil-animations/ [S]
- S27 yuvomi v0.52.26 release note (iOS Safari blank scroll after many backdrop-filter layers): https://newreleases.io/project/github/ulsklyc/yuvomi/release/v0.52.26 [S]
- S28 web.dev, Largest Contentful Paint (opacity 0 excluded, web-font text not counted during block period, 2.5 s threshold): https://web.dev/articles/lcp [V]
- Also consulted (not load-bearing): Apple HIG Activity rings guidance (page 404 on mirror; only the search summary "rings for Move/Exercise/Stand, not ornamentation"): https://developer-mdn.apple.com/design/human-interface-guidelines/components/status/activity-rings [S]
