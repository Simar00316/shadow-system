// System voice: picks a message variant per event, never the same variant twice in a row (PRD §3 System voice).
import catalogue from '@/data/system-messages.json'

export type MessageEvent = keyof typeof catalogue
const CAT = catalogue as Record<string, string[]>

/** Fill {placeholders}. Unknown placeholders are left visible so they are caught in review. */
export const fill = (t: string, vars: Record<string, string | number> = {}) => t.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))

/**
 * Choose a variant. `last` maps event → last index used; the chosen index is written back.
 * Variants whose placeholders cannot be filled are skipped.
 */
export function systemMessage(event: MessageEvent, vars: Record<string, string | number> = {}, last: Map<string, number> = new Map(), rand: () => number = Math.random) {
  const list = CAT[event]
  const usable = list.map((t, i) => ({ t, i })).filter(({ t }) => [...t.matchAll(/\{(\w+)\}/g)].every((m) => m[1] in vars))
  const pool = usable.length > 1 ? usable.filter(({ i }) => i !== last.get(event)) : usable.length ? usable : list.map((t, i) => ({ t, i }))
  const pick = pool[Math.floor(rand() * pool.length)]
  last.set(event, pick.i)
  return fill(pick.t, vars)
}

export const MESSAGE_EVENTS = Object.keys(CAT) as MessageEvent[]
