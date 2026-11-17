import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRef } from 'react'
import { render } from '@testing-library/react'

// Assert the reveal's contract (which tweens, driven how) — not the tweens themselves.
const gsapSet = vi.fn()
const gsapFromTo = vi.fn()

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    set: (...args: unknown[]) => gsapSet(...args),
    fromTo: (...args: unknown[]) => gsapFromTo(...args),
    to: vi.fn(),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import { useSlotReveal } from '@/hooks/useSlotReveal'
import { MOTION } from '@/lib/motion'

const R = MOTION.reveal

function Probe({ snap }: { snap?: boolean }) {
  const section = useRef<HTMLElement>(null)
  const image = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLDivElement>(null)
  useSlotReveal({ section, image, text }, { snap })
  return (
    <section ref={section as React.RefObject<HTMLElement>}>
      <div ref={image} data-testid="image" />
      <div ref={text} data-testid="text">TITLE</div>
    </section>
  )
}

function stubMedia(reduced = false) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(prefers-reduced-motion: reduce)' ? reduced : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

const calls = (testId: string) =>
  gsapFromTo.mock.calls.filter(([el]) => (el as HTMLElement).dataset.testid === testId)

beforeEach(() => {
  gsapSet.mockClear()
  gsapFromTo.mockClear()
})

describe('useSlotReveal', () => {
  it('opens the slot on a timed tween, never pinned', () => {
    stubMedia()
    render(<Probe />)
    const [[, from, to]] = calls('image')
    expect(from).toMatchObject({ clipPath: R.slotInset })
    expect(to).toMatchObject({ clipPath: R.openInset })
    expect(to.scrollTrigger).toBeUndefined()
  })

  it('lifts the headline on scroll, scrubbed and unpinned', () => {
    stubMedia()
    render(<Probe />)
    const [[, , to]] = calls('text')
    expect(to.scrollTrigger).toMatchObject({ scrub: R.scrub })
    expect(to.scrollTrigger.pin).toBeUndefined()
  })

  it('snap lands on the open frame and only keeps the headline exit', () => {
    stubMedia()
    render(<Probe snap />)
    expect(gsapSet).toHaveBeenCalledWith(expect.anything(), { clipPath: R.openInset, scale: R.endScale })
    expect(calls('image')).toHaveLength(0)
    expect(calls('text')).toHaveLength(1)
  })

  it('reduced motion lands on the open frame with no tweens at all', () => {
    stubMedia(true)
    render(<Probe />)
    expect(gsapSet).toHaveBeenCalledWith(expect.anything(), { clipPath: R.openInset, scale: R.endScale })
    expect(gsapFromTo).not.toHaveBeenCalled()
  })
})
