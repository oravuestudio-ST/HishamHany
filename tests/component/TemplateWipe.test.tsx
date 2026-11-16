import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// Regression: Back after a shutter navigation left the page under solid ink.
// The lift tween was created inside the page's gsap.context, so the route
// change's ctx.revert() rewound the surface to "covering". The lift must
// belong to the body-level surface, never to a page context.
vi.mock('next/navigation', () => ({ usePathname: () => '/contact' }))

let inContext = false
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      inContext = true
      fn()
      inContext = false
      return { revert: vi.fn() }
    },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

const liftedInContext: boolean[] = []
vi.mock('@/animations/transitions', () => ({
  isCovered: () => true,
  liftWipe: () => {
    liftedInContext.push(inContext)
    return true
  },
}))

import Template from '@/app/template'

describe('Template shutter lift', () => {
  it('lifts the wipe outside the page context so a later revert cannot drop it back', () => {
    render(
      <Template>
        <p>page</p>
      </Template>
    )
    expect(liftedInContext).toEqual([false])
  })
})
