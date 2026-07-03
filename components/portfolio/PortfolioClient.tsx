'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { gsap } from 'gsap'
import { projects, categories, type Category } from '@/lib/projects'
import { MOTION, gsapEase, registerMotion, prefersReducedMotion } from '@/lib/motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useTilt } from '@/hooks/useTilt'
import HoverIndexList from '@/components/HoverIndexList'
import FeaturedStrip from '@/components/portfolio/FeaturedStrip'

registerMotion()

type Filter = (typeof categories)[number]

/**
 * The portfolio archive: masked headline, shareable category rail
 * (?category=Fashion survives refresh and can be deep-linked), an editorial
 * cover grid, and the hover-preview index of everything. Home curates; this
 * page is the complete record.
 */
export default function PortfolioClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const titleRef = useRef<HTMLDivElement>(null)

  const param = searchParams.get('category')
  const active: Filter = (categories as readonly string[]).includes(param ?? '')
    ? (param as Filter)
    : 'All'

  const filtered = useMemo(
    () => (active === 'All' ? projects : projects.filter((p) => p.category === (active as Category))),
    [active]
  )

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([['All', projects.length]])
    for (const c of categories.slice(1)) {
      map.set(c, projects.filter((p) => p.category === c).length)
    }
    return map
  }, [])

  const setCategory = (c: Filter) => {
    router.replace(c === 'All' ? '/portfolio' : `/portfolio?category=${c}`, { scroll: false })
  }

  // Masked headline rise on load.
  useEffect(() => {
    const lines = titleRef.current?.querySelectorAll('.reveal-inner')
    if (!lines || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(lines, { yPercent: 110, duration: MOTION.dur.hero, ease: gsapEase(), stagger: MOTION.stagger })
    })
    return () => ctx.revert()
  }, [])

  const indexItems = filtered.map((p) => ({
    title: p.subtitle ? `${p.title} — ${p.subtitle}` : p.title,
    meta: `${p.category} · ${p.client} · ${p.year}`,
    img: p.image,
    href: `/work/${p.slug}`,
  }))

  return (
    <>
      {/* Headline */}
      <section className="px-6 md:px-12 pt-36 pb-16">
        <div ref={titleRef}>
          <p className="font-sans text-label-xs uppercase text-muted/50 mb-5">
            Portfolio — {projects.length} projects
          </p>
          <div className="overflow-hidden">
            <h1
              className="reveal-inner font-serif uppercase text-fg leading-[0.9] tracking-tight text-display-lg"
              style={{ fontWeight: 400 }}
            >
              Selected
            </h1>
          </div>
          <div className="overflow-hidden">
            <p
              className="reveal-inner font-serif italic text-accent leading-[0.95] text-display"
              style={{ fontWeight: 300 }}
            >
              Works
            </p>
          </div>
        </div>

        {/* Category rail — shareable filter state */}
        <nav aria-label="Filter by category" className="flex flex-wrap gap-x-8 gap-y-3 mt-14 border-t border-fg/10 pt-6">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active === c}
              className={`group font-sans text-label-sm uppercase transition-colors duration-300 ${
                active === c ? 'text-accent' : 'text-muted/60 hover:text-fg'
              }`}
            >
              {c}
              <sup className="ml-1.5 font-sans text-[0.55em] text-muted/40 group-hover:text-muted/70">
                {counts.get(c)}
              </sup>
            </button>
          ))}
        </nav>
      </section>

      {/* Featured horizontal beat — only on the unfiltered archive */}
      {active === 'All' && <FeaturedStrip />}

      {/* Editorial cover grid */}
      <section aria-label={`${active} projects`} className="px-6 md:px-12 pb-section-sm pt-16">
        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PortfolioCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      {/* Hover-preview index of the same set */}
      <section className="px-6 md:px-12 pb-section-sm border-t border-fg/10 pt-16">
        <p className="font-sans text-label-xs uppercase text-muted/40 mb-10">Index</p>
        <HoverIndexList items={indexItems} />
      </section>
    </>
  )
}

function PortfolioCard({ project, index }: { project: (typeof projects)[number]; index: number }) {
  const tilt = useTilt<HTMLAnchorElement>({ rotX: 7, rotY: 9 })
  const revealRef = useScrollReveal<HTMLDivElement>()
  const num = String(index + 1).padStart(2, '0')

  return (
    <div ref={revealRef} style={{ perspective: '1100px' }}>
      <Link
        ref={tilt}
        href={`/work/${project.slug}`}
        data-cursor="View Case"
        aria-label={`View case study — ${project.title} ${project.subtitle ?? ''}`.trim()}
        className="group block"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <div className="relative overflow-hidden bg-fg/5">
          <Image
            src={project.image}
            alt={`${project.title} ${project.subtitle ?? ''}`.trim()}
            width={0}
            height={0}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="develop block w-full h-auto group-hover:scale-[1.03] transition-transform duration-700 ease-premium"
            priority={index < 3}
          />
        </div>
        <div className="flex items-baseline gap-4 mt-5">
          <span className="font-sans text-label-xs text-muted/40">{num}</span>
          <div>
            <p className="font-serif text-fg text-xl md:text-2xl leading-tight group-hover:text-accent transition-colors duration-300" style={{ fontWeight: 300 }}>
              {project.title}
              {project.subtitle && <em className="italic text-fg/70"> — {project.subtitle}</em>}
            </p>
            <p className="font-sans text-label-xs uppercase text-muted/50 mt-2">
              {project.category} · {project.client} · {project.year}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
