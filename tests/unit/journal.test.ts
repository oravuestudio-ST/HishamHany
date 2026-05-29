import { describe, it, expect } from 'vitest'
import { getAllPosts, getPost, formatDate } from '@/lib/journal'

describe('journal', () => {
  it('reads the seed posts, newest first, with unique slugs', () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThanOrEqual(2)

    const dates = posts.map((p) => p.date)
    const sorted = [...dates].sort((a, b) => b.localeCompare(a))
    expect(dates).toEqual(sorted)

    const slugs = posts.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every post has title, date, and excerpt', () => {
    for (const p of getAllPosts()) {
      expect(p.title.length).toBeGreaterThan(0)
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(p.excerpt.length).toBeGreaterThan(0)
    }
  })

  it('getPost returns body content for a known slug and null otherwise', () => {
    const first = getAllPosts()[0]
    const post = getPost(first.slug)
    expect(post?.content.length).toBeGreaterThan(0)
    expect(getPost('no-such-post')).toBeNull()
  })

  it('formatDate renders a human date', () => {
    expect(formatDate('2026-05-12')).toMatch(/2026/)
    expect(formatDate('')).toBe('')
  })
})
