import { test, expect } from '@playwright/test'

/**
 * The fullscreen menu as a keyboard and touch user meets it. /about is used
 * because it has no pinned hero gating the header.
 */
test.describe('Menu', () => {
  test('opens as a dialog, takes focus, and closes on Escape back to the toggle', async ({ page }) => {
    await page.goto('/about')
    const toggle = page.getByRole('button', { name: 'Open menu' })
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    // Focus the toggle directly: WebKit's plain Tab skips links/buttons.
    await toggle.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Menu' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
    await expect(dialog.getByRole('link', { name: /01\s*Home/i })).toBeFocused()
    await expect(page.locator('main')).toHaveAttribute('inert', '')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
    await expect(page.locator('main')).not.toHaveAttribute('inert', '')
  })

  test('menu links navigate straight away', async ({ page }) => {
    await page.goto('/about')
    await page.getByRole('button', { name: 'Open menu' }).click({ timeout: 30_000 })
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: /03\s*Services/i }).click()
    await expect(page).toHaveURL(/\/services$/, { timeout: 5_000 })
  })

  test('the toggle takes taps well outside its 13px-tall glyph', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch target check runs on the mobile profiles')
    await page.goto('/about')
    const toggle = page.getByRole('button', { name: 'Open menu' })
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    const box = (await toggle.boundingBox())!
    // 18px below the glyph's centre is outside its own box but inside the 44px hit area.
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label') ?? null,
      [box.x + box.width / 2, box.y + box.height / 2 + 18]
    )
    expect(hit).toBe('Open menu')
  })
})
