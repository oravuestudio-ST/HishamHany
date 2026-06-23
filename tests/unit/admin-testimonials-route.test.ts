import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => import('@/tests/helpers/mock-db'))
vi.mock('@/lib/session', () => import('@/tests/helpers/mock-session'))

import { GET, POST } from '@/app/api/admin/testimonials/route'
import { PATCH, DELETE } from '@/app/api/admin/testimonials/[id]/route'
import { __queue, __resetDb, __lastCall } from '@/tests/helpers/mock-db'
import { __setLoggedIn, __resetSession } from '@/tests/helpers/mock-session'

function req(body?: unknown) {
  return new Request('http://localhost/api/admin/testimonials', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as never
}

const sample = {
  id: 3,
  client_name: 'Jane',
  company: 'Acme',
  role: 'CMO',
  body: 'Great work',
  rating: 5,
  visible: true,
  created_at: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  __resetDb()
  __resetSession()
})

describe('GET /api/admin/testimonials', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    expect((await GET()).status).toBe(401)
  })

  it('returns rows when authenticated', async () => {
    __setLoggedIn(true)
    __queue([sample])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([sample])
  })
})

describe('POST /api/admin/testimonials', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    expect((await POST(req(sample))).status).toBe(401)
  })

  it('returns 400 on a missing body', async () => {
    __setLoggedIn(true)
    expect((await POST(req())).status).toBe(400)
  })

  it.each([0, 6, 2.5, NaN])('rejects an out-of-range rating (%s) with 400', async (rating) => {
    __setLoggedIn(true)
    const res = await POST(req({ ...sample, rating }))
    expect(res.status).toBe(400)
  })

  it('creates a valid testimonial and returns 201', async () => {
    __setLoggedIn(true)
    __queue([sample])
    const res = await POST(req({ client_name: 'Jane', company: 'Acme', role: 'CMO', body: 'Great', rating: 5 }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(sample)
    expect((__lastCall('values')?.[0] as { rating: number }).rating).toBe(5)
  })
})

describe('PATCH /api/admin/testimonials/[id]', () => {
  it('returns 400 for a non-numeric id', async () => {
    __setLoggedIn(true)
    expect((await PATCH(req({ body: 'x' }), { params: { id: 'abc' } })).status).toBe(400)
  })

  it('strips immutable id + created_at from the patch set', async () => {
    __setLoggedIn(true)
    __queue([sample])
    await PATCH(req({ id: 9, created_at: 'evil', body: 'Updated' }), { params: { id: '3' } })
    const patch = __lastCall('set')?.[0] as Record<string, unknown>
    expect(patch).not.toHaveProperty('id')
    expect(patch).not.toHaveProperty('created_at')
    expect(patch).toMatchObject({ body: 'Updated' })
  })

  it('returns 404 when the row is absent', async () => {
    __setLoggedIn(true)
    __queue([])
    expect((await PATCH(req({ body: 'x' }), { params: { id: '3' } })).status).toBe(404)
  })
})

describe('DELETE /api/admin/testimonials/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    expect((await DELETE(req() as never, { params: { id: '3' } })).status).toBe(401)
  })

  it('deletes and returns ok for a valid id', async () => {
    __setLoggedIn(true)
    const res = await DELETE(req() as never, { params: { id: '3' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
