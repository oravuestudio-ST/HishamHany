'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MOTION, STACK_SHALLOW, registerMotion, prefersReducedMotion, viewportScale } from '@/lib/motion'

interface SeamLayer {
  /** Layer inside the receding card. */
  ref: RefObject<HTMLElement | null>
  /** Differential yPercent across the seam — positive lags deeper, negative leads. */
  y: number
}

interface StackedSeamOptions {
  /** The receding section. Its stack wrapper's next sibling is the incoming card
      unless `next` names it explicitly. */
  trigger: RefObject<HTMLElement | null>
  /** The incoming card. Prefer this over the sibling inference, which silently
      breaks whenever the page's wrapper structure changes. */
  next?: RefObject<HTMLElement | null>
  /** Element that recedes. Kept separate from `trigger`: the hero's tall
      pin-spaced section is the geometry source, but the visible sticky stage
      is what transforms. */
  target: RefObject<HTMLElement | null>
  /** Internal parallax layers (hero photo, glow orb). Captured at mount. */
  layers?: SeamLayer[]
  /** Rotation reads as breakage on thin strips (marquee) — off there. */
  rotate?: boolean
  /**
   * Seam depth. 'deep' (default) is the hero/marquee card-fall; 'shallow' is
   * the quieter punctuation settle used where a section hands off into the
   * dark Statement panel (tokens: STACK vs STACK_SHALLOW).
   */
  profile?: 'deep' | 'shallow'
}

/**
 * Stacked-seam recession: as the incoming card slides up over this section,
 * the target scales, tips, dims, and lingers downward so the handoff reads as
 * a card stack. Deliberately pinless, and the incoming section stays
 * untransformed (a transformed ancestor kills any position: sticky inside it).
 * The dim is an opacity change, never an animated `filter` — filters repaint
 * the whole card on the main thread every frame.
 *
 * Progress is computed from LIVE geometry (the incoming card's viewport
 * position each scroll tick), never from cached ScrollTrigger start/end.
 * Cached positions are unreliable here: these triggers mount post-hydration
 * next to the reveal's pin-spacer, and both the creation-time measurement and
 * GSAP's window-load auto-refresh were traced landing on pre-spacer layouts —
 * which ran the seam during the slot reveal instead of after it. A rect read
 * per tick is what ScrollTrigger does internally anyway, and it is always
 * true regardless of when (or whether) any refresh ran. All values MOTION.stack.
 */
export function useStackedSeam({ trigger, next, target, layers = [], rotate = true, profile = 'deep' }: StackedSeamOptions) {
  useEffect(() => {
    const trig = trigger.current
    const el = target.current
    if (!trig || !el) return
    if (prefersReducedMotion()) return

    registerMotion()
    const S = profile === 'shallow' ? STACK_SHALLOW : MOTION.stack
    const { dist } = viewportScale()

    // The incoming card: explicit, else the next sibling of this section's
    // stack wrapper. Its top crossing the viewport (bottom → top) is the
    // handoff window. Without one, fall back to this section's own exit.
    const nextCard = next?.current ?? (trig.parentElement?.nextElementSibling as HTMLElement | null) ?? null

    const ctx = gsap.context(() => {
      // The recession as a paused unit timeline; progress is slaved to
      // geometry below. ease 'none' — the scrub smoothing supplies the curve.
      const tl = gsap.timeline({ paused: true })
      tl.to(
        el,
        {
          scale: S.scale,
          rotation: rotate ? S.rotate : 0,
          yPercent: S.linger * dist,
          opacity: S.dim,
          // Recede toward the upper third — the card tips away from the seam
          // edge rather than shrinking to its own center.
          transformOrigin: 'center 30%',
          ease: 'none',
          duration: 1,
        },
        0
      )
      for (const layer of layers) {
        if (layer.ref.current) {
          tl.to(layer.ref.current, { yPercent: layer.y * dist, ease: 'none', duration: 1 }, 0)
        }
      }

      // Smoothed progress driver — the same feel as ScrollTrigger's scrub:
      // each tick re-targets a short tween toward the latest progress.
      const drive = gsap.quickTo(tl, 'progress', { duration: S.scrub, ease: 'power2.out' })
      const update = () => {
        const vh = window.innerHeight
        const p = nextCard
          ? 1 - nextCard.getBoundingClientRect().top / vh
          : 1 - trig.getBoundingClientRect().bottom / vh
        drive(Math.min(1, Math.max(0, p)))
      }
      // start 0 / end 'max': this trigger exists only to receive scroll ticks
      // (through the Lenis integration) — its own measurements are never used.
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update })
      update()
    }, trig)

    return () => ctx.revert()
    // `layers` is config, captured at mount like the other scroll hooks —
    // consumers pass literals and don't re-tune mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, next, target, rotate, profile])
}
