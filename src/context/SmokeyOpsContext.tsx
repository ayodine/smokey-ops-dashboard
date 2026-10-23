import React, { createContext, useContext, useState, useMemo } from 'react'
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
  SEED_RAW_PRODUCTS,
  SEED_RAW_DELIVERIES,
  SEED_RAW_MOVEMENTS,
  SEED_RAW_USAGE,
  SEED_PACKAGING_PRODUCTS,
  SEED_PACKAGING_RECEIPTS_TOTALS,
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
} from '@/lib/smokeyData'
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
  prioritizeLotInKitchen: (data: { lotId: number; quantity: number; targetDishName: string; pitmasterName: string; shiftRemarks?: string }) => void
  saveRawProduct: (product: Partial<RawProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number; is_perishable?: boolean; expiry_date?: string }) => void
  receivePackaging: (data: { productId: number; quantity: number; unitCost: number }) => void
  adjustPackagingStock: (productId: number, delta: number, notes: string) => void
  savePackagingProduct: (product: Partial<PackagingProduct> & { name: string; sku: string; unit: string; unit_cost: number; reorder_level: number }) => void
  adjustSalesStock: (productId: number, delta: number, notes: string) => void
  saveSalesProduct: (product: Partial<SalesProduct> & { name: string; sku: string; unit: string; selling_price: number; unit_cost: number; reorder_level: number }) => void
  addSupplier: (supplier: Omit<Supplier, 'id' | 'supplier_ref' | 'delivery_count' | 'total_spend' | 'is_active'>) => void
  updateSupplier: (supplier: Supplier) => void
  submitStocktakeCount: (counts: Array<{ productId: number; physicalCount: number; category: 'raw' | 'packaging' | 'sales' }>, countedBy: string) => number
  resolveStocktakeVariance: (varianceId: number, supervisorNotes: string) => void

  // Production State
  productionBatches: ProductionBatch[]
  packagingQueue: PackagingQueueOrder[]
  packagingMaterialsDaily: PackagingMaterialDaily[]
  kitchenTasks: KitchenTask[]

  // Production Actions
  createBatch: (data: { outputProductId: number; outputProductName: string; expectedOutput: number; remarks?: string; rawMaterials: Array<{ product_id: number; sku: string; name: string; quantity: number; unit: string }> }) => void
  updateBatch: (batchId: number, data: Partial<ProductionBatch>) => void
  saveCustomRecipeTemplate: (template: Omit<RecipeTemplate, 'id'>) => void
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
  // Driver specific KYC fields
  vehicle_type?: string
  plate_number?: string
  license_number?: string
  license_expiry?: string
  cod_limit?: number
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
    email: 'Ayodine47@gmail.com',
    name: 'Ayodine Admin',
    role: 'admin',
    roleLabel: 'Super Admin',
    staff_id: 'SHD-ADM-001',
    assigned_hub: 'Yaba Head Office',
    department: 'Executive Operations',
    phone: '+234 803 111 2233',
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
    email: 'ops-team@smokeyhut.com',
    name: 'Smokey Ops Team',
    role: 'manager',
    roleLabel: 'Operations Manager',
    staff_id: 'SHD-OPS-002',
    assigned_hub: 'Yaba Head Office',
    department: 'Kitchen Operations',
    phone: '+234 802 345 6789',
    status: 'active',
    last_active: '14m ago',
    created_at: '15 Jan 2026',
    permissions: [
      'Batch Scheduling & Cook Approvals',
      'Variance Reconciliation',
      'Staff Shift Assignments',
      'Supplier Invoice Verification',
      'Waste & Spoilage Write-offs'
    ]
  },
  {
    email: 'Ridersmokeyyusuf@gmail.com',
    name: 'Rider Yusuf',
    role: 'rider',
    roleLabel: 'Delivery Rider',
    rider_user_id: 455,
    staff_id: 'SHD-LOG-455',
    assigned_hub: 'Yaba Head Office',
    department: 'Logistics',
    phone: '+234 814 902 3311',
    status: 'active',
    last_active: '35m ago',
    created_at: '01 Feb 2026',
    permissions: [
      'Accept & Transit Delivery',
      'Customer OTP Drop-off Sign-off',
      'COD Cash Collection',
      'Wallet & Payout History'
    ]
  },
  {
    email: 'chef.amara@smokeyhut.com',
    name: 'Chef Amara Okon',
    role: 'kitchen',
    roleLabel: 'Production Cook',
    staff_id: 'SHD-KTN-108',
    assigned_hub: 'Yaba Head Office',
    department: 'Culinary Production',
    phone: '+234 809 777 8899',
    status: 'active',
    last_active: '2h ago',
    created_at: '12 Feb 2026',
    permissions: [
      'Start & Complete Batches',
      'Raw Materials Depletion',
      'Portion Pack-out Logging',
      'Waste & Spoilage Incident Reports'
    ]
  },
  {
    email: 'kemi.inv@smokeyhut.com',
    name: 'Kemi Adebayo',
    role: 'inventory',
    roleLabel: 'Inventory Specialist',
    staff_id: 'SHD-INV-042',
    assigned_hub: 'Yaba Head Office',
    department: 'Procurement & Storage',
    phone: '+234 811 555 4422',
    status: 'active',
    last_active: 'Yesterday',
    created_at: '20 Feb 2026',
    permissions: [
      'Stock Intake PO Receipts',
      'Periodic Cycle Counts',
      'Packaging Unit Transfers',
      'Lot Expiry Monitoring'
    ]
  },
  {
    email: 'babajide.dispatch@smokeyhut.com',
    name: 'Babajide Alao',
    role: 'dispatcher',
    roleLabel: 'Logistics Coordinator',
    staff_id: 'SHD-DSP-019',
    assigned_hub: 'Yaba Head Office',
    department: 'Last-Mile Fulfillment',
    phone: '+234 806 333 9900',
    status: 'active',
    last_active: '1d ago',
    created_at: '05 Mar 2026',
    permissions: [
      'Dispatch Queue Assignment',
      'Rider Location & Route Tracking',
      'Third-party Courier Bookings',
      'COD Cash Remittance Check-in'
    ]
  }
]

const SmokeyOpsContext = createContext<SmokeyOpsContextType | undefined>(undefined)

export const SmokeyOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inventory Domain
  const [rawProducts, setRawProducts] = useState<RawProduct[]>(SEED_RAW_PRODUCTS)
  const [rawDeliveries, setRawDeliveries] = useState<RawDelivery[]>(SEED_RAW_DELIVERIES)
  const [rawMovements, setRawMovements] = useState<RawMovement[]>(SEED_RAW_MOVEMENTS)
  const [rawUsage] = useState<RawUsageItem[]>(SEED_RAW_USAGE)

  const [packagingProducts, setPackagingProducts] = useState<PackagingProduct[]>(SEED_PACKAGING_PRODUCTS)
  const [packagingReceiptsTotals, setPackagingReceiptsTotals] = useState<PackagingReceiptTotal[]>(SEED_PACKAGING_RECEIPTS_TOTALS)

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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch (e) {
        // fallback
      }
    }
    return APP_ACCOUNTS
  })

  const [activeAccountEmail, setActiveAccountEmail] = useState<string>(() => {
    return localStorage.getItem('smokey_active_account') || 'Ayodine47@gmail.com'
  })

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
    pitmasterName,
    shiftRemarks
  }: {
    lotId: number
    quantity: number
    targetDishName: string
    pitmasterName: string
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
      remarks: `[URGENT EXPIRING BATCH] Lot: ${lot.lot_number} (Exp: ${lot.expiry_date}). ${shiftRemarks || 'Smoke immediately on current shift to prevent food waste.'}`,
      created_by_name: pitmasterName || "Shift Pitmaster",
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
      message: `Lot ${lot.lot_number} has been allocated and sent directly to the kitchen smoker for immediate preparation.`,
      details: [
        { label: 'Batch Reference', value: batchRef },
        { label: 'Source Lot', value: `${lot.lot_number} (Exp: ${lot.expiry_date})` },
        { label: 'Target Finished Dish', value: targetDishName },
        { label: 'Quantity Prepped', value: `${actualQty} ${lot.unit}` },
        { label: 'Assigned Pitmaster', value: pitmasterName || 'Shift Pitmaster' },
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

    const newQty = p.stock_qty + quantity
    setPackagingProducts(prev => prev.map(item => item.id === productId ? { ...item, stock_qty: newQty, unit_cost: unitCost, inventory_value: newQty * unitCost } : item))

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
      const newQty = Math.max(0, p.stock_qty + delta)
      return { ...p, stock_qty: newQty, inventory_value: newQty * p.unit_cost }
    }))
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

  const saveSalesProduct = (product: Partial<SalesProduct> & { name: string; sku: string; unit: string; selling_price: number; unit_cost: number; reorder_level: number }) => {
    if (product.id) {
      setSalesProducts(prev => prev.map(p => p.id === product.id ? {
        ...p,
        ...product,
        inventory_value: p.stock_qty * product.unit_cost,
        qty_available: Math.max(0, p.stock_qty - (p.qty_allocated || 0))
      } : p))
    } else {
      const newProd: SalesProduct = {
        id: Date.now(),
        sku: product.sku,
        name: product.name,
        product_type: "sales",
        unit: product.unit,
        reorder_level: product.reorder_level,
        unit_cost: product.unit_cost,
        selling_price: product.selling_price,
        stock_qty: 0,
        qty_allocated: 0,
        qty_available: 0,
        inventory_value: 0,
        is_active: 1
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
      const newProd: PackagingProduct = {
        id: Date.now(),
        sku: product.sku,
        name: product.name,
        product_type: 'packaging',
        unit: product.unit,
        unit_cost: product.unit_cost,
        stock_qty: 0,
        qty_available: 0,
        qty_allocated: 0,
        reorder_level: product.reorder_level,
        inventory_value: 0,
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

  const createBatch = ({ outputProductId, outputProductName, expectedOutput, remarks, rawMaterials }: { outputProductId: number; outputProductName: string; expectedOutput: number; remarks?: string; rawMaterials: Array<{ product_id: number; sku: string; name: string; quantity: number; unit: string }> }) => {
    // 1. Deduct raw materials consumed
    rawMaterials.forEach(mat => {
      adjustRawStock(mat.product_id, -mat.quantity, `Batch allocation for ${outputProductName}`, "consumption")
    })

    const batchRef = `BAT-${String(productionBatches.length + 23).padStart(5, '0')}`
    const newBatch: ProductionBatch = {
      id: Date.now(),
      batch_ref: batchRef,
      output_product_id: outputProductId,
      output_product_name: outputProductName,
      expected_output: expectedOutput,
      actual_output: 0,
      wastage: 0,
      status: "draft",
      started_at: null,
      completed_at: null,
      remarks,
      created_by_name: "Shift Pitmaster",
      raw_materials: rawMaterials
    }
    setProductionBatches(prev => [newBatch, ...prev])

    showSuccessModal({
      title: 'Cooking Batch Created',
      message: `Recipe formulated for ${outputProductName}. Raw ingredients allocated from inventory.`,
      details: [
        { label: 'Batch Ref', value: batchRef },
        { label: 'Target Dish', value: outputProductName },
        { label: 'Expected Yield', value: `${expectedOutput} portions` },
        { label: 'Ingredients Used', value: `${rawMaterials.length} items` },
      ],
    })
    showToast(`Batch ${batchRef} created for ${outputProductName}`, 'success')
  }

  const startBatch = (batchId: number) => {
    setProductionBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: "in_production", started_at: new Date().toISOString().replace('T', ' ').substring(0, 19) } : b))
    showToast(`Batch cooking started`, 'info')
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

    // 2. Automatically INCREMENT stock in Sales Inventory!
    const targetSales = salesProducts.find(sp => sp.id === batch.output_product_id || sp.name.toLowerCase() === batch.output_product_name.toLowerCase())
    if (targetSales) {
      adjustSalesStock(targetSales.id, actualOutput, `Batch ${batch.batch_ref} yield deposit`)
    }

    showSuccessModal({
      title: 'Cooking Batch Completed',
      message: `Finished food has been credited to Sales Inventory and is ready for dispatch.`,
      details: [
        { label: 'Batch Ref', value: batch.batch_ref },
        { label: 'Finished Dish', value: batch.output_product_name },
        { label: 'Actual Yield', value: `+${actualOutput} portions` },
        { label: 'Cooking Loss', value: `${wastage} portions` },
      ],
    })
    showToast(`Batch ${batch.batch_ref} completed: +${actualOutput} portions deposited`, 'success')
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
    // 1. Deduct packaging stock
    materials.forEach(m => {
      const match = packagingProducts.find(p => p.name.toLowerCase() === m.packaging_name.toLowerCase())
      if (match) {
        adjustPackagingStock(match.id, -m.quantity, `Packaging order #${orderId}`)
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
    if (order.address.toLowerCase().includes('pickup') || order.delivery_fee === 0) {
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
      setStorePickups(prev => [newPickup, ...prev.filter(p => p.id !== order.id)])
    } else {
      // 3. Otherwise, transfer into Logistics Dispatch Queue (Awaiting Assignment)!
      const newDelivery: LogisticsDelivery = {
        id: Date.now(),
        delivery_ref: order.order_ref,
        order_id: order.id,
        order_ref: order.order_ref,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        delivery_fee: order.delivery_fee,
        booked_fee: null,
        rider_type: "internal",
        assigned_rider: "Unassigned",
        status: "pending",
        dispatch_date: new Date().toISOString().split('T')[0],
        pickup_at: null,
        delivered_at: null,
        fee_verify_status: "none",
        items_summary: order.items_summary,
        notes: `Packed by ${staffName}`
      }
      setLogisticsDeliveries(prev => [newDelivery, ...prev])
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
    showToast(`Order #${order.order_ref} sent to kitchen packaging queue`, 'success')
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
        salesProducts,
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
        productionBatches,
        packagingQueue,
        packagingMaterialsDaily,
        kitchenTasks,
        createBatch,
        updateBatch,
        saveCustomRecipeTemplate,
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
