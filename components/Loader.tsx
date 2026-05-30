'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Logo from '@/components/Logo'

interface LoaderProps {
  onComplete: () => void
}

export default function Loader({ onComplete }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          yPercent: -100,
          duration: 1.2,
          ease: 'expo.inOut',
          delay: 0.3,
          onComplete,
        })
      },
    })

    // Counter animation
    const obj = { val: 0 }
    tl.to(obj, {
      val: 100,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate() {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.round(obj.val)).padStart(2, '0')
        }
      },
    }, 0)

    // Line grow
    tl.fromTo(lineRef.current, { scaleX: 0 }, {
      scaleX: 1,
      duration: 2.2,
      ease: 'power2.inOut',
      transformOrigin: 'left center',
    }, 0)

    // Full logo reveal
    tl.fromTo(logoRef.current, { yPercent: 30, opacity: 0 }, {
      yPercent: 0,
      opacity: 1,
      duration: 1.2,
      ease: 'expo.out',
    }, 0)

    // Tagline
    tl.fromTo(taglineRef.current, { opacity: 0, y: 8 }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'expo.out',
    }, 1.0)

  }, [onComplete])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-ebony overflow-hidden"
    >
      {/* Ambient light */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,73,91,0.18) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 text-center px-8">
        {/* Full logo lockup — HH mark + rule + HISHAM HANY, no PHOTOGRAPHY */}
        <div ref={logoRef} className="opacity-0 flex justify-center mb-6">
          <Logo variant="full" showSubmark={false} size="min(72vw,340px)" className="text-bone" />
        </div>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="opacity-0 font-sans text-[clamp(0.55rem,1.1vw,0.75rem)] tracking-[0.4em] uppercase text-silver"
        >
          Fashion &nbsp;·&nbsp; Editorial &nbsp;·&nbsp; Cinematic
        </p>
      </div>

      {/* Progress line */}
      <div className="absolute bottom-12 left-12 right-12">
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-silver/80">
            Loading
          </span>
          <span ref={counterRef} className="font-serif text-silver/80 text-lg" style={{ fontStyle: 'italic' }}>
            00
          </span>
        </div>
        <div className="h-px bg-silver/10 overflow-hidden">
          <div
            ref={lineRef}
            className="h-full bg-bone/60"
            style={{ transformOrigin: 'left center', transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </div>
  )
}
