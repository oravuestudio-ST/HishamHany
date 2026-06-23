import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the router + the animation engine; we assert DOM/state, not tweens.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn(), set: vi.fn(), fromTo: vi.fn(), to: vi.fn() },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))

import Navigation from '@/components/Navigation'

beforeEach(() => {
  document.body.style.overflow = ''
})

describe('Navigation', () => {
  it('renders the home logo link and the menu toggle', () => {
    render(<Navigation />)
    expect(screen.getByLabelText('Hisham Hany — Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
  })

  it('exposes all primary navigation links', () => {
    render(<Navigation />)
    for (const label of ['Work', 'About', 'Services', 'Journal', 'Contact']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('locks body scroll when the menu opens and restores it on close', () => {
    render(<Navigation />)
    const toggle = screen.getByLabelText('Toggle menu')

    fireEvent.click(toggle)
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(toggle)
    expect(document.body.style.overflow).toBe('')
  })
})
