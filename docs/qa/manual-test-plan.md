# Manual QA Test Plan — Hisham Hany Shader Portfolio

Companion to the automated suite (`npm run test`, `npm run test:e2e`). This covers what
automation can't reliably judge: real-device feel, GPU behavior, animation polish, and
cross-browser rendering. Run it before each production deploy to the `hishamhany` Vercel project.

## Device & browser matrix (must-pass)

| # | Device / context | Browser | Why it matters |
|---|------------------|---------|----------------|
| D1 | macOS desktop (mouse) | Chrome (latest) | Full shader + custom cursor experience |
| D2 | macOS desktop (mouse) | Safari (latest) | WebKit shader/GSAP differences |
| D3 | iPhone (real device) | Mobile Safari | Primary traffic source; touch + WebGL on iOS |
| D4 | Android (real device) | Chrome | Varied GPU; WebGL + touch |
| D5 | Any desktop, WebGL disabled | Chrome | Static fallback must look intentional |
| D6 | Any, reduced-motion ON | Chrome/Safari | Accessibility + motion-sensitivity |

### How to set up the special contexts
- **Disable WebGL (D5):** Chrome → `chrome://flags` → set *WebGL* to Disabled, or DevTools
  Command Menu (Cmd/Ctrl+Shift+P) → "Disable WebGL". Reload.
- **Reduced motion (D6):** macOS *System Settings → Accessibility → Display → Reduce motion*;
  iOS *Settings → Accessibility → Motion → Reduce Motion*; or DevTools → Rendering →
  "Emulate CSS prefers-reduced-motion: reduce".
- **Throttling:** DevTools → Performance → CPU 4–6× slowdown to approximate low-power phones.

---

## 1. Load & first paint
- [ ] Loader plays and then the page fades in (no flash of unstyled / no stuck loader).
- [ ] No console errors or warnings on load (DevTools console).
- [ ] No failed network requests (Network tab — 200s; favicon present, no 404s).
- [ ] Fonts (Cormorant Garamond, Inter) load without a long invisible-text flash.

## 2. Hero (WebGL atmosphere)
- [ ] FBM atmosphere renders (subtle ember/teal/ebony movement), no banding artifacts.
- [ ] Headline lines reveal (slide-up) once; chromatic aberration fades in after.
- [ ] Mouse-move parallax is smooth (D1/D2); no parallax expected on touch (D3/D4).
- [ ] D5 (no WebGL): hero still readable — background falls back gracefully, no black box.
- [ ] D6 (reduced motion): atmosphere is calm/low-fps, no aggressive movement.

## 3. Portfolio grid + WebGL image hover
- [ ] All project images load (the static `<img>` fallback is always visible).
- [ ] D1/D2 hover: displacement distortion engages smoothly, releases on leave.
- [ ] Scroll the grid fully in and out several times, then open DevTools → Performance
      Monitor: **JS heap and GPU memory do not climb monotonically** (texture-leak check).
- [ ] No "Too many active WebGL contexts" warning in console after heavy scrolling.
- [ ] D3/D4: tapping a card does not trigger a stuck hover state; grid scrolls smoothly.
- [ ] D5: cards show crisp static images, no broken/empty tiles.

## 4. Custom cursor
- [ ] D1/D2: native cursor hidden; custom dot + ring follow the mouse, ring lags smoothly.
- [ ] Hover over images → ring grows/dims; over buttons/links → ring + label state changes.
- [ ] D3/D4 (touch): **native behavior only — no custom cursor artifact in the top-left.**
- [ ] D6 (reduced motion, with mouse): native cursor is visible (not hidden).

## 5. Smooth scroll & transitions
- [ ] D1/D2: Lenis smooth scroll feels fluid; no jank, no double-scroll.
- [ ] ShredderTransition fires once when entering the portfolio section; strips animate cleanly.
- [ ] D6: native scrolling (no smooth-scroll hijack); ShredderTransition suppressed.
- [ ] Scroll-triggered reveals (About/Services/Contact) fire once and don't re-trigger.

## 6. Contact form (end-to-end, real Resend)
- [ ] Submit with empty required fields → blocked by browser validation.
- [ ] Submit with an invalid email → server rejects with a clear message.
- [ ] Submit a valid inquiry → "Message received." confirmation shown.
- [ ] The inquiry email actually arrives at the configured inbox; reply-to is the sender.
- [ ] Submit 6× rapidly from one client → 6th is rate-limited (429 / "Too many requests").
- [ ] Paste markup (e.g. `<b>x</b>`) into fields → the received email shows it as text, not HTML.

## 7. Navigation & links
- [ ] Nav "Contact" anchor scrolls to the contact section.
- [ ] Footer social links present (note: currently `href="#"` placeholders — confirm intended).
- [ ] Browser back/forward and refresh don't leave the page in a broken state.

## 8. Responsive layout (resize / real devices)
- [ ] 320px, 375px, 768px, 1024px, 1440px, 1920px: no horizontal scroll, no overlap/clipping.
- [ ] Headline `clamp()` scales without breaking layout at extremes.
- [ ] Contact form switches 1-col → 2-col at the md breakpoint correctly.

## 9. Accessibility pass
- [ ] Keyboard: Tab reaches nav, form fields, and the submit button in a sensible order.
- [ ] Visible focus indicator on all interactive elements.
- [ ] Screen reader (VoiceOver): single H1 announced; project images announced once (not twice).
- [ ] Color contrast of body copy on ebony passes (run axe / Lighthouse a11y).
- [ ] D6 honored throughout (sections 2–5 above).

## 10. Performance smoke (Lighthouse, mobile preset)
- [ ] LCP element identified and reasonable (< ~2.5s on a mid device).
- [ ] No large layout shift (CLS) as images/fonts load.
- [ ] Performance ≥ 85, Accessibility ≥ 95 (targets; record actuals below).

---

## Regression sign-off

| Area | D1 Chrome | D2 Safari | D3 iOS | D4 Android | D5 no-WebGL | D6 reduced-motion |
|------|-----------|-----------|--------|------------|-------------|-------------------|
| Load & paint | | | | | | |
| Hero | | | | | | |
| Portfolio hover | | | | | | |
| Cursor | | | | | | |
| Scroll/transitions | | | | | | |
| Contact form | | | | | | |
| Responsive | | | | | | |
| Accessibility | | | | | | |

**Lighthouse (mobile):** Perf ___ · A11y ___ · Best Practices ___ · SEO ___
**Tester / date / build (commit):** ______________________
