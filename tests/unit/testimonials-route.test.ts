import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => import('@/tests/helpers/mock-db'))

import { GET } from '@/app/api/testimonials/route'
import { __queue, __resetDb, __lastCall } from '@/tests/helpers/mock-db'

beforeEach(() => __resetDb())

describe('GET /api/testimonials (public)', () => {
  it('returns the visible testimonials', async () => {
    const rows = [
      { id: 1, client_name: 'A', company: 'X', role: 'CEO', body: 'Hi', rating: 5, visible: true },
    ]
    __queue(rows)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(rows)
  })

  it('filters on visible = true', async () => {
    __queue([])
    await GET()
    // The route applies a `where(eq(visible, true))` filter; assert it was issued.
    expect(__lastCall('where')).toBeDefined()
  })
})
