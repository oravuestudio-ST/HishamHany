import { test, expect } from '@playwright/test'

test.describe('404', () => {
  test('keeps the site chrome and offers a way to start a project', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('footer')).toHaveCount(1)
    await expect(page.getByRole('link', { name: /start a project/i })).toHaveAttribute('href', '/contact')
  })
})
