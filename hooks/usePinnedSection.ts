'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MOTION, registerMotion, prefersReducedMotion } from '@/lib/motion'

interface PinnedOptions {
  /** ScrollTrigger end, e.g. '+=250%'. Defaults to MOTION.pin.workflowEnd. */
  end?: string
  /** Progress callback fired on scrub (0→1 across the pinned distance). */
  onProgress?: (progress: number) => void
  /** Minimum viewport width to pin — below it the section scrolls normally. */
  minWidth?: number
}

/**
 * Pin a section while the user scrolls through a story beat, reporting scrub
 * progress so the content can advance (the services workflow, the about
 * process). No pin under reduced motion or on narrow viewports — the section
 * simply scrolls, and onProgress never fires (consumers keep their static
 * layout as the fallback).
 */
export function usePinnedSection<T extends HTMLElement = HTMLDivElement>(
  options: PinnedOptions = {}
) {
  const ref = useRef<T>(null)
  const { end = MOTION.pin.workflowEnd, onProgress, minWidth = 768 } = options
  const progressRef = useRef(onProgress)
  progressRef.current = onProgress

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || window.innerWidth < minWidth) return

    registerMotion()
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end,
        pin: true,
        scrub: true,
        onUpdate: (self) => progressRef.current?.(self.progress),
      })
    }, el)
    return () => ctx.revert()
  }, [end, minWidth])

  return ref
}
