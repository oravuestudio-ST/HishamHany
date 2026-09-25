import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const resolveConfig = require('tailwindcss/resolveConfig')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tailwindConfig = require('../../tailwind.config.js')

/**
 * Design-token contract. Tailwind drops class values that are not on its
 * scale without a warning (border-fg/8, bg-bg/97 and duration-400 all
 * compiled to nothing), so these checks scan the source the way the compiler
 * would and fail loudly instead.
 */
const ROOT = join(__dirname, '../..')
const theme = resolveConfig(tailwindConfig).theme

function sourceFiles(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = []
  for (const dir of ['app', 'components', 'hooks', 'lib', 'animations']) {
    for (const entry of readdirSync(join(ROOT, dir), { recursive: true }) as string[]) {
      if (!/\.(tsx?|jsx?)$/.test(entry)) continue
      const file = join(ROOT, dir, entry)
      out.push({ file: relative(ROOT, file), text: readFileSync(file, 'utf8') })
    }
  }
  return out
}

// A class token boundary: start of string or whitespace/quote/backtick/brace.
const B = String.raw`(?<=^|[\s"'\`{])`
const E = String.raw`(?=$|[\s"'\`}])`

function findAll(pattern: RegExp) {
  const hits: string[] = []
  for (const { file, text } of sourceFiles()) {
    for (const m of Array.from(text.matchAll(pattern))) hits.push(`${file}: ${m[0]}`)
  }
  return hits
}

const COLOR_UTILS = 'bg|text|border|border-[trblxy]|divide|ring|outline|fill|stroke|from|via|to|decoration|placeholder|caret'

describe('Tailwind scale conformance', () => {
  it('uses only opacity modifiers that exist on the theme scale', () => {
    const allowed = new Set(Object.keys(theme.opacity))
    const pattern = new RegExp(`${B}(?:[a-z-]+:)*(?:${COLOR_UTILS})-[a-z]+(?:-[a-z]+)*\\/(\\d+)${E}`, 'g')
    const offenders = findAll(pattern).filter((hit) => !allowed.has(hit.match(/\/(\d+)$/)![1]))
    expect(offenders).toEqual([])
  })

  it('uses only transition durations that exist on the theme scale', () => {
    const allowed = new Set(Object.keys(theme.transitionDuration))
    const pattern = new RegExp(`${B}(?:[a-z-]+:)*duration-([a-z0-9]+)${E}`, 'g')
    const offenders = findAll(pattern).filter((hit) => !allowed.has(hit.match(/duration-([a-z0-9]+)$/)![1]))
    expect(offenders).toEqual([])
  })
})

describe('hairline tokens', () => {
  it('exposes border-line and border-line-strong', () => {
    expect(theme.colors.line).toBeDefined()
    expect(theme.colors['line-strong']).toBeDefined()
  })

  it('draws dividers with the hairline tokens, not ad hoc fg opacities', () => {
    const pattern = new RegExp(`${B}(?:[a-z-]+:)*(?:border|divide)(?:-[trblxy])?-(?:fg|bone)\\/(?:8|10|25)${E}`, 'g')
    expect(findAll(pattern)).toEqual([])
  })
})

describe('text emphasis floor', () => {
  // Minimum opacity per colour family that keeps supporting text at the WCAG
  // AA-large 3:1 floor in the weaker theme (see tests/unit/contrast.test.ts
  // for the channel values these were computed from).
  const FLOOR: Record<string, number> = { muted: 70, silver: 70, fg: 50, bone: 50, paper: 40 }

  it('never dims text below its legibility floor', () => {
    const pattern = new RegExp(`${B}(?:[a-z-]+:)*text-(muted|silver|fg|bone|paper)\\/(\\d+)${E}`, 'g')
    const offenders = findAll(pattern).filter((hit) => {
      const [, family, alpha] = hit.match(/text-(muted|silver|fg|bone|paper)\/(\d+)$/)!
      return Number(alpha) < FLOOR[family]
    })
    expect(offenders).toEqual([])
  })
})

describe('z-index scale', () => {
  const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')
  const z = (name: string) => {
    const m = css.match(new RegExp(`--z-${name}:\\s*(\\d+)`))
    expect(m, `--z-${name} missing from globals.css`).not.toBeNull()
    return Number(m![1])
  }

  it('defines one ordered scale in globals.css', () => {
    expect(z('header')).toBeGreaterThan(z('menu'))
    expect(z('progress')).toBeGreaterThan(z('header'))
    expect(z('wipe')).toBeGreaterThan(z('popover'))
    // The native cursor is hidden sitewide, so the custom one must never sit
    // beneath an open lightbox.
    expect(z('cursor')).toBeGreaterThan(z('modal'))
    expect(z('loader')).toBeGreaterThan(z('cursor'))
    expect(z('skip')).toBeGreaterThan(z('grain'))
  })

  it('leaves no hand-picked overlay z-index literals in components', () => {
    const literals = findAll(/z-\[\d{3,}\]|z-index:\s?\d{3,}/g)
    expect(literals).toEqual([])
  })
})

describe('named component classes', () => {
  const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')
  const componentsLayer = css.match(/@layer components\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

  it('keeps .magnetic-btn in @layer components so display utilities still win', () => {
    expect(componentsLayer).toContain('.magnetic-btn')
  })

  it('defines .eyebrow, .btn-cta and .btn-cta--lg in @layer components', () => {
    for (const cls of ['.eyebrow', '.btn-cta', '.btn-cta--lg']) expect(componentsLayer).toContain(cls)
  })

  it('uses .eyebrow instead of repeating the label recipe inline', () => {
    expect(findAll(/font-sans text-label-xs uppercase text-muted/g)).toEqual([])
  })
})

describe('admin button', () => {
  it('defines .admin-btn next to .input in admin.css and uses it instead of the inline recipe', () => {
    const adminCss = readFileSync(join(ROOT, 'app/admin/admin.css'), 'utf8')
    expect(adminCss).toMatch(/\.admin-root \.admin-btn\s*\{/)
    expect(findAll(/rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700/g)).toEqual([])
  })
})
