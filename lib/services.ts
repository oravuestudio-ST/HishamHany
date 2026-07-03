/**
 * Services registry — single source of truth for /services, the home
 * ServicesTeaser, and any future schema.org OfferCatalog. Pricing is
 * inquiry-led: `priceFrom` stays undefined until real figures are supplied,
 * and the UI renders "Investment — on request" in its absence.
 */

export interface Service {
  slug: string
  num: string
  title: string
  eyebrow: string
  description: string
  idealFor: string
  deliverables: string[]
  /** Cover image — the case-study slug whose hero represents this production. */
  coverProject: string
  priceFrom?: string
}

export const services: Service[] = [
  {
    slug: 'fashion-campaigns',
    num: '01',
    title: 'Fashion Campaigns',
    eyebrow: 'Look books · Campaigns · Editorial',
    description:
      'Editorial and campaign imagery that speaks the language of luxury — from concept and casting through the final frame. Studio or street, the wardrobe leads and everything in frame serves it.',
    idealFor: 'Fashion labels, stylists, and agencies building a season or a drop.',
    deliverables: ['Campaign selects', 'Look book sequence', 'Social cutdowns', 'Usage-ready masters'],
    coverProject: 'glitch-club-outdoor',
  },
  {
    slug: 'automotive',
    num: '02',
    title: 'Automotive',
    eyebrow: 'Launches · Fleet · Detail studies',
    description:
      'Vehicles photographed as objects of desire — detail studies, dawn-light editorials, and launch campaigns built on controlled light and patient composition.',
    idealFor: 'Dealerships, importers, and automotive brands introducing or repositioning a model.',
    deliverables: ['Hero campaign frames', 'Detail study series', 'Interior sequence', 'Hero film on request'],
    coverProject: 'mercedes-gle-450-4matic',
  },
  {
    slug: 'commercial-product',
    num: '03',
    title: 'Commercial & Product',
    eyebrow: 'Advertising · Brand · Corporate',
    description:
      'Brand-aligned imagery that elevates product and communicates identity with precision — advertising campaigns, corporate documentary, and the photographic library a brand runs on.',
    idealFor: 'Brands, agencies, and companies that need imagery carrying a campaign or a corporate story.',
    deliverables: ['Campaign selects', 'Corporate documentary set', 'Product series', 'Library licensing'],
    coverProject: 'ei-cons-on-site',
  },
  {
    slug: 'portraits-headshots',
    num: '04',
    title: 'Portraits & Headshots',
    eyebrow: 'Executive · Talent · Artist',
    description:
      'Cinematic portraits that capture depth, presence, and character with intentional lighting — for the people who are the brand.',
    idealFor: 'Executives, entrepreneurs, artists, and personal brands.',
    deliverables: ['Portrait session', 'Retouched selects', 'Press + profile crops', 'Usage-ready masters'],
    coverProject: 'hands-of-clay',
  },
  {
    slug: 'editorial-events',
    num: '05',
    title: 'Editorial & Events',
    eyebrow: 'Magazine · Press · Coverage',
    description:
      'Coverage held to editorial standards — activations, launches, and stories documented with deliberate composition, so every frame survives as a standalone image.',
    idealFor: 'Publications, cultural institutions, and brands staging moments worth keeping.',
    deliverables: ['Editorial selects', 'Press kit', 'Same-week delivery', 'Publication licensing'],
    coverProject: 'binghatti-cairo-activation',
  },
]

/** The client-experience workflow — shared by every production. */
export const workflow = [
  { num: '01', title: 'Discovery', body: 'A conversation about the brief, the brand, and what the images need to do.' },
  { num: '02', title: 'Creative Direction', body: 'Mood, references, casting, and locations — agreed before anything is booked.' },
  { num: '03', title: 'Pre-production', body: 'Scheduling, permits, styling, and logistics handled end to end.' },
  { num: '04', title: 'Production', body: 'The shoot itself — a controlled set, however uncontrolled the location.' },
  { num: '05', title: 'Post & Grading', body: 'Selects, retouching, and a grade that matches the brand, not a preset.' },
  { num: '06', title: 'Delivery', body: 'Publication-ready masters in every format the campaign needs.' },
  { num: '07', title: 'Support', body: 'Re-crops, additional formats, and licensing questions — answered after delivery.' },
]
