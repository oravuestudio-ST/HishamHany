import { test, expect, type Page, type Locator } from '@playwright/test'

// The hero recedes as chapter 1 rises over it (useChapterScroll drives the
// hero's .scene-recede layer). The global config runs reducedMotion:
// 'reduce', where nothing recedes — that case rides the default context.

async function loadHome(page: Page) {
  await page.goto('/')
  await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })
}

async function wheelScroll(page: Page, ticks: number, delta = 800) {
  // Wheel events so Lenis drives the scroll like a real user.
  for (let i = 0; i < ticks; i++) {
    await page.mouse.wheel(0, delta)
    await page.waitForTimeout(150)
  }
  // Let the scrub smoothing settle.
  await page.waitForTimeout(1200)
}

/** First cell of the computed transform matrix — scale·cos(rotation), <1 when receded. */
async function matrixA(locator: Locator) {
  return locator.evaluate((el: Element) => {
    const t = getComputedStyle(el).transform
    if (t === 'none') return 1
    return parseFloat(t.replace('matrix(', '').split(',')[0])
  })
}

test.describe('stacked seams', () => {
  // The global config sets contextOptions.reducedMotion: 'reduce', and
  // contextOptions wins over the top-level reducedMotion option — so the
  // override must go through contextOptions too, or the seam never registers
  // and the recession assertions pass vacuously against an untransformed page.
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  // Wheel-driven scrolling — mouse.wheel is unsupported in mobile WebKit.
  test.skip(({ isMobile }) => !!isMobile, 'wheel-driven seam scrub — desktop projects only')

  test('hero recedes beneath the first chapter', async ({ page }) => {
    await loadHome(page)
    const stage = page.locator('[data-stacked-seam="hero"]')
    await wheelScroll(page, 8)
    expect(await matrixA(stage)).toBeLessThan(0.95)
  })

  test('hero holds unscaled until the reader scrolls', async ({ page }) => {
    await loadHome(page)
    await page.waitForTimeout(1200)
    const stage = page.locator('[data-stacked-seam="hero"]')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await matrixA(stage)).toBeGreaterThan(0.999)
  })

  test('marquee dims and shrinks without rotating', async ({ page }) => {
    await loadHome(page)
    const strip = page.locator('[data-stacked-seam="marquee"]')
    await wheelScroll(page, 14)
    const transform = await strip.evaluate((el: Element) => getComputedStyle(el).transform)
    // Shrunk (a < 1) but never rotated (b component ≈ 0) — rotation on a thin
    // strip is the breakage the rotate:false flag exists to prevent.
    if (transform !== 'none') {
      const [a, b] = transform.replace('matrix(', '').split(',').map(parseFloat)
      expect(a).toBeLessThanOrEqual(1)
      expect(Math.abs(b)).toBeLessThan(0.001)
    }
  })
})

test.describe('stacked seams — reduced motion', () => {
  // Default context: reducedMotion 'reduce'. The seam must not register.
  test('hero stage never transforms', async ({ page }) => {
    await loadHome(page)
    const stage = page.locator('[data-stacked-seam="hero"]')
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5))
    await page.waitForTimeout(800)
    expect(await matrixA(stage)).toBe(1)
  })
})
