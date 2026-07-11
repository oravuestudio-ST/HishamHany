import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClientsMarquee from '@/components/ClientsMarquee'

describe('ClientsMarquee', () => {
  it('renders the client logos duplicated for a seamless loop (7 × 2)', () => {
    render(<ClientsMarquee />)
    expect(screen.getAllByRole('img')).toHaveLength(14)
  })

  it('includes each named client at least once', () => {
    render(<ClientsMarquee />)
    for (const alt of ['Binghatti', 'El Koptan Cars', 'Cairo Opera House', 'Glide', 'Rose Al-Yusuf']) {
      expect(screen.getAllByAltText(alt).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('renders Binghatti, El Koptan Cars, and Glitch Goods with the theme-reactive client-logo class', () => {
    render(<ClientsMarquee />)
    for (const alt of ['Binghatti', 'El Koptan Cars', 'Glitch Goods']) {
      const [img] = screen.getAllByAltText(alt)
      expect(img.className).toContain('client-logo')
    }
  })

  it('sources Binghatti, El Koptan Cars, and Glitch Goods from the base (non "-white") logo files', () => {
    render(<ClientsMarquee />)
    const expected: Record<string, string> = {
      Binghatti: '/images/logos/binghatti.svg',
      'El Koptan Cars': '/images/logos/koptan.svg',
      'Glitch Goods': '/images/logos/glitch-goods.svg',
    }
    for (const [alt, src] of Object.entries(expected)) {
      const [img] = screen.getAllByAltText(alt)
      expect(img.getAttribute('src')).toBe(src)
    }
  })
})
