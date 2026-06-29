'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { gsapEase, prefersReducedMotion, registerMotion } from '@/lib/motion'

interface ParallaxOptions {
  /**
   * Total travel in px across the element's full scroll pass. Negative moves
   * the layer up as the page scrolls down (the usual editorial parallax).
   * Clamp to MOTION.parallax.hero (-120) / .editorial (-80) at the call site.
   */
  distance: number
  /** ScrollTrigger scrub smoothing (s of lag). Smooth, never aggressive. */
  scrub?: number
}

/**
 * Smooth scroll parallax: translates the element by `distance` px over its
 * scroll pass, eased through Lenis via ScrollTrigger's scrub. Disabled under
 * reduced motion. Returns a ref to attach to the moving layer.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions
) {
  const ref = useRef<T>(null)
  const { distance, scrub = 1.2 } = options

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    registerMotion()

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: distance,
        ease: gsapEase(),
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [distance, scrub])

  return ref
}
