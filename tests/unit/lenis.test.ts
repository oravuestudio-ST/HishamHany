import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setLenis, lockScroll } from '@/lib/lenis'

// Lenis scrolls programmatically from wheel events, so body overflow alone
// doesn't stop it — anything that locks the page (menu, lightbox) has to
// pause Lenis too.
describe('lockScroll', () => {
  const doc = { body: { style: { overflow: '' } } }
  beforeEach(() => {
    vi.stubGlobal('document', doc)
    doc.body.style.overflow = ''
    setLenis(null)
  })

  it('pauses and resumes smooth scrolling alongside body overflow', () => {
    const lenis = { stop: vi.fn(), start: vi.fn() }
    setLenis(lenis as never)
    lockScroll(true)
    expect(doc.body.style.overflow).toBe('hidden')
    expect(lenis.stop).toHaveBeenCalledOnce()
    lockScroll(false)
    expect(doc.body.style.overflow).toBe('')
    expect(lenis.start).toHaveBeenCalledOnce()
  })

  it('still locks native scrolling when Lenis is off (reduced motion)', () => {
    expect(() => lockScroll(true)).not.toThrow()
    expect(doc.body.style.overflow).toBe('hidden')
  })
})
