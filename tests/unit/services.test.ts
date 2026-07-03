import { describe, it, expect } from 'vitest'
import { services, workflow } from '@/lib/services'
import { getProject } from '@/lib/projects'

describe('services registry', () => {
  it('has unique slugs and sequential numbering', () => {
    const slugs = services.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(services.map((s) => s.num)).toEqual(
      services.map((_, i) => String(i + 1).padStart(2, '0'))
    )
  })

  it('every coverProject resolves to a real case study', () => {
    for (const s of services) {
      expect(getProject(s.coverProject), `${s.slug} → cover "${s.coverProject}"`).toBeDefined()
    }
  })

  it('every service carries description, ideal client, and deliverables', () => {
    for (const s of services) {
      expect(s.description.length).toBeGreaterThan(40)
      expect(s.idealFor.length).toBeGreaterThan(10)
      expect(s.deliverables.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('pricing stays inquiry-led until real figures exist', () => {
    // No fabricated numbers: priceFrom is either absent or a real string set later.
    for (const s of services) {
      if (s.priceFrom !== undefined) expect(s.priceFrom).toMatch(/\d/)
    }
  })

  it('workflow runs Discovery through Support', () => {
    expect(workflow[0].title).toBe('Discovery')
    expect(workflow[workflow.length - 1].title).toBe('Support')
    expect(workflow.length).toBe(7)
  })
})
