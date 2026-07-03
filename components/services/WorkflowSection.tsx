'use client'

import { workflow } from '@/lib/services'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * The client experience, Discovery through Support — stacked reveals for now;
 * Phase 5 upgrades this into a pinned progressive sequence on the same markup.
 */
export default function WorkflowSection() {
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.workflow-step' })

  return (
    <section className="px-6 md:px-12 py-section-sm border-t border-fg/10">
      <div className="mb-16 max-w-5xl">
        <p className="font-sans text-label-xs uppercase text-muted/40 mb-5">The Client Experience</p>
        <h2 className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
          One conversation
          <br />
          <em className="text-accent italic">to delivery.</em>
        </h2>
      </div>

      <div ref={revealRef} className="grid gap-y-0">
        {workflow.map(({ num, title, body }) => (
          <div
            key={num}
            className="workflow-step grid md:grid-cols-12 gap-x-8 gap-y-2 py-7 border-t border-fg/10 items-baseline"
          >
            <span className="font-sans text-label-xs text-accent md:col-span-1">{num}</span>
            <h3 className="font-serif text-2xl md:text-3xl text-fg md:col-span-4" style={{ fontWeight: 300 }}>
              {title}
            </h3>
            <p className="font-sans text-body-sm text-muted/80 md:col-span-6 md:col-start-7 max-w-measure">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
