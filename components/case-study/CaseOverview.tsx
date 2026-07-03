'use client'

import type { Project } from '@/lib/projects'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * The editorial lead: long-form overview at reading measure with a drop cap,
 * objectives as a numbered side column. Falls back to the project description
 * when no long-form overview exists.
 */
export default function CaseOverview({ project }: { project: Project }) {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.overview-item' })
  const paragraphs = project.editorial?.overview ?? (project.description ? [project.description] : [])
  const objectives = project.editorial?.objectives ?? []

  if (paragraphs.length === 0) return null

  return (
    <section className="px-6 md:px-12 py-section-sm">
      <div ref={revealRef} className="grid md:grid-cols-12 gap-x-8 gap-y-14">
        <div className="overview-item md:col-span-6 md:col-start-1">
          <p className="font-sans text-label-xs uppercase text-muted/40 mb-8">Overview</p>
          {paragraphs.map((text, i) => (
            <p
              key={i}
              className={`font-sans text-body md:text-body-lg text-fg/85 max-w-measure ${
                i === 0 ? 'case-lead' : 'mt-6'
              }`}
            >
              {text}
            </p>
          ))}
        </div>

        {objectives.length > 0 && (
          <div className="overview-item md:col-span-4 md:col-start-9">
            <p className="font-sans text-label-xs uppercase text-muted/40 mb-8">Objectives</p>
            <ol className="space-y-5">
              {objectives.map((obj, i) => (
                <li key={i} className="flex gap-5 border-t border-fg/10 pt-4">
                  <span className="font-sans text-label-xs text-accent pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-sans text-body-sm text-fg/75 leading-relaxed">{obj}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
