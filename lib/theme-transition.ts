'use client'

import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '@/lib/motion'

interface ThemeTransitionOptions {
  /** Animation length in ms. */
  duration?: number
  /** Element the circle expands from; falls back to the viewport center. */
  originEl?: HTMLElement | null
}

/**
 * Flips the theme inside a View Transition, wiping in the new theme with a
 * clip-path circle grown from `originEl`. Falls back to an instant flip
 * (today's behavior) when the API is unsupported or motion is reduced —
 * `applyTheme` alone is always a correct, safe call.
 */
export function startThemeTransition(applyTheme: () => void, opts: ThemeTransitionOptions = {}): void {
  const { duration = 500, originEl } = opts

  if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion()) {
    applyTheme()
    return
  }

  const rect = originEl?.getBoundingClientRect()
  const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
  const maxRadius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY),
  )

  const transition = document.startViewTransition(() => flushSync(applyTheme))

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${maxRadius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
    // `ready` rejects if the browser skips the transition (e.g. a backgrounded
    // tab, or a second transition starting mid-flight). applyTheme already ran
    // via the update callback above either way, so the theme change itself is
    // unaffected — this only silences the resulting unhandled-rejection noise.
    .catch(() => {})
}
