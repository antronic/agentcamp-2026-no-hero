/**
 * Products Page — Displays the ZStore product catalog from MongoDB.
 * Fetches products via GET /products. Supports creating new products.
 */

import { useState, useEffect, type FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Package, Plus, Loader2 } from 'lucide-react'

const CATEGORIES = ['Smartphones', 'Audio', 'Tablets', 'Wearables', 'Laptops', 'Gaming', 'Accessories']

interface Product {
  productId: string
  name: string
  category: string
  description: string
  price: number
  currency: string
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  const load = () => {
    setLoading(true)
    apiFetch<Product[]>('/products')
      .then(setProducts)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const fmt = (n: number) => `฿${n.toLocaleString()}`

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const product = {
      productId: fd.get('productId') as string,
      name: fd.get('name') as string,
      category: selectedCategory,
      description: fd.get('description') as string,
      price: Number(fd.get('price')),
      currency: 'THB',
    }
    try {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(product) })
      setDialogOpen(false)
      setSelectedCategory('')
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading products...</p>

  // ── Create Product Dialog ──────────────────────────────────────────────
  // onOpenChange blocked while saving to prevent accidental close.
  // onInteractOutside + onEscapeKeyDown also blocked during save.
  const createDialog = (
    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!saving) setDialogOpen(open) }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Product
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => { if (saving) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (saving) e.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
          <DialogDescription>
            Add a new product to the ZStore catalog. An embedding will be generated automatically for vector search.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input id="productId" name="productId" placeholder="ZS-009" required disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={saving} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Product name" required disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Detailed product description — this text is used for AI-powered search." rows={3} required disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (THB)</Label>
            <Input id="price" name="price" type="number" placeholder="9990" required disabled={saving} />
          </div>
          <DialogFooter>
            <Button variant="ghost" type="button" disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !selectedCategory}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creating & Embedding...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{products.length} items</Badge>
          {createDialog}
        </div>
      </div>

      {products.length === 0 && (
        <Empty className="min-h-100 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Package /></EmptyMedia>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>
              Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">bun run seed</code> to load sample data, or create your first product.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {createDialog}
          </EmptyContent>
        </Empty>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.productId} className="flex flex-col">
            <div className="flex h-32 items-center justify-center rounded-t-lg bg-muted">
              <span className="text-3xl">📦</span>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{product.category}</Badge>
                <span className="text-xs text-muted-foreground">{product.productId}</span>
              </div>
              <CardTitle className="text-base">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-2">
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="text-lg font-bold text-primary">{fmt(product.price)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
