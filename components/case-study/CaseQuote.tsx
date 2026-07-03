'use client'

import { useEffect, useState } from 'react'
import type { Testimonial } from '@/drizzle/schema'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * Editorial pull-quote: the client's testimonial in oversized Bodoni italic,
 * matched by company name from the testimonials API. Renders nothing while
 * loading or when this client has no testimonial on record — the section
 * only exists when there is a real voice to print.
 */
export default function CaseQuote({ client }: { client: string }) {
  const [quote, setQuote] = useState<Testimonial | null>(null)
  const revealRef = useScrollReveal<HTMLDivElement>()

  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Testimonial[]) => {
        if (!Array.isArray(data)) return
        const match = data.find(
          (t) => t.company?.trim().toLowerCase() === client.trim().toLowerCase()
        )
        if (match) setQuote(match)
      })
      .catch(() => {})
  }, [client])

  if (!quote) return null

  return (
    <section className="px-6 md:px-12 py-section-sm border-t border-fg/10">
      <div ref={revealRef} className="max-w-measure-wide mx-auto text-center">
        <p className="font-sans text-label-xs uppercase text-muted mb-10">Client</p>
        <blockquote
          className="font-serif italic text-fg text-[clamp(1.5rem,3.5vw,2.75rem)] leading-[1.25]"
          style={{ fontWeight: 300 }}
        >
          “{quote.body}”
        </blockquote>
        <footer className="mt-10">
          <p className="font-sans text-label-sm uppercase text-fg/70">{quote.client_name}</p>
          <p className="font-sans text-label-xs uppercase text-muted mt-2">
            {[quote.role, quote.company].filter(Boolean).join(' — ')}
          </p>
        </footer>
      </div>
    </section>
  )
}
