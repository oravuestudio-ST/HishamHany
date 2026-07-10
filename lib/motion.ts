/**
 * Motion token contract — the single source of truth for the site's interaction
 * and animation system. Every component pulls its timing, easing, distance, and
 * stagger from here so the whole experience moves with one voice.
 *
 * Values mirror the design brief verbatim. The premium feel comes from these
 * numbers agreeing everywhere rather than drifting per-component.
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import { DUR, EASE, EASE_CSS, STAGGER, REVEAL_DISTANCE, PARALLAX, LENIS, MOBILE, REVEAL } from '@/animations/tokens'

// Tokens v2 pass through for consumers that want the scale/family directly.
export { DUR, EASE, EASE_CSS, STAGGER, REVEAL_DISTANCE, PARALLAX, LENIS, MOBILE, REVEAL }

export const MOTION = {
  /** Signature ease — the tokens-v2 `settle` curve. Calm, never bouncy. */
  ease: EASE.settle,
  /** Same curve as a CSS string. */
  easeCss: EASE_CSS.settle,
  /** Registered GSAP CustomEase name (see registerMotion). */
  easeName: 'premium',

  /**
   * Expo-out curve (matches GSAP `expo.out`) for the mouse-driven 3D tilt
   * layers. A faster settle than the signature ease — it snaps toward the
   * pointer then eases the last few degrees, which reads as "responsive" rather
   * than "laggy" under continuous mousemove. Used by the CSS transitions on
   * every tilt plane; the hero's GSAP tweens use 'expo.out' directly.
   */
  ease3dCss: 'cubic-bezier(0.16, 1, 0.3, 1)',

  /**
   * Single multiplier scaling every 3D rotation magnitude on the site, so the
   * whole parallax system dials up or down from one place. subtle 0.6 ·
   * balanced 1 · bold 1.5. Kept restrained by default — editorial depth, not a
   * toy.
   */
  intensity: 1,

  /**
   * Durations, seconds — legacy keys mapped onto the tokens-v2 scale.
   * `hero` here rides the *cinematic* tier: it drives headline lines and case
   * covers on scroll. The true 2.2s hero tier belongs to the load beat only
   * (MOTION.load.visual).
   */
  dur: {
    fast: DUR.micro,
    medium: DUR.swift,
    slow: DUR.reveal,
    hero: DUR.cinematic,
    /** Canonical scroll-reveal duration. */
    reveal: DUR.reveal,
    /** Image hover zoom settle. */
    image: DUR.swift,
  },

  /** Scroll reveals translate up from this many px. */
  revealDistance: REVEAL_DISTANCE,
  /** Card hover lift — cards stay planted (the image zooms, nothing moves). */
  hoverLift: 0,
  /** Card hover scale — planted. */
  hoverScale: 1,
  /** Image hover zoom scale. */
  imageZoom: 1.04,
  /** Delay between staggered children, seconds. */
  stagger: STAGGER.lines,

  /** ScrollTrigger start — element top reaching 75% of viewport (25% in). */
  scrollStart: 'top 75%',

  /** Scroll-driven slot→full-bleed hero reveal (see REVEAL in tokens). */
  reveal: REVEAL,

  /** Parallax travel ceilings, px (negative = moves up as you scroll down). */
  parallax: {
    hero: PARALLAX.background,
    editorial: PARALLAX.foreground,
  },

  /**
   * Scroll-storytelling tokens — pinned sections, mask reveals, and
   * horizontal galleries all share these so the cinematic layer moves with
   * one voice (hooks: usePinnedSection / useMaskReveal / useHorizontalGallery
   * / useProgressiveImage).
   */
  pin: {
    /** ScrollTrigger `end` for the pinned services workflow. */
    workflowEnd: '+=250%',
  },
  mask: {
    /** Clip-path reveal duration, seconds. */
    dur: DUR.reveal,
    /** Stagger between masked siblings, seconds. */
    stagger: STAGGER.images,
  },
  horizontal: {
    /** Scrub smoothing for horizontal galleries (seconds of lag). */
    scrub: 0.8,
  },
  progressive: {
    /** Image entrance: starting inset (%) and overscale. */
    inset: 10,
    scale: 1.06,
  },

  /**
   * Ambient loop durations, seconds — the decorative infinite animations.
   * CSS keyframe consumers mirror these via --dur-marquee in globals.css;
   * inline-style consumers (ClientsMarquee) read them directly.
   */
  ambient: {
    /** Client logo marquee full loop. */
    logoMarquee: 36,
    /** Text marquee loops (.marquee-track / -reverse). */
    textMarquee: 28,
  },

  /**
   * Page-load sequence, after the loader lifts. Each beat has an `at` (start
   * offset on the timeline, seconds) and a `dur` (its own animation duration,
   * seconds). Editorial-cinematic cadence (~2.6s to settle), classic order:
   * nav → hero visual (long curtain) → eyebrow → title → description → buttons.
   */
  load: {
    nav: { at: 0.0, dur: 0.7 },
    visual: { at: 0.2, dur: 2.2 },
    eyebrow: { at: 0.9, dur: 0.8 },
    title: { at: 1.15, dur: 1.1 },
    desc: { at: 1.85, dur: 0.9 },
    buttons: { at: 2.1, dur: 0.7 },
  },
} as const

/**
 * Live motion-intensity multiplier, mirrored from the user's "Motion" knob
 * (subtle 0.6 · balanced 1 · bold 1.5). JS-driven effects (tilt, hero parallax)
 * read getIntensity() at interaction time so the knob applies without a reload.
 * MOTION.intensity remains the static default for any code not yet migrated.
 */
let INTENSITY: number = MOTION.intensity

/** Current motion-intensity multiplier. */
export function getIntensity(): number {
  return INTENSITY
}

/** Set the motion-intensity multiplier (called by the settings knob). */
export function setIntensity(value: number): void {
  INTENSITY = value
}

let registered = false

/**
 * Idempotently register the GSAP plugins the system depends on. Registers
 * ScrollTrigger and a CustomEase named "premium" built from MOTION.ease. Safe
 * to call from multiple mount points; only runs once, only in the browser.
 */
export function registerMotion(): void {
  if (registered || typeof window === 'undefined') return
  registered = true

  // Defensive: in non-browser-grade environments (jsdom under test) the GSAP
  // plugins don't fully initialize and CustomEase can throw. Degrade silently —
  // gsapEase() then falls back to a built-in ease.
  try {
    gsap.registerPlugin(ScrollTrigger, CustomEase)

    // Build the signature curve as a named ease GSAP can consume. GSAP cannot
    // parse a raw cubic-bezier() string, so we express the same control points
    // as an SVG path: C <x1>,<y1> <x2>,<y2> 1,1.
    const [x1, y1, x2, y2] = MOTION.ease
    if (!CustomEase.get(MOTION.easeName)) {
      CustomEase.create(MOTION.easeName, `M0,0 C${x1},${y1} ${x2},${y2} 1,1`)
    }
  } catch {
    /* plugin unavailable — gsapEase() returns the fallback ease */
  }
}

/**
 * The GSAP ease string to pass to tweens. Returns the registered CustomEase
 * name when available, falling back to a close built-in if registration hasn't
 * happened yet (or we're on the server / in a test environment).
 */
export function gsapEase(): string {
  if (typeof window === 'undefined') return 'power3.out'
  registerMotion()
  try {
    return CustomEase.get(MOTION.easeName) ? MOTION.easeName : 'power3.out'
  } catch {
    return 'power3.out'
  }
}

/** ScrollTrigger defaults for one-shot reveals. */
export function scrollDefaults(trigger: Element) {
  return { trigger, start: MOTION.scrollStart, once: true }
}

/** True when the user asked for reduced motion. SSR-safe (returns false). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * True on a touch device (phone or tablet). SSR-safe (returns false). Detection
 * is capability-based — touch points OR a coarse pointer — not screen width, so
 * the reveal's mechanism follows the input device rather than the viewport size.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches
  )
}

/** How the slot→full-bleed hero reveal is driven for the current environment. */
export type RevealMode = 'snap' | 'autoplay' | 'pinned'

/**
 * Pick the reveal's driver: reduced motion snaps to the open frame; a touch
 * device autoplays the same keyframes on a timeline (no pin — reliably smooth
 * on touch); a mouse/desktop device keeps the pinned scroll-scrub. Reduced
 * motion wins over touch. Pure — the caller reads the environment.
 */
export function resolveRevealMode(env: { reducedMotion: boolean; touch: boolean }): RevealMode {
  if (env.reducedMotion) return 'snap'
  if (env.touch) return 'autoplay'
  return 'pinned'
}

/**
 * Duration/distance multipliers for the current viewport — {1, 1} on desktop,
 * MOBILE.dur/MOBILE.dist below the breakpoint. Read at animation-setup time
 * (not reactively): reveals are one-shot, so mid-session resizes only affect
 * elements that haven't fired yet. SSR-safe (returns desktop).
 */
export function viewportScale(): { dur: number; dist: number } {
  if (typeof window === 'undefined') return { dur: 1, dist: 1 }
  return window.matchMedia(`(max-width: ${MOBILE.maxWidth}px)`).matches
    ? { dur: MOBILE.dur, dist: MOBILE.dist }
    : { dur: 1, dist: 1 }
}
