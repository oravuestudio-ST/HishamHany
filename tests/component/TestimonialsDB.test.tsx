import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Testimonial } from '@/drizzle/schema'

vi.mock('@/hooks/useReveal', () => ({ useReveal: () => ({ current: null }) }))

import TestimonialsDB from '@/components/TestimonialsDB'

function quotes(n: number): Testimonial[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    client_name: `Client ${i + 1}`,
    company: `Company ${i + 1}`,
    role: 'Director',
    body: `Quote number ${i + 1}.`,
    rating: 5,
    visible: true,
    created_at: new Date('2026-01-01'),
  })) as Testimonial[]
}

// A single quote set at display size reads thinner than no section at all, so
// "Client Voices" only appears once there is a real chorus of external clients.
describe('TestimonialsDB', () => {
  it('renders nothing with a single testimonial', () => {
    const { container } = render(<TestimonialsDB initialData={quotes(1)} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing with two testimonials', () => {
    const { container } = render(<TestimonialsDB initialData={quotes(2)} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the section once there are three', () => {
    render(<TestimonialsDB initialData={quotes(3)} />)
    expect(screen.getByText(/Client Voices/)).toBeInTheDocument()
    expect(screen.getByText('Client 3')).toBeInTheDocument()
  })
})
