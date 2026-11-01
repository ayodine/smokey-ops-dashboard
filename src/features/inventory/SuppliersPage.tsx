import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { Supplier, RawDelivery, CANONICAL_SUPPLIER_CATEGORIES } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { StatusBadge } from '@/components/ui/Badge'
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
  Save,
  Check,
  Trash2,
  AlertTriangle
} from 'lucide-react'

const getCategoryBadgeClass = (category: string) => {
  const cat = category.toLowerCase()
  if (cat.includes('poultry') || cat.includes('meat') || cat.includes('live')) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
  }
  if (cat.includes('spice') || cat.includes('market') || cat.includes('pepper')) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
  }
  if (cat.includes('firewood') || cat.includes('charcoal')) {
    return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
  }
  if (cat.includes('packag') || cat.includes('print') || cat.includes('nylon')) {
    return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
  }
  return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20'
}

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, rawDeliveries } = useSmokeyOps()
  
  // Tab & Filtering State
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Add Supplier Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    category: CANONICAL_SUPPLIER_CATEGORIES[0].value
  })

  // Manage Supplier State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [editForm, setEditForm] = useState<Supplier | null>(null)
  const [manageTab, setManageTab] = useState<'profile' | 'supplies'>('profile')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  // 1. Dynamic Ledger Mapping: Compute delivery counts and spend directly from rawDeliveries
  const vendorDeliveryStats = useMemo(() => {
    const statsMap = new Map<number, { count: number; spend: number; lastDelivery?: string; deliveries: RawDelivery[] }>()
    suppliers.forEach(s => statsMap.set(s.id, { count: 0, spend: 0, deliveries: [] }))

    rawDeliveries.forEach(d => {
      const match = suppliers.find(s => 
        s.id === d.supplier_id || 
        (d.supplier_name && s.name && d.supplier_name.trim().toLowerCase() === s.name.trim().toLowerCase())
      )
      if (match) {
        const curr = statsMap.get(match.id) || { count: 0, spend: 0, deliveries: [] }
        const deliveryVal = d.value_amount || (d.quantity * d.unit_cost) || 0
        statsMap.set(match.id, {
          count: curr.count + 1,
          spend: curr.spend + deliveryVal,
          lastDelivery: curr.lastDelivery 
            ? (new Date(d.date_received) > new Date(curr.lastDelivery) ? d.date_received : curr.lastDelivery) 
            : d.date_received,
          deliveries: [d, ...curr.deliveries]
        })
      }
    })
    return statsMap
  }, [suppliers, rawDeliveries])

  // 2. Tab Badge Counts
  const activeCount = useMemo(() => suppliers.filter(s => s.is_active === 1).length, [suppliers])
  const inactiveCount = useMemo(() => suppliers.filter(s => s.is_active === 0).length, [suppliers])

  // 3. Filtered Suppliers by Tab and Category Dropdown
  const filteredSuppliers = useMemo(() => {
    let result = suppliers

    // Status Tab Filter
    if (activeStatusTab === 'active') {
      result = result.filter(s => s.is_active === 1)
    } else if (activeStatusTab === 'inactive') {
      result = result.filter(s => s.is_active === 0)
    }

    // Category Dropdown Filter
    if (categoryFilter !== 'all') {
      result = result.filter(s => s.category.toLowerCase().includes(categoryFilter.toLowerCase()))
    }

    return result
  }, [suppliers, activeStatusTab, categoryFilter])

  // 4. Honest Dynamic KPI Metrics
  const totalSuppliers = suppliers.length
  const totalActiveVendors = activeCount
  const totalDeliveries = rawDeliveries.length
  const totalSpend = rawDeliveries.reduce((acc, d) => acc + (d.value_amount || (d.quantity * d.unit_cost) || 0), 0)

  // 5. Handlers
  const handleOpenManage = (s: Supplier) => {
    setSelectedSupplier(s)
    setEditForm({ ...s })
    setManageTab('profile')
    setSaveSuccessMsg(null)
    setIsConfirmingDelete(false)
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
      name: newSupplier.name.trim(),
      phone: newSupplier.phone.trim(),
      email: newSupplier.email.trim(),
      address: newSupplier.address.trim(),
      category: finalCategory,
    })
    setNewSupplier({
      name: '',
      phone: '',
      email: '',
      address: '',
      category: CANONICAL_SUPPLIER_CATEGORIES[0].value
    })
    setCustomCategoryInput('')
    setIsCustomCategoryMode(false)
    setIsAddModalOpen(false)
  }

  const handleDeleteVendor = () => {
    if (!selectedSupplier) return
    const success = deleteSupplier(selectedSupplier.id)
    if (success) {
      setIsManageModalOpen(false)
      setSelectedSupplier(null)
      setIsConfirmingDelete(false)
    }
  }

  // Selected supplier deliveries
  const selectedStats = selectedSupplier ? vendorDeliveryStats.get(selectedSupplier.id) : null
  const selectedDeliveries = selectedStats?.deliveries || []
  const selectedDeliveriesCount = selectedStats?.count || 0
  const selectedDeliveriesSpend = selectedStats?.spend || 0

  // 6. Master Columns
  const columns: ColumnDef<Supplier>[] = [
    {
      key: 'supplier_ref',
      header: 'Supplier Code',
      accessor: (s) => (
        <span className="font-mono font-semibold text-xs text-kumo-strong">
          {s.supplier_ref}
        </span>
      ),
      sortValue: (s) => s.supplier_ref,
    },
    {
      key: 'name',
      header: 'Vendor Name & Category',
      accessor: (s) => (
        <div className="space-y-1">
          <div className="font-semibold text-kumo-strong font-sans">{s.name}</div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${getCategoryBadgeClass(s.category)}`}>
            {s.category}
          </span>
        </div>
      ),
      sortValue: (s) => s.name,
    },
    {
      key: 'contact',
      header: 'Contact Info',
      accessor: (s) => (
        <div className="space-y-1 text-xs font-sans">
          {s.phone ? (
            <div className="flex items-center gap-1.5 text-kumo-strong">
              <Phone className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
              <span>{s.phone}</span>
            </div>
          ) : (
            <span className="text-kumo-subtle text-[11px] italic">No phone on file</span>
          )}
          {s.email && (
            <div className="flex items-center gap-1.5 text-kumo-subtle text-[11px]">
              <Mail className="w-3 h-3 text-kumo-subtle shrink-0" />
              <span className="truncate max-w-[180px]">{s.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Location / Address',
      accessor: (s) => (
        <span className="text-xs text-kumo-default max-w-xs truncate font-sans block">
          {s.address ? s.address : <span className="text-kumo-subtle italic">Not specified</span>}
        </span>
      ),
    },
    {
      key: 'delivery_count',
      header: 'Deliveries Fulfilled',
      accessor: (s) => {
        const count = vendorDeliveryStats.get(s.id)?.count || 0
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${
            count > 0 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' 
              : 'bg-kumo-surface text-kumo-subtle border-kumo-line'
          }`}>
            {count} {count === 1 ? 'shipment' : 'shipments'}
          </span>
        )
      },
      sortValue: (s) => vendorDeliveryStats.get(s.id)?.count || 0,
    },
    {
      key: 'total_spend',
      header: 'Total Spend (YTD)',
      accessor: (s) => {
        const spend = vendorDeliveryStats.get(s.id)?.spend || 0
        return (
          <span className={`font-mono font-semibold text-xs ${spend > 0 ? 'text-kumo-strong' : 'text-kumo-subtle'}`}>
            {formatNaira(spend)}
          </span>
        )
      },
      sortValue: (s) => vendorDeliveryStats.get(s.id)?.spend || 0,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (s) => (
        <StatusBadge status={s.is_active === 1 ? 'ACTIVE' : 'INACTIVE'} size="sm" />
      ),
      sortValue: (s) => s.is_active,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      accessor: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenManage(s)}
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            className="h-8 px-2.5 text-xs font-medium cursor-pointer"
          >
            Manage
          </Button>
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
            className="h-10 px-4 text-sm font-medium shadow-xs shrink-0 whitespace-nowrap min-w-fit cursor-pointer"
          >
            Add New Vendor
          </Button>
        }
      />

      {/* KPI Strip: Live Dynamically Computed Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Suppliers"
          value={totalSuppliers}
          description="Registered vendor profiles"
          icon={<Building2 className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Active Vendors"
          value={totalActiveVendors}
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

      {/* Top-Level Status-Based Tabs */}
      <div>
        <KumoTabs
          activeTab={activeStatusTab}
          onChange={(val) => setActiveStatusTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Vendors', badge: suppliers.length },
            { id: 'active', label: 'Active Vendors', badge: activeCount },
            { id: 'inactive', label: 'Suspended / Inactive', badge: inactiveCount },
          ]}
        />
      </div>

      {/* Directory Table with Category Dropdown Filter */}
      <DataTable
        data={filteredSuppliers}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search vendor name, contact, category..."
        exportFilename={`smokey-suppliers-directory-${new Date().toISOString().slice(0, 10)}`}
        enableDateFilter={false}
        filterCategories={[
          {
            name: 'Supply Category',
            key: 'category',
            options: [
              { label: 'All Categories', value: 'all' },
              ...CANONICAL_SUPPLIER_CATEGORIES.map(c => ({ label: c.label, value: c.value }))
            ],
            activeValue: categoryFilter,
            onChange: (val) => setCategoryFilter(val),
          }
        ]}
        onRowClick={(s) => handleOpenManage(s)}
      />

      {/* MODAL 1: Register New Supplier (Strict Single-Column Vertical Stack) */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Supplier"
        description="Add a vendor profile with contact info and primary supply category."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAddModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="register-supplier-form">
              Register Supplier
            </Button>
          </div>
        }
      >
        <form id="register-supplier-form" onSubmit={handleConfirmAdd} className="space-y-4">
          <Input
            label="Supplier Business Name"
            placeholder="e.g. IBADAN POULTRY AGRO FARMS"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-kumo-strong">
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
                options={CANONICAL_SUPPLIER_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
              />
            )}
          </div>

          <Input
            label="Phone Number"
            placeholder="08012345678"
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

          <Input
            label="Business / Farm Address"
            placeholder="Street, Town, State"
            value={newSupplier.address}
            onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
            required
          />
        </form>
      </Dialog>

      {/* MODAL 2: Vendor Details & Supplies Log (Image 3 Spread-Even Standard) */}
      {selectedSupplier && editForm && (
        <Dialog
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          title={`Vendor Details: ${selectedSupplier.name}`}
          description={`Supplier Code: ${selectedSupplier.supplier_ref} • ${selectedSupplier.category}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="md" type="button" onClick={() => setIsManageModalOpen(false)}>
                Close
              </Button>
              {manageTab === 'profile' && (
                <Button variant="primary" size="md" type="submit" form="edit-supplier-form" leftIcon={<Save className="w-4 h-4" />}>
                  Save Changes
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            {/* Modal Internal Tabs */}
            <div>
              <KumoTabs
                activeTab={manageTab}
                onChange={(val) => {
                  setManageTab(val as any)
                  setIsConfirmingDelete(false)
                }}
                tabs={[
                  { id: 'profile', label: 'Vendor Profile & Contact' },
                  { id: 'supplies', label: 'Supplies Log', badge: selectedDeliveriesCount },
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
              <form id="edit-supplier-form" onSubmit={handleSaveSupplier} className="space-y-4">
                <Input
                  label="Vendor Business Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  required
                />

                <Select
                  label="Supply Category"
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                  options={CANONICAL_SUPPLIER_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                />

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

                <Input
                  label="Business / Farm Address"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                  required
                />

                {/* Partnership Status Toggle */}
                <div className="p-3 rounded-lg border border-kumo-line bg-kumo-surface flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-kumo-strong">Vendor Partnership Status</div>
                    <div className="text-[11px] text-kumo-subtle mt-0.5">
                      {editForm.is_active ? 'Active vendor eligible for purchase orders' : 'Suspended / Inactive'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => prev ? ({ ...prev, is_active: prev.is_active ? 0 : 1 }) : null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      editForm.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'bg-kumo-surface text-kumo-subtle border-kumo-line hover:bg-kumo-control'
                    }`}
                  >
                    {editForm.is_active ? 'Active Vendor' : 'Mark Inactive'}
                  </button>
                </div>

                {/* Danger Zone: Audit-Guarded Vendor Deletion */}
                <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-950/50 bg-rose-50/40 dark:bg-rose-950/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Delete Vendor Profile</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-kumo-subtle leading-relaxed">
                    {selectedDeliveriesCount > 0
                      ? `This vendor has ${selectedDeliveriesCount} fulfilled shipment${selectedDeliveriesCount === 1 ? '' : 's'} on record. Permanent deletion is locked to preserve ledger audit trail. Mark inactive instead.`
                      : 'Permanently remove this vendor from the database. Allowed only because 0 shipments have been recorded.'}
                  </p>
                  {selectedDeliveriesCount === 0 && (
                    <div className="pt-1">
                      {!isConfirmingDelete ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setIsConfirmingDelete(true)}
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          className="h-8 px-3 text-xs cursor-pointer"
                        >
                          Delete Vendor
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsConfirmingDelete(false)}
                            className="h-8 px-3 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteVendor}
                            className="h-8 px-3 text-xs"
                          >
                            Confirm Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            )}

            {manageTab === 'supplies' && (
              <div className="space-y-3">
                {/* Supplies Overview Banner */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-kumo-surface border border-kumo-line text-xs font-sans">
                  <div>
                    <span className="text-kumo-subtle">Recorded Shipments:</span>{' '}
                    <span className="font-semibold text-kumo-strong font-mono">{selectedDeliveriesCount} orders</span>
                  </div>
                  <div>
                    <span className="text-kumo-subtle">Total Procurement Value:</span>{' '}
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatNaira(selectedDeliveriesSpend)}
                    </span>
                  </div>
                </div>

                {selectedDeliveries.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-kumo-line rounded-lg">
                    <Boxes className="w-8 h-8 text-kumo-subtle mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-kumo-strong">No Inbound Shipments Logged Yet</p>
                    <p className="text-[11px] text-kumo-subtle mt-0.5">
                      Deliveries received from this vendor in Raw Material or Packaging Inventory will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="border border-kumo-line rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-kumo-canvas text-kumo-subtle text-[11px] uppercase border-b border-kumo-line sticky top-0">
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
                        {selectedDeliveries.map((delivery) => (
                          <tr key={delivery.id} className="hover:bg-kumo-surface/50 transition-colors">
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
                            <td className="px-3 py-2.5 text-kumo-strong font-medium whitespace-nowrap font-mono">
                              {delivery.quantity} {delivery.unit.toLowerCase()}
                            </td>
                            <td className="px-3 py-2.5 text-kumo-subtle whitespace-nowrap font-mono">
                              {formatNaira(delivery.unit_cost)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {formatNaira(delivery.value_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default SuppliersPage