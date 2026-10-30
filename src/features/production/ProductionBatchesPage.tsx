import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { ProductionBatch, RawMaterialBOM, IntermediatePrep, IntermediatePrepAllocation } from '@/lib/smokeyData'
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
import { formatNaira, formatQuantity, formatDate, cn } from '@/lib/utils'

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
  Check,
  Utensils,
  Settings,
  ShoppingCart,
  Layers,
  ArrowRightLeft,
  RotateCcw,
  Scale
} from 'lucide-react'

export const ProductionBatchesPage: React.FC = () => {
  const {
    productionBatches,
    salesProducts,
    rawProducts,
    recipeTemplates,
    intermediatePreps,
    createBatch,
    startBatch,
    completeBatch,
    cancelBatch,
    updateBatch,
    saveCustomRecipeTemplate,
    updateRecipeTemplate,
    deleteRecipeTemplate,
    createIntermediatePrep,
    allocatePrepToBatch,
    returnPrepToCentral
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'active' | 'ongoing' | 'completed' | 'intermediate_preps'>('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null)

  // Intermediate Preps State
  const [isCreatePrepModalOpen, setIsCreatePrepModalOpen] = useState(false)
  const [isAllocatePrepModalOpen, setIsAllocatePrepModalOpen] = useState(false)
  const [isReturnPrepModalOpen, setIsReturnPrepModalOpen] = useState(false)
  const [isPrepProvenanceModalOpen, setIsPrepProvenanceModalOpen] = useState(false)
  const [selectedPrep, setSelectedPrep] = useState<IntermediatePrep | null>(null)

  // Create Prep Form State
  const [prepRecipeName, setPrepRecipeName] = useState('Signature Pepper Mix & Marinade')
  const [prepUnit, setPrepUnit] = useState<'kg' | 'L'>('kg')
  const [prepYieldQty, setPrepYieldQty] = useState<number>(20)
  const [prepPreparedBy, setPrepPreparedBy] = useState('Chef Tunde')
  const [prepIngredients, setPrepIngredients] = useState<Array<{ productId: number; quantity: number }>>([
    { productId: 11, quantity: 12 }, // Scotch Bonnet Pepper
    { productId: 12, quantity: 6 },  // Red Onions
    { productId: 15, quantity: 2 },  // Spice Blend
  ])

  // Allocate Prep to Batch Form State
  const [allocTargetProduct, setAllocTargetProduct] = useState('Smoked Guinea Fowl')
  const [allocBatchRef, setAllocBatchRef] = useState('BAT-20261030-01')
  const [allocQty, setAllocQty] = useState<number>(5)
  const [allocBy, setAllocBy] = useState('Shift Chef')

  // Return Prep to Central Hub Form State
  const [returnPrepQty, setReturnPrepQty] = useState<number>(2)
  const [returnPrepNotes, setReturnPrepNotes] = useState('Sealed in food-grade container for Hub Cold Storage')
  const [returnPrepBy, setReturnPrepBy] = useState('Shift Chef')

  // Manage & Edit Recipe Templates State
  const [isManageTemplatesModalOpen, setIsManageTemplatesModalOpen] = useState(false)
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<any | null>(null)
  const [editTemplateForm, setEditTemplateForm] = useState<{
    version_name: string
    standard_batch_size: number
    ingredients: Array<{
      raw_product_id: number
      sku: string
      name: string
      standard_qty_per_unit: number
      unit: string
    }>
  }>({
    version_name: '',
    standard_batch_size: 50,
    ingredients: []
  })

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
  const [batchSchedule, setBatchSchedule] = useState<'today' | 'tomorrow_morning'>('today')
  const [estimatedReadyTime, setEstimatedReadyTime] = useState<string>('Today 1:30 PM')
  const [feedSalesInventory, setFeedSalesInventory] = useState<boolean>(true)
  const [bomRows, setBomRows] = useState<RawMaterialBOM[]>([
    { product_id: 62, sku: 'SKU-00028', name: 'FRESH GUINEAFOWL', quantity: 50, unit: 'PIECES' },
    { product_id: 53, sku: 'SKU-00019', name: 'DRY PEPPER', quantity: 2.5, unit: 'KG' },
    { product_id: 54, sku: 'SKU-00020', name: 'SPICIES (SECRET BLEND)', quantity: 1.0, unit: 'PACK' },
    { product_id: 52, sku: 'SKU-00018', name: 'FIREWOOD', quantity: 4.0, unit: 'BUNDLE' },
  ])

  const handleOpenTodayBatch = () => {
    setBatchSchedule('today')
    setEstimatedReadyTime('Today 1:30 PM')
    setFeedSalesInventory(true)
    setBatchRemarks('Standard daytime smoke cycle')
    setIsCreateModalOpen(true)
  }

  const handleOpenTomorrowBatch = () => {
    setBatchSchedule('tomorrow_morning')
    setEstimatedReadyTime('Tomorrow 9:30 AM')
    setFeedSalesInventory(true)
    setBatchRemarks('Next-day morning smoke cycle. Feeds overnight website pre-orders.')
    setIsCreateModalOpen(true)
  }

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

  const handleOpenEditTemplate = (templateId: number) => {
    const tmpl = recipeTemplates.find(t => t.id === templateId)
    if (!tmpl) return
    setTemplateToEdit(tmpl)
    setEditTemplateForm({
      version_name: tmpl.version_name,
      standard_batch_size: tmpl.standard_batch_size,
      ingredients: tmpl.ingredients.map(ing => ({ ...ing }))
    })
    setIsEditTemplateModalOpen(true)
  }

  const handleSaveEditedTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateToEdit || !editTemplateForm.version_name.trim()) return

    updateRecipeTemplate(templateToEdit.id, {
      version_name: editTemplateForm.version_name.trim(),
      standard_batch_size: Number(editTemplateForm.standard_batch_size) || 1,
      ingredients: editTemplateForm.ingredients
    })

    // If currently selected template in create modal, refresh loaded formulation
    if (selectedRecipeTemplateId === templateToEdit.id) {
      setExpectedOutput(Number(editTemplateForm.standard_batch_size) || 1)
      setBomRows(editTemplateForm.ingredients.map(ing => ({
        product_id: ing.raw_product_id,
        sku: ing.sku,
        name: ing.name,
        quantity: Number((ing.standard_qty_per_unit * (Number(editTemplateForm.standard_batch_size) || 1)).toFixed(3)),
        unit: ing.unit
      })))
      setBatchRemarks(`Standard BOM Run: ${editTemplateForm.version_name.trim()} (Yield Target: ${editTemplateForm.standard_batch_size} units)`)
    }

    setIsEditTemplateModalOpen(false)
    setTemplateToEdit(null)
  }

  const handleDeleteTemplate = (templateId: number) => {
    deleteRecipeTemplate(templateId)
    if (selectedRecipeTemplateId === templateId) {
      setSelectedRecipeTemplateId('custom')
    }
  }

  const handleUpdateEditTemplateIngredient = (idx: number, field: string, val: any) => {
    setEditTemplateForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => {
        if (i !== idx) return ing
        if (field === 'raw_product_id') {
          const raw = rawProducts.find(p => p.id === Number(val))
          return {
            ...ing,
            raw_product_id: Number(val),
            name: raw?.name || ing.name,
            sku: raw?.sku || ing.sku,
            unit: raw?.unit || ing.unit
          }
        }
        return { ...ing, [field]: val }
      })
    }))
  }

  const handleRemoveEditTemplateIngredient = (idx: number) => {
    setEditTemplateForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx)
    }))
  }

  const handleAddEditTemplateIngredient = () => {
    const raw = rawProducts[0]
    if (!raw) return
    setEditTemplateForm(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          raw_product_id: raw.id,
          sku: raw.sku,
          name: raw.name,
          standard_qty_per_unit: 1,
          unit: raw.unit
        }
      ]
    }))
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
      batch_schedule: batchSchedule,
      feed_sales_inventory: feedSalesInventory,
      estimated_ready_time: estimatedReadyTime,
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
      header: 'Planned Output & Sales Feed',
      accessor: (b) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans text-xs">{b.expected_output} units</div>
          {b.feed_sales_inventory !== false ? (
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>+{b.expected_output} to Web Storefront</span>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-400 font-sans">Internal only</span>
          )}
        </div>
      ),
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
      header: 'Schedule & Target Ready',
      accessor: (b) => (
        <div>
          <div className="flex items-center gap-1 font-sans">
            {b.batch_schedule === 'tomorrow_morning' ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Clock className="w-2.5 h-2.5" />
                Tomorrow Morning
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Today Run
              </span>
            )}
          </div>
          <div className="text-[11px] text-kumo-subtle font-sans mt-0.5">
            Est: {b.estimated_ready_time || 'Awaiting ignition'}
          </div>
        </div>
      ),
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
      header: 'Smoker Output & Buffer Feed',
      accessor: (b) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans text-xs">{b.expected_output} units</div>
          {b.feed_sales_inventory !== false && (
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
              <Flame className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
              <span>Selling on Batch (+{b.expected_output})</span>
            </div>
          )}
        </div>
      ),
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
      header: 'Target Ready Time',
      accessor: (b) => (
        <div>
          <div className="text-xs font-semibold text-kumo-strong font-sans flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{b.estimated_ready_time || 'Est. 2-3 hrs'}</span>
          </div>
          <div className="text-[11px] text-kumo-subtle font-sans mt-0.5">
            Cooking since {b.started_at ? formatDate(b.started_at) : 'Active'}
          </div>
        </div>
      ),
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
      header: 'Sales Inventory Deposit',
      accessor: (b) => (
        <div className="font-sans">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>+{b.actual_output} units physical</span>
          </div>
          <div className="text-[11px] text-kumo-subtle mt-0.5">
            Reconciled from {b.expected_output} estimated buffer
          </div>
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

  // Columns for Recipe Preps & Intermediate Mixes
  const intermediateColumns: ColumnDef<IntermediatePrep>[] = [
    {
      key: 'prep_ref',
      header: 'Prep Ref',
      accessor: (p) => <span className="font-mono text-xs font-semibold text-kumo-strong">{p.prep_ref}</span>,
      sortValue: (p) => p.prep_ref,
    },
    {
      key: 'recipe_name',
      header: 'Recipe Mix & Yield',
      accessor: (p) => (
        <div>
          <div className="font-semibold text-kumo-strong">{p.recipe_name}</div>
          <div className="text-[11px] text-zinc-500">
            Initial: {p.initial_yield_qty} {p.unit} &bull; Prepared by {p.prepared_by}
          </div>
        </div>
      ),
      sortValue: (p) => p.recipe_name,
    },
    {
      key: 'remaining_qty',
      header: 'Remaining Stock',
      accessor: (p) => {
        const pct = Math.round((p.remaining_qty / p.initial_yield_qty) * 100)
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{p.remaining_qty} {p.unit}</span>
              <span className="text-zinc-500">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${pct > 40 ? 'bg-emerald-600' : pct > 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </div>
        )
      },
      sortValue: (p) => p.remaining_qty,
    },
    {
      key: 'allocations',
      header: 'Batch Allocations (Cross-Product)',
      accessor: (p) => (
        <div className="space-y-1 max-w-[260px]">
          {p.allocations && p.allocations.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {p.allocations.map((a, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                  {a.target_product_name}: <strong className="ml-1 text-primary">{a.allocated_qty} {p.unit}</strong>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-zinc-400 italic">No batches drawn yet</span>
          )}
        </div>
      ),
      sortValue: (p) => p.allocations.length,
    },
    {
      key: 'returned_to_hub_qty',
      header: 'Hub Cold Storage',
      accessor: (p) => {
        if (!p.returned_to_hub_qty || p.returned_to_hub_qty <= 0) {
          return <span className="text-xs text-zinc-400">&mdash;</span>
        }
        return (
          <div className="text-xs font-medium text-emerald-700 flex items-center gap-1 font-mono">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>+{p.returned_to_hub_qty} {p.unit} in Hub</span>
          </div>
        )
      },
      sortValue: (p) => p.returned_to_hub_qty || 0,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (p) => {
        if (p.status === 'active') return <StatusBadge status="active" label="active prep" />
        if (p.status === 'returned_to_hub') return <StatusBadge status="pending" label="returned to hub" />
        return <StatusBadge status="inactive" label="exhausted" />
      },
      sortValue: (p) => p.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 260,
      accessor: (p) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="Trace source raw materials and multi-batch distribution timeline">
            <TableActionButton
              variant="outline"
              onClick={() => {
                setSelectedPrep(p)
                setIsPrepProvenanceModalOpen(true)
              }}
              leftIcon={<Eye className="w-3.5 h-3.5 text-zinc-500" />}
            >
              Trace
            </TableActionButton>
          </Tooltip>
          {p.remaining_qty > 0 && (
            <>
              <Tooltip content="Allocate remaining mix to a cooking batch (Guinea Fowl, Rabbit, Chicken, etc.)">
                <TableActionButton
                  variant="outline"
                  onClick={() => {
                    setSelectedPrep(p)
                    setAllocTargetProduct('Smoked Guinea Fowl')
                    setAllocBatchRef(`BAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`)
                    setAllocQty(Math.min(5, p.remaining_qty))
                    setIsAllocatePrepModalOpen(true)
                  }}
                  leftIcon={<ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />}
                >
                  Allocate
                </TableActionButton>
              </Tooltip>
              <Tooltip content="Preserve unused prep mix back into Central Warehouse Hub cold storage">
                <TableActionButton
                  variant="outline"
                  onClick={() => {
                    setSelectedPrep(p)
                    setReturnPrepQty(p.remaining_qty)
                    setReturnPrepNotes(`End of shift surplus from ${p.prep_ref} preserved in Hub cold storage`)
                    setIsReturnPrepModalOpen(true)
                  }}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Return Hub
                </TableActionButton>
              </Tooltip>
            </>
          )}
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatePrepModalOpen(true)}
              leftIcon={<Layers className="w-4 h-4 text-primary" />}
              className="h-10 px-3.5 text-xs sm:text-sm font-medium"
            >
              + Recipe Prep Mix
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenTomorrowBatch}
              leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
              className="h-10 px-3.5 text-xs sm:text-sm font-medium"
            >
              Plan Tomorrow's Smoke (Pre-Order Feed)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenTodayBatch}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Start Cooking Batch
            </Button>
          </div>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
          title="In Pit Smokers"
          value={filteredProducing.length}
          description="Cooking in chambers"
          icon={<Flame className="w-4 h-4 text-rose-500" />}
        />
        <MetricCard
          title="Recipe Preps Ready"
          value={`${intermediatePreps.filter(p => p.status === 'active').reduce((acc, p) => acc + p.remaining_qty, 0)} kg/L`}
          description={`${intermediatePreps.filter(p => p.status === 'active').length} active intermediate mixes`}
          icon={<Layers className="w-4 h-4 text-blue-600" />}
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
            { id: 'intermediate_preps', label: 'Recipe Preps & Mixes', badge: intermediatePreps.filter(p => p.status === 'active').length },
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
        {activeTab === 'intermediate_preps' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start sm:items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Shared Intermediate Recipe Preps:</strong> Raw ingredients (peppers, onions, spices) are withdrawn from the Central Warehouse Hub into a shared recipe mix. The mix can be reused across multiple batches (e.g. Guinea Fowl &rarr; Rabbit &rarr; Chicken), and remaining surplus can be returned to Central Hub cold storage.
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreatePrepModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs h-8 px-3 shrink-0 self-start sm:self-auto"
              >
                + New Recipe Prep Mix
              </Button>
            </div>

            <DataTable
              data={intermediatePreps}
              columns={intermediateColumns}
              searchable={true}
              searchPlaceholder="Search recipe preps, mixes..."
              title="Intermediate Recipe Prep"
              exportFilename="smokey-intermediate-recipe-preps"
              onRowClick={(p) => {
                setSelectedPrep(p)
                setIsPrepProvenanceModalOpen(true)
              }}
            />
          </div>
        )}
      </div>

      {/* MODAL 1: Create Batch */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Start Cooking Batch (Recipe & Ingredients)"
        description="Select the dish to cook, target output portions, and choose raw ingredients to use."
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="start-cooking-batch-form">
              Queue Batch in Prep
            </Button>
          </div>
        }
      >
        <form id="start-cooking-batch-form" onSubmit={handleConfirmCreate} className="space-y-5 font-sans">
          {templateSuccessFeedback && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{templateSuccessFeedback}</span>
            </div>
          )}

          {/* Batch Schedule & Storefront Buffer Mode */}
          <div className="p-4 rounded-xl border border-kumo-line bg-kumo-surface/60 space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-kumo-strong uppercase tracking-wider block">
                Batch Schedule & Storefront Buffer Feed
              </span>
              <span className="text-[11px] text-kumo-subtle font-medium">
                {batchSchedule === 'tomorrow_morning' ? 'Overnight Pre-Order Feed' : 'Daytime Active Production'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setBatchSchedule('today')
                  setEstimatedReadyTime('Today 1:30 PM')
                }}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all cursor-pointer font-sans",
                  batchSchedule === 'today'
                    ? "bg-white dark:bg-zinc-800 border-primary ring-1 ring-primary shadow-2xs"
                    : "bg-kumo-base border-kumo-line hover:bg-kumo-tint"
                )}
              >
                <div className="font-semibold text-xs text-kumo-strong flex items-center justify-between">
                  <span>Today's Smoke Run</span>
                  {batchSchedule === 'today' && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="text-[11px] text-kumo-subtle mt-1 leading-relaxed">
                  Active daytime smoking. Buffers online store availability while the batch is cooking in pits.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBatchSchedule('tomorrow_morning')
                  setEstimatedReadyTime('Tomorrow 9:30 AM')
                }}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all cursor-pointer font-sans",
                  batchSchedule === 'tomorrow_morning'
                    ? "bg-white dark:bg-zinc-800 border-amber-600 ring-1 ring-amber-600 shadow-2xs"
                    : "bg-kumo-base border-kumo-line hover:bg-kumo-tint"
                )}
              >
                <div className="font-semibold text-xs text-kumo-strong flex items-center justify-between">
                  <span>Tomorrow Morning Run (Pre-Orders)</span>
                  {batchSchedule === 'tomorrow_morning' && <span className="w-2 h-2 rounded-full bg-amber-600" />}
                </div>
                <div className="text-[11px] text-kumo-subtle mt-1 leading-relaxed">
                  End-of-day handoff (6:00 PM). Allows online customers to pre-order overnight for tomorrow.
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-kumo-line">
              <Input
                label="Target Ready Time"
                value={estimatedReadyTime}
                onChange={(e) => setEstimatedReadyTime(e.target.value)}
                placeholder="e.g. Today 2:30 PM or Tomorrow 9:30 AM"
                required
              />
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-kumo-line bg-kumo-base cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={feedSalesInventory}
                    onChange={(e) => setFeedSalesInventory(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-zinc-300 focus:ring-primary shrink-0"
                  />
                  <div className="text-xs min-w-0">
                    <span className="font-semibold text-kumo-strong block truncate">Feed Storefront Buffer</span>
                    <span className="text-[10px] text-kumo-subtle block truncate">Keeps item bookable online while smoking</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 1: Recipe Template & Target Output */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                  Cooking Recipe Template
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    disabled={selectedRecipeTemplateId === 'custom'}
                    onClick={() => {
                      if (selectedRecipeTemplateId !== 'custom') {
                        handleOpenEditTemplate(Number(selectedRecipeTemplateId))
                      }
                    }}
                    className={cn(
                      "font-medium transition-colors",
                      selectedRecipeTemplateId === 'custom'
                        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-40"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    )}
                  >
                    Edit Template
                  </button>

                  <span className="text-zinc-300 dark:text-zinc-700 select-none">|</span>

                  <button
                    type="button"
                    disabled={selectedRecipeTemplateId === 'custom'}
                    onClick={() => {
                      if (selectedRecipeTemplateId !== 'custom') {
                        handleDeleteTemplate(Number(selectedRecipeTemplateId))
                      }
                    }}
                    className={cn(
                      "font-medium transition-colors",
                      selectedRecipeTemplateId === 'custom'
                        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-40"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    )}
                  >
                    Delete
                  </button>

                  <span className="text-zinc-300 dark:text-zinc-700 select-none">|</span>

                  <button
                    type="button"
                    onClick={() => setIsManageTemplatesModalOpen(true)}
                    className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    Manage Templates ({recipeTemplates.length})
                  </button>
                </div>
              </div>

              <Select
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
            </div>

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
          </div>

          {/* SECTION 2: BOM Ingredients List with Generous Spacing */}
          <div className="pt-6 mt-6 border-t border-kumo-line space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-sans block">
                  Raw Ingredients to Use (Recipe List)
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                  Allocate ingredient quantities to deduct from inventory for this batch
                </span>
              </div>
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

          {/* SECTION 3: Remarks with Top Spacing */}
          <div className="pt-5 border-t border-kumo-line">
            <Input
              label="Production supervisor remarks"
              placeholder="e.g. Quality checks, temperature profile, shift directives"
              value={batchRemarks}
              onChange={(e) => setBatchRemarks(e.target.value)}
            />
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Complete Batch (fpBatchCompleteModal) */}
      <Dialog
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Batch: ${selectedBatch?.batch_ref} (${selectedBatch?.output_product_name})`}
        description="Verify actual cooking yield, log pit shrinkage, and reconcile estimated buffer into Physical Ready Stock in Sales Inventory."
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCompleteModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="complete-batch-form">
              Confirm & Deposit Finished Stock
            </Button>
          </div>
        }
      >
        <form id="complete-batch-form" onSubmit={handleConfirmComplete} className="space-y-4">
          <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-2 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-kumo-line/60">
              <span className="text-kumo-subtle font-medium">Estimated Storefront Buffer:</span>
              <span className="font-semibold text-kumo-strong font-sans">{selectedBatch?.expected_output} portions (Active buffer)</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-kumo-subtle">
              <span>Reconciliation Action:</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Converts estimated buffer into verified Physical Ready Stock
              </span>
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
        </form>
      </Dialog>

      {/* MODAL 3: Preview BOM Details — Adopting Image 2 Structured Divided Sections */}
      <Dialog
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Cooking Recipe: ${selectedBatch?.batch_ref}`}
        description={`Recipe specifications and formulated raw ingredients for ${selectedBatch?.output_product_name}`}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              {selectedBatch && selectedBatch.status === 'draft' && (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      cancelBatch(selectedBatch.id)
                      setIsPreviewModalOpen(false)
                    }}
                  >
                    Cancel Batch
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setIsPreviewModalOpen(false)
                      handleOpenEdit(selectedBatch)
                    }}
                  >
                    Edit Batch
                  </Button>
                </>
              )}
              {selectedBatch && selectedBatch.status === 'in_production' && (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setIsPreviewModalOpen(false)
                      handleOpenEdit(selectedBatch)
                    }}
                  >
                    Edit Batch
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setIsPreviewModalOpen(false)
                      handleOpenComplete(selectedBatch)
                    }}
                  >
                    Complete Batch & Log Output
                  </Button>
                </>
              )}
              {selectedBatch && selectedBatch.status === 'completed' && (
                <Button variant="primary" size="md" onClick={() => setIsPreviewModalOpen(false)}>
                  Done
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
            {/* Section 1: Batch Overview */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Batch Specifications
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                  {selectedBatch?.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start text-[13px]">
                  <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Target Dish</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedBatch?.output_product_name}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Batch Reference</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">{selectedBatch?.batch_ref}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Planned Output</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium font-mono">{selectedBatch?.expected_output} portions</span>
                </div>
                {selectedBatch?.remarks && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Production supervisor remarks</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-normal italic leading-relaxed">{selectedBatch.remarks}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Formulated Ingredients (BOM) */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Formulated Ingredients (BOM)
                </span>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                  {selectedBatch?.raw_materials.length || 0} Ingredients
                </span>
              </div>

              <div className="pt-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                {selectedBatch?.raw_materials.map((m, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.name}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 font-mono">[{m.sku}]</span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      {m.quantity} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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

          <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsSaveTemplateModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit">
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
              label="Production supervisor remarks"
              value={editBatchForm.remarks}
              onChange={(e) => setEditBatchForm(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Quality checks, temperature profile, shift directives"
            />

            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsEditModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" size="md" type="submit">
                Save Corrections
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      {/* MODAL: Manage Recipe Templates */}
      <Dialog
        isOpen={isManageTemplatesModalOpen}
        onClose={() => setIsManageTemplatesModalOpen(false)}
        title="Manage Recipe Templates"
        description="Standard Bill of Materials (BOM) formulas used for automated cooking allocations, yield tracking, and pit runs."
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setIsManageTemplatesModalOpen(false)}
            >
              Close
            </Button>
            <span className="text-xs text-kumo-subtle font-sans">
              {recipeTemplates.length} standard template{recipeTemplates.length === 1 ? '' : 's'} configured
            </span>
          </div>
        }
      >
        <div className="space-y-3 font-sans max-h-[60vh] overflow-y-auto pr-1">
          {recipeTemplates.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-kumo-line rounded-lg text-kumo-subtle text-xs">
              No recipe templates saved yet. Configure ingredients in the batch creator and click "Save as Recipe Template".
            </div>
          ) : (
            recipeTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-kumo-base border border-kumo-line rounded-xl overflow-hidden shadow-2xs transition-colors"
              >
                {/* Header row */}
                <div className="px-4 py-3 bg-kumo-surface/50 border-b border-kumo-line flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-kumo-strong truncate">
                      {template.output_product_name}
                    </div>
                    <div className="text-xs text-kumo-subtle font-mono">
                      {template.version_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTemplate(template.id)}
                      className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Body key-value divided details */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-12 gap-3 pb-2.5 border-b border-kumo-line/60">
                    <div className="col-span-4 text-kumo-subtle font-medium">Standard Batch Output:</div>
                    <div className="col-span-8 font-semibold text-kumo-strong">
                      {template.standard_batch_size} portions
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 pb-2.5 border-b border-kumo-line/60">
                    <div className="col-span-4 text-kumo-subtle font-medium">Target Yield & Tolerance:</div>
                    <div className="col-span-8 text-kumo-default">
                      {template.standard_yield_percent}% (±{template.allowed_variance_pct}%)
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4 text-kumo-subtle font-medium">Formulated Ingredients:</div>
                    <div className="col-span-8 space-y-1">
                      {template.ingredients.map((ing, i) => (
                        <div key={i} className="flex justify-between items-center py-0.5 text-kumo-default">
                          <span className="font-medium text-kumo-strong">{ing.name}</span>
                          <span className="text-kumo-subtle font-mono">
                            {ing.standard_qty_per_unit} {formatUnit(ing.unit)} / portion
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Dialog>

      {/* MODAL: Edit Recipe Template */}
      <Dialog
        isOpen={isEditTemplateModalOpen}
        onClose={() => setIsEditTemplateModalOpen(false)}
        title={`Edit Recipe Template: ${templateToEdit?.version_name || ''}`}
        description="Update version naming, standard batch capacity, and formulated raw ingredient ratios."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setIsEditTemplateModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="edit-recipe-template-form"
            >
              Save Template Changes
            </Button>
          </div>
        }
      >
        <form
          id="edit-recipe-template-form"
          onSubmit={handleSaveEditedTemplate}
          className="space-y-4 font-sans max-h-[60vh] overflow-y-auto pr-1"
        >
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1">
            <span className="text-kumo-subtle font-medium">Target Dish:</span>
            <div className="font-semibold text-kumo-strong text-sm">
              {templateToEdit?.output_product_name}
            </div>
          </div>

          <Input
            label="Template Version / Name"
            value={editTemplateForm.version_name}
            onChange={(e) => setEditTemplateForm(prev => ({ ...prev, version_name: e.target.value }))}
            required
            placeholder="e.g. Standard Smokery Run (Batch 50)"
          />

          <UnitInput
            label="Standard Batch Capacity"
            value={editTemplateForm.standard_batch_size}
            onChangeValue={(v) => setEditTemplateForm(prev => ({ ...prev, standard_batch_size: Number(v) || 1 }))}
            unit="portions"
            min={1}
            required
          />

          <div className="space-y-2.5 pt-3 border-t border-kumo-line">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-kumo-strong uppercase tracking-wider">
                Ingredients Formulation (Qty per 1 finished portion)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddEditTemplateIngredient}
              >
                Add Ingredient
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-3 px-2 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider">
              <div className="col-span-7">Raw Material</div>
              <div className="col-span-4">Qty per Portion</div>
              <div className="col-span-1 text-center">Remove</div>
            </div>

            <div className="space-y-2">
              {editTemplateForm.ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center text-xs">
                  <div className="col-span-7">
                    <Select
                      value={ing.raw_product_id}
                      onChange={(e) => handleUpdateEditTemplateIngredient(idx, 'raw_product_id', e.target.value)}
                      options={rawProducts.map(rp => ({
                        value: rp.id,
                        label: `${rp.name} (${formatUnit(rp.unit)})`
                      }))}
                      size="md"
                      buttonClassName="h-10 text-[13px] font-normal"
                    />
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center rounded-lg border border-kumo-line bg-kumo-base overflow-hidden h-10 shadow-2xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={ing.standard_qty_per_unit}
                        onChange={(e) => handleUpdateEditTemplateIngredient(idx, 'standard_qty_per_unit', Number(e.target.value))}
                        className="flex-1 min-w-0 h-full px-3 text-[13px] font-sans text-kumo-strong bg-transparent focus:outline-none"
                        placeholder="0.0"
                        required
                      />
                      <span className="w-16 shrink-0 h-full flex items-center justify-center text-center px-2 text-[12px] font-medium text-kumo-subtle bg-kumo-tint/60 border-l border-kumo-line select-none lowercase">
                        {formatUnit(ing.unit)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveEditTemplateIngredient(idx)}
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
        </form>
      </Dialog>

      {/* MODAL 5: Create Intermediate Recipe Prep Mix */}
      <Dialog
        isOpen={isCreatePrepModalOpen}
        onClose={() => setIsCreatePrepModalOpen(false)}
        title="Formulate Recipe Prep Mix (Shared Across Batches)"
        description="Withdraw raw ingredients from Central Warehouse to prepare an intermediate mix (e.g. Pepper Mix, Marinade, Herb Glaze) that can be reused across different dish batches."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreatePrepModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              onClick={() => {
                if (!prepRecipeName.trim()) return
                createIntermediatePrep(
                  prepRecipeName,
                  prepIngredients,
                  Number(prepYieldQty),
                  prepUnit,
                  prepPreparedBy
                )
                setIsCreatePrepModalOpen(false)
              }}
            >
              Withdraw from Hub & Formulate Prep
            </Button>
          </div>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Recipe Mix Name"
              placeholder="e.g. Signature Pepper Mix & Marinade"
              value={prepRecipeName}
              onChange={(e) => setPrepRecipeName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-kumo-strong uppercase tracking-wider block mb-1">
                  Expected Yield
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={prepYieldQty}
                  onChange={(e) => setPrepYieldQty(Number(e.target.value))}
                  className="w-full h-9 bg-kumo-base border border-kumo-line rounded-lg px-2.5 text-xs text-kumo-strong focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-mono"
                  required
                />
              </div>
              <Select
                label="Yield Unit"
                value={prepUnit}
                onChange={(e) => setPrepUnit(e.target.value as any)}
                options={[
                  { value: 'kg', label: 'kg (Kilograms)' },
                  { value: 'L', label: 'L (Litres)' },
                ]}
              />
            </div>
          </div>

          <Input
            label="Chef / Prepared By"
            value={prepPreparedBy}
            onChange={(e) => setPrepPreparedBy(e.target.value)}
            placeholder="e.g. Chef Tunde"
            required
          />

          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                Raw Ingredients (Deducted from Central Warehouse Hub)
              </span>
              <button
                type="button"
                onClick={() => {
                  const firstAvail = rawProducts[0]?.id || 11
                  setPrepIngredients(prev => [...prev, { productId: firstAvail, quantity: 2 }])
                }}
                className="text-primary hover:underline text-xs flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {prepIngredients.map((ing, idx) => {
                const prod = rawProducts.find(r => r.id === ing.productId)
                return (
                  <div key={idx} className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Select
                        value={ing.productId}
                        onChange={(e) => {
                          const pid = Number(e.target.value)
                          setPrepIngredients(prev => prev.map((item, i) => i === idx ? { ...item, productId: pid } : item))
                        }}
                        options={rawProducts.map(r => ({
                          value: r.id,
                          label: `${r.name} (Hub Stock: ${r.stock_qty} ${r.unit})`
                        }))}
                        buttonClassName="h-8 text-xs font-normal"
                      />
                    </div>
                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={ing.quantity}
                        onChange={(e) => {
                          const qty = Number(e.target.value)
                          setPrepIngredients(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
                        }}
                        className="w-full h-8 bg-kumo-base border border-kumo-line rounded-lg px-2 text-xs font-mono text-kumo-strong focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                        placeholder="Qty"
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-10 shrink-0 font-medium">{prod?.unit || 'kg'}</span>
                    <button
                      type="button"
                      onClick={() => setPrepIngredients(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Dialog>

      {/* MODAL 6: Allocate Prep to Cooking Batch */}
      {selectedPrep && (
        <Dialog
          isOpen={isAllocatePrepModalOpen}
          onClose={() => setIsAllocatePrepModalOpen(false)}
          title={`Allocate Prep Mix: ${selectedPrep.recipe_name}`}
          description={`Draw from ${selectedPrep.prep_ref} to use in a cooking batch for any menu item (e.g. Guinea Fowl, Rabbit, Chicken).`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsAllocatePrepModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => {
                  const ok = allocatePrepToBatch(
                    selectedPrep.id,
                    allocBatchRef,
                    allocTargetProduct,
                    Number(allocQty),
                    allocBy
                  )
                  if (ok) setIsAllocatePrepModalOpen(false)
                }}
              >
                Confirm Batch Allocation
              </Button>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-zinc-500 block">Available Prep Mix:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{selectedPrep.recipe_name}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block text-[11px]">Remaining on Bench:</span>
                <span className="font-mono font-bold text-emerald-700 text-base">{selectedPrep.remaining_qty} {selectedPrep.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-kumo-strong uppercase tracking-wider block mb-1">
                  Target Product / Dish
                </label>
                <select
                  value={allocTargetProduct}
                  onChange={(e) => setAllocTargetProduct(e.target.value)}
                  className="w-full h-9 bg-kumo-base border border-kumo-line rounded-lg px-2 text-xs text-kumo-strong focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                >
                  <option value="Smoked Guinea Fowl">Smoked Guinea Fowl</option>
                  <option value="Roast Rabbit & Marinade">Roast Rabbit & Marinade</option>
                  <option value="Smoked Turkey Wings">Smoked Turkey Wings</option>
                  <option value="Smoked Catfish">Smoked Catfish</option>
                  <option value="Smokey Beef Jerky (Kilishi)">Smokey Beef Jerky (Kilishi)</option>
                  <option value="Jollof Rice with Guineafowl">Jollof Rice with Guineafowl</option>
                </select>
              </div>

              <Input
                label="Batch Ref Number"
                value={allocBatchRef}
                onChange={(e) => setAllocBatchRef(e.target.value)}
                placeholder="e.g. BAT-20261030-01"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-kumo-strong uppercase tracking-wider block mb-1">
                  Quantity to Draw ({selectedPrep.unit})
                </label>
                <input
                  type="number"
                  min="0.5"
                  max={selectedPrep.remaining_qty}
                  step="0.5"
                  value={allocQty}
                  onChange={(e) => setAllocQty(Number(e.target.value))}
                  className="w-full h-9 bg-kumo-base border border-kumo-line rounded-lg px-2.5 text-xs text-kumo-strong focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-mono"
                  required
                />
              </div>

              <Input
                label="Allocated By / Shift Lead"
                value={allocBy}
                onChange={(e) => setAllocBy(e.target.value)}
                required
              />
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Remaining Prep Mix After Draw:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {Math.max(0, selectedPrep.remaining_qty - allocQty)} {selectedPrep.unit}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500">
                Any leftover mix can be allocated to another batch later or preserved in Central Hub cold storage.
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* MODAL 7: Return Surplus Prep to Central Hub Cold Storage */}
      {selectedPrep && (
        <Dialog
          isOpen={isReturnPrepModalOpen}
          onClose={() => setIsReturnPrepModalOpen(false)}
          title={`Preserve Surplus in Central Hub: ${selectedPrep.recipe_name}`}
          description={`Return leftover prep mix back to Central Warehouse Hub cold storage as a tracked inventory lot.`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsReturnPrepModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => {
                  returnPrepToCentral(
                    selectedPrep.id,
                    Number(returnPrepQty),
                    returnPrepNotes,
                    returnPrepBy
                  )
                  setIsReturnPrepModalOpen(false)
                }}
              >
                Confirm Return to Central Cold Storage
              </Button>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-zinc-500 block">Surplus Available to Return:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{selectedPrep.recipe_name}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-700 text-base">{selectedPrep.remaining_qty} {selectedPrep.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-kumo-strong uppercase tracking-wider block mb-1">
                  Quantity Returning ({selectedPrep.unit})
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={selectedPrep.remaining_qty}
                  step="0.1"
                  value={returnPrepQty}
                  onChange={(e) => setReturnPrepQty(Number(e.target.value))}
                  className="w-full h-9 bg-kumo-base border border-kumo-line rounded-lg px-2.5 text-xs text-kumo-strong focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-mono"
                  required
                />
              </div>

              <Input
                label="Returned By / Chef"
                value={returnPrepBy}
                onChange={(e) => setReturnPrepBy(e.target.value)}
                required
              />
            </div>

            <Input
              label="Preservation Storage Location"
              value="Central Cold Room Chiller #2"
              readOnly
            />

            <Input
              label="Return & Packaging Notes"
              value={returnPrepNotes}
              onChange={(e) => setReturnPrepNotes(e.target.value)}
              placeholder="e.g. Sealed in airtight food-grade container"
              required
            />
          </div>
        </Dialog>
      )}

      {/* MODAL 8: Trace Recipe Prep Provenance & Multi-Batch Distribution */}
      {selectedPrep && (
        <Dialog
          isOpen={isPrepProvenanceModalOpen}
          onClose={() => setIsPrepProvenanceModalOpen(false)}
          title={`Recipe Prep Provenance: ${selectedPrep.prep_ref} - ${selectedPrep.recipe_name}`}
          description="Complete end-to-end provenance: raw materials withdrawn from Central Warehouse and multi-batch distribution ledger."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" onClick={() => setIsPrepProvenanceModalOpen(false)}>
                Close
              </Button>
              {selectedPrep.remaining_qty > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setIsPrepProvenanceModalOpen(false)
                      setIsAllocatePrepModalOpen(true)
                    }}
                    leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  >
                    Allocate to Batch
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setIsPrepProvenanceModalOpen(false)
                      setIsReturnPrepModalOpen(true)
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Return to Hub
                  </Button>
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            {/* Step 1: Formulation from Central Warehouse */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  1. Central Warehouse Raw Formulation
                </span>
                <span className="text-zinc-500">{selectedPrep.created_at}</span>
              </div>
              <div className="text-zinc-600 dark:text-zinc-400">
                Initial Yield Prepared: <strong className="text-zinc-900 dark:text-zinc-100">{selectedPrep.initial_yield_qty} {selectedPrep.unit}</strong> by {selectedPrep.prepared_by}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {selectedPrep.source_ingredients.map((ing, idx) => (
                  <div key={idx} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{ing.product_name}</div>
                    <div className="font-mono text-[11px] text-primary">-{ing.quantity} {ing.unit} from Hub</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Multi-Batch Allocations */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                2. Cross-Product Batch Allocations
              </span>

              {selectedPrep.allocations && selectedPrep.allocations.length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {selectedPrep.allocations.map((a, idx) => (
                    <div key={idx} className="py-2.5 first:pt-1 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {a.target_product_name} ({a.batch_ref})
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Allocated at {a.allocated_at} by {a.allocated_by}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                        {a.allocated_qty} {selectedPrep.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 italic py-2 text-center">No batches have drawn from this prep yet.</div>
              )}
            </div>

            {/* Step 3: Current Balance & Central Hub Return */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 block">
                  3. Current Station Status
                </span>
                <span className="text-[11px] text-zinc-500">
                  {selectedPrep.remaining_qty > 0 
                    ? `Active on Production Floor — ready for next batch allocation` 
                    : selectedPrep.returned_to_hub_qty && selectedPrep.returned_to_hub_qty > 0
                    ? `Preserved in Central Warehouse Hub cold storage (${selectedPrep.return_notes || ''})`
                    : `Fully consumed in cooking batches`}
                </span>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-zinc-500">Remaining Available</div>
                <div className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {selectedPrep.remaining_qty} {selectedPrep.unit}
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default ProductionBatchesPage
