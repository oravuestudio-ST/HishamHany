'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { projects, type Project } from '@/lib/projects'
import { getThumbnails } from '@/lib/case-study-thumbs'
import { MOTION, gsapEase, registerMotion } from '@/lib/motion'
import { useTilt } from '@/hooks/useTilt'

const SectionEyebrowLens = dynamic(() => import('@/components/SectionEyebrowLens'), { ssr: false })

registerMotion()

export default function CaseStudyFeed() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lines = titleRef.current?.querySelectorAll('.reveal-inner')
    if (!lines) return

    const ease = gsapEase()
    const ctx = gsap.context(() => {
      gsap.from(lines, {
        yPercent: 110,
        duration: MOTION.dur.hero,
        ease,
        stagger: MOTION.stagger,
        scrollTrigger: { trigger: titleRef.current, start: MOTION.scrollStart, once: true },
      })

      const rows = sectionRef.current?.querySelectorAll('.case-study-row')
      rows?.forEach((row) => {
        gsap.from(row, {
          opacity: 0,
          y: MOTION.revealDistance,
          duration: MOTION.dur.reveal,
          ease,
          scrollTrigger: { trigger: row, start: MOTION.scrollStart, once: true },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="work" className="section-pad">
      {/* Section header */}
      <div ref={titleRef} className="mb-24 md:mb-32 max-w-5xl">
        <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-silver/40 mb-5 flex items-center">
          <SectionEyebrowLens />
          02 — Selected Projects
        </p>
        <div className="overflow-hidden">
          <h2
            className="reveal-inner font-serif text-[clamp(3rem,7vw,7rem)] text-bone leading-[0.95]"
            style={{ fontWeight: 300 }}
          >
            Campaign <em className="text-ember italic" style={{ fontWeight: 300 }}>Work</em>
          </h2>
        </div>
      </div>

      {/* Projects feed */}
      <div className="space-y-28 md:space-y-44">
        {projects.map((project, index) => (
          <CaseStudyRow key={project.id} project={project} index={index} />
        ))}
      </div>

      {/* Footer link */}
      <div className="flex justify-center mt-32 md:mt-40">
        <Link
          href="/work"
          data-cursor="View All"
          className="magnetic-btn group flex items-center gap-4 font-sans text-[0.62rem] tracking-[0.35em] uppercase text-silver/60 hover:text-bone transition-colors duration-400"
        >
          <span className="w-12 h-px bg-silver/30 group-hover:w-20 group-hover:bg-bone/60 transition-all duration-500" />
          View Complete Archive
          <span className="w-12 h-px bg-silver/30 group-hover:w-20 group-hover:bg-bone/60 transition-all duration-500" />
        </Link>
      </div>
    </section>
  )
}

function CaseStudyRow({ project, index }: { project: Project; index: number }) {
  const thumbs = getThumbnails(project.image, 3)
  const num = String(index + 1).padStart(2, '0')
  const heroAspect = project.aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'
  // Hero image tilt — the deeper of the two magnitudes (it's the focal card).
  const heroTilt = useTilt<HTMLAnchorElement>({ rotX: 9, rotY: 11 })

  return (
    <article className="case-study-row">
      <div className="grid md:grid-cols-12 gap-8 md:gap-16 lg:gap-20 items-start">
        {/* Visual side — hero + thumbnail strip */}
        <div className="md:col-span-7">
          {/* Perspective container — gives the tilt plane its depth. */}
          <div style={{ perspective: '1100px' }}>
            <Link
              ref={heroTilt}
              href={`/work/${project.slug}`}
              data-cursor="View Case"
              aria-label={`View case study — ${project.title} ${project.subtitle ?? ''}`}
              className="group block relative bg-silver/5"
              style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
            >
              {/* Clip layer — overflow-hidden lives here, NOT on the preserve-3d
                  plane (overflow:hidden flattens 3D, which would sink the badge). */}
              <div className={`relative overflow-hidden ${heroAspect}`}>
                <Image
                  src={project.image}
                  alt={`${project.title} ${project.subtitle ?? ''}`.trim()}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover transition-transform duration-[800ms] ease-premium group-hover:scale-[1.08]"
                  priority={index < 2}
                />
                <div className="absolute inset-0 bg-ebony/0 group-hover:bg-ebony/20 transition-colors duration-500" />
              </div>

              {/* Category badge — floats above the tilting plane on its own Z. */}
              <span
                className="absolute bottom-4 left-4 md:bottom-5 md:left-5 font-sans text-[0.55rem] tracking-[0.3em] uppercase text-bone/90 bg-ebony/70 backdrop-blur-md border border-bone/15 px-3 py-1.5 pointer-events-none"
                style={{ transform: 'translateZ(48px)' }}
              >
                {project.category}
              </span>
            </Link>
          </div>

          {thumbs.length > 0 && (
            <div
              className="mt-3 md:mt-4 grid gap-3 md:gap-4"
              style={{ gridTemplateColumns: `repeat(${thumbs.length}, minmax(0, 1fr))` }}
            >
              {thumbs.map((src, i) => (
                <TiltThumb
                  key={i}
                  src={src}
                  slug={project.slug}
                  alt={`${project.title} thumbnail ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Meta side */}
        <div className="md:col-span-5 relative md:pt-4">
          {/* Ghost numeral */}
          <div
            className="absolute -top-2 md:-top-6 -left-1 font-serif leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(5rem, 10vw, 9rem)', color: 'rgba(223, 215, 197, 0.07)', fontWeight: 300 }}
            aria-hidden="true"
          >
            {num}
          </div>

          <div className="relative pt-14 md:pt-16">
            {/* Tag row */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Tag>{project.category}</Tag>
              {project.scope && <Tag>{project.scope}</Tag>}
              {(project.location || project.year) && (
                <Tag>
                  {project.location}
                  {project.location && project.year ? ' · ' : ''}
                  {project.year}
                </Tag>
              )}
            </div>

            {/* Title */}
            <h3
              className="font-serif text-bone leading-[0.95] tracking-tight"
              style={{
                fontSize: 'clamp(2.25rem, 4.6vw, 4.5rem)',
                fontWeight: 300,
              }}
            >
              <Link
                href={`/work/${project.slug}`}
                className="hover:text-bone/80 transition-colors duration-300"
              >
                {project.title}
              </Link>
              {project.subtitle && (
                <>
                  <br />
                  <span className="text-ember italic" style={{ fontWeight: 300 }}>
                    {project.subtitle}
                  </span>
                </>
              )}
            </h3>

            {/* Description */}
            {project.description && (
              <p className="font-sans text-[0.78rem] md:text-[0.82rem] leading-[1.85] text-silver/70 mt-8 max-w-md">
                {project.description}
              </p>
            )}

            {/* Divider */}
            <div className="h-px bg-bone/10 my-10" />

            {/* Meta rows */}
            <dl className="space-y-4 font-sans text-[0.72rem]">
              <MetaRow label="Client" value={project.client} />
              {project.scope && <MetaRow label="Scope" value={project.scope} />}
              {project.output && <MetaRow label="Output" value={project.output} />}
            </dl>

            {/* Gallery link */}
            <Link
              href={`/work/${project.slug}`}
              data-cursor="Open"
              className="mt-10 inline-flex items-center gap-3 font-sans text-[0.58rem] tracking-[0.35em] uppercase text-ember hover:text-bone transition-colors duration-300 group"
            >
              {project.category} Gallery
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * A single thumbnail in the strip. Its own component so each can own a useTilt
 * instance (hooks can't run in the .map loop). No badge here, so the link keeps
 * its overflow-hidden clip — there's no translateZ child to flatten.
 */
function TiltThumb({ src, slug, alt }: { src: string; slug: string; alt: string }) {
  const tilt = useTilt<HTMLAnchorElement>({ rotX: 9, rotY: 11 })
  return (
    <div style={{ perspective: '1100px' }}>
      <Link
        ref={tilt}
        href={`/work/${slug}`}
        className="group block relative overflow-hidden bg-silver/5 aspect-[4/5]"
        data-cursor="View"
        style={{ willChange: 'transform' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 33vw, 20vw"
          className="object-cover transition-transform duration-[800ms] ease-premium group-hover:scale-[1.08]"
        />
      </Link>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/55 border border-bone/15 px-3 py-1.5">
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-6">
      <dt className="font-sans text-[0.58rem] tracking-[0.3em] uppercase text-silver/40 w-20 shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="font-sans text-[0.82rem] text-bone/85 leading-relaxed">{value}</dd>
    </div>
  )
}
