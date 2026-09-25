import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const liftWipe = vi.fn()
vi.mock('@/animations/transitions', () => ({ liftWipe: () => liftWipe() }))

import SiteError from '@/app/(site)/error'
import { SITE } from '@/lib/site'

describe('site error boundary', () => {
  // The page reports the error to the console by design; keep test output clean.
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  const error = Object.assign(new Error('boom'), { digest: 'abc' })

  it('explains the failure in the site voice and offers a retry', () => {
    const reset = vi.fn()
    render(<SiteError error={error} reset={reset} />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('always leaves a direct way to reach the studio', () => {
    render(<SiteError error={error} reset={vi.fn()} />)
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', `mailto:${SITE.email}`)
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', SITE.social.whatsapp)
    expect(screen.getByRole('link', { name: /portfolio/i })).toHaveAttribute('href', '/portfolio')
  })

  it('lifts a route shutter that was covering when the route failed', () => {
    liftWipe.mockClear()
    render(<SiteError error={error} reset={vi.fn()} />)
    expect(liftWipe).toHaveBeenCalled()
  })
})
