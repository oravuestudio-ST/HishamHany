'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const stats = [
  { num: '4+',   label: 'Years of Practice' },
  { num: '300+', label: 'Images Per Project' },
  { num: '3',    label: 'Major Clients' },
  { num: '200+', label: 'Campaign Visuals' },
]

const philosophy = [
  'Photography is the art of translating brand identity into a single, indelible frame. With 4+ years producing high-impact imagery for brands, media organizations, and cultural institutions — I approach every project as a precise visual problem to solve.',
  'From sleek automotive campaigns to editorial fashion — my work lives at the intersection of commercial precision and cinematic atmosphere. Studio or on-location, I bring controlled light, composition, and narrative to every brief.',
  'Trusted to deliver 300+ publication-ready images per project under tight advertising and editorial deadlines. Precision is my discipline. The image is the message.',
]

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image parallax
      gsap.to(imgRef.current, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      })

      // Image clip reveal
      gsap.fromTo(imgRef.current,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.4,
          ease: 'expo.inOut',
          scrollTrigger: {
            trigger: imgRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      )

      // Text paragraphs
      const paras = textRef.current?.querySelectorAll('.about-para')
      paras?.forEach((p, i) => {
        gsap.fromTo(p,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'expo.out',
            delay: i * 0.15,
            scrollTrigger: {
              trigger: p,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })

      // Stats counter
      const statEls = statsRef.current?.querySelectorAll('.stat-num')
      statEls?.forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="about" className="section-pad relative overflow-hidden">
      {/* Background ambient */}
      <div
        className="absolute top-0 left-0 w-[50vw] h-[50vw] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,73,91,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translate(-30%, -30%)',
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        {/* Image column */}
        <div className="relative order-2 lg:order-1">
          <div
            ref={imgRef}
            className="relative overflow-hidden"
            style={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          >
            <div className="aspect-[3/4] relative">
              <Image
                src="/images/hisham-portrait.jpg"
                alt="Hisham Hany"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ebony/50 via-transparent to-transparent" />
            </div>
          </div>

          {/* Floating tag */}
          <div
            className="absolute -right-4 top-1/3 bg-ebony/80 backdrop-blur-md border border-bone/8 px-5 py-4"
            style={{ transform: 'rotate(90deg) translateY(-50%)' }}
          >
            <p className="font-sans text-[0.5rem] tracking-[0.4em] uppercase text-silver/40 whitespace-nowrap">
              Cairo, Egypt &nbsp;·&nbsp; +20 111 280 5807
            </p>
          </div>
        </div>

        {/* Text column */}
        <div className="order-1 lg:order-2 flex flex-col justify-center" ref={textRef}>
          <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-silver/40 mb-8">
            03 — About &amp; Philosophy
          </p>

          <div className="overflow-hidden mb-6">
            <h2
              className="font-serif text-[clamp(2.4rem,5vw,5rem)] text-bone italic leading-[1.05]"
              style={{ fontWeight: 300 }}
            >
              Light, craft,<br />and intention.
            </h2>
          </div>

          <div className="flex flex-col gap-6 mt-4">
            {philosophy.map((text, i) => (
              <p
                key={i}
                className="about-para font-sans text-[0.78rem] leading-[1.85] text-silver/60 opacity-0"
                style={{ fontWeight: 300 }}
              >
                {text}
              </p>
            ))}
          </div>

          {/* Signature */}
          <div className="mt-10 pt-10 border-t border-bone/8">
            <p
              className="font-serif text-[2.2rem] text-bone/70 italic"
              style={{ fontWeight: 300 }}
            >
              Hisham Hany
            </p>
            <p className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/30 mt-1">
              Commercial &amp; Fashion Photographer · Cairo, Egypt
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-16 border-t border-bone/8">
        {stats.map(({ num, label }) => (
          <div key={label} className="stat-num opacity-0">
            <p
              className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] text-bone italic leading-none"
              style={{ fontWeight: 300 }}
            >
              {num}
            </p>
            <p className="font-sans text-[0.58rem] tracking-[0.25em] uppercase text-silver/40 mt-3">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
