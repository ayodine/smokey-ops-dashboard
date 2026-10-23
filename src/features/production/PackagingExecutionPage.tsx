import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { PackagingQueueOrder, PackagingMaterialDaily, getSuggestedPackaging } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { Select } from '@/components/ui/Select'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatNaira, formatDate } from '@/lib/utils'
import { 
  Package, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  Send, 
  Plus, 
  Trash2, 
  Check,
  Sparkles
} from 'lucide-react'

export const PackagingExecutionPage: React.FC = () => {
  const {
    packagingQueue,
    packagingProducts,
    packagingMaterialsDaily,
    startPackagingOrder,
    confirmPackagingOrder,
    addPackagingQueueOrder
  } = useSmokeyOps()

  const [activeTab, setActiveTab] = useState<'ready' | 'in_packaging' | 'daily' | 'history'>('ready')
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PackagingQueueOrder | null>(null)

  // Manual Order Form State
  const [manualOrderForm, setManualOrderForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    items_summary: '',
    total_amount: 15000,
    delivery_fee: 2500,
    payment_status: 'paid' as 'paid' | 'pending'
  })

  // Compulsory packaging selection state
  const [pickedItems, setPickedItems] = useState<Array<{ packaging_name: string; quantity: number }>>([
    { packaging_name: 'BRANDED POLYBAG', quantity: 1 },
    { packaging_name: '1 LITER FOOD BOWL & LID', quantity: 1 }
  ])

  // Filter queues
  const readyOrders = packagingQueue.filter(o => o.order_status === 'ready_for_fulfillment')
  const inPackagingOrders = packagingQueue.filter(o => o.order_status === 'in_packaging')
  const historyOrders = packagingQueue.filter(o => o.order_status === 'packaged')

  // KPIs
  const totalDailyMaterials = packagingMaterialsDaily.reduce((acc, m) => acc + m.total_consumed, 0)

  const handleOpenStartModal = (order: PackagingQueueOrder) => {
    setSelectedOrder(order)
    // Section 10.1: Zero-Touch Menu-to-Packaging SKU Mapping
    const suggested = getSuggestedPackaging(
      order.items && order.items.length > 0 
        ? order.items 
        : [{ product_name: order.items_summary, quantity: 1, unit_price: order.total_amount, line_total: order.total_amount }]
    )
    setPickedItems(suggested)
    setIsStartModalOpen(true)
  }

  const handleAddPackagingItem = () => {
    setPickedItems(prev => [...prev, { packaging_name: packagingProducts[0]?.name || 'BRANDED POLYBAG', quantity: 1 }])
  }

  const handleRemovePackagingItem = (idx: number) => {
    setPickedItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpdatePackagingItem = (idx: number, field: 'packaging_name' | 'quantity', val: any) => {
    setPickedItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  const handleConfirmStart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    startPackagingOrder(selectedOrder.id, pickedItems)
    setIsStartModalOpen(false)
    setActiveTab('in_packaging')
  }

  const handleConfirmManualOrder = (e: React.FormEvent) => {
    e.preventDefault()
    addPackagingQueueOrder({
      customer_name: manualOrderForm.customer_name,
      phone: manualOrderForm.phone,
      address: manualOrderForm.address,
      items_summary: manualOrderForm.items_summary,
      total_amount: Number(manualOrderForm.total_amount),
      delivery_fee: Number(manualOrderForm.delivery_fee),
      payment_status: manualOrderForm.payment_status
    })
    setIsManualOrderModalOpen(false)
    setManualOrderForm({
      customer_name: '',
      phone: '',
      address: '',
      items_summary: '',
      total_amount: 15000,
      delivery_fee: 2500,
      payment_status: 'paid'
    })
    setActiveTab('ready')
  }

  // Column defs for Ready for Packaging
  const readyColumns: ColumnDef<PackagingQueueOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (o) => <span className="font-medium text-xs text-kumo-strong font-sans">{o.order_ref}</span>,
      sortValue: (o) => o.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Customer & Contact',
      accessor: (o) => (
        <div>
          <div className="font-semibold text-kumo-strong">{o.customer_name}</div>
          <div className="text-xs text-kumo-subtle">{o.phone}</div>
        </div>
      ),
      sortValue: (o) => o.customer_name,
    },
    {
      key: 'items_summary',
      header: 'Meal Items to Pack',
      accessor: (o) => <span className="text-xs text-kumo-default font-normal font-sans">{o.items_summary}</span>,
    },
    {
      key: 'destination',
      header: 'Delivery Zone / Type',
      accessor: (o) => (
        <div>
          <span className="text-xs text-kumo-strong block truncate max-w-xs">{o.address}</span>
          <span className="text-[10px] text-primary uppercase font-semibold">{o.delivery_mode} mode</span>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Order Value',
      accessor: (o) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(o.total_amount)}</span>,
      sortValue: (o) => o.total_amount,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 160,
      accessor: (o) => (
        <Tooltip content="Allocate containers and start packaging this order">
          <TableActionButton
            variant="primary"
            onClick={() => handleOpenStartModal(o)}
            leftIcon={<Package className="w-3.5 h-3.5" strokeWidth={2} />}
          >
            Start Packaging
          </TableActionButton>
        </Tooltip>
      ),
    },
  ]

  // Column defs for In Packaging Table
  const inPackagingColumns: ColumnDef<PackagingQueueOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (o) => <span className="font-medium text-xs text-kumo-strong font-sans">{o.order_ref}</span>,
      sortValue: (o) => o.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      accessor: (o) => <span className="font-medium text-kumo-strong font-sans">{o.customer_name}</span>,
      sortValue: (o) => o.customer_name,
    },
    {
      key: 'items_summary',
      header: 'Ordered Meals',
      accessor: (o) => <span className="text-xs text-kumo-default font-normal font-sans">{o.items_summary}</span>,
    },
    {
      key: 'packaging_materials',
      header: 'Picked Materials Deducted',
      accessor: (o) => (
        <div className="space-y-0.5">
          {o.packaging_materials_picked?.map((p, i) => (
            <span key={i} className="inline-block mr-1 px-1.5 py-0.5 rounded text-[11px] font-sans font-medium bg-kumo-surface text-kumo-strong border border-kumo-line whitespace-nowrap">
              {p.packaging_name} × {p.quantity}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Pack Status',
      defaultWidth: 180,
      accessor: (o) => <StatusBadge status="in-progress" label="in-progress" />,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (o) => (
        <Tooltip content="Hand over packed meal to dispatch board">
          <TableActionButton
            variant="success"
            onClick={() => confirmPackagingOrder(o.id, 'Shift Packing Lead')}
            leftIcon={<Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
          >
            Confirm Packaged
          </TableActionButton>
        </Tooltip>
      ),
    },
  ]

  // Column defs for Daily Materials Used
  const dailyColumns: ColumnDef<PackagingMaterialDaily>[] = [
    {
      key: 'sku',
      header: 'SKU Ref',
      accessor: (m) => <span className="font-medium text-xs text-kumo-strong font-sans">{m.sku}</span>,
      sortValue: (m) => m.sku,
    },
    {
      key: 'product_name',
      header: 'Packaging Consumable',
      accessor: (m) => <span className="font-medium text-kumo-strong font-sans">{m.product_name}</span>,
      sortValue: (m) => m.product_name,
    },
    {
      key: 'total_consumed',
      header: 'Units Deducted (Today)',
      accessor: (m) => <span className="font-medium text-red-600 font-sans">-{m.total_consumed} {m.unit}</span>,
      sortValue: (m) => m.total_consumed,
    },
    {
      key: 'total_orders',
      header: 'Orders Sealed',
      accessor: (m) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-kumo-surface text-kumo-default border border-kumo-line font-sans">{m.total_orders} orders</span>,
      sortValue: (m) => m.total_orders,
    },
  ]

  // Column defs for Packaging History
  const historyColumns: ColumnDef<PackagingQueueOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (o) => <span className="font-medium text-xs text-kumo-strong font-sans">{o.order_ref}</span>,
      sortValue: (o) => o.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      accessor: (o) => <span className="font-medium text-kumo-strong">{o.customer_name}</span>,
      sortValue: (o) => o.customer_name,
    },
    {
      key: 'packaged_at',
      header: 'Packaged Timestamp',
      accessor: (o) => <span className="text-xs text-kumo-subtle">{formatDate(o.packaged_at || o.created_at)}</span>,
      sortValue: (o) => o.packaged_at || o.created_at,
    },
    {
      key: 'packaged_by_name',
      header: 'Staff Pack Lead',
      accessor: (o) => <span className="text-xs font-medium text-kumo-default">{o.packaged_by_name || 'Kitchen Staff'}</span>,
    },
    {
      key: 'status',
      header: 'Logistics Routing',
      accessor: (o) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
          <Send className="w-3 h-3" />
          Transferred to Dispatch
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Packaging Execution & Kitchen Pack-Out"
        subtitle="The operational bridge between kitchen cooking and logistics. Select packaging materials to deduct consumables before releasing orders for dispatch."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsManualOrderModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="h-10 px-4 text-sm font-medium shadow-xs shrink-0"
          >
            Assign Order for Packing
          </Button>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Ready for Packaging"
          value={readyOrders.length}
          description="Paid orders awaiting pack-out"
          icon={<Package className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Packing in Progress"
          value={inPackagingOrders.length}
          description="Being packed & sealed"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Materials Used Today"
          value={`${totalDailyMaterials} units`}
          description="Bowls, polybags, foil deducted"
          icon={<ShoppingBag className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Packaged & Released"
          value={historyOrders.length}
          description="Handed over to dispatch queue"
          icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'ready', label: 'Orders to Pack', badge: readyOrders.length },
            { id: 'in_packaging', label: 'Packing Now', badge: inPackagingOrders.length },
            { id: 'daily', label: 'Materials Used' },
            { id: 'history', label: 'Packed Orders', badge: historyOrders.length },
          ]}
        />
      </div>

      {/* Active Tab Table */}
      <div>
        {activeTab === 'ready' && (
          <DataTable
            data={readyOrders}
            columns={readyColumns}
            searchable={true}
            searchPlaceholder="Search order ref or customer..."
            title="Order Ready for Pack"
            exportFilename="smokey-orders-ready-to-pack"
          />
        )}

        {activeTab === 'in_packaging' && (
          <DataTable
            data={inPackagingOrders}
            columns={inPackagingColumns}
            searchable={true}
            searchPlaceholder="Search packing orders..."
            title="Order in Packaging"
            exportFilename="smokey-orders-in-packaging"
          />
        )}

        {activeTab === 'daily' && (
          <DataTable
            data={packagingMaterialsDaily}
            columns={dailyColumns}
            searchable={false}
            title="Material Item"
            exportFilename="smokey-daily-packaging-consumed"
          />
        )}

        {activeTab === 'history' && (
          <DataTable
            data={historyOrders}
            columns={historyColumns}
            searchable={true}
            searchPlaceholder="Search packaged audit..."
            title="Packaged Order"
            exportFilename="smokey-packaging-history"
          />
        )}
      </div>

      {/* COMPULSORY PICKING MODAL: fpPackagingStartModal */}
      <Dialog
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title={`Compulsory Material Pick: Order ${selectedOrder?.order_ref}`}
        description="Select the exact food packaging materials used for this order. Quantities will be deducted from Packaging Inventory."
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmStart} className="space-y-4">
          <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg text-xs space-y-1.5 font-sans">
            <div className="flex items-baseline gap-3">
              <span className="text-kumo-subtle font-medium w-28 shrink-0 text-left text-xs">Customer:</span>
              <span className="font-semibold text-kumo-strong text-left text-sm">{selectedOrder?.customer_name}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-kumo-subtle font-medium w-28 shrink-0 text-left text-xs">Ordered Items:</span>
              <span className="font-normal text-kumo-strong text-left text-xs">{selectedOrder?.items_summary}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs text-blue-900 dark:text-blue-300 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span><strong>Zero-Touch Mapping Active:</strong> Consumable packaging items auto-populated based on menu items. Ready for 1-click confirmation.</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-kumo-strong uppercase tracking-wider font-sans">
                Packaging Materials Consumed
              </span>
              <button
                type="button"
                onClick={handleAddPackagingItem}
                className="text-xs text-primary hover:underline flex items-center gap-1.5 cursor-pointer font-medium font-sans"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material Item
              </button>
            </div>

            {/* Column Header labels for alignment */}
            <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider font-sans">
              <div className="flex-1">Packaging Consumable</div>
              <div className="w-24">Quantity</div>
              <div className="w-8"></div>
            </div>

            <div className="space-y-2">
              {pickedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={item.packaging_name}
                      onChange={(e) => handleUpdatePackagingItem(idx, 'packaging_name', e.target.value)}
                      options={packagingProducts.map(p => ({
                        value: p.name,
                        label: `${p.name} (${p.stock_qty} ${p.unit} in store)`
                      }))}
                      buttonClassName="h-9 text-xs sm:text-[13px] font-normal font-sans rounded-lg"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdatePackagingItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full h-9 bg-kumo-base border border-kumo-line rounded-lg px-2.5 text-xs sm:text-[13px] font-sans text-kumo-strong focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-2xs"
                    />
                  </div>
                  <div className="w-8 flex justify-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemovePackagingItem(idx)}
                      className="p-1.5 text-kumo-subtle hover:text-red-500 rounded-lg hover:bg-kumo-fill transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-amber-950 dark:text-amber-100 flex items-start gap-2 font-sans shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
            <span className="leading-relaxed">
              <strong className="font-bold text-amber-950 dark:text-amber-50 mr-1">Constraint:</strong>
              Consumable inventory will be deducted immediately. The order will be moved to the active packing table.
            </span>
          </div>

          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-kumo-line">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsStartModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Deduct Materials & Start Packaging
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Assign Manual / Web Order for Packing */}
      <Dialog
        isOpen={isManualOrderModalOpen}
        onClose={() => setIsManualOrderModalOpen(false)}
        title="Assign Order for Kitchen Packaging"
        description="Queue a phone, WhatsApp, or website order for packaging material allocation and pack-out."
      >
        <form onSubmit={handleConfirmManualOrder} className="space-y-4 font-sans">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Chief Adeyemi Ogunlesi"
            value={manualOrderForm.customer_name}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, customer_name: e.target.value }))}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="0803..."
              value={manualOrderForm.phone}
              onChange={(e) => setManualOrderForm(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
            <Select
              label="Payment Status"
              value={manualOrderForm.payment_status}
              onChange={(e) => setManualOrderForm(prev => ({ ...prev, payment_status: e.target.value as any }))}
              options={[
                { value: 'paid', label: 'PAID (Verified Online / Transfer)' },
                { value: 'pending', label: 'PENDING (Pay on Delivery)' },
              ]}
            />
          </div>

          <Input
            label="Delivery Address / Mode"
            placeholder="e.g. 14 Admiralty Way, Lekki Phase 1 (or 'Store Pickup Counter')"
            value={manualOrderForm.address}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, address: e.target.value }))}
            required
            helperText="Tip: Include 'Pickup' in the address to automatically route to Store Pickup Counter upon completion."
          />

          <Input
            label="Food Items Ordered (Summary)"
            placeholder="e.g. 1x Full Smokey Guineafowl, 2x Jollof Rice Bowls"
            value={manualOrderForm.items_summary}
            onChange={(e) => setManualOrderForm(prev => ({ ...prev, items_summary: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Order Total Amount (₦)"
              type="number"
              min="500"
              value={manualOrderForm.total_amount}
              onChange={(e) => setManualOrderForm(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
              required
            />
            <Input
              label="Delivery Fee (₦)"
              type="number"
              min="0"
              value={manualOrderForm.delivery_fee}
              onChange={(e) => setManualOrderForm(prev => ({ ...prev, delivery_fee: Number(e.target.value) }))}
              required
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-kumo-line">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsManualOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" leftIcon={<Package className="w-4 h-4" />}>
              Queue for Packing
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default PackagingExecutionPage
