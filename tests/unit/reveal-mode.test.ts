import { describe, it, expect, afterEach, vi } from 'vitest'
import { resolveRevealMode, isTouchDevice } from '@/lib/motion'
import { REVEAL } from '@/animations/tokens'

describe('resolveRevealMode', () => {
  it('reduced motion always snaps to the open frame — even on touch', () => {
    expect(resolveRevealMode({ reducedMotion: true, touch: false })).toBe('snap')
    expect(resolveRevealMode({ reducedMotion: true, touch: true })).toBe('snap')
  })

  it('a touch device (motion allowed) autoplays the reveal', () => {
    expect(resolveRevealMode({ reducedMotion: false, touch: true })).toBe('autoplay')
  })

  it('a mouse/desktop device (motion allowed) keeps the pinned scroll reveal', () => {
    expect(resolveRevealMode({ reducedMotion: false, touch: false })).toBe('pinned')
  })
})

describe('isTouchDevice', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is SSR-safe — returns false when there is no window', () => {
    // node test env has no window/navigator globals.
    expect(isTouchDevice()).toBe(false)
  })

  it('detects touch via navigator.maxTouchPoints', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    vi.stubGlobal('navigator', { maxTouchPoints: 5 })
    expect(isTouchDevice()).toBe(true)
  })

  it('detects touch via the pointer:coarse media query', () => {
    vi.stubGlobal('window', {
      matchMedia: (q: string) => ({ matches: q === '(pointer: coarse)' }),
    })
    vi.stubGlobal('navigator', { maxTouchPoints: 0 })
    expect(isTouchDevice()).toBe(true)
  })

  it('is false for a mouse device (no touch points, fine pointer)', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    vi.stubGlobal('navigator', { maxTouchPoints: 0 })
    expect(isTouchDevice()).toBe(false)
  })
})

describe('autoplay reveal duration tokens', () => {
  it('defines a time-driven hero beat for the autoplay reveal', () => {
    expect(REVEAL.autoplayDur).toBeGreaterThan(0)
  })

  it('plays case-study covers quicker than the home hero', () => {
    expect(REVEAL.caseAutoplayDur).toBeGreaterThan(0)
    expect(REVEAL.caseAutoplayDur).toBeLessThan(REVEAL.autoplayDur)
  })
})
