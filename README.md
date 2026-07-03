# Hisham Hany — Portfolio

Editorial photography portfolio. Fashion, automotive, commercial — Cairo, worldwide by commission.
Live: https://hishamhany-pink.vercel.app

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Stack

- **Next.js 14** (App Router) · TypeScript strict · Tailwind 3 (CSS-variable tokens)
- **GSAP + ScrollTrigger + Lenis** — the single motion stack (scroll reveals, pinning, page curtain)
- **Three.js** — data-driven 3D feature slots on case studies (loads only where declared)
- **Bodoni Moda** (display) + **Spline Sans Mono** (labels/body)
- **Drizzle + Neon Postgres** — optional CMS backing (admin), static registry fallback
- **Resend** — contact form delivery

## Information architecture

```
/            Curated home — loader, hero, featured work, teasers, commission CTA
/portfolio   Complete archive — category filter (?category=), featured strip, hover index
/work/[slug] Magazine case studies — cover, fact sheet, overview, sequenced spread
/services    Five productions + client-experience workflow (pinned on desktop)
/about       Creative-partner story + working principles
/journal     MDX editorial (content/journal/*.md)
/contact     Inquiry form + direct channels
/admin       CMS (projects, testimonials, analytics) — chrome-free, session-gated
```

Routes live in `app/(site)/` behind a shared chrome (`components/SiteChrome.tsx`:
nav, cursor, scroll progress, Lenis, footer). `app/template.tsx` runs the GSAP
curtain between routes and moves focus to `#main`.

## Content model

- `lib/projects.ts` — the project registry: base fields plus optional
  `editorial` (overview, objectives, direction, approach, sequence, features,
  related). Adding a project here creates the feed row, the archive entry, and
  the static `/work/<slug>` page.
- `lib/services.ts` — productions + workflow copy. `priceFrom` is optional;
  the UI stays inquiry-led without it.
- `lib/site.ts` — identity, socials, and every JSON-LD helper (single source).

## Design system

- Tokens in `app/globals.css` (atelier palette: paper/ink/ultramarine — the
  accent flips lighter on dark ground) mirrored by `tailwind.config.js`
  ladders: `text-label-*`, `text-body-*`, `text-display-*`, spacing
  `gutter/section/stack`, measures `max-w-measure*`.
- Motion tokens in `lib/motion.ts` (`MOTION`), consumed by the hooks in
  `hooks/`: `useScrollReveal`, `useLineReveal`, `useMaskReveal`,
  `useProgressiveImage`, `usePinnedSection`, `useHorizontalGallery`,
  `useTilt`, `useParallax`, `useMagnetic`, `useCountUp`. All respect
  `prefers-reduced-motion` (final state, no pinning).

## Images

Source photography lives under `public/images/`; `npm run build` regenerates
`gallery-manifest.json` + `gallery-dimensions.json` (CLS-free spreads via
intrinsic dimensions). Optimize new folders with `npm run images:optimize:write`.

## Testing

```bash
npm test               # vitest unit (node)
npm run test:component # vitest jsdom
npm run test:e2e       # Playwright — 4 device profiles + axe a11y
npm run test:visual    # visual regression (Chrome)
npm run test:perf      # Lighthouse budgets
```

CI (GitHub Actions) runs lint → unit → build → e2e on every push to main;
Vercel deploys main automatically.
