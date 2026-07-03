'use client'

/* eslint-disable @next/next/no-img-element -- client logos are tiny SVGs; next/image adds nothing */

import type { Project } from '@/lib/projects'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import FeatureSlot, { featuresFor } from '@/components/case-study/FeatureSlot'

/**
 * Swiss-grid fact sheet under the cover: the production facts in a single
 * hairline-ruled row set. Data-driven feature slots (3D client marques)
 * render alongside the client credit.
 */
export default function CaseMeta({ project }: { project: Project }) {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.meta-cell' })
  const metaFeatures = featuresFor(project.editorial?.features, 'meta')

  const facts: { label: string; value?: string }[] = [
    { label: 'Client', value: project.client },
    { label: 'Year', value: project.year },
    { label: 'Location', value: project.location },
    { label: 'Scope', value: project.scope },
    { label: 'Output', value: project.output },
    { label: 'Duration', value: project.editorial?.duration },
  ]

  return (
    <section className="px-6 md:px-12 py-stack-lg border-b border-fg/10">
      <div ref={revealRef} className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10">
        {facts
          .filter((f): f is { label: string; value: string } => Boolean(f.value))
          .map(({ label, value }) => (
            <div key={label} className="meta-cell md:col-span-2">
              <dt className="font-sans text-label-xs uppercase text-muted/40">{label}</dt>
              <dd className="font-sans text-body-sm text-fg/85 mt-2 leading-relaxed">{value}</dd>
            </div>
          ))}

        {(project.clientLogo || metaFeatures.length > 0) && (
          <div className="meta-cell md:col-span-2 flex items-center gap-5">
            {project.clientLogo && (
              <img
                src={project.clientLogo}
                alt={`${project.client} logo`}
                className="client-logo h-10 w-auto opacity-60"
              />
            )}
            {metaFeatures.map((key) => (
              <FeatureSlot key={key} featureKey={key} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
