'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import type { Project } from '@/lib/projects'
import { MOTION, gsapEase, prefersReducedMotion } from '@/lib/motion'
import { useSlotReveal } from '@/hooks/useSlotReveal'
import { morphTransitionName, signalMorphTargetReady } from '@/lib/view-transitions'

/**
 * Full-bleed magazine cover with the shared scroll unveil: the project's hero
 * photograph starts as a centered vertical slot and opens to full-bleed as the
 * reader scrolls (pinned, shorter travel than the home hero via
 * MOTION.reveal.casePin), while the ink title block holds then lifts. The
 * category eyebrow and display title still rise through their reveal masks on
 * load. The LCP image of the page — priority.
 *
 * This is also the morph *target*: its closed-slot frame (the clip-path
 * already inlined below, before any JS runs) is what a grid thumbnail morphs
 * into via View Transitions — see lib/view-transitions.ts. The name is set
 * imperatively (not via React style) so it's inert whenever no transition is
 * in flight, and signalMorphTargetReady() tells the dispatcher this frame is
 * painted and safe to capture.
 */
export default function CaseCover({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null)     // tall trigger — pin-spacing lives here
  const stageRef = useRef<HTMLDivElement>(null) // sticky frame pinned during the reveal
  const coverRef = useRef<HTMLDivElement>(null) // clip-path slot→full + scale
  const titleRef = useRef<HTMLDivElement>(null) // title block — holds then lifts

  // Scroll unveil — shorter pin than the home hero; all timing from MOTION.reveal.
  useSlotReveal(
    { section: rootRef, stage: stageRef, image: coverRef, text: titleRef },
    // Shorter pin on desktop; on touch the cover autoplays quicker than the home
    // hero (caseAutoplayDur) so it doesn't slow down browsing case studies.
    { end: MOTION.reveal.casePin, autoplayDur: MOTION.reveal.caseAutoplayDur }
  )

  useEffect(() => {
    const el = coverRef.current
    if (!el) return
    el.style.setProperty('view-transition-name', morphTransitionName(project.slug))
    const raf = requestAnimationFrame(() => signalMorphTargetReady())
    return () => {
      cancelAnimationFrame(raf)
      el.style.removeProperty('view-transition-name')
    }
  }, [project.slug])

  // On-load masked title reveal. The image's settle-scale is gone — the scroll
  // reveal owns the scale now — leaving this beat as the pure title cascade.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const lines = root.querySelectorAll('.cover-line')

    if (prefersReducedMotion()) {
      gsap.set(lines, { yPercent: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lines,
        { yPercent: 115 },
        { yPercent: 0, duration: MOTION.dur.hero, ease: gsapEase(), stagger: MOTION.stagger, delay: 0.2 }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} className="relative w-full">
      {/* Sticky frame — GSAP pins this while the reveal scrubs. Ink backdrop so
          the slot opens out of a dark frame and the paper title holds contrast. */}
      <div
        ref={stageRef}
        className="relative min-h-[92svh] flex items-end overflow-hidden bg-ebony"
      >
        {/* Reveal layer — clip-path opens from a centered vertical slot to
            full-bleed under scroll (useSlotReveal). Inline clip-path is the
            closed state, applied before JS so there's no flash of the full photo. */}
        <div
          ref={coverRef}
          className="cover-media absolute inset-0 will-change-transform"
          style={{
            clipPath: MOTION.reveal.slotInset,
            transform: `scale(${MOTION.reveal.startScale})`,
          }}
        >
          <Image
            src={project.image}
            alt={`${project.title} ${project.subtitle ?? ''} — ${project.category} photography for ${project.client}`.trim()}
            fill
            priority
            sizes="100vw"
            quality={80}
            className="object-cover object-center"
          />
          {/* Cinematic scrim — keeps the ink title block readable on any frame */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgb(var(--ink-rgb) / 0.82) 0%, rgb(var(--ink-rgb) / 0.25) 42%, rgb(var(--ink-rgb) / 0.12) 100%)',
            }}
          />
        </div>

        {/* Title block — overlaid on the reveal; holds then lifts as it opens */}
        <div
          ref={titleRef}
          className="relative w-full px-6 md:px-12 pb-16 md:pb-20 pt-48 will-change-transform"
        >
          <div className="overflow-hidden">
            <p className="cover-line font-sans text-label-sm uppercase text-paper/70">
              {project.category} · {project.year}
              {project.location ? ` · ${project.location}` : ''}
            </p>
          </div>
          <div className="overflow-hidden mt-4">
            <h1
              className="cover-line font-serif uppercase text-paper leading-[0.87] tracking-tight text-[clamp(3rem,11vw,10rem)]"
              style={{ fontWeight: 400 }}
            >
              {project.title}
            </h1>
          </div>
          {project.subtitle && (
            <div className="overflow-hidden">
              <p
                className="cover-line font-serif italic text-paper/85 text-[clamp(1.5rem,4vw,3.5rem)] leading-[1.05]"
                style={{ fontWeight: 300 }}
              >
                {project.subtitle}
              </p>
            </div>
          )}
          <div className="overflow-hidden mt-6">
            <p className="cover-line font-sans text-label-xs uppercase text-paper/60">
              Client — {project.client}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
