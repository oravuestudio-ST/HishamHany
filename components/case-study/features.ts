import type { FeatureKey } from '@/lib/projects'

/**
 * Placement metadata for case-study feature slots. Kept free of 'use client'
 * so server components (the case-study page) can call featuresFor() during
 * static generation — importing it from the client FeatureSlot module would
 * hand the server a client-reference proxy instead of a function.
 */
export const FEATURE_PLACEMENTS: Record<FeatureKey, 'meta' | 'after-gallery'> = {
  'mercedes-logo-3d': 'meta',
  'volkswagen-logo-3d': 'meta',
  'volkswagen-showcase': 'after-gallery',
}

/** Keys from `features` that belong in the given placement. */
export function featuresFor(
  keys: readonly FeatureKey[] | undefined,
  placement: 'meta' | 'after-gallery'
): FeatureKey[] {
  return (keys ?? []).filter((k) => FEATURE_PLACEMENTS[k] === placement)
}
