import { describe, it, expect, vi, beforeEach } from 'vitest'

// Drive the wipe's state machine by resolving every gsap.to synchronously.
const gsapTo = vi.fn((_target: unknown, vars: { onComplete?: () => void }) => {
  vars.onComplete?.()
})
const gsapSet = vi.fn()

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    to: (...args: unknown[]) => gsapTo(...(args as [unknown, { onComplete?: () => void }])),
    set: (...args: unknown[]) => gsapSet(...args),
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

function stubReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(prefers-reduced-motion: reduce)' ? matches : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  vi.resetModules()
  gsapTo.mockClear()
  gsapSet.mockClear()
  document.body.innerHTML = ''
})

describe('mask-wipe transition state machine', () => {
  it('covers, then navigates, then lifts — one continuous gesture', async () => {
    stubReducedMotion(false)
    const { wipeTo, liftWipe, isCovered } = await import('@/animations/transitions')

    const navigate = vi.fn()
    wipeTo(navigate)
    // gsap.to resolves synchronously in this harness: cover completed,
    // navigation fired while the surface holds.
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(isCovered()).toBe(true)
    // The surface singleton was appended to <body>, hidden from AT.
    const surface = document.body.querySelector('[aria-hidden="true"]')
    expect(surface).not.toBeNull()

    // The incoming page lifts the surface off.
    const done = vi.fn()
    expect(liftWipe(done)).toBe(true)
    expect(done).toHaveBeenCalledTimes(1)
    expect(isCovered()).toBe(false)
  })

  it('liftWipe is a no-op when nothing is covering (fresh load, back/forward)', async () => {
    stubReducedMotion(false)
    const { liftWipe } = await import('@/animations/transitions')
    expect(liftWipe()).toBe(false)
  })

  it('reduced motion: navigates immediately, no wipe, no surface', async () => {
    stubReducedMotion(true)
    const { wipeTo, isCovered } = await import('@/animations/transitions')

    const navigate = vi.fn()
    wipeTo(navigate)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(isCovered()).toBe(false)
    expect(gsapTo).not.toHaveBeenCalled()
    expect(document.body.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})
