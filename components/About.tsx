'use client'

import { useEffect, useRef } from 'react'
import nextDynamic from 'next/dynamic'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MOTION, gsapEase, registerMotion } from '@/lib/motion'
import { useCountUp } from '@/hooks/useCountUp'

const SectionEyebrowLens = nextDynamic(() => import('./SectionEyebrowLens'), { ssr: false })

registerMotion()

const stats = [
  { num: '6+',   label: 'Years of Practice' },
  { num: '300+', label: 'Images Per Project' },
  { num: '3',    label: 'Major Clients' },
  { num: '200+', label: 'Campaign Visuals' },
]

const philosophy = [
  'Photography is the art of translating brand identity into a single, indelible frame. With 6+ years producing high-impact imagery for brands, media organizations, and cultural institutions — I approach every project as a precise visual problem to solve.',
  'From sleek automotive campaigns to editorial fashion — my work lives at the intersection of commercial precision and cinematic atmosphere. Studio or on-location, I bring controlled light, composition, and narrative to every brief.',
  'Trusted to deliver 300+ publication-ready images per project under tight advertising and editorial deadlines. Precision is my discipline. The image is the message.',
]

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef    = useRef<HTMLDivElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ease = gsapEase()
    const ctx = gsap.context(() => {
      // Paragraphs — canonical reveal, staggered by the shared token.
      textRef.current?.querySelectorAll('.about-para').forEach((p, i) => {
        gsap.fromTo(p,
          { opacity: 0, y: MOTION.revealDistance },
          { opacity: 1, y: 0, duration: MOTION.dur.reveal, ease, delay: i * MOTION.stagger,
            scrollTrigger: { trigger: p, start: MOTION.scrollStart, once: true } }
        )
      })

      // Stats — canonical reveal with shared stagger.
      statsRef.current?.querySelectorAll('.stat-num').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: MOTION.revealDistance },
          { opacity: 1, y: 0, duration: MOTION.dur.reveal, ease, delay: i * MOTION.stagger,
            scrollTrigger: { trigger: statsRef.current, start: MOTION.scrollStart, once: true } }
        )
      })

      // Count-up now lives in the reusable useCountUp hook (see StatValue below).

      gsap.utils.toArray<Element>('.about-chroma-1, .about-chroma-2').forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: MOTION.scrollStart, once: true,
          onEnter: () => el.classList.add('chroma-active'),
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="philosophy" className="section-pad relative overflow-hidden">
      <div className="about-ambient absolute top-0 left-0 w-[50vw] h-[50vw] rounded-full pointer-events-none" />

      {/* The portrait now opens the page in the header frame (about/page.tsx). */}
      <div className="lg:grid lg:grid-cols-12">
        {/* Text column */}
        <div className="lg:col-span-7 lg:col-start-6 flex flex-col justify-center" ref={textRef}>
          <p className="font-sans text-[0.58rem] tracking-[0.08em] uppercase text-silver mb-8 flex items-center">
            <SectionEyebrowLens />
            The Photographer — Philosophy
          </p>

          <div className="overflow-hidden mb-6">
            <h2 className="about-heading font-serif text-[clamp(2.4rem,5vw,5rem)] text-bone leading-[1.05]">
              <span className="chroma about-chroma-1" data-text="Light, craft,">Light, craft,</span>
              <br />
              <span className="chroma about-chroma-2" data-text="and intention.">and intention.</span>
            </h2>
          </div>

          <div className="flex flex-col gap-6 mt-4">
            {philosophy.map((text, i) => (
              <p key={i} className="about-para font-sans text-[0.78rem] leading-[1.85] text-silver opacity-0">
                {text}
              </p>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-line">
            <p className="about-signature font-serif text-[2.2rem] text-bone">
              Hisham Hany
            </p>
            <p className="font-sans text-[0.55rem] tracking-[0.06em] uppercase text-silver mt-1">
              Commercial &amp; Fashion Photographer · Cairo, Egypt
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-16 border-t border-line">
        {stats.map(({ num, label }) => (
          <div key={label} className="stat-num opacity-0">
            <StatValue value={num} />
            <p className="font-sans text-[0.58rem] tracking-[0.05em] uppercase text-silver mt-3">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/** A single stat value that counts up on scroll-in. Splits a leading integer
 *  from its suffix (e.g. "300+") so the count animates and the suffix is kept. */
function StatValue({ value }: { value: string }) {
  const m = /^(\d+)(.*)$/.exec(value.trim())
  const target = m ? parseInt(m[1], 10) : 0
  const suffix = m ? m[2] : ''
  const ref = useCountUp<HTMLParagraphElement>(target, { format: (n) => `${Math.floor(n)}${suffix}` })
  return (
    <p ref={ref} className="about-stat-value font-serif text-[clamp(2.5rem,5vw,4.5rem)] text-bone leading-none">
      {value}
    </p>
  )
}
