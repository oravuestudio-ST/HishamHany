import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const gsapSet = vi.fn()
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    set: (...args: unknown[]) => gsapSet(...args),
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import Footer from '@/components/Footer'

beforeEach(() => {
  gsapSet.mockClear()
})

describe('Footer', () => {
  it('renders the site nav, direct contact, and copyright line', () => {
    render(<Footer />)
    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument()
  })

  it('the oversized signature wordmark is decorative, not read by assistive tech', () => {
    const { container } = render(<Footer />)
    // Two lockups render: the small identity mark (meaningful) and the large
    // background signature (decorative) — the decorative one must sit inside
    // an aria-hidden wrapper so it isn't announced twice.
    const svgs = container.querySelectorAll('svg[aria-label="Hisham Hany"]')
    expect(svgs.length).toBe(2)
    const hiddenOnes = Array.from(svgs).filter((svg) => svg.closest('[aria-hidden="true"]'))
    expect(hiddenOnes.length).toBe(1)
  })

  it('shows the final state immediately under prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)',
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }))

    render(<Footer />)
    expect(gsapSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ opacity: 1, y: 0 })
    )
  })
})
