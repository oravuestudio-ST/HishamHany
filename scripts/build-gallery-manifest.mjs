// Generates public/gallery-manifest.json — a map of hero-image-dir → sorted image URLs.
// Runs as a prebuild step so galleries.ts reads a static JSON instead of using
// fs.readdirSync at trace time (which bundles all 1.7GB of images into the lambda).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
