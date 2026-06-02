export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import ProjectForm from '../ProjectForm'

export default async function NewProjectPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">New project</h1>
      <ProjectForm />
    </div>
  )
}
