import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { PackagingProduct, PackagingReceiptTotal, PackagingDailyReconciliation, PackagingReconciliationItem, InterStationTransfer } from '@/lib/smokeyData'
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
  ArrowUpRight,
  Plus, 
  Layers, 
  PackageCheck,
  Eye,
  RotateCcw,
  CheckCircle2,
  Scale,
  ArrowRightLeft
} from 'lucide-react'

export const PackagingInventoryPage: React.FC = () => {
  const {
    packagingProducts,
    packagingReceiptsTotals,
    packagingReconciliations,
    interStationTransfers,
    receivePackaging,
    adjustPackagingStock,
    savePackagingProduct,
    issuePackagingFromCentral,
    returnPackagingToCentral,
    performDailyPackagingReconciliation
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'materials' | 'reconciliation' | 'transfers' | 'totals'>('materials')
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState<PackagingProduct | null>(null)
  const [selectedDetailsProduct, setSelectedDetailsProduct] = useState<PackagingProduct | null>(null)

  const handleOpenDetails = (prod: PackagingProduct) => {
    setSelectedDetailsProduct(prod)
    setIsDetailsModalOpen(true)
  }

  // New Material Form
  const [newMaterialForm, setNewMaterialForm] = useState({
    name: '',
    sku: '',
    unit: 'PIECES',
    central_stock_qty: 80,
    bench_stock_qty: 20,
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

  // Requisition / Issue from Central Form
  const [issueProductId, setIssueProductId] = useState<number>(packagingProducts[0]?.id || 93)
  const [issueQty, setIssueQty] = useState<number>(50)
  const [issuedTo, setIssuedTo] = useState<string>('Packaging Bench Shift Crew')
  const [issueNotes, setIssueNotes] = useState<string>('Stock drawn from Central Store for daily order packing')

  // Return to Central Form State
  const [returnVerifiedBy, setReturnVerifiedBy] = useState<string>('Supervisor Ayo')
  const [returnNotes, setReturnNotes] = useState<string>('EOD shift balance: unused packaging materials returned to Central Store')
  const [returnItemEntries, setReturnItemEntries] = useState<Array<{ productId: number; returnQty: number; damagedQty: number }>>([])

  // Filter transfers for packaging
  const packagingTransfers = useMemo(() => {
    return interStationTransfers.filter(t => 
      t.from_station === 'packaging_bench' || 
      t.to_station === 'packaging_bench' ||
      t.transfer_type === 'issue_packaging' || 
      t.transfer_type === 'return_packaging'
    )
  }, [interStationTransfers])

  // Today's Reconciliation Record
  const todayStr = new Date().toISOString().split('T')[0]
  const latestReconciliation = useMemo(() => {
    return packagingReconciliations.find(r => r.date === todayStr) || packagingReconciliations[0]
  }, [packagingReconciliations, todayStr])

  // KPIs
  const totalValuation = packagingProducts.reduce((acc, p) => acc + p.inventory_value, 0)
  const totalCentralStock = packagingProducts.reduce((acc, p) => acc + (p.central_stock_qty ?? p.stock_qty), 0)
  const totalBenchStock = packagingProducts.reduce((acc, p) => acc + (p.bench_stock_qty ?? 0), 0)
  const lowStockCount = packagingProducts.filter(p => p.stock_qty <= p.reorder_level).length

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

  const handleOpenIssueModal = (prod?: PackagingProduct) => {
    if (prod) {
      setIssueProductId(prod.id)
      const maxAvailable = prod.central_stock_qty ?? prod.stock_qty
      setIssueQty(Math.min(50, maxAvailable))
    }
    setIsIssueModalOpen(true)
  }

  const handleOpenReturnModal = () => {
    const initialEntries = packagingProducts
      .filter(p => (p.bench_stock_qty ?? 0) > 0)
      .map(p => ({
        productId: p.id,
        returnQty: Math.max(0, Math.floor((p.bench_stock_qty ?? 0) * 0.2)), // suggest returning excess
        damagedQty: 0
      }))
    setReturnItemEntries(initialEntries)
    setIsReturnModalOpen(true)
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

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault()
    const success = issuePackagingFromCentral(
      [{ productId: Number(issueProductId), quantity: Number(issueQty) }],
      issuedTo,
      issueNotes
    )
    if (success) {
      setIsIssueModalOpen(false)
    }
  }

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault()
    returnPackagingToCentral(returnItemEntries, returnNotes, returnVerifiedBy)
    setIsReturnModalOpen(false)
  }

  const handleConfirmNewMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    savePackagingProduct({
      name: newMaterialForm.name,
      sku: newMaterialForm.sku || `PKG-${String(packagingProducts.length + 1).padStart(5, '0')}`,
      unit: newMaterialForm.unit,
      stock_qty: Number(newMaterialForm.central_stock_qty) + Number(newMaterialForm.bench_stock_qty),
      central_stock_qty: Number(newMaterialForm.central_stock_qty),
      bench_stock_qty: Number(newMaterialForm.bench_stock_qty),
      unit_cost: Number(newMaterialForm.unit_cost),
      reorder_level: Number(newMaterialForm.reorder_level)
    })
    setIsNewMaterialModalOpen(false)
    setNewMaterialForm({
      name: '',
      sku: '',
      unit: 'PIECES',
      central_stock_qty: 80,
      bench_stock_qty: 20,
      unit_cost: 250,
      reorder_level: 50,
      supplier_name: 'PACKAGING DIRECT LTD'
    })
  }

  // Master Materials Columns
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
      key: 'central_stock_qty',
      header: 'Central Store Stock',
      accessor: (p) => (
        <div className="font-sans">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {formatQuantity(p.central_stock_qty ?? p.stock_qty)} {p.unit}
          </span>
          <div className="text-[10px] text-zinc-500">Central Store</div>
        </div>
      ),
      sortValue: (p) => p.central_stock_qty ?? p.stock_qty,
    },
    {
      key: 'bench_stock_qty',
      header: 'Bench Active Stock',
      accessor: (p) => {
        const benchQty = p.bench_stock_qty ?? 0
        const isDepleted = benchQty <= 5
        return (
          <div className="font-sans">
            <span className={`font-semibold ${isDepleted ? 'text-amber-600' : 'text-emerald-700'}`}>
              {formatQuantity(benchQty)} {p.unit}
            </span>
            <div className="text-[10px] text-zinc-500">Packing Outlet</div>
          </div>
        )
      },
      sortValue: (p) => p.bench_stock_qty ?? 0,
    },
    {
      key: 'stock_qty',
      header: 'Total On-Hand',
      accessor: (p) => {
        const isLow = p.stock_qty <= p.reorder_level
        return (
          <div className="flex items-center gap-2 font-sans">
            <span className="font-bold text-kumo-strong">
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
      key: 'inventory_value',
      header: 'Total Value',
      accessor: (p) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(p.inventory_value)}</span>,
      sortValue: (p) => p.inventory_value,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 170,
      accessor: (p) => (
        <div className="flex items-center gap-1.5 font-sans shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="Issue material from Central Hub to Packaging Bench">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenIssueModal(p)}
              leftIcon={<ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />}
            >
              Issue
            </TableActionButton>
          </Tooltip>
          <Tooltip content="Adjust inventory or damage count">
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

  // Daily Shift Reconciliation Columns
  const reconciliationColumns: ColumnDef<PackagingReconciliationItem>[] = [
    {
      key: 'sku',
      header: 'SKU',
      accessor: (r) => <span className="font-medium text-xs font-sans text-kumo-strong">{r.sku}</span>,
      sortValue: (r) => r.sku,
    },
    {
      key: 'product_name',
      header: 'Packaging Material',
      accessor: (r) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{r.product_name}</div>
          <div className="text-[11px] text-kumo-subtle uppercase font-sans">{r.unit}</div>
        </div>
      ),
      sortValue: (r) => r.product_name,
    },
    {
      key: 'opening_bench_stock',
      header: 'Opening Bench',
      accessor: (r) => <span className="font-mono text-xs text-kumo-default">{r.opening_bench_stock}</span>,
      sortValue: (r) => r.opening_bench_stock,
    },
    {
      key: 'issued_from_central',
      header: '+ Issued (Central)',
      accessor: (r) => <span className="font-mono text-xs font-semibold text-blue-700">+{r.issued_from_central}</span>,
      sortValue: (r) => r.issued_from_central,
    },
    {
      key: 'used_for_orders',
      header: '- Used (Orders)',
      accessor: (r) => <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">-{r.used_for_orders}</span>,
      sortValue: (r) => r.used_for_orders,
    },
    {
      key: 'returned_to_central',
      header: '- Returned (Central)',
      accessor: (r) => <span className="font-mono text-xs font-semibold text-emerald-700">-{r.returned_to_central}</span>,
      sortValue: (r) => r.returned_to_central,
    },
    {
      key: 'damaged_wasted',
      header: '- Damaged',
      accessor: (r) => <span className={`font-mono text-xs ${r.damaged_wasted > 0 ? 'text-red-600 font-bold' : 'text-zinc-400'}`}>-{r.damaged_wasted}</span>,
      sortValue: (r) => r.damaged_wasted,
    },
    {
      key: 'actual_closing_bench',
      header: '= Closing Bench',
      accessor: (r) => <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">{r.actual_closing_bench}</span>,
      sortValue: (r) => r.actual_closing_bench,
    },
    {
      key: 'variance',
      header: 'Variance',
      accessor: (r) => {
        const isBalanced = r.variance === 0
        return (
          <span className={`font-mono text-xs font-bold ${isBalanced ? 'text-emerald-700' : 'text-red-600'}`}>
            {r.variance > 0 ? `+${r.variance}` : r.variance}
          </span>
        )
      },
      sortValue: (r) => r.variance,
    },
    {
      key: 'status',
      header: 'Reconciliation',
      accessor: (r) => {
        if (r.variance === 0) {
          return <StatusBadge status="active" label="balanced (0)" />
        }
        return <StatusBadge status="inactive" label={`discrepancy (${r.variance})`} />
      },
      sortValue: (r) => r.status,
    },
  ]

  // Inter-Station Transfers Columns
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
      header: 'Movement Route',
      accessor: (t) => {
        if (t.transfer_type === 'issue_packaging') {
          return (
            <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
              <span>Central Store</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Packaging Bench</span>
            </div>
          )
        }
        if (t.transfer_type === 'return_packaging') {
          return (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span>Packaging Bench</span>
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Central Store</span>
            </div>
          )
        }
        return <span className="text-xs text-zinc-600">{t.transfer_type}</span>
      },
      sortValue: (t) => t.transfer_type,
    },
    {
      key: 'items',
      header: 'Items Moved',
      accessor: (t) => (
        <div className="text-xs space-y-0.5">
          {t.items.map((it, idx) => (
            <div key={idx} className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
              {it.quantity} {it.unit} &times; {it.product_name}
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
      header: 'Shift Notes',
      accessor: (t) => <span className="text-xs text-kumo-subtle max-w-[200px] truncate block">{t.notes}</span>,
      sortValue: (t) => t.notes,
    },
  ]

  // Consignment Receipts Columns
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
        title="Packaging Inventory & Stock Movement Hub"
        subtitle="Manage Central Store packaging reserves, issue materials to the packaging execution bench, and verify daily shift reconciliation."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewMaterialForm({
                  name: '',
                  sku: `PKG-${String(packagingProducts.length + 1).padStart(5, '0')}`,
                  unit: 'PIECES',
                  central_stock_qty: 80,
                  bench_stock_qty: 20,
                  unit_cost: 250,
                  reorder_level: 50,
                  supplier_name: 'PACKAGING DIRECT LTD'
                })
                setIsNewMaterialModalOpen(true)
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-3.5 text-xs font-medium"
            >
              New Material
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenReturnModal()}
              leftIcon={<RotateCcw className="w-4 h-4 text-emerald-600" />}
              className="h-10 px-3.5 text-xs font-medium"
            >
              EOD Bench Return
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenReceive()}
              leftIcon={<PackageCheck className="w-4 h-4 text-zinc-600" />}
              className="h-10 px-3.5 text-xs font-medium"
            >
              Receive Stock
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenIssueModal()}
              leftIcon={<ArrowRightLeft className="w-4 h-4" />}
              className="h-10 px-4 text-xs font-medium shadow-xs"
            >
              Issue to Bench
            </Button>
          </div>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Central Store Reserve"
          value={`${formatQuantity(totalCentralStock)} units`}
          description="Stored in Central Store"
          icon={<Package className="w-4 h-4 text-zinc-600" />}
        />
        <MetricCard
          title="Packaging Bench Active"
          value={`${formatQuantity(totalBenchStock)} units`}
          description="Issued & active on packaging bench"
          icon={<ShoppingBag className="w-4 h-4 text-blue-600" />}
        />
        <MetricCard
          title="Daily Shift Reconciliation"
          value={latestReconciliation?.status === 'balanced' ? 'Balanced (0 Variance)' : 'Discrepancy Logged'}
          description="Issued = Used + Returned + Damaged"
          icon={<Scale className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          title="Total Packaging Value"
          value={formatNaira(totalValuation)}
          description="Central + Bench inventory value"
          icon={<Layers className="w-4 h-4 text-zinc-600" />}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'materials', label: 'Master Materials & Stock Split', badge: packagingProducts.length },
            { id: 'reconciliation', label: 'Daily EOD Return & Balance', badge: latestReconciliation ? (latestReconciliation.status === 'balanced' ? '0' : '!') : undefined },
            { id: 'transfers', label: 'Inter-Station Movement Log', badge: packagingTransfers.length },
            { id: 'totals', label: 'Consignment Receipts', badge: packagingReceiptsTotals.length },
          ]}
        />
      </div>

      {/* Active Tab Content */}
      <div>
        {activeTab === 'materials' && (
          <DataTable
            data={packagingProducts}
            columns={materialsColumns}
            searchable={true}
            searchPlaceholder="Search packaging material, SKU..."
            title="Packaging Material"
            exportFilename="smokey-packaging-materials"
            onRowClick={(p) => handleOpenDetails(p)}
          />
        )}

        {activeTab === 'reconciliation' && (
          <DataTable
            data={latestReconciliation?.items || []}
            columns={reconciliationColumns}
            searchable={true}
            searchPlaceholder="Filter reconciliation items..."
            title="Reconciliation Item"
            exportFilename="smokey-packaging-daily-reconciliation"
          />
        )}

        {activeTab === 'transfers' && (
          <DataTable
            data={packagingTransfers}
            columns={transferColumns}
            searchable={true}
            searchPlaceholder="Search transfer ref, items, or actor..."
            title="Transfer Movement"
            exportFilename="smokey-packaging-interstation-transfers"
          />
        )}

        {activeTab === 'totals' && (
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

      {/* Issue / Disburse to Bench Modal */}
      <Dialog
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Packaging Stock to Packaging Bench"
        description="Withdraw packaging materials from the Central Store and transfer them to the Packaging Execution Bench."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsIssueModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="issue-packaging-form">
              Dispatch to Bench
            </Button>
          </div>
        }
      >
        <form id="issue-packaging-form" onSubmit={handleConfirmIssue} className="space-y-4 font-sans text-xs">
          <Select
            label="Select Packaging Material"
            value={issueProductId}
            onChange={(e) => {
              const pid = Number(e.target.value)
              setIssueProductId(pid)
              const p = packagingProducts.find(x => x.id === pid)
              if (p) setIssueQty(Math.min(50, p.central_stock_qty ?? p.stock_qty))
            }}
            options={packagingProducts.map(p => ({
              value: p.id,
              label: `${p.name} [${p.sku}] — Central Store: ${p.central_stock_qty ?? p.stock_qty} ${p.unit} (Bench: ${p.bench_stock_qty ?? 0})`
            }))}
          />

          <UnitInput
            label="Quantity to Issue"
            value={issueQty}
            onChangeValue={setIssueQty}
            unit={packagingProducts.find(p => p.id === issueProductId)?.unit || 'units'}
            min={1}
            required
          />

          <Input
            label="Recipient / Shift Crew"
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            placeholder="e.g. Morning Packaging Crew"
            required
          />

          <Input
            label="Requisition Notes"
            value={issueNotes}
            onChange={(e) => setIssueNotes(e.target.value)}
            placeholder="e.g. Daily shift replenishment for takeout orders"
          />

          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1 font-sans">
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Central Store Stock After Issue:</span>
              <span className="font-mono font-semibold text-kumo-strong">
                {Math.max(0, (packagingProducts.find(p => p.id === issueProductId)?.central_stock_qty ?? 0) - issueQty)} units
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Packaging Bench Stock After Issue:</span>
              <span className="font-mono font-semibold text-emerald-700">
                {(packagingProducts.find(p => p.id === issueProductId)?.bench_stock_qty ?? 0) + Number(issueQty)} units
              </span>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Return Unused Materials (EOD) Modal */}
      <Dialog
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="EOD Shift Return to Central Store"
        description="Return unused packaging materials from the packaging bench back to Central Store reserve and account for damages."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsReturnModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="return-packaging-form">
              Confirm Return & Balance Shift
            </Button>
          </div>
        }
      >
        <form id="return-packaging-form" onSubmit={handleConfirmReturn} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Supervisor / Auditor"
              value={returnVerifiedBy}
              onChange={(e) => setReturnVerifiedBy(e.target.value)}
              required
            />
            <Input
              label="Shift Notes"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2.5 pt-3 border-t border-kumo-line">
            <div className="grid grid-cols-12 gap-3 px-2 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider">
              <div className="col-span-6">Bench Material</div>
              <div className="col-span-3">Return to Hub</div>
              <div className="col-span-3">Damaged / Scrap</div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {packagingProducts.map(p => {
                const entry = returnItemEntries.find(e => e.productId === p.id)
                const returnQty = entry?.returnQty ?? 0
                const damagedQty = entry?.damagedQty ?? 0
                const benchQty = p.bench_stock_qty ?? 0

                return (
                  <div key={p.id} className="grid grid-cols-12 gap-3 items-center p-2.5 bg-kumo-surface border border-kumo-line rounded-lg">
                    <div className="col-span-6 min-w-0">
                      <div className="font-semibold text-kumo-strong truncate">{p.name}</div>
                      <div className="text-[11px] text-kumo-subtle">
                        Bench: <strong className="text-kumo-strong">{benchQty} {p.unit}</strong> &bull; Hub: {p.central_stock_qty ?? 0}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        max={benchQty}
                        value={returnQty}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setReturnItemEntries(prev => {
                            const exists = prev.find(x => x.productId === p.id)
                            if (exists) {
                              return prev.map(x => x.productId === p.id ? { ...x, returnQty: val } : x)
                            }
                            return [...prev, { productId: p.id, returnQty: val, damagedQty: 0 }]
                          })
                        }}
                      />
                    </div>

                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        max={benchQty}
                        value={damagedQty}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setReturnItemEntries(prev => {
                            const exists = prev.find(x => x.productId === p.id)
                            if (exists) {
                              return prev.map(x => x.productId === p.id ? { ...x, damagedQty: val } : x)
                            }
                            return [...prev, { productId: p.id, returnQty: 0, damagedQty: val }]
                          })
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </form>
      </Dialog>

      {/* Receive Modal */}
      <Dialog
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Packaging Materials"
        description="Record incoming shipment of packaging items into Central Store stock."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsReceiveModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="receive-packaging-form">
              Log Packaging Delivery
            </Button>
          </div>
        }
      >
        <form id="receive-packaging-form" onSubmit={handleConfirmReceive} className="space-y-4">
          <Select
            label="Packaging SKU"
            value={receiveProductId}
            onChange={(e) => {
              const pid = Number(e.target.value)
              setReceiveProductId(pid)
              const match = packagingProducts.find(p => p.id === pid)
              if (match) setReceiveCost(match.unit_cost)
            }}
            options={packagingProducts.map(p => ({ value: p.id, label: `${p.name} [${p.sku}] - Central: ${p.central_stock_qty ?? p.stock_qty} ${p.unit}` }))}
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

          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs flex justify-between font-mono">
            <span className="text-kumo-subtle">Total Consignment Cost:</span>
            <span className="font-bold text-emerald-700 text-xs sm:text-sm">{formatNaira(receiveQty * receiveCost)}</span>
          </div>
        </form>
      </Dialog>

      {/* Adjust Modal */}
      <Dialog
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Packaging Stock: ${selectedProduct?.name}`}
        description="Manually correct stock count for damaged, scrap, or miscounted packaging units."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="adjust-packaging-form">
              Apply Correction
            </Button>
          </div>
        }
      >
        <form id="adjust-packaging-form" onSubmit={handleConfirmAdjust} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-kumo-subtle font-sans">Current Central Stock:</span>
              <span className="font-mono font-bold text-kumo-strong text-xs">{selectedProduct?.central_stock_qty ?? selectedProduct?.stock_qty} {selectedProduct?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle font-sans">Current Bench Stock:</span>
              <span className="font-mono font-bold text-kumo-strong text-xs">{selectedProduct?.bench_stock_qty ?? 0} {selectedProduct?.unit}</span>
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
        </form>
      </Dialog>

      {/* New Packaging Material Modal */}
      <Dialog
        isOpen={isNewMaterialModalOpen}
        onClose={() => setIsNewMaterialModalOpen(false)}
        title="Create New Packaging Material"
        description="Add a new consumable container, bag, food bowl, or label SKU to the packaging inventory."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsNewMaterialModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="new-packaging-material-form">
              Save Packaging Material
            </Button>
          </div>
        }
      >
        <form id="new-packaging-material-form" onSubmit={handleConfirmNewMaterial} className="space-y-4 font-sans text-xs">
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

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Central Store Stock Qty"
              type="number"
              min="0"
              value={newMaterialForm.central_stock_qty}
              onChange={(e) => setNewMaterialForm(prev => ({ ...prev, central_stock_qty: Number(e.target.value) }))}
              required
            />
            <Input
              label="Bench Active Qty"
              type="number"
              min="0"
              value={newMaterialForm.bench_stock_qty}
              onChange={(e) => setNewMaterialForm(prev => ({ ...prev, bench_stock_qty: Number(e.target.value) }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
        </form>
      </Dialog>

      {/* Packaging Details Modal — Desaturated Grey Layout with Clean Aligned Rows */}
      {selectedDetailsProduct && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Packaging Material: ${selectedDetailsProduct.name}`}
          description="Comprehensive inventory metrics, station stock split, and procurement details."
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
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setIsDetailsModalOpen(false)
                    handleOpenIssueModal(selectedDetailsProduct)
                  }}
                >
                  Issue to Bench
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setIsDetailsModalOpen(false)
                    handleOpenReceive(selectedDetailsProduct)
                  }}
                >
                  Receive Stock
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              {/* Section 1: Hub & Bench Stock Quantities */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Stock Quantities & Valuation
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Central Store Stock</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                      {formatQuantity(selectedDetailsProduct.central_stock_qty ?? selectedDetailsProduct.stock_qty)} {selectedDetailsProduct.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Packaging Bench Stock</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                      {formatQuantity(selectedDetailsProduct.bench_stock_qty ?? 0)} {selectedDetailsProduct.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Total On-Hand Inventory</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold font-mono">
                      {formatQuantity(selectedDetailsProduct.stock_qty)} {selectedDetailsProduct.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Reorder Threshold</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium font-mono">
                      {formatQuantity(selectedDetailsProduct.reorder_level)} {selectedDetailsProduct.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Unit Cost Benchmark</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium font-mono">
                      {formatNaira(selectedDetailsProduct.unit_cost)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Total Line Valuation</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                      {formatNaira(selectedDetailsProduct.inventory_value)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Consumable Specifications */}
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
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Preferred Vendor</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">PACKAGING DIRECT LTD</span>
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

export default PackagingInventoryPage
