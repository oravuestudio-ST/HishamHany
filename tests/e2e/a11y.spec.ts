import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Gate on the structural a11y rules we own and have addressed: labels, alt text,
// title/lang, heading order, accessible names. Subjective contrast on decorative
// micro-text is left to the manual QA pass rather than failing CI deterministically.
const RULES = [
  'label',
  'image-alt',
  'document-title',
  'html-has-lang',
  'heading-order',
  'link-name',
  'button-name',
  'aria-required-attr',
  'duplicate-id',
]

test.describe('Accessibility (axe)', () => {
  test('home has no structural a11y violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    const results = await new AxeBuilder({ page })
      .withRules(RULES)
      .analyze()

    expect(
      results.violations,
      JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2)
    ).toEqual([])
  })

  test('exactly one H1 on the page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('admin login page has no structural a11y violations', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible()

    const results = await new AxeBuilder({ page }).withRules(RULES).analyze()
    expect(
      results.violations,
      JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2),
    ).toEqual([])
  })

  // Every public route passes the same structural gate; one h1 each.
  for (const route of ['/journal', '/work/glitch-club-outdoor', '/portfolio', '/services', '/about', '/contact']) {
    test(`${route} has no structural a11y violations and one h1`, async ({ page }) => {
      await page.goto(route)
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(1)

      const results = await new AxeBuilder({ page }).withRules(RULES).analyze()
      expect(
        results.violations,
        JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2),
      ).toEqual([])
    })
  }
})

test.describe('Keyboard navigation', () => {
  // WebKit mirrors macOS Safari's default keyboard behavior: plain Tab skips
  // links unless the OS "Full Keyboard Access" setting is on, which Playwright
  // does not emulate. Option+Tab is Safari's gesture that includes links, so
  // the tests use it there; other engines get the plain Tab a real user presses.
  const tabKey = (browserName: string) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab')

  test('Tab moves focus onto an interactive element', async ({ page, browserName }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    await page.keyboard.press(tabKey(browserName))
    const tag = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON']).toContain(tag)
  })

  test('skip link is the first stop and jumps focus to the content', async ({ page, browserName }) => {
    await page.goto('/services')
    await expect(page.locator('h1')).toBeVisible()

    await page.keyboard.press(tabKey(browserName))
    await expect(page.locator('.skip-link')).toBeFocused()

    await page.keyboard.press('Enter')
    const focused = await page.evaluate(() => document.activeElement?.id)
    expect(focused).toBe('main')
  })
})
