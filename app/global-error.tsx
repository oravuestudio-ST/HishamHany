'use client'

import { SITE } from '@/lib/site'

/**
 * Last-resort fallback when the root layout itself fails. It replaces
 * <html>, so nothing from the site loads — no stylesheet, no fonts. The
 * paper/ink values are inlined from app/globals.css.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8vw',
          background: 'rgb(236 231 220)',
          color: 'rgb(22 20 15)',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <main>
          <p style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgb(96 88 76)' }}>
            Out of focus
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', fontWeight: 400, lineHeight: 0.95, margin: '1.5rem 0' }}>
            This page didn’t load.
          </h1>
          <p style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 15, lineHeight: 1.75, color: 'rgb(96 88 76)', maxWidth: '38rem' }}>
            Something failed on my side, not yours. Try again, or email{' '}
            <a href={`mailto:${SITE.email}`} style={{ color: 'rgb(36 33 201)' }}>
              {SITE.email}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2.5rem',
              padding: '1rem 2.5rem',
              border: '1px solid rgb(22 20 15 / 0.25)',
              background: 'transparent',
              color: 'inherit',
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 10,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
