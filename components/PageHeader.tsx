'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { CHAPTER, DUR, MOTION, STAGGER, gsapEase, registerMotion, prefersReducedMotion } from '@/lib/motion'

registerMotion()

interface PageHeaderProps {
  eyebrow: string
  /** Main display line (uppercase serif). */
  title: string
  /** Italic accent line under the title. */
  accent?: string
  /** Optional lead paragraph under the headline. */
  lead?: string
  /**
   * Optional viewfinder beside the headline — the loader's aperture, repeated
   * per page. Children marked `data-frame-open` open from CHAPTER.openInset to
   * full frame (staggered when there are several) while the corner marks close in.
   */
  frame?: React.ReactNode
  /** Caption under the frame, eyebrow style. */
  frameCaption?: string
}

/**
 * Shared route headline: eyebrow, masked-reveal display title with an italic
 * accent line, optional reading-measure lead, optional viewfinder frame.
 * Keeps every interior page opening on the same editorial beat.
 */
export default function PageHeader({ eyebrow, title, accent, lead, frame, frameCaption }: PageHeaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return
    const lines = root.querySelectorAll('.reveal-inner')
    const opens = root.querySelectorAll<HTMLElement>('[data-frame-open]')
    const marks = root.querySelector('.frame-marks')
    const ease = gsapEase()
    const ctx = gsap.context(() => {
      gsap.from(lines, { yPercent: 110, duration: MOTION.dur.slow, ease, stagger: MOTION.stagger })
      if (opens.length) {
        gsap.fromTo(opens,
          { clipPath: CHAPTER.openInset },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.cinematic, ease, stagger: STAGGER.images })
        // The image lands rather than unclips: overscale settles as the window opens.
        gsap.fromTo(Array.from(opens, (o) => o.firstElementChild).filter(Boolean),
          { scale: CHAPTER.openScale },
          { scale: 1, duration: DUR.cinematic, ease, stagger: STAGGER.images })
      }
      if (marks) gsap.from(marks, { scale: 1.12, opacity: 0, duration: DUR.cinematic, ease })
    }, root)
    return () => ctx.revert()
  }, [])

  const titleBlock = (
    <>
      <p className="eyebrow mb-5">{eyebrow}</p>
      <div className="overflow-hidden">
        <h1
          className="reveal-inner font-serif uppercase text-fg leading-[0.9] tracking-tight text-display-lg"
          style={{ fontWeight: 400 }}
        >
          {title}
        </h1>
      </div>
    </>
  )
  const rest = (
    <>
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
    </>
  )

  if (!frame) {
    return <div ref={rootRef} className="px-6 md:px-12 pt-36 pb-16">{titleBlock}{rest}</div>
  }

  // The display title keeps the full measure (long words like PRODUCTIONS
  // clip in a narrower column); the frame sits beside the accent and lead.
  return (
    <div ref={rootRef} className="px-6 md:px-12 pt-36 pb-16 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-12 md:items-start">
      <div className="md:col-span-12">{titleBlock}</div>
      <div className="md:col-span-7 md:-mt-12">{rest}</div>
      <figure className="md:col-span-4 md:col-start-9 m-0">
        <div className="relative text-fg/50">
          {frame}
          <span aria-hidden="true" className="frame-marks" />
        </div>
        {frameCaption && <figcaption className="eyebrow mt-5">{frameCaption}</figcaption>}
      </figure>
    </div>
  )
}
