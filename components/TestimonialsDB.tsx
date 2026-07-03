'use client'

import { useEffect, useState } from 'react'
import type { Testimonial } from '@/drizzle/schema'
import { useMaskReveal } from '@/hooks/useMaskReveal'

interface Props {
  initialData?: Testimonial[]
}

/**
 * Client voices as editorial pull-quotes — oversized Bodoni italic with mono
 * attribution, hairline-separated, mask-revealed on scroll. Renders nothing
 * until testimonials exist (the admin CMS manages them).
 */
export default function TestimonialsDB({ initialData }: Props) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialData ?? [])
  const [loaded, setLoaded] = useState(!!initialData)
  const revealRef = useMaskReveal<HTMLDivElement>({ stagger: '.pull-quote' })

  useEffect(() => {
    if (initialData) return
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((data: Testimonial[]) => {
        setTestimonials(Array.isArray(data) ? data : [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [initialData])

  if (!loaded || testimonials.length === 0) return null

  return (
    <section className="section-pad border-t border-fg/8">
      <div className="mb-16">
        <p className="font-sans text-label-xs uppercase text-muted/50 mb-5">05 — Client Voices</p>
        <h2 className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
          What they <em className="text-accent italic">say</em>
        </h2>
      </div>

      <div ref={revealRef} className="space-y-0">
        {testimonials.map((t) => (
          <figure key={t.id} className="pull-quote border-t border-fg/10 py-14 md:py-20 m-0">
            <blockquote
              className="font-serif italic text-fg max-w-measure-wide text-[clamp(1.5rem,3.2vw,2.5rem)] leading-[1.3]"
              style={{ fontWeight: 300 }}
            >
              “{t.body}”
            </blockquote>
            <figcaption className="mt-8">
              <p className="font-sans text-label-sm uppercase text-fg/75">{t.client_name}</p>
              <p className="font-sans text-label-xs uppercase text-muted/50 mt-1.5">
                {[t.role, t.company].filter(Boolean).join(' — ')}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
