'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Service } from '@/lib/services'
import { getProject } from '@/lib/projects'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * One production, presented as an engagement rather than a package: sticky
 * media column from a real case study, numbered title, ideal client,
 * deliverables, and inquiry-led investment. Media alternates sides.
 */
export default function ProductionBlock({ service, flip }: { service: Service; flip: boolean }) {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.production-item' })
  const cover = getProject(service.coverProject)

  return (
    <article id={service.slug} className="border-t border-fg/10">
      <div
        ref={revealRef}
        className={`grid md:grid-cols-12 gap-x-8 gap-y-10 px-6 md:px-12 py-stack-lg items-start`}
      >
        {/* Media column — sticky against the copy */}
        <div className={`production-item md:col-span-5 md:sticky md:top-28 ${flip ? 'md:order-2 md:col-start-8' : ''}`}>
          {cover && (
            <Link href={`/work/${cover.slug}`} data-cursor="View Case" className="group block">
              <div className="relative overflow-hidden bg-fg/5">
                <Image
                  src={cover.image}
                  alt={`${service.title} — from the ${cover.title} case study`}
                  width={0}
                  height={0}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="develop block w-full h-auto group-hover:scale-[1.03] transition-transform duration-700 ease-premium"
                />
              </div>
              <p className="font-sans text-label-xs uppercase text-muted/50 mt-4 group-hover:text-muted transition-colors duration-300">
                From the case study — {cover.title}
                {cover.subtitle ? ` · ${cover.subtitle}` : ''} →
              </p>
            </Link>
          )}
        </div>

        {/* Copy column */}
        <div className={`md:col-span-6 ${flip ? 'md:order-1' : 'md:col-start-7'}`}>
          <div className="production-item">
            <p className="font-sans text-label-xs uppercase text-muted/40">
              {service.num} — {service.eyebrow}
            </p>
            <h2 className="font-serif text-display-sm text-fg mt-4" style={{ fontWeight: 300 }}>
              {service.title}
            </h2>
            <p className="font-sans text-body text-fg/80 mt-6 max-w-measure">{service.description}</p>
          </div>

          <div className="production-item mt-10">
            <p className="font-sans text-label-xs uppercase text-muted/40 mb-3">Ideal for</p>
            <p className="font-sans text-body-sm text-fg/75 max-w-measure">{service.idealFor}</p>
          </div>

          <div className="production-item mt-10">
            <p className="font-sans text-label-xs uppercase text-muted/40 mb-4">Deliverables</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {service.deliverables.map((d) => (
                <li key={d} className="font-sans text-body-sm text-fg/75 border-t border-fg/10 pt-3">
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="production-item mt-10 flex flex-wrap items-baseline justify-between gap-6 border-t border-fg/10 pt-6">
            <p className="font-sans text-label-sm uppercase text-muted/60">
              {service.priceFrom ? `Investment starts from ${service.priceFrom}` : 'Investment — on request'}
            </p>
            <Link
              href="/contact"
              data-cursor="Inquire"
              className="magnetic-btn link-underline font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300"
            >
              Request a proposal →
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
