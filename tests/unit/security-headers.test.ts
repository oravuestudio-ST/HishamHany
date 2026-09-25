import { describe, it, expect } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextConfig = require('../../next.config.js')

type Header = { key: string; value: string }

async function siteWideHeaders(): Promise<Header[]> {
  expect(typeof nextConfig.headers).toBe('function')
  const rules: { source: string; headers: Header[] }[] = await nextConfig.headers()
  const rule = rules.find((r) => r.source === '/:path*')
  expect(rule, 'expected a site-wide /:path* header rule').toBeDefined()
  return rule!.headers
}

function valueOf(headers: Header[], key: string) {
  return headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value
}

describe('security headers', () => {
  it('stops MIME sniffing', async () => {
    expect(valueOf(await siteWideHeaders(), 'X-Content-Type-Options')).toBe('nosniff')
  })

  it('limits referrer data sent cross-origin', async () => {
    expect(valueOf(await siteWideHeaders(), 'Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('refuses to be framed by other sites (legacy header + CSP frame-ancestors)', async () => {
    const headers = await siteWideHeaders()
    expect(valueOf(headers, 'X-Frame-Options')).toBe('SAMEORIGIN')
    expect(valueOf(headers, 'Content-Security-Policy')).toContain("frame-ancestors 'self'")
  })

  it('turns off device APIs the site never uses', async () => {
    const policy = valueOf(await siteWideHeaders(), 'Permissions-Policy') ?? ''
    for (const feature of ['camera=()', 'microphone=()', 'geolocation=()']) {
      expect(policy).toContain(feature)
    }
  })
})
