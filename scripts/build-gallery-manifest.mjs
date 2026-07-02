// Generates public/gallery-manifest.json — a map of hero-image-dir → sorted image URLs.
// Runs as a prebuild step so galleries.ts reads a static JSON instead of using
// fs.readdirSync at trace time (which bundles all 1.7GB of images into the lambda).
//
// Also emits public/gallery-dimensions.json — { <encoded-url>: [w, h] } — read
// server-side (never client-bundled) so CaseStudyGallery can feed real intrinsic
// dimensions to next/image and reserve exact space (no layout shift) in the
// variable-height masonry. Dimensions are read from the OPTIMIZED files, so the
// EXIF orientation the optimizer baked in is already reflected.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

function encodePublicPath(relDir, file) {
  const encodedDir = relDir.split('/').map(encodeURIComponent).join('/')
  return `/${encodedDir}/${encodeURIComponent(file)}`
}

function walkImages(dir, relBase) {
  const manifest = {}
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      Object.assign(manifest, walkImages(full, rel))
    } else if (IMAGE_EXT.test(entry.name)) {
      const dirKey = relBase || '.'
      if (!manifest[dirKey]) manifest[dirKey] = []
      manifest[dirKey].push(encodePublicPath(relBase, entry.name))
    }
  }
  // Sort each bucket
  for (const key of Object.keys(manifest)) {
    manifest[key].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  }
  return manifest
}

const imagesDir = path.join(publicDir, 'images')
const manifest = fs.existsSync(imagesDir) ? walkImages(imagesDir, 'images') : {}

const outPath = path.join(publicDir, 'gallery-manifest.json')
fs.writeFileSync(outPath, JSON.stringify(manifest))
console.log(`gallery-manifest.json written — ${Object.keys(manifest).length} directories`)

// ─── Dimensions map ─────────────────────────────────────────────────────────
// Every unique encoded URL → [width, height]. sharp reads only the file header,
// so this is cheap even across the full library. Keyed by the same encoded string
// the manifest stores, so lookups in withDimensions() are a direct match.
const urls = [...new Set(Object.values(manifest).flat())]
const dimensions = {}
let dimFailed = 0
await Promise.all(
  urls.map(async (url) => {
    // url is like "/images/Automotive/GLE-450/GLE450_car-001.JPG" (encoded).
    const abs = path.join(publicDir, decodeURIComponent(url).replace(/^\/+/, ''))
    try {
      const { width, height } = await sharp(abs).metadata()
      if (width && height) dimensions[url] = [width, height]
      else dimFailed++
    } catch {
      dimFailed++
    }
  })
)

const dimPath = path.join(publicDir, 'gallery-dimensions.json')
fs.writeFileSync(dimPath, JSON.stringify(dimensions))
console.log(`gallery-dimensions.json written — ${Object.keys(dimensions).length} images${dimFailed ? ` (${dimFailed} unreadable)` : ''}`)
