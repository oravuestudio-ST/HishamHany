import type { Metadata } from 'next'
import PostList from '@/components/journal/PostList'
import PageHeader from '@/components/PageHeader'
import { getAllPosts, formatDate } from '@/lib/journal'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `Journal — ${SITE.name}`,
  description: 'Notes on light, composition, and the craft of commercial photography.',
  alternates: { canonical: '/journal' },
}

export default function JournalIndex() {
  const posts = getAllPosts()

  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-bg text-fg">
      <PageHeader eyebrow="Journal" title="Notes" accent="on light" />

      <section className="px-6 md:px-12 pb-24 max-w-3xl">
        {posts.length === 0 ? (
          <p className="font-sans text-[0.75rem] text-silver">No entries yet.</p>
        ) : (
          <PostList posts={posts.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, date: formatDate(p.date) }))} />
        )}
      </section>
    </main>
  )
}
