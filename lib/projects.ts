// Shared project registry — single source of truth for the portfolio grid and the
// case-study pages (app/work/[slug]). Adding a project here makes it appear in the
// grid AND generates a static /work/<slug> page.
//
// getProjectsFromDB() fetches live data when DATABASE_URL is set.
// The static `projects` array is kept for generateStaticParams() at build time.

export type Category = 'Fashion' | 'Automotive' | 'Commercial' | 'Editorial'
export type Aspect = 'portrait' | 'landscape'

/** Optional 3D/interactive feature slots a case study can declare (data-driven —
 * FeatureSlot.tsx maps these keys to dynamic imports, no slug checks). */
export type FeatureKey = 'mercedes-logo-3d' | 'volkswagen-logo-3d' | 'volkswagen-showcase'

/**
 * Long-form magazine content for the case-study template. Every field is
 * optional — the template renders gracefully from the base Project fields
 * (description/scope/output) and deepens wherever editorial exists.
 */
export interface ProjectEditorial {
  /** 1-3 long-form intro paragraphs (replaces `description` as the lead). */
  overview?: string[]
  /** Campaign objectives, one line each. */
  objectives?: string[]
  /** Creative-direction narrative. */
  direction?: string
  /** Production-approach narrative. */
  approach?: string
  /** Gear + lighting, one line each. Only listed when confirmed. */
  equipment?: string[]
  /** e.g. "One-day location production". */
  duration?: string
  /** Ordered image paths for the editorial spread; defaults to gallery order. */
  sequence?: string[]
  /** Interactive feature slots rendered with the title block / after gallery. */
  features?: FeatureKey[]
  /** Manual related-project slugs; getRelated() falls back to same-category. */
  related?: string[]
}

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
  featured?: boolean           // curated onto the home Featured Work feed
  colorized?: boolean          // renders GlitchColorGrid instead of standard gallery
  clientLogo?: string          // path to client logo SVG/image under /public
  editorial?: ProjectEditorial // magazine-template long-form content
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
  },
  {
    id: 17,
    title: 'Hands of Clay',
    category: 'Editorial',
    year: '2023',
    client: 'Independent Reportage',
    location: 'Egypt',
    scope: 'Documentary Photo Essay',
    output: 'Photo essay — 6 selects',
    description:
      'A photo essay from inside a working Egyptian pottery atelier — a master potter carving a pierced vessel by window light, rows of hand-thrown pieces drying in matte pink, sculpted figures weathering in the yard. Photojournalism in the classic sense: available light, no direction, the craft allowed to speak at its own pace.',
    image: '/images/Clay_journalism_project/Clay_journalism-008.JPG',
    aspect: 'landscape',
  },
  {
    id: 18,
    title: 'EI.Cons',
    subtitle: 'On Site',
    category: 'Commercial',
    year: '2025',
    client: 'EI.Cons Construction',
    location: 'Egypt',
    scope: 'Corporate Documentary',
    output: '40 selects — leadership, crew, site progress',
    description:
      'A corporate documentary for EI.Cons Construction, shot on an active development site in hard desert light. Engineers at their desks, crews between pours, structures mid-rise — the commission treats a construction company the way editorial treats its subjects: people first, machinery second, and the scale of the work carried by the frames themselves.',
    image: '/images/Eicons_construction/Eicons_landscape-001.jpg',
    aspect: 'landscape',
  },
]

/**
 * Magazine-template long-form content, keyed by slug and merged into the
 * export below. Flagship projects carry the full editorial treatment; the
 * rest render the template from their base fields. Copy is derived from the
 * project descriptions and the photography itself — equipment lists are left
 * empty until confirmed.
 */
const EDITORIAL: Record<string, ProjectEditorial> = {
  'mercedes-gle-450-4matic': {
    overview: [
      'A close-study automotive campaign built entirely on detail — light catching chrome badges, tail lamps burning red against lacquered black, the tactile precision of a luxury interior. No wide establishing shots. Every frame is a portrait of engineering.',
      'The commission came from El Koptan, and the brief was simple to say and hard to do: make inventory feel like desire. The answer was to photograph the GLE the way a watchmaker is photographed — at the distance where craft becomes visible.',
    ],
    objectives: [
      'Position the GLE 450 as an object of desire, not inventory',
      'Build a detail-first library that outlives the launch cycle',
      'Lead the rollout with a hero film cut from the same visual language',
    ],
    direction:
      'Darkness as the stage, light as the subject. The palette holds to black, chrome, and signal red; each frame isolates one engineering decision and lets it carry the composition. The series reads in sequence — badge, lamp, stitch, line — like turning the pages of a specification written in light.',
    approach:
      'A controlled studio-style production applied to a full-size vehicle: incremental lighting passes over the body panels, long exposures for the lamp signatures, macro work through the cabin. Twenty-seven selects and a hero film were delivered from a single sustained session.',
    features: ['mercedes-logo-3d'],
    related: ['volkswagen-jetta', 'glide-electric-scooter', 'seat-ibiza'],
  },
  'volkswagen-jetta': {
    overview: [
      'An automotive editorial that treats the Jetta as a study in restraint — clean line work, asphalt as background, dawn light only. The brand wanted something that didn’t shout.',
      'Restraint is a production discipline, not an afterthought. Shooting only at dawn gave the paint a single consistent temperature and kept every frame inside one quiet tonal register — a campaign that whispers, which is harder to make and louder in result.',
    ],
    objectives: [
      'Give the Jetta a calm, editorial presence apart from dealership visuals',
      'Hold one light temperature across the entire series',
      'Deliver a tight set of selects that work as a sequence, not singles',
    ],
    direction:
      'One car, one road surface, one hour of usable light per day. Compositions lean on negative space and the car’s own line work; nothing in frame competes with the silhouette.',
    approach:
      'Location production timed to first light across consecutive mornings. Camera positions were plotted the evening before; each dawn window was spent shooting, not deciding. Nineteen selects made the final edit.',
    features: ['volkswagen-logo-3d', 'volkswagen-showcase'],
    related: ['mercedes-gle-450-4matic', 'seat-ibiza', 'glide-electric-scooter'],
  },
  'glitch-club-outdoor': {
    overview: [
      'A fashion campaign for Glitch Goods staged outside the studio — daylight on the brand, motion in the wardrobe. The set was the street itself: handheld, reactive, no marks.',
      'The result reads as document rather than catalogue, which is the whole point. The brand lives where the audience does, and the campaign meets it there.',
    ],
    objectives: [
      'Take the brand out of the studio and into its own context',
      'Keep the energy of street photography inside a controlled campaign edit',
      'Deliver a lookbook plus social cutdowns from one production',
    ],
    direction:
      'Documentary grammar applied to fashion: real light, real backgrounds, movement kept in the frame. Styling stays sharp while everything around it stays honest — the tension between the two is the look.',
    approach:
      'Handheld, fast, and unblocked — the talent moved through the location and the camera kept up. The edit favors frames where the wardrobe reads clean against the accident of the street.',
    related: ['glitch-club-germany', 'glitch-set-color-study', 'baby-gang-childrenswear'],
  },
  'baby-gang-childrenswear': {
    overview: [
      'A childrenswear campaign that resists the genre’s defaults — no over-saturation, no manufactured smiles. We shot kids being kids: mid-jump, mid-thought, mid-mess.',
      'The clothes hold up because the people do. Editorial honesty applied to a category that rarely gets it.',
    ],
    objectives: [
      'Replace catalogue posing with genuine, unforced moments',
      'Keep color grading restrained in a category that over-saturates',
      'Deliver a full campaign set including a jump-loop motion sequence',
    ],
    direction:
      'Let the kids set the tempo and design the frame around what actually happens. The grade stays natural; the humor stays real; the garments read because nothing else is performing.',
    approach:
      'Play first, photography second — setups that invited motion (the jump-loop began as a game) with the camera positioned to catch it. Forty-four selects were delivered.',
    related: ['glitch-club-outdoor', 'glitch-kanta', 'glitch-circle-kk'],
  },
  'binghatti-cairo-activation': {
    overview: [
      'Editorial coverage for Binghatti’s Cairo activation — a real-estate brand operating in luxury territory. The brief was to document without flattening: capture the room, the principals, the moment a deal is signed, but treat each frame as a portrait.',
      'The output became the brand’s launch deck — coverage precise enough to function as campaign material.',
    ],
    objectives: [
      'Cover the activation without reducing it to event photography',
      'Portrait-grade treatment of principals and signings',
      'Deliver a press kit the brand could publish directly',
    ],
    direction:
      'Event coverage held to editorial standards: deliberate compositions, clean backgrounds found in real time, available light shaped rather than overpowered. Every frame had to survive as a standalone portrait.',
    approach:
      'Two registers shot in parallel — the room as it happened, and portrait moments carved out of it. Twenty-two selects and a press kit were delivered on an event timeline.',
    related: ['isis-festival-coverage', 'ayman-and-salma-private-celebration', 'new-capital-architectural-study'],
  },
  'new-capital-architectural-study': {
    overview: [
      'An architectural editorial of Egypt’s New Administrative Capital — concrete, glass, scale. The brief was to shoot the buildings as portraits rather than infrastructure.',
      'The frames treat geometry as subject. The series ran editorially and was retained by the developer — architecture photography doing both jobs at once.',
    ],
    objectives: [
      'Photograph new architecture as subject, not backdrop',
      'Hold a strict geometric discipline across the series',
      'Produce a tight nine-frame edit with no filler',
    ],
    direction:
      'Portraiture logic applied to buildings: one subject per frame, patient light, and compositions that let mass and line carry the image. The edit is deliberately spare — nine frames, each earning its place.',
    approach:
      'Site study first, camera second — positions chosen for how the light would fall, then shot at the hours that proved it. The final edit runs as a single continuous visual argument.',
    related: ['binghatti-cairo-activation', 'ei-cons-on-site', 'isis-festival-coverage'],
  },
  'hands-of-clay': {
    overview: [
      'A photo essay from inside a working Egyptian pottery atelier. A master potter carves a pierced vessel by window light; hand-thrown pieces dry in rows of matte pink; sculpted figures weather quietly in the yard.',
      'This is photojournalism in the classic sense — available light, no direction, no styling. The essay observes the distance between a lump of clay and a finished object, and the hands that close it.',
    ],
    objectives: [
      'Document a living craft without staging it',
      'Let material — clay, dust, glaze — set the palette',
      'Honor the maker as the center of the story',
    ],
    direction:
      'Warm, unforced, and patient. The workshop’s own light does the work; the sequence moves from place, to process, to the potter himself, ending where the craft begins — at the hands.',
    approach:
      'A day spent observing rather than directing. No lights were brought in and nothing was moved; the edit keeps the six frames that tell the story completely.',
    related: ['new-capital-architectural-study', 'isis-festival-coverage', 'ei-cons-on-site'],
  },
  'ei-cons-on-site': {
    overview: [
      'A corporate documentary for EI.Cons Construction, shot across an active development site in hard desert light. Engineers at their desks, crews between pours, structures mid-rise.',
      'The commission treats a construction company the way editorial treats its subjects: people first, machinery second. The scale of the work is carried by the frames — not claimed by them.',
    ],
    objectives: [
      'Humanize a construction brand through its own people',
      'Document site progress at campaign quality',
      'Build a photographic library for corporate and recruitment use',
    ],
    direction:
      'Two registers, one grade: environmental portraits of the team — site office to scaffold line — and the architecture of work itself, shot straight-on in the flat honesty of desert light.',
    approach:
      'A full site walk with the crews, shooting as the day unfolded — no staging beyond a pause and a glance. Forty selects cover leadership, workforce, and the build in progress.',
    related: ['new-capital-architectural-study', 'binghatti-cairo-activation', 'hands-of-clay'],
  },
}

// Slugs are derived from `title + subtitle` so projects sharing a title
// (e.g. all "Glitch Club" entries) stay unique. Falls back to title when
// there's no subtitle.
function projectSlug(p: Omit<Project, 'slug'>): string {
  return slugify(p.subtitle ? `${p.title} ${p.subtitle}` : p.title)
}

export const projects: Project[] = raw.map((p) => {
  const slug = projectSlug(p)
  return { ...p, slug, editorial: EDITORIAL[slug] }
})

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

/**
 * Related projects for the case-study footer: manual `editorial.related`
 * first, then same-category (registry order, excluding self), then other
 * categories until `n` is reached.
 */
export function getRelated(slug: string, n = 3): Project[] {
  const current = getProject(slug)
  if (!current) return []

  const picked: Project[] = []
  const take = (p: Project | undefined) => {
    if (p && p.slug !== slug && !picked.some((x) => x.slug === p.slug) && picked.length < n) {
      picked.push(p)
    }
  }

  for (const s of current.editorial?.related ?? []) take(getProject(s))
  for (const p of projects) if (p.category === current.category) take(p)
  for (const p of projects) take(p)

  return picked
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
    // — the case-study layout needs description / scope / output / editorial, and
    // those fields currently only live in this file (not in the DB schema).
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
        featured: fallback?.featured,
        colorized: r.colorized,
        clientLogo: fallback?.clientLogo,
        editorial: r.editorial ?? fallback?.editorial,
      }
    })
  } catch {
    return projects
  }
}
