import { test, expect } from '@playwright/test'

// Hero A/B test (lib/experiments.ts). Assignment is a cookie set by
// middleware; variant B is a rewrite, so the URL stays "/".
const COOKIE = 'hh_exp_hero'

test.describe('hero A/B test', () => {
  test('a new visitor is assigned and sees the arm the cookie names', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await page.goto('/')
    const cookie = (await context.cookies()).find((c) => c.name === COOKIE)
    expect(cookie?.value).toMatch(/^[ab]\./)
    const cta = page.getByRole('link', { name: /commission a shoot/i })
    if (cookie!.value.startsWith('b')) await expect(cta).toBeVisible()
    else await expect(cta).toHaveCount(0)
    await context.close()
  })

  test('variant B shows the CTA at "/", stays indexable, and leads to /contact', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: {
        cookies: [{ name: COOKIE, value: 'b.e2evariant0000', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
        origins: [],
      },
    })
    const page = await context.newPage()
    await page.goto('/')
    expect(new URL(page.url()).pathname).toBe('/')
    // Served at "/": a noindex here would deindex the home page for crawlers in this arm.
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\/[^/]+\/?$/)
    const beacon = page.waitForRequest((r) => r.url().endsWith('/api/ab') && r.method() === 'POST')
    await page.getByRole('link', { name: /commission a shoot/i }).click()
    await beacon
    await expect(page).toHaveURL(/\/contact$/)
    await context.close()
  })

  test('the control keeps the original hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /commission a shoot/i })).toHaveCount(0)
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
  })

  test('the variant page cannot be reached directly', async ({ page }) => {
    await page.goto('/home-b')
    expect(new URL(page.url()).pathname).toBe('/')
  })
})
