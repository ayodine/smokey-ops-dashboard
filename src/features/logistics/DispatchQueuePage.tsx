import React, { useState } from 'react'
import { INITIAL_DISPATCH_QUEUE } from '@/lib/mockData'
import { DispatchItem } from '@/types/logistics'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Printer, CheckCircle2, Send, Barcode, ShieldCheck, MapPin, Phone } from 'lucide-react'

export const DispatchQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<DispatchItem[]>(INITIAL_DISPATCH_QUEUE)
  const [selectedItem, setSelectedItem] = useState<DispatchItem | null>(null)
  const [isManifestOpen, setIsManifestOpen] = useState(false)

  const handleOpenManifest = (item: DispatchItem) => {
    setSelectedItem(item)
    setIsManifestOpen(true)
  }

  const handleConfirmDispatch = (item: DispatchItem) => {
    setQueue(prev =>
      prev.map(d => (d.id === item.id ? { ...d, status: 'DISPATCHED' } : d))
    )
    setIsManifestOpen(false)
  }

  const columns: ColumnDef<DispatchItem>[] = [
    {
      key: 'order_id',
      header: 'Order Reference',
      sortable: true,
      sortValue: d => d.order_id,
      accessor: d => (
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          {d.order_id}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer Details',
      sortable: true,
      sortValue: d => d.customer_name,
      accessor: d => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {d.customer_name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{d.customer_phone}</span>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Delivery Zone & Address',
      accessor: d => (
        <div className="flex flex-col max-w-xs">
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {d.delivery_zone}
          </span>
          <span className="text-[10px] text-slate-400 truncate">{d.delivery_address}</span>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Shipment Contents',
      accessor: d => (
        <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-sm block">
          {d.items_summary}
        </span>
      ),
    },
    {
      key: 'packages',
      header: 'Weight / Pack',
      align: 'right',
      accessor: d => (
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
          {d.weight_kg} kg ({d.package_count} pkgs)
        </span>
      ),
    },
    {
      key: 'urgency',
      header: 'Priority',
      accessor: d => {
        const isExpress = d.urgency === 'EXPRESS'
        return (
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
              isExpress
                ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {d.urgency}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: d => <StatusBadge status={d.status} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Dispatch Queue & Waybills
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Stage orders, print waybills, and dispatch packages to internal drivers or delivery companies.
          </p>
        </div>
      </div>

      <DataTable
        title="Active Dispatch Staging and Waybills"
        data={queue}
        columns={columns}
        keyExtractor={d => d.id}
        searchablePlaceholder="Search queue by customer, order, or destination..."
        secondaryAction={{
          label: 'Export Manifest',
          onClick: () => {},
        }}
        searchFilter={(d, q) =>
          d.order_id.toLowerCase().includes(q) ||
          d.customer_name.toLowerCase().includes(q) ||
          d.delivery_zone.toLowerCase().includes(q) ||
          d.delivery_address.toLowerCase().includes(q)
        }
        rowActions={item => (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              size="xs"
              variant="secondary"
              onClick={() => handleOpenManifest(item)}
              leftIcon={<Printer className="w-3 h-3" />}
            >
              Waybill
            </Button>
          </div>
        )}
      />

      {/* Printable Waybill Manifest Dialog */}
      <Dialog
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        title="Official Dispatch Waybill & Manifest"
        description="Printable customer waybill with security seal verification and carrier sign-off."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              Print Physical Slip
            </Button>
            {selectedItem && selectedItem.status !== 'DISPATCHED' && (
              <Button
                variant="brand"
                onClick={() => handleConfirmDispatch(selectedItem)}
                leftIcon={<Send className="w-4 h-4 fill-white" />}
              >
                Confirm Dispatch & Hand Over
              </Button>
            )}
          </>
        }
      >
        {selectedItem && (
          <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-[4px] space-y-4 text-xs">
            {/* Header / Barcode */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <span className="font-bold text-sm text-[#F38020]">SmokeyOps Logistics</span>
                <p className="font-mono text-slate-500">Waybill: WB-{selectedItem.order_id}</p>
              </div>
              <div className="flex flex-col items-end">
                <Barcode className="w-24 h-8" />
                <span className="font-mono text-[10px] text-slate-400">
                  {selectedItem.order_id}-PK{selectedItem.package_count}
                </span>
              </div>
            </div>

            {/* Recipient & Courier Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[3px] border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Destination Customer
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{selectedItem.customer_name}</p>
                <p className="text-slate-600 dark:text-slate-300">{selectedItem.delivery_address}</p>
                <p className="font-mono text-slate-500">{selectedItem.customer_phone}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[3px] border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Courier / Rider Partner
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedItem.assigned_carrier_name || 'Smokey Direct Fleet'}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedItem.assigned_rider_name || 'Rider Assigned at Gate'}
                </p>
                <p className="font-mono text-slate-500">Urgency: {selectedItem.urgency}</p>
              </div>
            </div>

            {/* Contents Checklist */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-[3px] p-3 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase text-slate-400">
                Itemized Package Verification
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedItem.items_summary}
              </p>
              <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                <span>Total Packages: {selectedItem.package_count} Units</span>
                <span>Gross Weight: {selectedItem.weight_kg} kg</span>
                <span>Security Seal: #SEAL-9981</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
