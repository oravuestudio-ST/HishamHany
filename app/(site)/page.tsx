import type { Metadata } from 'next'
import HomeClient from '@/components/home/HomeClient'
import ProjectIndex from '@/components/home/ProjectIndex'
import { getChapters } from '@/lib/chapters'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/**
 * Home — server shell. Metadata lives here (client components can't export
 * it). The exhibition is curated server-side (lib/chapters reads image
 * dimensions from disk, which never ship to the client) and handed down as
 * plain data; the project index is a server component passed through as
 * children, so it costs no client JavaScript at all.
 */
export default function Home() {
  return (
    <HomeClient chapters={getChapters()}>
      <ProjectIndex />
    </HomeClient>
  )
}
