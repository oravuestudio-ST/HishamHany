import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock iron-session + next/headers so requireAuth/getSession run without real cookies.
const { getIronSessionMock } = vi.hoisted(() => ({ getIronSessionMock: vi.fn() }))
vi.mock('iron-session', () => ({ getIronSession: getIronSessionMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }))

import { requireAuth, getSession } from '@/lib/session'

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', 'x'.repeat(32))
  getIronSessionMock.mockReset()
})

describe('requireAuth', () => {
  it('throws a 401 NextResponse when the session is not logged in', async () => {
    getIronSessionMock.mockResolvedValue({ isLoggedIn: false })
    await expect(requireAuth()).rejects.toMatchObject({ status: 401 })
  })

  it('resolves (no throw) when the session is logged in', async () => {
    getIronSessionMock.mockResolvedValue({ isLoggedIn: true })
    await expect(requireAuth()).resolves.toBeUndefined()
  })
})

describe('getSession', () => {
  it('returns the iron-session object', async () => {
    getIronSessionMock.mockResolvedValue({ isLoggedIn: true })
    const session = await getSession()
    expect(session.isLoggedIn).toBe(true)
    expect(getIronSessionMock).toHaveBeenCalledOnce()
  })
})
