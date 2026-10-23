import React, { useState } from 'react'
import { INITIAL_PRODUCTS, INITIAL_MOVEMENTS } from '@/lib/mockData'
import { ProductSKU, StockMovement, StockStatus } from '@/types/inventory'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatNaira, formatQuantity } from '@/lib/utils'
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  RotateCcw
} from 'lucide-react'

export const InventoryOverview: React.FC = () => {
  const [products, setProducts] = useState<ProductSKU[]>(INITIAL_PRODUCTS)
  const [_movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS)

  // Stock Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSKU | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN')
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10)
  const [adjustReason, setAdjustReason] = useState<string>('Physical Count Discrepancy')
  const [adjustNote, setAdjustNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculations
  const totalSKUs = products.length
  const totalUnits = products.reduce((acc, p) => acc + p.stock_on_hand, 0)
  const availableUnits = products.reduce((acc, p) => acc + p.available_stock, 0)
  const reservedUnits = products.reduce((acc, p) => acc + p.reserved_stock, 0)
  const lowStockCount = products.filter(p => p.status === 'LOW_STOCK').length
  const outOfStockCount = products.filter(p => p.status === 'OUT_OF_STOCK').length
  const totalValuation = products.reduce((acc, p) => acc + p.stock_on_hand * p.unit_cost, 0)

  // Open adjustment dialog for a specific item
  const handleOpenAdjust = (product: ProductSKU) => {
    setSelectedProduct(product)
    setAdjustmentType('IN')
    setAdjustQuantity(10)
    setAdjustReason('Production Intake Receipt')
    setAdjustNote('')
    setIsAdjustModalOpen(true)
  }

  // Submit stock adjustment with ledger audit trail
  const handleConfirmAdjustment = () => {
    if (!selectedProduct || adjustQuantity <= 0) return
    setIsSubmitting(true)

    setTimeout(() => {
      const delta = adjustmentType === 'OUT' ? -adjustQuantity : adjustQuantity
      const newOnHand = Math.max(0, selectedProduct.stock_on_hand + delta)
      const newAvailable = Math.max(0, newOnHand - selectedProduct.reserved_stock)

      let newStatus: StockStatus = 'IN_STOCK'
      if (newOnHand === 0) newStatus = 'OUT_OF_STOCK'
      else if (newAvailable <= selectedProduct.reorder_threshold) newStatus = 'LOW_STOCK'

      // 1. Update Product State
      setProducts(prev =>
        prev.map(p =>
          p.id === selectedProduct.id
            ? {
                ...p,
                stock_on_hand: newOnHand,
                available_stock: newAvailable,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : p
        )
      )

      // 2. Append to immutable ledger audit trail
      const newMovement: StockMovement = {
        id: `mov-${Date.now()}`,
        item_id: selectedProduct.id,
        item_sku: selectedProduct.sku,
        item_name: selectedProduct.name,
        type: adjustmentType === 'IN' ? 'RECEIPT' : adjustmentType === 'OUT' ? 'DAMAGED_WRITE_OFF' : 'CYCLE_COUNT_ADJUST',
        quantity_delta: delta,
        uom: selectedProduct.uom,
        warehouse_name: selectedProduct.warehouse_name,
        reference_id: `MANUAL-ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        reason_code: adjustReason,
        note: adjustNote || 'Manual console adjustment',
        created_by: 'Ayobami (Ops Lead)',
        created_at: new Date().toISOString(),
      }

      setMovements(prev => [newMovement, ...prev])
      setIsSubmitting(false)
      setIsAdjustModalOpen(false)
    }, 400)
  }

  // Table Columns
  const columns: ColumnDef<ProductSKU>[] = [
    {
      key: 'sku',
      header: 'SKU Code',
      sortable: true,
      sortValue: p => p.sku,
      accessor: p => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
            {p.sku}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{p.barcode}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Product / Item Name',
      sortable: true,
      sortValue: p => p.name,
      accessor: p => (
        <div className="flex flex-col max-w-xs">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
            {p.name}
          </span>
          <span className="text-[10px] text-slate-400 capitalize">{p.category.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Stock Status',
      defaultWidth: 160,
      sortable: true,
      sortValue: p => p.status,
      accessor: p => <StatusBadge status={p.status} size="sm" />,
    },
    {
      key: 'stock_on_hand',
      header: 'On Hand',
      sortable: true,
      align: 'right',
      sortValue: p => p.stock_on_hand,
      accessor: p => formatQuantity(p.stock_on_hand, p.uom),
    },
    {
      key: 'available_stock',
      header: 'Available',
      sortable: true,
      align: 'right',
      sortValue: p => p.available_stock,
      accessor: p => (
        <span className={p.available_stock <= p.reorder_threshold ? 'text-amber-600 font-bold' : ''}>
          {formatQuantity(p.available_stock, p.uom)}
        </span>
      ),
    },
    {
      key: 'reserved_stock',
      header: 'Reserved',
      sortable: true,
      align: 'right',
      sortValue: p => p.reserved_stock,
      accessor: p => formatQuantity(p.reserved_stock, p.uom),
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      sortable: true,
      align: 'right',
      sortValue: p => p.unit_cost,
      accessor: p => formatNaira(p.unit_cost),
    },
    {
      key: 'bin_location',
      header: 'Bin Location',
      accessor: p => (
        <span className="px-2 py-0.5 rounded-md bg-kumo-tint text-kumo-default font-mono text-[11px] ring ring-kumo-line/50">
          {p.bin_location}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Inventory Management"
        subtitle="Real-time multi-warehouse stock balances, safety reserves, and atomic movement audit ledgers."
        actions={
          <Button
            variant="primary"
            onClick={() => handleOpenAdjust(products[0])}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Stock Movement
          </Button>
        }
      />

      {/* 4-Plate Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total SKUs Cataloged"
          value={totalSKUs}
          delta={{ value: '+4 New this month', isPositive: true }}
          subtext="Active inventory catalog items"
          icon={<Boxes className="w-5 h-5 text-kumo-brand" />}
        />

        <MetricCard
          title="Total Units on Hand"
          value={totalUnits.toLocaleString()}
          delta={{ value: `${availableUnits} Available`, isPositive: true }}
          subtext={`${reservedUnits} units committed to orders`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />

        <MetricCard
          title="Inventory Valuation"
          value={formatNaira(totalValuation)}
          delta={{ value: '+8.4%', isPositive: true, period: 'vs last month (MTD)' }}
          subtext="Calculated by historical acquisition cost"
          icon={<TrendingUp className="w-5 h-5 text-kumo-brand" />}
        />

        <MetricCard
          title="Critical Stock Alerts"
          value={lowStockCount + outOfStockCount}
          variant={lowStockCount + outOfStockCount > 0 ? 'warning' : 'default'}
          delta={{ value: `${outOfStockCount} Out of stock`, isPositive: false }}
          subtext={`${lowStockCount} items below safe reorder point`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Main Inventory DataTable */}
      <DataTable
        title="Live Stock Inventory Grid"
        data={products}
        columns={columns}
        keyExtractor={p => p.id}
        searchablePlaceholder="Filter by SKU, name, barcode, or bin..."
        secondaryAction={{
          label: 'Export CSV',
          onClick: () => {},
        }}
        searchFilter={(p, q) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.bin_location.toLowerCase().includes(q)
        }
        filterCategories={[
          {
            name: 'Category',
            key: 'category',
            options: [
              { label: 'All Categories', value: 'ALL' },
              { label: 'Finished Goods', value: 'finished_good' },
              { label: 'Raw Materials', value: 'raw_material' },
              { label: 'Consumables', value: 'consumable' },
              { label: 'Packaging', value: 'packaging' },
            ],
            activeValue: 'ALL',
            onChange: val => {
              if (val === 'ALL') setProducts(INITIAL_PRODUCTS)
              else setProducts(INITIAL_PRODUCTS.filter(p => p.category === val))
            },
          },
        ]}
        bulkActions={[
          {
            label: 'Adjust Selected',
            icon: <RotateCcw className="w-3.5 h-3.5" />,
            onClick: selected => {
              if (selected[0]) handleOpenAdjust(selected[0])
            },
          },
        ]}
        rowActions={product => (
          <div className="flex items-center gap-1.5 justify-end">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenAdjust(product)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Adjust
            </TableActionButton>
          </div>
        )}
      />

      {/* Stock Adjustment Modal */}
      <Dialog
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Record Stock Adjustment"
        description="Creates an immutable signed ledger movement entry. Stock is recalculated automatically."
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleConfirmAdjustment}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Post Adjustment to Ledger
            </Button>
          </>
        }
      >
        {selectedProduct && (
          <div className="space-y-3.5 text-xs font-sans">
            {/* Target Item Pill */}
            <div className="p-3 bg-kumo-tint rounded-lg ring ring-kumo-line/50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-kumo-strong text-sm">
                  {selectedProduct.name}
                </span>
                <p className="font-mono text-kumo-subtle text-xs mt-0.5">
                  SKU: {selectedProduct.sku} • Location: {selectedProduct.bin_location}
                </p>
              </div>
              <div className="text-right">
                <span className="text-kumo-subtle text-xs">Current Stock</span>
                <p className="font-mono font-bold text-base text-kumo-strong">
                  {formatQuantity(selectedProduct.stock_on_hand, selectedProduct.uom)}
                </p>
              </div>
            </div>

            {/* Adjustment Type Selector */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setAdjustmentType('IN')}
                className={`h-9 px-2.5 rounded-lg ring text-center font-medium text-xs cursor-pointer transition-colors flex items-center justify-center ${
                  adjustmentType === 'IN'
                    ? 'ring-kumo-brand bg-kumo-brand/10 text-kumo-link font-bold'
                    : 'ring-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-tint'
                }`}
              >
                + Stock In (Receipt)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('OUT')}
                className={`h-9 px-2.5 rounded-lg ring text-center font-medium text-xs cursor-pointer transition-colors flex items-center justify-center ${
                  adjustmentType === 'OUT'
                    ? 'ring-kumo-danger bg-kumo-danger/10 text-kumo-danger font-bold'
                    : 'ring-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-tint'
                }`}
              >
                - Stock Out (Loss/Scrap)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('ADJUST')}
                className={`h-9 px-2.5 rounded-lg ring text-center font-medium text-xs cursor-pointer transition-colors flex items-center justify-center ${
                  adjustmentType === 'ADJUST'
                    ? 'ring-kumo-warning bg-kumo-warning/10 text-kumo-warning font-bold'
                    : 'ring-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-tint'
                }`}
              >
                Cycle Count Rec
              </button>
            </div>

            {/* Quantity Input */}
            <Input
              label={`Adjustment Quantity (${selectedProduct.uom})`}
              type="number"
              min="1"
              value={adjustQuantity}
              onChange={e => setAdjustQuantity(Number(e.target.value))}
              helperText={`New calculated on-hand stock will be: ${Math.max(
                0,
                selectedProduct.stock_on_hand + (adjustmentType === 'OUT' ? -adjustQuantity : adjustQuantity)
              )} ${selectedProduct.uom}`}
              required
            />

            {/* Reason Code Dropdown */}
            <Select
              label="Mandatory Reason Code"
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              options={[
                { label: 'Physical Count Discrepancy', value: 'Physical Count Discrepancy' },
                { label: 'Production Intake Receipt', value: 'Production Intake Receipt' },
                { label: 'Kitchen Spoilage / Overcooked', value: 'Kitchen Spoilage / Overcooked' },
                { label: 'Supplier Overage Delivery', value: 'Supplier Overage Delivery' },
                { label: 'Transit Damage Write-off', value: 'Transit Damage Write-off' },
                { label: 'Customer Return Restocked', value: 'Customer Return Restocked' },
              ]}
              required
            />

            {/* Note Input */}
            <Input
              label="Audit Note / Reference Details"
              placeholder="e.g. Verified by Kitchen Lead after morning shift inspection"
              value={adjustNote}
              onChange={e => setAdjustNote(e.target.value)}
            />
          </div>
        )}
      </Dialog>
    </div>
  )
}
