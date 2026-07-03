'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { MOTION, gsapEase, prefersReducedMotion } from '@/lib/motion'

const PANELS = 5

export default function Template({ children }: { children: React.ReactNode }) {
  const isHome = usePathname() === '/'          // loader already covers the home entrance
  const curtainRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const curtain = curtainRef.current
    const page = pageRef.current
    if (!page) return

    if (prefersReducedMotion() || isHome) {
      gsap.set(page, { opacity: 1, y: 0 })
      if (curtain) gsap.set(curtain, { display: 'none' })
      return
    }

    const ctx = gsap.context(() => {
      if (curtain) {
        gsap.to(curtain.children, {
          yPercent: -100,
          duration: MOTION.dur.slow,
          ease: gsapEase(),
          stagger: 0.06,
          onComplete: () => gsap.set(curtain, { display: 'none' }),
        })
      }
      gsap.fromTo(
        page,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: MOTION.dur.medium, ease: gsapEase(), delay: 0.4 }
      )
    })
    return () => ctx.revert()
  }, [isHome])

  return (
    <>
      {!isHome && (
        <div ref={curtainRef} className="fixed inset-0 z-[9997] flex pointer-events-none" aria-hidden="true">
          {Array.from({ length: PANELS }).map((_, i) => (
            <div key={i} className="h-full bg-ink will-change-transform" style={{ width: `${100 / PANELS}%` }} />
          ))}
        </div>
      )}
      {/* Pre-hidden inline so there is no flash before the timeline takes over. */}
      <div ref={pageRef} style={{ opacity: isHome ? 1 : 0 }}>
        {children}
      </div>
    </>
  )
}
