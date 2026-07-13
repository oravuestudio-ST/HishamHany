# Web-Design Modernization Roadmap — v1

For the Hisham Hany portfolio (Next.js 14 · TypeScript · Tailwind v3 · Three.js / GSAP / Lenis · Drizzle/Neon).
Written June 2026. Recommendations only — nothing here has been applied to the codebase.

## Status after the 2026-07 award-repolish

Landed as part of the six-phase repolish (`docs/plans/2026-07-12-award-pattern-brief.md`):

- **Item 4 (View Transitions for case-study nav) — done.** `lib/view-transitions.ts` is the
  single dispatcher: the archive grid and home feed morph a thumbnail into its case cover
  (Aperture-inspired shared-element reveal); every other navigation keeps the ink shutter.
  Falls back to the shutter automatically wherever `startViewTransition` is unsupported or
  motion is reduced.
- **Item 9 (contrast audit formalized) — done.** `tests/unit/contrast.test.ts` asserts WCAG AA
  against the actual `--paper`/`--ink`/`--accent` channel values in both themes, plus an
  AA-large floor for muted supporting text — without axe's blanket `color-contrast` rule,
  which would false-positive on legitimately decorative micro-text (see the comment in
  `tests/e2e/a11y.spec.ts`).

Still open, explicitly deferred out of this repolish (see the plan's "Deferred" section):
items 5 (Tailwind v4), 6 (shared WebGL canvas), 2 (CSS scroll-driven animations — would fork
the motion system into two runtimes mid-repolish), and 8 (PWA). Item 1 (unused deps) and item 3
(container queries) were not touched either — still open below.

## How to read this

Each item states what it is, why it matters for a luxury editorial photography brand, the effort, the risk, and where it sits in the sequence. Effort is **S** (a day or less), **M** (a few days), **L** (a week-plus with care). Nothing here is cosmetic for its own sake — the brand sells restraint and precision, so every change is judged against whether it makes the work look better, load faster, or read cleaner on the devices clients actually use.

The site is already in good shape: reduced-motion is respected everywhere, fonts load without layout shift, heavy WebGL is dynamically imported and budgeted, and SEO/structured data is in place. This roadmap is about the next tier, not fixing debt.

---

## Tier 1 — Do first (high payoff, contained risk)

### 1. Remove unused dependencies
**What:** `framer-motion` and `split-type` are installed but imported nowhere; all animation runs on GSAP. Drop both from `package.json`.
**Why:** Smaller install, faster CI, and an honest dependency list. A studio brand should ship nothing it doesn't use.
**Effort:** S · **Risk:** Very low (grep-confirmed unused). · **Sequence:** Immediately — it's pure subtraction.

### 2. CSS scroll-driven animations for simple reveals
**What:** Replace the straightforward "fade/slide in on scroll" GSAP ScrollTrigger calls with native CSS `animation-timeline: view()`. Keep GSAP for the genuinely choreographed pieces (the loader, the menu stagger, the WebGL hover work).
**Why:** Moves the most common animation off the main thread and out of the JS bundle. Scroll reveals stay buttery on mid-range phones, which is where a lot of Instagram traffic lands. The editorial look depends on these reveals feeling effortless — native timelines are smoother than rAF-driven ones.
**Effort:** M · **Risk:** Low-medium. Use an `@supports (animation-timeline: view())` guard with the existing GSAP path as the fallback so older Safari still reveals content. · **Sequence:** After the dependency cleanup; it's the highest design-quality-per-effort change.

### 3. Container queries for component-level responsiveness
**What:** Adopt container queries (`@container`) for self-contained components — portfolio cards, testimonial cards, the services grid — instead of leaning entirely on viewport breakpoints.
**Why:** A card should lay itself out based on the space it's given, not the size of the window. This makes the portfolio grid hold its proportions whether it's full-width on desktop or in a narrower column, and it removes a class of "looks right at 1024 but cramped at 900" bugs. Comes essentially for free with the Tailwind v4 upgrade (item 5) via the `@container` utilities.
**Effort:** S-M · **Risk:** Low. · **Sequence:** Pairs naturally with the Tailwind v4 move; can also be done standalone via the v3 container-queries plugin.

---

## Tier 2 — Plan deliberately (larger, still worth it)

### 4. View Transitions API for journal & case-study navigation
**What:** Use the View Transitions API so moving between the work grid and a case study, or between journal posts, morphs rather than hard-cuts. Next.js App Router supports this; the hero image of a project can transition into the case-study header.
**Why:** This is the single most "premium" interaction upgrade available right now. A shared-element transition from a thumbnail into a full case study reads as gallery-grade polish and reinforces the portfolio's narrative flow. It's progressive — browsers without support simply navigate normally, so there's no downside floor.
**Effort:** M · **Risk:** Medium — needs careful naming of transition elements and testing on Safari, which trails on cross-document transitions. · **Sequence:** After Tier 1, once the reveal animations are settled so the two animation systems don't fight.

### 5. Tailwind v3 → v4
**What:** Upgrade to Tailwind v4: CSS-first configuration, native CSS variables for the theme tokens, built-in container queries, and a much faster build.
**Why:** The theme is already token-driven (teal/bone/silver/olive/ebony/ember, custom easings, letter-spacing), so v4's CSS-variable model fits it well and makes those tokens usable directly in raw CSS and JS without duplication. Faster builds shorten the deploy loop. It also unlocks items 3 and parts of 2 cleanly.
**Effort:** L · **Risk:** Medium — PostCSS pipeline and plugin changes, and the shadcn/ui components in `components/ui` need a config pass. Do it on a branch with the new visual-regression baselines (see the test suite) as the safety net. · **Sequence:** Tier 2, but schedule it as its own focused piece of work, not bundled with feature changes.

### 6. Shared WebGL canvas / context pooling
**What:** Today each WebGL component (Aperture, CameraLens, FloatingGem, GlassCrystal, NoisePlane, Typo3D, WebGLImage, …) spins up its own Three.js renderer, capped globally at 8 contexts via `lib/webgl-budget.ts`. Move toward one shared canvas / renderer with pooled contexts — `@react-three/fiber` is the obvious candidate, or a hand-rolled single-renderer manager.
**Why:** On a long page with many cards in view, multiple live contexts are the main VRAM and battery cost, and the 8-context cap is a symptom of that pressure. A shared canvas removes the cap entirely and lets every portfolio image carry its displacement effect on capable devices without the budget ever exhausting. This is the highest-impact performance change for the signature hover effect.
**Effort:** L · **Risk:** Medium-high — it's an architectural change to the most distinctive part of the site. Keep the static `<img>` fallback path intact throughout. · **Sequence:** Last of the substantial items; do it only once visual-regression and perf budgets are trusted.

---

## Tier 3 — Opportunistic

### 7. Mobile WebGL tiering
**What:** Beyond the current `prefers-reduced-motion` gate, tier the WebGL experience by device capability — reduce geometry detail or disable the heavier effects on low-power phones (using `navigator.hardwareConcurrency`, already partly used in `WebGLImage`, and `deviceMemory`).
**Why:** Protects frame rate and battery on exactly the devices where Instagram referrals view the work, without dulling the desktop showcase.
**Effort:** M · **Risk:** Low. · **Sequence:** Naturally folds into item 6.

### 8. PWA / offline caching
**What:** Add a service worker to cache fonts, the displacement texture, and recently viewed images for repeat visits.
**Why:** Returning visitors (clients revisiting a shared link) get near-instant loads. Modest effort, real perceived-speed gain.
**Effort:** M · **Risk:** Low-medium (cache-invalidation discipline). · **Sequence:** Any time after Tier 1.

### 9. Contrast & motion audit, formalized
**What:** Verify the bone-on-ebony and silver-on-ebony micro-text against WCAG AA, and fold the result into the automated a11y test that already runs in CI.
**Why:** The editorial palette uses a lot of low-opacity small text. Some of it is decorative, but the body and interactive text must clear AA. Making this a test rather than a one-off keeps it honest as the design evolves.
**Effort:** S · **Risk:** Low. · **Sequence:** Any time; cheap insurance.

---

## Suggested order

1. Remove unused deps (1)
2. CSS scroll-driven reveals (2) + container queries (3)
3. View Transitions for navigation (4)
4. Tailwind v4 (5)
5. Shared WebGL canvas (6) + mobile tiering (7)
6. PWA (8) and the contrast audit (9) slotted in opportunistically

Each step above is independently shippable and reversible, and the new test suite — unit, component, e2e, visual-regression, and performance budgets — is the net that lets these land without regressing the look or the speed of the site.
