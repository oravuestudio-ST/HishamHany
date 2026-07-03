'use client'

import { useEffect, useState } from 'react'
import { workflow } from '@/lib/services'
import { usePinnedSection } from '@/hooks/usePinnedSection'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * The client experience, Discovery through Support. On desktop the section
 * pins and scrolling advances through the seven steps — the index on the
 * left, the active step held large on the right. On touch, narrow viewports,
 * and reduced motion it reads as a stacked list; both modes share the data.
 */
export default function WorkflowSection() {
  const [active, setActive] = useState(0)
  // Same predicate as usePinnedSection — known at mount so the layout never
  // renders a half-pinned hybrid (e.g. reduced-motion desktops).
  const [pinned, setPinned] = useState(false)
  useEffect(() => {
    setPinned(!prefersReducedMotion() && window.innerWidth >= 768)
  }, [])

  const pinRef = usePinnedSection<HTMLDivElement>({
    onProgress: (p) => {
      setActive(Math.min(workflow.length - 1, Math.floor(p * workflow.length)))
    },
  })
  const revealRef = useScrollReveal<HTMLDivElement>({ stagger: '.workflow-step' })

  const current = workflow[active]

  return (
    <section className="border-t border-fg/10">
      <div ref={pinRef} className="px-6 md:px-12 py-stack-lg md:min-h-screen md:flex md:flex-col md:justify-center">
        <div className="mb-14 max-w-5xl">
          <p className="font-sans text-label-xs uppercase text-muted/40 mb-5">The Client Experience</p>
          <h2 className="font-serif text-display-sm text-fg" style={{ fontWeight: 300 }}>
            One conversation
            <br />
            <em className="text-accent italic">to delivery.</em>
          </h2>
        </div>

        {/* Pinned mode (md+): index rail + held active step. The rail is also
            the full list for the stacked fallback — same DOM both ways. */}
        <div ref={revealRef} className="grid md:grid-cols-12 gap-x-8 gap-y-0 items-start">
          <div className="md:col-span-5">
            {workflow.map(({ num, title, body }, i) => (
              <div
                key={num}
                className={`workflow-step border-t border-fg/10 py-4 transition-opacity duration-500 ${
                  pinned && i !== active ? 'md:opacity-30' : ''
                }`}
              >
                <div className="flex items-baseline gap-5">
                  <span className={`font-sans text-label-xs transition-colors duration-300 ${pinned && i === active ? 'text-accent' : 'text-muted/40'}`}>
                    {num}
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl text-fg" style={{ fontWeight: 300 }}>
                    {title}
                  </h3>
                </div>
                {/* Body shows inline in stacked/static mode; the pinned panel owns it when pinning. */}
                <p className={`font-sans text-body-sm text-muted/80 mt-2 pl-10 max-w-measure ${pinned ? 'md:hidden' : ''}`}>
                  {body}
                </p>
              </div>
            ))}
          </div>

          {/* Held panel — the active step, large. Only exists while pinning. */}
          <div className={`${pinned ? 'hidden md:block' : 'hidden'} md:col-span-6 md:col-start-7 md:sticky md:top-1/3`}>
            <p className="font-serif text-accent leading-none" style={{ fontWeight: 300, fontSize: 'clamp(4rem, 8vw, 8rem)' }} aria-hidden="true">
              {current.num}
            </p>
            <h3 className="font-serif text-3xl lg:text-4xl text-fg mt-4" style={{ fontWeight: 300 }}>
              {current.title}
            </h3>
            <p className="font-sans text-body text-muted/85 mt-5 max-w-measure">{current.body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
