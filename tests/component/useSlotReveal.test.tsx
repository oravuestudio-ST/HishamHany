import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRef } from 'react'
import { render } from '@testing-library/react'

// Assert the reveal's contract (which tweens, driven how) — not the tweens
// themselves. Capture the timeline config so we can tell an autoplay timeline
// (no scrollTrigger) from the pinned scroll-scrub (scrollTrigger + pin).
const gsapSet = vi.fn()
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
    }
    return tl
  }
  return {
    gsap: {
      registerPlugin: vi.fn(),
      set: (...args: unknown[]) => gsapSet(...args),
      fromTo: vi.fn(),
      to: vi.fn(),
      timeline,
      context: (fn: () => void) => {
        fn()
        return { revert: vi.fn() }
      },
    },
  }
})
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import { useSlotReveal } from '@/hooks/useSlotReveal'
import { MOTION } from '@/lib/motion'

const R = MOTION.reveal

function Probe({ play }: { play?: boolean }) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLDivElement>(null)
  useSlotReveal({ section, stage, image, text }, { play })
  return (
    <section ref={section as React.RefObject<HTMLElement>}>
      <div ref={stage}>
        <div ref={image} data-testid="image" />
        <div ref={text}>WHERE LIGHT BECOMES LANGUAGE.</div>
      </div>
    </section>
  )
}

function stubMedia({ reduced = false, touch = false, mobile = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches:
      q === '(prefers-reduced-motion: reduce)'
        ? reduced
        : q === '(pointer: coarse)'
          ? touch
          : q.includes('max-width')
            ? mobile
            : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

const lastTimeline = () => timelineConfigs.at(-1)

beforeEach(() => {
  gsapSet.mockClear()
  tlFromTo.mockClear()
  timelineConfigs = []
})

describe('useSlotReveal — reduced motion', () => {
  beforeEach(() => stubMedia({ reduced: true, touch: true }))

  it('snaps to the open, full-bleed frame with no timeline', () => {
    render(<Probe play />)
    expect(tlFromTo).not.toHaveBeenCalled()
    expect(gsapSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clipPath: R.openInset, scale: R.endScale })
    )
  })
})

describe('useSlotReveal — mouse/desktop (pinned scroll-scrub)', () => {
  beforeEach(() => stubMedia({ reduced: false, touch: false }))

  it('builds a pinned, scroll-triggered timeline that opens the slot', () => {
    render(<Probe play />)
    const cfg = lastTimeline()
    expect(cfg?.scrollTrigger).toBeDefined()
    expect((cfg?.scrollTrigger as Record<string, unknown>).pin).toBeDefined()
    // First tween opens the image clip-path slot → full-bleed.
    const [, from, to] = tlFromTo.mock.calls[0] as [unknown, Record<string, string>, Record<string, string>]
    expect(from.clipPath).toBe(R.slotInset)
    expect(to.clipPath).toBe(R.openInset)
  })
})

describe('useSlotReveal — touch device (autoplay)', () => {
  beforeEach(() => stubMedia({ reduced: false, touch: true, mobile: true }))

  it('plays the same slot→full-bleed keyframes on a timeline with NO pin', () => {
    render(<Probe play />)
    const cfg = lastTimeline()
    expect(cfg?.scrollTrigger).toBeUndefined()
    const [, from, to] = tlFromTo.mock.calls[0] as [unknown, Record<string, unknown>, Record<string, unknown>]
    expect(from.clipPath).toBe(R.slotInset)
    expect(to.clipPath).toBe(R.openInset)
    expect(to.scale).toBe(R.endScale)
    // Time-driven: a real positive duration, not a scrub (ease:'none', dur:1).
    expect(to.duration as number).toBeGreaterThan(0.1)
  })

  it('lifts the headline away after it holds — the desktop behaviour, timed', () => {
    render(<Probe play />)
    // Second tween carries the headline up and out.
    const [, from, to] = tlFromTo.mock.calls[1] as [unknown, Record<string, number>, Record<string, number>]
    expect(from.opacity).toBe(1)
    expect(to.y).toBe(R.textLift)
    expect(to.opacity).toBe(0)
  })

  it('waits for the play signal — does not reveal while the loader is up', () => {
    render(<Probe play={false} />)
    expect(tlFromTo).not.toHaveBeenCalled()
    // Holds the closed slot state until play flips true.
    expect(gsapSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clipPath: R.slotInset })
    )
  })
})
