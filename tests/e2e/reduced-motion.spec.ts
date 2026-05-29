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
