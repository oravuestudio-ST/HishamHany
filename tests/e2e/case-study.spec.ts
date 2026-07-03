import { test, expect } from '@playwright/test'

// Slug of the first project (see lib/projects.ts: "Glitch Club — Outdoor").
const SLUG = 'glitch-club-outdoor'

test.describe('Case-study page (magazine template)', () => {
  test('renders cover, fact sheet, spread, and the next-project invitation', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await page.goto(`/work/${SLUG}`)

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText(/glitch club/i)

    // Fact sheet exposes the core production facts.
    await expect(page.getByText('Client', { exact: true })).toBeVisible()
    await expect(page.getByText('Year', { exact: true })).toBeVisible()

    // The sequenced spread carries at least one image.
    const imgs = page.locator('main img')
    expect(await imgs.count()).toBeGreaterThan(0)

    // Closer: next-project invitation.
    await expect(page.getByText('Next Project')).toBeVisible()

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('opens and closes the spread lightbox via keyboard', async ({ page }) => {
    await page.goto(`/work/${SLUG}`)
    await page.getByRole('button', { name: /open image \d+ of/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('shows related projects that link to other case studies', async ({ page }) => {
    await page.goto(`/work/${SLUG}`)
    await expect(page.getByText('Related Projects')).toBeVisible()
    const relatedLinks = page.locator('.related-card a[href^="/work/"]')
    expect(await relatedLinks.count()).toBeGreaterThan(0)
  })

  test('unknown slug returns 404', async ({ page }) => {
    const res = await page.goto('/work/not-a-real-project')
    expect(res?.status()).toBe(404)
  })
})
