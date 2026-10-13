import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BASE_UNIT,
  DUR,
  EASE,
  EASE_CSS,
  STAGGER,
  REVEAL_DISTANCE,
  PARALLAX,
  LENIS,
  MAGNETIC_MAX,
  MOBILE,
  LOAD,
  STACK,
  STACK_SHALLOW,
  AMBIENT,
  APERTURE,
  CHAPTER,
  MQ,
} from '@/animations/tokens'
import { PRESETS } from '@/animations/presets'

describe('motion tokens v2', () => {
  it('derives the duration scale from the base unit', () => {
    expect(DUR.reveal).toBe(BASE_UNIT)
    // The scale must be strictly ascending — micro through hero.
    expect(DUR.micro).toBeLessThan(DUR.swift)
    expect(DUR.swift).toBeLessThan(DUR.reveal)
    expect(DUR.reveal).toBeLessThan(DUR.cinematic)
    expect(DUR.cinematic).toBeLessThan(DUR.hero)
    // Hero is exactly double the base — the only 2× moment on the site.
    expect(DUR.hero).toBeCloseTo(BASE_UNIT * 2)
  })

  it('keeps every easing curve a valid cubic-bezier', () => {
    for (const [name, curve] of Object.entries(EASE)) {
      expect(curve, name).toHaveLength(4)
      const [x1, , x2] = curve
      // x control points must sit in [0,1] or the curve is invalid CSS.
      expect(x1).toBeGreaterThanOrEqual(0)
      expect(x1).toBeLessThanOrEqual(1)
      expect(x2).toBeGreaterThanOrEqual(0)
      expect(x2).toBeLessThanOrEqual(1)
      // The CSS string must mirror the tuple exactly.
      expect(EASE_CSS[name as keyof typeof EASE_CSS]).toBe(
        `cubic-bezier(${curve.join(', ')})`
      )
    }
  })

  it('holds the design constraints from the validated spec', () => {
    // Parallax cap: 30–60px, backgrounds deeper than foreground.
    expect(Math.abs(PARALLAX.background)).toBeLessThanOrEqual(60)
    expect(Math.abs(PARALLAX.foreground)).toBeLessThan(Math.abs(PARALLAX.background))
    // Reveal travel: short by design — less movement, more intention.
    expect(REVEAL_DISTANCE).toBeLessThanOrEqual(40)
    // Scroll damping heavier than Lenis stock (~0.1).
    expect(LENIS.lerp).toBeLessThan(0.1)
    // Magnetic ceiling per the validated hover language.
    expect(MAGNETIC_MAX).toBe(12)
    // Staggers: lines wider than images.
    expect(STAGGER.lines).toBeGreaterThan(STAGGER.images)
  })

  it('adapts rather than disappears on mobile', () => {
    expect(MOBILE.dur).toBeGreaterThan(0)
    expect(MOBILE.dur).toBeLessThan(1)
    expect(MOBILE.dist).toBeGreaterThan(0)
    expect(MOBILE.dist).toBeLessThan(1)
  })

  it('keeps the intro honest and bounded', () => {
    // A warm cache still reads as a deliberate beat, but the count can never
    // be held past the asset deadline.
    expect(LOAD.minCount).toBe(DUR.hero)
    expect(LOAD.minCount).toBeLessThan(LOAD.maxWait)
    // Hero copy starts rising before the page is released, both inside the open.
    expect(LOAD.copyAt).toBeGreaterThan(0)
    expect(LOAD.copyAt).toBeLessThan(LOAD.releaseAt)
    expect(LOAD.releaseAt).toBeLessThan(1)
    // The bootstrap's failsafe must outlast the slowest legitimate intro, or
    // it would yank a slow connection's intro mid-handoff.
    expect(LOAD.failsafe).toBeGreaterThan(LOAD.maxWait + LOAD.hold + LOAD.out + LOAD.open)
    expect(LOAD.watchdog).toBeGreaterThan(0)
  })

  it('keeps every chapter drift inside the image overscan', () => {
    // The image rests overscaled; drifting further than half the overscan
    // would expose the plate's edge.
    expect(CHAPTER.restScale).toBeGreaterThan(1)
    expect(CHAPTER.drift).toBeLessThanOrEqual(((CHAPTER.restScale - 1) / 2) * 100)
    expect(CHAPTER.openScale).toBeGreaterThan(CHAPTER.restScale)
    expect(CHAPTER.recedeScale).toBeLessThan(1)
    expect(CHAPTER.recedeDim).toBeGreaterThan(0)
    expect(CHAPTER.recedeDim).toBeLessThan(1)
    // Full-bleed plates earn the longest look.
    expect(CHAPTER.hold.bleed).toBeGreaterThan(CHAPTER.hold.hung)
    expect(APERTURE.startScale).toBeGreaterThan(CHAPTER.restScale)
  })

  it('shares one immersive media query between JS and CSS', () => {
    // globals.css repeats the literal for the sticky chapter geometry; if the
    // two drift apart, JS would drive scenes the CSS never made sticky.
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')
    expect(css).toContain(`@media ${MQ.immersive}`)
    expect(MQ.immersive).toContain(`min-width: ${MOBILE.maxWidth + 1}px`)
  })

  it('keeps the shallow seam quieter than the deep seam in every dimension', () => {
    expect(STACK_SHALLOW.scale).toBeGreaterThan(STACK.scale)
    expect(STACK_SHALLOW.linger).toBeLessThan(STACK.linger)
    expect(STACK_SHALLOW.dim).toBeGreaterThan(STACK.dim)
    // Tall sections tip badly — the shallow profile never rotates.
    expect(STACK_SHALLOW.rotate).toBe(0)
    // Same scrub feel as the deep seam; the seams must breathe together.
    expect(STACK_SHALLOW.scrub).toBe(STACK.scrub)
  })

  it('caps the velocity-reactive marquee within taste', () => {
    // Ambience, not a speedometer: boost stays under 3× and above rest speed.
    expect(AMBIENT.velocityBoost).toBeGreaterThan(1)
    expect(AMBIENT.velocityBoost).toBeLessThanOrEqual(3)
    // Smoothing is a lerp factor — must stay in (0, 1).
    expect(AMBIENT.velocitySmoothing).toBeGreaterThan(0)
    expect(AMBIENT.velocitySmoothing).toBeLessThan(1)
    expect(AMBIENT.velocitySaturate).toBeGreaterThan(0)
    // Loop pacing preserved from the ambient system.
    expect(AMBIENT.logoMarquee).toBeGreaterThan(AMBIENT.textMarquee)
  })

  it('keeps every reveal preset on the token scale', () => {
    expect(PRESETS.breathe.dur).toBe(DUR.reveal)
    expect(PRESETS.threshold.lineDur).toBe(DUR.cinematic)
    expect(PRESETS.curtain.dur).toBe(DUR.cinematic)
    expect(PRESETS.lines.dur).toBe(DUR.cinematic)
    expect(PRESETS.lines.stagger).toBe(STAGGER.lines)
    expect(PRESETS.stack.dur).toBe(DUR.reveal)
    // Breathe's drift is the quiet 12px, not the full reveal distance.
    expect(PRESETS.breathe.distance).toBeLessThan(REVEAL_DISTANCE)
  })
})

describe('Tailwind duration utilities mirror the motion scale', () => {
  // duration-micro / duration-swift exist so CSS transitions use the token
  // scale instead of off-scale literals (duration-400 silently compiled to
  // nothing and fell back to Tailwind's 150ms default).
  it('exposes duration-micro and duration-swift at DUR.micro / DUR.swift', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const resolveConfig = require('tailwindcss/resolveConfig')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { theme } = resolveConfig(require('../../tailwind.config.js'))
    expect(theme.transitionDuration.micro).toBe(`${Math.round(DUR.micro * 1000)}ms`)
    expect(theme.transitionDuration.swift).toBe(`${Math.round(DUR.swift * 1000)}ms`)
  })
})
