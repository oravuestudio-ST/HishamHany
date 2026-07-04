'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { registerMotion, LENIS } from '@/lib/motion'
import { useSettings } from '@/components/SettingsProvider'

// Register the motion system's plugins (ScrollTrigger + the "premium"
// CustomEase) once, up front, so every hook and component can rely on them.
registerMotion()

/**
 * Lenis attaches to the document root, so this component has no structural
 * role — render it as a self-closing sibling (`<SmoothScroll />`) wherever
 * possible so page content isn't pulled out of the server-rendered HTML by
 * a `ssr: false` wrapper. `children` is accepted for legacy call sites.
 */
export default function SmoothScroll({ children }: { children?: React.ReactNode }) {
  const { smoothScroll } = useSettings()

  useEffect(() => {
    // Respect reduced-motion AND the user's smooth-scroll knob: skip the
    // smooth-scroll hijack and let the browser scroll natively. ScrollTrigger
    // still works off the native scroll. Re-runs when the knob flips.
    if (!smoothScroll || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ScrollTrigger.refresh()
      return
    }

    // lerp mode (not duration/easing): exponential damping gives the scroll a
    // constant physical weight regardless of how hard the wheel is thrown.
    const lenis = new Lenis({
      lerp: LENIS.lerp,
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: LENIS.wheelMultiplier,
      touchMultiplier: LENIS.touchMultiplier,
    })

    lenis.on('scroll', ScrollTrigger.update)

    // Store the reference so the same function is removed on cleanup
    const tickerFn = (time: number) => { lenis.raf(time * 1000) }
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(tickerFn)
    }
  }, [smoothScroll])

  return <>{children}</>
}
