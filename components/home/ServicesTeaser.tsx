'use client'

import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { services } from '@/lib/services'

const PRODUCTIONS = services.map(({ num, title, eyebrow }) => ({ num, title, note: eyebrow }))

/**
 * Index-style services teaser for the home narrative. Each line points at the
 * full production breakdown on /services.
 */
export default function ServicesTeaser() {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.service-line' })

  return (
    <section id="services" className="section-pad border-t border-fg/8">
      <div className="mb-16 max-w-5xl">
        <p className="font-sans text-label-xs uppercase text-muted/50 mb-5">
          04 — Productions
        </p>
        <h2 className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
          What I <em className="text-accent italic">produce</em>
        </h2>
      </div>

      <div ref={revealRef}>
        {PRODUCTIONS.map(({ num, title, note }) => (
          <Link
            key={num}
            href="/services"
            data-cursor="Services"
            className="service-line group flex items-baseline gap-6 md:gap-10 py-6 border-t border-fg/8 last:border-b transition-colors duration-300 hover:bg-fg/[0.02]"
          >
            <span className="font-sans text-label-xs uppercase text-muted/40 min-w-[2rem] group-hover:text-accent transition-colors duration-300">
              {num}
            </span>
            <span className="font-serif text-[clamp(1.5rem,3.5vw,2.75rem)] text-fg leading-none" style={{ fontWeight: 300 }}>
              {title}
            </span>
            <span className="hidden md:block ml-auto font-sans text-label-xs uppercase text-muted/40 group-hover:text-muted/70 transition-colors duration-300">
              {note}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/services"
        data-cursor="View"
        className="magnetic-btn mt-12 inline-flex items-center gap-3 font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300 group"
      >
        Process, deliverables &amp; investment
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>
    </section>
  )
}
