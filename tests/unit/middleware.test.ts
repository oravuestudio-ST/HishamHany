import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@neondatabase/serverless', () => ({ neon: () => () => Promise.resolve() }))

import { middleware } from '@/middleware'
import { HERO_EXPERIMENT } from '@/lib/experiments'

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost${path}`, cookie ? { headers: { cookie } } : undefined)

beforeEach(() => vi.unstubAllEnvs())

describe('middleware — hero A/B assignment', () => {
  it('assigns a new visitor and sets a sticky cookie', () => {
    const res = middleware(req('/'))
    const set = res.cookies.get(HERO_EXPERIMENT.cookie)
    expect(set?.value).toMatch(/^[ab]\.[a-z0-9]{12,32}$/)
  })

  it('rewrites an assigned "b" visitor to the variant page and leaves the cookie alone', () => {
    const res = middleware(req('/', `${HERO_EXPERIMENT.cookie}=b.abcdefghijkl0123`))
    expect(res.headers.get('x-middleware-rewrite')).toContain(HERO_EXPERIMENT.variantPath)
    expect(res.cookies.get(HERO_EXPERIMENT.cookie)).toBeUndefined()
  })

  it('serves an assigned "a" visitor the control without a rewrite', () => {
    const res = middleware(req('/', `${HERO_EXPERIMENT.cookie}=a.abcdefghijkl0123`))
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('redirects a direct visit to the variant page home', () => {
    const res = middleware(req(HERO_EXPERIMENT.variantPath))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('leaves other pages unassigned', () => {
    const res = middleware(req('/portfolio'))
    expect(res.cookies.get(HERO_EXPERIMENT.cookie)).toBeUndefined()
  })
})

describe('middleware — cookie flags', () => {
  it('marks the cookie Secure on https only, so WebKit keeps it on http://localhost', () => {
    const https = middleware(new NextRequest('https://example.com/'))
    const http = middleware(new NextRequest('http://localhost/'))
    expect(https.headers.get('set-cookie')).toMatch(/Secure/i)
    expect(http.headers.get('set-cookie')).not.toMatch(/Secure/i)
  })
})
