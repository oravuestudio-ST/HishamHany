'use client'

import HoverIndexList, { type IndexItem } from '@/components/HoverIndexList'
import { useCountUp } from '@/hooks/useCountUp'
import { projects } from '@/lib/projects'

/**
 * "Full Index" — a scannable editorial list of every project. Hovering a row
 * floats a cursor-trailing thumbnail (15) and the count in the header counts up
 * on scroll-in (17, reusing useCountUp). The CTA is a marquee-fill button (22).
 */
export default function IndexSection() {
  const items: IndexItem[] = projects.map((p) => ({
    title: p.title,
    meta: `${p.category} · ${p.year}`,
    img: p.image,
    href: `/work/${p.slug}`,
  }))

  const countRef = useCountUp<HTMLSpanElement>(projects.length, {
    format: (n) => String(Math.floor(n)).padStart(2, '0'),
  })

  return (
    <section id="index" className="section-pad">
      <div className="flex items-end justify-between gap-8 mb-12 md:mb-16">
        <div>
          <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-fg/40 mb-5">
            — Full Index
          </p>
          <h2 className="font-serif text-[clamp(2.4rem,6vw,5rem)] text-fg leading-[0.95]" style={{ fontWeight: 400 }}>
            Selected <em className="text-accent italic" style={{ fontWeight: 400 }}>Works</em>
          </h2>
        </div>
        <div className="text-right shrink-0">
          <span ref={countRef} className="block font-serif text-[clamp(2.5rem,5vw,4rem)] text-accent leading-none tabular-nums">
            {String(projects.length).padStart(2, '0')}
          </span>
          <p className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-fg/40 mt-2">Projects</p>
        </div>
      </div>

      <HoverIndexList items={items} />

      <div className="mt-14 flex justify-center">
        {/* 22 · Marquee button — label slides on hover, accent pill */}
        <a
          href="#work"
          data-cursor="View"
          className="btn-marquee bg-accent text-paper rounded-full px-7 py-4 font-sans text-xs uppercase tracking-[0.22em]"
        >
          <span className="btn-marquee__track">
            <span className="btn-marquee__cell">View the work →</span>
            <span className="btn-marquee__cell">View the work →</span>
          </span>
        </a>
      </div>
    </section>
  )
}
