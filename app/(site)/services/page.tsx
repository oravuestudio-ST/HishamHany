import type { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import ProductionBlock from '@/components/services/ProductionBlock'
import WorkflowSection from '@/components/services/WorkflowSection'
import { services } from '@/lib/services'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `Services — ${SITE.name}`,
  description:
    'Five productions — fashion campaigns, automotive, commercial and product, portraits, editorial and events. Creative direction to delivery, as one engagement.',
  alternates: { canonical: '/services' },
}

/**
 * Services as premium productions: each engagement presented with real
 * case-study media, ideal client, deliverables, and inquiry-led investment —
 * followed by the client-experience workflow and the invitation to talk.
 */
export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <PageHeader
        eyebrow={`Services — ${services.length} productions`}
        title="Productions"
        accent="not packages."
        lead="Every engagement runs the same spine — creative direction, production, post, delivery — shaped to the brief. Photography is the deliverable; the process is the service."
      />

      {services.map((service, i) => (
        <ProductionBlock key={service.slug} service={service} flip={i % 2 === 1} />
      ))}

      <WorkflowSection />

      {/* Closing invitation */}
      <section className="px-6 md:px-12 py-section-sm border-t border-fg/10 text-center">
        <p className="font-sans text-label-xs uppercase text-muted/50 mb-6">Begin</p>
        <p className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
          Tell me what the images
          <br />
          <em className="text-accent italic">need to do.</em>
        </p>
        <Link
          href="/contact"
          data-cursor="Contact"
          className="btn-fill inline-block border border-fg/25 px-12 py-5 mt-12 font-sans text-label-sm uppercase text-fg transition-colors duration-500"
        >
          Start the conversation
        </Link>
      </section>
    </main>
  )
}
