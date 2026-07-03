import { test, expect } from '@playwright/test'

// The homepage testimonials section is client-fetched from /api/testimonials, so
// we can drive it deterministically by stubbing that endpoint — no DB required.
test.describe('Public testimonials section', () => {
  test('renders the testimonials returned by the API', async ({ page }) => {
    await page.route('**/api/testimonials', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, client_name: 'Jane Doe', company: 'Acme', role: 'CMO', body: 'Exceptional work.', rating: 5, visible: true },
          { id: 2, client_name: 'John Roe', company: 'Globex', role: 'Director', body: 'Stunning imagery.', rating: 5, visible: true },
        ]),
      }),
    )

    await page.goto('/')
    await expect(page.getByText('Client Voices')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Jane Doe')).toBeVisible()
    await expect(page.getByText(/Exceptional work/)).toBeVisible()
    await expect(page.getByText('John Roe')).toBeVisible()
  })

  test('renders nothing when there are no testimonials', async ({ page }) => {
    await page.route('**/api/testimonials', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Client Voices')).toHaveCount(0)
  })
})
