/**
 * Orders Page — Shows all ZStore orders from MongoDB.
 * Fetches orders via GET /orders and renders as a table.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { ShoppingCart } from 'lucide-react'

interface Order {
  orderId: string
  customerName: string
  productName: string
  quantity: number
  totalPrice: number
  branchName: string
  status: string
  orderDate: string
}

const statusVariant = (status: string) => {
  if (status === 'completed') return 'default' as const
  if (status === 'pending') return 'secondary' as const
  return 'destructive' as const
}

const fmt = (n: number) => `฿${n.toLocaleString()}`

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Order[]>('/orders')
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading orders...</p>

  if (orders.length === 0) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Empty className="min-h-100 border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><ShoppingCart /></EmptyMedia>
          <EmptyTitle>No orders yet</EmptyTitle>
          <EmptyDescription>Orders will appear here once customers start placing them.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.productName}</TableCell>
                  <TableCell className="text-center">{order.quantity}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(order.totalPrice)}</TableCell>
                  <TableCell>{order.branchName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
