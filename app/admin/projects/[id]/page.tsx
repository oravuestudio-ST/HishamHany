export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { projects } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import ProjectForm from '../ProjectForm'

export default async function EditProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  const id = Number(params.id)
  const [project] = await db.select().from(projects).where(eq(projects.id, id))
  if (!project) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Edit project</h1>
      <ProjectForm project={project} />
    </div>
  )
}
