# Hero Stacked Seams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scroll-driven "stacked cards" seams at the top of the homepage — the hero recedes (scale, rotate, dim, linger) as the clients marquee + lookbook block slides over it, and the marquee recedes beneath the sticky gallery — with internal parallax layers inside the receding hero.

**Architecture:** One new hook, `useStackedSeam`, built on GSAP ScrollTrigger (scrubbed, **no pin** — the hero is already pinned by `useSlotReveal`, so the seam animates the section's *exit*: as its bottom travels from viewport bottom to viewport top, the target scales down, rotates, dims, and translates down slightly so it lingers under the incoming section). Incoming sections are never transformed (protects StickyGallery's internal `position: sticky`); they get opaque theme backgrounds + z-index so they read as cards sliding over. All values live in a `STACK` token block.

**Tech Stack:** Next.js 14 / TypeScript / GSAP ScrollTrigger + Lenis / Vitest / Playwright. Design doc: `docs/plans/2026-07-12-hero-stacked-seams-design.md`.

## Global Constraints

- No hardcoded motion values — everything through `animations/tokens.ts` → `lib/motion.ts` (`MOTION.stack`).
- Reduced motion ⇒ no ScrollTrigger, no transforms (same `prefersReducedMotion()` gate as every hook).
- Transform/filter only — no layout properties (CLS budget).
- StickyGallery must never sit inside a transformed wrapper.
- Commit locally per task; **do not push** until the user approves the result on localhost (standing rule).
- Playwright e2e must NOT run while the dev server holds :3000 — the suite reuses whatever is on that port. Run e2e in an isolated copy or after stopping the dev server (Task 6).
- Prose comments in house style; comments state constraints, not narration.

---

### Task 1: STACK tokens

**Files:**
- Modify: `animations/tokens.ts` (append after `PARALLAX`, line ~118)
- Modify: `lib/motion.ts` (import/re-export + `MOTION.stack`)
- Test: `tests/unit/stack-tokens.test.ts` (create)

**Interfaces:**
- Produces: `STACK` const in `animations/tokens.ts`; `MOTION.stack` with keys `scale`, `rotate`, `dim`, `linger`, `scrub`, `layer.back`, `layer.glow`. Consumed by Task 2's hook and Task 3/4 components.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/stack-tokens.test.ts
import { describe, it, expect } from 'vitest'
import { STACK } from '@/animations/tokens'
import { MOTION } from '@/lib/motion'

// The stacked-seam contract: a receding card shrinks, tips, dims, and lingers.
// Values are design decisions — the test pins the *shape* and sane ranges so a
// typo (scale 8.5, positive rotate) fails fast, not the exact numbers.
describe('STACK tokens', () => {
  it('exposes the stacked-seam scale/rotate/dim/linger contract', () => {
    expect(STACK.scale).toBeGreaterThan(0.7)
    expect(STACK.scale).toBeLessThan(1)
    expect(STACK.rotate).toBeLessThan(0)
    expect(STACK.dim).toBeGreaterThan(0.4)
    expect(STACK.dim).toBeLessThan(1)
    expect(STACK.linger).toBeGreaterThan(0)
    expect(STACK.scrub).toBeGreaterThan(0)
  })

  it('hero-internal parallax layers separate: photo lags, glow leads', () => {
    expect(STACK.layer.back).toBeGreaterThan(0)
    expect(STACK.layer.glow).toBeLessThan(0)
  })

  it('is surfaced as MOTION.stack', () => {
    expect(MOTION.stack).toBe(STACK)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stack-tokens.test.ts`
Expected: FAIL — `'@/animations/tokens'` has no export `STACK`.

- [ ] **Step 3: Add the tokens**

In `animations/tokens.ts`, after the `PARALLAX` block:

```ts
/**
 * Stacked-seam recession — the homepage "card handoff". As a section's bottom
 * exits (viewport bottom → top), it scales, tips, dims, and lingers (yPercent
 * downward, so it lags the scroll and the next section appears to slide over
 * it). No pin: the hero is already pinned by the slot reveal, and a second pin
 * on the same element would fight it. Hook: useStackedSeam.
 *
 *   scale/rotate → end state of the receding card. Rotation is skipped for
 *                  thin strips (the marquee) — a tipping 170px band reads as
 *                  breakage, not depth.
 *   dim          → end brightness; sells "the card fell behind".
 *   linger       → yPercent the card travels down across the seam. This is
 *                  what creates the overlap the incoming card covers.
 *   layer        → hero-internal differential yPercent: the photo (back) lags
 *                  further, the glow orb leads — three scroll speeds = depth.
 *   scrub        → seconds of smoothing, matching the parallax feel.
 */
export const STACK = {
  scale: 0.85,
  rotate: -4,
  dim: 0.7,
  linger: 25,
  layer: { back: 10, glow: -8 },
  scrub: 1.2,
} as const
```

In `lib/motion.ts`:
1. Add `STACK` to the import from `'@/animations/tokens'` (line 13) and to the re-export line (line 16).
2. Inside `MOTION`, after the `pin` block:

```ts
  /** Stacked-seam recession (see STACK in tokens). Hook: useStackedSeam. */
  stack: STACK,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stack-tokens.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add animations/tokens.ts lib/motion.ts tests/unit/stack-tokens.test.ts
git commit -m "feat(motion): add STACK tokens for the stacked-seam recession"
```

---

### Task 2: useStackedSeam hook

**Files:**
- Create: `hooks/useStackedSeam.ts`
- Test: `tests/component/useStackedSeam.test.tsx` (create)

**Interfaces:**
- Consumes: `MOTION.stack`, `registerMotion`, `prefersReducedMotion`, `viewportScale` from `@/lib/motion` (Task 1).
- Produces: `useStackedSeam(options: StackedSeamOptions): void` where `StackedSeamOptions = { trigger: RefObject<HTMLElement | null>; target: RefObject<HTMLElement | null>; layers?: { ref: RefObject<HTMLElement | null>; y: number }[]; rotate?: boolean }`. Tasks 3–4 call it.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/component/useStackedSeam.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'

// Contract test in the scroll-hooks style: under reduced motion the hook must
// create nothing; otherwise it builds one scrubbed timeline over the trigger's
// exit and tweens the target toward the STACK end state.
const timelineTo = vi.fn().mockReturnThis()
const timeline = vi.fn(() => ({ to: timelineTo }))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    timeline: (...args: unknown[]) => timeline(...args),
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn() } }))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { get: vi.fn(), create: vi.fn() } }))

import { useStackedSeam } from '@/hooks/useStackedSeam'
import { STACK } from '@/animations/tokens'

function Probe({ rotate = true }: { rotate?: boolean }) {
  const trigger = useRef<HTMLDivElement>(null)
  const target = useRef<HTMLDivElement>(null)
  useStackedSeam({ trigger, target, rotate })
  return (
    <div ref={trigger}>
      <div ref={target}>card</div>
    </div>
  )
}

const setReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('useStackedSeam', () => {
  beforeEach(() => {
    timeline.mockClear()
    timelineTo.mockClear()
  })

  it('creates no timeline under reduced motion', () => {
    setReducedMotion(true)
    render(<Probe />)
    expect(timeline).not.toHaveBeenCalled()
  })

  it('scrubs the trigger exit and tweens the target to the STACK end state', () => {
    setReducedMotion(false)
    render(<Probe />)
    expect(timeline).toHaveBeenCalledTimes(1)
    const config = timeline.mock.calls[0][0] as {
      scrollTrigger: { start: string; end: string; scrub: number }
    }
    expect(config.scrollTrigger.start).toBe('bottom bottom')
    expect(config.scrollTrigger.end).toBe('bottom top')
    expect(config.scrollTrigger.scrub).toBe(STACK.scrub)

    const vars = timelineTo.mock.calls[0][1] as Record<string, unknown>
    expect(vars.scale).toBe(STACK.scale)
    expect(vars.rotation).toBe(STACK.rotate)
    expect(vars.filter).toBe(`brightness(${STACK.dim})`)
  })

  it('skips rotation when rotate is false (thin strips)', () => {
    setReducedMotion(false)
    render(<Probe rotate={false} />)
    const vars = timelineTo.mock.calls[0][1] as Record<string, unknown>
    expect(vars.rotation).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/component/useStackedSeam.test.tsx`
Expected: FAIL — cannot resolve `@/hooks/useStackedSeam`.

- [ ] **Step 3: Write the hook**

```ts
// hooks/useStackedSeam.ts
'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { MOTION, registerMotion, prefersReducedMotion, viewportScale } from '@/lib/motion'

interface SeamLayer {
  /** Layer inside the receding card. */
  ref: RefObject<HTMLElement | null>
  /** Differential yPercent across the seam — positive lags deeper, negative leads. */
  y: number
}

interface StackedSeamOptions {
  /** Section whose exit drives the seam (its bottom: viewport bottom → top). */
  trigger: RefObject<HTMLElement | null>
  /** Element that recedes. Kept separate from `trigger`: the hero's tall
      pin-spaced section is the geometry source, but the visible sticky stage
      is what transforms. */
  target: RefObject<HTMLElement | null>
  /** Internal parallax layers (hero photo, glow orb). Captured at mount. */
  layers?: SeamLayer[]
  /** Rotation reads as breakage on thin strips (marquee) — off there. */
  rotate?: boolean
}

/**
 * Stacked-seam recession: as the trigger section exits, the target scales,
 * tips, dims, and lingers downward so the next section slides over it like a
 * card. Deliberately pinless — the hero is already pinned by the slot reveal,
 * and the incoming section must stay untransformed (StickyGallery's internal
 * position: sticky dies inside transformed ancestors). All values MOTION.stack.
 */
export function useStackedSeam({ trigger, target, layers = [], rotate = true }: StackedSeamOptions) {
  useEffect(() => {
    const trig = trigger.current
    const el = target.current
    if (!trig || !el) return
    if (prefersReducedMotion()) return

    registerMotion()
    const S = MOTION.stack
    const { dist } = viewportScale()

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trig,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: S.scrub,
        },
      })
      tl.to(
        el,
        {
          scale: S.scale,
          rotation: rotate ? S.rotate : 0,
          yPercent: S.linger * dist,
          filter: `brightness(${S.dim})`,
          // Recede toward the upper third — the card tips away from the seam
          // edge rather than shrinking to its own center.
          transformOrigin: 'center 30%',
          ease: 'none',
        },
        0
      )
      for (const layer of layers) {
        if (layer.ref.current) {
          tl.to(layer.ref.current, { yPercent: layer.y * dist, ease: 'none' }, 0)
        }
      }
    }, trig)
    return () => ctx.revert()
    // `layers` is config, captured at mount like the other scroll hooks —
    // consumers pass literals and don't re-tune mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, target, rotate])
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/component/useStackedSeam.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add hooks/useStackedSeam.ts tests/component/useStackedSeam.test.tsx
git commit -m "feat(motion): useStackedSeam — pinless card recession on section exit"
```

---

### Task 3: Hero seam + internal parallax layers

**Files:**
- Modify: `components/Hero.tsx`
- Test: existing `tests/component/Hero.test.tsx` must stay green

**Interfaces:**
- Consumes: `useStackedSeam` (Task 2), `MOTION.stack` (Task 1).
- Produces: hero stage carries `data-stacked-seam="hero"` (Task 6's e2e hook).

- [ ] **Step 1: Wire the hook into Hero**

In `components/Hero.tsx`:

1. Add the import after the `useSlotReveal` import (line 18):

```ts
import { useStackedSeam } from '@/hooks/useStackedSeam'
```

2. After the `useSlotReveal(...)` call (line 53), add:

```ts
  // ── Stacked seam: after the slot reveal releases its pin and the hero exits,
  //    the stage recedes — scale/tip/dim/linger — while the marquee + lookbook
  //    block (opaque, higher z in HomeClient) slides over it. The copy has
  //    already lifted out by then (textLift), so only the visual layers matter:
  //    the photo lags deeper, the glow orb leads shallower.
  useStackedSeam({
    trigger: sectionRef,
    target: stageRef,
    layers: [
      { ref: bgRef, y: MOTION.stack.layer.back },
      { ref: overlayRef, y: MOTION.stack.layer.glow },
    ],
  })
```

3. On the stage div (line 191–195), add the e2e hook attribute:

```tsx
      <div
        ref={stageRef}
        data-stacked-seam="hero"
        className="relative w-full h-screen min-h-[700px] flex flex-col overflow-hidden bg-ebony"
        style={{ perspective: '1500px' }}
      >
```

- [ ] **Step 2: Run the component suite**

Run: `npx vitest run tests/component/Hero.test.tsx tests/component/useSlotReveal.test.tsx`
Expected: PASS — the hook no-ops in jsdom (reduced-motion mock) or degrades through `registerMotion`'s try/catch; no assertions change.

- [ ] **Step 3: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat(hero): recede beneath the marquee via the stacked seam"
```

---

### Task 4: Marquee seam + HomeClient card layering

**Files:**
- Modify: `components/ClientsMarquee.tsx`
- Modify: `components/home/HomeClient.tsx:107-112`
- Test: existing `tests/component/ClientsMarquee.test.tsx`, `tests/component/HomeClient.test.tsx` must stay green

**Interfaces:**
- Consumes: `useStackedSeam` (Task 2).
- Produces: marquee section carries `data-stacked-seam="marquee"`; HomeClient wraps marquee and gallery in opaque z-layered divs (no transforms on wrappers, ever).

- [ ] **Step 1: Wire the hook into ClientsMarquee**

In `components/ClientsMarquee.tsx`, replace the imports and component opening:

```tsx
'use client'

import { useRef } from 'react'
import { MOTION } from '@/lib/motion'
import { useStackedSeam } from '@/hooks/useStackedSeam'
```

(keep the `logos` array unchanged) and inside the component:

```tsx
export default function ClientsMarquee() {
  const track = [...logos, ...logos]

  // Stacked seam: the strip dims and shrinks slightly as the lookbook slides
  // over. No rotation — a tipping 170px band reads as breakage, not depth.
  const sectionRef = useRef<HTMLElement>(null)
  useStackedSeam({ trigger: sectionRef, target: sectionRef, rotate: false })

  return (
    <section
      ref={sectionRef}
      data-stacked-seam="marquee"
      style={{
        overflow: 'hidden',
        padding: '4px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
```

(rest of the component unchanged).

- [ ] **Step 2: Layer the cards in HomeClient**

In `components/home/HomeClient.tsx`, replace lines 107–111:

```tsx
              <div id="hero-section">
                <Hero />
              </div>
              <ClientsMarquee />
              <StickyGallery images={lookbook} />
```

with:

```tsx
              {/* Stacked seams: hero < marquee < gallery. The incoming blocks
                  are opaque (theme bg) and z-raised so the receding card
                  disappears beneath a clean edge — but never transformed:
                  StickyGallery's internal position: sticky dies inside a
                  transformed ancestor. */}
              <div id="hero-section" className="relative z-0">
                <Hero />
              </div>
              <div className="relative z-10" style={{ background: 'var(--bg)' }}>
                <ClientsMarquee />
              </div>
              <div className="relative z-20" style={{ background: 'var(--bg)' }}>
                <StickyGallery images={lookbook} />
              </div>
```

- [ ] **Step 3: Run the component suite**

Run: `npx vitest run tests/component/ClientsMarquee.test.tsx tests/component/HomeClient.test.tsx`
Expected: PASS. If a snapshot or DOM-shape assertion fails on the new wrappers, update the assertion to match the new structure — the sections themselves are unchanged.

- [ ] **Step 4: Commit**

```bash
git add components/ClientsMarquee.tsx components/home/HomeClient.tsx
git commit -m "feat(home): stacked-seam card layering — hero < marquee < gallery"
```

---

### Task 5: Retire the demo route and framer-motion

**Files:**
- Delete: `app/demo/hero-scroll-animation/page.tsx`, `components/ui/hero-scroll-animation.tsx`, `components/ui/hero-scroll-animation-demo.tsx`
- Modify: `package.json` (remove `framer-motion` / `motion`)

- [ ] **Step 1: Confirm nothing else imports the demo or the library**

Run: `grep -rn "motion/react\|framer-motion\|hero-scroll-animation" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`
Expected: hits only in the three files being deleted.

- [ ] **Step 2: Delete and uninstall**

```bash
rm -rf app/demo/hero-scroll-animation
rm components/ui/hero-scroll-animation.tsx components/ui/hero-scroll-animation-demo.tsx
npm uninstall motion framer-motion
```

(One of the two package names will be absent — `npm uninstall` tolerates that. Check `package.json` afterward to confirm neither remains.)

- [ ] **Step 3: Type-check and full unit suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean type-check; all vitest projects pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: retire hero-scroll-animation demo and framer-motion"
```

---

### Task 6: E2E seam coverage

**Files:**
- Create: `tests/e2e/stacked-seams.spec.ts`

**Interfaces:**
- Consumes: `data-stacked-seam="hero"` (Task 3) and `data-stacked-seam="marquee"` (Task 4).

- [ ] **Step 1: Write the spec**

```ts
// tests/e2e/stacked-seams.spec.ts
import { test, expect } from '@playwright/test'

// The hero recedes as it exits: past the slot reveal's pin (~120vh) plus the
// exit seam (~100vh), the stage must carry a scale < 1. The global config runs
// reducedMotion: 'reduce', where the seam must not exist — that case rides the
// default context.

async function loadHome(page) {
  await page.goto('/')
  await expect(page.locator('#contact')).toBeVisible({ timeout: 30_000 })
}

async function scrollPastHero(page) {
  // Wheel events so Lenis drives the scroll like a real user; well past the
  // reveal pin + exit seam.
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 800)
    await page.waitForTimeout(150)
  }
  // Let the scrub smoothing settle.
  await page.waitForTimeout(1200)
}

/** First cell of the computed transform matrix — scale·cos(rotation), <1 when receded. */
async function matrixA(locator) {
  return locator.evaluate((el: Element) => {
    const t = getComputedStyle(el).transform
    if (t === 'none') return 1
    return parseFloat(t.replace('matrix(', '').split(',')[0])
  })
}

test.describe('stacked seams', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('hero stage recedes beneath the marquee block', async ({ page }) => {
    await loadHome(page)
    const stage = page.locator('[data-stacked-seam="hero"]')
    await scrollPastHero(page)
    expect(await matrixA(stage)).toBeLessThan(0.95)
  })

  test('marquee dims and shrinks without rotating', async ({ page }) => {
    await loadHome(page)
    const strip = page.locator('[data-stacked-seam="marquee"]')
    await scrollPastHero(page)
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 800)
      await page.waitForTimeout(150)
    }
    await page.waitForTimeout(1200)
    const transform = await strip.evaluate((el: Element) => getComputedStyle(el).transform)
    // Shrunk (a < 1) but not rotated (b component ≈ 0).
    if (transform !== 'none') {
      const [a, b] = transform.replace('matrix(', '').split(',').map(parseFloat)
      expect(a).toBeLessThan(1)
      expect(Math.abs(b)).toBeLessThan(0.001)
    }
  })
})

test.describe('stacked seams — reduced motion', () => {
  // Default context: reducedMotion 'reduce'. The seam must not register.
  test('hero stage never transforms', async ({ page }) => {
    await loadHome(page)
    const stage = page.locator('[data-stacked-seam="hero"]')
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5))
    await page.waitForTimeout(800)
    expect(await matrixA(stage)).toBe(1)
  })
})
```

- [ ] **Step 2: Run e2e in isolation**

The dev server on :3000 must not be reused (it serves dev, and dev clobbers the prod `.next`). Either stop the preview server first, or copy the repo to the scratchpad and run there:

```bash
# from an isolated copy (preferred while the preview stays up for the user):
npx playwright test tests/e2e/stacked-seams.spec.ts --project=chromium
```

Expected: 3 passed. If the wheel-scroll distances undershoot on the CI viewport, raise the loop counts — the assertions are threshold-based, not exact.

- [ ] **Step 3: Run the neighboring suites that touch the same DOM**

Run: `npx playwright test tests/e2e/home.spec.ts tests/e2e/reduced-motion.spec.ts tests/e2e/hero-reveal-touch.spec.ts --project=chromium`
Expected: all pass — the seam changes nothing before the hero's exit range.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/stacked-seams.spec.ts
git commit -m "test(e2e): stacked-seam recession + reduced-motion guard"
```

---

### Task 7: Visual verification and user sign-off

**Files:** none (verification only)

- [ ] **Step 1: Verify on the real-GPU browser pane** (headless WebGL is software-rendered — not representative). Reload localhost:3000, scroll through both seams, screenshot the mid-seam state.

- [ ] **Step 2: Check both themes** — the card edge relies on `var(--bg)`; flip the theme toggle and re-scroll.

- [ ] **Step 3: Check mobile viewport** (375×812): travel scales via `viewportScale()`; confirm the hero's touch autoplay still composes with the seam.

- [ ] **Step 4: Console + server logs clean** — no ScrollTrigger warnings, no hydration errors.

- [ ] **Step 5: Present to the user on localhost and STOP.** Push to `main` (which deploys) only after their OK, per standing rule. Tuning requests (scale/rotate/dim feel) land in `STACK` only.

---

## Self-review notes

- Spec coverage: tokens (T1), hook (T2), hero + parallax layers (T3), marquee + layering (T4), retirement (T5), tests (T1/T2/T6), perf/reduced-motion constraints embedded in hook + e2e. Design-doc deviation (exit-recede instead of pin; layers = photo/glow instead of headline/portrait/background) is deliberate: the hero is already pinned, and the copy has lifted out before the seam runs. Design doc updated in Task 7 if the user wants the record amended.
- Type consistency: `StackedSeamOptions` names (`trigger`, `target`, `layers`, `rotate`) match across T2/T3/T4; `data-stacked-seam` values match T3/T4 → T6.
- No placeholders: every step has full code or an exact command.
