import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import About from '@/components/About'
import Process from '@/components/about/Process'
import { SITE, aboutJsonLd } from '@/lib/site'

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
    <main id="main" tabIndex={-1} className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd()) }}
      />
      <PageHeader
        eyebrow={`About — ${SITE.location}`}
        title="Behind"
        accent="the frame"
        lead="Photography is the art of translating brand identity into a single, indelible frame. This is the practice, the philosophy, and the way we'd work together."
        frame={
          <div data-frame-open className="relative aspect-[4/5] overflow-hidden bg-fg/5">
            <div className="absolute inset-0">
              <Image
                src="/images/hisham-portrait-v4.jpg"
                alt="Hisham Hany"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
        }
      />

      {/* Philosophy and stats — the portrait opens the page in the header frame */}
      <About />

      {/* Working principles */}
      <Process />

      {/* Closing invitation */}
      <section className="px-6 md:px-12 py-section-sm border-t border-line text-center">
        <p className="eyebrow mb-6">Next</p>
        <p className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
          See the work, or
          <br />
          <em className="text-accent italic">start your own.</em>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
          <Link
            href="/portfolio"
            data-cursor="View"
            className="btn-fill btn-cta"
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
