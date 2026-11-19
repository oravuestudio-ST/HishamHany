import { describe, it, expect, vi } from 'vitest'

// gallery-dimensions.json is generated at build time (and gitignored), so the
// unit run can't rely on it: pin the six covers' real pixel sizes here.
const DIMS: Record<string, [number, number]> = {
  '/images/Fashion/GLITCH%20GOODS/Glitch_club%20germany/Glitch_germany-001.jpg': [1920, 1280],
  '/images/Automotive/Seat%20ibiza/Hero.JPG': [2500, 1667],
  '/images/Fashion/GLITCH%20GOODS/Glitch_party-till-die/Glitch_partyTillDie-001.JPG': [2560, 3840],
  '/images/Automotive/GLE-450/Hero_GLE450_car-004.JPG': [1080, 720],
  '/images/New%20capital/NewCapital_architecture-005.JPG': [2560, 1707],
  '/images/Clay_journalism_project/Clay_journalism-008.JPG': [2048, 1366],
}
vi.mock('@/lib/galleries', () => ({
  withDimensions: (srcs: string[]) => srcs.map((src) => {
    const [w, h] = DIMS[src] ?? [1200, 800]
    return { src, w, h }
  }),
}))

import { getChapters, deriveComposition, EXHIBITION_SLUGS } from '@/lib/chapters'
import { getProject } from '@/lib/projects'
import { CHAPTER } from '@/animations/tokens'

describe('the exhibition', () => {
  const chapters = getChapters()

  it('hangs six scenes, each a real project with a real case-study URL', () => {
    expect(chapters).toHaveLength(6)
    chapters.forEach((c, i) => {
      expect(getProject(c.slug)).toBeDefined()
      expect(c.href).toBe(`/work/${c.slug}`)
      expect(c.number).toBe(i + 1)
      expect(c.total).toBe(6)
    })
    expect(chapters.map((c) => c.slug)).toEqual(EXHIBITION_SLUGS)
  })

  it('only hangs sources full-bleed when they stay sharp, and alternates the rhythm', () => {
    expect(chapters.map((c) => c.composition)).toEqual(['hung', 'bleed', 'portrait', 'hung', 'bleed', 'hung'])
    chapters.filter((c) => c.composition === 'bleed').forEach((c) => expect(c.image.w).toBeGreaterThanOrEqual(2400))
    // No two neighbours share a composition.
    chapters.slice(1).forEach((c, i) => expect(c.composition).not.toBe(chapters[i].composition))
  })

  it('alternates fashion and automotive, then closes on the editorial pair', () => {
    expect(chapters.map((c) => c.category)).toEqual(['Fashion', 'Automotive', 'Fashion', 'Automotive', 'Editorial', 'Editorial'])
  })

  it('describes every photograph — no empty or generic alt text', () => {
    chapters.forEach((c) => {
      expect(c.image.alt.length).toBeGreaterThan(30)
      expect(c.image.alt.toLowerCase()).not.toContain('image of')
    })
  })

  it('never shows the hero photograph twice: New Capital hangs a different frame and skips the morph', () => {
    const nc = chapters.find((c) => c.slug === 'new-capital-architectural-study')!
    expect(nc.image.src).not.toContain('Hero')
    expect(nc.morph).toBe(false)
    chapters.filter((c) => c.slug !== nc.slug).forEach((c) => expect(c.morph).toBe(true))
  })

  it('credits a commission rather than a scope string posing as a client', () => {
    const seat = chapters.find((c) => c.slug === 'seat-ibiza')!
    expect(seat.creditLabel).toBe('Commission')
    expect(seat.credit).not.toBe('Automotive Campaign')
    const mercedes = chapters.find((c) => c.slug === 'mercedes-gle-450-4matic')!
    expect(mercedes).toMatchObject({ creditLabel: 'Client', credit: 'El Koptan' })
  })

  it('gives full-bleed scenes the longest hold', () => {
    chapters.forEach((c) => expect(c.hold).toBe(CHAPTER.hold[c.composition]))
  })
})

describe('deriveComposition', () => {
  it('reads the real pixel size, not the registry’s declared aspect', () => {
    expect(deriveComposition(2560, 3840)).toBe('portrait')
    expect(deriveComposition(1920, 1920)).toBe('hung')
    expect(deriveComposition(1080, 720)).toBe('hung')
    expect(deriveComposition(3840, 2560)).toBe('bleed')
  })
})
