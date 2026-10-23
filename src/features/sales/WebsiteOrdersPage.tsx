import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge, BadgeStatus } from '@/components/ui/Badge'
import { SEED_SCHEDULED_ORDERS } from '@/lib/smokeyData'
import { formatNaira, formatDate } from '@/lib/utils'
import {
  ShoppingBag,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  FileText
} from 'lucide-react'

export interface WebsiteOrder {
  id: number
  order_ref: string
  customer_name: string
  phone: string
  address: string
  items_summary: string
  total_amount: number
  delivery_fee: number
  channel: string
  payment_status: 'paid' | 'pending' | 'refunded'
  fulfillment_status: 'in_intake' | 'cooking' | 'packaging' | 'in_transit' | 'delivered'
  scheduled_delivery_at: string
  rider_name: string
  notes: string
}

// Map the 14 SEED orders to website sales orders with rich dishes and fulfillment details
export const INITIAL_WEBSITE_ORDERS: WebsiteOrder[] = [
  {
    id: 8551,
    order_ref: "SHD-07662",
    customer_name: "Jesutofunmi Bukola",
    phone: "09036054778",
    address: "8/10 Oladimeji Johnson crescent, Iyana Ipaja",
    items_summary: "Full Smokey Guineafowl + 1L Smokey Jollof Rice",
    total_amount: 28700,
    delivery_fee: 4000,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "in_transit",
    scheduled_delivery_at: "2026-09-25 12:30:00",
    rider_name: "Rider Wasiu (Internal)",
    notes: "Lunch order delivery via Website storefront"
  },
  {
    id: 8550,
    order_ref: "SHD-07661",
    customer_name: "Anita Ihaza",
    phone: "07062364644",
    address: "4 Awoseyin Lane, Shomolu",
    items_summary: "Smoked Goat Meat Asun Bowl + Extra Pepper Sauce",
    total_amount: 27700,
    delivery_fee: 2500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "packaging",
    scheduled_delivery_at: "2026-09-25 13:30:00",
    rider_name: "Rider Joshua (Internal)",
    notes: "Office lunch party dispatch"
  },
  {
    id: 8549,
    order_ref: "SHD-07660",
    customer_name: "Ahmad Sanusi",
    phone: "08055443322",
    address: "35 Glover Road, Ikoyi",
    items_summary: "Smoked Turkey Wings (3pcs) + Fried Yam Feast",
    total_amount: 62500,
    delivery_fee: 3500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "cooking",
    scheduled_delivery_at: "2026-09-26 15:00:00",
    rider_name: "Pending Assignment",
    notes: "Pre-order VIP catering package"
  },
  {
    id: 8552,
    order_ref: "SHD-07663",
    customer_name: "Dr. Funsho Williams",
    phone: "08023456789",
    address: "14 Kingsway Rd, Ikoyi",
    items_summary: "Full Guinea Fowl Feast + Sweet Plantain",
    total_amount: 54000,
    delivery_fee: 3500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "delivered",
    scheduled_delivery_at: "2026-10-22 12:00:00",
    rider_name: "Rider Wasiu (Internal)",
    notes: "Executive medical board lunch buffet"
  },
  {
    id: 8553,
    order_ref: "SHD-07664",
    customer_name: "Kemi Adebayo",
    phone: "08139876543",
    address: "Plot 19 Admiralty Way, Lekki Phase 1",
    items_summary: "Smoked Brisket Strips + 2x 50cl Palmwine",
    total_amount: 38200,
    delivery_fee: 3000,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "in_transit",
    scheduled_delivery_at: "2026-10-22 13:00:00",
    rider_name: "Rider Yusuf (Fleet)",
    notes: "Corporate lunch meeting package"
  },
  {
    id: 8554,
    order_ref: "SHD-07665",
    customer_name: "Emeka Okonkwo",
    phone: "07061122334",
    address: "42 Bode Thomas St, Surulere",
    items_summary: "Party Jollof Rice (3L Tub) + Peppered Gizzard",
    total_amount: 45000,
    delivery_fee: 2500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "delivered",
    scheduled_delivery_at: "2026-10-22 13:30:00",
    rider_name: "Rider Joshua (Internal)",
    notes: "Birthday gathering smokey platter"
  },
  {
    id: 8555,
    order_ref: "SHD-07666",
    customer_name: "Halima Abubakar",
    phone: "08092233445",
    address: "22 Walter Carrington Cres, VI",
    items_summary: "Smoked Beef Brisket Feast + Extra Ribs Combo",
    total_amount: 72000,
    delivery_fee: 3500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "in_transit",
    scheduled_delivery_at: "2026-10-22 14:00:00",
    rider_name: "Rider Wasiu (Internal)",
    notes: "Diplomatic mission lunch delivery"
  },
  {
    id: 8556,
    order_ref: "SHD-07667",
    customer_name: "Tunde Bakare Jr.",
    phone: "08145566778",
    address: "16 Isaac John St, GRA Ikeja",
    items_summary: "Full Guinea Fowl + Roasted Corn & Ube",
    total_amount: 31500,
    delivery_fee: 3000,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "packaging",
    scheduled_delivery_at: "2026-10-22 14:30:00",
    rider_name: "Pending Assignment",
    notes: "Family dinner advance order"
  },
  {
    id: 8557,
    order_ref: "SHD-07668",
    customer_name: "Zainab Dantata",
    phone: "08037788990",
    address: "Zone B, Banana Island, Ikoyi",
    items_summary: "Premium Jumbo Smokey Box (Snail, Ribs, Brisket)",
    total_amount: 88000,
    delivery_fee: 4500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "cooking",
    scheduled_delivery_at: "2026-10-22 15:00:00",
    rider_name: "Pending Assignment",
    notes: "VIP catering banquet boxes"
  },
  {
    id: 8558,
    order_ref: "SHD-07669",
    customer_name: "Chinedu Anya",
    phone: "08059900112",
    address: "11 Toyin Street, Ikeja",
    items_summary: "Smoked Turkey Wings (2pcs) + Jollof Rice",
    total_amount: 29800,
    delivery_fee: 2500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "in_transit",
    scheduled_delivery_at: "2026-10-22 15:30:00",
    rider_name: "Rider Joshua (Internal)",
    notes: "Staff appreciation celebration"
  },
  {
    id: 8559,
    order_ref: "SHD-07670",
    customer_name: "Amina Danjuma",
    phone: "07083344556",
    address: "28 Adeola Hopewell St, VI",
    items_summary: "Peppered Jumbo Snail + Fried Plantain Bowls",
    total_amount: 41200,
    delivery_fee: 3500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "in_intake",
    scheduled_delivery_at: "2026-10-22 16:00:00",
    rider_name: "Pending Assignment",
    notes: "Evening cocktail event catering"
  },
  {
    id: 8560,
    order_ref: "SHD-07671",
    customer_name: "Olumide Fashola",
    phone: "08182233441",
    address: "55 Marina Road, Lagos Island",
    items_summary: "Smoked Goat Meat Asun Platter + Palmwine",
    total_amount: 63000,
    delivery_fee: 3500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "in_intake",
    scheduled_delivery_at: "2026-10-22 16:30:00",
    rider_name: "Pending Assignment",
    notes: "Bank headquarters conference snacks"
  },
  {
    id: 8561,
    order_ref: "SHD-07672",
    customer_name: "Fatima Balarabe",
    phone: "08031199223",
    address: "Plot 10 Bisway St, Maroko VI",
    items_summary: "Full Smokey Guineafowl + Coleslaw & Drinks",
    total_amount: 51000,
    delivery_fee: 3500,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "delivered",
    scheduled_delivery_at: "2026-10-23 11:30:00",
    rider_name: "Rider Wasiu (Internal)",
    notes: "Advance reservation weekend lunch"
  },
  {
    id: 8562,
    order_ref: "SHD-07673",
    customer_name: "Segun Obasanjo Jr.",
    phone: "09081122334",
    address: "8 Alexander Ave, Ikoyi",
    items_summary: "Whole Guinea Fowl Banquet + 2x Jollof Tubs",
    total_amount: 95000,
    delivery_fee: 4000,
    channel: "Website Storefront",
    payment_status: "paid",
    fulfillment_status: "delivered",
    scheduled_delivery_at: "2026-10-24 13:00:00",
    rider_name: "Rider Wasiu (Internal)",
    notes: "Weekend family reunion banquet"
  }
]

export const WebsiteOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<WebsiteOrder[]>(INITIAL_WEBSITE_ORDERS)
  const [activeTab, setActiveTab] = useState<'all' | 'intake' | 'kitchen' | 'transit' | 'delivered'>('all')
  const [selectedOrder, setSelectedOrder] = useState<WebsiteOrder | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // KPIs
  const totalOrdersCount = orders.length
  const totalGrossRevenue = orders.reduce((sum, ord) => sum + ord.total_amount, 0)
  const activeFulfillmentCount = orders.filter(
    (o) => o.fulfillment_status === 'cooking' || o.fulfillment_status === 'packaging'
  ).length
  const outForDeliveryCount = orders.filter((o) => o.fulfillment_status === 'in_transit').length
  const deliveredCount = orders.filter((o) => o.fulfillment_status === 'delivered').length

  // Filtered orders by tab
  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'intake':
        return orders.filter((o) => o.fulfillment_status === 'in_intake')
      case 'kitchen':
        return orders.filter((o) => o.fulfillment_status === 'cooking' || o.fulfillment_status === 'packaging')
      case 'transit':
        return orders.filter((o) => o.fulfillment_status === 'in_transit')
      case 'delivered':
        return orders.filter((o) => o.fulfillment_status === 'delivered')
      default:
        return orders
    }
  }, [orders, activeTab])

  const handleOpenDetails = (order: WebsiteOrder) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  // Column definitions matching project DataTable standards
  const columns: ColumnDef<WebsiteOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 130,
      accessor: (o) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {o.order_ref}
        </span>
      ),
      sortValue: (o) => o.order_ref
    },
    {
      key: 'customer',
      header: 'Customer',
      defaultWidth: 190,
      accessor: (o) => (
        <div>
          <div className="font-medium text-xs text-kumo-strong">{o.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>{o.phone}</span>
          </div>
        </div>
      ),
      sortValue: (o) => o.customer_name
    },
    {
      key: 'items',
      header: 'Items Ordered',
      defaultWidth: 260,
      accessor: (o) => (
        <div>
          <span className="text-xs font-medium text-kumo-strong line-clamp-1">
            {o.items_summary}
          </span>
          <span className="text-[11px] text-kumo-subtle block">
            Channel: {o.channel}
          </span>
        </div>
      ),
      sortValue: (o) => o.items_summary
    },
    {
      key: 'address',
      header: 'Delivery Location',
      defaultWidth: 220,
      accessor: (o) => (
        <div className="flex items-start gap-1 text-xs text-kumo-default">
          <MapPin className="w-3.5 h-3.5 text-kumo-subtle shrink-0 mt-0.5" />
          <span className="line-clamp-1">{o.address}</span>
        </div>
      ),
      sortValue: (o) => o.address
    },
    {
      key: 'amount',
      header: 'Amount',
      defaultWidth: 120,
      accessor: (o) => (
        <div className="text-right">
          <span className="font-semibold text-xs text-kumo-strong">
            {formatNaira(o.total_amount)}
          </span>
        </div>
      ),
      sortValue: (o) => o.total_amount
    },
    {
      key: 'payment',
      header: 'Payment',
      defaultWidth: 120,
      accessor: (o) => (
        <StatusBadge
          status={o.payment_status === 'paid' ? 'PAID' : 'PENDING'}
          label={o.payment_status === 'paid' ? 'Paid' : 'Pending'}
          size="sm"
        />
      ),
      sortValue: (o) => o.payment_status
    },
    {
      key: 'status',
      header: 'Fulfillment',
      defaultWidth: 145,
      accessor: (o) => {
        const stageMap: Record<string, { status: BadgeStatus | string; label: string }> = {
          in_intake: { status: 'ORDER_INTAKE', label: 'Order Intake' },
          cooking: { status: 'COOKING', label: 'Cooking' },
          packaging: { status: 'PACKAGING', label: 'Packaging' },
          in_transit: { status: 'IN_TRANSIT', label: 'In Transit' },
          delivered: { status: 'DELIVERED', label: 'Delivered' }
        }
        const config = stageMap[o.fulfillment_status] || { status: 'PENDING', label: 'Pending' }
        return <StatusBadge status={config.status} label={config.label} size="sm" />
      },
      sortValue: (o) => o.fulfillment_status
    },
    {
      key: 'rider',
      header: 'Rider Assigned',
      defaultWidth: 160,
      accessor: (o) => (
        <span className="text-xs text-kumo-default truncate block">
          {o.rider_name}
        </span>
      ),
      sortValue: (o) => o.rider_name
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 140,
      accessor: (o) => (
        <div className="flex items-center gap-2">
          <TableActionButton
            variant="outline"
            onClick={() => handleOpenDetails(o)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </TableActionButton>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header (Matching RawInventoryPage template replica) */}
      <PageHeader
        title="Website Sales Orders"
        subtitle="Manage customer orders originating directly from the website storefront, track payment confirmation, and monitor live kitchen-to-doorstep dispatch."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/overview')}
              leftIcon={<ExternalLink className="w-4 h-4 text-blue-600" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Order Flow Canvas
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const newOrder: WebsiteOrder = {
                  id: Date.now(),
                  order_ref: `SHD-0${Math.floor(7000 + Math.random() * 2000)}`,
                  customer_name: "New Web Customer",
                  phone: "08012345678",
                  address: "12 Victoria Island, Lagos",
                  items_summary: "Full Guinea Fowl + Jollof Tub",
                  total_amount: 32500,
                  delivery_fee: 3000,
                  channel: "Website Storefront",
                  payment_status: "paid",
                  fulfillment_status: "in_intake",
                  scheduled_delivery_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                  rider_name: "Pending Assignment",
                  notes: "Real-time incoming web checkout order"
                }
                setOrders((prev) => [newOrder, ...prev])
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Simulate Web Order
            </Button>
          </div>
        }
      />

      {/* 2. KPI Stat Strip (4 MetricCards matching RawInventoryPage) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Web Orders"
          value={totalOrdersCount}
          description="Storefront customer intake"
          icon={<ShoppingBag className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Total Gross Revenue"
          value={formatNaira(totalGrossRevenue)}
          description="Customer payment settlement"
          trend={{ value: 12.5, isPositive: true }}
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Kitchen & Packaging"
          value={activeFulfillmentCount}
          description="Orders being prepped"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          variant="default"
        />
        <MetricCard
          title="Out for Delivery"
          value={outForDeliveryCount}
          description="Active riders on transit"
          icon={<Truck className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* 3. Filter Tabs (KumoTabs matching RawInventoryPage) */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Orders', badge: orders.length },
            {
              id: 'intake',
              label: 'Order Intake',
              badge: orders.filter((o) => o.fulfillment_status === 'in_intake').length
            },
            {
              id: 'kitchen',
              label: 'Kitchen & Packaging',
              badge: activeFulfillmentCount
            },
            {
              id: 'transit',
              label: 'Out for Delivery',
              badge: outForDeliveryCount
            },
            {
              id: 'delivered',
              label: 'Delivered',
              badge: deliveredCount
            }
          ]}
        />
      </div>

      {/* 4. DataTable with Search, Category filters, and Full Order Data */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search order ID, customer name, phone, or address..."
        tableId="website_orders_table"
        exportFilename="website_orders.csv"
      />

      {/* 5. Order Details Modal */}
      {selectedOrder && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Order Details: ${selectedOrder.order_ref}`}
          className="max-w-lg"
        >
          <div className="space-y-4 text-sm sm:text-base font-sans">
            <div className="rounded-xl bg-kumo-canvas border border-kumo-line p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Customer:</span>
                <span className="font-semibold text-kumo-strong">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Phone:</span>
                <span className="font-medium text-kumo-default">{selectedOrder.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Delivery Address:</span>
                <span className="font-medium text-kumo-strong text-right max-w-[240px]">
                  {selectedOrder.address}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-kumo-canvas border border-kumo-line p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Ordered Items:</span>
                <span className="font-semibold text-kumo-strong text-right">
                  {selectedOrder.items_summary}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Order Total:</span>
                <span className="font-bold text-base sm:text-lg text-kumo-strong">
                  {formatNaira(selectedOrder.total_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Delivery Fee:</span>
                <span className="font-medium text-kumo-default">
                  {formatNaira(selectedOrder.delivery_fee)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Payment Status:</span>
                <StatusBadge
                  status={selectedOrder.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                  label={selectedOrder.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  size="md"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Fulfillment Stage:</span>
                <StatusBadge
                  status={
                    selectedOrder.fulfillment_status === 'in_intake' ? 'ORDER_INTAKE' :
                    selectedOrder.fulfillment_status === 'cooking' ? 'COOKING' :
                    selectedOrder.fulfillment_status === 'packaging' ? 'PACKAGING' :
                    selectedOrder.fulfillment_status === 'in_transit' ? 'IN_TRANSIT' : 'DELIVERED'
                  }
                  label={
                    selectedOrder.fulfillment_status === 'in_intake' ? 'Order Intake' :
                    selectedOrder.fulfillment_status === 'cooking' ? 'Cooking' :
                    selectedOrder.fulfillment_status === 'packaging' ? 'Packaging' :
                    selectedOrder.fulfillment_status === 'in_transit' ? 'In Transit' : 'Delivered'
                  }
                  size="md"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kumo-subtle">Assigned Rider:</span>
                <span className="font-medium text-kumo-strong">{selectedOrder.rider_name}</span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300">
              <span className="font-semibold block mb-0.5">Order Notes:</span>
              <span>{selectedOrder.notes}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsDetailsModalOpen(false)
                  navigate('/overview')
                }}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                View in Flow Diagram
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default WebsiteOrdersPage
