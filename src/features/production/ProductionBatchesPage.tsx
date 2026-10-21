import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { ProductionBatch, RawMaterialBOM } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UnitInput } from '@/components/ui/UnitInput'
import { Tooltip } from '@/components/ui/Tooltip'
import { type DateRange, isWithinDateRange } from '@/components/ui/DateRangePicker'
import { formatNaira, formatQuantity, formatDate } from '@/lib/utils'

const formatUnit = (unit?: string) => {
  if (!unit) return ''
  const u = unit.toLowerCase().trim()
  if (u === 'pieces' || u === 'piece' || u === 'pcs') return 'pcs'
  if (u === 'kilograms' || u === 'kilogram' || u === 'kg') return 'kg'
  if (u === 'liters' || u === 'litres' || u === 'l') return 'litres'
  if (u === 'grams' || u === 'g') return 'g'
  if (u === 'packs' || u === 'pack') return 'packs'
  if (u === 'bottles' || u === 'bottle') return 'bottles'
  if (u === 'rolls' || u === 'roll') return 'rolls'
  return u
}
import { 
  Factory, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Eye, 
  Play, 
  CheckSquare, 
  AlertOctagon 
} from 'lucide-react'

export const ProductionBatchesPage: React.FC = () => {
  const {
    productionBatches,
    salesProducts,
    rawProducts,
    recipeTemplates,
    createBatch,
    startBatch,
    completeBatch,
    cancelBatch
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null)

  // Complete Form
  const [actualOutput, setActualOutput] = useState<number>(50)
  const [wastage, setWastage] = useState<number>(0)
  const [qcNotes, setQcNotes] = useState<string>('QC Passed: internal core temp > 85°C. Golden brown smoke finish.')

  // Batch Creation Form State
  const [selectedRecipeTemplateId, setSelectedRecipeTemplateId] = useState<number | 'custom'>(1)
  const [selectedOutputProduct, setSelectedOutputProduct] = useState<number>(salesProducts[0]?.id || 38)
  const [expectedOutput, setExpectedOutput] = useState<number>(50)
  const [batchRemarks, setBatchRemarks] = useState<string>('Standard morning smoke run in Pit #1')
  const [bomRows, setBomRows] = useState<RawMaterialBOM[]>([
    { product_id: 62, sku: 'SKU-00028', name: 'FRESH GUINEAFOWL', quantity: 50, unit: 'PIECES' },
    { product_id: 53, sku: 'SKU-00019', name: 'DRY PEPPER', quantity: 2.5, unit: 'KG' },
    { product_id: 54, sku: 'SKU-00020', name: 'SPICIES (SECRET BLEND)', quantity: 1.0, unit: 'PACK' },
    { product_id: 52, sku: 'SKU-00018', name: 'FIREWOOD', quantity: 4.0, unit: 'BUNDLE' },
  ])

  // Recipe Template Selection Handler (Invariant 2: Standard BOM Determinism)
  const handleSelectRecipeTemplate = (val: string) => {
    if (val === 'custom') {
      setSelectedRecipeTemplateId('custom')
      return
    }
    const tid = Number(val)
    setSelectedRecipeTemplateId(tid)
    const tmpl = recipeTemplates.find(t => t.id === tid)
    if (!tmpl) return

    setSelectedOutputProduct(tmpl.output_product_id)
    setExpectedOutput(tmpl.standard_batch_size)
    const calculated: RawMaterialBOM[] = tmpl.ingredients.map(ing => ({
      product_id: ing.raw_product_id,
      sku: ing.sku,
      name: ing.name,
      quantity: Number((ing.standard_qty_per_unit * tmpl.standard_batch_size).toFixed(3)),
      unit: ing.unit
    }))
    setBomRows(calculated)
    setBatchRemarks(`Standard BOM Run: ${tmpl.version_name} (Yield Target: ${tmpl.standard_batch_size} units)`)
  }

  const handleExpectedOutputChange = (newTarget: number) => {
    setExpectedOutput(newTarget)
    if (selectedRecipeTemplateId !== 'custom') {
      const tmpl = recipeTemplates.find(t => t.id === selectedRecipeTemplateId)
      if (tmpl) {
        setBomRows(tmpl.ingredients.map(ing => ({
          product_id: ing.raw_product_id,
          sku: ing.sku,
          name: ing.name,
          quantity: Number((ing.standard_qty_per_unit * newTarget).toFixed(3)),
          unit: ing.unit
        })))
      }
    }
  }

  // Presets / Recipe BOM Template helper
  const applyPresetRecipe = (dishId: number) => {
    setSelectedOutputProduct(dishId)
    if (dishId === 38 || dishId === 39) {
      // Full Smokey Guineafowl
      setExpectedOutput(50)
      setBomRows([
        { product_id: 62, sku: 'SKU-00028', name: 'FRESH GUINEAFOWL', quantity: 50, unit: 'PIECES' },
        { product_id: 53, sku: 'SKU-00019', name: 'DRY PEPPER', quantity: 2.5, unit: 'KG' },
        { product_id: 54, sku: 'SKU-00020', name: 'SPICIES (SECRET BLEND)', quantity: 1.0, unit: 'PACK' },
        { product_id: 52, sku: 'SKU-00018', name: 'FIREWOOD', quantity: 4.0, unit: 'BUNDLE' },
      ])
    } else if (dishId === 48) {
      // Beef Jerkey / Kilishi
      setExpectedOutput(30)
      setBomRows([
        { product_id: 63, sku: 'SKU-00029', name: 'FRESH CHICKEN', quantity: 15, unit: 'PIECES' },
        { product_id: 53, sku: 'SKU-00019', name: 'DRY PEPPER', quantity: 2.0, unit: 'KG' },
        { product_id: 54, sku: 'SKU-00020', name: 'SPICIES (SECRET BLEND)', quantity: 1.0, unit: 'PACK' },
      ])
    } else if (dishId === 44) {
      // 1L Rice Bowl
      setExpectedOutput(40)
      setBomRows([
        { product_id: 62, sku: 'SKU-00028', name: 'FRESH GUINEAFOWL', quantity: 20, unit: 'PIECES' },
        { product_id: 55, sku: 'SKU-00021', name: 'VEGETABLE OIL', quantity: 3.0, unit: 'LITRE' },
        { product_id: 54, sku: 'SKU-00020', name: 'SPICIES (SECRET BLEND)', quantity: 1.5, unit: 'PACK' },
      ])
    }
  }

  const handleAddBomRow = () => {
    const raw = rawProducts[0]
    if (!raw) return
    setBomRows(prev => [...prev, {
      product_id: raw.id,
      sku: raw.sku,
      name: raw.name,
      quantity: 1,
      unit: raw.unit
    }])
  }

  const handleRemoveBomRow = (index: number) => {
    setBomRows(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateBomRow = (index: number, field: string, val: any) => {
    setBomRows(prev => prev.map((row, i) => {
      if (i !== index) return row
      if (field === 'product_id') {
        const raw = rawProducts.find(p => p.id === Number(val))
        return {
          ...row,
          product_id: Number(val),
          name: raw?.name || row.name,
          sku: raw?.sku || row.sku,
          unit: raw?.unit || row.unit
        }
      }
      return { ...row, [field]: val }
    }))
  }

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // Dynamic KPIs reflecting custom date range
  const activeBatchesForKPI = useMemo(() => {
    if (!dateRange) return productionBatches
    return productionBatches.filter(b => isWithinDateRange(b.started_at || b.completed_at, dateRange))
  }, [productionBatches, dateRange])

  const totalBatches = activeBatchesForKPI.length
  const pendingBatches = useMemo(() => productionBatches.filter(b => b.status === 'in_production' || b.status === 'draft'), [productionBatches])
  const completedBatches = useMemo(() => productionBatches.filter(b => b.status === 'completed'), [productionBatches])
  const filteredPending = activeBatchesForKPI.filter(b => b.status === 'in_production' || b.status === 'draft')
  const filteredCompleted = activeBatchesForKPI.filter(b => b.status === 'completed')
  const totalProducedUnits = filteredCompleted.reduce((acc, b) => acc + b.actual_output, 0)

  // Actions
  const handleOpenComplete = (b: ProductionBatch) => {
    setSelectedBatch(b)
    setActualOutput(b.expected_output)
    setWastage(0)
    setQcNotes('Smoker cycle completed. Core temp passed HACCP inspection.')
    setIsCompleteModalOpen(true)
  }

  const handleOpenPreview = (b: ProductionBatch) => {
    setSelectedBatch(b)
    setIsPreviewModalOpen(true)
  }

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const targetProduct = salesProducts.find(p => p.id === Number(selectedOutputProduct))
    if (!targetProduct) return

    createBatch({
      outputProductId: targetProduct.id,
      outputProductName: targetProduct.name,
      expectedOutput: Number(expectedOutput),
      remarks: batchRemarks,
      rawMaterials: bomRows
    })
    setIsCreateModalOpen(false)
  }

  const handleConfirmComplete = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    completeBatch(selectedBatch.id, Number(actualOutput), Number(wastage), qcNotes)
    setIsCompleteModalOpen(false)
  }

  // Columns for Pending Batches
  const pendingColumns: ColumnDef<ProductionBatch>[] = [
    {
      key: 'batch_ref',
      header: 'Batch Ref',
      accessor: (b) => (
        <Tooltip content="Click to view recipe & ingredients">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenPreview(b)
            }}
            className="font-semibold text-xs text-primary hover:underline hover:text-primary/80 font-sans cursor-pointer flex items-center gap-1"
          >
            <span>{b.batch_ref}</span>
          </button>
        </Tooltip>
      ),
      sortValue: (b) => b.batch_ref,
    },
    {
      key: 'output_product_name',
      header: 'Target Finished Dish',
      accessor: (b) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">{b.output_product_name}</div>
          <div className="text-xs text-kumo-subtle font-sans">{b.raw_materials.length} raw ingredients formulated</div>
        </div>
      ),
      sortValue: (b) => b.output_product_name,
    },
    {
      key: 'expected_output',
      header: 'Planned Output',
      accessor: (b) => <span className="font-medium text-kumo-strong font-sans text-xs">{b.expected_output} units</span>,
      sortValue: (b) => b.expected_output,
    },
    {
      key: 'status',
      header: 'Cooking Status',
      accessor: (b) => {
        const statusMap: Record<string, { status: 'active' | 'pending' | 'inactive'; label: string }> = {
          in_production: { status: 'pending', label: 'IN SMOKER PIT' },
          draft: { status: 'pending', label: 'PREP QUEUED' },
          cancelled: { status: 'inactive', label: 'CANCELLED' }
        }
        const s = statusMap[b.status] || { status: 'pending', label: b.status.toUpperCase() }
        return <StatusBadge status={s.status} label={s.label} />
      },
      sortValue: (b) => b.status,
    },
    {
      key: 'started_at',
      header: 'Started At',
      accessor: (b) => <span className="text-xs text-kumo-subtle">{b.started_at ? formatDate(b.started_at) : 'Not Started'}</span>,
    },
    {
      key: 'created_by_name',
      header: 'Shift Operator',
      accessor: (b) => <span className="text-xs text-kumo-default">{b.created_by_name}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (b) => (
        <div className="flex items-center" onClick={e => e.stopPropagation()}>
          {b.status === 'draft' ? (
            <Tooltip content="Begin cooking this batch">
              <button
                type="button"
                onClick={() => startBatch(b.id)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs font-sans"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Cooking</span>
              </button>
            </Tooltip>
          ) : (
            <Tooltip content="Record yield and complete this batch">
              <button
                type="button"
                onClick={() => handleOpenComplete(b)}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs font-sans"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Complete Cooking</span>
              </button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  // Columns for Completed Batches
  const completedColumns: ColumnDef<ProductionBatch>[] = [
    {
      key: 'batch_ref',
      header: 'Batch Ref',
      accessor: (b) => <span className="font-medium text-xs text-kumo-strong font-sans">{b.batch_ref}</span>,
      sortValue: (b) => b.batch_ref,
    },
    {
      key: 'output_product_name',
      header: 'Finished Product',
      accessor: (b) => <span className="font-semibold text-kumo-strong font-sans">{b.output_product_name}</span>,
      sortValue: (b) => b.output_product_name,
    },
    {
      key: 'yield',
      header: 'Planned vs Actual Yield',
      accessor: (b) => (
        <div className="flex items-center gap-2 font-sans">
          <span className="text-xs text-kumo-subtle font-sans">{b.expected_output} planned</span>
          <span className="font-semibold text-emerald-700 font-sans text-xs">→ {b.actual_output} units</span>
        </div>
      ),
      sortValue: (b) => b.actual_output,
    },
    {
      key: 'wastage',
      header: 'Cooking Loss / Wastage',
      accessor: (b) => (
        <span className={`text-xs font-sans ${b.wastage > 0 ? 'text-red-600 font-medium' : 'text-kumo-subtle'}`}>
          {b.wastage} units ({((b.wastage / (b.expected_output || 1)) * 100).toFixed(1)}%)
        </span>
      ),
      sortValue: (b) => b.wastage,
    },
    {
      key: 'completed_at',
      header: 'Completed At',
      accessor: (b) => <span className="text-xs text-kumo-subtle">{formatDate(b.completed_at || '')}</span>,
      sortValue: (b) => b.completed_at || '',
    },
    {
      key: 'status',
      header: 'QC Result',
      accessor: (b) => <StatusBadge status="active" label="PASSED & DEPOSITED" />,
    },
    {
      key: 'actions',
      header: 'Inspection',
      accessor: (b) => (
        <button
          type="button"
          onClick={() => handleOpenPreview(b)}
          className="px-2 py-1 text-xs font-medium text-kumo-default bg-kumo-surface hover:bg-kumo-control border border-kumo-line rounded cursor-pointer transition-colors"
        >
          View BOM & QC
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Production Batches & Cooking Recipes
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Formulate multi-ingredient cooking recipes, track active smoking runs in the pit, and automatically credit completed yield into Sales Inventory.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="h-10 px-4 text-sm font-medium shadow-xs"
        >
          Start Cooking Batch
        </Button>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Batches"
          value={totalBatches}
          description={dateRange ? "In selected date range" : "Runs on record"}
          icon={<Factory className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Active Cooking"
          value={filteredPending.length}
          description="In pre-prep or smoker pits"
          icon={<Flame className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Completed Batches"
          value={filteredCompleted.length}
          description="QC inspected & finalized"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Total Units Cooked"
          value={`${totalProducedUnits} units`}
          description="Added to sales inventory"
          icon={<Clock className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'pending', label: 'Active Batches', badge: pendingBatches.length },
            { id: 'completed', label: 'Finished Batches', badge: completedBatches.length },
          ]}
        />
      </div>

      {/* Tables */}
      <div>
        {activeTab === 'pending' ? (
          <DataTable
            data={pendingBatches}
            columns={pendingColumns}
            searchable={true}
            searchPlaceholder="Search active batch..."
            exportFilename="smokey-active-batches"
            onDateRangeChange={setDateRange}
          />
        ) : (
          <DataTable
            data={completedBatches}
            columns={completedColumns}
            searchable={true}
            searchPlaceholder="Search completed run..."
            exportFilename="smokey-completed-batches"
            onDateRangeChange={setDateRange}
          />
        )}
      </div>

      {/* MODAL 1: Create Batch */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Start Cooking Batch (Recipe & Ingredients)"
        description="Select the dish to cook, target output portions, and choose raw ingredients to use."
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmCreate} className="space-y-4">
          <Select
            label="Cooking Recipe Template"
            value={selectedRecipeTemplateId}
            onChange={(e) => handleSelectRecipeTemplate(e.target.value)}
            options={[
              { value: 'custom', label: 'Custom Formulation (Manual Recipe)' },
              ...recipeTemplates.map(t => ({
                value: t.id,
                label: `${t.output_product_name} — ${t.version_name} (Std: ${t.standard_batch_size} units)`
              }))
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Output Finished Product"
              value={selectedOutputProduct}
              onChange={(e) => {
                setSelectedOutputProduct(Number(e.target.value))
                setSelectedRecipeTemplateId('custom')
              }}
              options={salesProducts.map(p => ({ value: p.id, label: p.name }))}
            />
            <UnitInput
              label="Batch Target Output"
              value={expectedOutput}
              onChangeValue={handleExpectedOutputChange}
              unit="portions"
              min={1}
              required
            />
          </div>

          {/* BOM Ingredients List */}
          <div className="space-y-2.5 pt-2 border-t border-kumo-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-kumo-strong uppercase tracking-wider font-sans">
                Raw Ingredients to Use (Recipe List)
              </span>
              <button
                type="button"
                onClick={handleAddBomRow}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium font-sans"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>

            {/* Sub-header labels for alignment */}
            <div className="grid grid-cols-12 gap-2 px-2 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider">
              <div className="col-span-7">Raw Material</div>
              <div className="col-span-4">Batch Allocation</div>
              <div className="col-span-1 text-center">Remove</div>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {bomRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2.5 bg-kumo-surface border border-kumo-line rounded-lg text-xs font-sans">
                  <div className="col-span-7">
                    <Select
                      value={row.product_id}
                      onChange={(e) => handleUpdateBomRow(idx, 'product_id', e.target.value)}
                      options={rawProducts.map(rp => ({
                        value: rp.id,
                        label: `${rp.name} (${rp.stock_qty} ${formatUnit(rp.unit)} on-hand)`
                      }))}
                      size="sm"
                      buttonClassName="h-9 text-xs font-normal"
                    />
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center rounded-lg border border-kumo-line bg-kumo-base overflow-hidden h-9 shadow-2xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        value={row.quantity}
                        onChange={(e) => handleUpdateBomRow(idx, 'quantity', Number(e.target.value))}
                        className="w-full h-full px-2.5 text-xs font-sans text-kumo-strong bg-transparent focus:outline-none"
                        placeholder="0.0"
                      />
                      <span className="px-2.5 h-full flex items-center text-[11px] font-medium text-kumo-subtle bg-kumo-tint/60 border-l border-kumo-line shrink-0 select-none lowercase">
                        {formatUnit(row.unit)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBomRow(idx)}
                      className="p-1.5 text-kumo-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Pit Remarks & Smoker Instructions"
            placeholder="e.g. Oak wood smoke for 5 hours at 80°C"
            value={batchRemarks}
            onChange={(e) => setBatchRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Queue Batch in Prep
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Complete Batch (fpBatchCompleteModal) */}
      <Dialog
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Batch: ${selectedBatch?.batch_ref} (${selectedBatch?.output_product_name})`}
        description="Verify actual cooking yield, log waste, and automatically deposit finished items into Sales Inventory."
      >
        <form onSubmit={handleConfirmComplete} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Target Output:</span>
              <span className="font-semibold text-kumo-strong font-sans">{selectedBatch?.expected_output} units</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <UnitInput
              label="Actual Cooked Output"
              value={actualOutput}
              onChangeValue={setActualOutput}
              unit="portions"
              min={0}
              helperText="Will be added directly to Sales Inventory"
              required
            />
            <UnitInput
              label="Cooking Loss / Wastage"
              value={wastage}
              onChangeValue={setWastage}
              unit="portions"
              min={0}
              helperText="Unusable / burnt portions"
              required
            />
          </div>

          {/* Cooking Yield Tolerance Calculation (Section 9.2 Invariant 2) */}
          {(() => {
            const expected = selectedBatch?.expected_output || 1
            const variancePct = ((actualOutput - expected) / expected) * 100
            const isOutOfTolerance = Math.abs(variancePct) > 5.0
            return (
              <div className={`p-3 rounded-lg text-xs space-y-1 font-sans border ${
                isOutOfTolerance
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    {isOutOfTolerance ? (
                      <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    Cooking Yield Variance: {variancePct > 0 ? `+${variancePct.toFixed(1)}%` : `${variancePct.toFixed(1)}%`}
                  </span>
                  <span className="text-[11px] font-normal uppercase tracking-wider">
                    {isOutOfTolerance ? 'Tolerance Exceeded (±5%)' : 'Within Tolerance (±5%)'}
                  </span>
                </div>
                {isOutOfTolerance && (
                  <p className="text-[11px] leading-relaxed">
                    Batch yield deviates beyond standard ±5.0% threshold. Mandatory supervisor sign-off and explanation notes required in QC Notes below.
                  </p>
                )}
              </div>
            )
          })()}

          <Input
            label="Quality Control & Inspection Notes"
            value={qcNotes}
            onChange={(e) => setQcNotes(e.target.value)}
            required
          />

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 font-sans">
            <strong>Automated Action:</strong> Submitting will mark this run completed and increment <strong>+{actualOutput} units</strong> in Sales Inventory for immediate customer dispatch.
          </div>

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line font-sans">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirm & Deposit Finished Stock
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 3: Preview BOM Details */}
      <Dialog
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Cooking Recipe: ${selectedBatch?.batch_ref}`}
        description={`Recipe specifications for ${selectedBatch?.output_product_name}`}
      >
        <div className="space-y-4 font-sans">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Product:</span>
              <span className="font-semibold text-kumo-strong">{selectedBatch?.output_product_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Expected Yield:</span>
              <span className="font-semibold text-kumo-strong font-sans">{selectedBatch?.expected_output} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Current Status:</span>
              <span className="font-semibold uppercase text-primary">{selectedBatch?.status.replace('_', ' ')}</span>
            </div>
            {selectedBatch?.remarks && (
              <div className="pt-1 border-t border-kumo-line text-kumo-subtle">
                <em>{selectedBatch.remarks}</em>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-kumo-strong uppercase mb-2">Formulated Ingredients</h4>
            <div className="space-y-1.5">
              {selectedBatch?.raw_materials.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-kumo-surface border border-kumo-line rounded-lg text-xs font-sans">
                  <div>
                    <span className="font-medium text-kumo-strong">{m.name}</span>
                    <span className="text-[10px] text-kumo-subtle ml-2 font-sans">[{m.sku}]</span>
                  </div>
                  <span className="font-medium text-kumo-strong font-sans">{m.quantity} {m.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-kumo-line font-sans">
            <div>
              {selectedBatch && selectedBatch.status !== 'completed' && selectedBatch.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => {
                    cancelBatch(selectedBatch.id)
                    setIsPreviewModalOpen(false)
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel Batch</span>
                </button>
              )}
            </div>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
export default ProductionBatchesPage
