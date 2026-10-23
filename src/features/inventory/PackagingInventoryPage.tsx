import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { PackagingProduct, PackagingReceiptTotal } from '@/lib/smokeyData'
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
import { formatNaira, formatQuantity, formatDate } from '@/lib/utils'
import { 
  Package, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowDownLeft, 
  Plus, 
  Layers, 
  PackageCheck 
} from 'lucide-react'

export const PackagingInventoryPage: React.FC = () => {
  const {
    packagingProducts,
    packagingReceiptsTotals,
    receivePackaging,
    adjustPackagingStock,
    savePackagingProduct
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'materials' | 'totals'>('materials')
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<PackagingProduct | null>(null)

  // New Material Form
  const [newMaterialForm, setNewMaterialForm] = useState({
    name: '',
    sku: '',
    unit: 'PIECES',
    stock_qty: 100,
    unit_cost: 250,
    reorder_level: 50,
    supplier_name: 'PACKAGING DIRECT LTD'
  })

  // Receive Form
  const [receiveProductId, setReceiveProductId] = useState<number>(packagingProducts[0]?.id || 93)
  const [receiveQty, setReceiveQty] = useState<number>(500)
  const [receiveCost, setReceiveCost] = useState<number>(packagingProducts[0]?.unit_cost || 420)

  // Adjust Form
  const [adjustDelta, setAdjustDelta] = useState<number>(-10)
  const [adjustNote, setAdjustNote] = useState<string>('Damaged / torn during packing')

  // KPIs
  const totalSKUs = packagingProducts.length
  const totalValuation = packagingProducts.reduce((acc, p) => acc + p.inventory_value, 0)
  const lowStockCount = packagingProducts.filter(p => p.stock_qty <= p.reorder_level).length
  const totalReceiptsCount = packagingReceiptsTotals.reduce((acc, r) => acc + r.receipt_count, 0)

  const handleOpenReceive = (prod?: PackagingProduct) => {
    if (prod) {
      setReceiveProductId(prod.id)
      setReceiveCost(prod.unit_cost)
    }
    setIsReceiveModalOpen(true)
  }

  const handleOpenAdjust = (prod: PackagingProduct) => {
    setSelectedProduct(prod)
    setAdjustDelta(-5)
    setAdjustNote('Torn bags / unusable seal')
    setIsAdjustModalOpen(true)
  }

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault()
    receivePackaging({
      productId: Number(receiveProductId),
      quantity: Number(receiveQty),
      unitCost: Number(receiveCost)
    })
    setIsReceiveModalOpen(false)
  }

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    adjustPackagingStock(selectedProduct.id, Number(adjustDelta), adjustNote)
    setIsAdjustModalOpen(false)
  }

  const handleConfirmNewMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    savePackagingProduct({
      name: newMaterialForm.name,
      sku: newMaterialForm.sku || `PKG-${String(packagingProducts.length + 1).padStart(5, '0')}`,
      unit: newMaterialForm.unit,
      stock_qty: Number(newMaterialForm.stock_qty),
      unit_cost: Number(newMaterialForm.unit_cost),
      reorder_level: Number(newMaterialForm.reorder_level)
    })
    setIsNewMaterialModalOpen(false)
    setNewMaterialForm({
      name: '',
      sku: '',
      unit: 'PIECES',
      stock_qty: 100,
      unit_cost: 250,
      reorder_level: 50,
      supplier_name: 'PACKAGING DIRECT LTD'
    })
  }

  const materialsColumns: ColumnDef<PackagingProduct>[] = [
    {
      key: 'sku',
      header: 'SKU Ref',
      accessor: (p) => <span className="font-medium text-xs text-kumo-strong font-sans">{p.sku}</span>,
      sortValue: (p) => p.sku,
    },
    {
      key: 'name',
      header: 'Packaging Material',
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
      header: 'Stock Level',
      accessor: (p) => {
        const isLow = p.stock_qty <= p.reorder_level
        return (
          <div className="flex items-center gap-2 font-sans">
            <span className="font-medium text-kumo-strong font-sans">
              {formatQuantity(p.stock_qty)} {p.unit}
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
          {formatQuantity(p.qty_available ?? p.stock_qty)} {p.unit}
        </span>
      ),
      sortValue: (p) => p.qty_available ?? p.stock_qty,
    },
    {
      key: 'qty_allocated',
      header: 'Allocated',
      accessor: (p) => (
        <span className="text-xs text-kumo-subtle font-sans">
          {formatQuantity(p.qty_allocated ?? 0)} {p.unit}
        </span>
      ),
      sortValue: (p) => p.qty_allocated ?? 0,
    },
    {
      key: 'reorder_level',
      header: 'Reorder Min',
      accessor: (p) => <span className="text-xs text-kumo-subtle font-sans">{formatQuantity(p.reorder_level)} {p.unit}</span>,
      sortValue: (p) => p.reorder_level,
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      accessor: (p) => <span className="text-xs text-kumo-default font-sans">{formatNaira(p.unit_cost)}</span>,
      sortValue: (p) => p.unit_cost,
    },
    {
      key: 'inventory_value',
      header: 'Line Valuation',
      accessor: (p) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(p.inventory_value)}</span>,
      sortValue: (p) => p.inventory_value,
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 180,
      accessor: (p) => (
        <div className="flex items-center gap-1.5 font-sans shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="Record incoming packaging containers">
            <TableActionButton
              variant="success"
              onClick={() => handleOpenReceive(p)}
            >
              + Intake
            </TableActionButton>
          </Tooltip>
          <Tooltip content="Manually adjust or audit stock count">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenAdjust(p)}
            >
              Audit
            </TableActionButton>
          </Tooltip>
        </div>
      ),
    },
  ]

  const totalsColumns: ColumnDef<PackagingReceiptTotal>[] = [
    {
      key: 'sku',
      header: 'SKU Ref',
      accessor: (r) => <span className="font-medium text-xs text-kumo-strong font-sans">{r.sku}</span>,
      sortValue: (r) => r.sku,
    },
    {
      key: 'product_name',
      header: 'Material Name',
      accessor: (r) => <span className="font-medium text-kumo-strong font-sans">{r.product_name}</span>,
      sortValue: (r) => r.product_name,
    },
    {
      key: 'total_qty',
      header: 'Cumulative Received',
      accessor: (r) => <span className="font-medium text-kumo-strong font-sans">{formatQuantity(r.total_qty)} {r.unit}</span>,
      sortValue: (r) => r.total_qty,
    },
    {
      key: 'avg_unit_cost',
      header: 'Avg Unit Cost',
      accessor: (r) => <span className="text-xs text-kumo-default font-sans">{formatNaira(r.avg_unit_cost)}</span>,
      sortValue: (r) => r.avg_unit_cost,
    },
    {
      key: 'total_value',
      header: 'Total Spend Realized',
      accessor: (r) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(r.total_value)}</span>,
      sortValue: (r) => r.total_value,
    },
    {
      key: 'receipt_count',
      header: 'Deliveries Logged',
      accessor: (r) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-kumo-surface text-kumo-default border border-kumo-line font-sans">{r.receipt_count} batches</span>,
      sortValue: (r) => r.receipt_count,
    },
    {
      key: 'last_received',
      header: 'Latest Delivery',
      accessor: (r) => <span className="text-xs text-kumo-subtle font-sans">{formatDate(r.last_received)}</span>,
      sortValue: (r) => r.last_received,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Packaging & Packing Materials Inventory"
        subtitle="Paper bowls, branded polybags, customized aluminum foil seals, and thermal order tracking labels."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewMaterialForm({
                  name: '',
                  sku: `PKG-${String(packagingProducts.length + 1).padStart(5, '0')}`,
                  unit: 'PIECES',
                  stock_qty: 100,
                  unit_cost: 250,
                  reorder_level: 50,
                  supplier_name: 'PACKAGING DIRECT LTD'
                })
                setIsNewMaterialModalOpen(true)
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              New Packaging Material
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenReceive()}
              leftIcon={<PackageCheck className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Receive Stock Intake
            </Button>
          </>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Packaging SKUs"
          value={totalSKUs}
          description="Bags, bowls, foil, labels"
          icon={<ShoppingBag className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Total Packaging Value"
          value={formatNaira(totalValuation)}
          description="Consumables inventory value"
          icon={<Layers className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Critical Reorder Alerts"
          value={lowStockCount}
          description="Below minimum buffer stock"
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        />
        <MetricCard
          title="Supplier Deliveries"
          value={totalReceiptsCount}
          description="Consignment receipts logged"
          icon={<PackageCheck className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'materials', label: 'Materials', badge: packagingProducts.length },
            { id: 'totals', label: 'Receipts', badge: packagingReceiptsTotals.length },
          ]}
        />
      </div>

      {/* Tables */}
      <div>
        {activeTab === 'materials' ? (
          <DataTable
            data={packagingProducts}
            columns={materialsColumns}
            searchable={true}
            searchPlaceholder="Search packaging bag, bowl, label..."
            title="Packaging Item"
            exportFilename="smokey-packaging-materials"
          />
        ) : (
          <DataTable
            data={packagingReceiptsTotals}
            columns={totalsColumns}
            searchable={true}
            searchPlaceholder="Search receipt totals..."
            title="Receipt Group"
            exportFilename="smokey-packaging-receipt-totals"
          />
        )}
      </div>

      {/* Receive Modal */}
      <Dialog
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Packaging Materials (Consignment)"
        description="Record incoming shipment of packaging items to update stock on hand."
      >
        <form onSubmit={handleConfirmReceive} className="space-y-4">
          <Select
            label="Packaging SKU"
            value={receiveProductId}
            onChange={(e) => {
              const pid = Number(e.target.value)
              setReceiveProductId(pid)
              const match = packagingProducts.find(p => p.id === pid)
              if (match) setReceiveCost(match.unit_cost)
            }}
            options={packagingProducts.map(p => ({ value: p.id, label: `${p.name} [${p.sku}] - Current: ${p.stock_qty} ${p.unit}` }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <UnitInput
              label="Quantity Received"
              value={receiveQty}
              onChangeValue={setReceiveQty}
              unit={packagingProducts.find(p => p.id === receiveProductId)?.unit || 'units'}
              min={1}
              required
            />
            <Input
              label="Unit Cost (₦)"
              type="number"
              min="1"
              value={receiveCost}
              onChange={(e) => setReceiveCost(Number(e.target.value))}
              required
            />
          </div>

          <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-lg text-sm flex justify-between font-mono">
            <span className="text-kumo-subtle">Total Consignment Cost:</span>
            <span className="font-bold text-emerald-700 text-base">{formatNaira(receiveQty * receiveCost)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" type="button" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Log Packaging Delivery
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Adjust Modal */}
      <Dialog
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
        description="Log damaged packaging, warehouse count corrections, or scrap."
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-4">
          <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-lg text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Current Count:</span>
              <span className="font-mono font-bold text-kumo-strong text-base">{selectedProduct?.stock_qty} {selectedProduct?.unit}</span>
            </div>
          </div>

          <UnitInput
            label="Adjustment Delta (e.g. -10 for damaged / scrap)"
            value={adjustDelta}
            onChangeValue={setAdjustDelta}
            unit={selectedProduct?.unit || 'units'}
            helperText={`Projected Balance: ${Math.max(0, (selectedProduct?.stock_qty || 0) + Number(adjustDelta))} ${selectedProduct?.unit}`}
            required
          />

          <Input
            label="Reason / Notes"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Apply Correction
            </Button>
          </div>
        </form>
      </Dialog>

      {/* New Packaging Material Modal */}
      <Dialog
        isOpen={isNewMaterialModalOpen}
        onClose={() => setIsNewMaterialModalOpen(false)}
        title="Create New Packaging Material"
        description="Add a new consumable container, bag, food bowl, or label SKU to the packaging inventory."
      >
        <form onSubmit={handleConfirmNewMaterial} className="space-y-4 font-sans">
          <Input
            label="Material Name"
            placeholder="e.g. 1.5L Big Food Bowl & Lid"
            value={newMaterialForm.name}
            onChange={(e) => setNewMaterialForm(prev => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              value={newMaterialForm.sku}
              onChange={(e) => setNewMaterialForm(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="e.g. PKG-00010"
              required
            />
            <Select
              label="Unit of Measure"
              value={newMaterialForm.unit}
              onChange={(e) => setNewMaterialForm(prev => ({ ...prev, unit: e.target.value }))}
              options={[
                { value: 'PIECES', label: 'Pieces (Bags / Bowls / Lids)' },
                { value: 'PACK', label: 'Packs / Bundles' },
                { value: 'ROLL', label: 'Rolls (Foil / Wrap / Stickers)' },
                { value: 'CARTON', label: 'Cartons / Cases' },
                { value: 'KG', label: 'Kilograms (kg)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Initial Stock Qty"
              type="number"
              min="0"
              value={newMaterialForm.stock_qty}
              onChange={(e) => setNewMaterialForm(prev => ({ ...prev, stock_qty: Number(e.target.value) }))}
              required
            />
            <Input
              label="Unit Cost (₦)"
              type="number"
              min="0"
              value={newMaterialForm.unit_cost}
              onChange={(e) => setNewMaterialForm(prev => ({ ...prev, unit_cost: Number(e.target.value) }))}
              required
            />
            <Input
              label="Reorder Alert Level"
              type="number"
              min="1"
              value={newMaterialForm.reorder_level}
              onChange={(e) => setNewMaterialForm(prev => ({ ...prev, reorder_level: Number(e.target.value) }))}
              required
            />
          </div>

          <Input
            label="Preferred Supplier / Manufacturer"
            placeholder="e.g. PACKAGING DIRECT LTD"
            value={newMaterialForm.supplier_name}
            onChange={(e) => setNewMaterialForm(prev => ({ ...prev, supplier_name: e.target.value }))}
          />

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-kumo-line">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsNewMaterialModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Packaging Material
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default PackagingInventoryPage
