import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setLenis, lockScroll, getLenis } from '@/lib/lenis'

// Lenis scrolls programmatically from wheel events, so overflow alone doesn't
// stop it — anything that locks the page (menu, lightbox) has to pause Lenis
// too. The overflow lock goes on <html>: html has overflow-x: clip, so a body
// lock wouldn't reach the viewport and would turn body into a scroll container
// that breaks position: sticky (the home chapters).
describe('lockScroll', () => {
  const doc = { documentElement: { style: { overflow: '' } }, body: { style: { overflow: '' } } }
  beforeEach(() => {
    vi.stubGlobal('document', doc)
    doc.documentElement.style.overflow = ''
    doc.body.style.overflow = ''
    lockScroll(false)
    setLenis(null)
  })

  it('locks the root element and pauses smooth scrolling alongside it', () => {
    const lenis = { stop: vi.fn(), start: vi.fn() }
    setLenis(lenis as never)
    lockScroll(true)
    expect(doc.documentElement.style.overflow).toBe('hidden')
    expect(doc.body.style.overflow).toBe('')
    expect(lenis.stop).toHaveBeenCalledOnce()
    lockScroll(false)
    expect(doc.documentElement.style.overflow).toBe('')
    expect(lenis.start).toHaveBeenCalledOnce()
  })

  it('still locks native scrolling when Lenis is off (reduced motion)', () => {
    expect(() => lockScroll(true)).not.toThrow()
    expect(doc.documentElement.style.overflow).toBe('hidden')
  })

  it('applies a lock taken before Lenis mounted (it loads lazily)', () => {
    lockScroll(true)
    const lenis = { stop: vi.fn(), start: vi.fn() }
    setLenis(lenis as never)
    expect(lenis.stop).toHaveBeenCalledOnce()
    expect(getLenis()).toBe(lenis)
  })
})
