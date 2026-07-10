'use client'

/**
 * THROWAWAY PROTOTYPE — /reveal-demo
 * Feel-test for the scroll-driven "vertical slot → full-bleed" reveal before it
 * lands in Hero.tsx / case-study headers. Not linked from the site. Delete once
 * the design is approved. Numbers live in REVEAL below to mimic the eventual
 * MOTION.reveal tokens (nothing hardcoded inline).
 */

import { useEffect, useRef } from 'react'
import { registerMotion, prefersReducedMotion } from '@/lib/motion'
import { gsap } from 'gsap'

// Stand-in for the future MOTION.reveal token block.
const REVEAL = {
  startInset: 'inset(0% 34% 0% 34%)', // narrow centered vertical slot
  endInset: 'inset(0% 0% 0% 0%)', // full-bleed
  startScale: 1.12,
  endScale: 1.0,
  pinDistance: '+=120%', // scroll budget the reveal plays across
  scrub: 1,
  textHoldUntil: 0.62, // fraction of the reveal the headline holds before lifting
  textLift: -90, // px the headline eases up as it releases
} as const

const IMAGE = '/images/Fashion/GLITCH GOODS/GLITCH CLUB_outdoor/Glitch_outdoor-007.jpg'

export default function RevealDemoPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const img = imgRef.current
    const text = textRef.current
    if (!sectionRef.current || !stageRef.current || !img || !text) return

    // Reduced motion: present the open, full-bleed composition with no pin.
    if (prefersReducedMotion()) {
      gsap.set(img, { clipPath: REVEAL.endInset, scale: REVEAL.endScale })
      return
    }

    registerMotion() // idempotent — registers ScrollTrigger + the "premium" ease

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: REVEAL.pinDistance,
          pin: stageRef.current,
          scrub: REVEAL.scrub,
        },
      })

      // Image: vertical slot opens outward to full-bleed across the whole scroll.
      tl.fromTo(
        img,
        { clipPath: REVEAL.startInset, scale: REVEAL.startScale },
        { clipPath: REVEAL.endInset, scale: REVEAL.endScale, ease: 'none', duration: 1 },
        0
      )

      // Headline: holds, then eases up + out as the reveal completes.
      tl.fromTo(
        text,
        { y: 0, opacity: 1 },
        { y: REVEAL.textLift, opacity: 0, ease: 'none', duration: 1 - REVEAL.textHoldUntil },
        REVEAL.textHoldUntil
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <main className="bg-[#0a0a0a] text-white">
      {/* The pinned reveal stage */}
      <section ref={sectionRef} className="relative">
        <div ref={stageRef} className="relative h-screen w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={IMAGE}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.55] will-change-transform"
            style={{ clipPath: REVEAL.startInset, transform: `scale(${REVEAL.startScale})` }}
          />

          {/* Cinematic gradient so the headline holds contrast at every stage */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />

          {/* Overlay headline — holds, then lifts */}
          <div
            ref={textRef}
            className="absolute inset-x-0 bottom-[12vh] px-8 md:px-16 will-change-transform"
          >
            <p className="mb-6 text-[0.6rem] uppercase tracking-[0.18em] text-white/50">
              Fashion · Automotive · Commercial
            </p>
            <h1
              className="font-serif leading-[0.9] text-white"
              style={{ fontSize: 'clamp(3.5rem, 9.5vw, 11rem)', fontWeight: 400 }}
            >
              Where light
              <br />
              becomes language.
            </h1>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.55rem] uppercase tracking-[0.2em] text-white/40">
            Scroll to unveil ↓
          </div>
        </div>
      </section>

      {/* Hand-off content, so pin release + the full-bleed payoff are visible */}
      <section className="flex min-h-screen items-center justify-center px-8">
        <p className="max-w-xl text-center text-white/50">
          The reveal has released. On the real site this is where the work grid
          picks up. Scroll back up to replay the unveil.
        </p>
      </section>
    </main>
  )
}
