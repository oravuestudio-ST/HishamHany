# Agency Conversion Layer: Design

Date: 2026-11-16
Status: Approved (brainstorming session)

## Goal

Turn the site into a commission engine. Primary audience: agency creative directors and producers, all sectors. Market: Egypt + Gulf (Cairo base, Dubai/Riyadh growth). Conversion action: a short project brief.

Success is measured in qualified briefs and won jobs, never traffic or followers.

## Pre-work audit (2026-11-16)

- Typecheck, lint: clean. Vitest: 60 files, 348 tests pass. Production build: passes.
- Live site is stale: `hishamhany.vercel.app` serves a cached build (`age: 4550623`, about 52 days). `main` at `dc49e2f` is pushed but not live.
- `hishamhany-pink.vercel.app` returns 404 (CLAUDE.md lists it as live).
- Uncommitted: `tests/e2e/admin-crud.spec.ts` scopes stat-card text to `<main>` (valid fix).
- No conversion analytics; only a homemade `page_views` table.

## Approach

A now: conversion layer on the existing immersive build. B as phase 2: sector landing pages, built only where data justifies them. C (award push) out of scope.

## Phase 1, week 1: Foundation

1. Fix the production alias in the Vercel dashboard: promote the `dc49e2f` deployment and verify the domain assignment. Confirm with curl that the intro markup is in the live HTML.
2. Custom domain (`hishamhany.com` or `.studio`) pointed at the project.
3. Vercel Analytics plus custom events: `case_study_view`, `brief_start`, `brief_submit`, `email_click`.
4. Commit the admin-crud test fix; update CLAUDE.md with the real live URL.

Exit check: the live URL serves the current build, the domain resolves, and a test brief appears as an event.

## Phase 1, weeks 2-3: Brief form

Replaces the generic contact form. One screen, about 60 seconds.

| Field | Input |
|---|---|
| Deliverable | chips: stills / motion / both |
| Sector | automotive / fashion / product / campaign / other |
| Shoot window | month or "flexible" |
| Usage | social only / digital campaign / full buy-out (print, OOH) |
| Budget band | USD bands, AED toggle; values in `BUDGET_BANDS` (owner sets) |
| Location | Cairo / Egypt other / Dubai-UAE / KSA / other |
| Agency or brand, role | text |
| Reference link or message | text |

- Keep the honeypot, rate limiter and `escapeHtml`; validate on the server against fixed option lists at `/api/contact`.
- Email subject line: `[Brief] {Sector} · {Usage} · {Band} · {Location} · {Month}`.
- New `inquiries` table; `/admin` list with status new / quoted / won / lost.
- Success state promises a reply within 24 hours.
- "Send a brief" call to action in the header and at the end of every case study, with the sector pre-filled.
- Excluded: file upload, multi-step wizard, call booking.

## Phase 1, weeks 3-4: Agency proof and SEO

- New optional `Project` fields `agency`, `credits`, `usage`, shown in `CaseMeta` only when filled.
- Production-capability block on Services: crew scale, equipment, permits and locations in Egypt, UAE/KSA travel, turnaround, delivery.
- One or two named agency testimonials using the existing testimonials table.
- Structured data: list the areas served (Cairo, Dubai, Riyadh, Jeddah).
- One primary search phrase per page in titles and meta descriptions (e.g. "automotive photographer Cairo", "commercial photographer Dubai").
- Descriptive alt text and filenames for case-study hero images.
- Search Console and Bing sitemap submission; Google Business Profile for Cairo.
- One journal post a month (Process pillar), each linked to a case study.
- Excluded: Arabic version (revisit if analytics show Arabic search traffic).

## Phase 2, week 5 onward: Sector pages

After 6-8 weeks of data, build a sector landing page only for sectors with 3 or more briefs. Reuse the portfolio components filtered by `category`, with their own copy and the brief pre-filled. No new layout system.

## Testing

- Unit: brief validator (rejects values outside the option lists, honeypot, rate limit).
- Component: chips, sector pre-fill from the call to action, success state.
- E2E: full brief submission with a mocked email, row visible in `/admin`.
- Perf: Lighthouse guard; analytics must not move LCP.
- Each phase is shown on localhost and approved before any push.

## Risks

- A longer form lowers submissions. Fallback: make usage and budget optional; compare `brief_start` with `brief_submit`.
- Stale deploys keep recurring. Add a check that compares the live HTML with the latest commit's build ID.

## 90-day success bar

- Live and current on a custom domain.
- At least 4 qualified briefs a month (budget band and usage filled).
- At least 2% case-study views to brief.
- At least 1 won job tracked in `/admin`.
- Search Console impressions for at least 5 target phrases.
