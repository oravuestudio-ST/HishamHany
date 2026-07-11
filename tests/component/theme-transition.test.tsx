import { describe, it, expect, vi, afterEach } from 'vitest'
import { startThemeTransition } from '@/lib/theme-transition'

type StubTransition = {
  ready: Promise<void>
  updateCallbackDone: Promise<void>
  finished: Promise<void>
}

describe('startThemeTransition', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (document as unknown as Record<string, unknown>).startViewTransition
    delete (document.documentElement as unknown as Record<string, unknown>).animate
  })

  it('applies the theme instantly when the View Transitions API is unsupported', () => {
    const applyTheme = vi.fn()
    startThemeTransition(applyTheme)
    expect(applyTheme).toHaveBeenCalledTimes(1)
  })

  it('applies the theme instantly under reduced motion, even when the API is supported', () => {
    const startViewTransition = vi.fn()
    ;(document as unknown as Record<string, unknown>).startViewTransition = startViewTransition
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(prefers-reduced-motion: reduce)' }))

    const applyTheme = vi.fn()
    startThemeTransition(applyTheme)

    expect(applyTheme).toHaveBeenCalledTimes(1)
    expect(startViewTransition).not.toHaveBeenCalled()
  })

  it('drives the theme change through document.startViewTransition when supported', async () => {
    let updateCallback: (() => void) | undefined
    const ready = Promise.resolve()
    const startViewTransition = vi.fn((cb: () => void): StubTransition => {
      updateCallback = cb
      return { ready, updateCallbackDone: Promise.resolve(), finished: Promise.resolve() }
    })
    ;(document as unknown as Record<string, unknown>).startViewTransition = startViewTransition
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    // Not under test here, but startThemeTransition calls it once `ready` resolves —
    // stub it so that resolution doesn't throw an unhandled rejection after the test ends.
    ;(document.documentElement as unknown as Record<string, unknown>).animate = vi.fn()

    const applyTheme = vi.fn()
    startThemeTransition(applyTheme, { duration: 300 })

    expect(startViewTransition).toHaveBeenCalledTimes(1)
    // The transition's update callback is what actually flips the theme.
    expect(applyTheme).not.toHaveBeenCalled()
    updateCallback?.()
    expect(applyTheme).toHaveBeenCalledTimes(1)

    await ready
  })

  it('animates a clip-path circle expanding from the click origin once the transition is ready', async () => {
    const ready = Promise.resolve()
    ;(document as unknown as Record<string, unknown>).startViewTransition = vi.fn((cb: () => void): StubTransition => {
      cb()
      return { ready, updateCallbackDone: Promise.resolve(), finished: Promise.resolve() }
    })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('innerWidth', 1000)
    vi.stubGlobal('innerHeight', 800)

    const animate = vi.fn()
    ;(document.documentElement as unknown as Record<string, unknown>).animate = animate

    const button = document.createElement('button')
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 50, width: 20, height: 20,
      right: 120, bottom: 70, x: 100, y: 50, toJSON: () => {},
    } as DOMRect)

    startThemeTransition(vi.fn(), { originEl: button, duration: 300 })
    await ready

    expect(animate).toHaveBeenCalledTimes(1)
    const [keyframes, options] = animate.mock.calls[0]
    expect(keyframes.clipPath[0]).toBe('circle(0px at 110px 60px)')
    expect(keyframes.clipPath[1]).toMatch(/^circle\(\d+(\.\d+)?px at 110px 60px\)$/)
    expect(options).toMatchObject({ duration: 300, pseudoElement: '::view-transition-new(root)' })
  })

  it('falls back to the viewport center when no origin element is given', async () => {
    const ready = Promise.resolve()
    ;(document as unknown as Record<string, unknown>).startViewTransition = vi.fn((cb: () => void): StubTransition => {
      cb()
      return { ready, updateCallbackDone: Promise.resolve(), finished: Promise.resolve() }
    })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('innerWidth', 1000)
    vi.stubGlobal('innerHeight', 800)

    const animate = vi.fn()
    ;(document.documentElement as unknown as Record<string, unknown>).animate = animate

    startThemeTransition(vi.fn())
    await ready

    const [keyframes] = animate.mock.calls[0]
    expect(keyframes.clipPath[0]).toBe('circle(0px at 500px 400px)')
  })
})
