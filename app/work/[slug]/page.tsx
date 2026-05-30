import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projects, getProject, getAdjacent } from '@/lib/projects'
import { getGallery } from '@/lib/galleries'
import { SITE, SITE_URL } from '@/lib/site'
import CaseStudyGallery from '@/components/CaseStudyGallery'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = getProject(params.slug)
  if (!project) return {}
  const title = `${project.title} — ${project.category} | ${SITE.name}`
  const description = `${project.category} photography for ${project.client} (${project.year}) by ${SITE.name}.`
  return {
    title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/work/${project.slug}`,
      images: [{ url: project.image }],
    },
  }
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug)
  if (!project) notFound()

  const gallery = getGallery(project.image)
  const adjacent = getAdjacent(project.slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    creator: { '@type': 'Person', name: SITE.name, url: SITE_URL },
    about: project.category,
    dateCreated: project.year,
    image: `${SITE_URL}${project.image}`,
    url: `${SITE_URL}/work/${project.slug}`,
  }

  return (
    <main className="min-h-screen bg-ebony text-bone">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-8">
        <Link
          href="/#work"
          className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver/60 hover:text-bone transition-colors"
        >
          ← Back to work
        </Link>
        <Link
          href="/"
          className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver/60 hover:text-bone transition-colors"
        >
          {SITE.name}
        </Link>
      </header>

      {/* Title block */}
      <section className="px-6 md:px-12 pt-10 pb-16 max-w-5xl">
        <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-silver/40 mb-6">
          {project.category} · {project.year}
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] italic text-bone" style={{ fontWeight: 300 }}>
          {project.title}
        </h1>
        <p className="font-sans text-[0.7rem] tracking-[0.15em] text-silver/50 mt-6">
          Client — {project.client}
        </p>
      </section>

      {/* Gallery */}
      <section className="px-6 md:px-12 pb-24">
        <CaseStudyGallery images={gallery} title={project.title} />
      </section>

      {/* Prev / next */}
      {adjacent && (
        <nav className="border-t border-bone/10 grid grid-cols-2">
          <Link
            href={`/work/${adjacent.prev.slug}`}
            className="group px-6 md:px-12 py-10 hover:bg-bone/[0.03] transition-colors"
          >
            <span className="block font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/40 mb-2">Previous</span>
            <span className="font-serif text-[1.3rem] italic text-bone/80 group-hover:text-bone" style={{ fontWeight: 300 }}>
              {adjacent.prev.title}
            </span>
          </Link>
          <Link
            href={`/work/${adjacent.next.slug}`}
            className="group px-6 md:px-12 py-10 text-right hover:bg-bone/[0.03] transition-colors border-l border-bone/10"
          >
            <span className="block font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/40 mb-2">Next</span>
            <span className="font-serif text-[1.3rem] italic text-bone/80 group-hover:text-bone" style={{ fontWeight: 300 }}>
              {adjacent.next.title}
            </span>
          </Link>
        </nav>
      )}
    </main>
  )
}
