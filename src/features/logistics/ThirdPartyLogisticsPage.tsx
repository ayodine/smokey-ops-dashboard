import React, { useState } from 'react'
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
import { formatNaira, formatDate, cn } from '@/lib/utils'
import { 
  Building, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Receipt, 
  FileText, 
  Check, 
  X,
  Eye,
  Maximize2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'

export const ThirdPartyLogisticsPage: React.FC = () => {
  const { thirdPartySummaries, logisticsDeliveries, verifyThirdPartyFee } = useSmokeyOps()
  const [activeTab, setActiveTab] = useState<'variance' | 'verification'>('variance')
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false)
  const [isSlipViewerOpen, setIsSlipViewerOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<LogisticsDelivery | null>(null)
  const [verificationNote, setVerificationNote] = useState('')

  // 3rd party deliveries
  const tpDeliveries = logisticsDeliveries.filter(d => d.rider_type === 'third_party')

  // Cumulative KPIs
  const currentWeek = thirdPartySummaries[0]
  const totalDeliveriesCount = thirdPartySummaries.reduce((acc, w) => acc + w.delivery_count, 0)
  const totalOrderFees = thirdPartySummaries.reduce((acc, w) => acc + w.order_fees, 0)
  const totalBookedFees = thirdPartySummaries.reduce((acc, w) => acc + w.booked_fees, 0)
  const netVariance = totalOrderFees - totalBookedFees

  const handleOpenEvidence = (d: LogisticsDelivery) => {
    setSelectedDelivery(d)
    setVerificationNote('')
    setIsSlipViewerOpen(false)
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
      accessor: (w) => <span className="text-emerald-600 font-medium font-sans text-xs">{formatNaira(w.order_fees)}</span>,
      sortValue: (w) => w.order_fees,
    },
    {
      key: 'booked_fees',
      header: 'Courier Cost',
      accessor: (w) => <span className="text-red-600 font-medium font-sans text-xs">{formatNaira(w.booked_fees)}</span>,
      sortValue: (w) => w.booked_fees,
    },
    {
      key: 'net',
      header: 'Fee Variance',
      accessor: (w) => {
        const isLoss = w.net < 0
        return (
          <span className={`font-semibold text-xs font-sans ${isLoss ? 'text-red-600' : 'text-emerald-600'}`}>
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
          <span className="px-1.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 font-medium whitespace-nowrap shrink-0">
            {w.loss_count} loss
          </span>
          <span className="px-1.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 font-medium whitespace-nowrap shrink-0">
            {w.gain_count} gain
          </span>
          <span className="px-1.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-medium whitespace-nowrap shrink-0">
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
      accessor: (d) => <span className="font-medium text-xs text-kumo-strong font-sans">{d.order_ref}</span>,
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'assigned_rider',
      header: 'Courier',
      accessor: (d) => <span className="font-semibold text-kumo-strong font-sans">{d.assigned_rider}</span>,
      sortValue: (d) => d.assigned_rider,
    },
    {
      key: 'fees',
      header: 'Fee Comparison',
      accessor: (d) => {
        const diff = d.delivery_fee - (d.booked_fee || 0)
        return (
          <div className="space-y-0.5 font-sans text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-kumo-subtle">Customer:</span>
              <span className="text-emerald-600 font-medium">{formatNaira(d.delivery_fee)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-kumo-subtle">Booked:</span>
              <span className="text-red-600 font-medium">{formatNaira(d.booked_fee || 0)}</span>
            </div>
            <div className={`flex items-center justify-between gap-4 pt-0.5 border-t border-kumo-line font-medium ${diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              <span>Variance:</span>
              <span>{diff > 0 ? `+${formatNaira(diff)}` : formatNaira(diff)}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'fee_verify_status',
      header: 'Status',
      accessor: (d) => {
        const badgeMap = {
          approved: { status: 'active' as const, label: 'approved' },
          flagged: { status: 'flagged' as const, label: 'flagged' },
          pending: { status: 'pending' as const, label: 'pending' },
          none: { status: 'pending' as const, label: 'pending receipt' }
        }
        const b = badgeMap[d.fee_verify_status]
        return <StatusBadge status={b.status} label={b.label} />
      },
      sortValue: (d) => d.fee_verify_status,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
      accessor: (d) => (
        <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 shrink-0">
          <TableActionButton
            variant="primary"
            icon={<Receipt />}
            iconStrokeWidth={2}
            onClick={() => handleOpenEvidence(d)}
          >
            Audit Invoice
          </TableActionButton>
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
          description="Outsourced courier dispatches"
          icon={<Building className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Customer Delivery Fees"
          value={formatNaira(totalOrderFees)}
          description="Collected on website / POS"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Courier Booked Payouts"
          value={formatNaira(totalBookedFees)}
          description="Invoices paid to couriers"
          icon={<Receipt className="w-4 h-4 text-red-500" />}
        />
        <MetricCard
          title="Fee Variance"
          value={formatNaira(netVariance)}
          description={netVariance < 0 ? "Delivery subsidy absorbed by business" : "Positive margin realized"}
          icon={netVariance < 0 ? <TrendingDown className="w-4 h-4 text-red-600" /> : <TrendingUp className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val: string) => setActiveTab(val as any)}
          tabs={[
            { id: 'variance', label: 'Weekly Summary', badge: thirdPartySummaries.length },
            { id: 'verification', label: 'Deliveries', badge: tpDeliveries.length },
          ]}
        />
      </div>

      {/* Active Table */}
      <div>
        {activeTab === 'variance' ? (
          <DataTable
            data={thirdPartySummaries}
            columns={weeklyColumns}
            searchable={false}
            title="Weekly Fee Summary"
            exportFilename="smokey-3pl-weekly-variance"
          />
        ) : (
          <DataTable
            data={tpDeliveries}
            columns={verificationColumns}
            searchable={true}
            searchPlaceholder="Search order ref or courier..."
            title="Outsourced Delivery"
            exportFilename="smokey-3pl-deliveries-verification"
            onRowClick={(d) => handleOpenEvidence(d)}
          />
        )}
      </div>

      {/* MODAL: Fee Verification & Evidence */}
      <Dialog
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title={`Audit Courier Invoice: ${selectedDelivery?.order_ref}`}
        description="Verify courier waybill receipt and approve or flag billing discrepancies."
        maxWidth="lg"
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
              <Button
                variant="outline"
                size="md"
                type="button"
                className="text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                onClick={() => handleActionVerify('flagged')}
              >
                Flag Overcharge
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => handleActionVerify('approved')}
              >
                Approve Invoice
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 font-sans">
          {/* Unified Invoice Summary Card */}
          <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-xl space-y-2.5 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-kumo-line/60">
              <div>
                <div className="text-[11px] text-kumo-subtle uppercase tracking-wider font-semibold">Courier Provider</div>
                <div className="text-sm font-semibold text-kumo-strong mt-0.5">{selectedDelivery?.assigned_rider}</div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[11px] text-kumo-subtle uppercase tracking-wider font-semibold">Destination</div>
                <div className="text-xs font-medium text-kumo-default truncate max-w-xs mt-0.5">{selectedDelivery?.address}</div>
              </div>
            </div>

            {/* Financial Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-kumo-base border border-kumo-line rounded-lg">
                <span className="text-[11px] text-kumo-subtle block font-medium">Customer Paid</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-600 block mt-0.5">
                  {formatNaira(selectedDelivery?.delivery_fee || 0)}
                </span>
              </div>
              <div className="p-2 bg-kumo-base border border-kumo-line rounded-lg">
                <span className="text-[11px] text-kumo-subtle block font-medium">Billed Courier Fee</span>
                <span className="text-xs sm:text-sm font-bold text-red-600 block mt-0.5">
                  {formatNaira(selectedDelivery?.booked_fee || 0)}
                </span>
              </div>
              <div className="p-2 bg-kumo-base border border-kumo-line rounded-lg">
                <span className="text-[11px] text-kumo-subtle block font-medium">Variance</span>
                <span className={cn(
                  "text-xs sm:text-sm font-bold block mt-0.5",
                  ((selectedDelivery?.delivery_fee || 0) - (selectedDelivery?.booked_fee || 0)) < 0 ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {((selectedDelivery?.delivery_fee || 0) - (selectedDelivery?.booked_fee || 0)) < 0
                    ? `-${formatNaira(Math.abs((selectedDelivery?.delivery_fee || 0) - (selectedDelivery?.booked_fee || 0)))}`
                    : `+${formatNaira((selectedDelivery?.delivery_fee || 0) - (selectedDelivery?.booked_fee || 0))}`}
                </span>
              </div>
            </div>
          </div>

          {/* Clean Waybill Proof Attachment Row */}
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-kumo-base border border-kumo-line text-kumo-strong flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-kumo-subtle" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-kumo-strong truncate">
                  Waybill Proof of Delivery Slip
                </div>
                <div className="text-[11px] text-kumo-subtle truncate mt-0.5">
                  WB-{selectedDelivery?.order_ref}-POD • Verified GPS Dispatch
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsSlipViewerOpen(true)}
              className="shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Inspect Slip</span>
            </Button>
          </div>

          <Input
            label="Audit Notes (Optional for Flagging)"
            placeholder="e.g. Courier surcharge exceeded quota by ₦700 due to weather surge"
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
          />
        </div>
      </Dialog>

      {/* MODAL: Full View of Waybill Proof of Delivery Slip */}
      <Dialog
        isOpen={isSlipViewerOpen}
        onClose={() => setIsSlipViewerOpen(false)}
        title={`Waybill Proof of Delivery: ${selectedDelivery?.order_ref}`}
        description={`Delivery proof and billed courier receipt for ${selectedDelivery?.assigned_rider}`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" onClick={() => setIsSlipViewerOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 font-sans">
          {selectedDelivery?.fee_evidence_path?.startsWith('data:') ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-kumo-line overflow-hidden bg-black/90 flex items-center justify-center max-h-[60vh] p-2">
                <img
                  src={selectedDelivery.fee_evidence_path}
                  alt="Waybill Proof of Delivery Slip"
                  className="max-h-[55vh] w-auto object-contain rounded"
                />
              </div>
              <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle font-medium">Uploaded At:</span>
                  <span className="text-kumo-strong font-semibold">Courier Assignment</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle font-medium">Billed Fare on Receipt:</span>
                  <span className="text-red-600 font-semibold">{formatNaira(selectedDelivery?.booked_fee || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle font-medium">Customer Paid:</span>
                  <span className="text-emerald-600 font-semibold">{formatNaira(selectedDelivery?.delivery_fee || 0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-kumo-line bg-kumo-base p-4 space-y-3 shadow-2xs">
              <div className="flex items-start justify-between border-b border-kumo-line pb-2.5">
                <div>
                  <div className="text-[11px] tracking-wider uppercase font-bold text-amber-600">SMOKEY HUT DELIGHT • OFFICIAL COURIER WAYBILL</div>
                  <div className="text-base font-semibold text-kumo-strong mt-0.5">Proof of Delivery & Fare Slip</div>
                  <div className="text-xs text-kumo-subtle font-mono mt-0.5">WAYBILL NO: WB-{selectedDelivery?.order_ref}-POD</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                  SIGNED & DELIVERED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-kumo-subtle block text-[11px]">Courier Partner</span>
                  <span className="font-semibold text-kumo-strong">{selectedDelivery?.assigned_rider}</span>
                </div>
                <div>
                  <span className="text-kumo-subtle block text-[11px]">Dispatch Date</span>
                  <span className="font-semibold text-kumo-strong">{selectedDelivery?.dispatch_date}</span>
                </div>
                <div>
                  <span className="text-kumo-subtle block text-[11px]">Recipient Customer</span>
                  <span className="font-semibold text-kumo-strong">{selectedDelivery?.customer_name}</span>
                  <span className="text-[11px] text-kumo-subtle block">{selectedDelivery?.phone}</span>
                </div>
                <div>
                  <span className="text-kumo-subtle block text-[11px]">Destination Address</span>
                  <span className="font-medium text-kumo-strong block truncate">{selectedDelivery?.address}</span>
                </div>
              </div>

              <div className="p-2.5 bg-kumo-surface rounded-lg border border-kumo-line space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle">Meals Delivered:</span>
                  <span className="font-medium text-kumo-strong">{selectedDelivery?.items_summary}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle">Courier Invoiced Fare:</span>
                  <span className="font-bold text-red-600">{formatNaira(selectedDelivery?.booked_fee || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-kumo-subtle">Customer Paid Delivery Fee:</span>
                  <span className="font-semibold text-emerald-600">{formatNaira(selectedDelivery?.delivery_fee || 0)}</span>
                </div>
              </div>

              <div className="border border-dashed border-kumo-line rounded-lg p-2.5 bg-kumo-canvas flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-kumo-strong flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Courier Dispatch Sign-Off
                  </div>
                  <div className="text-[11px] text-kumo-subtle font-mono">GPS Verified Handover • Ref #{selectedDelivery?.delivery_ref}</div>
                </div>
                <div className="border-2 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] px-2 py-0.5 rounded rotate-[-3deg] uppercase tracking-wider">
                  Verified Carrier POD
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
export default ThirdPartyLogisticsPage
