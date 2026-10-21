import React, { useState } from 'react'
import { INITIAL_PURCHASE_ORDERS } from '@/lib/mockData'
import { PurchaseOrder } from '@/types/inventory'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { formatNaira, formatShortDate } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

export const ProcurementPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false)
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})

  const handleOpenReceiving = (po: PurchaseOrder) => {
    setSelectedPO(po)
    const initial: Record<string, number> = {}
    po.items.forEach(item => {
      initial[item.id] = item.quantity_ordered
    })
    setReceivedQuantities(initial)
    setIsReceivingModalOpen(true)
  }

  const handleConfirmReceiving = () => {
    if (!selectedPO) return

    let allComplete = true
    let anyReceived = false

    const updatedItems = selectedPO.items.map(item => {
      const qtyReceived = receivedQuantities[item.id] || 0
      if (qtyReceived > 0) anyReceived = true
      if (qtyReceived < item.quantity_ordered) allComplete = false
      return {
        ...item,
        quantity_received: qtyReceived,
      }
    })

    const newStatus = allComplete ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : 'ISSUED'

    setPurchaseOrders(prev =>
      prev.map(p =>
        p.id === selectedPO.id
          ? {
              ...p,
              items: updatedItems,
              status: newStatus as any,
            }
          : p
      )
    )

    setIsReceivingModalOpen(false)
  }

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      key: 'po_number',
      header: 'PO Number',
      sortable: true,
      sortValue: po => po.po_number,
      accessor: po => (
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          {po.po_number}
        </span>
      ),
    },
    {
      key: 'supplier_name',
      header: 'Supplier & Contact',
      sortable: true,
      sortValue: po => po.supplier_name,
      accessor: po => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {po.supplier_name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{po.supplier_email}</span>
        </div>
      ),
    },
    {
      key: 'order_date',
      header: 'Order Date',
      sortable: true,
      sortValue: po => po.order_date,
      accessor: po => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {formatShortDate(po.order_date)}
        </span>
      ),
    },
    {
      key: 'expected_delivery',
      header: 'Expected Delivery',
      sortable: true,
      sortValue: po => po.expected_delivery,
      accessor: po => (
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
          {formatShortDate(po.expected_delivery)}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Order Value',
      sortable: true,
      align: 'right',
      sortValue: po => po.total_amount,
      accessor: po => (
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          {formatNaira(po.total_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      defaultWidth: 160,
      accessor: po => <StatusBadge status={po.status} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Procurement & Purchase Orders
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Manage raw ingredient orders, supplier lead times, and warehouse dock receiving inspections.
          </p>
        </div>
      </div>

      <DataTable
        title="Vendor Purchase Orders and Shipments"
        data={purchaseOrders}
        columns={columns}
        keyExtractor={po => po.id}
        searchablePlaceholder="Search POs by number or supplier..."
        secondaryAction={{
          label: 'Export POs',
          onClick: () => {},
        }}
        searchFilter={(po, q) =>
          po.po_number.toLowerCase().includes(q) ||
          po.supplier_name.toLowerCase().includes(q)
        }
          rowActions={po => (
            <div className="flex items-center gap-1.5 justify-end shrink-0">
              {po.status !== 'RECEIVED' ? (
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => handleOpenReceiving(po)}
                  leftIcon={<CheckCircle2 className="w-3 h-3" />}
                  className="whitespace-nowrap shrink-0 flex-none"
                >
                  Receive Goods
                </Button>
              ) : (
                <span className="text-[11px] text-emerald-600 font-semibold font-mono whitespace-nowrap shrink-0">
                  Fully Received
                </span>
              )}
            </div>
          )}
        />

      {/* Goods Receiving Modal */}
      <Dialog
        isOpen={isReceivingModalOpen}
        onClose={() => setIsReceivingModalOpen(false)}
        title={`Goods Intake Inspection: ${selectedPO?.po_number}`}
        description="Verify physical delivered quantities against ordered specifications. Variances will update inventory and flag discrepancies."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReceivingModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReceiving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm Intake & Update Inventory
            </Button>
          </>
        }
      >
        {selectedPO && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-kumo-tint rounded-lg ring ring-kumo-line flex justify-between">
              <div>
                <span className="text-kumo-subtle text-[11px] block">Supplier</span>
                <p className="font-bold text-kumo-strong">{selectedPO.supplier_name}</p>
              </div>
              <div className="text-right">
                <span className="text-kumo-subtle text-[11px] block">Destination</span>
                <p className="font-bold text-kumo-strong">{selectedPO.warehouse_name}</p>
              </div>
            </div>

            <div className="rounded-lg ring ring-kumo-line overflow-x-auto bg-kumo-base">
              <table className="w-full text-left">
                <thead className="bg-kumo-tint text-[11px] uppercase font-semibold text-kumo-subtle border-b border-kumo-line">
                  <tr>
                    <th className="p-2.5 whitespace-nowrap">Item SKU & Name</th>
                    <th className="p-2.5 text-right whitespace-nowrap">Ordered</th>
                    <th className="p-2.5 text-right w-36 whitespace-nowrap">Delivered Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kumo-line">
                  {selectedPO.items.map(item => (
                    <tr key={item.id} className="hover:bg-kumo-tint/50 transition-colors">
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-kumo-strong">
                          {item.sku}
                        </span>
                        <p className="text-kumo-subtle text-[11px]">{item.name}</p>
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-kumo-default whitespace-nowrap">
                        {item.quantity_ordered} {item.uom}
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity_ordered * 1.5}
                          value={receivedQuantities[item.id] ?? item.quantity_ordered}
                          onChange={e =>
                            setReceivedQuantities({
                              ...receivedQuantities,
                              [item.id]: Number(e.target.value),
                            })
                          }
                          className="w-24 text-right h-8 px-2 rounded-lg ring ring-kumo-line bg-kumo-base text-kumo-default font-mono text-xs font-bold focus:ring-2 focus:ring-kumo-brand outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
