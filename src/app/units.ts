// Display units per section (PRD Settings: kg or lb for lifts and bodyweight separately).
import { fromKg, roundDisplay, toKg } from '@/engine/strength'
import { useProfile } from './hooks'

export function useUnits() {
  const u = useProfile()?.units ?? { lift: 'kg', body: 'kg', distance: 'km', height: 'cm' }
  return {
    ...u,
    lift: u.lift as 'kg' | 'lb',
    body: u.body as 'kg' | 'lb',
    /** kg → display number in lift units */
    w: (kg: number | null | undefined) => (kg == null ? null : roundDisplay(fromKg(kg, u.lift), u.lift)),
    /** display lift number → kg */
    kg: (v: number) => toKg(v, u.lift),
    bw: (kg: number) => roundDisplay(fromKg(kg, u.body), u.body),
    bwKg: (v: number) => toKg(v, u.body),
    km: (km: number) => (u.distance === 'km' ? km : km / 1.609344),
    toKm: (v: number) => (u.distance === 'km' ? v : v * 1.609344),
    step: u.lift === 'kg' ? 2.5 : 5,
  }
}
