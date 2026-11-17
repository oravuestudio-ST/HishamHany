'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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
 * plain CSS fade instead. Home is excluded: the loader owns that entrance.
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
    if (covered) {
      // Under a covering shutter the page is already composed beneath it: the
      // lift is the reveal, and the page's own headers rise as it clears. No
      // page fade on top. Lifted outside any gsap.context, so nothing can drop
      // it back later (Back button).
      page.style.animation = 'none'
      liftWipe(focusMain)
      return
    }

    if (isHome) {
      focusMain()
      return
    }

    // Uncovered arrival (first load, back/forward): the CSS fade is already
    // running (globals.css, [data-page-enter]). Triggers created during it
    // measured the page 16px low; re-measure once it settles.
    const settled = () => {
      ScrollTrigger.refresh()
      focusMain()
    }
    const fade = page.getAnimations?.()[0]
    if (fade) fade.finished.then(settled, () => {})
    else settled()
  }, [isHome, pathname])

  return (
    // Faded in by CSS (html[data-js] [data-page-enter], globals.css) from the
    // first paint, only once the bootstrap script has proven JS runs.
    <div ref={pageRef} data-page-enter={isHome ? undefined : ''}>
      {children}
    </div>
  )
}
