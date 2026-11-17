/**
 * Mask-wipe page transitions — the site's "shutter". On navigation a single
 * ink surface sweeps up from the bottom to cover the outgoing page, the router
 * swaps routes beneath it, and the surface continues upward off the incoming
 * page. One continuous gesture, no white flash, fitting for a photographer.
 *
 * The surface is a module-level singleton appended to <body> on first use so
 * it survives route remounts (app/template.tsx re-renders per navigation).
 * z-index is --z-wipe (app/globals.css): above chrome (header, menu) and
 * below modals, the cursor and the loader.
 */

import { gsap } from 'gsap'
import { EASE_CSS, WIPE as WIPE_TOKENS } from './tokens'
import { prefersReducedMotion } from '@/lib/motion'

const COVER_DUR = WIPE_TOKENS.cover
const HOLD = WIPE_TOKENS.hold
const LIFT_DUR = WIPE_TOKENS.lift
/**
 * If no incoming page claims the surface this long after it covers (the route
 * threw, stalled, or the error boundary rendered instead), lift it anyway —
 * the visitor must never be left looking at solid ink.
 */
export const WIPE_FAILSAFE_MS = 2500

let surface: HTMLDivElement | null = null
let covered = false
let inFlight = false
let failsafe: ReturnType<typeof setTimeout> | null = null
let cancelCover: (() => void) | null = null
let liftEndsAt = 0

/**
 * Seconds until a lifting shutter clears the page (0 when none is lifting).
 * An arrival animation that starts on mount reads this so it plays where the
 * reader can see it, not under the ink.
 */
export function wipeRemaining(): number {
  return Math.max(0, (liftEndsAt - performance.now()) / 1000)
}

function disarmFailsafe() {
  if (failsafe) clearTimeout(failsafe)
  failsafe = null
}

function ensureSurface(): HTMLDivElement {
  if (surface && document.body.contains(surface)) return surface
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:var(--z-wipe)',
    'background:rgb(var(--ink-rgb, 10 10 10))',
    'transform:translateY(100%)',
    'pointer-events:none',
    'will-change:transform',
  ].join(';')
  document.body.appendChild(el)
  // GSAP parses the inline translateY(100%) into px `y` on first touch and
  // stacks yPercent on top, so the cover stopped a screen short and the lift
  // swept ink over the new page. Zero `y` once; yPercent owns the motion.
  gsap.set(el, { y: 0, yPercent: 100 })
  surface = el
  return el
}

/** True while the wipe surface is covering the viewport. */
export function isCovered(): boolean {
  return covered
}

/**
 * Sweep the surface up over the current page, then hand off to `navigate`
 * (typically router.push). The incoming template lifts the surface via
 * liftWipe(). Re-entrant calls while a wipe is in flight are ignored.
 * Reduced motion: navigate immediately, no wipe.
 */
export function wipeTo(navigate: () => void): void {
  if (prefersReducedMotion()) {
    navigate()
    return
  }
  if (inFlight) return
  inFlight = true
  const el = ensureSurface()
  let cancelled = false

  // Back/forward while the surface is still rising: drop the pending push
  // and put the surface away — the browser is already going elsewhere.
  const onPopState = () => {
    cancelled = true
    cancelCover?.()
  }
  cancelCover = () => {
    tween?.kill?.()
    window.removeEventListener('popstate', onPopState)
    cancelCover = null
    inFlight = false
    covered = false
    gsap.set(el, { yPercent: 100 })
  }
  window.addEventListener('popstate', onPopState)

  gsap.set(el, { yPercent: 100 })
  const tween = gsap.to(el, {
    yPercent: 0,
    duration: COVER_DUR,
    ease: 'expo.inOut',
    onComplete: () => {
      window.removeEventListener('popstate', onPopState)
      cancelCover = null
      if (cancelled) return
      covered = true
      inFlight = false
      failsafe = setTimeout(() => liftWipe(), WIPE_FAILSAFE_MS)
      navigate()
    },
  })
}

/**
 * Continue the surface upward off the incoming page. Call from the new
 * route's mount. `onDone` fires when the page is fully uncovered.
 * No-op (returns false) when the surface isn't covering — fresh loads and
 * back/forward navigations enter without a wipe.
 */
export function liftWipe(onDone?: () => void): boolean {
  if (!covered || !surface) return false
  disarmFailsafe()
  covered = false
  liftEndsAt = performance.now() + (HOLD + LIFT_DUR) * 1000
  gsap.to(surface, {
    yPercent: -100,
    duration: LIFT_DUR,
    ease: 'expo.inOut',
    delay: HOLD,
    onComplete: () => {
      if (surface) gsap.set(surface, { yPercent: 100 })
      onDone?.()
    },
  })
  return true
}

/** The wipe's CSS timing, exported for anything that must sync with it. */
export const WIPE = { cover: COVER_DUR, hold: HOLD, lift: LIFT_DUR, easeCss: EASE_CSS.settle } as const
