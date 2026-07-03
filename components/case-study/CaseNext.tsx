'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/projects'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useTilt } from '@/hooks/useTilt'

/**
 * Case-study closer: three related projects as editorial cards, then a
 * full-width invitation into the next project with its cover as the stage.
 */
export default function CaseNext({ related, next }: { related: Project[]; next: Project }) {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.related-card' })

  return (
    <>
      {related.length > 0 && (
        <section className="px-6 md:px-12 py-section-sm border-t border-fg/10">
          <p className="font-sans text-label-xs uppercase text-muted mb-12">Related Projects</p>
          <div ref={revealRef} className="grid md:grid-cols-3 gap-8 md:gap-12">
            {related.map((p) => (
              <RelatedCard key={p.slug} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Next project — full-width invitation */}
      <Link
        href={`/work/${next.slug}`}
        data-cursor="Next"
        className="group relative block overflow-hidden border-t border-fg/10"
        aria-label={`Next project — ${next.title} ${next.subtitle ?? ''}`.trim()}
      >
        <div className="absolute inset-0">
          <Image
            src={next.image}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            quality={60}
            className="object-cover object-center opacity-25 group-hover:opacity-40 group-hover:scale-[1.03] transition-all duration-700 ease-premium"
          />
          <div className="absolute inset-0 bg-bg/60 group-hover:bg-bg/45 transition-colors duration-700" />
        </div>
        <div className="relative px-6 md:px-12 py-stack-lg md:py-32 text-center">
          <p className="font-sans text-label-xs uppercase text-muted mb-6">Next Project</p>
          <p
            className="font-serif uppercase text-fg leading-[0.9] tracking-tight text-[clamp(2.5rem,8vw,7rem)] group-hover:text-accent transition-colors duration-500"
            style={{ fontWeight: 400 }}
          >
            {next.title}
          </p>
          {next.subtitle && (
            <p className="font-serif italic text-fg/70 text-[clamp(1.25rem,3vw,2.5rem)] mt-2" style={{ fontWeight: 300 }}>
              {next.subtitle}
            </p>
          )}
        </div>
      </Link>
    </>
  )
}

function RelatedCard({ project }: { project: Project }) {
  const tilt = useTilt<HTMLAnchorElement>({ rotX: 7, rotY: 9 })
  return (
    <div className="related-card" style={{ perspective: '1100px' }}>
      <Link
        ref={tilt}
        href={`/work/${project.slug}`}
        data-cursor="View"
        className="group block"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-fg/5">
          <Image
            src={project.image}
            alt={`${project.title} ${project.subtitle ?? ''}`.trim()}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-700 ease-premium"
          />
        </div>
        <p className="font-sans text-label-xs uppercase text-muted mt-5">
          {project.category} · {project.year}
        </p>
        <p className="font-serif text-fg text-xl md:text-2xl mt-2 leading-tight group-hover:text-accent transition-colors duration-300" style={{ fontWeight: 300 }}>
          {project.title}
          {project.subtitle && <em className="italic text-fg/70"> — {project.subtitle}</em>}
        </p>
      </Link>
    </div>
  )
}
