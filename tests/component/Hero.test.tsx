import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// Bug: on a touch device the hero photo autoplays open (useSlotReveal's
// autoplay branch) over MOTION.reveal.autoplayDur, but Hero's own page-load
// cascade (eyebrow → title → description → buttons) starts on the same fixed
// MOTION.load offsets regardless of device — offsets tuned for desktop, where
// the photo doesn't move on load at all (its reveal is scroll-driven there).
// On touch this races the headline in while the photo is still a narrow,
// still-opening slot: the eyebrow/title flash in over an unsettled frame
// instead of a fully composed one. useSlotReveal itself is covered by its own
// test — this isolates Hero's *own* load-sequence timeline, so we stub the
// hook out entirely and inspect the gsap.timeline() config Hero builds.
const tlFromTo = vi.fn()
let timelineConfigs: Array<Record<string, unknown> | undefined> = []

vi.mock('gsap', () => {
  const timeline = (config?: Record<string, unknown>) => {
    timelineConfigs.push(config)
    const tl = {
      fromTo: (...args: unknown[]) => {
        tlFromTo(...args)
        return tl
      },
      to: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    }
    return tl
  }
  return {
    gsap: {
      registerPlugin: vi.fn(),
      timeline,
      set: vi.fn(),
      to: vi.fn(),
      quickTo: () => vi.fn(),
      context: (fn: () => void) => {
        fn()
        return { revert: vi.fn() }
      },
    },
  }
})
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn() } }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

// Isolate Hero's own load-sequence effect from the reveal hook's internals —
// those are covered by tests/component/useSlotReveal.test.tsx.
vi.mock('@/hooks/useSlotReveal', () => ({ useSlotReveal: vi.fn() }))
vi.mock('@/components/MotionProvider', () => ({ useEntered: () => true }))

import Hero from '@/components/Hero'
import { MOTION } from '@/lib/motion'

function stubMedia({ touch = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(pointer: coarse)' ? touch : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  Object.defineProperty(navigator, 'maxTouchPoints', { value: touch ? 5 : 0, configurable: true })
}

beforeEach(() => {
  tlFromTo.mockClear()
  timelineConfigs = []
})

// Hero now builds two timelines: the stacked-seam recession (scrollTrigger
// config, useStackedSeam) and the load cascade (delay config). Select by
// shape, not call order.
const loadCascadeConfig = () =>
  timelineConfigs.find((c) => c && 'delay' in c && !('scrollTrigger' in c))

describe('Hero load-sequence vs. the touch autoplay image reveal', () => {
  it('desktop: no extra delay — the photo reveal is scroll-driven, nothing to race', () => {
    stubMedia({ touch: false })
    render(<Hero />)
    expect(loadCascadeConfig()?.delay ?? 0).toBe(0)
  })

  it('touch: the load cascade waits for the autoplay photo reveal to finish opening', () => {
    stubMedia({ touch: true })
    render(<Hero />)
    expect(loadCascadeConfig()?.delay ?? 0).toBeGreaterThanOrEqual(MOTION.reveal.autoplayDur)
  })
})

// Bug (found live in Chrome with the fix above already applied): the headline
// lines never had a static hidden state — they rely entirely on GSAP's
// `.fromTo(lines, {yPercent:115}, ...)` to *render* the hidden position, not
// just animate away from it. A live trace on a touch viewport showed the
// lines sitting fully visible, at rest, for 1.7s+ before GSAP ever touched
// them. Contrast with eyebrowRef/subRef/ctaRef/scrollRef, which all ship a
// static `opacity-0` class so they're hidden from the very first paint
// regardless of when/whether GSAP has run yet.
//
// First attempt at fixing this used a static inline
// `style={{transform:'translateY(115%)'}}` — which turned out to be worse: a
// second live trace showed the tween settling at yPercent≈231→115 instead of
// 0, i.e. the headline never became visible at all. GSAP's yPercent tracking
// compounds with a pre-existing inline `transform` on the same element (it
// isn't aware the 115% translate is already "spent"), so the reveal doubles
// up instead of completing. `opacity` has no such conflict with `yPercent` —
// same guarantee (invisible until GSAP explicitly reveals it), no shared
// channel to collide on.
describe('Hero headline mask — static initial state', () => {
  it('hero-line spans render invisible via opacity, not at their final visible position, before GSAP runs', () => {
    stubMedia({ touch: false })
    const { container } = render(<Hero />)
    const lines = container.querySelectorAll<HTMLElement>('.hero-line')
    expect(lines.length).toBeGreaterThan(0)
    lines.forEach((line) => {
      // Our gsap mock never touches real DOM styles, so this is exactly what
      // Hero's JSX declares statically — must already read as "hidden."
      expect(line.className).toMatch(/(?:^|\s)opacity-0(?:\s|$)/)
    })
  })

  it('never sets a static transform on hero-line — that is what caused the yPercent-compounding regression', () => {
    stubMedia({ touch: false })
    const { container } = render(<Hero />)
    const lines = container.querySelectorAll<HTMLElement>('.hero-line')
    lines.forEach((line) => {
      expect(line.style.transform).toBe('')
    })
  })

  it('the reveal tween animates opacity 0→1 alongside yPercent 115→0', () => {
    stubMedia({ touch: false })
    render(<Hero />)
    const titleCall = tlFromTo.mock.calls.find(
      ([, from]) => (from as Record<string, unknown>)?.yPercent === 115
    ) as [unknown, Record<string, unknown>, Record<string, unknown>] | undefined
    expect(titleCall).toBeDefined()
    const [, from, to] = titleCall!
    expect(from.opacity).toBe(0)
    expect(to.opacity).toBe(1)
  })
})
