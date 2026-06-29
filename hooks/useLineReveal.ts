'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MOTION, gsapEase, scrollDefaults, prefersReducedMotion } from '@/lib/motion'

interface LineRevealOptions {
  /** Selector for the masked line elements inside the ref. Default '.reveal-line'. */
  lines?: string
  /**
   * Play immediately on mount instead of on scroll. Used by the hero, whose
   * lines reveal as part of the page-load sequence rather than on scroll.
   */
  immediate?: boolean
  /** Start offset / delay (s). For immediate mode this is the timeline delay. */
  delay?: number
  /** Gate: only run once this is true (e.g. after the loader lifts). */
  enabled?: boolean
}

/**
 * Canonical headline reveal: each masked line rises from yPercent 100 → 0 with
 * the premium ease and the shared stagger. Lines must sit inside
 * overflow-hidden wrappers (the existing markup already does this). Used by the
 * hero and every section title.
 */
export function useLineReveal<T extends HTMLElement = HTMLHeadingElement>(
  options: LineRevealOptions = {}
) {
  const ref = useRef<T>(null)
  const { lines = '.reveal-line', immediate = false, delay = 0, enabled = true } = options

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const targets = Array.from(el.querySelectorAll<HTMLElement>(lines))
    if (targets.length === 0) return

    if (prefersReducedMotion()) {
      gsap.set(targets, { yPercent: 0, opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: MOTION.dur.hero,
          delay,
          ease: gsapEase(),
          stagger: MOTION.stagger,
          ...(immediate ? {} : { scrollTrigger: scrollDefaults(el) }),
        }
      )
    }, el)

    return () => ctx.revert()
  }, [lines, immediate, delay, enabled])

  return ref
}
