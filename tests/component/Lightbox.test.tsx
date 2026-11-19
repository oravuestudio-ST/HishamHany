import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Lightbox from '@/components/case-study/Lightbox'

const images = [
  { src: '/images/a.jpg', w: 1200, h: 800 },
  { src: '/images/b.jpg', w: 800, h: 1200 },
  { src: '/images/c.jpg' }, // no intrinsic size (colour-study URLs)
]

/** A page with the button that opened the viewer, like the real galleries. */
function Harness({ start = 0 }: { start?: number }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <button type="button" onClick={() => setOpen(start)}>
        Open frame
      </button>
      <Lightbox images={images} open={open} title="Mercedes" onClose={() => setOpen(null)} onNavigate={setOpen} />
    </>
  )
}

function openViewer(start = 0) {
  render(<Harness start={start} />)
  const opener = screen.getByRole('button', { name: 'Open frame' })
  opener.focus()
  fireEvent.click(opener)
  return { opener, dialog: screen.getByRole('dialog') }
}

beforeEach(() => {
  document.documentElement.style.overflow = ''
})

describe('Lightbox focus management', () => {
  it('moves focus into the viewer when it opens', () => {
    const { dialog } = openViewer()
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('keeps Tab inside the viewer, both directions', () => {
    const { dialog } = openViewer()
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button'))
    const last = controls[controls.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(controls[0])

    controls[0].focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('returns focus to the frame that opened it on Escape', () => {
    const { opener } = openViewer()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('locks page scrolling while open and restores it after', () => {
    openViewer()
    expect(document.documentElement.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.documentElement.style.overflow).toBe('')
  })
})

describe('Lightbox content', () => {
  it('pages with the arrow keys and wraps around', () => {
    openViewer(2)
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('follows a horizontal swipe, pages past the threshold, ignores vertical drags', async () => {
    const { dialog } = openViewer(0)
    const stage = dialog.querySelector('img')!.parentElement!
    const swipe = (x0: number, x1: number, y1 = 100) => {
      fireEvent.touchStart(dialog, { touches: [{ clientX: x0, clientY: 100 }] })
      fireEvent.touchMove(dialog, { touches: [{ clientX: x1, clientY: y1 }] })
    }
    swipe(300, 100)
    expect(stage.style.transform).toBe('translateX(-200px)') // tracks the finger
    fireEvent.touchEnd(dialog)
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument())
    swipe(100, 300)
    fireEvent.touchEnd(dialog)
    await waitFor(() => expect(screen.getByText('1 / 3')).toBeInTheDocument())
    swipe(300, 260) // too short: springs back
    fireEvent.touchEnd(dialog)
    expect(stage.style.transform).toBe('')
    swipe(300, 240, 400) // mostly vertical: never moves
    expect(stage.style.transform).toBe('')
    fireEvent.touchEnd(dialog)
    await new Promise((r) => setTimeout(r, 400))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('renders frames that have no intrinsic size (fills the stage)', () => {
    openViewer(2)
    expect(screen.getByRole('img', { name: /Mercedes — 3 of 3/ })).toBeInTheDocument()
  })

  it('names the set in the label and counter when one is given', () => {
    render(
      <Lightbox images={images} open={0} title="Glitch" label="Monochrome" onClose={vi.fn()} onNavigate={vi.fn()} />
    )
    expect(screen.getByRole('dialog', { name: 'Glitch — Monochrome gallery viewer' })).toBeInTheDocument()
    expect(screen.getByText('Monochrome · 1 / 3')).toBeInTheDocument()
  })
})
