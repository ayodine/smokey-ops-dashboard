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
import { Toggle } from '@/components/ui/Toggle'
import { Tooltip } from '@/components/ui/Tooltip'
import { FileUpload } from '@/components/ui/FileUpload'
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
  RefreshCw,
  Flame,
  Clock,
  CheckCircle2,
  Eye
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
  const allocated = Number(p.qty_allocated ?? 0)
  const available = Math.max(0, stock - allocated)

  return {
    id: p.id,
    sku: `SMK-${String(p.id).padStart(4, '0')}`,
    name: p.name,
    product_type: 'sales',
    unit: p.unit || 'unit',
    reorder_level: reorder,
    unit_cost: cost,
    selling_price: price,
    stock_qty: stock,
    qty_allocated: allocated,
    qty_available: available,
    inventory_value: stock * price,
    is_active: p.is_active !== false ? 1 : 0,
    image: p.image || null,
    category_name: p.category_id || 'Product'
  }
}

export const SalesInventoryPage: React.FC = () => {
  const {
    salesProducts,
    liveSalesProducts: liveProducts,
    setLiveSalesProducts: setLiveProducts,
    refreshLiveSalesProducts: fetchLiveProducts,
    isSalesProductsRefreshing: isRefreshing,
    productionBatches,
    dailySales,
    adjustSalesStock,
    saveSalesProduct
  } = useSmokeyOps()

  // Calculate live incoming batch buffers per dish from ongoing/scheduled production runs
  const incomingByDish = React.useMemo(() => {
    const map: Record<string, { qty: number; batches: typeof productionBatches }> = {}
    productionBatches.forEach(b => {
      if ((b.status === 'draft' || b.status === 'in_production') && b.feed_sales_inventory !== false) {
        const keyId = String(b.output_product_id)
        const keyName = b.output_product_name.toLowerCase().trim()

        if (!map[keyId]) map[keyId] = { qty: 0, batches: [] }
        map[keyId].qty += b.expected_output
        map[keyId].batches.push(b)

        if (!map[keyName]) map[keyName] = { qty: 0, batches: [] }
        map[keyName].qty += b.expected_output
        map[keyName].batches.push(b)
      }
    })
    return map
  }, [productionBatches])

  const [loading] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<'inventory' | 'daily'>('inventory')
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<LiveSalesProduct | null>(null)
  const [selectedDetailsProduct, setSelectedDetailsProduct] = useState<LiveSalesProduct | null>(null)

  const handleOpenDetails = (p: LiveSalesProduct) => {
    setSelectedDetailsProduct(p)
    setIsDetailsModalOpen(true)
  }

  // Adjust Form
  const [adjustDelta, setAdjustDelta] = useState<number>(5)
  const [adjustNotes, setAdjustNotes] = useState<string>('Kitchen yield manual deposit')

  // Product Form
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category_id: 'mains',
    unit: 'portion',
    stock_qty: 0,
    selling_price: 15000,
    unit_cost: 7000,
    reorder_level: 20,
    image: '',
    short_desc: '',
    is_active: true
  })

  // Active products list
  const displayProducts = liveProducts.length > 0 ? liveProducts : salesProducts

  // KPIs
  const totalSKUs = displayProducts.length
  const totalValuation = displayProducts.reduce((acc, p) => acc + (p.stock_qty * p.selling_price), 0)
  const totalUnitsSoldToday = dailySales.reduce((acc, d) => acc + d.qty_sold, 0)
  const totalRealizationToday = dailySales.reduce((acc, d) => acc + d.total_value, 0)
  const totalIncomingUnits = React.useMemo(() => {
    return productionBatches
      .filter(b => (b.status === 'draft' || b.status === 'in_production') && b.feed_sales_inventory !== false)
      .reduce((acc, b) => acc + (b.expected_output || 0), 0)
  }, [productionBatches])

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
        category_id: p.category_name || 'mains',
        unit: p.unit || 'portion',
        stock_qty: p.stock_qty || 0,
        selling_price: p.selling_price || 15000,
        unit_cost: p.unit_cost || 7000,
        reorder_level: p.reorder_level || 20,
        image: p.image || '',
        short_desc: '',
        is_active: p.is_active !== 0
      })
    } else {
      setSelectedProduct(null)
      setProductForm({
        name: '',
        sku: `SMK-${String(displayProducts.length + 1).padStart(4, '0')}`,
        category_id: 'mains',
        unit: 'portion',
        stock_qty: 0,
        selling_price: 15000,
        unit_cost: 7000,
        reorder_level: 20,
        image: '',
        short_desc: '',
        is_active: true
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

  const handleConfirmProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    const stock = Number(productForm.stock_qty)
    const price = Number(productForm.selling_price)
    const cost = Number(productForm.unit_cost)
    const reorder = Number(productForm.reorder_level)

    const targetId = selectedProduct?.id ?? Date.now()

    const productPayload = {
      id: targetId,
      name: productForm.name,
      sku: productForm.sku,
      unit: productForm.unit,
      stock_qty: stock,
      selling_price: price,
      unit_cost: cost,
      reorder_level: reorder,
      image: productForm.image ? productForm.image.trim() : null,
      category_name: productForm.category_id,
      is_active: productForm.is_active ? 1 : 0
    }

    // 1. Optimistic local update in state
    if (selectedProduct?.id) {
      setLiveProducts(prev => prev.map(p => p.id === selectedProduct.id ? {
        ...p,
        ...productPayload,
        inventory_value: stock * price,
        qty_available: Math.max(0, stock - (p.qty_allocated || 0))
      } : p))
    } else {
      const newCreated: LiveSalesProduct = {
        product_type: 'sales',
        qty_allocated: 0,
        qty_available: stock,
        inventory_value: stock * price,
        ...productPayload,
        id: targetId
      }
      setLiveProducts(prev => [newCreated, ...prev])
    }

    // 2. Save in context
    saveSalesProduct({
      ...productPayload,
      id: selectedProduct?.id
    })

    // 3. Persist to Supabase if available
    try {
      if (selectedProduct?.id) {
        fetch('/api/update-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedProduct.id,
            updates: {
              name: productForm.name,
              price: price,
              cost_price: cost,
              stock: stock,
              image: productForm.image ? productForm.image.trim() : null,
              category_id: productForm.category_id,
              short_desc: productForm.short_desc || null,
              is_active: productForm.is_active
            }
          })
        }).catch(() => {})

        await supabase
          .from('products')
          .update({
            name: productForm.name,
            price: price,
            cost_price: cost,
            stock: stock,
            image: productForm.image ? productForm.image.trim() : null,
            category_id: productForm.category_id,
            short_desc: productForm.short_desc || null,
            is_active: productForm.is_active
          })
          .eq('id', selectedProduct.id)
      } else {
        await supabase
          .from('products')
          .insert({
            name: productForm.name,
            price: price,
            cost_price: cost,
            stock: stock,
            image: productForm.image ? productForm.image.trim() : null,
            category_id: productForm.category_id,
            short_desc: productForm.short_desc || null,
            is_active: productForm.is_active
          })
      }
    } catch (err) {
      console.warn('Direct Supabase product save note:', err)
    }

    setIsProductModalOpen(false)
  }

  const inventoryColumns: ColumnDef<LiveSalesProduct>[] = [
    {
      key: 'name',
      header: 'Product / Dish',
      defaultWidth: 280,
      accessor: (p) => (
        <div className="flex items-center gap-3 font-sans">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative">
            {p.image ? (
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover"
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
                "w-full h-full flex items-center justify-center text-zinc-400",
                p.image ? "hidden" : "flex"
              )}
            >
              <Package className="w-4 h-4 opacity-50" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-xs text-zinc-800 dark:text-zinc-200 truncate">{p.name}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {p.sku} • {p.unit.toUpperCase()}
            </div>
          </div>
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: 'stock_qty',
      header: 'Physical (On-Hand)',
      defaultWidth: 150,
      accessor: (p) => (
        <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300 font-sans">
          {formatQuantity(p.stock_qty)} {p.unit}s
        </span>
      ),
      sortValue: (p) => p.stock_qty,
    },
    {
      key: 'estimated_incoming_qty',
      header: 'Estimated (In-Oven)',
      defaultWidth: 150,
      accessor: (p) => {
        const incomingInfo = incomingByDish[String(p.id)] || incomingByDish[p.name.toLowerCase().trim()]
        const incomingQty = incomingInfo ? incomingInfo.qty : (p.estimated_incoming_qty || 0)

        return (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            {incomingQty > 0 ? `+${formatQuantity(incomingQty)} ${p.unit}s` : '—'}
          </span>
        )
      },
      sortValue: (p) => {
        const incomingInfo = incomingByDish[String(p.id)] || incomingByDish[p.name.toLowerCase().trim()]
        return incomingInfo ? incomingInfo.qty : (p.estimated_incoming_qty || 0)
      },
    },
    {
      key: 'sellable_qty',
      header: 'Total Sellable (Online)',
      defaultWidth: 165,
      accessor: (p) => {
        const incomingInfo = incomingByDish[String(p.id)] || incomingByDish[p.name.toLowerCase().trim()]
        const incomingQty = incomingInfo ? incomingInfo.qty : (p.estimated_incoming_qty || 0)
        const allocated = p.qty_allocated || 0
        const sellable = Math.max(0, p.stock_qty + incomingQty - allocated)

        return (
          <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300 font-sans">
            {formatQuantity(sellable)} {p.unit}s
          </span>
        )
      },
      sortValue: (p) => {
        const incomingInfo = incomingByDish[String(p.id)] || incomingByDish[p.name.toLowerCase().trim()]
        const incomingQty = incomingInfo ? incomingInfo.qty : (p.estimated_incoming_qty || 0)
        return Math.max(0, p.stock_qty + incomingQty - (p.qty_allocated || 0))
      },
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      accessor: (p) => <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 font-sans">{formatNaira(p.selling_price)}</span>,
      sortValue: (p) => p.selling_price,
    },
    {
      key: 'unit_cost',
      header: 'Cost Benchmark',
      accessor: (p) => <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">{formatNaira(p.unit_cost)}</span>,
      sortValue: (p) => p.unit_cost,
    },
    {
      key: 'inventory_value',
      header: 'Retail Valuation',
      accessor: (p) => <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 font-sans">{formatNaira(p.stock_qty * p.selling_price)}</span>,
      sortValue: (p) => p.stock_qty * p.selling_price,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
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
          <Tooltip content="Edit product pricing and reorder levels">
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
      accessor: (d) => <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300 font-sans">{d.sku}</span>,
      sortValue: (d) => d.sku,
    },
    {
      key: 'product_name',
      header: 'Sold Product',
      accessor: (d) => <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200 font-sans">{d.product_name}</span>,
      sortValue: (d) => d.product_name,
    },
    {
      key: 'qty_sold',
      header: 'Units Sold (Today)',
      accessor: (d) => <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300 font-sans">{d.qty_sold} {d.unit}s</span>,
      sortValue: (d) => d.qty_sold,
    },
    {
      key: 'order_count',
      header: 'Customer Orders',
      accessor: (d) => <span className="text-xs text-zinc-600 dark:text-zinc-400 font-sans">{d.order_count} tickets</span>,
      sortValue: (d) => d.order_count,
    },
    {
      key: 'channel_breakdown',
      header: 'Channel Distribution',
      accessor: (d) => <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">{d.channel_breakdown}</span>,
    },
    {
      key: 'total_value',
      header: 'Gross Revenue',
      accessor: (d) => <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300 font-sans">{formatNaira(d.total_value)}</span>,
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          title="Total Finished Products"
          value={totalSKUs}
          description="Finished menu items"
          icon={<Package className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Physical Valuation"
          value={formatNaira(totalValuation)}
          description="Ready physical on-hand"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="In-Oven Buffer"
          value={`+${totalIncomingUnits} units`}
          description="Active & scheduled batch feed"
          icon={<Flame className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Units Sold Today"
          value={`${totalUnitsSoldToday} units`}
          description="Orders & POS sales"
          icon={<ShoppingCart className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Gross Sales Today"
          value={formatNaira(totalRealizationToday)}
          description="Daily sales realization"
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
            onRowClick={(p) => handleOpenDetails(p)}
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
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="sales-adjust-form">
              Save Adjustment
            </Button>
          </div>
        }
      >
        <form id="sales-adjust-form" onSubmit={handleConfirmAdjust} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Current Stock:</span>
              <span className="font-semibold text-kumo-strong text-xs">{selectedProduct?.stock_qty} {selectedProduct?.unit}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Selling Price:</span>
              <span className="font-semibold text-kumo-strong font-sans text-xs">{formatNaira(selectedProduct?.selling_price || 0)}</span>
            </div>
          </div>

          <UnitInput
            label="Delta Quantity (+/-)"
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
        </form>
      </Dialog>

      {/* Edit/Create Modal */}
      <Dialog
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? `Edit Product: ${selectedProduct.name}` : 'Register New Sales Product'}
        description="Configure product image, holding inventory, commercial pricing, and storefront availability."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="sales-product-form">
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        }
      >
        <form id="sales-product-form" onSubmit={handleConfirmProduct} className="space-y-4 text-xs font-sans">
          {/* Section 1: Product Media & Identity */}
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-kumo-strong block">
              Product Photo & Menu Imagery
            </label>
            <FileUpload
              value={productForm.image || ''}
              onChange={(newUrl) => setProductForm(prev => ({ ...prev, image: newUrl }))}
              title="Click to upload or drop product photo"
              description="PNG, JPG, or WEBP up to 5MB (Square or 4:3 recommended)"
              browseLabel="Browse image"
              draggingLabel="Drop product image"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp"
              showBorderBeam={true}
              showFileList={true}
            />
            <span className="text-[11px] text-kumo-subtle block">
              Photo renders on the Sales Inventory catalog and storefront digital menu.
            </span>
          </div>

          <Input
            label="Product Title"
            placeholder="e.g. Full Smokey Guineafowl (Chopped)"
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
          />

          <Select
            label="Menu Category"
            value={productForm.category_id}
            onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
            options={[
              { value: 'mains', label: 'Mains / Firewood Grilled Proteins' },
              { value: 'platters', label: 'Feast Platters & Combos' },
              { value: 'sides', label: 'Sides & Accompaniments' },
              { value: 'drinks', label: 'Beverages & Refreshments' },
            ]}
          />

          <Input
            label="Short Description"
            placeholder="e.g. Firewood smoked whole bird with signature dry pepper rub"
            value={productForm.short_desc}
            onChange={(e) => setProductForm(prev => ({ ...prev, short_desc: e.target.value }))}
          />

          {/* Section 2: SKU Code & Unit of Measure */}
          <Input
            label="SKU Code"
            placeholder="e.g. SMK-0024"
            value={productForm.sku}
            onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
            required
          />

          <Select
            label="Unit of Measure"
            value={productForm.unit}
            onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
            options={[
              { value: 'portion', label: 'Portions / Single Servings' },
              { value: 'unit', label: 'Whole Birds / Whole Units' },
              { value: 'pack', label: 'Takeout Packs & Food Bowls' },
              { value: 'piece', label: 'Pieces' },
              { value: 'bottle', label: 'Bottles / Cans' },
            ]}
          />

          {/* Section 3: Physical Stock On-Hand & Reorder Alert */}
          <Input
            label="Physical Stock (On-Hand)"
            type="number"
            min="0"
            value={productForm.stock_qty}
            onChange={(e) => setProductForm(prev => ({ ...prev, stock_qty: Number(e.target.value) }))}
            required
          />

          <Input
            label="Reorder Alert Threshold"
            type="number"
            min="0"
            value={productForm.reorder_level}
            onChange={(e) => setProductForm(prev => ({ ...prev, reorder_level: Number(e.target.value) }))}
            required
          />

          {/* Section 4: Commercial Pricing & Benchmark */}
          <Input
            label="Customer Selling Price (₦)"
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

          {/* Live Commercial Valuation & Gross Margin Preview Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs font-sans">
            <div className="p-3 space-y-1">
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                Estimated Gross Margin
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-[13px]">
                  {formatNaira(Math.max(0, Number(productForm.selling_price) - Number(productForm.unit_cost)))}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ({productForm.selling_price > 0 ? Math.round(((Number(productForm.selling_price) - Number(productForm.unit_cost)) / Number(productForm.selling_price)) * 100) : 0}% margin)
                </span>
              </div>
            </div>
            <div className="p-3 space-y-1">
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                Initial Retail Valuation
              </span>
              <span className="block font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-[13px]">
                {formatNaira(Number(productForm.stock_qty || 0) * Number(productForm.selling_price || 0))}
              </span>
            </div>
          </div>

          {/* Section 5: Online Storefront Visibility Toggle */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs font-sans">
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Publish to Web Storefront
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Product will be visible and available for online orders when in-stock or baking
                </span>
              </div>
              <Toggle
                checked={productForm.is_active}
                onChange={(checked) => setProductForm(prev => ({ ...prev, is_active: checked }))}
                size="md"
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* Dish Details Modal — Desaturated Grey Layout with Clean Aligned Rows matching Website Orders */}
      {selectedDetailsProduct && (() => {
        const p = selectedDetailsProduct
        const incomingInfo = incomingByDish[String(p.id)] || incomingByDish[p.name.toLowerCase().trim()]
        const incomingQty = incomingInfo ? incomingInfo.qty : (p.estimated_incoming_qty || 0)
        const allocated = p.qty_allocated || 0
        const sellable = Math.max(0, p.stock_qty + incomingQty - allocated)
        const unitMargin = p.selling_price - p.unit_cost
        const marginPct = p.selling_price > 0 ? Math.round((unitMargin / p.selling_price) * 100) : 0
        const activeBatches = incomingInfo?.batches || []

        return (
          <Dialog
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            title={`Product Details: ${p.name}`}
            description="Physical holding inventory, active oven batches, and storefront availability."
            maxWidth="2xl"
            footer={
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsDetailsModalOpen(false)}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      handleOpenAdjust(p)
                    }}
                    leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                  >
                    Adjust Stock
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      handleOpenEdit(p)
                    }}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Edit Product & Pricing
                  </Button>
                </div>
              </div>
            }
          >
            <div className="space-y-4 font-sans text-xs">
              {/* Master Divided Card Container (Desaturated Grey matching Website Orders modal) */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
                
                {/* Section 1: Three-Tier Inventory & Availability */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Inventory Availability & Pipeline
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Physical (On-Hand)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                          {formatQuantity(p.stock_qty)} {p.unit}s
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                          (Ready in holding warmer / chiller)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Estimated (In-Oven)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                          +{formatQuantity(incomingQty)} {p.unit}s
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                          (Active oven & next shift runs)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Packaging Allocation</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                          {allocated} {p.unit}s
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                          (Locked for active orders being packed)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Total Sellable (Online)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                          {formatQuantity(sellable)} {p.unit}s
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                          (Formula: Physical + Estimated - Allocated)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Storefront Status</span>
                      <div>
                        {p.stock_qty > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                            In Stock Ready
                          </span>
                        ) : incomingQty > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                            Pre-Order (Baking in Oven)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Reorder Threshold</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                        Alert triggers when stock drops below {p.reorder_level} {p.unit}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Commercial Pricing & Valuation */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Commercial & Cost Profile
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">SKU Reference</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{p.sku}</span>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Selling Price</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{formatNaira(p.selling_price)}</span>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Production Cost Benchmark</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{formatNaira(p.unit_cost)}</span>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Unit Gross Margin</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium">{formatNaira(unitMargin)}</span>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                          {marginPct}% margin
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">On-Hand Physical Valuation</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{formatNaira(p.stock_qty * p.selling_price)}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Active Batches Feeding This Dish */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      In-Flight Oven Batches Feeding This Product
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                      {activeBatches.length} active run{activeBatches.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {activeBatches.length === 0 ? (
                    <div className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 italic">
                      No active oven batches currently feeding this item.
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {activeBatches.map(b => (
                        <div
                          key={b.id}
                          className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between flex-wrap gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{b.batch_ref}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                                {b.status === 'in_production' ? 'Cooking in Oven' : 'Queued Prep'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Schedule: {b.batch_schedule === 'tomorrow_morning' ? 'Tomorrow Morning Run' : 'Today Oven Run'} • Target: {b.estimated_ready_time || 'Pending'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                              +{b.expected_output} {p.unit}s
                            </span>
                            <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                              Buffered online
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </Dialog>
        )
      })()}
    </div>
  )
}
export default SalesInventoryPage
