'use client'

import { prefersReducedMotion } from '@/lib/motion'
import { wipeTo } from '@/animations/transitions'

export type NavClass = 'morph' | 'shutter'

const MORPH_NAME_PREFIX = 'case-cover-'

/** The shared `view-transition-name` a project's grid thumbnail and case
 * cover must agree on for the browser to morph between them. Inert unless
 * an actual View Transition is running (see navigateWithTransition). */
export function morphTransitionName(slug: string): string {
  return `${MORPH_NAME_PREFIX}${slug}`
}

// Only these routes hold a shared-element source (a grid thumbnail or feed
// cover) that a case-study cover can morph out of.
const MORPH_SOURCES = new Set(['/', '/portfolio'])

function basePath(path: string): string {
  return path.split('?')[0].split('#')[0]
}

function isWorkStudyRoute(path: string): boolean {
  return /^\/work\/[^/]+\/?$/.test(path)
}

/**
 * Pure routing decision: exactly one gesture owns any given internal
 * navigation. Morph is reserved for the one interaction it was designed for —
 * picking a project off the archive grid or home feed; everything else,
 * including case-study-to-case-study and the work index itself, keeps the
 * site's ordinary ink shutter.
 */
export function classifyNavigation(from: string, to: string): NavClass {
  const fromBase = basePath(from)
  const toBase = basePath(to)
  if (fromBase === toBase) return 'shutter'
  if (MORPH_SOURCES.has(fromBase) && isWorkStudyRoute(toBase)) return 'morph'
  return 'shutter'
}

function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function'
}

// The destination CaseCover signals "I'm mounted, in my closed-slot frame"
// by calling signalMorphTargetReady() once — that's what startViewTransition
// awaits before it captures the "new" snapshot and runs the morph. A timeout
// guards against a route that never signals (e.g. an error boundary) so
// navigation can never hang.
let pendingResolve: (() => void) | null = null
const RESOLVE_TIMEOUT_MS = 800

export function signalMorphTargetReady(): void {
  pendingResolve?.()
  pendingResolve = null
}

function waitForMorphTarget(): Promise<void> {
  return new Promise((resolve) => {
    pendingResolve = resolve
    setTimeout(() => {
      if (pendingResolve === resolve) {
        pendingResolve = null
        resolve()
      }
    }, RESOLVE_TIMEOUT_MS)
  })
}

/**
 * Single dispatcher for every internal link — never both a morph and a
 * shutter on the same click. Falls back to the ink shutter whenever the
 * browser lacks View Transitions or the user has reduced motion; `wipeTo`
 * itself already navigates immediately under reduced motion, so that guard
 * composes for free.
 */
export function navigateWithTransition(from: string, href: string, push: () => void): NavClass {
  const cls = classifyNavigation(from, href)

  if (cls === 'morph' && supportsViewTransitions() && !prefersReducedMotion()) {
    document.startViewTransition(() => {
      push()
      return waitForMorphTarget()
    })
    return 'morph'
  }

  wipeTo(push)
  return 'shutter'
}
