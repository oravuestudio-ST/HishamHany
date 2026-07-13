'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { projects } from '@/lib/projects'
import { useHorizontalGallery } from '@/hooks/useHorizontalGallery'
import { ATTENTION } from '@/animations/tokens'

const featured = projects.filter((p) => p.featured)

/**
 * The featured six as a horizontal gallery: on desktop the section pins and
 * vertical scroll carries the strip sideways; on touch and reduced motion it
 * is a native swipe row. One deliberate cinematic beat before the archive.
 * A thin rule + counter track the pinned scrub — the only affordance that
 * this beat, unlike the rest of the page, doesn't end when it "completes".
 */
export default function FeaturedStrip() {
  const fillRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const { sectionRef, trackRef } = useHorizontalGallery<HTMLElement, HTMLDivElement>({
    onProgress: (progress) => {
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`
      if (counterRef.current) {
        const index = Math.min(featured.length - 1, Math.round(progress * (featured.length - 1)))
        counterRef.current.textContent = String(index + 1).padStart(2, '0')
      }
    },
  })

  if (featured.length === 0) return null

  return (
    <section
      ref={sectionRef}
      aria-label="Featured projects"
      className="relative overflow-hidden border-t border-fg/10 md:min-h-screen md:flex md:flex-col md:justify-center"
    >
      <div className="flex items-baseline gap-3 px-6 md:px-12 pt-10 md:pt-0 mb-8 font-sans text-label-xs uppercase text-muted">
        <p>Featured — scroll</p>
        <span className="hidden md:inline ml-auto tabular-nums" aria-hidden="true">
          <span ref={counterRef}>01</span> / {String(featured.length).padStart(2, '0')}
        </span>
      </div>
      <div className="hidden md:block absolute left-6 right-6 md:left-12 md:right-12 top-[4.6rem] h-px bg-fg/10" aria-hidden="true">
        <div ref={fillRef} className="h-full bg-accent origin-left" style={{ transform: 'scaleX(0)' }} />
      </div>
      <div
        ref={trackRef}
        className="flex gap-6 md:gap-10 px-6 md:px-12 pb-10 md:pb-0 overflow-x-auto md:overflow-x-visible will-change-transform"
      >
        {featured.map((p, i) => (
          <Link
            key={p.slug}
            href={`/work/${p.slug}`}
            data-cursor="View Case"
            className="group shrink-0 w-[78vw] sm:w-[52vw] md:w-[38vw] lg:w-[30vw]"
          >
            <div
              className={`relative overflow-hidden bg-fg/5 ${p.aspect === 'portrait' ? 'aspect-[4/5]' : 'aspect-[3/2]'}`}
              style={{
                '--attention-grayscale': ATTENTION.restGrayscale,
                '--attention-contrast': ATTENTION.restContrast,
              } as React.CSSProperties}
            >
              <Image
                src={p.image}
                alt={`${p.title} ${p.subtitle ?? ''}`.trim()}
                fill
                sizes="(max-width: 768px) 78vw, 38vw"
                className="attention-grade object-cover object-center group-hover:scale-[1.04] transition-transform duration-700 ease-premium"
                priority={i < 2}
              />
            </div>
            <div className="flex items-baseline gap-4 mt-4">
              <span className="font-sans text-label-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="font-serif text-fg text-lg md:text-xl leading-tight group-hover:text-accent transition-colors duration-300" style={{ fontWeight: 300 }}>
                  {p.title}
                  {p.subtitle && <em className="italic text-fg/70"> — {p.subtitle}</em>}
                </p>
                <p className="font-sans text-label-xs uppercase text-muted mt-1.5">
                  {p.category} · {p.year}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
