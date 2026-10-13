import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Chapter from '@/components/home/Chapter'
import type { ChapterData } from '@/lib/chapters'

const base: ChapterData = {
  slug: 'mercedes-gle-450-4matic',
  href: '/work/mercedes-gle-450-4matic',
  number: 4,
  total: 6,
  title: 'Mercedes',
  subtitle: 'GLE 450 4MATIC',
  category: 'Automotive',
  creditLabel: 'Client',
  credit: 'El Koptan',
  year: '2024',
  image: { src: '/images/Automotive/GLE-450/Hero_GLE450_car-004.JPG', w: 1080, h: 720, alt: 'Black Mercedes GLE 450 on a palm-lined avenue in soft daylight' },
  composition: 'hung',
  side: 'right',
  copyZone: 'bottom-left',
  hold: 30,
  sizes: '(min-width: 769px) 56vw, 100vw',
  morph: true,
}

function renderChapter(data: Partial<ChapterData> = {}) {
  return render(<ol><Chapter chapter={{ ...base, ...data }} /></ol>)
}

describe('Chapter — one scene of the exhibition', () => {
  it('is one link and one tab stop, named by the project title', () => {
    const { container } = renderChapter()
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/work/mercedes-gle-450-4matic')
    expect(links[0]).toHaveClass('stretched-link')
    expect(screen.getByRole('heading', { level: 3, name: /^Mercedes\W+GLE 450 4MATIC$/ })).toBeInTheDocument()
  })

  it('names the scene region by its title for assistive tech', () => {
    renderChapter()
    expect(screen.getByRole('article', { name: /^Mercedes\W+GLE 450 4MATIC$/ })).toBeInTheDocument()
  })

  it('states category, client and year as a description list, not a dotted string', () => {
    renderChapter()
    const dl = document.querySelector('dl')!
    const scope = within(dl as HTMLElement)
    expect(scope.getByText('Discipline')).toHaveClass('sr-only')
    expect(scope.getByText('Automotive')).toBeInTheDocument()
    expect(scope.getByText('Client')).toHaveClass('sr-only')
    expect(scope.getByText('El Koptan')).toBeInTheDocument()
    expect(scope.getByText('2024')).toBeInTheDocument()
  })

  it('hangs the plate on the wall with the viewfinder brackets (hung only)', () => {
    const { container } = renderChapter()
    expect(container.querySelector('.chapter-plate[data-composition="hung"] .viewfinder')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: base.image.alt })).toBeInTheDocument()
    const bleed = renderChapter({ composition: 'bleed', slug: 'seat-ibiza' })
    expect(bleed.container.querySelector('.chapter-plate[data-composition="bleed"] .viewfinder')).toBeNull()
  })

  it('marks its plate as a morph source only when the cover is the case study’s own', () => {
    const own = renderChapter()
    expect(own.container.querySelector('[data-morph-source="mercedes-gle-450-4matic"]')).toBeInTheDocument()
    const other = renderChapter({ morph: false, slug: 'new-capital-architectural-study' })
    expect(other.container.querySelector('[data-morph-source]')).toBeNull()
    expect(other.container.querySelector('[data-morph-slug]')).toBeNull()
  })

  it('carries its hold budget to the sticky geometry', () => {
    const { container } = renderChapter({ hold: 60 })
    expect((container.querySelector('.chapter') as HTMLElement).style.getPropertyValue('--hold')).toBe('60vh')
  })
})
