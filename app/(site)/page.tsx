import type { Metadata } from 'next'
import HomeClient from '@/components/home/HomeClient'
import { getLookbookImages } from '@/lib/galleries'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/**
 * Home — server shell. Metadata and canonical live here (client components
 * can't export them); the cinematic experience, including the server-rendered
 * SEO intro that paints before hydration, lives in HomeClient. The lookbook
 * spread is curated server-side (manifest + dimensions never ship to the
 * client) and handed down as plain data.
 */
export default function Home() {
  return <HomeClient lookbook={getLookbookImages()} />
}
