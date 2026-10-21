import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { RiderPayout } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { KumoTabs } from '@/components/ui/Tabs'
import { Tooltip } from '@/components/ui/Tooltip'
import { type DateRange, isWithinDateRange } from '@/components/ui/DateRangePicker'
import { formatNaira } from '@/lib/utils'
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
  Check
} from 'lucide-react'

export const DeliveryTeamPage: React.FC = () => {
  const { riders, payAndResetRider, remitCodCash, logisticsDeliveries } = useSmokeyOps()
  const [selectedRider, setSelectedRider] = useState<RiderPayout | null>(null)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isRemitModalOpen, setIsRemitModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'on_trip' | 'active' | 'cash_held'>('all')
  const [modalTab, setModalTab] = useState<'ledger' | 'profile' | 'trips'>('ledger')

  // Remittance form state
  const [remitAmount, setRemitAmount] = useState<number>(0)
  const [cashierName, setCashierName] = useState<string>('Hub Cashier')

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  const activeRidersForKPI = useMemo(() => {
    return riders
  }, [riders, dateRange])

  const totalRiders = activeRidersForKPI.length
  const activeTripsCount = activeRidersForKPI.reduce((acc, r) => acc + r.active_assignments, 0)
  const totalPendingPayout = activeRidersForKPI.reduce((acc, r) => acc + r.pending_payout, 0)
  const totalCodCashHeld = activeRidersForKPI.reduce((acc, r) => acc + Math.max(0, r.cod_cash_collected - r.cod_remitted_total), 0)

  const onTripCount = activeRidersForKPI.filter(r => r.status === 'on_trip').length
  const availableCount = activeRidersForKPI.filter(r => r.status === 'active').length
  const cashHeldCount = activeRidersForKPI.filter(r => Math.max(0, r.cod_cash_collected - r.cod_remitted_total) > 0).length

  const filteredRiders = useMemo(() => {
    return riders.filter(r => {
      if (activeTab === 'on_trip') return r.status === 'on_trip'
      if (activeTab === 'active') return r.status === 'active'
      if (activeTab === 'cash_held') return Math.max(0, r.cod_cash_collected - r.cod_remitted_total) > 0
      return true
    })
  }, [riders, activeTab])

  const handleOpenAccount = (r: RiderPayout, tab: 'ledger' | 'profile' | 'trips' = 'ledger') => {
    setSelectedRider(r)
    setModalTab(tab)
    setIsAccountModalOpen(true)
  }

  const handleOpenRemitModal = (r: RiderPayout) => {
    setSelectedRider(r)
    const unremitted = Math.max(0, r.cod_cash_collected - r.cod_remitted_total)
    setRemitAmount(unremitted)
    setIsRemitModalOpen(true)
  }

  const handleConfirmRemit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRider) return
    remitCodCash(selectedRider.rider_user_id, Number(remitAmount), cashierName)
    setIsRemitModalOpen(false)
    // Update active selectedRider in view
    const newRemitted = selectedRider.cod_remitted_total + Number(remitAmount)
    const unremitted = Math.max(0, selectedRider.cod_cash_collected - newRemitted)
    setSelectedRider(prev => prev ? {
      ...prev,
      cod_remitted_total: newRemitted,
      net_balance: prev.pending_payout - unremitted
    } : null)
  }

  const handlePayAndReset = () => {
    if (!selectedRider) return
    payAndResetRider(selectedRider.rider_user_id)
    const unremitted = Math.max(0, selectedRider.cod_cash_collected - selectedRider.cod_remitted_total)
    setSelectedRider(prev => prev ? {
      ...prev,
      paid_total: prev.paid_total + prev.pending_payout,
      pending_payout: 0,
      net_balance: -unremitted
    } : null)
  }

  // Get rider's trip history from logistics deliveries
  const riderTrips = logisticsDeliveries.filter(d => 
    selectedRider && (d.assigned_rider_id === selectedRider.rider_user_id || d.assigned_rider === selectedRider.rider_name)
  )

  const columns: ColumnDef<RiderPayout>[] = [
    {
      key: 'rider_name',
      header: 'Driver',
      accessor: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
            {r.rider_name.replace('RIDER ', '').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-kumo-strong font-sans">{r.rider_name}</span>
              {r.staff_id && (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-kumo-tint text-kumo-strong rounded border border-kumo-line font-mono">
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
          active: { status: 'active' as const, label: 'AVAILABLE' },
          on_trip: { status: 'pending' as const, label: 'ON ROAD' },
          offline: { status: 'inactive' as const, label: 'OFF DUTY' },
        }
        const s = statusMap[r.status] || { status: 'active' as const, label: r.status.toUpperCase() }
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
            {r.plate_number || 'REG-PENDING'}
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
            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800' 
            : 'bg-kumo-surface text-kumo-subtle border-kumo-line'
        }`}>
          {r.active_assignments} {r.active_assignments === 1 ? 'trip' : 'trips'}
        </span>
      ),
      sortValue: (r) => r.active_assignments,
    },
    {
      key: 'rating',
      header: 'Rating',
      accessor: (r) => (
        <div className="flex items-center gap-1 text-xs font-semibold text-kumo-strong">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{r.rating?.toFixed(1) || '5.0'}</span>
        </div>
      ),
      sortValue: (r) => r.rating || 5.0,
    },
    {
      key: 'pending_payout',
      header: 'Driver Earnings',
      accessor: (r) => (
        <span className="font-semibold font-sans text-xs text-emerald-600 dark:text-emerald-400">
          +{formatNaira(r.pending_payout)}
        </span>
      ),
      sortValue: (r) => r.pending_payout,
    },
    {
      key: 'cod_cash_held',
      header: 'Cash Held',
      accessor: (r) => {
        const unremitted = Math.max(0, r.cod_cash_collected - r.cod_remitted_total)
        return (
          <span className={`font-semibold font-sans text-xs ${unremitted > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-kumo-subtle'}`}>
            {unremitted > 0 ? formatNaira(unremitted) : '₦0.00'}
          </span>
        )
      },
      sortValue: (r) => Math.max(0, r.cod_cash_collected - r.cod_remitted_total),
    },
    {
      key: 'net_balance',
      header: 'Net Balance',
      accessor: (r) => {
        const net = r.net_balance
        if (net < 0) {
          return (
            <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900 rounded-lg">
              Driver Remits: {formatNaira(Math.abs(net))}
            </span>
          )
        }
        if (net > 0) {
          return (
            <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900 rounded-lg">
              Pay Driver: {formatNaira(net)}
            </span>
          )
        }
        return (
          <span className="inline-flex px-2 py-0.5 text-[11px] font-medium bg-kumo-surface text-kumo-subtle border border-kumo-line rounded-lg">
            Settled (₦0)
          </span>
        )
      },
      sortValue: (r) => r.net_balance,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (r) => {
        const unremitted = Math.max(0, r.cod_cash_collected - r.cod_remitted_total)
        return (
          <div className="flex items-center gap-1.5 w-full justify-center" onClick={e => e.stopPropagation()}>
            {unremitted > 0 ? (
              <Tooltip content="Record cash collected by driver" className="flex-1 w-full">
                <button
                  type="button"
                  onClick={() => handleOpenRemitModal(r)}
                  className="w-full px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 rounded-lg cursor-pointer transition-colors font-sans shadow-2xs justify-center text-center"
                >
                  Remit Cash
                </button>
              </Tooltip>
            ) : null}
            <Tooltip content="View driver account ledger & full profile" className="flex-1 w-full">
              <button
                type="button"
                onClick={() => handleOpenAccount(r, 'ledger')}
                className="w-full px-2.5 py-1 text-xs font-medium text-kumo-default bg-kumo-surface hover:bg-kumo-control border border-kumo-line rounded-lg cursor-pointer transition-colors font-sans shadow-2xs justify-center text-center"
              >
                View Account
              </button>
            </Tooltip>
          </div>
        )
      },
    },
  ]

  const currentUnremitted = selectedRider ? Math.max(0, selectedRider.cod_cash_collected - selectedRider.cod_remitted_total) : 0

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Delivery Drivers & Fleet
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Manage fleet drivers, active trip assignments, earnings, cash on delivery, and driver profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/logistics/rider-portal"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition"
          >
            <Bike className="w-4 h-4" />
            <span>Open Rider Portal (Rider Yusuf)</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Fleet Size"
          value={`${totalRiders} Drivers`}
          description="In-house active courier staff"
          icon={<Users className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Active Trips"
          value={`${activeTripsCount} on Road`}
          description="Assigned orders currently in transit"
          icon={<Bike className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Pending Driver Balances"
          value={formatNaira(totalPendingPayout)}
          description="Delivery fees owed to drivers"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Cash Held by Drivers"
          value={formatNaira(totalCodCashHeld)}
          description="Meal cash awaiting hub remittance"
          icon={<Wallet className="w-4 h-4 text-rose-500" />}
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
            { id: 'cash_held', label: 'Cash Held', badge: cashHeldCount > 0 ? cashHeldCount : undefined },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredRiders}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search driver name, phone, or plate number..."
        title="Fleet Drivers"
        exportFilename="smokey-fleet-drivers"
        onRowClick={(r) => handleOpenAccount(r, 'ledger')}
        onDateRangeChange={setDateRange}
      />

      {/* DRIVER ACCOUNT & PROFILE DETAIL MODAL */}
      <Dialog
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={`Driver Account: ${selectedRider?.rider_name || 'Driver'}`}
        description="Comprehensive earnings analysis, two-way cash reconciliation, and verified driver profile."
        maxWidth="4xl"
      >
        <div className="flex flex-col h-[540px] max-h-[calc(88vh-120px)] font-sans">
          {/* Driver Sub-Tabs */}
          <div className="shrink-0 pb-3 border-b border-kumo-line max-w-full overflow-x-auto [scrollbar-width:none]">
            <KumoTabs
              activeTab={modalTab}
              onChange={(val: string) => setModalTab(val as 'ledger' | 'profile' | 'trips')}
              size="md"
              className="w-full flex"
              tabs={[
                { id: 'ledger', label: 'Earnings & Cash Settlement' },
                { id: 'profile', label: 'Driver Profile & KYC' },
                { id: 'trips', label: 'Trip History', badge: riderTrips.length },
              ]}
            />
          </div>

          {/* Fixed-Height Tab Content (Scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-1 [scrollbar-width:thin]">
            {/* TAB 1: EARNINGS & CASH LEDGER */}
            {modalTab === 'ledger' && (
            <div className="space-y-4">
              {/* Earnings Breakdown Cards (Spacious with room for large amounts) */}
              <div>
                <div className="text-xs font-semibold text-kumo-strong uppercase tracking-wider mb-2">
                  Trip Earnings Breakdown
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl shadow-2xs">
                    <span className="text-[11px] text-kumo-subtle font-medium block">Today's Earnings</span>
                    <div className="text-xl font-bold text-kumo-strong mt-1 font-display tracking-normal truncate">
                      {formatNaira(selectedRider?.earnings_today || 0)}
                    </div>
                    <span className="text-[10px] text-kumo-subtle mt-0.5 block">
                      {selectedRider?.today_trips || 0} trips completed today
                    </span>
                  </div>

                  <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl shadow-2xs">
                    <span className="text-[11px] text-kumo-subtle font-medium block">This Week</span>
                    <div className="text-xl font-bold text-kumo-strong mt-1 font-display tracking-normal truncate">
                      {formatNaira(selectedRider?.earnings_week || 0)}
                    </div>
                    <span className="text-[10px] text-kumo-subtle mt-0.5 block">Rolling 7-day earnings</span>
                  </div>

                  <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl shadow-2xs">
                    <span className="text-[11px] text-kumo-subtle font-medium block">This Month</span>
                    <div className="text-xl font-bold text-kumo-strong mt-1 font-display tracking-normal truncate">
                      {formatNaira(selectedRider?.earnings_month || 0)}
                    </div>
                    <span className="text-[10px] text-kumo-subtle mt-0.5 block">Current calendar month</span>
                  </div>

                  <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl shadow-2xs">
                    <span className="text-[11px] text-kumo-subtle font-medium block">Lifetime Total</span>
                    <div className="text-xl font-bold text-kumo-strong mt-1 font-display tracking-normal truncate">
                      {formatNaira(selectedRider?.lifetime_earnings || 0)}
                    </div>
                    <span className="text-[10px] text-kumo-subtle mt-0.5 block">Cumulative historical fees</span>
                  </div>
                </div>
              </div>

              {/* Closed-Loop Cash on Delivery Balance Section (Uniform Clean Styling) */}
              <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl space-y-4 font-sans shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-kumo-strong uppercase tracking-wider">
                    Cash on Delivery & Settlement
                  </div>
                  <span className="text-[11px] text-kumo-subtle">Closed-loop balance equation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 bg-kumo-base dark:bg-zinc-900 border border-kumo-line rounded-xl shadow-2xs">
                    <span className="text-kumo-subtle block text-[11px] font-medium">Driver Balance Owed</span>
                    <div className="text-xl font-bold text-kumo-strong mt-1 font-display tracking-normal truncate">
                      +{formatNaira(selectedRider?.pending_payout || 0)}
                    </div>
                    <span className="text-[10px] text-kumo-subtle block mt-0.5">Delivery fee commissions</span>
                  </div>

                  <div className="p-4 bg-kumo-base dark:bg-zinc-900 border border-kumo-line rounded-xl shadow-2xs">
                    <span className="text-kumo-subtle block text-[11px] font-medium">Cash Held by Driver</span>
                    <div className="text-xl font-bold text-kumo-strong mt-1 font-display tracking-normal truncate">
                      -{formatNaira(currentUnremitted)}
                    </div>
                    <span className="text-[10px] text-kumo-subtle block mt-0.5">Customer cash pending remittance</span>
                  </div>

                  <div className="p-4 bg-kumo-base dark:bg-zinc-900 border border-kumo-line rounded-xl shadow-2xs">
                    <span className="text-kumo-subtle block text-[11px] font-medium">Net Settlement Balance</span>
                    <div className="text-xl font-bold text-kumo-strong mt-1 font-display tracking-normal truncate">
                      {(selectedRider?.net_balance || 0) < 0 
                        ? `Driver owes ${formatNaira(Math.abs(selectedRider?.net_balance || 0))}` 
                        : formatNaira(selectedRider?.net_balance || 0)}
                    </div>
                    <span className="text-[10px] text-kumo-subtle block mt-0.5">Commissions minus cash held</span>
                  </div>
                </div>

                {currentUnremitted > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Driver holds {formatNaira(currentUnremitted)} customer meal cash. Remit cash to cashier before balance payout.</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => selectedRider && handleOpenRemitModal(selectedRider)}
                      className="shrink-0 text-xs py-1.5 px-3 h-8 rounded-lg cursor-pointer"
                    >
                      Remit Cash Now
                    </Button>
                  </div>
                )}

                {/* Primary Settle CTA Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-kumo-line">
                  <div className="flex items-center gap-2 text-xs text-kumo-subtle">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      (selectedRider?.pending_payout || 0) > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {(selectedRider?.pending_payout || 0) > 0 ? (
                      <span className="font-medium text-kumo-default">Unpaid balance ready for payout settlement</span>
                    ) : (
                      <span>Driver payout balance is fully settled (₦0.00)</span>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={(selectedRider?.pending_payout || 0) <= 0}
                    onClick={handlePayAndReset}
                    leftIcon={<Wallet className="w-4 h-4 shrink-0" />}
                    className="px-6 py-2.5 h-auto min-h-[42px] text-xs font-semibold shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl shadow-xs self-stretch sm:self-auto"
                  >
                    Pay Driver Balance ({formatNaira(selectedRider?.pending_payout || 0)})
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRIVER PROFILE & KYC (Sections 5.1 & 5.2) */}
          {modalTab === 'profile' && selectedRider && (
            <div className="space-y-4">
              {/* Driver Header Card */}
              <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-base flex items-center justify-center shrink-0">
                    {selectedRider.rider_name.replace('RIDER ', '').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-kumo-strong">{selectedRider.rider_name}</h3>
                      <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-kumo-tint border border-kumo-line rounded">
                        {selectedRider.staff_id || 'RDR-001'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-kumo-subtle mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {selectedRider.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedRider.email || 'courier@smokeyhut.com'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <StatusBadge 
                    status={selectedRider.status === 'on_trip' ? 'pending' : selectedRider.status === 'active' ? 'active' : 'inactive'} 
                    label={selectedRider.status === 'on_trip' ? 'ON ROAD' : selectedRider.status === 'active' ? 'AVAILABLE' : 'OFF DUTY'} 
                  />
                  <div className="flex items-center gap-1 text-xs font-bold text-kumo-strong px-2 py-1 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{selectedRider.rating?.toFixed(1) || '4.9'}</span>
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {/* Vehicle & Hub Station */}
                <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl space-y-2.5">
                  <div className="font-semibold text-kumo-strong uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-kumo-line">
                    <Bike className="w-4 h-4 text-primary" />
                    <span>Vehicle & Dispatch Hub</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">Vehicle Model:</span>
                    <span className="font-semibold text-kumo-strong">{selectedRider.vehicle_type || 'Bajaj Boxer 150 Motorcycle'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">Plate Number:</span>
                    <span className="font-mono font-semibold text-kumo-strong">{selectedRider.plate_number || 'LND-482-XA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">Operating Hub:</span>
                    <span className="font-semibold text-kumo-strong">{selectedRider.operating_hub || 'Victoria Island Central Hub'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">Date Onboarded:</span>
                    <span className="text-kumo-default">{selectedRider.date_joined || '12 Feb 2025'}</span>
                  </div>
                </div>

                {/* Verification & Safety KYC */}
                <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl space-y-2.5">
                  <div className="font-semibold text-kumo-strong uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-kumo-line">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>License & Safety Verification</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">Driver's License:</span>
                    <span className="font-mono font-semibold text-kumo-strong">{selectedRider.license_number || 'DL-98234-LAG'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">License Expiry:</span>
                    <span className="text-emerald-600 font-medium">{selectedRider.license_expiry || 'Nov 2027'} (Valid)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">Max Cash Limit:</span>
                    <span className="font-semibold text-kumo-strong">{formatNaira(selectedRider.cod_limit || 50000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kumo-subtle">Emergency Contact:</span>
                    <span className="font-medium text-kumo-strong">{selectedRider.emergency_contact || 'Next of Kin'} ({selectedRider.emergency_phone || '08023456789'})</span>
                  </div>
                </div>
              </div>

              {/* Operational Reliability Matrix */}
              <div className="p-4 bg-kumo-surface border border-kumo-line rounded-xl">
                <div className="text-xs font-semibold text-kumo-strong uppercase tracking-wider mb-2.5">
                  Operational Reliability Scores
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-kumo-base border border-kumo-line rounded-lg">
                    <span className="text-[10px] text-kumo-subtle block">On-Time Delivery</span>
                    <span className="text-base font-bold text-emerald-600 block mt-0.5">
                      {selectedRider.on_time_rate || 98.4}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-kumo-base border border-kumo-line rounded-lg">
                    <span className="text-[10px] text-kumo-subtle block">Customer Rating</span>
                    <span className="text-base font-bold text-amber-500 block mt-0.5">
                      {selectedRider.rating?.toFixed(1) || '4.9'} / 5.0
                    </span>
                  </div>
                  <div className="p-2.5 bg-kumo-base border border-kumo-line rounded-lg">
                    <span className="text-[10px] text-kumo-subtle block">COD Remittance</span>
                    <span className="text-base font-bold text-emerald-600 block mt-0.5">
                      100% Reconciled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRIPS HISTORY */}
          {modalTab === 'trips' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-kumo-strong uppercase tracking-wider">
                  Dispatch & Delivery History ({riderTrips.length})
                </span>
                <span className="text-[11px] text-kumo-subtle">Recent order runs assigned</span>
              </div>

              <div className="space-y-2">
                {riderTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3 bg-kumo-surface border border-kumo-line rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-kumo-line-strong transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 bg-kumo-tint text-kumo-strong font-semibold rounded text-[11px] border border-kumo-line shrink-0">
                        {trip.order_ref}
                      </span>
                      <div className="min-w-0">
                        <div className="text-kumo-strong font-medium truncate">{trip.customer_name}</div>
                        <div className="text-[11px] text-kumo-subtle truncate max-w-xs">{trip.address}</div>
                      </div>
                      {trip.payment_mode === 'cod' && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                          COD
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatNaira(trip.delivery_fee)}
                      </span>
                      <StatusBadge
                        status={trip.status === 'delivered' ? 'active' : 'pending'}
                        label={trip.status.toUpperCase()}
                      />
                    </div>
                  </div>
                ))}
                {riderTrips.length === 0 && (
                  <div className="text-xs text-kumo-subtle italic py-6 text-center border border-dashed border-kumo-line rounded-xl">
                    No active trip dispatches recorded for this driver today.
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 flex justify-end pt-3 border-t border-kumo-line bg-kumo-base">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="h-9 px-4 text-xs font-medium cursor-pointer rounded-xl"
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* RECEIVE CASH FROM DRIVER MODAL (Zero Jargon) */}
      <Dialog
        isOpen={isRemitModalOpen}
        onClose={() => setIsRemitModalOpen(false)}
        title={`Receive Cash: ${selectedRider?.rider_name || 'Driver'}`}
        description="Record physical meal cash collected by driver from customers on delivery."
      >
        <form onSubmit={handleConfirmRemit} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Unremitted Cash Balance:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-display text-sm">
                {formatNaira(currentUnremitted)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle">Driver Delivery Earnings:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-display text-sm">
                {formatNaira(selectedRider?.pending_payout || 0)}
              </span>
            </div>
          </div>

          <Input
            label="Cash Amount Received (₦)"
            type="number"
            min="1"
            value={remitAmount}
            onChange={(e) => setRemitAmount(Number(e.target.value))}
            required
          />

          <Input
            label="Cashier / Receiver Name"
            value={cashierName}
            onChange={(e) => setCashierName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" type="button" onClick={() => setIsRemitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Confirm Cash Received
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

export default DeliveryTeamPage
