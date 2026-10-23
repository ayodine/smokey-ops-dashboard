import React, { useState } from 'react'
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
import { formatNaira, formatQuantity } from '@/lib/utils'
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Plus, 
  SlidersHorizontal,
  Calendar
} from 'lucide-react'

export const SalesInventoryPage: React.FC = () => {
  const {
    salesProducts,
    dailySales,
    adjustSalesStock,
    saveSalesProduct
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'inventory' | 'daily'>('inventory')
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SalesProduct | null>(null)

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

  // KPIs
  const totalSKUs = salesProducts.length
  const totalValuation = salesProducts.reduce((acc, p) => acc + (p.stock_qty * p.selling_price), 0)
  const totalUnitsSoldToday = dailySales.reduce((acc, d) => acc + d.qty_sold, 0)
  const totalRealizationToday = dailySales.reduce((acc, d) => acc + d.total_value, 0)

  const handleOpenAdjust = (p: SalesProduct) => {
    setSelectedProduct(p)
    setAdjustDelta(5)
    setAdjustNotes('End of shift inventory recount')
    setIsAdjustModalOpen(true)
  }

  const handleOpenEdit = (p?: SalesProduct) => {
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
        sku: `WEB-SKU-${String(salesProducts.length + 10).padStart(3, '0')}`,
        unit: 'unit',
        selling_price: 15000,
        unit_cost: 7000,
        reorder_level: 20
      })
    }
    setIsProductModalOpen(true)
  }

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
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

  const inventoryColumns: ColumnDef<SalesProduct>[] = [
    {
      key: 'sku',
      header: 'SKU Ref',
      accessor: (p) => <span className="font-medium text-xs text-kumo-strong font-sans">{p.sku}</span>,
      sortValue: (p) => p.sku,
    },
    {
      key: 'name',
      header: 'Sales Item / Dish',
      accessor: (p) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{p.name}</div>
          <div className="text-[11px] text-kumo-subtle uppercase font-sans">{p.unit}</div>
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
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenEdit()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="h-10 px-4 text-sm font-medium shadow-xs"
          >
            Add Sales Product
          </Button>
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

      {/* Filter Tabs inheriting from Raw Ingredients page */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'inventory', label: 'In Stock', badge: salesProducts.length },
            { id: 'daily', label: 'Daily Sales' },
          ]}
        />
      </div>

      {/* Tables */}
      <div>
        {activeTab === 'inventory' ? (
          <DataTable
            data={salesProducts}
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
          <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-lg text-sm space-y-2 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Current Stock:</span>
              <span className="font-semibold text-kumo-strong text-base">{selectedProduct?.stock_qty} {selectedProduct?.unit}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Selling Price:</span>
              <span className="font-semibold text-emerald-600 font-sans text-base">{formatNaira(selectedProduct?.selling_price || 0)}</span>
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
        <form onSubmit={handleConfirmProduct} className="space-y-4">
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
            <Button variant="outline" type="button" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default SalesInventoryPage
