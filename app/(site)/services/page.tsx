import type { Metadata } from 'next'
import Services from '@/components/Services'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `Services — ${SITE.name}`,
  description:
    'Fashion campaigns, automotive shoots, commercial photography, and editorial productions — process, deliverables, and collaboration.',
  alternates: { canonical: '/services' },
}

/**
 * Services — provisional layout hosting the production overview. Phase 3
 * replaces this with the full premium-productions experience.
 */
export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-bg text-fg pt-24">
      <Services />
    </main>
  )
}
