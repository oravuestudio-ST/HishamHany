import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// Every 3D feature throws on mount here — a lost WebGL context, a missing
// model, a driver bug on some phone.
vi.mock('next/dynamic', () => ({
  default: () =>
    function Broken(): JSX.Element {
      throw new Error('three.js failed')
    },
}))

import FeatureSlot from '@/components/case-study/FeatureSlot'

describe('FeatureSlot when the 3D feature fails', () => {
  it('drops the logo slot quietly instead of taking the case study down', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<FeatureSlot featureKey="mercedes-logo-3d" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('drops the whole showcase section, header included', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<FeatureSlot featureKey="volkswagen-showcase" />)
    expect(container).toBeEmptyDOMElement()
  })
})
