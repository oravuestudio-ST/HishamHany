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
})
