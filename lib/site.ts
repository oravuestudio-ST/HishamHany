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
  phone: '+201112805807',
  social: {
    instagram: 'https://www.instagram.com/hishamhany.ph/',
    behance: 'https://www.behance.net/hishamhany1',
    linkedin: 'https://www.linkedin.com/in/hisham-hany-238301315',
    whatsapp: 'https://wa.me/201112805807',
  },
}

// Footer / nav link list. Profiles feed Person.sameAs; WhatsApp + Call are contact actions.
export const SOCIAL_LINKS: { label: string; href: string; external: boolean }[] = [
  { label: 'Instagram', href: SITE.social.instagram, external: true },
  { label: 'Behance', href: SITE.social.behance, external: true },
  { label: 'LinkedIn', href: SITE.social.linkedin, external: true },
  { label: 'WhatsApp', href: SITE.social.whatsapp, external: true },
  { label: 'Call', href: `tel:${SITE.phone}`, external: false },
]

const SAME_AS = [SITE.social.instagram, SITE.social.behance, SITE.social.linkedin]

/** schema.org Person JSON-LD describing the portfolio owner. */
export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    url: SITE.url,
    jobTitle: SITE.jobTitle,
    email: `mailto:${SITE.email}`,
    telephone: SITE.phone,
    address: { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'EG' },
    knowsAbout: ['Fashion Photography', 'Automotive Photography', 'Commercial Photography'],
    sameAs: SAME_AS,
  }
}
