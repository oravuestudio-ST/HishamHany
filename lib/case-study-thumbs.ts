// Client-safe helper for the CaseStudyFeed component — derives 2-3 thumbnail
// paths per project from the gallery manifest. The full manifest is ~40KB and
// gets statically bundled (no fs / no network roundtrip), which keeps the
// homepage feed fully client-rendered without server-only imports.
//
// Manifest keys use literal characters (e.g. "images/Automotive/Glide scooter").
// Manifest values are URL-encoded (e.g. "/images/Automotive/Glide%20scooter/x.JPG").
// Hero paths in `lib/projects.ts` are URL-encoded.

import manifestJson from '../public/gallery-manifest.json'

const manifest = manifestJson as Record<string, string[]>

export function getThumbnails(heroImagePath: string, count = 3): string[] {
  const decoded = decodeURIComponent(heroImagePath)
  const folder = decoded.replace(/^\/+/, '').split('/').slice(0, -1).join('/')
  const heroFilename = decoded.split('/').pop()

  const bucket = manifest[folder]
  if (!bucket || bucket.length === 0) return []

  return bucket
    .filter((p) => decodeURIComponent(p).split('/').pop() !== heroFilename)
    .slice(0, count)
}
