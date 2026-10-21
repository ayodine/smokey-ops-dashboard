import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { LogisticsDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
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
  MessageSquareShare,
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon,
  FileText
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<LogisticsDelivery | null>(null)

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
      setReceiptUploadError('Receipt upload is compulsory for third-party courier assignment. Please upload the fare screenshot.')
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

  const handleSendWhatsApp = (d: LogisticsDelivery) => {
    const text = `Hello ${d.customer_name}, your Smokey Hut order (${d.order_ref}) is out for delivery with ${d.assigned_rider}. Driver phone: ${d.phone}. Track delivery here: https://track.smokeyhut.com/${d.order_ref}`
    window.open(`https://wa.me/234${d.phone.replace(/^0/, '')}?text=${encodeURIComponent(text)}`, '_blank')
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
      accessor: (d) => (
        <Tooltip content="Assign order to an in-house driver or courier">
          <button
            type="button"
            onClick={() => handleOpenAssign(d)}
            className="px-3 py-1 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs font-sans"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Assign Driver
          </button>
        </Tooltip>
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
      header: 'Assigned Courier / Rider',
      accessor: (d) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">
            {d.assigned_rider}
          </div>
          <div className="text-[10px] text-kumo-subtle uppercase">
            {d.rider_type === 'internal' ? 'In-house Fleet' : `Third-Party: ${d.third_party_provider}`}
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
        const statusMap: Record<string, { status: 'pending' | 'active' | 'inactive'; label: string }> = {
          assigned: { status: 'pending', label: 'Assigned' },
          in_transit: { status: 'pending', label: 'In transit' },
          out_for_delivery: { status: 'pending', label: 'Out for delivery' },
          delivered: { status: 'active', label: 'Delivered' },
          failed: { status: 'inactive', label: 'Failed' },
          cancelled: { status: 'inactive', label: 'Cancelled' },
          pending: { status: 'pending', label: 'Pending' }
        }
        const s = statusMap[d.status] || { status: 'pending' as const, label: d.status.replace(/_/g, ' ') }
        return <StatusBadge status={s.status} label={s.label} />
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
      accessor: (d) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          {d.status === 'assigned' && (
            <Tooltip content="Confirm driver collected food from kitchen">
              <button
                type="button"
                onClick={() => confirmRiderCollect(d.id)}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 rounded-lg cursor-pointer transition-colors shadow-2xs font-sans"
              >
                Driver Collect
              </button>
            </Tooltip>
          )}

          {(d.status === 'in_transit' || d.status === 'out_for_delivery') && (
            <>
              <Tooltip content="Confirm order delivered to customer">
                <button
                  type="button"
                  onClick={() => markDelivered(d.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs font-sans"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Delivered
                </button>
              </Tooltip>
              <Tooltip content="Send WhatsApp tracking update to customer">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(d)}
                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquareShare className="w-4 h-4" />
                </button>
              </Tooltip>
            </>
          )}

          {d.status === 'delivered' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Logistics Dispatch Board
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Central dispatch control for packaged orders. Assign trips to internal riders or external courier partners and track delivery completion.
          </p>
        </div>
      </div>

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
            onDateRangeChange={setDateRange}
          />
        ) : (
          <DataTable
            data={activeDeliveries}
            columns={assignedColumns}
            searchable={true}
            searchPlaceholder="Search active deliveries or riders..."
            title="Active Delivery Trip"
            exportFilename="smokey-active-deliveries"
            onDateRangeChange={setDateRange}
          />
        )}
      </div>

      {/* MODAL: Assign Rider Dialog */}
      <Dialog
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Rider: Order ${selectedDelivery?.order_ref}`}
        description="Choose between internal fleet dispatch or third-party courier service."
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmAssign} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Customer:</span>
              <span className="font-semibold text-kumo-strong">{selectedDelivery?.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">Delivery Address:</span>
              <span className="text-kumo-strong font-medium truncate max-w-xs">{selectedDelivery?.address}</span>
            </div>
            <div className="flex justify-between items-center font-sans">
              <span className="text-kumo-subtle font-medium">Customer Paid Fee:</span>
              <span className="font-semibold text-emerald-600 font-sans">{formatNaira(selectedDelivery?.delivery_fee || 0)}</span>
            </div>
          </div>

          <Select
            label="Courier Fleet Mode"
            value={riderType}
            onChange={(e) => {
              setRiderType(e.target.value as any)
              setReceiptUploadError(null)
            }}
            options={[
              { value: 'internal', label: 'Internal Fleet (Smokey Hut In-House Dispatch Rider)' },
              { value: 'third_party', label: 'Third-Party Courier (Uber, InDrive, Gokada, Bolt, GIG)' }
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
                label="3rd-Party Courier Company"
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
                label="Booked Delivery Fee (Charged by Courier ₦)"
                type="number"
                value={bookedFee}
                onChange={(e) => setBookedFee(Number(e.target.value))}
                helperText={`Variance: ${formatNaira((selectedDelivery?.delivery_fee || 0) - bookedFee)}`}
                required
              />
              {bookedFee > (selectedDelivery?.delivery_fee || 0) && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded text-xs text-amber-900 dark:text-amber-200 font-sans flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Subsidy Deficit Warning:</strong> Courier charges {formatNaira(bookedFee - (selectedDelivery?.delivery_fee || 0))} more than customer paid. Management fee subsidy will be logged.</span>
                </div>
              )}

              {/* Compulsory 3rd-Party Receipt / Fare Proof Upload */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-kumo-strong">
                    Waybill Proof of Delivery Slip / Courier Fare Receipt <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Compulsory
                  </span>
                </div>
                <p className="text-[11px] text-kumo-subtle leading-normal">
                  Upload waybill proof of delivery slip or charged fare screenshot from Uber, InDrive, Gokada, Bolt, GIG, etc., before confirming assignment.
                </p>

                {receiptImage ? (
                  <div className="border border-kumo-line rounded-lg p-3 bg-kumo-canvas flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 rounded-md border border-kumo-line overflow-hidden shrink-0 bg-muted/20">
                        <img
                          src={receiptImage}
                          alt="Waybill Proof of Delivery Slip"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-strong truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{receiptFileName || `waybill-${selectedDelivery?.order_ref?.toLowerCase()}-pod.jpg`}</span>
                        </div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 mt-1">
                          Proof of Delivery Attached
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveReceipt}
                      className="p-1.5 text-kumo-subtle hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0 cursor-pointer"
                      title="Remove receipt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    receiptUploadError ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20' : 'border-kumo-line hover:border-primary/50 hover:bg-muted/10'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />
                    <Upload className={`w-6 h-6 mb-1.5 ${receiptUploadError ? 'text-rose-500' : 'text-kumo-subtle'}`} />
                    <span className="text-xs font-semibold text-kumo-strong text-center">
                      Click to upload Waybill Proof of Delivery Slip or fare screenshot
                    </span>
                    <span className="text-[11px] text-kumo-subtle mt-0.5 text-center">
                      PNG, JPG, or WEBP from Uber, InDrive, Gokada, Bolt, or GIG
                    </span>
                  </label>
                )}

                {receiptUploadError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{receiptUploadError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line font-sans">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default LogisticsBoardPage
