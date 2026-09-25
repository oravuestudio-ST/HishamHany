export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { testimonials } from '@/drizzle/schema'
import { desc } from 'drizzle-orm'
import TestimonialsTableClient from './TestimonialsTableClient'

export default async function AdminTestimonialsPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  const rows = await db
    .select()
    .from(testimonials)
    .orderBy(desc(testimonials.created_at))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Testimonials</h1>
        <Link
          href="/admin/testimonials/new"
          className="admin-btn"
        >
          + New testimonial
        </Link>
      </div>
      <TestimonialsTableClient initialTestimonials={rows} />
    </div>
  )
}
