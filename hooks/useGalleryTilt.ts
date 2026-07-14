'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MOTION, prefersReducedMotion, registerMotion, viewportScale } from '@/lib/motion'

/**
 * Homepage lookbook perspective settle (StickyGallery). The grid enters leaning
 * back on a shallow tilt (MOTION.galleryTilt.tiltStart) and stands up to flat as
 * it rises into view — a restrained editorial reading of the "animated gallery"
 * flip, expressed in GSAP against the token system (no framer-motion here).
 *
 * Progress is slaved to LIVE geometry each scroll tick, NOT cached ScrollTrigger
 * start/end. Those mis-measure here: the trigger mounts post-hydration while the
 * homepage's lazy (`ssr: false`) sections are still settling the layout, so a
 * creation-time (or window-load) measurement lands hundreds of px off and the
 * settle finishes before the grid is even on screen. A rect read per tick is
 * what ScrollTrigger does internally anyway and is always true regardless of
 * when any refresh ran — the same fix useStackedSeam uses for the same trap.
 *
 * Geometry source is the grid's untransformed parent, not the grid itself:
 * reading the element we're transforming would feed its own tilt/scale back into
 * the progress. Centre hinge (transformOrigin 50% 50%) so the visible leading
 * rows lean as the tall grid enters top-first, rather than swinging its
 * off-screen bottom around a top hinge.
 *
 * The perspective transform is left in place once flat (rotateX 0, scale 1):
 * that makes the grid the containing block for its own `position: sticky` centre
 * column — which is exactly the region the centre should pin within, so the pin
 * is unaffected. Disabled under reduced motion (grid stays flat). Returns a ref
 * for the grid.
 */
export function useGalleryTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const { tiltStart, scaleStart, perspective, scrub } = MOTION.galleryTilt

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    registerMotion()

    const ctx = gsap.context(() => {
      // Shallower lean on small screens — same gesture, less foreshorten.
      const startDeg = tiltStart * viewportScale().dist
      // Closed state (progress 0) = leaning back and slightly overscaled; the
      // paused timeline stands it up to flat (progress 1). ease 'none' — the
      // quickTo scrub supplies the smoothing (matches useStackedSeam).
      gsap.set(el, {
        rotateX: startDeg,
        scale: scaleStart,
        transformPerspective: perspective,
        transformOrigin: '50% 50%',
      })
      const tl = gsap.timeline({ paused: true })
      tl.to(el, { rotateX: 0, scale: 1, ease: 'none', duration: 1 }, 0)

      const geo = el.parentElement ?? el
      const drive = gsap.quickTo(tl, 'progress', { duration: scrub, ease: 'power2.out' })
      const update = () => {
        const vh = window.innerHeight
        const top = geo.getBoundingClientRect().top
        // Leaning as the grid crosses the bottom edge (top = vh); flat by the
        // time its top nears the top of the viewport (top = 0.2·vh).
        const p = (vh - top) / (vh * 0.8)
        drive(Math.min(1, Math.max(0, p)))
      }
      // start 0 / end 'max': this trigger exists only to receive scroll ticks
      // through the Lenis integration — its own measurements are never used.
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update })
      update()
    }, el)

    return () => ctx.revert()
  }, [tiltStart, scaleStart, perspective, scrub])

  return ref
}
