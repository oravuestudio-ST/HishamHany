'use client'

import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { MOTION, registerMotion, prefersReducedMotion } from '@/lib/motion'

interface SlotRevealRefs {
  /** The tall trigger section (pin-spacing is added here). */
  section: RefObject<HTMLElement | null>
  /** The sticky frame that stays fixed while the reveal plays. */
  stage: RefObject<HTMLElement | null>
  /** The element whose clip-path + scale open from slot to full-bleed. */
  image: RefObject<HTMLElement | null>
  /** Optional overlay (headline) that holds, then eases up and out. */
  text?: RefObject<HTMLElement | null>
}

interface SlotRevealOptions {
  /** Pin scroll budget, e.g. '+=120%'. Defaults to MOTION.reveal.pin. */
  end?: string
  /** Below this width the reveal snaps open with no pin (mobile reads better
   *  full-bleed than pinned). Defaults to 768. */
  minWidth?: number
}

/**
 * The signature "vertical slot → full-bleed" hero unveil. Pins `stage` and, as
 * the user scrolls through `section`, scrubs `image` open from MOTION.reveal's
 * slotInset to openInset (with a settling overscale) while `text` holds for
 * `textHold` of the travel then lifts away.
 *
 * Distinct from the canonical useScrollReveal (opacity/y one-shots) and the
 * generic usePinnedSection (progress callback) — this one owns the clip-path
 * timeline the home hero and case-study headers share.
 *
 * Reduced motion or a narrow viewport: present the open, full-bleed frame with
 * no pin. All timing/distance lives in MOTION.reveal — nothing here is tuned
 * by hand.
 */
export function useSlotReveal(refs: SlotRevealRefs, options: SlotRevealOptions = {}) {
  const { section, stage, image, text } = refs
  const { end = MOTION.reveal.pin, minWidth = 768 } = options

  useEffect(() => {
    const sectionEl = section.current
    const stageEl = stage.current
    const imageEl = image.current
    if (!sectionEl || !stageEl || !imageEl) return

    const R = MOTION.reveal

    // Reduced motion / mobile: land on the open composition, skip the pin.
    if (prefersReducedMotion() || window.innerWidth < minWidth) {
      gsap.set(imageEl, { clipPath: R.openInset, scale: R.endScale })
      if (text?.current) gsap.set(text.current, { y: 0, opacity: 1 })
      return
    }

    registerMotion()

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top top',
          end,
          pin: stageEl,
          scrub: R.scrub,
        },
      })

      // Image: slot opens outward to full-bleed across the whole scroll.
      tl.fromTo(
        imageEl,
        { clipPath: R.slotInset, scale: R.startScale },
        { clipPath: R.openInset, scale: R.endScale, ease: 'none', duration: 1 },
        0
      )

      // Headline: holds, then eases up + out as the reveal completes.
      if (text?.current) {
        tl.fromTo(
          text.current,
          { y: 0, opacity: 1 },
          { y: R.textLift, opacity: 0, ease: 'none', duration: 1 - R.textHold },
          R.textHold
        )
      }
    }, sectionEl)

    return () => ctx.revert()
  }, [end, minWidth, section, stage, image, text])
}
