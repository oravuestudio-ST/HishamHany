import { test, expect } from '@playwright/test'

// Scroll reveals start from opacity 0. If a trigger never fires (a wrong start,
// a pin spacer shifting positions, a ref left unattached), the text stays
// invisible with no error. Scroll every route end to end under full motion and
// fail on any text in <main> that came on screen but was never seen visible.
// Visible once is enough: the hero and case cover fade out on purpose when
// scrolled past.
const ROUTES = ['/', '/services', '/about', '/contact', '/portfolio', '/journal', '/work/mercedes-gle-450-4matic']

declare global {
  interface Window { __sample: () => void; __seen: Map<Element, boolean> }
}

test.describe('Scroll reveals', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  for (const route of ROUTES) {
    test(`leave no text hidden after a full scroll: ${route}`, async ({ page, isMobile }) => {
      await page.goto(route)
      await expect(page.locator('main')).toBeVisible({ timeout: 30_000 })
      // The home intro locks scrolling until it is done (about 4s on mobile WebKit).
      await page.waitForFunction(() => [undefined, 'done'].includes(document.documentElement.dataset.intro), null, { timeout: 30_000 })
      await page.waitForTimeout(1500) // header opening

      // Record, per text element that is on screen, whether it was ever visible.
      await page.evaluate(() => {
        window.__seen = new Map()
        window.__sample = () => {
          const walker = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT)
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const el = n.parentElement
            if (!n.textContent!.trim() || !el || el.closest('[aria-hidden="true"]')) continue
            const r = el.getBoundingClientRect()
            if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) continue
            let opacity = 1
            for (let a: Element | null = el; a; a = a.parentElement) {
              const s = getComputedStyle(a)
              if (s.visibility === 'hidden' || s.display === 'none') { opacity = 1; break } // not rendered: not a reveal bug
              opacity *= parseFloat(s.opacity)
            }
            window.__seen.set(el, window.__seen.get(el) || opacity >= 0.05)
          }
        }
        window.__sample()
      })

      // Wheel on desktop so smooth scroll and ScrollTrigger see real input;
      // mobile WebKit has no wheel, and touch scrolling is native there anyway.
      let last = -1
      for (let i = 0; i < 200; i++) {
        if (isMobile) await page.evaluate(() => window.scrollBy(0, 400))
        else await page.mouse.wheel(0, 400)
        await page.waitForTimeout(600) // reading pace: a threshold reveal needs ~0.5s before text shows
        const y = await page.evaluate(() => { window.__sample(); return window.scrollY })
        if (y === last) break
        last = y
      }
      await page.waitForTimeout(2000) // let the last reveals finish

      const hidden = await page.evaluate(() => {
        window.__sample()
        return [...window.__seen].filter(([, ok]) => !ok)
          .map(([el]) => `${el.tagName.toLowerCase()}: ${el.textContent!.trim().slice(0, 40)}`)
      })
      expect(hidden).toEqual([])
    })
  }
})
