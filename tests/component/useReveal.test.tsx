import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// Assert the preset contracts, not the tweens themselves.
const gsapSet = vi.fn()
const gsapFromTo = vi.fn()
const tlFromTo = vi.fn()

vi.mock('gsap', () => {
  const timeline = () => {
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
      fromTo: (...args: unknown[]) => gsapFromTo(...args),
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

import { useReveal } from '@/hooks/useReveal'
import { PRESETS, type RevealPreset } from '@/animations/presets'

function Probe({ preset, stagger }: { preset: RevealPreset; stagger?: string }) {
  const ref = useReveal<HTMLDivElement>(preset, { stagger })
  return (
    <div ref={ref}>
      <div data-reveal-line />
      <span className="reveal-inner">line</span>
      <span className="reveal-inner">line</span>
      <p className="kid">a</p>
      <p className="kid">b</p>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src="/x.jpg" alt="" />
    </div>
  )
}

function stubMedia({ reduced = false, mobile = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(prefers-reduced-motion: reduce)' ? reduced : q.includes('max-width') ? mobile : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  gsapSet.mockClear()
  gsapFromTo.mockClear()
  tlFromTo.mockClear()
})

describe('useReveal presets (motion allowed, desktop)', () => {
  beforeEach(() => stubMedia())

  it('breathe: quiet opacity + drift, scroll-gated', () => {
    render(<Probe preset="breathe" />)
    expect(gsapFromTo).toHaveBeenCalledTimes(1)
    const [, from, to] = gsapFromTo.mock.calls[0] as [unknown, Record<string, number>, Record<string, unknown>]
    expect(from).toEqual({ opacity: 0, y: PRESETS.breathe.distance })
    expect(to.duration).toBe(PRESETS.breathe.dur)
    expect(to.scrollTrigger).toBeDefined()
  })

  it('threshold: the rule expands before the content fades in', () => {
    render(<Probe preset="threshold" stagger=".kid" />)
    // First timeline tween targets the rule with a scaleX expansion.
    const [lineTarget, lineFrom, lineTo] = tlFromTo.mock.calls[0] as [HTMLElement, Record<string, number>, Record<string, unknown>]
    expect(lineTarget.hasAttribute('data-reveal-line')).toBe(true)
    expect(lineFrom).toEqual({ scaleX: 0 })
    expect(lineTo.duration).toBe(PRESETS.threshold.lineDur)
    // Second tween carries the content.
    const [, contentFrom] = tlFromTo.mock.calls[1] as [unknown, Record<string, number>]
    expect(contentFrom.opacity).toBe(0)
  })

  it('curtain: clips the container open and settles the image from overscale', () => {
    render(<Probe preset="curtain" />)
    const [, clipFrom] = tlFromTo.mock.calls[0] as [unknown, Record<string, string>]
    expect(clipFrom.clipPath).toBe(PRESETS.curtain.clipFrom)
    const [imgTarget, imgFrom] = tlFromTo.mock.calls[1] as [HTMLElement, Record<string, number>]
    expect(imgTarget.tagName).toBe('IMG')
    expect(imgFrom.scale).toBe(PRESETS.curtain.overscale)
  })

  it('lines: masked spans rise from below the fold line', () => {
    render(<Probe preset="lines" />)
    const [targets, from, to] = gsapFromTo.mock.calls[0] as [NodeListOf<Element>, Record<string, number>, Record<string, unknown>]
    expect(targets.length).toBe(2)
    expect(from).toEqual({ yPercent: PRESETS.lines.fromPercent })
    expect(to.stagger).toBe(PRESETS.lines.stagger)
  })

  it('stack: children alternate entrance offsets', () => {
    render(<Probe preset="stack" stagger=".kid" />)
    expect(gsapFromTo).toHaveBeenCalledTimes(2)
    const firstFrom = gsapFromTo.mock.calls[0][1] as Record<string, number>
    const secondFrom = gsapFromTo.mock.calls[1][1] as Record<string, number>
    expect(firstFrom.y).toBe(PRESETS.stack.offsets[0])
    expect(secondFrom.y).toBe(PRESETS.stack.offsets[1])
  })
})

describe('useReveal under prefers-reduced-motion', () => {
  beforeEach(() => stubMedia({ reduced: true }))

  it('collapses every preset to a 0.3s opacity fade — content never fails to appear', () => {
    render(<Probe preset="curtain" />)
    expect(gsapFromTo).toHaveBeenCalledTimes(1)
    const [, from, to] = gsapFromTo.mock.calls[0] as [unknown, Record<string, number>, Record<string, unknown>]
    expect(from).toEqual({ opacity: 0 })
    expect(to.duration).toBe(0.3)
    // Any hidden initial states in the markup are neutralised.
    expect(gsapSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ opacity: 1, y: 0 }))
  })
})

describe('useReveal on mobile viewports', () => {
  beforeEach(() => stubMedia({ mobile: true }))

  it('tightens duration and shortens travel rather than removing motion', () => {
    render(<Probe preset="breathe" />)
    const [, from, to] = gsapFromTo.mock.calls[0] as [unknown, Record<string, number>, Record<string, unknown>]
    expect(from.y).toBeLessThan(PRESETS.breathe.distance)
    expect(to.duration as number).toBeLessThan(PRESETS.breathe.dur)
    expect(from.opacity).toBe(0)
  })
})
