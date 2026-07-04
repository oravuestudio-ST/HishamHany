# Cinematic Motion Redesign — Design Document

**Date:** 2026-07-04
**Status:** Validated with Hisham section-by-section
**Inspiration:** thefutureinblack.com — motion language and pacing only, zero visual copying
**Scope:** Rebuild the motion vocabulary. Layout, content, and component structure stay. Every timing, easing, reveal, and choreography value is redesigned.

---

## Design intent

The site should feel like an interactive editorial experience — cinematic, slow, tactile, museum-quality. The validated aesthetic in one line: **quiet entrances, deep space, tactile objects.** Sections arrive softly rather than theatrically; the page has pronounced layered depth; the 3D pieces stay responsive to the cursor. Restraint in the reveals, richness in the depth.

Pacing target: **editorial-cinematic.** Unmistakably slow and intentional, but an art director can still scan 18 case studies without frustration. The Row, not runway.

Effects policy: glitch grid, gear decorations, and anything tech-startup is removed. The Mercedes/VW 3D showcases and the About camera stay interactive at current sensitivity, re-eased onto the new curves. Marquee and count-up get restrained editorial replacements.

---

## 1. Timing system (tokens v2)

A derived scale replaces the flat duration list. One master unit; everything computed from it.

- **Base unit: 1.1s.** Scale: `micro 0.35 · swift 0.7 · reveal 1.1 · cinematic 1.6 · hero 2.2` (base × 0.32 / 0.64 / 1 / 1.45 / 2).
- **Three easing curves:**
  - `settle` — cubic-bezier(0.16, 1, 0.3, 1) — entrances and reveals
  - `drift` — cubic-bezier(0.33, 0, 0.2, 1) — parallax and scrub-adjacent motion
  - `touch` — cubic-bezier(0.3, 0.9, 0.3, 1) — hovers and presses
- **Stagger:** 0.12s between text lines, 0.09s between masked images.
- **Lenis:** lerp ~0.075 (heavier than default ~0.1), tuned to never lag trackpad input.
- **Reveal distance: 40px** (down from 60). Less travel, longer time — the core inversion of "less movement, more intention."
- The `MOTION` export keeps its shape; values change, contracts don't. All ten hooks and every component keep compiling.

## 2. Scroll choreography

Five named reveal presets, assigned per section — never improvised per component:

1. **`curtain`** — vertical clip-path mask, image at 1.06 overscale settling to 1.0
2. **`lines`** — text split to lines, masked, rising 40px, 0.12s stagger
3. **`breathe`** — opacity + 12px drift, no mask
4. **`threshold`** — 1px divider expands from center, content fades beneath it
5. **`stack`** — cards with alternating 30/40px offsets, independent image zooms

**Assignment policy (validated): calmer overall.** `breathe` is the default for most sections; `curtain` and `lines` are reserved for the hero and case-study covers. `threshold` appears sparingly as section punctuation. No two adjacent sections share a preset.

**Parallax: 60px cap** (top of spec). Two depths — backgrounds -60px, foreground imagery -30px — both scrub-linked on `drift`. Never eased parallax; easing on scroll-linked motion reads as swimmy.

**3D pieces:** keep today's mousemove responsiveness and intensity; re-ease onto the new curves so they feel native to the system. Each sits inside a reveal so it is discovered, not demonstrated.

## 3. Loader, hero, page transitions

**Loader.** Two beats, ≤1.6s, first visit per session only. Wordmark fades in letter-spaced wide and tracks inward to final spacing; the loader surface splits as a horizontal mask directly into the hero, which is already visible behind it — continuous reveal, no scene cut. No spinner; if loading genuinely lags, a 1px line under the wordmark fills silently.

**Hero (validated: classic order, ~2.6s total).** Nav first, then content: nav (0s) → background surface → hero image `curtain` (2.2s dur) → headline `lines`, staggered → subhead `breathe` → CTA row rising 20px last. Beat offsets live in `MOTION.load`.

**Page transitions (validated: mask wipe).** A dark surface sweeps vertically over the outgoing page, holds a beat, lifts off the incoming one — a consistent "shutter" identity fitting a photographer. Incoming hero element starts its `curtain` immediately; remaining content staggers behind it. No white flash ever.

**Dropped:** the FLIP cover-image morph into case-study headers. Case studies open with the standard wipe + curtain on the header image.

## 4. Cursor, hover, navigation

**Cursor (validated: 3 states).** `default` 8px dot → `hover` 32px hollow ring → `image` 56px with "View" label. Spring-interpolated via `gsap.quickTo` (~0.4s soft spring); size, border, and label opacity all interpolate — never snap. Hidden on touch and under reduced motion.

**Hover language (validated: no lift, zoom only).** One rule: the surface responds, the content resists. Cards stay planted — image zooms 1.04 and shadow deepens; nothing translates. Buttons: background interpolates on `touch`, compress to 0.985 on press, release with `settle`. Links underline via background-size draw, in left-to-right, exiting right.

**Magnetic (validated: stronger, CTA-only).** Primary CTAs only, cap raised to ~12px so the pull is genuinely felt. Nowhere else.

**Navigation.** Scrub-linked compression over a 120px scroll window past 80px — height eases down, logo scales to ~0.85, backdrop blur + hairline bottom border fade in. Active link keeps a persistent underline. No toggle "pop."

## 5. Architecture

New `animations/` directory as the single home:

- `animations/tokens.ts` — v2 derived scale, re-exported through `lib/motion.ts` (existing imports untouched)
- `animations/presets.ts` — five reveal presets as data; one `useReveal(preset)` hook replaces duplicated ScrollTrigger wiring
- `animations/transitions.ts` — mask-wipe controller
- `animations/cursor.ts` — 3-state machine

Existing hooks (`useParallax`, `useMagnetic`, `usePinnedSection`, …) stay, reading exclusively from tokens.

## 6. Performance & accessibility

- Animate only `transform`, `opacity`, `clip-path`. No layout properties, no animated `filter`.
- ScrollTriggers kill on unmount; off-viewport tweens pause.
- Cursor via `gsap.quickTo` — zero React re-renders per mousemove.
- Target 60fps mid-tier laptop, verified with existing Playwright perf project.
- `prefers-reduced-motion`: every preset collapses to a 0.3s opacity fade; wipe becomes crossfade; cursor and magnetic disable. Content never fails to appear.
- Mobile: reduce distances and durations, don't remove animations.

## 7. Build order (validated: hero first, lighter testing)

Each phase is previewed on localhost and waits for Hisham's OK before commit/push (standing rule).

1. **Hero + loader** — the new identity is visible immediately (re-touched once tokens land)
2. **Tokens v2 + Lenis re-tune** — whole site re-paced from one place
3. **Reveal presets + homepage choreography**
4. **Mask-wipe transitions + cursor + hover language + nav shrink**
5. **3D re-easing + case-study/interior pages sweep + effect removals (glitch, gears)**
6. **QA: reduced-motion, mobile timing, perf pass — new tests added here**

**Testing policy:** keep the 114 existing tests green throughout; localhost preview is the quality gate during build; preset unit tests and any visual coverage land in phase 6, not per-phase.
