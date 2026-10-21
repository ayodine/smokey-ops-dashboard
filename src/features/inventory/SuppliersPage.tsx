import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { Supplier, RawDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { formatNaira, formatDate } from '@/lib/utils'
import { 
  Building2, 
  CheckCircle2, 
  Truck, 
  DollarSign, 
  Plus, 
  Phone, 
  Mail, 
  MapPin,
  Pencil,
  FileText,
  Boxes,
  Calendar,
  Layers,
  Save,
  Check
} from 'lucide-react'

const STANDARD_SUPPLY_CATEGORIES = [
  { value: 'Fresh Poultry & Proteins', label: 'Fresh Poultry & Proteins (Guinea Fowls, Chicken, Turkey)' },
  { value: 'Spices & Dry Peppers', label: 'Spices & Dry Peppers' },
  { value: 'Smoker Firewood & Charcoal', label: 'Smoker Firewood & Charcoal' },
  { value: 'Food Grade Packaging & Bags', label: 'Food Grade Packaging & Bags' },
  { value: 'Cooking Oils & Seasonings', label: 'Cooking Oils & Seasonings' },
]

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, rawDeliveries } = useSmokeyOps()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    category: 'Fresh Poultry & Proteins'
  })

  // Manage Supplier State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [editForm, setEditForm] = useState<Supplier | null>(null)
  const [manageTab, setManageTab] = useState<'profile' | 'supplies'>('profile')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter(s => s.is_active === 1).length
  const totalDeliveries = suppliers.reduce((acc, s) => acc + s.delivery_count, 0)
  const totalSpend = suppliers.reduce((acc, s) => acc + s.total_spend, 0)

  const handleOpenManage = (s: Supplier) => {
    setSelectedSupplier(s)
    setEditForm({ ...s })
    setManageTab('profile')
    setSaveSuccessMsg(null)
    setIsManageModalOpen(true)
  }

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm) return
    updateSupplier(editForm)
    setSelectedSupplier(editForm)
    setSaveSuccessMsg('Supplier details updated successfully.')
    setTimeout(() => setSaveSuccessMsg(null), 3000)
  }

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const finalCategory = isCustomCategoryMode && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : newSupplier.category

    addSupplier({
      name: newSupplier.name,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address,
      category: finalCategory,
    })
    setNewSupplier({
      name: '',
      phone: '',
      email: '',
      address: '',
      category: 'Fresh Poultry & Proteins'
    })
    setCustomCategoryInput('')
    setIsCustomCategoryMode(false)
    setIsAddModalOpen(false)
  }

  // Supplies history for selected supplier
  const supplierDeliveries = selectedSupplier
    ? rawDeliveries.filter(d => 
        (d.supplier_name && selectedSupplier.name && d.supplier_name.toLowerCase() === selectedSupplier.name.toLowerCase()) || 
        d.supplier_id === selectedSupplier.id
      )
    : []

  const supplierTotalDeliveriesSpend = supplierDeliveries.reduce((acc, d) => acc + d.value_amount, 0)

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
          <div className="font-semibold text-kumo-strong font-sans">{s.name}</div>
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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-kumo-surface text-kumo-default border border-kumo-line font-sans whitespace-nowrap shrink-0">
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
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
      accessor: (s) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <TableActionButton
            variant="outline"
            icon={<Pencil className="text-kumo-subtle" />}
            onClick={() => handleOpenManage(s)}
          >
            Manage
          </TableActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Suppliers & Vendor Procurement"
        subtitle="Registered live poultry farmers, agro-wholesale markets, firewood contractors, and food packaging manufacturers."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsCustomCategoryMode(false)
              setCustomCategoryInput('')
              setIsAddModalOpen(true)
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="h-10 px-4 text-sm font-medium shadow-xs shrink-0 whitespace-nowrap min-w-fit"
          >
            Add New Vendor
          </Button>
        }
      />

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
        onRowClick={(s) => handleOpenManage(s)}
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-kumo-strong">
                Supply Category <span className="text-kumo-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategoryMode(!isCustomCategoryMode)
                  if (!isCustomCategoryMode) {
                    setCustomCategoryInput('')
                  }
                }}
                className="text-[11px] font-medium text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {isCustomCategoryMode ? (
                  '← Standard categories'
                ) : (
                  <>
                    <Pencil className="w-3 h-3" />
                    <span>Custom category</span>
                  </>
                )}
              </button>
            </div>

            {isCustomCategoryMode ? (
              <Input
                placeholder="e.g. Fresh Seafood & Fish, Butchery Equipment, Cleaning..."
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                required
              />
            ) : (
              <Select
                value={newSupplier.category}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, category: e.target.value }))}
                options={STANDARD_SUPPLY_CATEGORIES}
              />
            )}
          </div>

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

      {/* Manage Supplier & Supplies Log Modal */}
      {selectedSupplier && editForm && (
        <Dialog
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          title={`Manage Vendor: ${selectedSupplier.name}`}
          description={`Supplier Code: ${selectedSupplier.supplier_ref} • ${selectedSupplier.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Tabs */}
            <div>
              <KumoTabs
                activeTab={manageTab}
                onChange={(val) => setManageTab(val as any)}
                tabs={[
                  { id: 'profile', label: 'Vendor Profile & Contact' },
                  { id: 'supplies', label: 'Supplies Log', badge: supplierDeliveries.length },
                ]}
              />
            </div>

            {saveSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {manageTab === 'profile' && (
              <form onSubmit={handleSaveSupplier} className="space-y-4">
                <Input
                  label="Vendor Business Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  required
                />

                <Input
                  label="Supply Category"
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                  placeholder="e.g. Fresh Poultry & Proteins"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Phone Number"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  />
                </div>

                <Input
                  label="Facility / Depot Address"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                  required
                />

                <div className="p-3 rounded-lg border border-kumo-line bg-kumo-surface flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-kumo-strong">Vendor Partnership Status</div>
                    <div className="text-[11px] text-kumo-subtle">
                      {editForm.is_active ? 'Active vendor eligible for purchase orders' : 'Suspended / Inactive'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => prev ? ({ ...prev, is_active: prev.is_active ? 0 : 1 }) : null)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      editForm.is_active 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
                        : 'bg-kumo-base text-kumo-subtle border-kumo-line'
                    }`}
                  >
                    {editForm.is_active ? 'Active Vendor' : 'Mark Inactive'}
                  </button>
                </div>

                <div className="flex justify-end items-center gap-2 pt-3 border-t border-kumo-line">
                  <Button variant="secondary" size="md" type="button" onClick={() => setIsManageModalOpen(false)}>
                    Close
                  </Button>
                  <Button variant="primary" size="md" type="submit" leftIcon={<Save className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {manageTab === 'supplies' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-kumo-surface border border-kumo-line text-xs">
                  <div>
                    <span className="text-kumo-subtle">Recorded Shipments:</span>{' '}
                    <span className="font-semibold text-kumo-strong">{supplierDeliveries.length} orders</span>
                  </div>
                  <div>
                    <span className="text-kumo-subtle">Total Procurement Value:</span>{' '}
                    <span className="font-semibold text-emerald-700">{formatNaira(supplierTotalDeliveriesSpend || selectedSupplier.total_spend)}</span>
                  </div>
                </div>

                {supplierDeliveries.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-kumo-line rounded-lg">
                    <Boxes className="w-8 h-8 text-kumo-subtle mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-kumo-strong">No Inbound Shipments Logged Yet</p>
                    <p className="text-[11px] text-kumo-subtle mt-0.5">
                      Deliveries received from this vendor in Raw Material Inventory will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="border border-kumo-line rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-kumo-surface text-kumo-subtle text-[11px] uppercase border-b border-kumo-line">
                        <tr>
                          <th className="px-3 py-2 font-medium whitespace-nowrap">Delivery Ref</th>
                          <th className="px-3 py-2 font-medium whitespace-nowrap">Date</th>
                          <th className="px-3 py-2 font-medium whitespace-nowrap">Material Received</th>
                          <th className="px-3 py-2 font-medium whitespace-nowrap">Qty</th>
                          <th className="px-3 py-2 font-medium whitespace-nowrap">Unit Cost</th>
                          <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Invoice Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-kumo-line">
                        {supplierDeliveries.map((delivery) => (
                          <tr key={delivery.id} className="hover:bg-kumo-tint/50">
                            <td className="px-3 py-2.5 font-mono text-[11px] text-kumo-strong whitespace-nowrap">
                              {delivery.delivery_ref}
                            </td>
                            <td className="px-3 py-2.5 text-kumo-subtle text-[11px] whitespace-nowrap">
                              {formatDate(delivery.date_received)}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="font-medium text-kumo-strong">{delivery.product_name}</div>
                              {delivery.lot_number && (
                                <div className="text-[10px] text-kumo-subtle font-mono">Lot: {delivery.lot_number}</div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-kumo-default font-medium whitespace-nowrap">
                              {delivery.quantity} {delivery.unit}
                            </td>
                            <td className="px-3 py-2.5 text-kumo-subtle whitespace-nowrap">
                              {formatNaira(delivery.unit_cost)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                              {formatNaira(delivery.value_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-kumo-line">
                  <Button variant="secondary" size="md" type="button" onClick={() => setIsManageModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default SuppliersPage
