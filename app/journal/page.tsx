import type { Metadata } from 'next'
import Link from 'next/link'
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
    <main className="min-h-screen bg-ebony text-bone">
      <header className="flex items-center justify-between px-6 md:px-12 py-8">
        <Link href="/" className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver/60 hover:text-bone transition-colors">
          ← {SITE.name}
        </Link>
      </header>

      <section className="px-6 md:px-12 pt-10 pb-16 max-w-4xl">
        <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-silver/40 mb-6">Journal</p>
        <h1 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] italic text-bone" style={{ fontWeight: 300 }}>
          Notes on light
        </h1>
      </section>

      <section className="px-6 md:px-12 pb-24 max-w-3xl">
        {posts.length === 0 ? (
          <p className="font-sans text-[0.75rem] text-silver/50">No entries yet.</p>
        ) : (
          <ul className="list-none p-0 m-0 divide-y divide-bone/10">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/journal/${post.slug}`} className="group block py-8">
                  <time className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/40">
                    {formatDate(post.date)}
                  </time>
                  <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2.4rem)] italic text-bone/90 group-hover:text-ember transition-colors mt-2" style={{ fontWeight: 300 }}>
                    {post.title}
                  </h2>
                  <p className="font-sans text-[0.78rem] leading-relaxed text-silver/55 mt-3 max-w-2xl">
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
