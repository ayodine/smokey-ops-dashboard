import React, { useState } from 'react'
import { INITIAL_WAREHOUSES } from '@/lib/mockData'
import { Warehouse } from '@/types/inventory'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Building2, MapPin, Phone, UserCheck, ShieldCheck } from 'lucide-react'

export const WarehousesPage: React.FC = () => {
  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES)

  const columns: ColumnDef<Warehouse>[] = [
    {
      key: 'code',
      header: 'Code & Facility Name',
      sortable: true,
      sortValue: w => w.name,
      accessor: w => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-100">
            <Building2 className="w-3.5 h-3.5 text-[#F38020]" />
            <span>{w.name}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{w.code}</span>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location / Address',
      accessor: w => (
        <div className="flex flex-col max-w-xs">
          <span className="text-xs text-slate-700 dark:text-slate-300">{w.city}</span>
          <span className="text-[10px] text-slate-400 truncate">{w.address}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Facility Type',
      sortable: true,
      sortValue: w => w.type,
      accessor: w => (
        <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {w.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity Utilization',
      sortable: true,
      align: 'right',
      sortValue: w => w.capacity_utilization,
      accessor: w => (
        <div className="flex items-center justify-end gap-2">
          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                w.capacity_utilization > 85 ? 'bg-red-500' : w.capacity_utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${w.capacity_utilization}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
            {w.capacity_utilization}%
          </span>
        </div>
      ),
    },
    {
      key: 'manager',
      header: 'Facility Lead & Contact',
      accessor: w => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{w.manager_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{w.contact_phone}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      defaultWidth: 140,
      accessor: w => <StatusBadge status={w.is_active ? 'ACTIVE' : 'INACTIVE'} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
          Facilities & Warehouse Network
        </h1>
        <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
          Directory of physical central kitchens, regional depots, cold-chain storage facilities, and bin storage layouts.
        </p>
      </div>

      <DataTable
        title="Operational Facilities and Cold Hubs"
        data={warehouses}
        columns={columns}
        keyExtractor={w => w.id}
        searchablePlaceholder="Search facilities by name, city, or code..."
        secondaryAction={{
          label: 'Export Hubs',
          onClick: () => {},
        }}
        searchFilter={(w, q) =>
          w.name.toLowerCase().includes(q) ||
          w.code.toLowerCase().includes(q) ||
          w.city.toLowerCase().includes(q)
        }
      />
    </div>
  )
}
