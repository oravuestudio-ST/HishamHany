import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn(), context: () => ({ revert: vi.fn() }), fromTo: vi.fn() } }))
vi.mock('@/hooks/useScrollReveal', () => ({ useScrollReveal: () => ({ current: null }) }))
vi.mock('@/hooks/useTilt', () => ({ useTilt: () => ({ current: null }) }))

import CaseNext from '@/components/case-study/CaseNext'
import { projects } from '@/lib/projects'

const next = projects[1]

// Case studies are where a buyer decides; each one should end with a direct,
// pre-scoped way to start a project of the same kind.
describe('CaseNext commission line', () => {
  it('links to the contact form pre-scoped to the case study category', () => {
    render(<CaseNext related={[]} next={next} category="Automotive" />)
    const link = screen.getByRole('link', { name: /commission an automotive production/i })
    expect(link).toHaveAttribute('href', '/contact?project=Automotive')
  })

  it('uses "a" before consonant categories', () => {
    render(<CaseNext related={[]} next={next} category="Fashion" />)
    expect(screen.getByRole('link', { name: /commission a fashion production/i })).toHaveAttribute(
      'href',
      '/contact?project=Fashion'
    )
  })
})
