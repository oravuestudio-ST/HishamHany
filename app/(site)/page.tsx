import type { Metadata } from 'next'
import HomeClient from '@/components/home/HomeClient'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/**
 * Home — server shell. Metadata and canonical live here (client components
 * can't export them); the cinematic experience, including the server-rendered
 * SEO intro that paints before hydration, lives in HomeClient.
 */
export default function Home() {
  return <HomeClient />
}
