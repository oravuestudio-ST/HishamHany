import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

describe('mask-wipe failsafes', () => {
  afterEach(() => vi.useRealTimers())

  // A route that throws or stalls never mounts a template to lift the
  // surface; without this the visitor is left staring at solid ink.
  it('lifts itself if no incoming page claims the surface in time', async () => {
    vi.useFakeTimers()
    stubReducedMotion(false)
    const { wipeTo, isCovered, WIPE_FAILSAFE_MS } = await import('@/animations/transitions')

    wipeTo(vi.fn())
    expect(isCovered()).toBe(true)
    vi.advanceTimersByTime(WIPE_FAILSAFE_MS)
    expect(isCovered()).toBe(false)
  })

  it('a normal lift disarms the failsafe (no second lift later)', async () => {
    vi.useFakeTimers()
    stubReducedMotion(false)
    const { wipeTo, liftWipe, WIPE_FAILSAFE_MS } = await import('@/animations/transitions')

    wipeTo(vi.fn())
    liftWipe()
    const callsAfterLift = gsapTo.mock.calls.length
    vi.advanceTimersByTime(WIPE_FAILSAFE_MS * 2)
    expect(gsapTo.mock.calls.length).toBe(callsAfterLift)
  })

  it('pressing Back during the cover cancels the pending navigation', async () => {
    stubReducedMotion(false)
    let finishCover: (() => void) | undefined
    gsapTo.mockImplementationOnce((_t: unknown, vars: { onComplete?: () => void }) => {
      finishCover = vars.onComplete
    })
    const { wipeTo, isCovered } = await import('@/animations/transitions')

    const navigate = vi.fn()
    wipeTo(navigate)
    window.dispatchEvent(new PopStateEvent('popstate'))
    finishCover?.()

    expect(navigate).not.toHaveBeenCalled()
    expect(isCovered()).toBe(false)
  })
})
