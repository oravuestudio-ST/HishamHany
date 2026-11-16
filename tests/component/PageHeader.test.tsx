import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { fromTo, from } = vi.hoisted(() => ({ fromTo: vi.fn(), from: vi.fn() }))
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    from,
    fromTo,
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

let reduced = false
vi.mock('@/lib/motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/motion')>()),
  prefersReducedMotion: () => reduced,
}))

import PageHeader from '@/components/PageHeader'
import { CHAPTER } from '@/lib/motion'

const frame = (
  <div>
    <div data-frame-open><span /></div>
    <div data-frame-open><span /></div>
  </div>
)

beforeEach(() => {
  reduced = false
  fromTo.mockClear()
  from.mockClear()
})

// Interior pages open on the home page's viewfinder: whatever sits in the frame
// opens from the chapter scenes' closed window while the title rises.
describe('PageHeader frame', () => {
  it('renders no figure without a frame', () => {
    const { container } = render(<PageHeader eyebrow="E" title="T" />)
    expect(container.querySelector('figure')).toBeNull()
  })

  it('opens every data-frame-open window from the chapter inset', () => {
    render(<PageHeader eyebrow="E" title="T" frame={frame} frameCaption="Your frame" />)
    expect(screen.getByText('Your frame').tagName).toBe('FIGCAPTION')
    const clip = fromTo.mock.calls.find(([, fromVars]) => fromVars.clipPath)
    expect(clip?.[0]).toHaveLength(2)
    expect(clip?.[1].clipPath).toBe(CHAPTER.openInset)
  })

  it('leaves the frame open and still under reduced motion', () => {
    reduced = true
    render(<PageHeader eyebrow="E" title="T" frame={frame} />)
    expect(fromTo).not.toHaveBeenCalled()
    expect(from).not.toHaveBeenCalled()
  })
})
