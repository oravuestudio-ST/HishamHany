import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Stub GSAP's timeline so the loader mounts without driving real animations.
// The mock never fires onComplete — only the skip/reduced-motion branches do,
// which lets us tell "curtain is playing" apart from "handed off immediately".
// Also records every .to()/.call() invocation (target/config/position) so we
// can inspect *how* onComplete is wired into the timeline, not just whether
// it fires — see the "signals onComplete before the panels are gone" test.
type TimelineCall = { type: 'to' | 'call'; config?: Record<string, unknown>; fn?: unknown; position?: unknown }
let timelineCalls: TimelineCall[] = []

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    timeline: () => {
      const tl = {
        to: (_target: unknown, config: Record<string, unknown>, position?: unknown) => {
          timelineCalls.push({ type: 'to', config, position })
          return tl
        },
        fromTo: vi.fn().mockReturnThis(),
        call: (fn: unknown, _args?: unknown, position?: unknown) => {
          timelineCalls.push({ type: 'call', fn, position })
          return tl
        },
        kill: vi.fn(),
      }
      return tl
    },
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
  beforeEach(() => {
    window.matchMedia = matchMedia(false)
    timelineCalls = []
  })

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

  // Bug: onComplete (which flips HomeClient's `loaded` state, instantly
  // unmounting the SSR'd SEO-intro fallback and starting the real site's
  // fade-in) was wired as the panels tween's own onComplete — firing exactly
  // when GSAP computes the panels as fully off-screen. React's state update
  // + repaint isn't guaranteed to land in that same frame, so there's a real
  // gap where the curtain is visually gone but React hasn't swapped content
  // yet — exposing the raw SSR fallback text (plain "Selected Work" list)
  // uncovered for a beat. Fix: signal onComplete slightly *before* the panels
  // finish traveling (while they still have real coverage left, since
  // expo.inOut back-loads motion into the tail of the tween), so React has
  // finished the swap well before the curtain is actually gone.
  it('signals onComplete before the panels finish sliding away, not exactly when they do', async () => {
    const Loader = await freshLoader()
    const onComplete = vi.fn()
    render(<Loader onComplete={onComplete} />)

    const panelsTo = timelineCalls.find(
      (c) => c.type === 'to' && c.config?.yPercent === -100
    )
    expect(panelsTo).toBeDefined()
    // Not tied to the tween's own true completion...
    expect(panelsTo!.config?.onComplete).toBeUndefined()

    // ...instead fired via a separate call scheduled before that tween ends.
    const signal = timelineCalls.find((c) => c.type === 'call' && c.fn === onComplete)
    expect(signal).toBeDefined()
    expect(String(signal!.position)).toMatch(/^-=/)
  })
})
