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

describe('Template (mask-wipe page transition)', () => {
  it('always renders its children', () => {
    render(
      <Template>
        <p>page content</p>
      </Template>
    )
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('pre-hides interior pages inline so there is no flash before the tween', () => {
    const { container } = render(
      <Template>
        <p>page content</p>
      </Template>
    )
    // The wipe surface itself is a body-level singleton (animations/
    // transitions.ts), not part of the template tree — the template only
    // owns the content wrapper.
    expect((container.firstChild as HTMLElement).style.opacity).toBe('0')
  })

  it('renders home visible immediately (loader owns that entrance)', () => {
    usePathname.mockReturnValue('/')
    const { container } = render(
      <Template>
        <p>home content</p>
      </Template>
    )
    expect(screen.getByText('home content')).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).style.opacity).toBe('1')
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
