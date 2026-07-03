import { test, expect } from '@playwright/test'

// The global config runs with reducedMotion: 'reduce'. Under that preference the
// native cursor must be restored and the custom cursor must stand down.
test.describe('Reduced motion', () => {
  test('restores the native cursor (does not hide it)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    const bodyCursor = await page.evaluate(() => getComputedStyle(document.body).cursor)
    expect(bodyCursor).not.toBe('none')
  })

  test('page is scrollable with native scrolling (Lenis disabled)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    await page.evaluate(() => window.scrollTo(0, 1500))
    await page.waitForTimeout(300)
    const y = await page.evaluate(() => window.scrollY)
    expect(y).toBeGreaterThan(0)
  })

  test('services workflow never pins — all seven steps readable in flow', async ({ page }) => {
    await page.goto('/services')
    const steps = page.locator('.workflow-step')
    await expect(steps).toHaveCount(7)
    // No ScrollTrigger pin spacer means the section flows with the document.
    expect(await page.locator('.pin-spacer').count()).toBe(0)
    // Step bodies are inline (the pinned side panel is absent).
    await expect(steps.first().locator('p')).toBeVisible()
  })

  test('case-study spread images are fully visible without scrubbing', async ({ page }) => {
    await page.goto('/work/mercedes-gle-450-4matic')
    const firstFrame = page.locator('.progressive-frame').first()
    await firstFrame.scrollIntoViewIfNeeded()
    const clip = await firstFrame.evaluate((el) => getComputedStyle(el).clipPath)
    expect(['none', 'inset(0% 0%)', 'inset(0px 0px)']).toContain(clip)
  })

  test('portfolio featured strip swipes natively (no pinning)', async ({ page }) => {
    await page.goto('/portfolio')
    await expect(page.getByText('Featured — scroll')).toBeVisible()
    expect(await page.locator('.pin-spacer').count()).toBe(0)
  })
})

test.describe('Full motion', () => {
  test.use({ reducedMotion: 'no-preference' })

  // The custom cursor (and the cursor:none CSS) only engage on a fine pointer that
  // can hover. Headless browsers don't emulate that, so tie the assertion to the
  // actual media match: where it matches, the native cursor must be hidden; where it
  // doesn't (touch / headless), the native cursor must remain.
  test('cursor visibility follows the hover/pointer media query', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    // Mirror the exact CSS query in globals.css so the assertion is self-consistent.
    const { matches, cursor } = await page.evaluate(() => ({
      matches: matchMedia(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
      ).matches,
      cursor: getComputedStyle(document.body).cursor,
    }))

    if (matches) {
      expect(cursor).toBe('none')
    } else {
      expect(cursor).not.toBe('none')
    }
  })
})
