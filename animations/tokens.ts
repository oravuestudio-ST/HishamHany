/**
 * Motion tokens v2 — the derived timing scale behind the editorial-cinematic
 * redesign (docs/plans/2026-07-04-cinematic-motion-redesign-design.md).
 *
 * One master unit; every duration is a fixed multiple of it, so the whole
 * site re-paces from a single number. Consumed via lib/motion.ts (which keeps
 * the legacy MOTION shape) — components never import this file directly.
 */

/** Master timing unit, seconds. The site's pace in one number. */
export const BASE_UNIT = 1.1

/**
 * Duration scale, seconds — BASE_UNIT × {0.32, 0.64, 1, 1.45, 2}.
 *   micro     → hovers, presses, cursor states
 *   swift     → menus, small entrances, image hover settles
 *   reveal    → canonical scroll reveal
 *   cinematic → headline lines, case covers, section-scale moments
 *   hero      → the page-load hero beat only — never scroll reveals
 */
export const DUR = {
  micro: 0.35,
  swift: 0.7,
  reveal: 1.1,
  cinematic: 1.6,
  hero: 2.2,
} as const

/**
 * The easing family. One curve per job — using a single curve everywhere is
 * what makes motion feel templated.
 *   settle → entrances and reveals: long decelerating tail, the gallery feel
 *   drift  → parallax and scrub-adjacent motion: barely curved, never fights scroll
 *   touch  → hovers and presses: responds fast, lands soft
 */
export const EASE = {
  settle: [0.16, 1, 0.3, 1],
  drift: [0.33, 0, 0.2, 1],
  touch: [0.3, 0.9, 0.3, 1],
} as const

export const EASE_CSS = {
  settle: 'cubic-bezier(0.16, 1, 0.3, 1)',
  drift: 'cubic-bezier(0.33, 0, 0.2, 1)',
  touch: 'cubic-bezier(0.3, 0.9, 0.3, 1)',
} as const

/** Stagger between siblings, seconds — wide gaps create the unfolding rhythm. */
export const STAGGER = {
  lines: 0.12,
  images: 0.09,
} as const

/** Scroll reveals travel this many px. Less travel, longer time. */
export const REVEAL_DISTANCE = 40

/** Parallax travel ceilings, px (negative = moves up as you scroll down). */
export const PARALLAX = {
  background: -60,
  foreground: -30,
} as const

/**
 * Magnetic pull — primary CTAs only, and never past this many px. The pull
 * should be clearly felt on the few buttons that matter, invisible elsewhere.
 */
export const MAGNETIC_MAX = 12

/**
 * Lenis smooth-scroll tune. lerp (not duration mode) so the weight is
 * constant regardless of scroll delta — heavier than stock, but tuned to
 * never visibly lag trackpad input.
 */
export const LENIS = {
  lerp: 0.075,
  wheelMultiplier: 0.8,
  touchMultiplier: 1.5,
} as const
