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

export const MOTION = {
  /** Signature ease — a long, settling cubic-bezier. Calm, never bouncy. */
  ease: [0.22, 1, 0.36, 1] as const,
  /** Same curve as a CSS string. */
  easeCss: 'cubic-bezier(0.22, 1, 0.36, 1)',
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

  /** Durations, seconds. */
  dur: {
    fast: 0.3,
    medium: 0.6,
    slow: 1.0,
    hero: 1.4,
    /** Canonical scroll-reveal duration. */
    reveal: 0.9,
    /** Image hover zoom settle. */
    image: 0.8,
  },

  /** Scroll reveals translate up from this many px. */
  revealDistance: 60,
  /** Card hover lift (translateY, px). */
  hoverLift: -6,
  /** Card hover scale. */
  hoverScale: 1.02,
  /** Image hover zoom scale. */
  imageZoom: 1.08,
  /** Delay between staggered children, seconds. */
  stagger: 0.15,

  /** ScrollTrigger start — element top reaching 75% of viewport (25% in). */
  scrollStart: 'top 75%',

  /** Parallax travel ceilings, px (negative = moves up as you scroll down). */
  parallax: {
    hero: -120,
    editorial: -80,
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
    dur: 1.1,
    /** Stagger between masked siblings, seconds. */
    stagger: 0.08,
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
   * inline-style consumers (ClientsMarquee, GearDecor) read them directly.
   */
  ambient: {
    /** Client logo marquee full loop. */
    logoMarquee: 36,
    /** Text marquee loops (.marquee-track / -reverse). */
    textMarquee: 28,
    /** Base gear rotation; individual gears scale this for variety. */
    gearSpin: 22,
  },

  /**
   * Page-load sequence, after the loader lifts. Each beat has an `at` (start
   * offset on the timeline, seconds) and a `dur` (its own animation duration,
   * seconds — taken from the brief). Order: nav → eyebrow → title → description
   * → buttons, with the hero visual easing in alongside on its own track.
   */
  load: {
    nav: { at: 0.0, dur: 0.6 },
    eyebrow: { at: 0.25, dur: 0.7 },
    title: { at: 0.45, dur: 1.2 },
    desc: { at: 0.95, dur: 1.0 },
    buttons: { at: 1.25, dur: 0.8 },
    visual: { at: 0.3, dur: 1.4 },
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
