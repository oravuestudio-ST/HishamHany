import { test, expect } from '@playwright/test'

test.describe('Journal', () => {
  test('index lists posts and links to a post', async ({ page }) => {
    await page.goto('/journal')
    await expect(page.locator('h1')).toContainText(/notes on light/i)

    const links = page.locator('a[href^="/journal/"]')
    expect(await links.count()).toBeGreaterThan(0)
  })

  test('a post renders its title and body', async ({ page }) => {
    await page.goto('/journal')
    await page.locator('a[href^="/journal/"]').first().click()

    await expect(page).toHaveURL(/\/journal\/.+/)
    await expect(page.locator('article h1')).toHaveCount(1)
    // MDX body rendered into the prose container.
    await expect(page.locator('.prose-journal p').first()).toBeVisible()
  })

  test('unknown post returns 404', async ({ page }) => {
    const res = await page.goto('/journal/not-a-real-entry')
    expect(res?.status()).toBe(404)
  })
})
