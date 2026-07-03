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

/** CollectionPage + ItemList for the portfolio archive. */
export function portfolioJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Portfolio — ${SITE.name}`,
    url: `${SITE.url}/portfolio`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: `${SITE.url}${item.url}`,
      })),
    },
  }
}

/** OfferCatalog for the services page — no prices until real figures exist. */
export function servicesJsonLd(services: { title: string; description: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE.title,
    url: `${SITE.url}/services`,
    provider: { '@type': 'Person', name: SITE.name, url: SITE.url },
    areaServed: 'Worldwide',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Photography productions',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.description },
      })),
    },
  }
}

/** AboutPage schema wrapping the Person. */
export function aboutJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About — ${SITE.name}`,
    url: `${SITE.url}/about`,
    mainEntity: personJsonLd(),
  }
}

/** ContactPage schema with the direct channels. */
export function contactJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact — ${SITE.name}`,
    url: `${SITE.url}/contact`,
    mainEntity: {
      '@type': 'Person',
      name: SITE.name,
      email: `mailto:${SITE.email}`,
      telephone: SITE.phone,
      address: { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'EG' },
    },
  }
}

/** BreadcrumbList for a case study. */
export function breadcrumbJsonLd(project: { title: string; slug: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: 'Portfolio', item: `${SITE.url}/portfolio` },
      { '@type': 'ListItem', position: 3, name: project.title, item: `${SITE.url}/work/${project.slug}` },
    ],
  }
}
