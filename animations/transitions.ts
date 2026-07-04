/**
 * Mask-wipe page transitions — the site's "shutter". On navigation a single
 * ink surface sweeps up from the bottom to cover the outgoing page, the router
 * swaps routes beneath it, and the surface continues upward off the incoming
 * page. One continuous gesture, no white flash, fitting for a photographer.
 *
 * The surface is a module-level singleton appended to <body> on first use so
 * it survives route remounts (app/template.tsx re-renders per navigation).
 * z-index sits above chrome (header 9990, menu 9989) and below the loader
 * (9998) and cursor (9996+).
 */

import { gsap } from 'gsap'
import { DUR, EASE_CSS } from './tokens'
import { prefersReducedMotion } from '@/lib/motion'

const COVER_DUR = 0.55
const HOLD = 0.12
const LIFT_DUR = DUR.swift

let surface: HTMLDivElement | null = null
let covered = false
let inFlight = false

function ensureSurface(): HTMLDivElement {
  if (surface && document.body.contains(surface)) return surface
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:9995',
    'background:rgb(var(--ink-rgb, 10 10 10))',
    'transform:translateY(100%)',
    'pointer-events:none',
    'will-change:transform',
  ].join(';')
  document.body.appendChild(el)
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
  gsap.set(el, { yPercent: 100 })
  gsap.to(el, {
    yPercent: 0,
    duration: COVER_DUR,
    ease: 'expo.inOut',
    onComplete: () => {
      covered = true
      inFlight = false
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
  covered = false
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
