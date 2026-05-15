/**
 * Inventory Page — Stock levels from MongoDB, grouped by product.
 * Fetches via GET /inventory and pivots into a branch-column table.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Warehouse } from 'lucide-react'

interface InvRecord {
  productId: string
  productName: string
  branchId: string
  branchName: string
  availableQty: number
}

// Pivot flat records into { productId, productName, branches: { branchName: qty }, total }
function pivot(records: InvRecord[]) {
  const map = new Map<string, { productId: string; productName: string; branches: Record<string, number>; total: number }>()
  for (const r of records) {
    let entry = map.get(r.productId)
    if (!entry) {
      entry = { productId: r.productId, productName: r.productName, branches: {}, total: 0 }
      map.set(r.productId, entry)
    }
    entry.branches[r.branchName] = r.availableQty
    entry.total += r.availableQty
  }
  return Array.from(map.values())
}

function StockBadge({ qty }: { qty: number | undefined }) {
  if (qty === undefined || qty === 0) return <Badge variant="destructive">Out</Badge>
  if (qty <= 5) return <Badge variant="secondary">{qty}</Badge>
  return <span className="text-sm">{qty}</span>
}

export function InventoryPage() {
  const [raw, setRaw] = useState<InvRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<InvRecord[]>('/inventory')
      .then(setRaw)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted-foreground">Loading inventory...</p>

  if (raw.length === 0) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Report</h1>
      <Empty className="min-h-100 border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Warehouse /></EmptyMedia>
          <EmptyTitle>No inventory data</EmptyTitle>
          <EmptyDescription>Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">bun run seed</code> to load inventory data.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )

  const inventory = pivot(raw)
  // Collect all unique branch names for column headers
  const branches = [...new Set(raw.map((r) => r.branchName))]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Report</h1>

      <Card>
        <CardHeader>
          <CardTitle>Stock by Product & Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>ID</TableHead>
                {branches.map((b) => (
                  <TableHead key={b} className="text-center">{b}</TableHead>
                ))}
                <TableHead className="text-center font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.productId}</TableCell>
                  {branches.map((b) => (
                    <TableCell key={b} className="text-center"><StockBadge qty={item.branches[b]} /></TableCell>
                  ))}
                  <TableCell className="text-center font-bold">{item.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
