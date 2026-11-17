'use client'

import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

interface PostRow {
  slug: string
  title: string
  excerpt: string
  date: string
}

/** The journal index: entries rise in one by one, and the title steps in on hover like the project index. */
export default function PostList({ posts }: { posts: PostRow[] }) {
  const ref = useScrollReveal<HTMLUListElement>({ stagger: 'li' })
  return (
    <ul ref={ref} className="list-none p-0 m-0 divide-y divide-line">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/journal/${post.slug}`} className="group block py-8">
            <time className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver">{post.date}</time>
            <h2
              className="font-serif text-[clamp(1.5rem,3.5vw,2.4rem)] italic text-bone/90 group-hover:text-ember group-hover:translate-x-3 transition-[transform,color] duration-swift ease-premium mt-2"
              style={{ fontWeight: 300 }}
            >
              {post.title}
            </h2>
            <p className="font-sans text-[0.78rem] leading-relaxed text-silver mt-3 max-w-2xl">{post.excerpt}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
