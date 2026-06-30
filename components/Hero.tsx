'use client'

import { useEffect, useRef } from 'react'
import nextDynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { MOTION, gsapEase, prefersReducedMotion } from '@/lib/motion'
import { useEntered } from '@/components/MotionProvider'

const SectionEyebrowLens = nextDynamic(() => import('./SectionEyebrowLens'), { ssr: false })

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const eyebrowRef = useRef<HTMLParagraphElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)      // outer bg — carries scroll-y parallax
  const bgRef = useRef<HTMLDivElement>(null)       // inner bg — carries mouse 3D
  const overlayRef = useRef<HTMLDivElement>(null)  // glow orb
  const gradientRef = useRef<HTMLDivElement>(null) // cinematic gradient overlay

  // The page-load sequence waits for the loader to lift so it plays on screen.
  const entered = useEntered()

  // ── Page-load sequence: nav (Navigation.tsx) → eyebrow → title → description
  //    → CTAs, with the hero visual easing in alongside. Driven entirely by the
  //    MOTION.load tokens so the cascade is tuned in one place.
  useEffect(() => {
    if (!entered) return

    const L = MOTION.load
    const ease = gsapEase()

    if (prefersReducedMotion()) {
      // Present the final composition instantly.
      gsap.set(
        [eyebrowRef.current, subRef.current, ctaRef.current, scrollRef.current],
        { opacity: 1, y: 0 }
      )
      headlineRef.current?.querySelectorAll('.hero-line').forEach((el) => {
        gsap.set(el, { yPercent: 0 })
        el.classList.add('chroma-active')
      })
      return
    }

    const tl = gsap.timeline()

    // Eyebrow
    tl.fromTo(
      eyebrowRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: L.eyebrow.dur, ease },
      L.eyebrow.at
    )

    // Hero visual — clip-wipe reveal (inset) + scale settle, on its own track.
    const heroImg = bgRef.current?.querySelector('img')
    tl.fromTo(
      imgRef.current,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: L.visual.dur, ease: 'expo.out' },
      L.visual.at
    )
    if (heroImg) {
      tl.fromTo(
        heroImg,
        { scale: 1.35 },
        { scale: 1.1, duration: L.visual.dur + 0.4, ease: 'expo.out' },
        L.visual.at
      )
    }

    // Title — masked lines rise line by line (yPercent 115 → 0)
    const lines = headlineRef.current?.querySelectorAll('.hero-line')
    if (lines) {
      tl.fromTo(
        lines,
        { yPercent: 115 },
        { yPercent: 0, duration: L.title.dur, ease, stagger: MOTION.stagger },
        L.title.at
      )
    }

    // Description
    tl.fromTo(
      subRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: L.desc.dur, ease },
      L.desc.at
    )

    // CTAs
    tl.fromTo(
      ctaRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: L.buttons.dur, ease },
      L.buttons.at
    )

    // Scroll indicator rides in with the CTAs
    tl.fromTo(
      scrollRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: L.buttons.dur, ease },
      L.buttons.at
    )

    // Activate chromatic aberration after the headline lands
    tl.call(
      () => {
        headlineRef.current?.querySelectorAll('.hero-line').forEach((el) => {
          el.classList.add('chroma-active')
        })
      },
      [],
      L.title.at + L.title.dur
    )

    return () => {
      tl.kill()
    }
  }, [entered])

  // ── Layered mouse 3D: background photo, glow orb, and gradient overlay each
  //    tween on their own depth so the hero reads as a parallaxing stack rather
  //    than a flat plane. Offsets are taken from viewport center and scaled by
  //    the global intensity multiplier; everything settles over ~1.8s expo.out.
  useEffect(() => {
    if (prefersReducedMotion()) return
    const section = sectionRef.current
    const handleMouse = (e: MouseEvent) => {
      const mul = MOTION.intensity
      const x = (e.clientX / window.innerWidth - 0.5) * 20 * mul
      const y = (e.clientY / window.innerHeight - 0.5) * 14 * mul

      // Background photo — drifts opposite the pointer with a gentle counter-tilt.
      gsap.to(bgRef.current, {
        x: -x * 0.5, y: -y * 0.4,
        rotationY: x * 0.28, rotationX: -y * 0.28,
        duration: 1.8, ease: 'expo.out',
      })
      // Glow orb — leads the pointer and lifts toward the viewer.
      gsap.to(overlayRef.current, {
        x: x * 1.2, y: y * 1.2, z: 80,
        duration: 1.8, ease: 'expo.out',
      })
      // Gradient overlay — quiet independent drift with a micro-tilt.
      gsap.to(gradientRef.current, {
        x: x * 0.2, y: y * 0.2,
        rotationY: x * 0.1, rotationX: -y * 0.1,
        duration: 1.8, ease: 'expo.out',
      })
    }
    section?.addEventListener('mousemove', handleMouse)
    return () => section?.removeEventListener('mousemove', handleMouse)
  }, [])

  // ── Scroll parallax on the hero background media (max -120px, smooth scrub).
  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = imgRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: MOTION.parallax.hero,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen min-h-[700px] flex flex-col overflow-hidden"
      style={{ perspective: '1500px' }}
    >
      {/* Hero background photo. Outer layer (imgRef) owns the scroll-y parallax;
          inner layer (bgRef) owns the mouse 3D — split so the two transforms
          never write the same matrix. preserve-3d lets the inner rotation sit
          in the section's perspective. */}
      <div
        ref={imgRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div ref={bgRef} className="absolute inset-0 will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/Fashion/GLITCH%20GOODS/GLITCH%20CLUB_outdoor/Glitch_outdoor-007.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-50 scale-110"
          />
        </div>
      </div>

      {/* Cinematic overlay gradients — their own layer so they drift and tilt
          independently of the photo beneath. */}
      <div
        ref={gradientRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ebony/50 via-ebony/20 to-ebony/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-ebony/60 via-transparent to-transparent" />
      </div>

      {/* Ambient light orb — glow halo, leads the pointer on its own depth */}
      <div
        ref={overlayRef}
        className="absolute top-1/3 right-1/4 w-[40vw] h-[40vw] rounded-full pointer-events-none will-change-transform"
        style={{
          background: 'radial-gradient(ellipse, rgb(var(--accent-rgb) / 0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full pb-[10vh] px-8 md:px-16">

        {/* Role tag / eyebrow — sequence step 2 */}
        <p
          ref={eyebrowRef}
          className="opacity-0 font-sans text-[0.58rem] tracking-[0.08em] uppercase text-paper/50 mb-8 flex items-center"
        >
          <SectionEyebrowLens />
          Fashion &nbsp;·&nbsp; Automotive &nbsp;·&nbsp; Commercial
        </p>

        {/* Main headline — single <h1>; each line a masked span for the reveal. */}
        <h1 ref={headlineRef}>
          <span className="block overflow-hidden">
            <span
              className="hero-line chroma font-serif text-[clamp(3.5rem,9.5vw,11rem)] text-paper leading-[0.9]"
              data-text="Where light"
              style={{ fontWeight: 400 }}
            >
              Where light
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              className="hero-line chroma font-serif text-[clamp(3.5rem,9.5vw,11rem)] text-paper leading-[0.9]"
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
              style={{ fontWeight: 400, color: 'var(--paper)', WebkitTextStroke: '1px rgb(var(--paper-rgb) / 0.4)', WebkitTextFillColor: 'transparent' }}
            >
              language.
            </span>
          </span>
        </h1>

        {/* Sub + scroll row */}
        <div className="flex items-end justify-between mt-10">
          <div className="max-w-md">
            <p
              ref={subRef}
              className="opacity-0 font-sans text-[0.7rem] tracking-normal text-paper/60 leading-relaxed"
            >
              Hisham Hany — Cairo-based photographer<br />
              specializing in fashion, automotive &amp; commercial.
            </p>

            {/* Quiet CTA row — sequence step 5 */}
            <div ref={ctaRef} className="opacity-0 flex items-center gap-8 mt-8">
              <Link
                href="#work"
                data-cursor="View"
                className="btn-press group flex items-center gap-3 font-sans text-[0.6rem] tracking-[0.18em] uppercase text-paper"
              >
                View Work
                <span className="w-8 h-px bg-paper/40 transition-all duration-500 ease-premium group-hover:w-12 group-hover:bg-accent" />
              </Link>
              <Link
                href="#contact"
                data-cursor="Inquire"
                className="btn-press font-sans text-[0.6rem] tracking-[0.18em] uppercase text-paper/60 hover:text-paper transition-colors duration-500 ease-premium"
              >
                Inquire
              </Link>
            </div>
          </div>

          <div ref={scrollRef} className="opacity-0 flex flex-col items-center gap-3 shrink-0">
            <span className="font-sans text-[0.5rem] tracking-[0.08em] uppercase text-paper/40 rotate-90 origin-center mb-6">
              Scroll
            </span>
            <div className="w-px h-14 bg-gradient-to-b from-paper/40 to-transparent relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full bg-paper"
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
