import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { insertValues } = vi.hoisted(() => ({ insertValues: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: { insert: () => ({ values: insertValues }) } }))

import { POST } from '@/app/api/ab/route'
import { __resetRateLimit } from '@/lib/rate-limiter'

const valid = { experiment: 'hero-cta-v1', variant: 'b', visitorId: 'abcdefghijkl0123', event: 'exposure', path: '/' }

function post(body: unknown, ip = `ip-${Math.random()}`) {
  return new Request('http://localhost/api/ab', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as never
}

beforeEach(() => {
  __resetRateLimit()
  insertValues.mockReset()
  insertValues.mockResolvedValue(undefined)
  vi.stubEnv('DATABASE_URL', 'postgres://test')
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/ab', () => {
  it('stores a valid event', async () => {
    const res = await POST(post(valid))
    expect(res.status).toBe(204)
    expect(insertValues).toHaveBeenCalledWith({
      experiment: 'hero-cta-v1', variant: 'b', visitor_id: 'abcdefghijkl0123', event: 'exposure', path: '/',
    })
  })

  it.each([
    ['unknown experiment', { ...valid, experiment: 'other' }],
    ['unknown variant', { ...valid, variant: 'c' }],
    ['unknown event', { ...valid, event: 'purchase' }],
    ['bad visitor id', { ...valid, visitorId: '<script>' }],
    ['oversized path', { ...valid, path: 'x'.repeat(201) }],
  ])('rejects %s with 400', async (_name, body) => {
    expect((await POST(post(body))).status).toBe(400)
    expect(insertValues).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON with 400', async () => {
    expect((await POST(post('{nope'))).status).toBe(400)
  })

  it('accepts and drops when no database is configured', async () => {
    vi.stubEnv('DATABASE_URL', '')
    expect((await POST(post(valid))).status).toBe(204)
    expect(insertValues).not.toHaveBeenCalled()
  })

  it('rate-limits after 60 events a minute from one IP', async () => {
    for (let i = 0; i < 60; i++) await POST(post(valid, 'same'))
    expect((await POST(post(valid, 'same'))).status).toBe(429)
  })
})
