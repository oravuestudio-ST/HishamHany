import { describe, it, expect } from 'vitest'
import { STACK } from '@/animations/tokens'
import { MOTION } from '@/lib/motion'

// The stacked-seam contract: a receding card shrinks, tips, dims, and lingers.
// Values are design decisions — the test pins the *shape* and sane ranges so a
// typo (scale 8.5, positive rotate) fails fast, not the exact numbers.
describe('STACK tokens', () => {
  it('exposes the stacked-seam scale/rotate/dim/linger contract', () => {
    expect(STACK.scale).toBeGreaterThan(0.7)
    expect(STACK.scale).toBeLessThan(1)
    expect(STACK.rotate).toBeLessThan(0)
    expect(STACK.dim).toBeGreaterThan(0.4)
    expect(STACK.dim).toBeLessThan(1)
    expect(STACK.linger).toBeGreaterThan(0)
    expect(STACK.scrub).toBeGreaterThan(0)
  })

  it('hero-internal parallax layers separate: photo lags, glow leads', () => {
    expect(STACK.layer.back).toBeGreaterThan(0)
    expect(STACK.layer.glow).toBeLessThan(0)
  })

  it('is surfaced as MOTION.stack', () => {
    expect(MOTION.stack).toBe(STACK)
  })
})
