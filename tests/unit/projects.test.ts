import { describe, it, expect } from 'vitest'
import { projects, getProject, getAdjacent, getRelated, categories } from '@/lib/projects'

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

describe('editorial content', () => {
  it('every editorial.related slug resolves to a real project', () => {
    for (const p of projects) {
      for (const slug of p.editorial?.related ?? []) {
        expect(getProject(slug), `${p.slug} → related "${slug}"`).toBeDefined()
      }
    }
  })

  it('every editorial.sequence path stays under /images', () => {
    for (const p of projects) {
      for (const src of p.editorial?.sequence ?? []) {
        expect(src.startsWith('/images/')).toBe(true)
      }
    }
  })

  it('projects without editorial still render from base fields', () => {
    const bare = projects.filter((p) => !p.editorial)
    expect(bare.length).toBeGreaterThan(0)
    for (const p of bare) expect(p.description ?? p.scope).toBeTruthy()
  })
})

describe('getRelated', () => {
  it('never includes the project itself and never duplicates', () => {
    for (const p of projects) {
      const related = getRelated(p.slug)
      expect(related.map((r) => r.slug)).not.toContain(p.slug)
      expect(new Set(related.map((r) => r.slug)).size).toBe(related.length)
    }
  })

  it('returns n projects when the registry allows', () => {
    expect(getRelated(projects[0].slug, 3)).toHaveLength(3)
  })

  it('honors manual editorial.related ordering first', () => {
    const withManual = projects.find((p) => (p.editorial?.related?.length ?? 0) > 0)
    if (!withManual) return
    const related = getRelated(withManual.slug)
    expect(related[0].slug).toBe(withManual.editorial!.related![0])
  })

  it('falls back to same-category for projects without manual related', () => {
    const bare = projects.find((p) => !p.editorial?.related?.length)
    if (!bare) return
    const related = getRelated(bare.slug)
    expect(related.length).toBeGreaterThan(0)
    // Same-category peers come first when they exist.
    const sameCategory = projects.filter((p) => p.category === bare.category && p.slug !== bare.slug)
    if (sameCategory.length >= related.length) {
      expect(related.every((r) => r.category === bare.category)).toBe(true)
    }
  })

  it('returns empty for unknown slugs', () => {
    expect(getRelated('does-not-exist')).toEqual([])
  })
})
