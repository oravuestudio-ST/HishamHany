import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

// A recording GSAP stub: every timeline keeps a log of what was scheduled
// (target selector / vars / position), so the tests can check *how* the
// handoff is wired — not just that something animated.
type Call = { kind: 'to' | 'fromTo' | 'call'; target?: unknown; vars?: Record<string, unknown>; fn?: unknown; position?: unknown }
type FakeTimeline = {
  calls: Call[]
  progress: ReturnType<typeof vi.fn>
  config?: Record<string, unknown>
}
let timelines: FakeTimeline[] = []
let tickers: Array<(t: number, d: number) => void> = []

vi.mock('gsap', () => {
  const timeline = (config?: Record<string, unknown>) => {
    const record: FakeTimeline = { calls: [], progress: vi.fn(), config }
    timelines.push(record)
    const tl: Record<string, unknown> = {
      to: (target: unknown, vars: Record<string, unknown>, position?: unknown) => { record.calls.push({ kind: 'to', target, vars, position }); return tl },
      fromTo: (target: unknown, _from: unknown, vars: Record<string, unknown>, position?: unknown) => { record.calls.push({ kind: 'fromTo', target, vars, position }); return tl },
      call: (fn: unknown, _args: unknown, position?: unknown) => { record.calls.push({ kind: 'call', fn, position }); return tl },
      eventCallback: vi.fn(() => tl),
      progress: (v?: number) => { record.progress(v); return tl },
      kill: vi.fn(),
    }
    return tl
  }
  return {
    gsap: {
      registerPlugin: vi.fn(),
      set: vi.fn(),
      timeline,
      to: vi.fn(),
      utils: { selector: (root: Element) => (sel: string) => Array.from(root.querySelectorAll(sel)) },
      ticker: {
        add: (fn: (t: number, d: number) => void) => { tickers.push(fn) },
        remove: (fn: (t: number, d: number) => void) => { tickers = tickers.filter((f) => f !== fn) },
      },
    },
  }
})
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import Loader from '@/components/Loader'
import { LOAD } from '@/lib/motion'

const html = document.documentElement

function mount(intro?: string) {
  if (intro) html.dataset.intro = intro
  else delete html.dataset.intro
  const onOpening = vi.fn()
  const onEntered = vi.fn()
  const view = render(<Loader onOpening={onOpening} onEntered={onEntered} />)
  return { ...view, onOpening, onEntered }
}

/** The handoff timeline is the one built with an onComplete (it finishes the intro). */
const handoff = () => timelines.find((t) => t.config && 'onComplete' in t.config)

describe('Loader — the viewfinder intro', () => {
  beforeEach(() => {
    timelines = []
    tickers = []
    sessionStorage.clear()
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
  afterEach(() => {
    delete html.dataset.intro
  })

  it('is decorative to assistive tech: the h1 carries the name, not the overlay', () => {
    const { container } = mount()
    const overlay = container.querySelector('.intro-overlay')
    expect(overlay).toHaveAttribute('aria-hidden', 'true')
    // Four bars around a window, a caption with the lockup and the count.
    expect(container.querySelectorAll('.intro-bar')).toHaveLength(4)
    expect(container.querySelector('.intro-window .intro-veil')).toBeInTheDocument()
    expect(container.querySelector('.intro-count')).toHaveTextContent('000')
    // Ten HISHAM HANY glyphs per lockup copy (sharp + statically blurred).
    expect(container.querySelectorAll('.logo-glyph')).toHaveLength(20)
  })

  it('releases the page at once when the bootstrap decided there is no intro', () => {
    const { onEntered, onOpening } = mount()
    expect(onEntered).toHaveBeenCalledOnce()
    expect(onOpening).not.toHaveBeenCalled()
    expect(html.dataset.intro).toBeUndefined()
    expect(timelines).toHaveLength(0)
  })

  it('treats an already-finished intro (in-app return) the same way', () => {
    const { onEntered } = mount('done')
    expect(onEntered).toHaveBeenCalledOnce()
    expect(timelines).toHaveLength(0)
  })

  it('claims the intro, remembers it for the session, and holds the release', () => {
    const { onEntered } = mount('full')
    expect(html.dataset.intro).toBe('run')
    expect(sessionStorage.getItem('hh-intro')).toBe('1')
    expect(onEntered).not.toHaveBeenCalled()
    // The count runs on the ticker, driven by real progress.
    expect(tickers).toHaveLength(1)
  })

  it('skips straight to the finished page when the reader arrives mid-page', () => {
    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true })
    const { onEntered } = mount('full')
    expect(html.dataset.intro).toBe('done')
    expect(onEntered).toHaveBeenCalledOnce()
  })

  it('fast-forwards on the first input — nobody waits on a flourish', () => {
    mount('full')
    fireEvent.keyDown(window, { key: 'Tab' })
    const tl = handoff()
    expect(tl).toBeDefined()
    expect(tl!.progress).toHaveBeenCalledWith(1)
    // The count stops once the handoff starts.
    expect(tickers).toHaveLength(0)
  })

  it('opens before it releases, both inside the bars parting', () => {
    const { onOpening, onEntered } = mount('full')
    fireEvent.pointerDown(window)
    const calls = handoff()!.calls
    const opening = calls.find((c) => c.kind === 'call' && c.fn === onOpening)
    const entered = calls.find((c) => c.kind === 'call' && c.fn === onEntered)
    expect(opening).toBeDefined()
    expect(entered).toBeDefined()
    const openAt = opening!.position as number
    expect(entered!.position).toBeCloseTo(openAt + LOAD.open * LOAD.releaseAt)
    // All four bars leave by transform only.
    const barMoves = calls.filter((c) => c.kind === 'to' && c.vars && ('xPercent' in c.vars || 'yPercent' in c.vars))
    expect(barMoves).toHaveLength(4)
    barMoves.forEach((c) => expect(c.vars!.duration).toBe(LOAD.open))
  })

  it('never animates a filter — the focus pull is a cross-fade', () => {
    mount('full')
    fireEvent.pointerDown(window)
    const all = timelines.flatMap((t) => t.calls)
    all.forEach((c) => expect(c.vars && 'filter' in c.vars).toBeFalsy())
  })

  it('hands the starting state back if unmounted mid-intro, so a re-run replays', () => {
    const { unmount } = mount('short')
    expect(html.dataset.intro).toBe('run')
    unmount()
    expect(html.dataset.intro).toBe('short')
  })
})
