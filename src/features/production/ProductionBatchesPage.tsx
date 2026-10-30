import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { ProductionBatch, RawMaterialBOM } from '@/lib/smokeyData'
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
  AlertOctagon,
  Pencil,
  Save,
  Check
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
    cancelBatch,
    updateBatch,
    saveCustomRecipeTemplate
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'active' | 'ongoing' | 'completed'>('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null)

  // Edit Batch State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [batchToEdit, setBatchToEdit] = useState<ProductionBatch | null>(null)
  const [editBatchForm, setEditBatchForm] = useState({
    output_product_id: 0,
    expected_output: 0,
    actual_output: 0,
    wastage: 0,
    created_by_name: '',
    remarks: '',
  })
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null)

  // Save Recipe Template State
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false)
  const [templateVersionName, setTemplateVersionName] = useState('')
  const [templateSuccessFeedback, setTemplateSuccessFeedback] = useState<string | null>(null)

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
  const prepQueuedBatches = useMemo(() => productionBatches.filter(b => b.status === 'draft'), [productionBatches])
  const producingBatches = useMemo(() => productionBatches.filter(b => b.status === 'in_production'), [productionBatches])
  const completedBatches = useMemo(() => productionBatches.filter(b => b.status === 'completed'), [productionBatches])

  const filteredPrepQueued = activeBatchesForKPI.filter(b => b.status === 'draft')
  const filteredProducing = activeBatchesForKPI.filter(b => b.status === 'in_production')
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

  const handleOpenEdit = (b: ProductionBatch) => {
    setBatchToEdit(b)
    setEditBatchForm({
      output_product_id: b.output_product_id,
      expected_output: b.expected_output,
      actual_output: b.actual_output,
      wastage: b.wastage,
      created_by_name: b.created_by_name,
      remarks: b.remarks || '',
    })
    setEditSuccessMsg(null)
    setIsEditModalOpen(true)
  }

  const handleSaveBatchEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchToEdit) return
    const targetProduct = salesProducts.find(p => p.id === Number(editBatchForm.output_product_id))

    updateBatch(batchToEdit.id, {
      output_product_id: Number(editBatchForm.output_product_id),
      output_product_name: targetProduct?.name || batchToEdit.output_product_name,
      expected_output: Number(editBatchForm.expected_output),
      actual_output: Number(editBatchForm.actual_output),
      wastage: Number(editBatchForm.wastage),
      created_by_name: editBatchForm.created_by_name,
      remarks: editBatchForm.remarks,
    })
    setEditSuccessMsg('Batch corrections saved successfully.')
    setTimeout(() => {
      setEditSuccessMsg(null)
      setIsEditModalOpen(false)
    }, 1200)
  }

  const handleConfirmSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateVersionName.trim()) return

    const targetProduct = salesProducts.find(p => p.id === selectedOutputProduct)
    const newIngredients = bomRows.map(row => ({
      raw_product_id: row.product_id,
      sku: row.sku,
      name: row.name,
      standard_qty_per_unit: Number((row.quantity / (expectedOutput || 1)).toFixed(4)),
      unit: row.unit
    }))

    saveCustomRecipeTemplate({
      version_name: templateVersionName.trim(),
      output_product_id: selectedOutputProduct,
      output_product_name: targetProduct?.name || 'Dish',
      standard_batch_size: expectedOutput,
      standard_yield_percent: 100,
      unit: targetProduct?.unit || 'PIECES',
      allowed_variance_pct: 5,
      ingredients: newIngredients
    })

    setTemplateSuccessFeedback(`Saved recipe template "${templateVersionName.trim()}"!`)
    setIsSaveTemplateModalOpen(false)
    setTemplateVersionName('')
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

  // Columns for Active / Prep Queued Batches (Needing Action to Start Cooking)
  const activeColumns: ColumnDef<ProductionBatch>[] = [
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
      accessor: () => <StatusBadge status="draft" label="no-action" />,
      sortValue: (b) => b.status,
    },
    {
      key: 'started_at',
      header: 'Queue Status',
      accessor: () => <span className="text-xs text-kumo-subtle font-sans">Awaiting Pit Start</span>,
    },
    {
      key: 'created_by_name',
      header: 'Shift Operator',
      accessor: (b) => <span className="text-xs text-kumo-default font-sans">{b.created_by_name}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 200,
      accessor: (b) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="Begin cooking this batch in smoker pit">
            <TableActionButton
              variant="primary"
              onClick={() => startBatch(b.id)}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Start Cooking
            </TableActionButton>
          </Tooltip>

          <Tooltip content="Edit batch details or correct recipe quantities">
            <button
              type="button"
              onClick={() => handleOpenEdit(b)}
              className="p-1.5 text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint rounded-lg transition-colors cursor-pointer border border-kumo-line shrink-0 flex-none"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ]

  // Columns for On-going / Producing Batches (Needing Action to Complete Cooking)
  const ongoingColumns: ColumnDef<ProductionBatch>[] = [
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
      header: 'Cooking Product',
      accessor: (b) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">{b.output_product_name}</div>
          <div className="text-xs text-kumo-subtle font-sans">{b.raw_materials.length} ingredients loaded in pit</div>
        </div>
      ),
      sortValue: (b) => b.output_product_name,
    },
    {
      key: 'expected_output',
      header: 'Batch Capacity',
      accessor: (b) => <span className="font-medium text-kumo-strong font-sans text-xs">{b.expected_output} units</span>,
      sortValue: (b) => b.expected_output,
    },
    {
      key: 'status',
      header: 'Cooking Status',
      accessor: () => <StatusBadge status="in-progress" label="in-progress" />,
      sortValue: (b) => b.status,
    },
    {
      key: 'started_at',
      header: 'Cooking Since',
      accessor: (b) => <span className="text-xs text-kumo-subtle font-sans">{b.started_at ? formatDate(b.started_at) : 'In progress'}</span>,
    },
    {
      key: 'created_by_name',
      header: 'Pitmaster',
      accessor: (b) => <span className="text-xs text-kumo-default font-sans">{b.created_by_name}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 210,
      accessor: (b) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="Record QC yield and complete cooking">
            <TableActionButton
              variant="success"
              onClick={() => handleOpenComplete(b)}
              leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
            >
              Complete Cooking
            </TableActionButton>
          </Tooltip>

          <Tooltip content="Edit batch parameters">
            <button
              type="button"
              onClick={() => handleOpenEdit(b)}
              className="p-1.5 text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint rounded-lg transition-colors cursor-pointer border border-kumo-line shrink-0 flex-none"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
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
      defaultWidth: 190,
      accessor: (b) => <StatusBadge status="completed" label="completed" />,
    },
    {
      key: 'actions',
      header: 'Inspection',
      defaultWidth: 180,
      accessor: (b) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <TableActionButton
            variant="outline"
            onClick={() => handleOpenPreview(b)}
          >
            View BOM & QC
          </TableActionButton>
          <Tooltip content="Correct yield, wastage, or shift notes">
            <button
              type="button"
              onClick={() => handleOpenEdit(b)}
              className="p-1 text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint rounded-lg transition-colors cursor-pointer border border-kumo-line shrink-0 flex-none"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Production Batches & Cooking Recipes"
        subtitle="Formulate multi-ingredient cooking recipes, track active smoking runs in the pit, and automatically credit completed yield into Sales Inventory."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="h-10 px-4 text-sm font-medium shadow-xs"
          >
            Start Cooking Batch
          </Button>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Batches"
          value={totalBatches}
          description={dateRange ? "In selected date range" : "All batches recorded"}
          icon={<Factory className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Prep Queued"
          value={filteredPrepQueued.length}
          description="Awaiting smoker ignition"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Producing (In Pit)"
          value={filteredProducing.length}
          description="Cooking in smoker chambers"
          icon={<Flame className="w-4 h-4 text-rose-500" />}
        />
        <MetricCard
          title="Finished Batches"
          value={filteredCompleted.length}
          description="QC inspected & finalized"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'active', label: 'Active Batches', badge: prepQueuedBatches.length },
            { id: 'ongoing', label: 'On-going Batches', badge: producingBatches.length },
            { id: 'completed', label: 'Finished Batches', badge: completedBatches.length },
          ]}
        />
      </div>

      {/* Tables */}
      <div>
        {activeTab === 'active' && (
          <DataTable
            data={prepQueuedBatches}
            columns={activeColumns}
            searchable={true}
            searchPlaceholder="Search active prep batches..."
            title="Active Prep Queued Batch"
            exportFilename="smokey-active-prep-batches"
            onRowClick={(b) => handleOpenPreview(b)}
            onDateRangeChange={setDateRange}
          />
        )}
        {activeTab === 'ongoing' && (
          <DataTable
            data={producingBatches}
            columns={ongoingColumns}
            searchable={true}
            searchPlaceholder="Search on-going producing runs..."
            title="On-going Producing Batch"
            exportFilename="smokey-producing-batches"
            onRowClick={(b) => handleOpenPreview(b)}
            onDateRangeChange={setDateRange}
          />
        )}
        {activeTab === 'completed' && (
          <DataTable
            data={completedBatches}
            columns={completedColumns}
            searchable={true}
            searchPlaceholder="Search finished cooking runs..."
            title="Finished Cooking Run"
            exportFilename="smokey-completed-batches"
            onRowClick={(b) => handleOpenPreview(b)}
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
        maxWidth="3xl"
      >
        <form onSubmit={handleConfirmCreate} className="space-y-4 font-sans">
          {templateSuccessFeedback && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{templateSuccessFeedback}</span>
            </div>
          )}

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
            size="md"
          />

          <Select
            label="Output Finished Product"
            value={selectedOutputProduct}
            onChange={(e) => {
              setSelectedOutputProduct(Number(e.target.value))
              setSelectedRecipeTemplateId('custom')
            }}
            options={salesProducts.map(p => ({ value: p.id, label: p.name }))}
            size="md"
          />

          <UnitInput
            label="Batch Target Output"
            value={expectedOutput}
            onChangeValue={handleExpectedOutputChange}
            unit="portions"
            min={1}
            required
          />

          {/* BOM Ingredients List */}
          <div className="space-y-3 pt-3 border-t border-kumo-line">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[12px] font-semibold text-kumo-strong uppercase tracking-wider font-sans">
                Raw Ingredients to Use (Recipe List)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTemplateVersionName('')
                    setIsSaveTemplateModalOpen(true)
                  }}
                >
                  Save as Recipe Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddBomRow}
                >
                  Add Ingredient
                </Button>
              </div>
            </div>

            {/* Sub-header labels for alignment */}
            <div className="grid grid-cols-12 gap-3 px-2 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider">
              <div className="col-span-8">Raw Material</div>
              <div className="col-span-3">Batch Allocation</div>
              <div className="col-span-1 text-center">Remove</div>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {bomRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center text-xs font-sans">
                  <div className="col-span-8">
                    <Select
                      value={row.product_id}
                      onChange={(e) => handleUpdateBomRow(idx, 'product_id', e.target.value)}
                      options={rawProducts.map(rp => ({
                        value: rp.id,
                        label: `${rp.name} (${rp.stock_qty} ${formatUnit(rp.unit)} on-hand)`
                      }))}
                      size="md"
                      buttonClassName="h-10 text-[13px] font-normal"
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center rounded-lg border border-kumo-line bg-kumo-base overflow-hidden h-10 shadow-2xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        value={row.quantity}
                        onChange={(e) => handleUpdateBomRow(idx, 'quantity', Number(e.target.value))}
                        className="flex-1 min-w-0 h-full px-3 text-[13px] font-sans text-kumo-strong bg-transparent focus:outline-none"
                        placeholder="0.0"
                      />
                      <span className="w-20 shrink-0 h-full flex items-center justify-center text-center px-2 text-[12px] font-medium text-kumo-subtle bg-kumo-tint/60 border-l border-kumo-line select-none lowercase">
                        {formatUnit(row.unit)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBomRow(idx)}
                      className="p-2 text-kumo-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                      title="Remove ingredient"
                    >
                      <Trash2 className="w-4 h-4" />
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

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
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
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Target Output:</span>
              <span className="font-semibold text-kumo-strong font-sans">{selectedBatch?.expected_output} units</span>
            </div>
          </div>

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
              <div className="pt-1.5 border-t border-kumo-line text-kumo-subtle text-xs">
                <em>{selectedBatch.remarks}</em>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-kumo-strong uppercase mb-2">Formulated Ingredients</h4>
            <div className="space-y-1.5">
              {selectedBatch?.raw_materials.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-kumo-surface border border-kumo-line rounded-lg text-xs font-sans">
                  <div>
                    <span className="font-medium text-kumo-strong">{m.name}</span>
                    <span className="text-[11px] text-kumo-subtle ml-2 font-sans">[{m.sku}]</span>
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
                  className="px-3.5 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
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

      {/* MODAL 4: Save Recipe Template */}
      <Dialog
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        title="Save as Recipe Template"
        description="Save this BOM formulation as an official standard recipe template for future kitchen batch runs."
      >
        <form onSubmit={handleConfirmSaveTemplate} className="space-y-4">
          <Input
            label="Template Version / Name"
            placeholder="e.g. Signature Charcoal Smoked Chicken v2"
            value={templateVersionName}
            onChange={(e) => setTemplateVersionName(e.target.value)}
            required
            autoFocus
          />

          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Target Finished Dish:</span>
              <span className="font-semibold text-kumo-strong">
                {salesProducts.find(p => p.id === selectedOutputProduct)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Standard Batch Size:</span>
              <span className="font-semibold text-kumo-strong font-mono">{expectedOutput} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Formulated Ingredients:</span>
              <span className="font-semibold text-kumo-strong">{bomRows.length} items</span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto border border-kumo-line rounded-lg p-2 bg-kumo-base">
            <div className="text-[11px] font-semibold text-kumo-subtle uppercase px-1 pb-1 border-b border-kumo-line">
              Ingredient Ratios Per Portioned Unit
            </div>
            {bomRows.map((row, i) => (
              <div key={i} className="flex justify-between items-center text-xs px-1 py-1">
                <span className="font-medium text-kumo-strong">{row.name}</span>
                <span className="font-mono text-kumo-subtle text-[11px]">
                  {(row.quantity / (expectedOutput || 1)).toFixed(3)} {row.unit} / unit
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-kumo-line">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsSaveTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" leftIcon={<Sparkles className="w-4 h-4" />}>
              Save Recipe Template
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 5: Edit Batch (Mistake Correction) */}
      {batchToEdit && (
        <Dialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Batch: ${batchToEdit.batch_ref}`}
          description="Correct planned yield, actual output, cooking wastage, or shift operator notes."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveBatchEdit} className="space-y-4 font-sans">
            {editSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <Select
              label="Target Finished Dish"
              value={editBatchForm.output_product_id}
              onChange={(e) => setEditBatchForm(prev => ({ ...prev, output_product_id: Number(e.target.value) }))}
              options={salesProducts.map(p => ({ value: p.id, label: p.name }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Planned Output (Units)"
                type="number"
                min="1"
                value={editBatchForm.expected_output}
                onChange={(e) => setEditBatchForm(prev => ({ ...prev, expected_output: Number(e.target.value) }))}
                required
              />
              <Input
                label="Actual Cooked Output (Units)"
                type="number"
                min="0"
                value={editBatchForm.actual_output}
                onChange={(e) => setEditBatchForm(prev => ({ ...prev, actual_output: Number(e.target.value) }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cooking Loss / Wastage (Units)"
                type="number"
                min="0"
                value={editBatchForm.wastage}
                onChange={(e) => setEditBatchForm(prev => ({ ...prev, wastage: Number(e.target.value) }))}
                required
              />
              <Input
                label="Shift Operator / Pitmaster"
                value={editBatchForm.created_by_name}
                onChange={(e) => setEditBatchForm(prev => ({ ...prev, created_by_name: e.target.value }))}
                required
              />
            </div>

            <Input
              label="Batch Notes & Shift Remarks"
              value={editBatchForm.remarks}
              onChange={(e) => setEditBatchForm(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Pit #2 smoke cycle, wood type, temperature checks"
            />

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-kumo-line">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" leftIcon={<Save className="w-4 h-4" />}>
                Save Corrections
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
export default ProductionBatchesPage
