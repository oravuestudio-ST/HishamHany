# Shader Effects Design — Hisham Hany Portfolio

**Date:** 2026-05-29  
**Reference:** https://www.shader.se/  
**Aesthetic:** Option B — Translated (luxury editorial, ember/teal palette)  
**Approach:** Hybrid — CSS/GSAP for effects C + B, Three.js for effects A + D

---

## Overview

Add four shader.se-inspired visual effects to the existing Next.js 14 portfolio. The effects use the existing color system (`--ebony`, `--ember`, `--teal`) and integrate with the existing GSAP + Lenis + Framer Motion stack. No existing animations are removed.

---

## Effect Map

| Effect | Component | Implementation | Trigger |
|--------|-----------|---------------|---------|
| A — WebGL Atmosphere | `WebGLHero.tsx` (new) | Three.js + GLSL | On mount after loader |
| B — Shredder Transition | `ShredderTransition.tsx` (new) | GSAP clip-path | ScrollTrigger (×2) |
| C — Chromatic Aberration | `globals.css` (modified) | Pure CSS | Class swap on scroll entry |
| D — Image Distortion | `WebGLImage.tsx` (new) | Three.js + GLSL | pointerenter on card |

**Placement:**
- **Hero.tsx** — effects A + C
- **Portfolio.tsx** — effect D on 6 image cards; effect B fires on scroll exit
- **About.tsx, Services.tsx, Contact.tsx** — effect C on section headings
- **Loader, Navigation, Testimonials** — unchanged
- Shredder fires twice: Hero→Portfolio boundary and Portfolio→About boundary

---

## Files Changed

### New files

**`components/WebGLHero.tsx`**  
Three.js scene with a fullscreen `PlaneGeometry(2,2)` quad. Fragment shader uses 4-octave fbm (fractal Brownian motion) noise driven by a `uTime` uniform. Two radial colour zones: ember (`#BE4C00`) at ~20% left at 12% max opacity, teal (`#00495B`) at ~75% right at 9% max opacity. Base is `--ebony #0F0F10`. Canvas positioned `absolute inset-0` behind the existing Hero text layer. RAF loop starts on mount, cancels on unmount with `renderer.dispose()`.

**`components/WebGLImage.tsx`**  
Three.js plane textured with the project image + a shared 256×256 displacement PNG (`public/textures/displacement.png`). On `pointerenter`, GSAP tweens `uHover` uniform from 0→1 over 0.4s. `uMouse` updates on `pointermove` (card-normalised coords). On `pointerleave`, `uHover` tweens 0 over 0.6s. Fragment shader displaces UV coords by up to 3% based on displacement texture + mouse proximity. RAF only runs when `uHover > 0`. Displacement texture loaded once as a module-level singleton shared across all 6 card instances.

**`components/ShredderTransition.tsx`**  
Fixed overlay (`position:fixed; inset:0; z-index:50; pointer-events:none`) containing 8 child divs — each `width:12.5vw; height:100vh; background:--ebony`. Each strip starts at `clip-path: inset(0 0 100% 0)` (hidden). On ScrollTrigger fire: GSAP animates all strips to `inset(0 0 0% 0)` (cover) with 0.04s stagger and `power2.inOut` ease over 1.2s, then exits to `inset(100% 0 0% 0)` with `power3.in` over 0.8s. `once:true` — does not re-fire. Registers two ScrollTrigger instances: `trigger:"#hero-section" start:"bottom 80%"` and `trigger:"#portfolio-section" start:"bottom 80%"`. Uses the existing Lenis scroll proxy (`scroller: lenisRef.current.wrapper`).

### Modified files

**`app/globals.css`**  
Adds `.chroma` utility class:

```css
.chroma { position: relative; display: inline-block; }

.chroma::before,
.chroma::after {
  content: attr(data-text);
  position: absolute; inset: 0;
  pointer-events: none; user-select: none;
  mix-blend-mode: screen;
  transition: opacity 0.6s ease;
}
.chroma::before { color: rgba(190,76,0,0.30); left: -1px; top: -0.5px; }
.chroma::after  { color: rgba(0,73,91,0.24);  left:  1px; top:  0.5px; }

.chroma::before,
.chroma::after { opacity: 0; }
.chroma.chroma-active::before,
.chroma.chroma-active::after  { opacity: 1; }
```

Elements must carry `data-text` attribute with the same string as their text content. Hero headline gains `chroma-active` immediately after loader completes. Section headings gain it on ScrollTrigger scroll entry.

**`components/Hero.tsx`**  
Replace the static `<Image>` hero background with `<WebGLHero className="absolute inset-0" />`. The headline, scroll indicator, and mouse parallax layer are untouched.

**`components/Portfolio.tsx`**  
Replace each `<Image src={project.image} />` with `<WebGLImage src={project.image} alt={project.alt} className={...} />`. Wrapper divs, aspect ratios, and hover CSS on cards are unchanged.

**`app/page.tsx`**  
Add `id="hero-section"` to the Hero section wrapper and `id="portfolio-section"` to the Portfolio section wrapper. Mount `<ShredderTransition />` once at the page root (dynamically imported with `ssr:false`).

**`package.json`**  
Add: `three`, `@types/three`.

---

## Mount Sequence

1. Page mounts → Loader displays → dynamic imports resolve in background
2. Loader completes → `loaded = true` → Hero enters viewport
3. `WebGLHero` mounts → Three.js scene initialises → RAF loop starts
4. Hero headline gains `.chroma-active` immediately (effects A + C together)
5. `ShredderTransition` mounts → registers 2× ScrollTrigger instances
6. User scrolls → Lenis passes scroll to GSAP ScrollTrigger proxy
7. Shredder fires at each trigger boundary (`once:true`)
8. Section headings gain `.chroma-active` on scroll entry
9. Portfolio enters viewport → 6× `WebGLImage` renderers initialise (idle)
10. First `pointerenter` on a card → RAF starts for that card only

---

## Renderer Lifecycle

Every `useEffect` that creates a Three.js renderer must return a cleanup function that:
1. Cancels the RAF loop (`cancelAnimationFrame`)
2. Calls `renderer.dispose()`
3. Removes the canvas from the DOM

Browser WebGL context limit is typically 8–16. With 1 hero renderer + 6 card renderers = 7 — within limit, but cleanup must run reliably on route change / unmount. ShredderTransition cleanup kills both ScrollTrigger instances and the GSAP timeline.

---

## Error Handling & Fallbacks

| Scenario | Detection | Fallback |
|----------|-----------|---------|
| WebGL not supported | `renderer.getContext()` returns null | Static CSS radial gradient (ember + teal, 8% opacity) for hero; plain `<Image>` for cards |
| `prefers-reduced-motion` | `matchMedia('(prefers-reduced-motion: reduce)')` | Atmosphere RAF capped at 10fps; shredder skipped (sections snap); chromatic aberration `transition-duration: 0` |
| Low-end GPU | `navigator.hardwareConcurrency < 4` | Atmosphere + distortion fall back to CSS/plain image; shredder + aberration still run |
| Shader compile error | `gl.getProgramInfoLog()` non-empty | `try/catch` in `useEffect` switches to CSS fallback; error logged in dev |
| Lenis/ScrollTrigger conflict | Existing proxy setup | Shredder uses `scroller: lenisRef.current.wrapper` — no new proxy config needed |

---

## Performance

| Item | Cost |
|------|------|
| `three` (minified, gzipped) | ~150 kb |
| WebGLHero draw calls | 1/frame |
| WebGLImage draw calls | 0 when idle, 1/frame on active hover |
| Displacement texture | ~64 kb (loaded once, shared) |
| ShredderTransition | ~0 (CSS + GSAP, no GPU) |
| Chromatic aberration | ~0 (pure CSS) |

Three.js is dynamically imported with `ssr:false`, so it is not in the critical render path. The existing bundle already ships GSAP (~60 kb) and Framer Motion (~100 kb).

---

## Dependencies

```bash
npm install three @types/three
```

No other new dependencies.
