import { test, expect } from '@playwright/test'
import { projects } from '../../lib/projects'

/**
 * Server-rendering contract. These read the raw HTML the production server
 * sends — before any JavaScript runs — because that is what crawlers, link
 * previews, slow phones and the LCP preload scanner actually see. A single
 * `ssr: false` wrapper or an empty <Suspense> silently empties this HTML, and
 * nothing else in the suite would notice.
 */
/** HTML minus the layout's <noscript> fallback, which browsers with JS never render. */
function renderedHtml(html: string) {
  return html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
}

test.describe('server-rendered HTML', () => {
  // Pure HTTP checks: run once, not once per device profile.
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'HTML contract runs once (Desktop Chrome)')

  test('home ships <main>, the single <h1> and the hero photograph in the first response', async ({ request }) => {
    const html = renderedHtml(await (await request.get('/')).text())
    expect(html).toMatch(/<main[\s>]/)
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
    expect(html).toContain('NewCapital_architecture-')
    // next/image `priority` emits a preload so the LCP request starts with the HTML.
    expect(html).toMatch(/<link[^>]+rel="preload"[^>]+as="image"/)
  })

  test('home ships the whole exhibition and index — every project link, no hidden wrapper', async ({ request }) => {
    const html = renderedHtml(await (await request.get('/')).text())
    for (const p of projects) {
      expect(html, `missing link to /work/${p.slug}`).toContain(`href="/work/${p.slug}"`)
    }
    // The old intro shipped <main> inside an inline opacity:0 wrapper.
    expect(html).not.toMatch(/style="opacity:\s*0[;"]/)
    expect(html).not.toMatch(/opacity:\s*0[^>]*>\s*(?:<[^>]+>\s*)*<main/)
    // The commission section and its contact links are server-rendered too.
    expect(html).toContain('id="contact"')
    expect(html).toContain('mailto:')
  })

  test('portfolio ships its heading and a link to every case study', async ({ request }) => {
    const html = renderedHtml(await (await request.get('/portfolio')).text())
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
    for (const p of projects) {
      expect(html, `missing link to /work/${p.slug}`).toContain(`href="/work/${p.slug}"`)
    }
  })

  test('interior pages are not pre-hidden in the HTML (visible without JavaScript)', async ({ request }) => {
    const html = await (await request.get('/about')).text()
    // The enter tween may still hide the page once JS is known to be running,
    // but the markup itself must not ship at opacity 0.
    expect(html).not.toMatch(/style="opacity:\s*0"/)
    expect(html).toContain('data-page-enter')
  })
})
