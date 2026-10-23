// Renders the shipped sound effects (public/sfx/*.wav) from the sourced files listed in data/sfx-sources.json
// (Kenney CC0 + Mixkit Free License; research/sfx.md). Needs ffmpeg on PATH and the source files in
// data/.cache/sfx-candidates (missing Mixkit files are downloaded from their recorded download_url).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

type Src = { file: string; download_url?: string; trim?: { start_s: number; end_s: number }; gain_db?: number; fade_out_s?: number }
type Entry = Src & { layers?: (Src & { delay_s?: number })[]; peak_db?: number; stereo?: boolean }

const ROOT = 'data/.cache/sfx-candidates'
const OUT = 'public/sfx'
const manifest = JSON.parse(readFileSync('data/sfx-sources.json', 'utf8')) as Record<string, Entry>
/** Cinematic stings keep stereo width; short UI sounds are mono (smaller, phone speaker is mono anyway). */
const STEREO = new Set(['level-up', 'rank-up', 'pr', 'loot-epic', 'loot-legendary', 'arise', 'boss', 'ambient'])

const ff = (args: string[]) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] })

async function ensure(s: Src) {
  const path = join(ROOT, s.file)
  if (existsSync(path)) return path
  if (!s.download_url) throw new Error(`Missing ${path}; download the pack listed in research/sfx.md`)
  mkdirSync(dirname(path), { recursive: true })
  const res = await fetch(s.download_url)
  if (!res.ok) throw new Error(`${s.download_url}: ${res.status}`)
  writeFileSync(path, Buffer.from(await res.arrayBuffer()))
  return path
}

/** Trim, fade and gain one source into a 44.1 kHz WAV. */
function shape(input: string, s: Src, out: string, channels: number, delay = 0) {
  const start = s.trim?.start_s ?? 0, end = s.trim?.end_s
  const len = end != null ? end - start : undefined
  const fades = ['afade=t=in:d=0.002']
  if (len && s.fade_out_s) fades.push(`afade=t=out:st=${Math.max(0, len - s.fade_out_s).toFixed(3)}:d=${s.fade_out_s}`)
  if (s.gain_db) fades.push(`volume=${s.gain_db}dB`)
  if (delay) fades.push(`adelay=${Math.round(delay * 1000)}:all=1`)
  ff(['-ss', String(start), ...(end != null ? ['-to', String(end)] : []), '-i', input, '-af', fades.join(','), '-ar', '44100', '-ac', String(channels), '-sample_fmt', 's16', out])
}

function peakDb(file: string) {
  // volumedetect reports on stderr
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' })
  const m = /max_volume: (-?[\d.]+) dB/.exec(stderr)
  if (!m) throw new Error(`Could not measure ${file}`)
  return Number(m[1])
}

const tmp = join(ROOT, '_render')
mkdirSync(tmp, { recursive: true })
mkdirSync(OUT, { recursive: true })

for (const [name, e] of Object.entries(manifest)) {
  if (name.startsWith('_')) continue
  const ch = STEREO.has(name) || e.stereo ? 2 : 1
  const out = join(OUT, `${name}.wav`)
  const src = await ensure(e)
  if (name === 'ambient') {
    // 24 s seamless loop: crossfade the last second over the first (research/sfx.md).
    const start = e.trim?.start_s ?? 0
    ff(['-ss', String(start), '-t', '25', '-i', src, '-filter_complex',
      `[0:a]atrim=0:1,asetpts=PTS-STARTPTS[h];[0:a]atrim=24:25,asetpts=PTS-STARTPTS[t];[0:a]atrim=1:24,asetpts=PTS-STARTPTS[b];[t][h]acrossfade=d=1[x];[x][b]concat=n=2:v=0:a=1,volume=${e.gain_db ?? 0}dB`,
      '-ar', '22050', '-ac', '2', '-sample_fmt', 's16', out]) // low drone: 22 kHz is plenty, halves the size
  } else if (e.layers?.length) {
    // Layered sting: mix, then normalise the peak.
    const parts = [join(tmp, `${name}-0.wav`)]
    shape(src, e, parts[0], 2)
    for (const [i, l] of e.layers.entries()) {
      const p = join(tmp, `${name}-${i + 1}.wav`)
      shape(await ensure(l), l, p, 2, l.delay_s)
      parts.push(p)
    }
    const mixed = join(tmp, `${name}-mix.wav`)
    ff([...parts.flatMap((p) => ['-i', p]), '-filter_complex', `amix=inputs=${parts.length}:normalize=0:duration=longest`, '-ar', '44100', '-ac', String(ch), '-sample_fmt', 's16', mixed])
    const gain = (e.peak_db ?? -2) - peakDb(mixed)
    ff(['-i', mixed, '-af', `volume=${gain.toFixed(2)}dB`, '-sample_fmt', 's16', out])
  } else {
    shape(src, e, out, ch)
  }
  console.log(`${name.padEnd(15)} ${ch === 2 ? 'stereo' : 'mono  '} peak ${peakDb(out).toFixed(1)} dB`)
}
