'use client'

import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const PRINCIPLES = [
  {
    num: '01',
    title: 'One conversation before any camera',
    body: 'Every commission starts with the brief, not the gear. What the images need to do decides everything that follows — casting, location, light, and edit.',
  },
  {
    num: '02',
    title: 'Controlled light, wherever the location',
    body: 'Studio discipline travels. A street, a site office, or a dawn roadside gets the same intentional light as a cyclorama — that consistency is the signature.',
  },
  {
    num: '03',
    title: 'Selects you publish, not sift',
    body: 'Delivery means publication-ready frames in the formats the campaign needs. The edit is part of the craft; nobody should wade through near-duplicates.',
  },
  {
    num: '04',
    title: 'Deadlines are part of the craft',
    body: 'Advertising and editorial run on calendars. The work is built to arrive on time without the quality conversation ever becoming a schedule conversation.',
  },
]

/**
 * "How I work" — the collaboration contract in four principles. Pairs with
 * the seven-step workflow on /services; this is the personal voice behind it.
 */
export default function Process() {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.principle' })

  return (
    <section className="px-6 md:px-12 py-section-sm border-t border-fg/10">
      <div className="mb-16 max-w-5xl">
        <p className="font-sans text-label-xs uppercase text-muted/40 mb-5">How I Work</p>
        <h2 className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
          A creative partner,
          <br />
          <em className="text-accent italic">not a vendor.</em>
        </h2>
      </div>

      <div ref={revealRef} className="grid md:grid-cols-2 gap-x-16 gap-y-12">
        {PRINCIPLES.map(({ num, title, body }) => (
          <div key={num} className="principle border-t border-fg/10 pt-6">
            <span className="font-sans text-label-xs text-accent">{num}</span>
            <h3 className="font-serif text-2xl md:text-3xl text-fg mt-3" style={{ fontWeight: 300 }}>
              {title}
            </h3>
            <p className="font-sans text-body-sm text-muted/80 mt-4 max-w-measure">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-fg/10 pt-8 flex flex-wrap items-baseline justify-between gap-6">
        <p className="font-sans text-body-sm text-muted/70 max-w-measure">
          The full production workflow — Discovery through Support — lives on the services page.
        </p>
        <Link
          href="/services"
          data-cursor="View"
          className="link-underline font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300"
        >
          See the client experience →
        </Link>
      </div>
    </section>
  )
}
