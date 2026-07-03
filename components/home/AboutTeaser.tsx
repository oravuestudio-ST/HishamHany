'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useTilt } from '@/hooks/useTilt'

/**
 * Condensed About for the home narrative — portrait, a two-line position
 * statement, and the invitation deeper. The full story lives at /about.
 */
export default function AboutTeaser() {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.about-teaser-item' })
  const portraitTilt = useTilt<HTMLDivElement>({ rotX: 7, rotY: 8, leave: 0.7 })

  return (
    <section id="about" className="section-pad">
      <div ref={revealRef} className="grid md:grid-cols-12 gap-stack items-center">
        <div className="about-teaser-item md:col-span-4" style={{ perspective: '1100px' }}>
          <div ref={portraitTilt} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
            <div className="relative overflow-hidden bg-fg/5">
              <Image
                src="/images/hisham-portrait-v2.jpg"
                alt="Hisham Hany, photographer"
                width={0}
                height={0}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="develop block w-full h-auto"
              />
            </div>
          </div>
        </div>

        <div className="about-teaser-item md:col-span-7 md:col-start-6">
          <p className="font-sans text-label-xs uppercase text-muted mb-5">
            03 — The Photographer
          </p>
          <h2 className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
            Commercial precision,
            <br />
            <em className="text-accent italic">cinematic</em> atmosphere.
          </h2>
          <p className="font-sans text-body-sm text-muted mt-8 max-w-measure">
            Six years producing high-impact imagery for brands, media organizations,
            and cultural institutions — every project approached as a precise visual
            problem to solve.
          </p>
          <Link
            href="/about"
            data-cursor="About"
            className="magnetic-btn mt-10 inline-flex items-center gap-3 font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300 group"
          >
            The full story
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
