import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Stub GSAP's timeline so the loader mounts without driving real animations.
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    timeline: () => ({ to: vi.fn().mockReturnThis(), fromTo: vi.fn().mockReturnThis() }),
  },
}))

import Loader from '@/components/Loader'

describe('Loader', () => {
  it('renders the brand lockup and tagline while loading', () => {
    render(<Loader onComplete={vi.fn()} />)
    expect(screen.getByRole('img', { name: 'Hisham Hany' })).toBeInTheDocument()
    expect(screen.getByText(/Fashion/)).toBeInTheDocument()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
