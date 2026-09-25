import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import GlobalError from '@/app/global-error'

// global-error replaces the root layout, so it must ship its own <html> and
// work without the site's CSS or fonts having loaded.
describe('global error fallback', () => {
  it('renders a complete, self-styled document with a retry and a contact route', () => {
    const html = renderToStaticMarkup(<GlobalError error={new Error('root failed')} reset={vi.fn()} />)
    expect(html).toMatch(/^<html lang="en"/)
    expect(html).toContain('<body')
    expect(html).toMatch(/Try again/i)
    expect(html).toContain('mailto:')
  })
})
