import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { ThirdPartyWeeklySummary, LogisticsDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { KumoTabs } from '@/components/ui/Tabs'
import { formatNaira, formatDate } from '@/lib/utils'
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
  X 
} from 'lucide-react'

export const ThirdPartyLogisticsPage: React.FC = () => {
  const { thirdPartySummaries, logisticsDeliveries, verifyThirdPartyFee } = useSmokeyOps()
  const [activeTab, setActiveTab] = useState<'variance' | 'verification'>('variance')
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false)
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
      accessor: (w) => (
        <div className="flex items-center gap-1.5 text-xs font-sans">
          <span className="px-1.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium">
            {w.loss_count} loss
          </span>
          <span className="px-1.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">
            {w.gain_count} gain
          </span>
          <span className="px-1.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 font-medium">
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
          approved: { status: 'active' as const, label: 'APPROVED' },
          flagged: { status: 'inactive' as const, label: 'FLAGGED' },
          pending: { status: 'pending' as const, label: 'PENDING' },
          none: { status: 'pending' as const, label: 'PENDING RECEIPT' }
        }
        const b = badgeMap[d.fee_verify_status]
        return <StatusBadge status={b.status} label={b.label} />
      },
      sortValue: (d) => d.fee_verify_status,
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (d) => (
        <button
          type="button"
          onClick={() => handleOpenEvidence(d)}
          className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
        >
          <Receipt className="w-3.5 h-3.5" />
          Audit Invoice
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Courier Fees & Delivery Audit
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Monitor delivery charges billed to customers versus actual courier fees invoiced by delivery partners.
          </p>
        </div>
      </div>

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
          />
        )}
      </div>

      {/* MODAL: Fee Verification & Evidence */}
      <Dialog
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title={`Audit Courier Invoice: ${selectedDelivery?.order_ref}`}
        description="Verify courier waybill receipt and approve or flag billing discrepancies."
      >
        <div className="space-y-4 font-sans">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Provider:</span>
              <span className="font-semibold text-kumo-strong">{selectedDelivery?.assigned_rider}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Destination:</span>
              <span className="text-kumo-strong font-medium truncate max-w-xs">{selectedDelivery?.address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Customer Paid:</span>
              <span className="text-emerald-600 font-semibold font-sans">{formatNaira(selectedDelivery?.delivery_fee || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-kumo-subtle font-medium">Booked / Invoiced Fee:</span>
              <span className="text-red-600 font-semibold font-sans">{formatNaira(selectedDelivery?.booked_fee || 0)}</span>
            </div>
          </div>

          <div className="p-3 bg-kumo-base border border-dashed border-kumo-line rounded-lg text-center font-sans">
            <FileText className="w-8 h-8 text-kumo-subtle mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-kumo-strong">Waybill Proof of Delivery Slip</div>
            <div className="text-[11px] text-kumo-subtle">waybill-{selectedDelivery?.order_ref?.toLowerCase()}.pdf • Verified by GPS dispatch</div>
          </div>

          <Input
            label="Audit Notes (Optional for Flagging)"
            placeholder="e.g. Courier surcharge exceeded quota by ₦700 due to rain spike"
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
          />

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line font-sans">
            <Button
              variant="outline"
              size="md"
              type="button"
              className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
              onClick={() => handleActionVerify('flagged')}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Flag Overcharge
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              onClick={() => handleActionVerify('approved')}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Approve Invoice
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
export default ThirdPartyLogisticsPage
