# Motion score: pace, contact sheet, finish

## Context

Hisham asked for a full, professional, award-level creative motion plan for the whole site
(hishamhany.vercel.app, repo `hishamhany-Website`). The audit shows the site does not lack a motion
system. Tokens, five entrance presets, the aperture intro, chapter scenes, the ink shutter, the
thumbnail-to-cover morph, viewfinder page openings and the brief-sent beat are all built, and three
earlier motion plans are shipped (2026-07-04, 2026-07-12, 2026-11-16).

What Hisham reports is different: nothing a visitor remembers, inner pages thinner than home, a flat
phone experience, and slowness everywhere (intro, scroll, page changes, case-study cover). Those are
one problem. Motion is spent evenly and slowly on every beat, so nothing contrasts. This plan keeps
the system and changes how it is spent: a fast, quiet baseline, one interactive signature, and every
route finished to the same standard.

Decisions taken with Hisham on 2026-11-16:

1. Goal: clients first, then an Awwwards entry.
2. Slow or heavy: all four areas (intro, scroll weight, between pages, case-study cover).
3. Signature: the contact sheet (chosen over key light and loupe).
4. No rebuild. Extend the existing tokens and hooks. No new dependency.

## The score

The site already speaks one metaphor, the photographer's process. Naming it gives every future idea a
test: is this something a camera or a darkroom does?

| Stage | Where it lives | Status |
|---|---|---|
| Frame (viewfinder) | intro aperture, page-opening frames, chapter brackets, brief-sent focus lock, 404 | built; 404 new |
| Expose (shutter) | route change, brief-sent blink | built; made faster |
| Sheet (contact sheet) | every case study | new, the signature |
| Enlarge | a frame grows into the viewer | new |

Rule of spend: the baseline answers in under a second and never makes the visitor wait. Only the
intro, the sheet and the enlargement are meant to be noticed.

## Step 0. Record the design

Save this plan as `docs/plans/2026-11-16-motion-score-design.md` (repo convention, new file, nothing
overwritten). Work on branch `feat/motion-score`, not on `main`.

## Step 1. Pace (biggest complaint, smallest diff)

All values are starting points, tuned live on localhost.

| Lever | Today | Start value | Where |
|---|---|---|---|
| Base unit | 1.1s, `DUR` written as literals | 0.85s, `DUR` computed from `BASE_UNIT` (x0.32, 0.64, 1, 1.45, 2) | `animations/tokens.ts` |
| Intro minimum count | `DUR.hero` (page released at about 3.9s) | `DUR.cinematic` (about 2.5s) | `LOAD.minCount` |
| Smooth scroll | lerp 0.075, wheel x0.8 | lerp 0.1, wheel x1 (Lenis stock, checked in the installed README) | `LENIS` |
| Chapter holds | 60 / 30 / 30 vh | 30 / 15 / 15 vh | `CHAPTER.hold` |
| Scrub lag | 1, 1.2, 1, 0.8s | halve each | `CHAPTER.scrub`, `STACK.scrub` (+ shallow), `REVEAL.scrub`, `MOTION.horizontal.scrub` |
| Services workflow pin | `+=250%` | `+=150%` | `lib/motion.ts` `MOTION.pin.workflowEnd` |
| Shutter | cover 0.55, hold 0.12, lift 0.7 (1.37s) | cover 0.4, hold 0.06, lift `DUR.swift` (about 1.0s) | `animations/transitions.ts`, moved into a `WIPE` token |
| Thumbnail-to-cover morph | `--dur-cinematic` (1.6s) | `--dur-slow` | `app/globals.css` `::view-transition-group(*)` |
| Off-scale durations | 16 Tailwind `duration-500/700`, 6 CSS literals (1.2s, 0.9s, 0.5s, 0.2s), inline literals in `HoverIndexList` | `duration-swift` / `var(--dur-*)` | components, `app/globals.css` |

Structural changes:

- **Case-study cover stops pinning.** `hooks/useSlotReveal.ts` loses its pinned branch (CaseCover is its
  only caller; the home hero left it in October). The slot opens on a timeline on every device, the
  path touch devices already use. Add one option, `snap`, so a cover reached by the thumbnail morph
  lands already open: the thumbnail grows straight to full-bleed in one gesture instead of morph, then
  slot, then scroll. `lib/view-transitions.ts` exports `isMorphArrival()`; `CaseCover.tsx` reads it once.
- **Header gate deleted.** The "reveal-gated routes" effect in `components/Navigation.tsx` (about 60
  lines, scroll-past-the-pin logic and its settle timer) goes; case studies get the normal header
  entrance, as phones already do. Then remove the unused `REVEAL.pin*`, `casePin*`, `textHold` tokens.
- **Mirrors synced once.** After the number is chosen, update `tailwind.config.js` (`micro`, `swift`)
  and the `--dur-*` vars in `app/globals.css`, and extend `tests/unit/motion-tokens.test.ts` to assert
  the CSS vars too (it already reads `globals.css` for the media query).

Hisham's hands-on decision: `BASE_UNIT` in `animations/tokens.ts`. I leave it marked. In the localhost
session he tries 0.95, 0.85 and 0.75 with hot reload and keeps the one that feels right. It is one
number and it sets the pace of the whole site, so it should be his.

This step knowingly undoes three decisions validated in July: scroll heavier than Lenis stock, the
pinned case cover, and the long intro count.

Tests to update: `tests/unit/motion-tokens.test.ts` (`LENIS.lerp < 0.1`, `LOAD.minCount === DUR.hero`),
`tests/component/useSlotReveal.test.tsx` (drop the pinned suite, add `snap`),
`tests/e2e/hero-reveal-touch.spec.ts` (cover autoplays on every device, no `.pin-spacer`).

Targets, measured in the real-GPU Browser pane: page released within 2.6s on a first visit and 0.8s on
a return visit; headline readable within 1.1s of a click on a prefetched route; photographs reachable
on a case study with no forced scroll; scroll p95 frame time at or under 17.7ms with no frame over
33ms; CLS at or under 0.05.

## Step 2. Contact sheet and enlargement (the signature)

Behaviour, in every case study:

- A sticky pill at the bottom of the image sequence (`position: sticky`, CSS only, thumb-reachable on a
  phone): "Contact sheet", `aria-pressed`. It flips the sequence between the editorial spread and a sheet.
- The sheet: an always-ink board, heading `{title}: {n} frames`, grid of 3 columns on phones, 4 on small
  tablets, 6 from `md`. Each cell is a 3:2 box with the whole frame inside (`object-contain`, no crop)
  and a mono frame number beneath. Hover or focus closes the existing `.frame-marks` brackets on a
  frame. A tap opens the viewer.
- Motion: frames on screen glide from their place in the spread to their cell, the rest cross-fade,
  numbers arrive after the frames land. Entering scrolls the sheet under the header; leaving restores
  the reader's scroll position. A tapped frame grows into the viewer and shrinks back on close.

Build:

- `lib/view-transitions.ts`: add `transitionState(kind, update)`, the same shape as
  `startThemeTransition` in `lib/theme-transition.ts` (`flushSync` inside `document.startViewTransition`).
  It sets `html[data-vt]` for the duration. Unsupported browser or reduced motion: run `update` plainly.
- `components/case-study/ContactSheet.tsx` (new, about 60 lines) and a `mode` state in
  `CaseSpread.tsx`. Only frames in the viewport before and after get a `view-transition-name`, set
  imperatively and cleared when the transition finishes, so the snapshot count stays bounded.
- No blur placeholders exist (`GalleryImage` is `src`, `w`, `h`), so a visible cell takes the spread
  image's `currentSrc` as its background until its own thumbnail loads. Same trick as a
  `placeholderSrc` prop on `Lightbox.tsx` for the enlargement.
- `app/globals.css`: sheet board, cell and pill styles; under `html[data-vt]` a root cross-fade and
  `--dur-medium` groups (the root fade stays off elsewhere, the theme wipe depends on that).
- After each swap: `ScrollTrigger.refresh()`; scroll via `getLenis()` (`lib/lenis.ts`). The spread's
  entrance reveal must not replay when returning from the sheet.

Tests: `tests/component/CaseSpread.test.tsx` (new): toggle shows n numbered frames, `aria-pressed`
flips, a sheet frame opens the viewer at that index, toggling back restores the spread.
`tests/e2e/case-study.spec.ts`: the sheet flow on desktop and phone projects, including reduced motion.
Existing `Lightbox.test.tsx` focus tests must stay green.

## Step 3. Finish every route

- **Journal index** (`app/(site)/journal/page.tsx`): move the list into a small client component,
  `components/journal/PostList.tsx`, using `useScrollReveal({ stagger: 'li' })` (a real list, allowed by
  today's reveal policy) and the title shift `HoverIndexList` uses. The `bone/silver/ember` classes are
  theme-aware aliases in `tailwind.config.js`, so no colour work is needed.
- **Journal post** (`app/(site)/journal/[slug]/page.tsx`): open on the shared `PageHeader` (eyebrow:
  date, title: post title) instead of the hand-built header. Check the title wrap at preview.
- **404** (`app/not-found.tsx`): `.frame-marks` around the numerals with one keyframe, a focus hunt
  that never locks. CSS only, still under reduced motion.
- **Portfolio filter** (`components/portfolio/PortfolioClient.tsx`): cards already carry
  view-transition names, so wrap the category change in `transitionState('filter', ...)`, resolved by an
  effect when `active` changes (the `waitForMorphTarget` pattern, with its timeout).
- **Phone**: press feedback on `[data-cursor]` targets under `(hover: none)` using the `.btn-press`
  value; CSS scroll-snap on the `FeaturedStrip` swipe row; chapter plates drift 2.5% on a CSS `view()`
  scroll timeline using the `translate` property, guarded by `@supports` and `(hover: none)` (the plate
  already rests at scale 1.06). Verify the drift on the iPhone and delete it if it janks.

## Step 4. Proof, then submission

- Device pass on the Vercel preview for the branch: iPhone Safari and desktop Safari, one checklist
  (intro, chapters, shutter, Back, morph, sheet, enlargement, filter, brief-sent). This also clears the
  Safari and iPhone checks left open since this morning.
- Per-route performance numbers recorded in the design doc.
- Awwwards entry: read the current submission rules and judging criteria on awwwards.com at that time
  and prepare the entry assets they ask for. Nothing about their criteria is assumed here.
- The reported homepage errors are still undiagnosed. If they persist after Step 1, they come first
  and need a screenshot or the error text.

## Not doing

Key light and loupe (not chosen). Cursor focus-lock brackets, a darkroom "develop" entrance, EXIF
captions, sound, WebGL on photographs. Renaming the 54 `duration-300` classes (already at the micro
tier). A pace knob in settings. Stagger inside the morph. A keyboard shortcut for the sheet. Tailwind
v4 and the shared WebGL canvas (still open in `docs/web-design-roadmap-v1.md`).

## Working rules

- Each step ships alone: tests, localhost preview, Hisham's OK, commit (`feat(motion): ...`), push the
  branch for a Vercel preview, then merge to `main`.
- Only `transform`, `opacity` and `clip-path` animate. Every new moment collapses under reduced motion.
- GSAP eases go through `gsapEase()`; durations through `DUR` or `var(--dur-*)`.
- When shipped, update the memory note `project_motion_token_system.md` (new pace, sheet, no case pin).

## Verification

1. `npm run typecheck`, `npm run lint`, `npm run test:unit`.
2. `npx playwright test tests/e2e/case-study.spec.ts tests/e2e/reveals.spec.ts tests/e2e/reduced-motion.spec.ts tests/e2e/hero-reveal-touch.spec.ts --workers=1`
   with nothing else on port 3000.
3. `npm run dev`, then in the real-GPU Browser pane: time the intro release, a route change and a
   case-study arrival; sample frame times through the home chapters and through a sheet toggle; read CLS.
   Headless numbers are not trusted for timing.
4. Phone viewport in the pane for layout, then Hisham's iPhone on the preview URL for feel.
5. Hisham's OK on localhost before any commit.

## Critical files

`animations/tokens.ts`, `animations/transitions.ts`, `lib/motion.ts`, `lib/view-transitions.ts`,
`hooks/useSlotReveal.ts`, `components/Navigation.tsx`, `components/case-study/CaseCover.tsx`,
`components/case-study/CaseSpread.tsx`, `components/case-study/Lightbox.tsx`,
`components/portfolio/PortfolioClient.tsx`, `app/globals.css`, `tailwind.config.js`,
`tests/unit/motion-tokens.test.ts`.

## Results (2026-11-17)

Shipped to `main`: Step 1 pace (88d93ec), Step 2 contact sheet (ed98f76), Step 3 route finish
(ecb4973). Step 4 adds `arrivalDelay()` so every on-screen entrance waits for the lifting shutter.

Cut by agreement: phone plate drift, journal post on PageHeader, portfolio filter transition,
frame growing into the viewer, sheet placeholders beyond the glided frames.

### Measured in the Browser pane (localhost dev, real GPU)

| Check | Result | Target |
|---|---|---|
| First visit: count reaches 100 | 1.45s | |
| First visit: page released (header in) | 2.77s | 2.6s, missed by 0.17s |
| Case cover fully open after a click | about 1.3s, opening as the ink clears | no forced scroll: met |
| Home scroll | p95 17.4ms, 0 frames over 33ms, CLS 0.000 | met |
| Contact sheet round trip | 3 frames glide each way, scroll restored to the pixel | |

### Lighthouse, mobile (simulated slow 4G), production, before the speed fix

| Route | Score | LCP | TBT | CLS | FCP |
|---|---|---|---|---|---|
| `/` | 85 | 3.65s | 3ms | 0.000 | 1.22s |
| `/portfolio` | 84 | 4.39s | 0ms | 0.000 | 1.08s |
| `/work/mercedes-gle-450-4matic` | 78 | 4.43s | 290ms | 0.000 | 1.09s |
| `/services` | 91 | 3.41s | 6ms | 0.000 | 1.07s |
| `/about` | 87 | 3.80s | 0ms | 0.000 | 1.11s |
| `/contact` | 96 | 2.73s | 0ms | 0.000 | 1.01s |
| `/journal` | 96 | 2.70s | 0ms | 0.000 | 0.97s |

### After the speed fix (d1bee44, 2026-11-18), same setup

The interior page fade moved from a JS tween after hydration to a CSS animation from first paint, and
the 3D features mount only when their slot nears the viewport.

| Route | Score | LCP | TBT | CLS | Before |
|---|---|---|---|---|---|
| `/` | 95 | 2.09s | 28ms | 0.000 | 85 |
| `/portfolio` | 79 | 4.75s | 7ms | 0.000 | 84 |
| `/work/mercedes-gle-450-4matic` | 95 | 2.96s | 28ms | 0.000 | 78 |
| `/services` | 91 | 3.41s | 0ms | 0.000 | 91 |
| `/about` | 96 | 2.76s | 2ms | 0.000 | 87 |
| `/contact` | 96 | 2.74s | 0ms | 0.000 | 96 |
| `/journal` | 96 | 2.72s | 0ms | 0.000 | 96 |

Open: `/portfolio` LCP is photo bytes (many full images above the fold), so the fix is image size or
quality, Hisham's call. `/services` LCP sits at 3.41s. One run each; scores move a few points
between runs.

Still to do by hand: the iPhone and desktop Safari pass on production.
