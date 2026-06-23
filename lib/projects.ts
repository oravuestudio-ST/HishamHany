// Shared project registry — single source of truth for the portfolio grid and the
// case-study pages (app/work/[slug]). Adding a project here makes it appear in the
// grid AND generates a static /work/<slug> page.
//
// getProjectsFromDB() fetches live data when DATABASE_URL is set.
// The static `projects` array is kept for generateStaticParams() at build time.

export type Category = 'Fashion' | 'Automotive' | 'Commercial' | 'Editorial'
export type Aspect = 'portrait' | 'landscape'

export interface Project {
  id: number
  slug: string
  title: string                // main editorial title, e.g. "Mercedes"
  subtitle?: string            // italic accent line, e.g. "GLE 450 4MATIC"
  category: Category
  year: string
  client: string
  location?: string            // e.g. "Cairo", "Germany"
  scope?: string               // engagement type, e.g. "Automotive Campaign"
  output?: string              // deliverables, e.g. "27 selects + hero film"
  description?: string         // 3-5 sentence editorial body
  image: string                // URL-encoded path under /public
  aspect: Aspect
  colorized?: boolean          // renders GlitchColorGrid instead of standard gallery
  clientLogo?: string          // path to client logo SVG/image under /public
}

export const categories = ['All', 'Fashion', 'Automotive', 'Commercial', 'Editorial'] as const

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const raw: Omit<Project, 'slug'>[] = [
  {
    id: 1,
    title: 'Glitch Club',
    subtitle: 'Outdoor',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    location: 'Cairo',
    scope: 'Fashion Campaign',
    output: 'Lookbook + social cutdowns',
    description: 'A fashion campaign for Glitch Goods staged outside the studio — daylight on the brand, motion in the wardrobe. The set was the street itself: handheld, reactive, no marks. The result reads as document rather than catalogue, which is the whole point. The brand lives where the audience does.',
    image: '/images/Fashion/GLITCH%20GOODS/GLITCH%20CLUB_outdoor/Glitch_outdoor-036.jpg',
    aspect: 'portrait',
    clientLogo: '/images/logos/glitch-goods.svg',
  },
  {
    id: 2,
    title: 'Mercedes',
    subtitle: 'GLE 450 4MATIC',
    category: 'Automotive',
    year: '2024',
    client: 'El Koptan',
    location: 'Cairo',
    scope: 'Automotive Campaign',
    output: '27 selects + hero film',
    description: 'A close-study automotive campaign built entirely on detail — light catching chrome badges, tail lamps burning red against lacquered black, the tactile precision of a luxury interior. No wide establishing shots. Every frame is a portrait of engineering. The result reads less like a car brochure and more like an object of desire.',
    image: '/images/Automotive/GLE-450/Hero_GLE450_car-004.JPG',
    aspect: 'landscape',
    clientLogo: '/images/logos/koptan.svg',
  },
  {
    id: 3,
    title: 'Baby Gang',
    subtitle: 'Childrenswear',
    category: 'Fashion',
    year: '2024',
    client: 'Baby Gang',
    location: 'Cairo',
    scope: 'Brand Campaign',
    output: '44 selects + jump-loop sequence',
    description: 'A childrenswear campaign that resists the genre’s defaults — no over-saturation, no manufactured smiles. We shot kids being kids: mid-jump, mid-thought, mid-mess. The clothes hold up because the people do. Editorial honesty applied to a category that rarely gets it.',
    image: '/images/Childs/FAshion/Baby%20gang/BabyGang_fashion-001.jpg',
    aspect: 'portrait',
  },
  {
    id: 7,
    title: 'Binghatti',
    subtitle: 'Cairo Activation',
    category: 'Editorial',
    year: '2024',
    client: 'Binghatti',
    location: 'Cairo',
    scope: 'Event + Editorial Coverage',
    output: '22 selects + press kit',
    description: 'Editorial coverage for Binghatti’s Cairo activation — a real-estate brand operating in luxury territory. The brief was to document without flattening: capture the room, the principals, the moment a deal is signed, but treat each frame as a portrait. The output became the brand’s launch deck.',
    image: '/images/Events/Bnghaty%20event/Bnghaty_koptan-001.jpg',
    aspect: 'portrait',
    clientLogo: '/images/logos/binghatti.svg',
  },
  {
    id: 8,
    title: 'Ayman & Salma',
    subtitle: 'Private Celebration',
    category: 'Editorial',
    year: '2024',
    client: 'Ayman & Salma',
    location: 'Cairo',
    scope: 'Editorial Documentary',
    output: '14 selects',
    description: 'A private celebration photographed with the gravity of a campaign. Children, balloons, low light, fast motion — and a brief to deliver something the family would frame, not file away. We slowed the shutter, embraced ambient color, and let the room do the heavy lifting.',
    image: '/images/Childs/PARTY/AymanSalma_party-002.JPG',
    aspect: 'landscape',
  },
  {
    id: 10,
    title: 'Glitch Club',
    subtitle: 'Germany',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    location: 'Germany',
    scope: 'Editorial Campaign',
    output: 'International edition selects',
    description: 'Glitch Goods on the road — an editorial fashion story shot during the brand’s Germany run. Industrial backdrops, cold light, the cuts treated as performance wear. The series functions as both a campaign and a travel diary, which is how the audience treats it.',
    image: '/images/Fashion/GLITCH%20GOODS/Glitch_club%20germany/Glitch_germany-001.jpg',
    aspect: 'portrait',
    clientLogo: '/images/logos/glitch-goods.svg',
  },
  {
    id: 11,
    title: 'Glitch Club',
    subtitle: 'Party Till Die',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    location: 'Cairo',
    scope: 'Capsule Drop',
    output: 'Hero stills + IG reel',
    description: 'A drop campaign for Glitch’s most aggressive capsule — built around motion blur, after-hours light, and high-contrast color. We shot a party, not a lookbook. The clothes appear in use, which is the only way this brand is supposed to be sold.',
    image: '/images/Fashion/GLITCH%20GOODS/Glitch_party-till-die/Glitch_partyTillDie-001.JPG',
    aspect: 'portrait',
    clientLogo: '/images/logos/glitch-goods.svg',
  },
  {
    id: 12,
    title: 'Glitch Set',
    subtitle: 'Color Study',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    location: 'Cairo',
    scope: 'Capsule Hero',
    output: 'Single hero + variant grid',
    description: 'A monochrome hero with isolated color treatment — the kind of post-production play that only earns its keep when the underlying photograph is strong enough to carry it. The piece works as both a campaign frame and a standalone art object, which is how the brand uses it.',
    image: '/images/Fashion/GLITCH%20GOODS/Gitch%20set/Glitch_set-Hero.jpg',
    aspect: 'portrait',
    colorized: true,
    clientLogo: '/images/logos/glitch-goods.svg',
  },
  {
    id: 13,
    title: 'Glitch',
    subtitle: 'Kanta',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    location: 'Cairo',
    scope: 'Product Story',
    output: 'Hero + ecommerce set',
    description: 'Product photography that refuses the standard product-photography brief. The Kanta piece sits inside a constructed scene — light shaped to model form, the garment treated as protagonist rather than object. The result moves units.',
    image: '/images/Fashion/GLITCH%20GOODS/kanta/Glitch_kanta-001.JPG',
    aspect: 'portrait',
    clientLogo: '/images/logos/glitch-goods.svg',
  },
  {
    id: 14,
    title: 'Glitch',
    subtitle: 'Circle KK',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    location: 'Cairo',
    scope: 'Capsule Lookbook',
    output: '7 hero frames',
    description: 'A capsule shot in a single afternoon, in a single room, with a single light. The constraint produced the campaign. Tight crops, repeated geometry, the audience trained to read the brand instantly. Restraint as identity.',
    image: '/images/Fashion/GLITCH%20GOODS/circle%20kk/Glitch_circlekk-001.JPG',
    aspect: 'portrait',
    clientLogo: '/images/logos/glitch-goods.svg',
  },
  {
    id: 15,
    title: 'Glitch',
    subtitle: 'Bag',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    location: 'Cairo',
    scope: 'Product Campaign',
    output: '12 selects + size grid',
    description: 'Accessory campaign — the bag treated with the discipline normally reserved for jewelry. Black background, controlled bounce, every shadow chosen. The shop page traffic doubled in the first week. A small product, photographed with full intent.',
    image: '/images/Fashion/GLITCH%20GOODS/bag/Glitch_bag-001.JPG',
    aspect: 'portrait',
    clientLogo: '/images/logos/glitch-goods.svg',
  },
  {
    id: 4,
    title: 'Isis Festival',
    subtitle: 'Coverage',
    category: 'Editorial',
    year: '2023',
    client: 'Events & Press',
    location: 'Cairo',
    scope: 'Press Coverage',
    output: 'Editorial selects',
    description: 'Festival coverage commissioned by the press desk — fast, ambient, no flash. The brief was unambiguous: bring back the night. We shot at the edges of the crowd and the center of the stage in equal measure. The selects ran across local and regional publications.',
    image: '/images/Events/Isis%20festival%20event/Isis_glitchybag-001.jpg',
    aspect: 'portrait',
  },
  {
    id: 9,
    title: 'Volkswagen',
    subtitle: 'Jetta',
    category: 'Automotive',
    year: '2024',
    client: 'El Koptan',
    location: 'Cairo',
    scope: 'Automotive Campaign',
    output: '19 selects',
    description: 'An automotive editorial that treats the Jetta as a study in restraint — clean line work, asphalt as background, dawn light only. The brand wanted something that didn’t shout. We delivered a campaign that whispers, which is harder to make and louder in result.',
    image: '/images/Automotive/koptan%20jetta/hero%20jetta.JPG',
    aspect: 'landscape',
    clientLogo: '/images/logos/koptan.svg',
  },
  {
    id: 16,
    title: 'Glide',
    subtitle: 'Electric Scooter',
    category: 'Automotive',
    year: '2024',
    client: 'Glide',
    location: 'Cairo',
    scope: 'Product Launch',
    output: 'Hero set + ECO loop',
    description: 'A product launch built around a single visual idea: motion isolated against stillness. Hero stills frame the scooter as a graphic object — bold color blocks, no environmental clutter. The campaign reads as a poster series, which is exactly what the founder asked for.',
    image: '/images/Automotive/Glide%20scooter/hero.JPG',
    aspect: 'landscape',
    colorized: true,
  },
  {
    id: 5,
    title: 'Seat',
    subtitle: 'Ibiza',
    category: 'Automotive',
    year: '2024',
    client: 'Automotive Campaign',
    location: 'Cairo',
    scope: 'Dealer Campaign',
    output: '4 hero frames',
    description: 'A compact automotive shoot built around speed of turnaround. Four hero frames, one location, controlled light. The constraint produced the campaign; the campaign produced the deck the dealer used to close the regional rollout.',
    image: '/images/Automotive/Seat%20ibiza/Hero.JPG',
    aspect: 'landscape',
  },
  {
    id: 6,
    title: 'New Capital',
    subtitle: 'Architectural Study',
    category: 'Editorial',
    year: '2023',
    client: 'Architectural Editorial',
    location: 'New Administrative Capital',
    scope: 'Architectural Editorial',
    output: '9 frames',
    description: 'An architectural editorial of Egypt’s New Administrative Capital — concrete, glass, scale. The brief was to shoot the buildings as portraits rather than infrastructure. The frames treat geometry as subject. Output ran in editorial and was retained by the developer.',
    image: '/images/New%20capital/NewCapital_architecture-%20Hero.JPG',
    aspect: 'landscape',
  },
]

// Slugs are derived from `title + subtitle` so projects sharing a title
// (e.g. all "Glitch Club" entries) stay unique. Falls back to title when
// there's no subtitle.
function projectSlug(p: Omit<Project, 'slug'>): string {
  return slugify(p.subtitle ? `${p.title} ${p.subtitle}` : p.title)
}

export const projects: Project[] = raw.map((p) => ({ ...p, slug: projectSlug(p) }))

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function getAdjacent(slug: string): { prev: Project; next: Project } | null {
  const i = projects.findIndex((p) => p.slug === slug)
  if (i === -1) return null
  const prev = projects[(i - 1 + projects.length) % projects.length]
  const next = projects[(i + 1) % projects.length]
  return { prev, next }
}

// Fetches visible projects from the database ordered by `order`.
// Falls back to the static array when DATABASE_URL is not set.
export async function getProjectsFromDB(): Promise<Project[]> {
  if (!process.env.DATABASE_URL) return projects

  try {
    const { db } = await import('@/lib/db')
    const { projects: projectsTable } = await import('@/drizzle/schema')
    const { asc, eq } = await import('drizzle-orm')

    const rows = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.visible, true))
      .orderBy(asc(projectsTable.order))

    // Augment DB rows with editorial copy from the static array when the slug matches
    // — the case-study layout needs description / scope / output, and those fields
    // currently only live in this file (not in the DB schema).
    return rows.map((r) => {
      const fallback = projects.find((p) => p.slug === r.slug)
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        subtitle: fallback?.subtitle,
        category: r.category as Category,
        year: r.year,
        client: r.client,
        location: fallback?.location,
        scope: fallback?.scope,
        output: fallback?.output,
        description: fallback?.description,
        image: r.image,
        aspect: r.aspect as Aspect,
        colorized: r.colorized,
      }
    })
  } catch {
    return projects
  }
}
