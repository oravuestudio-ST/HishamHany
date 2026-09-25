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

  it('refuses with 503 in production when email is not configured, instead of faking success', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    const res = await POST(post({ name: 'A', email: 'a@b.com', message: 'hi' }))
    expect(res.status).toBe(503)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("never writes the visitor's details to the logs when email is not configured", async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await POST(post({ name: 'Jane Visitor', email: 'jane@private.com', message: 'hi' }))
    const logged = JSON.stringify(warn.mock.calls)
    expect(logged).not.toContain('jane@private.com')
    expect(logged).not.toContain('Jane Visitor')
    warn.mockRestore()
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

  it('rejects a message longer than 5000 characters with 400', async () => {
    const res = await POST(post({ name: 'A', email: 'a@b.com', message: 'x'.repeat(5001) }))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects a name longer than 200 characters with 400', async () => {
    const res = await POST(post({ name: 'x'.repeat(201), email: 'a@b.com', message: 'hi' }))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects non-string field values with 400', async () => {
    const res = await POST(post({ name: { first: 'A' }, email: 'a@b.com', message: 'hi' }))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('silently drops a submission that fills the honeypot field', async () => {
    const res = await POST(post({ name: 'A', email: 'a@b.com', message: 'hi', website: 'http://spam' }))
    // Same answer a human gets, so the bot learns nothing — but no mail goes out.
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendMock).not.toHaveBeenCalled()
  })
})
