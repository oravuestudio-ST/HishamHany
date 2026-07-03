'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { MOTION, gsapEase, prefersReducedMotion } from '@/lib/motion'

const PANELS = 5

// Focus management: on client-side navigation (not the initial load) keyboard
// and screen-reader users land on the new page's content, not stale chrome.
// Tracked by pathname so StrictMode's double effect run stays a no-op.
let lastPathname: string | null = null

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'          // loader already covers the home entrance
  const curtainRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const curtain = curtainRef.current
    const page = pageRef.current
    if (!page) return

    const changedRoute = lastPathname !== null && lastPathname !== pathname
    lastPathname = pathname
    const focusMain = () => {
      if (!changedRoute) return
      document.getElementById('main')?.focus({ preventScroll: true })
    }

    if (prefersReducedMotion() || isHome) {
      gsap.set(page, { opacity: 1, y: 0 })
      if (curtain) gsap.set(curtain, { display: 'none' })
      focusMain()
      return
    }

    const ctx = gsap.context(() => {
      if (curtain) {
        gsap.to(curtain.children, {
          yPercent: -100,
          duration: MOTION.dur.slow,
          ease: gsapEase(),
          stagger: 0.06,
          onComplete: () => {
            gsap.set(curtain, { display: 'none' })
            focusMain()
          },
        })
      } else {
        focusMain()
      }
      gsap.fromTo(
        page,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: MOTION.dur.medium, ease: gsapEase(), delay: 0.4 }
      )
    })
    return () => ctx.revert()
  }, [isHome, pathname])

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
