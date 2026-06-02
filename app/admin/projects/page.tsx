export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { projects } from '@/drizzle/schema'
import { asc } from 'drizzle-orm'
import ProjectsTableClient from './ProjectsTableClient'

export default async function AdminProjectsPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  const rows = await db.select().from(projects).orderBy(asc(projects.order))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          + New project
        </Link>
      </div>
      <ProjectsTableClient initialProjects={rows} />
    </div>
  )
}
