import type { Metadata } from 'next'
import Contact from '@/components/Contact'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `Contact — ${SITE.name}`,
  description:
    'Start a project — commissions for fashion, automotive, commercial, and editorial photography. Replies within 24 hours, Cairo time.',
  alternates: { canonical: '/contact' },
}

/**
 * Contact — hosts the working inquiry form. Phase 4 expands this into the
 * full luxury contact experience.
 */
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-bg text-fg pt-12">
      <Contact />
    </main>
  )
}
