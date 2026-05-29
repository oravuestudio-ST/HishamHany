'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const STRIP_COUNT = 8
const STRIP_WIDTH = 100 / STRIP_COUNT

export default function ShredderTransition() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const el = overlayRef.current
    if (!el) return

    const strips = Array.from(el.querySelectorAll<HTMLDivElement>('.shredder-strip'))

    // Reset: all strips hidden at bottom
    gsap.set(strips, { clipPath: 'inset(0 0 100% 0)' })

    const triggers: ScrollTrigger[] = []
    const timelines: gsap.core.Timeline[] = []
    let isRunning = false

    const fireShredder = (trigger: string) => {
      const tl = gsap.timeline({ paused: true, onComplete: () => { isRunning = false } })
      tl.to(strips, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 1.2,
        ease: 'power2.inOut',
        stagger: 0.04,
      }).to(strips, {
        clipPath: 'inset(100% 0 0% 0)',
        duration: 0.8,
        ease: 'power3.in',
        stagger: 0.04,
      })

      timelines.push(tl)

      triggers.push(
        ScrollTrigger.create({
          trigger,
          start: 'bottom 80%',
          once: true,
          onEnter: () => {
            if (isRunning) return
            isRunning = true
            tl.play()
          },
        })
      )
    }

    // Only fire on the portfolio section — hero trigger was jarring on initial land
    fireShredder('#portfolio-section')

    return () => {
      triggers.forEach((t) => t.kill())
      timelines.forEach((tl) => tl.kill())
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50 }}
      aria-hidden="true"
    >
      {Array.from({ length: STRIP_COUNT }).map((_, i) => (
        <div
          key={i}
          className="shredder-strip absolute top-0 h-full"
          style={{
            left: `${i * STRIP_WIDTH}%`,
            width: `${STRIP_WIDTH}%`,
            background: 'var(--ebony)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        />
      ))}
    </div>
  )
}
