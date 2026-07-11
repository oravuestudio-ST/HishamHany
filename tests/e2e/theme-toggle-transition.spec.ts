import { test, expect } from '@playwright/test'

// lib/theme-transition.ts wraps the theme flip in a View Transition circle-wipe
// on browsers that support it and motion isn't reduced; everywhere else it's the
// same instant flip HeaderControls always did.

test.describe('Theme toggle transition — reduced motion', () => {
  // Global config default (contextOptions.reducedMotion: 'reduce').
  test('theme flips with no view-transition animation running', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /switch to (dark|light) theme/i })
    await expect(toggle).toBeVisible()

    const before = await page.evaluate(() => document.documentElement.dataset.theme)
    await toggle.click()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
      .not.toBe(before)

    const viewTransitionAnimations = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition')).length,
    )
    expect(viewTransitionAnimations).toBe(0)
  })
})

test.describe('Theme toggle transition — full motion', () => {
  // The `reducedMotion` context/project option doesn't reliably flip
  // `matchMedia('(prefers-reduced-motion: reduce)')` before the first
  // navigation in this browser build — call emulateMedia explicitly after
  // goto, which does take effect (same class of quirk noted for the cursor
  // media query elsewhere in this suite).
  test('theme flips, and drives a clip-path circle-wipe where the View Transitions API is supported', async ({
    page,
  }) => {
    await page.goto('/')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const toggle = page.getByRole('button', { name: /switch to (dark|light) theme/i })
    await expect(toggle).toBeVisible()

    const { reduced } = await page.evaluate(() => ({
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    }))
    expect(reduced).toBe(false)

    // Click and check in one evaluate call: the circle-wipe is a ~500ms WAAPI
    // animation, and the round-trip cost of a separate locator.click() +
    // page.evaluate() is enough to miss it entirely. Also sidesteps the intro
    // hero overlay's pointer interception during its full-motion entrance —
    // out of scope here (see components/Hero.tsx, currently mid-flight/
    // uncommitted from unrelated work).
    const result = await page.evaluate(async () => {
      const btn = document.querySelector('button[aria-label*="Switch to"]') as HTMLButtonElement
      const before = document.documentElement.dataset.theme
      const supportsViewTransitions = typeof document.startViewTransition === 'function'
      btn.click()

      let sawCircleWipe = false
      await new Promise<void>((resolve) => {
        let frames = 0
        const tick = () => {
          frames++
          if (
            document
              .getAnimations()
              .some((a) => (a.effect as KeyframeEffect | null)?.pseudoElement === '::view-transition-new(root)')
          ) {
            sawCircleWipe = true
            resolve()
            return
          }
          if (frames > 30) {
            resolve()
            return
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })

      return { before, after: document.documentElement.dataset.theme, supportsViewTransitions, sawCircleWipe }
    })

    expect(result.after).not.toBe(result.before)
    // Older WebKit doesn't implement the View Transitions API yet — that path
    // falls back to today's instant flip, so only assert the animation where
    // the browser actually supports it (see webkit-tab-semantics-e2e for the
    // same per-engine branching pattern used elsewhere in this suite).
    if (result.supportsViewTransitions) {
      expect(result.sawCircleWipe).toBe(true)
    }
  })
})
