import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'browser',
    // Atelier constants — ink on paper.
    background_color: '#ECE7DC',
    theme_color: '#16140F',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/apple-icon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
  }
}
