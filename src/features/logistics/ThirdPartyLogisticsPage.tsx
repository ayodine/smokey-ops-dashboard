import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { ThirdPartyWeeklySummary, LogisticsDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { KumoTabs } from '@/components/ui/Tabs'
import { formatNaira, formatDate } from '@/lib/utils'
import { 
  Building, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  FileText, 
  Eye, 
  ExternalLink,
  Phone,
  AlertTriangle,
  Scale
} from 'lucide-react'

export const ThirdPartyLogisticsPage: React.FC = () => {
  const { logisticsDeliveries, verifyThirdPartyFee } = useSmokeyOps()
  const [activeTab, setActiveTab] = useState<'verification' | 'variance'>('verification')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all')
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<LogisticsDelivery | null>(null)
  const [verificationNote, setVerificationNote] = useState('')

  // 3rd party deliveries derived strictly from logistics deliveries
  const tpDeliveries = useMemo(
    () => logisticsDeliveries.filter(d => d.rider_type === 'third_party'),
    [logisticsDeliveries]
  )

  // Filtered deliveries based on audit status sub-tabs
  const filteredDeliveries = useMemo(() => {
    if (statusFilter === 'all') return tpDeliveries
    if (statusFilter === 'pending') {
      return tpDeliveries.filter(d => d.fee_verify_status === 'pending' || d.fee_verify_status === 'none')
    }
    return tpDeliveries.filter(d => d.fee_verify_status === statusFilter)
  }, [tpDeliveries, statusFilter])

  // Dynamic grouping by Monday–Sunday calendar week
  const effectiveWeeklySummaries = useMemo<ThirdPartyWeeklySummary[]>(() => {
    if (tpDeliveries.length === 0) return []

    const weekMap = new Map<string, LogisticsDelivery[]>()

    for (const d of tpDeliveries) {
      const dateRaw = d.dispatch_date || d.pickup_at || d.delivered_at || new Date().toISOString()
      const dt = new Date(dateRaw)
      const validDate = isNaN(dt.getTime()) ? new Date() : dt
      const day = validDate.getDay() // 0 = Sun, 1 = Mon ...
      const diffToMon = (day === 0 ? -6 : 1) - day
      const mon = new Date(validDate)
      mon.setDate(validDate.getDate() + diffToMon)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      const fmt = (x: Date) => x.toISOString().split('T')[0]
      const key = `${fmt(mon)}_${fmt(sun)}`
      if (!weekMap.has(key)) weekMap.set(key, [])
      weekMap.get(key)!.push(d)
    }

    const summaries: ThirdPartyWeeklySummary[] = []
    for (const [key, dels] of weekMap.entries()) {
      const [start, end] = key.split('_')
      const orderFees = dels.reduce((acc, d) => acc + (d.delivery_fee || 0), 0)
      const bookedFees = dels.reduce((acc, d) => acc + (d.booked_fee || 0), 0)
      const lossCount = dels.filter(d => (d.delivery_fee || 0) < (d.booked_fee || 0)).length
      const gainCount = dels.filter(d => (d.delivery_fee || 0) > (d.booked_fee || 0)).length
      const evenCount = dels.length - lossCount - gainCount

      const startFormatted = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      const endFormatted = new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

      summaries.push({
        week_start: start,
        week_end: end,
        label: `${startFormatted} – ${endFormatted}`,
        delivery_count: dels.length,
        order_fees: orderFees,
        booked_fees: bookedFees,
        net: orderFees - bookedFees,
        loss_count: lossCount,
        gain_count: gainCount,
        even_count: evenCount,
      })
    }

    return summaries.sort((a, b) => b.week_start.localeCompare(a.week_start))
  }, [tpDeliveries])

  // Cumulative KPIs
  const totalDeliveriesCount = tpDeliveries.length
  const totalOrderFees = tpDeliveries.reduce((acc, d) => acc + (d.delivery_fee || 0), 0)
  const totalBookedFees = tpDeliveries.reduce((acc, d) => acc + (d.booked_fee || 0), 0)
  const netVariance = totalOrderFees - totalBookedFees
  const pendingAuditCount = tpDeliveries.filter(d => d.fee_verify_status === 'pending' || d.fee_verify_status === 'none').length
  const approvedCount = tpDeliveries.filter(d => d.fee_verify_status === 'approved').length
  const flaggedCount = tpDeliveries.filter(d => d.fee_verify_status === 'flagged').length

  const handleOpenEvidence = (d: LogisticsDelivery) => {
    setSelectedDelivery(d)
    setVerificationNote('')
    setIsEvidenceModalOpen(true)
  }

  const handleActionVerify = (status: 'approved' | 'flagged') => {
    if (!selectedDelivery) return
    verifyThirdPartyFee(selectedDelivery.id, status, verificationNote)
    setIsEvidenceModalOpen(false)
  }

  // Columns for Weekly Fee Variance
  const weeklyColumns: ColumnDef<ThirdPartyWeeklySummary>[] = [
    {
      key: 'label',
      header: 'Weekly Period',
      accessor: (w) => (
        <div>
          <span className="font-semibold text-kumo-strong font-sans">{w.label}</span>
          <span className="text-[11px] text-kumo-subtle block font-sans">{w.week_start} → {w.week_end}</span>
        </div>
      ),
      sortValue: (w) => w.week_start,
    },
    {
      key: 'delivery_count',
      header: 'Courier Trips',
      accessor: (w) => <span className="font-medium text-kumo-strong font-sans text-xs">{w.delivery_count} trips</span>,
      sortValue: (w) => w.delivery_count,
    },
    {
      key: 'order_fees',
      header: 'Customer Fees',
      accessor: (w) => <span className="text-kumo-strong font-medium font-mono text-xs">{formatNaira(w.order_fees)}</span>,
      sortValue: (w) => w.order_fees,
    },
    {
      key: 'booked_fees',
      header: 'Courier Cost',
      accessor: (w) => <span className="text-kumo-strong font-medium font-mono text-xs">{formatNaira(w.booked_fees)}</span>,
      sortValue: (w) => w.booked_fees,
    },
    {
      key: 'net',
      header: 'Fee Variance',
      accessor: (w) => {
        return (
          <span className="font-semibold text-xs font-mono text-kumo-strong">
            {w.net > 0 ? `+${formatNaira(w.net)}` : formatNaira(w.net)}
          </span>
        )
      },
      sortValue: (w) => w.net,
    },
    {
      key: 'breakdown',
      header: 'Variance Breakdown',
      defaultWidth: 200,
      accessor: (w) => (
        <div className="flex items-center gap-1.5 text-xs font-sans shrink-0">
          <span className="px-1.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-medium whitespace-nowrap shrink-0">
            {w.loss_count} loss
          </span>
          <span className="px-1.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-medium whitespace-nowrap shrink-0">
            {w.gain_count} gain
          </span>
          <span className="px-1.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 font-medium whitespace-nowrap shrink-0">
            {w.even_count} even
          </span>
        </div>
      ),
    },
  ]

  // Columns for Courier Deliveries & Fee Verification Engine
  const verificationColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (d) => (
        <div>
          <span className="font-semibold text-xs text-kumo-strong font-sans">{d.order_ref}</span>
          <span className="text-[11px] text-kumo-subtle block font-sans truncate max-w-[150px]">{d.items_summary}</span>
        </div>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer',
      header: 'Customer & Destination',
      accessor: (d) => (
        <div className="max-w-[220px]">
          <div className="font-medium text-xs text-kumo-strong font-sans truncate">{d.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle font-sans flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>{d.phone}</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans truncate mt-0.5" title={d.address}>
            {d.address}
          </div>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'assigned_rider',
      header: 'Courier Partner',
      accessor: (d) => (
        <div className="space-y-1">
          <div className="font-semibold text-xs text-kumo-strong font-sans">
            {d.assigned_rider || d.third_party_provider || '3PL Courier'}
          </div>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 capitalize">
            {d.status === 'delivered' ? 'Delivered' : d.status.replace('_', ' ')}
          </span>
        </div>
      ),
      sortValue: (d) => d.assigned_rider,
    },
    {
      key: 'fees',
      header: 'Fee Comparison',
      accessor: (d) => {
        const diff = d.delivery_fee - (d.booked_fee || 0)
        const hasSubsidy = diff < 0
        return (
          <div className="space-y-0.5 font-sans text-xs min-w-[140px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-kumo-subtle text-[11px]">Customer:</span>
              <span className="text-kumo-strong font-mono font-medium">{formatNaira(d.delivery_fee)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-kumo-subtle text-[11px]">Courier:</span>
              <span className="text-kumo-strong font-mono font-medium">{formatNaira(d.booked_fee || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-0.5 border-t border-kumo-line font-mono font-semibold">
              <span className="font-sans font-normal text-kumo-subtle text-[11px]">Variance:</span>
              <span className={hasSubsidy ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-900 dark:text-zinc-100'}>
                {hasSubsidy ? `-${formatNaira(Math.abs(diff))}` : `+${formatNaira(diff)}`}
              </span>
            </div>
          </div>
        )
      },
      sortValue: (d) => (d.delivery_fee - (d.booked_fee || 0)),
    },
    {
      key: 'evidence',
      header: 'Waybill Slip',
      accessor: (d) => {
        if (d.fee_evidence_path) {
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                <img src={d.fee_evidence_path} alt="Waybill" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-medium text-kumo-subtle">Attached</span>
            </div>
          )
        }
        return <span className="text-[11px] text-zinc-400 font-sans italic">No receipt</span>
      }
    },
    {
      key: 'fee_verify_status',
      header: 'Status',
      accessor: (d) => {
        const badgeMap = {
          approved: { status: 'active' as const, label: 'approved' },
          flagged: { status: 'flagged' as const, label: 'flagged' },
          pending: { status: 'pending' as const, label: 'pending audit' },
          none: { status: 'pending' as const, label: 'pending receipt' }
        }
        const b = badgeMap[d.fee_verify_status] || { status: 'pending' as const, label: d.fee_verify_status }
        return <StatusBadge status={b.status} label={b.label} />
      },
      sortValue: (d) => d.fee_verify_status,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 150,
      accessor: (d) => (
        <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 shrink-0">
          {d.fee_verify_status === 'approved' ? (
            <TableActionButton
              variant="secondary"
              icon={<Eye />}
              iconStrokeWidth={2}
              onClick={() => handleOpenEvidence(d)}
            >
              View Invoice
            </TableActionButton>
          ) : d.fee_verify_status === 'flagged' ? (
            <TableActionButton
              variant="warning"
              icon={<AlertTriangle />}
              iconStrokeWidth={2}
              onClick={() => handleOpenEvidence(d)}
            >
              Review Flagged
            </TableActionButton>
          ) : (
            <TableActionButton
              variant="primary"
              icon={<Receipt />}
              iconStrokeWidth={2}
              onClick={() => handleOpenEvidence(d)}
            >
              Audit Invoice
            </TableActionButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Third Party Delivery & Invoice Audit"
        subtitle="Monitor delivery charges billed to customers versus actual courier fees invoiced by delivery partners."
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Courier Deliveries"
          value={`${totalDeliveriesCount} trips`}
          description={pendingAuditCount > 0 ? `${pendingAuditCount} pending audit` : "All invoices settled"}
          icon={<Building className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Customer Delivery Fees"
          value={formatNaira(totalOrderFees)}
          description="Collected on website / POS"
          icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Courier Booked Payouts"
          value={formatNaira(totalBookedFees)}
          description="Invoices billed by couriers"
          icon={<Receipt className="w-4 h-4 text-zinc-500" />}
        />
        <MetricCard
          title="Fee Variance"
          value={formatNaira(netVariance)}
          description={netVariance === 0 ? "No fee variance / balanced" : (netVariance < 0 ? "Delivery subsidy absorbed" : "Positive margin realized")}
          icon={netVariance === 0 ? <Scale className="w-4 h-4 text-zinc-500" /> : (netVariance < 0 ? <TrendingDown className="w-4 h-4 text-zinc-500" /> : <TrendingUp className="w-4 h-4 text-zinc-500" />)}
        />
      </div>

      {/* Primary Navigation Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val: string) => setActiveTab(val as any)}
          tabs={[
            { id: 'verification', label: 'Deliveries', badge: tpDeliveries.length },
            { id: 'variance', label: 'Weekly Summary', badge: effectiveWeeklySummaries.length },
          ]}
        />
      </div>

      {/* Active Table */}
      <div>
        {activeTab === 'variance' ? (
          <DataTable
            data={effectiveWeeklySummaries}
            columns={weeklyColumns}
            searchable={false}
            title="Weekly Fee Summary"
            exportFilename="smokey-3pl-weekly-variance"
          />
        ) : (
          <div className="space-y-3">
            {/* Sub-filter pills for Deliveries */}
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1">
              {[
                { key: 'all' as const, label: 'All Deliveries', count: tpDeliveries.length },
                { key: 'pending' as const, label: 'Pending Audit', count: pendingAuditCount },
                { key: 'approved' as const, label: 'Approved', count: approvedCount },
                { key: 'flagged' as const, label: 'Flagged', count: flaggedCount },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === f.key
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === f.key
                      ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-800'
                      : 'bg-zinc-200/70 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <DataTable
              data={filteredDeliveries}
              columns={verificationColumns}
              searchable={true}
              searchPlaceholder="Search order ref, customer, address, or courier..."
              title="Outsourced Delivery"
              exportFilename="smokey-3pl-deliveries-verification"
              onRowClick={(d) => handleOpenEvidence(d)}
            />
          </div>
        )}
      </div>

      {/* MODAL: Fee Verification & Evidence */}
      <Dialog
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title={`Audit Courier Invoice: ${selectedDelivery?.order_ref}`}
        description="Verify courier waybill receipt and approve or flag billing discrepancies."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setIsEvidenceModalOpen(false)}
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              {selectedDelivery?.fee_verify_status !== 'flagged' && (
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => handleActionVerify('flagged')}
                >
                  Flag Overcharge
                </Button>
              )}
              {selectedDelivery?.fee_verify_status !== 'approved' && (
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() => handleActionVerify('approved')}
                >
                  Approve Invoice
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 font-sans text-xs">
          {/* Master Divided Card Container */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
            
            {/* Section 1: Dispatch & Route Overview */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Dispatch & Routing Manifest
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  {selectedDelivery?.delivery_ref}
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Courier Partner</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedDelivery?.assigned_rider}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Recipient Customer</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                    {selectedDelivery?.customer_name} {selectedDelivery?.phone && `(${selectedDelivery.phone})`}
                  </span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Destination</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium flex-1 leading-snug">{selectedDelivery?.address}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Ordered Meals</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium flex-1 leading-snug">{selectedDelivery?.items_summary}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Financial Fee Breakdown */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Fare Audit &amp; Discrepancy
                </span>
                {selectedDelivery && (
                  <StatusBadge
                    status={
                      selectedDelivery.fee_verify_status === 'approved'
                        ? 'active'
                        : selectedDelivery.fee_verify_status === 'flagged'
                        ? 'flagged'
                        : 'pending'
                    }
                    label={
                      selectedDelivery.fee_verify_status === 'pending'
                        ? 'pending audit'
                        : selectedDelivery.fee_verify_status === 'none'
                        ? 'pending receipt'
                        : selectedDelivery.fee_verify_status
                    }
                  />
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Paid Fare</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                    {formatNaira(selectedDelivery?.delivery_fee || 0)}
                  </span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Billed Courier Invoice</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">
                    {formatNaira(selectedDelivery?.booked_fee || 0)}
                  </span>
                </div>
                {(() => {
                  const variance = (selectedDelivery?.delivery_fee || 0) - (selectedDelivery?.booked_fee || 0)
                  const hasOvercharge = variance < 0
                  return (
                    <div className="flex items-start text-[13px] pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Variance / Balance</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {hasOvercharge ? `-${formatNaira(Math.abs(variance))}` : `+${formatNaira(variance)}`}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                          {hasOvercharge ? 'Subsidy Overcharge' : 'Within Budget'}
                        </span>
                      </div>
                    </div>
                  )
                })()}
                {selectedDelivery?.notes && (
                  <div className="flex items-start text-[13px] pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Audit &amp; Dispatch Notes</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-normal flex-1 leading-snug">{selectedDelivery.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Waybill Attachment */}
            <div className="p-4 space-y-3 bg-zinc-50/60 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      Waybill Proof of Delivery Slip
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {selectedDelivery?.fee_evidence_path
                        ? `Receipt attached for Order ${selectedDelivery.order_ref}`
                        : 'No waybill receipt image attached'}
                    </div>
                  </div>
                </div>

                {selectedDelivery?.fee_evidence_path && (
                  <a
                    href={selectedDelivery.fee_evidence_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 transition shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full Size</span>
                  </a>
                )}
              </div>

              {selectedDelivery?.fee_evidence_path ? (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-950 flex items-center justify-center max-h-64 p-2">
                  <img
                    src={selectedDelivery.fee_evidence_path}
                    alt="Waybill Proof of Delivery Slip"
                    className="max-h-60 w-auto object-contain rounded"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No fare screenshot or waybill image was uploaded when this courier trip was assigned.
                </div>
              )}
            </div>
          </div>

          <Input
            label="Audit Notes (Optional for Flagging or Approval)"
            placeholder="e.g. Fare subsidy approved due to rush hour surge"
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  )
}

export default ThirdPartyLogisticsPage