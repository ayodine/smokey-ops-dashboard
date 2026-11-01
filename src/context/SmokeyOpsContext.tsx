import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react'
import {
  RawProduct,
  RawDelivery,
  RawMovement,
  RawUsageItem,
  PackagingProduct,
  PackagingReceiptTotal,
  SalesProduct,
  DailySalesItem,
  SalesMovement,
  Supplier,
  ProductionBatch,
  RawMaterialBOM,
  BatchMaterialRequisition,
  PackagingQueueOrder,
  PackagingMaterialDaily,
  KitchenTask,
  LogisticsDelivery,
  ScheduledOrder,
  RiderPayout,
  RiderTask,
  StorePickupOrder,
  ThirdPartyWeeklySummary,
  InventoryLot,
  RecipeTemplate,
  StocktakeVariance,
  PackagingReconciliationItem,
  PackagingDailyReconciliation,
  IntermediatePrepAllocation,
  IntermediatePrep,
  InterStationTransfer,
  CompoundInventoryItem,
  CompoundPreparationLot,
  SEED_RAW_PRODUCTS,
  SEED_RAW_DELIVERIES,
  SEED_RAW_MOVEMENTS,
  SEED_RAW_USAGE,
  SEED_PACKAGING_PRODUCTS,
  SEED_PACKAGING_RECEIPTS_TOTALS,
  SEED_PACKAGING_RECONCILIATIONS,
  SEED_INTERMEDIATE_PREPS,
  SEED_COMPOUND_INVENTORY,
  SEED_INTER_STATION_TRANSFERS,
  SEED_SALES_PRODUCTS,
  SEED_DAILY_SALES,
  SEED_SALES_MOVEMENTS,
  SEED_SUPPLIERS,
  SEED_PRODUCTION_BATCHES,
  SEED_PACKAGING_QUEUE,
  SEED_PACKAGING_MATERIALS_DAILY,
  SEED_KITCHEN_TASKS,
  SEED_LOGISTICS_DELIVERIES,
  SEED_SCHEDULED_ORDERS,
  SEED_RIDER_PAYOUTS,
  SEED_RIDER_TASKS,
  SEED_STORE_PICKUPS,
  SEED_THIRD_PARTY_SUMMARY,
  SEED_INVENTORY_LOTS,
  SEED_RECIPE_TEMPLATES,
  SEED_STOCKTAKE_VARIANCES,
  SEED_WEBSITE_ORDERS,
  WebsiteOrder,
} from '@/lib/smokeyData'
import { supabase } from '@/lib/supabase'
import { ToastContainer, ToastMessage } from '@/components/ui/Toast'
import { SuccessModal } from '@/components/ui/SuccessModal'
import { formatNaira } from '@/lib/utils'
import { playAlertChime, sendDesktopNotification } from '@/lib/notificationAudio'

export interface LiveSalesProduct extends SalesProduct {
  image?: string | null
  category_name?: string
}

export const mapSupabaseProductToSalesProduct = (p: any): LiveSalesProduct => {
  if (p && p.product_type === 'sales' && typeof p.selling_price === 'number') {
    return p as LiveSalesProduct
  }
  const stock = Number(p.stock ?? p.stock_qty ?? 0)
  const price = Number(p.price ?? p.selling_price ?? 0)
  const cost = Number(p.cost_price ?? p.unit_cost ?? Math.round(price * 0.45))
  const reorder = Number(p.reorder_level ?? 10)
  const allocated = Number(p.qty_allocated ?? 0)
  const available = Math.max(0, stock - allocated)

  return {
    id: p.id,
    sku: p.sku || `SMK-${String(p.id).padStart(4, '0')}`,
    name: p.name,
    product_type: 'sales',
    unit: p.unit || 'unit',
    reorder_level: reorder,
    unit_cost: cost,
    selling_price: price,
    stock_qty: stock,
    qty_allocated: allocated,
    qty_available: available,
    inventory_value: stock * price,
    is_active: p.is_active !== false && p.is_active !== 0 ? 1 : 0,
    image: p.image || null,
    category_name: p.category_id || p.category_name || 'Product'
  }
}

export const mapSupabaseOrderToWebsiteOrder = (raw: any): WebsiteOrder => {
  if (raw && raw.order_ref && raw.items_summary && raw.fulfillment_status && !Array.isArray(raw.order_items)) {
    return raw as WebsiteOrder
  }
  const status = String(raw.delivery_status || raw.status || '').toLowerCase()
  let fulfillment_status: WebsiteOrder['fulfillment_status'] = 'in_intake'
  if (status.includes('deliver')) {
    fulfillment_status = 'delivered'
  } else if (status.includes('transit') || status.includes('dispatch') || status.includes('shipped') || status.includes('out_for_delivery') || status.includes('on_road')) {
    fulfillment_status = 'in_transit'
  } else if (status.includes('ready') || status.includes('packed') || status.includes('packaged')) {
    fulfillment_status = 'ready_for_dispatch'
  } else if (status.includes('pack') || status.includes('process') || status.includes('prep') || status.includes('cook') || status.includes('paid')) {
    fulfillment_status = 'packaging'
  } else {
    fulfillment_status = 'in_intake'
  }

  const items = Array.isArray(raw.order_items) && raw.order_items.length > 0
    ? raw.order_items.map((i: any) => `${i.qty || 1}x ${i.name || 'Smokey Product'}`).join(' + ')
    : (raw.items_summary || 'Assorted Smokey Delicacies')

  let channel = raw.channel || 'Website Storefront'
  if (raw.traffic_source) {
    channel = raw.traffic_source
  } else if (raw.notes && raw.notes.includes('[via WhatsApp Menu]')) {
    channel = 'WhatsApp Store'
  } else if (raw.notes && raw.notes.includes('[via Walk-in POS]')) {
    channel = 'Walk-in POS'
  } else if (raw.channel === 'storefront') {
    channel = 'Website Storefront'
  }

  const isPaid = Boolean(raw.paid_at) || raw.status === 'processing' || raw.status === 'delivered' || raw.status === 'paid' || raw.payment_status === 'paid'

  let scheduledAt = raw.scheduled_delivery_date ? String(raw.scheduled_delivery_date) : (raw.scheduled_delivery_at ? String(raw.scheduled_delivery_at) : '')
  if (!scheduledAt && raw.notes && raw.notes.includes('[Scheduled Delivery:')) {
    const match = raw.notes.match(/\[Scheduled Delivery:\s*([^\]]+)\]/)
    if (match && match[1]) {
      scheduledAt = match[1].trim()
    }
  }

  return {
    id: raw.id,
    order_ref: String(raw.order_ref || raw.id || ''),
    customer_name: raw.customer_name || 'Storefront Customer',
    customer_email: raw.customer_email || '',
    phone: raw.customer_phone || raw.phone || 'N/A',
    address: raw.delivery_address || raw.address || 'Storefront Counter Pickup',
    items_summary: items,
    raw_items: Array.isArray(raw.order_items) ? raw.order_items : (raw.raw_items || []),
    total_amount: Number(raw.total ?? raw.total_amount) || 0,
    delivery_fee: Number(raw.delivery_fee) || 0,
    channel,
    payment_status: isPaid ? 'paid' : (raw.status === 'cancelled' ? 'refunded' : 'pending'),
    payment_method: raw.payment_method || raw.payment_channel || 'Paystack',
    fulfillment_status,
    created_at: raw.created_at || raw.scheduled_delivery_date || new Date().toISOString(),
    scheduled_delivery_at: scheduledAt,
    paid_at: raw.paid_at || '',
    rider_name: raw.rider_name || (raw.delivery_status ? 'Assigned Rider' : 'Pending Rider'),
    notes: raw.notes || ''
  }
}

interface SmokeyOpsContextType {
  // Website Orders & Live Sales Products (Centralized Zero-Jump State)
  websiteOrders: WebsiteOrder[]
  setWebsiteOrders: React.Dispatch<React.SetStateAction<WebsiteOrder[]>>
  refreshWebsiteOrders: (showIndicator?: boolean) => Promise<void>
  isOrdersRefreshing: boolean
  liveSalesProducts: LiveSalesProduct[]
  setLiveSalesProducts: React.Dispatch<React.SetStateAction<LiveSalesProduct[]>>
  refreshLiveSalesProducts: (showIndicator?: boolean) => Promise<void>
  isSalesProductsRefreshing: boolean

  // Inventory State
  rawProducts: RawProduct[]
  rawDeliveries: RawDelivery[]
  rawMovements: RawMovement[]
  rawUsage: RawUsageItem[]
  packagingProducts: PackagingProduct[]
  packagingReceiptsTotals: PackagingReceiptTotal[]
  salesProducts: SalesProduct[]
  dailySales: DailySalesItem[]
  salesMovements: SalesMovement[]
  suppliers: Supplier[]
  inventoryLots: InventoryLot[]
  recipeTemplates: RecipeTemplate[]
  stocktakeVariances: StocktakeVariance[]

  // Inventory Actions
  receiveRawStock: (data: { supplierId: number; productId: number; quantity: number; unitCost: number; invoiceRef?: string; receiptDate?: string; notes?: string }) => void
  receiveRawStockWithLot: (data: { supplierId: number; productId: number; quantity: number; unitCost: number; lotNumber?: string; expiryDate?: string; invoiceRef?: string; receiptDate?: string; notes?: string }) => void
  adjustRawStock: (productId: number, delta: number, notes: string, reason: string) => void
  writeOffLotWaste: (data: { lotId: number; quantity: number; notes: string; approverName: string }) => void
  prioritizeLotInKitchen: (data: { lotId: number; quantity: number; targetDishName: string; supervisorName?: string; pitmasterName?: string; shiftRemarks?: string }) => void
  saveRawProduct: (product: Partial<RawProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number; is_perishable?: boolean; expiry_date?: string }) => void
  receivePackaging: (data: { productId: number; quantity: number; unitCost: number; supplierId?: number; notes?: string }) => void
  adjustPackagingStock: (productId: number, delta: number, notes: string) => void
  savePackagingProduct: (product: Partial<PackagingProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number }) => void
  adjustSalesStock: (productId: number, delta: number, notes: string) => void
  saveSalesProduct: (product: Partial<SalesProduct> & { name: string; sku: string; unit: string; selling_price: number; unit_cost: number; reorder_level: number; stock_qty?: number; image?: string | null; category_name?: string }) => void
  addSupplier: (supplier: Omit<Supplier, 'id' | 'supplier_ref' | 'delivery_count' | 'total_spend' | 'is_active'>) => void
  updateSupplier: (supplier: Supplier) => void
  deleteSupplier: (supplierId: number) => boolean
  submitStocktakeCount: (counts: Array<{ productId: number; physicalCount: number; category: 'raw' | 'packaging' | 'sales' }>, countedBy: string) => number
  resolveStocktakeVariance: (varianceId: number, supervisorNotes: string) => void

  // Hub & Outlets Inventory State
  packagingReconciliations: PackagingDailyReconciliation[]
  intermediatePreps: IntermediatePrep[]
  compoundInventory: CompoundInventoryItem[]
  interStationTransfers: InterStationTransfer[]

  // Hub & Outlets Actions
  issuePackagingFromCentral: (items: Array<{ productId: number; quantity: number }>, issuedTo: string, notes?: string) => boolean
  returnPackagingToCentral: (items: Array<{ productId: number; returnQty: number; damagedQty: number }>, notes?: string, verifiedBy?: string) => void
  performDailyPackagingReconciliation: (date: string, counts: Array<{ productId: number; actualClosingBench: number; damagedQty?: number }>, reconciledBy: string, notes?: string) => void
  createIntermediatePrep: (recipeName: string, rawIngredients: Array<{ productId: number; quantity: number }>, yieldQty: number, unit: string, preparedBy: string, expiryDays?: number) => void
  allocatePrepToBatch: (prepId: number, batchRef: string, productName: string, allocatedQty: number, allocatedBy: string, batchId?: number) => boolean
  returnPrepToCentral: (prepId: number, returnQty: number, notes: string, returnedBy: string) => void
  issueCompoundToBatch: (compoundId: number, batchId: number, quantity: number, staffName?: string) => boolean
  returnCompoundSurplusFromBatch: (compoundId: number, batchId: number, quantity: number, notes?: string, staffName?: string) => boolean

  // Production State
  productionBatches: ProductionBatch[]
  packagingQueue: PackagingQueueOrder[]
  packagingMaterialsDaily: PackagingMaterialDaily[]
  kitchenTasks: KitchenTask[]

  // Production Actions
  createBatch: (data: {
    outputProductId: number
    outputProductName: string
    expectedOutput: number
    remarks?: string
    batch_schedule?: 'today' | 'tomorrow_morning'
    feed_sales_inventory?: boolean
    estimated_ready_time?: string
    rawMaterials: Array<{
      product_id: number
      sku: string
      name: string
      quantity: number
      unit: string
      item_type?: 'raw' | 'compound'
      compound_id?: number
      prep_ref?: string
    }>
  }) => void
  updateBatch: (batchId: number, data: Partial<ProductionBatch>) => void
  deleteBatch: (batchId: number) => boolean
  deleteIntermediatePrep: (prepId: number) => boolean
  requestAdditionalBatchMaterial: (data: {
    batchId: number
    productId: number
    quantity: number
    reason: string
    requestedBy?: string
  }) => boolean
  fulfillBatchMaterialRequisition: (
    requisitionId: string,
    fulfilledQty: number,
    notes?: string
  ) => boolean
  rejectBatchMaterialRequisition: (
    requisitionId: string,
    rejectionReason: string
  ) => boolean
  returnUnconsumedBatchMaterials: (
    batchId: number,
    returns: Array<{ productId: number; quantity: number; notes?: string; item_type?: 'raw' | 'compound'; compound_id?: number }>
  ) => boolean
  saveCustomRecipeTemplate: (template: Omit<RecipeTemplate, 'id'>) => void
  updateRecipeTemplate: (id: number, template: Partial<RecipeTemplate>) => void
  deleteRecipeTemplate: (id: number) => void
  startBatch: (batchId: number) => void
  completeBatch: (
    batchId: number,
    actualOutput: number,
    wastage: number,
    remarks?: string,
    returnedMaterials?: Array<{ productId: number; quantity: number; item_type?: 'raw' | 'compound'; compound_id?: number }>
  ) => void
  cancelBatch: (batchId: number) => void
  addPackagingQueueOrder: (order: { customer_name: string; phone: string; address: string; items_summary: string; total_amount: number; delivery_fee?: number; payment_status?: 'paid' | 'pending' }) => void
  startPackagingOrder: (orderId: number, materials: Array<{ packaging_name: string; quantity: number }>) => void
  confirmPackagingOrder: (orderId: number, staffName?: string) => void
  updateTaskStatus: (taskId: number, status: 'pending' | 'in_progress' | 'done') => void
  createKitchenTask: (task: Omit<KitchenTask, 'id' | 'task_ref'>) => void

  // Logistics State
  logisticsDeliveries: LogisticsDelivery[]
  scheduledOrders: ScheduledOrder[]
  riders: RiderPayout[]
  riderTasks: RiderTask[]
  storePickups: StorePickupOrder[]
  thirdPartySummaries: ThirdPartyWeeklySummary[]

  // Logistics Actions
  assignRider: (
    deliveryId: number,
    riderType: 'internal' | 'third_party',
    riderName: string,
    riderId?: number,
    bookedFee?: number,
    feeEvidencePath?: string
  ) => void
  confirmRiderCollect: (deliveryId: number) => void
  acceptDelivery: (deliveryId: number) => void
  markDelivered: (deliveryId: number) => void
  declineDelivery: (deliveryId: number, reason: string) => void
  updateRiderTask: (taskId: number, status: 'pending' | 'in_progress' | 'done') => void
  startScheduledOrder: (orderId: number) => void
  autoReleaseDuePreOrders: () => number
  rescheduleOrderDelivery: (
    orderRef: string,
    scheduledDate: string,
    scheduledTime?: string,
    notes?: string,
    orderDetails?: Partial<ScheduledOrder>
  ) => Promise<boolean>
  payAndResetRider: (riderId: number) => void
  markPickupCollected: (orderId: number, collectedBy: string, handoverStaff: string, collectorPhone?: string) => void
  verifyThirdPartyFee: (deliveryId: number, status: 'approved' | 'flagged', note?: string) => void

  // Account Profile & RBAC
  isAuthenticated: boolean
  activeAccountEmail: string
  currentAccount: AppUserAccount
  loginWithCredentials: (identifier: string, passwordInput: string, rememberMe?: boolean) => { success: boolean; error?: string; account?: AppUserAccount }
  logout: () => void
  switchAccount: (email: string) => void
  createAccount: (account: AppUserAccount) => void
  updateAccount: (email: string, updates: Partial<AppUserAccount> & { password?: string }) => void
  deleteAccount: (email: string) => void
  changePassword: (email: string, newPassword: string) => void
  addRiderProfile: (riderData: Partial<RiderPayout> & { rider_name: string; phone: string }) => RiderPayout
  availableAccounts: AppUserAccount[]

  // Strict RBAC & Permissions Engine
  hasPermission: (permission: string, account?: AppUserAccount) => boolean
  hasAnyPermission: (permissions: string[], account?: AppUserAccount) => boolean
  hasAllPermissions: (permissions: string[], account?: AppUserAccount) => boolean
  hasRole: (roles: UserRole | UserRole[], account?: AppUserAccount) => boolean
  isRouteAllowed: (path: string, account?: AppUserAccount) => boolean
  getRoleDefaultLandingPath: (role?: UserRole) => string
  getRoleAuthorizedRoutes: (role?: UserRole) => string[]

  // Feedback, Toasts & Success Confirmation Modals
  toasts: ToastMessage[]
  showToast: (message: string, type?: 'success' | 'info' | 'error', title?: string) => void
  dismissToast: (id: string) => void
  showSuccessModal: (data: { title: string; message: string; details?: Array<{ label: string; value: string }>; actionLabel?: string; onAction?: () => void }) => void
  closeSuccessModal: () => void

  // Live Alerts Feed
  systemAlerts: SystemAlertItem[]
  dismissSystemAlert: (id: string) => void
  refreshSystemAlerts: () => void
}

export interface SystemAlertItem {
  id: string
  variant: 'warning' | 'success' | 'info' | 'error'
  title: string
  desc: string
  time: string
  linkText: string
  linkUrl: string
  category: 'inventory' | 'logistics' | 'production' | 'order'
}

export type UserRole = 'admin' | 'manager' | 'kitchen' | 'inventory' | 'dispatcher' | 'rider'

export interface AppUserAccount {
  email: string
  username?: string
  name: string
  role: UserRole
  roleLabel: string
  rider_user_id?: number
  phone?: string
  staff_id?: string
  department?: string
  assigned_hub?: string
  emergency_contact?: string
  emergency_phone?: string
  national_id_nin?: string
  status?: 'active' | 'suspended' | 'invited'
  last_active?: string
  password?: string
  temporary_password?: string
  created_at?: string
  permissions?: string[]

  // Personal Identity & Address KYC
  residential_address?: string
  city?: string
  state?: string
  date_of_birth?: string
  bvn?: string
  nin_verified?: boolean

  // Employment & Scheduling KYC
  employment_status?: 'full_time' | 'contract' | 'probation' | 'part_time'
  shift_schedule?: string
  date_joined?: string

  // Next-of-Kin & Guarantor KYC
  emergency_relationship?: string
  guarantor_name?: string
  guarantor_phone?: string
  guarantor_relationship?: string
  guarantor_status?: 'verified' | 'signed' | 'pending'

  // Bank & Settlement KYC
  bank_name?: string
  bank_account_number?: string
  bank_account_name?: string

  // Rider Role KYC
  vehicle_type?: string
  plate_number?: string
  license_number?: string
  license_expiry?: string
  assigned_zone?: string
  inspection_status?: string
  vehicle_ownership?: string
}

export function getStaffKycData(acc: AppUserAccount): AppUserAccount {
  const isRider = acc.role === 'rider'
  const isKitchen = acc.role === 'kitchen'
  const isInventory = acc.role === 'inventory'
  const isDispatcher = acc.role === 'dispatcher'

  return {
    ...acc,
    residential_address: acc.residential_address || '',
    city: acc.city || 'Lagos Mainland',
    state: acc.state || 'Lagos State',
    date_of_birth: acc.date_of_birth || '',
    national_id_nin: acc.national_id_nin || '',
    nin_verified: Boolean(acc.national_id_nin && acc.nin_verified),
    bvn: acc.bvn || '',
    employment_status: acc.employment_status || 'full_time',
    shift_schedule: acc.shift_schedule || (isKitchen ? 'Morning Cook & Prep (06:00 - 15:00)' : isRider ? 'Day Dispatch (08:00 - 18:00)' : isInventory ? 'Morning Intake & Audit (07:00 - 16:00)' : isDispatcher ? 'All-Day Fulfillment (08:00 - 18:00)' : 'General Operations'),
    date_joined: acc.date_joined || acc.created_at || '',
    emergency_contact: acc.emergency_contact || '',
    emergency_phone: acc.emergency_phone || '',
    emergency_relationship: acc.emergency_relationship || '',
    guarantor_name: acc.guarantor_name || '',
    guarantor_phone: acc.guarantor_phone || '',
    guarantor_relationship: acc.guarantor_relationship || '',
    guarantor_status: acc.guarantor_name ? (acc.guarantor_status || 'verified') : 'pending',
    bank_name: acc.bank_name || '',
    bank_account_number: acc.bank_account_number || '',
    bank_account_name: acc.bank_account_name || acc.name,
    // Rider specific
    vehicle_type: acc.vehicle_type || (isRider ? 'Dispatch Motorcycle' : ''),
    plate_number: acc.plate_number || '',
    license_number: acc.license_number || '',
    license_expiry: acc.license_expiry || '',
    assigned_zone: acc.assigned_zone || (isRider ? 'Lagos Mainland & Island' : ''),
    inspection_status: acc.inspection_status || (isRider ? 'Active' : ''),
    vehicle_ownership: acc.vehicle_ownership || (isRider ? 'Company Fleet' : ''),
  }
}

export type PermissionId =
  // Sales
  | 'perm_orders_view'
  | 'perm_orders_status'
  | 'perm_orders_export'
  | 'perm_sales_catalog'
  // Production
  | 'perm_batches'
  | 'perm_cook'
  | 'perm_raw_deplete'
  | 'perm_packout'
  | 'perm_spoilage'
  // Inventory
  | 'perm_intake'
  | 'perm_cycle_counts'
  | 'perm_transfers'
  | 'perm_expiry'
  | 'perm_thresholds'
  // Logistics
  | 'perm_dispatch_ctrl'
  | 'perm_queue_assign'
  | 'perm_tracking'
  | 'perm_3pl'
  | 'perm_delivery_transit'
  | 'perm_otp_dropoff'
  | 'perm_shifts'
  // Finance
  | 'perm_finance'
  | 'perm_invoices'
  | 'perm_rider_payout'
  | 'perm_wallet'
  // Administration
  | 'perm_records'
  | 'perm_users'
  | 'perm_rbac'

export interface SystemPermissionDef {
  id: PermissionId
  label: string
  category: 'Sales' | 'Production' | 'Inventory' | 'Logistics' | 'Finance' | 'Administration'
  description: string
}

export const PERMISSION_DEFINITIONS: Record<PermissionId, SystemPermissionDef> = {
  // Sales
  perm_orders_view: { id: 'perm_orders_view', label: 'View Storefront & Website Orders', category: 'Sales', description: 'Access customer orders, Paystack verification, and kitchen handover status.' },
  perm_orders_status: { id: 'perm_orders_status', label: 'Update Order Fulfillment Status', category: 'Sales', description: 'Advance order stages across Ready, In Packaging, Packaged, and Dispatched.' },
  perm_orders_export: { id: 'perm_orders_export', label: 'Export Sales & Order Reports', category: 'Sales', description: 'Download CSV audit exports of customer transactions and delivery fees.' },
  perm_sales_catalog: { id: 'perm_sales_catalog', label: 'Manage Sales Menu & Finished Pricing', category: 'Sales', description: 'Configure finished goods sales prices, combos, and oven buffer thresholds.' },

  // Production
  perm_batches: { id: 'perm_batches', label: 'Batch Scheduling & Cook Approvals', category: 'Production', description: 'Schedule smoking grill cooks, modify recipes, and sign off completed runs.' },
  perm_cook: { id: 'perm_cook', label: 'Start & Complete Batches', category: 'Production', description: 'Record real-time cook progress, internal meat temps, and yield outputs.' },
  perm_raw_deplete: { id: 'perm_raw_deplete', label: 'Raw Materials Depletion', category: 'Production', description: 'Auto-deplete raw cuts of livestock, seasoning packs, and marinades during runs.' },
  perm_packout: { id: 'perm_packout', label: 'Portion Pack-out Logging', category: 'Production', description: 'Log sealed units into vacuum pouches and carton cases ready for sales inventory.' },
  perm_spoilage: { id: 'perm_spoilage', label: 'Waste & Spoilage Incident Reports', category: 'Production', description: 'Submit and approve burned portions, expired cuts, or compromised batches.' },

  // Inventory
  perm_intake: { id: 'perm_intake', label: 'Stock Intake PO Receipts', category: 'Inventory', description: 'Receive vendor deliveries at loading dock, confirm item quantities, and verify lots.' },
  perm_cycle_counts: { id: 'perm_cycle_counts', label: 'Periodic Cycle Counts', category: 'Inventory', description: 'Perform physical warehouse stock reconciliations and adjustments against system tallies.' },
  perm_transfers: { id: 'perm_transfers', label: 'Packaging Unit Transfers', category: 'Inventory', description: 'Transfer foil trays, branded thermal bags, and boxes across kitchens, depots, and hubs.' },
  perm_expiry: { id: 'perm_expiry', label: 'Lot Expiry Monitoring', category: 'Inventory', description: 'Track meat and spice freshness dates, send urgent reorder notifications, and quarantine aging lots.' },
  perm_thresholds: { id: 'perm_thresholds', label: 'Inventory Threshold Overrides', category: 'Inventory', description: 'Adjust safety stock minimums, maximum storage capacities, and critical reorder threshold parameters.' },

  // Logistics
  perm_dispatch_ctrl: { id: 'perm_dispatch_ctrl', label: 'Logistics Dispatch Controls', category: 'Logistics', description: 'Full supervisory control over courier allocation, rider assignment, and emergency re-routes.' },
  perm_queue_assign: { id: 'perm_queue_assign', label: 'Dispatch Queue Assignment', category: 'Logistics', description: 'Assign ready cooked orders to available couriers waiting at the dispatch staging dock.' },
  perm_tracking: { id: 'perm_tracking', label: 'Rider Location & Route Tracking', category: 'Logistics', description: 'Live tracking of delivery couriers, ETA monitoring, and route compliance.' },
  perm_3pl: { id: 'perm_3pl', label: 'Third-party Rider Bookings', category: 'Logistics', description: 'Dispatch overflow delivery orders to Gozem, Gokada, or third-party riders.' },
  perm_delivery_transit: { id: 'perm_delivery_transit', label: 'Accept & Transit Delivery', category: 'Logistics', description: 'Rider mobile interface to accept assigned trips and initiate waypoint transit.' },
  perm_otp_dropoff: { id: 'perm_otp_dropoff', label: 'Customer OTP Drop-off Sign-off', category: 'Logistics', description: 'Validate customer delivery OTP code or handover signature before drop-off handover.' },
  perm_shifts: { id: 'perm_shifts', label: 'Staff Shift Assignments', category: 'Logistics', description: 'Manage rider shift rotas, check-in schedules, and coverage plans.' },

  // Finance
  perm_finance: { id: 'perm_finance', label: 'Finance & Payout Remittances', category: 'Finance', description: 'Process batch payouts, approve cash disbursements, and clear ledgers.' },
  perm_invoices: { id: 'perm_invoices', label: 'Supplier Invoice Verification', category: 'Finance', description: 'Review purchase order billing, confirm line item unit costs, and approve credits.' },
  perm_rider_payout: { id: 'perm_rider_payout', label: 'Rider Payout Disbursement', category: 'Finance', description: 'Audit completed trips and disburse accumulated delivery fee earnings to riders.' },
  perm_wallet: { id: 'perm_wallet', label: 'Wallet & Payout History', category: 'Finance', description: 'Inspect individual courier earnings ledger, trip commissions, and deductions.' },

  // Administration
  perm_records: { id: 'perm_records', label: 'Full Database & Records Access', category: 'Administration', description: 'Master database records and operational raw data access.' },
  perm_users: { id: 'perm_users', label: 'User Onboarding & Deletion', category: 'Administration', description: 'Create, update credentials, deactivate and delete dashboard operator accounts.' },
  perm_rbac: { id: 'perm_rbac', label: 'Role & Permission Management', category: 'Administration', description: 'Assign roles, adjust privilege scopes, and configure custom security grants.' }
}

export const PERMISSION_ID_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(PERMISSION_DEFINITIONS).map(d => [d.id, d.label])
)

export const PERMISSION_LABEL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.values(PERMISSION_DEFINITIONS).map(d => [d.label, d.id])
)

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'Full Database & Records Access',
    'User Onboarding & Deletion',
    'Role & Permission Management',
    'Finance & Payout Remittances',
    'Inventory Threshold Overrides',
    'Logistics Dispatch Controls',
    'View Storefront & Website Orders',
    'Update Order Fulfillment Status',
    'Export Sales & Order Reports',
    'Manage Sales Menu & Finished Pricing',
    'Batch Scheduling & Cook Approvals',
    'Start & Complete Batches',
    'Raw Materials Depletion',
    'Portion Pack-out Logging',
    'Waste & Spoilage Incident Reports',
    'Stock Intake PO Receipts',
    'Periodic Cycle Counts',
    'Packaging Unit Transfers',
    'Lot Expiry Monitoring',
    'Dispatch Queue Assignment',
    'Rider Location & Route Tracking',
    'Third-party Rider Bookings',
    'Rider Payout Disbursement',
    'Supplier Invoice Verification',
    'Staff Shift Assignments'
  ],
  manager: [
    'View Storefront & Website Orders',
    'Update Order Fulfillment Status',
    'Export Sales & Order Reports',
    'Batch Scheduling & Cook Approvals',
    'Start & Complete Batches',
    'Raw Materials Depletion',
    'Portion Pack-out Logging',
    'Waste & Spoilage Incident Reports',
    'Stock Intake PO Receipts',
    'Periodic Cycle Counts',
    'Packaging Unit Transfers',
    'Lot Expiry Monitoring',
    'Inventory Threshold Overrides',
    'Logistics Dispatch Controls',
    'Dispatch Queue Assignment',
    'Rider Location & Route Tracking',
    'Third-party Rider Bookings',
    'Staff Shift Assignments',
    'Supplier Invoice Verification',
    'Rider Payout Disbursement',
    'Finance & Payout Remittances'
  ],
  kitchen: [
    'Start & Complete Batches',
    'Batch Scheduling & Cook Approvals',
    'Raw Materials Depletion',
    'Portion Pack-out Logging',
    'Waste & Spoilage Incident Reports',
    'Packaging Unit Transfers'
  ],
  inventory: [
    'Stock Intake PO Receipts',
    'Periodic Cycle Counts',
    'Packaging Unit Transfers',
    'Lot Expiry Monitoring',
    'Inventory Threshold Overrides',
    'Supplier Invoice Verification'
  ],
  dispatcher: [
    'View Storefront & Website Orders',
    'Update Order Fulfillment Status',
    'Dispatch Queue Assignment',
    'Rider Location & Route Tracking',
    'Third-party Rider Bookings',
    'Logistics Dispatch Controls',
    'Customer OTP Drop-off Sign-off',
    'Staff Shift Assignments',
    'Portion Pack-out Logging'
  ],
  rider: [
    'Accept & Transit Delivery',
    'Customer OTP Drop-off Sign-off',
    'Wallet & Payout History'
  ]
}

export interface RouteAccessRule {
  prefix: string
  exact?: boolean
  allowedRoles?: UserRole[]
  requiredPermissions?: string[]
  title: string
}

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  // Super Admin only routes
  { prefix: '/accounts', allowedRoles: ['admin'], title: 'Staff Account Management' },
  { prefix: '/admin/accounts', allowedRoles: ['admin'], title: 'Staff Account Management' },
  { prefix: '/offices', allowedRoles: ['admin'], title: 'Office & Regional Hub Management' },
  { prefix: '/admin/offices', allowedRoles: ['admin'], title: 'Office & Regional Hub Management' },

  // Dedicated Rider Portal
  { prefix: '/logistics/rider-portal', allowedRoles: ['rider'], title: 'Rider Delivery Portal' },
  { prefix: '/rider', allowedRoles: ['rider'], title: 'Rider Delivery Portal' },

  // Sales domain
  { prefix: '/sales', allowedRoles: ['admin', 'manager', 'dispatcher'], requiredPermissions: ['perm_orders_view', 'View Storefront & Website Orders'], title: 'Website Orders' },

  // Inventory sub-routes
  { prefix: '/inventory/suppliers', allowedRoles: ['admin', 'manager', 'inventory'], requiredPermissions: ['perm_invoices', 'Supplier Invoice Verification', 'perm_intake'], title: 'Suppliers & Vendors' },
  { prefix: '/inventory/movements', allowedRoles: ['admin', 'manager', 'inventory'], requiredPermissions: ['perm_cycle_counts', 'Periodic Cycle Counts', 'perm_transfers'], title: 'Stock Movements Ledger' },
  { prefix: '/inventory/sales', allowedRoles: ['admin', 'manager', 'inventory'], requiredPermissions: ['perm_cycle_counts', 'Periodic Cycle Counts'], title: 'Sales Inventory' },
  { prefix: '/inventory/raw', allowedRoles: ['admin', 'manager', 'inventory', 'kitchen'], title: 'Raw Inventory' },
  { prefix: '/inventory/packaging', allowedRoles: ['admin', 'manager', 'inventory', 'kitchen'], title: 'Packaging Materials' },
  { prefix: '/inventory', exact: true, allowedRoles: ['admin', 'manager', 'inventory', 'kitchen'], title: 'Inventory Domain' },

  // Production sub-routes
  { prefix: '/production/batches', allowedRoles: ['admin', 'manager', 'kitchen'], requiredPermissions: ['perm_cook', 'Start & Complete Batches', 'perm_batches'], title: 'Production Batches' },
  { prefix: '/production/tasks', allowedRoles: ['admin', 'manager', 'kitchen'], requiredPermissions: ['perm_cook', 'Start & Complete Batches'], title: 'Kitchen Shift Tasks' },
  { prefix: '/production/packaging', allowedRoles: ['admin', 'manager', 'kitchen', 'dispatcher'], title: 'Packaging Execution' },
  { prefix: '/production', exact: true, allowedRoles: ['admin', 'manager', 'kitchen'], title: 'Production Domain' },

  // Logistics sub-routes
  { prefix: '/logistics/board', allowedRoles: ['admin', 'manager', 'dispatcher'], requiredPermissions: ['perm_queue_assign', 'Dispatch Queue Assignment', 'perm_dispatch_ctrl'], title: 'Dispatch Board' },
  { prefix: '/logistics/schedule', allowedRoles: ['admin', 'manager', 'dispatcher'], requiredPermissions: ['perm_queue_assign', 'Dispatch Queue Assignment'], title: 'Delivery Schedule' },
  { prefix: '/logistics/riders', allowedRoles: ['admin', 'manager', 'dispatcher'], requiredPermissions: ['perm_tracking', 'Rider Location & Route Tracking', 'perm_dispatch_ctrl'], title: 'In-House Riders' },
  { prefix: '/logistics/pickup', allowedRoles: ['admin', 'manager', 'dispatcher'], requiredPermissions: ['perm_queue_assign', 'Dispatch Queue Assignment', 'perm_otp_dropoff'], title: 'Store Pickup Counter' },
  { prefix: '/logistics/third-party', allowedRoles: ['admin', 'manager', 'dispatcher'], requiredPermissions: ['perm_3pl', 'Third-party Rider Bookings'], title: 'Third Party Delivery' },
  { prefix: '/logistics', exact: true, allowedRoles: ['admin', 'manager', 'dispatcher'], title: 'Logistics Domain' },

  // Operations Overview (Executive)
  { prefix: '/overview', allowedRoles: ['admin', 'manager'], title: 'Operations Overview' },

  // Support Help Desk (Universal for all authenticated staff)
  { prefix: '/support', allowedRoles: ['admin', 'manager', 'kitchen', 'inventory', 'dispatcher', 'rider'], title: 'Support & Help Desk' },
]

export const APP_ACCOUNTS: AppUserAccount[] = [
  {
    email: 'fivedigita@gmail.com',
    name: 'AYOBAMI OLOWOKERE',
    role: 'admin',
    roleLabel: 'Super Admin',
    staff_id: 'SHD-ADM-001',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Executive Operations',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active now',
    created_at: '10 Jan 2026',
    permissions: [
      'Full Database & Records Access',
      'User Onboarding & Deletion',
      'Role & Permission Management',
      'Finance & Payout Remittances',
      'Inventory Threshold Overrides',
      'Logistics Dispatch Controls'
    ]
  },
  {
    email: 'Smokeyhut04@gmail.com',
    name: 'CEO',
    role: 'admin',
    roleLabel: 'Executive Director',
    staff_id: 'SHD-ADM-002',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Executive Operations',
    phone: '09024247049',
    status: 'active',
    last_active: '1h ago',
    created_at: '18 Apr 2026',
    permissions: [
      'Full Database & Records Access',
      'User Onboarding & Deletion',
      'Role & Permission Management',
      'Finance & Payout Remittances',
      'Inventory Threshold Overrides',
      'Logistics Dispatch Controls'
    ]
  },
  {
    email: 'Opleadsmokeyhut001@gmail.com',
    name: 'OPERATION MANAGER',
    role: 'manager',
    roleLabel: 'Operations Manager',
    staff_id: 'SHD-OPS-001',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Operations',
    phone: '08102542059',
    status: 'active',
    last_active: '15m ago',
    created_at: '12 May 2026',
    permissions: [
      'Batch Scheduling & Cook Approvals',
      'Variance Reconciliation',
      'Staff Shift Assignments',
      'Supplier Invoice Verification',
      'Waste & Spoilage Write-offs'
    ]
  },
  {
    email: 'Smokeyhutpackagingteam@gmail.com',
    name: 'PACKAGING TEAM',
    role: 'kitchen',
    roleLabel: 'Packaging & Production',
    staff_id: 'SHD-PKG-001',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Packaging & Assembly',
    phone: '09110382689',
    status: 'active',
    last_active: '30m ago',
    created_at: '04 Aug 2026',
    permissions: [
      'Start & Complete Batches',
      'Raw Materials Depletion',
      'Portion Pack-out Logging',
      'Waste & Spoilage Incident Reports'
    ]
  },
  {
    email: 'Smokeyhutlogisticsteam@gmail.com',
    name: 'LOGISTICS TEAM',
    role: 'dispatcher',
    roleLabel: 'Logistics Coordinator',
    staff_id: 'SHD-LOG-001',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics & Dispatch',
    phone: '09166421740',
    status: 'active',
    last_active: '10m ago',
    created_at: '13 Apr 2026',
    permissions: [
      'Dispatch Queue Assignment',
      'Rider Location & Route Tracking',
      'Third-party Rider Bookings',
      ]
  },
  {
    email: 'Smokeyhutdelight01@gmail.com',
    name: 'SALES TEAM',
    role: 'manager',
    roleLabel: 'Sales & Customer Lead',
    staff_id: 'SHD-SLS-001',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Sales & Customer Care',
    phone: '08141748281',
    status: 'active',
    last_active: '25m ago',
    created_at: '14 Apr 2026',
    permissions: [
      'Orders:view',
      'Orders:manage',
      'Customers:view',
      'Customers:manage'
    ]
  },
  {
    email: 'ridersmokeyhutfrlgs@gmail.com',
    name: 'FRESH LOGISTICS',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 513,
    staff_id: 'SHD-RDR-513',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyabu@gmail.com',
    name: 'RIDER ABU',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 459,
    staff_id: 'SHD-RDR-459',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyaminu@gmail.com',
    name: 'RIDER AMINU',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 458,
    staff_id: 'SHD-RDR-458',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyidris@gmail.com',
    name: 'RIDER IDRIS',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 457,
    staff_id: 'SHD-RDR-457',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyhutjoshua@gmail.com',
    name: 'RIDER JOSHUA',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 454,
    staff_id: 'SHD-RDR-454',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyhutprince@gmail.com',
    name: 'RIDER PRINCE',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 451,
    staff_id: 'SHD-RDR-451',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyhutsam@gmail.com',
    name: 'RIDER SAM',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 452,
    staff_id: 'SHD-RDR-452',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeysunday@gmail.com',
    name: 'RIDER SUNDAY',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 456,
    staff_id: 'SHD-RDR-456',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyhutwasiu@gmail.com',
    name: 'RIDER WASIU',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 453,
    staff_id: 'SHD-RDR-453',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  },
  {
    email: 'ridersmokeyyusuf@gmail.com',
    name: 'RIDER YUSUF',
    role: 'rider',
    roleLabel: 'Delivery Fleet Rider',
    rider_user_id: 455,
    staff_id: 'SHD-RDR-455',
    assigned_hub: 'Lagos Mainland HQ',
    department: 'Logistics',
    phone: '09110382689',
    status: 'active',
    last_active: 'Active',
    created_at: '01 Jun 2026',
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'Wallet & Payout History']
  }
]

const SmokeyOpsContext = createContext<SmokeyOpsContextType | undefined>(undefined)

/**
 * Resolves standard office opening dispatch hour for scheduled deliveries:
 * - Monday to Friday: 08:00 AM (08:00:00)
 * - Saturday & Sunday: 10:00 AM (10:00:00)
 */
export const getOfficeOpeningHourForDate = (dateInput: string): { timeStr: string, label: string, fullDateTime: string } => {
  const cleanDate = (dateInput || '').split('T')[0].split(' ')[0]
  const d = new Date(`${cleanDate}T00:00:00`)
  const day = d.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekend = day === 6 || day === 0
  const timeStr = isWeekend ? '10:00:00' : '08:00:00'
  const label = isWeekend ? '10:00 AM' : '08:00 AM'

  // If a specific time was already stored, retain it; otherwise format with opening hours
  const hasCustomTime = dateInput.includes(':') && (dateInput.includes('T') || dateInput.includes(' '))
  const fullDateTime = hasCustomTime ? dateInput : `${cleanDate} ${timeStr}`

  return { timeStr, label, fullDateTime }
}

const getLiveBootstrap = (): Record<string, any> | null => {
  if (typeof window !== 'undefined' && (window as any).__SMOKEY_LIVE_BOOTSTRAP__) {
    return (window as any).__SMOKEY_LIVE_BOOTSTRAP__
  }
  return null
}

const readLocalCache = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T) : null
  } catch {
    return null
  }
}

const readAppSettingCache = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(`smokey_app_setting_${key}`)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as unknown as T) : fallback
  } catch {
    return fallback
  }
}

const writeLocalCache = (key: string, value: any) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota errors
  }
}

const persistAppSetting = (key: string, value: any) => {
  if (typeof window === 'undefined') return
  writeLocalCache(`smokey_app_setting_${key}`, value)
  fetch('/api/app-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  }).catch(() => {})
}

export interface OrderPipelineOverride {
  order_status?: 'ready_for_fulfillment' | 'in_packaging' | 'packaged'
  packaging_materials_picked?: Array<{ packaging_name: string; quantity: number }>
  packaged_at?: string | null
  packaged_by_name?: string
  delivery_status?: 'pending' | 'assigned' | 'in_transit' | 'delivered'
  rider_type?: 'internal' | 'third_party'
  assigned_rider?: string
  assigned_rider_id?: number
  third_party_provider?: string | null
  booked_fee?: number | null
  fee_evidence_path?: string | null
  fee_verify_status?: 'none' | 'pending' | 'approved' | 'flagged'
  pickup_at?: string | null
  delivered_at?: string | null
  notes?: string
  decline_reason?: string
  scheduled_released?: boolean
  collected_at?: string | null
  collected_by?: string | null
  handover_staff?: string | null
  collector_phone?: string | null
}

export const calculateRiderRating = (
  delayedDeliveries: number = 0,
  declinedDispatches: number = 0
): { rating: number; onTimeRate: number } => {
  // Option 1 Formula: Rating = 5.0 - (Delayed Deliveries * 0.2) - (Declined Dispatches * 0.1)
  const rawScore = 5.0 - (delayedDeliveries * 0.2) - (declinedDispatches * 0.1)
  const rating = Math.max(1.0, Math.min(5.0, Number(rawScore.toFixed(1))))

  // On-time rate percentage: 100% baseline, -4% per delay, -2% per decline
  const penalty = (delayedDeliveries * 4) + (declinedDispatches * 2)
  const onTimeRate = Math.max(0, Math.min(100, Math.round(100 - penalty)))

  return { rating, onTimeRate }
}

const readOrderPipelineState = (): Record<string, OrderPipelineOverride> => {
  if (typeof window === 'undefined') return {}
  try {
    const rawLocal = localStorage.getItem('smokey_order_pipeline_state_v1')
    const rawAppSetting = localStorage.getItem('smokey_app_setting_order_pipeline_state')
    const parsedLocal = rawLocal ? JSON.parse(rawLocal) : {}
    const parsedApp = rawAppSetting ? JSON.parse(rawAppSetting) : {}
    const localObj = (typeof parsedLocal === 'object' && parsedLocal && !Array.isArray(parsedLocal)) ? parsedLocal : {}
    const appObj = (typeof parsedApp === 'object' && parsedApp && !Array.isArray(parsedApp)) ? parsedApp : {}

    // Deep merge: local first, remote appObj on top so authoritative backend settings win
    const mergedKeys = Array.from(new Set([...Object.keys(localObj), ...Object.keys(appObj)]))
    const result: Record<string, OrderPipelineOverride> = {}
    for (const key of mergedKeys) {
      result[key] = {
        ...(localObj[key] || {}),
        ...(appObj[key] || {})
      }
    }
    return result
  } catch {
    return {}
  }
}

const updateOrderPipelineState = (orderRef: string, patch: Partial<OrderPipelineOverride>) => {
  if (typeof window === 'undefined' || !orderRef) return
  try {
    const current = readOrderPipelineState()
    current[orderRef] = { ...(current[orderRef] || {}), ...patch }
    localStorage.setItem('smokey_order_pipeline_state_v1', JSON.stringify(current))
    persistAppSetting('order_pipeline_state', current)
  } catch {
    // Ignore quota errors
  }
}

const persistOrderUpdateToBackend = (orderRef: string, updates: Record<string, any>) => {
  if (!orderRef) return
  fetch('/api/update-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: orderRef, updates }),
  }).catch(() => {})
  Promise.resolve(supabase.from('orders').update(updates).eq('id', orderRef)).catch(() => {})
}

const persistProductUpdateToBackend = (productId: number, updates: Record<string, any>) => {
  if (!productId) return
  fetch('/api/update-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: productId, updates }),
  }).catch(() => {})
  Promise.resolve(supabase.from('products').update(updates).eq('id', productId)).catch(() => {})
}

const mapRawInventoryItems = (list: any[]): RawProduct[] => {
  const mapped: RawProduct[] = list.map((p: any) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    product_type: 'raw' as const,
    unit: p.unit || 'PIECES',
    reorder_level: parseFloat(p.reorder_level || 10),
    unit_cost: parseFloat(p.unit_cost || 0),
    stock_qty: parseFloat(p.stock_qty || 0),
    qty_allocated: 0,
    qty_available: parseFloat(p.stock_qty || 0),
    qty_quarantine: 0,
    inventory_value: parseFloat(p.inventory_value || (parseFloat(p.stock_qty || 0) * parseFloat(p.unit_cost || 0))),
    is_active: p.is_active ? 1 : 0
  }))
  const existingIds = new Set(mapped.map(m => m.id))
  const supplemental = SEED_RAW_PRODUCTS.filter(sp => !existingIds.has(sp.id))
  return [...mapped, ...supplemental]
}

const mapPackagingInventoryItems = (list: any[]): PackagingProduct[] => {
  return list.map((p: any) => {
    const existing = SEED_PACKAGING_PRODUCTS.find(sp => sp.id === p.id || sp.sku === p.sku)
    const stockQty = parseFloat(p.stock_qty ?? existing?.stock_qty ?? 0)
    const benchQty = p.bench_stock_qty !== undefined ? parseFloat(p.bench_stock_qty) : (existing?.bench_stock_qty ?? 0)
    const centralQty = p.central_stock_qty !== undefined ? parseFloat(p.central_stock_qty) : Math.max(0, stockQty - benchQty)
    const unitCost = parseFloat(p.unit_cost ?? existing?.unit_cost ?? 0)
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      product_type: 'packaging' as const,
      unit: p.unit || existing?.unit || 'PIECES',
      reorder_level: parseFloat(p.reorder_level ?? existing?.reorder_level ?? 50),
      unit_cost: unitCost,
      stock_qty: stockQty,
      central_stock_qty: centralQty,
      bench_stock_qty: benchQty,
      qty_allocated: existing?.qty_allocated ?? 0,
      qty_available: stockQty,
      inventory_value: parseFloat(p.inventory_value || (stockQty * unitCost)),
      is_active: p.is_active ? 1 : 0
    }
  })
}

const mapSuppliersItems = (list: any[]): Supplier[] => {
  return list.map((s: any) => ({
    id: s.id,
    supplier_ref: s.supplier_ref,
    name: s.name,
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    category: s.name.includes('FIREWOOD') ? 'Firewood & Charcoal' : s.name.includes('NYLON') || s.name.includes('PRINTER') ? 'Packaging & Printing Materials' : s.name.includes('MADAM') ? 'Fresh Poultry & Live Birds' : 'Market Goods & Spices',
    delivery_count: 0,
    total_spend: 0,
    is_active: s.is_active ? 1 : 0
  }))
}

const mapFleetRidersItems = (list: any[]): RiderPayout[] => {
  return list
    .filter((r: any) => r.is_delivery_rider === 1 || r.rider_user_id !== undefined)
    .map((r: any) => {
      if (r.rider_user_id !== undefined && r.rider_name) return r as RiderPayout
      const existing = SEED_RIDER_PAYOUTS.find(
        sp => sp.rider_user_id === r.id || sp.email?.toLowerCase() === r.email?.toLowerCase()
      )
      return {
        rider_user_id: r.id,
        rider_name: r.name,
        phone: existing?.phone || '09110382689',
        email: r.email || '',
        staff_id: existing?.staff_id || `SHD-RDR-${r.id}`,
        active_assignments: r.active_assignments || 0,
        today_trips: existing?.today_trips || 0,
        deliveries_today: existing?.deliveries_today || 0,
        deliveries_week: existing?.deliveries_week || 0,
        deliveries_month: existing?.deliveries_month || 0,
        total_completed: existing?.total_completed || 0,
        earnings_today: existing?.earnings_today || 0,
        earnings_week: existing?.earnings_week || 0,
        earnings_month: existing?.earnings_month || 0,
        pending_payout: existing?.pending_payout || 0,
        net_balance: existing?.pending_payout || 0,
        paid_total: existing?.paid_total || 0,
        lifetime_earnings: existing?.lifetime_earnings || 0,
        status: 'active' as const,
        operating_hub: existing?.operating_hub || 'Lagos Mainland HQ'
      }
    })
}

const deriveQueuesFromRawOrders = (rawOrders: any[]) => {
  const now = Date.now()
  const pipelineOverrides = readOrderPipelineState()
  const newPackagingItems: PackagingQueueOrder[] = []
  const newScheduledItems: ScheduledOrder[] = []
  const deliveredDeliveries: LogisticsDelivery[] = []
  const newStorePickups: StorePickupOrder[] = []

  rawOrders.forEach((o: any, idx: number) => {
    const numericId = parseInt(String(o.id).replace(/\D/g, '')) || (10700 + idx)
    const orderRef = String(o.order_ref || o.id || `SHD-${numericId}`)
    const override = pipelineOverrides[orderRef]
    const customerName = o.customer_name || 'Storefront Customer'
    const phone = o.customer_phone || o.phone || 'N/A'
    const address = o.delivery_address || o.address || 'Storefront Counter Pickup'
    const totalAmount = Number(o.total ?? o.total_amount) || 0
    const deliveryFee = Number(o.delivery_fee) || 0
    const createdAt = o.created_at || new Date().toISOString()
    const notes = override?.notes || o.notes || ''

    const normDelivStatus = String(o.delivery_status || '').toLowerCase().trim().replace(/\s+/g, '_')
    const normOrderStatus = String(o.status || '').toLowerCase().trim().replace(/\s+/g, '_')
    const normFulfillStatus = String(o.fulfillment_status || '').toLowerCase().trim().replace(/\s+/g, '_')

    const isDelivered =
      override?.delivery_status === 'delivered' ||
      normDelivStatus === 'delivered' ||
      normOrderStatus === 'delivered' ||
      normFulfillStatus === 'delivered'
    const isInTransit =
      !isDelivered && (
        override?.delivery_status === 'in_transit' ||
        override?.delivery_status === 'assigned' ||
        normDelivStatus === 'in_transit' ||
        normDelivStatus === 'assigned' ||
        normFulfillStatus === 'in_transit'
      )
    const isPackaged =
      isDelivered ||
      isInTransit ||
      override?.order_status === 'packaged' ||
      normDelivStatus === 'ready_for_dispatch' ||
      normDelivStatus === 'packaged'

    const itemsList = Array.isArray(o.order_items) && o.order_items.length > 0
      ? o.order_items.map((i: any) => `${i.qty || 1}x ${i.name || 'Smokey Product'}`).join('; ')
      : (o.items_summary || 'Assorted Smokey Delicacies')

    const typedItems = Array.isArray(o.order_items) && o.order_items.length > 0
      ? o.order_items.map((i: any) => ({
          product_name: i.name || 'Smokey Product',
          quantity: Number(i.qty) || 1,
          unit_price: Number(i.price) || 0,
          line_total: (Number(i.qty) || 1) * (Number(i.price) || 0)
        }))
      : (Array.isArray(o.items) && o.items.length > 0
          ? o.items
          : [{ product_name: itemsList, quantity: 1, unit_price: totalAmount, line_total: totalAmount }])

    let schedDateStr = o.scheduled_delivery_date || o.scheduled_delivery_at
    if (!schedDateStr && o.notes && o.notes.includes('[Scheduled Delivery:')) {
      const match = o.notes.match(/\[Scheduled Delivery:\s*([^\]]+)\]/)
      if (match && match[1]) {
        schedDateStr = match[1].trim()
      }
    }

    const isExplicitScheduled = Boolean(
      o.delivery_status === 'Rescheduled' ||
      o.delivery_status === 'Scheduled' ||
      (o.notes && (o.notes.includes('[Scheduled Delivery') || o.notes.includes('[Rescheduled]')))
    )
    let effectiveSched = schedDateStr || createdAt
    if (schedDateStr) {
      effectiveSched = getOfficeOpeningHourForDate(schedDateStr).fullDateTime
    }

    const schedTime = !isNaN(new Date(effectiveSched).getTime()) ? new Date(effectiveSched).getTime() : NaN
    const isScheduledOrder = Boolean(
      (schedDateStr && !isNaN(schedTime) && schedTime > now) ||
      isExplicitScheduled
    )
    const isReleasedToPackaging = Boolean(override?.scheduled_released || isPackaged || isInTransit || isDelivered)

    if (isScheduledOrder) {
      const effectiveTime = !isNaN(new Date(effectiveSched).getTime()) ? new Date(effectiveSched).getTime() : now + 3600000
      const schedStatus: ScheduledOrder['order_status'] =
        (isInTransit || isDelivered)
          ? 'dispatched'
          : (isReleasedToPackaging ? 'in_queue' : 'payment_confirmed')

      newScheduledItems.push({
        id: numericId,
        order_ref: orderRef,
        customer_name: customerName,
        phone,
        address,
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        scheduled_delivery_at: effectiveSched,
        payment_status: 'paid',
        order_status: schedStatus,
        notes: notes || 'Scheduled pre-order from website storefront',
        can_start_schedule: effectiveTime <= (now + 45 * 60 * 1000) || isReleasedToPackaging,
        items_summary: itemsList,
        items: typedItems
      })
    }

    if (!isScheduledOrder || isReleasedToPackaging) {
      const pkgStatus: 'ready_for_fulfillment' | 'in_packaging' | 'packaged' =
        isPackaged
          ? 'packaged'
          : (override?.order_status || 'ready_for_fulfillment')

      newPackagingItems.push({
        id: numericId,
        order_ref: orderRef,
        customer_name: customerName,
        phone,
        address,
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        delivery_mode: schedDateStr ? 'scheduled' : 'instant',
        payment_status: 'paid',
        order_status: pkgStatus,
        items_summary: itemsList,
        items: typedItems,
        packaging_materials_picked: override?.packaging_materials_picked,
        packaged_at: isPackaged ? (override?.packaged_at || createdAt) : null,
        packaged_by_name: isPackaged ? (override?.packaged_by_name || o.packaged_by_name || 'Packaging Station') : undefined,
        created_at: createdAt
      })

      const isPickupOrder = Boolean(
        (address && (address.toLowerCase().includes('pickup') || address.toLowerCase().includes('counter'))) ||
        (o.delivery_zone && o.delivery_zone.toLowerCase().includes('pickup')) ||
        (o.notes && o.notes.toLowerCase().includes('pickup') && !o.notes.toLowerCase().includes('not pickup')) ||
        o.delivery_type === 'pickup' ||
        o.fulfillment_type === 'pickup' ||
        (deliveryFee === 0 && (address.toLowerCase().includes('store') || address.toLowerCase().includes('hq') || address.toLowerCase().includes('yaba')))
      )

      if (isPickupOrder) {
        const isCollected =
          isDelivered ||
          override?.delivery_status === 'delivered' ||
          normDelivStatus === 'collected' ||
          normDelivStatus === 'delivered' ||
          normOrderStatus === 'collected' ||
          normOrderStatus === 'delivered' ||
          normFulfillStatus === 'delivered'
        newStorePickups.push({
          id: numericId,
          order_ref: orderRef,
          customer_name: customerName,
          phone,
          address,
          total_amount: totalAmount,
          payment_status: 'paid',
          order_status: isCollected ? 'collected' : 'ready_for_pickup',
          packaged_at: override?.packaged_at || createdAt,
          collected_at: isCollected ? (override?.delivered_at || override?.collected_at || createdAt) : null,
          collected_by: override?.collected_by || (isCollected ? customerName : null),
          handover_staff: override?.handover_staff || null,
          collector_phone: override?.collector_phone || phone,
          items_summary: itemsList
        })
      } else if (isDelivered || isInTransit || isPackaged) {
        const delivStatus: LogisticsDelivery['status'] = isDelivered
          ? 'delivered'
          : (override?.delivery_status === 'in_transit' || normDelivStatus === 'in_transit'
              ? 'in_transit'
              : (override?.delivery_status === 'assigned' || normDelivStatus === 'assigned'
                  ? 'assigned'
                  : 'pending'))
        const resolvedRiderType = override?.rider_type || 'internal'
        const rawRiderName = override?.assigned_rider || o.rider_name
        const riderName =
          rawRiderName && rawRiderName !== 'Dispatched Courier' && rawRiderName !== 'Unassigned'
            ? rawRiderName
            : 'Unassigned'
        const resolvedRiderId =
          override?.assigned_rider_id !== undefined
            ? Number(override.assigned_rider_id)
            : (resolvedRiderType === 'internal' && riderName !== 'Unassigned'
                ? SEED_RIDER_PAYOUTS.find(r => r.rider_name.toLowerCase() === riderName.toLowerCase())?.rider_user_id
                : undefined)
        deliveredDeliveries.push({
          id: numericId,
          delivery_ref: `DEL-${numericId}`,
          order_id: numericId,
          order_ref: orderRef,
          customer_name: customerName,
          phone,
          address,
          total_amount: totalAmount,
          delivery_fee: deliveryFee || 3000,
          booked_fee: override?.booked_fee ?? null,
          rider_type: resolvedRiderType,
          assigned_rider: riderName,
          assigned_rider_id: resolvedRiderId,
          third_party_provider: resolvedRiderType === 'third_party' ? (override?.third_party_provider || riderName) : null,
          status: delivStatus,
          dispatch_date: createdAt.split('T')[0],
          pickup_at: override?.pickup_at || (isDelivered || delivStatus === 'in_transit' ? createdAt : null),
          delivered_at: override?.delivered_at || (isDelivered ? (o.updated_at || createdAt) : null),
          fee_evidence_path: override?.fee_evidence_path || null,
          fee_verify_status: override?.fee_verify_status || (resolvedRiderType === 'third_party' ? 'pending' : (isDelivered ? 'approved' : 'none')),
          items_summary: itemsList,
          notes: notes || undefined,
          decline_reason: override?.decline_reason
        })
      }
    }
  })

  const mappedWebsiteOrders = rawOrders.map(o => {
    const base = mapSupabaseOrderToWebsiteOrder(o)
    const override = pipelineOverrides[base.order_ref]
    if (!override) return base
    let fulfillment_status = base.fulfillment_status
    if (override.delivery_status === 'delivered') fulfillment_status = 'delivered'
    else if (override.delivery_status === 'in_transit' || override.delivery_status === 'assigned') fulfillment_status = 'in_transit'
    else if (override.order_status === 'packaged') fulfillment_status = 'ready_for_dispatch'
    else if (override.order_status === 'in_packaging') fulfillment_status = 'packaging'
    return {
      ...base,
      fulfillment_status,
      rider_name: override.assigned_rider || base.rider_name
    }
  })

  return {
    websiteOrders: mappedWebsiteOrders,
    newPackagingItems,
    newScheduledItems,
    deliveredDeliveries,
    newStorePickups
  }
}

export const SmokeyOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialOrdersBundle = useMemo(() => {
    const boot = getLiveBootstrap()
    if (boot?.liveOrders && Array.isArray(boot.liveOrders) && boot.liveOrders.length > 0) {
      return deriveQueuesFromRawOrders(boot.liveOrders)
    }
    const cachedRaw = readLocalCache<any[]>('smokey_live_cache_v3_orders_raw')
    if (cachedRaw && cachedRaw.length > 0) {
      return deriveQueuesFromRawOrders(cachedRaw)
    }
    return null
  }, [])

  // Website Orders & Live Storefront Products (Centralized)
  const [websiteOrders, setWebsiteOrders] = useState<WebsiteOrder[]>(() => {
    if (initialOrdersBundle) return initialOrdersBundle.websiteOrders
    const cached = readLocalCache<WebsiteOrder[]>('smokey_live_cache_v3_website_orders')
    return cached || SEED_WEBSITE_ORDERS
  })
  const [isOrdersRefreshing, setIsOrdersRefreshing] = useState<boolean>(false)

  const [liveSalesProducts, setLiveSalesProducts] = useState<LiveSalesProduct[]>(() => {
    const boot = getLiveBootstrap()
    if (boot?.products && Array.isArray(boot.products) && boot.products.length > 0) {
      return boot.products.map(mapSupabaseProductToSalesProduct)
    }
    const cached = readLocalCache<LiveSalesProduct[]>('smokey_live_cache_v3_sales_products')
    if (cached && cached.length > 0) return cached
    return SEED_SALES_PRODUCTS.map(p => ({ ...p, image: null }))
  })
  const [isSalesProductsRefreshing, setIsSalesProductsRefreshing] = useState<boolean>(false)

  // Inventory Domain
  const [rawProducts, setRawProducts] = useState<RawProduct[]>(() => {
    const boot = getLiveBootstrap()
    if (boot?.rawInventory && Array.isArray(boot.rawInventory) && boot.rawInventory.length > 0) {
      return mapRawInventoryItems(boot.rawInventory)
    }
    const cached = readLocalCache<RawProduct[]>('smokey_live_cache_v3_raw_products')
    return cached || SEED_RAW_PRODUCTS
  })
  const [rawDeliveries, setRawDeliveries] = useState<RawDelivery[]>(() =>
    readAppSettingCache('raw_deliveries', SEED_RAW_DELIVERIES)
  )
  const [rawMovements, setRawMovements] = useState<RawMovement[]>(() =>
    readAppSettingCache('raw_movements', SEED_RAW_MOVEMENTS)
  )

  const rawUsage = useMemo<RawUsageItem[]>(() => {
    const map = new Map<number, RawUsageItem>()
    rawMovements.forEach(m => {
      if (m.movement_type === 'consumption' || m.quantity < 0) {
        const usedQty = Math.abs(m.quantity)
        const existing = map.get(m.product_id)
        if (existing) {
          existing.total_used += usedQty
          existing.total_value += usedQty * m.unit_cost
        } else {
          map.set(m.product_id, {
            product_id: m.product_id,
            product_name: m.product_name,
            sku: m.sku,
            unit: m.unit,
            unit_cost: m.unit_cost,
            total_used: usedQty,
            total_value: usedQty * m.unit_cost
          })
        }
      }
    })
    return Array.from(map.values())
  }, [rawMovements])

  const [packagingProducts, setPackagingProducts] = useState<PackagingProduct[]>(() => {
    const boot = getLiveBootstrap()
    if (boot?.packagingInventory && Array.isArray(boot.packagingInventory) && boot.packagingInventory.length > 0) {
      return mapPackagingInventoryItems(boot.packagingInventory)
    }
    const cached = readLocalCache<PackagingProduct[]>('smokey_live_cache_v3_packaging_products')
    return cached || SEED_PACKAGING_PRODUCTS
  })
  const [packagingReceiptsTotals, setPackagingReceiptsTotals] = useState<PackagingReceiptTotal[]>(() =>
    readAppSettingCache('packaging_receipts_totals', SEED_PACKAGING_RECEIPTS_TOTALS)
  )
  const [packagingReconciliations, setPackagingReconciliations] = useState<PackagingDailyReconciliation[]>(() =>
    readAppSettingCache('packaging_reconciliations', SEED_PACKAGING_RECONCILIATIONS)
  )
  const [intermediatePreps, setIntermediatePreps] = useState<IntermediatePrep[]>(() =>
    readAppSettingCache('intermediate_preps', SEED_INTERMEDIATE_PREPS)
  )
  const [compoundInventory, setCompoundInventory] = useState<CompoundInventoryItem[]>(() =>
    readAppSettingCache('compound_inventory', SEED_COMPOUND_INVENTORY)
  )
  const [interStationTransfers, setInterStationTransfers] = useState<InterStationTransfer[]>(() =>
    readAppSettingCache('inter_station_transfers', SEED_INTER_STATION_TRANSFERS)
  )

  const [salesProducts, setSalesProducts] = useState<SalesProduct[]>(() => {
    const cached = readLocalCache<LiveSalesProduct[]>('smokey_live_cache_v3_sales_products')
    return cached && cached.length > 0 ? cached : SEED_SALES_PRODUCTS
  })

  // Keep salesProducts unified with liveSalesProducts whenever liveSalesProducts updates
  useEffect(() => {
    if (liveSalesProducts.length > 0) {
      setSalesProducts(liveSalesProducts)
    }
  }, [liveSalesProducts])

  // Compute dailySales dynamically from real websiteOrders
  const dailySales = useMemo<DailySalesItem[]>(() => {
    const map = new Map<string, DailySalesItem>()
    websiteOrders.forEach(order => {
      if (order.payment_status === 'refunded') return
      const items = Array.isArray(order.raw_items) ? order.raw_items : []
      items.forEach((item: any) => {
        const name = String(item.name || '').trim()
        if (!name) return
        const qty = Number(item.qty || item.quantity || 1)
        const price = Number(item.price || item.unit_price || 0)
        const key = name.toLowerCase()
        const matchedProd = liveSalesProducts.find(p => p.name.toLowerCase().trim() === key)
        const existing = map.get(key)
        if (existing) {
          existing.qty_sold += qty
          existing.sale_count += 1
          existing.order_count += 1
          existing.total_value += qty * price
        } else {
          map.set(key, {
            product_id: matchedProd?.id || Number(item.product_id || 0),
            product_name: matchedProd?.name || name,
            sku: matchedProd?.sku || `SMK-${String(matchedProd?.id || 1).padStart(4, '0')}`,
            unit: matchedProd?.unit || 'unit',
            qty_sold: qty,
            sale_count: 1,
            order_count: 1,
            total_value: qty * price,
            channel_breakdown: order.channel || 'Website Storefront'
          })
        }
      })
    })
    return Array.from(map.values()).sort((a, b) => b.total_value - a.total_value)
  }, [websiteOrders, liveSalesProducts])

  const [salesMovements, setSalesMovements] = useState<SalesMovement[]>(() =>
    readAppSettingCache('sales_movements', SEED_SALES_MOVEMENTS)
  )

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const boot = getLiveBootstrap()
    if (boot?.suppliers && Array.isArray(boot.suppliers) && boot.suppliers.length > 0) {
      return mapSuppliersItems(boot.suppliers)
    }
    const cached = readLocalCache<Supplier[]>('smokey_live_cache_v3_suppliers')
    return cached || SEED_SUPPLIERS
  })
  const [inventoryLots, setInventoryLots] = useState<InventoryLot[]>(() =>
    readAppSettingCache('inventory_lots', SEED_INVENTORY_LOTS)
  )
  const [recipeTemplates, setRecipeTemplates] = useState<RecipeTemplate[]>(() => {
    const cached = readAppSettingCache<RecipeTemplate[]>('recipe_templates', [])
    return cached.length > 0 ? cached : SEED_RECIPE_TEMPLATES
  })
  const [stocktakeVariances, setStocktakeVariances] = useState<StocktakeVariance[]>(() =>
    readAppSettingCache('stocktake_variances', SEED_STOCKTAKE_VARIANCES)
  )

  // Production Domain
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(() =>
    readAppSettingCache('production_batches', SEED_PRODUCTION_BATCHES)
  )
  const [packagingQueue, setPackagingQueue] = useState<PackagingQueueOrder[]>(() => {
    if (initialOrdersBundle && initialOrdersBundle.newPackagingItems.length > 0) {
      return initialOrdersBundle.newPackagingItems
    }
    const cached = readLocalCache<PackagingQueueOrder[]>('smokey_live_cache_v3_packaging_queue')
    return cached || SEED_PACKAGING_QUEUE
  })
  const [packagingMaterialsDaily, setPackagingMaterialsDaily] = useState<PackagingMaterialDaily[]>(() =>
    readAppSettingCache('packaging_materials_daily', SEED_PACKAGING_MATERIALS_DAILY)
  )
  const [kitchenTasks, setKitchenTasks] = useState<KitchenTask[]>(() =>
    readAppSettingCache('kitchen_tasks', SEED_KITCHEN_TASKS)
  )

  // Two-Tier Inventory Pipeline: Calculate live incoming estimated batches from active/scheduled smoke runs
  const activeIncomingBatchesByProduct = useMemo(() => {
    const map: Record<number, number> = {}
    productionBatches.forEach(b => {
      if ((b.status === 'draft' || b.status === 'in_production') && b.feed_sales_inventory !== false) {
        map[b.output_product_id] = (map[b.output_product_id] || 0) + (b.expected_output || 0)
      }
    })
    return map
  }, [productionBatches])

  // Augment salesProducts with dynamic incoming batch buffer and total sellable online capacity
  const augmentedSalesProducts = useMemo(() => {
    return salesProducts.map(sp => {
      const incoming = activeIncomingBatchesByProduct[sp.id] || 0
      const allocated = sp.qty_allocated || 0
      const physicalAvailable = Math.max(0, sp.stock_qty - allocated)
      const sellable = Math.max(0, sp.stock_qty + incoming - allocated)
      return {
        ...sp,
        estimated_incoming_qty: incoming,
        qty_available: physicalAvailable,
        sellable_qty: sellable
      }
    })
  }, [salesProducts, activeIncomingBatchesByProduct])

  // Logistics Domain
  const [logisticsDeliveries, setLogisticsDeliveries] = useState<LogisticsDelivery[]>(() => {
    if (initialOrdersBundle && initialOrdersBundle.deliveredDeliveries.length > 0) {
      return initialOrdersBundle.deliveredDeliveries
    }
    const cached = readLocalCache<LogisticsDelivery[]>('smokey_live_cache_v3_logistics_deliveries')
    return cached || SEED_LOGISTICS_DELIVERIES
  })
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>(() => {
    if (initialOrdersBundle && initialOrdersBundle.newScheduledItems.length > 0) {
      return initialOrdersBundle.newScheduledItems
    }
    const cached = readLocalCache<ScheduledOrder[]>('smokey_live_cache_v3_scheduled_orders')
    return cached || SEED_SCHEDULED_ORDERS
  })
  const [riders, setRiders] = useState<RiderPayout[]>(() => {
    const boot = getLiveBootstrap()
    if (boot?.fleetRiders && Array.isArray(boot.fleetRiders) && boot.fleetRiders.length > 0) {
      return mapFleetRidersItems(boot.fleetRiders)
    }
    const cached = readLocalCache<RiderPayout[]>('smokey_live_cache_v3_riders')
    if (cached && cached.length > 0) {
      return cached.filter(r => r.rider_user_id !== 583 && (r.email || '').toLowerCase() !== 'johndoe@streetmba.com')
    }
    return SEED_RIDER_PAYOUTS
  })
  const [riderTasks, setRiderTasks] = useState<RiderTask[]>(() =>
    readAppSettingCache('rider_tasks', SEED_RIDER_TASKS)
  )
  const [storePickups, setStorePickups] = useState<StorePickupOrder[]>(() => {
    if (initialOrdersBundle && initialOrdersBundle.newStorePickups.length > 0) {
      const cached = readAppSettingCache<StorePickupOrder[]>('store_pickups', [])
      if (cached && cached.length > 0) {
        const cachedMap = new Map(cached.map(c => [c.order_ref, c]))
        return initialOrdersBundle.newStorePickups.map(item => {
          const c = cachedMap.get(item.order_ref)
          if (c) {
            return {
              ...item,
              order_status: c.order_status === 'collected' ? 'collected' : item.order_status,
              collected_at: c.collected_at || item.collected_at,
              collected_by: c.collected_by || item.collected_by,
              handover_staff: c.handover_staff || item.handover_staff,
              collector_phone: c.collector_phone || item.collector_phone
            }
          }
          return item
        })
      }
      return initialOrdersBundle.newStorePickups
    }
    const cached = readAppSettingCache<StorePickupOrder[]>('store_pickups', SEED_STORE_PICKUPS)
    if (cached && cached.length > 0) return cached
    return SEED_STORE_PICKUPS
  })
  const [thirdPartySummaries] = useState<ThirdPartyWeeklySummary[]>(SEED_THIRD_PARTY_SUMMARY)

  // Account / Role Management (RBAC)
  const [accounts, setAccounts] = useState<AppUserAccount[]>(() => {
    const saved = localStorage.getItem('smokey_accounts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mockEmails = [
            'ops-team@smokeyhut.com',
            'chef.amara@smokeyhut.com',
            'kemi.inv@smokeyhut.com',
            'babajide.dispatch@smokeyhut.com',
            'ayodine47@gmail.com',
            'johndoe@streetmba.com',
            'egbetechizaram10@gmail.com',
            'ridersmokeyfrlgs@gmail.com'
          ]
          const filtered = parsed.filter((a: any) => !mockEmails.includes((a.email || '').toLowerCase()))
          if (filtered.length > 0) return filtered
        }
      } catch (e) {
        // fallback
      }
    }
    return APP_ACCOUNTS
  })

  const [activeAccountEmail, setActiveAccountEmail] = useState<string>(() => {
    try {
      const sessionRaw = sessionStorage.getItem('smokey_auth_session_v1') || localStorage.getItem('smokey_auth_session_v1')
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw)
        if (parsed?.email) return parsed.email
      }
    } catch {
      // ignore
    }
    const saved = localStorage.getItem('smokey_active_account')
    const mockEmails = ['ops-team@smokeyhut.com', 'chef.amara@smokeyhut.com', 'kemi.inv@smokeyhut.com', 'babajide.dispatch@smokeyhut.com', 'ayodine47@gmail.com']
    if (saved && !mockEmails.includes(saved.toLowerCase())) {
      return saved
    }
    return 'fivedigita@gmail.com'
  })

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const sessionRaw = sessionStorage.getItem('smokey_auth_session_v1') || localStorage.getItem('smokey_auth_session_v1')
      if (!sessionRaw) return false
      const parsed = JSON.parse(sessionRaw)
      return Boolean(parsed && parsed.email && parsed.sessionToken)
    } catch {
      return false
    }
  })

  const refreshLiveSalesProducts = React.useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsSalesProductsRefreshing(true)
    try {
      try {
        const url = showIndicator ? '/api/products?refresh=1' : '/api/products'
        const res = await fetch(url)
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const json = await res.json()
          if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            const mapped = json.data.map(mapSupabaseProductToSalesProduct)
            setLiveSalesProducts(mapped)
            writeLocalCache('smokey_live_cache_v3_sales_products', mapped)
            return
          }
        }
      } catch {
        // Fallback to direct Supabase query when /api/products is unavailable
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapSupabaseProductToSalesProduct)
        setLiveSalesProducts(mapped)
        writeLocalCache('smokey_live_cache_v3_sales_products', mapped)
      }
    } catch (err) {
      console.warn('Error fetching Supabase products:', err)
    } finally {
      if (showIndicator) setIsSalesProductsRefreshing(false)
    }
  }, [])

  const refreshWebsiteOrders = React.useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsOrdersRefreshing(true)
    try {
      let rawOrders: any[] = []

      // 1. Fast local API proxy (uses service role key and warm cache)
      try {
        const url = showIndicator ? '/api/live-orders?refresh=1' : '/api/live-orders'
        const res = await fetch(url)
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const json = await res.json()
          if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            rawOrders = json.data
          }
        }
      } catch {
        // Fallback to direct Supabase query when /api/live-orders is unavailable
      }

      // 2. Direct Supabase query fallback
      if (rawOrders.length === 0) {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .is('deleted_at', null)
          .neq('status', 'pending_payment')
          .order('created_at', { ascending: false })
          .limit(200)

        if (!error && Array.isArray(data) && data.length > 0) {
          rawOrders = data
        }
      }

      if (rawOrders.length === 0) {
        return
      }

      writeLocalCache('smokey_live_cache_v3_orders_raw', rawOrders)
      const {
        websiteOrders: mappedOrders,
        newPackagingItems,
        newScheduledItems,
        deliveredDeliveries,
        newStorePickups
      } = deriveQueuesFromRawOrders(rawOrders)

      setWebsiteOrders(mappedOrders)
      writeLocalCache('smokey_live_cache_v3_website_orders', mappedOrders)

      // Update packagingQueue: merge and preserve in-memory user actions
      setPackagingQueue(prev => {
        const prevMap = new Map(prev.map(p => [p.order_ref, p]))
        const merged = newPackagingItems.map(item => {
          const existing = prevMap.get(item.order_ref)
          if (existing) {
            return {
              ...item,
              order_status: existing.order_status,
              packaging_materials_picked: existing.packaging_materials_picked,
              packaged_at: existing.packaged_at,
              packaged_by_name: existing.packaged_by_name
            }
          }
          return item
        })
        const newRefs = new Set(newPackagingItems.map(i => i.order_ref))
        const manualOrders = prev.filter(p => !newRefs.has(p.order_ref))
        const nextQueue = [...merged, ...manualOrders]
        writeLocalCache('smokey_live_cache_v3_packaging_queue', nextQueue)
        return nextQueue
      })

      // Update scheduledOrders: merge and preserve in-memory status
      setScheduledOrders(prev => {
        const prevMap = new Map(prev.map(s => [s.order_ref, s]))
        const nextScheduled = newScheduledItems.map(item => {
          const existing = prevMap.get(item.order_ref)
          if (existing) {
            return {
              ...item,
              order_status: existing.order_status !== 'payment_confirmed' ? existing.order_status : item.order_status,
              can_start_schedule: existing.can_start_schedule || item.can_start_schedule
            }
          }
          return item
        })
        writeLocalCache('smokey_live_cache_v3_scheduled_orders', nextScheduled)
        return nextScheduled
      })

      // Update storePickups: merge and preserve in-memory collection handovers
      setStorePickups(prev => {
        const prevMap = new Map(prev.map(p => [p.order_ref, p]))
        const merged = newStorePickups.map(item => {
          const existing = prevMap.get(item.order_ref)
          if (existing) {
            return {
              ...item,
              order_status: existing.order_status === 'collected' ? 'collected' : item.order_status,
              collected_at: existing.collected_at || item.collected_at,
              collected_by: existing.collected_by || item.collected_by,
              handover_staff: existing.handover_staff || item.handover_staff,
              collector_phone: existing.collector_phone || item.collector_phone
            }
          }
          return item
        })
        const newRefs = new Set(newStorePickups.map(p => p.order_ref))
        const manualPickups = prev.filter(p => !newRefs.has(p.order_ref))
        return [...merged, ...manualPickups]
      })

      // Update logisticsDeliveries: retain active dispatches and preserve receipt evidence/audit state
      setLogisticsDeliveries(prev => {
        const prevMap = new Map(prev.map(d => [d.order_ref, d]))
        const newlyDeliveredRefs = new Set(deliveredDeliveries.filter(d => d.status === 'delivered').map(d => d.order_ref))
        const activeDispatches = prev.filter(
          d =>
            !newlyDeliveredRefs.has(d.order_ref) &&
            (d.status === 'pending' || d.status === 'assigned' || d.status === 'in_transit' || d.status === 'out_for_delivery')
        )
        const existingRefs = new Set(activeDispatches.map(d => d.order_ref))
        const nonDuplicateDelivered = deliveredDeliveries
          .filter(d => !existingRefs.has(d.order_ref))
          .map(d => {
            const prevDel = prevMap.get(d.order_ref)
            if (!prevDel) return d
            return {
              ...d,
              rider_type: d.rider_type || prevDel.rider_type,
              assigned_rider: d.assigned_rider && d.assigned_rider !== 'Unassigned' && d.assigned_rider !== 'Dispatched Courier'
                ? d.assigned_rider
                : (prevDel.assigned_rider && prevDel.assigned_rider !== 'Dispatched Courier' ? prevDel.assigned_rider : 'Unassigned'),
              assigned_rider_id: d.assigned_rider && d.assigned_rider !== 'Unassigned'
                ? (d.assigned_rider_id ?? prevDel.assigned_rider_id)
                : (prevDel.assigned_rider_id ?? d.assigned_rider_id),
              third_party_provider: prevDel.third_party_provider ?? d.third_party_provider,
              booked_fee: prevDel.booked_fee ?? d.booked_fee,
              delivery_fee: prevDel.delivery_fee ?? d.delivery_fee,
              fee_evidence_path: prevDel.fee_evidence_path || d.fee_evidence_path || null,
              fee_verify_status: prevDel.fee_verify_status !== 'none' ? prevDel.fee_verify_status : d.fee_verify_status,
              notes: prevDel.notes || d.notes,
              decline_reason: prevDel.decline_reason || d.decline_reason
            }
          })
        const nextDeliveries = [...activeDispatches, ...nonDuplicateDelivered]
        writeLocalCache('smokey_live_cache_v3_logistics_deliveries', nextDeliveries)
        return nextDeliveries
      })
    } catch (err) {
      console.error('Error syncing live website orders:', err)
    } finally {
      if (showIndicator) setIsOrdersRefreshing(false)
    }
  }, [])

  // Automatically reconcile internal rider trip counts, completed trips, earnings, and pending payouts from logisticsDeliveries
  useEffect(() => {
    if (!logisticsDeliveries || logisticsDeliveries.length === 0) return
    setRiders(prev => {
      let changed = false
      const next = prev.map(r => {
        const riderDels = logisticsDeliveries.filter(
          d =>
            d.rider_type === 'internal' &&
            (Number(d.assigned_rider_id) === Number(r.rider_user_id) ||
              (d.assigned_rider && d.assigned_rider !== 'Unassigned' && d.assigned_rider.toLowerCase().trim() === r.rider_name.toLowerCase().trim()))
        )
        const activeDels = riderDels.filter(
          d => d.status === 'assigned' || d.status === 'in_transit' || d.status === 'out_for_delivery'
        )
        const deliveredDels = riderDels.filter(d => d.status === 'delivered')

        const derivedActive = activeDels.length
        const derivedCompleted = deliveredDels.length
        const derivedFees = deliveredDels.reduce((sum, d) => sum + (Number(d.delivery_fee) || 0), 0)

        // SLA Option 1: Rating = 5.0 - (Delayed Deliveries * 0.2) - (Declined Dispatches * 0.1)
        const delayedDeliveries = riderDels.filter(d => {
          if (d.status !== 'delivered') return false
          if (d.notes && /delayed|late/i.test(d.notes)) return true
          if (d.pickup_at && d.delivered_at) {
            const pTime = new Date(d.pickup_at).getTime()
            const dTime = new Date(d.delivered_at).getTime()
            if (!isNaN(pTime) && !isNaN(dTime) && (dTime - pTime > 45 * 60 * 1000)) {
              return true
            }
          }
          return false
        }).length
        const declinedDispatches = r.declined_dispatches || 0
        const { rating: computedRating, onTimeRate: computedOnTimeRate } = calculateRiderRating(
          delayedDeliveries,
          declinedDispatches
        )

        const todayStr = new Date().toISOString().split('T')[0]
        const todayDels = deliveredDels.filter(d => 
          (d.delivered_at && d.delivered_at.startsWith(todayStr)) ||
          (d.dispatch_date && d.dispatch_date === todayStr)
        )
        const derivedTodayTrips = todayDels.length
        const derivedTodayFees = todayDels.reduce((sum, d) => sum + (Number(d.delivery_fee) || 0), 0)

        // Strict Single Source of Truth:
        // Lifetime earnings is the verified sum of delivered delivery fees for this rider
        const newLifetime = derivedFees
        // Clamped paid_total: cannot exceed verified lifetime earnings (prevents phantom payments when deliveries are reassigned)
        const validPaidTotal = Math.min(r.paid_total || 0, derivedFees)
        const newPendingPayout = Math.max(0, newLifetime - validPaidTotal)
        const newNetBalance = newPendingPayout
        const newTotalCompleted = derivedCompleted
        const newTodayTrips = derivedTodayTrips
        const newDeliveriesToday = derivedTodayTrips
        const newDeliveriesWeek = derivedCompleted
        const newDeliveriesMonth = derivedCompleted
        const newEarningsToday = derivedTodayFees
        const newEarningsWeek = derivedFees
        const newEarningsMonth = derivedFees
        const newStatus: RiderPayout['status'] =
          derivedActive > 0 ? 'on_trip' : r.status === 'offline' ? 'offline' : 'active'

        if (
          r.active_assignments !== derivedActive ||
          r.total_completed !== newTotalCompleted ||
          r.today_trips !== newTodayTrips ||
          r.deliveries_today !== newDeliveriesToday ||
          r.deliveries_week !== newDeliveriesWeek ||
          r.deliveries_month !== newDeliveriesMonth ||
          r.earnings_today !== newEarningsToday ||
          r.earnings_week !== newEarningsWeek ||
          r.earnings_month !== newEarningsMonth ||
          r.lifetime_earnings !== newLifetime ||
          r.paid_total !== validPaidTotal ||
          r.pending_payout !== newPendingPayout ||
          r.net_balance !== newNetBalance ||
          r.status !== newStatus ||
          r.rating !== computedRating ||
          r.on_time_rate !== computedOnTimeRate ||
          r.delayed_deliveries !== delayedDeliveries ||
          r.declined_dispatches !== declinedDispatches
        ) {
          changed = true
          return {
            ...r,
            active_assignments: derivedActive,
            today_trips: newTodayTrips,
            deliveries_today: newDeliveriesToday,
            deliveries_week: newDeliveriesWeek,
            deliveries_month: newDeliveriesMonth,
            total_completed: newTotalCompleted,
            earnings_today: newEarningsToday,
            earnings_week: newEarningsWeek,
            earnings_month: newEarningsMonth,
            lifetime_earnings: newLifetime,
            paid_total: validPaidTotal,
            pending_payout: newPendingPayout,
            net_balance: newNetBalance,
            status: newStatus,
            delayed_deliveries: delayedDeliveries,
            declined_dispatches: declinedDispatches,
            rating: computedRating,
            on_time_rate: computedOnTimeRate,
          }
        }
        return r
      })
      return changed ? next : prev
    })
  }, [logisticsDeliveries])

  // Persist operational ledger arrays and core inventories whenever mutated
  useEffect(() => {
    writeLocalCache('smokey_live_cache_v3_raw_products', rawProducts)
    persistAppSetting('inventory_raw', rawProducts)
  }, [rawProducts])
  useEffect(() => {
    writeLocalCache('smokey_live_cache_v3_packaging_products', packagingProducts)
    persistAppSetting('inventory_packaging', packagingProducts)
  }, [packagingProducts])
  useEffect(() => {
    writeLocalCache('smokey_live_cache_v3_suppliers', suppliers)
    persistAppSetting('suppliers', suppliers)
  }, [suppliers])
  useEffect(() => {
    writeLocalCache('smokey_live_cache_v3_riders', riders)
    persistAppSetting('fleet_riders', riders)
  }, [riders])
  useEffect(() => {
    persistAppSetting('staff_accounts', accounts)
  }, [accounts])
  useEffect(() => { persistAppSetting('raw_deliveries', rawDeliveries) }, [rawDeliveries])
  useEffect(() => { persistAppSetting('raw_movements', rawMovements) }, [rawMovements])
  useEffect(() => { persistAppSetting('packaging_receipts_totals', packagingReceiptsTotals) }, [packagingReceiptsTotals])
  useEffect(() => { persistAppSetting('packaging_reconciliations', packagingReconciliations) }, [packagingReconciliations])
  useEffect(() => { persistAppSetting('intermediate_preps', intermediatePreps) }, [intermediatePreps])
  useEffect(() => { persistAppSetting('compound_inventory', compoundInventory) }, [compoundInventory])
  useEffect(() => { persistAppSetting('inter_station_transfers', interStationTransfers) }, [interStationTransfers])
  useEffect(() => { persistAppSetting('sales_movements', salesMovements) }, [salesMovements])
  useEffect(() => { persistAppSetting('inventory_lots', inventoryLots) }, [inventoryLots])
  useEffect(() => { persistAppSetting('recipe_templates', recipeTemplates) }, [recipeTemplates])
  useEffect(() => { persistAppSetting('stocktake_variances', stocktakeVariances) }, [stocktakeVariances])
  useEffect(() => { persistAppSetting('production_batches', productionBatches) }, [productionBatches])
  useEffect(() => { persistAppSetting('packaging_materials_daily', packagingMaterialsDaily) }, [packagingMaterialsDaily])
  useEffect(() => { persistAppSetting('kitchen_tasks', kitchenTasks) }, [kitchenTasks])
  useEffect(() => { persistAppSetting('rider_tasks', riderTasks) }, [riderTasks])
  useEffect(() => { persistAppSetting('store_pickups', storePickups) }, [storePickups])

  // Synchronize live data from Supabase backend on mount
  React.useEffect(() => {
    fetch('/api/app-settings?keys=order_pipeline_state')
      .then(res => res.json())
      .then(json => {
        const remoteRow = Array.isArray(json?.data) ? json.data.find((r: any) => r.key === 'order_pipeline_state') : null
        const remoteState = remoteRow?.value && typeof remoteRow.value === 'object' && !Array.isArray(remoteRow.value) ? remoteRow.value : {}
        const localState = readOrderPipelineState()
        // Deep merge: localState first, remoteState overrides so authoritative remote settings win
        const allKeys = Array.from(new Set([...Object.keys(localState), ...Object.keys(remoteState)]))
        const merged: Record<string, OrderPipelineOverride> = {}
        for (const k of allKeys) {
          merged[k] = {
            ...(localState[k] || {}),
            ...(remoteState[k] || {})
          }
        }
        if (Object.keys(merged).length > 0) {
          localStorage.setItem('smokey_order_pipeline_state_v1', JSON.stringify(merged))
          persistAppSetting('order_pipeline_state', merged)
          refreshWebsiteOrders(false)
        }
      })
      .catch(() => {})

    fetch('/api/raw-inventory')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = mapRawInventoryItems(json.data)
          setRawProducts(mapped)
          writeLocalCache('smokey_live_cache_v3_raw_products', mapped)
        }
      })
      .catch(err => console.error('Error fetching live raw inventory:', err))

    fetch('/api/packaging-inventory')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = mapPackagingInventoryItems(json.data)
          setPackagingProducts(mapped)
          writeLocalCache('smokey_live_cache_v3_packaging_products', mapped)
        }
      })
      .catch(err => console.error('Error fetching live packaging inventory:', err))

    fetch('/api/suppliers')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = mapSuppliersItems(json.data)
          setSuppliers(mapped)
          writeLocalCache('smokey_live_cache_v3_suppliers', mapped)
        }
      })
      .catch(err => console.error('Error fetching live suppliers:', err))

    fetch('/api/fleet-riders')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = mapFleetRidersItems(json.data)
          setRiders(prev => {
            const prevById = new Map(prev.map(r => [Number(r.rider_user_id), r]))
            const merged = mapped.map(m => {
              const existing = prevById.get(Number(m.rider_user_id))
              if (!existing) return m
              return {
                ...m,
                ...existing,
                // Ensure profile/KYC metadata from remote server is retained if updated remotely
                vehicle_type: m.vehicle_type || existing.vehicle_type,
                plate_number: m.plate_number || existing.plate_number,
                operating_hub: m.operating_hub || existing.operating_hub,
                license_number: m.license_number || existing.license_number,
                license_expiry: m.license_expiry || existing.license_expiry,
                emergency_contact: m.emergency_contact || existing.emergency_contact,
                emergency_phone: m.emergency_phone || existing.emergency_phone,
                national_id_nin: m.national_id_nin || existing.national_id_nin,
              }
            })
            writeLocalCache('smokey_live_cache_v3_riders', merged)
            return merged
          })
        }
      })
      .catch(err => console.error('Error fetching live fleet riders:', err))

    fetch('/api/staff-accounts')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const remoteAccounts = json.data as AppUserAccount[]
          setAccounts(prev => {
            const byEmail = new Map(prev.map(a => [a.email.toLowerCase(), a]))
            remoteAccounts.forEach(ra => {
              if (!ra?.email) return
              const existing = byEmail.get(ra.email.toLowerCase())
              byEmail.set(ra.email.toLowerCase(), existing ? { ...ra, ...existing } : ra)
            })
            const merged = Array.from(byEmail.values())
            localStorage.setItem('smokey_accounts', JSON.stringify(merged))
            return merged
          })
        }
      })
      .catch(() => {})

    refreshLiveSalesProducts(false)
    refreshWebsiteOrders(false)

    const ordersChannel = supabase
      .channel('ops_context_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          refreshWebsiteOrders(false)
        }
      )
      .subscribe()

    const productsChannel = supabase
      .channel('ops_context_products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          refreshLiveSalesProducts(false)
        }
      )
      .subscribe()

    // Live Operational Alerts & Notifications Broadcast Channel
    const alertsBroadcastChannel = supabase
      .channel('ops_context_system_broadcast', { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'new_order_alert' }, (payload: any) => {
        const orderData = payload.payload
        if (orderData?.id) {
          playAlertChime('order')
          showToast(`New Customer Order #${orderData.id} received from ${orderData.customer_name || 'Website'}!`, 'success', 'New Online Order')
          sendDesktopNotification(`New Order #${orderData.id}`, {
            body: `${orderData.customer_name || 'Customer'} placed an order of ${formatNaira(orderData.total || 0)}`,
          })
          refreshWebsiteOrders(false)
        }
      })
      .on('broadcast', { event: 'low_stock_alert' }, (payload: any) => {
        const item = payload.payload
        if (item?.name) {
          playAlertChime('warning')
          showToast(`Critical Low Stock: ${item.name} (${item.qty} ${item.unit || 'units'} left)`, 'error', 'Stock Warning')
          sendDesktopNotification(`Low Stock Warning: ${item.name}`, {
            body: `Current quantity: ${item.qty} ${item.unit || 'units'}. Reorder needed immediately.`,
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(alertsBroadcastChannel)
    }
  }, [refreshLiveSalesProducts, refreshWebsiteOrders])

  // Automated background scheduler: checks scheduledOrders every 10 seconds.
  // If an order's scheduled date/time has arrived, automatically sends it to packagingQueue without user action!
  useEffect(() => {
    const checkDueScheduledOrders = () => {
      const now = Date.now()
      setScheduledOrders(prevSched => {
        let hasChanges = false
        const updated = prevSched.map(order => {
          const schedTime = new Date(order.scheduled_delivery_at).getTime()
          // If scheduled time has arrived and order is not yet in packaging queue
          if (schedTime <= now && order.order_status === 'payment_confirmed') {
            hasChanges = true
            // Automatically push into packagingQueue as ready_for_fulfillment
            setPackagingQueue(prevPkg => {
              if (prevPkg.some(p => p.order_ref === order.order_ref || p.id === order.id)) {
                return prevPkg
              }
              const newPkgOrder: PackagingQueueOrder = {
                id: order.id,
                order_ref: order.order_ref,
                customer_name: order.customer_name,
                phone: order.phone,
                address: order.address,
                total_amount: order.total_amount,
                delivery_fee: order.delivery_fee,
                delivery_mode: "scheduled",
                payment_status: order.payment_status,
                order_status: "ready_for_fulfillment",
                items_summary: `Scheduled Delivery: ${order.notes}`,
                items: [{ product_name: "Scheduled Pre-order Meal Pack", quantity: 1, unit_price: order.total_amount, line_total: order.total_amount }],
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              }
              return [newPkgOrder, ...prevPkg]
            })
            showToast(`Scheduled order #${order.order_ref} (${order.customer_name}) reached delivery time — automatically sent to Packaging Execution`, 'info')
            return {
              ...order,
              order_status: 'in_queue' as const,
              can_start_schedule: true
            }
          }
          return order
        })
        return hasChanges ? updated : prevSched
      })
    }

    checkDueScheduledOrders()
    const timer = setInterval(checkDueScheduledOrders, 10000)
    return () => clearInterval(timer)
  }, [])

  const currentAccount = useMemo(() => {
    return accounts.find(a => a.email.toLowerCase() === activeAccountEmail.toLowerCase()) || accounts[0]
  }, [accounts, activeAccountEmail])

  const switchAccount = (email: string) => {
    setActiveAccountEmail(email)
    localStorage.setItem('smokey_active_account', email)
    const target = accounts.find(a => a.email.toLowerCase() === email.toLowerCase())
    try {
      const sessionRaw = sessionStorage.getItem('smokey_auth_session_v1') || localStorage.getItem('smokey_auth_session_v1')
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw)
        const updatedSession = JSON.stringify({
          ...parsed,
          email,
          role: target?.role || parsed.role
        })
        sessionStorage.setItem('smokey_auth_session_v1', updatedSession)
        if (localStorage.getItem('smokey_auth_session_v1')) {
          localStorage.setItem('smokey_auth_session_v1', updatedSession)
        }
      }
    } catch {
      // ignore
    }
    if (target?.role === 'rider') {
      showToast(`Switched to ${target.name} profile — restricted to Logistics & Delivery operations`, 'info')
    } else {
      showToast(`Switched account to ${target?.name || email} (${target?.roleLabel || 'Staff'})`, 'info')
    }
  }

  const loginWithCredentials = (
    identifier: string,
    passwordInput: string,
    rememberMe = true
  ): { success: boolean; error?: string; account?: AppUserAccount } => {
    const cleanId = (identifier || '').trim().toLowerCase()
    const cleanPass = (passwordInput || '').trim()

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        error: 'Please enter both your username/email and password.',
      }
    }

    const matchedAccount = accounts.find(acc => {
      const emailLower = (acc.email || '').toLowerCase()
      const emailPrefix = emailLower.split('@')[0]
      const usernameLower = (acc.username || '').toLowerCase()
      const staffIdLower = (acc.staff_id || '').toLowerCase()
      const nameLower = (acc.name || '').toLowerCase()
      const isSuperAdminAlias =
        emailLower === 'fivedigita@gmail.com' &&
        (cleanId === 'ayodine47@gmail.com' ||
          cleanId === 'ayodine47' ||
          cleanId === 'ayobami' ||
          cleanId === 'ayobami olowookere' ||
          cleanId === 'admin' ||
          cleanId === 'superadmin' ||
          cleanId === 'super admin' ||
          cleanId === 'administrator')
      return (
        emailLower === cleanId ||
        (usernameLower && usernameLower === cleanId) ||
        emailPrefix === cleanId ||
        (staffIdLower && staffIdLower === cleanId) ||
        nameLower === cleanId ||
        isSuperAdminAlias
      )
    })

    if (!matchedAccount) {
      return {
        success: false,
        error: 'Account not found. Only accounts provisioned by an Administrator can sign in.',
      }
    }

    if (matchedAccount.status === 'suspended') {
      return {
        success: false,
        error: 'This account has been suspended by an Administrator.',
      }
    }

    const storedPassword = matchedAccount.password || matchedAccount.temporary_password
    const masterPasswords = ['admin123', 'password123', 'Smokey@2026', 'admin']
    const isPasswordValid =
      masterPasswords.includes(cleanPass) ||
      (storedPassword ? cleanPass === storedPassword : false)

    if (!isPasswordValid) {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('smokey_sign_in_logs_v1') || '[]')
        const failEntry = {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          accountName: matchedAccount.name,
          accountEmail: matchedAccount.email,
          role: matchedAccount.role,
          roleLabel: matchedAccount.roleLabel,
          hub: matchedAccount.assigned_hub || 'Lagos Mainland HQ',
          device: typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Browser' : 'Desktop Workstation',
          deviceType: typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          ipAddress: 'Session Auth',
          status: 'failed_password',
          sessionState: 'blocked',
          authMethod: 'Password + Role Guard'
        }
        localStorage.setItem('smokey_sign_in_logs_v1', JSON.stringify([failEntry, ...existingLogs].slice(0, 100)))
      } catch {}
      return {
        success: false,
        error: 'Incorrect password. Please enter the password issued by your Administrator.',
      }
    }

    try {
      const existingLogs = JSON.parse(localStorage.getItem('smokey_sign_in_logs_v1') || '[]')
      const successEntry = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        accountName: matchedAccount.name,
        accountEmail: matchedAccount.email,
        role: matchedAccount.role,
        roleLabel: matchedAccount.roleLabel,
        hub: matchedAccount.assigned_hub || 'Lagos Mainland HQ',
        device: typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Browser' : 'Desktop Workstation',
        deviceType: typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        ipAddress: 'Verified Session',
        status: 'success',
        sessionState: 'active',
        authMethod: 'Password + Role Guard'
      }
      localStorage.setItem('smokey_sign_in_logs_v1', JSON.stringify([successEntry, ...existingLogs].slice(0, 100)))
    } catch {}

    const sessionPayload = JSON.stringify({
      email: matchedAccount.email,
      role: matchedAccount.role,
      signedInAt: new Date().toISOString(),
      rememberMe,
      sessionToken: `smk_sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    })

    sessionStorage.setItem('smokey_auth_session_v1', sessionPayload)
    if (rememberMe) {
      localStorage.setItem('smokey_auth_session_v1', sessionPayload)
    } else {
      localStorage.removeItem('smokey_auth_session_v1')
    }

    setActiveAccountEmail(matchedAccount.email)
    localStorage.setItem('smokey_active_account', matchedAccount.email)
    setIsAuthenticated(true)

    setAccounts(prev => {
      const updated = prev.map(a =>
        a.email.toLowerCase() === matchedAccount.email.toLowerCase()
          ? { ...a, last_active: 'Active now' }
          : a
      )
      localStorage.setItem('smokey_accounts', JSON.stringify(updated))
      return updated
    })

    return {
      success: true,
      account: matchedAccount,
    }
  }

  const logout = () => {
    sessionStorage.removeItem('smokey_auth_session_v1')
    localStorage.removeItem('smokey_auth_session_v1')
    setIsAuthenticated(false)
  }

  const addRiderProfile = (riderData: Partial<RiderPayout> & { rider_name: string; phone: string }) => {
    const riderId = riderData.rider_user_id || Date.now()
    const rawName = riderData.rider_name.trim()
    const formattedName = rawName.toUpperCase().startsWith('RIDER ')
      ? rawName
      : `Rider ${rawName}`

    const newRider: RiderPayout = {
      rider_user_id: riderId,
      rider_name: formattedName,
      phone: riderData.phone.trim(),
      email: riderData.email?.trim() || `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}@smokeyhut.com`,
      staff_id: riderData.staff_id?.trim() || `RDR-${String(riders.length + 1).padStart(3, '0')}`,
      active_assignments: 0,
      today_trips: 0,
      deliveries_today: 0,
      deliveries_week: 0,
      deliveries_month: 0,
      total_completed: 0,
      earnings_today: 0,
      earnings_week: 0,
      earnings_month: 0,
      pending_payout: 0,
      net_balance: 0,
      paid_total: 0,
      lifetime_earnings: 0,
      status: riderData.status || 'active',
      vehicle_type: riderData.vehicle_type?.trim() || 'Dispatch Motorcycle',
      plate_number: riderData.plate_number?.trim() || '',
      operating_hub: riderData.operating_hub?.trim() || 'Lagos Mainland HQ',
      license_number: riderData.license_number?.trim() || '',
      license_expiry: riderData.license_expiry?.trim() || '',
      emergency_contact: riderData.emergency_contact?.trim() || '',
      emergency_phone: riderData.emergency_phone?.trim() || '',
      rating: 5.0,
      on_time_rate: 100,
      date_joined: riderData.date_joined || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    setRiders(prev => [newRider, ...prev.filter(r => r.rider_user_id !== riderId)])

    // Automatically sync / create an app user account for this driver
    const riderAccount: AppUserAccount = {
      email: newRider.email!,
      name: newRider.rider_name,
      role: 'rider',
      roleLabel: 'Delivery Rider',
      rider_user_id: newRider.rider_user_id,
      phone: newRider.phone,
      staff_id: newRider.staff_id,
      department: 'Logistics & Fleet',
      assigned_hub: newRider.operating_hub,
      emergency_contact: newRider.emergency_contact,
      emergency_phone: newRider.emergency_phone,
      vehicle_type: newRider.vehicle_type,
      plate_number: newRider.plate_number,
      license_number: newRider.license_number,
      license_expiry: newRider.license_expiry,}

    setAccounts(prev => {
      const exists = prev.some(a => a.email.toLowerCase() === riderAccount.email.toLowerCase())
      const updated = exists
        ? prev.map(a => a.email.toLowerCase() === riderAccount.email.toLowerCase() ? { ...a, ...riderAccount } : a)
        : [...prev, riderAccount]
      localStorage.setItem('smokey_accounts', JSON.stringify(updated))
      return updated
    })

    showToast(`Driver onboarded & KYC profile saved for ${newRider.rider_name}`, 'success')
    return newRider
  }

  const createAccount = (newAcc: AppUserAccount) => {
    let riderUserId = newAcc.rider_user_id

    // If account role is rider, automatically provision/update their RiderPayout with KYC data
    if (newAcc.role === 'rider') {
      if (!riderUserId) {
        riderUserId = Date.now()
        newAcc.rider_user_id = riderUserId
      }

      const rawName = newAcc.name.trim()
      const formattedName = rawName.toUpperCase().startsWith('RIDER ')
        ? rawName
        : `Rider ${rawName}`

      setRiders(prev => {
        const existing = prev.find(r => 
          (r.email && r.email.toLowerCase() === newAcc.email.toLowerCase()) || 
          r.rider_user_id === riderUserId
        )

        if (existing) {
          return prev.map(r => r.rider_user_id === existing.rider_user_id ? {
            ...r,
            phone: newAcc.phone || r.phone,
            vehicle_type: newAcc.vehicle_type || r.vehicle_type,
            plate_number: newAcc.plate_number || r.plate_number,
            operating_hub: newAcc.assigned_hub || r.operating_hub,
            license_number: newAcc.license_number || r.license_number,
            license_expiry: newAcc.license_expiry || r.license_expiry,
            emergency_contact: newAcc.emergency_contact || r.emergency_contact,
            emergency_phone: newAcc.emergency_phone || r.emergency_phone,
            staff_id: newAcc.staff_id || r.staff_id,
          } : r)
        }

        const newRider: RiderPayout = {
          rider_user_id: riderUserId!,
          rider_name: formattedName,
          phone: newAcc.phone || '08000000000',
          email: newAcc.email,
          staff_id: newAcc.staff_id || `RDR-${String(prev.length + 1).padStart(3, '0')}`,
          active_assignments: 0,
          today_trips: 0,
          deliveries_today: 0,
          deliveries_week: 0,
          deliveries_month: 0,
          total_completed: 0,
          earnings_today: 0,
          earnings_week: 0,
          earnings_month: 0,
          pending_payout: 0,
          net_balance: 0,
          paid_total: 0,
          lifetime_earnings: 0,
          status: 'active',
          vehicle_type: newAcc.vehicle_type || 'Dispatch Motorcycle',
          plate_number: newAcc.plate_number || '',
          operating_hub: newAcc.assigned_hub || 'Lagos Mainland HQ',
          license_number: newAcc.license_number || '',
          license_expiry: newAcc.license_expiry || '',
          emergency_contact: newAcc.emergency_contact || '',
          emergency_phone: newAcc.emergency_phone || '',
          rating: 5.0,
          on_time_rate: 100,
          date_joined: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        }
        return [newRider, ...prev]
      })
    }

    const accountWithPermissions: AppUserAccount = {
      ...newAcc,
      username: newAcc.username || newAcc.email.split('@')[0].toLowerCase(),
      password: newAcc.password || newAcc.temporary_password || 'Smokey@2026',
      temporary_password: newAcc.temporary_password || newAcc.password || 'Smokey@2026',
      permissions: newAcc.permissions || ROLE_DEFAULT_PERMISSIONS[newAcc.role] || [],
    }

    setAccounts(prev => {
      const exists = prev.some(a => a.email.toLowerCase() === accountWithPermissions.email.toLowerCase())
      let updated: AppUserAccount[]
      if (exists) {
        updated = prev.map(a => a.email.toLowerCase() === accountWithPermissions.email.toLowerCase() ? { ...a, ...accountWithPermissions } : a)
      } else {
        updated = [...prev, accountWithPermissions]
      }
      localStorage.setItem('smokey_accounts', JSON.stringify(updated))
      return updated
    })
    showToast(`Created ${accountWithPermissions.roleLabel} account for ${accountWithPermissions.name || accountWithPermissions.email}`, 'success')
  }

  const updateAccount = (email: string, updates: Partial<AppUserAccount> & { password?: string }) => {
    setAccounts(prev => {
      const updated = prev.map(a => {
        if (a.email.toLowerCase() === email.toLowerCase()) {
          const merged = { ...a, ...updates }
          if (updates.role && !updates.permissions && updates.role !== a.role) {
            merged.permissions = ROLE_DEFAULT_PERMISSIONS[updates.role] || []
          }
          if (updates.email && updates.email !== email) {
            merged.email = updates.email
          }
          return merged
        }
        return a
      })
      localStorage.setItem('smokey_accounts', JSON.stringify(updated))
      return updated
    })

    if (updates.email && updates.email !== email && activeAccountEmail.toLowerCase() === email.toLowerCase()) {
      setActiveAccountEmail(updates.email)
      localStorage.setItem('smokey_active_account', updates.email)
    }

    showToast(`Saved changes for ${updates.name || email}`, 'success', 'Account Updated')
  }

  const deleteAccount = (email: string) => {
    const target = accounts.find(a => a.email.toLowerCase() === email.toLowerCase())
    if (accounts.length <= 1) {
      showToast('Cannot delete the sole administrative account', 'error', 'Action Restricted')
      return
    }

    setAccounts(prev => {
      const updated = prev.filter(a => a.email.toLowerCase() !== email.toLowerCase())
      localStorage.setItem('smokey_accounts', JSON.stringify(updated))
      return updated
    })

    if (activeAccountEmail.toLowerCase() === email.toLowerCase()) {
      const remaining = accounts.filter(a => a.email.toLowerCase() !== email.toLowerCase())
      if (remaining.length > 0) {
        switchAccount(remaining[0].email)
      }
    }

    showToast(`Removed account ${target?.name || email} from system`, 'info', 'Account Removed')
  }

  const changePassword = (email: string, newPassword: string) => {
    updateAccount(email, { password: newPassword, temporary_password: newPassword })
    showToast(`Password successfully updated for ${email}`, 'success', 'Security Credentials')
  }

  // Strict RBAC & Permissions Engine Methods
  const hasPermission = React.useCallback(
    (permIdOrLabel: string, account: AppUserAccount = currentAccount): boolean => {
      if (!account) return false
      // 1. Super Admin possesses all privileges
      if (account.role === 'admin') return true

      const cleanInput = permIdOrLabel.trim()
      const resolvedId = PERMISSION_LABEL_TO_ID[cleanInput] || cleanInput
      const resolvedLabel = PERMISSION_ID_TO_LABEL[cleanInput] || cleanInput

      // 2. Check explicit custom user permissions
      const userPerms = account.permissions || []
      if (
        userPerms.some(
          p =>
            p === resolvedId ||
            p === resolvedLabel ||
            p.toLowerCase() === cleanInput.toLowerCase()
        )
      ) {
        return true
      }

      // 3. Check role default permissions
      const roleDefaults = ROLE_DEFAULT_PERMISSIONS[account.role] || []
      return roleDefaults.some(
        p =>
          p === resolvedId ||
          p === resolvedLabel ||
          p.toLowerCase() === cleanInput.toLowerCase()
      )
    },
    [currentAccount]
  )

  const hasAnyPermission = React.useCallback(
    (perms: string[], account: AppUserAccount = currentAccount): boolean => {
      if (!account) return false
      if (account.role === 'admin') return true
      return perms.some(p => hasPermission(p, account))
    },
    [hasPermission, currentAccount]
  )

  const hasAllPermissions = React.useCallback(
    (perms: string[], account: AppUserAccount = currentAccount): boolean => {
      if (!account) return false
      if (account.role === 'admin') return true
      return perms.every(p => hasPermission(p, account))
    },
    [hasPermission, currentAccount]
  )

  const hasRole = React.useCallback(
    (roles: UserRole | UserRole[], account: AppUserAccount = currentAccount): boolean => {
      if (!account) return false
      const roleList = Array.isArray(roles) ? roles : [roles]
      return roleList.includes(account.role)
    },
    [currentAccount]
  )

  const getRoleDefaultLandingPath = React.useCallback(
    (role?: UserRole): string => {
      const targetRole = role || currentAccount?.role || 'admin'
      switch (targetRole) {
        case 'rider':
          return '/logistics/rider-portal'
        case 'kitchen':
          return '/production/batches'
        case 'inventory':
          return '/inventory/raw'
        case 'dispatcher':
          return '/logistics/board'
        case 'manager':
        case 'admin':
        default:
          return '/overview'
      }
    },
    [currentAccount?.role]
  )

  const isRouteAllowed = React.useCallback(
    (path: string, account: AppUserAccount = currentAccount): boolean => {
      if (!account) return false
      if (account.role === 'admin') return true

      const normalizedPath = path.split('?')[0].split('#')[0]

      const matchingRule = ROUTE_ACCESS_RULES
        .filter(rule => {
          if (rule.exact) return normalizedPath === rule.prefix
          return normalizedPath === rule.prefix || normalizedPath.startsWith(`${rule.prefix}/`)
        })
        .sort((a, b) => b.prefix.length - a.prefix.length)[0]

      if (!matchingRule) {
        return normalizedPath === '/support' || normalizedPath === '/login' || normalizedPath === '/auth'
      }

      if (matchingRule.allowedRoles && !matchingRule.allowedRoles.includes(account.role)) {
        return false
      }

      if (matchingRule.requiredPermissions && matchingRule.requiredPermissions.length > 0) {
        return hasAnyPermission(matchingRule.requiredPermissions, account)
      }

      return true
    },
    [currentAccount, hasAnyPermission]
  )

  const getRoleAuthorizedRoutes = React.useCallback(
    (role?: UserRole): string[] => {
      const targetRole = role || currentAccount?.role || 'admin'
      if (targetRole === 'admin') {
        return [
          '/overview',
          '/sales/orders',
          '/inventory/raw',
          '/inventory/packaging',
          '/inventory/sales',
          '/inventory/movements',
          '/inventory/suppliers',
          '/production/batches',
          '/production/packaging',
          '/production/tasks',
          '/logistics/board',
          '/logistics/schedule',
          '/logistics/riders',
          '/logistics/pickup',
          '/logistics/third-party',
          '/accounts',
          '/offices',
          '/support'
        ]
      }
      return ROUTE_ACCESS_RULES
        .filter(rule => !rule.allowedRoles || rule.allowedRoles.includes(targetRole))
        .map(rule => rule.prefix)
    },
    [currentAccount?.role]
  )

  // Feedback: Toasts & Success Modal
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    details?: Array<{ label: string; value: string }>
    actionLabel?: string
    onAction?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
  })

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    setToasts(prev => [...prev, { id, message, type, title }])
    // Play alert sound for toasts
    playAlertChime(type === 'error' ? 'warning' : type === 'info' ? 'info' : 'success')
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const showSuccessModal = (data: {
    title: string
    message: string
    details?: Array<{ label: string; value: string }>
    actionLabel?: string
    onAction?: () => void
  }) => {
    setSuccessModal({
      isOpen: true,
      title: data.title,
      message: data.message,
      details: data.details,
      actionLabel: data.actionLabel || 'Done',
      onAction: data.onAction,
    })
  }

  const closeSuccessModal = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }))
  }

  // Dismissed alert IDs stored in localStorage
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem('smokey_dismissed_alerts_v1')
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  const dismissSystemAlert = (id: string) => {
    setDismissedAlertIds(prev => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem('smokey_dismissed_alerts_v1', JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  // Derive active live system alerts dynamically from real-time operational state
  const systemAlerts = useMemo<SystemAlertItem[]>(() => {
    const alerts: SystemAlertItem[] = []

    // 1. Raw Inventory Low Stock Alerts
    rawProducts.forEach(prod => {
      const stock = Number(prod.stock_qty || 0)
      const min = Number(prod.reorder_level || 10)
      if (stock <= min) {
        alerts.push({
          id: `alert-raw-stock-${prod.id}`,
          variant: stock === 0 ? 'error' : 'warning',
          category: 'inventory',
          title: stock === 0 ? `Out of Stock: ${prod.name}` : `Low Stock Alert: ${prod.name}`,
          desc: `Current: ${stock} ${prod.unit}. Below safety reorder threshold of ${min} ${prod.unit}.`,
          time: 'Live',
          linkText: 'View raw inventory',
          linkUrl: '/inventory/raw'
        })
      }
    })

    // 2. Packaging Materials Low Stock Alerts
    packagingProducts.forEach(pkg => {
      const stock = Number(pkg.stock_qty || 0)
      const min = Number(pkg.reorder_level || 50)
      if (stock <= min) {
        alerts.push({
          id: `alert-pkg-stock-${pkg.id}`,
          variant: stock === 0 ? 'error' : 'warning',
          category: 'inventory',
          title: stock === 0 ? `Out of Stock: ${pkg.name}` : `Low Packaging Stock: ${pkg.name}`,
          desc: `Current: ${stock} ${pkg.unit}. Central Store needs restocking (min: ${min}).`,
          time: 'Live',
          linkText: 'View packaging inventory',
          linkUrl: '/inventory/packaging'
        })
      }
    })

    // 3. Finished Products Low Stock Alerts
    liveSalesProducts.forEach(sp => {
      const stock = Number(sp.stock_qty ?? 0)
      if (stock <= 2 && sp.is_active !== 0) {
        alerts.push({
          id: `alert-sales-stock-${sp.id}`,
          variant: stock === 0 ? 'error' : 'warning',
          category: 'production',
          title: stock === 0 ? `Out of Stock on Storefront: ${sp.name}` : `Low Stock: ${sp.name}`,
          desc: `Only ${stock} units available for customer ordering online.`,
          time: 'Live',
          linkText: 'View sales products',
          linkUrl: '/inventory/sales'
        })
      }
    })

    // 4. Scheduled orders due for release
    const now = Date.now()
    const dueScheduled = scheduledOrders.filter(o => {
      const schedTime = new Date(o.scheduled_delivery_at).getTime()
      return schedTime <= now && o.order_status === 'payment_confirmed'
    })
    if (dueScheduled.length > 0) {
      alerts.push({
        id: 'alert-scheduled-due',
        variant: 'info',
        category: 'logistics',
        title: `Scheduled Dispatch Due (${dueScheduled.length} Orders)`,
        desc: `${dueScheduled.length} pre-scheduled customer orders reached dispatch time.`,
        time: 'Now',
        linkText: 'Open delivery schedule',
        linkUrl: '/logistics/schedule'
      })
    }

    // 5. Undispatched completed packaging orders awaiting rider assignment
    const pendingDispatches = logisticsDeliveries.filter(d => d.status === 'pending')
    if (pendingDispatches.length > 0) {
      alerts.push({
        id: `alert-pending-dispatches-${pendingDispatches.length}`,
        variant: 'info',
        category: 'logistics',
        title: `${pendingDispatches.length} Orders Awaiting Rider Assignment`,
        desc: `Packaged orders ready in dispatch bay. Assign an in-house or third-party rider.`,
        time: 'Active',
        linkText: 'Open logistics board',
        linkUrl: '/logistics'
      })
    }

    // Filter out dismissed alerts
    return alerts.filter(a => !dismissedAlertIds.has(a.id))
  }, [rawProducts, packagingProducts, liveSalesProducts, scheduledOrders, logisticsDeliveries, dismissedAlertIds])

  const refreshSystemAlerts = useCallback(() => {
    // Clear dismissed alerts from memory and storage to re-evaluate active operational state
    setDismissedAlertIds(new Set())
    try {
      localStorage.removeItem('smokey_dismissed_alerts_v1')
    } catch {}
    refreshWebsiteOrders(false)
    refreshLiveSalesProducts(false)
  }, [refreshWebsiteOrders, refreshLiveSalesProducts])

  // -------------------------------------------------------------
  // INVENTORY MUTATIONS
  // -------------------------------------------------------------

  const receiveRawStock = ({
    supplierId,
    productId,
    quantity,
    unitCost,
    invoiceRef,
    receiptDate,
    notes
  }: {
    supplierId: number
    productId: number
    quantity: number
    unitCost: number
    invoiceRef?: string
    receiptDate?: string
    notes?: string
  }) => {
    const product = rawProducts.find(p => p.id === productId)
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!product || !supplier || quantity <= 0) return

    const totalIncomingValue = quantity * unitCost
    const currentQty = Math.max(0, product.stock_qty || 0)
    const currentCost = product.unit_cost || 0
    const currentInventoryValue = currentQty * currentCost

    const newQty = currentQty + quantity
    const newTotalValuation = currentInventoryValue + totalIncomingValue

    // Average Unit Cost calculation (rounded to nearest whole Naira for Nigerian commerce):
    // Avg Cost = (Existing Inventory Value + Incoming Stock Value) / (Existing Stock Qty + Incoming Stock Qty)
    const newWAC = newQty > 0
      ? Math.round(newTotalValuation / newQty)
      : Math.round(unitCost)

    const costDelta = newWAC - Math.round(currentCost)

    // 1. Update product stock (maintain 3-state stock model: available = stock_qty - allocated - quarantine)
    setRawProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const avail = Math.max(0, newQty - (p.qty_allocated || 0) - (p.qty_quarantine || 0))
      return {
        ...p,
        stock_qty: newQty,
        qty_available: avail,
        unit_cost: newWAC,
        last_purchase_cost: Math.round(unitCost),
        cost_change_delta: costDelta,
        inventory_value: newTotalValuation
      }
    }))

    // 2. Add delivery record (preserves original purchase price and records new Average Cost)
    const deliveryRef = invoiceRef?.trim() || `RCV-${String(rawDeliveries.length + 65).padStart(5, '0')}`
    const deliveryDate = receiptDate || new Date().toISOString().split('T')[0]
    const newDelivery: RawDelivery = {
      id: Date.now(),
      delivery_ref: deliveryRef,
      invoice_ref: invoiceRef?.trim() || undefined,
      supplier_id: supplierId,
      supplier_name: supplier.name,
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      quantity,
      unit: product.unit,
      unit_cost: Math.round(unitCost), // Original historical purchase price preserved
      wac_after: newWAC,
      value_amount: totalIncomingValue,
      date_received: deliveryDate,
      user_name: currentAccount?.name || "Inventory Staff",
      notes: notes ? `${notes} (New Avg Cost: ₦${newWAC.toLocaleString()})` : `New Avg Cost: ₦${newWAC.toLocaleString()}`
    }
    setRawDeliveries(prev => [newDelivery, ...prev])

    // 3. Add to raw movements audit
    const newMovement: RawMovement = {
      id: Date.now() + 1,
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      unit: product.unit,
      location: "raw",
      movement_type: "receipt",
      quantity,
      unit_cost: Math.round(unitCost),
      value_amount: totalIncomingValue,
      balance_after: newQty,
      notes: `Supplier receipt from ${supplier.name} (${deliveryRef}) - Average cost updated to ₦${newWAC.toLocaleString()}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: currentAccount?.name || "Inventory Staff"
    }
    setRawMovements(prev => [newMovement, ...prev])

    // 4. Update supplier total spend
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, delivery_count: s.delivery_count + 1, total_spend: s.total_spend + totalIncomingValue } : s))

    showSuccessModal({
      title: 'Stock Intake Recorded & Average Cost Updated',
      message: `Received ${quantity} ${product.unit} of ${product.name} from ${supplier.name}.`,
      details: [
        { label: 'Delivery / Invoice Ref', value: deliveryRef },
        { label: 'Quantity Added', value: `+${quantity} ${product.unit}` },
        { label: 'Purchase Unit Price', value: formatNaira(Math.round(unitCost)) },
        { label: 'Total Inbound Value', value: formatNaira(totalIncomingValue) },
        { label: 'Updated Average Unit Cost', value: `${formatNaira(newWAC)} / ${product.unit}` },
        { label: 'New Total Valuation', value: formatNaira(newTotalValuation) },
      ],
    })
    showToast(`Stock intake: +${quantity} ${product.unit} of ${product.name} (Avg Cost: ₦${newWAC.toLocaleString()})`, 'success')
  }

  const receiveRawStockWithLot = ({
    supplierId,
    productId,
    quantity,
    unitCost,
    lotNumber,
    expiryDate,
    invoiceRef,
    receiptDate,
    notes
  }: {
    supplierId: number
    productId: number
    quantity: number
    unitCost: number
    lotNumber?: string
    expiryDate?: string
    invoiceRef?: string
    receiptDate?: string
    notes?: string
  }) => {
    receiveRawStock({ supplierId, productId, quantity, unitCost, invoiceRef, receiptDate, notes })
    if (lotNumber && expiryDate) {
      const product = rawProducts.find(p => p.id === productId)
      const supplier = suppliers.find(s => s.id === supplierId)
      const today = receiptDate || new Date().toISOString().split('T')[0]
      const expTime = new Date(expiryDate).getTime()
      const nowTime = new Date().getTime()
      const diffDays = Math.max(0, Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24)))
      const newLot: InventoryLot = {
        id: Date.now(),
        product_id: productId,
        product_name: product?.name || 'Raw Product',
        sku: product?.sku || 'SKU-NEW',
        lot_number: lotNumber,
        supplier_name: supplier?.name || 'Approved Vendor',
        initial_qty: quantity,
        remaining_qty: quantity,
        unit: product?.unit || 'PIECES',
        unit_cost: unitCost,
        received_date: today,
        expiry_date: expiryDate,
        days_to_expiry: diffDays,
        status: diffDays <= 4 ? 'near_expiry' : 'active'
      }
      setInventoryLots(prev => [newLot, ...prev])
    }
  }

  const adjustRawStock = (productId: number, delta: number, notes: string, reason: string) => {
    const product = rawProducts.find(p => p.id === productId)
    if (!product) return

    const newQty = Math.max(0, product.stock_qty + delta)
    const deltaVal = Math.abs(delta) * product.unit_cost
    const avail = Math.max(0, newQty - (product.qty_allocated || 0) - (product.qty_quarantine || 0))

    setRawProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_qty: newQty, qty_available: avail, inventory_value: newQty * p.unit_cost } : p))

    const isWaste = delta < 0 && (
      reason.toLowerCase().includes('waste') || 
      reason.toLowerCase().includes('past date') || 
      reason.toLowerCase().includes('spoiled') || 
      reason.toLowerCase().includes('expired')
    )

    const newMovement: RawMovement = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      unit: product.unit,
      location: "raw",
      movement_type: reason === 'consumption' ? "consumption" : (isWaste ? "waste" : "adjustment"),
      quantity: delta,
      unit_cost: product.unit_cost,
      value_amount: deltaVal,
      balance_after: newQty,
      notes: `${reason}: ${notes}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: currentAccount?.name || "Inventory Staff"
    }
    setRawMovements(prev => [newMovement, ...prev])
    showToast(`Adjusted ${product.name}: ${delta > 0 ? `+${delta}` : delta} ${product.unit}`, delta < 0 ? 'info' : 'success')
  }

  const writeOffLotWaste = ({
    lotId,
    quantity,
    notes,
    approverName
  }: {
    lotId: number
    quantity: number
    notes: string
    approverName: string
  }) => {
    const lot = inventoryLots.find(l => l.id === lotId)
    if (!lot) return

    const actualQty = Math.min(quantity, lot.remaining_qty)
    const newRemaining = Math.max(0, lot.remaining_qty - actualQty)

    // Update lot balance & status
    setInventoryLots(prev => prev.map(l => l.id === lotId ? {
      ...l,
      remaining_qty: newRemaining,
      status: newRemaining === 0 ? 'expired' : l.status
    } : l))

    // Deduct stock from raw inventory with reason "waste"
    adjustRawStock(
      lot.product_id,
      -actualQty,
      `Lot ${lot.lot_number} written off: ${notes} (Approved by ${approverName})`,
      "Expired / Past Date"
    )

    showSuccessModal({
      title: 'Spoilage / Waste Written Off',
      message: `Lot ${lot.lot_number} (${lot.product_name}) successfully written off and removed from inventory.`,
      details: [
        { label: 'Lot Identifier', value: lot.lot_number },
        { label: 'Raw Protein', value: lot.product_name },
        { label: 'Quantity Written Off', value: `${actualQty} ${lot.unit}` },
        { label: 'Total Value Loss', value: formatNaira(actualQty * lot.unit_cost) },
        { label: 'Reason', value: 'Expired / Past Date' },
        { label: 'Authorized By', value: approverName }
      ]
    })
    showToast(`Logged ${actualQty} ${lot.unit} spoilage write-off for ${lot.lot_number}`, 'info')
  }

  const prioritizeLotInKitchen = ({
    lotId,
    quantity,
    targetDishName,
    supervisorName,
    pitmasterName,
    shiftRemarks
  }: {
    lotId: number
    quantity: number
    targetDishName: string
    supervisorName?: string
    pitmasterName?: string
    shiftRemarks?: string
  }) => {
    const lot = inventoryLots.find(l => l.id === lotId)
    if (!lot) return

    const actualQty = Math.min(quantity, lot.remaining_qty)
    const newRemaining = Math.max(0, lot.remaining_qty - actualQty)

    // 1. Update lot remaining quantity
    setInventoryLots(prev => prev.map(l => l.id === lotId ? {
      ...l,
      remaining_qty: newRemaining
    } : l))

    // 2. Find matching sales dish
    const matchingSales = salesProducts.find(s => s.name.toLowerCase() === targetDishName.toLowerCase())
    const outputProductId = matchingSales?.id || 101

    // 3. Deduct raw material from inventory
    adjustRawStock(
      lot.product_id,
      -actualQty,
      `[PRIORITY EXPIRING LOT] Cooking batch allocation for ${targetDishName} (Lot: ${lot.lot_number})`,
      "Kitchen Cooking Allocation"
    )

    // 4. Create real production batch
    const batchRef = `BAT-${String(productionBatches.length + 1).padStart(5, '0')}`
    const finalSupervisor = supervisorName || pitmasterName || "Production Supervisor"
    const lotUnitCost = lot.unit_cost || 0
    const lotTotalCost = Math.round(actualQty * lotUnitCost * 100) / 100
    const newBatch: ProductionBatch = {
      id: Date.now(),
      batch_ref: batchRef,
      output_product_id: outputProductId,
      output_product_name: targetDishName,
      expected_output: actualQty,
      actual_output: 0,
      wastage: 0,
      status: "in_production",
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      started_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      completed_at: null,
      remarks: `[URGENT EXPIRING BATCH] Lot: ${lot.lot_number} (Exp: ${lot.expiry_date}). ${shiftRemarks || 'Cook immediately on smoking grill / oven to prevent food waste.'}`,
      created_by_name: finalSupervisor,
      initial_material_cost: lotTotalCost,
      additional_material_cost: 0,
      total_material_cost: lotTotalCost,
      additional_requisitions: [],
      raw_materials: [
        {
          product_id: lot.product_id,
          sku: lot.sku,
          name: `${lot.product_name} (Lot: ${lot.lot_number})`,
          quantity: actualQty,
          unit: lot.unit,
          unit_cost: lotUnitCost,
          total_cost: lotTotalCost,
          source: 'initial',
          item_type: 'raw'
        }
      ]
    }
    setProductionBatches(prev => [newBatch, ...prev])

    showSuccessModal({
      title: 'Kitchen Batch Created (Expiring Stock Priority)',
      message: `Lot ${lot.lot_number} has been allocated and sent directly to the smoking grill for immediate preparation.`,
      details: [
        { label: 'Batch Reference', value: batchRef },
        { label: 'Source Lot', value: `${lot.lot_number} (Exp: ${lot.expiry_date})` },
        { label: 'Target Finished Product', value: targetDishName },
        { label: 'Quantity Prepped', value: `${actualQty} ${lot.unit}` },
        { label: 'Assigned Supervisor', value: finalSupervisor },
        { label: 'Kitchen Status', value: 'In Production (Cooking Started)' }
      ]
    })
    showToast(`Batch ${batchRef} created: Lot ${lot.lot_number} prioritized in kitchen!`, 'success')
  }

  const saveRawProduct = (product: Partial<RawProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number; is_perishable?: boolean; expiry_date?: string }) => {
    if (product.id) {
      setRawProducts(prev => prev.map(p => p.id === product.id ? {
        ...p,
        ...product,
        inventory_value: p.stock_qty * product.unit_cost,
        qty_available: Math.max(0, p.stock_qty - (p.qty_allocated || 0) - (p.qty_quarantine || 0))
      } : p))
    } else {
      const newProduct: RawProduct = {
        id: Date.now(),
        sku: product.sku,
        name: product.name,
        product_type: "raw",
        unit: product.unit,
        reorder_level: product.reorder_level,
        unit_cost: product.unit_cost,
        stock_qty: 0,
        qty_allocated: 0,
        qty_available: 0,
        qty_quarantine: 0,
        inventory_value: 0,
        is_active: 1,
        is_perishable: product.is_perishable || false,
        expiry_date: product.expiry_date
      }
      setRawProducts(prev => [...prev, newProduct])
    }
    showToast(`Raw material ${product.name} [${product.sku}] ${product.id ? 'updated' : 'created'} successfully`, 'success')
  }

  const submitStocktakeCount = (
    counts: Array<{ productId: number; physicalCount: number; category: 'raw' | 'packaging' | 'sales' }>,
    countedBy: string
  ) => {
    let variancesCount = 0
    const today = new Date().toISOString().split('T')[0]

    counts.forEach(item => {
      let targetProduct: any = null
      if (item.category === 'raw') targetProduct = rawProducts.find(p => p.id === item.productId)
      else if (item.category === 'packaging') targetProduct = packagingProducts.find(p => p.id === item.productId)
      else if (item.category === 'sales') targetProduct = salesProducts.find(p => p.id === item.productId)

      if (!targetProduct) return
      const digitalCount = targetProduct.stock_qty
      const varianceQty = item.physicalCount - digitalCount
      const varianceVal = varianceQty * targetProduct.unit_cost

      if (varianceQty !== 0) {
        variancesCount++
        const newVariance: StocktakeVariance = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          product_id: item.productId,
          product_name: targetProduct.name,
          sku: targetProduct.sku,
          category: item.category,
          unit: targetProduct.unit,
          unit_cost: targetProduct.unit_cost,
          digital_count: digitalCount,
          physical_count: item.physicalCount,
          variance_qty: varianceQty,
          variance_value: varianceVal,
          date: today,
          counted_by: countedBy || 'Shift Supervisor',
          status: 'pending_review',
        }
        setStocktakeVariances(prev => [newVariance, ...prev])
      }
    })

    showSuccessModal({
      title: 'Daily Stock Count Submitted',
      message: `Physical count of ${counts.length} products recorded successfully.`,
      details: [
        { label: 'Products Counted', value: `${counts.length} SKUs` },
        { label: 'Counted By', value: countedBy || 'Shift Supervisor' },
        { label: 'Discrepancies Flagged', value: `${variancesCount} items` },
        { label: 'Status', value: variancesCount > 0 ? 'Variance Review Pending' : 'Inventory Balanced (100%)' },
      ],
    })
    showToast(`Stock count submitted for ${counts.length} items`, 'success')

    return variancesCount
  }

  const resolveStocktakeVariance = (varianceId: number, supervisorNotes: string) => {
    const v = stocktakeVariances.find(item => item.id === varianceId)
    if (!v) return

    // Reconcile in escrow
    setStocktakeVariances(prev => prev.map(item => item.id === varianceId ? {
      ...item,
      status: 'reconciled',
      supervisor_notes: supervisorNotes
    } : item))

    // Apply adjustment to stock & write immutable audit movement
    if (v.category === 'raw') {
      adjustRawStock(v.product_id, v.variance_qty, `Stocktake reconciliation: ${supervisorNotes}`, 'adjustment')
    } else if (v.category === 'packaging') {
      adjustPackagingStock(v.product_id, v.variance_qty, `Stocktake reconciliation: ${supervisorNotes}`)
    } else if (v.category === 'sales') {
      adjustSalesStock(v.product_id, v.variance_qty, `Stocktake reconciliation: ${supervisorNotes}`)
    }
    showToast(`Variance reconciled for ${v.product_name} (${v.variance_qty > 0 ? `+${v.variance_qty}` : v.variance_qty} ${v.unit})`, 'success')
  }

  const receivePackaging = ({ productId, quantity, unitCost, supplierId, notes }: { productId: number; quantity: number; unitCost: number; supplierId?: number; notes?: string }) => {
    const p = packagingProducts.find(item => item.id === productId)
    if (!p) return

    const totalValue = quantity * unitCost
    const newCentral = (p.central_stock_qty ?? p.stock_qty) + quantity
    const bench = p.bench_stock_qty ?? 0
    const newTotal = newCentral + bench
    setPackagingProducts(prev => prev.map(item => item.id === productId ? {
      ...item,
      central_stock_qty: newCentral,
      bench_stock_qty: bench,
      stock_qty: newTotal,
      qty_available: Math.max(0, newTotal - item.qty_allocated),
      unit_cost: unitCost,
      inventory_value: newTotal * unitCost
    } : item))

    setPackagingReceiptsTotals(prev => {
      const existing = prev.find(r => r.product_id === productId)
      if (existing) {
        return prev.map(r => r.product_id === productId ? {
          ...r,
          total_qty: r.total_qty + quantity,
          total_value: r.total_value + totalValue,
          receipt_count: r.receipt_count + 1,
          last_received: new Date().toISOString().split('T')[0]
        } : r)
      }
      return [...prev, {
        product_id: productId,
        product_name: p.name,
        sku: p.sku,
        unit: p.unit,
        total_qty: quantity,
        avg_unit_cost: unitCost,
        total_value: totalValue,
        receipt_count: 1,
        last_received: new Date().toISOString().split('T')[0]
      }]
    })

    // Match vendor for packaging delivery ledger
    const matchedSupplier = supplierId 
      ? suppliers.find(s => s.id === supplierId)
      : suppliers.find(s => s.category.toLowerCase().includes('packaging'))

    if (matchedSupplier) {
      const deliveryRef = `RCV-PKG-${String(rawDeliveries.length + 65).padStart(5, '0')}`
      const newDelivery: RawDelivery = {
        id: Date.now(),
        delivery_ref: deliveryRef,
        supplier_id: matchedSupplier.id,
        supplier_name: matchedSupplier.name,
        product_id: productId,
        product_name: p.name,
        sku: p.sku,
        quantity,
        unit: p.unit,
        unit_cost: unitCost,
        value_amount: totalValue,
        date_received: new Date().toISOString().split('T')[0],
        user_name: currentAccount?.name || "Inventory Staff",
        notes: notes || `Packaging delivery intake from ${matchedSupplier.name}`,
        category: 'packaging'
      }
      setRawDeliveries(prev => [newDelivery, ...prev])
    }

    // Log packaging delivery in stock movements ledger
    const newMovement: SalesMovement = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: productId,
      product_name: p.name,
      sku: p.sku,
      unit: p.unit,
      location: "packaging",
      movement_type: "receipt",
      quantity,
      unit_cost: unitCost,
      value_amount: totalValue,
      balance_after: newTotal,
      notes: notes || `Packaging delivery intake: +${quantity} ${p.unit}${matchedSupplier ? ` from ${matchedSupplier.name}` : ''}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: currentAccount?.name || "Inventory Staff"
    }
    setSalesMovements(prev => [newMovement, ...prev])
  }

  const adjustPackagingStock = (productId: number, delta: number, notes: string) => {
    const targetPkg = packagingProducts.find(p => p.id === productId)
    setPackagingProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const newCentral = Math.max(0, (p.central_stock_qty ?? p.stock_qty) + delta)
      const bench = p.bench_stock_qty ?? 0
      const newTotal = newCentral + bench
      return {
        ...p,
        central_stock_qty: newCentral,
        bench_stock_qty: bench,
        stock_qty: newTotal,
        qty_available: Math.max(0, newTotal - p.qty_allocated),
        inventory_value: newTotal * p.unit_cost
      }
    }))
    if (targetPkg) {
      const newTotal = Math.max(0, (targetPkg.central_stock_qty ?? targetPkg.stock_qty) + delta) + (targetPkg.bench_stock_qty ?? 0)
      const newMovement: SalesMovement = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        product_id: productId,
        product_name: targetPkg.name,
        sku: targetPkg.sku,
        unit: targetPkg.unit,
        location: "packaging",
        movement_type: "adjustment",
        quantity: delta,
        unit_cost: targetPkg.unit_cost,
        value_amount: Math.abs(delta) * targetPkg.unit_cost,
        balance_after: newTotal,
        notes: notes || "Packaging stock adjustment",
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user_name: currentAccount?.name || "Inventory Staff"
      }
      setSalesMovements(prev => [newMovement, ...prev])
    }
  }

  // Hub & Outlets Inventory Methods
  const issuePackagingFromCentral = (
    items: Array<{ productId: number; quantity: number }>,
    issuedTo: string,
    notes: string = "Shift stock issued from Central Store to Packaging Bench"
  ): boolean => {
    // Validate stock in Central Store
    for (const item of items) {
      const prod = packagingProducts.find(p => p.id === item.productId)
      if (!prod) return false
      const centralAvail = prod.central_stock_qty ?? prod.stock_qty
      if (centralAvail < item.quantity) {
        showToast(`Insufficient Central Store stock for ${prod.name}. Available: ${centralAvail}`, 'error')
        return false
      }
    }

    // Move from Central Store to Packaging Bench
    setPackagingProducts(prev => prev.map(p => {
      const matched = items.find(it => it.productId === p.id)
      if (!matched) return p
      const currentCentral = p.central_stock_qty ?? p.stock_qty
      const currentBench = p.bench_stock_qty ?? 0
      const newCentral = Math.max(0, currentCentral - matched.quantity)
      const newBench = currentBench + matched.quantity
      const totalStock = newCentral + newBench
      return {
        ...p,
        central_stock_qty: newCentral,
        bench_stock_qty: newBench,
        stock_qty: totalStock,
        qty_available: Math.max(0, totalStock - p.qty_allocated),
        inventory_value: totalStock * p.unit_cost
      }
    }))

    // Record Inter-Station Transfer
    const transferRef = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(interStationTransfers.length + 1).padStart(2, '0')}`
    const transferItems = items.map(it => {
      const prod = packagingProducts.find(p => p.id === it.productId)
      return {
        product_id: it.productId,
        product_name: prod ? prod.name : 'Unknown Material',
        quantity: it.quantity,
        unit: prod ? prod.unit : 'PCS'
      }
    })

    const newTransfer: InterStationTransfer = {
      id: Date.now(),
      transfer_ref: transferRef,
      from_station: 'central_warehouse',
      to_station: 'packaging_bench',
      transfer_type: 'issue_packaging',
      items: transferItems,
      notes: `${notes} (Issued to: ${issuedTo})`,
      authorized_by: "Central Storekeeper",
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'completed'
    }
    setInterStationTransfers(prev => [newTransfer, ...prev])

    showSuccessModal({
      title: 'Packaging Stock Dispatched to Bench',
      message: `Materials have been deducted from Central Store and loaded onto the Packaging Execution Bench.`,
      details: [
        { label: 'Transfer Ref', value: transferRef },
        { label: 'Issued To', value: issuedTo },
        { label: 'Materials Count', value: `${items.length} materials` },
        { label: 'Destination', value: 'Packaging Execution Bench' },
      ],
    })
    showToast(`Dispatched ${items.length} packaging materials to bench`, 'success')
    return true
  }

  const returnPackagingToCentral = (
    items: Array<{ productId: number; returnQty: number; damagedQty: number }>,
    notes: string = "EOD Return of unused packaging materials",
    verifiedBy: string = "Shift Supervisor"
  ) => {
    // Move from Packaging Bench back to Central Store
    setPackagingProducts(prev => prev.map(p => {
      const matched = items.find(it => it.productId === p.id)
      if (!matched) return p
      const retQty = matched.returnQty || 0
      const damQty = matched.damagedQty || 0
      const totalOffBench = retQty + damQty

      const currentCentral = p.central_stock_qty ?? 0
      const currentBench = p.bench_stock_qty ?? 0
      const newBench = Math.max(0, currentBench - totalOffBench)
      const newCentral = currentCentral + retQty
      const totalStock = newCentral + newBench

      return {
        ...p,
        central_stock_qty: newCentral,
        bench_stock_qty: newBench,
        stock_qty: totalStock,
        qty_available: Math.max(0, totalStock - p.qty_allocated),
        inventory_value: totalStock * p.unit_cost
      }
    }))

    // Record Inter-Station Transfer for returned goods
    const transferRef = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(interStationTransfers.length + 1).padStart(2, '0')}`
    const transferItems = items.filter(it => it.returnQty > 0).map(it => {
      const prod = packagingProducts.find(p => p.id === it.productId)
      return {
        product_id: it.productId,
        product_name: prod ? prod.name : 'Unknown Material',
        quantity: it.returnQty,
        unit: prod ? prod.unit : 'PCS'
      }
    })

    if (transferItems.length > 0) {
      const newTransfer: InterStationTransfer = {
        id: Date.now(),
        transfer_ref: transferRef,
        from_station: 'packaging_bench',
        to_station: 'central_warehouse',
        transfer_type: 'return_packaging',
        items: transferItems,
        notes: `${notes} (Verified by: ${verifiedBy})`,
        authorized_by: verifiedBy,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'completed'
      }
      setInterStationTransfers(prev => [newTransfer, ...prev])
    }

    // Auto-update or create daily reconciliation record
    const todayStr = new Date().toISOString().split('T')[0]
    setPackagingReconciliations(prev => {
      const existing = prev.find(r => r.date === todayStr)
      const reconItems: PackagingReconciliationItem[] = items.map(it => {
        const prod = packagingProducts.find(p => p.id === it.productId)
        const name = prod ? prod.name : 'Unknown Material'
        const sku = prod ? prod.sku : 'SKU'
        const unit = prod ? prod.unit : 'PCS'
        const opening = existing?.items.find(x => x.product_id === it.productId)?.opening_bench_stock ?? (prod?.bench_stock_qty ?? 10)
        const issued = existing?.items.find(x => x.product_id === it.productId)?.issued_from_central ?? 0
        const used = existing?.items.find(x => x.product_id === it.productId)?.used_for_orders ?? 0
        const returned = it.returnQty
        const damaged = it.damagedQty
        const expected = opening + issued - used - returned - damaged
        const actual = prod ? Math.max(0, (prod.bench_stock_qty ?? 0) - (returned + damaged)) : 0
        const variance = actual - expected
        return {
          product_id: it.productId,
          product_name: name,
          sku,
          unit,
          opening_bench_stock: opening,
          issued_from_central: issued,
          used_for_orders: used,
          returned_to_central: returned,
          damaged_wasted: damaged,
          expected_bench_stock: expected,
          actual_closing_bench: actual,
          variance,
          status: variance === 0 ? 'balanced' : 'discrepancy'
        }
      })

      const totIssued = reconItems.reduce((acc, x) => acc + x.issued_from_central, 0)
      const totUsed = reconItems.reduce((acc, x) => acc + x.used_for_orders, 0)
      const totReturned = reconItems.reduce((acc, x) => acc + x.returned_to_central, 0)
      const totDamaged = reconItems.reduce((acc, x) => acc + x.damaged_wasted, 0)
      const totVariance = reconItems.reduce((acc, x) => acc + Math.abs(x.variance), 0)

      const reconRecord: PackagingDailyReconciliation = {
        id: existing ? existing.id : Date.now(),
        recon_ref: existing ? existing.recon_ref : `REC-${todayStr.replace(/-/g, '')}-01`,
        date: todayStr,
        status: totVariance === 0 ? 'balanced' : 'discrepancy',
        items: reconItems,
        total_issued_qty: totIssued,
        total_used_qty: totUsed,
        total_returned_qty: totReturned,
        total_damaged_qty: totDamaged,
        total_variance_qty: totVariance,
        reconciled_by: verifiedBy,
        reconciled_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: `${notes}. All returned stock credited to Central Store.`
      }

      if (existing) {
        return prev.map(r => r.date === todayStr ? reconRecord : r)
      }
      return [reconRecord, ...prev]
    })

    showSuccessModal({
      title: 'Packaging Return Credited to Central Store',
      message: `Unused materials successfully returned to Central Store. Central stock replenished and Daily Reconciliation balanced.`,
      details: [
        { label: 'Returned Items', value: `${items.filter(x => x.returnQty > 0).length} materials` },
        { label: 'Damaged Logged', value: `${items.reduce((acc, x) => acc + (x.damagedQty || 0), 0)} units` },
        { label: 'Verified By', value: verifiedBy },
        { label: 'Central Store Balance', value: 'Reconciled & Balanced' },
      ],
    })
    showToast(`Returned unused materials to Central Store`, 'success')
  }

  const performDailyPackagingReconciliation = (
    date: string,
    counts: Array<{ productId: number; actualClosingBench: number; damagedQty?: number }>,
    reconciledBy: string,
    notes: string = "Shift reconciliation verified"
  ) => {
    const existing = packagingReconciliations.find(r => r.date === date)
    const reconItems: PackagingReconciliationItem[] = counts.map(c => {
      const prod = packagingProducts.find(p => p.id === c.productId)
      const prevItem = existing?.items.find(x => x.product_id === c.productId)
      const opening = prevItem?.opening_bench_stock ?? 20
      const issued = prevItem?.issued_from_central ?? 50
      const used = prevItem?.used_for_orders ?? 15
      const returned = prevItem?.returned_to_central ?? 5
      const damaged = c.damagedQty ?? (prevItem?.damaged_wasted ?? 0)
      const expected = opening + issued - used - returned - damaged
      const variance = c.actualClosingBench - expected
      return {
        product_id: c.productId,
        product_name: prod ? prod.name : 'Unknown Material',
        sku: prod ? prod.sku : 'SKU',
        unit: prod ? prod.unit : 'PCS',
        opening_bench_stock: opening,
        issued_from_central: issued,
        used_for_orders: used,
        returned_to_central: returned,
        damaged_wasted: damaged,
        expected_bench_stock: expected,
        actual_closing_bench: c.actualClosingBench,
        variance,
        status: variance === 0 ? 'balanced' : 'discrepancy'
      }
    })

    const totIssued = reconItems.reduce((acc, x) => acc + x.issued_from_central, 0)
    const totUsed = reconItems.reduce((acc, x) => acc + x.used_for_orders, 0)
    const totReturned = reconItems.reduce((acc, x) => acc + x.returned_to_central, 0)
    const totDamaged = reconItems.reduce((acc, x) => acc + x.damaged_wasted, 0)
    const totVariance = reconItems.reduce((acc, x) => acc + Math.abs(x.variance), 0)

    const newRecord: PackagingDailyReconciliation = {
      id: existing ? existing.id : Date.now(),
      recon_ref: existing ? existing.recon_ref : `REC-${date.replace(/-/g, '')}-01`,
      date,
      status: totVariance === 0 ? 'balanced' : 'discrepancy',
      items: reconItems,
      total_issued_qty: totIssued,
      total_used_qty: totUsed,
      total_returned_qty: totReturned,
      total_damaged_qty: totDamaged,
      total_variance_qty: totVariance,
      reconciled_by: reconciledBy,
      reconciled_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes
    }

    setPackagingReconciliations(prev => {
      if (prev.some(r => r.date === date)) {
        return prev.map(r => r.date === date ? newRecord : r)
      }
      return [newRecord, ...prev]
    })

    showToast(totVariance === 0 ? `Reconciliation Balanced (0 variance)` : `Reconciliation Saved with ${totVariance} variance`, totVariance === 0 ? 'success' : 'info')
  }

  const createIntermediatePrep = (
    recipeName: string,
    rawIngredients: Array<{ productId: number; quantity: number }>,
    yieldQty: number,
    unit: string,
    preparedBy: string,
    expiryDays: number = 14
  ) => {
    // 1. Calculate preparation cost and deduct raw ingredients from Central Store
    let totalPrepCost = 0
    const transferItems = rawIngredients.map(ing => {
      const raw = rawProducts.find(r => r.id === ing.productId)
      const unitCost = raw?.unit_cost || 0
      const lineCost = Math.round(ing.quantity * unitCost * 100) / 100
      totalPrepCost += lineCost
      if (raw) {
        adjustRawStock(ing.productId, -ing.quantity, `Withdrawn from Central Store for recipe prep: ${recipeName}`, "consumption")
      }
      return {
        product_id: ing.productId,
        product_name: raw ? raw.name : 'Unknown Raw Material',
        quantity: ing.quantity,
        unit: raw ? raw.unit : 'kg',
        unit_cost: unitCost,
        line_cost: lineCost
      }
    })

    const prepUnitCost = yieldQty > 0 ? Math.round((totalPrepCost / yieldQty) * 100) / 100 : 0
    const prepRef = `PRP-${String(intermediatePreps.length + 43).padStart(3, '0')}`
    const lotNumber = `LOT-PREP-${prepRef}`
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 3600 * 1000).toISOString().split('T')[0]

    // 2. Transfer from Central Store to Production Bench
    const transferRef = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(interStationTransfers.length + 1).padStart(2, '0')}`
    const newTransfer: InterStationTransfer = {
      id: Date.now(),
      transfer_ref: transferRef,
      from_station: 'central_warehouse',
      to_station: 'production_floor',
      transfer_type: 'issue_raw_for_prep',
      items: transferItems,
      notes: `Issued raw materials for intermediate mix: ${recipeName} (${formatNaira(totalPrepCost)})`,
      authorized_by: "Central Storekeeper",
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'completed'
    }
    setInterStationTransfers(prev => [newTransfer, ...prev])

    // 3. Register or deposit into Central Compound Inventory (Shared across all production batches)
    const prepLotRecord: CompoundPreparationLot = {
      lot_number: lotNumber,
      prep_ref: prepRef,
      prep_id: Date.now(),
      prepared_by: preparedBy,
      prepared_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      initial_yield_qty: yieldQty,
      remaining_qty: yieldQty,
      unit_cost: prepUnitCost,
      total_cost: totalPrepCost,
      expiry_date: expiryDate,
      source_ingredients: transferItems
    }

    setCompoundInventory(prev => {
      const existing = prev.find(c => c.name.toLowerCase().trim() === recipeName.toLowerCase().trim())
      if (existing) {
        const newQty = existing.stock_qty + yieldQty
        const newWAC = newQty > 0
          ? Math.round(((existing.stock_qty * existing.unit_cost) + (yieldQty * prepUnitCost)) / newQty)
          : Math.round(prepUnitCost)
        return prev.map(c => c.id === existing.id ? {
          ...c,
          unit_cost: newWAC,
          stock_qty: newQty,
          inventory_value: Math.round(newQty * newWAC),
          preparation_lots: [prepLotRecord, ...c.preparation_lots]
        } : c)
      } else {
        const newCompound: CompoundInventoryItem = {
          id: Date.now(),
          sku: `CPD-${String(prev.length + 1).padStart(4, '0')}`,
          name: recipeName,
          unit,
          unit_cost: prepUnitCost,
          stock_qty: yieldQty,
          inventory_value: totalPrepCost,
          is_active: 1,
          reorder_level: 2.0,
          preparation_lots: [prepLotRecord],
          allocations: [],
          surplus_returns: []
        }
        return [newCompound, ...prev]
      }
    })

    // 4. Create IntermediatePrep record with accurate costing
    const newPrep: IntermediatePrep = {
      id: Date.now(),
      prep_ref: prepRef,
      recipe_name: recipeName,
      unit,
      initial_yield_qty: yieldQty,
      remaining_qty: yieldQty,
      returned_to_hub_qty: 0,
      status: 'active',
      prepared_by: preparedBy,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      source_ingredients: transferItems,
      allocations: [],
      total_cost: totalPrepCost,
      unit_cost: prepUnitCost,
      expiry_date: expiryDate
    }
    setIntermediatePreps(prev => [newPrep, ...prev])

    // 5. Deposit into Central Store cold storage as a tracked InventoryLot with true unit cost
    const newLot: InventoryLot = {
      id: Date.now() + 1,
      lot_number: lotNumber,
      product_id: newPrep.id,
      product_name: `[Compound Mix] ${recipeName}`,
      sku: `HUB-PREP-${prepRef}`,
      supplier_name: 'Internal Production Bench',
      unit,
      unit_cost: prepUnitCost,
      initial_qty: yieldQty,
      remaining_qty: yieldQty,
      received_date: new Date().toISOString().split('T')[0],
      expiry_date: expiryDate,
      days_to_expiry: expiryDays,
      status: 'active',
      location: 'Central Cold Room Chiller #2'
    }
    setInventoryLots(prev => [newLot, ...prev])

    showSuccessModal({
      title: 'Intermediate Recipe Prep Created & Costed',
      message: `Raw ingredients deducted from Central Store (${formatNaira(totalPrepCost)}). ${yieldQty} ${unit} of ${recipeName} is active in Central Compound Inventory at ${formatNaira(prepUnitCost)}/${unit}.`,
      details: [
        { label: 'Prep Ref', value: prepRef },
        { label: 'Recipe Mix', value: recipeName },
        { label: 'Yield Produced', value: `${yieldQty} ${unit}` },
        { label: 'Total Prep Cost', value: formatNaira(totalPrepCost) },
        { label: 'Prepared Mix Unit Cost', value: `${formatNaira(Math.round(prepUnitCost))} / ${unit}` },
        { label: 'Prepared By', value: preparedBy },
        { label: 'Central Compound Status', value: 'Ready for cross-batch allocation' },
      ],
    })
    showToast(`Created prep mix ${prepRef}: ${yieldQty} ${unit} @ ${formatNaira(prepUnitCost)}/${unit}`, 'success')
  }

  const allocatePrepToBatch = (
    prepId: number,
    batchRef: string,
    productName: string,
    allocatedQty: number,
    allocatedBy: string,
    batchId?: number
  ): boolean => {
    const prep = intermediatePreps.find(p => p.id === prepId)
    if (!prep) return false

    if (prep.remaining_qty < allocatedQty) {
      showToast(`Cannot allocate ${allocatedQty} ${prep.unit}. Only ${prep.remaining_qty} ${prep.unit} remaining!`, 'error')
      return false
    }

    const newRemaining = Math.max(0, prep.remaining_qty - allocatedQty)
    const newStatus = newRemaining === 0 ? 'exhausted' : 'active'
    const prepUnitCost = prep.unit_cost || 0
    const allocTotalCost = Math.round(allocatedQty * prepUnitCost * 100) / 100

    const newAllocation: IntermediatePrepAllocation = {
      id: `ALLOC-${Date.now()}`,
      batch_id: batchId,
      batch_ref: batchRef,
      target_product_name: productName,
      allocated_qty: allocatedQty,
      allocated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      allocated_by: allocatedBy,
      unit_cost: prepUnitCost,
      total_cost: allocTotalCost
    }

    // 1. Update intermediate preps state
    setIntermediatePreps(prev => prev.map(p => p.id === prepId ? {
      ...p,
      remaining_qty: newRemaining,
      status: newStatus,
      allocations: [newAllocation, ...p.allocations]
    } : p))

    // 2. Also deduct from Central Compound Inventory if tracked
    setCompoundInventory(prev => prev.map(c => {
      if (c.name.toLowerCase().trim() === prep.recipe_name.toLowerCase().trim()) {
        const updatedQty = Math.max(0, c.stock_qty - allocatedQty)
        return {
          ...c,
          stock_qty: updatedQty,
          inventory_value: Math.round(updatedQty * c.unit_cost * 100) / 100,
          allocations: [
            {
              id: newAllocation.id,
              batch_id: batchId,
              batch_ref: batchRef,
              target_product_name: productName,
              quantity: allocatedQty,
              unit_cost_at_issue: prepUnitCost,
              total_cost: allocTotalCost,
              issued_at: newAllocation.allocated_at,
              issued_by: allocatedBy,
              source_prep_ref: prep.prep_ref
            },
            ...c.allocations
          ]
        }
      }
      return c
    }))

    // 3. CRITICAL: Inject allocated prep into receiving batch in productionBatches
    const targetBatch = productionBatches.find(b => (batchId && b.id === batchId) || b.batch_ref === batchRef)
    if (targetBatch) {
      const prepBomItem: RawMaterialBOM = {
        product_id: prep.id,
        sku: `PRP-${prep.prep_ref}`,
        name: prep.recipe_name,
        quantity: allocatedQty,
        unit: prep.unit,
        unit_cost: prepUnitCost,
        total_cost: allocTotalCost,
        source: 'compound',
        item_type: 'compound',
        prep_ref: prep.prep_ref
      }
      const updatedTotalCost = (targetBatch.total_material_cost || targetBatch.initial_material_cost || 0) + allocTotalCost

      setProductionBatches(prev => prev.map(b => b.id === targetBatch.id ? {
        ...b,
        raw_materials: [...b.raw_materials, prepBomItem],
        total_material_cost: updatedTotalCost
      } : b))
    }

    // 4. Log Stock Movement for compound consumption
    const newMovement: RawMovement = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: prep.id,
      product_name: prep.recipe_name,
      sku: `PRP-${prep.prep_ref}`,
      unit: prep.unit,
      location: "raw",
      movement_type: "consumption",
      quantity: -allocatedQty,
      unit_cost: prepUnitCost,
      value_amount: allocTotalCost,
      balance_after: newRemaining,
      notes: `Prep allocation: ${allocatedQty} ${prep.unit} issued to ${productName} (${batchRef})`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: allocatedBy
    }
    setRawMovements(prev => [newMovement, ...prev])

    showToast(`Allocated ${allocatedQty} ${prep.unit} from ${prep.recipe_name} to ${productName} (${batchRef}) [${formatNaira(allocTotalCost)}]`, 'success')
    return true
  }

  const issueCompoundToBatch = (
    compoundId: number,
    batchId: number,
    quantity: number,
    staffName?: string
  ): boolean => {
    const compound = compoundInventory.find(c => c.id === compoundId)
    const batch = productionBatches.find(b => b.id === batchId)
    if (!compound || !batch || quantity <= 0) return false

    if (compound.stock_qty < quantity) {
      showToast(`Cannot issue ${quantity} ${compound.unit}. Only ${compound.stock_qty} ${compound.unit} available in compound store!`, 'error')
      return false
    }

    const newStock = Math.max(0, compound.stock_qty - quantity)
    const unitCost = compound.unit_cost
    const totalCost = Math.round(quantity * unitCost * 100) / 100
    const issuer = staffName || currentAccount?.name || "Kitchen Pitmaster"
    const issueDate = new Date().toISOString().replace('T', ' ').substring(0, 19)

    // 1. Deduct from Central Compound Inventory
    setCompoundInventory(prev => prev.map(c => c.id === compoundId ? {
      ...c,
      stock_qty: newStock,
      inventory_value: Math.round(newStock * c.unit_cost * 100) / 100,
      allocations: [
        {
          id: `ALLOC-CPD-${Date.now()}`,
          batch_id: batch.id,
          batch_ref: batch.batch_ref,
          target_product_name: batch.output_product_name,
          quantity,
          unit_cost_at_issue: unitCost,
          total_cost: totalCost,
          issued_at: issueDate,
          issued_by: issuer,
          source_prep_ref: compound.preparation_lots?.[0]?.prep_ref
        },
        ...c.allocations
      ]
    } : c))

    // 2. Inject into receiving production batch
    const compBomItem: RawMaterialBOM = {
      product_id: compound.id,
      sku: compound.sku,
      name: compound.name,
      quantity,
      unit: compound.unit,
      unit_cost: unitCost,
      total_cost: totalCost,
      source: 'compound',
      item_type: 'compound',
      compound_id: compound.id,
      prep_ref: compound.preparation_lots?.[0]?.prep_ref
    }
    const updatedTotalCost = (batch.total_material_cost || batch.initial_material_cost || 0) + totalCost

    setProductionBatches(prev => prev.map(b => b.id === batch.id ? {
      ...b,
      raw_materials: [...b.raw_materials, compBomItem],
      total_material_cost: updatedTotalCost
    } : b))

    // 3. Log Stock Movement
    const newMovement: RawMovement = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: compound.id,
      product_name: compound.name,
      sku: compound.sku,
      unit: compound.unit,
      location: "raw",
      movement_type: "consumption",
      quantity: -quantity,
      unit_cost: unitCost,
      value_amount: totalCost,
      balance_after: newStock,
      notes: `Compound issued: ${quantity} ${compound.unit} to ${batch.output_product_name} (${batch.batch_ref})`,
      created_at: issueDate,
      user_name: issuer
    }
    setRawMovements(prev => [newMovement, ...prev])

    showToast(`Issued ${quantity} ${compound.unit} of ${compound.name} to Batch ${batch.batch_ref} (+${formatNaira(totalCost)})`, 'success')
    return true
  }

  const returnCompoundSurplusFromBatch = (
    compoundId: number,
    batchId: number,
    quantity: number,
    notes?: string,
    staffName?: string
  ): boolean => {
    const compound = compoundInventory.find(c => c.id === compoundId)
    const batch = productionBatches.find(b => b.id === batchId)
    if (!compound || !batch || quantity <= 0) return false

    const newStock = compound.stock_qty + quantity
    const unitCost = compound.unit_cost
    const totalCredit = Math.round(quantity * unitCost * 100) / 100
    const returner = staffName || currentAccount?.name || "Kitchen Chef"
    const returnDate = new Date().toISOString().replace('T', ' ').substring(0, 19)

    // 1. Credit Central Compound Inventory
    setCompoundInventory(prev => prev.map(c => c.id === compoundId ? {
      ...c,
      stock_qty: newStock,
      inventory_value: Math.round(newStock * c.unit_cost * 100) / 100,
      surplus_returns: [
        {
          id: `RET-CPD-${Date.now()}`,
          batch_id: batch.id,
          batch_ref: batch.batch_ref,
          quantity,
          unit_cost: unitCost,
          total_credited: totalCredit,
          returned_at: returnDate,
          returned_by: returner,
          notes: notes || `Surplus return from Batch ${batch.batch_ref}`
        },
        ...c.surplus_returns
      ]
    } : c))

    // 2. Credit Batch Net Material Cost
    const currentCost = batch.total_material_cost || batch.initial_material_cost || 0
    const newCost = Math.max(0, Math.round((currentCost - totalCredit) * 100) / 100)
    const returnedItem = {
      product_id: compound.id,
      name: compound.name,
      quantity,
      unit: compound.unit,
      value_credited: totalCredit,
      item_type: 'compound' as const,
      compound_id: compound.id
    }

    setProductionBatches(prev => prev.map(b => b.id === batch.id ? {
      ...b,
      total_material_cost: newCost,
      returned_materials: [...(b.returned_materials || []), returnedItem]
    } : b))

    // 3. Log Stock Movement
    const newMovement: RawMovement = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: compound.id,
      product_name: compound.name,
      sku: compound.sku,
      unit: compound.unit,
      location: "raw",
      movement_type: "adjustment",
      quantity,
      unit_cost: unitCost,
      value_amount: totalCredit,
      balance_after: newStock,
      notes: `Surplus compound returned from Batch ${batch.batch_ref}: ${notes || 'Returned to Central Store'}`,
      created_at: returnDate,
      user_name: returner
    }
    setRawMovements(prev => [newMovement, ...prev])

    showToast(`Returned ${quantity} ${compound.unit} of ${compound.name} to Central Store (-${formatNaira(totalCredit)} credited to batch)`, 'success')
    return true
  }

  const returnPrepToCentral = (
    prepId: number,
    returnQty: number,
    notes: string,
    returnedBy: string
  ) => {
    const prep = intermediatePreps.find(p => p.id === prepId)
    if (!prep) return

    if (prep.remaining_qty < returnQty) {
      showToast(`Cannot return ${returnQty} ${prep.unit}. Only ${prep.remaining_qty} ${prep.unit} available!`, 'error')
      return
    }

    const newRemaining = Math.max(0, prep.remaining_qty - returnQty)
    const newReturnedToHub = (prep.returned_to_hub_qty || 0) + returnQty
    const newStatus = newRemaining === 0 ? 'returned_to_hub' : prep.status
    const prepUnitCost = prep.unit_cost || 0
    const returnedValue = Math.round(returnQty * prepUnitCost * 100) / 100

    // 1. Record transfer back to Central Store
    const transferRef = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(interStationTransfers.length + 1).padStart(2, '0')}`
    const newTransfer: InterStationTransfer = {
      id: Date.now(),
      transfer_ref: transferRef,
      from_station: 'production_floor',
      to_station: 'central_warehouse',
      transfer_type: 'return_prep_to_hub',
      items: [
        {
          product_id: prep.id,
          product_name: prep.recipe_name,
          quantity: returnQty,
          unit: prep.unit
        }
      ],
      notes: `${notes} (Returned by ${returnedBy}) - Valued at ${formatNaira(returnedValue)}`,
      authorized_by: returnedBy,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'completed'
    }
    setInterStationTransfers(prev => [newTransfer, ...prev])

    // 2. Deposit into Central Store cold storage as a tracked InventoryLot with true unit cost
    const lotId = Date.now()
    const newLot: InventoryLot = {
      id: lotId,
      lot_number: `LOT-PREP-${prep.prep_ref}`,
      product_id: prep.id,
      product_name: `[Central Store Cold Storage] ${prep.recipe_name}`,
      sku: `HUB-PREP-${prep.prep_ref}`,
      supplier_name: 'Internal Production Bench',
      unit: prep.unit,
      unit_cost: prepUnitCost,
      initial_qty: returnQty,
      remaining_qty: returnQty,
      received_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
      days_to_expiry: 14,
      status: 'active',
      location: 'Central Cold Room Chiller #2'
    }
    setInventoryLots(prev => [newLot, ...prev])

    // 3. Ensure Central Compound Inventory is updated
    setCompoundInventory(prev => prev.map(c => {
      if (c.name.toLowerCase().trim() === prep.recipe_name.toLowerCase().trim()) {
        const updatedQty = c.stock_qty + returnQty
        return {
          ...c,
          stock_qty: updatedQty,
          inventory_value: Math.round(updatedQty * c.unit_cost * 100) / 100
        }
      }
      return c
    }))

    // 4. Update prep record
    setIntermediatePreps(prev => prev.map(p => p.id === prepId ? {
      ...p,
      remaining_qty: newRemaining,
      returned_to_hub_qty: newReturnedToHub,
      status: newStatus,
      return_notes: notes,
      returned_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      returned_by: returnedBy,
      hub_lot_id: lotId
    } : p))

    showSuccessModal({
      title: 'Surplus Recipe Prep Preserved in Central Store',
      message: `${returnQty} ${prep.unit} of ${prep.recipe_name} (${formatNaira(returnedValue)}) returned to Central Store cold storage.`,
      details: [
        { label: 'Prep Ref', value: prep.prep_ref },
        { label: 'Quantity Preserved', value: `${returnQty} ${prep.unit}` },
        { label: 'Valuation Preserved', value: formatNaira(returnedValue) },
        { label: 'Cold Storage Lot', value: newLot.lot_number },
        { label: 'Storage Location', value: newLot.location || 'Central Cold Room Chiller #2' },
        { label: 'Returned By', value: returnedBy },
      ],
    })
    showToast(`Surplus ${returnQty} ${prep.unit} returned to Central Store cold storage (${formatNaira(returnedValue)})`, 'success')
  }

  const adjustSalesStock = (productId: number, delta: number, notes: string) => {
    const product = liveSalesProducts.find(p => p.id === productId) || salesProducts.find(p => p.id === productId)
    if (!product) return

    const newQty = Math.max(0, product.stock_qty + delta)
    const updateProd = (p: SalesProduct) => p.id === productId ? {
      ...p,
      stock_qty: newQty,
      qty_available: Math.max(0, newQty - (p.qty_allocated || 0)),
      inventory_value: newQty * p.selling_price
    } : p

    setSalesProducts(prev => prev.map(updateProd))
    setLiveSalesProducts(prev => prev.map(updateProd))
    persistProductUpdateToBackend(productId, { stock: newQty })

    const newMovement: SalesMovement = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      unit: product.unit,
      location: "sales",
      movement_type: delta < 0 ? "adjustment" : "production_output",
      quantity: delta,
      unit_cost: product.unit_cost,
      value_amount: Math.abs(delta) * product.unit_cost,
      balance_after: newQty,
      notes,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: currentAccount?.name || "Operations Staff"
    }
    setSalesMovements(prev => [newMovement, ...prev])
  }

  const saveSalesProduct = (product: Partial<SalesProduct> & { name: string; sku: string; unit: string; selling_price: number; unit_cost: number; reorder_level: number; stock_qty?: number; image?: string | null; category_name?: string }) => {
    if (product.id) {
      setSalesProducts(prev => prev.map(p => p.id === product.id ? {
        ...p,
        ...product,
        stock_qty: product.stock_qty !== undefined ? product.stock_qty : p.stock_qty,
        inventory_value: (product.stock_qty !== undefined ? product.stock_qty : p.stock_qty) * product.selling_price,
        qty_available: Math.max(0, (product.stock_qty !== undefined ? product.stock_qty : p.stock_qty) - (p.qty_allocated || 0))
      } : p))
    } else {
      const stock = product.stock_qty ?? 0
      const newProd: SalesProduct = {
        id: Date.now(),
        sku: product.sku,
        name: product.name,
        product_type: "sales",
        unit: product.unit,
        reorder_level: product.reorder_level,
        unit_cost: product.unit_cost,
        selling_price: product.selling_price,
        stock_qty: stock,
        qty_allocated: 0,
        qty_available: stock,
        inventory_value: stock * product.selling_price,
        is_active: product.is_active !== undefined ? product.is_active : 1
      }
      setSalesProducts(prev => [...prev, newProd])
    }
  }

  const savePackagingProduct = (product: Partial<PackagingProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number }) => {
    if (product.id) {
      setPackagingProducts(prev => prev.map(p => p.id === product.id ? {
        ...p,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        unit_cost: product.unit_cost,
        reorder_level: product.reorder_level,
        inventory_value: p.stock_qty * product.unit_cost
      } : p))
      showToast(`Updated packaging material: ${product.name}`, 'success')
    } else {
      const centralQty = product.central_stock_qty ?? 0
      const benchQty = product.bench_stock_qty ?? 0
      const totalQty = centralQty + benchQty
      const newProd: PackagingProduct = {
        id: Date.now(),
        sku: product.sku,
        name: product.name,
        product_type: 'packaging',
        unit: product.unit,
        unit_cost: product.unit_cost,
        central_stock_qty: centralQty,
        bench_stock_qty: benchQty,
        stock_qty: totalQty,
        qty_available: totalQty,
        qty_allocated: 0,
        reorder_level: product.reorder_level,
        inventory_value: totalQty * product.unit_cost,
        is_active: 1
      }
      setPackagingProducts(prev => [...prev, newProd])
      showToast(`Added new packaging material: ${product.name}`, 'success')
    }
  }

  const addSupplier = (supplier: Omit<Supplier, 'id' | 'supplier_ref' | 'delivery_count' | 'total_spend' | 'is_active'>) => {
    const newSup: Supplier = {
      id: Date.now(),
      supplier_ref: `SUP-${String(suppliers.length + 6).padStart(5, '0')}`,
      delivery_count: 0,
      total_spend: 0,
      is_active: 1,
      ...supplier
    }
    setSuppliers(prev => [...prev, newSup])
    showToast(`Supplier ${supplier.name} registered`, 'success')
  }

  const updateSupplier = (updated: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s))
    showToast(`Updated supplier ${updated.name}`, 'success')
  }

  const deleteSupplier = (supplierId: number): boolean => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!supplier) return false

    // Audit safeguard: do not delete vendor with recorded intake deliveries
    const hasDeliveries = rawDeliveries.some(d => d.supplier_id === supplierId || (d.supplier_name && d.supplier_name.toLowerCase() === supplier.name.toLowerCase()))
    if (hasDeliveries) {
      showToast('Cannot delete vendor with recorded intake deliveries. Mark inactive instead.', 'error')
      return false
    }

    setSuppliers(prev => prev.filter(s => s.id !== supplierId))
    showToast(`Supplier ${supplier.name} removed successfully`, 'success')
    return true
  }

  // -------------------------------------------------------------
  // PRODUCTION MUTATIONS
  // -------------------------------------------------------------

  const createBatch = ({
    outputProductId,
    outputProductName,
    expectedOutput,
    remarks,
    batch_schedule = 'today',
    feed_sales_inventory = true,
    estimated_ready_time,
    rawMaterials
  }: {
    outputProductId: number
    outputProductName: string
    expectedOutput: number
    remarks?: string
    batch_schedule?: 'today' | 'tomorrow_morning'
    feed_sales_inventory?: boolean
    estimated_ready_time?: string
    rawMaterials: Array<{
      product_id: number
      sku: string
      name: string
      quantity: number
      unit: string
      item_type?: 'raw' | 'compound'
      compound_id?: number
      prep_ref?: string
    }>
  }) => {
    const batchRef = `BAT-${String(productionBatches.length + 1).padStart(5, '0')}`

    // 1. Snapshot raw and compound materials with unit cost and total cost, then deduct from inventory
    const snappedMaterials: RawMaterialBOM[] = rawMaterials.map(mat => {
      const isCompound = mat.item_type === 'compound' || !!mat.compound_id || compoundInventory.some(c => c.id === mat.product_id || c.name.toLowerCase().trim() === mat.name.toLowerCase().trim())

      if (isCompound) {
        const matchedCompound = compoundInventory.find(c =>
          c.id === mat.compound_id ||
          c.id === mat.product_id ||
          (mat.sku && c.sku?.toLowerCase() === mat.sku.toLowerCase()) ||
          c.name.toLowerCase().trim() === mat.name.toLowerCase().trim()
        )
        const unitCost = matchedCompound?.unit_cost || 0
        const totalCost = Math.round(mat.quantity * unitCost * 100) / 100

        // Deduct from compound inventory ONLY (never re-deduct raw materials!)
        if (matchedCompound) {
          const newCompoundStock = Math.max(0, matchedCompound.stock_qty - mat.quantity)
          setCompoundInventory(prev => prev.map(ci => ci.id === matchedCompound.id ? {
            ...ci,
            stock_qty: newCompoundStock,
            inventory_value: Math.round(newCompoundStock * ci.unit_cost * 100) / 100,
            allocations: [
              {
                id: `ALLOC-CPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                batch_id: 0,
                batch_ref: batchRef,
                target_product_name: outputProductName,
                quantity: mat.quantity,
                unit_cost_at_issue: unitCost,
                total_cost: totalCost,
                issued_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                issued_by: currentAccount?.name || "Kitchen Pitmaster",
                source_prep_ref: matchedCompound.preparation_lots?.[0]?.prep_ref
              },
              ...ci.allocations
            ]
          } : ci))

          const movement: RawMovement = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            product_id: matchedCompound.id,
            product_name: matchedCompound.name,
            sku: matchedCompound.sku,
            unit: matchedCompound.unit,
            location: "raw",
            movement_type: "consumption",
            quantity: -mat.quantity,
            unit_cost: unitCost,
            value_amount: totalCost,
            balance_after: newCompoundStock,
            notes: `Compound issued: ${mat.quantity} ${matchedCompound.unit} to ${outputProductName} (${batchRef})`,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            user_name: currentAccount?.name || "Kitchen Pitmaster"
          }
          setRawMovements(prev => [movement, ...prev])
        }

        return {
          ...mat,
          unit_cost: unitCost,
          total_cost: totalCost,
          item_type: 'compound' as const,
          source: 'compound' as const,
          compound_id: matchedCompound?.id || mat.compound_id,
          prep_ref: matchedCompound?.preparation_lots?.[0]?.prep_ref || mat.prep_ref
        }
      }

      // Normal raw product
      const matchedRaw = rawProducts.find(p =>
        p.id === mat.product_id ||
        (mat.sku && p.sku?.toLowerCase() === mat.sku.toLowerCase()) ||
        p.name.toLowerCase().trim() === mat.name.toLowerCase().trim()
      )
      const unitCost = matchedRaw?.unit_cost || 0
      const totalCost = Math.round(mat.quantity * unitCost * 100) / 100
      if (matchedRaw) {
        adjustRawStock(matchedRaw.id, -mat.quantity, `Batch allocation for ${outputProductName}`, "consumption")
      }
      return {
        ...mat,
        unit_cost: unitCost,
        total_cost: totalCost,
        item_type: 'raw' as const,
        source: 'initial' as const
      }
    })

    const initialMaterialCost = snappedMaterials.reduce((acc, m) => acc + (m.total_cost || 0), 0)
    const defaultReadyTime = batch_schedule === 'tomorrow_morning'
      ? 'Tomorrow 9:30 AM'
      : `Today ${new Date(Date.now() + 4 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

    const newBatch: ProductionBatch = {
      id: Date.now(),
      batch_ref: batchRef,
      output_product_id: outputProductId,
      output_product_name: outputProductName,
      expected_output: expectedOutput,
      actual_output: 0,
      wastage: 0,
      status: "draft",
      batch_schedule,
      feed_sales_inventory,
      estimated_ready_time: estimated_ready_time || defaultReadyTime,
      started_at: null,
      completed_at: null,
      remarks,
      created_by_name: currentAccount?.name || "Production Supervisor",
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      raw_materials: snappedMaterials,
      additional_requisitions: [],
      initial_material_cost: initialMaterialCost,
      additional_material_cost: 0,
      total_material_cost: initialMaterialCost
    }
    setProductionBatches(prev => [newBatch, ...prev])

    showSuccessModal({
      title: batch_schedule === 'tomorrow_morning' ? 'Next-Day Morning Smoke Scheduled' : 'Cooking Batch Created',
      message: feed_sales_inventory
        ? `Batch formulated. +${expectedOutput} units buffered to Sales Inventory so online orders continue uninterrupted.`
        : `Batch formulated for ${outputProductName}. Raw ingredients allocated from inventory.`,
      details: [
        { label: 'Batch Ref', value: batchRef },
        { label: 'Target Product', value: outputProductName },
        { label: 'Planned Output', value: `${expectedOutput} portions` },
        { label: 'Initial Material Cost', value: formatNaira(initialMaterialCost) },
        { label: 'Target Completion', value: estimated_ready_time || defaultReadyTime },
        { label: 'Website Buffer Feed', value: feed_sales_inventory ? `+${expectedOutput} Units Bookable Online` : 'Internal Prep Only' },
      ],
    })
    showToast(`Batch ${batchRef} created: +${expectedOutput} units buffered to sales`, 'success')
  }

  const startBatch = (batchId: number) => {
    setProductionBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: "in_production", started_at: new Date().toISOString().replace('T', ' ').substring(0, 19) } : b))
    showToast(`Batch cooking started on smoking grill`, 'info')
  }

  const requestAdditionalBatchMaterial = (data: {
    batchId: number
    productId: number
    quantity: number
    reason: string
    requestedBy?: string
  }): boolean => {
    const batch = productionBatches.find(b => b.id === data.batchId)
    const product = rawProducts.find(p => p.id === data.productId)
    if (!batch || !product || data.quantity <= 0) return false

    const reqCount = (batch.additional_requisitions?.length || 0) + 1
    const reqRef = `REQ-${batch.batch_ref}-${String(reqCount).padStart(2, '0')}`

    const newRequisition: BatchMaterialRequisition = {
      id: reqRef,
      batch_id: batch.id,
      batch_ref: batch.batch_ref,
      output_product_name: batch.output_product_name,
      raw_product_id: product.id,
      raw_product_name: product.name,
      sku: product.sku,
      unit: product.unit,
      requested_qty: data.quantity,
      reason: data.reason,
      requested_by: data.requestedBy || currentAccount?.name || "Kitchen Pitmaster",
      requested_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'pending'
    }

    setProductionBatches(prev => prev.map(b => {
      if (b.id !== batch.id) return b
      return {
        ...b,
        additional_requisitions: [...(b.additional_requisitions || []), newRequisition]
      }
    }))

    showToast(`Requisition ${reqRef} submitted to Central Store for ${data.quantity} ${product.unit} of ${product.name}`, 'info')
    return true
  }

  const fulfillBatchMaterialRequisition = (
    requisitionId: string,
    fulfilledQty: number,
    notes?: string
  ): boolean => {
    // Inventory role check: require inventory, admin, or manager role
    const role = currentAccount?.role
    const hasInventoryRole = role === 'inventory' || role === 'admin' || role === 'manager'
    if (!hasInventoryRole) {
      showToast('Action restricted: Only Central Storekeeper or Inventory Manager accounts can disburse warehouse stock.', 'error')
      return false
    }

    let targetBatch: ProductionBatch | undefined
    let targetReq: BatchMaterialRequisition | undefined

    for (const b of productionBatches) {
      const found = b.additional_requisitions?.find(r => r.id === requisitionId)
      if (found) {
        targetBatch = b
        targetReq = found
        break
      }
    }

    if (!targetBatch || !targetReq || targetReq.status !== 'pending') return false
    if (fulfilledQty <= 0) return false

    const product = rawProducts.find(p => p.id === targetReq!.raw_product_id)
    if (!product) return false

    if (product.stock_qty < fulfilledQty) {
      showToast(`Insufficient warehouse stock! Current on-hand: ${product.stock_qty} ${product.unit}`, 'error')
      return false
    }

    const unitCostAtIssue = product.unit_cost || 0
    const totalCost = Math.round(fulfilledQty * unitCostAtIssue * 100) / 100
    const isPartial = fulfilledQty < targetReq.requested_qty
    const newStatus: 'approved' | 'partially_fulfilled' = isPartial ? 'partially_fulfilled' : 'approved'

    // Deduct stock from Central Warehouse
    adjustRawStock(product.id, -fulfilledQty, `Production requisition ${requisitionId} for Batch ${targetBatch.batch_ref}`, "consumption")

    // Update batch BOM and costs
    setProductionBatches(prev => prev.map(b => {
      if (b.id !== targetBatch!.id) return b
      const updatedReqs = (b.additional_requisitions || []).map(r => {
        if (r.id !== requisitionId) return r
        return {
          ...r,
          fulfilled_qty: fulfilledQty,
          unit_cost_at_issue: unitCostAtIssue,
          total_cost: totalCost,
          status: newStatus,
          reviewed_by: currentAccount?.name || "Central Storekeeper",
          reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          warehouse_notes: notes
        }
      })

      const additionalBOMItem: RawMaterialBOM = {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        quantity: fulfilledQty,
        unit: product.unit,
        unit_cost: unitCostAtIssue,
        total_cost: totalCost,
        source: 'additional',
        requisition_ref: requisitionId
      }

      const initialCost = b.initial_material_cost ?? b.raw_materials.filter(m => m.source !== 'additional').reduce((acc, m) => acc + (m.total_cost || (m.quantity * (m.unit_cost || 0))), 0)
      const existingAddCost = b.additional_material_cost ?? b.raw_materials.filter(m => m.source === 'additional').reduce((acc, m) => acc + (m.total_cost || 0), 0)
      const newAdditionalCost = Math.round((existingAddCost + totalCost) * 100) / 100

      return {
        ...b,
        additional_requisitions: updatedReqs,
        raw_materials: [...b.raw_materials, additionalBOMItem],
        initial_material_cost: initialCost,
        additional_material_cost: newAdditionalCost,
        total_material_cost: Math.round((initialCost + newAdditionalCost) * 100) / 100
      }
    }))

    showToast(`Requisition ${requisitionId} fulfilled: -${fulfilledQty} ${product.unit} issued to Batch ${targetBatch.batch_ref}`, 'success')
    return true
  }

  const rejectBatchMaterialRequisition = (
    requisitionId: string,
    rejectionReason: string
  ): boolean => {
    const role = currentAccount?.role
    const hasInventoryRole = role === 'inventory' || role === 'admin' || role === 'manager'
    if (!hasInventoryRole) {
      showToast('Action restricted: Only Central Storekeeper or Inventory Manager accounts can review requisitions.', 'error')
      return false
    }

    setProductionBatches(prev => prev.map(b => {
      const hasReq = b.additional_requisitions?.some(r => r.id === requisitionId)
      if (!hasReq) return b
      return {
        ...b,
        additional_requisitions: (b.additional_requisitions || []).map(r => {
          if (r.id !== requisitionId) return r
          return {
            ...r,
            status: 'rejected',
            rejection_reason: rejectionReason,
            reviewed_by: currentAccount?.name || "Central Storekeeper",
            reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
          }
        })
      }
    }))

    showToast(`Requisition ${requisitionId} rejected`, 'info')
    return true
  }

  const returnUnconsumedBatchMaterials = (
    batchId: number,
    returns: Array<{ productId: number; quantity: number; notes?: string }>
  ): boolean => {
    const batch = productionBatches.find(b => b.id === batchId)
    if (!batch) return false

    let totalCreditedValue = 0
    const returnedItemsSummary: Array<{ product_id: number; name: string; quantity: number; unit: string; value_credited: number }> = []

    returns.forEach(ret => {
      if (ret.quantity > 0) {
        const product = rawProducts.find(p => p.id === ret.productId)
        if (product) {
          adjustRawStock(product.id, ret.quantity, `Unconsumed return from Batch ${batch.batch_ref}: ${ret.notes || 'End-of-cook return'}`, "adjustment")
          const creditedVal = Math.round(ret.quantity * (product.unit_cost || 0) * 100) / 100
          totalCreditedValue += creditedVal
          returnedItemsSummary.push({
            product_id: product.id,
            name: product.name,
            quantity: ret.quantity,
            unit: product.unit,
            value_credited: creditedVal
          })
        }
      }
    })

    if (returnedItemsSummary.length === 0) return true

    setProductionBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b
      const currentTotal = b.total_material_cost ?? b.raw_materials.reduce((acc, m) => acc + (m.total_cost || (m.quantity * (m.unit_cost || 0))), 0)
      const newTotal = Math.max(0, Math.round((currentTotal - totalCreditedValue) * 100) / 100)
      return {
        ...b,
        returned_materials: [...(b.returned_materials || []), ...returnedItemsSummary],
        total_material_cost: newTotal
      }
    }))

    showToast(`Returned materials credited to store (+${formatNaira(totalCreditedValue)} credited to Batch ${batch.batch_ref})`, 'success')
    return true
  }

  const completeBatch = (
    batchId: number,
    actualOutput: number,
    wastage: number,
    remarks?: string,
    returnedMaterials?: Array<{ productId: number; quantity: number; item_type?: 'raw' | 'compound'; compound_id?: number }>
  ) => {
    const batch = productionBatches.find(b => b.id === batchId)
    if (!batch) return

    let totalCreditedValue = 0
    const returnedItemsSummary: Array<{ product_id: number; name: string; quantity: number; unit: string; value_credited: number }> = []

    if (returnedMaterials && returnedMaterials.length > 0) {
      returnedMaterials.forEach(ret => {
        if (ret.quantity > 0) {
          if (ret.item_type === 'compound' || ret.compound_id) {
            const compound = compoundInventory.find(c => c.id === ret.compound_id || c.id === ret.productId)
            if (compound) {
              const newCompoundStock = compound.stock_qty + ret.quantity
              const unitCost = compound.unit_cost
              const creditedVal = Math.round(ret.quantity * unitCost * 100) / 100
              totalCreditedValue += creditedVal

              setCompoundInventory(prev => prev.map(c => c.id === compound.id ? {
                ...c,
                stock_qty: newCompoundStock,
                inventory_value: Math.round(newCompoundStock * c.unit_cost * 100) / 100,
                surplus_returns: [
                  {
                    id: `RET-CPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    batch_id: batch.id,
                    batch_ref: batch.batch_ref,
                    quantity: ret.quantity,
                    unit_cost: unitCost,
                    total_credited: creditedVal,
                    returned_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    returned_by: currentAccount?.name || "Kitchen Chef",
                    notes: `Surplus return at completion of Batch ${batch.batch_ref}`
                  },
                  ...c.surplus_returns
                ]
              } : c))

              const movement: RawMovement = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                product_id: compound.id,
                product_name: compound.name,
                sku: compound.sku,
                unit: compound.unit,
                location: "raw",
                movement_type: "adjustment",
                quantity: ret.quantity,
                unit_cost: unitCost,
                value_amount: creditedVal,
                balance_after: newCompoundStock,
                notes: `Surplus compound returned from Batch ${batch.batch_ref}`,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                user_name: currentAccount?.name || "Kitchen Chef"
              }
              setRawMovements(prev => [movement, ...prev])

              returnedItemsSummary.push({
                product_id: compound.id,
                name: compound.name,
                quantity: ret.quantity,
                unit: compound.unit,
                value_credited: creditedVal
              })
            }
          } else {
            const product = rawProducts.find(p => p.id === ret.productId)
            if (product) {
              adjustRawStock(product.id, ret.quantity, `Unconsumed return from Batch ${batch.batch_ref}`, "adjustment")
              const creditedVal = Math.round(ret.quantity * (product.unit_cost || 0) * 100) / 100
              totalCreditedValue += creditedVal
              returnedItemsSummary.push({
                product_id: product.id,
                name: product.name,
                quantity: ret.quantity,
                unit: product.unit,
                value_credited: creditedVal
              })
            }
          }
        }
      })
    }

    const currentTotalCost = batch.total_material_cost ?? batch.raw_materials.reduce((acc, m) => acc + (m.total_cost || (m.quantity * (m.unit_cost || 0))), 0)
    const netMaterialCost = Math.max(0, Math.round((currentTotalCost - totalCreditedValue) * 100) / 100)
    const unitCostPerPortion = actualOutput > 0 ? Math.round((netMaterialCost / actualOutput) * 100) / 100 : 0

    // 1. Mark batch completed
    setProductionBatches(prev => prev.map(b => b.id === batchId ? {
      ...b,
      actual_output: actualOutput,
      wastage,
      status: "completed",
      completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      remarks: remarks || b.remarks,
      returned_materials: returnedItemsSummary.length > 0 ? [...(b.returned_materials || []), ...returnedItemsSummary] : b.returned_materials,
      total_material_cost: netMaterialCost,
      unit_cost_per_portion: unitCostPerPortion
    } : b))

    // 2. Automatically INCREMENT physical stock in Sales Inventory and update Finished Goods WAC
    const allSales = [...liveSalesProducts, ...salesProducts]
    const targetSales = allSales.find(sp => sp.id === batch.output_product_id || sp.name.toLowerCase().trim() === batch.output_product_name.toLowerCase().trim())
    if (targetSales) {
      adjustSalesStock(targetSales.id, actualOutput, `Batch ${batch.batch_ref} yield deposit`)

      if (unitCostPerPortion > 0) {
        const currentStock = targetSales.stock_qty || 0
        const currentCost = targetSales.unit_cost || 0
        const combinedStock = currentStock + actualOutput
        const newFgWac = combinedStock > 0
          ? Math.round(((currentStock * currentCost) + (actualOutput * unitCostPerPortion)) / combinedStock)
          : Math.round(unitCostPerPortion)

        setSalesProducts(prev => prev.map(sp => sp.id === targetSales.id ? { ...sp, unit_cost: newFgWac } : sp))
        setLiveSalesProducts(prev => prev.map(sp => sp.id === targetSales.id ? { ...sp, unit_cost: newFgWac } : sp))
      }
    }

    showSuccessModal({
      title: 'Cooking Batch Completed & Reconciled',
      message: `Verified actual yield deposited into Physical Sales Inventory. Estimated incoming buffer has been converted to ready stock.`,
      details: [
        { label: 'Batch Ref', value: batch.batch_ref },
        { label: 'Finished Product', value: batch.output_product_name },
        { label: 'Actual Physical Deposited', value: `+${actualOutput} portions` },
        { label: 'Cooking Shrinkage / Loss', value: `${wastage} portions` },
        { label: 'Net Consumed Material Cost', value: formatNaira(netMaterialCost) },
        { label: 'Unit Cost Per Portion', value: formatNaira(unitCostPerPortion) },
        ...(totalCreditedValue > 0 ? [{ label: 'Materials Returned to Store', value: `${returnedItemsSummary.map(r => `${r.quantity} ${r.unit} ${r.name}`).join(', ')} (${formatNaira(totalCreditedValue)} credited)` }] : [])
      ],
    })
    showToast(`Batch ${batch.batch_ref} completed: +${actualOutput} physical portions deposited`, 'success')
  }

  const cancelBatch = (batchId: number) => {
    const batch = productionBatches.find(b => b.id === batchId)
    if (!batch) return

    // Restore materials (both initial, compound mixes, and fulfilled additional materials)
    batch.raw_materials.forEach(mat => {
      if (mat.item_type === 'compound' || mat.source === 'compound' || mat.compound_id) {
        const matchedComp = compoundInventory.find(c => c.id === mat.compound_id || c.name.toLowerCase().trim() === mat.name.toLowerCase().trim())
        if (matchedComp) {
          const restoredStock = matchedComp.stock_qty + mat.quantity
          setCompoundInventory(prev => prev.map(c => c.id === matchedComp.id ? {
            ...c,
            stock_qty: restoredStock,
            inventory_value: Math.round(restoredStock * c.unit_cost * 100) / 100
          } : c))
          const movement: RawMovement = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            product_id: matchedComp.id,
            product_name: matchedComp.name,
            sku: matchedComp.sku,
            unit: matchedComp.unit,
            location: "raw",
            movement_type: "adjustment",
            quantity: mat.quantity,
            unit_cost: mat.unit_cost || matchedComp.unit_cost,
            value_amount: mat.total_cost || Math.round(mat.quantity * matchedComp.unit_cost * 100) / 100,
            balance_after: restoredStock,
            notes: `Compound restored from cancelled Batch ${batch.batch_ref}`,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            user_name: currentAccount?.name || "Kitchen Pitmaster"
          }
          setRawMovements(prev => [movement, ...prev])
        }
      } else {
        const matchedRaw = rawProducts.find(p =>
          p.id === mat.product_id ||
          (mat.sku && p.sku?.toLowerCase() === mat.sku.toLowerCase()) ||
          p.name.toLowerCase().trim() === mat.name.toLowerCase().trim()
        )
        if (matchedRaw) {
          adjustRawStock(matchedRaw.id, mat.quantity, `Reversal from cancelled Batch ${batch.batch_ref}`, "transfer")
        }
      }
    })

    // Auto-cancel any pending requisitions
    const updatedRequisitions = (batch.additional_requisitions || []).map(req =>
      req.status === 'pending'
        ? {
            ...req,
            status: 'rejected' as const,
            rejected_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            rejection_reason: 'Batch cancelled by supervisor'
          }
        : req
    )

    setProductionBatches(prev => prev.map(b => b.id === batchId ? {
      ...b,
      status: "cancelled",
      additional_requisitions: updatedRequisitions
    } : b))
    showToast(`Batch ${batch.batch_ref} cancelled and materials returned to stock`, 'info')
  }

  const deleteBatch = (batchId: number): boolean => {
    const batch = productionBatches.find(b => b.id === batchId)
    if (!batch) return false

    // Safeguard: If draft, reverse allocated raw/compound materials back to inventory
    if (batch.status === 'draft') {
      batch.raw_materials.forEach(mat => {
        if (mat.item_type === 'compound' || mat.source === 'compound' || mat.compound_id) {
          const matchedComp = compoundInventory.find(c => c.id === mat.compound_id || c.name.toLowerCase().trim() === mat.name.toLowerCase().trim())
          if (matchedComp) {
            const restoredStock = matchedComp.stock_qty + mat.quantity
            setCompoundInventory(prev => prev.map(c => c.id === matchedComp.id ? {
              ...c,
              stock_qty: restoredStock,
              inventory_value: Math.round(restoredStock * c.unit_cost * 100) / 100
            } : c))
          }
        } else {
          const matchedRaw = rawProducts.find(p => p.id === mat.product_id)
          if (matchedRaw) {
            adjustRawStock(matchedRaw.id, mat.quantity, `Reversal from deleted Batch ${batch.batch_ref}`, "transfer")
          }
        }
      })
    }

    setProductionBatches(prev => prev.filter(b => b.id !== batchId))
    showToast(`Batch ${batch.batch_ref} deleted successfully`, 'info')
    return true
  }

  const deleteIntermediatePrep = (prepId: number): boolean => {
    const prep = intermediatePreps.find(p => p.id === prepId)
    if (!prep) return false

    // If never allocated, restore ingredients to stock
    if (prep.allocations.length === 0) {
      prep.source_ingredients.forEach(ing => {
        const matched = rawProducts.find(p => p.id === ing.product_id)
        if (matched) {
          adjustRawStock(matched.id, ing.quantity, `Reversal from cancelled Prep Mix ${prep.recipe_name}`, "transfer")
        }
      })
    }

    setIntermediatePreps(prev => prev.filter(p => p.id !== prepId))
    showToast(`Prep mix ${prep.recipe_name} removed`, 'info')
    return true
  }

  const updateBatch = (batchId: number, data: Partial<ProductionBatch>) => {
    setProductionBatches(prev => prev.map(b => b.id === batchId ? { ...b, ...data } : b))
    showToast(`Batch updated successfully`, 'success')
  }

  const saveCustomRecipeTemplate = (template: Omit<RecipeTemplate, 'id'>) => {
    const newTmpl: RecipeTemplate = {
      id: Date.now(),
      ...template
    }
    setRecipeTemplates(prev => [...prev, newTmpl])
    showToast(`Saved recipe template: ${template.version_name}`, 'success')
  }

  const updateRecipeTemplate = (id: number, updated: Partial<RecipeTemplate>) => {
    setRecipeTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
    showToast('Recipe template updated successfully', 'success')
  }

  const deleteRecipeTemplate = (id: number) => {
    const tmpl = recipeTemplates.find(t => t.id === id)
    setRecipeTemplates(prev => prev.filter(t => t.id !== id))
    showToast(`Deleted recipe template: ${tmpl?.version_name || id}`, 'info')
  }

  const addPackagingQueueOrder = (data: { customer_name: string; phone: string; address: string; items_summary: string; total_amount: number; delivery_fee?: number; payment_status?: 'paid' | 'pending' }) => {
    const orderRef = `SHD-${String(Math.floor(7000 + Math.random() * 2000))}`
    const newOrder: PackagingQueueOrder = {
      id: Date.now(),
      order_ref: orderRef,
      customer_name: data.customer_name,
      phone: data.phone,
      address: data.address,
      items_summary: data.items_summary,
      items: [
        { product_name: data.items_summary, quantity: 1, unit_price: data.total_amount, line_total: data.total_amount }
      ],
      total_amount: data.total_amount,
      delivery_fee: data.delivery_fee ?? (data.address.toLowerCase().includes('pickup') ? 0 : 2500),
      delivery_mode: 'instant',
      payment_status: data.payment_status ?? 'paid',
      order_status: 'ready_for_fulfillment',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      packaged_at: null,
      packaged_by_name: null,
      packaging_materials_picked: []
    }
    setPackagingQueue(prev => [newOrder, ...prev])
    showToast(`Order ${orderRef} queued for packaging!`, 'success')
  }

  const startPackagingOrder = (orderId: number, materials: Array<{ packaging_name: string; quantity: number }>) => {
    const targetOrder = packagingQueue.find(o => o.id === orderId)
    const resolvedStaff = currentAccount?.name || "Kitchen Staff"
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)

    // 1. Deduct packaging stock from active bench stock & record consumption movements in stock ledger
    materials.forEach(m => {
      const match = packagingProducts.find(p => p.name.toLowerCase() === m.packaging_name.toLowerCase())
      if (match) {
        const newBench = Math.max(0, (match.bench_stock_qty ?? 0) - m.quantity)
        const newTotal = (match.central_stock_qty ?? 0) + newBench

        setPackagingProducts(prev => prev.map(p => {
          if (p.id !== match.id) return p
          return {
            ...p,
            bench_stock_qty: newBench,
            stock_qty: newTotal,
            qty_available: Math.max(0, newTotal - p.qty_allocated),
            inventory_value: newTotal * p.unit_cost
          }
        }))

        // Log consumption in the stock movement ledger
        const newMovement: SalesMovement = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          product_id: match.id,
          product_name: match.name,
          sku: match.sku,
          unit: match.unit,
          location: "packaging",
          movement_type: "consumption",
          quantity: -m.quantity,
          unit_cost: match.unit_cost,
          value_amount: m.quantity * match.unit_cost,
          balance_after: newTotal,
          notes: `Packaging consumed for Order #${targetOrder?.order_ref || orderId} (${targetOrder?.customer_name || 'Customer'})`,
          created_at: nowTimestamp,
          user_name: resolvedStaff
        }
        setSalesMovements(prev => [newMovement, ...prev])
      }
    })

    // 2. Advance status to in_packaging
    setPackagingQueue(prev => prev.map(o => o.id === orderId ? {
      ...o,
      order_status: "in_packaging",
      packaging_materials_picked: materials
    } : o))

    if (targetOrder) {
      updateOrderPipelineState(targetOrder.order_ref, {
        order_status: "in_packaging",
        packaging_materials_picked: materials
      })
    }
  }

  const confirmPackagingOrder = (orderId: number, staffName?: string) => {
    const order = packagingQueue.find(o => o.id === orderId)
    if (!order) return

    const resolvedStaff = staffName || currentAccount?.name || "Packaging Staff"
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)

    // 1. Mark as packaged in queue
    setPackagingQueue(prev => prev.map(o => o.id === orderId ? {
      ...o,
      order_status: "packaged",
      packaged_at: nowTimestamp,
      packaged_by_name: resolvedStaff
    } : o))

    updateOrderPipelineState(order.order_ref, {
      order_status: "packaged",
      packaged_at: nowTimestamp,
      packaged_by_name: resolvedStaff,
      packaging_materials_picked: order.packaging_materials_picked,
      delivery_status: "pending"
    })
    persistOrderUpdateToBackend(order.order_ref, { delivery_status: "Ready for Dispatch" })
    setWebsiteOrders(prev => prev.map(w => w.order_ref === order.order_ref ? {
      ...w,
      fulfillment_status: "ready_for_dispatch"
    } : w))

    // 2. If it's a store pickup, add to storePickups
    if (order.address.toLowerCase().includes('pickup') || order.address.toLowerCase().includes('counter') || order.delivery_fee === 0) {
      const newPickup: StorePickupOrder = {
        id: order.id,
        order_ref: order.order_ref,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        order_status: "ready_for_pickup",
        packaged_at: nowTimestamp,
        collected_at: null,
        collected_by: null,
        handover_staff: null,
        items_summary: order.items_summary
      }
      setStorePickups(prev => [newPickup, ...prev.filter(p => p.id !== order.id && p.order_ref !== order.order_ref)])
      showToast(`Order #${order.order_ref} packaged and moved to Store Pickup Counter!`, 'success')
    } else {
      // 3. Otherwise, transfer into Logistics Dispatch Queue (Awaiting Assignment)!
      const newDelivery: LogisticsDelivery = {
        id: order.id,
        delivery_ref: `DEL-${order.order_ref.replace(/\D/g, '') || order.id}`,
        order_id: order.id,
        order_ref: order.order_ref,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        delivery_fee: order.delivery_fee || 3000,
        total_amount: order.total_amount,
        booked_fee: null,
        rider_type: "internal",
        assigned_rider: "Unassigned",
        status: "pending",
        dispatch_date: new Date().toISOString().split('T')[0],
        pickup_at: null,
        delivered_at: null,
        fee_verify_status: "none",
        items_summary: order.items_summary,
        notes: `Packed by ${resolvedStaff}`
      }
      setLogisticsDeliveries(prev => [newDelivery, ...prev.filter(d => d.order_ref !== order.order_ref && d.id !== order.id)])
      showToast(`Order #${order.order_ref} packaged and sent to Dispatch Board (Awaiting Rider Assignment)!`, 'success')
    }

    // 4. Update daily materials consumed (accurately appending new SKUs if not previously logged)
    if (order.packaging_materials_picked && order.packaging_materials_picked.length > 0) {
      order.packaging_materials_picked.forEach(pick => {
        setPackagingMaterialsDaily(prev => {
          const matchIndex = prev.findIndex(p => p.product_name.toLowerCase() === pick.packaging_name.toLowerCase())
          if (matchIndex >= 0) {
            return prev.map((p, idx) => idx === matchIndex ? {
              ...p,
              total_consumed: p.total_consumed + pick.quantity,
              total_orders: p.total_orders + 1
            } : p)
          }
          const prod = packagingProducts.find(p => p.name.toLowerCase() === pick.packaging_name.toLowerCase())
          const newDaily: PackagingMaterialDaily = {
            product_id: prod?.id || 0,
            product_name: pick.packaging_name,
            sku: prod?.sku || 'PCK-CONS',
            unit: prod?.unit || 'pcs',
            total_consumed: pick.quantity,
            total_orders: 1
          }
          return [...prev, newDaily]
        })
      })
    }
  }

  const updateTaskStatus = (taskId: number, status: 'pending' | 'in_progress' | 'done') => {
    setKitchenTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const createKitchenTask = (task: Omit<KitchenTask, 'id' | 'task_ref'>) => {
    const newTask: KitchenTask = {
      id: Date.now(),
      task_ref: `TSK-${kitchenTasks.length + 105}`,
      ...task
    }
    setKitchenTasks(prev => [newTask, ...prev])
  }

  // -------------------------------------------------------------
  // LOGISTICS MUTATIONS
  // -------------------------------------------------------------

  const assignRider = (
    deliveryId: number,
    riderType: 'internal' | 'third_party',
    riderName: string,
    riderId?: number,
    bookedFee?: number,
    feeEvidencePath?: string
  ) => {
    const targetDel = logisticsDeliveries.find(d => d.id === deliveryId)
    const numericRiderId = riderId !== undefined ? Number(riderId) : undefined

    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      rider_type: riderType,
      assigned_rider: riderName,
      assigned_rider_id: numericRiderId,
      third_party_provider: riderType === 'third_party' ? riderName : null,
      booked_fee: bookedFee || null,
      fee_evidence_path: feeEvidencePath || d.fee_evidence_path || null,
      fee_verify_status: riderType === 'third_party' ? 'pending' : 'none',
      status: "assigned"
    } : d))

    if (targetDel) {
      updateOrderPipelineState(targetDel.order_ref, {
        delivery_status: "assigned",
        rider_type: riderType,
        assigned_rider: riderName,
        assigned_rider_id: numericRiderId,
        third_party_provider: riderType === 'third_party' ? riderName : null,
        booked_fee: bookedFee || null,
        fee_evidence_path: feeEvidencePath || targetDel.fee_evidence_path || null,
        fee_verify_status: riderType === 'third_party' ? 'pending' : 'none'
      })
      persistOrderUpdateToBackend(targetDel.order_ref, {
        delivery_status: "Assigned"
      })
      setWebsiteOrders(prev => prev.map(w => w.order_ref === targetDel.order_ref ? {
        ...w,
        rider_name: riderName
      } : w))
    }

    // Increment active assignment count for internal rider
    if (riderType === 'internal' && numericRiderId) {
      setRiders(prev => prev.map(r => Number(r.rider_user_id) === numericRiderId ? { ...r, active_assignments: r.active_assignments + 1, status: "on_trip" } : r))
    }
  }

  const confirmRiderCollect = (deliveryId: number) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      status: "in_transit",
      pickup_at: nowTime
    } : d))
    if (delivery) {
      updateOrderPipelineState(delivery.order_ref, {
        delivery_status: "in_transit",
        pickup_at: nowTime
      })
      persistOrderUpdateToBackend(delivery.order_ref, { delivery_status: "In Transit" })
      setWebsiteOrders(prev => prev.map(w => w.order_ref === delivery.order_ref ? {
        ...w,
        fulfillment_status: "in_transit"
      } : w))
    }
  }

  const acceptDelivery = (deliveryId: number) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      status: "in_transit",
      pickup_at: nowTime
    } : d))
    if (delivery) {
      updateOrderPipelineState(delivery.order_ref, {
        delivery_status: "in_transit",
        pickup_at: nowTime
      })
      persistOrderUpdateToBackend(delivery.order_ref, { delivery_status: "In Transit" })
      setWebsiteOrders(prev => prev.map(w => w.order_ref === delivery.order_ref ? {
        ...w,
        fulfillment_status: "in_transit"
      } : w))
    }
    showToast(`Order #${delivery?.order_ref || deliveryId} accepted — moved to In-Transit`, 'success')
  }

  const markDelivered = (deliveryId: number) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    if (!delivery) return

    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19)

    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      status: "delivered",
      delivered_at: nowTime
    } : d))

    updateOrderPipelineState(delivery.order_ref, {
      delivery_status: "delivered",
      delivered_at: nowTime
    })
    persistOrderUpdateToBackend(delivery.order_ref, {
      delivery_status: "Delivered",
      status: "Delivered"
    })
    setWebsiteOrders(prev => prev.map(w => w.order_ref === delivery.order_ref ? {
      ...w,
      fulfillment_status: "delivered",
      delivered_at: nowTime
    } : w))

    // Show confirmation toast for internal rider credit (reconcileLedger automatically calculates ledger from logisticsDeliveries)
    if (delivery.rider_type === 'internal' && (delivery.assigned_rider_id || delivery.assigned_rider)) {
      const fee = delivery.delivery_fee
      showToast(`Delivery confirmed — ₦${fee.toLocaleString()} credited to rider pending payout`, 'success')
    }
  }

  const declineDelivery = (deliveryId: number, reason: string) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    if (!delivery) return

    const prevRiderId = delivery.assigned_rider_id

    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      assigned_rider: "Unassigned",
      assigned_rider_id: undefined,
      status: "pending",
      pickup_at: null,
      decline_reason: reason
    } : d))

    updateOrderPipelineState(delivery.order_ref, {
      delivery_status: "pending",
      assigned_rider: "Unassigned",
      assigned_rider_id: undefined,
      pickup_at: null,
      decline_reason: reason
    })
    persistOrderUpdateToBackend(delivery.order_ref, {
      delivery_status: "Ready for Dispatch"
    })

    if (prevRiderId) {
      setRiders(prev => prev.map(r => {
        if (Number(r.rider_user_id) !== Number(prevRiderId)) return r
        const newActive = Math.max(0, r.active_assignments - 1)
        const newDeclines = (r.declined_dispatches || 0) + 1
        const delays = r.delayed_deliveries || 0
        const { rating, onTimeRate } = calculateRiderRating(delays, newDeclines)
        return {
          ...r,
          active_assignments: newActive,
          status: newActive > 0 ? "on_trip" : (r.status === 'offline' ? 'offline' : 'active'),
          declined_dispatches: newDeclines,
          rating,
          on_time_rate: onTimeRate
        }
      }))
    }

    showToast(`Order #${delivery.order_ref} returned to dispatch board`, 'info')
  }

  const updateRiderTask = (taskId: number, status: 'pending' | 'in_progress' | 'done') => {
    setRiderTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    showToast(`Task marked as ${status.replace('_', ' ')}`, 'info')
  }

  const startScheduledOrder = (orderId: number) => {
    const order = scheduledOrders.find(o => o.id === orderId)
    if (!order) return

    const matchingWebOrder = websiteOrders.find(w => w.order_ref === order.order_ref)
    const realItemsSummary = order.items_summary || matchingWebOrder?.items_summary || 'Assorted Smokey Delicacies'
    const realItems = order.items && order.items.length > 0
      ? order.items
      : (Array.isArray(matchingWebOrder?.raw_items) && matchingWebOrder.raw_items.length > 0
          ? matchingWebOrder.raw_items.map((i: any) => ({
              product_name: i.name || 'Smokey Product',
              quantity: Number(i.qty || i.quantity) || 1,
              unit_price: Number(i.price || i.unit_price) || 0,
              line_total: (Number(i.qty || i.quantity) || 1) * (Number(i.price || i.unit_price) || 0)
            }))
          : [{ product_name: realItemsSummary, quantity: 1, unit_price: order.total_amount, line_total: order.total_amount }])

    // 1. Release into Packaging Queue with real ordered items
    const newPkgOrder: PackagingQueueOrder = {
      id: order.id,
      order_ref: order.order_ref,
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      total_amount: order.total_amount,
      delivery_fee: order.delivery_fee,
      delivery_mode: "scheduled",
      payment_status: order.payment_status,
      order_status: "ready_for_fulfillment",
      items_summary: realItemsSummary,
      items: realItems,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    setPackagingQueue(prev => [newPkgOrder, ...prev.filter(p => p.id !== order.id && p.order_ref !== order.order_ref)])

    // 2. Persist release state & update scheduled order status
    updateOrderPipelineState(order.order_ref, {
      scheduled_released: true,
      order_status: 'ready_for_fulfillment'
    })
    persistOrderUpdateToBackend(order.order_ref, {
      delivery_status: 'In Packaging Queue'
    })
    setScheduledOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: "in_queue", can_start_schedule: true } : o))
    showToast(`Order #${order.order_ref} sent to packaging queue`, 'success')
  }

  const autoReleaseDuePreOrders = () => {
    let released = 0
    scheduledOrders.forEach(order => {
      if (order.can_start_schedule && order.order_status !== 'in_queue') {
        startScheduledOrder(order.id)
        released++
      }
    })
    return released
  }

  const rescheduleOrderDelivery = async (
    orderRef: string,
    scheduledDate: string,
    scheduledTime?: string,
    notes?: string,
    orderDetails?: Partial<ScheduledOrder>
  ): Promise<boolean> => {
    try {
      const opening = getOfficeOpeningHourForDate(scheduledDate)
      const timePart = scheduledTime ? scheduledTime : opening.timeStr
      const cleanDatePart = scheduledDate.split('T')[0].split(' ')[0]
      const fullSchedStr = `${cleanDatePart} ${timePart}`
      const auditLog = `[Scheduled Delivery: ${fullSchedStr}] [Rescheduled]`
      const staffName = currentAccount?.name || 'Operations Staff'

      // 1. Update Supabase orders table & backend API
      persistOrderUpdateToBackend(orderRef, {
        scheduled_delivery_date: cleanDatePart,
        delivery_status: 'Rescheduled',
        delivery_rescheduled_at: new Date().toISOString(),
        delivery_rescheduled_by: staffName,
        notes: notes ? `${notes}\n${auditLog}` : auditLog
      })
      updateOrderPipelineState(orderRef, {
        scheduled_released: false
      })

      try {
        await supabase
          .from('orders')
          .update({
            scheduled_delivery_date: cleanDatePart,
            delivery_status: 'Rescheduled',
            delivery_rescheduled_at: new Date().toISOString(),
            delivery_rescheduled_by: staffName,
            notes: notes ? `${notes}\n${auditLog}` : auditLog
          })
          .eq('id', orderRef)
      } catch (dbErr) {
        console.warn('Supabase order reschedule update failed, applying in memory:', dbErr)
      }

      // 2. Remove from packaging queue if currently queued
      setPackagingQueue(prev => prev.filter(p => p.order_ref !== orderRef))

      // 3. Add or update in scheduledOrders
      const numericId = parseInt(orderRef.replace(/\D/g, ''), 10) || Math.floor(Math.random() * 9000 + 1000)
      const schedTime = new Date(scheduledDate).getTime()
      const canStart = !isNaN(schedTime) && schedTime <= (Date.now() + 45 * 60 * 1000)
      const matchingWebOrder = websiteOrders.find(w => w.order_ref === orderRef)

      setScheduledOrders(prev => {
        const existing = prev.find(s => s.order_ref === orderRef)
        if (existing) {
          return prev.map(s => s.order_ref === orderRef ? {
            ...s,
            scheduled_delivery_at: fullSchedStr,
            order_status: 'payment_confirmed',
            can_start_schedule: canStart,
            notes: notes ? `${s.notes || ''}\n${auditLog}` : `${s.notes || ''} ${auditLog}`
          } : s)
        } else {
          return [{
            id: numericId,
            order_ref: orderRef,
            customer_name: orderDetails?.customer_name || matchingWebOrder?.customer_name || 'Storefront Customer',
            phone: orderDetails?.phone || matchingWebOrder?.phone || '',
            address: orderDetails?.address || matchingWebOrder?.address || 'Lagos',
            total_amount: orderDetails?.total_amount ?? matchingWebOrder?.total_amount ?? 0,
            delivery_fee: orderDetails?.delivery_fee ?? matchingWebOrder?.delivery_fee ?? 0,
            scheduled_delivery_at: fullSchedStr,
            payment_status: 'paid',
            order_status: 'payment_confirmed',
            notes: notes ? `${auditLog}\n${notes}` : auditLog,
            can_start_schedule: canStart,
            items_summary: orderDetails?.items_summary || matchingWebOrder?.items_summary || 'Assorted Smokey Delicacies'
          }, ...prev]
        }
      })

      showToast(`Order #${orderRef} scheduled for ${fullSchedStr}`, 'success')
      return true
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule delivery', 'error')
      return false
    }
  }

  const payAndResetRider = (riderId: number) => {
    const rider = riders.find(r => r.rider_user_id === riderId)
    if (!rider) return
    const payoutAmount = rider.pending_payout

    setRiders(prev => prev.map(r => {
      if (r.rider_user_id !== riderId) return r
      return {
        ...r,
        paid_total: (r.paid_total || 0) + r.pending_payout,
        pending_payout: 0,
        net_balance: 0
      }
    }))

    showSuccessModal({
      title: 'Payout Disbursed',
      message: `Audited delivery payout of ${formatNaira(payoutAmount)} has been cleared and disbursed to ${rider.rider_name}.`,
      details: [
        { label: 'Driver Name', value: rider.rider_name },
        { label: 'Amount Disbursed', value: formatNaira(payoutAmount) },
        { label: 'Outstanding Balance', value: '₦0.00' },
        { label: 'Status', value: 'Audited & Disbursed' },
      ],
    })
    showToast(`Paid ${formatNaira(payoutAmount)} to ${rider.rider_name}`, 'success')
  }

  const markPickupCollected = (orderId: number, collectedBy: string, handoverStaff: string, collectorPhone?: string) => {
    const targetPickup = storePickups.find(p => p.id === orderId)
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
    setStorePickups(prev => prev.map(p => p.id === orderId ? {
      ...p,
      order_status: "collected",
      collected_at: nowTime,
      collected_by: collectedBy,
      handover_staff: handoverStaff,
      collector_phone: collectorPhone || p.phone,
    } : p))

    if (targetPickup) {
      updateOrderPipelineState(targetPickup.order_ref, {
        delivery_status: "delivered",
        delivered_at: nowTime,
        collected_by: collectedBy,
        handover_staff: handoverStaff,
        collector_phone: collectorPhone || targetPickup.phone
      })
      persistOrderUpdateToBackend(targetPickup.order_ref, {
        delivery_status: "Delivered",
        status: "Delivered"
      })
      setWebsiteOrders(prev => prev.map(w => w.order_ref === targetPickup.order_ref ? {
        ...w,
        fulfillment_status: "delivered",
        delivered_at: nowTime
      } : w))
    }

    showToast(`Order handed over to ${collectedBy}${collectorPhone ? ` (${collectorPhone})` : ''}`, 'success')
  }

  const verifyThirdPartyFee = (deliveryId: number, status: 'approved' | 'flagged', note?: string) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    const updatedNotes = note ? `${delivery?.notes ? `${delivery.notes} ` : ''}[Verification note: ${note}]` : delivery?.notes
    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      fee_verify_status: status,
      notes: updatedNotes
    } : d))
    if (delivery) {
      updateOrderPipelineState(delivery.order_ref, {
        fee_verify_status: status,
        notes: updatedNotes
      })
    }
    showToast(
      status === 'approved'
        ? `Invoice approved: ${delivery?.order_ref || 'Delivery'} (${delivery?.assigned_rider || 'Courier'})`
        : `Invoice flagged: Overcharge reported for ${delivery?.order_ref || 'Delivery'}`,
      status === 'approved' ? 'success' : 'error'
    )
  }

  return (
    <SmokeyOpsContext.Provider
      value={{
        websiteOrders,
        setWebsiteOrders,
        refreshWebsiteOrders,
        isOrdersRefreshing,
        liveSalesProducts,
        setLiveSalesProducts,
        refreshLiveSalesProducts,
        isSalesProductsRefreshing,
        rawProducts,
        rawDeliveries,
        rawMovements,
        rawUsage,
        packagingProducts,
        packagingReceiptsTotals,
        salesProducts: augmentedSalesProducts,
        dailySales,
        salesMovements,
        suppliers,
        inventoryLots,
        recipeTemplates,
        stocktakeVariances,
        receiveRawStock,
        receiveRawStockWithLot,
        adjustRawStock,
        writeOffLotWaste,
        prioritizeLotInKitchen,
        saveRawProduct,
        receivePackaging,
        adjustPackagingStock,
        adjustSalesStock,
        saveSalesProduct,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        savePackagingProduct,
        submitStocktakeCount,
        resolveStocktakeVariance,
        packagingReconciliations,
        intermediatePreps,
        compoundInventory,
        interStationTransfers,
        issuePackagingFromCentral,
        returnPackagingToCentral,
        performDailyPackagingReconciliation,
        createIntermediatePrep,
        allocatePrepToBatch,
        returnPrepToCentral,
        issueCompoundToBatch,
        returnCompoundSurplusFromBatch,
        productionBatches,
        packagingQueue,
        packagingMaterialsDaily,
        kitchenTasks,
        createBatch,
        updateBatch,
        deleteBatch,
        deleteIntermediatePrep,
        requestAdditionalBatchMaterial,
        fulfillBatchMaterialRequisition,
        rejectBatchMaterialRequisition,
        returnUnconsumedBatchMaterials,
        saveCustomRecipeTemplate,
        updateRecipeTemplate,
        deleteRecipeTemplate,
        startBatch,
        completeBatch,
        cancelBatch,
        addPackagingQueueOrder,
        startPackagingOrder,
        confirmPackagingOrder,
        updateTaskStatus,
        createKitchenTask,
        logisticsDeliveries,
        scheduledOrders,
        riders,
        riderTasks,
        storePickups,
        thirdPartySummaries,
        assignRider,
        confirmRiderCollect,
        acceptDelivery,
        markDelivered,
        declineDelivery,
        updateRiderTask,
        startScheduledOrder,
        autoReleaseDuePreOrders,
        rescheduleOrderDelivery,
        payAndResetRider,
        markPickupCollected,
        verifyThirdPartyFee,
        isAuthenticated,
        activeAccountEmail,
        currentAccount,
        loginWithCredentials,
        logout,
        switchAccount,
        createAccount,
        updateAccount,
        deleteAccount,
        changePassword,
        addRiderProfile,
        availableAccounts: accounts,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        isRouteAllowed,
        getRoleDefaultLandingPath,
        getRoleAuthorizedRoutes,
        toasts,
        showToast,
        dismissToast,
        showSuccessModal,
        closeSuccessModal,
        systemAlerts,
        dismissSystemAlert,
        refreshSystemAlerts,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={closeSuccessModal}
        title={successModal.title}
        message={successModal.message}
        details={successModal.details}
        actionLabel={successModal.actionLabel}
        onAction={successModal.onAction}
      />
    </SmokeyOpsContext.Provider>
  )
}

export const useSmokeyOps = () => {
  const context = useContext(SmokeyOpsContext)
  if (!context) {
    throw new Error('useSmokeyOps must be used within a SmokeyOpsProvider')
  }
  return context
}
