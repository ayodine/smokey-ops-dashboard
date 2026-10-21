import React, { useState } from 'react'
import { INITIAL_PRODUCTION_ORDERS } from '@/lib/mockData'
import { ProductionOrder, ProductionStatus } from '@/types/production'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import {
  Flame,
  CheckCircle2,
  Play,
  Check,
  ShieldCheck
} from 'lucide-react'

const LIFECYCLE_STEPS: { status: ProductionStatus; label: string }[] = [
  { status: 'DRAFT', label: '1. Draft' },
  { status: 'PLANNED', label: '2. Planned' },
  { status: 'MATERIALS_RESERVED', label: '3. Reserved' },
  { status: 'READY_TO_PRODUCE', label: '4. Ready' },
  { status: 'IN_PRODUCTION', label: '5. In Pit' },
  { status: 'QUALITY_CHECK', label: '6. QC Audit' },
  { status: 'COMPLETED', label: '7. Completed' },
  { status: 'CLOSED', label: '8. Closed' },
]

export const ProductionOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>(INITIAL_PRODUCTION_ORDERS)
  const [activeOrder, setActiveOrder] = useState<ProductionOrder>(INITIAL_PRODUCTION_ORDERS[1]) // currently in production

  // Modal for QC and Completion
  const [isQCModalOpen, setIsQCModalOpen] = useState(false)
  const [coreTemp, setCoreTemp] = useState<number>(76)
  const [soundUnits, setSoundUnits] = useState<number>(activeOrder.planned_quantity - 1)
  const [scrapUnits, setScrapUnits] = useState<number>(1)
  const [qcNotes, setQcNotes] = useState<string>('Internal temperature verified at 76C. Smoke ring depth 3mm.')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step Index Helper
  const getStepIndex = (status: ProductionStatus) => {
    return LIFECYCLE_STEPS.findIndex(s => s.status === status)
  }

  // Advance Lifecycle State with Prerequisite Checks
  const handleAdvanceState = (targetStatus: ProductionStatus) => {
    if (targetStatus === 'COMPLETED') {
      setIsQCModalOpen(true)
      return
    }

    setOrders(prev =>
      prev.map(o => (o.id === activeOrder.id ? { ...o, status: targetStatus } : o))
    )
    setActiveOrder(prev => ({ ...prev, status: targetStatus }))
  }

  // Submit QC & Finished Goods Receipt
  const handleConfirmCompletion = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      const updated: ProductionOrder = {
        ...activeOrder,
        status: 'COMPLETED',
        actual_quantity_produced: soundUnits,
        scrap_quantity: scrapUnits,
        notes: `${activeOrder.notes || ''} | QC Passed at ${coreTemp}°C by Inspector Ayobami. ${soundUnits} units credited to finished inventory.`,
      }

      setOrders(prev => prev.map(o => (o.id === activeOrder.id ? updated : o)))
      setActiveOrder(updated)
      setIsSubmitting(false)
      setIsQCModalOpen(false)
    }, 450)
  }

  const currentStepIdx = getStepIndex(activeOrder.status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Production Orders
          </h1>
          <p className="text-xs text-kumo-subtle mt-0.5">
            Track kitchen cooking stages from raw meat preparation to smoker pits and final packaging.
          </p>
        </div>
      </div>

      {/* Interactive 8-Stage Lifecycle Stepper Plate */}
      <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-5 shadow-xs space-y-5 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kumo-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-kumo-brand">
                {activeOrder.order_code}
              </span>
              <span className="text-kumo-subtle opacity-40">•</span>
              <h2 className="text-base font-bold text-kumo-strong">
                {activeOrder.finished_product_name}
              </h2>
            </div>
            <p className="text-xs text-kumo-subtle font-mono mt-0.5">
              Work Center: {activeOrder.work_center} • Operator: {activeOrder.assigned_operator_name} • Target: {activeOrder.planned_quantity} {activeOrder.uom}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={activeOrder.status} size="md" />
          </div>
        </div>

        {/* 8-Step Visual Stepper */}
        <div className="py-2 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] relative">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-kumo-line z-0" />
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={step.status} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-kumo-brand text-white ring-4 ring-kumo-brand/20'
                        : isPast
                        ? 'bg-kumo-brand text-white'
                        : 'bg-kumo-base ring ring-kumo-line text-kumo-subtle'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 whitespace-nowrap ${
                      isCurrent
                        ? 'text-kumo-link font-bold'
                        : isPast
                        ? 'text-kumo-strong'
                        : 'text-kumo-subtle'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Controls for Active Step */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-[6px] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-[#F38020]" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Current Operational Action:
              </span>
              <p className="text-slate-500">
                {activeOrder.status === 'IN_PRODUCTION'
                  ? 'Batch currently inside Pit 2. Monitor core temperatures before transferring to QC inspection.'
                  : activeOrder.status === 'QUALITY_CHECK'
                  ? 'Batch harvested. Awaiting QC inspector sign-off to credit finished stock.'
                  : activeOrder.status === 'COMPLETED'
                  ? 'Batch successfully verified. 48 units credited to products.stock in Supabase.'
                  : 'Staged and ready for pit loading.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeOrder.status === 'MATERIALS_RESERVED' && (
              <Button
                variant="primary"
                onClick={() => handleAdvanceState('READY_TO_PRODUCE')}
              >
                Mark Materials Picked & Staged
              </Button>
            )}

            {activeOrder.status === 'READY_TO_PRODUCE' && (
              <Button
                variant="brand"
                onClick={() => handleAdvanceState('IN_PRODUCTION')}
                leftIcon={<Play className="w-4 h-4 fill-white" />}
              >
                Light Smokery Pit (Start Run)
              </Button>
            )}

            {activeOrder.status === 'IN_PRODUCTION' && (
              <Button
                variant="primary"
                onClick={() => handleAdvanceState('QUALITY_CHECK')}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Harvest Batch & Send to QC
              </Button>
            )}

            {activeOrder.status === 'QUALITY_CHECK' && (
              <Button
                variant="primary"
                onClick={() => handleAdvanceState('COMPLETED')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Inspect & Confirm Finished Stock Receipt
              </Button>
            )}

            {activeOrder.status === 'COMPLETED' && (
              <Button
                variant="secondary"
                onClick={() => handleAdvanceState('CLOSED')}
              >
                Close Production Order
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Selection Table */}
      <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-5 shadow-xs space-y-3 font-sans">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-kumo-subtle font-mono">
          Select Active Production Batch to Control
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {orders.map(o => {
            const isSelected = o.id === activeOrder.id
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setActiveOrder(o)}
                className={`p-3.5 rounded-lg ring text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-kumo-brand bg-kumo-brand/10'
                    : 'ring-kumo-line bg-kumo-base hover:bg-kumo-tint'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-kumo-strong">
                    {o.order_code}
                  </span>
                  <StatusBadge status={o.status} size="sm" />
                </div>
                <p className="font-semibold text-xs text-kumo-strong mt-1 truncate">
                  {o.finished_product_name}
                </p>
                <p className="text-[11px] text-kumo-subtle font-mono mt-1">
                  {o.work_center} • Planned: {o.planned_quantity} {o.uom}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* QC & Completion Dialog */}
      <Dialog
        isOpen={isQCModalOpen}
        onClose={() => setIsQCModalOpen(false)}
        title="Quality Inspection & Stock Credit Receipt"
        description="Verify food safety temperature logs and record sound vs. scrap units. Approved sound units will immediately credit the products.stock table."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsQCModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleConfirmCompletion}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Sign QC & Credit {soundUnits} Units to Stock
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[4px] border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {activeOrder.finished_product_name}
              </span>
              <p className="font-mono text-slate-500">{activeOrder.order_code} • Target: {activeOrder.planned_quantity} units</p>
            </div>
            <StatusBadge status="QUALITY_CHECK" size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Core Temperature Log (°C)"
              type="number"
              value={coreTemp}
              onChange={e => setCoreTemp(Number(e.target.value))}
              helperText="Must be >= 75°C to satisfy food safety regulations"
              required
            />
            <Input
              label="Sound Units Produced (Pass)"
              type="number"
              value={soundUnits}
              onChange={e => setSoundUnits(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Scrap / Defective Units"
              type="number"
              value={scrapUnits}
              onChange={e => setScrapUnits(Number(e.target.value))}
              helperText="Logged directly to production scrap ledger"
            />
            <Input
              label="Inspector Name"
              defaultValue="Ayobami (Quality Lead)"
              readOnly
            />
          </div>

          <Input
            label="Sensory & Inspection Notes"
            value={qcNotes}
            onChange={e => setQcNotes(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  )
}
