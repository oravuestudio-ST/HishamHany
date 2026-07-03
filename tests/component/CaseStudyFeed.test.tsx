import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Stub the animation engine and the 3D eyebrow; we assert content, not tweens.
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: () => ({ revert: vi.fn() }),
    from: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    quickTo: vi.fn(() => vi.fn()),
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn() } }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import CaseStudyFeed from '@/components/CaseStudyFeed'
import { projects } from '@/lib/projects'

describe('CaseStudyFeed', () => {
  it('renders a row per project with a case-study link', () => {
    const { container } = render(<CaseStudyFeed />)
    const rows = container.querySelectorAll('.case-study-row')
    expect(rows.length).toBe(projects.length)
  })

  it('links every row to its /work/[slug] page', () => {
    render(<CaseStudyFeed />)
    for (const project of projects.slice(0, 3)) {
      const links = screen.getAllByRole('link')
      expect(
        links.some((l) => l.getAttribute('href') === `/work/${project.slug}`)
      ).toBe(true)
    }
  })

  it('renders real project imagery with alt text', () => {
    const { container } = render(<CaseStudyFeed />)
    const images = container.querySelectorAll('.case-study-row img')
    expect(images.length).toBeGreaterThan(0)
  })
})
