import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Resend so no network call is made; capture the payload.
// vi.mock is hoisted, so sendMock must be created via vi.hoisted to exist in time.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }))
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}))

import { POST } from '@/app/api/contact/route'
import { __resetRateLimit } from '@/lib/rate-limiter'

function post(body: unknown, ip = `ip-${Math.random()}`, raw?: string) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: raw ?? JSON.stringify(body),
  }) as never
}

beforeEach(() => {
  // Key must be present for the handler to construct the (mocked) Resend client.
  vi.stubEnv('RESEND_API_KEY', 're_test_key')
  __resetRateLimit()
  sendMock.mockReset()
  sendMock.mockResolvedValue({ id: 'mock' })
})

afterEach(() => vi.unstubAllEnvs())

describe('POST /api/contact', () => {
  it('rejects missing required fields with 400', async () => {
    const res = await POST(post({ name: 'A' }))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid email with 400', async () => {
    const res = await POST(post({ name: 'A', email: 'nope', message: 'hi' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 on malformed JSON instead of crashing', async () => {
    const res = await POST(post(null, 'ip-bad', '{not json'))
    expect(res.status).toBe(400)
  })

  it('sends mail and returns ok for a valid payload', async () => {
    const res = await POST(post({ name: 'A', email: 'a@b.com', message: 'hi', project: 'Fashion' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendMock).toHaveBeenCalledOnce()
    const arg = sendMock.mock.calls[0][0]
    expect(arg.replyTo).toBe('a@b.com')
    expect(arg.subject).toContain('Fashion')
  })

  it('escapes HTML in the outgoing email body', async () => {
    await POST(post({ name: '<script>x</script>', email: 'a@b.com', message: 'hi' }))
    const arg = sendMock.mock.calls[0][0]
    expect(arg.html).not.toContain('<script>x</script>')
    expect(arg.html).toContain('&lt;script&gt;')
  })

  it('accepts the submission without sending when no API key is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const res = await POST(post({ name: 'A', email: 'a@b.com', message: 'hi' }))
    expect(res.status).toBe(200)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rate-limits after 5 requests from the same IP', async () => {
    const ip = 'ip-rl'
    const valid = { name: 'A', email: 'a@b.com', message: 'hi' }
    for (let i = 0; i < 5; i++) {
      expect((await POST(post(valid, ip))).status).toBe(200)
    }
    expect((await POST(post(valid, ip))).status).toBe(429)
  })
})
