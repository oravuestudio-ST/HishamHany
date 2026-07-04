import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Stub GSAP's timeline so the loader mounts without driving real animations.
// The mock never fires onComplete — only the skip/reduced-motion branches do,
// which lets us tell "curtain is playing" apart from "handed off immediately".
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    timeline: () => ({ to: vi.fn().mockReturnThis(), fromTo: vi.fn().mockReturnThis(), call: vi.fn().mockReturnThis(), kill: vi.fn() }),
  },
}))

const matchMedia = (reduced: boolean) =>
  ((q: string) => ({
    matches: reduced && q.includes('reduced-motion'),
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia

// Each import re-runs Loader's module, resetting its per-page-load flag — the
// only way to simulate a genuinely fresh page load between assertions.
async function freshLoader() {
  vi.resetModules()
  return (await import('@/components/Loader')).default
}

describe('Loader', () => {
  beforeEach(() => { window.matchMedia = matchMedia(false) })

  it('renders the brand lockup and tagline while loading', async () => {
    const Loader = await freshLoader()
    render(<Loader onComplete={vi.fn()} />)
    expect(screen.getByRole('img', { name: 'Hisham Hany' })).toBeInTheDocument()
    expect(screen.getByText(/Fashion/)).toBeInTheDocument()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('plays the curtain on a fresh page load', async () => {
    const Loader = await freshLoader()
    const onComplete = vi.fn()
    const { container } = render(<Loader onComplete={onComplete} />)
    expect(container.querySelectorAll('.loader-panel')).toHaveLength(5)
    expect(onComplete).not.toHaveBeenCalled() // stays up until the animation finishes
  })

  it('skips the curtain when Home is re-entered within the same page load', async () => {
    const Loader = await freshLoader()
    const { unmount } = render(<Loader onComplete={vi.fn()} />) // first visit plays + marks the load
    unmount()
    const onComplete = vi.fn()
    const { container } = render(<Loader onComplete={onComplete} />) // in-app return
    expect(container.querySelectorAll('.loader-panel')).toHaveLength(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('hands off immediately under reduced motion', async () => {
    window.matchMedia = matchMedia(true)
    const Loader = await freshLoader()
    const onComplete = vi.fn()
    render(<Loader onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
