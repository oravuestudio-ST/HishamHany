'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import type { FeatureKey } from '@/lib/projects'
import { FEATURE_PLACEMENTS, featuresFor } from '@/components/case-study/features'

export { featuresFor }

/**
 * Data-driven interactive features for case studies. A project declares
 * `editorial.features` in the registry and the matching component renders —
 * no slug checks in the page template. Adding a client feature means one
 * entry here, its placement in features.ts, and a key in the registry.
 */
const FEATURES: Record<FeatureKey, { label: string; Component: React.ComponentType }> = {
  'mercedes-logo-3d': {
    label: 'Mercedes-Benz',
    Component: dynamic(() => import('@/components/MercedesLogo3D'), { ssr: false }),
  },
  'volkswagen-logo-3d': {
    label: 'Volkswagen',
    Component: dynamic(() => import('@/components/VolkswagenLogo3D'), { ssr: false }),
  },
  'volkswagen-showcase': {
    label: 'Interactive 3D model',
    Component: dynamic(() => import('@/components/VolkswagenCarShowcase'), { ssr: false }),
  },
}

export default function FeatureSlot({ featureKey }: { featureKey: FeatureKey }) {
  const feature = FEATURES[featureKey]
  const placement = FEATURE_PLACEMENTS[featureKey]
  if (!feature || !placement) return null
  const { Component, label } = feature

  // Each feature is optional: if WebGL or the model fails on this device the
  // slot removes itself (header included) and the case study carries on.
  if (placement === 'meta') {
    return (
      <ErrorBoundary name={featureKey}>
        <div className="h-14 w-14" role="img" aria-label={label}>
          <Component />
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary name={featureKey}>
      <section className="px-6 md:px-12 pb-24">
        <div className="border-t border-line pt-12 mb-6 flex items-baseline justify-between">
          <p className="eyebrow">{label}</p>
          <p className="eyebrow hidden md:block">
            Drag to explore
          </p>
        </div>
        <Component />
      </section>
    </ErrorBoundary>
  )
}
