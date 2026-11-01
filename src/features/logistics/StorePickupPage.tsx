import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { StorePickupOrder } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { KumoTabs } from '@/components/ui/Tabs'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatNaira, formatDate } from '@/lib/utils'
import { 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Store, 
  UserCheck, 
  Phone,
  Eye
} from 'lucide-react'

export const StorePickupPage: React.FC = () => {
  const { storePickups, markPickupCollected } = useSmokeyOps()
  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'collected'>('all')
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedPickup, setSelectedPickup] = useState<StorePickupOrder | null>(null)
  const [selectedDetailsPickup, setSelectedDetailsPickup] = useState<StorePickupOrder | null>(null)
  const [collectedByName, setCollectedByName] = useState('')
  const [collectorPhone, setCollectorPhone] = useState('')
  const [handoverStaff, setHandoverStaff] = useState('')

  const handleOpenDetails = (p: StorePickupOrder) => {
    setSelectedDetailsPickup(p)
    setIsDetailsModalOpen(true)
  }

  const totalPickups = storePickups.length
  const readyCount = storePickups.filter(p => p.order_status === 'ready_for_pickup').length
  const collectedCount = storePickups.filter(p => p.order_status === 'collected').length

  const filteredPickups = storePickups.filter(p => {
    if (activeTab === 'ready') return p.order_status === 'ready_for_pickup'
    if (activeTab === 'collected') return p.order_status === 'collected'
    return true
  })

  const handleOpenCollect = (p: StorePickupOrder) => {
    setSelectedPickup(p)
    setCollectedByName('')
    setCollectorPhone('')
    setHandoverStaff('')
    setIsCollectModalOpen(true)
  }

  const handleConfirmCollect = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPickup) return
    const cleanCollectorName = collectedByName.trim()
    const cleanCollectorPhone = collectorPhone.trim()
    const cleanStaff = handoverStaff.trim()

    if (!cleanCollectorName || !cleanCollectorPhone || !cleanStaff) return

    markPickupCollected(selectedPickup.id, cleanCollectorName, cleanStaff, cleanCollectorPhone)
    setIsCollectModalOpen(false)
  }

  const columns: ColumnDef<StorePickupOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (p) => <span className="font-medium text-xs text-kumo-strong font-sans">{p.order_ref}</span>,
      sortValue: (p) => p.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      accessor: (p) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">{p.customer_name}</div>
          <div className="text-xs text-kumo-subtle flex items-center gap-1 font-sans">
            <Phone className="w-3 h-3" /> {p.phone}
          </div>
          {p.order_status === 'collected' && (
            <div className="text-[11px] text-kumo-subtle font-sans mt-0.5 space-y-0.5">
              {p.collected_by && (
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Collected by: <strong className="font-semibold text-kumo-strong">{p.collected_by}</strong> ({p.collector_phone || p.phone})</span>
                </div>
              )}
              {p.handover_staff && (
                <div className="text-zinc-500 dark:text-zinc-400 pl-4 text-[10.5px]">
                  Handed over by: <span className="font-medium text-kumo-strong">{p.handover_staff}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ),
      sortValue: (p) => p.customer_name,
    },
    {
      key: 'items_summary',
      header: 'Meals',
      accessor: (p) => <span className="text-xs text-kumo-default font-normal font-sans">{p.items_summary}</span>,
    },
    {
      key: 'packaged_at',
      header: 'Ready Since',
      accessor: (p) => <span className="text-xs text-kumo-subtle font-sans">{formatDate(p.packaged_at)}</span>,
      sortValue: (p) => p.packaged_at,
    },
    {
      key: 'total_amount',
      header: 'Order Amount',
      accessor: (p) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(p.total_amount)}</span>,
      sortValue: (p) => p.total_amount,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (p) => {
        return (
          <StatusBadge
            status={p.order_status === 'collected' ? 'active' : 'pending'}
            label={p.order_status === 'collected' ? 'collected' : 'waiting pickup'}
          />
        )
      },
      sortValue: (p) => p.order_status,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
      accessor: (p) => (
        <div onClick={e => e.stopPropagation()} className="shrink-0 flex items-center gap-1.5">
          {p.order_status === 'ready_for_pickup' ? (
            <TableActionButton
              variant="primary"
              icon={<UserCheck />}
              iconStrokeWidth={2}
              onClick={() => handleOpenCollect(p)}
            >
              Hand Over
            </TableActionButton>
          ) : (
            <TableActionButton
              variant="secondary"
              icon={<Eye />}
              iconStrokeWidth={2}
              onClick={() => handleOpenDetails(p)}
            >
              View Details
            </TableActionButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Store Pickup Orders"
        subtitle="Manage customers collecting meals directly at the pickup counter."
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Total Pickups"
          value={totalPickups}
          description="Walk-in counter collections"
          icon={<Store className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Ready for Pickup"
          value={readyCount}
          description="Waiting pickup"
          icon={<Clock className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Collected Today"
          value={collectedCount}
          description="Handed over to customer"
          icon={<CheckCircle2 className="w-4 h-4 text-zinc-500" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val: string) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Pickups', badge: totalPickups },
            { id: 'ready', label: 'Ready for Pickup', badge: readyCount },
            { id: 'collected', label: 'Collected', badge: collectedCount },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredPickups}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search pickup customer or order ref..."
        title="Pickup Order"
        exportFilename="smokey-storefront-pickups"
        onRowClick={(p) => handleOpenDetails(p)}
      />

      {/* Collect Modal */}
      <Dialog
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title={`Confirm Handover: ${selectedPickup?.order_ref}`}
        description="Verify identity of customer collecting meal package at the central store."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCollectModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="confirm-handover-form"
              disabled={!collectedByName.trim() || !collectorPhone.trim() || !handoverStaff.trim()}
            >
              Confirm Handover
            </Button>
          </div>
        }
      >
        <form id="confirm-handover-form" onSubmit={handleConfirmCollect} className="space-y-4" autoComplete="off">
          {/* Master Divided Card Container (stacked label and value) */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs font-sans">
            <div className="p-3.5 space-y-1">
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Order Meals</span>
              <span className="block text-zinc-900 dark:text-zinc-100 font-medium text-[13px] leading-snug">{selectedPickup?.items_summary}</span>
            </div>
            <div className="p-3.5 space-y-1">
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Amount Paid</span>
              <span className="block text-zinc-900 dark:text-zinc-100 font-mono font-semibold text-sm">{formatNaira(selectedPickup?.total_amount || 0)}</span>
            </div>
            <div className="p-3.5 space-y-1">
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Registered Checkout Customer</span>
              <span className="block text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">{selectedPickup?.customer_name} ({selectedPickup?.phone})</span>
            </div>
          </div>

          <Input
            id="pickup-collector-name"
            name="collector_name"
            label="Name of Person Collecting"
            placeholder="Enter full name of person picking up..."
            value={collectedByName}
            onChange={(e) => setCollectedByName(e.target.value)}
            required
            autoComplete="off"
            autoFocus
          />

          <Input
            id="pickup-collector-phone"
            name="collector_phone"
            label="Phone Number of Person Collecting"
            type="tel"
            placeholder="Enter active phone number..."
            value={collectorPhone}
            onChange={(e) => setCollectorPhone(e.target.value)}
            required
            autoComplete="off"
          />

          <Input
            id="pickup-handover-staff"
            name="handover_counter_staff"
            label="Handover Counter Staff"
            placeholder="Enter your staff name..."
            value={handoverStaff}
            onChange={(e) => setHandoverStaff(e.target.value)}
            required
            autoComplete="off"
          />
        </form>
      </Dialog>

      {/* Store Pickup Details Modal */}
      {selectedDetailsPickup && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Pickup Order: ${selectedDetailsPickup.order_ref}`}
          description="Counter takeaway pickup manifest, order meal contents, and customer verification."
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
              {selectedDetailsPickup.order_status === 'ready_for_pickup' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setIsDetailsModalOpen(false)
                    handleOpenCollect(selectedDetailsPickup)
                  }}
                >
                  Confirm Handover
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 font-sans">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              <div className="p-4 space-y-3">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Customer & Order Manifest
                </span>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Name</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedDetailsPickup.customer_name}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Phone Number</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedDetailsPickup.phone}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Meal Items</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsPickup.items_summary}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Order Total</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">{formatNaira(selectedDetailsPickup.total_amount)}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Pickup Status & Handover Details
                </span>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Pickup State</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold uppercase">{selectedDetailsPickup.order_status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Kitchen Ready Since</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">{formatDate(selectedDetailsPickup.packaged_at)}</span>
                </div>
                {selectedDetailsPickup.collected_by && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Collected By</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsPickup.collected_by} ({selectedDetailsPickup.collector_phone})</span>
                  </div>
                )}
                {selectedDetailsPickup.handover_staff && (
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Handover Counter Staff</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedDetailsPickup.handover_staff}</span>
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
export default StorePickupPage
