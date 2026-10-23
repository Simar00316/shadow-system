// Original shadow soldiers (game-design §10). Each answers a kind of victory; art is procedural (ShadowArt).
import type { Stat } from '@/engine/types'
import type { Archetype } from '@/ui/ShadowArt'

export type ShadowTheme = 'squat' | 'bench' | 'deadlift' | 'ohp' | 'pull' | 'cardio' | 'boss' | 'castle' | 'trial' | 'any'
export type ShadowDef = { id: string; name: string; epithet: string; archetype: Archetype; category: Stat; theme: ShadowTheme; lore: string }

export const SHADOWS: ShadowDef[] = [
  { id: 'ferros', name: 'Ferros', epithet: 'Warden of the Iron Squat', archetype: 'giant', category: 'str', theme: 'squat', lore: 'A gatekeeper who held a collapsing tunnel on his shoulders for a night and a day. He kneels only to the one who out-lifted him.' },
  { id: 'vanta', name: 'Vanta', epithet: 'The Pressing Knight', archetype: 'knight', category: 'str', theme: 'bench', lore: 'Her shield was a slab of black stone she pushed away from her chest until the dungeon gave up.' },
  { id: 'grael', name: 'Grael', epithet: 'Lifter of Graves', archetype: 'beast', category: 'str', theme: 'deadlift', lore: 'He dragged the fallen out of the Double Dungeon one by one. Now he drags weight off the floor for you.' },
  { id: 'aerin', name: 'Aerin', epithet: 'Skybreaker', archetype: 'wyvern', category: 'str', theme: 'ohp', lore: 'A wyvern that never landed. Every press overhead feeds its wings.' },
  { id: 'kesh', name: 'Kesh', epithet: 'Climber of the Black Spire', archetype: 'assassin', category: 'str', theme: 'pull', lore: 'Scaled the Demon Castle wall barehanded. Pulls himself up by will alone.' },
  { id: 'syl', name: 'Syl', epithet: 'Wind Over Sand', archetype: 'serpent', category: 'agi', theme: 'cardio', lore: 'Born in the Penalty Zone desert. Outran every centipede and never stopped running.' },
  { id: 'mordrake', name: 'Mordrake', epithet: 'Gate Tyrant', archetype: 'giant', category: 'str', theme: 'boss', lore: 'The ruler of a C-rank gate who demanded tribute in sweat. Paid in full.' },
  { id: 'hexa', name: 'Hexa', epithet: 'Queen of the Swarm', archetype: 'insect', category: 'agi', theme: 'boss', lore: 'Her hive covered six floors. She serves the one who cleared them in a single week.' },
  { id: 'cinder', name: 'Cinder', epithet: 'Hound of the Gate', archetype: 'beast', category: 'vit', theme: 'castle', lore: 'The three-headed guard of the first floor. Each head remembers a different day you did not quit.' },
  { id: 'veyra', name: 'Veyra', epithet: 'Witch of the Fiftieth Floor', archetype: 'mage', category: 'int', theme: 'castle', lore: 'She brewed elixirs from discipline. Ask her what you ate yesterday; she knows.' },
  { id: 'oath', name: 'Oath', epithet: 'The Sworn Knight', archetype: 'knight', category: 'vit', theme: 'trial', lore: 'He swore to guard a throne that was never filled. He has found his king.' },
  { id: 'nyx', name: 'Nyx', epithet: 'Shade of the Seventy-Fifth Floor', archetype: 'assassin', category: 'per', theme: 'castle', lore: 'She sees the flaw in every rep before you feel it.' },
  { id: 'brann', name: 'Brann', epithet: 'Stone Tusk', archetype: 'beast', category: 'str', theme: 'boss', lore: 'A boar-king who charged the same wall for a thousand years until it broke.' },
  { id: 'lior', name: 'Lior', epithet: 'Lantern Mage', archetype: 'mage', category: 'per', theme: 'trial', lore: 'Carries a light that shows the true shape of a movement.' },
  { id: 'zarek', name: 'Zarek', epithet: 'Marshal of Ash', archetype: 'knight', category: 'str', theme: 'trial', lore: 'Commanded the last army of a fallen Monarch. Now he commands yours.' },
  { id: 'umbra', name: 'Umbra', epithet: 'The Coiled Dark', archetype: 'serpent', category: 'vit', theme: 'any', lore: 'No one remembers defeating Umbra. Umbra remembers.' },
  { id: 'rook', name: 'Rook', epithet: 'Iron Sentinel', archetype: 'giant', category: 'vit', theme: 'any', lore: 'Stood watch at a red gate for seven days without sleep.' },
  { id: 'mire', name: 'Mire', epithet: 'Bog Strider', archetype: 'insect', category: 'agi', theme: 'cardio', lore: 'Crossed a swamp floor in one breath. Your intervals feed its legs.' },
  { id: 'kaelith', name: 'Kaelith', epithet: 'Dragon of the Hundredth Floor', archetype: 'wyvern', category: 'str', theme: 'castle', lore: 'The tower’s final guardian. Its fire now lights your way.' },
  { id: 'sable', name: 'Sable', epithet: 'Grand Marshal of Night', archetype: 'knight', category: 'str', theme: 'any', lore: 'The first and last of the army. Appears only to a National Level Hunter.' },
]

export const shadowById = new Map(SHADOWS.map((s) => [s.id, s]))
