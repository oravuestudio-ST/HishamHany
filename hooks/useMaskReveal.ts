'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MOTION, gsapEase, registerMotion, scrollDefaults, prefersReducedMotion } from '@/lib/motion'

interface MaskRevealOptions {
  /** Reveal direction — content emerges from behind the mask. */
  dir?: 'up' | 'left'
  /** Stagger children matching this selector instead of the element itself. */
  stagger?: string
  /** Extra delay, seconds. */
  delay?: number
}

/**
 * Clip-path reveal on scroll-in: the element (or its staggered children)
 * uncovers from a hard mask edge — the editorial cousin of useScrollReveal
 * for display type and pull-quotes. Reduced motion presents the final state.
 */
export function useMaskReveal<T extends HTMLElement = HTMLDivElement>(
  options: MaskRevealOptions = {}
) {
  const ref = useRef<T>(null)
  const { dir = 'up', stagger, delay = 0 } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = stagger ? Array.from(el.querySelectorAll<HTMLElement>(stagger)) : [el]
    if (targets.length === 0) return

    const hidden = dir === 'up' ? 'inset(0 0 100% 0)' : 'inset(0 100% 0 0)'
    const shown = 'inset(0 0 0% 0)'

    if (prefersReducedMotion()) {
      gsap.set(targets, { clipPath: 'none', opacity: 1, y: 0 })
      return
    }

    registerMotion()
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { clipPath: hidden, y: dir === 'up' ? 32 : 0, opacity: 1 },
        {
          clipPath: shown,
          y: 0,
          duration: MOTION.mask.dur,
          delay,
          ease: gsapEase(),
          stagger: stagger ? MOTION.mask.stagger : 0,
          scrollTrigger: scrollDefaults(el),
        }
      )
    }, el)
    return () => ctx.revert()
  }, [dir, stagger, delay])

  return ref
}
