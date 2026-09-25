import Link from 'next/link'
import SiteChrome from '@/components/SiteChrome'
import SkipLink from '@/components/SkipLink'

/**
 * 404 in the editorial voice — the number as a Bodoni display object, one
 * quiet line, and the ways back in. It lives at the app root (outside the
 * (site) layout), so it brings the site chrome itself: header, menu and
 * footer stay available on a dead link.
 */
export default function NotFound() {
  return (
    <>
      <SkipLink />
      <SiteChrome>
        <main id="main" tabIndex={-1} className="min-h-screen bg-bg text-fg flex items-center px-6 md:px-12">
          <div>
            <p className="eyebrow mb-6">Out of frame</p>
            <h1
              className="font-serif uppercase leading-[0.85] tracking-tight text-[clamp(6rem,22vw,20rem)] text-fg"
              style={{ fontWeight: 400 }}
            >
              4<em className="italic text-accent">0</em>4
            </h1>
            <p className="font-sans text-body text-muted mt-8 max-w-measure">
              This page was never developed. The work, however, is all here.
            </p>
            <div className="flex flex-wrap items-center gap-8 mt-12">
              <Link
                href="/portfolio"
                className="btn-fill btn-cta"
              >
                View the portfolio
              </Link>
              <Link
                href="/"
                className="link-underline font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300"
              >
                Back to the start →
              </Link>
              <Link
                href="/contact"
                className="link-underline font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300"
              >
                Start a project →
              </Link>
            </div>
          </div>
        </main>
      </SiteChrome>
    </>
  )
}
