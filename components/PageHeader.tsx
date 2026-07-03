'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MOTION, gsapEase, registerMotion, prefersReducedMotion } from '@/lib/motion'

registerMotion()

interface PageHeaderProps {
  eyebrow: string
  /** Main display line (uppercase serif). */
  title: string
  /** Italic accent line under the title. */
  accent?: string
  /** Optional lead paragraph under the headline. */
  lead?: string
}

/**
 * Shared route headline: eyebrow, masked-reveal display title with an italic
 * accent line, optional reading-measure lead. Keeps every page opening on the
 * same editorial beat.
 */
export default function PageHeader({ eyebrow, title, accent, lead }: PageHeaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lines = rootRef.current?.querySelectorAll('.reveal-inner')
    if (!lines || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(lines, { yPercent: 110, duration: MOTION.dur.hero, ease: gsapEase(), stagger: MOTION.stagger })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className="px-6 md:px-12 pt-36 pb-16">
      <p className="font-sans text-label-xs uppercase text-muted mb-5">{eyebrow}</p>
      <div className="overflow-hidden">
        <h1
          className="reveal-inner font-serif uppercase text-fg leading-[0.9] tracking-tight text-display-lg"
          style={{ fontWeight: 400 }}
        >
          {title}
        </h1>
      </div>
      {accent && (
        <div className="overflow-hidden">
          <p className="reveal-inner font-serif italic text-accent leading-[0.95] text-display" style={{ fontWeight: 300 }}>
            {accent}
          </p>
        </div>
      )}
      {lead && (
        <p className="font-sans text-body md:text-body-lg text-muted mt-10 max-w-measure">{lead}</p>
      )}
    </div>
  )
}
