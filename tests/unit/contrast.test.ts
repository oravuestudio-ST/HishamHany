import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Formalizes the "atelier" palette's contrast audit (roadmap item 9). The
// e2e a11y suite deliberately excludes axe's color-contrast rule — it would
// fail on legitimately low-contrast decorative micro-text — so the real
// content pairs (body text, links) are asserted here instead, against the
// exact channel values in app/globals.css's :root and [data-theme="dark"].
type RGB = readonly [number, number, number]

const PAPER: RGB = [236, 231, 220] // --paper-rgb
const INK: RGB = [22, 20, 15] // --ink-rgb
const ACCENT_LIGHT: RGB = [36, 33, 201] // --accent-rgb (light)
const ACCENT_DARK: RGB = [122, 119, 255] // --accent-rgb ([data-theme="dark"])
const MUTED_LIGHT: RGB = [96, 88, 76] // --muted-rgb (light)
const MUTED_DARK: RGB = [170, 164, 152] // --muted-rgb (dark)
const DANGER_LIGHT: RGB = [150, 40, 36] // --danger-rgb (light) — muted oxblood
const DANGER_DARK: RGB = [226, 120, 106] // --danger-rgb ([data-theme="dark"])

function relativeLuminance([r, g, b]: RGB): number {
  const chan = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}

/** WCAG 2.x contrast ratio, 1–21. */
function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (lighter + 0.05) / (darker + 0.05)
}

const AA_TEXT = 4.5
// Muted/supporting text (captions, nav labels) is intentionally dimmer than
// body copy — 3:1 is the WCAG AA-large floor, not full body-text AA, which
// matches how it's actually used (small caps, but never the primary reading line).
const AA_SUPPORTING = 3.0

describe('atelier palette — contrast audit', () => {
  it('light theme: body text (ink) on paper meets AA', () => {
    expect(contrastRatio(INK, PAPER)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('dark theme: body text (paper) on ink meets AA', () => {
    expect(contrastRatio(PAPER, INK)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('light theme: accent (ultramarine) on paper meets AA', () => {
    expect(contrastRatio(ACCENT_LIGHT, PAPER)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('dark theme: accent (lifted ultramarine) on ink meets AA', () => {
    expect(contrastRatio(ACCENT_DARK, INK)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('light theme: muted supporting text on paper clears the AA-large floor', () => {
    expect(contrastRatio(MUTED_LIGHT, PAPER)).toBeGreaterThanOrEqual(AA_SUPPORTING)
  })

  it('dark theme: muted supporting text on ink clears the AA-large floor', () => {
    expect(contrastRatio(MUTED_DARK, INK)).toBeGreaterThanOrEqual(AA_SUPPORTING)
  })

  // Errors get their own role: the accent already means link, hover and CTA,
  // so an error in ultramarine reads as emphasis rather than a problem.
  it('light theme: danger (error text) on paper meets AA', () => {
    expect(contrastRatio(DANGER_LIGHT, PAPER)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('dark theme: danger (error text) on ink meets AA', () => {
    expect(contrastRatio(DANGER_DARK, INK)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  // WCAG 1.4.11: a form field's boundary is the only thing that shows where
  // to type, so it needs 3:1 against the ground (the decorative dividers
  // don't). The line-control token is fg at 50%.
  it('form-field underline (fg at 50%) clears 3:1 non-text contrast in both themes', () => {
    const mix = (fg: RGB, bg: RGB, a: number): RGB =>
      [0, 1, 2].map((i) => Math.round(a * fg[i] + (1 - a) * bg[i])) as unknown as RGB
    expect(contrastRatio(mix(INK, PAPER, 0.5), PAPER)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(mix(PAPER, INK, 0.5), INK)).toBeGreaterThanOrEqual(3)
  })

  it('globals.css declares the danger channels asserted here, in both themes', () => {
    const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8')
    const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    const dark = css.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(root).toMatch(/--danger-rgb:\s*150 40 36/)
    expect(dark).toMatch(/--danger-rgb:\s*226 120 106/)
  })
})
