import './admin.css'
import Link from 'next/link'

export const metadata = { title: 'Admin — Hisham Hany' }

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/analytics', label: 'Analytics' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-sm text-gray-800 mr-4">HH Admin</span>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {item.label}
          </Link>
        ))}
        <div className="ml-auto">
          <form action="/api/admin/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
