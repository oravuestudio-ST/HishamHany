import { test, expect, type Page } from '@playwright/test'

// The global config forces reduced motion via `contextOptions.reducedMotion`
// (which snaps the reveal open). This suite is about the *animated* reveal, so
// opt back in — and it must be overridden at the same contextOptions key, since
// the top-level `reducedMotion` option does not win over contextOptions.
test.use({ contextOptions: { reducedMotion: 'no-preference' } })

/**
 * How closed the slot is: the reveal image's right clip-path inset as a fraction
 * of its width. ~0 = open/full-bleed, ~0.34 = the closed centred slot.
 */
async function slotRatio(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) return -1
    const cp = getComputedStyle(el).clipPath // e.g. "inset(0% 34% 0% 34%)" or "inset(0px ...)"
    if (!cp.startsWith('inset')) return -1 // "none" — can't measure
    const w = el.getBoundingClientRect().width || 1
    const parts = cp.slice(cp.indexOf('(') + 1, cp.lastIndexOf(')')).trim().split(/\s+/)
    const toPx = (v: string) => (v.endsWith('%') ? (parseFloat(v) / 100) * w : parseFloat(v))
    // inset shorthand: 1 value = all sides equal; 2+ values → index 1 is `right`.
    const right = parts.length === 1 ? toPx(parts[0]) : toPx(parts[1])
    return right / w
  }, selector)
}

// The home hero no longer uses the slot reveal (its opening is the intro's
// aperture — see immersive-home.spec.ts). Case-study covers still do.
test.describe('Case-study cover slot reveal', () => {
  // No pin on any device: the cover opens on arrival so the reader never has
  // to scroll through it to reach the photographs.
  test('opens on arrival without a pin, on touch and desktop', async ({ page }) => {
    await page.goto('/work/mercedes-benz-gle-450-detail-study')
    await page.waitForSelector('.cover-media', { timeout: 30_000 })
    await expect
      .poll(() => slotRatio(page, '.cover-media'), { timeout: 15_000 })
      .toBeLessThan(0.08)
    expect(await page.locator('.pin-spacer').count()).toBe(0)
  })
})
