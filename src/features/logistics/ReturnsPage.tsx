import React, { useState } from 'react'
import { INITIAL_RETURNS } from '@/lib/mockData'
import { ReturnOrder } from '@/types/logistics'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { RotateCcw, ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react'

export const ReturnsPage: React.FC = () => {
  const [returns] = useState<ReturnOrder[]>(INITIAL_RETURNS)

  const columns: ColumnDef<ReturnOrder>[] = [
    {
      key: 'return_code',
      header: 'RMA Code',
      sortable: true,
      sortValue: r => r.return_code,
      accessor: r => (
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          {r.return_code}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Order Ref',
      sortable: true,
      sortValue: r => r.customer_name,
      accessor: r => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {r.customer_name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Order: {r.order_reference}</span>
        </div>
      ),
    },
    {
      key: 'item',
      header: 'Returned Item',
      accessor: r => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {r.item_name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Qty: {r.quantity} {r.uom}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Return Reason',
      accessor: r => (
        <span className="text-xs capitalize font-medium text-slate-700 dark:text-slate-300">
          {r.return_reason.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'disposition',
      header: 'Disposition Action',
      defaultWidth: 180,
      accessor: r => {
        const isRestocked = r.disposition === 'RESTOCKED'
        return (
          <span
            className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 inline-flex items-center ${
              isRestocked
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
            }`}
          >
            {r.disposition.replace(/_/g, ' ')}
          </span>
        )
      },
    },
    {
      key: 'inspector',
      header: 'Inspected By',
      accessor: r => (
        <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400">
          <span>{r.inspector_name || 'Pending'}</span>
          <span className="text-[10px] font-mono">{r.inspected_at ? formatDate(r.inspected_at) : '-'}</span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
          Returns & Exchanges
        </h1>
        <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
          Process customer returns, inspect meal condition, determine restock eligibility, and log discarded items.
        </p>
      </div>

      <DataTable
        title="Customer RMA Dispositions and Restock Records"
        data={returns}
        columns={columns}
        keyExtractor={r => r.id}
        searchablePlaceholder="Search RMA by customer, order, or reason..."
        secondaryAction={{
          label: 'Export RMA Logs',
          onClick: () => {},
        }}
        searchFilter={(r, q) =>
          r.return_code.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          r.order_reference.toLowerCase().includes(q) ||
          r.item_name.toLowerCase().includes(q)
        }
      />
    </div>
  )
}
