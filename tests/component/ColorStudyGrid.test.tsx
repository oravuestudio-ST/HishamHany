import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ColorStudyGrid from '@/components/ColorStudyGrid'

const colorSets = [
  { label: 'Monochrome', images: ['/images/m1.jpg', '/images/m2.jpg'] },
  { label: 'Ultramarine', images: ['/images/u1.jpg'] },
]

// Colour studies open the same shared viewer as the case-study spreads.
describe('ColorStudyGrid viewer', () => {
  it('opens the shared viewer for the chosen set and returns focus to its tile', () => {
    render(<ColorStudyGrid colorSets={colorSets} title="Glitch" />)
    const tile = screen.getByRole('button', { name: /Open Monochrome color set/i })
    tile.focus()
    fireEvent.click(tile)

    const dialog = screen.getByRole('dialog', { name: 'Glitch — Monochrome gallery viewer' })
    expect(screen.getByText('Monochrome · 1 / 2')).toBeInTheDocument()
    expect(dialog.contains(document.activeElement)).toBe(true)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(tile)
  })
})
