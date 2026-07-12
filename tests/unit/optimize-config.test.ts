// The image-optimization pass is tiered: full-bleed cover images (declared as
// `image:` in lib/projects.ts) keep the 4K ceiling; everything else — gallery
// grids, spreads, lookbook — caps at 2560px. These tests pin the rule table and
// the cover-path parser so a registry refactor can't silently downgrade covers.
import { describe, it, expect } from 'vitest'
import { parseCoverPaths, ruleFor, COVER_RULE, DEFAULT_RULE } from '../../scripts/optimize-config.mjs'

describe('parseCoverPaths', () => {
  it('extracts decoded image paths from projects source', () => {
    const src = `
      const raw = [
        { id: 1, image: '/images/Automotive/koptan%20jetta/hero%20jetta.JPG', aspect: 'landscape' },
        { id: 2, image: '/images/Fashion/GLITCH GOODS/cover.jpg', aspect: 'portrait' },
      ]
    `
    const covers = parseCoverPaths(src)
    expect(covers.has('Automotive/koptan jetta/hero jetta.JPG')).toBe(true)
    expect(covers.has('Fashion/GLITCH GOODS/cover.jpg')).toBe(true)
    expect(covers.size).toBe(2)
  })

  it('ignores non-image fields and double-quoted noise', () => {
    const src = `clientLogo: '/images/logos/mercedes.svg', image: '/images/Events/a.jpg'`
    const covers = parseCoverPaths(src)
    expect(covers.has('Events/a.jpg')).toBe(true)
    expect(covers.has('logos/mercedes.svg')).toBe(false)
  })
})

describe('ruleFor', () => {
  const covers = new Set(['Automotive/koptan jetta/hero jetta.JPG'])

  it('protects covers at the 4K ceiling with the conservative threshold', () => {
    const rule = ruleFor('Automotive/koptan jetta/hero jetta.JPG', covers)
    expect(rule).toEqual(COVER_RULE)
    expect(rule.maxEdge).toBe(3840)
  })

  it('caps non-cover images at 2560', () => {
    const rule = ruleFor('Fashion/Some shoot/frame-004.jpg', covers)
    expect(rule).toEqual(DEFAULT_RULE)
    expect(rule.maxEdge).toBe(2560)
  })

  it('never touches brand logos', () => {
    expect(ruleFor('logos/mercedes.png', covers)).toBeNull()
  })

  it('cover match is exact, not prefix — siblings in a cover folder still shrink', () => {
    expect(ruleFor('Automotive/koptan jetta/detail-2.JPG', covers)).toEqual(DEFAULT_RULE)
  })

  it('default rule reaches below the old 1.5MB skip threshold', () => {
    // The bulk of the 292MB tree is 400KB–1.5MB files the old pass never touched.
    expect(DEFAULT_RULE.minBytes).toBeLessThanOrEqual(400 * 1024)
    expect(COVER_RULE.minBytes).toBeGreaterThanOrEqual(1024 * 1024)
  })
})
