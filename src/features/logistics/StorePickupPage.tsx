import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { StorePickupOrder } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { KumoTabs } from '@/components/ui/Tabs'
import { formatNaira, formatDate } from '@/lib/utils'
import { 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Store, 
  UserCheck, 
  Phone 
} from 'lucide-react'

export const StorePickupPage: React.FC = () => {
  const { storePickups, markPickupCollected } = useSmokeyOps()
  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'collected'>('all')
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [selectedPickup, setSelectedPickup] = useState<StorePickupOrder | null>(null)
  const [collectedByName, setCollectedByName] = useState('')
  const [handoverStaff, setHandoverStaff] = useState('Tunde Bakare (Front Counter)')

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
    setCollectedByName(p.customer_name)
    setIsCollectModalOpen(true)
  }

  const handleConfirmCollect = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPickup) return
    markPickupCollected(selectedPickup.id, collectedByName, handoverStaff)
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
            label={p.order_status === 'collected' ? 'COLLECTED' : 'WAITING PICKUP'}
          />
        )
      },
      sortValue: (p) => p.order_status,
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (p) => (
        <div onClick={e => e.stopPropagation()}>
          {p.order_status === 'ready_for_pickup' ? (
            <button
              type="button"
              onClick={() => handleOpenCollect(p)}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Hand Over
            </button>
          ) : (
            <div className="text-xs text-kumo-subtle">
              Handed by <span className="text-kumo-strong font-medium">{p.handover_staff || 'Staff'}</span>
            </div>
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
            Store Pickup Orders
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Manage customers collecting meals directly at the pickup counter.
          </p>
        </div>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Total Pickups"
          value={totalPickups}
          description="Walk-in counter collections"
          icon={<Store className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Ready for Pickup"
          value={readyCount}
          description="Waiting pickup"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Collected Today"
          value={collectedCount}
          description="Handed over to customer"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
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
      />

      {/* Collect Modal */}
      <Dialog
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title={`Confirm Handover: ${selectedPickup?.order_ref}`}
        description="Verify identity of customer collecting meal package at the hub."
      >
        <form onSubmit={handleConfirmCollect} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded text-xs space-y-1">
            <div className="flex justify-between items-center font-sans">
              <span className="text-kumo-subtle font-medium">Order Meals:</span>
              <span className="font-semibold text-kumo-strong">{selectedPickup?.items_summary}</span>
            </div>
            <div className="flex justify-between items-center font-sans">
              <span className="text-kumo-subtle font-medium">Amount Paid:</span>
              <span className="font-semibold text-emerald-600 font-sans">{formatNaira(selectedPickup?.total_amount || 0)}</span>
            </div>
          </div>

          <Input
            label="Name of Person Collecting"
            value={collectedByName}
            onChange={(e) => setCollectedByName(e.target.value)}
            required
          />

          <Input
            label="Handover Counter Staff"
            value={handoverStaff}
            onChange={(e) => setHandoverStaff(e.target.value)}
            required
          />

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line font-sans">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCollectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirm Handover
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default StorePickupPage
