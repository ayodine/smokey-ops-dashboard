import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { LogisticsDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { FileUpload } from '@/components/ui/FileUpload'
import { type DateRange, isWithinDateRange, formatLocalDateToYMD } from '@/components/ui/DateRangePicker'
import { formatNaira, formatDate, parseOrderNotes } from '@/lib/utils'
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  UserCheck, 
  DollarSign, 
  Phone, 
  MapPin, 
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Eye,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Download
} from 'lucide-react'
import { openImageSafe, downloadImage } from '@/lib/imageUtils'
import { cn } from '@/lib/utils'
import { getCanonicalOrderRef, extractNumericOrderId, deduplicateByOrderRef } from '@/lib/orderCanonical'
import { OPS_FRESH_START_CUTOFF } from '@/context/SmokeyOpsContext'
import { OrderQueries, OrderSyncManager, type OrderCursor, type AuthoritativeOrder } from '@/services/orders'

function mapAuthoritativeToLogisticsDelivery(raw: AuthoritativeOrder, idx = 0): LogisticsDelivery {
  const items = Array.isArray(raw.order_items) && raw.order_items.length > 0
    ? raw.order_items.map((i: any) => `${i.qty || 1}x ${i.name || 'Item'}`).join(', ')
    : (raw.notes || 'Assorted Items')
  const st = String(raw.delivery_status || raw.status || '').toLowerCase()
  const rawRider = raw.rider_name && String(raw.rider_name).trim() !== '' && raw.rider_name !== 'Unassigned'
    ? String(raw.rider_name).trim()
    : null
  let status: LogisticsDelivery['status'] = 'pending'
  if (st.includes('deliver') || Boolean(raw.delivered_at)) status = 'delivered'
  else if ((st.includes('transit') || st.includes('out_for_delivery') || Boolean(raw.pickup_at)) && rawRider) status = 'in_transit'
  else if ((st.includes('assigned') || rawRider) && rawRider) status = 'assigned'

  const canonicalRef = getCanonicalOrderRef(raw)
  const numericId = extractNumericOrderId(raw.id ?? canonicalRef, 10000 + idx)

  return {
    id: numericId,
    delivery_ref: `DEL-${numericId}`,
    order_id: numericId,
    order_ref: canonicalRef,
    customer_name: raw.customer_name || 'Customer',
    phone: raw.customer_phone || 'N/A',
    address: raw.delivery_address || 'Lagos',
    assigned_rider: rawRider || 'Unassigned',
    assigned_rider_id: raw.rider_id ? Number(raw.rider_id) : undefined,
    rider_type: raw.rider_type || 'internal',
    third_party_provider: raw.third_party_provider || null,
    booked_fee: raw.booked_fee ? Number(raw.booked_fee) : null,
    total_amount: Number(raw.total) || 0,
    status,
    delivery_fee: Number(raw.delivery_fee) || 0,
    dispatch_date: (raw.created_at || new Date().toISOString()).split('T')[0],
    pickup_at: raw.pickup_at || null,
    delivered_at: raw.delivered_at || null,
    fee_evidence_path: raw.fee_evidence_path || null,
    fee_verify_status: (raw.fee_verify_status as any) || 'none',
    items_summary: items,
    notes: raw.notes || '',
  }
}

export const LogisticsBoardPage: React.FC = () => {
  const {
    logisticsDeliveries,
    riders,
    assignRider,
    unassignRider,
    confirmRiderCollect,
    markDelivered,
    hasPermission
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned'>('unassigned')
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'in_transit' | 'delivered'>('all')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<LogisticsDelivery | null>(null)
  const [selectedDetailsDelivery, setSelectedDetailsDelivery] = useState<LogisticsDelivery | null>(null)

  const handleOpenDetails = (d: LogisticsDelivery) => {
    setSelectedDetailsDelivery(d)
    setIsDetailsModalOpen(true)
  }

  // Assign Form State
  const [riderType, setRiderType] = useState<'internal' | 'third_party'>('internal')
  const [internalRiderId, setInternalRiderId] = useState<number>(riders[0]?.rider_user_id || 513)
  const [thirdPartyName, setThirdPartyName] = useState<string>('Uber Connect')
  const [bookedFee, setBookedFee] = useState<number>(3500)
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isImageZoomed, setIsImageZoomed] = useState(false)

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // Search State with Full Historical Supabase Querying
  const [searchQuery, setSearchQuery] = useState('')
  const [backendDeliveries, setBackendDeliveries] = useState<LogisticsDelivery[]>([])
  const [isSearchingBackend, setIsSearchingBackend] = useState(false)

  // Debounced Historical Backend Search for Deliveries
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q || q.length < 2) {
      setBackendDeliveries([])
      setIsSearchingBackend(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingBackend(true)
      try {
        const result = await OrderQueries.getLogisticsQueue({ search: q }, undefined, 50)
        const mapped = result.items.map(mapAuthoritativeToLogisticsDelivery)
        setBackendDeliveries(mapped)
      } catch (err) {
        console.warn('Backend search error in Logistics:', err)
      } finally {
        setIsSearchingBackend(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Server-side pagination for delivered deliveries
  const [deliveredPage, setDeliveredPage] = useState(1)
  const [deliveredTotalCount, setDeliveredTotalCount] = useState(0)
  const [serverDeliveredOrders, setServerDeliveredOrders] = useState<LogisticsDelivery[]>([])
  const [isDeliveredLoading, setIsDeliveredLoading] = useState(false)

  const fetchDeliveredPage = useCallback(async () => {
    if (activeSubTab !== 'delivered') return
    setIsDeliveredLoading(true)
    const dateRangeFilter = dateRange && (dateRange.start || dateRange.end) ? {
      from: dateRange.start ? formatLocalDateToYMD(dateRange.start) : undefined,
      to: dateRange.end ? formatLocalDateToYMD(dateRange.end) : undefined
    } : undefined
    try {
      const res = await OrderQueries.getDeliveredOrdersPage({
        search: searchQuery.trim() || undefined,
        dateRange: dateRangeFilter,
        page: deliveredPage,
        limit: 50
      })
      const mapped = res.items.map(mapAuthoritativeToLogisticsDelivery)
      setServerDeliveredOrders(mapped)
      setDeliveredTotalCount(res.totalCount)
    } catch (err) {
      console.warn('Error fetching delivered orders page:', err)
    } finally {
      setIsDeliveredLoading(false)
    }
  }, [activeSubTab, dateRange, searchQuery, deliveredPage])

  useEffect(() => {
    fetchDeliveredPage()
  }, [fetchDeliveredPage])

  // Real-time synchronization for delivered deliveries
  useEffect(() => {
    const unsubscribe = OrderSyncManager.subscribe((event) => {
      if (
        event.event === 'order.updated' ||
        event.event === 'order.lifecycle_transition' ||
        event.event === 'order.created' ||
        event.event === 'order.deleted'
      ) {
        fetchDeliveredPage()
      }
    })
    return () => unsubscribe()
  }, [fetchDeliveredPage])

  // Dynamic KPIs and Tables reflecting custom date range
  const activeDeliveriesForKPI = useMemo(() => {
    if (!dateRange) return logisticsDeliveries
    return logisticsDeliveries.filter(d => isWithinDateRange(d.dispatch_date || d.pickup_at || d.delivered_at, dateRange))
  }, [logisticsDeliveries, dateRange])

  const hasValidAssignedRider = (riderName?: string | null) => {
    const clean = (riderName || '').trim()
    return Boolean(clean && clean.toLowerCase() !== 'unassigned')
  }

  // A delivery is truly "unassigned" if it has not been delivered and is pending or lacks a designated rider
  const unassignedDeliveries = useMemo(
    () => activeDeliveriesForKPI.filter(d => d.status !== 'delivered' && (d.status === 'pending' || !hasValidAssignedRider(d.assigned_rider))),
    [activeDeliveriesForKPI]
  )

  // A delivery is in "assigned trips" ONLY if it is not pending AND has an actual driver/courier assigned!
  const activeDeliveries = useMemo(
    () => activeDeliveriesForKPI.filter(d => d.status !== 'pending' && hasValidAssignedRider(d.assigned_rider)),
    [activeDeliveriesForKPI]
  )
  const inTransitCount = useMemo(
    () => activeDeliveries.filter(d => d.status === 'in_transit' || d.status === 'out_for_delivery').length,
    [activeDeliveries]
  )
  const deliveredCount = useMemo(() => activeDeliveries.filter(d => d.status === 'delivered').length, [activeDeliveries])

  const filteredActiveDeliveries = useMemo(() => {
    if (activeSubTab === 'in_transit') {
      return activeDeliveries.filter(d => d.status === 'in_transit' || d.status === 'out_for_delivery')
    }
    if (activeSubTab === 'delivered') {
      return serverDeliveredOrders
    }
    return activeDeliveries
  }, [activeDeliveries, activeSubTab, serverDeliveredOrders])

  // Merge client fresh orders with deep backend search results when operator searches
  const searchedUnassignedDeliveries = useMemo(() => {
    if (!searchQuery.trim()) return unassignedDeliveries
    const q = searchQuery.toLowerCase().trim()
    const map = new Map<string, LogisticsDelivery>()
    const assignedRefs = new Set(activeDeliveries.map(d => getCanonicalOrderRef(d)))

    unassignedDeliveries.forEach(d => {
      const ref = getCanonicalOrderRef(d)
      if (!ref) return
      if (
        ref.toLowerCase().includes(q) ||
        d.order_ref.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q)
      ) {
        map.set(ref, d)
      }
    })
    backendDeliveries.forEach(d => {
      const ref = getCanonicalOrderRef(d)
      if (!ref || assignedRefs.has(ref) || map.has(ref)) return
      if (d.status === 'pending' || !d.assigned_rider || d.assigned_rider === 'Unassigned') {
        map.set(ref, d)
      }
    })
    return Array.from(map.values())
  }, [unassignedDeliveries, activeDeliveries, searchQuery, backendDeliveries])

  const searchedActiveDeliveries = useMemo(() => {
    if (activeSubTab === 'delivered') return filteredActiveDeliveries
    if (!searchQuery.trim()) return filteredActiveDeliveries
    const q = searchQuery.toLowerCase().trim()
    const map = new Map<string, LogisticsDelivery>()
    const unassignedRefs = new Set(unassignedDeliveries.map(d => getCanonicalOrderRef(d)))

    filteredActiveDeliveries.forEach(d => {
      const ref = getCanonicalOrderRef(d)
      if (!ref) return
      if (
        ref.toLowerCase().includes(q) ||
        d.order_ref.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        (d.assigned_rider && d.assigned_rider.toLowerCase().includes(q))
      ) {
        map.set(ref, d)
      }
    })
    backendDeliveries.forEach(d => {
      const ref = getCanonicalOrderRef(d)
      if (!ref || unassignedRefs.has(ref) || map.has(ref)) return
      if (d.status !== 'pending' && d.assigned_rider && d.assigned_rider !== 'Unassigned') {
        if (activeSubTab === 'in_transit' && d.status !== 'in_transit' && d.status !== 'out_for_delivery') return
        map.set(ref, d)
      }
    })
    return Array.from(map.values())
  }, [filteredActiveDeliveries, unassignedDeliveries, searchQuery, backendDeliveries, activeSubTab])

  const deliveredTodayCount = activeDeliveriesForKPI.filter(d => d.status === 'delivered').length
  const totalFeesCollected = activeDeliveriesForKPI.reduce((acc, d) => acc + d.delivery_fee, 0)

  const handleOpenAssign = (delivery: LogisticsDelivery) => {
    setSelectedDelivery(delivery)
    setRiderType('internal')
    if (riders.length > 0) {
      setInternalRiderId(riders[0].rider_user_id)
    }
    setBookedFee(delivery.delivery_fee)
    setReceiptImage(null)
    setReceiptUploadError(null)
    setIsAssignModalOpen(true)
  }

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDelivery) return

    if (riderType === 'third_party' && !receiptImage) {
      setReceiptUploadError('Receipt upload is compulsory for third-party rider assignment. Please upload the fare screenshot.')
      return
    }

    if (riderType === 'internal') {
      const match = riders.find(r => Number(r.rider_user_id) === Number(internalRiderId))
      assignRider(
        selectedDelivery.id,
        'internal',
        match?.rider_name || 'Internal Rider',
        Number(internalRiderId)
      )
    } else {
      assignRider(
        selectedDelivery.id,
        'third_party',
        thirdPartyName,
        undefined,
        Number(bookedFee),
        receiptImage || undefined
      )
    }
    setIsAssignModalOpen(false)
    setActiveTab('assigned')
  }

  const handleDriverCollect = async (delivery: LogisticsDelivery) => {
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
    setBackendDeliveries(prev => prev.map(item =>
      (item.id === delivery.id || getCanonicalOrderRef(item) === getCanonicalOrderRef(delivery))
        ? { ...item, status: 'in_transit', pickup_at: nowTime }
        : item
    ))
    await confirmRiderCollect(delivery.id, delivery)
  }

  const handleMarkDelivered = async (delivery: LogisticsDelivery) => {
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
    setBackendDeliveries(prev => prev.map(item =>
      (item.id === delivery.id || getCanonicalOrderRef(item) === getCanonicalOrderRef(delivery))
        ? { ...item, status: 'delivered', delivered_at: nowTime }
        : item
    ))
    await markDelivered(delivery.id, delivery)
  }

  const unassignedColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (d) => (
        <div>
          <span className="font-medium text-xs text-kumo-strong font-sans">{d.order_ref}</span>
          {d.decline_reason && (
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[180px]" title={`Declined: ${d.decline_reason}`}>
              Returned: {d.decline_reason}
            </div>
          )}
        </div>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Recipient & Contact',
      accessor: (d) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">{d.customer_name}</div>
          <div className="text-xs text-kumo-subtle flex items-center gap-1 font-sans">
            <Phone className="w-3 h-3" /> {d.phone}
          </div>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'address',
      header: 'Destination Address',
      accessor: (d) => (
        <span className="text-xs text-kumo-default max-w-sm line-clamp-2 font-sans">
          {d.address}
        </span>
      ),
    },
    {
      key: 'items_summary',
      header: 'Meal Pack',
      accessor: (d) => <span className="text-xs text-kumo-subtle font-sans">{d.items_summary}</span>,
    },
    {
      key: 'delivery_fee',
      header: 'Customer Fee',
      accessor: (d) => <span className="font-medium text-kumo-strong font-mono">{formatNaira(d.delivery_fee)}</span>,
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
      accessor: (d) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          {hasPermission('perm_queue_assign') ? (
            <Tooltip content="Assign order to an in-house driver or courier">
              <TableActionButton
                variant="primary"
                icon={<UserCheck />}
                iconStrokeWidth={2}
                onClick={() => handleOpenAssign(d)}
              >
                Assign Driver
              </TableActionButton>
            </Tooltip>
          ) : (
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenDetails(d)}
            >
              View
            </TableActionButton>
          )}
        </div>
      ),
    },
  ]

  const assignedColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (d) => <span className="font-medium text-xs text-kumo-strong font-sans">{d.order_ref}</span>,
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'assigned_rider',
      header: 'Assigned Rider',
      accessor: (d) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">
            {d.assigned_rider}
          </div>
          <div className="text-[10px] text-kumo-subtle uppercase">
            {d.rider_type === 'internal' ? 'In-House Rider' : 'Third-Party Courier'}
          </div>
        </div>
      ),
      sortValue: (d) => d.assigned_rider,
    },
    {
      key: 'customer_name',
      header: 'Recipient',
      accessor: (d) => (
        <div>
          <div className="font-medium text-kumo-strong">{d.customer_name}</div>
          <div className="text-xs text-kumo-subtle">{d.address}</div>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'status',
      header: 'Trip Status',
      accessor: (d) => {
        if (d.status === 'delivered') {
          return <StatusPill state="completed" label="delivered" />
        }
        if (d.status === 'in_transit' || d.status === 'out_for_delivery') {
          return <StatusPill state="in-progress" label="in-transit" />
        }
        if (d.status === 'assigned') {
          return <StatusPill state="in-review" label="assigned" />
        }
        if (d.status === 'failed' || d.status === 'cancelled') {
          return <StatusPill state="flagged" label={d.status} />
        }
        return <StatusPill state="draft" label="no-action" />
      },
      sortValue: (d) => d.status,
    },
    {
      key: 'timestamps',
      header: 'Dispatch Milestones',
      accessor: (d) => (
        <div className="text-[11px] text-kumo-subtle space-y-0.5">
          {d.pickup_at && <div>Picked: {formatDate(d.pickup_at)}</div>}
          {d.delivered_at && <div className="text-kumo-strong font-medium">Delivered: {formatDate(d.delivered_at)}</div>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (d) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {hasPermission('perm_queue_assign') ? (
            <>
              {d.status === 'assigned' && (
                <Tooltip content="Confirm driver collected food from kitchen">
                  <TableActionButton
                    variant="outline"
                    onClick={() => handleDriverCollect(d)}
                  >
                    Driver Collect
                  </TableActionButton>
                </Tooltip>
              )}

              {(d.status === 'in_transit' || d.status === 'out_for_delivery') && (
                <Tooltip content="Confirm order delivered to customer">
                  <TableActionButton
                    variant="primary"
                    icon={<CheckCircle2 />}
                    iconStrokeWidth={2}
                    onClick={() => handleMarkDelivered(d)}
                  >
                    Delivered
                  </TableActionButton>
                </Tooltip>
              )}

              {d.status === 'delivered' && (
                <span className="text-xs text-kumo-subtle font-medium flex items-center gap-1 whitespace-nowrap shrink-0 px-2 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" /> Completed
                </span>
              )}
            </>
          ) : (
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenDetails(d)}
            >
              View
            </TableActionButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Logistics Dispatch Board"
        subtitle="Central dispatch control for packaged orders. Assign trips to in-house riders or third-party riders and track delivery completion."
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Awaiting Assignment"
          value={unassignedDeliveries.length}
          description="Packed & ready for pickup"
          icon={<Clock className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Active on Delivery Trip"
          value={activeDeliveries.filter(d => d.status !== 'delivered').length}
          description="Currently in transit across Lagos"
          icon={<Navigation className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Delivered Today"
          value={deliveredTodayCount}
          description="Trip fees credited to riders"
          icon={<CheckCircle2 className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Total Delivery Fees"
          value={formatNaira(totalFeesCollected)}
          description="Gross delivery fee pool"
          icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
        />
      </div>

      {/* Filter Tabs inheriting from Raw Ingredients page */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'unassigned', label: 'Unassigned', badge: unassignedDeliveries.length },
            { id: 'assigned', label: 'Assigned Trips', badge: activeDeliveries.length },
          ]}
        />
      </div>

      {/* Active Table */}
      <div>
        {activeTab === 'unassigned' ? (
          <DataTable
            data={searchedUnassignedDeliveries}
            keyExtractor={(d) => getCanonicalOrderRef(d)}
            columns={unassignedColumns}
            searchable={true}
            searchPlaceholder="Search order ref, customer, or address..."
            title="Unassigned Delivery"
            exportFilename="smokey-unassigned-deliveries"
            onRowClick={(d) => handleOpenDetails(d)}
            onDateRangeChange={setDateRange}
            onSearchChange={setSearchQuery}
            emptyMessage={
              searchQuery.trim()
                ? `No unassigned deliveries found matching "${searchQuery}".`
                : "Packaged orders ready for dispatch will appear here in real time. Search by Customer Name, Order ID, or Phone to locate any record."
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
              <KumoTabs
                activeTab={activeSubTab}
                onChange={(val) => {
                  setActiveSubTab(val as any)
                  if (val === 'delivered') setDeliveredPage(1)
                }}
                tabs={[
                  { id: 'all', label: 'All Active Trips', badge: activeDeliveries.length },
                  { id: 'in_transit', label: 'In Transit', badge: inTransitCount },
                  { id: 'delivered', label: 'Delivered', badge: deliveredTotalCount || deliveredCount },
                ]}
              />
            </div>

            <DataTable
              data={searchedActiveDeliveries}
              keyExtractor={(d) => getCanonicalOrderRef(d)}
              columns={assignedColumns}
              searchable={true}
              searchPlaceholder="Search active deliveries or riders..."
              onRowClick={(d) => handleOpenDetails(d)}
              title={
                activeSubTab === 'in_transit' 
                  ? 'In-Transit Trips' 
                  : activeSubTab === 'delivered' 
                  ? 'Delivered Trips' 
                  : 'All Active Delivery Trips'
              }
              exportFilename={`smokey-active-deliveries-${activeSubTab}`}
              onDateRangeChange={setDateRange}
              onSearchChange={(q) => {
                setSearchQuery(q)
                if (activeSubTab === 'delivered') setDeliveredPage(1)
              }}
              serverTotalCount={activeSubTab === 'delivered' ? deliveredTotalCount : undefined}
              currentPage={activeSubTab === 'delivered' ? deliveredPage : undefined}
              onPageChange={activeSubTab === 'delivered' ? setDeliveredPage : undefined}
              isLoading={activeSubTab === 'delivered' ? isDeliveredLoading : false}
              itemsPerPageOptions={[10, 25, 50, 100]}
              emptyMessage={
                searchQuery.trim()
                  ? `No active trips found matching "${searchQuery}".`
                  : "Assigned deliveries will appear here as drivers are dispatched. Search by Customer Name, Order ID, or Rider to locate any record."
              }
            />
          </div>
        )}
      </div>

      {/* MODAL: Assign Rider Dialog */}
      <Dialog
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Rider: Order ${selectedDelivery?.order_ref}`}
        description="Choose between in-house rider dispatch or third-party rider service."
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="assign-rider-form">
              Confirm Assignment
            </Button>
          </div>
        }
      >
        <form id="assign-rider-form" onSubmit={handleConfirmAssign} className="space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs font-sans text-xs">
            <div className="p-3.5 flex justify-between items-baseline">
              <span className="text-zinc-500 dark:text-zinc-400">Customer</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedDelivery?.customer_name} ({selectedDelivery?.phone})</span>
            </div>
            <div className="p-3.5 flex justify-between items-baseline gap-4">
              <span className="text-zinc-500 dark:text-zinc-400 shrink-0">Delivery Address</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium text-right truncate max-w-xs">{selectedDelivery?.address}</span>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-zinc-500 dark:text-zinc-400">Customer Paid Fee</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{formatNaira(selectedDelivery?.delivery_fee || 0)}</span>
            </div>
          </div>

          <Select
            label="Rider Dispatch Mode"
            value={riderType}
            onChange={(e) => {
              setRiderType(e.target.value as any)
              setReceiptUploadError(null)
            }}
            onValueChange={(val) => {
              setRiderType(val as any)
              setReceiptUploadError(null)
            }}
            options={[
              { value: 'internal', label: 'In-House Rider (Smokey Hut In-House Dispatch Rider)' },
              { value: 'third_party', label: 'Third-Party Rider (Uber, InDrive, Gokada, Bolt, GIG)' }
            ]}
          />

          {riderType === 'internal' ? (
            <Select
              label="Select In-House Rider"
              value={internalRiderId}
              onChange={(e) => setInternalRiderId(Number(e.target.value))}
              onValueChange={(val) => setInternalRiderId(Number(val))}
              options={riders.map(r => ({
                value: r.rider_user_id,
                label: `${r.rider_name} (${r.active_assignments} active trips • ${r.status.toUpperCase()})`
              }))}
            />
          ) : (
            <div className="space-y-3.5">
              <Select
                label="Third-Party Rider Company"
                value={thirdPartyName}
                onChange={(e) => setThirdPartyName(e.target.value)}
                options={[
                  { value: 'Uber Connect', label: 'Uber Connect (Uber App)' },
                  { value: 'InDrive Courier', label: 'InDrive Courier' },
                  { value: 'Gokada Express', label: 'Gokada Express' },
                  { value: 'Bolt Dispatch', label: 'Bolt Dispatch' },
                  { value: 'GIG Logistics', label: 'GIG Logistics' },
                  { value: 'Independent Courier', label: 'Independent Courier' }
                ]}
              />
              <Input
                label="Booked Delivery Fee (Charged by Third-Party Rider ₦)"
                type="number"
                value={bookedFee}
                onChange={(e) => setBookedFee(Number(e.target.value))}
                helperText={`Variance: ${formatNaira((selectedDelivery?.delivery_fee || 0) - bookedFee)}`}
                required
              />
              {bookedFee > (selectedDelivery?.delivery_fee || 0) && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span><strong>Subsidy Deficit Notice:</strong> Third-party rider charges {formatNaira(bookedFee - (selectedDelivery?.delivery_fee || 0))} more than customer paid. Management fee subsidy will be logged.</span>
                </div>
              )}

              {/* Compulsory 3rd-Party Receipt / Fare Proof Upload */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-kumo-strong leading-tight">
                    Waybill Proof of Delivery Slip / Rider Fare Receipt
                    <span className="text-[#c0201f] font-bold ml-1 inline-block">*</span>
                  </label>
                  <span className="shrink-0 text-[10px] font-semibold text-zinc-700 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    Required
                  </span>
                </div>
                <p className="text-xs text-kumo-subtle leading-relaxed">
                  Upload waybill proof of delivery slip or charged fare screenshot from Uber, InDrive, Gokada, Bolt, GIG, etc., before confirming assignment.
                </p>

                <FileUpload
                  value={receiptImage || ''}
                  onChange={(newUrl) => {
                    setReceiptImage(newUrl || null)
                    if (newUrl) {
                      setReceiptUploadError(null)
                    }
                  }}
                  onFilesAccepted={(files) => {
                    if (files[0]) {
                      setReceiptUploadError(null)
                    }
                  }}
                  title="Click to upload or drop Waybill Slip / Fare Receipt"
                  description="PNG, JPG, or WEBP up to 5MB (Uber, InDrive, Gokada, Bolt, or GIG)"
                  browseLabel="Browse image"
                  draggingLabel="Drop receipt image"
                  fileReadyText="Proof of delivery attached"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp,application/pdf,.pdf"
                  showBorderBeam={true}
                  showFileList={true}
                />

                {receiptUploadError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#c0201f] font-medium mt-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{receiptUploadError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </Dialog>

      {/* Dispatch Trip Details Modal */}
      {selectedDetailsDelivery && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Delivery Dispatch: ${selectedDetailsDelivery.order_ref}`}
          description="Customer delivery manifest, assigned rider, and trip routing"
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
              {selectedDetailsDelivery.status !== 'delivered' && (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {(!selectedDetailsDelivery.assigned_rider || selectedDetailsDelivery.assigned_rider === 'Unassigned' || selectedDetailsDelivery.status === 'pending') ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleOpenAssign(selectedDetailsDelivery)
                      }}
                    >
                      Assign Driver
                    </Button>
                  ) : (
                    <>
                      {hasPermission('perm_queue_assign') && (
                        <>
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => {
                              setIsDetailsModalOpen(false)
                              handleOpenAssign(selectedDetailsDelivery)
                            }}
                          >
                            Reassign Driver
                          </Button>
                          <Button
                            variant="secondary"
                            size="md"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={async () => {
                              await unassignRider(selectedDetailsDelivery.order_ref)
                              setIsDetailsModalOpen(false)
                            }}
                          >
                            Unassign Rider
                          </Button>
                        </>
                      )}
                      {selectedDetailsDelivery.status === 'assigned' ? (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => {
                            handleDriverCollect(selectedDetailsDelivery)
                            setIsDetailsModalOpen(false)
                          }}
                        >
                          Driver Collect
                        </Button>
                      ) : (selectedDetailsDelivery.status === 'in_transit' || selectedDetailsDelivery.status === 'out_for_delivery') ? (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => {
                            handleMarkDelivered(selectedDetailsDelivery)
                            setIsDetailsModalOpen(false)
                          }}
                        >
                          Delivered
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs font-sans">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Delivery Destination &amp; Order Contents
                  </span>
                  {selectedDetailsDelivery.phone && (
                    <a
                      href={`tel:${selectedDetailsDelivery.phone}`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium underline underline-offset-2"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Name</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedDetailsDelivery.customer_name}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Phone Number</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedDetailsDelivery.phone}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Address</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsDelivery.address}</span>
                </div>
                {parseOrderNotes(selectedDetailsDelivery.notes).deliveryNote && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Note</span>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-semibold text-[11px] uppercase tracking-wider mb-1">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                        <span>Customer Instructions</span>
                      </div>
                      <p className="text-[12.5px] font-medium leading-relaxed whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                        {parseOrderNotes(selectedDetailsDelivery.notes).deliveryNote}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Meal Pack</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsDelivery.items_summary}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Paid Fee</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">{formatNaira(selectedDetailsDelivery.delivery_fee)}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Dispatch &amp; Delivery Rider
                </span>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Current Status</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium capitalize">{selectedDetailsDelivery.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Assigned Rider</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedDetailsDelivery.assigned_rider || 'Unassigned'}</span>
                </div>
                {selectedDetailsDelivery.decline_reason && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Previous Decline Reason</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsDelivery.decline_reason}</span>
                  </div>
                )}
                {selectedDetailsDelivery.booked_fee && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Rider Booked Fee</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{formatNaira(selectedDetailsDelivery.booked_fee)}</span>
                  </div>
                )}
                {selectedDetailsDelivery.dispatch_date && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Dispatch Date</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedDetailsDelivery.dispatch_date}</span>
                  </div>
                )}
                {selectedDetailsDelivery.pickup_at && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Food Pickup Time</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{formatDate(selectedDetailsDelivery.pickup_at)}</span>
                  </div>
                )}
                {selectedDetailsDelivery.delivered_at && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivered Timestamp</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{formatDate(selectedDetailsDelivery.delivered_at)}</span>
                  </div>
                )}
                {selectedDetailsDelivery.fee_evidence_path && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs block font-medium">Attached Waybill / Fare Receipt</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs"
                          title="Inspect waybill in full size"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span>View Full Size</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openImageSafe(selectedDetailsDelivery.fee_evidence_path!, `Waybill-${selectedDetailsDelivery.order_ref}`)}
                          className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
                          title="Open in new browser tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div 
                      onClick={() => setIsLightboxOpen(true)}
                      className="max-w-xs rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-950 cursor-zoom-in hover:border-zinc-400 transition group relative flex items-center justify-center p-1"
                      title="Click to view full size"
                    >
                      <img
                        src={selectedDetailsDelivery.fee_evidence_path}
                        alt="Waybill Fare Proof"
                        className="w-full h-auto max-h-48 object-contain transition group-hover:scale-[1.01]"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-medium backdrop-blur-xs shadow-lg">
                          <Eye className="w-3.5 h-3.5" />
                          Click to inspect full size
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* FULL-SIZE WAYBILL LIGHTBOX MODAL */}
      {isLightboxOpen && selectedDetailsDelivery?.fee_evidence_path && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-150">
          {/* Lightbox Top Bar */}
          <div className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-black/40 shrink-0">
            <div className="flex items-center gap-3 text-white min-w-0">
              <span className="text-sm font-semibold truncate">
                Waybill Proof · Order {selectedDetailsDelivery.order_ref}
              </span>
              {selectedDetailsDelivery.assigned_rider && (
                <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-md bg-white/10 text-zinc-300">
                  {selectedDetailsDelivery.assigned_rider}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImageZoomed(!isImageZoomed)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title={isImageZoomed ? 'Fit to Screen' : '100% Zoom'}
              >
                {isImageZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isImageZoomed ? 'Fit Screen' : 'Zoom 100%'}</span>
              </button>
              <button
                type="button"
                onClick={() => openImageSafe(selectedDetailsDelivery.fee_evidence_path!, `Waybill-${selectedDetailsDelivery.order_ref}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="Open in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Tab</span>
              </button>
              <button
                type="button"
                onClick={() => downloadImage(selectedDetailsDelivery.fee_evidence_path!, `waybill-${selectedDetailsDelivery.order_ref}.jpg`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="Download waybill slip image"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false)
                  setIsImageZoomed(false)
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition ml-1 cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div 
            className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center cursor-default"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsLightboxOpen(false)
                setIsImageZoomed(false)
              }
            }}
          >
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={selectedDetailsDelivery.fee_evidence_path}
                alt={`Waybill Proof for Order ${selectedDetailsDelivery.order_ref}`}
                className={cn(
                  'rounded-lg shadow-2xl transition-all duration-200 object-contain',
                  isImageZoomed
                    ? 'max-w-none w-auto cursor-zoom-out'
                    : 'max-h-[82vh] max-w-[92vw] cursor-zoom-in'
                )}
                onClick={() => setIsImageZoomed(!isImageZoomed)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default LogisticsBoardPage
