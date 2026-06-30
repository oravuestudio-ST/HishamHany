'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { registerMotion } from '@/lib/motion'
import { useSettings } from '@/components/SettingsProvider'

// Register the motion system's plugins (ScrollTrigger + the "premium"
// CustomEase) once, up front, so every hook and component can rely on them.
registerMotion()

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const { smoothScroll } = useSettings()

  useEffect(() => {
    // Respect reduced-motion AND the user's smooth-scroll knob: skip the
    // smooth-scroll hijack and let the browser scroll natively. ScrollTrigger
    // still works off the native scroll. Re-runs when the knob flips.
    if (!smoothScroll || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ScrollTrigger.refresh()
      return
    }

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
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
