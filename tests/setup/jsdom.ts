/**
 * jsdom setup for component tests.
 *
 * jsdom has no layout engine, no WebGL, and no matchMedia/observer APIs that the
 * animation components reach for on mount. We polyfill just enough that:
 *   - `@testing-library/jest-dom` matchers are available,
 *   - components reading `prefers-reduced-motion` get a deterministic answer,
 *   - WebGL components find no GL context and render their static fallback,
 *   - GSAP/Lenis observer-based code doesn't crash on mount.
 */
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// matchMedia: default everything to "no match" (motion allowed, fine pointer off)
// so components take their interactive branch unless a test overrides it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

// IntersectionObserver / ResizeObserver: no-op stubs (GSAP ScrollTrigger, reveal hooks).
class MockObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}
window.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver
window.ResizeObserver = MockObserver as unknown as typeof ResizeObserver

// No GL context in jsdom — force WebGL components down their <img> fallback path.
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never

// rAF/scrollTo used by smooth-scroll and animation loops.
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0)) as never
  window.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as never
}
window.scrollTo = vi.fn() as never
