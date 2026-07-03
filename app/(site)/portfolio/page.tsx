import type { Metadata } from 'next'
import { Suspense } from 'react'
import PortfolioClient from '@/components/portfolio/PortfolioClient'
import { projects } from '@/lib/projects'
import { SITE, portfolioJsonLd } from '@/lib/site'

export const metadata: Metadata = {
  title: `Portfolio — ${SITE.name}`,
  description:
    'The complete record — fashion, automotive, commercial, and editorial photography. Campaigns and case studies by Hisham Hany, Cairo.',
  alternates: { canonical: '/portfolio' },
}

/**
 * Portfolio archive. The client component reads ?category= via
 * useSearchParams (hence the Suspense boundary) so filtered views are
 * shareable and survive a hard refresh.
 */
export default function PortfolioPage() {
  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            portfolioJsonLd(projects.map((p) => ({ name: p.title, url: `/work/${p.slug}` })))
          ),
        }}
      />
      <Suspense>
        <PortfolioClient />
      </Suspense>
    </main>
  )
}
