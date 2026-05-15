/**
 * Dashboard Page — Overview of ZStore key metrics from MongoDB.
 * Fetches products, orders, and inventory data via the API.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

const fmt = (n: number) => `฿${n.toLocaleString()}`

export function DashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, lowStock: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/sales-report'),
      apiFetch<any[]>('/products'),
      apiFetch<any[]>('/inventory'),
      apiFetch<any[]>('/orders'),
    ]).then(([sales, products, inventory, orders]) => {
      const lowStock = inventory.filter((i: any) => i.availableQty <= 5).length
      setStats({
        revenue: sales.totalRevenue,
        orders: sales.totalOrders,
        products: products.length,
        lowStock,
      })
      setRecentOrders(orders.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading dashboard...</p>

  const cards = [
    { title: 'Total Revenue', value: fmt(stats.revenue), icon: TrendingUp },
    { title: 'Total Orders', value: String(stats.orders), icon: ShoppingCart },
    { title: 'Products', value: String(stats.products), icon: Package },
    { title: 'Low Stock Alerts', value: String(stats.lowStock), icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><ShoppingCart /></EmptyMedia>
                <EmptyTitle>No recent orders</EmptyTitle>
                <EmptyDescription>Orders will appear here once customers start placing them.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div key={order.orderId} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{order.productName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerName} · {order.orderId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{fmt(order.totalPrice)}</span>
                    <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
