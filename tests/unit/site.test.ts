import { describe, it, expect } from 'vitest'
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
