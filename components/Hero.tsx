'use client'

import { useEffect, useRef } from 'react'
import nextDynamic from 'next/dynamic'
import { gsap } from 'gsap'

const SectionEyebrowLens = nextDynamic(() => import('./SectionEyebrowLens'), { ssr: false })
const HeroSpotlight3D = nextDynamic(() => import('./HeroSpotlight3D'), { ssr: false })

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 })

    // Headline lines
    const lines = headlineRef.current?.querySelectorAll('.hero-line')
    if (lines) {
      tl.fromTo(lines,
        { yPercent: 100 },
        { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1 },
        0.5
      )
    }

    // Sub text
    tl.fromTo(subRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 1, ease: 'expo.out' },
      1.2
    )

    // Scroll indicator
    tl.fromTo(scrollRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' },
      1.6
    )

    // Activate chromatic aberration after entry animation completes
    tl.call(() => {
      headlineRef.current?.querySelectorAll('.hero-line').forEach((el) => {
        el.classList.add('chroma-active')
      })
    }, [], '+=0.2')

    // Subtle parallax on mouse move
    const section = sectionRef.current
    const handleMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 14

      gsap.to(imgRef.current, {
        x: -x * 0.6,
        y: -y * 0.5,
        duration: 1.8,
        ease: 'expo.out',
      })
      gsap.to(overlayRef.current, {
        x: x * 0.2,
        y: y * 0.2,
        duration: 2,
        ease: 'expo.out',
      })
    }
    section?.addEventListener('mousemove', handleMouse)
    return () => section?.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen min-h-[700px] flex flex-col overflow-hidden"
    >
      {/* Hero background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/Fashion/GLITCH%20GOODS/GLITCH%20CLUB_outdoor/Glitch_outdoor-007.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-50"
      />

      {/* Cinematic overlay gradients — parallax layer on top of photo */}
      <div ref={imgRef} className="absolute inset-0 will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-b from-ebony/50 via-ebony/20 to-ebony/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-ebony/60 via-transparent to-transparent" />
      </div>

      {/* Ambient light orb — kept as a glow halo behind the spotlight */}
      <div
        ref={overlayRef}
        className="absolute top-1/3 right-1/4 w-[40vw] h-[40vw] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,73,91,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 3D spotlight — the literal tool behind "where light becomes language" */}
      <div
        className="
          hidden md:block absolute pointer-events-none z-[5]
          top-[6%] right-[2%] w-[36vw] h-[42vh]
          lg:top-[4%] lg:right-[4%] lg:w-[32vw] lg:h-[48vh]
        "
      >
        <HeroSpotlight3D />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full pb-[10vh] px-8 md:px-16">

        {/* Role tag */}
        <p className="font-sans text-[0.58rem] tracking-[0.08em] uppercase text-bone/50 mb-8 flex items-center">
          <SectionEyebrowLens />
          Fashion &nbsp;·&nbsp; Automotive &nbsp;·&nbsp; Commercial
        </p>

        {/* Main headline — single <h1> for document structure; each line is a
            masked span so the reveal animation and chromatic aberration are unchanged. */}
        <h1 ref={headlineRef}>
          <span className="block overflow-hidden">
            <span
              className="hero-line chroma font-serif text-[clamp(3.5rem,9.5vw,11rem)] text-bone leading-[0.9]"
              data-text="Where light"
              style={{ fontWeight: 400 }}
            >
              Where light
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              className="hero-line chroma font-serif text-[clamp(3.5rem,9.5vw,11rem)] text-bone leading-[0.9]"
              data-text="becomes"
              style={{ fontWeight: 400 }}
            >
              becomes
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              className="hero-line chroma font-serif text-[clamp(3.5rem,9.5vw,11rem)] leading-[0.9]"
              data-text="language."
              style={{ fontWeight: 400, color: 'var(--bone)', WebkitTextStroke: '1px rgba(223,215,197,0.4)', WebkitTextFillColor: 'transparent' }}
            >
              language.
            </span>
          </span>
        </h1>

        {/* Sub + scroll row */}
        <div className="flex items-end justify-between mt-10">
          <p
            ref={subRef}
            className="opacity-0 font-sans text-[0.7rem] tracking-normal text-silver/70 max-w-xs leading-relaxed"
          >
            Hisham Hany — Cairo-based photographer<br />
            specializing in fashion, automotive &amp; commercial.
          </p>

          <div ref={scrollRef} className="opacity-0 flex flex-col items-center gap-3">
            <span className="font-sans text-[0.5rem] tracking-[0.08em] uppercase text-silver/40 rotate-90 origin-center mb-6">
              Scroll
            </span>
            <div className="w-px h-14 bg-gradient-to-b from-silver/40 to-transparent relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full bg-bone"
                style={{
                  height: '40%',
                  animation: 'scroll-line 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-line {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
      `}</style>
    </section>
  )
}
