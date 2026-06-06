'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const brands: { name: string; logo?: string }[] = [
  { name: "E'laam.com" },
  { name: 'Rose al Yusuf',        logo: '/images/logos/rose-al-yusuf.svg' },
  { name: 'Egyptian Opera House' },
  { name: 'Glitch Goods',        logo: '/images/logos/glitch-goods.svg' },
  { name: 'Baby Gang' },
  { name: 'SYNC School' },
  { name: 'Cairo Photography Club' },
  { name: 'Binghatti',           logo: '/images/logos/binghatti.svg' },
  { name: 'Glide',               logo: '/images/logos/glide.svg' },
  { name: 'Koptan',              logo: '/images/logos/koptan.svg' },
]

const testimonials = [
  {
    quote: "Hisham consistently delivers 200+ brand-aligned visuals per campaign cycle — high quality, deadline-driven, and precisely on-brief every single time.",
    author: 'Brand Manager',
    role: "E'laam.com — Egypt's Leading Digital Media Platform",
  },
  {
    quote: 'His editorial eye and on-location portrait work elevated our celebrity features. Every image felt campaign-ready, not just press-standard.',
    author: 'Senior Editor',
    role: 'Rose al Yusuf Magazine',
  },
  {
    quote: 'Delivered 500+ high-resolution images for our international festival under same-day press deadlines. Exceptional technical skill and creative professionalism.',
    author: 'Media Director',
    role: 'Egyptian Opera House — Cairo International Festival',
  },
]

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.testimonial-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.15,
          scrollTrigger: { trigger: '.testimonials-grid', start: 'top 82%', once: true } }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-24">
      {/* Brands marquee — two identical tracks for seamless infinite loop */}
      <div className="border-y border-bone/6 py-5 overflow-hidden mb-24">
        <div className="flex">
          {[0, 1].map((track) => (
            <div key={track} className="marquee-track flex gap-16 items-center shrink-0" aria-hidden="true">
              {brands.map((brand, i) => (
                <div key={i} className="h-8 flex items-center shrink-0">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={100}
                      height={32}
                      className="h-7 w-auto object-contain opacity-40 marquee-brand"
                    />
                  ) : (
                    <span className="font-serif text-lg marquee-brand">
                      {brand.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

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
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card opacity-0 p-8 border border-bone/8 relative group hover:border-bone/15 transition-colors duration-500">
              <div className="font-serif text-[5rem] text-bone/6 leading-none absolute -top-2 left-6 testimonial-quote-mark">
                &ldquo;
              </div>
              <p className="font-sans text-[0.72rem] leading-[1.9] text-silver/55 mb-8 testimonial-body">
                {t.quote}
              </p>
              <div className="pt-6 border-t border-bone/8">
                <p className="font-serif text-[0.95rem] text-bone testimonial-author">
                  {t.author}
                </p>
                <p className="font-sans text-[0.55rem] tracking-[0.04em] uppercase text-silver/35 mt-1">
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
