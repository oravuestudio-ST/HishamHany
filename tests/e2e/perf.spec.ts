import { test, expect, chromium } from '@playwright/test'

/**
 * Performance budgets (Chromium-only `perf` project). Run against a production
 * build so numbers reflect what ships:  npm run build && npm run test:perf
 *
 * Thresholds are intentionally lenient defaults — a WebGL-heavy portfolio will
 * never score like a static blog — and overridable via env so CI can tighten
 * them over time without code changes. The goal is regression detection, not a
 * vanity score.
 */
const THRESHOLDS = {
  performance: Number(process.env.PERF_MIN_SCORE ?? 40),
  accessibility: Number(process.env.A11Y_MIN_SCORE ?? 85),
  'best-practices': Number(process.env.BP_MIN_SCORE ?? 80),
  seo: Number(process.env.SEO_MIN_SCORE ?? 85),
}

test.describe('Performance budgets', () => {
  test('homepage JavaScript transfer stays under budget', async ({ page }) => {
    // Budget is over-the-wire (compressed) transfer for the homepage's own scripts,
    // measured at functional load. We deliberately do NOT wait for full networkidle:
    // Next.js prefetches the JS bundle of every linked route (each case study, the
    // journal) which would balloon the figure with bytes the first paint never needs.
    //
    // Baseline on 2026-06: ~8.9 MB — the per-component Three.js renderers dominate.
    // This is a REGRESSION guard (set just above baseline with headroom); meaningfully
    // shrinking it is roadmap item #6 (shared WebGL canvas). Tighten via env as that lands.
    const budgetKb = Number(process.env.PERF_JS_BUDGET_KB ?? 10000)

    await page.goto('/')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })

    const kb = await page.evaluate(() => {
      const scripts = performance
        .getEntriesByType('resource')
        .filter((e) => (e as PerformanceResourceTiming).initiatorType === 'script')
        .map((e) => (e as PerformanceResourceTiming).transferSize || 0)
      return Math.round(scripts.reduce((a, b) => a + b, 0) / 1024)
    })

    console.log(`[perf] homepage script transfer ≈ ${kb} KB (budget ${budgetKb} KB)`)
    expect(kb, `homepage script transfer (${kb} KB) exceeded budget (${budgetKb} KB)`).toBeLessThan(
      budgetKb,
    )
  })

  test('homepage meets the Lighthouse budget', async () => {
    let playAudit: typeof import('playwright-lighthouse').playAudit
    try {
      ;({ playAudit } = await import('playwright-lighthouse'))
    } catch {
      test.skip(true, 'playwright-lighthouse not installed — run `npm i -D playwright-lighthouse lighthouse`.')
      return
    }

    const port = 9222
    const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] })
    try {
      const page = await browser.newPage()
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
      await playAudit({ page, port, thresholds: THRESHOLDS, disableLogs: true })
    } finally {
      await browser.close()
    }
  })
})
