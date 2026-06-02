import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { projects } from './schema'

type Category = 'Fashion' | 'Automotive' | 'Commercial' | 'Editorial'
type Aspect = 'portrait' | 'landscape'

interface RawProject {
  id: number
  title: string
  category: Category
  year: string
  client: string
  image: string
  aspect: Aspect
  colorized?: boolean
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const raw: RawProject[] = [
  { id: 1, title: 'Glitch Club — Outdoor', category: 'Fashion', year: '2024', client: 'Glitch Goods', image: '/images/Fashion/GLITCH%20GOODS/GLITCH%20CLUB_outdoor/Glitch_outdoor-036.jpg', aspect: 'portrait' },
  { id: 2, title: 'Mercedes GLE 450', category: 'Automotive', year: '2024', client: 'Automotive Campaign', image: '/images/Automotive/GLE-450/Hero_GLE450_car-004.JPG', aspect: 'landscape' },
  { id: 3, title: 'Baby Gang', category: 'Fashion', year: '2024', client: 'Baby Gang', image: '/images/Childs/FAshion/Baby%20gang/BabyGang_fashion-001.jpg', aspect: 'portrait' },
  { id: 7, title: 'Bnghaty × Koptan', category: 'Editorial', year: '2024', client: 'Bnghaty Event', image: '/images/Events/Bnghaty%20event/Bnghaty_koptan-001.jpg', aspect: 'portrait' },
  { id: 8, title: 'Ayman & Salma — Party', category: 'Editorial', year: '2024', client: 'Ayman & Salma', image: '/images/Childs/PARTY/AymanSalma_party-002.JPG', aspect: 'landscape' },
  { id: 10, title: 'Glitch Club — Germany', category: 'Fashion', year: '2024', client: 'Glitch Goods', image: '/images/Fashion/GLITCH%20GOODS/Glitch_club%20germany/Glitch_germany-001.jpg', aspect: 'portrait' },
  { id: 11, title: 'Glitch Club — Party Till Die', category: 'Fashion', year: '2024', client: 'Glitch Goods', image: '/images/Fashion/GLITCH%20GOODS/Glitch_party-till-die/Glitch_partyTillDie-001.JPG', aspect: 'portrait' },
  { id: 12, title: 'Glitch Set', category: 'Fashion', year: '2024', client: 'Glitch Goods', image: '/images/Fashion/GLITCH%20GOODS/Gitch%20set/Glitch_set-Hero.jpg', aspect: 'portrait', colorized: true },
  { id: 13, title: 'Glitch — Kanta', category: 'Fashion', year: '2024', client: 'Glitch Goods', image: '/images/Fashion/GLITCH%20GOODS/kanta/Glitch_kanta-001.JPG', aspect: 'portrait' },
  { id: 14, title: 'Glitch — Circle KK', category: 'Fashion', year: '2024', client: 'Glitch Goods', image: '/images/Fashion/GLITCH%20GOODS/circle%20kk/Glitch_circlekk-001.JPG', aspect: 'portrait' },
  { id: 15, title: 'Glitch — Bag', category: 'Fashion', year: '2024', client: 'Glitch Goods', image: '/images/Fashion/GLITCH%20GOODS/bag/Glitch_bag-001.JPG', aspect: 'portrait' },
  { id: 4, title: 'Isis Festival', category: 'Editorial', year: '2023', client: 'Events & Press', image: '/images/Events/Isis%20festival%20event/Isis_glitchybag-001.jpg', aspect: 'portrait' },
  { id: 9, title: 'Koptan — Jetta', category: 'Automotive', year: '2024', client: 'Koptan', image: '/images/Automotive/koptan%20jetta/hero%20jetta.JPG', aspect: 'landscape' },
  { id: 16, title: 'Glide Scooter', category: 'Automotive', year: '2024', client: 'Glide', image: '/images/Automotive/Glide%20scooter/hero.JPG', aspect: 'landscape', colorized: true },
  { id: 5, title: 'Seat Ibiza', category: 'Automotive', year: '2024', client: 'Automotive Campaign', image: '/images/Automotive/Seat%20ibiza/Hero.JPG', aspect: 'landscape' },
  { id: 6, title: 'New Capital', category: 'Editorial', year: '2023', client: 'Architectural Editorial', image: '/images/New%20capital/NewCapital_architecture-%20Hero.JPG', aspect: 'landscape' },
]

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql, { schema: { projects } })

  console.log('Seeding projects...')

  const rows = raw.map((p, i) => ({
    slug: slugify(p.title),
    title: p.title,
    category: p.category,
    year: p.year,
    client: p.client,
    image: p.image,
    aspect: p.aspect,
    colorized: p.colorized ?? false,
    visible: true,
    order: i,
  }))

  await db
    .insert(projects)
    .values(rows)
    .onConflictDoNothing()

  console.log(`Inserted ${rows.length} projects.`)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
