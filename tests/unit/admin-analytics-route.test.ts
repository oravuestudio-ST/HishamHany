import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => import('@/tests/helpers/mock-db'))
vi.mock('@/lib/session', () => import('@/tests/helpers/mock-session'))

import { GET } from '@/app/api/admin/analytics/route'
import { __queue, __resetDb } from '@/tests/helpers/mock-db'
import { __setLoggedIn, __resetSession } from '@/tests/helpers/mock-session'

beforeEach(() => {
  __resetDb()
  __resetSession()
})

describe('GET /api/admin/analytics', () => {
  it('returns 401 when not authenticated', async () => {
    __setLoggedIn(false)
    expect((await GET()).status).toBe(401)
  })

  it('returns the three aggregations in the documented shape', async () => {
    __setLoggedIn(true)
    const topPaths = [{ path: '/', views: 120 }]
    const topReferrers = [{ referrer: 'google.com', views: 80 }]
    const dailyViews = [{ date: '2026-06-01', views: 12 }]
    // Routes run the three selects via Promise.all in array order.
    __queue(topPaths, topReferrers, dailyViews)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ topPaths, topReferrers, dailyViews })
  })
})
