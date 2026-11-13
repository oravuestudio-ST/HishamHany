'use client'

import { useEffect } from 'react'
import type { ExperimentEvent } from '@/lib/experiments'
import { trackExperiment } from '@/lib/track-experiment'

/** Logs one A/B event when mounted; renders nothing. */
export default function ExperimentBeacon({ event }: { event: ExperimentEvent }) {
  useEffect(() => { trackExperiment(event) }, [event])
  return null
}
