import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// Stub GSAP so Hero/Loader effects don't drive real animations in jsdom.
vi.mock('gsap', () => {
  const tl = { to: vi.fn().mockReturnThis(), fromTo: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), call: vi.fn().mockReturnThis(), kill: vi.fn() }
  return {
    gsap: {
      registerPlugin: vi.fn(),
      timeline: () => tl,
      set: vi.fn(),
      to: vi.fn(),
      quickTo: () => vi.fn(),
      context: (fn: () => void) => { fn(); return { revert: vi.fn() } },
    },
  }
})

import HomeClient from '@/components/home/HomeClient'

describe('HomeClient intro', () => {
  it('paints the loader curtain on first render (no plain-text flash before it)', () => {
    // The curtain must be in the very first paint — if it is lazy-loaded
    // (ssr:false + dynamic), the server-rendered fallback text flashes for
    // hundreds of ms before the ink curtain arrives.
    const { container } = render(<HomeClient />)
    expect(container.querySelectorAll('.loader-panel').length).toBe(5)
  })
})
