/**
 * Sales Report Page — Revenue and order statistics from MongoDB.
 * Fetches aggregated data via GET /sales-report.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'

interface SalesReport {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  totalRevenue: number
  avgOrderValue: number
  byProduct: { name: string; revenue: number; orders: number; statuses: string[] }[]
}

export function SalesReportPage() {
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<SalesReport>('/sales-report')
      .then(setReport)
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => `฿${n.toLocaleString()}`

  if (loading || !report) return <p className="text-muted-foreground">Loading sales report...</p>
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales Report</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{fmt(report.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.completedOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.cancelledOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(report.avgOrderValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by product */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.byProduct.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.orders} order(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{fmt(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
