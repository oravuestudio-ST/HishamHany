'use client'

import { HERO_EXPERIMENT, parseAssignment, type Assignment, type ExperimentEvent } from '@/lib/experiments'

/** The visitor's hero-test assignment from the cookie middleware set, if any. */
export function readHeroAssignment(): Assignment | null {
  if (typeof document === 'undefined') return null
  const prefix = `${HERO_EXPERIMENT.cookie}=`
  const raw = document.cookie.split('; ').find((c) => c.startsWith(prefix))
  return parseAssignment(raw ? decodeURIComponent(raw.slice(prefix.length)) : null)
}

/**
 * Records one experiment event. Fire-and-forget: never throws, never blocks
 * navigation (sendBeacon survives the page unloading on a CTA click), and does
 * nothing for visitors outside the experiment.
 */
export function trackExperiment(event: ExperimentEvent): void {
  try {
    const a = readHeroAssignment()
    if (!a) return
    const body = JSON.stringify({
      experiment: HERO_EXPERIMENT.id,
      variant: a.variant,
      visitorId: a.visitorId,
      event,
      path: window.location.pathname,
    })
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon?.('/api/ab', blob)) return
    void fetch('/api/ab', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })
      .catch(() => {})
  } catch {
    /* tracking must never break the page */
  }
}
