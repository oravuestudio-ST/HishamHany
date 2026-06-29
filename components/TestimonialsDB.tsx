'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import type { Testimonial } from '@/drizzle/schema'
import { MOTION, gsapEase, registerMotion } from '@/lib/motion'

registerMotion()

interface Props {
  initialData?: Testimonial[]
}

export default function TestimonialsDB({ initialData }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialData ?? [])
  const [loaded, setLoaded] = useState(!!initialData)

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

  useEffect(() => {
    if (!loaded || testimonials.length === 0) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.testimonial-card',
        { opacity: 0, y: MOTION.revealDistance },
        {
          opacity: 1,
          y: 0,
          duration: MOTION.dur.reveal,
          ease: gsapEase(),
          stagger: MOTION.stagger,
          scrollTrigger: {
            trigger: '.testimonials-grid',
            start: MOTION.scrollStart,
            once: true,
          },
        },
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [loaded, testimonials.length])

  if (!loaded || testimonials.length === 0) return null

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-24">
      <div className="section-pad pt-0">
        <div className="mb-14">
          <p className="font-sans text-[0.58rem] tracking-[0.08em] uppercase text-silver/40 mb-5">
            05 — Recognition
          </p>
          <div className="overflow-hidden">
            <h2 className="font-serif text-[clamp(2.8rem,6vw,6.5rem)] text-bone testimonial-heading">
              What they say.
            </h2>
          </div>
        </div>

        <div className="testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="testimonial-card card-lift opacity-0 p-8 border border-bone/8 relative group hover:border-bone/15"
            >
              <div className="font-serif text-[5rem] text-bone/6 leading-none absolute -top-2 left-6">
                &ldquo;
              </div>
              <p className="font-sans text-[0.72rem] leading-[1.9] text-silver/55 mb-8">
                {t.body}
              </p>
              <div className="pt-6 border-t border-bone/8">
                <p className="font-serif text-[0.95rem] text-bone">{t.client_name}</p>
                <p className="font-sans text-[0.55rem] tracking-[0.04em] uppercase text-silver/35 mt-1">
                  {t.role} — {t.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
