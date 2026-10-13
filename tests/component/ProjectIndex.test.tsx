import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectIndex from '@/components/home/ProjectIndex'
import { projects } from '@/lib/projects'

describe('ProjectIndex — every project, one Tab away', () => {
  it('links every project once, with its subtitle in the name (titles repeat)', () => {
    render(<ProjectIndex />)
    for (const p of projects) {
      const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const name = p.subtitle ? new RegExp(`${esc(p.title)}\\W+${esc(p.subtitle)}`) : new RegExp(esc(p.title))
      const links = screen.getAllByRole('link', { name })
      expect(links.some((a) => a.getAttribute('href') === `/work/${p.slug}`)).toBe(true)
    }
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href')).filter((h) => h?.startsWith('/work/'))
    expect(new Set(hrefs).size).toBe(projects.length)
  })

  it('has its own heading under the hero’s h1, and points on to the filterable archive', () => {
    render(<ProjectIndex />)
    expect(screen.getByRole('heading', { level: 2, name: 'Index' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse the archive/i })).toHaveAttribute('href', '/portfolio')
  })
})
