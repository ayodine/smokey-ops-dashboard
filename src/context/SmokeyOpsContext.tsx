import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
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
  SEED_RAW_PRODUCTS,
  SEED_RAW_DELIVERIES,
  SEED_RAW_MOVEMENTS,
  SEED_RAW_USAGE,
  SEED_PACKAGING_PRODUCTS,
  SEED_PACKAGING_RECEIPTS_TOTALS,
  SEED_PACKAGING_RECONCILIATIONS,
  SEED_INTERMEDIATE_PREPS,
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
} from '@/lib/smokeyData'
import { supabase } from '@/lib/supabase'
import { ToastContainer, ToastMessage } from '@/components/ui/Toast'
import { SuccessModal } from '@/components/ui/SuccessModal'
import { formatNaira } from '@/lib/utils'

interface SmokeyOpsContextType {
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
  receiveRawStock: (data: { supplierId: number; productId: number; quantity: number; unitCost: number; notes?: string }) => void
  receiveRawStockWithLot: (data: { supplierId: number; productId: number; quantity: number; unitCost: number; lotNumber?: string; expiryDate?: string; notes?: string }) => void
  adjustRawStock: (productId: number, delta: number, notes: string, reason: string) => void
  writeOffLotWaste: (data: { lotId: number; quantity: number; notes: string; approverName: string }) => void
  prioritizeLotInKitchen: (data: { lotId: number; quantity: number; targetDishName: string; supervisorName?: string; pitmasterName?: string; shiftRemarks?: string }) => void
  saveRawProduct: (product: Partial<RawProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number; is_perishable?: boolean; expiry_date?: string }) => void
  receivePackaging: (data: { productId: number; quantity: number; unitCost: number }) => void
  adjustPackagingStock: (productId: number, delta: number, notes: string) => void
  savePackagingProduct: (product: Partial<PackagingProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number }) => void
  adjustSalesStock: (productId: number, delta: number, notes: string) => void
  saveSalesProduct: (product: Partial<SalesProduct> & { name: string; sku: string; unit: string; selling_price: number; unit_cost: number; reorder_level: number; stock_qty?: number; image?: string | null; category_name?: string }) => void
  addSupplier: (supplier: Omit<Supplier, 'id' | 'supplier_ref' | 'delivery_count' | 'total_spend' | 'is_active'>) => void
  updateSupplier: (supplier: Supplier) => void
  submitStocktakeCount: (counts: Array<{ productId: number; physicalCount: number; category: 'raw' | 'packaging' | 'sales' }>, countedBy: string) => number
  resolveStocktakeVariance: (varianceId: number, supervisorNotes: string) => void

  // Hub & Outlets Inventory State
  packagingReconciliations: PackagingDailyReconciliation[]
  intermediatePreps: IntermediatePrep[]
  interStationTransfers: InterStationTransfer[]

  // Hub & Outlets Actions
  issuePackagingFromCentral: (items: Array<{ productId: number; quantity: number }>, issuedTo: string, notes?: string) => boolean
  returnPackagingToCentral: (items: Array<{ productId: number; returnQty: number; damagedQty: number }>, notes?: string, verifiedBy?: string) => void
  performDailyPackagingReconciliation: (date: string, counts: Array<{ productId: number; actualClosingBench: number; damagedQty?: number }>, reconciledBy: string, notes?: string) => void
  createIntermediatePrep: (recipeName: string, rawIngredients: Array<{ productId: number; quantity: number }>, yieldQty: number, unit: string, preparedBy: string) => void
  allocatePrepToBatch: (prepId: number, batchRef: string, productName: string, allocatedQty: number, allocatedBy: string, batchId?: number) => boolean
  returnPrepToCentral: (prepId: number, returnQty: number, notes: string, returnedBy: string) => void

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
    rawMaterials: Array<{ product_id: number; sku: string; name: string; quantity: number; unit: string }>
  }) => void
  updateBatch: (batchId: number, data: Partial<ProductionBatch>) => void
  saveCustomRecipeTemplate: (template: Omit<RecipeTemplate, 'id'>) => void
  updateRecipeTemplate: (id: number, template: Partial<RecipeTemplate>) => void
  deleteRecipeTemplate: (id: number) => void
  startBatch: (batchId: number) => void
  completeBatch: (batchId: number, actualOutput: number, wastage: number, remarks?: string) => void
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
  assignRider: (deliveryId: number, riderType: 'internal' | 'third_party', riderName: string, riderId?: number, bookedFee?: number, feeEvidencePath?: string) => void
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
  remitCodCash: (riderId: number, cashAmount: number, cashierName: string) => void
  markPickupCollected: (orderId: number, collectedBy: string, handoverStaff: string, collectorPhone?: string) => void
  verifyThirdPartyFee: (deliveryId: number, status: 'approved' | 'flagged', note?: string) => void

  // Account Profile & RBAC
  activeAccountEmail: string
  currentAccount: AppUserAccount
  switchAccount: (email: string) => void
  createAccount: (account: AppUserAccount) => void
  updateAccount: (email: string, updates: Partial<AppUserAccount> & { password?: string }) => void
  deleteAccount: (email: string) => void
  changePassword: (email: string, newPassword: string) => void
  addRiderProfile: (riderData: Partial<RiderPayout> & { rider_name: string; phone: string }) => RiderPayout
  availableAccounts: AppUserAccount[]

  // Feedback, Toasts & Success Confirmation Modals
  toasts: ToastMessage[]
  showToast: (message: string, type?: 'success' | 'info' | 'error', title?: string) => void
  dismissToast: (id: string) => void
  showSuccessModal: (data: { title: string; message: string; details?: Array<{ label: string; value: string }>; actionLabel?: string; onAction?: () => void }) => void
  closeSuccessModal: () => void
}

export type UserRole = 'admin' | 'manager' | 'kitchen' | 'inventory' | 'dispatcher' | 'rider'

export interface AppUserAccount {
  email: string
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
  cod_limit?: number
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
    residential_address: acc.residential_address || (isRider ? '14 Herbert Macaulay Way, Alagomeji' : isKitchen ? '28 Commercial Avenue, Sabo' : isInventory ? '5 Montgomery Road, Yaba' : isDispatcher ? '19 Commercial Road, Yaba' : '10 Commercial Avenue, Yaba'),
    city: acc.city || 'Lagos Mainland',
    state: acc.state || 'Lagos State',
    date_of_birth: acc.date_of_birth || (isRider ? '1996-08-14' : isKitchen ? '1992-04-22' : isInventory ? '1994-09-15' : isDispatcher ? '1991-03-10' : '1988-11-05'),
    national_id_nin: acc.national_id_nin || (isRider ? '7829-4821-9921' : isKitchen ? '8941-2315-6672' : isInventory ? '6621-0042-8819' : isDispatcher ? '4431-7729-1082' : '5412-9983-1120'),
    nin_verified: acc.nin_verified ?? true,
    bvn: acc.bvn || '22349018471',
    employment_status: acc.employment_status || 'full_time',
    shift_schedule: acc.shift_schedule || (isKitchen ? 'Morning Cook & Prep (06:00 - 15:00)' : isRider ? 'Day Dispatch (08:00 - 18:00)' : isInventory ? 'Morning Intake & Audit (07:00 - 16:00)' : isDispatcher ? 'All-Day Fulfillment (08:00 - 18:00)' : 'General Executive Operations'),
    date_joined: acc.date_joined || acc.created_at || '12 Feb 2025',
    emergency_contact: acc.emergency_contact || (isRider ? 'Mrs. Funke Balogun' : isKitchen ? 'Mr. David Okon' : isInventory ? 'Dr. E. Adebayo' : isDispatcher ? 'Mrs. Jumoke Alao' : 'Mrs. Mary Olowookere'),
    emergency_phone: acc.emergency_phone || '+234 802 345 6789',
    emergency_relationship: acc.emergency_relationship || (isRider ? 'Spouse' : isKitchen ? 'Sibling' : isInventory ? 'Parent' : isDispatcher ? 'Spouse' : 'Spouse'),
    guarantor_name: acc.guarantor_name || (isRider ? 'Alhaji M. Adeleke' : isKitchen ? 'Chef Tunde Bakare' : isInventory ? 'Pastor F. Williams' : isDispatcher ? 'Chief O. Lawson' : 'Barrister K. Shonowo'),
    guarantor_phone: acc.guarantor_phone || '+234 803 311 2233',
    guarantor_relationship: acc.guarantor_relationship || (isRider ? 'Corporate Merchant / Landlord' : isKitchen ? 'Executive Chef / Mentor' : isInventory ? 'Community Leader' : isDispatcher ? 'Senior Logistics Director' : 'Legal Counsel'),
    guarantor_status: acc.guarantor_status || 'verified',
    bank_name: acc.bank_name || (isRider ? 'Kuda Microfinance Bank' : isKitchen ? 'Guaranty Trust Bank (GTBank)' : isInventory ? 'Access Bank' : isDispatcher ? 'Zenith Bank' : 'Guaranty Trust Bank (GTBank)'),
    bank_account_number: acc.bank_account_number || (isRider ? '2039481726' : isKitchen ? '0148920194' : isInventory ? '0029384719' : isDispatcher ? '1048291048' : '0129485712'),
    bank_account_name: acc.bank_account_name || acc.name,
    // Rider specific
    vehicle_type: acc.vehicle_type || 'Bajaj Boxer 150 Motorcycle',
    plate_number: acc.plate_number || 'LND-482-XA',
    license_number: acc.license_number || 'DL-98234-LAG',
    license_expiry: acc.license_expiry || '2027-11-30',
    cod_limit: acc.cod_limit || 50000,
    assigned_zone: acc.assigned_zone || 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)',
    inspection_status: acc.inspection_status || 'Passed & Certified',
    vehicle_ownership: acc.vehicle_ownership || 'Smokey Fleet Unit #04',
  }
}

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'Full Database & Records Access',
    'User Onboarding & Deletion',
    'Role & Permission Management',
    'Finance & Payout Remittances',
    'Inventory Threshold Overrides',
    'Logistics Dispatch Controls'
  ],
  manager: [
    'Batch Scheduling & Cook Approvals',
    'Variance Reconciliation',
    'Staff Shift Assignments',
    'Supplier Invoice Verification',
    'Waste & Spoilage Write-offs'
  ],
  kitchen: [
    'Start & Complete Batches',
    'Raw Materials Depletion',
    'Portion Pack-out Logging',
    'Waste & Spoilage Incident Reports'
  ],
  inventory: [
    'Stock Intake PO Receipts',
    'Periodic Cycle Counts',
    'Packaging Unit Transfers',
    'Lot Expiry Monitoring'
  ],
  dispatcher: [
    'Dispatch Queue Assignment',
    'Rider Location & Route Tracking',
    'Third-party Courier Bookings',
    'COD Cash Remittance Check-in'
  ],
  rider: [
    'Accept & Transit Delivery',
    'Customer OTP Drop-off Sign-off',
    'COD Cash Collection',
    'Wallet & Payout History'
  ]
}

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
      'Third-party Courier Bookings',
      'COD Cash Remittance Check-in'
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
    email: 'ridersmokeyfrlgs@gmail.com',
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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
    permissions: ['Accept & Transit Delivery', 'Customer OTP Drop-off Sign-off', 'COD Cash Collection', 'Wallet & Payout History']
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

export const SmokeyOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inventory Domain
  const [rawProducts, setRawProducts] = useState<RawProduct[]>(SEED_RAW_PRODUCTS)
  const [rawDeliveries, setRawDeliveries] = useState<RawDelivery[]>(SEED_RAW_DELIVERIES)
  const [rawMovements, setRawMovements] = useState<RawMovement[]>(SEED_RAW_MOVEMENTS)
  const [rawUsage] = useState<RawUsageItem[]>(SEED_RAW_USAGE)

  const [packagingProducts, setPackagingProducts] = useState<PackagingProduct[]>(SEED_PACKAGING_PRODUCTS)
  const [packagingReceiptsTotals, setPackagingReceiptsTotals] = useState<PackagingReceiptTotal[]>(SEED_PACKAGING_RECEIPTS_TOTALS)
  const [packagingReconciliations, setPackagingReconciliations] = useState<PackagingDailyReconciliation[]>(SEED_PACKAGING_RECONCILIATIONS)
  const [intermediatePreps, setIntermediatePreps] = useState<IntermediatePrep[]>(SEED_INTERMEDIATE_PREPS)
  const [interStationTransfers, setInterStationTransfers] = useState<InterStationTransfer[]>(SEED_INTER_STATION_TRANSFERS)

  const [salesProducts, setSalesProducts] = useState<SalesProduct[]>(SEED_SALES_PRODUCTS)
  const [dailySales] = useState<DailySalesItem[]>(SEED_DAILY_SALES)
  const [salesMovements, setSalesMovements] = useState<SalesMovement[]>(SEED_SALES_MOVEMENTS)

  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS)
  const [inventoryLots, setInventoryLots] = useState<InventoryLot[]>(SEED_INVENTORY_LOTS)
  const [recipeTemplates, setRecipeTemplates] = useState<RecipeTemplate[]>(SEED_RECIPE_TEMPLATES)
  const [stocktakeVariances, setStocktakeVariances] = useState<StocktakeVariance[]>(SEED_STOCKTAKE_VARIANCES)

  // Production Domain
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(SEED_PRODUCTION_BATCHES)
  const [packagingQueue, setPackagingQueue] = useState<PackagingQueueOrder[]>(SEED_PACKAGING_QUEUE)
  const [packagingMaterialsDaily, setPackagingMaterialsDaily] = useState<PackagingMaterialDaily[]>(SEED_PACKAGING_MATERIALS_DAILY)
  const [kitchenTasks, setKitchenTasks] = useState<KitchenTask[]>(SEED_KITCHEN_TASKS)

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
  const [logisticsDeliveries, setLogisticsDeliveries] = useState<LogisticsDelivery[]>(SEED_LOGISTICS_DELIVERIES)
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>(SEED_SCHEDULED_ORDERS)
  const [riders, setRiders] = useState<RiderPayout[]>(SEED_RIDER_PAYOUTS)
  const [riderTasks, setRiderTasks] = useState<RiderTask[]>(SEED_RIDER_TASKS)
  const [storePickups, setStorePickups] = useState<StorePickupOrder[]>(SEED_STORE_PICKUPS)
  const [thirdPartySummaries] = useState<ThirdPartyWeeklySummary[]>(SEED_THIRD_PARTY_SUMMARY)

  // Account / Role Management (RBAC)
  const [accounts, setAccounts] = useState<AppUserAccount[]>(() => {
    const saved = localStorage.getItem('smokey_accounts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mockEmails = ['ops-team@smokeyhut.com', 'chef.amara@smokeyhut.com', 'kemi.inv@smokeyhut.com', 'babajide.dispatch@smokeyhut.com', 'ayodine47@gmail.com']
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
    const saved = localStorage.getItem('smokey_active_account')
    const mockEmails = ['ops-team@smokeyhut.com', 'chef.amara@smokeyhut.com', 'kemi.inv@smokeyhut.com', 'babajide.dispatch@smokeyhut.com', 'ayodine47@gmail.com']
    if (saved && !mockEmails.includes(saved.toLowerCase())) {
      return saved
    }
    return 'fivedigita@gmail.com'
  })

  // Synchronize live data from Supabase backend on mount
  React.useEffect(() => {
    fetch('/api/raw-inventory')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: RawProduct[] = json.data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            product_type: 'raw',
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
          setRawProducts(mapped)
        }
      })
      .catch(err => console.error('Error fetching live raw inventory:', err))

    fetch('/api/packaging-inventory')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: PackagingProduct[] = json.data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            product_type: 'packaging',
            unit: p.unit || 'PIECES',
            reorder_level: parseFloat(p.reorder_level || 50),
            unit_cost: parseFloat(p.unit_cost || 0),
            stock_qty: parseFloat(p.stock_qty || 0),
            qty_allocated: 0,
            qty_available: parseFloat(p.stock_qty || 0),
            inventory_value: parseFloat(p.inventory_value || (parseFloat(p.stock_qty || 0) * parseFloat(p.unit_cost || 0))),
            is_active: p.is_active ? 1 : 0
          }))
          setPackagingProducts(mapped)
        }
      })
      .catch(err => console.error('Error fetching live packaging inventory:', err))

    fetch('/api/suppliers')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: Supplier[] = json.data.map((s: any) => ({
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
          setSuppliers(mapped)
        }
      })
      .catch(err => console.error('Error fetching live suppliers:', err))

    fetch('/api/fleet-riders')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: RiderPayout[] = json.data
            .filter((r: any) => r.is_delivery_rider === 1)
            .map((r: any) => {
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
                cod_cash_collected: existing?.cod_cash_collected || 0,
                cod_remitted_total: existing?.cod_remitted_total || 0,
                net_balance: existing?.net_balance || 0,
                paid_total: existing?.paid_total || 0,
                lifetime_earnings: existing?.lifetime_earnings || 0,
                status: 'active' as const,
                operating_hub: existing?.operating_hub || 'Lagos Mainland HQ'
              }
            })
          setRiders(mapped)
        }
      })
      .catch(err => console.error('Error fetching live fleet riders:', err))

    // Automated flow: fetch live orders and populate Packaging Execution & Delivery Schedule
    const syncLiveWebsiteOrders = async () => {
      try {
        let rawOrders: any[] = []

        // 1. Direct Supabase query
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .is('deleted_at', null)
          .neq('status', 'pending_payment')
          .order('created_at', { ascending: false })
          .limit(200)

        if (!error && Array.isArray(data) && data.length > 0) {
          rawOrders = data
        } else {
          // 2. Dev server proxy fallback
          const res = await fetch('/api/live-orders')
          if (res.ok) {
            const json = await res.json()
            if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
              rawOrders = json.data
            }
          }
        }

        if (rawOrders.length === 0) {
          rawOrders = SEED_WEBSITE_ORDERS
        }

        const now = Date.now()
        const newPackagingItems: PackagingQueueOrder[] = []
        const newScheduledItems: ScheduledOrder[] = []
        const deliveredDeliveries: LogisticsDelivery[] = []

        rawOrders.forEach((o: any, idx: number) => {
          const numericId = parseInt(String(o.id).replace(/\D/g, '')) || (10700 + idx)
          const orderRef = String(o.id || `SHD-${numericId}`)
          const customerName = o.customer_name || 'Storefront Customer'
          const phone = o.customer_phone || o.phone || 'N/A'
          const address = o.delivery_address || o.address || 'Storefront Counter Pickup'
          const totalAmount = Number(o.total || o.total_amount) || 0
          const deliveryFee = Number(o.delivery_fee) || 0
          const createdAt = o.created_at || new Date().toISOString()
          const notes = o.notes || ''
          const isDelivered = o.delivery_status === 'delivered' || o.status === 'delivered'
          const isInTransit = o.delivery_status === 'in_transit' || o.delivery_status === 'assigned'

          const itemsList = Array.isArray(o.order_items) && o.order_items.length > 0
            ? o.order_items.map((i: any) => `${i.qty || 1}x ${i.name || 'Smokey Dish'}`).join('; ')
            : (o.items_summary || 'Assorted Smokey Delicacies')

          const typedItems = Array.isArray(o.order_items) && o.order_items.length > 0
            ? o.order_items.map((i: any) => ({
                product_name: i.name || 'Smokey Dish',
                quantity: Number(i.qty) || 1,
                unit_price: Number(i.price) || 0,
                line_total: (Number(i.qty) || 1) * (Number(i.price) || 0)
              }))
            : (Array.isArray(o.items) && o.items.length > 0
                ? o.items
                : [{ product_name: itemsList, quantity: 1, unit_price: totalAmount, line_total: totalAmount }])

          // Check if order is scheduled for future delivery or rescheduled from storefront / admin
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
          const isScheduledFuture = Boolean(
            (schedDateStr && !isNaN(schedTime) && schedTime > now) ||
            (isExplicitScheduled && !isDelivered && !isInTransit)
          )

          if (isScheduledFuture) {
            // Holds in delivery schedule table until assigned date/time is reached
            const effectiveTime = !isNaN(new Date(effectiveSched).getTime()) ? new Date(effectiveSched).getTime() : now + 3600000
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
              order_status: 'payment_confirmed',
              notes: notes || 'Scheduled pre-order from website storefront',
              can_start_schedule: effectiveTime <= (now + 45 * 60 * 1000)
            })
          } else {
            // Instant website order or scheduled time reached:
            // Flows automatically into Packaging Queue!
            const pkgStatus: 'ready_for_fulfillment' | 'in_packaging' | 'packaged' = 
              (isDelivered || isInTransit) ? 'packaged' : 'ready_for_fulfillment'

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
              packaged_at: (isDelivered || isInTransit) ? createdAt : null,
              packaged_by_name: (isDelivered || isInTransit) ? 'Bisi Akande (Packaging Lead)' : undefined,
              created_at: createdAt
            })

            if (isDelivered) {
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
                rider_type: 'third_party',
                assigned_rider: 'FRESH LOGISTICS',
                assigned_rider_id: 513,
                status: 'delivered',
                dispatch_date: createdAt.split('T')[0],
                pickup_at: createdAt,
                delivered_at: createdAt,
                fee_verify_status: 'approved',
                payment_mode: 'online',
                items_summary: itemsList
              })
            }
          }
        })

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
          return [...merged, ...manualOrders]
        })

        // Update scheduledOrders: merge and preserve in-memory status
        setScheduledOrders(prev => {
          const prevMap = new Map(prev.map(s => [s.order_ref, s]))
          const base = newScheduledItems.length > 0 ? newScheduledItems : SEED_SCHEDULED_ORDERS
          return base.map(item => {
            const existing = prevMap.get(item.order_ref)
            if (existing) {
              return {
                ...item,
                order_status: existing.order_status,
                can_start_schedule: existing.can_start_schedule
              }
            }
            return item
          })
        })

        // Update logisticsDeliveries: retain active dispatches awaiting rider assignment or on road
        setLogisticsDeliveries(prev => {
          const activeDispatches = prev.filter(d => d.status === 'pending' || d.status === 'assigned' || d.status === 'in_transit')
          const existingRefs = new Set(activeDispatches.map(d => d.order_ref))
          const nonDuplicateDelivered = deliveredDeliveries.filter(d => !existingRefs.has(d.order_ref))
          if (activeDispatches.length === 0 && nonDuplicateDelivered.length === 0) {
            return SEED_LOGISTICS_DELIVERIES
          }
          return [...activeDispatches, ...nonDuplicateDelivered]
        })
      } catch (err) {
        console.error('Error syncing live website orders:', err)
      }
    }

    syncLiveWebsiteOrders()

    const ordersChannel = supabase
      .channel('ops_context_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          syncLiveWebsiteOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
    }
  }, [])

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
    if (target?.role === 'rider') {
      showToast('Switched to Rider Yusuf profile — restricted to Logistics & Delivery operations', 'info')
    } else {
      showToast(`Switched account to ${target?.name || email} (${target?.roleLabel || 'Staff'})`, 'info')
    }
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
      cod_cash_collected: 0,
      cod_remitted_total: 0,
      net_balance: 0,
      paid_total: 0,
      lifetime_earnings: 0,
      status: riderData.status || 'active',
      vehicle_type: riderData.vehicle_type?.trim() || 'Bajaj Boxer 150 Motorcycle',
      plate_number: riderData.plate_number?.trim() || 'LND-482-XA',
      operating_hub: riderData.operating_hub?.trim() || 'Yaba Head Office',
      license_number: riderData.license_number?.trim() || 'DL-98234-LAG',
      license_expiry: riderData.license_expiry?.trim() || 'Nov 2027',
      emergency_contact: riderData.emergency_contact?.trim() || 'Next of Kin',
      emergency_phone: riderData.emergency_phone?.trim() || '08023456789',
      rating: 5.0,
      on_time_rate: 100,
      cod_limit: Number(riderData.cod_limit) || 50000,
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
      license_expiry: newRider.license_expiry,
      cod_limit: newRider.cod_limit
    }

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
            cod_limit: newAcc.cod_limit || r.cod_limit,
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
          cod_cash_collected: 0,
          cod_remitted_total: 0,
          net_balance: 0,
          paid_total: 0,
          lifetime_earnings: 0,
          status: 'active',
          vehicle_type: newAcc.vehicle_type || 'Bajaj Boxer 150 Motorcycle',
          plate_number: newAcc.plate_number || 'LND-482-XA',
          operating_hub: newAcc.assigned_hub || 'Yaba Head Office',
          license_number: newAcc.license_number || 'DL-98234-LAG',
          license_expiry: newAcc.license_expiry || 'Nov 2027',
          emergency_contact: newAcc.emergency_contact || 'Next of Kin',
          emergency_phone: newAcc.emergency_phone || '08023456789',
          rating: 5.0,
          on_time_rate: 100,
          cod_limit: newAcc.cod_limit || 50000,
          date_joined: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        }
        return [newRider, ...prev]
      })
    }

    const accountWithPermissions: AppUserAccount = {
      ...newAcc,
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
    switchAccount(accountWithPermissions.email)
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

  // -------------------------------------------------------------
  // INVENTORY MUTATIONS
  // -------------------------------------------------------------

  const receiveRawStock = ({ supplierId, productId, quantity, unitCost, notes }: { supplierId: number; productId: number; quantity: number; unitCost: number; notes?: string }) => {
    const product = rawProducts.find(p => p.id === productId)
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!product || !supplier) return

    const totalValue = quantity * unitCost
    const newQty = product.stock_qty + quantity
    const newProductValue = newQty * unitCost

    // 1. Update product stock (maintain 3-state stock model: available = stock_qty - allocated - quarantine)
    setRawProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const avail = Math.max(0, newQty - (p.qty_allocated || 0) - (p.qty_quarantine || 0))
      return { ...p, stock_qty: newQty, qty_available: avail, unit_cost: unitCost, inventory_value: newProductValue }
    }))

    // 2. Add delivery record
    const deliveryRef = `RCV-${String(rawDeliveries.length + 65).padStart(5, '0')}`
    const newDelivery: RawDelivery = {
      id: Date.now(),
      delivery_ref: deliveryRef,
      supplier_id: supplierId,
      supplier_name: supplier.name,
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      quantity,
      unit: product.unit,
      unit_cost: unitCost,
      value_amount: totalValue,
      date_received: new Date().toISOString().split('T')[0],
      user_name: "Inventory Lead",
      notes
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
      movement_type: "transfer",
      quantity,
      unit_cost: unitCost,
      value_amount: totalValue,
      balance_after: newQty,
      notes: `Supplier receipt from ${supplier.name} (${deliveryRef})`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: "Inventory Lead"
    }
    setRawMovements(prev => [newMovement, ...prev])

    // 4. Update supplier total spend
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, delivery_count: s.delivery_count + 1, total_spend: s.total_spend + totalValue } : s))

    showSuccessModal({
      title: 'Stock Intake Recorded',
      message: `Received ${quantity} ${product.unit} of ${product.name} from ${supplier.name}.`,
      details: [
        { label: 'Delivery Ref', value: deliveryRef },
        { label: 'Ingredient', value: product.name },
        { label: 'Quantity Added', value: `+${quantity} ${product.unit}` },
        { label: 'Total Value', value: formatNaira(totalValue) },
      ],
    })
    showToast(`Stock intake: +${quantity} ${product.unit} of ${product.name}`, 'success')
  }

  const receiveRawStockWithLot = ({
    supplierId,
    productId,
    quantity,
    unitCost,
    lotNumber,
    expiryDate,
    notes
  }: {
    supplierId: number
    productId: number
    quantity: number
    unitCost: number
    lotNumber?: string
    expiryDate?: string
    notes?: string
  }) => {
    receiveRawStock({ supplierId, productId, quantity, unitCost, notes })
    if (lotNumber && expiryDate) {
      const product = rawProducts.find(p => p.id === productId)
      const supplier = suppliers.find(s => s.id === supplierId)
      const today = new Date().toISOString().split('T')[0]
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

    const newMovement: RawMovement = {
      id: Date.now(),
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      unit: product.unit,
      location: "raw",
      movement_type: delta < 0 && reason.toLowerCase().includes('waste') ? "waste" : "adjustment",
      quantity: delta,
      unit_cost: product.unit_cost,
      value_amount: deltaVal,
      balance_after: newQty,
      notes: `${reason}: ${notes}`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: "Inventory Supervisor"
    }
    setRawMovements(prev => [newMovement, ...prev])
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
    const batchRef = `BAT-${String(productionBatches.length + 23).padStart(5, '0')}`
    const finalSupervisor = supervisorName || pitmasterName || "Production Supervisor"
    const newBatch: ProductionBatch = {
      id: Date.now(),
      batch_ref: batchRef,
      output_product_id: outputProductId,
      output_product_name: targetDishName,
      expected_output: actualQty,
      actual_output: 0,
      wastage: 0,
      status: "in_production",
      started_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      completed_at: null,
      remarks: `[URGENT EXPIRING BATCH] Lot: ${lot.lot_number} (Exp: ${lot.expiry_date}). ${shiftRemarks || 'Cook immediately on smoking grill / oven to prevent food waste.'}`,
      created_by_name: finalSupervisor,
      raw_materials: [
        {
          product_id: lot.product_id,
          sku: lot.sku,
          name: `${lot.product_name} (Lot: ${lot.lot_number})`,
          quantity: actualQty,
          unit: lot.unit
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
        { label: 'Target Finished Dish', value: targetDishName },
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
  }

  const receivePackaging = ({ productId, quantity, unitCost }: { productId: number; quantity: number; unitCost: number }) => {
    const p = packagingProducts.find(item => item.id === productId)
    if (!p) return

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
          total_value: r.total_value + (quantity * unitCost),
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
        total_value: quantity * unitCost,
        receipt_count: 1,
        last_received: new Date().toISOString().split('T')[0]
      }]
    })
  }

  const adjustPackagingStock = (productId: number, delta: number, _notes: string) => {
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
    preparedBy: string
  ) => {
    // 1. Deduct raw ingredients from Central Store
    rawIngredients.forEach(ing => {
      adjustRawStock(ing.productId, -ing.quantity, `Withdrawn from Central Store for recipe prep: ${recipeName}`, "consumption")
    })

    // 2. Transfer from Central Store to Production Bench
    const transferRef = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(interStationTransfers.length + 1).padStart(2, '0')}`
    const transferItems = rawIngredients.map(ing => {
      const raw = rawProducts.find(r => r.id === ing.productId)
      return {
        product_id: ing.productId,
        product_name: raw ? raw.name : 'Unknown Raw Material',
        quantity: ing.quantity,
        unit: raw ? raw.unit : 'kg'
      }
    })

    const newTransfer: InterStationTransfer = {
      id: Date.now(),
      transfer_ref: transferRef,
      from_station: 'central_warehouse',
      to_station: 'production_floor',
      transfer_type: 'issue_raw_for_prep',
      items: transferItems,
      notes: `Issued raw materials for intermediate mix: ${recipeName}`,
      authorized_by: "Central Storekeeper",
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'completed'
    }
    setInterStationTransfers(prev => [newTransfer, ...prev])

    // 3. Create IntermediatePrep record
    const prepRef = `PRP-${String(intermediatePreps.length + 43).padStart(3, '0')}`
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
      allocations: []
    }
    setIntermediatePreps(prev => [newPrep, ...prev])

    showSuccessModal({
      title: 'Intermediate Recipe Prep Created',
      message: `Raw ingredients deducted from Central Store. ${yieldQty} ${unit} of ${recipeName} is now active and ready for cross-product allocation.`,
      details: [
        { label: 'Prep Ref', value: prepRef },
        { label: 'Recipe Mix', value: recipeName },
        { label: 'Initial Yield', value: `${yieldQty} ${unit}` },
        { label: 'Prepared By', value: preparedBy },
        { label: 'Status', value: 'Active on Production Bench' },
      ],
    })
    showToast(`Created prep mix ${prepRef}: ${yieldQty} ${unit} ready for use`, 'success')
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

    const newAllocation: IntermediatePrepAllocation = {
      id: `ALLOC-${Date.now()}`,
      batch_id: batchId,
      batch_ref: batchRef,
      target_product_name: productName,
      allocated_qty: allocatedQty,
      allocated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      allocated_by: allocatedBy
    }

    setIntermediatePreps(prev => prev.map(p => p.id === prepId ? {
      ...p,
      remaining_qty: newRemaining,
      status: newStatus,
      allocations: [newAllocation, ...p.allocations]
    } : p))

    showToast(`Allocated ${allocatedQty} ${prep.unit} from ${prep.recipe_name} to ${productName} (${batchRef})`, 'success')
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
      notes: `${notes} (Returned by ${returnedBy})`,
      authorized_by: returnedBy,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'completed'
    }
    setInterStationTransfers(prev => [newTransfer, ...prev])

    // 2. Deposit into Central Store cold storage as a tracked InventoryLot
    const lotId = Date.now()
    const newLot: InventoryLot = {
      id: lotId,
      lot_number: `LOT-PREP-${prep.prep_ref}`,
      product_id: prep.id,
      product_name: `[Central Store Cold Storage] ${prep.recipe_name}`,
      sku: `HUB-PREP-${prep.prep_ref}`,
      supplier_name: 'Internal Production Bench',
      unit: prep.unit,
      unit_cost: 0,
      initial_qty: returnQty,
      remaining_qty: returnQty,
      received_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      days_to_expiry: 7,
      status: 'active',
      location: 'Central Cold Room Chiller #2'
    }
    setInventoryLots(prev => [newLot, ...prev])

    // 3. Update prep record
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
      message: `${returnQty} ${prep.unit} of ${prep.recipe_name} has been returned to the Central Store cold storage.`,
      details: [
        { label: 'Prep Ref', value: prep.prep_ref },
        { label: 'Quantity Preserved', value: `${returnQty} ${prep.unit}` },
        { label: 'Cold Storage Lot', value: newLot.lot_number },
        { label: 'Storage Location', value: newLot.location || 'Central Cold Room Chiller #2' },
        { label: 'Returned By', value: returnedBy },
      ],
    })
    showToast(`Surplus ${returnQty} ${prep.unit} returned to Central Store cold storage`, 'success')
  }

  const adjustSalesStock = (productId: number, delta: number, notes: string) => {
    const product = salesProducts.find(p => p.id === productId)
    if (!product) return

    const newQty = Math.max(0, product.stock_qty + delta)
    setSalesProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_qty: newQty, inventory_value: newQty * p.unit_cost } : p))

    const newMovement: SalesMovement = {
      id: Date.now(),
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
      user_name: "Operations Lead"
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
    rawMaterials: Array<{ product_id: number; sku: string; name: string; quantity: number; unit: string }>
  }) => {
    // 1. Deduct raw materials consumed
    rawMaterials.forEach(mat => {
      adjustRawStock(mat.product_id, -mat.quantity, `Batch allocation for ${outputProductName}`, "consumption")
    })

    const batchRef = `BAT-${String(productionBatches.length + 23).padStart(5, '0')}`
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
      created_by_name: "Shift Oven Supervisor",
      raw_materials: rawMaterials
    }
    setProductionBatches(prev => [newBatch, ...prev])

    showSuccessModal({
      title: batch_schedule === 'tomorrow_morning' ? 'Next-Day Morning Smoke Scheduled' : 'Cooking Batch Created',
      message: feed_sales_inventory
        ? `Batch formulated. +${expectedOutput} units buffered to Sales Inventory so online orders continue uninterrupted.`
        : `Batch formulated for ${outputProductName}. Raw ingredients allocated from inventory.`,
      details: [
        { label: 'Batch Ref', value: batchRef },
        { label: 'Target Dish', value: outputProductName },
        { label: 'Planned Output', value: `${expectedOutput} portions` },
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

  const completeBatch = (batchId: number, actualOutput: number, wastage: number, remarks?: string) => {
    const batch = productionBatches.find(b => b.id === batchId)
    if (!batch) return

    // 1. Mark batch completed
    setProductionBatches(prev => prev.map(b => b.id === batchId ? {
      ...b,
      actual_output: actualOutput,
      wastage,
      status: "completed",
      completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      remarks: remarks || b.remarks
    } : b))

    // 2. Automatically INCREMENT physical stock in Sales Inventory (reconciling estimated incoming buffer)
    const targetSales = salesProducts.find(sp => sp.id === batch.output_product_id || sp.name.toLowerCase() === batch.output_product_name.toLowerCase())
    if (targetSales) {
      adjustSalesStock(targetSales.id, actualOutput, `Batch ${batch.batch_ref} yield deposit`)
    }

    showSuccessModal({
      title: 'Cooking Batch Completed & Reconciled',
      message: `Verified actual yield deposited into Physical Sales Inventory. Estimated incoming buffer has been converted to ready stock.`,
      details: [
        { label: 'Batch Ref', value: batch.batch_ref },
        { label: 'Finished Dish', value: batch.output_product_name },
        { label: 'Estimated Batch Buffer', value: `${batch.expected_output} portions (Reconciled)` },
        { label: 'Actual Physical Deposited', value: `+${actualOutput} portions` },
        { label: 'Cooking Shrinkage / Loss', value: `${wastage} portions` },
      ],
    })
    showToast(`Batch ${batch.batch_ref} completed: +${actualOutput} physical portions deposited`, 'success')
  }

  const cancelBatch = (batchId: number) => {
    const batch = productionBatches.find(b => b.id === batchId)
    if (!batch) return

    // Restore materials
    batch.raw_materials.forEach(mat => {
      adjustRawStock(mat.product_id, mat.quantity, `Reversal from cancelled Batch ${batch.batch_ref}`, "transfer")
    })

    setProductionBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: "cancelled" } : b))
    showToast(`Batch ${batch.batch_ref} cancelled and raw materials returned to stock`, 'info')
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
    // 1. Deduct packaging stock from active bench stock
    materials.forEach(m => {
      const match = packagingProducts.find(p => p.name.toLowerCase() === m.packaging_name.toLowerCase())
      if (match) {
        setPackagingProducts(prev => prev.map(p => {
          if (p.id !== match.id) return p
          const newBench = Math.max(0, (p.bench_stock_qty ?? 0) - m.quantity)
          const newTotal = (p.central_stock_qty ?? 0) + newBench
          return {
            ...p,
            bench_stock_qty: newBench,
            stock_qty: newTotal,
            qty_available: Math.max(0, newTotal - p.qty_allocated),
            inventory_value: newTotal * p.unit_cost
          }
        }))
      }
    })

    // 2. Advance status to in_packaging
    setPackagingQueue(prev => prev.map(o => o.id === orderId ? {
      ...o,
      order_status: "in_packaging",
      packaging_materials_picked: materials
    } : o))
  }

  const confirmPackagingOrder = (orderId: number, staffName: string = "Kitchen Pack Crew") => {
    const order = packagingQueue.find(o => o.id === orderId)
    if (!order) return

    // 1. Mark as packaged in queue
    setPackagingQueue(prev => prev.map(o => o.id === orderId ? {
      ...o,
      order_status: "packaged",
      packaged_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      packaged_by_name: staffName
    } : o))

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
        packaged_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
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
        payment_mode: 'online',
        items_summary: order.items_summary,
        notes: `Packed by ${staffName}`
      }
      setLogisticsDeliveries(prev => [newDelivery, ...prev.filter(d => d.order_ref !== order.order_ref && d.id !== order.id)])
      showToast(`Order #${order.order_ref} packaged and sent to Dispatch Board (Awaiting Rider Assignment)!`, 'success')
    }

    // 4. Update daily materials consumed
    if (order.packaging_materials_picked) {
      order.packaging_materials_picked.forEach(pick => {
        setPackagingMaterialsDaily(prev => {
          const match = prev.find(p => p.product_name.toLowerCase() === pick.packaging_name.toLowerCase())
          if (match) {
            return prev.map(p => p.product_name.toLowerCase() === pick.packaging_name.toLowerCase() ? {
              ...p,
              total_consumed: p.total_consumed + pick.quantity,
              total_orders: p.total_orders + 1
            } : p)
          }
          return prev
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
    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      rider_type: riderType,
      assigned_rider: riderName,
      assigned_rider_id: riderId,
      third_party_provider: riderType === 'third_party' ? riderName : null,
      booked_fee: bookedFee || null,
      fee_evidence_path: feeEvidencePath || d.fee_evidence_path || null,
      fee_verify_status: riderType === 'third_party' ? (feeEvidencePath ? 'approved' : 'pending') : 'none',
      status: "assigned"
    } : d))

    // Increment active assignment count for internal rider
    if (riderType === 'internal' && riderId) {
      setRiders(prev => prev.map(r => r.rider_user_id === riderId ? { ...r, active_assignments: r.active_assignments + 1, status: "on_trip" } : r))
    }
  }

  const confirmRiderCollect = (deliveryId: number) => {
    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      status: "in_transit",
      pickup_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : d))
  }

  const acceptDelivery = (deliveryId: number) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      status: "in_transit",
      pickup_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : d))
    showToast(`Order #${delivery?.order_ref || deliveryId} accepted — moved to In-Transit`, 'success')
  }

  const markDelivered = (deliveryId: number) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    if (!delivery) return

    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      status: "delivered",
      delivered_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : d))

    // Credit internal rider ledger!
    if (delivery.rider_type === 'internal' && delivery.assigned_rider_id) {
      const fee = delivery.delivery_fee
      setRiders(prev => prev.map(r => {
        if (r.rider_user_id !== delivery.assigned_rider_id) return r
        const newActive = Math.max(0, r.active_assignments - 1)
        return {
          ...r,
          active_assignments: newActive,
          today_trips: r.today_trips + 1,
          deliveries_today: (r.deliveries_today || 0) + 1,
          deliveries_week: (r.deliveries_week || 0) + 1,
          deliveries_month: (r.deliveries_month || 0) + 1,
          total_completed: (r.total_completed || 0) + 1,
          earnings_today: r.earnings_today + fee,
          earnings_week: r.earnings_week + fee,
          earnings_month: r.earnings_month + fee,
          pending_payout: r.pending_payout + fee,
          lifetime_earnings: r.lifetime_earnings + fee,
          status: newActive > 0 ? "on_trip" : "active"
        }
      }))
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

    if (prevRiderId) {
      setRiders(prev => prev.map(r => {
        if (r.rider_user_id !== prevRiderId) return r
        const newActive = Math.max(0, r.active_assignments - 1)
        return {
          ...r,
          active_assignments: newActive,
          status: newActive > 0 ? "on_trip" : "active"
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

    // 1. Release into Packaging Queue
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
    setPackagingQueue(prev => [newPkgOrder, ...prev.filter(p => p.id !== order.id)])

    // 2. Update scheduled order status
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

      // 1. Update Supabase orders table
      try {
        await supabase
          .from('orders')
          .update({
            scheduled_delivery_date: scheduledDate.split('T')[0],
            delivery_status: 'Rescheduled',
            delivery_rescheduled_at: new Date().toISOString(),
            delivery_rescheduled_by: 'Ops Team',
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
            customer_name: orderDetails?.customer_name || 'Storefront Customer',
            phone: orderDetails?.phone || '',
            address: orderDetails?.address || 'Lagos',
            total_amount: orderDetails?.total_amount || 0,
            delivery_fee: orderDetails?.delivery_fee || 0,
            scheduled_delivery_at: fullSchedStr,
            payment_status: 'paid',
            order_status: 'payment_confirmed',
            notes: notes ? `${auditLog}\n${notes}` : auditLog,
            can_start_schedule: canStart
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

  const remitCodCash = (riderId: number, cashAmount: number, cashierName: string) => {
    const rider = riders.find(r => r.rider_user_id === riderId)
    setRiders(prev => prev.map(r => {
      if (r.rider_user_id !== riderId) return r
      const newRemitted = r.cod_remitted_total + cashAmount
      const unremitted = Math.max(0, r.cod_cash_collected - newRemitted)
      const newNet = r.pending_payout - unremitted
      return {
        ...r,
        cod_remitted_total: newRemitted,
        net_balance: newNet
      }
    }))

    showSuccessModal({
      title: 'Cash Remittance Logged',
      message: `Physical cash received from ${rider?.rider_name || 'Driver'} has been recorded.`,
      details: [
        { label: 'Driver', value: rider?.rider_name || 'Driver' },
        { label: 'Amount Remitted', value: formatNaira(cashAmount) },
        { label: 'Cashier', value: cashierName || 'Hub Cashier' },
        { label: 'Status', value: 'Reconciled & Balanced' },
      ],
    })
    showToast(`Received ${formatNaira(cashAmount)} cash from ${rider?.rider_name || 'Driver'}`, 'success')
  }

  const payAndResetRider = (riderId: number) => {
    const rider = riders.find(r => r.rider_user_id === riderId)
    if (!rider) return
    const payoutAmount = rider.pending_payout

    setRiders(prev => prev.map(r => {
      if (r.rider_user_id !== riderId) return r
      const unremitted = Math.max(0, r.cod_cash_collected - r.cod_remitted_total)
      return {
        ...r,
        paid_total: r.paid_total + r.pending_payout,
        pending_payout: 0,
        net_balance: -unremitted
      }
    }))

    showSuccessModal({
      title: 'Payment Completed',
      message: `Delivery balance of ${formatNaira(payoutAmount)} has been cleared for ${rider.rider_name}.`,
      details: [
        { label: 'Driver Name', value: rider.rider_name },
        { label: 'Amount Paid', value: formatNaira(payoutAmount) },
        { label: 'New Outstanding Balance', value: '₦0.00' },
        { label: 'Status', value: 'Settled & Cleared' },
      ],
    })
    showToast(`Paid ${formatNaira(payoutAmount)} to ${rider.rider_name}`, 'success')
  }

  const markPickupCollected = (orderId: number, collectedBy: string, handoverStaff: string, collectorPhone?: string) => {
    setStorePickups(prev => prev.map(p => p.id === orderId ? {
      ...p,
      order_status: "collected",
      collected_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      collected_by: collectedBy,
      handover_staff: handoverStaff,
      collector_phone: collectorPhone || p.phone,
    } : p))
    showToast(`Order handed over to ${collectedBy}${collectorPhone ? ` (${collectorPhone})` : ''}`, 'success')
  }

  const verifyThirdPartyFee = (deliveryId: number, status: 'approved' | 'flagged', note?: string) => {
    const delivery = logisticsDeliveries.find(d => d.id === deliveryId)
    setLogisticsDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      fee_verify_status: status,
      notes: note ? `${d.notes || ''} [Verification note: ${note}]` : d.notes
    } : d))
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
        savePackagingProduct,
        submitStocktakeCount,
        resolveStocktakeVariance,
        packagingReconciliations,
        intermediatePreps,
        interStationTransfers,
        issuePackagingFromCentral,
        returnPackagingToCentral,
        performDailyPackagingReconciliation,
        createIntermediatePrep,
        allocatePrepToBatch,
        returnPrepToCentral,
        productionBatches,
        packagingQueue,
        packagingMaterialsDaily,
        kitchenTasks,
        createBatch,
        updateBatch,
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
        remitCodCash,
        markPickupCollected,
        verifyThirdPartyFee,
        activeAccountEmail,
        currentAccount,
        switchAccount,
        createAccount,
        updateAccount,
        deleteAccount,
        changePassword,
        addRiderProfile,
        availableAccounts: accounts,
        toasts,
        showToast,
        dismissToast,
        showSuccessModal,
        closeSuccessModal,
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
