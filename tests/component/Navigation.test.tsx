import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the router + the animation engine; we assert DOM/state, not tweens.
const push = vi.fn()
const pathname = vi.fn(() => '/')
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname(),
}))
vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn(), set: vi.fn(), fromTo: vi.fn(), to: vi.fn() },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))

import Navigation from '@/components/Navigation'

beforeEach(() => {
  document.documentElement.style.overflow = ''
  push.mockClear()
  pathname.mockReturnValue('/')
})

/** Navigation plus the page landmarks it has to silence while the menu is open. */
function renderWithPage() {
  return render(
    <>
      <Navigation />
      <main>page</main>
      <footer>footer</footer>
    </>
  )
}

const openButton = () => screen.getByRole('button', { name: /open menu/i })

describe('Navigation', () => {
  it('renders the home logo link and the menu toggle', () => {
    render(<Navigation />)
    expect(screen.getByLabelText('Hisham Hany — Home')).toBeInTheDocument()
    expect(openButton()).toBeInTheDocument()
  })

  it('exposes all primary navigation links', () => {
    render(<Navigation />)
    for (const label of ['Home', 'Portfolio', 'Services', 'About', 'Contact']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  // Journal lives in the footer until it is posting regularly again; a quiet
  // top-level slot reads as a stalled studio.
  it('keeps Journal out of the primary menu and numbers Contact 05', () => {
    render(<Navigation />)
    expect(screen.queryByText('Journal')).toBeNull()
    expect(screen.getByRole('link', { name: /05\s*Contact/i })).toHaveAttribute('href', '/contact')
  })

  it('renders menu items as real links (new tab, prefetch, correct role)', () => {
    render(<Navigation />)
    expect(screen.getByRole('link', { name: /02\s*Portfolio/i })).toHaveAttribute('href', '/portfolio')
  })

  it('marks the current route with aria-current', () => {
    render(<Navigation />)
    expect(screen.getByRole('link', { name: /01\s*Home/i })).toHaveAttribute('aria-current', 'page')
  })

  it('marks Portfolio current while reading a case study', () => {
    pathname.mockReturnValue('/work/mercedes-gle-450-4matic')
    render(<Navigation />)
    expect(screen.getByRole('link', { name: /02\s*Portfolio/i })).toHaveAttribute('aria-current', 'page')
  })

  it('locks page scroll when the menu opens and restores it on close', () => {
    render(<Navigation />)
    fireEvent.click(openButton())
    expect(document.documentElement.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))
    expect(document.documentElement.style.overflow).toBe('')
  })
})

describe('Navigation menu state chain', () => {
  it('announces its expanded state and what it controls', () => {
    render(<Navigation />)
    const toggle = openButton()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const controls = toggle.getAttribute('aria-controls')!
    const dialog = document.getElementById(controls)!
    expect(dialog).toHaveAttribute('role', 'dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Menu')

    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('moves focus into the menu on open', () => {
    render(<Navigation />)
    fireEvent.click(openButton())
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /01\s*Home/i }))
  })

  it('closes on Escape and returns focus to the toggle', () => {
    render(<Navigation />)
    fireEvent.click(openButton())
    fireEvent.keyDown(document, { key: 'Escape' })
    const toggle = openButton()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(toggle)
  })

  it('makes the page behind the menu inert while it is open', () => {
    const { container } = renderWithPage()
    const main = container.querySelector('main')!
    const footer = container.querySelector('footer')!
    fireEvent.click(openButton())
    expect(main).toHaveAttribute('inert')
    expect(footer).toHaveAttribute('inert')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(main).not.toHaveAttribute('inert')
    expect(footer).not.toHaveAttribute('inert')
  })

  // The open overlay already covers the page, so there is no shutter to wait
  // for: the route starts on click instead of ~1s later.
  it('starts the route immediately when a menu link is chosen', () => {
    render(<Navigation />)
    fireEvent.click(openButton())
    fireEvent.click(screen.getByRole('link', { name: /03\s*Services/i }))
    expect(push).toHaveBeenCalledWith('/services')
  })

  it('leaves modified clicks to the browser (open in new tab)', () => {
    render(<Navigation />)
    fireEvent.click(openButton())
    fireEvent.click(screen.getByRole('link', { name: /03\s*Services/i }), { metaKey: true })
    expect(push).not.toHaveBeenCalled()
  })
})
