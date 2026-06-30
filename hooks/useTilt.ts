'use client'

import { useEffect, useRef } from 'react'
import { MOTION, getIntensity, prefersReducedMotion } from '@/lib/motion'

interface TiltOptions {
  /** rotateX magnitude in degrees at the pointer's vertical extreme (×intensity). */
  rotX: number
  /** rotateY magnitude in degrees at the pointer's horizontal extreme (×intensity). */
  rotY: number
  /** Transition duration while tracking the pointer, seconds. Fast. */
  enter?: number
  /** Transition duration on mouseleave reset, seconds. Slower, settling. */
  leave?: number
}

/**
 * Pointer-driven 3D tilt. Attach the returned ref to the element that should
 * rotate (the "tilt plane"); give its PARENT `perspective` so the rotation has
 * depth, and the plane itself `transform-style: preserve-3d` if it has children
 * that translateZ above it.
 *
 * Pointer offset is measured from the plane's own center, normalized to
 * −0.5…0.5 per axis, then mapped to rotateX(-py·rotX·mul) rotateY(px·rotY·mul)
 * where `mul` is the global MOTION.intensity. Plain CSS transitions carry the
 * motion (fast on move, slow on leave) — no per-frame JS tween. Disabled
 * entirely under prefers-reduced-motion.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(options: TiltOptions) {
  const ref = useRef<T>(null)
  const { rotX, rotY, enter = 0.25, leave = 0.6 } = options

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const handleMove = (e: MouseEvent) => {
      const mul = getIntensity()   // read live so the Motion knob applies without reload
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      el.style.transition = `transform ${enter}s ${MOTION.ease3dCss}`
      el.style.transform = `rotateX(${(-py * rotX * mul).toFixed(2)}deg) rotateY(${(px * rotY * mul).toFixed(2)}deg)`
    }

    const handleLeave = () => {
      el.style.transition = `transform ${leave}s ${MOTION.ease3dCss}`
      el.style.transform = 'rotateX(0deg) rotateY(0deg)'
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)

    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [rotX, rotY, enter, leave])

  return ref
}
