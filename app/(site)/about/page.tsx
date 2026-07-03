import type { Metadata } from 'next'
import About from '@/components/About'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `About — ${SITE.name}`,
  description:
    'Cairo-based photographer working across fashion, automotive, and commercial campaigns. Philosophy, process, and practice.',
  alternates: { canonical: '/about' },
}

/**
 * About — provisional layout hosting the photographer story. Phase 4 expands
 * this into the full creative-partner narrative.
 */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg text-fg pt-24">
      <About />
    </main>
  )
}
