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

    const covered = isCovered()
    if (prefersReducedMotion() || isHome || covered) {
      // clearProps drops the inline transform entirely — a lingering
      // `transform` on this wrapper would become the containing block for any
      // descendant `position: sticky`/`fixed`, silently breaking it.
      gsap.set(page, { opacity: 1, y: 0, clearProps: 'transform' })
      // Under a covering shutter the page is already composed beneath it: the
      // lift is the reveal, and the page's own headers rise as it clears. A
      // second page fade here only delayed the headline. Lifted outside any
      // gsap.context, so a later ctx.revert() can't drop it back (Back button).
      if (covered) liftWipe(focusMain)
      else focusMain()
      return
    }

    // Uncovered arrival (first load, back/forward): plain fade.
    const ctx = gsap.context(() => {
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
