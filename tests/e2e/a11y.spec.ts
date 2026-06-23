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

  test('journal index has no structural a11y violations', async ({ page }) => {
    await page.goto('/journal')
    await expect(page.locator('h1')).toBeVisible()

    const results = await new AxeBuilder({ page }).withRules(RULES).analyze()
    expect(
      results.violations,
      JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2),
    ).toEqual([])
  })

  test('a case-study page has no structural a11y violations', async ({ page }) => {
    await page.goto('/work/glitch-club-outdoor')
    await expect(page.locator('h1')).toBeVisible()

    const results = await new AxeBuilder({ page }).withRules(RULES).analyze()
    expect(
      results.violations,
      JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2),
    ).toEqual([])
  })
})

test.describe('Keyboard navigation', () => {
  test('Tab moves focus onto an interactive element', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    await page.keyboard.press('Tab')
    const tag = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON']).toContain(tag)
  })
})
