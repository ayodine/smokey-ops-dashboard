import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { RawProduct, RawDelivery, RawMovement, RawUsageItem, InventoryLot, StocktakeVariance, InterStationTransfer, BatchMaterialRequisition } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
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
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  BarChart3, 
  Plus, 
  PackagePlus,
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  Flame,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Pencil,
  Eye,
  ArrowRightLeft
} from 'lucide-react'
import { SingleDatePicker } from '@/components/ui/SingleDatePicker'

export const ALL_INVENTORY_UNITS = [
  { value: 'PIECES', label: 'Pieces (Birds / Carcasses / Whole Units)' },
  { value: 'KG', label: 'Kilograms (kg)' },
  { value: 'GRAMS', label: 'Grams (g)' },
  { value: 'LITRE', label: 'Litres (L)' },
  { value: 'ML', label: 'Millilitres (mL)' },
  { value: 'CL', label: 'Centilitres (cL)' },
  { value: 'PACK', label: 'Packs / Packets' },
  { value: 'CARTON', label: 'Cartons / Boxes' },
  { value: 'BAG_50KG', label: 'Bags (50kg)' },
  { value: 'BAG_25KG', label: 'Bags (25kg)' },
  { value: 'BAG', label: 'Bags / Sacks (General)' },
  { value: 'BUNDLE', label: 'Bundles (Firewood / Smoking Wood / Herbs)' },
  { value: 'CRATE', label: 'Crates (Drinks / Eggs)' },
  { value: 'ROLL', label: 'Rolls (Foil / Film / Wrap)' },
  { value: 'TUB', label: 'Tubs / Buckets' },
  { value: 'DRUM', label: 'Drums / Kegs (25L/50L Oil/Sauce)' },
  { value: 'TIN', label: 'Tins / Cans' },
  { value: 'BOTTLE', label: 'Bottles' },
  { value: 'BOWL', label: 'Bowls / Portions' },
  { value: 'CUP', label: 'Cups (Measures)' },
  { value: 'TBSP', label: 'Tablespoons (tbsp)' },
  { value: 'TSP', label: 'Teaspoons (tsp)' },
  { value: 'DOZEN', label: 'Dozens (12 pcs)' },
  { value: 'PAIRS', label: 'Pairs' },
  { value: 'LBS', label: 'Pounds (lbs)' },
  { value: 'OZ', label: 'Ounces (oz)' },
  { value: 'DERICA', label: 'Derica' },
  { value: 'KONGO', label: 'Kongo / Paint Rubber (4L)' },
  { value: 'STICK', label: 'Sticks' },
  { value: 'BALE', label: 'Bales' },
  { value: 'SACHET', label: 'Sachets' },
  { value: 'TRAY', label: 'Trays' },
  { value: 'CUSTOM', label: 'Custom / Type manual unit...' }
]

export const RawInventoryPage: React.FC = () => {
  const {
    rawProducts,
    rawDeliveries,
    rawMovements,
    rawUsage,
    suppliers,
    inventoryLots,
    salesProducts,
    stocktakeVariances,
    interStationTransfers,
    receiveRawStockWithLot,
    adjustRawStock,
    writeOffLotWaste,
    prioritizeLotInKitchen,
    saveRawProduct,
    submitStocktakeCount,
    resolveStocktakeVariance,
    productionBatches,
    fulfillBatchMaterialRequisition,
    rejectBatchMaterialRequisition,
    currentAccount,
    hasPermission,
    hasRole
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'current' | 'batches' | 'receipts' | 'requisitions' | 'variances'>('current')

  // Expiring Lots Workflow State
  const [isPrioritizeModalOpen, setIsPrioritizeModalOpen] = useState(false)
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null)

  // Prioritize in Kitchen Form State
  const [prioritizeQty, setPrioritizeQty] = useState<number>(1)
  const [prioritizeDish, setPrioritizeDish] = useState<string>('')
  const [prioritizeSupervisor, setPrioritizeSupervisor] = useState(currentAccount?.name || 'Production Supervisor')
  const [prioritizeRemarks, setPrioritizeRemarks] = useState('')

  // Spoilage / Waste Form State
  const [wasteQty, setWasteQty] = useState<number>(1)
  const [wasteApprover, setWasteApprover] = useState(currentAccount?.name || 'Production Supervisor')
  const [wasteNotes, setWasteNotes] = useState('')

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isBlindStocktakeModalOpen, setIsBlindStocktakeModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<RawProduct | null>(null)
  const [selectedDetailsProduct, setSelectedDetailsProduct] = useState<RawProduct | null>(null)

  const handleOpenDetails = (product: RawProduct) => {
    setSelectedDetailsProduct(product)
    setIsDetailsModalOpen(true)
  }
  const [selectedVariance, setSelectedVariance] = useState<StocktakeVariance | null>(null)

  // Inbound Form State (with FEFO Lot support & WAC tracking)
  const [receiveSupplierId, setReceiveSupplierId] = useState<number>(suppliers[0]?.id || 2)
  const [receiveProductId, setReceiveProductId] = useState<number>(rawProducts[0]?.id || 62)
  const [receiveQty, setReceiveQty] = useState<number>(10)
  const [receiveUnitCost, setReceiveUnitCost] = useState<number>(rawProducts[0]?.unit_cost || 6500)
  const [receiveLotNumber, setReceiveLotNumber] = useState<string>('')
  const [receiveExpiryDate, setReceiveExpiryDate] = useState<string>('')
  const [receiveInvoiceRef, setReceiveInvoiceRef] = useState<string>('')
  const [receiveReceiptDate, setReceiveReceiptDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [receiveNotes, setReceiveNotes] = useState('')

  // Production Floor Requisitions State
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<BatchMaterialRequisition | null>(null)
  const [requisitionIssueQty, setRequisitionIssueQty] = useState<number>(1)
  const [requisitionNotes, setRequisitionNotes] = useState<string>('')
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [isRejectMode, setIsRejectMode] = useState<boolean>(false)

  // Adjust Form State with Direction & Magnitude
  const [adjustDirection, setAdjustDirection] = useState<'deduct' | 'add'>('deduct')
  const [adjustMagnitude, setAdjustMagnitude] = useState<number>(1)
  const [adjustReason, setAdjustReason] = useState<string>('Kitchen Waste & Trimmings')
  const [adjustNotes, setAdjustNotes] = useState('')

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    unit: 'PIECES',
    unit_cost: 5000,
    reorder_level: 20,
    is_perishable: false,
    expiry_date: ''
  })
  const [isCustomUnitMode, setIsCustomUnitMode] = useState(false)
  const [customUnitText, setCustomUnitText] = useState('')

  // Blind Stocktake Form State
  const [stocktakeItems, setStocktakeItems] = useState<RawProduct[]>([])
  const [stocktakeCounts, setStocktakeCounts] = useState<{ [key: number]: number }>({})
  const [stocktakeCountedBy, setStocktakeCountedBy] = useState(currentAccount?.name || 'Inventory Staff')

  // Resolve Variance Form State
  const [supervisorResolutionNotes, setSupervisorResolutionNotes] = useState('')

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // KPI Calculations - derived from authentic live inventory
  const totalSKUs = rawProducts.length
  const totalValuation = rawProducts.reduce((acc, p) => acc + (p.inventory_value || (p.stock_qty * p.unit_cost)), 0)
  const lowStockCount = rawProducts.filter(p => p.stock_qty <= p.reorder_level).length
  const pendingVariancesCount = stocktakeVariances.filter(v => v.status === 'pending_review').length
  const nearExpiryCount = inventoryLots.filter(l => l.days_to_expiry <= 4 && l.remaining_qty > 0).length

  // Batches expiring in <= 3 days with remaining balance
  const criticalExpiringLots = useMemo(() => {
    return inventoryLots.filter(l => l.days_to_expiry <= 3 && l.remaining_qty > 0)
  }, [inventoryLots])

  const pendingRequisitions = useMemo(() => {
    return productionBatches.flatMap(b => b.additional_requisitions || []).filter(r => r.status === 'pending')
  }, [productionBatches])

  const allRequisitions = useMemo(() => {
    return productionBatches.flatMap(b => b.additional_requisitions || [])
  }, [productionBatches])

  // Handlers
  const handleOpenReceive = (product?: RawProduct) => {
    if (product) {
      setReceiveProductId(product.id)
      const initialCost = product.last_purchase_cost ? Math.round(product.last_purchase_cost) : Math.round(product.unit_cost || 0)
      setReceiveUnitCost(initialCost)
      setReceiveLotNumber(`LOT-${product.sku.replace('SKU-', '')}-${new Date().toISOString().slice(5, 10).replace('-', '')}`)
    } else {
      if (rawProducts.length > 0) {
        setReceiveProductId(rawProducts[0].id)
        const defaultProd = rawProducts[0]
        const initialCost = defaultProd.last_purchase_cost ? Math.round(defaultProd.last_purchase_cost) : Math.round(defaultProd.unit_cost || 0)
        setReceiveUnitCost(initialCost)
        setReceiveLotNumber(`LOT-GNF-${new Date().toISOString().slice(5, 10).replace('-', '')}`)
      }
    }
    setReceiveQty(10)
    setReceiveInvoiceRef(`INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`)
    setReceiveReceiptDate(new Date().toISOString().split('T')[0])
    setReceiveExpiryDate('')
    setReceiveNotes('')
    setIsReceiveModalOpen(true)
  }

  const handleOpenRequisitionModal = (req: BatchMaterialRequisition) => {
    setSelectedRequisition(req)
    setRequisitionIssueQty(req.requested_qty)
    setRequisitionNotes('')
    setRejectionReason('')
    setIsRejectMode(false)
    setIsRequisitionModalOpen(true)
  }

  const handleConfirmFulfillRequisition = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequisition) return
    const success = fulfillBatchMaterialRequisition(
      selectedRequisition.id,
      Number(requisitionIssueQty),
      requisitionNotes
    )
    if (success) {
      setIsRequisitionModalOpen(false)
    }
  }

  const handleConfirmRejectRequisition = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequisition || !rejectionReason.trim()) return
    const success = rejectBatchMaterialRequisition(
      selectedRequisition.id,
      rejectionReason.trim()
    )
    if (success) {
      setIsRequisitionModalOpen(false)
    }
  }

  const handleOpenAdjust = (product: RawProduct) => {
    setSelectedProduct(product)
    setAdjustDirection('deduct')
    setAdjustMagnitude(1)
    setAdjustReason('Kitchen Waste & Trimmings')
    setAdjustNotes('')
    setIsAdjustModalOpen(true)
  }

  const handleOpenEditProduct = (product?: RawProduct) => {
    if (product) {
      setSelectedProduct(product)
      const isKnown = ALL_INVENTORY_UNITS.some(u => u.value === product.unit)
      if (isKnown) {
        setIsCustomUnitMode(false)
        setCustomUnitText('')
      } else {
        setIsCustomUnitMode(true)
        setCustomUnitText(product.unit)
      }
      setProductForm({
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        unit_cost: product.unit_cost,
        reorder_level: product.reorder_level,
        is_perishable: product.is_perishable || false,
        expiry_date: product.expiry_date || ''
      })
    } else {
      setSelectedProduct(null)
      setIsCustomUnitMode(false)
      setCustomUnitText('')
      setProductForm({
        name: '',
        sku: `SKU-${String(rawProducts.length + 101).padStart(5, '0')}`,
        unit: 'PIECES',
        unit_cost: 5000,
        reorder_level: 20,
        is_perishable: true,
        expiry_date: ''
      })
    }
    setIsProductModalOpen(true)
  }

  const handleOpenBlindStocktake = () => {
    // Pick 5 diverse SKUs across the catalog (perishables & staples)
    const shuffled = [...rawProducts].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 5)
    setStocktakeItems(selected)
    setStocktakeCounts({})
    setIsBlindStocktakeModalOpen(true)
  }

  const handleSubmitReceive = (e: React.FormEvent) => {
    e.preventDefault()
    receiveRawStockWithLot({
      supplierId: Number(receiveSupplierId),
      productId: Number(receiveProductId),
      quantity: Number(receiveQty),
      unitCost: Number(receiveUnitCost),
      lotNumber: receiveLotNumber.trim() || undefined,
      expiryDate: receiveExpiryDate || undefined,
      invoiceRef: receiveInvoiceRef.trim() || undefined,
      receiptDate: receiveReceiptDate || undefined,
      notes: receiveNotes
    })
    setIsReceiveModalOpen(false)
  }

  const handleSubmitAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    const signedDelta = adjustDirection === 'deduct' ? -Math.abs(adjustMagnitude) : Math.abs(adjustMagnitude)
    adjustRawStock(selectedProduct.id, signedDelta, adjustNotes, adjustReason)
    setIsAdjustModalOpen(false)
  }

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault()
    saveRawProduct({
      id: selectedProduct?.id,
      name: productForm.name,
      sku: productForm.sku,
      unit: productForm.unit,
      unit_cost: Number(productForm.unit_cost),
      reorder_level: Number(productForm.reorder_level),
      is_perishable: productForm.is_perishable,
      expiry_date: productForm.expiry_date || undefined
    })
    setIsProductModalOpen(false)
  }

  const handleSubmitBlindStocktake = (e: React.FormEvent) => {
    e.preventDefault()
    const countsPayload = stocktakeItems.map(p => ({
      productId: p.id,
      physicalCount: Number(stocktakeCounts[p.id] ?? 0),
      category: 'raw' as const
    }))

    setIsBlindStocktakeModalOpen(false)
    const variancesLogged = submitStocktakeCount(countsPayload, stocktakeCountedBy)
    if (variancesLogged > 0) {
      setActiveTab('variances')
    }
  }

  const handleOpenResolve = (v: StocktakeVariance) => {
    setSelectedVariance(v)
    setSupervisorResolutionNotes(`Approved variance write-off of ${v.variance_qty} ${v.unit}. Physical stock verified by Operations Lead.`)
    setIsResolveModalOpen(true)
  }

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVariance) return
    resolveStocktakeVariance(selectedVariance.id, supervisorResolutionNotes)
    setIsResolveModalOpen(false)
  }

  // FEFO Workflow Handlers (Prioritize in Kitchen & Log Waste)
  const getMatchingDishForProtein = (productName: string): string => {
    const upper = productName.toUpperCase()
    if (upper.includes('GUINEAFOWL') || upper.includes('GNF')) {
      return 'Full Smokey Guineafowl'
    }
    if (upper.includes('CATFISH') || upper.includes('FISH')) {
      return 'Charcoal Roasted Whole Catfish (Family)'
    }
    if (upper.includes('TURKEY')) {
      return 'Smokey Jumbo Turkey Wings (Pair)'
    }
    if (upper.includes('BEEF') || upper.includes('KILISHI')) {
      return 'Smokey Beef Kilishi (Traditional Sun-Cured & Light-Smoked Slices 125g)'
    }
    if (upper.includes('CHICKEN')) {
      return 'Full Smokey Guineafowl'
    }
    return salesProducts[0]?.name || 'Full Smokey Guineafowl'
  }

  const handleOpenPrioritize = (lot: InventoryLot) => {
    setSelectedLot(lot)
    setPrioritizeQty(lot.remaining_qty)
    setPrioritizeDish(getMatchingDishForProtein(lot.product_name))
    setPrioritizeSupervisor(currentAccount?.name || 'Production Supervisor')
    setPrioritizeRemarks(`[URGENT EXPIRING BATCH] Lot ${lot.lot_number} allocated to smoking grill / oven. Best before: ${lot.expiry_date} (${lot.days_to_expiry} days left).`)
    setIsPrioritizeModalOpen(true)
  }

  const handleSubmitPrioritize = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot) return
    prioritizeLotInKitchen({
      lotId: selectedLot.id,
      quantity: Number(prioritizeQty),
      targetDishName: prioritizeDish,
      supervisorName: prioritizeSupervisor,
      shiftRemarks: prioritizeRemarks
    })
    setIsPrioritizeModalOpen(false)
  }

  const handleOpenWaste = (lot: InventoryLot) => {
    setSelectedLot(lot)
    setWasteQty(lot.remaining_qty)
    setWasteApprover(currentAccount?.name || 'Production Supervisor')
    setWasteNotes('Expired / past optimal cold-storage freshness date. Written off according to food safety protocol.')
    setIsWasteModalOpen(true)
  }

  const handleSubmitWaste = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot) return
    writeOffLotWaste({
      lotId: selectedLot.id,
      quantity: Number(wasteQty),
      notes: wasteNotes,
      approverName: wasteApprover
    })
    setIsWasteModalOpen(false)
  }

  // Column definitions for Tab 1: Current Inventory (In Stock)
  const currentColumns: ColumnDef<RawProduct>[] = [
    {
      key: 'sku',
      header: 'Item Code',
      defaultWidth: 120,
      accessor: (p) => <span className="font-semibold text-xs text-kumo-strong font-mono">{p.sku}</span>,
      sortValue: (p) => p.sku,
    },
    {
      key: 'name',
      header: 'Material',
      defaultWidth: 260,
      accessor: (p) => {
        const matchingLot = inventoryLots.find(l => l.product_id === p.id && l.remaining_qty > 0 && l.days_to_expiry <= 4)
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-kumo-strong font-sans">{p.name}</span>
              {matchingLot ? (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 rounded">
                  Near Expiry ({matchingLot.days_to_expiry}d)
                </span>
              ) : p.is_perishable ? (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 rounded">
                  Perishable
                </span>
              ) : null}
            </div>
            <div className="text-[11px] text-kumo-subtle uppercase tracking-wider font-sans">
              {p.unit} {p.fefo_lot ? `• Lot: ${p.fefo_lot}` : ''}
            </div>
          </div>
        )
      },
      sortValue: (p) => p.name,
    },
    {
      key: 'stock_qty',
      header: 'Stock Level',
      defaultWidth: 180,
      accessor: (p) => {
        const isOut = p.stock_qty <= 0
        const isLow = !isOut && p.stock_qty <= p.reorder_level
        const hasAllocated = (p.qty_allocated || 0) > 0
        return (
          <div className="flex flex-col gap-0.5 font-sans">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-kumo-strong font-sans">
                {formatQuantity(p.stock_qty)} {p.unit}
              </span>
              {isOut ? (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 whitespace-nowrap bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                  Out of Stock
                </span>
              ) : isLow ? (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 whitespace-nowrap bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                  Low Stock
                </span>
              ) : null}
            </div>
            {hasAllocated && (
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                ({formatQuantity(p.qty_allocated)} in kitchen prep)
              </span>
            )}
          </div>
        )
      },
      sortValue: (p) => p.stock_qty,
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      defaultWidth: 130,
      accessor: (p) => <span className="text-xs text-kumo-default font-sans">{formatNaira(p.unit_cost)}</span>,
      sortValue: (p) => p.unit_cost,
    },
    {
      key: 'inventory_value',
      header: 'Total Value',
      defaultWidth: 140,
      accessor: (p) => <span className="font-semibold text-kumo-strong font-sans">{formatNaira(p.inventory_value || (p.stock_qty * p.unit_cost))}</span>,
      sortValue: (p) => p.inventory_value || (p.stock_qty * p.unit_cost),
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (p) => (
        <div className="flex items-center gap-1.5 font-sans flex-nowrap" onClick={e => e.stopPropagation()}>
          {hasPermission('perm_intake') && (
            <Tooltip content="Record incoming stock from supplier">
              <TableActionButton
                variant="success"
                onClick={() => handleOpenReceive(p)}
              >
                + Receive
              </TableActionButton>
            </Tooltip>
          )}
          {hasPermission('perm_cycle_counts') && (
            <Tooltip content="Adjust on-hand stock or record kitchen wastage">
              <TableActionButton
                variant="outline"
                onClick={() => handleOpenAdjust(p)}
              >
                Adjust
              </TableActionButton>
            </Tooltip>
          )}
          {!hasPermission('perm_intake') && !hasPermission('perm_cycle_counts') && (
            <span className="text-xs text-kumo-subtle font-sans italic">View Only</span>
          )}
        </div>
      ),
    },
  ]

  // Column definitions for Expiring Lots Tab
  const fefoColumns: ColumnDef<InventoryLot>[] = [
    {
      key: 'lot_number',
      header: 'Batch Lot Number',
      defaultWidth: 160,
      accessor: (l) => <span className="font-semibold text-xs text-kumo-strong font-mono">{l.lot_number}</span>,
      sortValue: (l) => l.lot_number,
    },
    {
      key: 'product_name',
      header: 'Protein / Raw Item',
      defaultWidth: 240,
      accessor: (l) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{l.product_name}</div>
          <div className="text-[11px] text-kumo-subtle font-sans">{l.sku}</div>
        </div>
      ),
      sortValue: (l) => l.product_name,
    },
    {
      key: 'supplier_name',
      header: 'Supplier / Origin',
      defaultWidth: 180,
      accessor: (l) => <span className="text-xs text-kumo-default font-sans">{l.supplier_name}</span>,
      sortValue: (l) => l.supplier_name,
    },
    {
      key: 'remaining_qty',
      header: 'Remaining Balance',
      defaultWidth: 180,
      accessor: (l) => (
        <span className="font-medium text-xs text-kumo-strong font-sans whitespace-nowrap">
          {formatQuantity(l.remaining_qty)} / {l.initial_qty} {l.unit}
        </span>
      ),
      sortValue: (l) => l.remaining_qty,
    },
    {
      key: 'expiry_date',
      header: 'Expiry Date',
      defaultWidth: 140,
      accessor: (l) => (
        <span className="text-xs text-kumo-default font-sans whitespace-nowrap">{l.expiry_date}</span>
      ),
      sortValue: (l) => l.expiry_date,
    },
    {
      key: 'days_to_expiry',
      header: 'Days Left',
      defaultWidth: 200,
      accessor: (l) => {
        const isUrgent = l.days_to_expiry <= 4
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 whitespace-nowrap ${
              isUrgent
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            }`}
          >
            {l.days_to_expiry} days ({isUrgent ? 'Near Expiry' : 'Active'})
          </span>
        )
      },
      sortValue: (l) => l.days_to_expiry,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 190,
      accessor: (l) => {
        if (l.remaining_qty <= 0) {
          return <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">Depleted / Written Off</span>
        }
        return (
          <div className="flex items-center gap-1.5 font-sans flex-nowrap" onClick={e => e.stopPropagation()}>
            <Tooltip content="Create prep batch targeting this lot so it gets smoked first">
              <TableActionButton
                variant="primary"
                onClick={() => handleOpenPrioritize(l)}
              >
                Prioritize
              </TableActionButton>
            </Tooltip>
            <Tooltip content="Record shrinkage with reason 'Expired / Past Date'">
              <TableActionButton
                variant="outline"
                onClick={() => handleOpenWaste(l)}
              >
                Log Waste
              </TableActionButton>
            </Tooltip>
          </div>
        )
      },
    },
  ]

  // Column definitions for Tab 2: Inbound Deliveries History
  const inboundColumns: ColumnDef<RawDelivery>[] = [
    {
      key: 'delivery_ref',
      header: 'Receipt Ref',
      accessor: (d) => (
        <div>
          <span className="font-medium text-xs text-kumo-strong font-sans">{d.delivery_ref}</span>
          {d.invoice_ref && (
            <div className="text-[10px] text-kumo-subtle font-mono">Inv: {d.invoice_ref}</div>
          )}
        </div>
      ),
      sortValue: (d) => d.delivery_ref,
    },
    {
      key: 'date_received',
      header: 'Date',
      accessor: (d) => <span className="text-xs text-kumo-subtle font-sans">{formatDate(d.date_received)}</span>,
      sortValue: (d) => d.date_received,
    },
    {
      key: 'product_name',
      header: 'Item Received',
      accessor: (d) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{d.product_name}</div>
          <div className="text-[11px] text-kumo-subtle font-sans">{d.sku}</div>
        </div>
      ),
      sortValue: (d) => d.product_name,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (d) => <span className="font-medium text-kumo-strong font-sans">+{formatQuantity(d.quantity)} {d.unit}</span>,
      sortValue: (d) => d.quantity,
    },
    {
      key: 'unit_cost',
      header: 'Purchase Price & Avg Cost',
      accessor: (d) => (
        <div>
          <div className="text-xs font-semibold text-kumo-strong font-sans">{formatNaira(d.unit_cost)}</div>
          {d.wac_after && (
            <div className="text-[10px] text-kumo-subtle font-mono">Avg Cost: {formatNaira(d.wac_after)}</div>
          )}
        </div>
      ),
      sortValue: (d) => d.unit_cost,
    },
    {
      key: 'value_amount',
      header: 'Total Value',
      accessor: (d) => <span className="font-medium text-emerald-700 font-sans">{formatNaira(d.value_amount)}</span>,
      sortValue: (d) => d.value_amount,
    },
    {
      key: 'supplier_name',
      header: 'Supplier / Vendor',
      accessor: (d) => <span className="text-xs text-kumo-default font-sans">{d.supplier_name}</span>,
      sortValue: (d) => d.supplier_name,
    },
    {
      key: 'user_name',
      header: 'Received By',
      accessor: (d) => <span className="text-xs text-kumo-subtle font-sans">{d.user_name}</span>,
    },
  ]

  // Column definitions for Tab 4: Production Floor Requisitions
  const requisitionColumns: ColumnDef<BatchMaterialRequisition>[] = [
    {
      key: 'id',
      header: 'Requisition Ref',
      accessor: (r) => (
        <div>
          <span className="font-semibold text-xs text-primary font-mono">{r.id}</span>
          <div className="text-[11px] text-kumo-subtle font-sans">{r.requested_at}</div>
        </div>
      ),
      sortValue: (r) => r.id,
    },
    {
      key: 'batch_ref',
      header: 'Production Run',
      accessor: (r) => (
        <div>
          <span className="font-medium text-xs text-kumo-strong font-mono">{r.batch_ref}</span>
          <div className="text-[11px] text-kumo-subtle font-sans">{r.output_product_name}</div>
        </div>
      ),
      sortValue: (r) => r.batch_ref,
    },
    {
      key: 'raw_product_name',
      header: 'Material Requested',
      accessor: (r) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{r.raw_product_name}</div>
          <div className="text-[11px] text-kumo-subtle font-sans">{r.sku}</div>
        </div>
      ),
      sortValue: (r) => r.raw_product_name,
    },
    {
      key: 'requested_qty',
      header: 'Requisition Qty',
      accessor: (r) => (
        <div>
          <span className="font-semibold text-xs text-kumo-strong font-sans">
            {r.requested_qty} {r.unit}
          </span>
          {r.fulfilled_qty !== undefined && r.fulfilled_qty > 0 && (
            <div className="text-[11px] text-emerald-700 font-medium">
              Issued: {r.fulfilled_qty} {r.unit} ({formatNaira(r.total_cost || 0)})
            </div>
          )}
        </div>
      ),
      sortValue: (r) => r.requested_qty,
    },
    {
      key: 'reason',
      header: 'Reason / Kitchen Notes',
      accessor: (r) => (
        <div className="max-w-xs">
          <span className="text-xs text-kumo-default font-sans leading-tight block">{r.reason}</span>
          <span className="text-[11px] text-kumo-subtle font-sans block mt-0.5">By {r.requested_by}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap shrink-0 ${
          r.status === 'approved'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
            : r.status === 'partially_fulfilled'
            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
            : r.status === 'rejected'
            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
        }`}>
          {r.status === 'approved' ? 'Fulfilled' : r.status === 'partially_fulfilled' ? 'Partial' : r.status === 'rejected' ? 'Rejected' : 'Pending Review'}
        </span>
      ),
      sortValue: (r) => r.status,
    },
    {
      key: 'actions',
      header: 'Store Action',
      defaultWidth: 140,
      accessor: (r) => (
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          {r.status === 'pending' ? (
            <TableActionButton
              variant="primary"
              onClick={() => handleOpenRequisitionModal(r)}
            >
              Review & Issue
            </TableActionButton>
          ) : (
            <span className="text-[11px] text-kumo-subtle italic whitespace-nowrap shrink-0">
              {r.reviewed_by ? `Closed by ${r.reviewed_by}` : 'Closed'}
            </span>
          )}
        </div>
      ),
    },
  ]

  // Column definitions for Tab 3: Outbound Movements History
  const outboundColumns: ColumnDef<RawMovement>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      accessor: (m) => <span className="text-xs text-kumo-subtle font-sans">{m.created_at}</span>,
      sortValue: (m) => m.created_at,
    },
    {
      key: 'product_name',
      header: 'Item',
      accessor: (m) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{m.product_name}</div>
          <div className="text-[11px] text-kumo-subtle font-sans">{m.sku}</div>
        </div>
      ),
      sortValue: (m) => m.product_name,
    },
    {
      key: 'movement_type',
      header: 'Type',
      defaultWidth: 160,
      accessor: (m) => {
        const isConsumption = m.movement_type === 'consumption'
        const isWaste = m.movement_type === 'waste'
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap shrink-0 ${
            isConsumption ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' :
            isWaste ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' :
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
          }`}>
            {m.movement_type.toUpperCase()}
          </span>
        )
      },
      sortValue: (m) => m.movement_type,
    },
    {
      key: 'quantity',
      header: 'Qty Deducted',
      accessor: (m) => <span className="font-medium text-rose-600 font-sans">{formatQuantity(m.quantity)} {m.unit}</span>,
      sortValue: (m) => m.quantity,
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      accessor: (m) => <span className="font-medium text-kumo-strong font-sans">{formatQuantity(m.balance_after)} {m.unit}</span>,
      sortValue: (m) => m.balance_after,
    },
    {
      key: 'notes',
      header: 'Reason / Batch Ref',
      accessor: (m) => <span className="text-xs text-kumo-default font-sans">{m.notes}</span>,
    },
    {
      key: 'user_name',
      header: 'Logged By',
      accessor: (m) => <span className="text-xs text-kumo-subtle font-sans">{m.user_name}</span>,
    },
  ]

  // Column definitions for Inter-Station Transfers (Hub <-> Outlets)
  const transferColumns: ColumnDef<InterStationTransfer>[] = [
    {
      key: 'transfer_ref',
      header: 'Transfer Ref',
      accessor: (t) => <span className="font-mono text-xs font-semibold text-kumo-strong">{t.transfer_ref}</span>,
      sortValue: (t) => t.transfer_ref,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      accessor: (t) => <span className="text-xs text-kumo-subtle">{formatDate(t.created_at)}</span>,
      sortValue: (t) => t.created_at,
    },
    {
      key: 'transfer_type',
      header: 'Station Route',
      accessor: (t) => {
        const fromLabel = t.from_station.replace('central_warehouse', 'central_store').replace('production_floor', 'production_bench').replace(/_/g, ' ')
        const toLabel = t.to_station.replace('central_warehouse', 'central_store').replace('production_floor', 'production_bench').replace(/_/g, ' ')
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium capitalize">
            <span className="text-zinc-600 dark:text-zinc-400">{fromLabel}</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{toLabel}</span>
          </div>
        )
      },
      sortValue: (t) => t.transfer_type,
    },
    {
      key: 'items',
      header: 'Items Dispatched / Returned',
      accessor: (t) => (
        <div className="text-xs space-y-0.5">
          {t.items.map((it, idx) => (
            <div key={idx} className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
              {it.quantity} {it.unit} &bull; {it.product_name}
            </div>
          ))}
        </div>
      ),
      sortValue: (t) => t.items.length,
    },
    {
      key: 'authorized_by',
      header: 'Authorized By',
      accessor: (t) => <span className="text-xs text-kumo-default">{t.authorized_by}</span>,
      sortValue: (t) => t.authorized_by,
    },
    {
      key: 'notes',
      header: 'Transfer Audit Notes',
      accessor: (t) => <span className="text-xs text-kumo-subtle max-w-[220px] truncate block">{t.notes}</span>,
      sortValue: (t) => t.notes,
    },
  ]

  // Column definitions for Tab 4: Monthly Usage Summary
  const usageColumns: ColumnDef<RawUsageItem>[] = [
    {
      key: 'sku',
      header: 'SKU Ref',
      accessor: (u) => <span className="font-medium text-xs text-kumo-strong font-sans">{u.sku}</span>,
      sortValue: (u) => u.sku,
    },
    {
      key: 'product_name',
      header: 'Raw Material',
      accessor: (u) => <span className="font-medium text-kumo-strong font-sans">{u.product_name}</span>,
      sortValue: (u) => u.product_name,
    },
    {
      key: 'unit_cost',
      header: 'Avg Unit Cost',
      accessor: (u) => <span className="text-xs text-kumo-default font-sans">{formatNaira(u.unit_cost)}</span>,
      sortValue: (u) => u.unit_cost,
    },
    {
      key: 'total_used',
      header: 'Total Consumed (Month)',
      accessor: (u) => <span className="font-medium text-kumo-strong font-sans">{formatQuantity(u.total_used)} {u.unit}</span>,
      sortValue: (u) => u.total_used,
    },
    {
      key: 'total_value',
      header: 'Total Value Consumed',
      accessor: (u) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(u.total_value)}</span>,
      sortValue: (u) => u.total_value,
    },
  ]

  // Column definitions for Tab 5: Stocktake Variance Escrow
  const escrowColumns: ColumnDef<StocktakeVariance>[] = [
    {
      key: 'date',
      header: 'Audit Date',
      accessor: (v) => <span className="text-xs text-kumo-subtle font-sans">{v.date}</span>,
      sortValue: (v) => v.date,
    },
    {
      key: 'product_name',
      header: 'Item Checked',
      accessor: (v) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{v.product_name}</div>
          <div className="text-[11px] text-kumo-subtle font-sans">{v.sku}</div>
        </div>
      ),
      sortValue: (v) => v.product_name,
    },
    {
      key: 'physical_count',
      header: 'Physical Count',
      accessor: (v) => <span className="font-medium text-kumo-strong font-sans">{v.physical_count} {v.unit}</span>,
    },
    {
      key: 'digital_count',
      header: 'Digital Ledger',
      accessor: (v) => <span className="text-xs text-kumo-subtle font-sans">{v.digital_count} {v.unit}</span>,
    },
    {
      key: 'variance_qty',
      header: 'Discrepancy (Delta)',
      defaultWidth: 200,
      accessor: (v) => (
        <span className={`font-semibold text-xs font-sans whitespace-nowrap shrink-0 ${v.variance_qty < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {v.variance_qty > 0 ? `+${v.variance_qty}` : v.variance_qty} {v.unit} ({formatNaira(v.variance_value)})
        </span>
      ),
      sortValue: (v) => v.variance_qty,
    },
    {
      key: 'counted_by',
      header: 'Audited By',
      accessor: (v) => <span className="text-xs text-kumo-subtle font-sans">{v.counted_by}</span>,
    },
    {
      key: 'status',
      header: 'Audit Status',
      defaultWidth: 150,
      accessor: (v) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap shrink-0 ${
          v.status === 'reconciled'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
        }`}>
          {v.status === 'reconciled' ? 'Reconciled' : 'Pending Review'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Review Action',
      defaultWidth: 150,
      accessor: (v) => (
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          {v.status === 'pending_review' ? (
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenResolve(v)}
            >
              Sign-Off
            </TableActionButton>
          ) : (
            <span className="text-[11px] text-kumo-subtle italic whitespace-nowrap shrink-0">Resolved</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title & Action Bar */}
      <PageHeader
        title="Raw Material Inventory"
        subtitle="Manage fresh meats, cooking spices, hardwood charcoal, and oil deliveries from trusted local suppliers."
        actions={
          <>
            {hasPermission('perm_cycle_counts') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenBlindStocktake}
                leftIcon={<ClipboardCheck className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />}
                className="h-10 px-4 text-sm font-medium shadow-xs"
              >
                Record Stock Count
              </Button>
            )}
            {hasRole(['admin', 'manager']) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditProduct()}
                leftIcon={<Plus className="w-4 h-4" />}
                className="h-10 px-4 text-sm font-medium shadow-xs"
              >
                New Item
              </Button>
            )}
            {hasPermission('perm_intake') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenReceive()}
                leftIcon={<PackagePlus className="w-4 h-4" />}
                className="h-10 px-4 text-sm font-medium shadow-xs"
              >
                Add Received Stock
              </Button>
            )}
          </>
        }
      />

      {/* Pending Production Requisitions Banner */}
      {pendingRequisitions.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs font-sans">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-900/60 flex items-center justify-center text-amber-900 dark:text-amber-200 font-bold text-sm shrink-0">
              {pendingRequisitions.length}
            </span>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Production Floor Material Requisitions Pending Fulfillment
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400">
                Active cooking batches require additional raw ingredients or fuel from the Central Store.
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleOpenRequisitionModal(pendingRequisitions[0])}
            className="bg-amber-700 hover:bg-amber-800 text-white border-none shadow-xs text-xs whitespace-nowrap self-start sm:self-auto"
          >
            Review & Issue Stock ({pendingRequisitions.length})
          </Button>
        </div>
      )}

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Raw Items"
          value={totalSKUs}
          description="Active ingredients & meats"
          icon={<Boxes className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Total Inventory Value"
          value={formatNaira(totalValuation)}
          description="Working capital in livestock & ingredients"
          icon={<BarChart3 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Near Expiry Lots"
          value={nearExpiryCount}
          description="Batches expiring within 4 days"
          icon={<Calendar className="w-4 h-4 text-amber-500" />}
          variant="default"
        />
        <MetricCard
          title="Stock Discrepancies"
          value={pendingVariancesCount}
          description="Variances awaiting supervisor review"
          icon={<ArrowUpRight className="w-4 h-4 text-rose-500" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'current', label: 'In Stock', badge: rawProducts.length },
            { id: 'batches', label: 'Expiring Batches', badge: inventoryLots.length },
            { id: 'receipts', label: 'Receipts & Stock In', badge: rawDeliveries.length },
            { id: 'requisitions', label: 'Batch Requisitions', badge: pendingRequisitions.length > 0 ? pendingRequisitions.length : undefined },
            { id: 'variances', label: 'Count Variances', badge: pendingVariancesCount > 0 ? pendingVariancesCount : undefined },
          ]}
        />
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'current' && (
          <DataTable
            data={rawProducts}
            columns={currentColumns}
            searchable={true}
            searchPlaceholder="Filter by name / SKU..."
            searchFilter={(p, q) =>
              p.name.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q) ||
              p.unit.toLowerCase().includes(q)
            }
            title="Raw Materials"
            exportFilename={`smokey-raw-inventory-${new Date().toISOString().slice(0, 10)}`}
            onRowClick={(p) => handleOpenDetails(p)}
          />
        )}

        {activeTab === 'batches' && (
          <DataTable
            data={inventoryLots}
            columns={fefoColumns}
            searchable={true}
            searchPlaceholder="Filter by batch lot number or item..."
            title="Expiring Raw Materials & Batches"
            exportFilename={`smokey-expiring-batches-${new Date().toISOString().slice(0, 10)}`}
          />
        )}

        {activeTab === 'receipts' && (
          <DataTable
            data={rawDeliveries}
            columns={inboundColumns}
            searchable={true}
            searchPlaceholder="Search delivery ref or supplier..."
            title="Receipts & Supplier Deliveries"
            exportFilename={`smokey-supplier-receipts-${new Date().toISOString().slice(0, 10)}`}
          />
        )}

        {activeTab === 'requisitions' && (
          <DataTable
            data={allRequisitions}
            columns={requisitionColumns}
            searchable={true}
            searchPlaceholder="Search requisitions by batch or material..."
            searchFilter={(r, q) =>
              r.batch_ref.toLowerCase().includes(q) ||
              r.raw_product_name.toLowerCase().includes(q) ||
              r.id.toLowerCase().includes(q) ||
              r.reason.toLowerCase().includes(q)
            }
            title="Production Material Requisitions"
            exportFilename={`smokey-material-requisitions-${new Date().toISOString().slice(0, 10)}`}
            onRowClick={(r) => handleOpenRequisitionModal(r)}
          />
        )}

        {activeTab === 'variances' && (
          <DataTable
            data={stocktakeVariances}
            columns={escrowColumns}
            searchable={false}
            title="Stock Count Variances"
            exportFilename={`smokey-stocktake-variances-${new Date().toISOString().slice(0, 10)}`}
          />
        )}
      </div>

      {/* MODAL 1: Inbound Stock Intake */}
      <Dialog
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Stock from Supplier"
        description="Record incoming meats, peppers, firewood, and cooking supplies."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="receive-stock-form">
              Confirm Stock Intake
            </Button>
          </div>
        }
      >
        <form id="receive-stock-form" onSubmit={handleSubmitReceive} className="space-y-4 font-sans">
          <Select
            label="Verified Supplier"
            value={receiveSupplierId}
            onChange={(e) => setReceiveSupplierId(Number(e.target.value))}
            options={suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.supplier_ref})` }))}
          />

          <Select
            label="Raw Material / Protein SKU"
            value={receiveProductId}
            onChange={(e) => {
              const pid = Number(e.target.value)
              setReceiveProductId(pid)
              const match = rawProducts.find(p => p.id === pid)
              if (match) {
                const initialCost = match.last_purchase_cost ? Math.round(match.last_purchase_cost) : Math.round(match.unit_cost || 0)
                setReceiveUnitCost(initialCost)
                setReceiveLotNumber(`LOT-${match.sku.replace('SKU-', '')}-${new Date().toISOString().slice(5, 10).replace('-', '')}`)
              }
            }}
            options={rawProducts.map(p => ({ value: p.id, label: `${p.name} [${p.sku}] - Current: ${p.stock_qty} ${p.unit} (Avg Cost: ${formatNaira(Math.round(p.unit_cost))})` }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UnitInput
              label="Quantity Received"
              value={receiveQty}
              onChangeValue={setReceiveQty}
              unit={rawProducts.find(p => p.id === receiveProductId)?.unit || 'units'}
              min={0.1}
              step="any"
              required
            />

            <div>
              <Input
                label="Agreed Purchase Price per Unit (₦)"
                type="number"
                step="any"
                min="0.01"
                value={receiveUnitCost}
                onChange={(e) => setReceiveUnitCost(Number(e.target.value))}
                required
              />
              <span className="text-[11px] text-kumo-subtle block mt-1">Invoice unit price agreed with supplier for this delivery</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Supplier Invoice / Delivery Ref"
              placeholder="e.g. INV-2026-0812 or WAYBILL-441"
              value={receiveInvoiceRef}
              onChange={(e) => setReceiveInvoiceRef(e.target.value)}
            />

            <SingleDatePicker
              label="Purchase / Receipt Date"
              value={receiveReceiptDate}
              onChange={(d) => setReceiveReceiptDate(d)}
              required
            />
          </div>

          {/* FEFO Lot Tracking Fields */}
          <div className="space-y-3 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
            <Input
              label="Batch / Lot Number"
              placeholder="e.g. LOT-GNF-0925A"
              value={receiveLotNumber}
              onChange={(e) => setReceiveLotNumber(e.target.value)}
            />
            <SingleDatePicker
              label={rawProducts.find(p => p.id === receiveProductId)?.is_perishable ? "Expiration Date (Required for Perishables)" : "Expiration Date (Optional)"}
              value={receiveExpiryDate}
              onChange={(d) => setReceiveExpiryDate(d)}
              required={rawProducts.find(p => p.id === receiveProductId)?.is_perishable || false}
            />
          </div>

          {/* Live Average Cost Impact & Valuation Preview */}
          {(() => {
            const targetProduct = rawProducts.find(p => p.id === receiveProductId)
            const currentStock = Math.max(0, targetProduct?.stock_qty || 0)
            const currentCost = Math.round(targetProduct?.unit_cost || 0)
            const currentValuation = Math.round(currentStock * currentCost)
            const incomingValuation = Math.round((Number(receiveQty) || 0) * (Number(receiveUnitCost) || 0))
            const projectedQty = currentStock + (Number(receiveQty) || 0)
            const projectedValuation = currentValuation + incomingValuation
            const projectedWAC = projectedQty > 0
              ? Math.round(projectedValuation / projectedQty)
              : Math.round(Number(receiveUnitCost) || 0)
            const delta = projectedWAC - currentCost

            return (
              <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-2.5 font-sans">
                <div className="flex justify-between items-center text-kumo-subtle border-b border-kumo-line pb-1.5">
                  <span className="font-semibold text-kumo-strong">Average Cost Impact & Valuation Preview</span>
                  <span className="text-[10px] text-kumo-subtle uppercase tracking-wider font-mono">Auto-Calculated Average</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-kumo-subtle block">Existing Stock On-Hand:</span>
                    <span className="font-semibold text-kumo-strong">{currentStock} {targetProduct?.unit} @ {formatNaira(currentCost)}</span>
                    <div className="text-[11px] text-kumo-subtle font-mono">Valuation: {formatNaira(currentValuation)}</div>
                  </div>
                  <div>
                    <span className="text-kumo-subtle block">Incoming Procurement:</span>
                    <span className="font-semibold text-kumo-strong">+{receiveQty} {targetProduct?.unit} @ {formatNaira(receiveUnitCost)}</span>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">Value: +{formatNaira(incomingValuation)}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-kumo-line flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-kumo-subtle">Updated Average Unit Cost:</div>
                    <div className="text-sm font-bold text-kumo-strong flex items-center gap-1.5 font-mono">
                      {formatNaira(projectedWAC)} / {targetProduct?.unit}
                      {delta !== 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          delta > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {delta > 0 ? `+${formatNaira(delta)}` : formatNaira(delta)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-kumo-subtle">New Total Inventory Valuation:</div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatNaira(projectedValuation)}</div>
                  </div>
                </div>
                <div className="text-[11px] text-kumo-subtle bg-kumo-canvas/80 p-2 rounded border border-kumo-line/50 leading-relaxed">
                  💡 <strong>How this works:</strong> When you purchase at a new price, the system blends your existing stock with this delivery so your recipe costs and profit margins reflect true average expenses.
                </div>
              </div>
            )
          })()}

          <Input
            label="Delivery Notes & Condition"
            placeholder="e.g. Weighbridge checked; cold-chain temperature 4°C"
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.target.value)}
          />
        </form>
      </Dialog>

      {/* MODAL: Review & Fulfill Production Requisition */}
      <Dialog
        isOpen={isRequisitionModalOpen}
        onClose={() => setIsRequisitionModalOpen(false)}
        title={isRejectMode ? `Reject Requisition: ${selectedRequisition?.id}` : `Issue Material to Batch: ${selectedRequisition?.batch_ref}`}
        description={isRejectMode ? "State the operational reason for rejecting this material request from production." : "Review requested ingredient quantities, confirm available warehouse balance, and issue stock directly to the cooking batch."}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => {
                if (isRejectMode) {
                  setIsRejectMode(false)
                } else {
                  setIsRequisitionModalOpen(false)
                }
              }}
            >
              {isRejectMode ? 'Back' : 'Close'}
            </Button>
            {selectedRequisition?.status === 'pending' && (
              isRejectMode ? (
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  form="reject-requisition-form"
                  className="bg-rose-600 hover:bg-rose-700 text-white border-rose-700"
                >
                  Confirm Rejection
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={() => setIsRejectMode(true)}
                    className="text-rose-600 border-rose-300 hover:bg-rose-50"
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    form="fulfill-requisition-form"
                    disabled={currentAccount?.role !== 'inventory' && currentAccount?.role !== 'admin' && currentAccount?.role !== 'manager'}
                  >
                    Fulfill & Issue Stock
                  </Button>
                </div>
              )
            )}
          </div>
        }
      >
        {selectedRequisition && (
          isRejectMode ? (
            <form id="reject-requisition-form" onSubmit={handleConfirmRejectRequisition} className="space-y-4 font-sans">
              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-rose-800 dark:text-rose-300">
                  Rejecting Requisition {selectedRequisition.id}
                </div>
                <div className="text-rose-700 dark:text-rose-400">
                  Batch: {selectedRequisition.batch_ref} — {selectedRequisition.output_product_name}
                </div>
                <div className="text-rose-700 dark:text-rose-400">
                  Material: {selectedRequisition.requested_qty} {selectedRequisition.unit} of {selectedRequisition.raw_product_name}
                </div>
              </div>

              <Input
                label="Rejection Reason"
                placeholder="e.g. Exceeds shift budget; use reserve briquettes"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                autoFocus
              />
            </form>
          ) : (
            <form id="fulfill-requisition-form" onSubmit={handleConfirmFulfillRequisition} className="space-y-4 font-sans">
              {/* Role Check Alert */}
              {currentAccount?.role !== 'inventory' && currentAccount?.role !== 'admin' && currentAccount?.role !== 'manager' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Inventory Account Role Required</span>
                    <span>Only Central Storekeeper or Inventory Manager accounts have authorization to disburse warehouse stock. Switch to an inventory profile to issue this requisition.</span>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-2 font-sans">
                <div className="flex justify-between items-center border-b border-kumo-line pb-2">
                  <span className="text-kumo-subtle">Target Batch:</span>
                  <span className="font-semibold text-kumo-strong font-mono">{selectedRequisition.batch_ref} ({selectedRequisition.output_product_name})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle">Material Requested:</span>
                  <span className="font-semibold text-kumo-strong">{selectedRequisition.raw_product_name} [{selectedRequisition.sku}]</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle">Requested Quantity:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{selectedRequisition.requested_qty} {selectedRequisition.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle">Central Store On-Hand:</span>
                  <span className="font-semibold text-kumo-strong font-mono">
                    {rawProducts.find(p => p.id === selectedRequisition.raw_product_id)?.stock_qty || 0} {selectedRequisition.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle">Kitchen Operational Reason:</span>
                  <span className="font-medium text-kumo-default italic max-w-xs text-right">{selectedRequisition.reason}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-kumo-line">
                  <span className="text-kumo-subtle">Requested By:</span>
                  <span className="text-kumo-strong">{selectedRequisition.requested_by} at {selectedRequisition.requested_at}</span>
                </div>
              </div>

              {selectedRequisition.status === 'pending' && (
                <>
                  <UnitInput
                    label="Quantity to Issue (Support Partial Fulfillment)"
                    value={requisitionIssueQty}
                    onChangeValue={setRequisitionIssueQty}
                    unit={selectedRequisition.unit}
                    min={0.1}
                    max={rawProducts.find(p => p.id === selectedRequisition.raw_product_id)?.stock_qty || selectedRequisition.requested_qty}
                    step="any"
                    required
                    helperText={
                      requisitionIssueQty < selectedRequisition.requested_qty
                        ? `Partial fulfillment: issuing ${requisitionIssueQty} of ${selectedRequisition.requested_qty} ${selectedRequisition.unit}`
                        : `Full fulfillment of requested quantity`
                    }
                  />

                  <Input
                    label="Warehouse Storekeeper Notes"
                    placeholder="e.g. Inspected and weighed; dispatched to Pitmaster"
                    value={requisitionNotes}
                    onChange={(e) => setRequisitionNotes(e.target.value)}
                  />
                </>
              )}
            </form>
          )
        )}
      </Dialog>

      {/* MODAL 2: Stock Adjustment (fpStockAdjustModal) */}
      <Dialog
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Raw Stock: ${selectedProduct?.name}`}
        description="Manual inventory reconciliation, kitchen wastage, or shrinkage recording."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="adjust-raw-stock-form">
              Apply Stock Adjustment
            </Button>
          </div>
        }
      >
        <form id="adjust-raw-stock-form" onSubmit={handleSubmitAdjust} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1 font-sans">
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Current On-Hand:</span>
              <span className="font-bold text-kumo-strong">{selectedProduct?.stock_qty} {selectedProduct?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Unit Cost:</span>
              <span className="text-kumo-default">{formatNaira(selectedProduct?.unit_cost || 0)}</span>
            </div>
          </div>

          <div className="space-y-1.5 font-sans">
            <label className="block text-xs font-semibold text-kumo-strong">Adjustment Action</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustDirection('deduct')
                  if (adjustReason === 'Audit Reconciliation Surplus' || adjustReason === 'Supplier Bonus / Extra Units') {
                    setAdjustReason('Kitchen Waste & Trimmings')
                  }
                }}
                className={`h-9 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                  adjustDirection === 'deduct'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-kumo-surface text-kumo-subtle border-kumo-line hover:bg-kumo-control'
                }`}
              >
                <span>Deduct / Waste (-)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustDirection('add')
                  setAdjustReason('Audit Reconciliation Surplus')
                }}
                className={`h-9 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                  adjustDirection === 'add'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-kumo-surface text-kumo-subtle border-kumo-line hover:bg-kumo-control'
                }`}
              >
                <span>Add / Stock Surplus (+)</span>
              </button>
            </div>
          </div>

          <Select
            label="Adjustment Reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            options={
              adjustDirection === 'deduct'
                ? [
                    { value: 'Kitchen Waste & Trimmings', label: 'Kitchen Waste & Trimmings' },
                    { value: 'Physical Count Discrepancy', label: 'Physical Count Discrepancy' },
                    { value: 'Defrosting Shrinkage', label: 'Defrosting Shrinkage' },
                    { value: 'Quality Rejection / Spoiled', label: 'Quality Rejection / Spoiled' },
                    { value: 'Expired / Past Date', label: 'Expired / Past Date' }
                  ]
                : [
                    { value: 'Audit Reconciliation Surplus', label: 'Audit Reconciliation Surplus' },
                    { value: 'Supplier Bonus / Extra Units', label: 'Supplier Bonus / Extra Units' },
                    { value: 'Physical Count Correction', label: 'Physical Count Correction' }
                  ]
            }
          />

          <UnitInput
            label={`Quantity to ${adjustDirection === 'deduct' ? 'Deduct' : 'Add'}`}
            value={adjustMagnitude}
            onChangeValue={setAdjustMagnitude}
            unit={selectedProduct?.unit || 'units'}
            helperText={`Projected Balance: ${
              adjustDirection === 'deduct'
                ? Math.max(0, (selectedProduct?.stock_qty || 0) - Number(adjustMagnitude))
                : (selectedProduct?.stock_qty || 0) + Number(adjustMagnitude)
            } ${selectedProduct?.unit}`}
            min={0.1}
            step="any"
            required
          />

          <Input
            label="Audit Notes & Approver"
            placeholder="e.g. Authorized by QC Lead after carcass inspection"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            required
          />
        </form>
      </Dialog>

      {/* MODAL 3: Create / Edit Product */}
      <Dialog
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? `Edit Item: ${selectedProduct.name}` : 'Add New Inventory Item'}
        description="Configure unit of measure, unit cost, and reorder alert level."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="raw-sku-product-form">
              {selectedProduct ? 'Update SKU' : 'Save Raw SKU'}
            </Button>
          </div>
        }
      >
        <form id="raw-sku-product-form" onSubmit={handleSubmitProduct} className="space-y-4">
          <Input
            label="Material Name"
            placeholder="e.g. FRESH SPRING CHICKEN"
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
          />

          <Input
            label="SKU Code"
            value={productForm.sku}
            onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
            required
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-kumo-strong leading-4">
                Unit of Measure <span className="text-kumo-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (isCustomUnitMode) {
                    setIsCustomUnitMode(false)
                    setProductForm(prev => ({ ...prev, unit: 'PIECES' }))
                  } else {
                    setIsCustomUnitMode(true)
                    setCustomUnitText(productForm.unit || '')
                  }
                }}
                className="text-[12px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {isCustomUnitMode ? (
                  '← Select standard unit'
                ) : (
                  <>
                    <Pencil className="w-3 h-3 text-zinc-400" />
                    <span>Custom label</span>
                  </>
                )}
              </button>
            </div>

            {isCustomUnitMode ? (
              <div className="space-y-1.5">
                <Input
                  placeholder="e.g. Derica, Stick, Kongo, Bale, Sachet..."
                  value={customUnitText}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomUnitText(val)
                    setProductForm(prev => ({ ...prev, unit: val }))
                  }}
                  autoFocus
                  required
                />
                <p className="text-[12px] text-kumo-subtle">
                  Type any custom measure label (Derica, Kongo, Bale, Sticks, etc.)
                </p>
              </div>
            ) : (
              <Select
                value={
                  ALL_INVENTORY_UNITS.some(u => u.value === productForm.unit)
                    ? productForm.unit
                    : 'CUSTOM'
                }
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomUnitMode(true)
                    setCustomUnitText('')
                  } else {
                    setProductForm(prev => ({ ...prev, unit: e.target.value }))
                  }
                }}
                options={ALL_INVENTORY_UNITS}
              />
            )}
          </div>

          <Input
            label="Standard Unit Cost (₦)"
            type="number"
            step="any"
            min="0"
            value={productForm.unit_cost}
            onChange={(e) => setProductForm(prev => ({ ...prev, unit_cost: Number(e.target.value) }))}
            required
          />

          <UnitInput
            label="Low-Stock Reorder Threshold"
            value={productForm.reorder_level}
            onChangeValue={(val) => setProductForm(prev => ({ ...prev, reorder_level: val }))}
            unit={productForm.unit || 'units'}
            min={0}
            required
          />
        </form>
      </Dialog>

      {/* MODAL 4: Daily Stock Check (Section 9.4) */}
      <Dialog
        isOpen={isBlindStocktakeModalOpen}
        onClose={() => setIsBlindStocktakeModalOpen(false)}
        title="Daily Stock Check (5 Diverse Items)"
        description="Enter verified shelf/chiller counts. Counts are blind to ensure unbiased verification."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsBlindStocktakeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="blind-stocktake-form">
              Submit Stock Check
            </Button>
          </div>
        }
      >
        <form id="blind-stocktake-form" onSubmit={handleSubmitBlindStocktake} className="space-y-4">
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs text-blue-800 dark:text-blue-300">
            <strong>Counting Rule:</strong> Enter the actual physical count verified on the shelf or chiller. Any difference will be logged for supervisor sign-off.
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {stocktakeItems.map(prod => (
              <div key={prod.id} className="p-3 bg-kumo-surface border border-kumo-line rounded-lg flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-kumo-strong truncate">{prod.name}</div>
                  <div className="text-[11px] text-kumo-subtle">{prod.sku} • Unit: {prod.unit}</div>
                </div>
                <div className="w-36 shrink-0">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={stocktakeCounts[prod.id] !== undefined ? stocktakeCounts[prod.id] : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? ('' as any) : Number(e.target.value)
                      setStocktakeCounts(prev => ({ ...prev, [prod.id]: val }))
                    }}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Audited By (Digital Signature)"
            value={stocktakeCountedBy}
            onChange={(e) => setStocktakeCountedBy(e.target.value)}
            required
          />
        </form>
      </Dialog>

      {/* MODAL 5: Fix Stock Difference */}
      <Dialog
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Fix Stock Difference: ${selectedVariance?.product_name}`}
        description="Update inventory count to match what was counted and record supervisor approval."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="resolve-variance-form">
              Confirm Stock Update
            </Button>
          </div>
        }
      >
        <form id="resolve-variance-form" onSubmit={handleConfirmResolve} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1 font-sans">
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Digital Count:</span>
              <span className="font-medium text-kumo-strong">{selectedVariance?.digital_count} {selectedVariance?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Physical Count:</span>
              <span className="font-medium text-kumo-strong">{selectedVariance?.physical_count} {selectedVariance?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Discrepancy (Delta):</span>
              <span className="font-bold text-rose-600 text-xs sm:text-sm">
                {selectedVariance?.variance_qty} {selectedVariance?.unit} ({formatNaira(selectedVariance?.variance_value || 0)})
              </span>
            </div>
          </div>

          <Input
            label="Supervisor Approval Notes"
            value={supervisorResolutionNotes}
            onChange={(e) => setSupervisorResolutionNotes(e.target.value)}
            required
          />
        </form>
      </Dialog>

      {/* MODAL 6: Prioritize Lot for Smoking Grill */}
      <Dialog
        isOpen={isPrioritizeModalOpen}
        onClose={() => setIsPrioritizeModalOpen(false)}
        title={`Prioritize for Smoking Grill: ${selectedLot?.lot_number || ''}`}
        description="Allocate this perishable lot directly to a smoking grill run so it cooks first to prevent food waste."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsPrioritizeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="prioritize-lot-form"
              leftIcon={<Flame className="w-4 h-4 text-amber-300" />}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-xs"
            >
              Start Kitchen Batch
            </Button>
          </div>
        }
      >
        <form id="prioritize-lot-form" onSubmit={handleSubmitPrioritize} className="space-y-4">
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Lot Identifier:</span>
              <span className="font-semibold text-kumo-strong font-mono">{selectedLot?.lot_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Perishable Protein:</span>
              <span className="font-medium text-kumo-strong">{selectedLot?.product_name} ({selectedLot?.sku})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Remaining Stock Available:</span>
              <span className="font-medium text-kumo-strong">{selectedLot?.remaining_qty} {selectedLot?.unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Expiration Date:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {selectedLot?.expiry_date} ({selectedLot?.days_to_expiry} days left)
              </span>
            </div>
          </div>

          <UnitInput
            label="Quantity to Allocate to Smoking Grill"
            value={prioritizeQty}
            onChangeValue={(val) => setPrioritizeQty(Math.min(selectedLot?.remaining_qty || val, Math.max(1, val)))}
            unit={selectedLot?.unit || 'units'}
            min={1}
            max={selectedLot?.remaining_qty}
            step="any"
            required
          />

          <Select
            label="Target Finished Product"
            value={prioritizeDish}
            onChange={(e) => setPrioritizeDish(e.target.value)}
            options={salesProducts.map(p => ({
              value: p.name,
              label: `${p.name} (${formatNaira(p.selling_price)})`
            }))}
          />

          <Input
            label="Assigned Production Supervisor"
            value={prioritizeSupervisor}
            onChange={(e) => setPrioritizeSupervisor(e.target.value)}
            placeholder="e.g. Babajide (Production Supervisor)"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-kumo-default mb-1">
              Kitchen Shift Remarks & Grill Instructions
            </label>
            <textarea
              value={prioritizeRemarks}
              onChange={(e) => setPrioritizeRemarks(e.target.value)}
              rows={2}
              className="w-full text-xs sm:text-sm rounded-lg border border-kumo-line bg-kumo-base text-kumo-strong p-2.5 focus:border-amber-500 focus:outline-none"
              placeholder="e.g. Grill first on morning shift run..."
              required
            />
          </div>
        </form>
      </Dialog>

      {/* MODAL 7: Log Spoilage / Waste Write-Off */}
      <Dialog
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        title={`Log Spoilage / Waste Write-Off: ${selectedLot?.lot_number || ''}`}
        description="Record shrinkage for expired or spoiled stock. This removes units from raw inventory and logs an audited write-off."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsWasteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="waste-writeoff-form"
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs"
            >
              Confirm Spoilage Write-Off
            </Button>
          </div>
        }
      >
        <form id="waste-writeoff-form" onSubmit={handleSubmitWaste} className="space-y-4">
          <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Lot Identifier:</span>
              <span className="font-semibold text-kumo-strong font-mono">{selectedLot?.lot_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Perishable Protein:</span>
              <span className="font-medium text-kumo-strong">{selectedLot?.product_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Available Balance:</span>
              <span className="font-medium text-kumo-strong">{selectedLot?.remaining_qty} {selectedLot?.unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Unit Acquisition Cost:</span>
              <span className="text-kumo-default font-sans">{formatNaira(selectedLot?.unit_cost || 0)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-rose-200 dark:border-rose-900/50">
              <span className="font-semibold text-rose-800 dark:text-rose-300">Financial Loss (Shrinkage):</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                {formatNaira((Number(wasteQty) || 0) * (selectedLot?.unit_cost || 0))}
              </span>
            </div>
          </div>

          <UnitInput
            label="Quantity to Write Off"
            value={wasteQty}
            onChangeValue={(val) => setWasteQty(Math.min(selectedLot?.remaining_qty || val, Math.max(0.1, val)))}
            unit={selectedLot?.unit || 'units'}
            min={0.1}
            max={selectedLot?.remaining_qty}
            step="any"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-kumo-default mb-1">
              Reason for Write-Off
            </label>
            <input
              type="text"
              readOnly
              value="Expired / Past Date"
              className="w-full h-9 text-xs sm:text-sm rounded-lg border border-kumo-line bg-kumo-surface text-kumo-strong px-2.5 py-1.5 cursor-not-allowed font-semibold text-rose-700 dark:text-rose-400"
            />
          </div>

          <Input
            label="Authorized By (Supervisor / Digital Signature)"
            value={wasteApprover}
            onChange={(e) => setWasteApprover(e.target.value)}
            placeholder="e.g. Babajide (Oven Supervisor)"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-kumo-default mb-1">
              Spoilage / Disposal Notes
            </label>
            <textarea
              value={wasteNotes}
              onChange={(e) => setWasteNotes(e.target.value)}
              rows={2}
              className="w-full text-xs sm:text-sm rounded-lg border border-kumo-line bg-kumo-base text-kumo-strong p-2.5 focus:border-rose-500 focus:outline-none"
              placeholder="e.g. Past shelf-life threshold. Cold chain storage inspected."
              required
            />
          </div>
        </form>
      </Dialog>

      {/* Raw Material Details Modal — Desaturated Grey Layout with Clean Aligned Rows */}
      {selectedDetailsProduct && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Raw Material: ${selectedDetailsProduct.name}`}
          description="Detailed inventory stock levels, unit valuation, and procurement parameters."
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
                    const p = selectedDetailsProduct
                    setIsDetailsModalOpen(false)
                    handleOpenAdjust(p)
                  }}
                >
                  Adjust Stock
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    const p = selectedDetailsProduct
                    setIsDetailsModalOpen(false)
                    handleOpenEditProduct(p)
                  }}
                >
                  Edit SKU
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const p = selectedDetailsProduct
                    setIsDetailsModalOpen(false)
                    handleOpenReceive(p)
                  }}
                >
                  Receive Stock Intake
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              {/* Section 1: Stock Availability & Valuation */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Material Inventory & Valuation
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Physical (On-Hand)</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                      {formatQuantity(selectedDetailsProduct.stock_qty)} {selectedDetailsProduct.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Allocated in Prep</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {formatQuantity(selectedDetailsProduct.qty_allocated || 0)} {selectedDetailsProduct.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Available Stock</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {formatQuantity(selectedDetailsProduct.qty_available ?? selectedDetailsProduct.stock_qty)} {selectedDetailsProduct.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Total Valuation</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                      {formatNaira(selectedDetailsProduct.inventory_value || (selectedDetailsProduct.stock_qty * selectedDetailsProduct.unit_cost))}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Stock Health</span>
                    <div>
                      {selectedDetailsProduct.stock_qty <= 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                          Out of Stock
                        </span>
                      ) : selectedDetailsProduct.stock_qty <= selectedDetailsProduct.reorder_level ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                          Healthy Inventory
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Specification & Sourcing */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Specification & Procurement
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">SKU Code</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{selectedDetailsProduct.sku}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Measurement Unit</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsProduct.unit}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Unit Cost Benchmark</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium font-mono">{formatNaira(selectedDetailsProduct.unit_cost)}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Reorder Alert Level</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsProduct.reorder_level} {selectedDetailsProduct.unit}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Storage Category</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">Raw Kitchen Goods</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default RawInventoryPage
