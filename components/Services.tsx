'use client'

import { useEffect, useRef } from 'react'
import nextDynamic from 'next/dynamic'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const SectionEyebrowLens = nextDynamic(() => import('./SectionEyebrowLens'), { ssr: false })

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const services = [
  {
    num: '01',
    title: 'Fashion Photography',
    desc: 'Editorial and campaign imagery that speaks the language of luxury. From concept to final frame.',
    tags: ['Look Books', 'Campaigns', 'Editorial'],
  },
  {
    num: '02',
    title: 'Creative Direction',
    desc: 'End-to-end visual strategy. Mood, casting, styling, set design, and narrative architecture.',
    tags: ['Concept', 'Art Direction', 'Styling'],
  },
  {
    num: '03',
    title: 'Editorial Campaigns',
    desc: 'High-concept editorial work for print and digital publications at the intersection of art and fashion.',
    tags: ['Magazine', 'Digital', 'Print'],
  },
  {
    num: '04',
    title: 'Commercial Photography',
    desc: 'Brand-aligned imagery that elevates product and communicates identity with precision.',
    tags: ['Advertising', 'Brand', 'Product'],
  },
  {
    num: '05',
    title: 'Portraits & Headshots',
    desc: 'Cinematic portraits that capture depth, presence, and character with intentional lighting.',
    tags: ['Talent', 'Executive', 'Artist'],
  },
  {
    num: '06',
    title: 'Studio Production',
    desc: 'Full-service production management. Location scouting, crew coordination, and post direction.',
    tags: ['Production', 'Logistics', 'Post'],
  },
]

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current?.querySelectorAll('.reveal-inner') ?? [], {
        yPercent: 110,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 82%',
          once: true,
        },
      })

      gsap.from('.service-card', {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.services-grid',
          start: 'top 80%',
          once: true,
        },
      })

      gsap.utils.toArray<Element>('.services-chroma').forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 82%',
          once: true,
          onEnter: () => el.classList.add('chroma-active'),
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="services" className="section-pad relative">
      <div ref={titleRef} className="mb-16">
        <p className="font-sans text-[0.58rem] tracking-[0.08em] uppercase text-silver/40 mb-5 flex items-center">
          <SectionEyebrowLens />
          04 — Services
        </p>
        <div className="overflow-hidden">
          <h2
            className="reveal-inner chroma services-chroma font-serif text-[clamp(2.8rem,6.5vw,7rem)] text-bone"
            data-text="What I create."
            style={{ fontWeight: 400 }}
          >
            What I create.
          </h2>
        </div>
      </div>

      <div className="services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-bone/5">
        {services.map((service) => (
          <ServiceCard key={service.num} service={service} />
        ))}
      </div>
    </section>
  )
}

function ServiceCard({ service }: { service: typeof services[0] }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    gsap.to(bgRef.current, { scaleY: 1, duration: 0.5, ease: 'expo.out', transformOrigin: 'bottom center' })
    const texts = cardRef.current?.querySelectorAll('.service-text')
    if (texts) gsap.to(texts, { color: '#DFD7C5', duration: 0.4 })
  }

  const handleLeave = () => {
    gsap.to(bgRef.current, { scaleY: 0, duration: 0.5, ease: 'expo.in', transformOrigin: 'top center' })
    const texts = cardRef.current?.querySelectorAll('.service-text')
    if (texts) gsap.to(texts, { color: '', duration: 0.4 })
  }

  return (
    <div
      ref={cardRef}
      className="service-card relative bg-ebony p-8 overflow-hidden group"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Hover bg */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-teal/15"
        style={{ transform: 'scaleY(0)', transformOrigin: 'bottom center' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <span className="font-sans text-[0.55rem] tracking-[0.06em] text-silver/30">
            {service.num}
          </span>
          <div className="w-5 h-px bg-silver/20 group-hover:w-8 group-hover:bg-ember/60 transition-all duration-500 mt-2" />
        </div>

        <h3
          className="service-text font-serif text-[1.5rem] text-silver mb-4 transition-colors duration-400"
          style={{ fontWeight: 400 }}
        >
          {service.title}
        </h3>

        <p
          className="service-text font-sans text-[0.7rem] leading-relaxed text-silver/40 transition-colors duration-400 mb-8"
          style={{ fontWeight: 400 }}
        >
          {service.desc}
        </p>

        <div className="flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="font-sans text-[0.5rem] tracking-[0.04em] uppercase text-silver/25 border border-bone/8 px-3 py-1.5 group-hover:border-bone/20 transition-colors duration-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
