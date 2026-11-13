import { describe, it, expect } from 'vitest'
import {
  newAssignment,
  normalCdf,
  parseAssignment,
  pickVariant,
  sampleSizePerArm,
  serializeAssignment,
  twoProportionTest,
} from '@/lib/experiments'

describe('experiments — assignment', () => {
  it('splits close to 50/50', () => {
    let b = 0
    for (let i = 0; i < 20_000; i++) if (pickVariant() === 'b') b++
    expect(b / 20_000).toBeGreaterThan(0.48)
    expect(b / 20_000).toBeLessThan(0.52)
  })

  it('is deterministic for a given random draw', () => {
    expect(pickVariant(() => 0.1)).toBe('a')
    expect(pickVariant(() => 0.9)).toBe('b')
  })

  it('round-trips through the cookie value, so assignment is sticky', () => {
    const a = newAssignment()
    expect(parseAssignment(serializeAssignment(a))).toEqual(a)
  })

  it.each([undefined, '', 'c.abcdefghijkl', 'a.short', 'a.ABCDEFGHIJKLMN', 'a.abcdefghijkl.x', 'b'])(
    'treats a malformed cookie (%s) as unassigned',
    (v) => expect(parseAssignment(v)).toBeNull(),
  )
})

describe('experiments — statistics', () => {
  it('normal CDF matches known values', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6)
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 4)
    expect(normalCdf(-1.959964)).toBeCloseTo(0.025, 4)
  })

  it('finds a large difference significant and equal rates not', () => {
    expect(twoProportionTest(1000, 50, 1000, 90).p).toBeLessThan(0.01)
    const same = twoProportionTest(1000, 50, 1000, 50)
    expect(same.p).toBeCloseTo(1, 6)
    expect(same.lift).toBe(0)
  })

  it('reports lift relative to the control', () => {
    expect(twoProportionTest(100, 10, 100, 15).lift).toBeCloseTo(0.5, 6)
    expect(twoProportionTest(100, 0, 100, 5).lift).toBeNull()
  })

  it('is safe with empty arms', () => {
    expect(twoProportionTest(0, 0, 0, 0)).toMatchObject({ p: 1, z: 0 })
  })

  it('sample size matches the textbook figure (5% → 6%, ~8,150 per arm)', () => {
    const n = sampleSizePerArm(0.05, 0.2)
    expect(n).toBeGreaterThan(8_000)
    expect(n).toBeLessThan(8_300)
  })
})
