import { describe, it, expect, vi, afterEach } from 'vitest'
import { SITE, SOCIAL_LINKS, personJsonLd } from '@/lib/site'

describe('SITE metadata', () => {
  it('exposes core identity', () => {
    expect(SITE.name).toBe('Hisham Hany')
    expect(SITE.email).toContain('@')
  })

  it('normalizes the URL without a trailing slash', () => {
    expect(SITE.url).not.toMatch(/\/$/)
  })
})

describe('SITE_URL fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  // Canonicals, og:url, sitemap, robots and JSON-LD all derive from SITE_URL,
  // so a dead fallback silently points every search signal at a 404.
  it('falls back to the live production host when NEXT_PUBLIC_SITE_URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.resetModules()
    const { SITE_URL } = await import('@/lib/site')
    expect(SITE_URL).toBe('https://hishamhany.vercel.app')
  })

  it('never falls back to the decommissioned hishamhany-pink host', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.resetModules()
    const { SITE_URL } = await import('@/lib/site')
    expect(SITE_URL).not.toContain('hishamhany-pink')
  })

  it('still honours an explicit NEXT_PUBLIC_SITE_URL (e.g. a custom domain)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://hishamhany.com/')
    vi.resetModules()
    const { SITE_URL } = await import('@/lib/site')
    expect(SITE_URL).toBe('https://hishamhany.com')
  })
})

describe('SOCIAL_LINKS', () => {
  it('includes the external profiles plus contact actions', () => {
    const labels = SOCIAL_LINKS.map((l) => l.label)
    expect(labels).toEqual(
      expect.arrayContaining(['Instagram', 'Behance', 'LinkedIn', 'WhatsApp', 'Call']),
    )
  })

  it('marks Call as an internal (tel:) action, profiles as external', () => {
    expect(SOCIAL_LINKS.find((l) => l.label === 'Call')?.external).toBe(false)
    expect(SOCIAL_LINKS.find((l) => l.label === 'Instagram')?.external).toBe(true)
  })
})

describe('personJsonLd', () => {
  it('emits a valid schema.org Person', () => {
    const ld = personJsonLd()
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Person')
    expect(ld.name).toBe(SITE.name)
    expect(ld.email).toBe(`mailto:${SITE.email}`)
  })

  it('lists social profiles under sameAs', () => {
    const ld = personJsonLd()
    expect(ld.sameAs).toEqual(
      expect.arrayContaining([SITE.social.instagram, SITE.social.behance, SITE.social.linkedin]),
    )
  })
})
