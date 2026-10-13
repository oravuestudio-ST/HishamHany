import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// The hero's intro reveal is keyed to the intro phase the Loader reports.
// GSAP is stubbed to record what the reveal schedules.
type FromTo = { target: unknown; from: Record<string, unknown>; to: Record<string, unknown>; position?: unknown }
let fromTos: FromTo[] = []
let progress = vi.fn()
let timelineCount = 0

vi.mock('gsap', () => {
  const timeline = () => {
    timelineCount++
    const tl: Record<string, unknown> = {
      fromTo: (target: unknown, from: Record<string, unknown>, to: Record<string, unknown>, position?: unknown) => {
        fromTos.push({ target, from, to, position })
        return tl
      },
      progress: (v: number) => { progress(v); return tl },
      kill: vi.fn(),
    }
    return tl
  }
  return {
    gsap: {
      registerPlugin: vi.fn(),
      timeline,
      quickTo: () => vi.fn(),
      matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }),
    },
  }
})
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

let phase: 'loading' | 'opening' | 'entered' = 'loading'
vi.mock('@/components/MotionProvider', () => ({ useIntroPhase: () => phase }))

import Hero, { HERO_IMAGE } from '@/components/Hero'
import { APERTURE, CHAPTER, LOAD } from '@/lib/motion'

beforeEach(() => {
  fromTos = []
  progress = vi.fn()
  timelineCount = 0
  phase = 'loading'
})

describe('Hero — identity scene', () => {
  it('is the page’s one h1, named for people and search engines alike', () => {
    render(<Hero />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveAccessibleName(/Hisham\s*Hany, photographer in Cairo/)
    expect(screen.getByText('Fashion · Automotive · Cinematic')).toBeInTheDocument()
  })

  it('invites the scroll with real links, not a hover-only cue', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: /scroll to the work/i })).toHaveAttribute('href', '#work')
    expect(screen.getByRole('link', { name: /index/i })).toHaveAttribute('href', '#index')
  })

  it('describes the photograph and keeps it off the cursor’s "View" state', () => {
    const { container } = render(<Hero />)
    const img = screen.getByRole('img', { name: HERO_IMAGE.alt })
    expect(img).toBeInTheDocument()
    expect(container.querySelector('#hero-section [data-cursor-plain]')).toBeInTheDocument()
  })

  it('ships the headline painted, untransformed — it is the LCP, hidden only by the intro bars', () => {
    const { container } = render(<Hero />)
    const lines = container.querySelectorAll('.hero-line')
    expect(lines).toHaveLength(2)
    lines.forEach((l) => expect((l as HTMLElement).style.transform).toBe(''))
  })

  it('reveals as the bars part: the photo settles and the name rises line by line', () => {
    const { rerender } = render(<Hero />)
    expect(timelineCount).toBe(0)
    phase = 'opening'
    rerender(<Hero />)
    expect(timelineCount).toBe(1)

    const media = fromTos.find((c) => 'scale' in c.from)
    expect(media?.from.scale).toBe(APERTURE.startScale)
    expect(media?.to.scale).toBe(CHAPTER.restScale)

    const lines = fromTos.find((c) => 'yPercent' in c.from)
    // y: 0 keeps any px offset (GSAP parses existing transforms into y) out
    // of the reveal, so the name can't end up stuck below its mask.
    expect(lines?.from).toMatchObject({ yPercent: 110, y: 0 })
    expect(lines?.to.yPercent).toBe(0)
    expect(lines?.position).toBeCloseTo(LOAD.open * LOAD.copyAt)
  })

  it('lets the reveal play out when the intro releases naturally', () => {
    const { rerender } = render(<Hero />)
    phase = 'opening'
    rerender(<Hero />)
    phase = 'entered'
    document.documentElement.dataset.intro = 'run'
    rerender(<Hero />)
    expect(progress).not.toHaveBeenCalled()
    delete document.documentElement.dataset.intro
  })

  it('finishes a mid-flight reveal when the reader skips the intro', () => {
    const { rerender } = render(<Hero />)
    phase = 'opening'
    rerender(<Hero />)
    phase = 'entered'
    document.documentElement.dataset.intro = 'done'
    rerender(<Hero />)
    expect(progress).toHaveBeenCalledWith(1)
    delete document.documentElement.dataset.intro
  })

  it('does nothing on an in-app return — the page is simply there', () => {
    phase = 'entered'
    render(<Hero />)
    expect(timelineCount).toBe(0)
  })
})
