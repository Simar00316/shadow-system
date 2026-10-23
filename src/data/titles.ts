// Titles (game-design §13): named rewards for specific feats. One equipped at a time: +3% XP in its category.
import type { Stat } from '@/engine/types'
import type { Snapshot } from '@/engine/quests'

export type TitleDef = { id: string; name: string; description: string; category: Stat; test: (s: Snapshot) => boolean }
const T = (id: string, name: string, description: string, category: Stat, test: (s: Snapshot) => boolean): TitleDef => ({ id, name, description, category, test })
const rank = (r: string) => (s: Snapshot) => s.ranksReached.includes(r)
const pr = (lift: string) => (s: Snapshot) => s.firstPrLifts.includes(lift)

export const TITLES: TitleDef[] = [
  // streaks (VIT)
  T('relentless', 'The Relentless', 'Cleared the Daily Quest 7 days in a row.', 'vit', (s) => s.bestStreak >= 7),
  T('habit_forged', 'Habit Forged', 'A 21-day streak. The habit has taken root.', 'vit', (s) => s.bestStreak >= 21),
  T('iron_will', 'Iron Will', 'A 30-day streak without breaking.', 'vit', (s) => s.bestStreak >= 30),
  T('sixty_six', 'Sixty-Six Days', 'The median day a habit becomes automatic.', 'vit', (s) => s.bestStreak >= 66),
  T('unbroken', 'Unbroken', 'One hundred days. The System is impressed.', 'vit', (s) => s.bestStreak >= 100),
  T('eternal_hunter', 'Eternal Hunter', 'A full year of Daily Quests.', 'vit', (s) => s.bestStreak >= 365),
  T('desert_walker', 'Desert Walker', 'Survived the Penalty Zone and restored the streak.', 'vit', (s) => s.penaltiesCleared >= 1),
  T('phoenix', 'Phoenix', 'Returned after a long absence.', 'vit', (s) => s.comebacks >= 1),
  T('patient_warrior', 'Patient Warrior', 'Completed a Recovery Phase as ordered.', 'vit', (s) => s.deloads >= 1),
  T('recovery_sage', 'Recovery Sage', 'Five Recovery Phases completed.', 'vit', (s) => s.deloads >= 5),
  T('morning_ritual', 'Morning Ritual', 'Thirty readiness check-ins.', 'vit', (s) => s.readinessDays >= 30),
  T('daily_devotee', 'Daily Devotee', 'Fifty Daily Quests cleared.', 'vit', (s) => s.dailyCleared >= 50),
  T('questbound', 'Questbound', 'Two hundred Daily Quests cleared.', 'vit', (s) => s.dailyCleared >= 200),
  T('flawless_week', 'Flawless Week', 'Every Daily Quest, Monday to Sunday.', 'vit', (s) => s.perfectWeeks >= 1),
  T('dawn_hunter', 'Dawn Hunter', 'Trained before the sun rose.', 'vit', (s) => s.earlyWorkouts >= 1),
  T('night_stalker', 'Night Stalker', 'Trained in the dead of night.', 'vit', (s) => s.lateWorkouts >= 1),
  // workouts and strength (STR)
  T('first_step', 'First Step', 'Completed the first workout.', 'str', (s) => s.workouts >= 1),
  T('dungeon_regular', 'Dungeon Regular', 'Twenty-five workouts completed.', 'str', (s) => s.workouts >= 25),
  T('hundred_battles', 'Hundred Battles', 'One hundred workouts completed.', 'str', (s) => s.workouts >= 100),
  T('legion_of_one', 'Legion of One', 'Two hundred and fifty workouts completed.', 'str', (s) => s.workouts >= 250),
  T('thousand_battles', 'Veteran of a Thousand Battles', 'Five hundred workouts completed.', 'str', (s) => s.workouts >= 500),
  T('leg_day_survivor', 'Leg Day Survivor', 'Ten lower-body sessions survived.', 'str', (s) => s.legDays >= 10),
  T('wolf_slayer', 'Wolf Slayer', 'First squat personal record.', 'str', pr('squat')),
  T('bench_baron', 'Bench Baron', 'First bench press personal record.', 'str', pr('bench')),
  T('grave_lifter', 'Grave Lifter', 'First deadlift personal record.', 'str', pr('deadlift')),
  T('sky_presser', 'Sky Presser', 'First overhead press personal record.', 'str', pr('ohp')),
  T('limit_breaker', 'Limit Breaker', 'Ten personal records.', 'str', (s) => s.prs >= 10),
  T('record_hunter', 'Record Hunter', 'Fifty personal records.', 'str', (s) => s.prs >= 50),
  T('ten_tonnes', 'Ten Tonnes', '10,000 kg lifted in total.', 'str', (s) => s.totalVolumeKg >= 10_000),
  T('mountain_mover', 'Mountain Mover', '100,000 kg lifted in total.', 'str', (s) => s.totalVolumeKg >= 100_000),
  T('titans_burden', "Titan's Burden", '1,000,000 kg lifted in total.', 'str', (s) => s.totalVolumeKg >= 1_000_000),
  T('beyond_limits', 'Beyond Limits', 'Did double the Daily Quest, safely.', 'str', (s) => s.overachieverDays >= 1),
  T('arsenal_master', 'Arsenal Master', 'Five equipment types in one week.', 'str', (s) => s.equipmentTypesThisWeek >= 5),
  // levels and ranks
  T('awakened', 'The Awakened', 'Reached level 5.', 'vit', (s) => s.level >= 5),
  T('rising_hunter', 'Rising Hunter', 'Reached level 10.', 'str', (s) => s.level >= 10),
  T('seasoned', 'Seasoned Hunter', 'Reached level 25.', 'str', (s) => s.level >= 25),
  T('half_century', 'Half-Century', 'Reached level 50.', 'str', (s) => s.level >= 50),
  T('centennial', 'Centennial', 'Reached level 100.', 'str', (s) => s.level >= 100),
  T('rank_d', 'D-Rank Hunter', 'Passed the D-rank trial.', 'str', rank('D')),
  T('rank_c', 'C-Rank Hunter', 'Passed the C-rank trial.', 'str', rank('C')),
  T('rank_b', 'B-Rank Hunter', 'Passed the B-rank trial.', 'str', rank('B')),
  T('rank_a', 'A-Rank Hunter', 'Passed the A-rank trial.', 'str', rank('A')),
  T('rank_s', 'S-Rank Hunter', 'Passed the S-rank trial.', 'str', rank('S')),
  T('national', 'National Level Hunter', 'Equal to the strength of a nation.', 'str', rank('National')),
  T('adversity', 'One Who Overcame Adversity', 'Cleared the Job Change Quest.', 'str', (s) => s.jobChanged),
  T('monarch', 'Monarch of Shadows', 'Took up the hidden class.', 'str', (s) => s.cls === 'shadow_monarch'),
  // dungeons and shadows
  T('gatebreaker', 'Gatebreaker', 'Cleared a first Boss Raid.', 'str', (s) => s.bossRaids >= 1),
  T('raid_leader', 'Raid Leader', 'Cleared five Boss Raids.', 'str', (s) => s.bossRaids >= 5),
  T('red_gate_survivor', 'Red Gate Survivor', 'Entered a Red Gate and walked out.', 'agi', (s) => s.redGates >= 1),
  T('cerberus_bane', 'Cerberus Bane', 'Cleared the first floor of the Demon Castle.', 'str', (s) => s.demonFloor >= 1),
  T('demon_hunter', 'Demon Hunter', 'Reached floor 25 of the Demon Castle.', 'str', (s) => s.demonFloor >= 25),
  T('castle_conqueror', 'Castle Conqueror', 'Reached the top of the Demon Castle.', 'str', (s) => s.demonFloor >= 100),
  T('keymaster', 'Keymaster', 'Cleared ten Instant Dungeons.', 'str', (s) => s.instantDungeons >= 10),
  T('necromancer', 'Necromancer', 'Extracted a first shadow.', 'per', (s) => s.shadows >= 1),
  T('shadow_commander', 'Shadow Commander', 'Five shadows in the army.', 'per', (s) => s.shadows >= 5),
  T('army_of_one', 'Army of One', 'Fifteen shadows answer your call.', 'per', (s) => s.shadows >= 15),
  // cardio (AGI)
  T('wanderer', 'Wanderer', '10 km of cardio logged.', 'agi', (s) => s.cardioKm >= 10),
  T('roadrunner', 'Roadrunner', '42.2 km in a single week.', 'agi', (s) => s.cardioKmThisWeek >= 42.2),
  T('long_road', 'The Long Road', '100 km of cardio logged.', 'agi', (s) => s.cardioKm >= 100),
  T('endless_stride', 'Endless Stride', '500 km of cardio logged.', 'agi', (s) => s.cardioKm >= 500),
  // nutrition (INT)
  T('quartermaster', 'Quartermaster', 'One hundred meals logged.', 'int', (s) => s.mealsLogged >= 100),
  T('iron_stomach', 'Iron Stomach', 'Five hundred meals logged.', 'int', (s) => s.mealsLogged >= 500),
  T('disciplined_palate', 'Disciplined Palate', 'Protein target hit on 30 days.', 'int', (s) => s.proteinDays >= 30),
  T('tidecaller', 'Tidecaller', 'Water target 30 days in a row.', 'int', (s) => s.waterStreak >= 30),
  // form (PER)
  T('eagle_eye', 'Eagle Eye', 'Five sets of near-perfect form.', 'per', (s) => s.formGoodSets >= 5),
  T('true_form', 'True Form', 'Fifty sets of near-perfect form.', 'per', (s) => s.formGoodSets >= 50),
  // misc
  T('merchants_friend', "Merchant's Friend", 'Earned 10,000 gold.', 'vit', (s) => s.goldEarned >= 10_000),
  T('collector_of_names', 'Collector of Names', 'Unlocked twenty titles.', 'per', (s) => s.titles >= 20),
]

export const titleById = new Map(TITLES.map((t) => [t.id, t]))

export function newTitles(s: Snapshot, owned: Set<string>) {
  return TITLES.filter((t) => !owned.has(t.id) && t.test(s))
}
