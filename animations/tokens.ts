/**
 * Motion tokens v2 — the derived timing scale behind the editorial-cinematic
 * redesign (docs/plans/2026-07-04-cinematic-motion-redesign-design.md).
 *
 * One master unit; every duration is a fixed multiple of it, so the whole
 * site re-paces from a single number. Consumed via lib/motion.ts (which keeps
 * the legacy MOTION shape) — components never import this file directly.
 */

/** Master timing unit, seconds. The site's pace in one number. */
export const BASE_UNIT = 1.1

/**
 * Duration scale, seconds — BASE_UNIT × {0.32, 0.64, 1, 1.45, 2}.
 *   micro     → hovers, presses, cursor states
 *   swift     → menus, small entrances, image hover settles
 *   reveal    → canonical scroll reveal
 *   cinematic → headline lines, case covers, section-scale moments
 *   hero      → the page-load hero beat only — never scroll reveals
 */
export const DUR = {
  micro: 0.35,
  swift: 0.7,
  reveal: 1.1,
  cinematic: 1.6,
  hero: 2.2,
} as const

/**
 * The easing family. One curve per job — using a single curve everywhere is
 * what makes motion feel templated.
 *   settle → entrances and reveals: long decelerating tail, the gallery feel
 *   drift  → parallax and scrub-adjacent motion: barely curved, never fights scroll
 *   touch  → hovers and presses: responds fast, lands soft
 */
export const EASE = {
  settle: [0.16, 1, 0.3, 1],
  drift: [0.33, 0, 0.2, 1],
  touch: [0.3, 0.9, 0.3, 1],
} as const

export const EASE_CSS = {
  settle: 'cubic-bezier(0.16, 1, 0.3, 1)',
  drift: 'cubic-bezier(0.33, 0, 0.2, 1)',
  touch: 'cubic-bezier(0.3, 0.9, 0.3, 1)',
} as const

/** Stagger between siblings, seconds — wide gaps create the unfolding rhythm. */
export const STAGGER = {
  lines: 0.12,
  images: 0.09,
} as const

/** Scroll reveals travel this many px. Less travel, longer time. */
export const REVEAL_DISTANCE = 40

/**
 * Scroll-driven "vertical slot → full-bleed" hero reveal. A pinned image opens
 * its clip-path from a narrow centered column to full frame as you scroll,
 * while the overlaid headline holds, then eases up and out near completion.
 * Shared by the home hero and case-study headers so the unveil moves with one
 * voice (hook: useScrollReveal).
 *
 *   slotInset  → closed state: inset(top right bottom left). 34% each side =
 *                a gallery-frame column. This is the single most brand-defining
 *                number; widen it (smaller %) for a bolder open.
 *   openInset  → full-bleed end state.
 *   startScale → slight overscale at the closed state; settles to 1 as it opens
 *                so the photo "lands" rather than simply un-clipping.
 *   pin        → scroll budget the reveal plays across (home) / shorter for the
 *                denser case-study header.
 *   scrub      → seconds of smoothing between scroll and progress.
 *   textHold   → fraction of the reveal the headline holds before lifting.
 *   textLift   → px the headline travels up as it releases.
 */
const HERO_PIN_VH = 1.2
const CASE_PIN_VH = 0.8

export const REVEAL = {
  slotInset: 'inset(0% 34% 0% 34%)',
  openInset: 'inset(0% 0% 0% 0%)',
  startScale: 1.12,
  endScale: 1,
  /**
   * Reveal scroll budgets as multiples of viewport height. `pin` / `casePin`
   * are derived from them, and the header gate reuses the same numbers so
   * "reveal complete" and "header appears" stay in lockstep from one source —
   * on the home hero (pinVh) and on the shorter case-study cover (casePinVh).
   */
  pinVh: HERO_PIN_VH,
  pin: `+=${HERO_PIN_VH * 100}%`,
  casePinVh: CASE_PIN_VH,
  casePin: `+=${CASE_PIN_VH * 100}%`,
  scrub: 1,
  textHold: 0.62,
  textLift: -90,
  /**
   * Time-driven autoplay reveal (touch devices) — the same slot→full-bleed +
   * headline-lift keyframes, played on a timeline instead of scrubbed by a pin.
   * `autoplayDur` is the home-hero beat; case-study covers play quicker so they
   * don't slow down browsing (`caseAutoplayDur`). Seconds; scaled by MOBILE.dur.
   */
  autoplayDur: DUR.hero,
  caseAutoplayDur: DUR.cinematic,
  /**
   * Touch headline exit. On touch the photo autoplays, but the headline lift is
   * scroll-relative — it holds over the open frame until the user scrolls, then
   * lifts (textLift) and fades across this many viewport heights of scroll. No
   * pin, so it never fights the touch scroll.
   */
  touchTextEndVh: 0.7,
} as const

/** Parallax travel ceilings, px (negative = moves up as you scroll down). */
export const PARALLAX = {
  background: -60,
  foreground: -30,
} as const

/**
 * Stacked-seam recession — the homepage "card handoff". As a section's bottom
 * exits (viewport bottom → top), it scales, tips, dims, and lingers (yPercent
 * downward, so it lags the scroll and the next section appears to slide over
 * it). No pin — progress comes from live geometry. Hook: useStackedSeam.
 *
 *   scale/rotate → end state of the receding card. Rotation is skipped for
 *                  thin strips (the marquee) — a tipping 170px band reads as
 *                  breakage, not depth.
 *   dim          → end brightness; sells "the card fell behind".
 *   linger       → yPercent the card travels down across the seam. This is
 *                  what creates the overlap the incoming card covers.
 *   layer        → hero-internal differential yPercent: the photo (back) lags
 *                  further than the receding stage, so the frame reads as depth.
 *   scrub        → seconds of smoothing, matching the parallax feel.
 */
export const STACK = {
  scale: 0.85,
  rotate: -4,
  dim: 0.7,
  linger: 25,
  layer: { back: 10 },
  scrub: 1.2,
} as const

/**
 * Shallow stacked-seam — the punctuation handoff into the dark Statement
 * panel. Flatter and quieter than STACK: the featured-work feed settles under
 * the ink field rather than falling away. No rotation — tall sections tip
 * badly — and no internal layers; the feed's own velocity skew supplies the
 * life. Same scrub so both seams breathe together.
 */
export const STACK_SHALLOW = {
  scale: 0.94,
  rotate: 0,
  dim: 0.78,
  linger: 12,
  scrub: 1.2,
} as const

/**
 * Intro choreography — the aperture handoff (Loader.tsx → Hero.tsx). The hero
 * photo is painted from the first frame; ink bars hold a small window open over
 * it while the wordmark and a real 000→100 count play beneath, then the bars
 * part and the photo becomes the hero. Every beat is a DUR tier.
 *
 *   minCount  → the count never finishes faster than this on the full intro,
 *               so a warm cache still reads as a deliberate beat, not a blink.
 *   maxWait   → hard ceiling on waiting for assets, measured from navigation
 *               start (performance.timeOrigin), not from hydration. Anything
 *               still pending at this point is treated as settled.
 *   hold      → the pause at 100 before the handoff.
 *   out       → wordmark + count leave; overlaps the open (no hard cut).
 *   open      → bars part to full-bleed while the photo settles.
 *   copyAt    → fraction of the open where the hero copy starts rising.
 *   releaseAt → fraction of the open where the header returns and the page
 *               counts as entered.
 *   trackSpread → wordmark tracking: viewBox units each glyph starts away from
 *               its resting x, scaled by its distance from the word's centre.
 *   failsafe  → seconds after which the inline bootstrap forces the final
 *               state if JS never claimed the intro — derived, so it always
 *               outlasts the slowest legitimate intro plus hydration slack.
 *   watchdog  → extra seconds a claimed-but-stalled intro gets before the
 *               bootstrap forces it done too.
 */
const LOAD_MAX_WAIT = BASE_UNIT * 5
const LOAD_HOLD = DUR.micro
const LOAD_OUT = DUR.swift
const LOAD_OPEN = DUR.cinematic

export const LOAD = {
  minCount: DUR.hero,
  maxWait: LOAD_MAX_WAIT,
  hold: LOAD_HOLD,
  out: LOAD_OUT,
  open: LOAD_OPEN,
  copyAt: 0.35,
  releaseAt: 0.6,
  trackSpread: 14,
  failsafe: LOAD_MAX_WAIT + LOAD_HOLD + LOAD_OUT + LOAD_OPEN + DUR.hero,
  watchdog: DUR.hero * 2,
} as const

/**
 * The loader's viewfinder window. A centred 3:2 frame (the photo's own ratio,
 * like a real viewfinder), lifted above centre so the wordmark and count sit
 * beneath it like a print caption.
 *
 *   width      → window width as vw (desktop / below the MOBILE breakpoint).
 *   ratio      → width ÷ height.
 *   centerY    → window centre as a fraction of viewport height.
 *   startScale → the photo's overscale while the window is closed; it settles
 *                to CHAPTER.restScale as the bars part, so it lands, not unclips.
 */
export const APERTURE = {
  width: 26,
  widthMobile: 62,
  ratio: 3 / 2,
  centerY: 0.44,
  startScale: 1.12,
} as const

/**
 * Chapter journey — each featured project is a full-screen scene held by CSS
 * position: sticky (no GSAP pin, so no pin-spacers). The next scene's stage
 * arrives over the held one; scroll budgets are viewport units.
 *
 *   hold        → vh a scene stays still after it arrives, by composition:
 *                 full-bleed plates earn the longest look.
 *   hangHeight  → every hung plate shares this height (svh) — one eye-line
 *                 down the whole wall, whatever the source resolution.
 *   hangMaxWidth→ vw cap so the ink wall always shows around a hung plate.
 *   portraitHeight → svh height of a portrait plate.
 *   openInset   → the closed window a plate opens from (clip-path inset of
 *                 its own box) — the loader's viewfinder, repeated per scene.
 *   openScale   → image overscale while the window is closed.
 *   restScale   → the image never settles to 1: a constant overscan leaves
 *                 room for the drift without exposing the plate's edge.
 *   drift       → yPercent the image travels across a scene's whole pass;
 *                 must stay ≤ (restScale − 1) / 2 × 100 so no edge shows.
 *   recedeScale → the held stage's scale as the next one covers it.
 *   recedeDim   → opacity of the ink overlay that dims it (never `filter`).
 *   copyAt      → enter progress at which the copy rises — once per visit.
 *   scrub       → seconds of smoothing between scroll and the scene timeline.
 */
export const CHAPTER = {
  hold: { bleed: 60, hung: 30, portrait: 30 },
  hangHeight: 60,
  hangMaxWidth: 56,
  portraitHeight: 76,
  openInset: 'inset(16% 24% 16% 24%)',
  openScale: 1.15,
  restScale: 1.06,
  drift: 2.5,
  recedeScale: 0.94,
  recedeDim: 0.55,
  copyAt: 0.6,
  scrub: 1,
} as const

/**
 * Media queries shared by CSS and JS. `immersive` is the single definition of
 * "this device gets the scroll-driven scenes": a fine pointer that can hover,
 * motion allowed, wider than the MOBILE breakpoint. globals.css repeats the
 * literal (asserted in tests/unit/motion-tokens.test.ts) and JS drives it
 * through gsap.matchMedia(), so a query flip reverts inline styles cleanly.
 */
export const MQ = {
  immersive: '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 769px)',
} as const

/**
 * Pointer drift on the hero photo — fine pointers only, never past the
 * CHAPTER.restScale overscan. px at the viewport edge, settling over `dur`.
 */
export const POINTER = {
  hero: 8,
  dur: DUR.cinematic,
} as const

/**
 * Ambient loop pacing + the velocity coupling that lets the Statement marquee
 * breathe with scroll. Each frame the marquee's playbackRate eases toward
 * 1 + min(velocityBoost − 1, |v| / velocitySaturate) — ambience, not a
 * speedometer; at rest it always settles back to 1.
 */
export const AMBIENT = {
  /** Client logo marquee full loop, seconds (ClientsMarquee inline style). */
  logoMarquee: 36,
  /** Text marquee loop, seconds — mirrors --dur-marquee in globals.css. */
  textMarquee: 28,
  /** Max marquee playbackRate under fast scroll. */
  velocityBoost: 2.4,
  /** Scroll velocity (px/s) that saturates the boost. */
  velocitySaturate: 2400,
  /** Per-frame lerp toward the target rate (0–1, lower = heavier). */
  velocitySmoothing: 0.08,
} as const

/**
 * Magnetic pull — primary CTAs only, and never past this many px. The pull
 * should be clearly felt on the few buttons that matter, invisible elsewhere.
 */
export const MAGNETIC_MAX = 12

/**
 * Desaturate-at-rest, colour-on-attention — the archive grid's covers sit at
 * a quiet grade until hovered/focused, when they resolve to full colour.
 * Grid/feed thumbnails only; case-study imagery itself is never graded (the
 * work has to read honestly once you're looking at it).
 */
export const ATTENTION = {
  restGrayscale: 0.85,
  restContrast: 1.02,
  dur: 0.6,
} as const

/**
 * Cursor-follow lag — the trailing preview box in HoverIndexList. Per-frame
 * lerp toward the pointer (0–1, lower = heavier/laggier); tuned to breathe
 * rather than track rigidly, matching the drift ease family's restraint.
 */
export const CURSOR_FOLLOW = {
  lerp: 0.13,
} as const

/**
 * Mobile adaptation — animations adapt rather than disappear. Below the
 * breakpoint, durations tighten and travel distances shrink: small screens
 * read closer, so the same pacing feels slower and the same distance bigger.
 */
export const MOBILE = {
  /** Viewport max-width (px) that counts as mobile. */
  maxWidth: 768,
  /** Duration multiplier below the breakpoint. */
  dur: 0.85,
  /** Distance/travel multiplier below the breakpoint. */
  dist: 0.7,
} as const

/**
 * Lenis smooth-scroll tune. lerp (not duration mode) so the weight is
 * constant regardless of scroll delta — heavier than stock, but tuned to
 * never visibly lag trackpad input.
 */
export const LENIS = {
  lerp: 0.075,
  wheelMultiplier: 0.8,
  touchMultiplier: 1.5,
} as const
