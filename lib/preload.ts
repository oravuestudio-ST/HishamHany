/**
 * Real progress for the home intro. The count the loader shows is driven by
 * genuine milestones — the hero photo decoded, the two type families ready —
 * never by a timer. A pacing policy shapes how the shown number travels toward
 * that real value, and a clamp around the policy guarantees the bounds the
 * intro must never break: no going backwards, no finishing before
 * LOAD.minCount, always finishing by LOAD.maxWait.
 */

/** Milestone weights — roughly proportional to bytes on the wire. */
export const MILESTONE_WEIGHTS = {
  hero: 0.7,
  serif: 0.15,
  mono: 0.15,
} as const

export type Milestone = keyof typeof MILESTONE_WEIGHTS

// ── Hero image milestone ───────────────────────────────────────────────────
// Hero.tsx and Loader.tsx are siblings, so the photo's readiness is handed
// over through this module rather than props. next/image's onLoad awaits
// decode() and also fires for an image that finished before hydration.

let heroSettled = false
const heroListeners = new Set<() => void>()

/** Called by the hero image's onLoad / onError — a broken image still settles. */
export function markHeroSettled(): void {
  if (heroSettled) return
  heroSettled = true
  heroListeners.forEach((fn) => fn())
  heroListeners.clear()
}

/** Resolves once the hero image has loaded (or failed). */
export function heroReady(): Promise<void> {
  if (heroSettled) return Promise.resolve()
  return new Promise((resolve) => heroListeners.add(resolve))
}

/** Test seam — module state survives between vitest cases otherwise. */
export function resetPreloadState(): void {
  heroSettled = false
  heroListeners.clear()
}

// ── Font milestones ────────────────────────────────────────────────────────
// next/font registers hashed family names (e.g. "__Bodoni_Moda_1a2b3c"), so a
// literal "Bodoni Moda" lookup matches nothing and resolves instantly. Read
// the generated family list from the CSS variable next/font sets on <html>.

function fontFamilyFromVar(name: '--font-serif' | '--font-mono'): string | null {
  if (typeof document === 'undefined') return null
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || null
}

/** Loads the faces the intro and hero actually paint. Never rejects. */
export function fontReady(kind: 'serif' | 'mono'): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve()
  const family = fontFamilyFromVar(kind === 'serif' ? '--font-serif' : '--font-mono')
  if (!family) return Promise.resolve()
  const faces = kind === 'serif'
    ? [`400 1em ${family}`, `italic 400 1em ${family}`]
    : [`400 1em ${family}`]
  return Promise.allSettled(faces.map((f) => document.fonts.load(f))).then(() => undefined)
}

/**
 * Starts every milestone and reports the weighted fraction settled (0–1)
 * through `read()`. Failures count as settled: a missing font must never hold
 * the intro hostage.
 */
export function trackIntroAssets(): { read: () => number } {
  let real = 0
  const settle = (m: Milestone) => () => { real = Math.min(1, real + MILESTONE_WEIGHTS[m]) }
  heroReady().then(settle('hero'))
  fontReady('serif').then(settle('serif'))
  fontReady('mono').then(settle('mono'))
  return { read: () => real }
}

// ── Pacing ─────────────────────────────────────────────────────────────────

export interface PaceInput {
  /** Real progress, 0–1: the weighted fraction of milestones settled. */
  real: number
  /** The count currently on screen, 0–1. */
  shown: number
  /** Seconds since the previous frame. */
  dt: number
  /** Seconds the count has been running. */
  elapsed: number
}

/**
 * The pacing policy: how the number on screen chases real progress.
 *
 * Real progress arrives in three steps (hero 0.7, serif 0.15, mono 0.15), so
 * showing it raw would jump 000 → 070 → 085 → 100. The policy decides how the
 * count travels between those steps — e.g. ease toward `real` at some rate per
 * second, and optionally creep a little past it toward the next step so the
 * count never looks frozen on a slow connection.
 *
 * You don't need to handle the bounds: nextCount() below already clamps the
 * result (never backwards, never finished before LOAD.minCount, forced to 1 at
 * LOAD.maxWait). Return any 0–1 value.
 *
 * TODO(Hisham): shape the chase. Placeholder below shows real progress as-is.
 */
export function paceLoader({ real }: PaceInput): number {
  return real
}

export interface PaceBounds {
  /** Seconds the full count must last at minimum (LOAD.minCount). */
  minCount: number
  /** True once the asset deadline has passed — the count must finish. */
  deadline: boolean
}

/**
 * The bounds around the policy. Pure: everything it needs is passed in.
 *   - monotonic: never lower than what's already shown
 *   - honest: never above 1
 *   - paced: can't reach 100 before `minCount` seconds have run
 *   - finite: jumps to 1 once the deadline passes
 */
export function nextCount(input: PaceInput, bounds: PaceBounds): number {
  if (bounds.deadline) return 1
  const policy = paceLoader(input)
  const timeCap = bounds.minCount > 0 ? Math.min(1, input.elapsed / bounds.minCount) : 1
  const next = Math.min(policy, timeCap, 1)
  return Math.max(input.shown, Number.isFinite(next) ? next : input.shown)
}

/** "067" — the count as the loader prints it. */
export function formatCount(fraction: number): string {
  return String(Math.round(Math.min(1, Math.max(0, fraction)) * 100)).padStart(3, '0')
}
