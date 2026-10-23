// The System speaks: pick a message variant, show a toast, play the matching sound, and keep it in the System log.
import { db } from '@/db/schema'
import { uid } from '@/db/repo'
import { systemMessage, type MessageEvent } from '@/engine/messages'
import { useToasts, type ToastKind } from '@/state/toasts'
import { sfx, type SoundName } from '@/audio/sfx'

const last = new Map<string, number>()

const KIND: Partial<Record<MessageEvent, ToastKind>> = {
  daily_warning: 'warning', penalty_issued: 'warning', penalty_failed: 'warning', set_over_cap: 'warning', low_recovery: 'warning', dungeon_break: 'warning', red_gate_warning: 'warning', insufficient_gold: 'warning', streak_risk: 'warning', trial_postponed: 'warning',
  daily_cleared: 'success', penalty_cleared: 'success', floor_cleared: 'success', boss_cleared: 'success', red_gate_cleared: 'success', instant_cleared: 'success', emergency_cleared: 'success', workout_complete: 'success', hidden_quest: 'success',
  level_up: 'reward', rank_up: 'reward', pr: 'reward', loot_common: 'reward', loot_rare: 'reward', loot_epic: 'reward', loot_legendary: 'reward', title_unlocked: 'reward', job_change: 'reward', streak_milestone: 'reward', freeze_used: 'reward', second_wind: 'reward', purchase: 'reward',
  shadow_extracted: 'shadow', shadow_promoted: 'shadow',
}

const SOUND: Partial<Record<MessageEvent, SoundName>> = {
  daily_issued: 'notify', daily_cleared: 'quest-clear', daily_warning: 'penalty', penalty_issued: 'penalty', penalty_cleared: 'quest-clear', level_up: 'level-up', rank_up: 'rank-up', pr: 'pr',
  loot_common: 'loot-common', loot_rare: 'loot-rare', loot_epic: 'loot-epic', loot_legendary: 'loot-legendary', shadow_extracted: 'arise', boss_start: 'boss', boss_cleared: 'quest-clear',
  emergency_issued: 'notify', hidden_quest: 'quest-clear', title_unlocked: 'notify', insufficient_gold: 'error', set_over_cap: 'error', workout_complete: 'quest-clear', floor_cleared: 'quest-clear',
}

/** Speak as the System. `quiet` logs without toast or sound (used when many messages arrive at once). */
export async function say(event: MessageEvent, vars: Record<string, string | number> = {}, opts: { quiet?: boolean; kind?: ToastKind } = {}) {
  const text = systemMessage(event, vars, last)
  const kind = opts.kind ?? KIND[event] ?? 'info'
  if (!opts.quiet) {
    useToasts.getState().push(kind, text)
    const s = SOUND[event]
    if (s) sfx.play(s)
  }
  await db.systemMessages.add({ id: uid(), at: Date.now(), kind, text, event })
  return text
}
