import React, { useState } from 'react'
import { INITIAL_PRODUCTS } from '@/lib/mockData'
import { ProductSKU } from '@/types/inventory'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatNaira, formatQuantity } from '@/lib/utils'
import { Plus, Barcode } from 'lucide-react'

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductSKU[]>(INITIAL_PRODUCTS)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form state for creating product
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductSKU['category']>('finished_good')
  const [uom, setUom] = useState<ProductSKU['uom']>('units')
  const [unitCost, setUnitCost] = useState(2500)
  const [retailPrice, setRetailPrice] = useState(5000)
  const [reorderThreshold, setReorderThreshold] = useState(20)
  const [binLocation, setBinLocation] = useState('COLD-R01-S01')

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku || !name) return

    const newProduct: ProductSKU = {
      id: `prod-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      barcode: barcode || String(Math.floor(600000000000 + Math.random() * 90000000000)),
      name,
      category,
      uom,
      unit_cost: Number(unitCost),
      retail_price: Number(retailPrice),
      stock_on_hand: 0,
      reserved_stock: 0,
      available_stock: 0,
      reorder_threshold: Number(reorderThreshold),
      target_stock: Number(reorderThreshold) * 4,
      warehouse_name: 'Central Production Kitchen',
      bin_location: binLocation,
      status: 'OUT_OF_STOCK',
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    setProducts(prev => [newProduct, ...prev])
    setIsCreateModalOpen(false)
    setSku('')
    setName('')
    setBarcode('')
  }

  const columns: ColumnDef<ProductSKU>[] = [
    {
      key: 'sku',
      header: 'SKU & Barcode',
      sortable: true,
      sortValue: p => p.sku,
      accessor: p => (
        <div className="flex flex-col">
          <span className="font-mono font-medium text-xs sm:text-sm text-kumo-strong">
            {p.sku}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-kumo-subtle font-mono">
            <Barcode className="w-3 h-3" />
            <span>{p.barcode}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Item Specification',
      sortable: true,
      sortValue: p => p.name,
      accessor: p => (
        <div className="flex flex-col max-w-sm">
          <span className="font-medium text-xs sm:text-sm text-kumo-strong">{p.name}</span>
          {p.description && <span className="text-[11px] text-kumo-subtle truncate">{p.description}</span>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: p => p.category,
      accessor: p => (
        <span className="text-xs sm:text-sm capitalize text-kumo-default">
          {p.category.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'pricing',
      header: 'Cost / Retail Price',
      sortable: true,
      align: 'right',
      sortValue: p => p.unit_cost,
      accessor: p => (
        <div className="flex flex-col text-right font-mono text-xs">
          <span className="text-kumo-strong font-semibold">
            {formatNaira(p.retail_price)}
          </span>
          <span className="text-[10px] text-kumo-subtle">Cost: {formatNaira(p.unit_cost)}</span>
        </div>
      ),
    },
    {
      key: 'reorder_threshold',
      header: 'Reorder Line',
      align: 'right',
      sortable: true,
      sortValue: p => p.reorder_threshold,
      accessor: p => (
        <span className="font-mono text-xs text-kumo-default">
          Min {formatQuantity(p.reorder_threshold, p.uom)}
        </span>
      ),
    },
    {
      key: 'bin_location',
      header: 'Bin Location',
      accessor: p => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-kumo-tint ring ring-kumo-line text-kumo-default">
          {p.bin_location}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: p => <StatusBadge status={p.status} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Products & Item Catalog
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Central catalog defining raw ingredients, packaging, finished meals, and safety replenishment lines.
          </p>
        </div>
      </div>

      <DataTable
        title="Custom SKUs and Catalog Items"
        data={products}
        columns={columns}
        keyExtractor={p => p.id}
        searchablePlaceholder="Filter by SKU, name, or barcode..."
        primaryAction={{
          label: 'Create SKU',
          onClick: () => setIsCreateModalOpen(true),
        }}
        secondaryAction={{
          label: 'Import CSV',
          onClick: () => {},
        }}
        searchFilter={(p, q) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(q)
        }
        filterCategories={[
          {
            name: 'Category',
            key: 'cat',
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
      />

      {/* Create SKU Dialog */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New SKU to Catalog"
        description="Register a new inventory product, raw material, or packaging item into the enterprise registry."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProduct}>
              Save SKU to Database
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              placeholder="e.g. FG-CHICK-SMK-02"
              value={sku}
              onChange={e => setSku(e.target.value)}
              required
            />
            <Input
              label="Barcode (EAN-13 / Code-128)"
              placeholder="e.g. 615100010099"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
          </div>

          <Input
            label="Product / Item Full Name"
            placeholder="e.g. Smokey Crispy Wing Combo Pack (8pcs)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Item Category"
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              options={[
                { label: 'Finished Good', value: 'finished_good' },
                { label: 'Raw Material', value: 'raw_material' },
                { label: 'Consumable / Fuel', value: 'consumable' },
                { label: 'Packaging Material', value: 'packaging' },
              ]}
            />
            <Select
              label="Unit of Measure (UoM)"
              value={uom}
              onChange={e => setUom(e.target.value as any)}
              options={[
                { label: 'Units (pcs)', value: 'units' },
                { label: 'Kilograms (kg)', value: 'kg' },
                { label: 'Grams (g)', value: 'grams' },
                { label: 'Litres (L)', value: 'litres' },
                { label: 'Packs', value: 'packs' },
                { label: 'Crates', value: 'crates' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Cost (NGN)"
              type="number"
              value={unitCost}
              onChange={e => setUnitCost(Number(e.target.value))}
              required
            />
            <Input
              label="Retail Selling Price (NGN)"
              type="number"
              value={retailPrice}
              onChange={e => setRetailPrice(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Reorder Safety Threshold"
              type="number"
              value={reorderThreshold}
              onChange={e => setReorderThreshold(Number(e.target.value))}
              required
            />
            <Input
              label="Assigned Bin Location"
              placeholder="e.g. COLD-R02-S03"
              value={binLocation}
              onChange={e => setBinLocation(e.target.value)}
              required
            />
          </div>
        </form>
      </Dialog>
    </div>
  )
}
