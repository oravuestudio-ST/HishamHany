'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MOTION, registerMotion, prefersReducedMotion } from '@/lib/motion'

/**
 * Horizontal gallery driven by vertical scroll: the section pins and the
 * track translates through its overflow. Falls back to native overflow-x
 * scrolling on touch devices, narrow viewports, and reduced motion — the
 * markup (section > track > items) works in both modes.
 */
export function useHorizontalGallery<
  S extends HTMLElement = HTMLElement,
  T extends HTMLElement = HTMLDivElement,
>() {
  const sectionRef = useRef<S>(null)
  const trackRef = useRef<T>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (prefersReducedMotion() || coarse || window.innerWidth < 768) return

    registerMotion()
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth)
    if (distance() === 0) return

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: MOTION.horizontal.scrub,
          invalidateOnRefresh: true,
        },
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return { sectionRef, trackRef }
}
