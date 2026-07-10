'use client'

import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import {
  MOTION,
  registerMotion,
  prefersReducedMotion,
  isTouchDevice,
  resolveRevealMode,
  viewportScale,
  gsapEase,
} from '@/lib/motion'

interface SlotRevealRefs {
  /** The tall trigger section (pin-spacing is added here on desktop). */
  section: RefObject<HTMLElement | null>
  /** The sticky frame that stays fixed while the reveal plays. */
  stage: RefObject<HTMLElement | null>
  /** The element whose clip-path + scale open from slot to full-bleed. */
  image: RefObject<HTMLElement | null>
  /** Optional overlay (headline) that holds, then eases up and out. */
  text?: RefObject<HTMLElement | null>
}

interface SlotRevealOptions {
  /** Pin scroll budget, e.g. '+=120%'. Desktop only. Defaults to MOTION.reveal.pin. */
  end?: string
  /**
   * Autoplay (touch) reveal duration in seconds, before viewport scaling.
   * Defaults to MOTION.reveal.autoplayDur; case-study covers pass the quicker
   * caseAutoplayDur so browsing isn't slowed.
   */
  autoplayDur?: number
  /**
   * Gate for the autoplay reveal — it holds the closed slot until this is true
   * (e.g. the loader has lifted), then plays once. Ignored by the pinned
   * (desktop) path, which is scroll-driven. Defaults to true.
   */
  play?: boolean
}

/**
 * The signature "vertical slot → full-bleed" hero unveil. One set of keyframes
 * (MOTION.reveal), three drivers chosen by input capability (resolveRevealMode):
 *
 *   snap     — reduced motion: land on the open frame, no animation.
 *   autoplay — touch devices (phones/tablets): play the keyframes on a timeline
 *              once `play` is true. No pin, so nothing fights the touch scroll
 *              or the iOS address bar — the reveal stays smooth.
 *   pinned   — mouse/desktop: pin `stage` and scrub the keyframes across
 *              `section` as the user scrolls.
 *
 * The image opens from slotInset to openInset (settling from startScale); the
 * headline holds for `textHold` of the reveal, then lifts `textLift` and fades.
 * Distinct from useScrollReveal (opacity one-shots) and usePinnedSection.
 */
export function useSlotReveal(refs: SlotRevealRefs, options: SlotRevealOptions = {}) {
  const { section, stage, image, text } = refs
  const {
    end = MOTION.reveal.pin,
    autoplayDur = MOTION.reveal.autoplayDur,
    play = true,
  } = options

  useEffect(() => {
    const sectionEl = section.current
    const stageEl = stage.current
    const imageEl = image.current
    if (!sectionEl || !stageEl || !imageEl) return

    const R = MOTION.reveal
    const mode = resolveRevealMode({
      reducedMotion: prefersReducedMotion(),
      touch: isTouchDevice(),
    })

    // Reduced motion: present the open, full-bleed composition. No pin, no play.
    if (mode === 'snap') {
      gsap.set(imageEl, { clipPath: R.openInset, scale: R.endScale })
      if (text?.current) gsap.set(text.current, { y: 0, opacity: 1 })
      return
    }

    // Touch: autoplay the same keyframes on a plain timeline (no ScrollTrigger,
    // no pin). Hold the closed slot until the play signal, then reveal once.
    if (mode === 'autoplay') {
      if (!play) {
        gsap.set(imageEl, { clipPath: R.slotInset, scale: R.startScale })
        if (text?.current) gsap.set(text.current, { y: 0, opacity: 1 })
        return
      }
      registerMotion()
      const dur = autoplayDur * viewportScale().dur
      const ease = gsapEase()
      const ctx = gsap.context(() => {
        const tl = gsap.timeline()
        tl.fromTo(
          imageEl,
          { clipPath: R.slotInset, scale: R.startScale },
          { clipPath: R.openInset, scale: R.endScale, ease, duration: dur },
          0
        )
        if (text?.current) {
          // Holds for textHold of the beat, then lifts up and out — the desktop
          // behaviour, played on time instead of scrubbed by scroll.
          tl.fromTo(
            text.current,
            { y: 0, opacity: 1 },
            { y: R.textLift, opacity: 0, ease, duration: dur * (1 - R.textHold) },
            dur * R.textHold
          )
        }
      }, sectionEl)
      return () => ctx.revert()
    }

    // Mouse/desktop: pinned scroll-scrub.
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

      tl.fromTo(
        imageEl,
        { clipPath: R.slotInset, scale: R.startScale },
        { clipPath: R.openInset, scale: R.endScale, ease: 'none', duration: 1 },
        0
      )

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
  }, [end, autoplayDur, play, section, stage, image, text])
}
