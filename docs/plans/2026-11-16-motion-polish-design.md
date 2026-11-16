# Motion polish: interior openings, reveal policy, arrival, brief-sent

Date: 2026-11-16. Validated with Hisham section by section.
Builds on `2026-07-04-cinematic-motion-redesign-design.md`; keeps every token and the editorial-cinematic system. No new dependency, no new tokens unless noted.

## Audit (live, 1440x900, Chrome)

Home: full scripted scroll held 60fps (p95 17.6ms, zero frames over 33ms), CLS 0.031, LCP 200ms (hero line). Signature pieces in place: aperture intro, slot-reveal hero, chapter scenes, shutter wipe, Portfolio-to-cover view-transition morph.

Gaps found in code:

1. Services, About, Contact open on the same text-only `PageHeader`; Journal has a hand-built header on legacy colour names (`text-bone`, `text-silver`); Portfolio copies the header entrance inline.
2. `useScrollReveal` stagger on nearly every section, so authored moments lose contrast.
3. Interior arrival about 2s: template page fade (y 12, delay 0.15) then 1.6s headline lines.
4. Brief sent: instant swap, no acknowledgement beat.

Not measured live: interior routes (browser checks were blocked), mobile, Safari.

## 1. Openings and arrival

- `PageHeader` gains an optional frame slot. Contents open from `CHAPTER.openInset` to full while the title rises. One component for every interior page.
- Services: strip of the five `coverProject` heroes, one horizontal drift, then settles. `aria-hidden`; first image `priority` (likely LCP), rest lazy.
- About: the portrait moves up into the frame, with its `useTilt` (fine pointers only). `About` keeps philosophy, stats, 3D camera; drops its portrait and that portrait's reveal.
- Contact: empty frame, corner marks, caption "Your frame". No image.
- Journal: moves onto `PageHeader`, type only, current colour tokens.
- Portfolio: uses `PageHeader` instead of its inline copy.
- Arrival: headline starts under the lifting shutter. Pages with `PageHeader` drop the template's page-level y and 0.15 delay. Line rise `DUR.reveal` (1.1s), stagger 0.12. Frame opens in parallel at `DUR.cinematic`. Target: headline readable about 0.8s after the shutter clears.
- `liftWipe` stays outside any `gsap.context` (Back-button regression, `TemplateWipe.test.tsx`).
- Reduced motion: frame static and open, existing 0.3s fade. Mobile: shorter frame, `MOBILE` scaling.

## 2. Reveal policy

Stagger only real sequences or lists. Plain fade is `useScrollReveal({ distance: 0 })`; no hook change.

| Section | Reveal |
|---|---|
| Services workflow steps, About principles, case-study related cards, Portfolio grid | keep stagger |
| Services production blocks | plain fade (sticky photo carries motion) |
| Case-study overview, approach, facts (`CaseMeta`) | plain fade |
| Contact form | none |
| Case-study quote | unchanged, the one authored text moment |

## 3. Brief-sent moment

Happens at the confirmation, where the visitor is (the header frame is off-screen at submit).

1. Form gives way to the confirmation.
2. Corner marks close in around "Message received." (viewfinder focus lock).
3. One shutter blink over the confirmation box.

About 0.7s total, from `DUR` tiers. Focus still moves to the confirmation; scroll it into view if needed. Reduced motion: marks already placed, text fades. Errors and the undelivered fallback unchanged. Out of scope: sound, confetti, field changes.

## 4. Testing

- Unit/component (vitest): `PageHeader` renders the frame slot and, under reduced motion, sets final state; `ContactForm` success shows the marks and moves focus (update existing Contact test); `TemplateWipe` regression still passes.
- E2E: reduced-motion suite covers the new header; after a full scroll no text in `main` is left at opacity 0 on any route.
- Performance, real-GPU browser pane per route: scroll p95 within 1ms of home (about 17.7ms), zero frames over 33ms, CLS at or below 0.05, Services LCP not worse than today.
- Manual on Hisham's devices: Safari desktop and iPhone (Back fix check rides along).
- Localhost preview and Hisham's OK before any push.

## Build order

Each step ships alone, smallest first:

1. Arrival speed
2. Reveal policy
3. Openings (frame slot, then the pages one by one)
4. Brief-sent moment
