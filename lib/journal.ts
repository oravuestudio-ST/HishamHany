import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// Server-only. Reads the in-repo MDX/Markdown journal at build time.
const DIR = path.join(process.cwd(), 'content', 'journal')

export interface JournalMeta {
  slug: string
  title: string
  date: string // ISO (YYYY-MM-DD)
  excerpt: string
}
export interface JournalPost extends JournalMeta {
  content: string // MDX/markdown body (frontmatter stripped)
}

// YAML auto-parses an unquoted `date: 2026-05-12` into a JS Date, so normalize
// both Date objects and strings to a YYYY-MM-DD string.
function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value ? String(value).slice(0, 10) : ''
}

function read(file: string): JournalPost {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8')
  const { data, content } = matter(raw)
  return {
    slug: file.replace(/\.mdx?$/, ''),
    title: typeof data.title === 'string' ? data.title : 'Untitled',
    date: normalizeDate(data.date),
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    content,
  }
}

/** All posts, newest first. */
export function getAllPosts(): JournalMeta[] {
  let files: string[]
  try {
    files = fs.readdirSync(DIR)
  } catch {
    return []
  }
  return files
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const { content, ...meta } = read(f)
      void content
      return meta
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): JournalPost | null {
  for (const ext of ['md', 'mdx']) {
    const p = path.join(DIR, `${slug}.${ext}`)
    if (fs.existsSync(p)) return read(`${slug}.${ext}`)
  }
  return null
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
