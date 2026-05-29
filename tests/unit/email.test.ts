import { describe, it, expect } from 'vitest'
import { escapeHtml, isValidEmail, buildInquiryEmail } from '@/app/api/contact/email'

describe('escapeHtml', () => {
  it('neutralizes HTML-significant characters', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
    expect(escapeHtml(`& " '`)).toBe('&amp; &quot; &#39;')
  })
})

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
    expect(isValidEmail('hisham.hany+studio@oravue.co')).toBe(true)
  })
  it('rejects malformed addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a @b.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('buildInquiryEmail', () => {
  it('escapes injected markup in every field', () => {
    const { subject, html } = buildInquiryEmail({
      name: '<b>Mallory</b>',
      email: 'm@x.com',
      project: '<img src=x onerror=alert(1)>',
      message: 'Hello <script>steal()</script>',
    })
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>Mallory</b>')
    expect(html).not.toContain('onerror=alert(1)>')
    expect(html).toContain('&lt;script&gt;')
    expect(subject).not.toContain('<b>')
    expect(subject).toContain('&lt;b&gt;Mallory')
  })

  it('preserves newlines as <br> in the message', () => {
    const { html } = buildInquiryEmail({
      name: 'A',
      email: 'a@b.com',
      message: 'line1\nline2',
    })
    expect(html).toContain('line1<br>line2')
  })

  it('omits the project row when project is absent', () => {
    const { html } = buildInquiryEmail({ name: 'A', email: 'a@b.com', message: 'hi' })
    expect(html).not.toContain('Project')
  })
})
