import Link from 'next/link'

/**
 * 404 in the editorial voice — the number as a Bodoni display object, one
 * quiet line, and the two ways back in. Server-rendered, no motion needed.
 */
export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-bg text-fg flex items-center px-6 md:px-12">
      <div>
        <p className="font-sans text-label-xs uppercase text-muted mb-6">Out of frame</p>
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
            className="btn-fill inline-block border border-fg/25 px-10 py-4 font-sans text-label-sm uppercase text-fg transition-colors duration-500"
          >
            View the portfolio
          </Link>
          <Link
            href="/"
            className="link-underline font-sans text-label-sm uppercase text-accent hover:text-fg transition-colors duration-300"
          >
            Back to the start →
          </Link>
        </div>
      </div>
    </main>
  )
}
