import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from '@/components/Logo'

describe('Logo', () => {
  it('renders an accessible image with the brand name', () => {
    render(<Logo />)
    const svg = screen.getByRole('img', { name: 'Hisham Hany' })
    expect(svg.tagName.toLowerCase()).toBe('svg')
  })

  it('applies a numeric size as pixels', () => {
    const { container } = render(<Logo size={64} />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('64px')
  })

  it('accepts a CSS-length size string', () => {
    const { container } = render(<Logo size="min(72vw,340px)" />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('min(72vw,340px)')
  })

  it('renders the full lockup with wordmark paths', () => {
    const { container } = render(<Logo variant="full" />)
    // full variant draws the monogram + rule line + many wordmark paths
    expect(container.querySelector('line')).toBeInTheDocument()
    expect(container.querySelectorAll('path').length).toBeGreaterThan(5)
  })
})
