import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Stub the WebGL image (avoids three.js) and the animation engine.
vi.mock('@/components/WebGLImage', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))
vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn(), context: () => ({ revert: vi.fn() }), from: vi.fn(), fromTo: vi.fn(), to: vi.fn() },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))

import Portfolio from '@/components/Portfolio'
import { projects, categories } from '@/lib/projects'

// Each card exposes one "View case study — <title>" link.
const cardLinks = () => screen.getAllByRole('link', { name: /View case study/i })

describe('Portfolio', () => {
  it('shows every project under the default "All" filter', () => {
    render(<Portfolio />)
    expect(cardLinks()).toHaveLength(projects.length)
  })

  it('renders a tab for each category', () => {
    render(<Portfolio />)
    for (const cat of categories) {
      expect(screen.getByRole('button', { name: cat })).toBeInTheDocument()
    }
  })

  it('narrows the grid to the selected category', () => {
    render(<Portfolio />)
    const cat = categories.find((c) => c !== 'All')!
    const expected = projects.filter((p) => p.category === cat).length

    fireEvent.click(screen.getByRole('button', { name: cat }))
    expect(cardLinks()).toHaveLength(expected)
  })
})
