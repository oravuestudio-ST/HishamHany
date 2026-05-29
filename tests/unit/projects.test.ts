import { describe, it, expect } from 'vitest'
import { projects, getProject, getAdjacent, categories } from '@/lib/projects'

describe('projects registry', () => {
  it('has a unique, non-empty slug for every project', () => {
    const slugs = projects.map((p) => p.slug)
    expect(slugs.every((s) => s.length > 0)).toBe(true)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('slugs are URL-safe (lowercase, hyphenated)', () => {
    for (const p of projects) {
      expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })

  it('every project image points under /images', () => {
    for (const p of projects) expect(p.image.startsWith('/images/')).toBe(true)
  })

  it('every category used by a project is a known category', () => {
    for (const p of projects) expect(categories).toContain(p.category)
  })

  it('getProject resolves known slugs and rejects unknown', () => {
    expect(getProject(projects[0].slug)?.id).toBe(projects[0].id)
    expect(getProject('does-not-exist')).toBeUndefined()
  })

  it('getAdjacent wraps around the list', () => {
    const first = projects[0].slug
    const last = projects[projects.length - 1].slug
    expect(getAdjacent(first)?.prev.slug).toBe(last)
    expect(getAdjacent(last)?.next.slug).toBe(first)
  })
})
