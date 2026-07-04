'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Logo from '@/components/Logo'
import { prefersReducedMotion } from '@/lib/motion'

interface LoaderProps {
  onComplete: () => void
}

const PANELS = 5

// Play the curtain on every page load (reload, new tab, direct link), but not
// again when the visitor routes back to Home mid-session — the route wipe
// already covers that entrance, and stacking both reads as a stall. Module
// scope resets on every real load and survives in-app navigation.
let playedThisPageLoad = false

/**
 * Signature curtain loader. A percentage counter runs to 100 over the brand
 * lockup, then five INK panels split upward in sequence (expo.inOut, staggered)
 * to uncover the page. Always rendered on ink/paper regardless of theme.
 *
 * Reduced motion: skip the choreography and hand off immediately so content
 * appears without the curtain.
 */
export default function Loader({ onComplete }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const panelsRef = useRef<HTMLDivElement>(null)

  const [skip] = useState(() => playedThisPageLoad)

  useEffect(() => {
    if (skip || prefersReducedMotion()) {
      onComplete()
      return
    }
    playedThisPageLoad = true

    const panels = panelsRef.current?.querySelectorAll('.loader-panel')
    const tl = gsap.timeline()

    // Counter 00 → 100
    const obj = { val: 0 }
    tl.to(obj, {
      val: 100,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate() {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.round(obj.val)).padStart(3, '0')
        }
      },
    }, 0)

    // Brand lockup eases in alongside the count
    tl.fromTo(centerRef.current,
      { yPercent: 18, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out' },
      0.1,
    )

    // Lockup lifts away just before the curtain
    tl.to(centerRef.current, { yPercent: -22, opacity: 0, duration: 0.45, ease: 'expo.inOut' }, '+=0.05')

    // Five ink panels split upward, staggered
    if (panels) {
      tl.to(panels, {
        yPercent: -100,
        duration: 0.8,
        ease: 'expo.inOut',
        stagger: 0.06,
        onComplete,
      }, '-=0.2')
    } else {
      tl.call(onComplete)
    }

    return () => { tl.kill() }
  }, [onComplete, skip])

  // Mid-session return to Home — render nothing rather than flashing the curtain.
  if (skip) return null

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9998] overflow-hidden">
      {/* Curtain — five ink panels that lift in sequence */}
      <div ref={panelsRef} className="absolute inset-0 flex">
        {Array.from({ length: PANELS }).map((_, i) => (
          <div
            key={i}
            className="loader-panel h-full bg-ink will-change-transform"
            style={{ width: `${100 / PANELS}%` }}
          />
        ))}
      </div>

      {/* Centre lockup + counter, sitting above the panels */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 pointer-events-none">
        <div ref={centerRef} className="flex flex-col items-center text-center">
          <Logo variant="full" showSubmark={false} size="min(72vw,320px)" className="text-paper" />
          <p className="mt-6 font-sans text-[clamp(0.5rem,1vw,0.7rem)] tracking-[0.4em] uppercase text-paper/50">
            Fashion · Automotive · Cinematic
          </p>
        </div>
      </div>

      {/* Counter readout, bottom corner */}
      <div className="absolute bottom-10 right-10 z-10 flex items-baseline gap-3 pointer-events-none">
        <span className="font-sans text-[0.55rem] tracking-[0.35em] uppercase text-paper/40">Loading</span>
        <span ref={counterRef} className="font-serif italic text-paper/80 text-2xl tabular-nums">000</span>
      </div>
    </div>
  )
}
