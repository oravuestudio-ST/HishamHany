# Hero A/B test: commission CTA (`hero-cta-v1`)

## Why
The home hero offers two ways forward: "Scroll to the work" and "Index". The
first route to a commission is the CTA at the bottom of the page, after six
chapters, the index, the statement, About, Services and Voices. Visitors who
already know they want to book have to scroll through all of it to get there.

## Hypothesis
If the hero offers a direct commission route and says who the work is for,
more homepage visitors will reach `/contact`, and fewer people will go on to
look at the work only by a small amount or not at all.

## Variants
| | A: control | B: commission CTA |
|---|---|---|
| Intro (viewfinder, count) | Unchanged | Unchanged |
| Category line | Fashion · Automotive · Cinematic | Same |
| Positioning line | none | "Editorial photography for brands. Cairo, worldwide by commission." |
| Actions | Scroll to the work · Index | **Commission a shoot →** (/contact) · Scroll to the work |

Only the hero changes. If the intro also changed, a result could not be
traced to one cause.

## Metrics
All rates are distinct visitors ÷ exposed visitors in each arm.

| Role | Event | Decision rule |
|---|---|---|
| Primary | `contact_view` (reached /contact) | B ships if it wins at p < 0.05 |
| Secondary | `inquiry_submit` (form sent) | Read for direction. Too rare to decide on |
| Guardrail | `scroll_past_hero` | B is not shipped if this drops significantly |
| Diagnostic | `hero_cta_click` (B only) | Shows how much of B's lift comes from the CTA itself |

## Sample size
Visitors needed **per arm** (two-sided α = 0.05, 80% power). Double the
figure to get total homepage visitors.

| Baseline contact rate | Detect +30% | Detect +50% |
|---|---|---|
| 3% | 6,455 | 2,518 |
| 5% | 3,780 | 1,471 |
| 8% | 2,276 | 882 |

Duration: total visitors needed ÷ monthly homepage visitors. Example: at a 5%
baseline and a +50% target, the test needs about 2,950 visitors. At
1,000 visitors a month that takes about 3 months. At 3,000 a month it takes
about 1 month.

**Next step:** read the current `/` → `/contact` rate in `/admin/analytics`
(Top pages) and pick the row. A portfolio should look for big effects
(+50%). Smaller ones need more traffic than the site gets.

## Rules
- Run for at least 2 full weeks, even if the target is reached sooner,
  because traffic differs between weekdays and weekends.
- Don't stop early because a p-value dips below 0.05 partway through. The
  admin panel won't call a result until each arm has 400 visitors, but that
  number is a floor, not the target.
- Pause paid or social pushes that send traffic straight to `/` during the
  test, or make sure both arms get them equally (they do by default, since
  the split happens per visitor).

## How it works
- **Assignment:** `middleware.ts` gives each visitor a sticky 50/50 cookie
  (`hh_exp_hero`, 30 days). B is served by an internal rewrite to
  `/home-b`. The URL stays `/` and both arms are static. Visiting `/home-b`
  directly redirects to `/`. B is `noindex` with its canonical set to `/`.
- **Tracking:** `lib/track-experiment.ts` sends events with `sendBeacon` to
  `POST /api/ab`. The endpoint checks every field and is rate-limited to 60
  per minute per IP. Events go to the `ab_events` table. Visitors without the
  cookie are never counted.
- **Results:** `/admin/analytics` → "A/B test: hero commission CTA".

## Before launch
1. Apply the migration: `npm run db:migrate` (creates `ab_events`).
2. Deploy, then open `/` in a private window and confirm the cookie is set
   and `/api/ab` returns 204.

## When it ends
- **B wins:** make B the hero in `components/Hero.tsx`, then remove the
  variant prop, `/home-b`, the middleware branch and the tracking calls.
- **B loses or no clear result:** remove the same pieces and keep A.
- Either way, write the result into this Brief as v2.
