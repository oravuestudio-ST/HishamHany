import { describe, it, expect, beforeEach } from 'vitest'
import { formatCount, heroReady, markHeroSettled, nextCount, paceLoader, resetPreloadState, MILESTONE_WEIGHTS } from '@/lib/preload'

const input = (over: Partial<Parameters<typeof nextCount>[0]> = {}) => ({ real: 0, shown: 0, dt: 1 / 60, elapsed: 0, ...over })

// The bounds around the pacing policy are what keep the intro honest and
// finite whatever the policy does — they are tested here, the policy is not.
describe('nextCount — the bounds around the pacing policy', () => {
  it('never goes backwards', () => {
    expect(nextCount(input({ real: 0.2, shown: 0.5, elapsed: 10 }), { minCount: 2.2, deadline: false })).toBe(0.5)
  })

  it('cannot finish before the minimum count duration, even with everything cached', () => {
    // dt: 1 lets the pacing policy reach `real`, so only the time cap binds.
    const v = nextCount(input({ real: 1, dt: 1, elapsed: 1.1 }), { minCount: 2.2, deadline: false })
    expect(v).toBeCloseTo(0.5)
    expect(nextCount(input({ real: 1, shown: 0.99, dt: 1, elapsed: 2.2 }), { minCount: 2.2, deadline: false })).toBe(1)
  })

  it('never claims more than has really loaded', () => {
    expect(nextCount(input({ real: 0.7, elapsed: 30 }), { minCount: 2.2, deadline: false })).toBeLessThanOrEqual(0.7)
  })

  it('finishes the moment the asset deadline passes — a stalled font can’t hold the page', () => {
    expect(nextCount(input({ real: 0.15, elapsed: 5.6 }), { minCount: 2.2, deadline: true })).toBe(1)
  })
})

describe('paceLoader — how the count chases real progress', () => {
  const step = (shown: number, real: number, dt = 1 / 60) => paceLoader(input({ real, shown, dt }))

  it('travels between milestones instead of jumping to them', () => {
    const v = step(0, 0.7)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(0.1)
  })

  it('never leads real progress', () => {
    expect(step(0.69, 0.7, 1)).toBe(0.7)
    expect(step(0.7, 0.7)).toBe(0.7)
  })

  it('lands on a milestone in about a second at 60fps, not asymptotically', () => {
    let shown = 0
    for (let i = 0; i < 70; i++) shown = step(shown, 0.7)
    expect(shown).toBe(0.7)
  })

  it('is frame-rate independent', () => {
    let fast = 0
    for (let i = 0; i < 30; i++) fast = step(fast, 1, 1 / 60)
    let slow = 0
    for (let i = 0; i < 15; i++) slow = step(slow, 1, 1 / 30)
    expect(Math.abs(fast - slow)).toBeLessThan(0.02)
  })
})

describe('milestones', () => {
  beforeEach(() => resetPreloadState())

  it('weights add up to the whole intro', () => {
    const total = Object.values(MILESTONE_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1)
  })

  it('settles the hero milestone once, for every waiter, even after the fact', async () => {
    const early = heroReady()
    markHeroSettled()
    markHeroSettled()
    await expect(early).resolves.toBeUndefined()
    await expect(heroReady()).resolves.toBeUndefined()
  })
})

describe('formatCount', () => {
  it('prints the count the way the loader shows it', () => {
    expect(formatCount(0)).toBe('000')
    expect(formatCount(0.067)).toBe('007')
    expect(formatCount(1)).toBe('100')
    expect(formatCount(1.4)).toBe('100')
  })
})
