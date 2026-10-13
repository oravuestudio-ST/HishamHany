// Server-only (reads image dimensions from disk via lib/galleries). Client
// components import the types with `import type` only.
import { withDimensions } from '@/lib/galleries'
import { getProject, type Category } from '@/lib/projects'
import { CHAPTER } from '@/animations/tokens'

/**
 * How a plate hangs in its scene.
 *   bleed    → full-screen; copy sits on a static scrim in the cover's calm zone
 *   hung     → framed on the ink wall at the shared CHAPTER.hangHeight eye-line
 *   portrait → a tall plate on one side, copy on the ink opposite
 */
export type Composition = 'bleed' | 'hung' | 'portrait'

/** Where bleed copy sits — chosen per photograph, away from its busy areas. */
export type CopyZone = 'top-left' | 'bottom-left'

export interface ChapterData {
  slug: string
  href: string
  number: number
  total: number
  title: string
  subtitle?: string
  category: Category
  /** "Client" for a named client; "Commission" when the work had none. */
  creditLabel: 'Client' | 'Commission'
  credit: string
  year: string
  image: { src: string; w: number; h: number; alt: string }
  composition: Composition
  /** Plate side for hung/portrait scenes — the copy takes the other side. */
  side: 'left' | 'right'
  copyZone: CopyZone
  /** vh the scene holds still once it has arrived (CHAPTER.hold). */
  hold: number
  sizes: string
  /** False when the cover differs from the case study's own cover, so the
      shared-element morph would cross-fade two different photographs. */
  morph: boolean
}

interface ChapterEntry {
  slug: string
  /** Encoded path under /public — defaults to the project's own cover. */
  cover?: string
  alt: string
  composition?: Composition
  side?: 'left' | 'right'
  copyZone?: CopyZone
  /** For projects whose registry `client` holds a scope, not a client. */
  commission?: string
}

/**
 * The exhibition, in viewing order. Curated for full-screen viewing and kept
 * separate from `featured` (which still drives the portfolio's featured strip):
 * disciplines alternate, compositions alternate, and only sources sharp enough
 * for full-bleed (≥2400px wide) are hung that way. Edit this list to re-hang
 * the show; every project not listed still appears in the index below it.
 */
const EXHIBITION: ChapterEntry[] = [
  {
    slug: 'glitch-club-germany',
    alt: 'Model in a cream Glitch Club polo sweatshirt standing before a painted classical landscape backdrop',
    side: 'right',
  },
  {
    slug: 'seat-ibiza',
    alt: 'White Seat Ibiza photographed head-on across paving stones against a dark background',
    copyZone: 'top-left',
    commission: 'Dealer campaign',
  },
  {
    slug: 'glitch-club-party-till-die',
    alt: 'Model in a black Party Till Die T-shirt and white shorts standing beneath a concrete canopy, looking down',
    side: 'left',
  },
  {
    slug: 'mercedes-gle-450-4matic',
    alt: 'Black Mercedes GLE 450 on a palm-lined avenue in soft daylight',
    side: 'right',
  },
  {
    slug: 'new-capital-architectural-study',
    cover: '/images/New%20capital/NewCapital_architecture-005.JPG',
    alt: 'Brass lanterns glowing beneath an ornate carved ceiling',
    copyZone: 'bottom-left',
    commission: 'Architectural editorial',
  },
  {
    slug: 'hands-of-clay',
    alt: 'Potter with tousled grey hair studying a pierced clay vessel in warm window light',
    side: 'left',
    commission: 'Independent reportage',
  },
]

/** Full-bleed only when the source stays sharp across a large display. */
const BLEED_MIN_WIDTH = 2400

export function deriveComposition(w: number, h: number): Composition {
  if (h > w) return 'portrait'
  return w >= BLEED_MIN_WIDTH ? 'bleed' : 'hung'
}

const SIZES: Record<Composition, string> = {
  bleed: '100vw',
  hung: `(min-width: 769px) ${CHAPTER.hangMaxWidth}vw, 100vw`,
  portrait: `(min-width: 769px) ${Math.round((CHAPTER.portraitHeight * 2) / 3)}vh, 100vw`,
}

/** The exhibition resolved against the registry and the image dimensions. */
export function getChapters(): ChapterData[] {
  const total = EXHIBITION.length
  return EXHIBITION.map((entry, i) => {
    const project = getProject(entry.slug)
    if (!project) throw new Error(`lib/chapters: unknown project slug "${entry.slug}"`)
    const src = entry.cover ?? project.image
    const [{ w, h }] = withDimensions([src])
    const composition = entry.composition ?? deriveComposition(w, h)
    return {
      slug: project.slug,
      href: `/work/${project.slug}`,
      number: i + 1,
      total,
      title: project.title,
      subtitle: project.subtitle,
      category: project.category,
      creditLabel: entry.commission ? 'Commission' : 'Client',
      credit: entry.commission ?? project.client,
      year: project.year,
      image: { src, w, h, alt: entry.alt },
      composition,
      side: entry.side ?? (i % 2 === 0 ? 'right' : 'left'),
      copyZone: entry.copyZone ?? 'bottom-left',
      hold: CHAPTER.hold[composition],
      sizes: SIZES[composition],
      morph: src === project.image,
    }
  })
}

/** Slugs on the exhibition wall, in order — for tests and the index. */
export const EXHIBITION_SLUGS = EXHIBITION.map((e) => e.slug)
