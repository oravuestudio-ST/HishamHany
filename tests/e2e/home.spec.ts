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

  test('project images render a fallback <img> (works without WebGL)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    const fallbacks = page.locator('.webgl-image .webgl-image-fallback')
    // Web-first assertion: the portfolio's WebGLImage components are dynamically
    // imported (ssr:false), so wait for the first fallback to mount rather than
    // reading count() the instant #contact appears.
    await expect(fallbacks.first()).toBeVisible()
    expect(await fallbacks.count()).toBeGreaterThan(0)
    // First fallback should have a real source loaded.
    await expect(fallbacks.first()).toHaveJSProperty('complete', true)
  })

  test('favicon is served (no 404)', async ({ page }) => {
    const res = await page.request.get('/favicon.ico')
    expect(res.status()).toBeLessThan(400)
  })
})
