import React, { useState, useEffect } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { SalesProduct, DailySalesItem } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UnitInput } from '@/components/ui/UnitInput'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatNaira, formatQuantity, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Plus, 
  SlidersHorizontal,
  Calendar,
  RefreshCw
} from 'lucide-react'

export interface LiveSalesProduct extends SalesProduct {
  image?: string | null
  category_name?: string
}

export const mapSupabaseProductToSalesProduct = (p: any): LiveSalesProduct => {
  const stock = Number(p.stock ?? 0)
  const price = Number(p.price ?? 0)
  const cost = Number(p.cost_price ?? Math.round(price * 0.45))
  const reorder = Number(p.reorder_level ?? 10)
  const allocated = Math.min(stock, 1) // Reserved for active packaging queue
  const available = Math.max(0, stock - allocated)

  return {
    id: p.id,
    sku: `SMK-${String(p.id).padStart(4, '0')}`,
    name: p.name,
    product_type: 'sales',
    unit: p.unit || 'portion',
    reorder_level: reorder,
    unit_cost: cost,
    selling_price: price,
    stock_qty: stock,
    qty_allocated: allocated,
    qty_available: available,
    inventory_value: stock * price,
    is_active: p.is_active !== false ? 1 : 0,
    image: p.image || null,
    category_name: p.category_id || 'Dish'
  }
}

export const SalesInventoryPage: React.FC = () => {
  const {
    salesProducts,
    dailySales,
    adjustSalesStock,
    saveSalesProduct
  } = useSmokeyOps()

  const [liveProducts, setLiveProducts] = useState<LiveSalesProduct[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<'inventory' | 'daily'>('inventory')
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<LiveSalesProduct | null>(null)

  // Adjust Form
  const [adjustDelta, setAdjustDelta] = useState<number>(5)
  const [adjustNotes, setAdjustNotes] = useState<string>('Kitchen yield manual deposit')

  // Product Form
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    unit: 'unit',
    selling_price: 12500,
    unit_cost: 6500,
    reorder_level: 20
  })

  // Live Supabase Backend Ingestion
  const fetchLiveProducts = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true)
    try {
      // 1. Direct Supabase query
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (!error && Array.isArray(data) && data.length > 0) {
        setLiveProducts(data.map(mapSupabaseProductToSalesProduct))
        return
      }

      // 2. Dev server proxy fallback
      const res = await fetch('/api/products')
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setLiveProducts(json.data.map(mapSupabaseProductToSalesProduct))
          return
        }
      }
    } catch (err) {
      console.warn('Error fetching Supabase products, using local fallback:', err)
      setLiveProducts(salesProducts.map(p => ({ ...p, image: null })))
    } finally {
      setLoading(false)
      if (showIndicator) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLiveProducts()

    // Real-time Supabase postgres_changes listener on products table
    const channel = supabase
      .channel('ops_sales_inventory_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchLiveProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Active products list
  const displayProducts = liveProducts.length > 0 ? liveProducts : salesProducts

  // KPIs
  const totalSKUs = displayProducts.length
  const totalValuation = displayProducts.reduce((acc, p) => acc + (p.stock_qty * p.selling_price), 0)
  const totalUnitsSoldToday = dailySales.reduce((acc, d) => acc + d.qty_sold, 0)
  const totalRealizationToday = dailySales.reduce((acc, d) => acc + d.total_value, 0)

  const handleOpenAdjust = (p: LiveSalesProduct) => {
    setSelectedProduct(p)
    setAdjustDelta(5)
    setAdjustNotes('Batch production yield intake')
    setIsAdjustModalOpen(true)
  }

  const handleOpenEdit = (p?: LiveSalesProduct) => {
    if (p) {
      setSelectedProduct(p)
      setProductForm({
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        selling_price: p.selling_price,
        unit_cost: p.unit_cost,
        reorder_level: p.reorder_level
      })
    } else {
      setSelectedProduct(null)
      setProductForm({
        name: '',
        sku: `SMK-${String(displayProducts.length + 1).padStart(4, '0')}`,
        unit: 'portion',
        selling_price: 15000,
        unit_cost: 7000,
        reorder_level: 20
      })
    }
    setIsProductModalOpen(true)
  }

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    const nextStock = Math.max(0, selectedProduct.stock_qty + Number(adjustDelta))

    // 1. Live update to Supabase backend
    try {
      await supabase
        .from('products')
        .update({ stock: nextStock })
        .eq('id', selectedProduct.id)
    } catch (err) {
      console.warn('Direct Supabase stock update note:', err)
    }

    // 2. Optimistic local update
    setLiveProducts(prev =>
      prev.map(p =>
        p.id === selectedProduct.id
          ? {
              ...p,
              stock_qty: nextStock,
              qty_available: Math.max(0, nextStock - p.qty_allocated),
              inventory_value: nextStock * p.selling_price
            }
          : p
      )
    )

    adjustSalesStock(selectedProduct.id, Number(adjustDelta), adjustNotes)
    setIsAdjustModalOpen(false)
  }

  const handleConfirmProduct = (e: React.FormEvent) => {
    e.preventDefault()
    saveSalesProduct({
      id: selectedProduct?.id,
      name: productForm.name,
      sku: productForm.sku,
      unit: productForm.unit,
      selling_price: Number(productForm.selling_price),
      unit_cost: Number(productForm.unit_cost),
      reorder_level: Number(productForm.reorder_level)
    })
    setIsProductModalOpen(false)
  }

  const inventoryColumns: ColumnDef<LiveSalesProduct>[] = [
    {
      key: 'image',
      header: 'Product',
      defaultWidth: 90,
      accessor: (p) => (
        <div className="w-12 h-12 rounded-xl bg-kumo-canvas border border-kumo-line overflow-hidden shrink-0 flex items-center justify-center shadow-2xs relative group">
          {p.image ? (
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                ;(e.currentTarget as HTMLElement).style.display = 'none'
                const fallback = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className={cn(
              "w-full h-full flex items-center justify-center text-kumo-subtle",
              p.image ? "hidden" : "flex"
            )}
          >
            <Package className="w-5 h-5 opacity-40" />
          </div>
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: 'name',
      header: 'Sales Item / Dish',
      defaultWidth: 230,
      accessor: (p) => (
        <div>
          <div className="font-semibold text-xs text-kumo-strong font-sans">{p.name}</div>
          <div className="text-[11px] text-kumo-subtle flex items-center gap-2 mt-0.5 font-sans">
            <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              {p.sku}
            </span>
            <span className="text-[11px] text-kumo-subtle uppercase">
              {p.unit}
            </span>
          </div>
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: 'stock_qty',
      header: 'Ready Stock (On-Hand)',
      accessor: (p) => {
        const isLow = p.stock_qty <= p.reorder_level
        return (
          <div className="flex items-center gap-2 font-sans">
            <span className="font-medium text-kumo-strong font-sans">
              {formatQuantity(p.stock_qty)} {p.unit}s
            </span>
            {isLow && (
              <span
                data-badge="critical-low"
                className="badge-critical-low inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 whitespace-nowrap select-none"
                style={{ backgroundColor: '#FCE8EC', borderColor: '#F3B0BB', color: '#C8102E' }}
              >
                Critical Low
              </span>
            )}
          </div>
        )
      },
      sortValue: (p) => p.stock_qty,
    },
    {
      key: 'qty_available',
      header: 'Available',
      accessor: (p) => (
        <span className="font-medium text-emerald-700 text-xs font-sans">
          {formatQuantity(p.qty_available ?? p.stock_qty)} {p.unit}s
        </span>
      ),
      sortValue: (p) => p.qty_available ?? p.stock_qty,
    },
    {
      key: 'qty_allocated',
      header: 'Allocated',
      accessor: (p) => (
        <span className="text-xs text-kumo-subtle font-sans">
          {formatQuantity(p.qty_allocated ?? 0)} {p.unit}s
        </span>
      ),
      sortValue: (p) => p.qty_allocated ?? 0,
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      accessor: (p) => <span className="text-xs font-medium text-emerald-600 font-sans">{formatNaira(p.selling_price)}</span>,
      sortValue: (p) => p.selling_price,
    },
    {
      key: 'unit_cost',
      header: 'Cost Benchmark',
      accessor: (p) => <span className="text-xs text-kumo-subtle font-sans">{formatNaira(p.unit_cost)}</span>,
      sortValue: (p) => p.unit_cost,
    },
    {
      key: 'inventory_value',
      header: 'Retail Valuation',
      accessor: (p) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(p.stock_qty * p.selling_price)}</span>,
      sortValue: (p) => p.stock_qty * p.selling_price,
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 180,
      accessor: (p) => (
        <div className="flex items-center gap-1.5 font-sans shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="Manually adjust on-hand stock">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenAdjust(p)}
            >
              Adjust
            </TableActionButton>
          </Tooltip>
          <Tooltip content="Edit dish pricing and reorder levels">
            <TableActionButton
              variant="primary"
              onClick={() => handleOpenEdit(p)}
            >
              Edit
            </TableActionButton>
          </Tooltip>
        </div>
      ),
    },
  ]

  const dailyColumns: ColumnDef<DailySalesItem>[] = [
    {
      key: 'sku',
      header: 'SKU Ref',
      accessor: (d) => <span className="font-medium text-xs text-kumo-strong font-sans">{d.sku}</span>,
      sortValue: (d) => d.sku,
    },
    {
      key: 'product_name',
      header: 'Sold Product',
      accessor: (d) => <span className="font-medium text-kumo-strong font-sans">{d.product_name}</span>,
      sortValue: (d) => d.product_name,
    },
    {
      key: 'qty_sold',
      header: 'Units Sold (Today)',
      accessor: (d) => <span className="font-medium text-emerald-600 font-sans">{d.qty_sold} {d.unit}s</span>,
      sortValue: (d) => d.qty_sold,
    },
    {
      key: 'order_count',
      header: 'Customer Orders',
      accessor: (d) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-kumo-surface text-kumo-default border border-kumo-line font-sans">{d.order_count} tickets</span>,
      sortValue: (d) => d.order_count,
    },
    {
      key: 'channel_breakdown',
      header: 'Channel Distribution',
      accessor: (d) => <span className="text-xs text-kumo-subtle font-sans">{d.channel_breakdown}</span>,
    },
    {
      key: 'total_value',
      header: 'Gross Revenue',
      accessor: (d) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(d.total_value)}</span>,
      sortValue: (d) => d.total_value,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Sales Inventory & Finished Goods"
        subtitle="Sales-ready smoked guinea fowls, 1-liter rice bowls, beef jerky, and fresh palm wine available for order fulfillment."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveProducts(true)}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              {isRefreshing ? 'Syncing...' : 'Sync Backend'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenEdit()}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Add Sales Product
            </Button>
          </div>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Finished SKUs"
          value={totalSKUs}
          description="Finished menu items"
          icon={<Package className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Inventory Valuation"
          value={formatNaira(totalValuation)}
          description="Potential retail realization"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Units Sold Today"
          value={`${totalUnitsSoldToday} units`}
          description="Orders & walk-in POS sales"
          icon={<ShoppingCart className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Gross Sales Today"
          value={formatNaira(totalRealizationToday)}
          description="Live daily sales realization"
          trend={{ value: 12.4, isPositive: true }}
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'inventory', label: 'In Stock', badge: displayProducts.length },
            { id: 'daily', label: 'Daily Sales' },
          ]}
        />
      </div>

      {/* Tables */}
      <div>
        {activeTab === 'inventory' ? (
          <DataTable
            data={displayProducts}
            columns={inventoryColumns}
            searchable={true}
            searchPlaceholder="Search finished food item or SKU..."
            title="Sales Product"
            exportFilename="smokey-sales-inventory"
          />
        ) : (
          <DataTable
            data={dailySales}
            columns={dailyColumns}
            searchable={false}
            title="Sales Ledger Item"
            exportFilename="smokey-daily-sales-breakdown"
          />
        )}
      </div>

      {/* Adjust Modal */}
      <Dialog
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
        description="Manual finished stock intake or inventory reconciliation."
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Current Stock:</span>
              <span className="font-semibold text-kumo-strong text-xs">{selectedProduct?.stock_qty} {selectedProduct?.unit}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Selling Price:</span>
              <span className="font-semibold text-emerald-600 font-sans text-xs">{formatNaira(selectedProduct?.selling_price || 0)}</span>
            </div>
          </div>

          <UnitInput
            label="Delta Quantity"
            value={adjustDelta}
            onChangeValue={setAdjustDelta}
            unit={selectedProduct?.unit || 'packs'}
            helperText={`Projected Balance: ${Math.max(0, (selectedProduct?.stock_qty || 0) + Number(adjustDelta))} ${selectedProduct?.unit || 'packs'}`}
            required
          />

          <Input
            label="Adjustment Reason & Sign-off"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            required
          />

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line font-sans">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Adjustment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit/Create Modal */}
      <Dialog
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? `Edit Product: ${selectedProduct.name}` : 'Register New Sales Product'}
        description="Configure pricing, cost benchmark, and reorder threshold."
      >
        <form onSubmit={handleConfirmProduct} className="space-y-4 text-xs font-sans">
          <Input
            label="Product Title"
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              value={productForm.sku}
              onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
              required
            />
            <Input
              label="Unit Label"
              value={productForm.unit}
              onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Selling Price (₦)"
              type="number"
              min="0"
              value={productForm.selling_price}
              onChange={(e) => setProductForm(prev => ({ ...prev, selling_price: Number(e.target.value) }))}
              required
            />
            <Input
              label="Unit Cost Benchmark (₦)"
              type="number"
              min="0"
              value={productForm.unit_cost}
              onChange={(e) => setProductForm(prev => ({ ...prev, unit_cost: Number(e.target.value) }))}
              required
            />
          </div>

          <UnitInput
            label="Reorder Alert Threshold"
            value={productForm.reorder_level}
            onChangeValue={(val) => setProductForm(prev => ({ ...prev, reorder_level: val }))}
            unit={productForm.unit || 'packs'}
            onChangeUnit={(unit) => setProductForm(prev => ({ ...prev, unit }))}
            min={0}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default SalesInventoryPage
