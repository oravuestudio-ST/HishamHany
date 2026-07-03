'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MOTION, registerMotion, prefersReducedMotion } from '@/lib/motion'

/**
 * Scrubbed image entrance: the frame uncrops (inset shrinks) and settles from
 * a slight overscale as it enters the viewport — museum-wall physicality for
 * full-bleed spreads. Scrub-linked, so it moves with the scroll rather than
 * on a timer. Reduced motion shows the image plainly.
 */
export function useProgressiveImage<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el, { clipPath: 'none', scale: 1 })
      return
    }

    registerMotion()
    const { inset, scale } = MOTION.progressive
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: `inset(${inset}% ${inset * 0.6}%)`, scale },
        {
          clipPath: 'inset(0% 0%)',
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            end: 'top 45%',
            scrub: MOTION.horizontal.scrub,
          },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return ref
}
