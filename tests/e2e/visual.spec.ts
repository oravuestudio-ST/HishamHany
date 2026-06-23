import { test, expect, Page } from '@playwright/test'

/**
 * Visual-regression baselines (Chromium-only — see the `visual` project in
 * playwright.config.ts). Motion is frozen via the global `reducedMotion: 'reduce'`
 * context option. Remote/loaded images are masked so CDN variance and lazy WebGL
 * swaps don't cause false diffs — layout, type, and spacing are what we lock in.
 *
 * First run (creates baselines):  npm run test:visual:update
 * Subsequent runs (compare):       npm run test:visual
 */

const SCREENSHOT = {
  maxDiffPixelRatio: 0.02,
  animations: 'disabled' as const,
}

async function settle(page: Page) {
  await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready)
  await page.waitForLoadState('networkidle')
}

test.describe('Visual regression — homepage sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })
    await settle(page)
  })

  const sections: { id: string; name: string }[] = [
    { id: '#hero-section', name: 'hero' },
    { id: '#portfolio-section', name: 'portfolio' },
    { id: '#about', name: 'about' },
    { id: '#services', name: 'services' },
    { id: '#contact', name: 'contact' },
  ]

  for (const { id, name } of sections) {
    test(`section: ${name}`, async ({ page }) => {
      const section = page.locator(id)
      await section.scrollIntoViewIfNeeded()
      await expect(section).toHaveScreenshot(`${name}.png`, {
        ...SCREENSHOT,
        mask: [page.locator(`${id} img`)],
      })
    })
  }
})

test.describe('Visual regression — case study', () => {
  test('case-study layout', async ({ page }) => {
    await page.goto('/work/glitch-club-outdoor')
    await expect(page.locator('h1')).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('case-study.png', {
      ...SCREENSHOT,
      fullPage: true,
      mask: [page.locator('main img')],
    })
  })
})
