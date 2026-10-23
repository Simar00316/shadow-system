// Builds src/data/exercises.json and exercise media from hasaneyldrm/exercises-dataset (primary, GIFs)
// and yuhonas/free-exercise-db (enrichment + extra exercises). Mapping rules: research/data-sources.md §1.
// Usage: node data/build-exercises.ts [--no-media]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { cached, pool, raw, writeJson } from './lib.ts'
import type { BaseClass, Equipment, Exercise, Experience, FormLift, Muscle, Pattern } from '../src/engine/types.ts'

const NO_MEDIA = process.argv.includes('--no-media')
const MEDIA_DIR = 'public/assets/third-party/exercises'
const C = 'data/.cache/exercises'

type Hasan = { id: string; name: string; category: string; body_part: string; equipment: string; target: string; secondary_muscles: string[]; instructions: { en: string }; instruction_steps: { en: string[] }; image: string; gif_url: string; attribution: string }
type Fedb = { id: string; name: string; force: string | null; level: string; mechanic: string | null; equipment: string | null; primaryMuscles: string[]; secondaryMuscles: string[]; instructions: string[]; category: string; images: string[] }

// ---------- muscles (R6 §1.4) ----------
const MUSCLE: Record<string, Muscle | 'delts' | null> = {
  abs: 'abs', abdominals: 'abs', core: 'abs', 'lower abs': 'abs', 'upper abs': 'abs',
  obliques: 'obliques', 'serratus anterior': 'obliques', serratus: 'obliques',
  pectorals: 'chest', chest: 'chest', 'upper chest': 'chest',
  delts: 'delts', deltoids: 'delts', shoulders: 'delts', 'rear deltoids': 'rear_delts', 'rotator cuff': 'rear_delts',
  biceps: 'biceps', brachialis: 'biceps', triceps: 'triceps',
  forearms: 'forearms', wrists: 'forearms', 'wrist flexors': 'forearms', 'wrist extensors': 'forearms', hands: 'forearms', 'grip muscles': 'forearms',
  lats: 'lats', 'latissimus dorsi': 'lats', 'upper back': 'upper_back', rhomboids: 'upper_back', back: 'upper_back', 'middle back': 'upper_back',
  traps: 'traps', trapezius: 'traps', spine: 'lower_back', 'erector spinae': 'lower_back', 'lower back': 'lower_back',
  glutes: 'glutes', 'hip flexors': 'hip_flexors', groin: 'adductors', quads: 'quads', quadriceps: 'quads', hamstrings: 'hamstrings',
  adductors: 'adductors', 'inner thighs': 'adductors', abductors: 'abductors',
  calves: 'calves', soleus: 'calves', ankles: 'calves', 'ankle stabilizers': 'calves', feet: 'calves', shins: 'calves',
  'levator scapulae': 'neck', sternocleidomastoid: 'neck', neck: 'neck', 'cardiovascular system': null,
}

/** Delt split rules (R6 §1.4), applied to a "delts" mention. */
function splitDelts(name: string, role: 'primary' | 'secondary', force: string | null, otherPrimary: Muscle[]): Muscle[] {
  if (/lateral raise|side raise|upright row|y-raise|cable lateral|abduction/.test(name)) return ['side_delts']
  if (/rear|reverse fly|reverse pec|face pull|bent.?over (raise|fly|lateral)|reverse fly|band pull.?apart/.test(name)) return ['rear_delts']
  if (/front raise|plate raise|front (dumbbell|barbell|cable) raise/.test(name)) return ['front_delts']
  if (/overhead|military|shoulder press|arnold|push press|handstand|pike/.test(name)) return role === 'primary' ? ['front_delts', 'side_delts'] : ['front_delts']
  if (role === 'secondary') {
    if (force === 'push' || otherPrimary.some((m) => m === 'chest' || m === 'triceps')) return ['front_delts']
    if (force === 'pull' || otherPrimary.some((m) => m === 'lats' || m === 'upper_back' || m === 'biceps')) return ['rear_delts']
    return ['side_delts']
  }
  return ['front_delts', 'side_delts']
}

function mapMuscles(names: string[], exName: string, role: 'primary' | 'secondary', force: string | null, otherPrimary: Muscle[] = []): Muscle[] {
  const out: Muscle[] = []
  for (const n of names) {
    const m = MUSCLE[n.toLowerCase()]
    if (m === undefined) throw new Error(`unmapped muscle "${n}" (${exName})`)
    if (m === 'delts') out.push(...splitDelts(exName, role, force, otherPrimary))
    else if (m) out.push(m)
  }
  return [...new Set(out)]
}

// ---------- equipment (R6 §1.5) ----------
const EQUIP: Record<string, Equipment> = {
  'body weight': 'bodyweight', weighted: 'bodyweight', 'body only': 'bodyweight', cable: 'cable', rope: 'cable',
  'leverage machine': 'machine', assisted: 'machine', 'sled machine': 'machine', machine: 'machine',
  barbell: 'barbell', 'olympic barbell': 'barbell', 'trap bar': 'barbell', 'ez barbell': 'ez_bar', 'e-z curl bar': 'ez_bar',
  dumbbell: 'dumbbell', kettlebell: 'kettlebell', kettlebells: 'kettlebell', 'smith machine': 'smith_machine',
  band: 'bands', 'resistance band': 'bands', bands: 'bands', 'medicine ball': 'medicine_ball', 'stability ball': 'stability_ball',
  'exercise ball': 'stability_ball', 'bosu ball': 'stability_ball', roller: 'foam_roller', 'foam roll': 'foam_roller',
  'wheel roller': 'other', hammer: 'other', tire: 'other', other: 'other',
  'skierg machine': 'cardio_machine', 'stationary bike': 'cardio_machine', 'elliptical machine': 'cardio_machine', 'stepmill machine': 'cardio_machine', 'upper body ergometer': 'cardio_machine',
}

function mapEquipment(src: string | null, name: string): Equipment[] {
  const n = name.toLowerCase()
  let base: Equipment = src ? EQUIP[src.toLowerCase()] : 'bodyweight'
  if (!base) throw new Error(`unmapped equipment "${src}"`)
  if (!src || src === 'None') base = /machine/.test(n) ? 'machine' : /cable/.test(n) ? 'cable' : 'bodyweight'
  const out = new Set<Equipment>([base])
  if (/bench|incline|decline|preacher/.test(n) && !/bench dip|without bench/.test(n)) out.add('bench')
  if (/pull.?up|chin.?up|hanging|muscle.?up|toes.to.bar/.test(n) && base === 'bodyweight') out.add('pullup_bar')
  return [...out]
}

// ---------- movement pattern, difficulty, mechanics, classes, MET, form check ----------
function pattern(n: string, category: string, equipment: Equipment[]): Pattern {
  if (category === 'stretching' || /stretch|foam roll|smr|mobility|yoga|pose/.test(n)) return 'stretch'
  if (category === 'cardio' || equipment.includes('cardio_machine') || /\b(run|jog|sprint|cycling|bike|elliptical|skierg|stair|jumping jack|jump rope)\b/.test(n)) return 'cardio'
  if (/lunge|split squat|step.?up|bulgarian/.test(n)) return 'lunge'
  if (/deadlift|\brdl\b|romanian|good morning|hip thrust|glute bridge|bridge|hyperextension|back extension|swing|pull.?through|reverse hyper/.test(n)) return 'hinge'
  if (/squat|leg press|hack|pistol|wall sit|sissy/.test(n)) return 'squat'
  if (/pull.?up|chin.?up|pulldown|pull.?down|muscle.?up|lat pull/.test(n)) return 'vertical_pull'
  if (/\brow\b|rowing|face pull|reverse fly|rear delt|inverted row/.test(n)) return 'horizontal_pull'
  if (/overhead|military|shoulder press|arnold|push press|handstand|pike push|landmine press/.test(n)) return 'vertical_push'
  if (/bench press|push.?up|chest press|floor press|\bdips?\b|press up/.test(n)) return 'horizontal_push'
  if (/\bfly\b|flye|crossover|pec deck|cross over/.test(n)) return 'fly'
  if (/curl/.test(n)) return 'curl'
  if (/extension|pushdown|push.?down|kickback|skull|tricep press/.test(n)) return 'extension'
  if (/raise|lateral|shrug|calf/.test(n)) return 'raise'
  if (/crunch|sit.?up|leg raise|knee raise|v.?up|plank|hollow|rollout|ab wheel|toes.to.bar|dead bug|mountain climber|flutter|jackknife/.test(n)) return 'crunch'
  if (/twist|woodchop|wood chop|rotation|russian|side bend|oblique/.test(n)) return 'rotation'
  if (/carry|farmer|suitcase|yoke/.test(n)) return 'carry'
  if (category === 'plyometrics' || /jump|hop|bound|burpee|skater|box/.test(n)) return 'plyo'
  if (/press/.test(n)) return 'horizontal_push'
  return 'other'
}

const COMPOUND: Pattern[] = ['squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'carry', 'plyo']

function deriveDifficulty(n: string, equipment: Equipment[], p: Pattern): Experience {
  if (/muscle.?up|pistol|snatch|clean and|clean &|handstand|one.arm|single.arm push|planche|front lever|back lever|archer|dragon flag|human flag/.test(n)) return 'advanced'
  if (equipment.some((e) => e === 'machine' || e === 'cable' || e === 'bands') || p === 'stretch') return 'beginner'
  return 'intermediate'
}

function classTags(n: string, category: string, equipment: Equipment[], p: Pattern, mech: 'compound' | 'isolation'): BaseClass[] {
  const t = new Set<BaseClass>()
  if (['powerlifting', 'olympic weightlifting', 'strongman'].includes(category) || (equipment.includes('barbell') && mech === 'compound')) t.add('fighter')
  if (category === 'strength' && (mech === 'isolation' || equipment.some((e) => ['machine', 'cable', 'dumbbell', 'smith_machine', 'ez_bar'].includes(e)))) t.add('tank')
  if (equipment.includes('bodyweight') || equipment.includes('bands') || p === 'cardio' || p === 'crunch') t.add('assassin')
  if (category === 'plyometrics' || p === 'plyo' || equipment.includes('kettlebell') || category === 'strongman' || p === 'carry' || /pull.?up|chin.?up|dip|muscle.?up|push.?up/.test(n)) t.add('ranger')
  if (p === 'stretch' || equipment.includes('foam_roller') || /mobility|bird dog|dead bug|cat|glute bridge|band pull.?apart|face pull/.test(n)) t.add('healer')
  if (!t.size) t.add(mech === 'compound' ? 'fighter' : 'tank')
  return [...t]
}

function met(category: string, p: Pattern, mech: 'compound' | 'isolation', n: string): number {
  if (p === 'stretch') return 2.3
  if (/swing/.test(n) && /kettlebell/.test(n)) return 9.8
  if (/burpee|tabata/.test(n)) return 11.0
  if (/jump rope|skipping/.test(n)) return 11.0
  if (p === 'cardio') return /bike|cycl/.test(n) ? 6.8 : /row/.test(n) ? 7.0 : /elliptical/.test(n) ? 5.0 : /stair|stepmill/.test(n) ? 9.0 : /run|sprint/.test(n) ? 9.8 : 7.0
  if (p === 'plyo' || category === 'plyometrics') return 8.0
  if (['powerlifting', 'olympic weightlifting', 'strongman'].includes(category)) return 6.0
  return mech === 'compound' ? 5.0 : 3.5
}

function formCheck(n: string, p: Pattern, equipment: Equipment[], primary: Muscle[]): FormLift | null {
  if (p === 'squat' && !/leg press|hack|machine|sissy|wall sit/.test(n) && !equipment.includes('machine')) return 'squat'
  if (/push.?up/.test(n) && !/handstand|pike/.test(n)) return 'pushup'
  if (/deadlift/.test(n)) return 'deadlift'
  if (p === 'lunge' && !/step.?up/.test(n)) return 'lunge'
  if (p === 'vertical_push' && (equipment.includes('barbell') || equipment.includes('dumbbell')) && !/seated|machine/.test(n)) return 'ohp'
  if (p === 'curl' && primary.includes('biceps') && !/machine|cable|preacher/.test(n)) return 'curl'
  return null
}

// Pattern-level coaching (authored from standard coaching cues; NSCA/ACSM technique guidance).
const COACHING: Record<Pattern, { tips: string[]; mistakes: string[] }> = {
  squat: { tips: ['Brace your core before each rep and keep the bar or weight over mid-foot.', 'Push the knees out in line with the toes.', 'Descend under control to at least parallel if mobility allows.'], mistakes: ['Knees caving inward on the way up.', 'Heels lifting off the floor.', 'Rounding the lower back at the bottom.'] },
  hinge: { tips: ['Push the hips back and keep a neutral spine.', 'Keep the load close to your legs.', 'Finish by squeezing the glutes, not by leaning back.'], mistakes: ['Rounding the back under load.', 'Squatting the movement instead of hinging.', 'Hyperextending the lower back at lockout.'] },
  lunge: { tips: ['Keep the torso tall and the front knee tracking over the toes.', 'Lower the back knee straight down.', 'Drive through the whole front foot.'], mistakes: ['Front knee collapsing inward.', 'Steps that are too short, loading the knee.', 'Leaning the torso far forward.'] },
  horizontal_push: { tips: ['Set the shoulder blades back and down.', 'Keep the elbows at roughly 45 degrees from the torso.', 'Touch lightly and press with control.'], mistakes: ['Flaring the elbows to 90 degrees.', 'Bouncing the weight off the chest.', 'Hips lifting or sagging.'] },
  vertical_push: { tips: ['Squeeze the glutes and brace to avoid arching.', 'Press in a straight line, moving the head out of the way.', 'Finish with the arms by the ears.'], mistakes: ['Excessive lower-back arch.', 'Pressing forward instead of up.', 'Shrugging the shoulders throughout.'] },
  horizontal_pull: { tips: ['Lead with the elbows and squeeze the shoulder blades together.', 'Keep the torso still.', 'Control the lowering phase.'], mistakes: ['Using momentum by swinging the torso.', 'Shrugging instead of retracting.', 'Cutting the range of motion short.'] },
  vertical_pull: { tips: ['Start from a full hang or full stretch.', 'Pull the elbows down toward the ribs.', 'Keep the chest up and the core tight.'], mistakes: ['Kipping or swinging for reps.', 'Half reps without full extension.', 'Pulling with the arms only, shoulders shrugged.'] },
  curl: { tips: ['Keep the upper arms still at your sides.', 'Lower slowly for a full stretch.', 'Squeeze at the top.'], mistakes: ['Swinging the body to lift the weight.', 'Elbows drifting forward.', 'Dropping the weight on the way down.'] },
  extension: { tips: ['Keep the upper arm or thigh fixed.', 'Move only at the working joint.', 'Control the stretch position.'], mistakes: ['Using momentum.', 'Locking out aggressively.', 'Letting the elbows flare.'] },
  raise: { tips: ['Lift with control and pause briefly at the top.', 'Keep a slight bend in the working joint.', 'Lower slower than you lift.'], mistakes: ['Swinging the weight up.', 'Going too heavy and shrugging.', 'Partial range of motion.'] },
  fly: { tips: ['Keep a soft, fixed bend in the elbows.', 'Move in a wide arc and feel the stretch.', 'Bring the hands together without clanking.'], mistakes: ['Turning the fly into a press.', 'Overstretching the shoulders at the bottom.', 'Using too much weight.'] },
  crunch: { tips: ['Exhale and brace as you curl or hold.', 'Keep the neck relaxed.', 'Move slowly; tension beats speed.'], mistakes: ['Pulling on the neck.', 'Using hip flexors and momentum.', 'Holding the breath.'] },
  rotation: { tips: ['Rotate through the torso while the hips stay stable.', 'Keep the movement controlled.', 'Brace the core throughout.'], mistakes: ['Twisting fast with momentum.', 'Rounding the lower back.', 'Moving only the arms.'] },
  carry: { tips: ['Stand tall with the shoulders back.', 'Take short, quick steps.', 'Grip hard and brace.'], mistakes: ['Leaning to one side.', 'Shrugging the shoulders.', 'Letting the load swing.'] },
  plyo: { tips: ['Land softly with knees tracking over toes.', 'Reset between reps if form breaks.', 'Quality over fatigue.'], mistakes: ['Landing stiff-legged.', 'Knees caving on landing.', 'Continuing when tired and sloppy.'] },
  cardio: { tips: ['Start with an easy warm-up for 3-5 minutes.', 'Keep a pace you can sustain unless doing intervals.', 'Breathe steadily.'], mistakes: ['Going too hard too early.', 'Poor posture when tired.', 'Skipping the cool-down.'] },
  stretch: { tips: ['Hold each stretch 20-30 seconds without bouncing.', 'Breathe slowly and relax into the stretch.', 'Stretch to mild tension, never pain.'], mistakes: ['Bouncing in the stretch.', 'Forcing past pain.', 'Holding the breath.'] },
  other: { tips: ['Move with control through the full range.', 'Brace your core.', 'Stop the set if form breaks down.'], mistakes: ['Using momentum.', 'Rushing reps.', 'Training through pain.'] },
}

// Common gym lifts preferred by the plan generator.
const CORE = /^(barbell (full |back |front )?squat|barbell bench press|barbell deadlift|barbell romanian deadlift|barbell bent over row|barbell (standing )?(military|overhead) press|barbell hip thrust|barbell curl|dumbbell (bench press|incline bench press|fly|lateral raise|shoulder press|seated shoulder press|curl|hammer curl|bent over row|one arm row|lunge|goblet squat|romanian deadlift|step.?up|bulgarian split squat|rear delt fly|shrug)|cable (row|seated row|crossover|lateral raise|pushdown|triceps pushdown|face pull|curl|kickback)|lat pulldown|cable pulldown|pull.?up|chin.?up|push.?up|dips?|chest dip|triceps dip|leg press|lever leg extension|leg extension|lever (lying )?leg curl|lying leg curl|seated leg curl|standing calf raise|seated calf raise|plank|crunch|hanging leg raise|russian twist|kettlebell swing|walking lunge|glute bridge|hip thrust|face pull|inverted row|sled leg press|smith machine squat|ez barbell curl|skull crusher|lever seated row|lever chest press|machine chest press|pec deck|reverse fly|good morning|front squat|sumo deadlift|overhead press|bench press|deadlift|squat)$/

// ---------- name matching ----------
const STOP = new Set(['the', 'with', 'a', 'of', 'on', 'and', 'to', 'v', 'version'])
const SYN: Record<string, string> = { db: 'dumbbell', dumbbells: 'dumbbell', bb: 'barbell', kb: 'kettlebell', ez: 'ez', 'e-z': 'ez', pulldown: 'pulldown', 'pull-down': 'pulldown', pullup: 'pullup', 'pull-up': 'pullup', pushup: 'pushup', 'push-up': 'pushup', situp: 'situp', 'sit-up': 'situp', chinup: 'chinup', 'chin-up': 'chinup' }
const tokens = (s: string) => new Set(s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean).map((t) => SYN[t] ?? t).map((t) => t.replace(/-/g, '')).map((t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t)).filter((t) => !STOP.has(t)))
const EQ_WORD: Partial<Record<Equipment, string>> = { barbell: 'barbell', dumbbell: 'dumbbell', cable: 'cable', kettlebell: 'kettlebell', bands: 'band', machine: 'lever', smith_machine: 'smith', ez_bar: 'ez', medicine_ball: 'medicine', stability_ball: 'stability' }
const withEquip = (t: Set<string>, eq: Equipment[]) => { const w = EQ_WORD[eq[0]]; return w ? new Set([...t, w]) : t }
const jaccard = (a: Set<string>, b: Set<string>) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i) }

const title = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Ez|Smr|Rdl|Db)\b/g, (m) => m.toUpperCase())
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function importAlias(name: string, equipment: Equipment[]) {
  // Strong/Hevy style: "Bench Press (Barbell)"
  const eq = equipment.find((e) => e !== 'bench' && e !== 'pullup_bar')
  if (!eq) return []
  const label = { bodyweight: 'Bodyweight', dumbbell: 'Dumbbell', barbell: 'Barbell', ez_bar: 'EZ Bar', kettlebell: 'Kettlebell', cable: 'Cable', machine: 'Machine', smith_machine: 'Smith Machine', bands: 'Band', medicine_ball: 'Medicine Ball', stability_ball: 'Stability Ball', foam_roller: 'Foam Roller', cardio_machine: 'Machine', other: '' }[eq]
  const base = name.replace(new RegExp(`\\b(${label}|lever|leverage|barbell|dumbbell|cable|machine|smith|band|kettlebell|ez bar|ez barbell)\\b`, 'gi'), '').replace(/\s+/g, ' ').trim()
  return label && base && base.toLowerCase() !== name.toLowerCase() ? [`${title(base)} (${label})`] : []
}

function describe(e: Pick<Exercise, 'name' | 'mechanics' | 'equipment' | 'primary' | 'secondary' | 'pattern'>) {
  const L = (m: Muscle) => m.replace('_', ' ')
  const eq = e.equipment.filter((x) => x !== 'bench').map((x) => x.replace('_', ' ')).join(' and ')
  const kind = e.pattern === 'stretch' ? 'stretch' : e.pattern === 'cardio' ? 'conditioning exercise' : `${e.mechanics} ${eq === 'bodyweight' ? 'bodyweight' : eq} exercise`
  const sec = e.secondary.length ? `, with the ${e.secondary.slice(0, 3).map(L).join(', ')} assisting` : ''
  return `${e.name} is a ${kind} that targets the ${e.primary.map(L).join(' and ') || 'whole body'}${sec}.`
}

async function main() {
  const hasan = JSON.parse((await cached(raw('hasan', 'data/exercises.json'), `${C}/hasan.json`)).toString()) as Hasan[]
  const fedb = JSON.parse((await cached(raw('fedb', 'dist/exercises.json'), `${C}/fedb.json`)).toString()) as Fedb[]
  const report: string[] = []

  // 1. hasan → exercises (dedupe "(male)/(female)" stance variants)
  const seen = new Set<string>()
  const list: (Exercise & { _tok: Set<string>; _src: { hasan?: Hasan; fedb?: Fedb } })[] = []
  for (const h of hasan) {
    const baseName = h.name.replace(/\s*\((male|female)\)\s*/i, ' ').trim()
    const key = [...tokens(baseName)].sort().join(' ')
    if (seen.has(key)) continue
    seen.add(key)
    const n = baseName.toLowerCase()
    const equipment = mapEquipment(h.equipment, n)
    const primary = mapMuscles([h.target], n, 'primary', null)
    const secondary = mapMuscles(h.secondary_muscles ?? [], n, 'secondary', null, primary).filter((m) => !primary.includes(m))
    const cat = h.target === 'cardiovascular system' ? 'cardio' : 'strength'
    const p = pattern(n, cat, equipment)
    const mech: 'compound' | 'isolation' = COMPOUND.includes(p) || secondary.length >= 2 ? 'compound' : 'isolation'
    list.push({
      id: `hx${h.id}`, name: title(baseName), aliases: [], primary: primary.length ? primary : secondary.slice(0, 1), secondary: primary.length ? secondary : secondary.slice(1), equipment,
      difficulty: deriveDifficulty(n, equipment, p), mechanics: p === 'stretch' || p === 'cardio' ? 'isolation' : mech, category: cat, force: null,
      classTags: [], pattern: p, swapGroup: '', met: 0, formCheck: null,
      media: { kind: 'anim', src: [`/assets/third-party/exercises/hx${h.id}.webp`], thumb: `/assets/third-party/exercises/hx${h.id}-t.webp`, credit: '© Gym visual — https://gymvisual.com/' },
      description: '', instructions: h.instruction_steps?.en ?? [], tips: [], mistakes: [], core: false,
      _tok: withEquip(tokens(baseName), equipment), _src: { hasan: h },
    })
  }

  // 2. match free-exercise-db entries (Jaccard ≥ 0.8 and shared primary family) or append them
  let matched = 0
  for (const f of fedb) {
    const n = f.name.toLowerCase()
    const equipment = mapEquipment(f.equipment, n)
    const primary = mapMuscles(f.primaryMuscles, n, 'primary', f.force)
    const secondary = mapMuscles(f.secondaryMuscles, n, 'secondary', f.force, primary).filter((m) => !primary.includes(m))
    const tok = withEquip(tokens(f.name), equipment)
    let best: (typeof list)[number] | null = null, score = 0
    for (const e of list) {
      if (e._src.fedb) continue
      const s = jaccard(tok, e._tok)
      if (s > score && e.equipment[0] === equipment[0] && e.primary.some((m) => primary.includes(m) || secondary.includes(m))) { score = s; best = e }
    }
    const tipSentences = f.instructions.filter((s) => /^tip:|\btip:/i.test(s)).map((s) => s.replace(/^.*?tip:\s*/i, ''))
    const steps = f.instructions.filter((s) => !/^tip:/i.test(s))
    const level = ({ beginner: 'beginner', intermediate: 'intermediate', expert: 'advanced' } as const)[f.level as 'beginner'] ?? 'intermediate'
    if (best && score >= 0.8) {
      matched++
      best.core = true
      best._src.fedb = f
      best.aliases.push(f.name)
      best.difficulty = level
      best.force = (f.force as Exercise['force']) ?? null
      best.category = f.category
      if (f.mechanic) best.mechanics = f.mechanic as 'compound' | 'isolation'
      best.tips.push(...tipSentences)
      for (const m of secondary) if (!best.secondary.includes(m) && !best.primary.includes(m)) best.secondary.push(m)
      continue
    }
    if (score >= 0.6) report.push(`review match (${score.toFixed(2)}): "${f.name}" ~ "${best?.name}"`)
    if (!primary.length || !f.images.length || !steps.length) { report.push(`dropped fedb "${f.name}": missing muscles/media/instructions`); continue }
    const p = pattern(n, f.category, equipment)
    const id = `fx-${slug(f.id)}`
    list.push({
      id, name: f.name, aliases: [], primary, secondary, equipment, difficulty: level,
      mechanics: (f.mechanic as 'compound' | 'isolation') ?? (COMPOUND.includes(p) ? 'compound' : 'isolation'), category: f.category, force: (f.force as Exercise['force']) ?? null,
      classTags: [], pattern: p, swapGroup: '', met: 0, formCheck: null,
      media: { kind: 'frames', src: f.images.map((_, i) => `/assets/third-party/exercises/${id}-${i}.webp`), thumb: `/assets/third-party/exercises/${id}-0.webp` },
      description: '', instructions: steps, tips: tipSentences, mistakes: [], core: false, _tok: tok, _src: { fedb: f },
    })
  }

  // 3. derived fields
  for (const e of list) {
    const n = e.name.toLowerCase()
    if (/hip flexor|psoas|knee raise|leg raise|knee tuck/.test(n) && !e.primary.includes('hip_flexors')) { e.primary.push('hip_flexors'); e.secondary = e.secondary.filter((m) => m !== 'hip_flexors') }
    e.classTags = classTags(n, e.category, e.equipment, e.pattern, e.mechanics)
    e.swapGroup = `${e.pattern}:${e.primary[0]}`
    e.met = met(e.category, e.pattern, e.mechanics, n)
    e.formCheck = formCheck(n, e.pattern, e.equipment, e.primary)
    e.core = e.core || CORE.test(n) || CORE.test(n.replace(/^(lever|leverage|barbell|dumbbell|cable) /, ''))
    const coach = COACHING[e.pattern]
    e.tips = [...new Set([...e.tips, ...coach.tips])].slice(0, 5)
    e.mistakes = coach.mistakes
    e.aliases = [...new Set([...e.aliases, ...importAlias(e.name, e.equipment)])].filter((a) => a.toLowerCase() !== n)
    e.description = describe(e)
  }

  // 4. media
  if (!NO_MEDIA) {
    mkdirSync(MEDIA_DIR, { recursive: true })
    let done = 0
    await pool(list, 12, async (e) => {
      const out = `${MEDIA_DIR}/${e.media.src[0].split('/').pop()}`
      if (existsSync(out) && existsSync(`public${e.media.thumb}`)) { done++; return }
      if (e._src.hasan) {
        const h = e._src.hasan
        const gif = await cached(raw('hasan', h.gif_url), `${C}/media/${h.gif_url}`)
        await sharp(gif, { animated: true }).webp({ quality: 60, effort: 4 }).toFile(`public${e.media.src[0]}`)
        const jpg = await cached(raw('hasan', h.image), `${C}/media/${h.image}`)
        await sharp(jpg).resize(96, 96, { fit: 'cover' }).webp({ quality: 70 }).toFile(`public${e.media.thumb}`)
      } else {
        const f = e._src.fedb!
        await Promise.all(f.images.map(async (img, i) => {
          const buf = await cached(raw('fedb', `exercises/${img}`), `${C}/media/fedb/${img}`)
          await sharp(buf).resize(400, null, { withoutEnlargement: true }).webp({ quality: 65 }).toFile(`public${e.media.src[i]}`)
        }))
      }
      if (++done % 100 === 0) console.log(`media ${done}/${list.length}`)
    })
  }

  const out: Exercise[] = list.map(({ _tok: _t, _src: _s, ...e }) => e).sort((a, b) => a.name.localeCompare(b.name))
  writeJson('src/data/exercises.json', out)
  writeFileSync('data/reports/exercises.txt', [`${out.length} exercises, ${matched} matched between datasets, ${out.filter((e) => e.core).length} core, ${out.filter((e) => e.formCheck).length} form-check`, ...report].join('\n'))
  console.log(`${out.length} exercises (${matched} matched, ${out.filter((e) => e.core).length} core). Report: data/reports/exercises.txt`)
}

mkdirSync('data/reports', { recursive: true })
await main()
