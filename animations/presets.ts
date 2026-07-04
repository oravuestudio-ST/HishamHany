/**
 * Reveal presets — the site's entrance vocabulary, as data. Five named ways a
 * section may enter; assignment happens per section (never improvised
 * per component) via useReveal(preset). Design contract:
 * docs/plans/2026-07-04-cinematic-motion-redesign-design.md §2.
 *
 * Homepage policy is "calmer overall": `breathe` is the default; `curtain`
 * and `lines` are reserved for the hero and case-study covers; `threshold`
 * appears sparingly as punctuation. No two adjacent sections share a preset.
 */

import { DUR, STAGGER } from './tokens'

export type RevealPreset = 'breathe' | 'threshold' | 'curtain' | 'lines' | 'stack'

export const PRESETS = {
  /** Pure opacity + a 12px drift — the quiet default. */
  breathe: {
    distance: 12,
    dur: DUR.reveal,
  },
  /**
   * A 1px rule expands from center to full width, then content fades in
   * beneath it. Section punctuation; doubles as the entrance itself.
   */
  threshold: {
    lineDur: DUR.cinematic,
    /** Content starts this far into the line's expansion, seconds. */
    contentAt: 0.45,
    distance: 12,
    dur: DUR.reveal,
  },
  /** Vertical clip-path mask; the image settles from 1.06 overscale to 1. */
  curtain: {
    dur: DUR.cinematic,
    overscale: 1.06,
    clipFrom: 'inset(100% 0% 0% 0%)',
    clipTo: 'inset(0% 0% 0% 0%)',
  },
  /** Masked text lines rising — headlines only. */
  lines: {
    dur: DUR.cinematic,
    stagger: STAGGER.lines,
    fromPercent: 115,
  },
  /** Cards entering with alternating offsets. */
  stack: {
    dur: DUR.reveal,
    stagger: STAGGER.lines,
    offsets: [30, 40] as const,
  },
} as const
