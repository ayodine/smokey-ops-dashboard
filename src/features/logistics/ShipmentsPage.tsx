import React, { useState } from 'react'
import { INITIAL_SHIPMENTS } from '@/lib/mockData'
import { Shipment } from '@/types/logistics'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { formatShortDate, formatDate } from '@/lib/utils'
import { Navigation, Clock, CheckCircle2, User, Phone, MapPin, Truck } from 'lucide-react'

export const ShipmentsPage: React.FC = () => {
  const [shipments] = useState<Shipment[]>(INITIAL_SHIPMENTS)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  const handleOpenTimeline = (s: Shipment) => {
    setSelectedShipment(s)
    setIsTimelineOpen(true)
  }

  const columns: ColumnDef<Shipment>[] = [
    {
      key: 'tracking_number',
      header: 'Tracking No',
      sortable: true,
      sortValue: s => s.tracking_number,
      accessor: s => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
            {s.tracking_number}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Ref: {s.order_reference}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Destination & Recipient',
      sortable: true,
      sortValue: s => s.customer_name,
      accessor: s => (
        <div className="flex flex-col max-w-xs">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {s.customer_name}
          </span>
          <span className="text-[10px] text-slate-400 truncate">{s.destination_address}</span>
        </div>
      ),
    },
    {
      key: 'rider',
      header: 'Courier / Assigned Rider',
      accessor: s => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {s.rider_name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{s.rider_phone}</span>
        </div>
      ),
    },
    {
      key: 'eta',
      header: 'Estimated Delivery',
      sortable: true,
      sortValue: s => s.estimated_delivery,
      accessor: s => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
          {formatDate(s.estimated_delivery)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Transit Status',
      defaultWidth: 160,
      accessor: s => <StatusBadge status={s.status} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Shipment Tracking & Carrier Milestones"
        subtitle="Monitor en-route deliveries, driver waypoints, customer handoffs, and digital proof of delivery."
      />

      <DataTable
        title="Live Transit Shipments and Carrier Waybills"
        data={shipments}
        columns={columns}
        keyExtractor={s => s.id}
        searchablePlaceholder="Search tracking number, customer, or rider..."
        secondaryAction={{
          label: 'Export Waybills',
          onClick: () => {},
        }}
        searchFilter={(s, q) =>
          s.tracking_number.toLowerCase().includes(q) ||
          s.customer_name.toLowerCase().includes(q) ||
          s.rider_name.toLowerCase().includes(q) ||
          s.destination_address.toLowerCase().includes(q)
        }
        rowActions={shipment => (
          <div className="flex items-center gap-1.5 justify-end">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenTimeline(shipment)}
              icon={<Navigation className="w-3.5 h-3.5" />}
            >
              Milestones
            </TableActionButton>
          </div>
        )}
      />

      {/* Shipment Milestones Timeline Dialog */}
      <Dialog
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        title={`Live Milestone Timeline: ${selectedShipment?.tracking_number}`}
        description="Chronological event log tracking goods movement from central kitchen loading dock to final recipient."
        maxWidth="lg"
      >
        {selectedShipment && (
          <div className="space-y-5 text-sm">
            {/* Header info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-[4px] border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {selectedShipment.customer_name}
                </span>
                <p className="font-mono text-slate-500 text-sm mt-0.5">
                  Zone: {selectedShipment.destination_zone} • Rider: {selectedShipment.rider_name}
                </p>
              </div>
              <StatusBadge status={selectedShipment.status} size="md" />
            </div>

            {/* Event Timeline */}
            <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
              {selectedShipment.events.map((ev, idx) => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-[#0051C3] text-white flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-slate-900">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {ev.title}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5">{ev.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[13px] text-slate-400 font-mono">
                      <span>Location: {ev.location}</span>
                      <span>•</span>
                      <span>Logged By: {ev.operator_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
