import type Lenis from 'lenis'

/**
 * The live Lenis instance, registered by components/SmoothScroll while smooth
 * scrolling is on (null under reduced motion or when the visitor turned it off).
 */
let instance: Lenis | null = null
let locked = false

export function setLenis(lenis: Lenis | null) {
  instance = lenis
  // A lock taken before Lenis mounted (it loads lazily) still applies to it.
  if (lenis && locked) lenis.stop()
}

/** The live instance, if any — for programmatic scrolls that must respect it. */
export function getLenis(): Lenis | null {
  return instance
}

/**
 * Lock or release page scrolling for overlays (menu, lightbox). Lenis scrolls
 * programmatically from wheel events, so overflow alone doesn't stop it.
 *
 * The lock goes on <html>, not <body>: html carries overflow-x: clip, so a
 * body overflow wouldn't propagate to the viewport — body would become its own
 * scroll container instead, which both fails to lock the page and turns every
 * position: sticky stage (the home chapters) back into normal flow.
 */
export function lockScroll(next: boolean) {
  locked = next
  document.documentElement.style.overflow = next ? 'hidden' : ''
  if (next) instance?.stop()
  else instance?.start()
}
