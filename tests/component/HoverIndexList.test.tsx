import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import HoverIndexList from '@/components/HoverIndexList'

const items = [
  { title: 'Alpha', meta: 'Fashion · 2024', img: '/images/alpha.jpg', href: '/work/alpha' },
  { title: 'Beta', meta: 'Automotive · 2023', img: '/images/beta.jpg', href: '/work/beta' },
]

const preview = (root: HTMLElement) =>
  root.querySelector('[aria-hidden="true"] img') as HTMLImageElement | null

describe('HoverIndexList', () => {
  it('does not render the preview thumbnail with an empty src before hover', () => {
    // An empty src="" resolves against the document URL, so the browser
    // requests the page itself and shows a broken image (naturalWidth 0).
    const { container } = render(<HoverIndexList items={items} />)
    const img = preview(container)
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).not.toBe('')
  })

  it('populates the preview src with the hovered row image', () => {
    const { container, getByText } = render(<HoverIndexList items={items} />)
    fireEvent.mouseEnter(getByText('Alpha').closest('a')!)
    expect(preview(container)!.getAttribute('src')).toContain('/images/alpha.jpg')
  })
})
