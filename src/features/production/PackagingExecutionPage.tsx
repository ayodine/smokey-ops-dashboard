import React, { useState, useMemo, useEffect } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { PackagingQueueOrder, PackagingMaterialDaily } from '@/lib/smokeyData'
import { getCanonicalOrderRef, extractNumericOrderId, deduplicateByOrderRef } from '@/lib/orderCanonical'
import { OrderQueries, OrderSyncManager, type OrderCursor, type AuthoritativeOrder } from '@/services/orders'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { Select } from '@/components/ui/Select'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatNaira, formatDate, cleanOrderNotes, cn } from '@/lib/utils'
import { 
  Package, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  Send, 
  Plus, 
  Trash2, 
  Check,
  Sparkles,
  Eye,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-react'

const mapAuthoritativeToPackagingOrder = (raw: AuthoritativeOrder): PackagingQueueOrder => {
  const canonicalRef = getCanonicalOrderRef(raw)
  const numId = extractNumericOrderId(raw.id ?? canonicalRef, 10000)
  const isScheduled = Boolean(raw.scheduled_delivery_date) || Boolean(raw.notes && raw.notes.includes('[Scheduled Delivery:'))
  const items = Array.isArray(raw.order_items)
    ? raw.order_items.map((i: any) => ({
        product_name: i.name || 'Meal Item',
        quantity: Number(i.qty) || 1,
        unit_price: Number(i.price) || 0,
        line_total: (Number(i.price) || 0) * (Number(i.qty) || 1)
      }))
    : []
  const itemsSummary = items.map(i => `${i.quantity}x ${i.product_name}`).join(', ') || raw.notes || 'Packed Meal'

  return {
    id: numId,
    order_ref: canonicalRef,
    customer_name: raw.customer_name || 'Customer',
    phone: raw.customer_phone || '',
    address: raw.delivery_address || 'Store Pickup',
    total_amount: Number(raw.total) || 0,
    delivery_fee: Number(raw.delivery_fee) || 0,
    delivery_mode: isScheduled ? 'scheduled' : 'instant',
    payment_status: (raw.paid_at || raw.status === 'processing' || raw.status === 'delivered') ? 'paid' : 'pending',
    order_status: (raw.packaging_status as any) || (raw.delivery_status === 'Delivered' ? 'packaged' : 'ready_for_fulfillment'),
    items_summary: itemsSummary,
    items,
    packaging_materials_picked: [],
    notes: raw.notes || '',
    packaged_at: raw.packaged_at || null,
    packaged_by_name: raw.packaged_by || 'Kitchen Staff',
    created_at: raw.created_at || new Date().toISOString()
  }
}

export const PackagingExecutionPage: React.FC = () => {
  const {
    packagingQueue,
    logisticsDeliveries,
    storePickups,
    packagingProducts,
    packagingMaterialsDaily,
    startPackagingOrder,
    confirmPackagingOrder,
    addPackagingQueueOrder,
    issuePackagingFromCentral,
    returnPackagingToCentral,
    currentAccount,
    hasPermission
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'ready' | 'daily' | 'history'>('ready')
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  
  // Shift Requisition State
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false)
  const [requisitionMode, setRequisitionMode] = useState<'single' | 'multiple'>('single')
  const [requisitionProductId, setRequisitionProductId] = useState<number>(packagingProducts[0]?.id || 93)
  const [requisitionQty, setRequisitionQty] = useState<number>(30)
  const [multipleRequisitionItems, setMultipleRequisitionItems] = useState<Array<{ productId: number; quantity: number }>>([
    { productId: packagingProducts[0]?.id || 93, quantity: 25 },
    { productId: packagingProducts[1]?.id || 94, quantity: 25 }
  ])
  const [requisitionNotes, setRequisitionNotes] = useState<string>('Bench stock top-up for active shift orders')

  // End of Day Return & Wastage State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [returnItems, setReturnItems] = useState<Array<{ productId: number; returnQty: number; damagedQty: number }>>([])
  const [returnNotes, setReturnNotes] = useState<string>('EOD return of unused packaging materials')
  const [returnVerifiedBy, setReturnVerifiedBy] = useState<string>('')

  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<PackagingQueueOrder | null>(null)

  const handleOpenDetails = (order: PackagingQueueOrder) => {
    setSelectedDetailsOrder(order)
    setIsDetailsModalOpen(true)
  }

  // Open EOD Return modal with active bench products
  const handleOpenReturnModal = () => {
    setReturnItems(packagingProducts.map(p => ({
      productId: p.id,
      returnQty: 0,
      damagedQty: 0
    })))
    setReturnVerifiedBy(currentAccount?.name || 'Shift Supervisor')
    setReturnNotes('EOD shift return and packaging materials reconciliation')
    setIsReturnModalOpen(true)
  }

  // Manual Order Form State
  const [manualOrderForm, setManualOrderForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    items_summary: '',
    total_amount: 15000,
    delivery_fee: 2500,
    payment_status: 'paid' as 'paid' | 'pending'
  })

  // Cursor Pagination State for Historical Packaged Orders
  const [paginatedHistory, setPaginatedHistory] = useState<PackagingQueueOrder[]>([])
  const [historyCursor, setHistoryCursor] = useState<OrderCursor | null>(null)
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(true)
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState<boolean>(false)

  const handleLoadMoreHistory = async () => {
    if (isLoadingMoreHistory || !historyCursor) return
    setIsLoadingMoreHistory(true)
    try {
      const res = await OrderQueries.getPackagingQueue({ tab: 'history' }, historyCursor, 50)
      const mapped = res.items.map(mapAuthoritativeToPackagingOrder)
      setPaginatedHistory(prev => deduplicateByOrderRef([...prev, ...mapped]))
      setHistoryCursor(res.nextCursor)
      setHasMoreHistory(res.hasMore)
    } catch (err) {
      console.warn('Error loading more packaging history:', err)
    } finally {
      setIsLoadingMoreHistory(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history' && paginatedHistory.length === 0) {
      setIsLoadingMoreHistory(true)
      OrderQueries.getPackagingQueue({ tab: 'history' }, undefined, 50).then(res => {
        setPaginatedHistory(res.items.map(mapAuthoritativeToPackagingOrder))
        setHistoryCursor(res.nextCursor)
        setHasMoreHistory(res.hasMore)
      }).catch(err => {
        console.warn('Initial packaging history fetch error:', err)
      }).finally(() => {
        setIsLoadingMoreHistory(false)
      })
    }
  }, [activeTab])

  // Real-time synchronization for paginated packaged history orders
  useEffect(() => {
    const unsubscribe = OrderSyncManager.subscribe((event) => {
      if (event.event === 'order.updated' || event.event === 'order.lifecycle_transition') {
        const data = event.data
        if (!data) return
        const ref = getCanonicalOrderRef(data)
        if (!ref) return
        const normPkg = String(data.packaging_status || data.order_status || '').toLowerCase()
        const normDeliv = String(data.delivery_status || '').toLowerCase()
        const isPackaged = normPkg === 'packaged' || normDeliv.includes('packaged') || normDeliv.includes('ready') || Boolean(data.packaged_at) || Boolean(data.delivered_at)

        if (isPackaged) {
          const mapped = mapAuthoritativeToPackagingOrder(data as AuthoritativeOrder)
          setPaginatedHistory(prev => {
            const exists = prev.some(p => getCanonicalOrderRef(p) === ref || String(p.id) === String(data.id))
            if (exists) {
              return prev.map(p => (getCanonicalOrderRef(p) === ref || String(p.id) === String(data.id)) ? { ...p, ...mapped, order_status: 'packaged' } : p)
            }
            return [mapped, ...prev]
          })
        } else {
          setPaginatedHistory(prev => prev.filter(p => getCanonicalOrderRef(p) !== ref && String(p.id) !== String(data.id)))
        }
      } else if (event.event === 'order.deleted') {
        const id = String(event.order_id || event.order_ref || '')
        if (id) {
          setPaginatedHistory(prev => prev.filter(p => getCanonicalOrderRef(p) !== id && String(p.id) !== id))
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // Filter queues with defensive invariant: any order already packaged/dispatched on the Logistics Board or collected/ready at Store Pickup Counter cannot appear in Ready/In-Packaging
  const dispatchedOrPickupRefs = useMemo(() => {
    const refs = new Set<string>()
    logisticsDeliveries.forEach(d => {
      if (d.status === 'in_transit' || d.status === 'delivered' || d.status === 'assigned') {
        const ref = getCanonicalOrderRef(d)
        if (ref) refs.add(ref)
      }
    })
    storePickups.forEach(p => {
      // ONLY exclude store pickups that have actually been packaged or collected
      if (p.packaged_at || p.order_status === 'collected') {
        const ref = getCanonicalOrderRef(p)
        if (ref) refs.add(ref)
      }
    })
    return refs
  }, [logisticsDeliveries, storePickups])

  const uniquePackagingQueue = useMemo(() => deduplicateByOrderRef(packagingQueue), [packagingQueue])

  const readyOrders = useMemo(
    () => uniquePackagingQueue.filter(o => 
      (o.order_status === 'ready_for_fulfillment' || o.order_status === 'in_packaging') &&
      !o.packaged_at &&
      !dispatchedOrPickupRefs.has(getCanonicalOrderRef(o))
    ),
    [uniquePackagingQueue, dispatchedOrPickupRefs]
  )
  const historyOrders = useMemo(
    () => {
      const baseHistory = uniquePackagingQueue.filter(o => o.order_status === 'packaged' || dispatchedOrPickupRefs.has(getCanonicalOrderRef(o)))
      return deduplicateByOrderRef([...baseHistory, ...paginatedHistory])
    },
    [uniquePackagingQueue, dispatchedOrPickupRefs, paginatedHistory]
  )

  // KPIs
  const totalDailyMaterials = packagingMaterialsDaily.reduce((acc, m) => acc + m.total_consumed, 0)

  const handleConfirmManualOrder = (e: React.FormEvent) => {
    e.preventDefault()
    addPackagingQueueOrder({
      customer_name: manualOrderForm.customer_name,
      phone: manualOrderForm.phone,
      address: manualOrderForm.address,
      items_summary: manualOrderForm.items_summary,
      total_amount: Number(manualOrderForm.total_amount),
      delivery_fee: Number(manualOrderForm.delivery_fee),
      payment_status: manualOrderForm.payment_status
    })
    setIsManualOrderModalOpen(false)
    setManualOrderForm({
      customer_name: '',
      phone: '',
      address: '',
      items_summary: '',
      total_amount: 15000,
      delivery_fee: 2500,
      payment_status: 'paid'
    })
    setActiveTab('ready')
  }

  // Column defs for Ready for Packaging
  const readyColumns: ColumnDef<PackagingQueueOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (o) => <span className="font-medium text-xs text-kumo-strong font-sans">{o.order_ref}</span>,
      sortValue: (o) => o.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Customer & Contact',
      accessor: (o) => (
        <div>
          <div className="font-semibold text-kumo-strong">{o.customer_name}</div>
          <div className="text-xs text-kumo-subtle">{o.phone}</div>
        </div>
      ),
      sortValue: (o) => o.customer_name,
    },
    {
      key: 'items_summary',
      header: 'Meal Items to Pack',
      accessor: (o) => <span className="text-xs text-kumo-default font-normal font-sans">{o.items_summary}</span>,
    },
    {
      key: 'destination',
      header: 'Delivery Zone / Type',
      accessor: (o) => {
        const isPickup = (o.address || '').toLowerCase().includes('pickup') || (o.address || '').toLowerCase().includes('counter') || o.delivery_fee === 0
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                isPickup 
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
              )}>
                {isPickup ? (
                  <>
                    <ShoppingBag className="w-2.5 h-2.5" />
                    Store Pickup
                  </>
                ) : (
                  <>
                    <Send className="w-2.5 h-2.5" />
                    Door Delivery
                  </>
                )}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase font-medium">{o.delivery_mode} mode</span>
            </div>
            <span className="text-xs text-kumo-strong block truncate max-w-xs">{o.address}</span>
          </div>
        )
      },
    },
    {
      key: 'total_amount',
      header: 'Order Value',
      accessor: (o) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(o.total_amount)}</span>,
      sortValue: (o) => o.total_amount,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (o) => {
        const isPickup = (o.address || '').toLowerCase().includes('pickup') || (o.address || '').toLowerCase().includes('counter') || o.delivery_fee === 0
        return (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {hasPermission('perm_packout') ? (
              <Tooltip content={isPickup ? "Pack and transfer directly to Pickup Counter" : "Pack and transfer directly to Dispatch Board"}>
                <TableActionButton
                  variant="primary"
                  onClick={() => startPackagingOrder(o.id, [], true)}
                  leftIcon={isPickup ? <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} /> : <Send className="w-3.5 h-3.5" strokeWidth={2} />}
                >
                  {isPickup ? 'Pack to Pickup' : 'Pack & Dispatch'}
                </TableActionButton>
              </Tooltip>
            ) : (
              <TableActionButton
                variant="outline"
                onClick={() => handleOpenDetails(o)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Details
              </TableActionButton>
            )}
          </div>
        )
      },
    },
  ]

  // Column defs for Daily Materials Used
  const dailyColumns: ColumnDef<PackagingMaterialDaily>[] = [
    {
      key: 'sku',
      header: 'SKU Ref',
      accessor: (m) => <span className="font-medium text-xs text-kumo-strong font-sans">{m.sku}</span>,
      sortValue: (m) => m.sku,
    },
    {
      key: 'product_name',
      header: 'Packaging Consumable',
      accessor: (m) => <span className="font-medium text-kumo-strong font-sans">{m.product_name}</span>,
      sortValue: (m) => m.product_name,
    },
    {
      key: 'total_consumed',
      header: 'Units Deducted (Today)',
      accessor: (m) => <span className="font-semibold text-red-600 dark:text-red-400 font-sans">-{m.total_consumed} {m.unit}</span>,
      sortValue: (m) => m.total_consumed,
    },
    {
      key: 'total_orders',
      header: 'Orders Sealed',
      accessor: (m) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-kumo-surface text-kumo-default border border-kumo-line font-sans">{m.total_orders} orders</span>,
      sortValue: (m) => m.total_orders,
    },
    {
      key: 'current_stock',
      header: 'Available Stock (Bench / Central)',
      accessor: (m) => {
        const prod = packagingProducts.find(p => p.name.toLowerCase() === m.product_name.toLowerCase())
        return (
          <span className="font-mono text-xs text-kumo-default font-medium">
            {prod ? `${prod.bench_stock_qty ?? 0} bench • ${prod.central_stock_qty ?? 0} central` : '—'}
          </span>
        )
      },
    },
  ]

  // Column defs for Packaging History
  const historyColumns: ColumnDef<PackagingQueueOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (o) => <span className="font-medium text-xs text-kumo-strong font-sans">{o.order_ref}</span>,
      sortValue: (o) => o.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      accessor: (o) => <span className="font-medium text-kumo-strong">{o.customer_name}</span>,
      sortValue: (o) => o.customer_name,
    },
    {
      key: 'packaged_at',
      header: 'Packaged Timestamp',
      accessor: (o) => <span className="text-xs text-kumo-subtle">{formatDate(o.packaged_at || o.created_at)}</span>,
      sortValue: (o) => o.packaged_at || o.created_at,
    },
    {
      key: 'packaged_by_name',
      header: 'Staff Pack Lead',
      accessor: (o) => <span className="text-xs font-medium text-kumo-default">{o.packaged_by_name || 'Kitchen Staff'}</span>,
    },
    {
      key: 'status',
      header: 'Logistics Routing',
      accessor: (o) => {
        const isPickup = (o.address || '').toLowerCase().includes('pickup') || (o.address || '').toLowerCase().includes('counter') || o.delivery_fee === 0
        return isPickup ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800">
            <ShoppingBag className="w-3 h-3" />
            Store Pickup Counter
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <Send className="w-3 h-3" />
            Dispatch Board
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (o) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Tooltip content="View packed meal items and consumable packaging manifest">
            <TableActionButton
              variant="secondary"
              onClick={() => handleOpenDetails(o)}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
            >
              View Pack Manifest
            </TableActionButton>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Packaging Execution & Kitchen Pack-Out"
        subtitle="The operational bridge between kitchen cooking and logistics. Requisition shift packaging materials in bulk from Central Store, pack active orders, and reconcile returns & wastage at end-of-day."
        actions={
          hasPermission('perm_packout') ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenReturnModal}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="h-10 px-3.5 text-xs font-medium"
              >
                EOD Return &amp; Wastage
              </Button>
              <button
                type="button"
                onClick={() => setIsRequisitionModalOpen(true)}
                className="h-10 px-4 text-xs font-semibold bg-[#c0201f] text-white hover:bg-[#a81b1a] border-0 shadow-2xs cursor-pointer flex items-center gap-2 rounded-xl transition-all"
              >
                <ArrowRightLeft className="w-4 h-4 text-white" />
                <span>Requisition from Central</span>
              </button>
            </div>
          ) : undefined
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Orders to Pack"
          value={readyOrders.length}
          description="Paid orders awaiting pack-out"
          icon={<Package className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Materials Used Today"
          value={`${totalDailyMaterials} units`}
          description="Bowls, polybags, foil deducted"
          icon={<ShoppingBag className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Packed Orders"
          value={historyOrders.length}
          description="Handed over to dispatch queue"
          icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'ready', label: 'Orders to Pack', badge: readyOrders.length },
            { id: 'daily', label: 'Materials Used' },
            { id: 'history', label: 'Packed Orders', badge: historyOrders.length },
          ]}
        />
      </div>

      {/* Active Tab Table */}
      <div>
        {activeTab === 'ready' && (
          <DataTable
            data={readyOrders}
            keyExtractor={(o) => getCanonicalOrderRef(o)}
            columns={readyColumns}
            searchable={true}
            searchPlaceholder="Search order ref or customer..."
            title="Order Ready for Pack"
            exportFilename="smokey-orders-ready-to-pack"
            onRowClick={(o) => handleOpenDetails(o)}
            emptyMessage="Fresh orders awaiting packing will appear here in real time as payments are verified."
          />
        )}

        {activeTab === 'daily' && (
          <DataTable
            data={packagingMaterialsDaily}
            columns={dailyColumns}
            searchable={false}
            title="Material Item"
            exportFilename="smokey-daily-packaging-consumed"
          />
        )}

        {activeTab === 'history' && (
          <div>
            <DataTable
              data={historyOrders}
              keyExtractor={(o) => getCanonicalOrderRef(o)}
              columns={historyColumns}
              searchable={true}
              searchPlaceholder="Search packaged audit..."
              title="Packaged Order"
              exportFilename="smokey-packaging-history"
              onRowClick={(o) => handleOpenDetails(o)}
              emptyMessage="Packaged orders handed over to dispatch will appear here."
            />
            {hasMoreHistory && (
              <div className="flex justify-center pt-3 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMoreHistory}
                  disabled={isLoadingMoreHistory}
                >
                  {isLoadingMoreHistory ? 'Loading older packouts...' : 'Load More Historical Packaged Orders'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. REQUISITION MODAL: Single vs Multiple materials via KumoTabs */}
      <Dialog
        isOpen={isRequisitionModalOpen}
        onClose={() => setIsRequisitionModalOpen(false)}
        title="Requisition Packaging from Central Store"
        description="Request packaging supplies from Central Store warehouse directly to the Packaging Bench."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsRequisitionModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              onClick={() => {
                const itemsToIssue = requisitionMode === 'single'
                  ? [{ productId: requisitionProductId, quantity: requisitionQty }]
                  : multipleRequisitionItems.filter(it => it.quantity > 0)
                
                if (itemsToIssue.length === 0) return
                const ok = issuePackagingFromCentral(
                  itemsToIssue,
                  'Packaging Execution Bench',
                  requisitionNotes
                )
                if (ok) setIsRequisitionModalOpen(false)
              }}
            >
              Confirm Requisition
            </Button>
          </div>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          {/* Mode Switcher: Single vs Multiple */}
          <div className="pb-1">
            <KumoTabs
              size="sm"
              activeTab={requisitionMode}
              onChange={(val) => setRequisitionMode(val as 'single' | 'multiple')}
              tabs={[
                { id: 'single', label: 'Single Material' },
                { id: 'multiple', label: `Multiple Materials (${multipleRequisitionItems.length})` },
              ]}
            />
          </div>

          {requisitionMode === 'single' ? (
            <div className="space-y-3">
              <Select
                label="Packaging Material Needed"
                value={requisitionProductId}
                onChange={(e) => {
                  const pid = Number(e.target.value)
                  setRequisitionProductId(pid)
                  const p = packagingProducts.find(x => x.id === pid)
                  if (p) setRequisitionQty(Math.min(30, p.central_stock_qty ?? p.stock_qty))
                }}
                options={packagingProducts.map(p => ({
                  value: p.id,
                  label: `${p.name} [${p.sku}] — Central Store: ${p.central_stock_qty ?? p.stock_qty} ${p.unit} (Bench: ${p.bench_stock_qty ?? 0})`
                }))}
              />

              <Input
                label="Quantity Needed"
                type="number"
                min="1"
                value={requisitionQty}
                onChange={(e) => setRequisitionQty(Number(e.target.value))}
              />

              <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1 font-sans">
                <div className="flex justify-between">
                  <span className="text-kumo-subtle">Central Store Stock Available:</span>
                  <span className="font-mono font-semibold text-kumo-strong">
                    {packagingProducts.find(p => p.id === requisitionProductId)?.central_stock_qty ?? 0} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-kumo-subtle">Bench Stock After Requisition:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {(packagingProducts.find(p => p.id === requisitionProductId)?.bench_stock_qty ?? 0) + requisitionQty} units
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-kumo-strong uppercase tracking-wider">
                  Requested Materials List
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setMultipleRequisitionItems(prev => [
                      ...prev,
                      { productId: packagingProducts[0]?.id || 93, quantity: 20 }
                    ])
                  }}
                >
                  Add Material
                </Button>
              </div>

              <div className="space-y-2">
                {multipleRequisitionItems.map((item, idx) => {
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <div className="flex-1 min-w-0">
                        <Select
                          value={item.productId}
                          onChange={(e) => {
                            const newId = Number(e.target.value)
                            setMultipleRequisitionItems(prev => prev.map((it, i) => i === idx ? { ...it, productId: newId } : it))
                          }}
                          options={packagingProducts.map(p => ({
                            value: p.id,
                            label: `${p.name} (Central: ${p.central_stock_qty ?? p.stock_qty} | Bench: ${p.bench_stock_qty ?? 0})`
                          }))}
                          buttonClassName="h-9 text-xs font-normal rounded-lg"
                        />
                      </div>
                      <div className="w-24 shrink-0">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setMultipleRequisitionItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it))
                          }}
                        />
                      </div>
                      <div className="w-8 flex justify-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setMultipleRequisitionItems(prev => prev.filter((_, i) => i !== idx))
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Remove material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Input
            label="Requester"
            value="Packaging Shift Crew"
            readOnly
          />

          <Input
            label="Reason / Shift Requisition Note"
            value={requisitionNotes}
            onChange={(e) => setRequisitionNotes(e.target.value)}
          />
        </div>
      </Dialog>

      {/* 3. END OF DAY RETURN & WASTAGE MODAL */}
      <Dialog
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="End of Day Packaging Return & Wastage"
        description="Return unused packaging materials from the packing bench back to Central Store and account for any damaged or wasted units."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsReturnModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              onClick={() => {
                const itemsToProcess = returnItems.filter(it => (it.returnQty > 0 || it.damagedQty > 0))
                returnPackagingToCentral(itemsToProcess, returnNotes, returnVerifiedBy || currentAccount?.name || 'Shift Supervisor')
                setIsReturnModalOpen(false)
              }}
            >
              Confirm Return &amp; Reconciliation
            </Button>
          </div>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 grid grid-cols-12 gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span className="col-span-5">Material (Bench Stock)</span>
              <span className="col-span-3">Return to Central</span>
              <span className="col-span-4">Damaged / Wasted</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
              {returnItems.map((item, idx) => {
                const prod = packagingProducts.find(p => p.id === item.productId)
                const benchQty = prod?.bench_stock_qty ?? 0
                return (
                  <div key={item.productId} className="p-3 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 min-w-0">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-xs">{prod?.name || 'Material'}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{prod?.sku}</span>
                        <span>•</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Bench: {benchQty} {prod?.unit || 'units'}</span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        max={benchQty}
                        value={item.returnQty}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value))
                          setReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, returnQty: val } : it))
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min="0"
                        value={item.damagedQty}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value))
                          setReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, damagedQty: val } : it))
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Reconciliation Supervisor / Verified By"
              value={returnVerifiedBy}
              onChange={(e) => setReturnVerifiedBy(e.target.value)}
              placeholder="Shift Supervisor"
            />
            <Input
              label="Return &amp; Reconciliation Notes"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="e.g. End of evening shift surplus return"
            />
          </div>
        </div>
      </Dialog>

      {/* Modal 2: Assign Manual / Web Order for Packing */}
      <Dialog
        isOpen={isManualOrderModalOpen}
        onClose={() => setIsManualOrderModalOpen(false)}
        title="Assign Order for Kitchen Packaging"
        description="Queue a phone, WhatsApp, or website order for packaging material allocation and pack-out."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsManualOrderModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="assign-manual-order-form">
              Queue for Packing
            </Button>
          </div>
        }
      >
        <form id="assign-manual-order-form" onSubmit={handleConfirmManualOrder} className="space-y-4 font-sans">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Chief Adeyemi Ogunlesi"
            value={manualOrderForm.customer_name}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, customer_name: e.target.value }))}
            required
            autoFocus
          />

          <Input
            label="Phone Number"
            placeholder="0803..."
            value={manualOrderForm.phone}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, phone: e.target.value }))}
            required
          />

          <Select
            label="Payment Status"
            value={manualOrderForm.payment_status}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, payment_status: e.target.value as any }))}
            options={[
              { value: 'paid', label: 'PAID (Verified Online / Transfer)' },
              { value: 'pending', label: 'PENDING (Pay on Delivery)' },
            ]}
          />

          <Input
            label="Delivery Address / Mode"
            placeholder="e.g. 14 Admiralty Way, Lekki Phase 1 (or 'Store Pickup Counter')"
            value={manualOrderForm.address}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, address: e.target.value }))}
            required
            helperText="Include 'Pickup' in the address to automatically route to Store Pickup Counter upon completion."
          />

          <Input
            label="Food Items Ordered (Summary)"
            placeholder="e.g. 1x Full Smokey Guineafowl, 2x Jollof Rice Bowls"
            value={manualOrderForm.items_summary}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, items_summary: e.target.value }))}
            required
          />

          <Input
            label="Order Total Amount (₦)"
            type="number"
            min="500"
            value={manualOrderForm.total_amount}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
            required
          />

          <Input
            label="Delivery Fee (₦)"
            type="number"
            min="0"
            value={manualOrderForm.delivery_fee}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, delivery_fee: Number(e.target.value) }))}
            required
          />
        </form>
      </Dialog>

      {/* Packaging Order Details Modal — Desaturated Grey Layout with Clean Aligned Rows */}
      {selectedDetailsOrder && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Order Pack Details: ${selectedDetailsOrder.order_ref}`}
          description="Customer delivery destination, ordered food items, and consumable material packaging."
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
                {(selectedDetailsOrder.order_status === 'ready_for_fulfillment' || selectedDetailsOrder.order_status === 'in_packaging') && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      const o = selectedDetailsOrder
                      setIsDetailsModalOpen(false)
                      startPackagingOrder(o.id, [], true)
                    }}
                    leftIcon={(selectedDetailsOrder.address || '').toLowerCase().includes('pickup') || (selectedDetailsOrder.address || '').toLowerCase().includes('counter') || selectedDetailsOrder.delivery_fee === 0 ? <ShoppingBag className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  >
                    {(selectedDetailsOrder.address || '').toLowerCase().includes('pickup') || (selectedDetailsOrder.address || '').toLowerCase().includes('counter') || selectedDetailsOrder.delivery_fee === 0 ? 'Pack to Pickup' : 'Pack & Dispatch'}
                  </Button>
                )}
                {selectedDetailsOrder.order_status === 'packaged' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsDetailsModalOpen(false)}
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              {/* Section 1: Order & Customer Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Order Information & Destination
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Order Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{selectedDetailsOrder.order_ref}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Name</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedDetailsOrder.customer_name}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Destination</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsOrder.address || 'Lagos Central Delivery'}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Order Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                      {selectedDetailsOrder.order_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Items to Box</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsOrder.items_summary}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Consumables & Packaging Pick */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Packaging Materials Allocation
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {selectedDetailsOrder.packaging_materials_picked && selectedDetailsOrder.packaging_materials_picked.length > 0 ? (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {selectedDetailsOrder.packaging_materials_picked.map((mat, idx) => (
                        <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{mat.packaging_name}</span>
                          <span className="font-mono font-semibold text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                            × {mat.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                      Standard branded bags and foil containers will be selected upon picking.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default PackagingExecutionPage
