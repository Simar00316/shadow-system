// Program library run as Gates (PRD §3, R3 Boostcamp/Liftosaur study). Each week is a floor; the final week is the
// Boss Raid. Exercises are referenced by library name and resolved to ids (validated in dungeons.test.ts).
import type { BaseClass, Experience, Rank } from '@/engine/types'

export type ProgramExercise = { name: string; sets: number; reps: [number, number]; rir: number; pct?: number; amrapLast?: boolean }
export type ProgramDay = { name: string; exercises: ProgramExercise[] }
export type BossTest = { name: string; kind: 'amrap' | 'e1rm'; pct?: number; target: number; label: string }
export type Program = {
  id: string; name: string; rank: Rank; color: 'blue' | 'purple' | 'red'; weeks: number; daysPerWeek: number
  level: Experience; classes: BaseClass[]; equipment: 'gym' | 'home' | 'dumbbells'
  description: string; days: ProgramDay[]; boss: BossTest[]; red?: boolean
}

const E = (name: string, sets: number, reps: [number, number], rir = 2, extra: Partial<ProgramExercise> = {}): ProgramExercise => ({ name, sets, reps, rir, ...extra })
const SQ = 'Barbell Full Squat', BP = 'Barbell Bench Press', DL = 'Barbell Deadlift', OHP = 'Barbell Standing Wide Military Press', ROW = 'Barbell Bent Over Row'

export const PROGRAMS: Program[] = [
  {
    id: 'novice_linear', name: 'The First Gate: Novice Linear', rank: 'E', color: 'blue', weeks: 6, daysPerWeek: 3, level: 'beginner', classes: ['fighter', 'tank', 'ranger'], equipment: 'gym',
    description: 'Three full-body sessions a week. Add weight every session you complete every rep. The classic way to awaken.',
    days: [
      { name: 'Day A', exercises: [E(SQ, 3, [5, 5], 2), E(BP, 3, [5, 5], 2), E(ROW, 3, [5, 8], 2), E('Plank', 2, [1, 1], 3)] },
      { name: 'Day B', exercises: [E(SQ, 3, [5, 5], 2), E(OHP, 3, [5, 5], 2), E(DL, 1, [5, 5], 2), E('Chin-up', 3, [5, 8], 2)] },
    ],
    boss: [{ name: SQ, kind: 'e1rm', target: 1.05, label: 'Squat e1RM beats your start by 5%' }, { name: BP, kind: 'e1rm', target: 1.05, label: 'Bench e1RM beats your start by 5%' }],
  },
  {
    id: 'full_body_3', name: 'Full Body Foundations', rank: 'E', color: 'blue', weeks: 6, daysPerWeek: 3, level: 'beginner', classes: ['tank', 'fighter', 'assassin'], equipment: 'gym',
    description: 'Machines and free weights, 8–12 reps, every muscle twice a week.',
    days: [
      { name: 'Full Body A', exercises: [E('Leg Press', 3, [8, 12]), E('Dumbbell Bench Press', 3, [8, 12]), E('Cable Seated Row', 3, [8, 12]), E('Dumbbell Lateral Raise', 2, [10, 15]), E('Plank', 2, [1, 1], 3)] },
      { name: 'Full Body B', exercises: [E('Dumbbell Goblet Squat', 3, [8, 12]), E('Push-up', 3, [8, 15]), E('Inverted Row', 3, [8, 12]), E('Barbell Curl', 2, [10, 12]), E('Cable Pushdown', 2, [10, 12])] },
    ],
    boss: [{ name: 'Push-up', kind: 'amrap', target: 25, label: 'Push-ups AMRAP: 25 or more' }],
  },
  {
    id: 'home_calisthenics', name: 'Hollow Gate: Home Calisthenics', rank: 'E', color: 'blue', weeks: 6, daysPerWeek: 3, level: 'beginner', classes: ['assassin', 'ranger', 'healer'], equipment: 'home',
    description: 'No equipment but your body and a bar. Push, pull, squat, hinge, core.',
    days: [
      { name: 'Push & Legs', exercises: [E('Push-up', 4, [8, 15]), E('Bodyweight Squat', 4, [15, 25]), E('Dumbbell Lunge', 3, [10, 12]), E('Mountain Climber', 3, [20, 30])] },
      { name: 'Pull & Core', exercises: [E('Inverted Row', 4, [8, 12]), E('Chin-up', 3, [3, 8]), E('Hanging Leg Raise', 3, [8, 12]), E('Dead Bug', 3, [10, 12])] },
    ],
    boss: [{ name: 'Push-up', kind: 'amrap', target: 30, label: 'Push-ups AMRAP: 30 or more' }, { name: 'Bodyweight Squat', kind: 'amrap', target: 50, label: 'Squats AMRAP: 50 or more' }],
  },
  {
    id: 'mobility_sanctuary', name: 'Purple Sanctuary: Mobility', rank: 'E', color: 'purple', weeks: 4, daysPerWeek: 3, level: 'beginner', classes: ['healer'], equipment: 'home',
    description: 'Restore range of motion. Holds, tempo and control.',
    days: [
      { name: 'Lower Flow', exercises: [E('Hamstring Stretch', 2, [2, 2], 4), E('Glute Bridge March', 3, [10, 12], 3), E("Child's Pose", 2, [2, 2], 4), E('Dead Bug', 3, [8, 10], 3)] },
      { name: 'Upper Flow', exercises: [E('Cat Stretch', 2, [2, 2], 4), E('Face Pull', 3, [12, 15], 3), E('Plank', 3, [1, 1], 3)] },
    ],
    boss: [{ name: 'Plank', kind: 'amrap', target: 90, label: 'Plank hold: 90 seconds' }],
  },
  {
    id: 'upper_lower', name: 'Twin Gate: Upper / Lower', rank: 'D', color: 'blue', weeks: 8, daysPerWeek: 4, level: 'intermediate', classes: ['tank', 'fighter'], equipment: 'gym',
    description: 'Four days, each muscle twice a week, compounds then accessories.',
    days: [
      { name: 'Upper A', exercises: [E(BP, 4, [6, 8]), E(ROW, 4, [6, 8]), E('Dumbbell Shoulder Press', 3, [8, 12]), E('Pull-up', 3, [6, 10]), E('Barbell Curl', 3, [10, 12]), E('Cable Pushdown', 3, [10, 12])] },
      { name: 'Lower A', exercises: [E(SQ, 4, [6, 8]), E('Barbell Romanian Deadlift', 3, [8, 10]), E('Leg Press', 3, [10, 12]), E('Lever Lying Leg Curl', 3, [10, 12]), E('Barbell Standing Calf Raise', 3, [10, 15])] },
      { name: 'Upper B', exercises: [E('Dumbbell Incline Bench Press', 4, [8, 10]), E('Cable Seated Row', 4, [8, 10]), E(OHP, 3, [6, 8]), E('Dumbbell Lateral Raise', 3, [12, 15]), E('Face Pull', 3, [12, 15])] },
      { name: 'Lower B', exercises: [E(DL, 3, [4, 6]), E('Barbell Front Squat', 3, [6, 8]), E('Dumbbell Lunge', 3, [10, 12]), E('Lever Leg Extension', 3, [12, 15]), E('Hanging Leg Raise', 3, [10, 12])] },
    ],
    boss: [{ name: SQ, kind: 'amrap', pct: 0.8, target: 8, label: 'Squat AMRAP at 80% e1RM: 8 reps' }, { name: BP, kind: 'amrap', pct: 0.8, target: 8, label: 'Bench AMRAP at 80% e1RM: 8 reps' }],
  },
  {
    id: 'strength_foundations', name: 'Iron Gate: Strength Foundations', rank: 'D', color: 'blue', weeks: 8, daysPerWeek: 3, level: 'intermediate', classes: ['fighter'], equipment: 'gym',
    description: 'Heavy triples and fives on the big four, with back-off volume.',
    days: [
      { name: 'Squat Day', exercises: [E(SQ, 5, [3, 5], 2, { pct: 0.82 }), E('Barbell Romanian Deadlift', 3, [6, 8]), E('Hanging Leg Raise', 3, [8, 12])] },
      { name: 'Press Day', exercises: [E(BP, 5, [3, 5], 2, { pct: 0.82 }), E(OHP, 3, [5, 6]), E('Pull-up', 4, [5, 8])] },
      { name: 'Pull Day', exercises: [E(DL, 3, [3, 5], 2, { pct: 0.82 }), E(ROW, 4, [5, 8]), E('Barbell Curl', 3, [8, 10])] },
    ],
    boss: [{ name: SQ, kind: 'e1rm', target: 1.05, label: 'Squat e1RM +5%' }, { name: DL, kind: 'e1rm', target: 1.05, label: 'Deadlift e1RM +5%' }, { name: BP, kind: 'e1rm', target: 1.03, label: 'Bench e1RM +3%' }],
  },
  {
    id: 'conditioning_gauntlet', name: 'Gauntlet Gate: Conditioning', rank: 'D', color: 'blue', weeks: 6, daysPerWeek: 3, level: 'intermediate', classes: ['assassin', 'ranger'], equipment: 'gym',
    description: 'High-rep circuits, short rest, work density climbs each week.',
    days: [
      { name: 'Circuit A', exercises: [E('Kettlebell Swing', 4, [15, 20]), E('Push-up', 4, [15, 20]), E('Jump Squat', 4, [12, 15]), E('Mountain Climber', 4, [30, 40])] },
      { name: 'Circuit B', exercises: [E('Dumbbell Goblet Squat', 4, [15, 20]), E('Inverted Row', 4, [12, 15]), E('Burpee', 4, [10, 15]), E('Russian Twist', 4, [20, 30])] },
    ],
    boss: [{ name: 'Burpee', kind: 'amrap', target: 40, label: 'Burpees in 3 minutes: 40' }],
  },
  {
    id: 'ppl', name: 'Trinity Gate: Push / Pull / Legs', rank: 'C', color: 'blue', weeks: 8, daysPerWeek: 6, level: 'intermediate', classes: ['tank'], equipment: 'gym',
    description: 'Six days, high frequency hypertrophy. Recovery matters: listen to the System.',
    days: [
      { name: 'Push', exercises: [E(BP, 4, [6, 10]), E('Dumbbell Shoulder Press', 3, [8, 12]), E('Dumbbell Incline Bench Press', 3, [8, 12]), E('Dumbbell Lateral Raise', 4, [12, 20]), E('Cable Pushdown', 3, [10, 15])] },
      { name: 'Pull', exercises: [E('Pull-up', 4, [6, 10]), E(ROW, 3, [8, 10]), E('Face Pull', 3, [12, 15]), E('Barbell Curl', 3, [8, 12])] },
      { name: 'Legs', exercises: [E(SQ, 4, [6, 10]), E('Barbell Romanian Deadlift', 3, [8, 10]), E('Leg Press', 3, [10, 15]), E('Lever Lying Leg Curl', 3, [10, 15]), E('Barbell Standing Calf Raise', 4, [10, 15])] },
    ],
    boss: [{ name: BP, kind: 'amrap', pct: 0.75, target: 10, label: 'Bench AMRAP at 75%: 10 reps' }, { name: SQ, kind: 'amrap', pct: 0.75, target: 10, label: 'Squat AMRAP at 75%: 10 reps' }],
  },
  {
    id: 'phul', name: 'Storm Gate: Power-Hypertrophy', rank: 'C', color: 'blue', weeks: 8, daysPerWeek: 4, level: 'intermediate', classes: ['fighter', 'tank', 'ranger'], equipment: 'gym',
    description: 'Two power days, two hypertrophy days. Strength and size together.',
    days: [
      { name: 'Upper Power', exercises: [E(BP, 4, [3, 5]), E(ROW, 4, [3, 5]), E(OHP, 3, [5, 8]), E('Barbell Curl', 3, [6, 10])] },
      { name: 'Lower Power', exercises: [E(SQ, 4, [3, 5]), E(DL, 3, [3, 5]), E('Leg Press', 3, [10, 15]), E('Barbell Standing Calf Raise', 4, [6, 10])] },
      { name: 'Upper Hypertrophy', exercises: [E('Dumbbell Incline Bench Press', 4, [8, 12]), E('Cable Seated Row', 4, [8, 12]), E('Dumbbell Lateral Raise', 4, [10, 15]), E('Cable Pushdown', 3, [10, 15])] },
      { name: 'Lower Hypertrophy', exercises: [E('Barbell Front Squat', 4, [8, 12]), E('Barbell Romanian Deadlift', 3, [8, 12]), E('Lever Leg Extension', 3, [10, 15]), E('Lever Lying Leg Curl', 3, [10, 15])] },
    ],
    boss: [{ name: SQ, kind: 'e1rm', target: 1.04, label: 'Squat e1RM +4%' }, { name: BP, kind: 'e1rm', target: 1.03, label: 'Bench e1RM +3%' }],
  },
  {
    id: 'wendler', name: 'Sovereign Gate: 5/3/1', rank: 'B', color: 'blue', weeks: 12, daysPerWeek: 4, level: 'advanced', classes: ['fighter'], equipment: 'gym',
    description: 'Wendler-style waves on a training max: 5s, 3s, 5/3/1, then deload. Slow, relentless strength.',
    days: [
      { name: 'Press', exercises: [E(OHP, 3, [1, 5], 1, { pct: 0.85, amrapLast: true }), E('Pull-up', 5, [5, 10]), E('Push-up', 5, [10, 20])] },
      { name: 'Deadlift', exercises: [E(DL, 3, [1, 5], 1, { pct: 0.85, amrapLast: true }), E('Barbell Romanian Deadlift', 3, [8, 10]), E('Hanging Leg Raise', 4, [10, 15])] },
      { name: 'Bench', exercises: [E(BP, 3, [1, 5], 1, { pct: 0.85, amrapLast: true }), E(ROW, 5, [8, 10]), E('Cable Pushdown', 3, [12, 15])] },
      { name: 'Squat', exercises: [E(SQ, 3, [1, 5], 1, { pct: 0.85, amrapLast: true }), E('Dumbbell Lunge', 3, [10, 12]), E('Lever Lying Leg Curl', 3, [10, 12])] },
    ],
    boss: [{ name: SQ, kind: 'e1rm', target: 1.05, label: 'Squat e1RM +5%' }, { name: DL, kind: 'e1rm', target: 1.05, label: 'Deadlift e1RM +5%' }, { name: BP, kind: 'e1rm', target: 1.03, label: 'Bench e1RM +3%' }, { name: OHP, kind: 'e1rm', target: 1.03, label: 'Press e1RM +3%' }],
  },
  {
    id: 'athlete_protocol', name: 'Hunter Gate: Athlete Protocol', rank: 'B', color: 'blue', weeks: 10, daysPerWeek: 3, level: 'advanced', classes: ['ranger'], equipment: 'gym',
    description: 'Undulating heavy, medium and light days with jumps and carries.',
    days: [
      { name: 'Heavy', exercises: [E('Front Box Jump', 4, [3, 5], 3), E(SQ, 4, [3, 5]), E('Pull-up', 4, [5, 8]), E('Kettlebell Swing', 3, [10, 15])] },
      { name: 'Light', exercises: [E('Jump Squat', 3, [5, 6], 3), E('Dumbbell Goblet Squat', 3, [10, 12]), E('Push-up', 3, [15, 20]), E('Mountain Climber', 3, [30, 40])] },
      { name: 'Medium', exercises: [E('Front Box Jump', 3, [4, 6], 3), E(DL, 4, [6, 8]), E(BP, 4, [6, 8]), E('Inverted Row', 3, [10, 12])] },
    ],
    boss: [{ name: SQ, kind: 'amrap', pct: 0.8, target: 8, label: 'Squat AMRAP at 80%: 8 reps' }, { name: 'Pull-up', kind: 'amrap', target: 12, label: 'Pull-ups: 12' }],
  },
  {
    id: 'hypertrophy_block', name: 'Abyss Gate: Hypertrophy Block', rank: 'B', color: 'blue', weeks: 10, daysPerWeek: 5, level: 'advanced', classes: ['tank'], equipment: 'gym',
    description: 'Volume ramps toward your recoverable maximum, then the boss.',
    days: [
      { name: 'Chest & Back', exercises: [E(BP, 4, [6, 10]), E('Pull-up', 4, [6, 10]), E('Dumbbell Incline Bench Press', 3, [8, 12]), E('Cable Seated Row', 3, [10, 12])] },
      { name: 'Legs', exercises: [E(SQ, 4, [6, 10]), E('Barbell Romanian Deadlift', 4, [8, 10]), E('Lever Leg Extension', 3, [12, 15]), E('Lever Lying Leg Curl', 3, [12, 15])] },
      { name: 'Shoulders & Arms', exercises: [E('Dumbbell Shoulder Press', 4, [8, 12]), E('Dumbbell Lateral Raise', 4, [12, 20]), E('Barbell Curl', 3, [8, 12]), E('Cable Pushdown', 3, [10, 15])] },
      { name: 'Upper Pump', exercises: [E('Dumbbell Bench Press', 3, [10, 12]), E(ROW, 3, [10, 12]), E('Face Pull', 3, [15, 20])] },
      { name: 'Lower Pump', exercises: [E('Leg Press', 4, [12, 15]), E('Dumbbell Lunge', 3, [12, 12]), E('Barbell Standing Calf Raise', 4, [12, 20])] },
    ],
    boss: [{ name: BP, kind: 'amrap', pct: 0.7, target: 12, label: 'Bench AMRAP at 70%: 12 reps' }, { name: SQ, kind: 'amrap', pct: 0.7, target: 12, label: 'Squat AMRAP at 70%: 12 reps' }],
  },
  // Red Gates: opt-in 7-day challenges that cannot be paused (game-design §9).
  {
    id: 'red_frost', name: 'Red Gate: Frozen Wastes', rank: 'C', color: 'red', weeks: 1, daysPerWeek: 7, level: 'intermediate', classes: ['assassin', 'ranger', 'fighter', 'tank', 'healer'], equipment: 'home', red: true,
    description: 'Seven days, seven trials. The gate seals behind you.',
    days: [{ name: 'Survival Day', exercises: [E('Push-up', 5, [15, 20]), E('Bodyweight Squat', 5, [20, 30]), E('Plank', 3, [1, 1], 3), E('Burpee', 3, [10, 12])] }],
    boss: [{ name: 'Burpee', kind: 'amrap', target: 50, label: 'Day 7: 50 burpees for time' }],
  },
  {
    id: 'red_inferno', name: 'Red Gate: Inferno', rank: 'B', color: 'red', weeks: 1, daysPerWeek: 7, level: 'advanced', classes: ['assassin', 'ranger', 'fighter', 'tank'], equipment: 'gym', red: true,
    description: 'Seven days of heat. Heavy one day, fast the next. No retreat.',
    days: [
      { name: 'Heat', exercises: [E('Kettlebell Swing', 5, [20, 20]), E('Pull-up', 5, [5, 10]), E('Jump Squat', 5, [10, 10])] },
      { name: 'Forge', exercises: [E(SQ, 5, [5, 5]), E(BP, 5, [5, 5]), E(ROW, 5, [5, 5])] },
    ],
    boss: [{ name: SQ, kind: 'amrap', pct: 0.7, target: 15, label: 'Day 7: squat AMRAP at 70%: 15 reps' }],
  },
]

/** Instant Dungeons: short bonus workouts opened with a key (game-design §9). */
export const INSTANT_DUNGEONS: ProgramDay[] = [
  { name: 'Armory of Arms', exercises: [E('Barbell Curl', 3, [10, 12]), E('Cable Pushdown', 3, [10, 12]), E('Dumbbell Lateral Raise', 3, [12, 15])] },
  { name: 'Core Catacomb', exercises: [E('Hanging Leg Raise', 3, [10, 12]), E('Russian Twist', 3, [20, 30]), E('Plank', 3, [1, 1], 3), E('Dead Bug', 3, [10, 12])] },
  { name: 'Conditioning Crypt', exercises: [E('Burpee', 4, [10, 12]), E('Mountain Climber', 4, [30, 30]), E('Jump Squat', 4, [12, 15])] },
]
