// Shared visual-effects state (research/design-v2.md §4.7).
// Cold start: the first screen after launch renders already visible (no materialise, no tear), which keeps
// Largest Contentful Paint fast. Effects switch on at the first navigation or tap.
let warm = false
export const isWarm = () => warm
export function warmUp() { warm = true }
if (typeof window !== 'undefined') addEventListener('pointerdown', warmUp, { once: true, capture: true })

const reduced = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.reduceMotion === 'true'
const last = new WeakMap<Element, number>()

/** (b) Tap glitch: one delegated listener for every `[data-glitch]` element, at most once per 700 ms per element. */
export function installTapGlitch() {
  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-glitch]')
    if (!el || reduced()) return
    const now = performance.now()
    if (now - (last.get(el) ?? 0) < 700) return
    last.set(el, now)
    el.style.setProperty('--gy', `${Math.floor(Math.random() * 70)}%`)
    el.classList.remove('is-glitching')
    void el.offsetWidth // restart the animation
    el.classList.add('is-glitching')
    el.addEventListener('animationend', () => el.classList.remove('is-glitching'), { once: true })
  }, { passive: true, capture: true })
}
