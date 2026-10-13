'use client'

import Link from 'next/link'
import { SITE } from '@/lib/site'
import { useReveal } from '@/hooks/useReveal'
import { useMagnetic } from '@/hooks/useMagnetic'

/**
 * Closing invitation on the home narrative. The full contact experience
 * (form, response promise, channels) lives at /contact.
 */
export default function ContactCta() {
  const revealRef = useReveal<HTMLElement>('threshold', { stagger: '.cta-item' })
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.4)

  return (
    <section ref={revealRef} id="contact" className="section-pad min-h-[70vh] flex flex-col justify-center relative">
      {/* Threshold rule — expands from center before the invitation fades in */}
      <div data-reveal-line className="absolute top-0 left-0 w-full h-px bg-fg/15" aria-hidden="true" />
      <div className="w-full text-center">
        <p className="cta-item eyebrow mb-8">
          Commission
        </p>
        <h2 className="cta-item font-serif text-display-lg text-fg" style={{ fontWeight: 300 }}>
          Start a<br />
          <em className="text-accent italic">project</em>
        </h2>
        <div className="cta-item mt-14">
          <Link
            ref={ctaRef}
            href="/contact"
            data-cursor="Contact"
            className="btn-fill btn-cta btn-cta--lg magnetic-btn"
          >
            Get in touch
          </Link>
        </div>
        <p className="cta-item font-sans text-label-sm uppercase text-muted mt-10">
          <a href={`mailto:${SITE.email}`} className="link-underline hover:text-fg transition-colors duration-300">
            {SITE.email}
          </a>
          <span className="mx-3 text-muted">·</span>
          <a
            href={SITE.social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline hover:text-fg transition-colors duration-300"
          >
            WhatsApp
          </a>
        </p>
        {/* Closing bookend — the page opens on the name and closes on the line. */}
        <p className="cta-item mt-16 font-serif italic text-display-sm text-muted" style={{ lineHeight: 1.1 }}>
          Where light becomes language.
        </p>
      </div>
    </section>
  )
}
