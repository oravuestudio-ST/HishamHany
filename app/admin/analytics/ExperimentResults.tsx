import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ab_events } from '@/drizzle/schema'
import {
  HERO_EXPERIMENT,
  MIN_SAMPLE_PER_ARM,
  twoProportionTest,
  type ExperimentEvent,
} from '@/lib/experiments'

const ROWS: { event: ExperimentEvent; label: string; role: string }[] = [
  { event: 'contact_view', label: 'Reached /contact', role: 'Primary' },
  { event: 'inquiry_submit', label: 'Sent an inquiry', role: 'Secondary' },
  { event: 'scroll_past_hero', label: 'Scrolled past the hero', role: 'Guardrail' },
  { event: 'hero_cta_click', label: 'Clicked the hero CTA (B only)', role: 'Diagnostic' },
]

const pct = (v: number) => `${(v * 100).toFixed(1)}%`

/**
 * Hero A/B results: distinct visitors per arm, each event as a share of the
 * visitors exposed to that arm, and a two-proportion z-test on B vs A. A
 * result is only called once both arms reach MIN_SAMPLE_PER_ARM.
 */
export default async function ExperimentResults() {
  let counts: { variant: string; event: string; visitors: number }[] = []
  try {
    counts = await db
      .select({
        variant: ab_events.variant,
        event: ab_events.event,
        visitors: sql<number>`count(distinct ${ab_events.visitor_id})::int`,
      })
      .from(ab_events)
      .where(eq(ab_events.experiment, HERO_EXPERIMENT.id))
      .groupBy(ab_events.variant, ab_events.event)
  } catch {
    // Table not migrated yet — show the empty state rather than failing the page.
  }

  const n = (variant: string, event: string) =>
    counts.find((r) => r.variant === variant && r.event === event)?.visitors ?? 0
  const nA = n('a', 'exposure')
  const nB = n('b', 'exposure')
  const ready = nA >= MIN_SAMPLE_PER_ARM && nB >= MIN_SAMPLE_PER_ARM

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-gray-600">A/B test: hero commission CTA ({HERO_EXPERIMENT.id})</h2>
      <p className="mb-4 text-xs text-gray-500">
        Exposed visitors: A {nA} · B {nB}.{' '}
        {ready
          ? 'Minimum sample reached: a result is significant at p < 0.05.'
          : `Collecting. No call until both arms reach ${MIN_SAMPLE_PER_ARM} visitors.`}
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Metric</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">A (control)</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">B (CTA)</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Lift</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">p-value</th>
              <th className="px-4 py-3 font-medium text-gray-600">Read</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {ROWS.map(({ event, label, role }) => {
              const cA = n('a', event)
              const cB = n('b', event)
              const t = twoProportionTest(nA, cA, nB, cB)
              const significant = ready && t.p < 0.05 && event !== 'hero_cta_click'
              return (
                <tr key={event} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {label} <span className="text-xs text-gray-400">· {role}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{pct(t.rateA)} <span className="text-xs text-gray-400">({cA})</span></td>
                  <td className="px-4 py-3 text-right text-gray-900">{pct(t.rateB)} <span className="text-xs text-gray-400">({cB})</span></td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {t.lift === null ? '—' : `${t.lift >= 0 ? '+' : ''}${(t.lift * 100).toFixed(0)}%`}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">{t.p.toFixed(3)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {event === 'hero_cta_click'
                      ? 'B only'
                      : significant
                        ? t.rateB > t.rateA ? 'B wins' : 'B loses'
                        : 'Not significant'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
