'use client'

import Link from 'next/link'
import { SITE } from '@/lib/site'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useMagnetic } from '@/hooks/useMagnetic'

/**
 * Closing invitation on the home narrative. The full contact experience
 * (form, response promise, channels) lives at /contact.
 */
export default function ContactCta() {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.cta-item' })
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.4)

  return (
    <section id="contact" className="section-pad border-t border-fg/8 min-h-[70vh] flex items-center">
      <div ref={revealRef} className="w-full text-center">
        <p className="cta-item font-sans text-label-xs uppercase text-muted/50 mb-8">
          06 — Commission
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
            className="magnetic-btn btn-fill inline-block border border-fg/25 px-12 py-5 font-sans text-label-sm uppercase text-fg transition-colors duration-500"
          >
            Get in touch
          </Link>
        </div>
        <p className="cta-item font-sans text-label-sm uppercase text-muted/50 mt-10">
          <a href={`mailto:${SITE.email}`} className="link-underline hover:text-fg transition-colors duration-300">
            {SITE.email}
          </a>
          <span className="mx-3 text-muted/30">·</span>
          <a
            href={SITE.social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline hover:text-fg transition-colors duration-300"
          >
            WhatsApp
          </a>
        </p>
      </div>
    </section>
  )
}
