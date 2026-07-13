import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

const push = vi.fn()
const usePathname = vi.fn(() => '/portfolio')
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => usePathname(),
}))

const navigateWithTransition = vi.fn()
vi.mock('@/lib/view-transitions', () => ({
  navigateWithTransition: (...args: unknown[]) => navigateWithTransition(...args),
}))

import RouteWipe from '@/components/RouteWipe'

beforeEach(() => {
  push.mockClear()
  navigateWithTransition.mockClear()
  usePathname.mockReturnValue('/portfolio')
  document.body.innerHTML = ''
})

describe('RouteWipe', () => {
  it('hands every internal click to the single navigateWithTransition dispatcher', async () => {
    document.body.innerHTML = '<a href="/work/glitch-club">Glitch Club</a>'
    render(<RouteWipe />)

    fireEvent.click(document.querySelector('a')!)

    expect(navigateWithTransition).toHaveBeenCalledTimes(1)
    const [from, to, push_] = navigateWithTransition.mock.calls[0]
    expect(from).toBe('/portfolio')
    expect(to).toBe('/work/glitch-club')

    push_()
    expect(push).toHaveBeenCalledWith('/work/glitch-club')
  })

  it('ignores external links', () => {
    document.body.innerHTML = '<a href="https://example.com">External</a>'
    render(<RouteWipe />)
    fireEvent.click(document.querySelector('a')!)
    expect(navigateWithTransition).not.toHaveBeenCalled()
  })

  it('ignores same-path clicks', () => {
    document.body.innerHTML = '<a href="/portfolio">Here</a>'
    render(<RouteWipe />)
    fireEvent.click(document.querySelector('a')!)
    expect(navigateWithTransition).not.toHaveBeenCalled()
  })

  it('ignores modified clicks (new-tab intent)', () => {
    document.body.innerHTML = '<a href="/work/glitch-club">Glitch Club</a>'
    render(<RouteWipe />)
    fireEvent.click(document.querySelector('a')!, { ctrlKey: true })
    expect(navigateWithTransition).not.toHaveBeenCalled()
  })
})
