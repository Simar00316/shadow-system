// Extracts MuscleMap (MIT, melihcolpan/MuscleMap) body paths into src/data/bodymap.json,
// mapped to our canonical muscle ids. Usage: node data/bodymap.ts
import { writeFileSync } from 'node:fs'
import { cached, raw } from './lib.ts'

// MuscleMap slug -> canonical muscle id (research/data-sources.md muscle canon). null = body outline, not selectable.
const MAP: Record<string, string | null> = {
  abs: 'abs', upperAbs: 'abs', lowerAbs: 'abs', obliques: 'obliques', serratus: 'obliques',
  chest: 'chest', upperChest: 'chest', lowerChest: 'chest',
  deltoids: 'side_delts', frontDeltoid: 'front_delts', rearDeltoid: 'rear_delts', rotatorCuff: 'rear_delts',
  biceps: 'biceps', triceps: 'triceps', forearm: 'forearms',
  trapezius: 'traps', upperTrapezius: 'traps', lowerTrapezius: 'traps',
  upperBack: 'lats', rhomboids: 'upper_back', lowerBack: 'lower_back',
  gluteal: 'glutes', hamstring: 'hamstrings', quadriceps: 'quads', innerQuad: 'quads', outerQuad: 'quads',
  adductors: 'adductors', hipFlexors: 'hip_flexors', calves: 'calves', tibialis: 'calves', neck: 'neck',
  hair: null, head: null, hands: null, feet: null, ankles: null, knees: null,
}

type Part = { muscle: string | null; slug: string; side: 'common' | 'left' | 'right'; d: string }

async function parse(file: string): Promise<Part[]> {
  const src = (await cached(raw('musclemap', `Sources/MuscleMap/Data/${file}`), `data/.cache/musclemap/${file}`)).toString()
  const parts: Part[] = []
  for (const block of src.split('BodyPartPathData(').slice(1)) {
    const slug = block.match(/slug:\s*\.(\w+)/)![1]
    if (!(slug in MAP)) throw new Error(`unmapped slug ${slug} in ${file}`)
    for (const side of ['common', 'left', 'right'] as const) {
      const m = block.match(new RegExp(`${side}:\\s*\\[([\\s\\S]*?)\\]`))
      if (!m) continue
      for (const s of m[1].matchAll(/"([^"]+)"/g)) parts.push({ muscle: MAP[slug], slug, side, d: s[1].trim() })
    }
  }
  return parts
}

// The upper, smaller gluteal path on each side is gluteus medius: our hip abductors.
function splitAbductors(parts: Part[]) {
  for (const side of ['left', 'right'] as const) {
    const glutes = parts.filter((p) => p.slug === 'gluteal' && p.side === side)
    if (glutes.length < 2) continue
    const startY = (p: Part) => Number(p.d.match(/^m\s*-?[\d.]+[\s,]+(-?[\d.]+)/i)![1])
    glutes.sort((a, b) => startY(a) - startY(b))[0].muscle = 'abductors'
  }
  return parts
}

const views = {
  male: { front: { file: 'MaleFrontPaths.swift', viewBox: '0 95 727 1280' }, back: { file: 'MaleBackPaths.swift', viewBox: '718 95 727 1280' } },
  female: { front: { file: 'FemaleFrontPaths.swift', viewBox: '0 0 650 1450' }, back: { file: 'FemaleBackPaths.swift', viewBox: '823 0 650 1450' } },
}

const out: Record<string, Record<string, { viewBox: string; parts: Part[] }>> = {}
for (const [sex, faces] of Object.entries(views)) {
  out[sex] = {}
  for (const [face, v] of Object.entries(faces)) {
    const parts = await parse(v.file)
    out[sex][face] = { viewBox: v.viewBox, parts: face === 'back' ? splitAbductors(parts) : parts }
  }
}
writeFileSync('src/data/bodymap.json', JSON.stringify(out))
for (const [sex, faces] of Object.entries(out))
  for (const [face, v] of Object.entries(faces))
    console.log(sex, face, v.parts.length, 'paths,', new Set(v.parts.map((p) => p.muscle).filter(Boolean)).size, 'muscles')
