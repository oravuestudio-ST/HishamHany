'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { MOTION, registerMotion, prefersReducedMotion, viewportScale } from '@/lib/motion'

interface SeamLayer {
  /** Layer inside the receding card. */
  ref: RefObject<HTMLElement | null>
  /** Differential yPercent across the seam — positive lags deeper, negative leads. */
  y: number
}

interface StackedSeamOptions {
  /** Section whose exit drives the seam (its bottom: viewport bottom → top). */
  trigger: RefObject<HTMLElement | null>
  /** Element that recedes. Kept separate from `trigger`: the hero's tall
      pin-spaced section is the geometry source, but the visible sticky stage
      is what transforms. */
  target: RefObject<HTMLElement | null>
  /** Internal parallax layers (hero photo, glow orb). Captured at mount. */
  layers?: SeamLayer[]
  /** Rotation reads as breakage on thin strips (marquee) — off there. */
  rotate?: boolean
}

/**
 * Stacked-seam recession: as the trigger section exits, the target scales,
 * tips, dims, and lingers downward so the next section slides over it like a
 * card. Deliberately pinless — the hero is already pinned by the slot reveal,
 * and the incoming section must stay untransformed (StickyGallery's internal
 * position: sticky dies inside transformed ancestors). All values MOTION.stack.
 */
export function useStackedSeam({ trigger, target, layers = [], rotate = true }: StackedSeamOptions) {
  useEffect(() => {
    const trig = trigger.current
    const el = target.current
    if (!trig || !el) return
    if (prefersReducedMotion()) return

    registerMotion()
    const S = MOTION.stack
    const { dist } = viewportScale()

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trig,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: S.scrub,
        },
      })
      tl.to(
        el,
        {
          scale: S.scale,
          rotation: rotate ? S.rotate : 0,
          yPercent: S.linger * dist,
          filter: `brightness(${S.dim})`,
          // Recede toward the upper third — the card tips away from the seam
          // edge rather than shrinking to its own center.
          transformOrigin: 'center 30%',
          ease: 'none',
        },
        0
      )
      for (const layer of layers) {
        if (layer.ref.current) {
          tl.to(layer.ref.current, { yPercent: layer.y * dist, ease: 'none' }, 0)
        }
      }
    }, trig)
    return () => ctx.revert()
    // `layers` is config, captured at mount like the other scroll hooks —
    // consumers pass literals and don't re-tune mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, target, rotate])
}
