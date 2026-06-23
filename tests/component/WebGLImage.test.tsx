import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WebGLImage from '@/components/WebGLImage'

/**
 * In jsdom HTMLCanvasElement.getContext is stubbed to null (see tests/setup/jsdom.ts),
 * so isWebGLAvailable() is false and the effect bails out before touching three.js —
 * the static <img> fallback must remain the visible content. This is the same path a
 * real browser takes when the WebGL budget is exhausted.
 */
describe('WebGLImage (fallback path)', () => {
  it('exposes an accessible image labelled by alt', () => {
    render(<WebGLImage src="/photo.jpg" alt="A portrait" />)
    expect(screen.getByRole('img', { name: 'A portrait' })).toBeInTheDocument()
  })

  it('renders the decorative <img> fallback pointing at the source', () => {
    const { container } = render(<WebGLImage src="/photo.jpg" alt="A portrait" />)
    const fallback = container.querySelector('img.webgl-image-fallback') as HTMLImageElement
    expect(fallback).toBeTruthy()
    expect(fallback.getAttribute('src')).toBe('/photo.jpg')
    expect(fallback.getAttribute('aria-hidden')).toBe('true')
  })

  it('does not mount a WebGL canvas when no GL context is available', () => {
    const { container } = render(<WebGLImage src="/photo.jpg" alt="A portrait" />)
    expect(container.querySelector('canvas')).toBeNull()
  })
})
