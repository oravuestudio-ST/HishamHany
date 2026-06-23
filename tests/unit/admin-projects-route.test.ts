import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => import('@/tests/helpers/mock-db'))
vi.mock('@/lib/session', () => import('@/tests/helpers/mock-session'))

import { GET, POST } from '@/app/api/admin/projects/route'
import { PATCH, DELETE } from '@/app/api/admin/projects/[id]/route'
import { __queue, __resetDb, __lastCall } from '@/tests/helpers/mock-db'
import { __setLoggedIn, __resetSession } from '@/tests/helpers/mock-session'

function req(body?: unknown) {
  return new Request('http://localhost/api/admin/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as never
}

const sampleProject = {
  id: 7,
  slug: 'x',
  title: 'X',
  category: 'Fashion',
  year: '2025',
  client: 'C',
  image: '/i.jpg',
  aspect: '4/5',
  colorized: false,
  visible: true,
  order: 5,
}

beforeEach(() => {
  __resetDb()
  __resetSession()
})

describe('GET /api/admin/projects', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the project rows when authenticated', async () => {
    __setLoggedIn(true)
    __queue([sampleProject])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([sampleProject])
  })
})

describe('POST /api/admin/projects', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    const res = await POST(req(sampleProject))
    expect(res.status).toBe(401)
  })

  it('returns 400 on a missing/invalid body', async () => {
    __setLoggedIn(true)
    const res = await POST(req())
    expect(res.status).toBe(400)
  })

  it('computes order = maxOrder + 1 and returns 201 with the new row', async () => {
    __setLoggedIn(true)
    __queue([{ maxOrder: 4 }], [sampleProject]) // select(max) then insert(returning)
    const res = await POST(req({ slug: 'x', title: 'X' }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(sampleProject)
    expect((__lastCall('values')?.[0] as { order: number }).order).toBe(5)
  })

  it('starts ordering at 0 when the table is empty', async () => {
    __setLoggedIn(true)
    __queue([{ maxOrder: null }], [sampleProject])
    await POST(req({ slug: 'first' }))
    expect((__lastCall('values')?.[0] as { order: number }).order).toBe(0)
  })
})

describe('PATCH /api/admin/projects/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    const res = await PATCH(req({ title: 'New' }), { params: { id: '7' } })
    expect(res.status).toBe(401)
  })

  it('returns 400 for a non-numeric id', async () => {
    __setLoggedIn(true)
    const res = await PATCH(req({ title: 'New' }), { params: { id: 'abc' } })
    expect(res.status).toBe(400)
  })

  it('strips the immutable id from the patch set', async () => {
    __setLoggedIn(true)
    __queue([sampleProject])
    await PATCH(req({ id: 999, title: 'New' }), { params: { id: '7' } })
    expect(__lastCall('set')?.[0]).not.toHaveProperty('id')
    expect(__lastCall('set')?.[0]).toMatchObject({ title: 'New' })
  })

  it('returns 404 when the row does not exist', async () => {
    __setLoggedIn(true)
    __queue([]) // returning() → no row
    const res = await PATCH(req({ title: 'New' }), { params: { id: '7' } })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/admin/projects/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    const res = await DELETE(req() as never, { params: { id: '7' } })
    expect(res.status).toBe(401)
  })

  it('returns 400 for a non-numeric id', async () => {
    __setLoggedIn(true)
    const res = await DELETE(req() as never, { params: { id: 'NaN' } })
    expect(res.status).toBe(400)
  })

  it('deletes and returns ok for a valid id', async () => {
    __setLoggedIn(true)
    const res = await DELETE(req() as never, { params: { id: '7' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
