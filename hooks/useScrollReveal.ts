'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MOTION, gsapEase, scrollDefaults, prefersReducedMotion } from '@/lib/motion'

interface RevealOptions {
  /**
   * When set, stagger the immediate children matching this selector instead of
   * animating the container itself. e.g. '.service-card'.
   */
  stagger?: string
  /** Override the translate distance (px). Defaults to MOTION.revealDistance. */
  distance?: number
  /** Override duration (s). Defaults to MOTION.dur.reveal. */
  duration?: number
  /** Extra delay before the reveal starts (s). */
  delay?: number
}

/**
 * Canonical scroll reveal: opacity 0→1, y `distance`→0, premium ease, fired
 * once when the element's top reaches 75% of the viewport. The one reveal the
 * whole site shares — replaces the ad-hoc gsap.from blocks scattered per file.
 *
 * Returns a ref to attach to the element you want revealed (or whose children
 * should stagger in).
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
) {
  const ref = useRef<T>(null)
  const { stagger, distance = MOTION.revealDistance, duration = MOTION.dur.reveal, delay = 0 } =
    options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = stagger
      ? Array.from(el.querySelectorAll<HTMLElement>(stagger))
      : [el]
    if (targets.length === 0) return

    // Reduced motion: present everything at its final state, no animation.
    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: distance },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: gsapEase(),
          stagger: stagger ? MOTION.stagger : 0,
          scrollTrigger: scrollDefaults(el),
        }
      )
    }, el)

    return () => ctx.revert()
  }, [stagger, distance, duration, delay])

  return ref
}
