'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { MOTION, gsapEase, prefersReducedMotion } from '@/lib/motion'
import { liftWipe, isCovered } from '@/animations/transitions'

// Focus management: on client-side navigation (not the initial load) keyboard
// and screen-reader users land on the new page's content, not stale chrome.
// Tracked by pathname so StrictMode's double effect run stays a no-op.
let lastPathname: string | null = null

/**
 * The enter side of the mask-wipe transition. When the wipe surface is
 * covering (RouteWipe played the exit sweep), the surface continues upward
 * off this page while the content settles in beneath it — one continuous
 * shutter gesture. Fresh loads and back/forward arrive uncovered and get a
 * plain fade instead. Home is excluded: the loader owns that entrance.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const pageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page) return

    const changedRoute = lastPathname !== null && lastPathname !== pathname
    lastPathname = pathname
    const focusMain = () => {
      if (!changedRoute) return
      document.getElementById('main')?.focus({ preventScroll: true })
    }

    if (prefersReducedMotion() || isHome) {
      // clearProps drops the inline transform entirely — a lingering
      // `transform` on this wrapper would become the containing block for any
      // descendant `position: sticky`/`fixed`, silently breaking it.
      gsap.set(page, { opacity: 1, y: 0, clearProps: 'transform' })
      // Arriving home under a covering shutter (a link or the logo from an
      // interior page): home's intro doesn't replay mid-session, so nothing
      // else would lift it — lift it here rather than waiting on the failsafe.
      if (isCovered()) liftWipe(focusMain)
      else focusMain()
      return
    }

    const ctx = gsap.context(() => {
      if (isCovered()) {
        // Shutter continues off; the page is already composed beneath it, so
        // it only needs a quiet settle as the surface clears.
        gsap.set(page, { opacity: 0, y: 12 })
        liftWipe(focusMain)
        gsap.to(page, {
          opacity: 1,
          y: 0,
          duration: MOTION.dur.slow,
          ease: gsapEase(),
          delay: 0.15,
          clearProps: 'transform',
        })
      } else {
        // Uncovered arrival (first load, back/forward): plain fade.
        gsap.fromTo(
          page,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: MOTION.dur.slow,
            ease: gsapEase(),
            clearProps: 'transform',
            onComplete: focusMain,
          }
        )
      }
    })
    return () => ctx.revert()
  }, [isHome, pathname])

  return (
    // Pre-hidden by CSS (html[data-js] [data-page-enter], globals.css) so there
    // is no flash before the timeline takes over — but only once the bootstrap
    // script has proven JS runs. The markup itself stays visible.
    <div ref={pageRef} data-page-enter={isHome ? undefined : ''}>
      {children}
    </div>
  )
}
