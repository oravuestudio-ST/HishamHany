import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ChapterData } from '@/lib/chapters'

// Composition only: each section has its own suite. Motion is stubbed out.
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn(), timeline: vi.fn(), to: vi.fn() } }))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))
vi.mock('@/components/Hero', () => ({ default: () => <section data-testid="hero"><h1>Hisham Hany</h1></section> }))
vi.mock('@/components/Navigation', () => ({ default: () => <header data-testid="nav" /> }))
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }))
vi.mock('@/components/ClientsMarquee', () => ({ default: () => <div data-testid="marquee" /> }))
vi.mock('@/components/Statement', () => ({ default: () => <div data-testid="statement" /> }))
vi.mock('@/components/home/AboutTeaser', () => ({ default: () => <section id="about" /> }))
vi.mock('@/components/home/ServicesTeaser', () => ({ default: () => <section id="services" /> }))
vi.mock('@/components/home/ContactCta', () => ({ default: () => <section id="contact" /> }))
vi.mock('@/hooks/useChapterScroll', () => ({ useChapterScroll: vi.fn(), CHAPTER_EVENT: 'hh:chapter' }))

import HomeClient from '@/components/home/HomeClient'

const chapter: ChapterData = {
  slug: 'seat-ibiza',
  href: '/work/seat-ibiza',
  number: 1,
  total: 1,
  title: 'Seat',
  subtitle: 'Ibiza',
  category: 'Automotive',
  creditLabel: 'Commission',
  credit: 'Dealer campaign',
  year: '2024',
  image: { src: '/images/Automotive/Seat%20ibiza/Hero.JPG', w: 2500, h: 1667, alt: 'White Seat Ibiza' },
  composition: 'bleed',
  side: 'right',
  copyZone: 'top-left',
  hold: 60,
  sizes: '100vw',
  morph: true,
}

describe('HomeClient — composition', () => {
  it('paints the intro overlay in the first render (it must be in the server HTML)', () => {
    const { container } = render(<HomeClient chapters={[chapter]} />)
    expect(container.querySelector('.intro-overlay')).toBeInTheDocument()
  })

  it('renders the exhibition, the index and every lower section without client-only gaps', () => {
    const { container } = render(
      <HomeClient chapters={[chapter]}>
        <section id="index" data-testid="index" />
      </HomeClient>,
    )
    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getByRole('link', { name: /seat/i })).toHaveAttribute('href', '/work/seat-ibiza')
    // The index arrives over the last chapter as part of the ink stage.
    expect(container.querySelector('.after-chapters.stage-scope [data-testid="index"]')).toBeInTheDocument()
    for (const id of ['work', 'about', 'services', 'contact', 'statement-section']) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument()
    }
  })
})
