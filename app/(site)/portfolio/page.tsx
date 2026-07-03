import type { Metadata } from 'next'
import CaseStudyFeed from '@/components/CaseStudyFeed'
import IndexSection from '@/components/IndexSection'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `Portfolio — ${SITE.name}`,
  description:
    'Selected fashion, automotive, commercial, and editorial photography — campaigns and case studies by Hisham Hany, Cairo.',
  alternates: { canonical: '/portfolio' },
}

/**
 * Portfolio index — provisional layout hosting the full case-study feed.
 * Phase 3 of the redesign replaces this with the category-filtered editorial
 * index; the route, metadata, and content are production-ready today.
 */
export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-bg text-fg pt-24">
      <CaseStudyFeed />
      <IndexSection />
    </main>
  )
}
