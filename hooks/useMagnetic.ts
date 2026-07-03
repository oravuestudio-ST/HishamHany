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

    // Pre-built tweens (no allocation per mousemove) + a rect cached on enter
    // (no layout read per mousemove). The rect is stable while hovering — the
    // element only moves via its own transform, which getBoundingClientRect
    // would include (and wrongly re-center on), so caching is also *correct*.
    const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    let cx = 0, cy = 0

    const onEnter = () => {
      const rect = el.getBoundingClientRect()
      cx = rect.left + rect.width / 2
      cy = rect.top + rect.height / 2
    }
    const onMove = (e: MouseEvent) => {
      const mul = strength * getIntensity()
      qx((e.clientX - cx) * mul)
      qy((e.clientY - cy) * mul)
    }
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [strength])

  return ref
}
