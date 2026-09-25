import type Lenis from 'lenis'

/**
 * The live Lenis instance, registered by components/SmoothScroll while smooth
 * scrolling is on (null under reduced motion or when the visitor turned it off).
 */
let instance: Lenis | null = null

export function setLenis(lenis: Lenis | null) {
  instance = lenis
}

/**
 * Lock or release page scrolling for overlays (menu, lightbox). Lenis scrolls
 * programmatically from wheel events, so body overflow alone doesn't stop it.
 */
export function lockScroll(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : ''
  if (locked) instance?.stop()
  else instance?.start()
}
