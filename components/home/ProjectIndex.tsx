import Link from 'next/link'
import { projects } from '@/lib/projects'

/**
 * The compact index under the exhibition — every project, server-rendered as
 * plain links (no client JS), so the full body of work is crawlable and one
 * Tab away. Wall text for the show above it: it sits on the same ink stage.
 * Titles repeat across a client's projects, so the subtitle is part of the name.
 */
export default function ProjectIndex() {
  return (
    <section id="index" aria-labelledby="index-title" className="stage-scope section-pad">
      <div className="mb-stack flex items-baseline justify-between gap-8">
        <h2 id="index-title" className="normal-case font-serif text-display text-paper">
          Index
        </h2>
        <p className="font-sans text-body-sm text-paper/70">{projects.length} projects</p>
      </div>

      <ol className="border-t border-line">
        {projects.map((p) => (
          <li key={p.slug} className="border-b border-line">
            <Link
              href={`/work/${p.slug}`}
              data-cursor="View"
              className="index-row grid grid-cols-12 items-baseline gap-x-6 gap-y-1 py-5 md:py-6"
            >
              {/* The row reads as one sentence to a screen reader: the hidden
                  commas separate cells that sit flush in the visual grid. */}
              <span className="index-title col-span-12 md:col-span-6 font-serif text-display-sm text-paper" style={{ lineHeight: 1.05 }}>
                {p.title}
                {p.subtitle && (
                  <>
                    <span className="sr-only">, </span>
                    <span className="italic text-paper/70"> {p.subtitle}</span>
                  </>
                )}
              </span>
              <span className="sr-only">, </span>
              <span className="col-span-4 md:col-span-2 font-sans text-body-sm text-paper/70">{p.category}</span>
              <span className="sr-only">, </span>
              <span className="col-span-5 md:col-span-3 font-sans text-body-sm text-paper/70">{p.client}</span>
              <span className="sr-only">, </span>
              <span className="col-span-3 md:col-span-1 text-right font-sans text-body-sm text-paper/70 tabular-nums">{p.year}</span>
            </Link>
          </li>
        ))}
      </ol>

      <Link href="/portfolio" className="link-underline mt-stack inline-block font-sans text-body-sm text-paper">
        Browse the archive by discipline
      </Link>
    </section>
  )
}
