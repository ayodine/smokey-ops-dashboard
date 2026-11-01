import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { ProductionBatch, RawMaterialBOM, IntermediatePrep, IntermediatePrepAllocation, BatchMaterialRequisition } from '@/lib/smokeyData'
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
import { DateTimePicker } from '@/components/ui/DateTimePicker'
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
  Scale,
  ChevronDown,
  ShieldAlert,
  AlertTriangle,
  X,
  FileText,
  Calculator
} from 'lucide-react'

export const ProductionBatchesPage: React.FC = () => {
  const {
    productionBatches,
    salesProducts,
    liveSalesProducts,
    rawProducts,
    recipeTemplates,
    intermediatePreps,
    compoundInventory,
    createBatch,
    startBatch,
    completeBatch,
    cancelBatch,
    updateBatch,
    deleteBatch,
    deleteIntermediatePrep,
    requestAdditionalBatchMaterial,
    fulfillBatchMaterialRequisition,
    rejectBatchMaterialRequisition,
    returnUnconsumedBatchMaterials,
    saveCustomRecipeTemplate,
    updateRecipeTemplate,
    deleteRecipeTemplate,
    createIntermediatePrep,
    allocatePrepToBatch,
    returnPrepToCentral,
    issueCompoundToBatch,
    returnCompoundSurplusFromBatch,
    currentAccount
  } = useSmokeyOps()

  const activeSalesProducts = liveSalesProducts.length > 0 ? liveSalesProducts : salesProducts
  const hasInventoryRole = currentAccount?.role === 'inventory' || currentAccount?.role === 'admin' || currentAccount?.role === 'manager'

  const [activeTab, setActiveTab] = useState<'all' | 'prep_queued' | 'cooking' | 'completed' | 'intermediate_preps'>('all')
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null)

  // Requisitions Form State
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false)
  const [requisitionBatch, setRequisitionBatch] = useState<ProductionBatch | null>(null)
  const [reqProductId, setReqProductId] = useState<number>(rawProducts[0]?.id || 52)
  const [reqQty, setReqQty] = useState<number>(2)
  const [reqReason, setReqReason] = useState<string>('Firewood burned faster / heat efficiency drop')
  const [reqCustomNotes, setReqCustomNotes] = useState<string>('')
  const [reqStaff, setReqStaff] = useState<string>(currentAccount?.name || 'Kitchen Pitmaster')

  // Fulfill Requisition Modal State
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false)
  const [selectedReqForFulfill, setSelectedReqForFulfill] = useState<BatchMaterialRequisition | null>(null)
  const [fulfillQty, setFulfillQty] = useState<number>(1)
  const [warehouseNotes, setWarehouseNotes] = useState<string>('')
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [isRejectMode, setIsRejectMode] = useState<boolean>(false)

  // Expandable Return Materials State for Batch Completion
  const [isReturnsExpanded, setIsReturnsExpanded] = useState<boolean>(false)
  const [returnedMaterials, setReturnedMaterials] = useState<Array<{ productId: number; quantity: number; item_type?: 'raw' | 'compound'; compound_id?: number }>>([])

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
  const [prepPreparedBy, setPrepPreparedBy] = useState(currentAccount?.name || 'Kitchen Staff')
  const [prepIngredients, setPrepIngredients] = useState<Array<{ productId: number; quantity: number }>>([
    { productId: 53, quantity: 12 }, // DRY PEPPER
    { productId: 54, quantity: 2 },  // SPICIES
    { productId: 55, quantity: 5 },  // VEGETABLE OIL
  ])

  // Allocate Prep to Batch Form State
  const [allocTargetProduct, setAllocTargetProduct] = useState('Full Smokey Guineafowl')
  const [allocBatchRef, setAllocBatchRef] = useState('BAT-00001')
  const [allocQty, setAllocQty] = useState<number>(5)
  const [allocBy, setAllocBy] = useState(currentAccount?.name || 'Kitchen Staff')

  // Return Prep to Central Hub Form State
  const [returnPrepQty, setReturnPrepQty] = useState<number>(2)
  const [returnPrepNotes, setReturnPrepNotes] = useState('Sealed in food-grade container for Central Store cold storage')
  const [returnPrepBy, setReturnPrepBy] = useState(currentAccount?.name || 'Kitchen Staff')

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
  const [selectedOutputProduct, setSelectedOutputProduct] = useState<number>(7)
  const [expectedOutput, setExpectedOutput] = useState<number>(50)
  const [batchRemarks, setBatchRemarks] = useState<string>('Standard morning run on Smoking Grill #1')
  const [batchSchedule, setBatchSchedule] = useState<'today' | 'tomorrow_morning'>('today')
  const [estimatedReadyTime, setEstimatedReadyTime] = useState<string>('Today 1:30 PM')
  const [feedSalesInventory, setFeedSalesInventory] = useState<boolean>(true)
  const [bomRows, setBomRows] = useState<RawMaterialBOM[]>([
    { product_id: 62, sku: 'SKU-00028', name: 'FRESH GUINEAFOWL', quantity: 50, unit: 'PCS', item_type: 'raw', source: 'initial' },
    { product_id: 53, sku: 'SKU-00019', name: 'DRY PEPPER', quantity: 2.5, unit: 'KG', item_type: 'raw', source: 'initial' },
    { product_id: 54, sku: 'SKU-00020', name: 'SPICIES', quantity: 1.0, unit: 'PACK', item_type: 'raw', source: 'initial' },
    { product_id: 52, sku: 'SKU-00018', name: 'FIREWOOD', quantity: 4.0, unit: 'Bundle', item_type: 'raw', source: 'initial' },
  ])

  const handleOpenTodayBatch = () => {
    setSelectedRecipeTemplateId(1)
    const tmpl = recipeTemplates.find(t => t.id === 1)
    if (tmpl) {
      setSelectedOutputProduct(tmpl.output_product_id)
      setExpectedOutput(tmpl.standard_batch_size)
      setBomRows(tmpl.ingredients.map(ing => ({
        product_id: ing.raw_product_id,
        sku: ing.sku,
        name: ing.name,
        quantity: Number((ing.standard_qty_per_unit * tmpl.standard_batch_size).toFixed(3)),
        unit: ing.unit,
        item_type: 'raw',
        source: 'initial'
      })))
      setBatchRemarks(`Standard Recipe Run: ${tmpl.version_name} (Yield Target: ${tmpl.standard_batch_size} units)`)
    }
    setBatchSchedule('today')
    setEstimatedReadyTime('Today 1:30 PM')
    setFeedSalesInventory(true)
    setIsCreateModalOpen(true)
  }

  const handleOpenTomorrowBatch = () => {
    setSelectedRecipeTemplateId(1)
    const tmpl = recipeTemplates.find(t => t.id === 1)
    if (tmpl) {
      setSelectedOutputProduct(tmpl.output_product_id)
      setExpectedOutput(tmpl.standard_batch_size)
      setBomRows(tmpl.ingredients.map(ing => ({
        product_id: ing.raw_product_id,
        sku: ing.sku,
        name: ing.name,
        quantity: Number((ing.standard_qty_per_unit * tmpl.standard_batch_size).toFixed(3)),
        unit: ing.unit,
        item_type: 'raw',
        source: 'initial'
      })))
      setBatchRemarks(`Next-day morning smoke cycle: ${tmpl.version_name}. Feeds overnight website pre-orders.`)
    }
    setBatchSchedule('tomorrow_morning')
    setEstimatedReadyTime('Tomorrow 9:30 AM')
    setFeedSalesInventory(true)
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
      unit: ing.unit,
      item_type: 'raw',
      source: 'initial'
    }))
    setBomRows(calculated)
    setBatchRemarks(`Standard Recipe Run: ${tmpl.version_name} (Yield Target: ${tmpl.standard_batch_size} units)`)
  }

  const handleSelectOutputProduct = (prodId: number) => {
    setSelectedOutputProduct(prodId)
    const matchingTmpl = recipeTemplates.find(t => t.output_product_id === prodId)
    if (matchingTmpl) {
      setSelectedRecipeTemplateId(matchingTmpl.id)
      setExpectedOutput(matchingTmpl.standard_batch_size)
      setBomRows(matchingTmpl.ingredients.map(ing => ({
        product_id: ing.raw_product_id,
        sku: ing.sku,
        name: ing.name,
        quantity: Number((ing.standard_qty_per_unit * matchingTmpl.standard_batch_size).toFixed(3)),
        unit: ing.unit,
        item_type: 'raw',
        source: 'initial'
      })))
      setBatchRemarks(`Standard Recipe Run: ${matchingTmpl.version_name} (Yield Target: ${matchingTmpl.standard_batch_size} units)`)
    } else {
      setSelectedRecipeTemplateId('custom')
    }
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
          unit: ing.unit,
          item_type: 'raw',
          source: 'initial'
        })))
      }
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
      unit: raw.unit,
      item_type: 'raw',
      source: 'initial',
      unit_cost: raw.unit_cost || 0,
      total_cost: raw.unit_cost || 0
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
        const isCpdString = typeof val === 'string' && val.startsWith('cpd-')
        const cpdId = isCpdString ? Number(val.replace('cpd-', '')) : undefined

        const compound = cpdId !== undefined
          ? compoundInventory.find(c => c.id === cpdId)
          : compoundInventory.find(c => c.id === Number(val))

        if (compound) {
          const unitCost = compound.unit_cost || 0
          return {
            ...row,
            product_id: compound.id,
            name: compound.name,
            sku: compound.sku,
            unit: compound.unit,
            item_type: 'compound' as const,
            compound_id: compound.id,
            prep_ref: compound.preparation_lots?.[0]?.prep_ref,
            unit_cost: unitCost,
            total_cost: Math.round(row.quantity * unitCost * 100) / 100
          }
        }

        const raw = rawProducts.find(p => p.id === Number(val))
        const unitCost = raw?.unit_cost || 0
        return {
          ...row,
          product_id: Number(val),
          name: raw?.name || row.name,
          sku: raw?.sku || row.sku,
          unit: raw?.unit || row.unit,
          item_type: 'raw' as const,
          compound_id: undefined,
          prep_ref: undefined,
          unit_cost: unitCost,
          total_cost: Math.round(row.quantity * unitCost * 100) / 100
        }
      }
      if (field === 'quantity') {
        const qty = Number(val) || 0
        const isCpd = row.item_type === 'compound' || !!row.compound_id
        const unitCost = row.unit_cost || (isCpd
          ? compoundInventory.find(c => c.id === row.compound_id || c.id === row.product_id)?.unit_cost
          : rawProducts.find(p => p.id === row.product_id)?.unit_cost) || 0
        return {
          ...row,
          quantity: qty,
          unit_cost: unitCost,
          total_cost: Math.round(qty * unitCost * 100) / 100
        }
      }
      return { ...row, [field]: val }
    }))
  }

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // Dynamic batch filtering with date range active synchronization
  const isBatchWithinRange = (b: ProductionBatch) => {
    if (!dateRange) return true
    const dateStr = b.started_at || b.completed_at || b.created_at
    if (!dateStr) return true
    return isWithinDateRange(dateStr, dateRange)
  }

  const dateFilteredBatches = useMemo(() => {
    return productionBatches.filter(isBatchWithinRange)
  }, [productionBatches, dateRange])

  const dateFilteredPrepQueued = useMemo(() => {
    return dateFilteredBatches.filter(b => b.status === 'draft')
  }, [dateFilteredBatches])

  const dateFilteredProducing = useMemo(() => {
    return dateFilteredBatches.filter(b => b.status === 'in_production')
  }, [dateFilteredBatches])

  const dateFilteredCompleted = useMemo(() => {
    return dateFilteredBatches.filter(b => b.status === 'completed')
  }, [dateFilteredBatches])

  const dateFilteredIntermediatePreps = useMemo(() => {
    if (!dateRange) return intermediatePreps
    return intermediatePreps.filter(p => isWithinDateRange(p.created_at, dateRange))
  }, [intermediatePreps, dateRange])

  const totalBatches = dateFilteredBatches.length
  const totalProducedUnits = dateFilteredCompleted.reduce((acc, b) => acc + b.actual_output, 0)

  // Actions
  const handleOpenComplete = (b: ProductionBatch) => {
    setSelectedBatch(b)
    setActualOutput(b.expected_output)
    setWastage(0)
    setQcNotes('Smoking grill cycle completed. Core temp and doneness passed inspection.')
    setIsReturnsExpanded(false)
    setReturnedMaterials([])
    setIsCompleteModalOpen(true)
  }

  const handleOpenPreview = (b: ProductionBatch) => {
    setSelectedBatch(b)
    setIsPreviewModalOpen(true)
  }

  const handleOpenRequisitionModal = (b: ProductionBatch) => {
    setRequisitionBatch(b)
    if (rawProducts.length > 0) {
      setReqProductId(rawProducts[0].id)
    }
    setReqQty(1)
    setReqReason('Firewood burned faster / heat efficiency drop')
    setReqCustomNotes('')
    setReqStaff(currentAccount?.name || 'Kitchen Pitmaster')
    setIsRequisitionModalOpen(true)
  }

  const handleConfirmSubmitRequisition = (e: React.FormEvent) => {
    e.preventDefault()
    if (!requisitionBatch) return
    const reasonText = reqCustomNotes.trim() ? `${reqReason} - ${reqCustomNotes.trim()}` : reqReason
    requestAdditionalBatchMaterial({
      batchId: requisitionBatch.id,
      productId: Number(reqProductId),
      quantity: Number(reqQty),
      reason: reasonText,
      requestedBy: reqStaff.trim() || undefined
    })
    setIsRequisitionModalOpen(false)
  }

  const handleOpenFulfillModal = (req: BatchMaterialRequisition) => {
    setSelectedReqForFulfill(req)
    setFulfillQty(req.requested_qty)
    setWarehouseNotes('')
    setRejectionReason('')
    setIsRejectMode(false)
    setIsFulfillModalOpen(true)
  }

  const handleConfirmFulfillReq = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReqForFulfill) return
    const success = fulfillBatchMaterialRequisition(
      selectedReqForFulfill.id,
      Number(fulfillQty),
      warehouseNotes
    )
    if (success) {
      setIsFulfillModalOpen(false)
    }
  }

  const handleConfirmRejectReq = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReqForFulfill || !rejectionReason.trim()) return
    const success = rejectBatchMaterialRequisition(
      selectedReqForFulfill.id,
      rejectionReason.trim()
    )
    if (success) {
      setIsFulfillModalOpen(false)
    }
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
      output_product_name: targetProduct?.name || 'Product',
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
    const targetProduct = activeSalesProducts.find(p => p.id === Number(selectedOutputProduct)) || salesProducts.find(p => p.id === Number(selectedOutputProduct))
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
    completeBatch(
      selectedBatch.id,
      Number(actualOutput),
      Number(wastage),
      qcNotes,
      returnedMaterials.length > 0 ? returnedMaterials : undefined
    )
    setIsCompleteModalOpen(false)
  }

  // Columns for All Batches
  const allColumns: ColumnDef<ProductionBatch>[] = [
    {
      key: 'batch_ref',
      header: 'Batch Ref',
      accessor: (b) => (
        <Tooltip content="Click to view recipe, requisitions & costing breakdown">
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
      header: 'Dish / Finished Product',
      accessor: (b) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">{b.output_product_name}</div>
          <div className="text-xs text-kumo-subtle font-sans">
            {b.raw_materials.length} formulated ingredients
            {b.additional_requisitions && b.additional_requisitions.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
                (+{b.additional_requisitions.length} requisitions)
              </span>
            )}
          </div>
        </div>
      ),
      sortValue: (b) => b.output_product_name,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (b) => {
        if (b.status === 'draft') return <StatusBadge status="draft" label="prep queued" />
        if (b.status === 'in_production') return <StatusBadge status="in-progress" label="on smoking grill" />
        if (b.status === 'completed') return <StatusBadge status="completed" label="finished" />
        return <StatusBadge status="inactive" label="cancelled" />
      },
      sortValue: (b) => b.status,
    },
    {
      key: 'yield',
      header: 'Output / Yield',
      accessor: (b) => (
        <div className="font-sans text-xs">
          {b.status === 'completed' ? (
            <div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                {b.actual_output} portions
              </span>
              <span className="text-kumo-subtle text-[11px] block">
                Target: {b.expected_output} {b.wastage > 0 ? `(${b.wastage} loss)` : ''}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-semibold text-kumo-strong font-mono">{b.expected_output} portions planned</span>
              {b.feed_sales_inventory !== false && (
                <span className="text-amber-600 dark:text-amber-400 text-[11px] block">Buffered to storefront</span>
              )}
            </div>
          )}
        </div>
      ),
      sortValue: (b) => b.status === 'completed' ? b.actual_output : b.expected_output,
    },
    {
      key: 'material_cost',
      header: 'Material Cost',
      accessor: (b) => {
        const cost = b.total_material_cost || b.initial_material_cost || 0
        return (
          <div className="font-sans text-xs">
            <div className="font-semibold text-kumo-strong font-mono">
              {cost > 0 ? formatNaira(cost) : '—'}
            </div>
            {b.unit_cost_per_portion && b.unit_cost_per_portion > 0 ? (
              <div className="text-[11px] text-kumo-subtle font-mono">
                {formatNaira(b.unit_cost_per_portion)} / unit
              </div>
            ) : null}
          </div>
        )
      },
      sortValue: (b) => b.total_material_cost || b.initial_material_cost || 0,
    },
    {
      key: 'schedule',
      header: 'Timeline & Supervisor',
      accessor: (b) => (
        <div className="font-sans text-xs">
          <div className="text-kumo-strong font-medium">
            {b.status === 'completed' && b.completed_at ? formatDate(b.completed_at) : (b.started_at ? formatDate(b.started_at) : (b.created_at ? formatDate(b.created_at) : 'Queued'))}
          </div>
          <div className="text-[11px] text-kumo-subtle">
            {b.created_by_name}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 220,
      accessor: (b) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {b.status === 'draft' && (
            <Tooltip content="Begin cooking this batch on smoking grill">
              <TableActionButton
                variant="primary"
                onClick={() => startBatch(b.id)}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Start Cooking
              </TableActionButton>
            </Tooltip>
          )}
          {b.status === 'in_production' && (
            <>
              <Tooltip content="Record QC yield and complete cooking">
                <TableActionButton
                  variant="success"
                  onClick={() => handleOpenComplete(b)}
                  leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
                >
                  Complete
                </TableActionButton>
              </Tooltip>
              <Tooltip content="Request extra firewood, spices, or ingredients from Central Store">
                <TableActionButton
                  variant="outline"
                  onClick={() => handleOpenRequisitionModal(b)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  + Stock
                </TableActionButton>
              </Tooltip>
            </>
          )}
          {b.status === 'completed' && (
            <Tooltip content="View full recipe and batch breakdown">
              <TableActionButton
                variant="outline"
                onClick={() => handleOpenPreview(b)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Recipe
              </TableActionButton>
            </Tooltip>
          )}
          {b.status === 'cancelled' && (
            <span className="text-xs text-red-500 font-medium px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              Cancelled
            </span>
          )}
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
      header: 'Target Finished Product',
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
      accessor: () => <StatusBadge status="draft" label="prep queued" />,
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
          <Tooltip content="Begin cooking this batch on smoking grill">
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

          <Tooltip content="Cancel batch & restore reserved ingredients to Central Store">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Cancel draft batch ${b.batch_ref}? All reserved ingredients will be restored to store.`)) {
                  cancelBatch(b.id)
                }
              }}
              className="p-1.5 text-kumo-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer border border-kumo-line shrink-0 flex-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
          <div className="text-xs text-kumo-subtle font-sans">{b.raw_materials.length} ingredients loaded on smoking grill</div>
        </div>
      ),
      sortValue: (b) => b.output_product_name,
    },
    {
      key: 'expected_output',
      header: 'Grill Output & Buffer Feed',
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
      accessor: (b) => {
        const pendingCount = b.additional_requisitions?.filter(r => r.status === 'pending').length || 0
        return (
          <div>
            <StatusBadge status="in-progress" label="on smoking grill" />
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mt-1 border border-amber-300 dark:border-amber-700 animate-pulse">
                {pendingCount} Requisition{pendingCount > 1 ? 's' : ''} Pending
              </span>
            )}
          </div>
        )
      },
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
      header: 'Oven Supervisor',
      accessor: (b) => <span className="text-xs text-kumo-default font-sans">{b.created_by_name}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 240,
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

          <Tooltip content="Request extra firewood, seasonings, or ingredients without cancelling batch">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenRequisitionModal(b)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Request Stock
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
      accessor: (b) => (
        <Tooltip content="Click to view recipe, requisitions & costing breakdown">
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
      key: 'costing',
      header: 'Batch Cost & Portion Cost',
      accessor: (b) => (
        <div className="font-sans text-xs">
          <div className="font-semibold text-kumo-strong font-mono">
            {b.total_material_cost ? formatNaira(b.total_material_cost) : '—'}
          </div>
          {b.unit_cost_per_portion && b.unit_cost_per_portion > 0 ? (
            <div className="text-[11px] text-kumo-subtle font-mono mt-0.5">
              {formatNaira(b.unit_cost_per_portion)} / portion
            </div>
          ) : null}
        </div>
      ),
      sortValue: (b) => b.total_material_cost || 0,
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
      defaultWidth: 160,
      accessor: (b) => <StatusBadge status="completed" label="completed" />,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 100,
      accessor: (b) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="Correct yield, wastage, or shift notes">
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
      key: 'unit_cost',
      header: 'Unit Cost & Valuation',
      accessor: (p) => {
        const uCost = p.unit_cost || 0
        const totalVal = Math.round(p.remaining_qty * uCost * 100) / 100
        return (
          <div>
            <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
              {formatNaira(uCost)} / {p.unit}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Valuation: <strong className="text-emerald-600 dark:text-emerald-400">{formatNaira(totalVal)}</strong>
            </div>
          </div>
        )
      },
      sortValue: (p) => p.unit_cost || 0,
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
      header: 'Action',
      defaultWidth: 200,
      accessor: (p) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {p.remaining_qty > 0 ? (
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
              <Tooltip content="Preserve unused prep mix back into Central Store cold storage">
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
              {p.allocations.length === 0 && (
                <Tooltip content="Delete unused prep mix & restore raw ingredients">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete intermediate prep ${p.prep_ref} and restore raw ingredients to Central Store?`)) {
                        deleteIntermediatePrep(p.id)
                      }
                    }}
                    className="p-1.5 text-kumo-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors border border-kumo-line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}
            </>
          ) : (
            <span className="text-xs text-kumo-subtle font-sans px-1">Exhausted</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Production Batches & Cooking Recipes"
        subtitle="Formulate multi-ingredient cooking recipes, track active smoking runs on the grill, and automatically credit completed yield into Sales Inventory."
        actions={
          <PermissionGate permission="perm_cook">
            <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              leftIcon={<Plus className="w-4 h-4" />}
              rightIcon={<ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isActionMenuOpen && "rotate-180")} />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Start Cooking Batch
            </Button>

            {isActionMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsActionMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-40 p-1.5 animate-in fade-in zoom-in-95 font-sans divide-y divide-zinc-100 dark:divide-zinc-800">
                  <div className="p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionMenuOpen(false)
                        handleOpenTodayBatch()
                      }}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                          Start Cooking Batch (Today)
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                          Active daytime smoke run with automatic recipe ingredient deduction
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionMenuOpen(false)
                        handleOpenTomorrowBatch()
                      }}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                          Plan Tomorrow's Smoke
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                          End-of-day handoff to buffer online pre-orders overnight
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="p-1 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionMenuOpen(false)
                        setIsCreatePrepModalOpen(true)
                      }}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 transition-colors">
                          + Recipe Prep Mix
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                          Formulate intermediate spice rubs, secret blends & seasonings
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </PermissionGate>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          title="Total Batches"
          value={totalBatches}
          description={dateRange ? "In selected date range" : "All batches recorded"}
          icon={<Factory className="w-4 h-4 text-primary" />}
          noData={false}
        />
        <MetricCard
          title="Prep Queued"
          value={dateFilteredPrepQueued.length}
          description="Awaiting grill ignition"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          noData={false}
        />
        <MetricCard
          title="On Smoking Grills"
          value={dateFilteredProducing.length}
          description="Cooking in chambers"
          icon={<Flame className="w-4 h-4 text-rose-500" />}
          noData={false}
        />
        <MetricCard
          title="Recipe Preps Ready"
          value={`${intermediatePreps.filter(p => p.status === 'active').reduce((acc, p) => acc + p.remaining_qty, 0)} kg/L`}
          description={`${intermediatePreps.filter(p => p.status === 'active').length} active intermediate mixes`}
          icon={<Layers className="w-4 h-4 text-blue-600" />}
          noData={false}
        />
        <MetricCard
          title="Finished Batches"
          value={dateFilteredCompleted.length}
          description="QC inspected & finalized"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          noData={false}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Batches', badge: dateFilteredBatches.length },
            { id: 'prep_queued', label: 'Prep Queued', badge: dateFilteredPrepQueued.length },
            { id: 'cooking', label: 'On Smoking Grills', badge: dateFilteredProducing.length },
            { id: 'completed', label: 'Finished Batches', badge: dateFilteredCompleted.length },
            { id: 'intermediate_preps', label: 'Recipe Preps & Mixes', badge: dateFilteredIntermediatePreps.filter(p => p.status === 'active').length },
          ]}
        />
      </div>

      {/* Tables */}
      <div>
        {activeTab === 'all' && (
          <DataTable
            data={dateFilteredBatches}
            columns={allColumns}
            searchable={true}
            searchPlaceholder="Search all production batches..."
            title="All Production Batches"
            exportFilename="smokey-all-production-batches"
            onRowClick={(b) => handleOpenPreview(b)}
            onDateRangeChange={setDateRange}
          />
        )}
        {activeTab === 'prep_queued' && (
          <DataTable
            data={dateFilteredPrepQueued}
            columns={activeColumns}
            searchable={true}
            searchPlaceholder="Search prep queued batches..."
            title="Active Prep Queued Batch"
            exportFilename="smokey-active-prep-batches"
            onRowClick={(b) => handleOpenPreview(b)}
            onDateRangeChange={setDateRange}
          />
        )}
        {activeTab === 'cooking' && (
          <DataTable
            data={dateFilteredProducing}
            columns={ongoingColumns}
            searchable={true}
            searchPlaceholder="Search on-going producing runs..."
            title="On Smoking Grills Batches"
            exportFilename="smokey-producing-batches"
            onRowClick={(b) => handleOpenPreview(b)}
            onDateRangeChange={setDateRange}
          />
        )}
        {activeTab === 'completed' && (
          <DataTable
            data={dateFilteredCompleted}
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
          <DataTable
            data={dateFilteredIntermediatePreps}
            columns={intermediateColumns}
            searchable={true}
            searchPlaceholder="Search recipe preps, mixes..."
            title="Intermediate Recipe Prep"
            exportFilename="smokey-intermediate-recipe-preps"
            onRowClick={(p) => {
              setSelectedPrep(p)
              setIsPrepProvenanceModalOpen(true)
            }}
            onDateRangeChange={setDateRange}
          />
        )}
      </div>

      {/* MODAL 1: Create Batch */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Start Cooking Batch (Recipe & Ingredients)"
        description="Select the product to cook, target output portions, and choose raw ingredients to use."
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

          {/* Batch Schedule & Storefront Settings Container */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs font-sans">
            {/* Schedule Mode */}
            <div className="p-3.5 space-y-2">
              <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Batch Schedule
              </span>
              <KumoTabs
                activeTab={batchSchedule}
                onChange={(val) => {
                  setBatchSchedule(val as 'today' | 'tomorrow_morning')
                  if (val === 'today') {
                    setEstimatedReadyTime('Today 1:30 PM')
                  } else {
                    setEstimatedReadyTime('Tomorrow 9:30 AM')
                  }
                }}
                tabs={[
                  { id: 'today', label: "Today's Smoke Run" },
                  { id: 'tomorrow_morning', label: "Tomorrow Morning Run (Pre-Orders)" }
                ]}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {batchSchedule === 'today'
                  ? 'Active daytime smoking. Buffers online store availability while batch is cooking on smoking grills.'
                  : 'End-of-day handoff (6:00 PM). Allows online customers to pre-order overnight for tomorrow.'}
              </p>
            </div>

            {/* Feed Storefront Buffer Toggle */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Feed Storefront Buffer
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Keeps item bookable on online ordering storefront while cooking on smoking grill
                </span>
              </div>
              <Toggle
                checked={feedSalesInventory}
                onChange={setFeedSalesInventory}
                size="md"
              />
            </div>
          </div>

          {/* Target Ready Time (Using custom DateTimePicker) */}
          <DateTimePicker
            label="Target Ready Time"
            value={estimatedReadyTime}
            onChange={(val) => setEstimatedReadyTime(val)}
            placeholder="Select target ready date & time"
            helperText="Est. completion time for kitchen line and customer storefront pre-orders"
            required
          />

          {/* SECTION 1: Recipe Template & Target Output (Single-column vertical stack) */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                  Cooking Recipe Template
                </label>
                <button
                  type="button"
                  onClick={() => setIsManageTemplatesModalOpen(true)}
                  className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Manage Templates ({recipeTemplates.length})
                </button>
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

              {selectedRecipeTemplateId !== 'custom' && (
                <div className="flex items-center justify-between text-xs px-1 pt-0.5">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Active template: <span className="font-medium text-zinc-900 dark:text-zinc-100">{recipeTemplates.find(t => String(t.id) === String(selectedRecipeTemplateId))?.version_name}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTemplate(Number(selectedRecipeTemplateId))}
                      className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors cursor-pointer"
                    >
                      Edit Template
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(Number(selectedRecipeTemplateId))}
                      className="text-red-600 dark:text-red-400 hover:underline font-medium transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Select
              label="Output Finished Product"
              value={selectedOutputProduct}
              onChange={(e) => handleSelectOutputProduct(Number(e.target.value))}
              options={activeSalesProducts.map(p => ({ value: p.id, label: p.name }))}
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

          {/* Interactive Live Batch Cost & Margin Benchmark Card */}
          {(() => {
            const totalBomCost = bomRows.reduce((acc, row) => {
              const unitCost = row.unit_cost || (row.item_type === 'compound'
                ? compoundInventory.find(c => c.id === row.compound_id || c.id === row.product_id)?.unit_cost
                : rawProducts.find(p => p.id === row.product_id)?.unit_cost) || 0
              return acc + (row.quantity * unitCost)
            }, 0)
            const costPerPortion = expectedOutput > 0 ? totalBomCost / expectedOutput : 0
            const hasDeficit = bomRows.some(row => {
              const available = row.item_type === 'compound'
                ? (compoundInventory.find(c => c.id === row.compound_id || c.id === row.product_id)?.stock_qty || 0)
                : (rawProducts.find(p => p.id === row.product_id)?.stock_qty || 0)
              return row.quantity > available
            })

            return (
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2.5 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-primary" />
                    Live Batch Cost & Margin Benchmark
                  </span>
                  {hasDeficit && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Stock Deficit Detected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-normal">Initial BOM Cost</span>
                    <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {formatNaira(totalBomCost)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-normal">Est. Portion Cost</span>
                    <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatNaira(costPerPortion)} / portion
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-normal">Ingredients Included</span>
                    <span className="text-sm font-bold font-mono text-zinc-800 dark:text-zinc-200">
                      {bomRows.length} items ({bomRows.filter(r => r.item_type === 'compound').length} compound)
                    </span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* SECTION 2: BOM Ingredients List with Generous Spacing */}
          <div className="pt-6 mt-6 border-t border-kumo-line space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-sans block">
                  Ingredients to Allocate (Raw Materials & Compound Mixes)
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                  Allocate raw ingredients or surplus compound mixes from Central Store
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
              <div className="col-span-7">Ingredient / Mix</div>
              <div className="col-span-4">Batch Allocation</div>
              <div className="col-span-1 text-center">Remove</div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {bomRows.map((row, idx) => {
                const isCpd = row.item_type === 'compound' || !!row.compound_id
                const matchedCpd = isCpd ? compoundInventory.find(c => c.id === row.compound_id || c.id === row.product_id) : undefined
                const matchedRaw = !isCpd ? rawProducts.find(p => p.id === row.product_id) : undefined
                const availableStock = isCpd ? (matchedCpd?.stock_qty || 0) : (matchedRaw?.stock_qty || 0)
                const unitCost = isCpd ? (matchedCpd?.unit_cost || 0) : (matchedRaw?.unit_cost || 0)
                const lineTotalCost = Math.round(row.quantity * unitCost * 100) / 100
                const isDeficit = row.quantity > availableStock

                const selectOptions = [
                  ...rawProducts.map(rp => ({
                    value: rp.id,
                    label: `[Raw] ${rp.name} (${rp.stock_qty} ${formatUnit(rp.unit)} on-hand @ ${formatNaira(rp.unit_cost || 0)})`
                  })),
                  ...compoundInventory.map(ci => ({
                    value: `cpd-${ci.id}`,
                    label: `[Compound Mix] ${ci.name} (${ci.stock_qty} ${formatUnit(ci.unit)} on-hand @ ${formatNaira(ci.unit_cost)})`
                  }))
                ]

                return (
                  <div key={idx} className={`p-2.5 rounded-lg border transition-colors ${
                    isDeficit 
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20' 
                      : 'border-kumo-line bg-kumo-base'
                  }`}>
                    <div className="grid grid-cols-12 gap-3 items-center text-xs font-sans">
                      <div className="col-span-7">
                        <Select
                          value={isCpd ? `cpd-${row.compound_id || row.product_id}` : row.product_id}
                          onChange={(e) => handleUpdateBomRow(idx, 'product_id', e.target.value)}
                          options={selectOptions}
                          size="md"
                          buttonClassName="h-10 text-[13px] font-normal"
                        />
                      </div>
                      <div className="col-span-4">
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
                          <span className="w-16 shrink-0 h-full flex items-center justify-center text-center px-1 text-[11px] font-medium text-kumo-subtle bg-kumo-tint/60 border-l border-kumo-line select-none lowercase">
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

                    {/* Sub-line: Stock feasibility indicator & financial valuation */}
                    <div className="flex items-center justify-between text-[11px] pt-2 px-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDeficit ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Deficit: -{(row.quantity - availableStock).toFixed(1)} {formatUnit(row.unit)} (Store has {availableStock})
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Available in Store: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{availableStock} {formatUnit(row.unit)}</strong>
                          </span>
                        )}
                        {isCpd && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Compound Mix ({matchedCpd?.active_lot_ref || 'Central Mix'})
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-zinc-700 dark:text-zinc-300 text-right">
                        @ {formatNaira(unitCost)}/{formatUnit(row.unit)} = <strong className="text-zinc-900 dark:text-zinc-100">{formatNaira(lineTotalCost)}</strong>
                      </div>
                    </div>
                  </div>
                )
              })}
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
        description="Verify actual cooking yield, log grill shrinkage, and reconcile estimated buffer into Physical Ready Stock in Sales Inventory."
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

          {/* Expandable Section: Return Unconsumed Materials & Surplus Compounds (Section 9.1 Cross-Batch Reuse) */}
          <div className="rounded-xl border border-kumo-line bg-kumo-base overflow-hidden">
            <button
              type="button"
              onClick={() => setIsReturnsExpanded(!isReturnsExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-kumo-tint/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-kumo-strong">
                  Return Unconsumed Raw Materials & Surplus Compound Mixes (Optional)
                </span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-kumo-subtle transition-transform duration-200", isReturnsExpanded && "rotate-180")} />
            </button>
            {isReturnsExpanded && (
              <div className="p-4 pt-1 border-t border-kumo-line space-y-3 bg-kumo-surface/30">
                <p className="text-[11px] text-kumo-subtle leading-relaxed">
                  If any ingredients (firewood, seasoning blends, compound mixes) were not fully consumed, enter the returned quantities below. Unused compound seasoning blends are credited and deposited back to the Central Store for reuse by subsequent batches (Section 9 Cross-Batch Reuse).
                </p>
                <div className="space-y-2.5 divide-y divide-kumo-line/60">
                  {selectedBatch?.raw_materials.map((m, idx) => {
                    const isCpd = m.item_type === 'compound' || m.source === 'compound' || !!m.compound_id
                    const currentReturn = returnedMaterials.find(r => r.productId === m.product_id)?.quantity || 0
                    return (
                      <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs font-sans">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-kumo-strong truncate flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {isCpd && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                Compound Mix
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-kumo-subtle">
                            Issued: <strong className="font-mono">{m.quantity} {formatUnit(m.unit)}</strong>
                            {m.unit_cost ? ` @ ${formatNaira(m.unit_cost)}/${formatUnit(m.unit)}` : ''}
                            {isCpd && <span className="text-emerald-600 dark:text-emerald-400 ml-1.5">&bull; Returns to Central Compound Store</span>}
                          </div>
                        </div>
                        <div className="w-32 shrink-0">
                          <UnitInput
                            value={currentReturn}
                            onChangeValue={(v) => {
                              const val = Number(v) || 0
                              setReturnedMaterials(prev => {
                                const filtered = prev.filter(p => p.productId !== m.product_id)
                                if (val > 0) return [
                                  ...filtered, 
                                  { 
                                    productId: m.product_id, 
                                    quantity: Math.min(val, m.quantity),
                                    item_type: isCpd ? 'compound' : 'raw',
                                    compound_id: m.compound_id
                                  }
                                ]
                                return filtered
                              })
                            }}
                            unit={formatUnit(m.unit)}
                            min={0}
                            max={m.quantity}
                            step={0.1}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

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

      {/* MODAL 3: Preview BOM Details — Comprehensive Recipe, Requisitions & Batch Costing */}
      <Dialog
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Cooking Recipe & Costing: ${selectedBatch?.batch_ref}`}
        description={`Recipe specifications, formulated ingredients, additional warehouse requisitions, and costing breakdown for ${selectedBatch?.output_product_name}`}
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
                    variant="outline"
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
                    leftIcon={<Play className="w-4 h-4 fill-current" />}
                    onClick={() => {
                      startBatch(selectedBatch.id)
                      setIsPreviewModalOpen(false)
                    }}
                  >
                    Start Cooking
                  </Button>
                </>
              )}
              {selectedBatch && selectedBatch.status === 'in_production' && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setIsPreviewModalOpen(false)
                      handleOpenEdit(selectedBatch)
                    }}
                  >
                    Edit Batch
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setIsPreviewModalOpen(false)
                      handleOpenRequisitionModal(selectedBatch)
                    }}
                  >
                    + Request Materials
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<CheckSquare className="w-4 h-4" />}
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
                  <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Target Product</span>
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
                {selectedBatch?.status === 'completed' && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Actual Reconciled</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium font-mono">
                      {selectedBatch.actual_output} portions ({selectedBatch.wastage} loss / wastage)
                    </span>
                  </div>
                )}
                {selectedBatch?.remarks && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Supervisor Remarks</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-normal italic leading-relaxed">{selectedBatch.remarks}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Formulated Ingredients (BOM) */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Initial Formulated Ingredients (BOM)
                </span>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                  {selectedBatch?.raw_materials.filter(m => m.source !== 'additional').length || 0} Ingredients
                </span>
              </div>

              <div className="pt-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                {selectedBatch?.raw_materials.filter(m => m.source !== 'additional').map((m, idx) => {
                  const isCpd = m.item_type === 'compound' || m.source === 'compound' || !!m.compound_id
                  const fallbackUnitCost = isCpd
                    ? compoundInventory.find(c => c.id === m.compound_id || c.name.toLowerCase().trim() === m.name.toLowerCase().trim())?.unit_cost || 0
                    : rawProducts.find(p => p.id === m.product_id || p.name.toLowerCase().trim() === m.name.toLowerCase().trim())?.unit_cost || 0
                  const displayUnitCost = m.unit_cost && m.unit_cost > 0 ? m.unit_cost : fallbackUnitCost
                  const displayTotalCost = m.total_cost && m.total_cost > 0 ? m.total_cost : Math.round(m.quantity * displayUnitCost * 100) / 100

                  return (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.name}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">[{m.sku}]</span>
                          {isCpd && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Compound Mix ({m.prep_ref || 'Central Store'})
                            </span>
                          )}
                        </div>
                        {displayUnitCost > 0 ? (
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            @ {formatNaira(displayUnitCost)} / {formatUnit(m.unit)}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {m.quantity} {formatUnit(m.unit)}
                        </span>
                        {displayTotalCost > 0 ? (
                          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono font-semibold mt-1">
                            {formatNaira(displayTotalCost)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section 3: Additional Material Requisitions */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Additional Material Requisitions
                </span>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                  {selectedBatch?.additional_requisitions?.length || 0} Requests
                </span>
              </div>

              {selectedBatch?.additional_requisitions && selectedBatch.additional_requisitions.length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 pt-1">
                  {selectedBatch.additional_requisitions.map((req, idx) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-2 text-[13px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>{req.raw_product_name}</span>
                            <span className="text-xs text-zinc-500 font-mono">[{req.sku}]</span>
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                            Reason: <span className="italic">{req.reason}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            Req: {req.requested_qty} {formatUnit(req.unit)} &bull; Requested by {req.requested_by} at {formatDate(req.requested_at)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                              Pending Review
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              Fulfilled (+{req.fulfilled_qty} {formatUnit(req.unit)})
                            </span>
                          )}
                          {req.status === 'partially_fulfilled' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                              Partial (+{req.fulfilled_qty}/{req.requested_qty} {formatUnit(req.unit)})
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-700">
                              Rejected
                            </span>
                          )}
                          {req.total_cost && req.total_cost > 0 ? (
                            <div className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                              +{formatNaira(req.total_cost)}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {req.status === 'pending' && hasInventoryRole && (
                        <div className="pt-1 flex items-center justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setIsPreviewModalOpen(false)
                              handleOpenFulfillModal(req)
                            }}
                          >
                            Review & Issue Stock
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 text-xs py-1">No additional materials requested during this cooking run.</div>
              )}
            </div>

            {/* Section 4: Returned Unconsumed Materials (if any) */}
            {selectedBatch?.returned_materials && selectedBatch.returned_materials.length > 0 && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    Unconsumed Materials Returned to Store
                  </span>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 pt-1">
                  {selectedBatch.returned_materials.map((ret, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{ret.name}</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        -{ret.quantity} {formatUnit(ret.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Batch Run Financial Cost Summary */}
            {(() => {
              const initialCostComputed = (selectedBatch?.initial_material_cost && selectedBatch.initial_material_cost > 0)
                ? selectedBatch.initial_material_cost
                : (selectedBatch?.raw_materials || []).filter(m => m.source !== 'additional').reduce((acc, m) => {
                    const isCpd = m.item_type === 'compound' || m.source === 'compound' || !!m.compound_id
                    const unitCost = m.unit_cost || (isCpd
                      ? compoundInventory.find(c => c.id === m.compound_id || c.name.toLowerCase().trim() === m.name.toLowerCase().trim())?.unit_cost
                      : rawProducts.find(p => p.id === m.product_id || p.name.toLowerCase().trim() === m.name.toLowerCase().trim())?.unit_cost) || 0
                    return acc + (m.total_cost || (m.quantity * unitCost))
                  }, 0)

              const additionalCostComputed = (selectedBatch?.additional_material_cost && selectedBatch.additional_material_cost > 0)
                ? selectedBatch.additional_material_cost
                : (selectedBatch?.additional_requisitions || []).filter(r => r.status === 'approved' || r.status === 'partially_fulfilled').reduce((acc, r) => acc + (r.total_cost || 0), 0)

              const totalNetCost = selectedBatch?.total_material_cost && selectedBatch.total_material_cost > 0
                ? selectedBatch.total_material_cost
                : Math.round((initialCostComputed + additionalCostComputed) * 100) / 100

              const portionDivisor = (selectedBatch?.status === 'completed' && selectedBatch?.actual_output && selectedBatch.actual_output > 0)
                ? selectedBatch.actual_output
                : (selectedBatch?.expected_output || 1)

              const unitCostPerPortionComputed = selectedBatch?.unit_cost_per_portion && selectedBatch.unit_cost_per_portion > 0
                ? selectedBatch.unit_cost_per_portion
                : Math.round((totalNetCost / portionDivisor) * 100) / 100

              return (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                    Production Batch Financial Costing
                  </span>
                  <div className="space-y-1.5 text-xs pt-1 font-sans">
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span>Initial Material Allocation Cost:</span>
                      <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                        {formatNaira(initialCostComputed)}
                      </span>
                    </div>
                    {additionalCostComputed > 0 && (
                      <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                        <span>Fulfilled Additional Requisitions Cost:</span>
                        <span className="font-mono font-medium text-amber-600">
                          +{formatNaira(additionalCostComputed)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-700 font-semibold text-[13px]">
                      <span className="text-zinc-900 dark:text-zinc-100">Total Net Material Cost:</span>
                      <span className="font-mono text-primary font-bold">
                        {formatNaira(totalNetCost)}
                      </span>
                    </div>
                    {unitCostPerPortionComputed > 0 && (
                      <div className="flex justify-between items-center text-xs text-zinc-500">
                        <span>Net Material Cost per {selectedBatch?.status === 'completed' ? 'Finished' : 'Planned'} Portion:</span>
                        <span className="font-mono font-semibold text-emerald-600">
                          {formatNaira(unitCostPerPortionComputed)} / unit
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </Dialog>

      {/* MODAL 4: Save Recipe Template */}
      <Dialog
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        title="Save as Recipe Template"
        description="Save this BOM formulation as an official standard recipe template for future kitchen batch runs."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsSaveTemplateModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="save-recipe-template-form">
              Save Recipe Template
            </Button>
          </div>
        }
      >
        <form id="save-recipe-template-form" onSubmit={handleConfirmSaveTemplate} className="space-y-4">
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
              <span className="text-kumo-subtle">Target Finished Product:</span>
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
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="md" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Close
                </Button>
                {(batchToEdit.status === 'draft' || batchToEdit.status === 'cancelled') && (
                  <Button
                    variant="destructive"
                    size="md"
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Permanently delete batch ${batchToEdit.batch_ref}? This cannot be undone.`)) {
                        deleteBatch(batchToEdit.id)
                        setIsEditModalOpen(false)
                      }
                    }}
                  >
                    Delete Batch
                  </Button>
                )}
              </div>
              <Button variant="primary" size="md" type="submit" form="edit-batch-form">
                Save Corrections
              </Button>
            </div>
          }
        >
          <form id="edit-batch-form" onSubmit={handleSaveBatchEdit} className="space-y-4 font-sans">
            {editSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <Select
              label="Target Finished Product"
              value={editBatchForm.output_product_id}
              onChange={(e) => setEditBatchForm(prev => ({ ...prev, output_product_id: Number(e.target.value) }))}
              options={salesProducts.map(p => ({ value: p.id, label: p.name }))}
            />

            <UnitInput
              label="Planned Output"
              value={editBatchForm.expected_output}
              onChangeValue={(v) => setEditBatchForm(prev => ({ ...prev, expected_output: Number(v) || 0 }))}
              unit="units"
              min={1}
              required
            />

            <UnitInput
              label="Actual Cooked Output"
              value={editBatchForm.actual_output}
              onChangeValue={(v) => setEditBatchForm(prev => ({ ...prev, actual_output: Number(v) || 0 }))}
              unit="units"
              min={0}
              required
            />

            <UnitInput
              label="Cooking Loss / Wastage"
              value={editBatchForm.wastage}
              onChangeValue={(v) => setEditBatchForm(prev => ({ ...prev, wastage: Number(v) || 0 }))}
              unit="units"
              min={0}
              required
            />

            <Input
              label="Shift Operator / Oven Supervisor"
              value={editBatchForm.created_by_name}
              onChange={(e) => setEditBatchForm(prev => ({ ...prev, created_by_name: e.target.value }))}
              required
            />

            <Input
              label="Production Supervisor Remarks"
              value={editBatchForm.remarks}
              onChange={(e) => setEditBatchForm(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Quality checks, temperature profile, shift directives"
            />
          </form>
        </Dialog>
      )}

      {/* MODAL: Request Additional Materials Against Active Batch */}
      {requisitionBatch && (
        <Dialog
          isOpen={isRequisitionModalOpen}
          onClose={() => setIsRequisitionModalOpen(false)}
          title={`Request Additional Materials: ${requisitionBatch.batch_ref}`}
          description={`Raise an operational requisition for additional firewood, spices, or ingredients while cooking ${requisitionBatch.output_product_name}. Production continues without interruption.`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsRequisitionModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" form="request-materials-form">
                Submit Requisition to Store
              </Button>
            </div>
          }
        >
          <form id="request-materials-form" onSubmit={handleConfirmSubmitRequisition} className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Target Cooking Dish:</span>
                <span className="font-semibold text-kumo-strong">{requisitionBatch.output_product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Batch Reference:</span>
                <span className="font-mono font-medium text-kumo-strong">{requisitionBatch.batch_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Current Status:</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">On Smoking Grills (Active)</span>
              </div>
            </div>

            <Select
              label="Select Material or Ingredient Needed"
              value={reqProductId}
              onChange={(e) => setReqProductId(Number(e.target.value))}
              options={rawProducts.map(rp => ({
                value: rp.id,
                label: `${rp.name} (${rp.sku}) — ${rp.stock_qty} ${formatUnit(rp.unit)} available in Central Store`
              }))}
              size="md"
            />

            <UnitInput
              label="Additional Quantity Required"
              value={reqQty}
              onChangeValue={(v) => setReqQty(Number(v) || 1)}
              unit={formatUnit(rawProducts.find(r => r.id === reqProductId)?.unit)}
              min={0.1}
              step={0.1}
              required
            />

            {(() => {
              const selectedProd = rawProducts.find(r => r.id === reqProductId)
              const unitCost = selectedProd?.unit_cost || 0
              const estimatedImpact = Math.round(reqQty * unitCost * 100) / 100
              return (
                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500 font-sans">Estimated Cost Impact:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {reqQty} {formatUnit(selectedProd?.unit)} @ {formatNaira(unitCost)} = <strong className="text-primary font-bold">{formatNaira(estimatedImpact)}</strong>
                  </span>
                </div>
              )
            })()}

            <Select
              label="Operational Reason for Additional Request"
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              options={[
                { value: 'Firewood burned faster / heat efficiency drop', label: 'Firewood burned faster / heat efficiency drop' },
                { value: 'Recipe flavor adjustment / additional seasoning needed', label: 'Recipe flavor adjustment / additional seasoning needed' },
                { value: 'Defective or damaged raw stock replaced', label: 'Defective or damaged raw stock replaced' },
                { value: 'High ambient humidity / extended smoking duration', label: 'High ambient humidity / extended smoking duration' },
                { value: 'Unplanned yield expansion / portion buffer boost', label: 'Unplanned yield expansion / portion buffer boost' },
                { value: 'Other operational reason', label: 'Other operational reason' },
              ]}
              size="md"
            />

            <Input
              label="Additional Details & Notes (Optional)"
              placeholder="e.g. Moisture in grill chamber required 2 extra bundles of firewood"
              value={reqCustomNotes}
              onChange={(e) => setReqCustomNotes(e.target.value)}
            />

            <Input
              label="Requesting Staff Member"
              value={reqStaff}
              onChange={(e) => setReqStaff(e.target.value)}
              placeholder="e.g. Kitchen Pitmaster"
              required
            />
          </form>
        </Dialog>
      )}

      {/* MODAL: Central Store Requisition Review & Fulfillment */}
      {selectedReqForFulfill && (
        <Dialog
          isOpen={isFulfillModalOpen}
          onClose={() => setIsFulfillModalOpen(false)}
          title={`Review Material Requisition: ${selectedReqForFulfill.id || selectedReqForFulfill.batch_ref}`}
          description={`Central Store inventory review for ${selectedReqForFulfill.raw_product_name} on batch ${selectedReqForFulfill.batch_ref}.`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsFulfillModalOpen(false)}>
                Close
              </Button>
              {hasInventoryRole ? (
                <div className="flex items-center gap-2">
                  {!isRejectMode ? (
                    <>
                      <Button
                        variant="secondary"
                        size="md"
                        type="button"
                        onClick={() => setIsRejectMode(true)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        type="submit"
                        form="fulfill-requisition-form"
                      >
                        Fulfill & Issue Stock
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="md"
                        type="button"
                        onClick={() => setIsRejectMode(false)}
                      >
                        Back
                      </Button>
                      <Button
                        variant="destructive"
                        size="md"
                        type="button"
                        onClick={handleConfirmRejectReq}
                      >
                        Confirm Rejection
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            {!hasInventoryRole && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Approval Restricted:</strong> Fulfilling or rejecting material requisitions requires an <strong>Inventory</strong>, <strong>Storekeeper</strong>, or <strong>Manager</strong> account role. Your current account (<em>{currentAccount?.name} &bull; {currentAccount?.role}</em>) has read-only access.
                </div>
              </div>
            )}

            <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Production Batch:</span>
                <span className="font-semibold text-kumo-strong">{selectedReqForFulfill.batch_ref} ({selectedReqForFulfill.output_product_name})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Material Requested:</span>
                <span className="font-medium text-kumo-strong">{selectedReqForFulfill.raw_product_name} [{selectedReqForFulfill.sku}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Requested Quantity:</span>
                <span className="font-mono font-bold text-kumo-strong">{selectedReqForFulfill.requested_qty} {formatUnit(selectedReqForFulfill.unit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Reason:</span>
                <span className="italic text-zinc-700 dark:text-zinc-300">{selectedReqForFulfill.reason}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-kumo-line/60">
                <span className="text-kumo-subtle">Central Store Available:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {rawProducts.find(r => r.id === selectedReqForFulfill.raw_product_id)?.stock_qty || 0} {formatUnit(selectedReqForFulfill.unit)} on-hand
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Average Unit Cost:</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                  {formatNaira(Math.round(rawProducts.find(r => r.id === selectedReqForFulfill.raw_product_id)?.unit_cost || 0))} / {formatUnit(selectedReqForFulfill.unit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Dispatched Value Impact:</span>
                <span className="font-mono font-bold text-primary">
                  +{formatNaira(Math.round(fulfillQty * Math.round(rawProducts.find(r => r.id === selectedReqForFulfill.raw_product_id)?.unit_cost || 0)))}
                </span>
              </div>
            </div>

            {hasInventoryRole && !isRejectMode && (
              <form id="fulfill-requisition-form" onSubmit={handleConfirmFulfillReq} className="space-y-4">
                <UnitInput
                  label="Quantity to Issue (Supports Partial Fulfillment)"
                  value={fulfillQty}
                  onChangeValue={(v) => setFulfillQty(Number(v) || 0)}
                  unit={formatUnit(selectedReqForFulfill.unit)}
                  min={0.1}
                  max={Math.min(
                    selectedReqForFulfill.requested_qty,
                    rawProducts.find(r => r.id === selectedReqForFulfill.raw_product_id)?.stock_qty || selectedReqForFulfill.requested_qty
                  )}
                  step={0.1}
                  helperText={
                    fulfillQty < selectedReqForFulfill.requested_qty
                      ? `Partial fulfillment: issuing ${fulfillQty} of ${selectedReqForFulfill.requested_qty} ${formatUnit(selectedReqForFulfill.unit)}`
                      : 'Full requested quantity will be issued from Central Store'
                  }
                  required
                />

                <Input
                  label="Warehouse / Storekeeper Notes"
                  placeholder="e.g. Issued from Lot A-12 dry storage"
                  value={warehouseNotes}
                  onChange={(e) => setWarehouseNotes(e.target.value)}
                />
              </form>
            )}

            {hasInventoryRole && isRejectMode && (
              <div className="space-y-3">
                <Input
                  label="Reason for Rejection"
                  placeholder="e.g. Insufficient Central Store buffer, alternative recipe approved"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-[11px] text-red-600 dark:text-red-400 leading-tight">
                  Rejecting will update this requisition to Rejected without deducting store inventory. The batch will continue with its initial materials.
                </p>
              </div>
            )}
          </div>
        </Dialog>
      )}
      {/* MODAL: Manage Recipe Templates */}
      <Dialog
        isOpen={isManageTemplatesModalOpen}
        onClose={() => setIsManageTemplatesModalOpen(false)}
        title="Manage Recipe Templates"
        description="Standard Bill of Materials (BOM) formulas used for automated cooking allocations, yield tracking, and smoking grill runs."
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
            <span className="text-kumo-subtle font-medium">Target Product:</span>
            <div className="font-semibold text-kumo-strong text-sm">
              {templateToEdit?.output_product_name}
            </div>
          </div>

          <Input
            label="Template Version / Name"
            value={editTemplateForm.version_name}
            onChange={(e) => setEditTemplateForm(prev => ({ ...prev, version_name: e.target.value }))}
            required
            placeholder="e.g. Signature Smoking Grill Run (Batch 50)"
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
        title="Formulate Recipe Prep Mix"
        description="Withdraw raw ingredients from Central Store to prepare an intermediate mix (e.g. Pepper Mix, Marinade) shared across cooking batches."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreatePrepModalOpen(false)}>
              Close
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
              Withdraw from Central Store & Formulate Prep
            </Button>
          </div>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          <Input
            label="Recipe Mix Name"
            placeholder="e.g. Signature Pepper Mix & Marinade"
            value={prepRecipeName}
            onChange={(e) => setPrepRecipeName(e.target.value)}
            required
          />

          <UnitInput
            label="Expected Yield"
            value={prepYieldQty}
            onChangeValue={(v) => setPrepYieldQty(Number(v) || 0.5)}
            unit={prepUnit}
            min={0.5}
            step={0.5}
            required
          />

          <Select
            label="Yield Unit"
            value={prepUnit}
            onChange={(e) => setPrepUnit(e.target.value as any)}
            options={[
              { value: 'kg', label: 'kg (Kilograms)' },
              { value: 'L', label: 'L (Litres)' },
            ]}
          />

          <Input
            label="Chef / Prepared By"
            value={prepPreparedBy}
            onChange={(e) => setPrepPreparedBy(e.target.value)}
            placeholder="e.g. Chef Tunde"
            required
          />

          {/* Live Compound Prep Mix Valuation Card */}
          {(() => {
            const totalCost = prepIngredients.reduce((acc, ing) => {
              const p = rawProducts.find(r => r.id === ing.productId)
              return acc + (ing.quantity * (p?.unit_cost || 0))
            }, 0)
            const unitCost = prepYieldQty > 0 ? Math.round(totalCost / prepYieldQty) : 0
            return (
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1 text-xs font-sans">
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                  <span>Total Raw Materials Valuation:</span>
                  <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{formatNaira(Math.round(totalCost))}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-800 dark:text-zinc-200 font-semibold pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Compound Average Cost (per {prepUnit}):</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatNaira(unitCost)} / {prepUnit}</span>
                </div>
              </div>
            )
          })()}

          <div className="space-y-2.5 pt-3 border-t border-kumo-line">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-kumo-strong text-xs uppercase tracking-wider">
                Raw Ingredients (Deducted from Central Store)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  const firstAvail = rawProducts[0]?.id || 11
                  setPrepIngredients(prev => [...prev, { productId: firstAvail, quantity: 2 }])
                }}
              >
                Add Ingredient
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-3 px-2 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider">
              <div className="col-span-7">Raw Material</div>
              <div className="col-span-4">Quantity</div>
              <div className="col-span-1 text-center">Remove</div>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {prepIngredients.map((ing, idx) => {
                const prod = rawProducts.find(r => r.id === ing.productId)
                return (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center text-xs">
                    <div className="col-span-7">
                      <Select
                        value={ing.productId}
                        onChange={(e) => {
                          const pid = Number(e.target.value)
                          setPrepIngredients(prev => prev.map((item, i) => i === idx ? { ...item, productId: pid } : item))
                        }}
                        options={rawProducts.map(r => ({
                          value: r.id,
                          label: `${r.name} (Stock: ${r.stock_qty} ${r.unit})`
                        }))}
                        size="md"
                        buttonClassName="h-10 text-[13px] font-normal"
                      />
                    </div>
                    <div className="col-span-4">
                      <UnitInput
                        value={ing.quantity}
                        onChangeValue={(v) => {
                          const qty = Number(v) || 0.1
                          setPrepIngredients(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
                        }}
                        unit={prod?.unit || 'kg'}
                        min={0.1}
                        step={0.1}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setPrepIngredients(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-kumo-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
          description={`Draw from ${selectedPrep.prep_ref} to use in a cooking batch for any menu item.`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsAllocatePrepModalOpen(false)}>
                Close
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
            <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1 font-sans">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Available Prep Mix:</span>
                <span className="font-semibold text-kumo-strong">{selectedPrep.recipe_name} ({selectedPrep.prep_ref})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Remaining on Bench:</span>
                <span className="font-semibold text-kumo-strong font-mono">{selectedPrep.remaining_qty} {selectedPrep.unit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-kumo-line/60">
                <span className="text-kumo-subtle">Balance After Allocation:</span>
                <span className="font-semibold text-emerald-600 font-mono">
                  {Math.max(0, selectedPrep.remaining_qty - allocQty)} {selectedPrep.unit}
                </span>
              </div>
            </div>

            <Select
              label="Target Product"
              value={allocTargetProduct}
              onChange={(e) => setAllocTargetProduct(e.target.value)}
              options={activeSalesProducts.map(p => ({ value: p.name, label: p.name }))}
            />

            {productionBatches.filter(b => b.status === 'draft' || b.status === 'in_production').length > 0 ? (
              <Select
                label="Target Cooking Batch"
                value={allocBatchRef}
                onChange={(e) => {
                  setAllocBatchRef(e.target.value)
                  const matchedBatch = productionBatches.find(b => b.batch_ref === e.target.value)
                  if (matchedBatch) setAllocTargetProduct(matchedBatch.output_product_name)
                }}
                options={productionBatches
                  .filter(b => b.status === 'draft' || b.status === 'in_production')
                  .map(b => ({
                    value: b.batch_ref,
                    label: `${b.batch_ref} — ${b.output_product_name} (${b.status === 'in_production' ? 'Cooking' : 'Queued'})`
                  }))
                }
              />
            ) : (
              <Input
                label="Batch Ref Number"
                value={allocBatchRef}
                onChange={(e) => setAllocBatchRef(e.target.value)}
                placeholder="e.g. BAT-20261030-01"
                required
              />
            )}

            <UnitInput
              label="Quantity to Draw"
              value={allocQty}
              onChangeValue={(v) => setAllocQty(Number(v) || 0.5)}
              unit={selectedPrep.unit}
              min={0.5}
              max={selectedPrep.remaining_qty}
              step={0.5}
              required
            />

            <Input
              label="Allocated By / Shift Lead"
              value={allocBy}
              onChange={(e) => setAllocBy(e.target.value)}
              required
            />
          </div>
        </Dialog>
      )}

      {/* MODAL 7: Return Surplus Prep to Central Store Cold Storage */}
      {selectedPrep && (
        <Dialog
          isOpen={isReturnPrepModalOpen}
          onClose={() => setIsReturnPrepModalOpen(false)}
          title={`Return Surplus Prep: ${selectedPrep.recipe_name}`}
          description="Return leftover prep mix back to Central Store cold storage as a tracked inventory lot."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsReturnPrepModalOpen(false)}>
                Close
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
                Confirm Return to Central
              </Button>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1 font-sans">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Prep Batch:</span>
                <span className="font-semibold text-kumo-strong">{selectedPrep.recipe_name} ({selectedPrep.prep_ref})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Surplus Available to Return:</span>
                <span className="font-semibold text-emerald-600 font-mono">{selectedPrep.remaining_qty} {selectedPrep.unit}</span>
              </div>
            </div>

            <UnitInput
              label="Quantity Returning"
              value={returnPrepQty}
              onChangeValue={(v) => setReturnPrepQty(Number(v) || 0.1)}
              unit={selectedPrep.unit}
              min={0.1}
              max={selectedPrep.remaining_qty}
              step={0.1}
              required
            />

            <Input
              label="Returned By / Chef"
              value={returnPrepBy}
              onChange={(e) => setReturnPrepBy(e.target.value)}
              required
            />

            <Input
              label="Return & Preservation Notes"
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
          title={`Recipe Prep Provenance: ${selectedPrep.prep_ref}`}
          description="End-to-end provenance: raw materials withdrawn from Central Store and multi-batch distribution ledger."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" onClick={() => setIsPrepProvenanceModalOpen(false)}>
                Close
              </Button>
              {selectedPrep.remaining_qty > 0 ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setIsPrepProvenanceModalOpen(false)
                      setIsReturnPrepModalOpen(true)
                    }}
                  >
                    Return to Central Store
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setIsPrepProvenanceModalOpen(false)
                      setIsAllocatePrepModalOpen(true)
                    }}
                  >
                    Allocate to Batch
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="md" onClick={() => setIsPrepProvenanceModalOpen(false)}>
                  Done
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              {/* Section 1: Prep Batch Overview */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Prep Formulation Overview
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Prep Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{selectedPrep.prep_ref}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Recipe Mix Name</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedPrep.recipe_name}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Prepared By</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedPrep.prepared_by} ({selectedPrep.created_at})</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Initial Yield Produced</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{selectedPrep.initial_yield_qty} {selectedPrep.unit}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Remaining Available</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{selectedPrep.remaining_qty} {selectedPrep.unit}</span>
                  </div>
                  {selectedPrep.returned_to_hub_qty && selectedPrep.returned_to_hub_qty > 0 ? (
                    <div className="flex items-start text-[13px]">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Returned to Central Store</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">
                        {selectedPrep.returned_to_hub_qty} {selectedPrep.unit} ({selectedPrep.return_notes || 'Cold storage'})
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Section 2: Raw Materials Withdrawn from Central Store */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Raw Ingredients Withdrawn ({selectedPrep.source_ingredients.length})
                  </span>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 pt-1">
                  {selectedPrep.source_ingredients.map((ing, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{ing.product_name}</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        -{ing.quantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Cross-Product Batch Allocations */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Cross-Product Batch Allocations ({selectedPrep.allocations?.length || 0})
                  </span>
                </div>

                {selectedPrep.allocations && selectedPrep.allocations.length > 0 ? (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 pt-1">
                    {selectedPrep.allocations.map((a, idx) => (
                      <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {a.target_product_name} <span className="font-mono text-xs text-zinc-500">({a.batch_ref})</span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Allocated at {a.allocated_at} by {a.allocated_by}
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {a.allocated_qty} {selectedPrep.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs py-1">No batches have drawn from this prep mix yet.</div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default ProductionBatchesPage
