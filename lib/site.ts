// Single source of truth for site-wide identity used by metadata, sitemap,
// robots, and structured data. Override the URL per environment with
// NEXT_PUBLIC_SITE_URL (e.g. a custom domain) — defaults to the Vercel URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://hishamhany-pink.vercel.app'
).replace(/\/$/, '')

export const SITE = {
  url: SITE_URL,
  name: 'Hisham Hany',
  title: 'Hisham Hany — Commercial, Automotive & Fashion Photographer',
  description:
    'Cairo-based photographer specializing in commercial, automotive, and fashion photography. Where light becomes language.',
  jobTitle: 'Photographer',
  location: 'Cairo, Egypt',
  email: 'hishamshiboob@gmail.com',
  sameAs: [
    // Replace '#' placeholders with real profile URLs when available.
  ] as string[],
}

/** schema.org Person JSON-LD describing the portfolio owner. */
export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    url: SITE.url,
    jobTitle: SITE.jobTitle,
    email: `mailto:${SITE.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'EG' },
    knowsAbout: ['Fashion Photography', 'Automotive Photography', 'Commercial Photography'],
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  }
}
