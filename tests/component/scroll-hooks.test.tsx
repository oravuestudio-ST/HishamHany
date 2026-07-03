import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// Assert the hook contracts, not the tweens: under prefers-reduced-motion
// every scroll-storytelling hook must present the final state and create no
// ScrollTrigger (no pinning, no scrubbing).
const gsapSet = vi.fn()
const gsapFromTo = vi.fn()
const gsapTo = vi.fn()
const stCreate = vi.fn()

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    set: (...args: unknown[]) => gsapSet(...args),
    fromTo: (...args: unknown[]) => gsapFromTo(...args),
    to: (...args: unknown[]) => gsapTo(...args),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: (...args: unknown[]) => stCreate(...args) },
}))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import { useMaskReveal } from '@/hooks/useMaskReveal'
import { useProgressiveImage } from '@/hooks/useProgressiveImage'
import { usePinnedSection } from '@/hooks/usePinnedSection'
import { useHorizontalGallery } from '@/hooks/useHorizontalGallery'

function MaskProbe() {
  const ref = useMaskReveal<HTMLDivElement>()
  return <div ref={ref}>masked</div>
}
function ProgressiveProbe() {
  const ref = useProgressiveImage<HTMLDivElement>()
  return <div ref={ref}>image</div>
}
function PinnedProbe() {
  const ref = usePinnedSection<HTMLDivElement>()
  return <div ref={ref}>pinned</div>
}
function HorizontalProbe() {
  const { sectionRef, trackRef } = useHorizontalGallery<HTMLElement, HTMLDivElement>()
  return (
    <section ref={sectionRef}>
      <div ref={trackRef}>track</div>
    </section>
  )
}

function stubReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(prefers-reduced-motion: reduce)' ? matches : false,
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
  gsapTo.mockClear()
  stCreate.mockClear()
})

describe('scroll-storytelling hooks under prefers-reduced-motion', () => {
  beforeEach(() => stubReducedMotion(true))

  it('useMaskReveal presents the final state without animating', () => {
    render(<MaskProbe />)
    expect(gsapSet).toHaveBeenCalled()
    expect(gsapFromTo).not.toHaveBeenCalled()
    expect(stCreate).not.toHaveBeenCalled()
  })

  it('useProgressiveImage shows the image plainly', () => {
    render(<ProgressiveProbe />)
    expect(gsapSet).toHaveBeenCalledWith(expect.anything(), { clipPath: 'none', scale: 1 })
    expect(gsapFromTo).not.toHaveBeenCalled()
  })

  it('usePinnedSection never pins', () => {
    render(<PinnedProbe />)
    expect(stCreate).not.toHaveBeenCalled()
  })

  it('useHorizontalGallery leaves native scrolling in place', () => {
    render(<HorizontalProbe />)
    expect(gsapTo).not.toHaveBeenCalled()
    expect(stCreate).not.toHaveBeenCalled()
  })
})

describe('scroll-storytelling hooks with motion allowed', () => {
  beforeEach(() => stubReducedMotion(false))

  it('useMaskReveal animates via ScrollTrigger config', () => {
    render(<MaskProbe />)
    expect(gsapFromTo).toHaveBeenCalled()
    const vars = gsapFromTo.mock.calls[0][2] as { scrollTrigger?: unknown }
    expect(vars.scrollTrigger).toBeDefined()
  })

  it('usePinnedSection pins on wide viewports', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
    render(<PinnedProbe />)
    expect(stCreate).toHaveBeenCalledWith(expect.objectContaining({ pin: true, scrub: true }))
  })

  it('usePinnedSection does not pin on narrow viewports', () => {
    Object.defineProperty(window, 'innerWidth', { value: 480, configurable: true })
    render(<PinnedProbe />)
    expect(stCreate).not.toHaveBeenCalled()
  })
})
