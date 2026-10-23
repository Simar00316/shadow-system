// Synthesises the original System sound set (design/DESIGN.md §6) into public/sfx/*.wav.
// Usage: node data/sfx.ts
import { mkdirSync, writeFileSync } from 'node:fs'

const SR = 22050
type Buf = Float32Array

const len = (s: number) => Math.round(s * SR)
const buf = (s: number): Buf => new Float32Array(len(s))
const note = (n: string) => {
  const m = /^([A-G])(#?)(\d)$/.exec(n)!
  const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1] as 'C'] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12
  return 440 * 2 ** (semis / 12)
}

type Wave = 'sine' | 'square' | 'saw' | 'triangle' | 'noise'
let rng = 1
const rand = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1

function osc(wave: Wave, phase: number) {
  const p = phase % 1
  switch (wave) {
    case 'sine': return Math.sin(2 * Math.PI * p)
    case 'square': return p < 0.5 ? 1 : -1
    case 'saw': return 2 * p - 1
    case 'triangle': return 1 - 4 * Math.abs(p - 0.5)
    case 'noise': return rand()
  }
}

/** Adds a tone into `out` at time `at` (s). freq may glide from f0 to f1. ADSR-ish envelope. */
function tone(out: Buf, at: number, dur: number, f0: number, opts: { f1?: number; wave?: Wave; gain?: number; attack?: number; release?: number; vibrato?: number } = {}) {
  const { f1 = f0, wave = 'sine', gain = 0.5, attack = 0.005, release = dur * 0.6, vibrato = 0 } = opts
  const start = len(at), n = len(dur)
  let phase = 0
  for (let i = 0; i < n && start + i < out.length; i++) {
    const t = i / SR
    const f = f0 * (f1 / f0) ** (t / dur) * (1 + vibrato * Math.sin(2 * Math.PI * 5.5 * t))
    phase += f / SR
    const env = Math.min(1, t / attack) * (t > dur - release ? Math.max(0, (dur - t) / release) : 1)
    out[start + i] += osc(wave, phase) * gain * env
  }
}

/** One-pole low-pass for noise shaping. */
function lowpass(b: Buf, k: number) {
  let y = 0
  for (let i = 0; i < b.length; i++) b[i] = y += k * (b[i] - y)
  return b
}

function echo(b: Buf, delay: number, fb: number) {
  const d = len(delay)
  for (let i = d; i < b.length; i++) b[i] += b[i - d] * fb
  return b
}

function normalize(b: Buf, peak = 0.9) {
  let m = 0
  for (const v of b) m = Math.max(m, Math.abs(v))
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak
  return b
}

function wav(b: Buf) {
  const data = Buffer.alloc(b.length * 2)
  b.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2))
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12)
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24)
  h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40)
  return Buffer.concat([h, data])
}

const arp = (out: Buf, notes: string[], step: number, d: number, o: Parameters<typeof tone>[4] = {}) =>
  notes.forEach((n, i) => tone(out, i * step, d, note(n), o))

function shimmer(out: Buf, at: number, dur: number, gain = 0.08) {
  for (let i = 0; i < 8; i++) tone(out, at + i * (dur / 10), dur / 3, note('E6') * (1 + i * 0.25), { gain, wave: 'sine', release: dur / 4 })
}

function noiseSweep(out: Buf, at: number, dur: number, gain: number, k: number) {
  const n = buf(dur)
  tone(n, 0, dur, 1, { wave: 'noise', gain, attack: dur * 0.6, release: dur * 0.4 })
  lowpass(n, k)
  n.forEach((v, i) => { if (len(at) + i < out.length) out[len(at) + i] += v })
}

const SOUNDS: Record<string, () => Buf> = {
  'window-open': () => { const b = buf(0.3); tone(b, 0, 0.12, note('E5'), { wave: 'triangle', gain: 0.5 }); tone(b, 0.08, 0.2, note('B5'), { wave: 'sine', gain: 0.5 }); return echo(b, 0.06, 0.25) },
  'window-close': () => { const b = buf(0.12); tone(b, 0, 0.09, 520, { f1: 260, wave: 'triangle', gain: 0.5 }); return b },
  notify: () => { const b = buf(0.6); tone(b, 0, 0.5, note('A5'), { gain: 0.5, release: 0.45 }); tone(b, 0, 0.5, note('A5') * 2.01, { gain: 0.15, release: 0.45 }); shimmer(b, 0.05, 0.4); return echo(b, 0.09, 0.3) },
  tap: () => { const b = buf(0.04); tone(b, 0, 0.03, 1800, { f1: 900, wave: 'square', gain: 0.25 }); return lowpass(b, 0.5) },
  'quest-accept': () => { const b = buf(0.6); arp(b, ['C5', 'E5', 'G5'], 0.09, 0.3, { wave: 'triangle', gain: 0.45 }); return echo(b, 0.08, 0.3) },
  'quest-clear': () => { const b = buf(1.0); arp(b, ['C5', 'E5', 'G5', 'C6', 'E6'], 0.08, 0.45, { wave: 'triangle', gain: 0.4 }); shimmer(b, 0.4, 0.5, 0.1); return echo(b, 0.1, 0.35) },
  'set-logged': () => { const b = buf(0.2); tone(b, 0, 0.06, note('G5'), { wave: 'square', gain: 0.25 }); tone(b, 0.07, 0.08, note('D6'), { wave: 'square', gain: 0.25 }); return lowpass(b, 0.35) },
  'rest-warn': () => { const b = buf(0.35); tone(b, 0, 0.08, note('A5'), { gain: 0.5 }); tone(b, 0.18, 0.08, note('A5'), { gain: 0.5 }); return b },
  'rest-end': () => { const b = buf(0.6); [0, 0.16, 0.32].forEach((t) => tone(b, t, 0.12, note('E6'), { wave: 'square', gain: 0.35 })); return lowpass(b, 0.45) },
  'level-up': () => { const b = buf(1.6); arp(b, ['C4', 'G4', 'C5', 'E5', 'G5', 'C6'], 0.07, 0.6, { wave: 'saw', gain: 0.18 }); ['C4', 'E4', 'G4'].forEach((n) => tone(b, 0.3, 1.2, note(n), { wave: 'triangle', gain: 0.22, attack: 0.3, vibrato: 0.004 })); shimmer(b, 0.5, 0.9, 0.08); return echo(lowpass(b, 0.4), 0.12, 0.35) },
  'rank-up': () => { const b = buf(2.2); tone(b, 0, 0.6, 60, { f1: 35, gain: 0.8, release: 0.5 }); noiseSweep(b, 0, 0.5, 0.4, 0.08); ['C4', 'G4', 'C5', 'E5'].forEach((n) => tone(b, 0.35, 1.7, note(n), { wave: 'saw', gain: 0.12, attack: 0.4, vibrato: 0.005 })); arp(b, ['G4', 'C5', 'E5', 'G5'], 0.12, 0.5, { wave: 'square', gain: 0.12, attack: 0.02 }); return echo(lowpass(b, 0.3), 0.15, 0.3) },
  pr: () => { const b = buf(1.3); [['C5', 'G5'], ['D5', 'A5'], ['E5', 'B5'], ['G5', 'D6']].forEach(([x, y], i) => { const d = i === 3 ? 0.7 : 0.16; tone(b, i * 0.15, d, note(x), { wave: 'saw', gain: 0.2, attack: 0.02 }); tone(b, i * 0.15, d, note(y), { wave: 'saw', gain: 0.15, attack: 0.02 }) }); return echo(lowpass(b, 0.35), 0.1, 0.3) },
  'loot-common': () => { const b = buf(0.5); arp(b, ['E5', 'A5'], 0.08, 0.3, { gain: 0.4 }); return echo(b, 0.08, 0.2) },
  'loot-rare': () => { const b = buf(0.7); arp(b, ['E5', 'A5', 'C#6'], 0.08, 0.35, { wave: 'triangle', gain: 0.4 }); shimmer(b, 0.2, 0.4); return echo(b, 0.09, 0.3) },
  'loot-epic': () => { const b = buf(1.1); noiseSweep(b, 0, 0.4, 0.3, 0.05); arp(b, ['A4', 'E5', 'A5', 'C#6', 'E6'], 0.08, 0.5, { wave: 'triangle', gain: 0.35 }); shimmer(b, 0.4, 0.6, 0.1); return echo(b, 0.1, 0.35) },
  'loot-legendary': () => { const b = buf(2.0); noiseSweep(b, 0, 0.6, 0.35, 0.05); tone(b, 0, 0.5, 70, { f1: 45, gain: 0.6 }); arp(b, ['A4', 'C#5', 'E5', 'A5', 'C#6', 'E6', 'A6'], 0.09, 0.8, { wave: 'saw', gain: 0.14 }); ['A4', 'E5'].forEach((n) => tone(b, 0.6, 1.3, note(n), { wave: 'triangle', gain: 0.2, attack: 0.2 })); shimmer(b, 0.8, 1.0, 0.12); return echo(lowpass(b, 0.4), 0.13, 0.4) },
  penalty: () => { const b = buf(1.2); [0, 0.36, 0.72].forEach((t) => { tone(b, t, 0.12, 740, { wave: 'square', gain: 0.25 }); tone(b, t, 0.12, 784, { wave: 'square', gain: 0.25 }); tone(b, t + 0.15, 0.12, 554, { wave: 'square', gain: 0.25 }) }); return lowpass(b, 0.4) },
  arise: () => { const b = buf(2.8); tone(b, 0, 1.2, 90, { f1: 30, gain: 0.9, release: 1 }); noiseSweep(b, 0.2, 1.4, 0.5, 0.03); ['A2', 'E3', 'A3', 'C4'].forEach((n) => tone(b, 0.6, 2.1, note(n), { wave: 'saw', gain: 0.12, attack: 0.6, vibrato: 0.006 })); return echo(lowpass(b, 0.2), 0.18, 0.4) },
  boss: () => { const b = buf(1.8); [0, 0.3, 0.6, 0.75].forEach((t) => { tone(b, t, 0.3, 110, { f1: 45, gain: 0.8 }); noiseSweep(b, t, 0.12, 0.3, 0.2) }); ['D3', 'A3'].forEach((n) => tone(b, 0.9, 0.9, note(n), { wave: 'saw', gain: 0.15, attack: 0.1 })); return lowpass(b, 0.3) },
  error: () => { const b = buf(0.3); tone(b, 0, 0.25, 300, { f1: 140, wave: 'saw', gain: 0.35 }); return lowpass(b, 0.3) },
  ambient: () => {
    // 24 s seamless loop: drone on A + slow minor arpeggio; every voice fits whole cycles of the loop.
    const D = 24, b = buf(D)
    ;[note('A1'), note('E2'), note('A2')].forEach((f, i) => tone(b, 0, D, Math.round(f * D) / D, { wave: i ? 'triangle' : 'sine', gain: 0.25, attack: 0.001, release: 0.001, vibrato: 0 }))
    const seq = ['A3', 'C4', 'E4', 'G4', 'E4', 'C4', 'A3', 'B3']
    for (let k = 0; k < 16; k++) tone(b, k * 1.5, 1.4, note(seq[k % 8]), { wave: 'sine', gain: 0.12, attack: 0.25, release: 1 })
    return lowpass(b, 0.25)
  },
}

mkdirSync('public/sfx', { recursive: true })
let total = 0
for (const [name, make] of Object.entries(SOUNDS)) {
  rng = 1
  const data = wav(normalize(make(), name === 'ambient' ? 0.6 : 0.9))
  writeFileSync(`public/sfx/${name}.wav`, data)
  total += data.length
}
console.log(`${Object.keys(SOUNDS).length} sounds, ${(total / 1024).toFixed(0)} KB`)
