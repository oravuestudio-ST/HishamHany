import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// The 3D components behind the slots pull in three.js — stub the dynamic
// loader so tests assert the slot contract, not WebGL.
vi.mock('next/dynamic', () => ({
  default: () => () => <canvas data-testid="feature-3d" />,
}))

import FeatureSlot, { featuresFor } from '@/components/case-study/FeatureSlot'
import type { FeatureKey } from '@/lib/projects'

describe('featuresFor', () => {
  it('filters keys by placement', () => {
    const keys: FeatureKey[] = ['mercedes-logo-3d', 'volkswagen-showcase']
    expect(featuresFor(keys, 'meta')).toEqual(['mercedes-logo-3d'])
    expect(featuresFor(keys, 'after-gallery')).toEqual(['volkswagen-showcase'])
  })

  it('handles undefined and unknown keys without throwing', () => {
    expect(featuresFor(undefined, 'meta')).toEqual([])
    expect(featuresFor(['not-a-feature' as FeatureKey], 'meta')).toEqual([])
  })
})

describe('FeatureSlot', () => {
  it('renders a labelled meta slot for logo features', () => {
    const { container } = render(<FeatureSlot featureKey="mercedes-logo-3d" />)
    expect(container.querySelector('[aria-label="Mercedes-Benz"]')).not.toBeNull()
  })

  it('renders a full-width section for after-gallery features', () => {
    const { container } = render(<FeatureSlot featureKey="volkswagen-showcase" />)
    expect(container.querySelector('section')).not.toBeNull()
  })

  it('renders nothing for an unknown key', () => {
    const { container } = render(
      <FeatureSlot featureKey={'not-a-feature' as FeatureKey} />
    )
    expect(container.innerHTML).toBe('')
  })
})
