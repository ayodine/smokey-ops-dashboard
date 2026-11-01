import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { RiderPayout, LogisticsDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KumoTabs } from '@/components/ui/Tabs'
import { Tooltip } from '@/components/ui/Tooltip'
import { generateNextStaffId } from '@/lib/staffId'
import { formatNaira, cn } from '@/lib/utils'
import { 
  Users, 
  Bike, 
  DollarSign, 
  CheckCircle2, 
  RotateCcw, 
  Phone, 
  AlertTriangle,
  Receipt,
  Wallet,
  Star,
  ShieldCheck,
  Mail,
  MapPin,
  Clock,
  Calendar,
  Check,
  Plus,
  UserPlus,
  Copy,
  ExternalLink,
  UserCheck,
  Eye
} from 'lucide-react'

export const DeliveryTeamPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    riders,
    payAndResetRider,
    logisticsDeliveries,
    addRiderProfile,
    currentAccount,
    availableAccounts,
    createAccount,
    hasRole,
    hasPermission
  } = useSmokeyOps()
  const { facilities, selectedWarehouse } = useWarehouse()
  const [selectedRider, setSelectedRider] = useState<RiderPayout | null>(null)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'on_trip' | 'active' | 'pending_payout'>('all')
  const [modalTab, setModalTab] = useState<'ledger' | 'trips'>('ledger')

  // Driver Onboarding KYC Form State
  const [newDriverForm, setNewDriverForm] = useState({
    rider_name: '',
    phone: '',
    email: '',
    vehicle_type: 'Bajaj Boxer 150 Motorcycle',
    plate_number: '',
    operating_hub: selectedWarehouse?.name || facilities[0]?.name || 'Lagos Mainland HQ',
    license_number: '',
    license_expiry: '',
    emergency_contact: '',
    emergency_phone: '',
    national_id_nin: '',
    status: 'active' as 'active' | 'on_trip' | 'offline'
  })

  const totalRiders = riders.length
  const activeTripsCount = riders.reduce((acc, r) => acc + r.active_assignments, 0)
  const totalPendingPayout = riders.reduce((acc, r) => acc + r.pending_payout, 0)
  const totalCompletedTrips = riders.reduce((acc, r) => acc + (r.total_completed || 0), 0)

  const onTripCount = riders.filter(r => r.status === 'on_trip' || r.active_assignments > 0).length
  const availableCount = riders.filter(r => r.status === 'active' && r.active_assignments === 0).length
  const pendingPayoutCount = riders.filter(r => r.pending_payout > 0).length

  React.useEffect(() => {
    if (!selectedRider) return
    const updated = riders.find(r => Number(r.rider_user_id) === Number(selectedRider.rider_user_id))
    if (updated) {
      setSelectedRider(updated)
    }
  }, [riders, selectedRider?.rider_user_id])

  const filteredRiders = useMemo(() => {
    return riders.filter(r => {
      if (activeTab === 'on_trip') return r.status === 'on_trip' || r.active_assignments > 0
      if (activeTab === 'active') return r.status === 'active' && r.active_assignments === 0
      if (activeTab === 'pending_payout') return r.pending_payout > 0
      return true
    })
  }, [riders, activeTab])

  const handleOpenAccount = (r: RiderPayout, tab: 'ledger' | 'trips' = 'ledger') => {
    setSelectedRider(r)
    setModalTab(tab)
    setIsAccountModalOpen(true)
  }

  const handlePayAndReset = () => {
    if (!selectedRider) return
    if (!hasRole(['admin', 'manager']) && !hasPermission('perm_rider_payout')) {
      alert('Unauthorized: Rider disbursement requires Manager or Admin permissions.')
      return
    }
    payAndResetRider(selectedRider.rider_user_id)
    setSelectedRider(prev => prev ? {
      ...prev,
      paid_total: prev.paid_total + prev.pending_payout,
      pending_payout: 0,
      net_balance: 0
    } : null)
  }

  const handleOnboardDriver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDriverForm.rider_name || !newDriverForm.phone) return
    const nextStaffId = generateNextStaffId('rider', [
      ...availableAccounts,
      ...riders.map(r => ({
        staff_id: r.staff_id || '',
        name: r.rider_name,
        email: r.email || '',
        role: 'rider' as const,
        roleLabel: 'Fleet Rider',
      }))
    ])
    const numericSeq = parseInt(nextStaffId.replace(/\D/g, ''), 10)
    const riderUserId = !isNaN(numericSeq) && numericSeq > 0 ? numericSeq : Math.floor(600 + Math.random() * 300)
    const formattedName = newDriverForm.rider_name.toUpperCase().startsWith('RIDER ')
      ? newDriverForm.rider_name.toUpperCase()
      : `RIDER ${newDriverForm.rider_name.toUpperCase()}`
    const resolvedEmail = (newDriverForm.email || `${formattedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@smokeyhut.com`).trim().toLowerCase()

    addRiderProfile({
      ...newDriverForm,
      email: resolvedEmail,
      rider_user_id: riderUserId,
      rider_name: formattedName,
      staff_id: nextStaffId,
      date_joined: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      rating: 5.0,
      on_time_rate: 100,
      active_assignments: 0,
      today_trips: 0,
      pending_payout: 0,
      paid_total: 0,
      earnings_today: 0,
      earnings_week: 0,
      earnings_month: 0,
      net_balance: 0,
    })

    createAccount({
      email: resolvedEmail,
      name: formattedName,
      role: 'rider',
      roleLabel: 'Delivery Fleet Rider',
      rider_user_id: riderUserId,
      staff_id: nextStaffId,
      phone: newDriverForm.phone.trim(),
      assigned_hub: newDriverForm.operating_hub,
      department: 'Logistics',
      vehicle_type: newDriverForm.vehicle_type,
      plate_number: newDriverForm.plate_number || undefined,
      license_number: newDriverForm.license_number || undefined,
      license_expiry: newDriverForm.license_expiry || undefined,
      national_id_nin: newDriverForm.national_id_nin || undefined,
      emergency_contact: newDriverForm.emergency_contact || undefined,
      emergency_phone: newDriverForm.emergency_phone || undefined,
      status: 'active',
      last_active: 'Account registered just now',
    })

    setIsOnboardModalOpen(false)
    setNewDriverForm({
      rider_name: '',
      phone: '',
      email: '',
      vehicle_type: 'Bajaj Boxer 150 Motorcycle',
      plate_number: '',
      operating_hub: selectedWarehouse?.name || facilities[0]?.name || 'Lagos Mainland HQ',
      license_number: '',
      license_expiry: '',
      emergency_contact: '',
      emergency_phone: '',
      national_id_nin: '',
      status: 'active'
    })
  }

  // Get rider's trip history from logistics deliveries
  const riderTrips = logisticsDeliveries.filter(
    d =>
      selectedRider &&
      (Number(d.assigned_rider_id) === Number(selectedRider.rider_user_id) ||
        (d.assigned_rider && d.assigned_rider !== 'Unassigned' && d.assigned_rider.toLowerCase().trim() === selectedRider.rider_name.toLowerCase().trim()))
  )

  const riderTripColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 120,
      accessor: (t) => (
        <span className="px-2 py-0.5 bg-kumo-tint text-kumo-strong font-sans font-semibold rounded text-xs border border-kumo-line">
          {t.order_ref}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Address',
      defaultWidth: 240,
      accessor: (t) => (
        <div className="min-w-0">
          <div className="font-semibold text-kumo-strong text-xs truncate">{t.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle truncate mt-0.5">{t.address}</div>
        </div>
      ),
    },
    {
      key: 'delivery_fee',
      header: 'Trip Fee',
      defaultWidth: 120,
      align: 'right',
      accessor: (t) => (
        <span className="font-semibold text-kumo-strong font-mono text-xs">
          +{formatNaira(t.delivery_fee)}
        </span>
      ),
    },
    {
      key: 'sla_timing',
      header: 'Delivery Time',
      defaultWidth: 160,
      accessor: (t) => {
        const isLate = Boolean(
          (t.notes && /delayed|late/i.test(t.notes)) ||
          (t.pickup_at && t.delivered_at && (new Date(t.delivered_at).getTime() - new Date(t.pickup_at).getTime() > 45 * 60 * 1000))
        )
        return (
          <div className="text-xs">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              isLate ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {isLate ? 'Late (>45m)' : 'On-Time'}
            </span>
            {t.delivered_at && (
              <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                {t.delivered_at.split(' ')[1] || t.delivered_at}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'Trip Status',
      defaultWidth: 120,
      accessor: (t) => (
        <StatusBadge
          status={t.status === 'delivered' ? 'active' : 'pending'}
          label={t.status === 'delivered' ? 'completed' : t.status.toLowerCase()}
          size="sm"
        />
      ),
    },
  ]

  const columns: ColumnDef<RiderPayout>[] = [
    {
      key: 'rider_name',
      header: 'Driver',
      accessor: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center shrink-0">
            {r.rider_name.replace('RIDER ', '').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-kumo-strong font-sans">{r.rider_name}</span>
              {r.staff_id && (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-kumo-tint text-kumo-strong rounded border border-kumo-line font-sans">
                  {r.staff_id}
                </span>
              )}
            </div>
            <div className="text-xs text-kumo-subtle flex items-center gap-1 font-sans mt-0.5">
              <Phone className="w-3 h-3 text-kumo-subtle" />
              <span>{r.phone}</span>
            </div>
          </div>
        </div>
      ),
      sortValue: (r) => r.rider_name,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => {
        const statusMap = {
          active: { status: 'active' as const, label: 'available' },
          on_trip: { status: 'pending' as const, label: 'on road' },
          offline: { status: 'inactive' as const, label: 'off duty' },
        }
        const s = statusMap[r.status] || { status: 'active' as const, label: r.status.toLowerCase() }
        return <StatusBadge status={s.status} label={s.label} />
      },
      sortValue: (r) => r.status,
    },
    {
      key: 'vehicle',
      header: 'Vehicle & Hub',
      accessor: (r) => (
        <div>
          <div className="text-xs font-medium text-kumo-strong flex items-center gap-1">
            <Bike className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
            <span className="truncate max-w-[150px]">{r.vehicle_type || 'Motorcycle'}</span>
          </div>
          <div className="text-[11px] text-kumo-subtle font-mono mt-0.5">
            {r.plate_number || 'Unregistered'}
          </div>
        </div>
      ),
    },
    {
      key: 'active_assignments',
      header: 'Active Trips',
      accessor: (r) => (
        <span className={`font-medium font-sans text-xs px-2.5 py-1 rounded-lg border ${
          r.active_assignments > 0 
            ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700' 
            : 'bg-kumo-surface text-kumo-subtle border-kumo-line'
        }`}>
          {r.active_assignments} {r.active_assignments === 1 ? 'trip' : 'trips'}
        </span>
      ),
      sortValue: (r) => r.active_assignments,
    },
    {
      key: 'total_completed',
      header: 'Completed Trips',
      accessor: (r) => (
        <span className="font-medium font-sans text-xs px-2.5 py-1 rounded-lg border bg-kumo-surface text-kumo-strong border-kumo-line">
          {r.total_completed || 0} {(r.total_completed || 0) === 1 ? 'trip' : 'trips'}
        </span>
      ),
      sortValue: (r) => r.total_completed || 0,
    },
    {
      key: 'rating',
      header: 'Rating',
      accessor: (r) => {
        const ratingVal = (r.rating !== undefined ? r.rating : 5.0).toFixed(1)
        const delayed = r.delayed_deliveries || 0
        const declined = r.declined_dispatches || 0
        return (
          <Tooltip content={`Performance Score: ${ratingVal}/5.0 (5.0 - ${delayed} late × 0.2 - ${declined} rejected × 0.1)`}>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-strong cursor-help">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{ratingVal}</span>
            </div>
          </Tooltip>
        )
      },
      sortValue: (r) => r.rating || 5.0,
    },
    {
      key: 'pending_payout',
      header: 'Pending Payout',
      accessor: (r) => (
        <span className="font-semibold font-mono text-xs text-kumo-strong">
          +{formatNaira(r.pending_payout)}
        </span>
      ),
      sortValue: (r) => r.pending_payout,
    },
    {
      key: 'net_balance',
      header: 'Settlement Status',
      defaultWidth: 180,
      accessor: (r) => {
        if (r.pending_payout > 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 rounded-lg whitespace-nowrap shrink-0">
              Pay Driver: {formatNaira(r.pending_payout)}
            </span>
          )
        }
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium bg-kumo-surface text-kumo-subtle border border-kumo-line rounded-lg whitespace-nowrap shrink-0">
            Settled (₦0)
          </span>
        )
      },
      sortValue: (r) => r.pending_payout,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
      accessor: (r) => {
        return (
          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            {r.pending_payout > 0 ? (
              (hasRole(['admin', 'manager']) || hasPermission('perm_rider_payout')) ? (
                <Tooltip content="Audit completed trips and disburse payout">
                  <TableActionButton
                    variant="primary"
                    onClick={() => handleOpenAccount(r, 'ledger')}
                  >
                    Disburse Payout
                  </TableActionButton>
                </Tooltip>
              ) : (
                <Tooltip content="Disbursement requires Manager or Admin authorization">
                  <TableActionButton
                    variant="secondary"
                    onClick={() => handleOpenAccount(r, 'ledger')}
                  >
                    Audit Ledger
                  </TableActionButton>
                </Tooltip>
              )
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-kumo-subtle bg-kumo-surface border border-kumo-line rounded-md">
                Settled
              </span>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="In-House Delivery Riders"
        subtitle="Manage in-house riders, active trip assignments, earnings audits, and payout disbursements."
        actions={
          hasRole(['admin', 'manager', 'dispatcher']) ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsOnboardModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Onboard In-House Rider
            </Button>
          ) : undefined
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Active In-House Riders"
          value={`${totalRiders} Riders`}
          description="In-house active delivery staff"
          icon={<Users className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Active Trips"
          value={`${activeTripsCount} on Road`}
          description="Assigned orders currently in transit"
          icon={<Bike className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Pending Driver Payouts"
          value={formatNaira(totalPendingPayout)}
          description="Delivery fees owed for completed trips"
          icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Audited Completed Trips"
          value={`${totalCompletedTrips} Delivered`}
          description="Total lifetime completed trips"
          icon={<CheckCircle2 className="w-4 h-4 text-zinc-500" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val: string) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Drivers', badge: totalRiders },
            { id: 'on_trip', label: 'On Road', badge: onTripCount },
            { id: 'active', label: 'Available', badge: availableCount },
            { id: 'pending_payout', label: 'Pending Payout', badge: pendingPayoutCount > 0 ? pendingPayoutCount : undefined },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredRiders}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search rider name, phone, or plate number..."
        title="In-House Riders"
        exportFilename="smokey-inhouse-riders"
        onRowClick={(r) => handleOpenAccount(r, 'ledger')}
      />

      {/* DRIVER ACCOUNT & PROFILE DETAIL MODAL — Desaturated Grey Layout with Clean Aligned Rows */}
      <Dialog
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={`Driver Account: ${selectedRider?.rider_name || 'Driver'}`}
        description="Comprehensive earnings audit, completed trip reconciliation, and verified driver profile."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
            >
              Close
            </Button>
            {selectedRider && (selectedRider.pending_payout || 0) > 0 && (
              (hasRole(['admin', 'manager']) || hasPermission('perm_rider_payout')) ? (
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={handlePayAndReset}
                >
                  Disburse Payout ({formatNaira(selectedRider.pending_payout)})
                </Button>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                  Manager approval required for payout disbursement
                </span>
              )
            )}
          </div>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          {/* Driver Sub-Tabs */}
          <div>
            <KumoTabs
              activeTab={modalTab}
              onChange={(val: string) => setModalTab(val as 'ledger' | 'trips')}
              size="sm"
              tabs={[
                { id: 'ledger', label: 'Earnings & Payout Audit' },
                { id: 'trips', label: 'Trip History', badge: riderTrips.length },
              ]}
            />
          </div>

          {/* TAB 1: EARNINGS & AUDIT LEDGER */}
          {modalTab === 'ledger' && selectedRider && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              {/* Section 1: Driver Profile & Fleet Assignment */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Driver Profile & Vehicle
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Driver Name</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {selectedRider.rider_name} {selectedRider.staff_id ? `(${selectedRider.staff_id})` : ''}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Phone Number</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedRider.phone}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Assigned Vehicle</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedRider.vehicle_type || 'Motorcycle'} &bull; <span className="font-mono">{selectedRider.plate_number || 'REG-PENDING'}</span>
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Current Duty Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                      {selectedRider.status.replace('_', ' ')} ({selectedRider.active_assignments} active trips)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Performance Rating */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Performance Rating
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Rating Score</span>
                    <span className="inline-flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {(selectedRider.rating !== undefined ? selectedRider.rating : 5.0).toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">On-Time Deliveries</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                      {selectedRider.on_time_rate ?? 100}%
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Late Deliveries</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedRider.delayed_deliveries || 0} {selectedRider.delayed_deliveries === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Rejected Dispatches</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedRider.declined_dispatches || 0} {selectedRider.declined_dispatches === 1 ? 'dispatch' : 'dispatches'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Trip Earnings Breakdown */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Trip Earnings Breakdown
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Today's Earnings</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">
                      {formatNaira(selectedRider.earnings_today || 0)} ({selectedRider.today_trips || 0} trips)
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">This Week (7 Days)</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">
                      {formatNaira(selectedRider.earnings_week || 0)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">This Month</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">
                      {formatNaira(selectedRider.earnings_month || 0)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Lifetime Cumulative</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">
                      {formatNaira(selectedRider.lifetime_earnings || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Settlement & Payout Audit */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Payout Audit & Disbursement
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Total Trips Completed</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedRider.total_completed || 0} {selectedRider.total_completed === 1 ? 'trip' : 'trips'}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Accumulated Trip Earnings</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">
                      +{formatNaira(selectedRider.lifetime_earnings || 0)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Total Previously Disbursed</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-normal">
                      {formatNaira(selectedRider.paid_total || 0)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px] pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-900 dark:text-zinc-100 font-bold">Outstanding Payout Owed</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">
                      {(selectedRider.pending_payout || 0) > 0
                        ? `Pay Driver ${formatNaira(selectedRider.pending_payout || 0)}`
                        : 'Settled (₦0.00)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRIPS HISTORY */}
          {modalTab === 'trips' && (
            <div className="space-y-3 font-sans">
              <DataTable
                data={riderTrips}
                columns={riderTripColumns}
                emptyMessage="No completed delivery trips recorded for this rider yet."
              />
            </div>
          )}
        </div>
      </Dialog>

      {/* ONBOARD NEW FLEET DRIVER MODAL */}
      <Dialog
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        title="Onboard In-House Rider"
        description="Provision in-house rider credentials, vehicle details, and emergency contact records."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsOnboardModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="onboard-driver-form">
              Save & Onboard Rider
            </Button>
          </div>
        }
      >
        <form id="onboard-driver-form" onSubmit={handleOnboardDriver} className="space-y-4 font-sans">
          <Input
            label="Driver Full Name"
            placeholder="e.g. Yusuf Alabi"
            value={newDriverForm.rider_name}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, rider_name: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            placeholder="08012345678"
            value={newDriverForm.phone}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="yusuf.courier@smokeyhut.com"
            value={newDriverForm.email}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, email: e.target.value })}
          />

          <Input
            label="Vehicle Model"
            placeholder="e.g. Bajaj Boxer 150 Motorcycle"
            value={newDriverForm.vehicle_type}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicle_type: e.target.value })}
            required
          />

          <Input
            label="Vehicle Plate Number"
            placeholder="e.g. LND-482-XA"
            value={newDriverForm.plate_number}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, plate_number: e.target.value })}
            required
          />

          <Input
            label="Driver's License Number"
            placeholder="e.g. DL-98234-LAG"
            value={newDriverForm.license_number}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, license_number: e.target.value })}
            required
          />

          <Input
            label="National ID / NIN"
            placeholder="e.g. 7829-4821-9921"
            value={newDriverForm.national_id_nin}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, national_id_nin: e.target.value })}
            required
          />

          <Input
            label="Emergency Contact Name"
            placeholder="e.g. Next of Kin / Brother"
            value={newDriverForm.emergency_contact}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, emergency_contact: e.target.value })}
            required
          />

          <Input
            label="Emergency Phone"
            placeholder="08098765432"
            value={newDriverForm.emergency_phone}
            onChange={(e) => setNewDriverForm({ ...newDriverForm, emergency_phone: e.target.value })}
            required
          />
        </form>
      </Dialog>
    </div>
  )
}

export default DeliveryTeamPage
