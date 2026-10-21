import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { Supplier } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatNaira } from '@/lib/utils'
import { 
  Building2, 
  CheckCircle2, 
  Truck, 
  DollarSign, 
  Plus, 
  Phone, 
  Mail, 
  MapPin 
} from 'lucide-react'

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier } = useSmokeyOps()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    category: 'Fresh Poultry & Proteins'
  })

  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter(s => s.is_active === 1).length
  const totalDeliveries = suppliers.reduce((acc, s) => acc + s.delivery_count, 0)
  const totalSpend = suppliers.reduce((acc, s) => acc + s.total_spend, 0)

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addSupplier({
      name: newSupplier.name,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address,
      category: newSupplier.category,
    })
    setNewSupplier({
      name: '',
      phone: '',
      email: '',
      address: '',
      category: 'Fresh Poultry & Proteins'
    })
    setIsAddModalOpen(false)
  }

  const columns: ColumnDef<Supplier>[] = [
    {
      key: 'supplier_ref',
      header: 'Supplier Code',
      accessor: (s) => <span className="font-medium text-xs text-kumo-strong font-sans">{s.supplier_ref}</span>,
      sortValue: (s) => s.supplier_ref,
    },
    {
      key: 'name',
      header: 'Vendor Name & Category',
      accessor: (s) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{s.name}</div>
          <div className="text-xs text-primary font-medium font-sans">{s.category}</div>
        </div>
      ),
      sortValue: (s) => s.name,
    },
    {
      key: 'contact',
      header: 'Contact Info',
      accessor: (s) => (
        <div className="space-y-0.5 text-xs text-kumo-subtle font-sans">
          {s.phone && (
            <div className="flex items-center gap-1 font-sans">
              <Phone className="w-3 h-3 text-kumo-subtle" />
              <span>{s.phone}</span>
            </div>
          )}
          {s.email && (
            <div className="flex items-center gap-1 font-sans">
              <Mail className="w-3 h-3 text-kumo-subtle" />
              <span>{s.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Location / Facility',
      accessor: (s) => (
        <span className="text-xs text-kumo-default max-w-xs truncate font-sans">
          {s.address || 'Lagos Depot'}
        </span>
      ),
    },
    {
      key: 'delivery_count',
      header: 'Deliveries Fulfilled',
      accessor: (s) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-kumo-surface text-kumo-default border border-kumo-line font-sans">
          {s.delivery_count} shipments
        </span>
      ),
      sortValue: (s) => s.delivery_count,
    },
    {
      key: 'total_spend',
      header: 'Total Spend (YTD)',
      accessor: (s) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(s.total_spend)}</span>,
      sortValue: (s) => s.total_spend,
    },
    {
      key: 'status',
      header: 'Vendor Status',
      accessor: (s) => <StatusBadge status={s.is_active ? 'active' : 'inactive'} label={s.is_active ? 'ACTIVE' : 'INACTIVE'} />,
      sortValue: (s) => s.is_active,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Suppliers & Vendor Procurement
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Registered live poultry farmers, agro-wholesale markets, firewood contractors, and food packaging manufacturers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="h-10 px-4 text-sm font-medium shadow-xs"
        >
          Add New Vendor
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Suppliers"
          value={totalSuppliers}
          description="Registered vendors"
          icon={<Building2 className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Active Vendors"
          value={activeSuppliers}
          description="In good regulatory standing"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Total Shipments Logged"
          value={totalDeliveries}
          description="Verified warehouse receipts"
          icon={<Truck className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Total Procurement Spend"
          value={formatNaira(totalSpend)}
          description="Cumulative procurement payout"
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Table */}
      <DataTable
        data={suppliers}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search vendor name, contact, category..."
        exportFilename="smokey-suppliers-directory"
      />

      {/* Add Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Supplier"
        description="Add a vendor profile with contact info and primary supply category."
      >
        <form onSubmit={handleConfirmAdd} className="space-y-4">
          <Input
            label="Supplier Business Name"
            placeholder="e.g. IBADAN POULTRY AGRO FARMS"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <Select
            label="Supply Category"
            value={newSupplier.category}
            onChange={(e) => setNewSupplier(prev => ({ ...prev, category: e.target.value }))}
            options={[
              { value: 'Fresh Poultry & Proteins', label: 'Fresh Poultry & Proteins (Guinea Fowls, Chicken, Turkey)' },
              { value: 'Spices & Dry Peppers', label: 'Spices & Dry Peppers' },
              { value: 'Smoker Firewood & Charcoal', label: 'Smoker Firewood & Charcoal' },
              { value: 'Food Grade Packaging & Bags', label: 'Food Grade Packaging & Bags' },
              { value: 'Cooking Oils & Seasonings', label: 'Cooking Oils & Seasonings' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="080..."
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="orders@vendor.ng"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <Input
            label="Depot / Farm Address"
            placeholder="Street, Town, State"
            value={newSupplier.address}
            onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
            required
          />

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line font-sans">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Register Supplier
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default SuppliersPage
