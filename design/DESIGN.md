# Shadow System — Design file

The look and sound of the System from Solo Leveling, tuned for one-thumb use between sets. Source of truth for every screen. Live tokens: [`src/styles/tokens.css`](../src/styles/tokens.css). Live components: `/dev/gallery`.

Research: [R1 visual language §12](../research/solo-leveling.md), [references catalogue](references/README.md), [R7 platform](../research/platform.md), **[R8 design v2](../research/design-v2.md)** (premium pass: panel grades, type scale, glitch recipes, performance rules), [sound sourcing](../research/sfx.md).

---

## 1. Principles

1. **The System speaks, the Player acts.** Every surface is a System window; every message is in brackets in the System voice.
2. **Dark glass, bright edges, glowing type.** Fills are dark and quiet; light lives in 1 px rims, a top highlight and the text. **One hero per screen** carries the full System frame (brackets, glow, inner scanlines + grid); everything else is a quiet card, borderless section or inset group. *Angular = the System speaking, rounded = app content.*
3. **Gym-first.** 390 px wide, thumb zone at the bottom, ≥ 48 px tap targets, high contrast, numbers big and monospaced. A set is logged in ≤ 2 taps.
4. **Colour has meaning.** Blue = System; purple = shadows/Monarch; red = warning/penalty; gold = reward/PR/legendary. Never decorative.
5. **Every sound has a visual twin**, every animation has a reduced-motion fallback.
6. **Dark mode only.**

---

## 2. Typography

Self-hosted (Fontsource, OFL-1.1) so it works offline. Fan builds converge on Orbitron + Rajdhani + a mono (R1 §12.2); confirmed.

| Role | Family | Use |
| --- | --- | --- |
| Display | **Orbitron** 500/700/900 | System titles, window header tags, level numeral, rank letters |
| UI | **Rajdhani** 500/600/700 | buttons, tabs, labels, nav, sub-headings (condensed, technical) |
| Body | **Inter Variable** | paragraphs, instructions, descriptions |
| Numeric | **JetBrains Mono Variable** (tabular) | weights, reps, timers, stats, XP |

| Token | Family | Size / line-height | Weight | Letter-spacing | Case |
| --- | --- | --- | --- | --- | --- |
| `--type-hero` | Orbitron | 40 / 44 | 900 | 0.04em | upper |
| `--type-title` | Orbitron | 22 / 28 | 700 | 0.08em | upper |
| `--type-tag` | Orbitron | 11 / 14 | 700 | 0.25em | upper |
| `--type-heading` | Rajdhani | 20 / 24 | 700 | 0.04em | upper |
| `--type-label` | Rajdhani | 14 / 18 | 600 | 0.08em | upper |
| `--type-button` | Rajdhani | 17 / 20 | 700 | 0.06em | upper |
| `--type-body` | Inter | 16 / 24 | 400 | 0 | sentence |
| `--type-small` | Inter | 13 / 18 | 400 | 0.01em | sentence |
| `--type-system` | Inter | 15 / 22 | 500 | 0.01em | sentence, in `[brackets]` |
| `--type-num-xl` | JetBrains Mono | 48 / 52 | 700 | -0.02em | — (timers) |
| `--type-num-lg` | JetBrains Mono | 28 / 32 | 700 | 0 | — (stepper values) |
| `--type-num` | JetBrains Mono | 16 / 20 | 600 | 0 | — (stats, XP) |

Minimum body size 16 px (prevents iOS input zoom).

---

## 3. Colour

### 3.1 Core tokens (PRD starting values, validated by R1 §12.2)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#05070F` | app background |
| `--bg-deep` | `#020309` | behind portals, modal scrim base |
| `--panel` | `rgb(11 20 38 / 0.75)` (≈ `#0A1120` over bg) | System window fill |
| `--panel-solid` | `#0B1426` | sheets, nav bar |
| `--panel-raised` | `#101C35` | pressed / selected rows |
| `--line` | `rgb(47 168 255 / 0.35)` | hairline borders |
| `--system-blue` | `#2FA8FF` | primary borders, headings, primary button |
| `--glow` | `#5CC8FF` | glow, focus rings, progress bars (light only, never body text on light) |
| `--shadow-purple` | `#7B2FF7` | shadow army, ARISE, Monarch — **borders, fills, large text only** |
| `--shadow-purple-text` | `#A77BFF` | purple text |
| `--warning` | `#FF3B5C` | Penalty Zone, errors, low recovery |
| `--gold` | `#FFC94A` | gold, legendary, PRs, level numerals |
| `--success` | `#3DDC84` | quest cleared, recovered |
| `--text` | `#E6F1FF` | primary text |
| `--text-dim` | `#7C8DB5` | secondary text |
| `--text-on-accent` | `#05070F` | text on blue/gold/green fills |

### 3.2 Ranks and rarities

| Rank | Token | Value | | Rarity | Token | Value |
| --- | --- | --- | --- | --- | --- | --- |
| E | `--rank-e` | `#9AA3B5` grey | | Common | `--rarity-common` | `#C9D3E6` |
| D | `--rank-d` | `#3DDC84` green | | Rare | `--rarity-rare` | `#3D8BFF` |
| C | `--rank-c` | `#2FA8FF` blue | | Epic | `--rarity-epic` | `#B06CFF` |
| B | `--rank-b` | `#A77BFF` purple | | Legendary | `--rarity-legendary` | `#FF9F2E` |
| A | `--rank-a` | `#FF9F43` orange | | | | |
| S | `--rank-s` | `#FFC94A` gold | | | | |
| National | `--rank-national` | `#FF5A3C → #FFC94A` gradient | | | | |

Recovery heatmap: 0–30% `--warning`, 30–70% `#FFB547`, 70–100% `--success`, interpolated in OKLCH.

### 3.3 Contrast (WCAG 2.2 AA; checked by `src/styles/contrast.test.ts`)

Ratios on `--bg` / on `--panel` (composited): text 17.6 / 16.5 · text-dim 6.1 / 5.7 · system-blue 7.8 / 7.3 · glow 10.7 / 10.0 · shadow-purple **3.4 / 3.2 (UI & ≥ 24 px only)** · shadow-purple-text 6.6 / 6.2 · warning 5.8 / 5.4 · gold 13.1 / 12.3 · success 11.3 / 10.6 · every rank and rarity colour ≥ 5.6 · `--text-on-accent` on blue 7.8, on gold 13.1. All body pairs ≥ 4.5; all UI pairs ≥ 3.

---

## 4. Space, radius, elevation, effects

- **Spacing** (4 px base): `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40 · `--s-12` 48. Screen gutter 16; window padding 16; between windows 12.
- **Radius** (shape rule): `--r-hero` 4 px (System windows: hero, alert, reward, shadow) · `--r-card` 12 px (cards, groups) · `--r-ctl` 10 px (buttons, inputs, icon wells) · 999 px (chips, nav pill).
- **Depth** (v2 tokens in `tokens.css`): surfaces `--surface-1/2/hero` (translucent gradients over the ambient light), edges `--edge` / `--edge-hi`, rims `--rim-top/bot`, elevation `--elev-card` / `--elev-hero` / `--elev-alert|reward|shadow`, text glow `--glow-text` / `--glow-gold`. **No `backdrop-filter` and no `filter` on panels**: glass is faked by translucent fills over one fixed `.ambient` light layer (key light top centre, purple bounce bottom right, 96 px noise tile against banding).
- **Panel grades** (`SystemWindow`): **card** (default; rounded, hairline, dim micro-label header with a fading rule) · **hero** (`hero` prop or any non-system variant; angular, bright rim, two gradient corner brackets TL/BR drawn with backgrounds, top highlight, inner scanlines + 28 px grid, bloom). Lists use `.group` (inset rows with 36 px icon wells) and `.section-head`.
- **Variants**: `system` (blue), `alert` (red rim + pulsing bloom via an opacity-animated layer, tag `⚠ …`), `shadow` (purple), `reward` (gold).
- **Controls**: primary/gold buttons are gradient fills with a white top rim, a one-time sheen, press scale .975; chips (28 px pills, colour = meaning); bottom nav is opaque with a hairline and a sliding active pill.

---

## 5. Motion

Library: `motion`. Global easings: `--ease-out: cubic-bezier(.2,.8,.2,1)`, `--ease-in: cubic-bezier(.4,0,1,1)`, `--ease-spring` (motion spring stiffness 420, damping 32). All durations below are maxima. `prefers-reduced-motion: reduce` **or** the in-app "Reduce motion" setting switches every row to its fallback.

| Effect | Spec | Reduced-motion fallback |
| --- | --- | --- |
| Window open (**materialise**) | 380 ms, stagger 45 ms × ≤ 5: top-to-bottom `clip-path` wipe, stepped flicker (0 → .9 → .35 → 1), 6 px rise, a bright **scan beam** sweeping down, RGB split on the tag/title (`.sys-in`, R8 §4.7a). Skipped on the cold-start screen to protect LCP | fade 120 ms |
| **Tap glitch** | 170 ms on `[data-glitch]` (primary buttons, nav, rows that navigate): red/cyan border ghosts, skew jolt, a bright slice band; ≤ 1 per 700 ms; never on steppers or set logging (`src/ui/fx.ts`) | none |
| System message typing | 45 chars/s (min 250 ms, max 1200 ms per message), brackets appear first, block cursor `▌` blinking 500 ms; tap to complete instantly | full text, fade 120 ms |
| Glitch reveal (rank-up, ARISE title, warnings) | 3 frames over 180 ms: `text-shadow: 3px 0 var(--warning), -3px 0 var(--glow)`, `skewX(2deg)`, translateX ±2 px | none |
| Toast in / out | slide from top 16 px + fade, 200 ms; auto-dismiss 3.5 s (7 s for warnings) | fade |
| XP gain micro-animation | "+24 XP" floats up 24 px and fades, 700 ms; XP bar fill tweens 400 ms | bar jumps, text fades |
| Level-up burst | 900 ms: screen flash 8% white 80 ms, gold numeral count-up, expanding ring (scale 0→2.2, opacity 1→0), 24 particles; tag `LEVEL UP` glitch | static banner + fade |
| Rank-up | 1.6 s: dim to 70%, rank badge scales from 2.0 with glitch, colour flood in rank colour | static card |
| ARISE sequence | 3.2 s: dim 85%, purple smoke rises from bottom (SVG turbulence displacement animated 0→40), up to three "attempt" pulses (each 400 ms), silhouette fades in 600 ms with glowing eyes, name types in, `ARISE` glitch title; tap "Accept" | still card + fade |
| Loot reveal | box shakes (3 × 80 ms), cracks with rarity-coloured light rays 500 ms, item scales in with spring; Legendary adds 1.2 s gold particle shower | rarity-coloured card fades in |
| Penalty warning | red vignette pulse 2 × 600 ms, window shakes 2 px | red border only |
| Body map flip | 3D rotateY 0→180°, 420 ms, ease-in-out, backface hidden | crossfade 150 ms |
| Rest timer | ring depletes linearly; last 10 s pulse 1 Hz | ring only |
| Page transitions (**route glitch**) | enter-only: a 72 px tear band sweeps down in 260 ms; the screen title splits red/cyan once; panels materialise behind it | none |

Performance rules (R8 §4.6): animate only `transform`/`translate`/`scale` and `opacity`; `clip-path` only on revealing surfaces (≤ 5 at once); **never animate `filter` or `backdrop-filter`**; no layout animation in the workout player; ≤ 30 particles; 60 fps target on iPhone. Budget: Lighthouse mobile ≥ 90 (`node scripts/lighthouse.mjs`).

---

## 6. Sound

Sourced sounds (Kenney CC0 + Mixkit Free License, `research/sfx.md`), rendered by `data/sfx-import.ts` to 44.1 kHz WAV (mono for UI, stereo for cinematic stings) at about -16 LUFS, played with Howler (loaded on first tap). Audio **unlocks on the first tap** (iOS requirement) — a silent buffer is played inside the first `pointerdown`. Master volume and mute are remembered; ambient music has its own toggle. Ring-switch behaviour: optional "Play sounds in silent mode" sets `navigator.audioSession.type = 'playback'` (R7 §5).

| Event | File | Character | Volume |
| --- | --- | --- | --- |
| System window open | `window-open` | two-tone rising chime (E5→B5), 220 ms | 0.5 |
| System window close | `window-close` | soft low tick, 90 ms | 0.35 |
| Notification | `notify` | bell ping + shimmer, 400 ms | 0.55 |
| Button tap | `tap` | 30 ms click | 0.25 |
| Quest accepted | `quest-accept` | three-note rising chime | 0.55 |
| Quest complete | `quest-clear` | major arpeggio + sparkle, 800 ms | 0.65 |
| Set logged | `set-logged` | crisp double blip | 0.45 |
| Rest timer warning (10 s) | `rest-warn` | two soft pips | 0.5 |
| Rest timer end | `rest-end` | bright triple beep | 0.75 |
| Level up | `level-up` | ascending arpeggio + pad swell, 1.4 s | 0.75 |
| Rank up | `rank-up` | low impact + choir pad + fanfare, 2 s | 0.8 |
| PR fanfare | `pr` | brass-like fifths fanfare, 1.2 s | 0.75 |
| Loot reveal common / rare / epic / legendary | `loot-common` … `loot-legendary` | rising pitch & length by rarity, legendary adds chimes | 0.5–0.8 |
| Penalty alarm | `penalty` | dissonant double beep ×3 | 0.7 |
| ARISE extraction | `arise` | sub drop + noise whoosh + dark pad, 2.6 s | 0.8 |
| Boss raid start | `boss` | war drum hits + low brass, 1.6 s | 0.75 |
| Error | `error` | descending buzz, 250 ms | 0.5 |
| Ambient loop (optional) | `ambient` | dark drone + slow minor arpeggio, 24 s seamless loop | 0.25 |

---

## 7. Layout rules

- Mobile-first at **390 × 844**; scales to 430; on desktop the app is centred at max-width 480 px over the portal background.
- `viewport-fit=cover`; padding uses `env(safe-area-inset-*)`; full-height views use `100dvh`; `overscroll-behavior: none` on the root.
- **Bottom navigation** in the thumb zone: Status · Quests · Train · Diet · System, 64 px + safe-area inset, labels always visible, active item glows.
- Primary actions sit in the bottom 40% of the screen. Tap targets ≥ 48 × 48 px with ≥ 8 px gaps. The set-complete check is 56 px.
- One column; windows stack with 12 px gaps; long lists virtualised beyond 100 rows.
- Focus ring: 2 px `--glow` outline + `--glow-1`. Every interactive element is reachable by keyboard and labelled.
- Status bar `black-translucent` over `--bg`.

---

## 8. Components

Every component renders every applicable state in `/dev/gallery`: **default, active, disabled, loading, error, success**.

| Component | Purpose | Notes |
| --- | --- | --- |
| `SystemWindow` | the frame for everything | props: `tag`, `title`, `variant` (system/alert/shadow/reward), `state`; open/close motion |
| `QuestCard` | Goal / Time limit / Reward / Penalty | rows `current/target`, countdown, cleared stamp, penalty variant |
| `StatBar` | stat row with value and `[+]` allocate | disabled when no points |
| `XPBar` | level progress | animated fill, floating +XP |
| `RankBadge` | E…S, National | hexagon badge in rank colour, sizes sm/md/lg |
| `BodyMap` | male/female, front/back, selectable muscles | modes `target` and `recovery` (heatmap), flip animation |
| `ExerciseCard` | library row | thumbnail, muscles, equipment, difficulty colour (white/orange/red) |
| `SetRow` | one set in the player | prefilled weight × reps, RIR chip, 56 px check, set type badge (W, D, S) |
| `RestTimer` | countdown ring | ±15 s, skip, full-screen mode, sound at end |
| `NumberStepper` | weight/reps entry | large mono value, −/+ 48 px buttons, step per equipment, long-press repeat, tap value to type |
| `Toast` | System message | variants info/success/warning/reward, typing effect |
| `BottomNav` | 5 tabs | badge dot for pending quest |
| `Sheet` | bottom sheet | drag handle, scrim, focus trap |
| `Tabs` | segmented tabs | glow underline |
| `Chart` wrappers | `LineChart`, `BarChart`, `Heatmap` themed | mono ticks, glow line, no grid clutter |
| `EmptyState` | System message for empty lists | bracket text + optional action |
| `Button` | primary/secondary/ghost/danger | 48 px min height |
| `Ring` | calorie/macro/water rings | |
| `Icon` | original 24 px stroke icon set | |

---

## 9. Assets (F0) — all original unless listed in `docs/asset-sources.md`

| Asset | Where | How |
| --- | --- | --- |
| Panel frame, corner brackets, scanlines, noise | `SystemWindow` CSS + inline SVG | hand-authored |
| Icon set (stats, muscles, equipment, quests, rarities, ranks, nav, actions) | `src/ui/icons.tsx` | hand-drawn 24 px stroke paths |
| Rank badges E–S + National | `src/ui/RankBadge.tsx` | hexagon SVG + Orbitron letter |
| Class emblems (5 base, 6 advanced, Shadow Monarch) | `src/ui/emblems.tsx` | geometric SVG compositions |
| Shadow soldier art | `src/ui/ShadowArt.tsx` | procedural silhouettes per archetype (knight, beast, insect, wyvern, mage, giant, assassin) + purple turbulence smoke + glowing eyes; one seeded variant per shadow |
| Backgrounds | `src/ui/Backdrop.tsx` | gate-portal radial gradients + SVG swirl, dungeon grid, CSS particles |
| Body figures | `src/data/bodymap.json` | MuscleMap (MIT) paths, restyled; abductors drawn by us |
| Exercise animations | `public/assets/third-party/exercises/` | dataset GIFs → animated WebP (third-party, logged) |
| Sounds | `public/sfx/*.wav` | Kenney (CC0) + Mixkit (Free License), rendered by `data/sfx-import.ts` |
| App icons | `public/icons/` | generated from the emblem SVG by `data/icons.ts` |
