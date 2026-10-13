import { test, expect } from '@playwright/test'
import { projects } from '../../lib/projects'

// Without JavaScript the home page is the finished composition: hero, every
// scene, the index and the commission — no curtain, nothing pre-hidden.
test.use({ javaScriptEnabled: false })

test.describe('Home without JavaScript', () => {
  test('is fully legible and navigable', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // The intro only exists when the inline bootstrap runs.
    await expect(page.locator('.intro-overlay')).toBeHidden()

    const hero = page.locator('#hero-section img')
    await expect(hero).toBeVisible()
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 15_000 }).toBe(true)

    // Scenes are plain plates — open, unclipped.
    const plates = page.locator('#work .plate-clip')
    await expect(plates).toHaveCount(6)
    for (const clip of await plates.evaluateAll((els) => els.map((el) => getComputedStyle(el).clipPath))) {
      expect(clip).toBe('none')
    }

    const hrefs = await page.locator('a[href^="/work/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    expect(new Set(hrefs).size).toBe(projects.length)

    await expect(page.locator('#contact')).toBeVisible()
    await expect(page.locator('.site-header')).toHaveCSS('opacity', '1')
  })
})
