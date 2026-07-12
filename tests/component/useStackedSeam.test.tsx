import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'

// Contract test in the scroll-hooks style: under reduced motion the hook must
// create nothing; otherwise it builds a paused unit timeline toward the STACK
// end state and slaves its progress to live geometry via a scroll-tick
// ScrollTrigger. Cached ScrollTrigger start/end are deliberately NOT used —
// they were traced landing on pre-pin-spacer layouts (both at creation and at
// GSAP's window-load auto-refresh), which ran the seam during the slot reveal.
const timelineTo = vi.fn().mockReturnThis()
const timeline = vi.fn((config?: Record<string, unknown>) => {
  void config
  return { to: timelineTo }
})
const quickTo = vi.fn(() => vi.fn())

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    timeline: (config?: Record<string, unknown>) => timeline(config),
    quickTo: (...args: unknown[]) => quickTo(...args),
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
const stCreate = vi.fn()
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: (...args: unknown[]) => stCreate(...args) },
}))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import { useStackedSeam } from '@/hooks/useStackedSeam'
import { STACK } from '@/animations/tokens'

// Mirrors the HomeClient stack contract: the receding section sits in a card
// wrapper whose next sibling is the incoming card.
function Probe({ rotate = true }: { rotate?: boolean }) {
  const trigger = useRef<HTMLDivElement>(null)
  const target = useRef<HTMLDivElement>(null)
  useStackedSeam({ trigger, target, rotate })
  return (
    <main>
      <div data-testid="card">
        <div ref={trigger}>
          <div ref={target}>card</div>
        </div>
      </div>
      <div data-testid="next-card">incoming</div>
    </main>
  )
}

const setReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('useStackedSeam', () => {
  beforeEach(() => {
    timeline.mockClear()
    timelineTo.mockClear()
    quickTo.mockClear()
    stCreate.mockClear()
  })

  it('creates no timeline and no trigger under reduced motion', () => {
    setReducedMotion(true)
    render(<Probe />)
    expect(timeline).not.toHaveBeenCalled()
    expect(stCreate).not.toHaveBeenCalled()
  })

  it('builds a paused unit timeline toward the STACK end state', () => {
    setReducedMotion(false)
    render(<Probe />)
    expect(timeline).toHaveBeenCalledTimes(1)
    expect(timeline.mock.calls[0][0]).toMatchObject({ paused: true })

    const vars = timelineTo.mock.calls[0][1] as Record<string, unknown>
    expect(vars.scale).toBe(STACK.scale)
    expect(vars.rotation).toBe(STACK.rotate)
    expect(vars.filter).toBe(`brightness(${STACK.dim})`)
    expect(vars.duration).toBe(1)
  })

  it('drives progress from scroll ticks, never from cached trigger positions', () => {
    setReducedMotion(false)
    render(<Probe />)
    // A smoothed progress driver on the timeline...
    expect(quickTo).toHaveBeenCalledWith(
      expect.anything(),
      'progress',
      expect.objectContaining({ duration: STACK.scrub })
    )
    // ...fed by a whole-page scroll-tick trigger whose own start/end carry no
    // layout measurements that could go stale.
    expect(stCreate).toHaveBeenCalledTimes(1)
    const config = stCreate.mock.calls[0][0] as Record<string, unknown>
    expect(config.start).toBe(0)
    expect(config.end).toBe('max')
    expect(typeof config.onUpdate).toBe('function')
  })

  it('skips rotation when rotate is false (thin strips)', () => {
    setReducedMotion(false)
    render(<Probe rotate={false} />)
    const vars = timelineTo.mock.calls[0][1] as Record<string, unknown>
    expect(vars.rotation).toBe(0)
  })
})
