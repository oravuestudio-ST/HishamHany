'use client'

import type { Project } from '@/lib/projects'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * Direction + production approach in editorial two-column, with a confirmed
 * equipment list as a hairline sidebar when one exists. Renders nothing for
 * projects without long-form editorial.
 */
export default function CaseApproach({ project }: { project: Project }) {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.approach-item' })
  const { direction, approach, equipment } = project.editorial ?? {}

  if (!direction && !approach && !equipment?.length) return null

  return (
    <section className="px-6 md:px-12 py-section-sm border-t border-fg/10">
      <div ref={revealRef} className="grid md:grid-cols-12 gap-x-8 gap-y-14">
        {direction && (
          <div className="approach-item md:col-span-4">
            <p className="font-sans text-label-xs uppercase text-muted/40 mb-6">Creative Direction</p>
            <p className="font-sans text-body-sm text-fg/80 leading-relaxed max-w-measure-narrow">
              {direction}
            </p>
          </div>
        )}
        {approach && (
          <div className="approach-item md:col-span-4 md:col-start-6">
            <p className="font-sans text-label-xs uppercase text-muted/40 mb-6">Production</p>
            <p className="font-sans text-body-sm text-fg/80 leading-relaxed max-w-measure-narrow">
              {approach}
            </p>
          </div>
        )}
        {equipment && equipment.length > 0 && (
          <div className="approach-item md:col-span-2 md:col-start-11">
            <p className="font-sans text-label-xs uppercase text-muted/40 mb-6">Equipment</p>
            <ul className="space-y-3">
              {equipment.map((item) => (
                <li key={item} className="font-sans text-label-sm uppercase text-fg/65 border-t border-fg/10 pt-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
