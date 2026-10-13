'use client'

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { useIntroPhase } from '@/components/MotionProvider'
import { markHeroSettled } from '@/lib/preload'
import {
  APERTURE,
  CHAPTER,
  DUR,
  LOAD,
  MQ,
  POINTER,
  STAGGER,
  getIntensity,
  gsapEase,
  registerMotion,
} from '@/lib/motion'

/** The opening photograph — symmetric, so the intro's centred window lands on it. */
export const HERO_IMAGE = {
  src: '/images/New%20capital/NewCapital_architecture-%20Hero.JPG',
  alt: 'Looking up into an ornate dome: a star-shaped chandelier hangs beneath carved gilded patterns',
}

/**
 * The opening scene. Full-bleed photograph on the ink stage, identity copy in
 * the upper left on a static scrim — kept clear of the calligraphy band along
 * the photograph's lower third. The photo is the LCP element: it paints at
 * full opacity from the first frame and only ever moves by transform.
 *
 * Choreography is shared with the Loader through the intro phase: on
 * "opening" the photo settles from the window's overscale while the name rises
 * line by line; scroll recession is driven by the chapter journey
 * (useChapterScroll), which owns every scene's exit.
 */
export default function Hero({ stageRef }: { stageRef?: RefObject<HTMLElement> }) {
  const ownStageRef = useRef<HTMLElement>(null)
  const stage = stageRef ?? ownStageRef
  const mediaRef = useRef<HTMLDivElement>(null)
  const driftRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<gsap.core.Timeline | null>(null)
  const phase = useIntroPhase()

  // ── Intro reveal: starts as the bars part, finishes if the reader skips.
  useEffect(() => {
    if (phase === 'opening' && !revealRef.current) {
      const media = mediaRef.current
      const copy = copyRef.current
      if (!media || !copy) return
      registerMotion()
      const ease = gsapEase()
      const tl = gsap.timeline()
      tl.fromTo(media, { scale: APERTURE.startScale }, { scale: CHAPTER.restScale, duration: LOAD.open, ease }, 0)
        .fromTo(
          copy.querySelectorAll('.hero-line'),
          // Painted from the first frame (it is the LCP), tucked below its
          // masks here — while the bars still cover it — then risen. y: 0
          // keeps any stray px offset out of the transform.
          { yPercent: 110, y: 0 },
          { yPercent: 0, duration: DUR.cinematic, ease, stagger: STAGGER.lines },
          LOAD.open * LOAD.copyAt,
        )
        .fromTo(
          copy.querySelectorAll('.hero-fade'),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: DUR.reveal, ease, stagger: STAGGER.lines },
          LOAD.open * LOAD.copyAt + DUR.swift,
        )
      revealRef.current = tl
    }
    // A skipped intro lands on "entered" with the reveal mid-flight: finish it.
    // (Natural release also lands on "entered" — only a skip, which sets
    // data-intro=done first, may jump the timeline.)
    if (phase === 'entered' && document.documentElement.dataset.intro === 'done') revealRef.current?.progress(1)
  }, [phase])

  useEffect(() => () => { revealRef.current?.kill() }, [])

  // ── Understated pointer drift — fine pointers with motion allowed only, the
  //    photo layer only, never past the overscan the photo rests at.
  useEffect(() => {
    const layer = driftRef.current
    const el = stage.current
    if (!layer || !el) return
    const mm = gsap.matchMedia()
    mm.add(MQ.immersive, () => {
      const q = { duration: POINTER.dur, ease: gsapEase() }
      const toX = gsap.quickTo(layer, 'x', q)
      const toY = gsap.quickTo(layer, 'y', q)
      const onMove = (e: PointerEvent) => {
        const k = POINTER.hero * getIntensity()
        toX(-(e.clientX / window.innerWidth - 0.5) * 2 * k)
        toY(-(e.clientY / window.innerHeight - 0.5) * 2 * k)
      }
      el.addEventListener('pointermove', onMove)
      return () => el.removeEventListener('pointermove', onMove)
    })
    return () => mm.revert()
  }, [stage])

  return (
    <div id="hero-section" className="hero-hold relative">
      <section
        ref={stage}
        aria-labelledby="hero-title"
        data-scene="hero"
        data-cursor-plain=""
        className="hero-stage stage-scope relative h-[100svh] min-h-[560px] overflow-hidden"
      >
        {/* The layer that recedes as chapter 1 rises over the hero. */}
        <div data-stacked-seam="hero" className="scene-recede absolute inset-0">
          <div ref={mediaRef} className="hero-media absolute inset-0 will-change-transform">
            <div ref={driftRef} className="scene-drift absolute inset-0">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                priority
                sizes="100vw"
                quality={70}
                className="object-cover object-center"
                onLoad={markHeroSettled}
                onError={markHeroSettled}
              />
            </div>
          </div>

          {/* Static legibility scrim behind the copy — never animated. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(160deg, rgb(var(--ink-rgb) / 0.82) 0%, rgb(var(--ink-rgb) / 0.55) 30%, rgb(var(--ink-rgb) / 0) 62%)',
            }}
          />

          <div
            ref={copyRef}
            className="hero-copy relative z-10 flex flex-col items-start px-gutter pt-[max(7.5rem,16svh)]"
          >
            <h1 id="hero-title" className="normal-case text-paper" style={{ letterSpacing: '-0.035em', lineHeight: 0.9 }}>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="hero-line block font-serif text-display-lg">Hisham</span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="hero-line block font-serif text-display-lg">Hany</span>
              </span>
              <span className="sr-only">, photographer in Cairo</span>
            </h1>

            <p className="hero-fade mt-6 font-sans text-body-sm text-paper/70">
              Fashion · Automotive · Cinematic
            </p>

            <nav aria-label="Jump to" className="hero-fade mt-10 flex items-center gap-8">
              <a href="#work" className="tap-target link-underline group inline-flex items-center gap-3 font-sans text-body-sm text-paper">
                Scroll to the work
                <span aria-hidden="true" className="hero-cue relative block h-6 w-px overflow-hidden bg-paper/30">
                  <span className="hero-cue-dot absolute inset-x-0 top-0 h-2 bg-paper" />
                </span>
              </a>
              <a href="#index" className="tap-target link-underline font-sans text-body-sm text-paper/70 hover:text-paper transition-colors duration-swift ease-touch">
                Index
              </a>
            </nav>
          </div>

          <div className="scene-dim absolute inset-0 bg-ink opacity-0 pointer-events-none" aria-hidden="true" />
        </div>
      </section>
    </div>
  )
}
