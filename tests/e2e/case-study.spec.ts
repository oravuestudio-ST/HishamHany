import { test, expect } from '@playwright/test'

// Slug of the first project (see lib/projects.ts: "Glitch Club — Outdoor").
const SLUG = 'glitch-club-outdoor'

test.describe('Case-study page', () => {
  test('renders title, gallery, and prev/next navigation', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await page.goto(`/work/${SLUG}`)

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText(/glitch club/i)

    // Gallery has at least one image.
    const imgs = page.locator('main img')
    expect(await imgs.count()).toBeGreaterThan(0)

    // Prev/next nav present.
    await expect(page.getByText('Previous')).toBeVisible()
    await expect(page.getByText('Next')).toBeVisible()

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('opens and closes the lightbox via keyboard', async ({ page }) => {
    await page.goto(`/work/${SLUG}`)
    await page.locator('main img').first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('unknown slug returns 404', async ({ page }) => {
    const res = await page.goto('/work/not-a-real-project')
    expect(res?.status()).toBe(404)
  })
})
