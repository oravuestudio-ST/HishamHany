import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('loads, reveals content, and shows every major section', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await page.goto('/')

    // Loader reveals the main content (opacity 0 -> 1). Wait for the last section.
    const contact = page.locator('#contact')
    await expect(contact).toBeVisible({ timeout: 30_000 })

    // Major sections present.
    await expect(page.locator('#hero-section')).toBeAttached()
    await expect(page.locator('#portfolio-section')).toBeAttached()
    await expect(page.locator('#about')).toBeAttached()
    await expect(page.locator('#services')).toBeAttached()

    // Exactly one <h1> for document structure.
    await expect(page.locator('h1')).toHaveCount(1)

    // No uncaught runtime errors during load.
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('case-study feed renders real project images', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    const images = page.locator('.case-study-row img')
    expect(await images.count()).toBeGreaterThan(0)

    // `#contact` being visible only means it's not display:none — Lenis
    // renders the whole document in normal flow, so nothing has actually
    // scrolled yet. The row images are native loading="lazy"; scroll them
    // into view for real, the way a reader would, so every engine's lazy-load
    // distance (WebKit's is much shorter than Chromium's) actually fires.
    const firstImage = images.first()
    await firstImage.scrollIntoViewIfNeeded()
    await expect(firstImage).toBeVisible()
    await expect(firstImage).toHaveJSProperty('complete', true)
  })

  test('favicon is served (no 404)', async ({ page }) => {
    const res = await page.request.get('/favicon.ico')
    expect(res.status()).toBeLessThan(400)
  })
})
