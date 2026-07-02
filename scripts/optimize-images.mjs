#!/usr/bin/env node
/**
 * optimize-images.mjs — batch-recompress public/images for the web.
 *
 * Straight-from-camera JPEGs (15–30 MB) are far larger than any browser needs:
 * next/image downscales them anyway, so the multi-MB original only ever bloats
 * the Vercel deploy. This caps the long edge and re-encodes with mozjpeg while
 * PRESERVING the embedded ICC colour profile — colour accuracy is the whole point
 * of a photographer's portfolio, so we never strip it.
 *
 * Safe by default:
 *   node scripts/optimize-images.mjs           # DRY RUN — reports projected savings, writes nothing
 *   node scripts/optimize-images.mjs --write    # applies, backing up every original first
 *
 * Originals are copied to public/.images-originals/ (gitignored) before overwrite,
 * so the run is fully reversible: restore by copying that tree back over public/images/.
 */
import sharp from 'sharp'
import { readdir, stat, mkdir, copyFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'public', 'images')
const BACKUP_DIR = path.join(ROOT, 'public', '.images-originals')

// ── Tunable knobs ──────────────────────────────────────────────────────────
// MAX_EDGE: longest side in px. Next.js default deviceSizes tops out at 3840 (4K),
//   so 3840 is visually lossless for full-bleed use; 2560 is plenty for gallery grids
//   and saves more. QUALITY: mozjpeg quality (85–90 = visually indistinguishable).
// ONLY_LARGER_THAN: skip files already small enough to not be worth touching.
// Overridable from the CLI, e.g. QUALITY=92 MAX_EDGE=4096 npm run images:optimize
const MAX_EDGE = Number(process.env.MAX_EDGE) || 3840
const QUALITY = Number(process.env.QUALITY) || 85
const ONLY_LARGER_THAN = 1.5 * 1024 * 1024 // 1.5 MB
const EXTS = new Set(['.jpg', '.jpeg', '.png'])
// ───────────────────────────────────────────────────────────────────────────

const WRITE = process.argv.includes('--write')

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue // skip .DS_Store, .images-originals, etc.
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (EXTS.has(path.extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`No images dir at ${SRC_DIR}`)
    process.exit(1)
  }
  const files = await walk(SRC_DIR)
  console.log(`\n${WRITE ? '✎ WRITE' : '⊙ DRY RUN'} — ${files.length} images · max ${MAX_EDGE}px · quality ${QUALITY}\n`)

  let scanned = 0, touched = 0, before = 0, after = 0, skipped = 0, failed = 0

  for (const file of files) {
    scanned++
    const rel = path.relative(SRC_DIR, file)
    let origSize
    try {
      origSize = (await stat(file)).size
    } catch {
      failed++; continue
    }
    if (origSize < ONLY_LARGER_THAN) { skipped++; continue }

    try {
      const isPng = path.extname(file).toLowerCase() === '.png'
      // keepIccProfile() preserves the colour profile; rotate() bakes in EXIF orientation.
      let pipe = sharp(file, { failOn: 'error' })
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .keepIccProfile()
      pipe = isPng
        ? pipe.png({ compressionLevel: 9, palette: true })
        : pipe.jpeg({ quality: QUALITY, mozjpeg: true })

      const buf = await pipe.toBuffer()

      before += origSize
      // Only count as a win if the re-encode is actually smaller.
      const newSize = buf.length < origSize ? buf.length : origSize
      after += newSize
      const saved = origSize - newSize

      if (buf.length < origSize) {
        touched++
        console.log(`  ${saved > 0 ? '↓' : ' '} ${rel}  ${fmt(origSize)} → ${fmt(buf.length)}  (-${fmt(saved)})`)
        if (WRITE) {
          const backupPath = path.join(BACKUP_DIR, rel)
          await mkdir(path.dirname(backupPath), { recursive: true })
          if (!existsSync(backupPath)) await copyFile(file, backupPath) // back up original once
          const tmp = `${file}.tmp`
          await sharp(buf).toFile(tmp) // write via temp then atomic rename
          await rename(tmp, file)
        }
      } else {
        skipped++ // re-encode wasn't smaller; leave the original untouched
      }
    } catch (err) {
      failed++
      console.warn(`  ! failed ${rel}: ${err.message}`)
    }
  }

  const pct = before ? Math.round((1 - after / before) * 100) : 0
  console.log(`\n─────────────────────────────────────────`)
  console.log(`scanned ${scanned} · would-shrink ${touched} · skipped ${skipped} · failed ${failed}`)
  console.log(`bundle of touched files: ${fmt(before)} → ${fmt(after)}  (−${pct}%)`)
  if (!WRITE) console.log(`\nDry run only — nothing written. Re-run with --write to apply.`)
  else console.log(`\nOriginals backed up under public/.images-originals/ (gitignored).`)
  console.log('')
}

main()
