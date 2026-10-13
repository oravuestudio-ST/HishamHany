import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// The immersive home in full motion. The global config forces reduced motion
// through contextOptions, so opt back in at the same key — the top-level
// reducedMotion option does not win over it.
test.use({ contextOptions: { reducedMotion: 'no-preference' } })

const RULES = ['label', 'image-alt', 'document-title', 'html-has-lang', 'heading-order', 'link-name', 'button-name', 'aria-required-attr', 'duplicate-id']

const introState = (page: Page) => page.evaluate(() => document.documentElement.dataset.intro ?? null)

async function waitForIntroDone(page: Page) {
  await expect.poll(() => introState(page), { timeout: 20_000 }).toBe('done')
}

/** Immersive scenes only run on a fine pointer, wide viewport, motion allowed. */
const immersive = (page: Page) =>
  page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 769px)').matches)

test.describe('Intro — the viewfinder', () => {
  test('counts real progress to 100, then opens onto the hero and releases the page', async ({ page }) => {
    await page.goto('/')
    // Claimed by JS and visible while it runs.
    await expect.poll(() => introState(page), { timeout: 10_000 }).toBe('run')
    await expect(page.locator('.intro-overlay')).toBeVisible()
    await expect.poll(() => page.locator('.intro-count').textContent(), { timeout: 15_000 }).toBe('100')

    await waitForIntroDone(page)
    await expect(page.locator('.intro-overlay')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    await expect(page.locator('.site-header')).toHaveCSS('opacity', '1')
  })

  test('largest contentful paint is hero content, early — the intro never delays it', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'LargestContentfulPaint is Chromium-only')
    await page.goto('/')
    await waitForIntroDone(page)
    // Chrome treats an image filling the whole viewport as a background and
    // skips it as a candidate, so the hero's LCP is its headline — painted in
    // the first HTML, under the intro (LCP ignores occlusion), not after it.
    const lcp = await page.evaluate(
      () =>
        new Promise<{ inHero: boolean; time: number }>((resolve) => {
          new PerformanceObserver((list) => {
            const last = list.getEntries().at(-1) as PerformanceEntry & { element?: Element; startTime: number }
            resolve({ inHero: !!last.element?.closest('#hero-section'), time: last.startTime })
          }).observe({ type: 'largest-contentful-paint', buffered: true })
        }),
    )
    expect(lcp.inHero).toBe(true)
    expect(lcp.time).toBeLessThan(2500)
  })

  test('any key fast-forwards it — nobody waits on a flourish', async ({ page }) => {
    await page.goto('/')
    await expect.poll(() => introState(page), { timeout: 10_000 }).toBe('run')
    await page.keyboard.press('Shift')
    await expect.poll(() => introState(page), { timeout: 2_000 }).toBe('done')
  })

  test('plays the opening alone on a repeat visit, and never on reload or a deep link', async ({ page }) => {
    await page.goto('/')
    await waitForIntroDone(page)

    // Same tab, fresh navigation: assets are cached, so only the opening plays.
    await page.goto('/about')
    await page.goto('/')
    await expect.poll(() => introState(page)).not.toBe('full')

    // A reload restores the reader's place — no intro over it.
    await page.reload()
    expect(await introState(page)).toBeNull()

    // A deep link lands on its target.
    await page.goto('/#index')
    expect(await introState(page)).toBeNull()
    await expect(page.locator('#index')).toBeInViewport()
  })
})

test.describe('Chapter journey', () => {
  test('uses no GSAP pins — every scene is CSS sticky', async ({ page }) => {
    await page.goto('/')
    await waitForIntroDone(page)
    expect(await page.locator('.pin-spacer').count()).toBe(0)
  })

  test('a scene holds still, then recedes once the next one covers it', async ({ page }) => {
    await page.goto('/')
    await waitForIntroDone(page)
    test.skip(!(await immersive(page)), 'scroll-driven scenes run on fine-pointer desktops only')

    const first = page.locator('#work .chapter').first()
    const geometry = () =>
      first.evaluate((li) => {
        const stage = li.querySelector('.chapter-stage')!.getBoundingClientRect()
        const t = getComputedStyle(li.querySelector('.scene-recede')!).transform
        const scale = t === 'none' ? 1 : parseFloat(t.replace('matrix(', '').split(',')[0])
        return { stageTop: stage.top, scale, liTop: li.getBoundingClientRect().top, vh: innerHeight }
      })

    // Arrived: the li's top meets the viewport's top — scroll there.
    const arrive = await first.evaluate((li) => scrollY + li.getBoundingClientRect().top)
    await page.evaluate((y) => window.scrollTo(0, y + 40), arrive)
    await page.waitForTimeout(1500)
    const held = await geometry()
    expect(Math.abs(held.stageTop)).toBeLessThan(1) // sticky: pinned at top 0
    expect(held.scale).toBeGreaterThan(0.995)

    // Covered: scroll most of a viewport past the hold.
    const hold = await first.evaluate((li) => (parseFloat(getComputedStyle(li).getPropertyValue('--hold')) / 100) * innerHeight)
    await page.evaluate((y) => window.scrollTo(0, y), arrive + hold + (await page.evaluate(() => innerHeight)) * 0.9)
    await page.waitForTimeout(1800)
    const covered = await geometry()
    expect(covered.scale).toBeLessThan(0.97)
  })

  test('opening the menu over a held scene leaves the scene where it is', async ({ page }) => {
    await page.goto('/')
    await waitForIntroDone(page)
    test.skip(!(await immersive(page)), 'sticky scenes run on fine-pointer desktops only')
    const first = page.locator('#work .chapter').first()
    const arrive = await first.evaluate((li) => scrollY + li.getBoundingClientRect().top)
    await page.evaluate((y) => window.scrollTo(0, y + 40), arrive)
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: /open menu/i }).click()
    const top = await first.evaluate((li) => li.querySelector('.chapter-stage')!.getBoundingClientRect().top)
    expect(Math.abs(top)).toBeLessThan(1)
  })

  test('keeps layout steady — CLS stays under 0.1 through the intro and the first scenes', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'layout-shift entries are Chromium-only')
    await page.addInitScript(() => {
      ;(window as Window & { __cls?: number }).__cls = 0
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
          if (!e.hadRecentInput) (window as Window & { __cls?: number }).__cls! += e.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto('/')
    await waitForIntroDone(page)
    for (let i = 1; i <= 4; i++) {
      await page.evaluate((k) => window.scrollTo(0, innerHeight * k), i)
      await page.waitForTimeout(400)
    }
    const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls)
    expect(cls).toBeLessThan(0.1)
  })

  test('has no structural a11y violations in the motion DOM — after the intro and mid-journey', async ({ page }) => {
    await page.goto('/')
    await waitForIntroDone(page)
    const scan = async () => (await new AxeBuilder({ page }).withRules(RULES).analyze()).violations.map((v) => v.id)
    expect(await scan()).toEqual([])
    await page.evaluate(() => window.scrollTo(0, innerHeight * 3))
    await page.waitForTimeout(1200)
    expect(await scan()).toEqual([])
  })

  test('keyboard focus brings a scene fully on stage', async ({ page }) => {
    await page.goto('/')
    await waitForIntroDone(page)
    test.skip(!(await immersive(page)), 'sticky scenes run on fine-pointer desktops only')
    const scene = page.locator('#work .chapter').nth(2)
    await scene.locator('a.stretched-link').focus()
    await page.waitForTimeout(300)
    // Inside its hold window: arrived (top ≤ 0) and not yet covered.
    const { top, hold } = await scene.evaluate((li) => ({
      top: li.getBoundingClientRect().top,
      hold: (parseFloat(getComputedStyle(li).getPropertyValue('--hold')) / 100) * innerHeight,
    }))
    expect(top).toBeLessThanOrEqual(1)
    expect(top).toBeGreaterThanOrEqual(-hold - 1)
  })
})
