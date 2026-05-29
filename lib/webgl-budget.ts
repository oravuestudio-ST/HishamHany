// Global budget for simultaneous WebGL contexts.
//
// Browsers cap live WebGL contexts (~8–16 before the oldest is dropped with a
// "Too many active WebGL contexts" warning). The portfolio grid can have many
// cards in/near the viewport at once on tall screens, so we cap how many run a
// live renderer concurrently. Cards over budget keep their static <img> fallback.
export const MAX_WEBGL_CONTEXTS = 8

let active = 0

/** Reserve a context slot. Returns false if the budget is exhausted. */
export function acquireWebGLContext(): boolean {
  if (active >= MAX_WEBGL_CONTEXTS) return false
  active++
  return true
}

/** Release a previously-acquired slot. */
export function releaseWebGLContext(): void {
  active = Math.max(0, active - 1)
}

// Test-only inspectors.
export function __activeWebGLContexts(): number {
  return active
}
export function __resetWebGLBudget(): void {
  active = 0
}
