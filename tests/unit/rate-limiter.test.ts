import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getIp, __resetRateLimit } from '@/lib/rate-limiter'

beforeEach(() => __resetRateLimit())

describe('checkRateLimit', () => {
  it('allows up to the limit then blocks', () => {
    const key = 'ip:1'
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000).ok).toBe(true)
    }
    const blocked = checkRateLimit(key, 5, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('tracks distinct keys independently', () => {
    expect(checkRateLimit('ip:a', 1, 60_000).ok).toBe(true)
    expect(checkRateLimit('ip:a', 1, 60_000).ok).toBe(false)
    expect(checkRateLimit('ip:b', 1, 60_000).ok).toBe(true)
  })

  it('resets after the window elapses', () => {
    expect(checkRateLimit('ip:w', 1, -1).ok).toBe(true)
    // window already expired (negative), so the next call starts fresh
    expect(checkRateLimit('ip:w', 1, -1).ok).toBe(true)
  })
})

describe('getIp', () => {
  it('prefers the first x-forwarded-for entry', () => {
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })
    expect(getIp(req)).toBe('1.2.3.4')
  })
  it('falls back to x-real-ip then unknown', () => {
    expect(getIp(new Request('http://x', { headers: { 'x-real-ip': '9.9.9.9' } }))).toBe('9.9.9.9')
    expect(getIp(new Request('http://x'))).toBe('unknown')
  })
})
