import { describe, it, expect } from 'vitest'
import { classifyNavigation, morphTransitionName } from '@/lib/view-transitions'

describe('classifyNavigation', () => {
  it('morphs from the archive grid into a case study', () => {
    expect(classifyNavigation('/portfolio', '/work/glitch-club')).toBe('morph')
  })

  it('morphs from the home feed into a case study', () => {
    expect(classifyNavigation('/', '/work/volkswagen-jetta')).toBe('morph')
  })

  it('ignores query strings on the source path', () => {
    expect(classifyNavigation('/portfolio?category=Fashion', '/work/glitch-club')).toBe('morph')
  })

  it('does not morph between two case studies', () => {
    expect(classifyNavigation('/work/glitch-club', '/work/volkswagen-jetta')).toBe('shutter')
  })

  it('does not morph from an unrelated route into a case study', () => {
    expect(classifyNavigation('/about', '/work/glitch-club')).toBe('shutter')
  })

  it('does not morph into a non-case-study route', () => {
    expect(classifyNavigation('/portfolio', '/services')).toBe('shutter')
  })

  it('does not morph into the work index itself', () => {
    expect(classifyNavigation('/portfolio', '/work')).toBe('shutter')
  })

  it('falls back to shutter for the same-path case (no-op nav)', () => {
    expect(classifyNavigation('/portfolio', '/portfolio')).toBe('shutter')
  })
})

describe('morphTransitionName', () => {
  it('is stable and unique per project slug', () => {
    expect(morphTransitionName('glitch-club')).toBe(morphTransitionName('glitch-club'))
    expect(morphTransitionName('glitch-club')).not.toBe(morphTransitionName('volkswagen-jetta'))
  })
})
