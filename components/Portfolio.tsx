'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { projects, categories, type Project } from '@/lib/projects'

const WebGLImage = dynamic(() => import('@/components/WebGLImage'), { ssr: false })
const SectionEyebrowLens = dynamic(() => import('@/components/SectionEyebrowLens'), { ssr: false })

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function Portfolio() {
  const [active, setActive] = useState('All')
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered = active === 'All' ? projects : projects.filter((p) => p.category === active)

  useEffect(() => {
    const lines = titleRef.current?.querySelectorAll('.reveal-inner')
    if (!lines) return

    const ctx = gsap.context(() => {
      gsap.from(lines, {
        yPercent: 110,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 82%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // Animate grid items in on filter change
  useEffect(() => {
    const items = gridRef.current?.querySelectorAll('.portfolio-item')
    if (!items) return
    gsap.fromTo(items,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }
    )
  }, [filtered])

  return (
    <section ref={sectionRef} id="work" className="section-pad">
      {/* Section header */}
      <div ref={titleRef} className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-silver/40 mb-5 flex items-center">
            <SectionEyebrowLens />
            02 — Selected Work
          </p>
          <div className="overflow-hidden">
            <h2 className="reveal-inner font-serif text-[clamp(3rem,7vw,7rem)] text-bone italic" style={{ fontWeight: 300 }}>
              Visual Stories
            </h2>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`font-sans text-[0.58rem] tracking-[0.25em] uppercase px-4 py-2 border transition-all duration-400 ${
                active === cat
                  ? 'border-bone/40 text-bone bg-bone/5'
                  : 'border-bone/10 text-silver/40 hover:border-bone/20 hover:text-silver/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry column layout */}
      <div ref={gridRef} className="columns-1 md:columns-2 lg:columns-3 gap-5">
        {filtered.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>

      {/* View all */}
      <div className="flex justify-center mt-20">
        <button
          data-cursor="View All"
          className="magnetic-btn group flex items-center gap-4 font-sans text-[0.62rem] tracking-[0.35em] uppercase text-silver/60 hover:text-bone transition-colors duration-400"
        >
          <span className="w-12 h-px bg-silver/30 group-hover:w-20 group-hover:bg-bone/60 transition-all duration-500" />
          View Complete Archive
          <span className="w-12 h-px bg-silver/30 group-hover:w-20 group-hover:bg-bone/60 transition-all duration-500" />
        </button>
      </div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    gsap.to(infoRef.current, { opacity: 1, duration: 0.3, ease: 'expo.out' })
  }

  const handleMouseLeave = () => {
    gsap.to(infoRef.current, { opacity: 0.5, duration: 0.4, ease: 'expo.in' })
  }

  return (
    <div
      ref={cardRef}
      className="portfolio-item group relative break-inside-avoid mb-5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-cursor="View"
    >
      {/* Image → links to the case-study page */}
      <Link
        href={`/work/${project.slug}`}
        aria-label={`View case study — ${project.title}`}
        className="block relative overflow-hidden bg-silver/5"
      >
        <WebGLImage
          src={project.image}
          alt={project.title}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-ebony/0 group-hover:bg-ebony/30 transition-colors duration-500" />

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className="font-sans text-[0.5rem] tracking-[0.3em] uppercase text-bone/60 bg-ebony/40 backdrop-blur-sm px-3 py-1.5">
            {project.category}
          </span>
        </div>
      </Link>

      {/* Info */}
      <div ref={infoRef} className="flex items-start justify-between mt-4 opacity-50">
        <div>
          <Link href={`/work/${project.slug}`} className="font-serif text-[1.15rem] text-bone italic hover:text-ember transition-colors" style={{ fontWeight: 300 }}>
            {project.title}
          </Link>
          <p className="font-sans text-[0.58rem] tracking-[0.2em] uppercase text-silver/50 mt-1">
            {project.client}
          </p>
        </div>
        <span className="font-sans text-[0.55rem] tracking-[0.15em] text-silver/30 mt-1">
          {project.year}
        </span>
      </div>
    </div>
  )
}
