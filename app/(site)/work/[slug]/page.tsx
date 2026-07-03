import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projects, getProject, getAdjacent, getRelated } from '@/lib/projects'
import { getGallery, getColorGroups, withDimensions } from '@/lib/galleries'
import { SITE, SITE_URL } from '@/lib/site'
import CaseCover from '@/components/case-study/CaseCover'
import CaseMeta from '@/components/case-study/CaseMeta'
import CaseOverview from '@/components/case-study/CaseOverview'
import CaseSpread from '@/components/case-study/CaseSpread'
import CaseApproach from '@/components/case-study/CaseApproach'
import CaseQuote from '@/components/case-study/CaseQuote'
import CaseNext from '@/components/case-study/CaseNext'
import FeatureSlot from '@/components/case-study/FeatureSlot'
import { featuresFor } from '@/components/case-study/features'

const GlitchColorGrid = nextDynamic(() => import('@/components/GlitchColorGrid'), { ssr: false })

export const dynamic = 'force-static'

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = getProject(params.slug)
  if (!project) return {}
  const title = `${project.title} — ${project.category} | ${SITE.name}`
  const description =
    project.editorial?.overview?.[0] ??
    project.description ??
    `${project.category} photography for ${project.client} (${project.year}) by ${SITE.name}.`
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

/**
 * Case study as a magazine editorial: full-bleed cover, Swiss fact sheet,
 * long-form overview with objectives, a sequenced image spread, direction +
 * production notes, client voice, and the road on — related projects and the
 * next story. All long-form content is data-driven from lib/projects.ts.
 */
export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug)
  if (!project) notFound()

  // Server-side gallery enrichment: intrinsic dimensions for CLS-free spreads.
  const gallery = getGallery(project.image)
  const sequence = project.editorial?.sequence?.length ? project.editorial.sequence : gallery
  // The cover already shows the hero image — don't repeat it at the top of the spread.
  const spreadImages = withDimensions(sequence.filter((src) => src !== project.image))
  const colorGroups = project.colorized ? getColorGroups(project.image) : []
  const adjacent = getAdjacent(project.slug)
  const related = getRelated(project.slug)
  const afterGalleryFeatures = featuresFor(project.editorial?.features, 'after-gallery')

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
    <main className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <CaseCover project={project} />
      <CaseMeta project={project} />
      <CaseOverview project={project} />

      {/* Image sequence — colorized projects lead with the color-grid study */}
      {project.colorized && colorGroups.length > 0 && (
        <section className="px-6 md:px-12 pb-16">
          <GlitchColorGrid colorSets={colorGroups} title={project.title} />
        </section>
      )}
      <CaseSpread images={spreadImages} title={project.title} />

      <CaseApproach project={project} />

      {afterGalleryFeatures.map((key) => (
        <FeatureSlot key={key} featureKey={key} />
      ))}

      <CaseQuote client={project.client} />

      {adjacent && <CaseNext related={related} next={adjacent.next} />}

      {/* Index escape hatch */}
      <div className="px-6 md:px-12 py-10 border-t border-fg/10">
        <Link
          href="/portfolio"
          className="link-underline font-sans text-label-sm uppercase text-muted/60 hover:text-fg transition-colors duration-300"
        >
          ← All projects
        </Link>
      </div>
    </main>
  )
}
