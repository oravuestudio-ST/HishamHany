'use client'

import { useEffect, useRef } from 'react'
import { registerMotion } from '@/lib/motion'
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
  const revealRef = useReveal<HTMLDivElement>('threshold', { stagger: '.statement-item' })

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
        <div className="flex w-max marquee-track">
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
