import { test, expect, Page } from '@playwright/test'

async function openContact(page: Page) {
  // The form lives on the dedicated contact page since the IA restructure.
  await page.goto('/contact')
  await expect(page.locator('form')).toBeVisible({ timeout: 30_000 })
}

async function fillForm(page: Page) {
  const form = page.locator('form')
  await form.locator('input[type="text"]').first().fill('Test Client')
  await form.locator('input[type="email"]').fill('client@example.com')
  await form.locator('textarea').fill('I would like to book a fashion campaign.')
}

test.describe('Contact form', () => {
  test('shows confirmation on a successful submission', async ({ page }) => {
    // Intercept the API so no real email is sent.
    await page.route('**/api/contact', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    )

    await openContact(page)
    await fillForm(page)
    await page.getByRole('button', { name: /send inquiry/i }).click()

    await expect(page.getByText(/message received/i)).toBeVisible()
  })

  test('surfaces a server error message', async ({ page }) => {
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests. Please wait a moment before trying again.' }),
      })
    )

    await openContact(page)
    await fillForm(page)
    await page.getByRole('button', { name: /send inquiry/i }).click()

    await expect(page.getByText(/too many requests/i)).toBeVisible()
  })

  test('required fields block native submission when empty', async ({ page }) => {
    let called = false
    await page.route('**/api/contact', (route) => {
      called = true
      return route.fulfill({ status: 200, body: '{}' })
    })

    await openContact(page)
    await page.getByRole('button', { name: /send inquiry/i }).click()
    await page.waitForTimeout(500)

    expect(called).toBe(false) // HTML5 validation prevents the request
  })
})
