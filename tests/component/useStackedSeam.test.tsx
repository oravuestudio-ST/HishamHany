import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'

// Contract test in the scroll-hooks style: under reduced motion the hook must
// create nothing; otherwise it builds one scrubbed timeline over the trigger's
// exit and tweens the target toward the STACK end state.
const timelineTo = vi.fn().mockReturnThis()
const timeline = vi.fn(() => ({ to: timelineTo }))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    timeline: (...args: unknown[]) => timeline(...args),
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn() } }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import { useStackedSeam } from '@/hooks/useStackedSeam'
import { STACK } from '@/animations/tokens'

function Probe({ rotate = true }: { rotate?: boolean }) {
  const trigger = useRef<HTMLDivElement>(null)
  const target = useRef<HTMLDivElement>(null)
  useStackedSeam({ trigger, target, rotate })
  return (
    <div ref={trigger}>
      <div ref={target}>card</div>
    </div>
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
  })

  it('creates no timeline under reduced motion', () => {
    setReducedMotion(true)
    render(<Probe />)
    expect(timeline).not.toHaveBeenCalled()
  })

  it('scrubs the trigger exit and tweens the target to the STACK end state', () => {
    setReducedMotion(false)
    render(<Probe />)
    expect(timeline).toHaveBeenCalledTimes(1)
    const config = timeline.mock.calls[0][0] as {
      scrollTrigger: { start: string; end: string; scrub: number }
    }
    expect(config.scrollTrigger.start).toBe('bottom bottom')
    expect(config.scrollTrigger.end).toBe('bottom top')
    expect(config.scrollTrigger.scrub).toBe(STACK.scrub)

    const vars = timelineTo.mock.calls[0][1] as Record<string, unknown>
    expect(vars.scale).toBe(STACK.scale)
    expect(vars.rotation).toBe(STACK.rotate)
    expect(vars.filter).toBe(`brightness(${STACK.dim})`)
  })

  it('skips rotation when rotate is false (thin strips)', () => {
    setReducedMotion(false)
    render(<Probe rotate={false} />)
    const vars = timelineTo.mock.calls[0][1] as Record<string, unknown>
    expect(vars.rotation).toBe(0)
  })
})
