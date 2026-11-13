import type { Metadata } from 'next'
import HomeClient from '@/components/home/HomeClient'
import ProjectIndex from '@/components/home/ProjectIndex'
import { getChapters } from '@/lib/chapters'

/**
 * Hero A/B test, variant B (lib/experiments.ts HERO_EXPERIMENT). Served at "/"
 * by the middleware rewrite to visitors assigned "b"; a direct visit redirects
 * home, so the page has no URL of its own to index. It must stay indexable:
 * it is served AT "/", so a noindex here would tell crawlers that land in this
 * arm to drop the home page. Canonical points at "/".
 */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomeVariantB() {
  return (
    <HomeClient chapters={getChapters()} heroVariant="b">
      <ProjectIndex />
    </HomeClient>
  )
}
