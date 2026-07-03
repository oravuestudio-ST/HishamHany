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
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import Template from '@/app/template'

beforeEach(() => {
  gsapSet.mockClear()
  usePathname.mockReturnValue('/journal')
})

describe('Template (page transition)', () => {
  it('always renders its children', () => {
    render(
      <Template>
        <p>page content</p>
      </Template>
    )
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('renders the curtain panels on non-home routes, hidden from AT', () => {
    const { container } = render(
      <Template>
        <p>page content</p>
      </Template>
    )
    const curtain = container.querySelector('[aria-hidden="true"]')
    expect(curtain).not.toBeNull()
    expect(curtain!.children.length).toBe(5)
  })

  it('skips the curtain entirely on the home route (loader owns that entrance)', () => {
    usePathname.mockReturnValue('/')
    const { container } = render(
      <Template>
        <p>home content</p>
      </Template>
    )
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(screen.getByText('home content')).toBeInTheDocument()
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
    // The page wrapper is snapped to visible rather than tweened.
    expect(gsapSet).toHaveBeenCalledWith(expect.anything(), { opacity: 1, y: 0 })
  })
})
