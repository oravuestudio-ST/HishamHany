import fs from 'node:fs'
import path from 'node:path'

// Server-only. Builds a project's full image set by reading the folder that its
// hero image lives in (under /public), at build time. Do NOT import from a client
// component — it uses the filesystem.

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

function encodePublicPath(relDir: string, file: string): string {
  const encodedDir = relDir.split('/').map(encodeURIComponent).join('/')
  return `/${encodedDir}/${encodeURIComponent(file)}`
}

/**
 * Returns all images in the folder of `imagePath`, as encoded /public URLs,
 * naturally sorted. Falls back to just the hero image if the folder can't be read.
 */
export function getGallery(imagePath: string): string[] {
  const decoded = decodeURIComponent(imagePath)
  const relDir = path.dirname(decoded).replace(/^\/+/, '') // e.g. images/Automotive/GLE-450
  const absDir = path.join(process.cwd(), 'public', relDir)

  let files: string[]
  try {
    files = fs.readdirSync(absDir)
  } catch {
    return [imagePath]
  }

  const images = files
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((f) => encodePublicPath(relDir, f))

  return images.length ? images : [imagePath]
}
