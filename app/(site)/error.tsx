'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { liftWipe } from '@/animations/transitions'
import { SITE } from '@/lib/site'

/**
 * Route-level error screen for the public site. Renders inside the (site)
 * layout, so the header, menu and footer stay available. Same editorial
 * register as the 404: one Bodoni line, one plain sentence, ways out.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // A route that throws never mounts a template, so a covering shutter
    // would otherwise stay down until its failsafe fires.
    liftWipe()
    console.error('[route error]', error.digest ?? '', error)
  }, [error])

  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-bg text-fg flex items-center px-6 md:px-12">
      <div>
        <p className="eyebrow mb-6">Out of focus</p>
        <h1 className="font-serif text-display text-fg" style={{ fontWeight: 400 }}>
          This page didn’t <em className="italic text-accent">load</em>.
        </h1>
        <p className="font-sans text-body text-muted mt-8 max-w-measure">
          Something failed on my side, not yours. Try again, or reach me directly.
        </p>
        <div className="flex flex-wrap items-center gap-8 mt-12">
          <button type="button" onClick={reset} className="btn-fill btn-cta">
            Try again
          </button>
          <Link
            href="/portfolio"
            className="link-underline font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300"
          >
            View the portfolio
          </Link>
        </div>
        <p className="eyebrow mt-12 flex flex-wrap gap-6">
          <a href={`mailto:${SITE.email}`} className="link-underline hover:text-fg">
            Email
          </a>
          <a href={SITE.social.whatsapp} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-fg">
            WhatsApp
          </a>
        </p>
      </div>
    </main>
  )
}
