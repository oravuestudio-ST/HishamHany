'use client'

import { useEffect, useRef } from 'react'
import { MOTION, registerMotion, prefersReducedMotion } from '@/lib/motion'
import { useReveal } from '@/hooks/useReveal'

registerMotion()

const STATEMENT = 'The image is the message — light, controlled; composition, deliberate.'
const MARQUEE_WORDS = ['Fashion', 'Automotive', 'Editorial', 'Commercial', 'Cinematic', 'Portraiture']

/**
 * Inverted editorial statement — an always-dark feature panel carrying:
 *  • an infinite italic Bodoni marquee strip,
 *  • the threshold entrance: a hairline rule draws itself, then the
 *    statement breathes in beneath it (section punctuation),
 *  • the accent cursor-spotlight (which only paints over .dark-section panels).
 */
export default function Statement() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const revealRef = useReveal<HTMLDivElement>('threshold', { stagger: '.statement-item' })

  // Velocity-reactive marquee — the italic strip breathes with scroll speed,
  // easing back to its resting pace when the reader stops. Drives the CSS
  // animation's playbackRate via WAAPI (composited; the keyframes stay in
  // globals.css, so reduced-motion's `animation: none` still wins). The rAF
  // loop runs only while the section is on screen (IntersectionObserver gate).
  useEffect(() => {
    const track = trackRef.current
    const section = sectionRef.current
    if (!track || !section) return
    if (prefersReducedMotion()) return
    if (typeof track.getAnimations !== 'function') return

    const V = MOTION.ambient
    let rate = 1
    let lastY = window.scrollY
    let lastT = 0
    let raf = 0

    const tick = (now: number) => {
      const dt = lastT ? Math.max(1, now - lastT) : 16
      const v = (Math.abs(window.scrollY - lastY) / dt) * 1000 // px/s
      lastY = window.scrollY
      lastT = now
      const target = 1 + Math.min(V.velocityBoost - 1, (v / V.velocitySaturate) * (V.velocityBoost - 1))
      rate += (target - rate) * V.velocitySmoothing
      for (const anim of track.getAnimations()) anim.playbackRate = rate
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) { lastT = 0; lastY = window.scrollY; raf = requestAnimationFrame(tick) }
      } else if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
        // Settle to rest while off screen so re-entry never starts fast.
        rate = 1
        for (const anim of track.getAnimations()) anim.playbackRate = 1
      }
    })
    io.observe(section)

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Cursor spotlight — drive --mx/--my (px) + --spot from pointer position.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    // Rect cached per hover, invalidated on scroll — no layout read per move.
    let rect: DOMRect | null = null
    const onMove = (e: MouseEvent) => {
      if (!rect) rect = section.getBoundingClientRect()
      section.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      section.style.setProperty('--my', `${e.clientY - rect.top}px`)
      section.style.setProperty('--spot', '1')
    }
    const onLeave = () => { rect = null; section.style.setProperty('--spot', '0') }
    const onScroll = () => { rect = null }

    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section ref={sectionRef} className="dark-section section-pad overflow-hidden">
      <div className="spotlight" aria-hidden="true" />

      {/* Infinite italic marquee strip */}
      <div className="relative z-[1] -mx-[6vw] mb-16 md:mb-24 select-none" aria-hidden="true">
        <div ref={trackRef} className="flex w-max marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center shrink-0">
              {MARQUEE_WORDS.map((w, i) => (
                <span key={`${dup}-${i}`} className="marquee-italic text-[clamp(2.5rem,8vw,7rem)] text-paper/90 px-6">
                  {w}
                  <span className="text-accent px-6">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Threshold statement — rule draws, then the words arrive beneath it */}
      <div ref={revealRef} className="relative z-[1] max-w-5xl">
        <div data-reveal-line className="h-px w-full bg-paper/20 mb-10" aria-hidden="true" />
        <p className="statement-item font-sans text-[0.58rem] tracking-[0.4em] uppercase text-paper/40 mb-8">
          — Statement
        </p>
        <p className="statement-item font-serif italic text-[clamp(1.8rem,5vw,4rem)] leading-[1.1] text-paper">
          {STATEMENT}
        </p>
      </div>
    </section>
  )
}
