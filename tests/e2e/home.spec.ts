import { test, expect } from '@playwright/test'
import { projects } from '../../lib/projects'

test.describe('Home page', () => {
  test('loads, reveals content, and shows every major section', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await page.goto('/')

    // Wait for the last section.
    const contact = page.locator('#contact')
    await expect(contact).toBeVisible({ timeout: 30_000 })

    // Major sections present: hero, the chapter journey, the index, and the
    // lower page.
    await expect(page.locator('#hero-section')).toBeAttached()
    await expect(page.locator('#work')).toBeAttached()
    await expect(page.locator('#index')).toBeAttached()
    await expect(page.locator('#about')).toBeAttached()
    await expect(page.locator('#services')).toBeAttached()

    // Exactly one <h1> for document structure.
    await expect(page.locator('h1')).toHaveCount(1)

    // No uncaught runtime errors during load.
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('the chapter journey hangs six real project photographs', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    const plates = page.locator('#work .chapter .plate-img')
    await expect(plates).toHaveCount(6)

    // The plates are lazy (only the hero is priority) — scroll the first into
    // view the way a reader would so every engine's lazy-load distance fires.
    const first = plates.first()
    await first.scrollIntoViewIfNeeded()
    await expect(first).toBeVisible()
    await expect(first).toHaveJSProperty('complete', true)
  })

  test('the index links every project', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })
    const hrefs = await page.locator('#index a[href^="/work/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    expect(new Set(hrefs).size).toBe(projects.length)
  })

  test('favicon is served (no 404)', async ({ page }) => {
    const res = await page.request.get('/favicon.ico')
    expect(res.status()).toBeLessThan(400)
  })
})
