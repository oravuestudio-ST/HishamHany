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

function isTouch(page: Page): Promise<boolean> {
  return page.evaluate(
    () => navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches
  )
}

test.describe('Hero slot reveal on touch vs. desktop', () => {
  test('touch autoplays the reveal open with no scroll; desktop waits for scroll', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForSelector('.hero-reveal', { timeout: 30_000 })

    if (await isTouch(page)) {
      // Phone/tablet: the reveal plays itself once the loader lifts — the slot
      // opens to full-bleed without the user scrolling at all.
      await expect
        .poll(() => slotRatio(page, '.hero-reveal'), { timeout: 15_000 })
        .toBeLessThan(0.08)
      // No pin on touch — nothing to fight the touch scroll / iOS address bar.
      expect(await page.locator('.pin-spacer').count()).toBe(0)

      // The headline does NOT auto-fade — it holds over the open photo until
      // the user scrolls (the lift is scroll-relative).
      const copyOpacity = () =>
        page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.hero-copy')!).opacity))
      expect(await copyOpacity()).toBeGreaterThan(0.9)
      // Scrolling lifts and fades it away.
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.6))
      await expect.poll(copyOpacity, { timeout: 5_000 }).toBeLessThan(0.5)
    } else {
      // Desktop: no autoplay. The slot stays closed until the user scrolls the
      // pinned section (the reveal is scroll-driven here).
      await page.waitForTimeout(4000)
      expect(await slotRatio(page, '.hero-reveal')).toBeGreaterThan(0.2)
    }
  })

  test('case-study cover autoplays on touch, waits for scroll on desktop', async ({ page }) => {
    await page.goto('/work/mercedes-gle-450-4matic')
    await page.waitForSelector('.cover-media', { timeout: 30_000 })

    if (await isTouch(page)) {
      // Case covers share the hook — they autoplay open (quicker than the hero).
      await expect
        .poll(() => slotRatio(page, '.cover-media'), { timeout: 15_000 })
        .toBeLessThan(0.08)
      expect(await page.locator('.pin-spacer').count()).toBe(0)
    } else {
      await page.waitForTimeout(2500)
      expect(await slotRatio(page, '.cover-media')).toBeGreaterThan(0.2)
    }
  })
})
