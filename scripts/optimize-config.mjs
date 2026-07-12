/**
 * optimize-config.mjs — tier table for the image-optimization pass.
 *
 * Full-bleed covers (each project's `image:` in lib/projects.ts) render up to
 * viewport width on CaseCover and the hero, so they keep the 4K ceiling and the
 * conservative touch threshold. Everything else is grid/spread imagery that
 * next/image never serves wider than ~1280 logical px — 2560 covers 2x DPR.
 * Logos are hand-tuned assets; never recompressed.
 */

/** Covers: visually lossless ceiling, only shrink the true camera-original outliers. */
export const COVER_RULE = Object.freeze({ maxEdge: 3840, quality: 85, minBytes: 1.5 * 1024 * 1024 })

/** Everything else: 2x-DPR ceiling, reach down into the mid-size bulk of the tree. */
export const DEFAULT_RULE = Object.freeze({ maxEdge: 2560, quality: 82, minBytes: 400 * 1024 })

/**
 * Extract project cover paths from lib/projects.ts source text.
 * Paths in the registry are URL-encoded and rooted at /images/; the optimizer
 * walks the filesystem, so return decoded paths relative to public/images/.
 */
export function parseCoverPaths(source) {
  const covers = new Set()
  for (const [, p] of source.matchAll(/(?<![A-Za-z])image:\s*'\/images\/([^']+)'/g)) {
    covers.add(decodeURIComponent(p))
  }
  return covers
}

/**
 * Resolve the rule for one image, by path relative to public/images/.
 * Returns null for files the pass must never touch.
 */
export function ruleFor(relPath, coverPaths) {
  if (relPath.startsWith('logos/')) return null
  return coverPaths.has(relPath) ? COVER_RULE : DEFAULT_RULE
}
