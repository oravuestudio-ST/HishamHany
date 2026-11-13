import type { Metadata } from 'next'
import HomeClient from '@/components/home/HomeClient'
import ProjectIndex from '@/components/home/ProjectIndex'
import { getChapters } from '@/lib/chapters'

/**
 * Hero A/B test, variant B (lib/experiments.ts HERO_EXPERIMENT). Served at "/"
 * by the middleware rewrite to visitors assigned "b"; a direct visit redirects
 * home. Canonical points at "/" and the page is kept out of indexes, so search
 * engines only ever see one home page.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  robots: { index: false, follow: true },
}

export default function HomeVariantB() {
  return (
    <HomeClient chapters={getChapters()} heroVariant="b">
      <ProjectIndex />
    </HomeClient>
  )
}
