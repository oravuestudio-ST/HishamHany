# Hero Stacked Seams — Design

**Date:** 2026-07-12
**Status:** Approved (brainstorm session)
**Origin:** /demo/hero-scroll-animation prototype (2026-07-12, framer-motion)

## Goal

Give the top of the homepage a signature scroll-driven "stacked cards"
moment: as the visitor scrolls, the hero pins and recedes — scaling down,
rotating slightly, dimming — while the clients marquee scrolls over it, then
the marquee does the same beneath the sticky gallery. Inside the hero, three
layers move at different parallax rates so the recession reads as real depth.

The rest of the page stays calm. Two seams only: Hero → ClientsMarquee and
ClientsMarquee → StickyGallery.

## Decisions (from brainstorm)

1. **Scope:** homepage hero, not site-wide, not case studies.
2. **Mechanic:** productionize the demo's stacked scale+rotate transition —
   no WebGL shader, no GLB model in the hero.
3. **Integration:** extract the mechanic, not the demo's content. The demo's
   statement / grid / giant-name sections duplicate Statement, FeaturedWork,
   and Footer — they are not imported.
4. **Depth:** first two seams, then normal flow.
5. **Parallax:** inside the stacked sections, three depths, existing
   `useParallax` hook.

## Architecture

- **GSAP ScrollTrigger, not framer-motion.** The site's scroll runs through
  Lenis + ScrollTrigger; a second scroll-driven library fighting over the
  same position causes jitter. The demo's framer-motion dependency is
  removed with the demo route.
- **Tokens.** New `STACK` block in `animations/tokens.ts`, surfaced as
  `MOTION.stack` via `lib/motion.ts`:
  - `scale: 0.85` (outgoing card end scale)
  - `rotate: -4` (degrees, outgoing card end rotation)
  - `dim: 0.7` (end brightness of receding card)
  - parallax depths reuse `MOTION.parallax` clamps: headline −40,
    portrait −80, background −120 px.
- **Outgoing-only transforms.** Only the receding section scales/rotates;
  the incoming section arrives untransformed. This deviates from the demo
  deliberately: StickyGallery relies on internal `position: sticky` and must
  never sit inside a transformed wrapper (a constraint this codebase has
  already fought once).

## Components

- **`hooks/useStackedSeam.ts`** — new hook, house pattern of
  `useParallax`/`usePinnedSection`. **Pinless** (amended during
  implementation): the hero is already pinned by `useSlotReveal`, so the seam
  scrubs the section's *exit* instead — as its bottom travels viewport
  bottom → top, the target scales/tips/dims and lingers downward (`yPercent`)
  so the next section slides over it. Options: `trigger`/`target` refs,
  `layers` (differential yPercent), `rotate` (off for the thin marquee
  strip). Gated by `prefersReducedMotion()`; registers via `registerMotion()`;
  travel scaled by `viewportScale()`.
- **`components/home/HomeClient.tsx`** — Hero, ClientsMarquee, and
  StickyGallery wrapped in z-layered divs (hero z-0 < marquee z-10 < gallery
  z-20); the incoming wrappers get opaque `var(--bg)` so the card edge reads
  in both themes. Wrappers carry no refs and no transforms; the sections
  apply the hook internally. StickyGallery untouched.
- **`components/Hero.tsx`** — seam layers amended: by seam time the copy has
  already lifted out (`textLift`), so the internal parallax rides the photo
  (`bgRef`, lags deeper) and glow orb (`overlayRef`, leads) rather than
  headline/portrait. No new DOM; stage gets `data-stacked-seam="hero"`.
- **Retired:** `app/demo/hero-scroll-animation/`,
  `components/ui/hero-scroll-animation.tsx`,
  `components/ui/hero-scroll-animation-demo.tsx`, `framer-motion` from
  package.json (grep confirms only demo files import `motion/react`).

## Edge cases & performance

- **Loader interplay:** ScrollTrigger positions are measured at mount, under
  the loader. Hook refreshes ScrollTrigger when `entered` (MotionProvider)
  flips true so seams don't sit at stale offsets.
- **Compositing:** transform + `filter: brightness` only — no layout
  properties, no CLS regression. Grain/marquee `translate3d` layers
  untouched.
- **Mobile:** shallower travel via `viewportScale()`; hero touch autoplay
  (scroll-relative since e54da0e) composes with the pin.
- **Z-order:** stack layers only among Hero < Marquee < Gallery, all beneath
  Navigation / ScrollProgress / Cursor. Theme circle-wipe (View Transitions)
  snapshots the viewport and is indifferent.
- **Reduced motion:** no pin, no transforms — normal document flow.

## Testing

- **Vitest:** STACK token shape; hook registers nothing under reduced
  motion.
- **Playwright:** scroll to each seam, assert outgoing section's computed
  transform contains expected scale; reduced-motion variant via
  `contextOptions.reducedMotion`; WebKit keyboard tests keep the Alt+Tab
  branch.
- **Isolation:** e2e must not reuse the dev server on :3000 — run against an
  isolated copy (known repo trap).
- **Final check:** real-GPU browser pane, not headless (software WebGL
  inflates timings).
