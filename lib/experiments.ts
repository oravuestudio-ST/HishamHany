/**
 * A/B experiments — one source of truth for ids, cookies, events and the
 * maths used to read the results.
 *
 * Assignment happens in middleware.ts on the first request to `/`: the visitor
 * gets a sticky cookie `<variant>.<visitorId>` and variant B is served by an
 * internal rewrite to a static page, so both arms stay prerendered. Tracking is
 * a no-op for anyone without the cookie (bots that never reached `/`, visitors
 * who landed on another page first), so they never pollute the results.
 */

export const HERO_EXPERIMENT = {
  id: 'hero-cta-v1',
  cookie: 'hh_exp_hero',
  /** Internal path variant B is rewritten to. Never linked, never indexed. */
  variantPath: '/home-b',
  maxAgeDays: 30,
} as const

export const VARIANTS = ['a', 'b'] as const
export type Variant = (typeof VARIANTS)[number]

export const EXPERIMENT_EVENTS = [
  'exposure',
  'hero_cta_click',
  'scroll_past_hero',
  'contact_view',
  'inquiry_submit',
] as const
export type ExperimentEvent = (typeof EXPERIMENT_EVENTS)[number]

const VISITOR_ID = /^[a-z0-9]{12,32}$/

export interface Assignment {
  variant: Variant
  visitorId: string
}

/** 50/50 split. `rand` is injectable for tests. */
export function pickVariant(rand: () => number = Math.random): Variant {
  return rand() < 0.5 ? 'a' : 'b'
}

export function newVisitorId(): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20)
}

export function newAssignment(rand?: () => number): Assignment {
  return { variant: pickVariant(rand), visitorId: newVisitorId() }
}

export const serializeAssignment = (a: Assignment) => `${a.variant}.${a.visitorId}`

/** Parses a cookie value; anything malformed reads as "not assigned". */
export function parseAssignment(value: string | undefined | null): Assignment | null {
  if (!value) return null
  const [variant, visitorId, extra] = value.split('.')
  if (extra !== undefined) return null
  if (!(VARIANTS as readonly string[]).includes(variant)) return null
  if (!visitorId || !VISITOR_ID.test(visitorId)) return null
  return { variant: variant as Variant, visitorId }
}

export const isVisitorId = (v: unknown): v is string => typeof v === 'string' && VISITOR_ID.test(v)
export const isVariant = (v: unknown): v is Variant => (VARIANTS as readonly unknown[]).includes(v)
export const isExperimentEvent = (v: unknown): v is ExperimentEvent =>
  (EXPERIMENT_EVENTS as readonly unknown[]).includes(v)

// ── Reading the results ──────────────────────────────────────────────────────

export interface ProportionTest {
  rateA: number
  rateB: number
  /** Relative change of B over A (0.25 = +25%). null when A converts at 0. */
  lift: number | null
  z: number
  /** Two-sided p-value. */
  p: number
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26; error < 1.5e-7). */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2)
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(x * x) / 2)
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

/** Two-proportion z-test with a pooled standard error. */
export function twoProportionTest(nA: number, cA: number, nB: number, cB: number): ProportionTest {
  const rateA = nA > 0 ? cA / nA : 0
  const rateB = nB > 0 ? cB / nB : 0
  const lift = rateA > 0 ? (rateB - rateA) / rateA : null
  if (nA === 0 || nB === 0) return { rateA, rateB, lift, z: 0, p: 1 }
  const pooled = (cA + cB) / (nA + nB)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB))
  if (se === 0) return { rateA, rateB, lift, z: 0, p: 1 }
  const z = (rateB - rateA) / se
  const p = 2 * (1 - normalCdf(Math.abs(z)))
  return { rateA, rateB, lift, z, p }
}

/**
 * Visitors needed per arm to detect a relative lift `mde` on a baseline rate
 * (two-sided α = 0.05, power = 0.8).
 */
export function sampleSizePerArm(baseline: number, mde: number): number {
  const zAlpha = 1.959964
  const zBeta = 0.841621
  const p1 = baseline
  const p2 = baseline * (1 + mde)
  const pBar = (p1 + p2) / 2
  const num =
    zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
  return Math.ceil((num * num) / ((p2 - p1) * (p2 - p1)))
}

/** The minimum visitors per arm before the admin panel calls a result. */
export const MIN_SAMPLE_PER_ARM = 400
