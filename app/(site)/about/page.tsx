import type { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import About from '@/components/About'
import Process from '@/components/about/Process'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `About — ${SITE.name}`,
  description:
    'Cairo-based photographer working across fashion, automotive, and commercial campaigns — philosophy, working principles, and the practice behind the frames.',
  alternates: { canonical: '/about' },
}

/**
 * The creative-partner story: headline positioning, the portrait/philosophy/
 * stats section (the strongest existing component, kept), and the working
 * principles that define collaboration — closing into the invitation.
 */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <PageHeader
        eyebrow={`About — ${SITE.location}`}
        title="Behind"
        accent="the frame"
        lead="Photography is the art of translating brand identity into a single, indelible frame. This is the practice, the philosophy, and the way we'd work together."
      />

      {/* Portrait, philosophy, stats, and the 3D camera — the core section */}
      <About />

      {/* Working principles */}
      <Process />

      {/* Closing invitation */}
      <section className="px-6 md:px-12 py-section-sm border-t border-fg/10 text-center">
        <p className="font-sans text-label-xs uppercase text-muted/50 mb-6">Next</p>
        <p className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
          See the work, or
          <br />
          <em className="text-accent italic">start your own.</em>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
          <Link
            href="/portfolio"
            data-cursor="View"
            className="btn-fill inline-block border border-fg/25 px-10 py-4 font-sans text-label-sm uppercase text-fg transition-colors duration-500"
          >
            The portfolio
          </Link>
          <Link
            href="/contact"
            data-cursor="Contact"
            className="link-underline font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300"
          >
            Start a project →
          </Link>
        </div>
      </section>
    </main>
  )
}
