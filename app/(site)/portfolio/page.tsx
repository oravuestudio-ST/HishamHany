import type { Metadata } from 'next'
import { Suspense } from 'react'
import PortfolioClient from '@/components/portfolio/PortfolioClient'
import { SITE } from '@/lib/site'

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
    <main className="min-h-screen bg-bg text-fg">
      <Suspense>
        <PortfolioClient />
      </Suspense>
    </main>
  )
}
