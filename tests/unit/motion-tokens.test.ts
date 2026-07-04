import { describe, it, expect } from 'vitest'
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
