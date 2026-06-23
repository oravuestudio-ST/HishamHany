import { test, expect } from '@playwright/test'

// These paths exercise the auth gate only — they never touch the database, so
// they run reliably without a configured Neon instance.
test.describe('Admin authentication', () => {
  test('redirects to the login page when unauthenticated', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('renders the login form', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible()
  })

  test('shows the server error message on an invalid password', async ({ page }) => {
    await page.route('**/api/admin/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid password' }),
      }),
    )

    await page.goto('/admin/login')
    await page.locator('input[type="password"]').fill('wrong-password')
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page.getByText(/invalid password/i)).toBeVisible()
  })

  test('protected admin API returns 401 without a session', async ({ page }) => {
    for (const path of ['/api/admin/projects', '/api/admin/testimonials', '/api/admin/analytics']) {
      const res = await page.request.get(path)
      expect(res.status(), path).toBe(401)
    }
  })
})
