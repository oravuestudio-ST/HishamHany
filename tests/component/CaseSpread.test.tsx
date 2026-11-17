import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn(), set: vi.fn(), fromTo: vi.fn(), to: vi.fn(), context: (fn: () => void) => (fn(), { revert: vi.fn() }) },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: vi.fn() } }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))
vi.mock('@/hooks/useProgressiveImage', () => ({ useProgressiveImage: () => ({ current: null }) }))

import CaseSpread from '@/components/case-study/CaseSpread'

const images = Array.from({ length: 5 }, (_, i) => ({ src: `/images/f${i}.jpg`, w: 1200, h: 800 }))

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})

describe('CaseSpread contact sheet', () => {
  it('flips to a numbered sheet, opens a frame in the viewer, and flips back', () => {
    render(<CaseSpread images={images} title="Mercedes" />)
    const pill = screen.getByRole('button', { name: 'Contact sheet' })
    expect(pill).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Mercedes: 5 frames')).toBeInTheDocument()
    const cells = screen.getAllByRole('button', { name: /^Open frame \d of 5/ })
    expect(cells).toHaveLength(5)
    expect(screen.getByText('03')).toBeInTheDocument()

    fireEvent.click(cells[2])
    expect(within(screen.getByRole('dialog')).getByText('3 / 5')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('Mercedes: 5 frames')).not.toBeInTheDocument()
    // The spread was hidden, not unmounted, so its reveals don't replay.
    expect(screen.getAllByRole('button', { name: /^Open image/ })[0]).toBeVisible()
  })
})
