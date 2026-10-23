import React, { useState } from 'react'
import { useWarehouse } from '@/context/WarehouseContext'
import { Warehouse } from '@/types/inventory'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Building2, Plus } from 'lucide-react'

export const WarehousesPage: React.FC = () => {
  const { facilities, addFacility } = useWarehouse()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    city: 'Lagos',
    address: '',
  })

  const handleOpenAdd = () => {
    setForm({
      name: '',
      code: `DEPOT-${String(facilities.length + 1).padStart(2, '0')}`,
      city: 'Lagos',
      address: '',
    })
    setIsAddModalOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addFacility({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase() || `FAC-${Date.now().toString().slice(-4)}`,
      city: form.city.trim() || 'Lagos',
      address: form.address.trim(),
    })
    setIsAddModalOpen(false)
  }

  const warehouses: Warehouse[] = facilities.map(f => ({
    id: f.id,
    code: f.code,
    name: f.name,
    address: f.address || `${f.name}, ${f.city}`,
    city: f.city,
    type: f.type || 'warehouse',
    total_skus: f.total_skus || 24,
    capacity_utilization: f.capacity_utilization || 50,
    manager_name: f.manager_name || 'Operations Lead',
    contact_phone: f.contact_phone || '+234 800 000 0000',
    is_active: f.is_active !== false,
  }))

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
      <PageHeader
        title="Facilities & Warehouse Network"
        subtitle="Directory of physical central kitchens, regional depots, cold-chain storage facilities, and bin storage layouts."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Office / Branch
          </Button>
        }
      />

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

      {/* Register New Office / Branch Dialog */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Office / Branch"
        description="Add a regional branch office, fulfillment depot, or production kitchen."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Branch / Office Name"
            placeholder="e.g. Lekki Branch Office"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Branch / Office Code"
              placeholder="e.g. BR-LEKKI"
              value={form.code}
              onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
              required
            />
            <Input
              label="City / Region"
              placeholder="e.g. Lekki Phase 1, Lagos"
              value={form.city}
              onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Physical Street Address / Landmark"
            placeholder="e.g. Plot 12 Admiralty Way, Lekki, Lagos"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-kumo-line">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save & Register Office
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

