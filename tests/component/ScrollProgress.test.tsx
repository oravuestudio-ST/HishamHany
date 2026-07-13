import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import ScrollProgress from '@/components/ScrollProgress'

// Capture the IO callback + observed targets so tests can simulate sections
// crossing the viewport's center band.
let ioCallback: IntersectionObserverCallback
let observed: Element[]
let ioOptions: IntersectionObserverInit | undefined

beforeEach(() => {
  observed = []
  ioOptions = undefined
  window.IntersectionObserver = vi.fn((cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) => {
    ioCallback = cb
    ioOptions = opts
    return {
      observe: (el: Element) => observed.push(el),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: () => [],
      root: null,
      rootMargin: '',
      thresholds: [],
    } as unknown as IntersectionObserver
  }) as unknown as typeof IntersectionObserver
})

function mountSections(ids: string[]) {
  for (const id of ids) {
    const el = document.createElement('section')
    el.id = id
    document.body.appendChild(el)
  }
  return () => ids.forEach((id) => document.getElementById(id)?.remove())
}

describe('ScrollProgress chapters', () => {
  it('renders no chapter label without chapters', () => {
    const { container } = render(<ScrollProgress />)
    // Bar + readout render; only the numerals and "/ 100" are present.
    expect(container.querySelector('.scroll-progress-track')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Opening/)
  })

  it('names the section holding the viewport center band', () => {
    const cleanup = mountSections(['hero-section', 'statement-section'])
    const { container } = render(
      <ScrollProgress
        chapters={[
          { id: 'hero-section', label: 'Opening' },
          { id: 'statement-section', label: 'Statement' },
        ]}
      />
    )

    expect(observed).toHaveLength(2)
    // The observer watches a thin center band, not the viewport edges.
    expect(ioOptions?.rootMargin).toMatch(/-\d+%/)

    const hero = document.getElementById('hero-section')!
    ioCallback(
      [{ target: hero, isIntersecting: true } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
    expect(container.textContent).toContain('Opening')

    const statement = document.getElementById('statement-section')!
    ioCallback(
      [{ target: statement, isIntersecting: true } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
    expect(container.textContent).toContain('Statement')
    expect(container.textContent).not.toContain('Opening')

    cleanup()
  })

  it('ignores chapters whose section id is absent', () => {
    const cleanup = mountSections(['hero-section'])
    render(
      <ScrollProgress
        chapters={[
          { id: 'hero-section', label: 'Opening' },
          { id: 'missing-section', label: 'Ghost' },
        ]}
      />
    )
    expect(observed).toHaveLength(1)
    cleanup()
  })
})
