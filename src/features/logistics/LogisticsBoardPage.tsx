import React, { useState, useMemo } from 'react'
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
import { type DateRange, isWithinDateRange } from '@/components/ui/DateRangePicker'
import { formatNaira, formatDate } from '@/lib/utils'
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
  Eye
} from 'lucide-react'

export const LogisticsBoardPage: React.FC = () => {
  const {
    logisticsDeliveries,
    riders,
    assignRider,
    confirmRiderCollect,
    markDelivered
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
  const [internalRiderId, setInternalRiderId] = useState<number>(riders[0]?.rider_user_id || 453)
  const [thirdPartyName, setThirdPartyName] = useState<string>('Uber Connect')
  const [bookedFee, setBookedFee] = useState<number>(3500)
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [receiptFileName, setReceiptFileName] = useState<string>('')
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null)

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // Dynamic KPIs reflecting custom date range
  const activeDeliveriesForKPI = useMemo(() => {
    if (!dateRange) return logisticsDeliveries
    return logisticsDeliveries.filter(d => isWithinDateRange(d.dispatch_date || d.pickup_at || d.delivered_at, dateRange))
  }, [logisticsDeliveries, dateRange])

  const unassignedDeliveries = useMemo(() => logisticsDeliveries.filter(d => d.status === 'pending'), [logisticsDeliveries])
  const activeDeliveries = useMemo(() => logisticsDeliveries.filter(d => d.status !== 'pending'), [logisticsDeliveries])
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
      return activeDeliveries.filter(d => d.status === 'delivered')
    }
    return activeDeliveries
  }, [activeDeliveries, activeSubTab])

  const deliveredTodayCount = activeDeliveriesForKPI.filter(d => d.status === 'delivered').length
  const totalFeesCollected = activeDeliveriesForKPI.reduce((acc, d) => acc + d.delivery_fee, 0)

  const handleOpenAssign = (delivery: LogisticsDelivery) => {
    setSelectedDelivery(delivery)
    setBookedFee(delivery.delivery_fee)
    setReceiptImage(null)
    setReceiptFileName('')
    setReceiptUploadError(null)
    setIsAssignModalOpen(true)
  }

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setReceiptUploadError('Please select a valid image file (.jpg, .png, .webp).')
      return
    }
    setReceiptUploadError(null)
    setReceiptFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveReceipt = () => {
    setReceiptImage(null)
    setReceiptFileName('')
    setReceiptUploadError(null)
  }

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDelivery) return

    if (riderType === 'third_party' && !receiptImage) {
      setReceiptUploadError('Receipt upload is compulsory for third-party rider assignment. Please upload the fare screenshot.')
      return
    }

    if (riderType === 'internal') {
      const match = riders.find(r => r.rider_user_id === Number(internalRiderId))
      assignRider(selectedDelivery.id, 'internal', match?.rider_name || 'Internal Rider', Number(internalRiderId))
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

  const unassignedColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Delivery Ref',
      accessor: (d) => <span className="font-medium text-xs text-kumo-strong font-sans">{d.order_ref}</span>,
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
      accessor: (d) => <span className="font-medium text-emerald-600 font-sans">{formatNaira(d.delivery_fee)}</span>,
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
      accessor: (d) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
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
            {d.rider_type === 'internal' ? 'In-House Rider' : `Third-Party Rider: ${d.third_party_provider}`}
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
          {d.delivered_at && <div className="text-emerald-600 font-medium">Delivered: {formatDate(d.delivered_at)}</div>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (d) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {d.status === 'assigned' && (
            <Tooltip content="Confirm driver collected food from kitchen">
              <TableActionButton
                variant="blue"
                onClick={() => confirmRiderCollect(d.id)}
              >
                Driver Collect
              </TableActionButton>
            </Tooltip>
          )}

          {(d.status === 'in_transit' || d.status === 'out_for_delivery') && (
            <Tooltip content="Confirm order delivered to customer">
              <TableActionButton
                variant="success"
                icon={<CheckCircle2 />}
                iconStrokeWidth={2}
                onClick={() => markDelivered(d.id)}
              >
                Delivered
              </TableActionButton>
            </Tooltip>
          )}

          {d.status === 'delivered' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 px-2 font-sans">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
            </span>
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
          icon={<Clock className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Active on Delivery Trip"
          value={activeDeliveries.filter(d => d.status !== 'delivered').length}
          description="Currently in transit across Lagos"
          icon={<Navigation className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Delivered Today"
          value={deliveredTodayCount}
          description="Trip fees credited to riders"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Total Delivery Fees"
          value={formatNaira(totalFeesCollected)}
          description="Gross delivery fee pool"
          icon={<DollarSign className="w-4 h-4 text-blue-500" />}
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
            data={unassignedDeliveries}
            columns={unassignedColumns}
            searchable={true}
            searchPlaceholder="Search order ref, customer, or address..."
            title="Unassigned Delivery"
            exportFilename="smokey-unassigned-deliveries"
            onRowClick={(d) => handleOpenDetails(d)}
            onDateRangeChange={setDateRange}
          />
        ) : (
          <div className="space-y-4">
            <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
              <KumoTabs
                activeTab={activeSubTab}
                onChange={(val) => setActiveSubTab(val as any)}
                tabs={[
                  { id: 'all', label: 'All Active Trips', badge: activeDeliveries.length },
                  { id: 'in_transit', label: 'In Transit', badge: inTransitCount },
                  { id: 'delivered', label: 'Delivered', badge: deliveredCount },
                ]}
              />
            </div>

            <DataTable
              data={filteredActiveDeliveries}
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
      >
        <form onSubmit={handleConfirmAssign} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-kumo-subtle">Customer:</span>
              <span className="font-semibold text-kumo-strong text-xs sm:text-sm">{selectedDelivery?.customer_name}</span>
            </div>
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-kumo-subtle">Delivery Address:</span>
              <span className="text-kumo-strong font-medium truncate max-w-xs text-xs">{selectedDelivery?.address}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-kumo-subtle font-medium">Customer Paid Fee:</span>
              <span className="font-semibold text-emerald-600 font-sans text-xs sm:text-sm">{formatNaira(selectedDelivery?.delivery_fee || 0)}</span>
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
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded text-sm text-amber-900 dark:text-amber-200 font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Subsidy Deficit Warning:</strong> Third-party rider charges {formatNaira(bookedFee - (selectedDelivery?.delivery_fee || 0))} more than customer paid. Management fee subsidy will be logged.</span>
                </div>
              )}

              {/* Compulsory 3rd-Party Receipt / Fare Proof Upload */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-kumo-strong leading-tight">
                    Waybill Proof of Delivery Slip / Rider Fare Receipt
                    <span className="text-rose-500 font-bold ml-1 inline-block">*</span>
                  </label>
                  <span className="shrink-0 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Compulsory
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
                      setReceiptFileName(files[0].name)
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
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{receiptUploadError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-kumo-line font-sans">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dispatch Trip Details Modal */}
      {selectedDetailsDelivery && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Delivery Dispatch: ${selectedDetailsDelivery.order_ref}`}
          description={`Customer delivery manifest, assigned rider, and trip routing`}
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
                {selectedDetailsDelivery.status === 'pending' && (
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
                )}
                {selectedDetailsDelivery.status === 'assigned' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      confirmRiderCollect(selectedDetailsDelivery.id)
                      setIsDetailsModalOpen(false)
                    }}
                  >
                    Confirm Food Pickup
                  </Button>
                )}
                {selectedDetailsDelivery.status === 'in_transit' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      markDelivered(selectedDetailsDelivery.id)
                      setIsDetailsModalOpen(false)
                    }}
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs font-sans">
              <div className="p-4 space-y-3">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Delivery Destination
                </span>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Name</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedDetailsDelivery.customer_name}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Address</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsDelivery.address}</span>
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
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium capitalize">{selectedDetailsDelivery.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Assigned Rider</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedDetailsDelivery.assigned_rider || 'Unassigned'}</span>
                </div>
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
                {selectedDetailsDelivery.delivered_at && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivered Timestamp</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedDetailsDelivery.delivered_at}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default LogisticsBoardPage
