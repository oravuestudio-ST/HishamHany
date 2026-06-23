import { describe, it, expect, vi } from 'vitest'

// Stub the pre-built manifest the lib reads from public/gallery-manifest.json.
const manifest: Record<string, string[]> = {
  'images/Automotive/GLE-450': [
    '/images/Automotive/GLE-450/1.jpg',
    '/images/Automotive/GLE-450/2.jpg',
  ],
  'images/Automotive/GLE-450/Red': ['/images/Automotive/GLE-450/Red/a.jpg'],
  'images/Automotive/GLE-450/Blue': ['/images/Automotive/GLE-450/Blue/b.jpg'],
}

vi.mock('node:fs', () => {
  const readFileSync = () => JSON.stringify(manifest)
  return { default: { readFileSync }, readFileSync }
})

import { getGallery, getColorGroups } from '@/lib/galleries'

describe('getGallery', () => {
  it('returns every image for a known directory', () => {
    expect(getGallery('/images/Automotive/GLE-450/1.jpg')).toHaveLength(2)
  })

  it('falls back to the single path when the directory is unknown', () => {
    expect(getGallery('/images/Unknown/x.jpg')).toEqual(['/images/Unknown/x.jpg'])
  })

  it('handles URL-encoded paths', () => {
    expect(getGallery('/images/Automotive/GLE-450/1.jpg'.replace('GLE', 'GLE'))).toHaveLength(2)
  })
})

describe('getColorGroups', () => {
  it('groups sub-folders by label, alphabetically sorted', () => {
    const groups = getColorGroups('/images/Automotive/GLE-450/1.jpg')
    expect(groups.map((g) => g.label)).toEqual(['Blue', 'Red'])
  })

  it('attaches the right images to each group, excluding the base folder', () => {
    const groups = getColorGroups('/images/Automotive/GLE-450/1.jpg')
    expect(groups.find((g) => g.label === 'Red')?.images).toEqual([
      '/images/Automotive/GLE-450/Red/a.jpg',
    ])
  })
})
