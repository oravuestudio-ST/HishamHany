import { test, expect } from '@playwright/test'

/**
 * The admin list pages are server components that read the database directly and
 * sit behind the iron-session gate, so a real end-to-end pass needs BOTH a live
 * database and the admin password. When those aren't configured we skip rather
 * than fail — the CRUD route logic itself is covered exhaustively by the mocked
 * integration tests in tests/unit/admin-*-route.test.ts.
 *
 * To run locally:  DATABASE_URL=... ADMIN_PASSWORD=... SESSION_SECRET=... npm run test:e2e
 */
const CAN_RUN = Boolean(process.env.DATABASE_URL && process.env.ADMIN_PASSWORD)

test.describe('Admin CRUD (requires DB + ADMIN_PASSWORD)', () => {
  test.skip(!CAN_RUN, 'Set DATABASE_URL + ADMIN_PASSWORD to run admin CRUD against a real database.')

  test.beforeEach(async ({ page }) => {
    // Log in through the UI to obtain a real session cookie.
    await page.goto('/admin/login')
    await page.locator('input[type="password"]').fill(process.env.ADMIN_PASSWORD!)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('dashboard shows the stat cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Projects')).toBeVisible()
    await expect(page.getByText('Testimonials')).toBeVisible()
  })

  test('projects page lists rows and the new-project action', async ({ page }) => {
    await page.goto('/admin/projects')
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
    await expect(page.getByRole('link', { name: /new project/i })).toBeVisible()
  })

  test('testimonials page renders', async ({ page }) => {
    await page.goto('/admin/testimonials')
    await expect(page.getByRole('heading', { name: 'Testimonials' })).toBeVisible()
  })

  test('analytics page renders the 30-day view', async ({ page }) => {
    await page.goto('/admin/analytics')
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible()
  })

  test('logging out returns to a protected state', async ({ page }) => {
    await page.getByRole('button', { name: /log out/i }).click()
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
