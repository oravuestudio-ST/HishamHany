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

/**
 * Scroll-driven "vertical slot → full-bleed" hero reveal. A pinned image opens
 * its clip-path from a narrow centered column to full frame as you scroll,
 * while the overlaid headline holds, then eases up and out near completion.
 * Shared by the home hero and case-study headers so the unveil moves with one
 * voice (hook: useScrollReveal).
 *
 *   slotInset  → closed state: inset(top right bottom left). 34% each side =
 *                a gallery-frame column. This is the single most brand-defining
 *                number; widen it (smaller %) for a bolder open.
 *   openInset  → full-bleed end state.
 *   startScale → slight overscale at the closed state; settles to 1 as it opens
 *                so the photo "lands" rather than simply un-clipping.
 *   pin        → scroll budget the reveal plays across (home) / shorter for the
 *                denser case-study header.
 *   scrub      → seconds of smoothing between scroll and progress.
 *   textHold   → fraction of the reveal the headline holds before lifting.
 *   textLift   → px the headline travels up as it releases.
 */
const HERO_PIN_VH = 1.2
const CASE_PIN_VH = 0.8

export const REVEAL = {
  slotInset: 'inset(0% 34% 0% 34%)',
  openInset: 'inset(0% 0% 0% 0%)',
  startScale: 1.12,
  endScale: 1,
  /**
   * Reveal scroll budgets as multiples of viewport height. `pin` / `casePin`
   * are derived from them, and the header gate reuses the same numbers so
   * "reveal complete" and "header appears" stay in lockstep from one source —
   * on the home hero (pinVh) and on the shorter case-study cover (casePinVh).
   */
  pinVh: HERO_PIN_VH,
  pin: `+=${HERO_PIN_VH * 100}%`,
  casePinVh: CASE_PIN_VH,
  casePin: `+=${CASE_PIN_VH * 100}%`,
  scrub: 1,
  textHold: 0.62,
  textLift: -90,
  /**
   * Time-driven autoplay reveal (touch devices) — the same slot→full-bleed +
   * headline-lift keyframes, played on a timeline instead of scrubbed by a pin.
   * `autoplayDur` is the home-hero beat; case-study covers play quicker so they
   * don't slow down browsing (`caseAutoplayDur`). Seconds; scaled by MOBILE.dur.
   */
  autoplayDur: DUR.hero,
  caseAutoplayDur: DUR.cinematic,
} as const

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
 * Mobile adaptation — animations adapt rather than disappear. Below the
 * breakpoint, durations tighten and travel distances shrink: small screens
 * read closer, so the same pacing feels slower and the same distance bigger.
 */
export const MOBILE = {
  /** Viewport max-width (px) that counts as mobile. */
  maxWidth: 768,
  /** Duration multiplier below the breakpoint. */
  dur: 0.85,
  /** Distance/travel multiplier below the breakpoint. */
  dist: 0.7,
} as const

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
