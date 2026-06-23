import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import bcrypt from 'bcryptjs'

// Real rate-limiter + bcrypt; only the session is mocked (capture save/destroy).
vi.mock('@/lib/session', () => import('@/tests/helpers/mock-session'))

import { POST as login } from '@/app/api/admin/auth/login/route'
import { POST as logout } from '@/app/api/admin/auth/logout/route'
import { __resetRateLimit } from '@/lib/rate-limiter'
import { __session, __resetSession } from '@/tests/helpers/mock-session'

function loginReq(body: unknown, ip = `ip-${Math.random()}`) {
  return new Request('http://localhost/api/admin/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  }) as never
}

beforeEach(() => {
  __resetRateLimit()
  __resetSession()
  vi.stubEnv('ADMIN_PASSWORD', 'plaintext-secret')
})

afterEach(() => vi.unstubAllEnvs())

describe('POST /api/admin/auth/login', () => {
  it('rejects a missing password with 400', async () => {
    const res = await login(loginReq({}))
    expect(res.status).toBe(400)
    expect(__session.save).not.toHaveBeenCalled()
  })

  it('returns 500 when ADMIN_PASSWORD is not configured', async () => {
    vi.stubEnv('ADMIN_PASSWORD', '')
    const res = await login(loginReq({ password: 'whatever' }))
    expect(res.status).toBe(500)
  })

  it('rejects a wrong password with 401', async () => {
    const res = await login(loginReq({ password: 'nope' }))
    expect(res.status).toBe(401)
    expect(__session.save).not.toHaveBeenCalled()
  })

  it('accepts a matching plaintext password and saves the session', async () => {
    const res = await login(loginReq({ password: 'plaintext-secret' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(__session.isLoggedIn).toBe(true)
    expect(__session.save).toHaveBeenCalledOnce()
  })

  it('accepts a password matching the bcrypt hash in ADMIN_PASSWORD', async () => {
    vi.stubEnv('ADMIN_PASSWORD', bcrypt.hashSync('hunter2', 8))
    const res = await login(loginReq({ password: 'hunter2' }))
    expect(res.status).toBe(200)
    expect(__session.isLoggedIn).toBe(true)
    expect(__session.save).toHaveBeenCalledOnce()
  })

  it('rate-limits after 5 attempts from the same IP', async () => {
    const ip = 'ip-login-rl'
    for (let i = 0; i < 5; i++) {
      expect((await login(loginReq({ password: 'nope' }, ip))).status).toBe(401)
    }
    const res = await login(loginReq({ password: 'plaintext-secret' }, ip))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })
})

describe('POST /api/admin/auth/logout', () => {
  it('destroys the session', async () => {
    __session.isLoggedIn = true
    const res = await logout()
    expect(res.status).toBe(200)
    expect(__session.destroy).toHaveBeenCalledOnce()
    expect(__session.isLoggedIn).toBe(false)
  })
})
