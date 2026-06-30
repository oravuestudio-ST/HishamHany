'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { getIntensity, prefersReducedMotion } from '@/lib/motion'

/**
 * Magnetic pull: while the pointer is within the element's box, the element
 * eases toward the cursor by `strength` of the offset from its centre, then
 * springs back on leave. Scaled by the global motion intensity, disabled under
 * reduced motion and on coarse pointers. Attach the returned ref to the link.
 */
export function useMagnetic<T extends HTMLElement = HTMLAnchorElement>(strength = 0.4) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - (rect.left + rect.width / 2)
      const my = e.clientY - (rect.top + rect.height / 2)
      const mul = strength * getIntensity()
      gsap.to(el, { x: mx * mul, y: my * mul, duration: 0.5, ease: 'power3.out' })
    }
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [strength])

  return ref
}
