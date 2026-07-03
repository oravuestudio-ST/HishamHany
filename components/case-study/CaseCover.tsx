'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import type { Project } from '@/lib/projects'
import { MOTION, gsapEase, prefersReducedMotion } from '@/lib/motion'

/**
 * Full-bleed magazine cover: the project's hero photograph at viewport height,
 * category eyebrow and display title rising through reveal masks, a slow
 * settle-scale on the image itself. The LCP image of the page — priority.
 */
export default function CaseCover({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const lines = root.querySelectorAll('.cover-line')
    const media = root.querySelector('.cover-media')

    if (prefersReducedMotion()) {
      gsap.set([lines, media], { clearProps: 'all', opacity: 1, yPercent: 0, scale: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        media,
        { scale: 1.08, opacity: 0.6 },
        { scale: 1, opacity: 1, duration: MOTION.dur.hero, ease: gsapEase() }
      )
      gsap.fromTo(
        lines,
        { yPercent: 115 },
        { yPercent: 0, duration: MOTION.dur.hero, ease: gsapEase(), stagger: MOTION.stagger, delay: 0.2 }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} className="relative min-h-[92svh] flex items-end overflow-hidden">
      {/* Cover photograph */}
      <div className="cover-media absolute inset-0 will-change-transform">
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

      {/* Title block */}
      <div className="relative w-full px-6 md:px-12 pb-16 md:pb-20 pt-48">
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
    </section>
  )
}
