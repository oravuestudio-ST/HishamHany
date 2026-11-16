import type { Metadata } from 'next'
import Link from 'next/link'
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
          <ul className="list-none p-0 m-0 divide-y divide-line">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/journal/${post.slug}`} className="group block py-8">
                  <time className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver">
                    {formatDate(post.date)}
                  </time>
                  <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2.4rem)] italic text-bone/90 group-hover:text-ember transition-colors mt-2" style={{ fontWeight: 300 }}>
                    {post.title}
                  </h2>
                  <p className="font-sans text-[0.78rem] leading-relaxed text-silver mt-3 max-w-2xl">
                    {post.excerpt}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
