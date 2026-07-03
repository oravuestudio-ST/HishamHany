'use client'

import dynamic from 'next/dynamic'
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

  if (placement === 'meta') {
    return (
      <div className="h-14 w-14" role="img" aria-label={label}>
        <Component />
      </div>
    )
  }

  return (
    <section className="px-6 md:px-12 pb-24">
      <div className="border-t border-fg/10 pt-12 mb-6 flex items-baseline justify-between">
        <p className="font-sans text-label-xs uppercase text-muted/40">{label}</p>
        <p className="font-sans text-label-xs uppercase text-muted/30 hidden md:block">
          Drag to explore
        </p>
      </div>
      <Component />
    </section>
  )
}
