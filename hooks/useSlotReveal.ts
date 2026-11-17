'use client'

import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { MOTION, registerMotion, prefersReducedMotion, viewportScale, gsapEase } from '@/lib/motion'
import { arrivalDelay } from '@/animations/transitions'

interface SlotRevealRefs {
  /** The cover section; the headline's scroll exit is measured against it. */
  section: RefObject<HTMLElement | null>
  /** The element whose clip-path + scale open from slot to full-bleed. */
  image: RefObject<HTMLElement | null>
  /** Optional overlay (headline) that holds, then lifts as the reader scrolls. */
  text?: RefObject<HTMLElement | null>
}

interface SlotRevealOptions {
  /** Reveal duration in seconds, before viewport scaling. Defaults to MOTION.reveal.autoplayDur. */
  autoplayDur?: number
  /** Land on the open frame with no animation (reduced motion does this too). */
  snap?: boolean
}

/**
 * The "vertical slot → full-bleed" cover unveil. The photo opens on its own
 * timeline as soon as the page arrives: no pin, so the reader is never made to
 * scroll through it before reaching the work. The headline holds over the open
 * frame and lifts only as the reader scrolls (scrubbed, never pinned).
 * `snap` (e.g. a cover the thumbnail morph already opened) and reduced motion
 * land on the open frame at once.
 */
export function useSlotReveal(refs: SlotRevealRefs, options: SlotRevealOptions = {}) {
  const { section, image, text } = refs
  const { autoplayDur = MOTION.reveal.autoplayDur, snap = false } = options

  useEffect(() => {
    const sectionEl = section.current
    const imageEl = image.current
    if (!sectionEl || !imageEl) return
    const R = MOTION.reveal

    if (snap || prefersReducedMotion()) {
      gsap.set(imageEl, { clipPath: R.openInset, scale: R.endScale })
      if (text?.current) gsap.set(text.current, { y: 0, opacity: 1 })
      if (prefersReducedMotion()) return
    }

    registerMotion()
    const ctx = gsap.context(() => {
      if (!snap) {
        // Arriving under the shutter: open once the ink is half way off.
        const delay = arrivalDelay(imageEl)
        gsap.fromTo(
          imageEl,
          { clipPath: R.slotInset, scale: R.startScale },
          { clipPath: R.openInset, scale: R.endScale, ease: gsapEase(), duration: autoplayDur * viewportScale().dur, delay }
        )
      }
      if (text?.current) {
        gsap.fromTo(
          text.current,
          { y: 0, opacity: 1 },
          {
            y: R.textLift,
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: sectionEl, start: 'top top', end: `+=${R.touchTextEndVh * 100}%`, scrub: R.scrub },
          }
        )
      }
    }, sectionEl)
    return () => ctx.revert()
  }, [autoplayDur, snap, section, image, text])
}
