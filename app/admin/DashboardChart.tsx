'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DailyView {
  date: string
  views: number
}

export default function AdminDashboardChart() {
  const [data, setData] = useState<DailyView[]>([])

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d: { dailyViews: DailyView[] }) => setData(d.dailyViews ?? []))
      .catch(() => {})
  }, [])

  if (!data.length) {
    return <p className="text-sm text-gray-400">No page view data yet.</p>
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium text-gray-600">Page views — last 30 days</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(d) => String(d).slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            labelFormatter={(d) => String(d)}
            formatter={(v) => [Number(v), 'views'] as [number, string]}
          />
          <Bar dataKey="views" fill="#1f2937" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
