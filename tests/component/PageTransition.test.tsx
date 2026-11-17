import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the router + the animation engine; we assert DOM/state, not tweens.
const usePathname = vi.fn(() => '/journal')
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }))

const gsapSet = vi.fn()
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    set: (...args: unknown[]) => gsapSet(...args),
    to: vi.fn(),
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
const refresh = vi.fn()
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: () => refresh() } }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import Template from '@/app/template'

beforeEach(() => {
  gsapSet.mockClear()
  refresh.mockClear()
  usePathname.mockReturnValue('/journal')
})

describe('Template (mask-wipe page transition)', () => {
  it('always renders its children', () => {
    render(
      <Template>
        <p>page content</p>
      </Template>
    )
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('marks interior pages for the enter tween without hiding them in the markup', () => {
    const { container } = render(
      <Template>
        <p>page content</p>
      </Template>
    )
    // The wipe surface itself is a body-level singleton (animations/
    // transitions.ts), not part of the template tree — the template only
    // owns the content wrapper. Pre-hiding is CSS keyed on html[data-js], so
    // server HTML stays visible to no-JS visitors and crawlers.
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.hasAttribute('data-page-enter')).toBe(true)
    expect(wrapper.style.opacity).not.toBe('0')
  })

  it('renders home visible immediately (loader owns that entrance)', () => {
    usePathname.mockReturnValue('/')
    const { container } = render(
      <Template>
        <p>home content</p>
      </Template>
    )
    expect(screen.getByText('home content')).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).hasAttribute('data-page-enter')).toBe(false)
  })

  it('shows the final state immediately under prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)',
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }))

    render(
      <Template>
        <p>reduced content</p>
      </Template>
    )
    expect(screen.getByText('reduced content')).toBeInTheDocument()
    // The fade lives in CSS behind (prefers-reduced-motion: no-preference), so
    // nothing here hides or shifts the page; JS only re-measures triggers.
    const wrapper = screen.getByText('reduced content').parentElement as HTMLElement
    expect(wrapper.style.opacity).toBe('')
    expect(wrapper.style.transform).toBe('')
    expect(refresh).toHaveBeenCalled()
  })
})
