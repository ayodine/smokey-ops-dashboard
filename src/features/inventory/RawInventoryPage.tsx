import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { RawProduct, RawDelivery, RawMovement, RawUsageItem, InventoryLot, StocktakeVariance } from '@/lib/smokeyData'
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
  Pencil
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
    receiveRawStockWithLot,
    adjustRawStock,
    writeOffLotWaste,
    prioritizeLotInKitchen,
    saveRawProduct,
    submitStocktakeCount,
    resolveStocktakeVariance
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'current' | 'fefo' | 'inbound' | 'outbound' | 'usage' | 'escrow'>('current')

  // Expiring Lots Workflow State
  const [isPrioritizeModalOpen, setIsPrioritizeModalOpen] = useState(false)
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null)

  // Prioritize in Kitchen Form State
  const [prioritizeQty, setPrioritizeQty] = useState<number>(1)
  const [prioritizeDish, setPrioritizeDish] = useState<string>('')
  const [prioritizePitmaster, setPrioritizePitmaster] = useState('Babajide (Pitmaster)')
  const [prioritizeRemarks, setPrioritizeRemarks] = useState('')

  // Spoilage / Waste Form State
  const [wasteQty, setWasteQty] = useState<number>(1)
  const [wasteApprover, setWasteApprover] = useState('Babajide (Pitmaster)')
  const [wasteNotes, setWasteNotes] = useState('')

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isBlindStocktakeModalOpen, setIsBlindStocktakeModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<RawProduct | null>(null)
  const [selectedVariance, setSelectedVariance] = useState<StocktakeVariance | null>(null)

  // Inbound Form State (with FEFO Lot support)
  const [receiveSupplierId, setReceiveSupplierId] = useState<number>(suppliers[0]?.id || 2)
  const [receiveProductId, setReceiveProductId] = useState<number>(rawProducts[0]?.id || 62)
  const [receiveQty, setReceiveQty] = useState<number>(10)
  const [receiveUnitCost, setReceiveUnitCost] = useState<number>(rawProducts[0]?.unit_cost || 6500)
  const [receiveLotNumber, setReceiveLotNumber] = useState<string>('')
  const [receiveExpiryDate, setReceiveExpiryDate] = useState<string>('')
  const [receiveNotes, setReceiveNotes] = useState('')

  // Adjust Form State
  const [adjustDelta, setAdjustDelta] = useState<number>(-2)
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

  // Blind Stocktake Form State (5 Random SKUs)
  const [stocktakeCounts, setStocktakeCounts] = useState<{ [key: number]: number }>({})
  const [stocktakeCountedBy, setStocktakeCountedBy] = useState('Shift Pitmaster')
  const [stocktakeFeedback, setStocktakeFeedback] = useState<string | null>(null)

  // Resolve Variance Form State
  const [supervisorResolutionNotes, setSupervisorResolutionNotes] = useState('')

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // KPI Calculations - dynamic based on custom date range
  const activeRawForKPI = useMemo(() => {
    if (!dateRange) return rawProducts
    return rawProducts.filter(p => isWithinDateRange(p.expiry_date || p.fefo_lot, dateRange))
  }, [rawProducts, dateRange])

  const totalSKUs = activeRawForKPI.length
  const totalValuation = activeRawForKPI.reduce((acc, p) => acc + (p.inventory_value || (p.stock_qty * p.unit_cost)), 0)
  const inboundCount = rawDeliveries.length
  const outboundCount = rawMovements.length
  const lowStockCount = rawProducts.filter(p => p.stock_qty <= p.reorder_level).length
  const pendingVariancesCount = stocktakeVariances.filter(v => v.status === 'pending_review').length
  const nearExpiryCount = inventoryLots.filter(l => l.days_to_expiry <= 4 && l.remaining_qty > 0).length

  // Batches expiring in <= 3 days with remaining balance
  const criticalExpiringLots = useMemo(() => {
    return inventoryLots.filter(l => l.days_to_expiry <= 3 && l.remaining_qty > 0)
  }, [inventoryLots])

  // Handlers
  const handleOpenReceive = (product?: RawProduct) => {
    if (product) {
      setReceiveProductId(product.id)
      setReceiveUnitCost(product.unit_cost)
      setReceiveLotNumber(`LOT-${product.sku.replace('SKU-', '')}-${new Date().toISOString().slice(5, 10).replace('-', '')}`)
    } else {
      if (rawProducts.length > 0) {
        setReceiveProductId(rawProducts[0].id)
        setReceiveUnitCost(rawProducts[0].unit_cost)
        setReceiveLotNumber(`LOT-GNF-${new Date().toISOString().slice(5, 10).replace('-', '')}`)
      }
    }
    setReceiveQty(10)
    setReceiveExpiryDate('')
    setReceiveNotes('')
    setIsReceiveModalOpen(true)
  }

  const handleOpenAdjust = (product: RawProduct) => {
    setSelectedProduct(product)
    setAdjustDelta(-1)
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
    // Pick 5 SKUs (focusing on perishable / high-value items)
    const initialCounts: { [key: number]: number } = {}
    rawProducts.slice(0, 5).forEach(p => {
      initialCounts[p.id] = p.stock_qty // pre-fill with blank or current on-hand for demonstration
    })
    setStocktakeCounts(initialCounts)
    setStocktakeFeedback(null)
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
      notes: receiveNotes
    })
    setIsReceiveModalOpen(false)
  }

  const handleSubmitAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    adjustRawStock(selectedProduct.id, Number(adjustDelta), adjustNotes, adjustReason)
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
    const countsPayload = Object.entries(stocktakeCounts).map(([prodId, count]) => ({
      productId: Number(prodId),
      physicalCount: Number(count),
      category: 'raw' as const
    }))

    const variancesLogged = submitStocktakeCount(countsPayload, stocktakeCountedBy)
    if (variancesLogged > 0) {
      setStocktakeFeedback(`${variancesLogged} discrepancy variance(s) detected and quarantined into Stocktake Escrow for supervisor review.`)
      setTimeout(() => {
        setIsBlindStocktakeModalOpen(false)
        setActiveTab('escrow')
      }, 1200)
    } else {
      setStocktakeFeedback("Audit Verified: 100% match! Physical counts perfectly match digital ledger records.")
      setTimeout(() => {
        setIsBlindStocktakeModalOpen(false)
      }, 1200)
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
    if (upper.includes('BEEF') || upper.includes('BRISKET')) {
      return 'Smokey Beef Jerkey (Kilishi) 125g'
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
    setPrioritizePitmaster('Babajide (Pitmaster)')
    setPrioritizeRemarks(`[URGENT EXPIRING BATCH] Lot ${lot.lot_number} allocated to smoker pit. Best before: ${lot.expiry_date} (${lot.days_to_expiry} days left).`)
    setIsPrioritizeModalOpen(true)
  }

  const handleSubmitPrioritize = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot) return
    prioritizeLotInKitchen({
      lotId: selectedLot.id,
      quantity: Number(prioritizeQty),
      targetDishName: prioritizeDish,
      pitmasterName: prioritizePitmaster,
      shiftRemarks: prioritizeRemarks
    })
    setIsPrioritizeModalOpen(false)
  }

  const handleOpenWaste = (lot: InventoryLot) => {
    setSelectedLot(lot)
    setWasteQty(lot.remaining_qty)
    setWasteApprover('Babajide (Pitmaster)')
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

  // Column definitions for Tab 1: Current Inventory (with Three-State Invariant & FEFO Lot tags)
  const currentColumns: ColumnDef<RawProduct>[] = [
    {
      key: 'sku',
      header: 'Item Code',
      accessor: (p) => <span className="font-medium text-xs text-kumo-strong font-sans">{p.sku}</span>,
      sortValue: (p) => p.sku,
    },
    {
      key: 'name',
      header: 'Material',
      accessor: (p) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs text-kumo-strong font-sans">{p.name}</span>
            {p.is_perishable && (
              <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                Expiring
              </span>
            )}
          </div>
          <div className="text-[11px] text-kumo-subtle uppercase tracking-wider font-sans">
            {p.unit} {p.fefo_lot ? `• Lot: ${p.fefo_lot}` : ''}
          </div>
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
            <span className="font-medium text-xs text-kumo-strong font-sans">
              {formatQuantity(p.stock_qty)} {p.unit}
            </span>
            {isLow && (
              <span
                data-badge="critical-low"
                className="badge-critical-low inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 whitespace-nowrap select-none"
                style={{ backgroundColor: '#FCE8EC', borderColor: '#F3B0BB', color: '#C8102E' }}
              >
                Low
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
      header: 'Allocated (Batch)',
      accessor: (p) => (
        <span className="text-xs text-kumo-subtle font-sans">
          {formatQuantity(p.qty_allocated ?? 0)} {p.unit}
        </span>
      ),
      sortValue: (p) => p.qty_allocated ?? 0,
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      accessor: (p) => <span className="text-xs text-kumo-default font-sans">{formatNaira(p.unit_cost)}</span>,
      sortValue: (p) => p.unit_cost,
    },
    {
      key: 'inventory_value',
      header: 'Total Value',
      accessor: (p) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(p.inventory_value)}</span>,
      sortValue: (p) => p.inventory_value,
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 220,
      accessor: (p) => (
        <div className="flex items-center gap-2 font-sans flex-nowrap" onClick={e => e.stopPropagation()}>
          <Tooltip content="Record incoming stock from supplier">
            <TableActionButton
              variant="success"
              onClick={() => handleOpenReceive(p)}
            >
              + Receive
            </TableActionButton>
          </Tooltip>
          <Tooltip content="Adjust on-hand stock or record kitchen wastage">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenAdjust(p)}
            >
              Adjust
            </TableActionButton>
          </Tooltip>
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
      header: 'Actions',
      defaultWidth: 360,
      accessor: (l) => {
        if (l.remaining_qty <= 0) {
          return <span className="text-[11px] text-kumo-subtle italic">Depleted / Written Off</span>
        }
        return (
          <div className="flex items-center gap-2 font-sans flex-nowrap" onClick={e => e.stopPropagation()}>
            <Tooltip content="Create prep batch targeting this lot so it gets smoked first">
              <TableActionButton
                variant="warning"
                onClick={() => handleOpenPrioritize(l)}
                leftIcon={<Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              >
                Prioritize in Kitchen
              </TableActionButton>
            </Tooltip>
            <Tooltip content="Record shrinkage with reason 'Expired / Past Date'">
              <TableActionButton
                variant="danger"
                onClick={() => handleOpenWaste(l)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              >
                Log Spoilage / Waste
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
      accessor: (d) => <span className="font-medium text-xs text-kumo-strong font-sans">{d.delivery_ref}</span>,
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
      header: 'Cost / Unit',
      accessor: (d) => <span className="text-xs text-kumo-default font-sans">{formatNaira(d.unit_cost)}</span>,
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
            isConsumption ? 'bg-blue-50 text-blue-700 border-blue-200' :
            isWaste ? 'bg-rose-50 text-rose-700 border-rose-200' :
            'bg-amber-50 text-amber-700 border-amber-200'
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
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {v.status === 'reconciled' ? 'Reconciled' : 'Pending Review'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Escrow Action',
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenBlindStocktake}
              leftIcon={<ClipboardCheck className="w-4 h-4 text-blue-600" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Daily Stock Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEditProduct()}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              New Item
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenReceive()}
              leftIcon={<PackagePlus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Add Received Stock
            </Button>
          </>
        }
      />

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
          description="Working capital in meat/spices"
          trend={{ value: 4.8, isPositive: true }}
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
            { id: 'fefo', label: 'Expiring Lots', badge: inventoryLots.length },
            { id: 'inbound', label: 'Stock In', badge: rawDeliveries.length },
            { id: 'outbound', label: 'Stock Out', badge: rawMovements.length },
            { id: 'usage', label: 'Monthly Usage' },
            { id: 'escrow', label: 'Stock Review', badge: pendingVariancesCount > 0 ? pendingVariancesCount : undefined },
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
            exportFilename="smokey-raw-inventory"
            onRowClick={(p) => handleOpenEditProduct(p)}
            onDateRangeChange={setDateRange}
          />
        )}

        {activeTab === 'fefo' && (
          <DataTable
            data={inventoryLots}
            columns={fefoColumns}
            searchable={true}
            searchPlaceholder="Filter by batch lot number or item..."
            title="Expiring Raw Materials & Batches"
            exportFilename="smokey-expiring-batches"
          />
        )}

        {activeTab === 'inbound' && (
          <DataTable
            data={rawDeliveries}
            columns={inboundColumns}
            searchable={true}
            searchPlaceholder="Search delivery ref or supplier..."
            title="Receipt"
            exportFilename="smokey-raw-deliveries-log"
          />
        )}

        {activeTab === 'outbound' && (
          <DataTable
            data={rawMovements}
            columns={outboundColumns}
            searchable={true}
            searchPlaceholder="Search consumption & waste audit..."
            title="Movement"
            exportFilename="smokey-raw-consumption-audit"
          />
        )}

        {activeTab === 'usage' && (
          <DataTable
            data={rawUsage}
            columns={usageColumns}
            searchable={false}
            title="Usage Item"
            exportFilename="smokey-raw-usage-september-2026"
          />
        )}

        {activeTab === 'escrow' && (
          <DataTable
            data={stocktakeVariances}
            columns={escrowColumns}
            searchable={false}
            title="Stocktake Variance"
            exportFilename="smokey-stocktake-escrow"
          />
        )}
      </div>

      {/* MODAL 1: Inbound Stock Intake */}
      <Dialog
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Stock from Supplier"
        description="Record incoming meats, peppers, firewood, and cooking supplies."
      >
        <form onSubmit={handleSubmitReceive} className="space-y-4">
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
                setReceiveUnitCost(match.unit_cost)
                setReceiveLotNumber(`LOT-${match.sku.replace('SKU-', '')}-${new Date().toISOString().slice(5, 10).replace('-', '')}`)
              }
            }}
            options={rawProducts.map(p => ({ value: p.id, label: `${p.name} [${p.sku}] - Current: ${p.stock_qty} ${p.unit}` }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <UnitInput
              label="Quantity Received"
              value={receiveQty}
              onChangeValue={setReceiveQty}
              unit={rawProducts.find(p => p.id === receiveProductId)?.unit || 'units'}
              min={0.1}
              step="any"
              required
            />
            <Input
              label="Agreed Unit Cost (₦)"
              type="number"
              min="1"
              value={receiveUnitCost}
              onChange={(e) => setReceiveUnitCost(Number(e.target.value))}
              required
            />
          </div>

          {/* FEFO Lot Tracking Fields */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded">
            <Input
              label="Batch / Lot Number"
              placeholder="e.g. LOT-GNF-0925A"
              value={receiveLotNumber}
              onChange={(e) => setReceiveLotNumber(e.target.value)}
            />
            <SingleDatePicker
              label="Expiration Date (First Expiring)"
              value={receiveExpiryDate}
              onChange={(d) => setReceiveExpiryDate(d)}
              required
            />
          </div>

          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs flex justify-between items-center">
            <span className="text-kumo-subtle">Total Procurement Value:</span>
            <span className="font-bold text-emerald-700 text-sm">{formatNaira(receiveQty * receiveUnitCost)}</span>
          </div>

          <Input
            label="Delivery Notes & Condition"
            placeholder="e.g. Weighbridge checked; cold-chain temperature 4°C"
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirm Stock Intake
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Stock Adjustment (fpStockAdjustModal) */}
      <Dialog
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Raw Stock: ${selectedProduct?.name}`}
        description="Manual inventory reconciliation, kitchen wastage, or shrinkage recording."
      >
        <form onSubmit={handleSubmitAdjust} className="space-y-4">
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

          <Select
            label="Adjustment Reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            options={[
              { value: 'Kitchen Waste & Trimmings', label: 'Kitchen Waste & Trimmings' },
              { value: 'Physical Count Discrepancy', label: 'Physical Count Discrepancy' },
              { value: 'Defrosting Shrinkage', label: 'Defrosting Shrinkage' },
              { value: 'Quality Rejection / Spoiled', label: 'Quality Rejection / Spoiled' },
              { value: 'Audit Reconciliation Surplus', label: 'Audit Reconciliation Surplus' }
            ]}
          />

          <UnitInput
            label="Quantity Change (Negative for Deductions / Waste)"
            value={adjustDelta}
            onChangeValue={setAdjustDelta}
            unit={selectedProduct?.unit || 'units'}
            helperText={`New Projected Balance: ${Math.max(0, (selectedProduct?.stock_qty || 0) + Number(adjustDelta))} ${selectedProduct?.unit}`}
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

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Apply Stock Adjustment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 3: Create / Edit Product */}
      <Dialog
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? `Edit Item: ${selectedProduct.name}` : 'Add New Inventory Item'}
        description="Configure unit of measure, unit cost, and reorder alert level."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitProduct} className="space-y-4">
          <Input
            label="Material Name"
            placeholder="e.g. FRESH SPRING CHICKEN"
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <Input
              label="SKU Code"
              value={productForm.sku}
              onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
              required
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between leading-5">
                <label className="block text-xs font-semibold text-kumo-strong leading-5">
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
                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer inline-flex items-center gap-1 leading-5"
                >
                  {isCustomUnitMode ? (
                    '← Standard list'
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5" />
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
                  <p className="text-[11px] text-kumo-subtle">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <Input
              label="Standard Unit Cost (₦)"
              type="number"
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
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {selectedProduct ? 'Update SKU' : 'Save Raw SKU'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 4: Daily Stock Check (Section 9.4) */}
      <Dialog
        isOpen={isBlindStocktakeModalOpen}
        onClose={() => setIsBlindStocktakeModalOpen(false)}
        title="Daily Stock Check (5 Random Items)"
        description="Counts are hidden during physical stock counting to prevent bias and ensure accuracy."
      >
        <form onSubmit={handleSubmitBlindStocktake} className="space-y-4">
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs text-blue-800 dark:text-blue-300">
            <strong>Counting Rule:</strong> Enter the actual physical count verified on the shelf or chiller. Any difference will be reviewed by a supervisor.
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {rawProducts.slice(0, 5).map(prod => (
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
                    placeholder="Count..."
                    value={stocktakeCounts[prod.id] ?? ''}
                    onChange={(e) => setStocktakeCounts(prev => ({ ...prev, [prod.id]: Number(e.target.value) }))}
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

          {stocktakeFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{stocktakeFeedback}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsBlindStocktakeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Submit Stock Check
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 5: Fix Stock Difference */}
      <Dialog
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Fix Stock Difference: ${selectedVariance?.product_name}`}
        description="Update inventory count to match what was counted and record supervisor approval."
      >
        <form onSubmit={handleConfirmResolve} className="space-y-4">
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

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirm Stock Update
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 6: Prioritize Lot for Kitchen Smoker */}
      <Dialog
        isOpen={isPrioritizeModalOpen}
        onClose={() => setIsPrioritizeModalOpen(false)}
        title={`Prioritize in Kitchen Smoker: ${selectedLot?.lot_number || ''}`}
        description="Allocate this perishable lot directly to a kitchen smoke batch so it gets smoked first to prevent food waste."
      >
        <form onSubmit={handleSubmitPrioritize} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UnitInput
              label="Quantity to Allocate to Smoker"
              value={prioritizeQty}
              onChangeValue={(val) => setPrioritizeQty(Math.min(selectedLot?.remaining_qty || val, Math.max(1, val)))}
              unit={selectedLot?.unit || 'units'}
              min={1}
              max={selectedLot?.remaining_qty}
              step="any"
              required
            />
            <Select
              label="Target Finished Smoked Dish"
              value={prioritizeDish}
              onChange={(e) => setPrioritizeDish(e.target.value)}
              options={salesProducts.map(p => ({
                value: p.name,
                label: `${p.name} (${formatNaira(p.selling_price)})`
              }))}
            />
          </div>

          <Input
            label="Assigned Lead Pitmaster"
            value={prioritizePitmaster}
            onChange={(e) => setPrioritizePitmaster(e.target.value)}
            placeholder="e.g. Babajide (Pitmaster)"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-kumo-default mb-1">
              Kitchen Shift Remarks & Smoker Instructions
            </label>
            <textarea
              value={prioritizeRemarks}
              onChange={(e) => setPrioritizeRemarks(e.target.value)}
              rows={2}
              className="w-full text-xs sm:text-sm rounded-lg border border-kumo-line bg-kumo-base text-kumo-strong p-2.5 focus:border-amber-500 focus:outline-none"
              placeholder="e.g. Smoke first on morning shift run..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsPrioritizeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              leftIcon={<Flame className="w-4 h-4 text-amber-300" />}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-xs"
            >
              Start Kitchen Batch
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 7: Log Spoilage / Waste Write-Off */}
      <Dialog
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        title={`Log Spoilage / Waste Write-Off: ${selectedLot?.lot_number || ''}`}
        description="Record shrinkage for expired or spoiled stock. This removes units from raw inventory and logs an audited write-off."
      >
        <form onSubmit={handleSubmitWaste} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <Input
            label="Authorized By (Supervisor / Digital Signature)"
            value={wasteApprover}
            onChange={(e) => setWasteApprover(e.target.value)}
            placeholder="e.g. Babajide (Pitmaster)"
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

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsWasteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs"
            >
              Confirm Spoilage Write-Off
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

export default RawInventoryPage
