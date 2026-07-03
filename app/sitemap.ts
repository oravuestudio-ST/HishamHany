import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { projects } from '@/lib/projects'
import { getAllPosts } from '@/lib/journal'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const work: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}/work/${p.slug}`,
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.7,
  }))

  const journal: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/journal/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: 'yearly',
    priority: 0.5,
  }))

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/portfolio`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/journal`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...work,
    ...journal,
  ]
}
