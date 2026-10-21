// Smokey Hut Food Processing OS (FP Enterprise) - Real Operational Data
// Extracted and mapped from /Users/ayobamiolowookere/Documents/Smartmba/data/api

export interface RawProduct {
  id: number
  sku: string
  name: string
  product_type: 'raw'
  unit: string
  reorder_level: number
  unit_cost: number
  stock_qty: number // Total On-Hand
  qty_allocated: number // Reserved for in-production batches
  qty_available: number // stock_qty - qty_allocated
  qty_quarantine: number // Damaged / inspection
  inventory_value: number
  is_active: number
  is_perishable?: boolean
  fefo_lot?: string
  expiry_date?: string
}

export interface InventoryLot {
  id: number
  product_id: number
  product_name: string
  sku: string
  lot_number: string
  supplier_name: string
  initial_qty: number
  remaining_qty: number
  unit: string
  unit_cost: number
  received_date: string
  expiry_date: string
  days_to_expiry: number
  status: 'active' | 'near_expiry' | 'expired'
}

export interface RecipeIngredientItem {
  raw_product_id: number
  sku: string
  name: string
  standard_qty_per_unit: number
  unit: string
}

export interface RecipeTemplate {
  id: number
  output_product_id: number
  output_product_name: string
  version_name: string
  standard_batch_size: number
  standard_yield_percent: number
  unit: string
  allowed_variance_pct: number
  ingredients: RecipeIngredientItem[]
}

export interface StocktakeVariance {
  id: number
  product_id: number
  product_name: string
  sku: string
  category: 'raw' | 'packaging' | 'sales'
  unit: string
  unit_cost: number
  digital_count: number
  physical_count: number
  variance_qty: number
  variance_value: number
  date: string
  counted_by: string
  status: 'pending_review' | 'reconciled'
  supervisor_notes?: string
}

export interface RawDelivery {
  id: number
  delivery_ref: string
  supplier_id: number
  supplier_name: string
  product_id: number
  product_name: string
  sku: string
  quantity: number
  unit: string
  unit_cost: number
  value_amount: number
  date_received: string
  user_name: string
  notes?: string
  lot_number?: string
  expiry_date?: string
}

export interface RawMovement {
  id: number
  product_id: number
  product_name: string
  sku: string
  unit: string
  location: string
  movement_type: 'consumption' | 'waste' | 'adjustment' | 'transfer'
  quantity: number
  unit_cost: number
  value_amount: number
  balance_after: number
  notes: string
  created_at: string
  user_name: string
}

export interface RawUsageItem {
  product_id: number
  product_name: string
  sku: string
  unit: string
  unit_cost: number
  total_used: number
  total_value: number
}

export interface PackagingProduct {
  id: number
  sku: string
  name: string
  product_type: 'packaging'
  unit: string
  reorder_level: number
  unit_cost: number
  stock_qty: number // Total On-Hand
  qty_allocated: number // Reserved for packaging queue orders
  qty_available: number // stock_qty - qty_allocated
  inventory_value: number
  is_active: number
}

export interface PackagingReceiptTotal {
  product_id: number
  product_name: string
  sku: string
  unit: string
  total_qty: number
  avg_unit_cost: number
  total_value: number
  receipt_count: number
  last_received: string
}

export interface SalesProduct {
  id: number
  sku: string
  name: string
  product_type: 'sales'
  unit: string
  reorder_level: number
  unit_cost: number
  selling_price: number
  stock_qty: number // Total On-Hand
  qty_allocated: number // Reserved for orders in packaging/dispatch
  qty_available: number // stock_qty - qty_allocated
  inventory_value: number
  is_active: number
}

export interface DailySalesItem {
  product_id: number
  product_name: string
  sku: string
  unit: string
  qty_sold: number
  sale_count: number
  order_count: number
  total_value: number
  channel_breakdown: string
}

export interface SalesMovement {
  id: number
  product_id: number
  product_name: string
  sku: string
  unit: string
  location: 'sales' | 'finished'
  movement_type: 'production_output' | 'sale' | 'adjustment' | 'waste' | 'reversal'
  quantity: number
  unit_cost: number
  value_amount: number
  balance_after: number
  notes: string
  created_at: string
  user_name: string
}

export interface Supplier {
  id: number
  supplier_ref: string
  name: string
  phone: string
  email: string
  address: string
  category: string
  delivery_count: number
  total_spend: number
  is_active: number
}

export interface RawMaterialBOM {
  product_id: number
  sku: string
  name: string
  quantity: number
  unit: string
}

export interface ProductionBatch {
  id: number
  batch_ref: string
  output_product_id: number
  output_product_name: string
  expected_output: number
  actual_output: number
  wastage: number
  status: 'draft' | 'in_production' | 'completed' | 'cancelled'
  started_at: string | null
  completed_at: string | null
  remarks?: string
  created_by_name: string
  raw_materials: RawMaterialBOM[]
  recipe_template_id?: number
  variance_pct?: number
  supervisor_override_note?: string
}

export interface PackagingQueueOrder {
  id: number
  order_ref: string
  customer_name: string
  phone: string
  address: string
  total_amount: number
  delivery_fee: number
  delivery_mode: 'instant' | 'scheduled'
  payment_status: 'paid' | 'pending'
  order_status: 'ready_for_fulfillment' | 'in_packaging' | 'packaged'
  items_summary: string
  items: Array<{ product_name: string; quantity: number; unit_price: number; line_total: number }>
  packaging_materials_picked?: Array<{ packaging_name: string; quantity: number }>
  packaged_at?: string | null
  packaged_by_name?: string | null
  created_at: string
}

export interface PackagingMaterialDaily {
  product_id: number
  product_name: string
  sku: string
  unit: string
  total_consumed: number
  total_orders: number
}

export interface KitchenTask {
  id: number
  task_ref: string
  title: string
  description: string
  assignee_name: string
  due_date: string
  priority: 'high' | 'normal' | 'low'
  status: 'pending' | 'in_progress' | 'done'
}

export interface LogisticsDelivery {
  id: number
  delivery_ref: string
  order_id: number
  order_ref: string
  customer_name: string
  phone: string
  address: string
  delivery_fee: number
  total_amount?: number
  booked_fee?: number | null
  rider_type: 'internal' | 'third_party'
  assigned_rider: string
  assigned_rider_id?: number
  third_party_provider?: string | null
  status: 'pending' | 'assigned' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled'
  dispatch_date: string
  pickup_at: string | null
  delivered_at: string | null
  fee_verify_status: 'none' | 'pending' | 'approved' | 'flagged'
  fee_evidence_path?: string | null
  payment_mode?: 'online' | 'cod'
  cod_amount?: number
  items_summary: string
  notes?: string
  decline_reason?: string
}

export interface ScheduledOrder {
  id: number
  order_ref: string
  customer_name: string
  phone: string
  address: string
  total_amount: number
  delivery_fee: number
  scheduled_delivery_at: string
  payment_status: 'paid' | 'pending'
  order_status: 'payment_confirmed' | 'in_queue' | 'dispatched'
  notes: string
  can_start_schedule: boolean
}

export interface RiderPayout {
  rider_user_id: number
  rider_name: string
  phone: string
  active_assignments: number
  today_trips: number
  deliveries_today?: number
  deliveries_week?: number
  deliveries_month?: number
  total_completed?: number // Lifetime completed deliveries (e.g. 362)
  earnings_today: number
  earnings_week: number
  earnings_month: number
  pending_payout: number // Delivery commissions accrued
  cod_cash_collected: number // Cash held by rider from COD deliveries
  cod_remitted_total: number // Total physical cash remitted to cashier
  net_balance: number // pending_payout - cod_cash_collected
  paid_total: number
  lifetime_earnings: number
  status: 'active' | 'on_trip' | 'offline'
  // Profile & KYC Fields (Operations Spec 5.1 & 5.2)
  email?: string
  staff_id?: string
  vehicle_type?: string
  plate_number?: string
  operating_hub?: string
  license_number?: string
  license_expiry?: string
  emergency_contact?: string
  emergency_phone?: string
  national_id_nin?: string
  rating?: number
  on_time_rate?: number
  cod_limit?: number
  date_joined?: string
}

export interface RiderTask {
  id: number
  task_ref: string // e.g. "TSK-0012"
  title: string
  description?: string
  assignee_name: string
  assignee_id?: number
  due_date: string
  priority: 'low' | 'normal' | 'urgent'
  status: 'pending' | 'in_progress' | 'done'
}

export interface StorePickupOrder {
  id: number
  order_ref: string
  customer_name: string
  phone: string
  address: string
  total_amount: number
  payment_status: 'paid' | 'pending'
  order_status: 'ready_for_pickup' | 'collected'
  packaged_at: string
  collected_at: string | null
  collected_by: string | null
  handover_staff: string | null
  collector_phone?: string | null
  items_summary: string
}

export interface ThirdPartyWeeklySummary {
  week_start: string
  week_end: string
  label: string
  delivery_count: number
  order_fees: number
  booked_fees: number
  net: number
  loss_count: number
  gain_count: number
  even_count: number
}

// -------------------------------------------------------------
// ZERO-TOUCH MENU-TO-PACKAGING SKU MAPPING RULES (Section 10.1)
// -------------------------------------------------------------
export const ZERO_TOUCH_PACKAGING_RULES: Record<string, Array<{ packaging_name: string; quantity: number }>> = {
  "Full Smokey Guineafowl": [
    { packaging_name: "BRANDED POLYBAG", quantity: 1 },
    { packaging_name: "HEAVY DUTY FOIL WRAP", quantity: 1 }
  ],
  "Full Smokey Guineafowl (Chopped)": [
    { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 1 },
    { packaging_name: "BRANDED POLYBAG", quantity: 1 },
    { packaging_name: "TAMPER-EVIDENT SECURITY SEALS", quantity: 1 }
  ],
  "1 Liter Bowl Guineafowl Rice": [
    { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 1 },
    { packaging_name: "BRANDED POLYBAG", quantity: 1 },
    { packaging_name: "TAMPER-EVIDENT SECURITY SEALS", quantity: 1 }
  ],
  "Travel Standard Dry Guineafowl": [
    { packaging_name: "VACUUM SEAL POUCHES (20x30CM)", quantity: 1 },
    { packaging_name: "BIG BRANDED BAG", quantity: 1 }
  ],
  "Smokey Beef Jerkey (Kilishi)": [
    { packaging_name: "VACUUM SEAL POUCHES (20x30CM)", quantity: 1 }
  ],
  "Smokey Jumbo Turkey Wings (Pair)": [
    { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 1 },
    { packaging_name: "BRANDED POLYBAG", quantity: 1 }
  ],
  "Charcoal Roasted Whole Catfish (Family)": [
    { packaging_name: "HEAVY DUTY FOIL WRAP", quantity: 2 },
    { packaging_name: "BIGGEST BRANDED NYLON", quantity: 1 }
  ],
  "Extra Bag": [
    { packaging_name: "BIG BRANDED BAG", quantity: 1 }
  ]
}

export function getSuggestedPackaging(items: Array<{ product_name: string; quantity: number }>): Array<{ packaging_name: string; quantity: number }> {
  const aggregated: Record<string, number> = {}
  items.forEach(item => {
    const key = Object.keys(ZERO_TOUCH_PACKAGING_RULES).find(k => item.product_name.toLowerCase().includes(k.toLowerCase()))
    if (key) {
      ZERO_TOUCH_PACKAGING_RULES[key].forEach(rule => {
        aggregated[rule.packaging_name] = (aggregated[rule.packaging_name] || 0) + (rule.quantity * item.quantity)
      })
    } else {
      aggregated["BRANDED POLYBAG"] = (aggregated["BRANDED POLYBAG"] || 0) + item.quantity
    }
  })
  return Object.entries(aggregated).map(([packaging_name, quantity]) => ({ packaging_name, quantity }))
}

// -------------------------------------------------------------
// STANDARD RECIPE TEMPLATES (BOM PRESETS - Section 9.2)
// -------------------------------------------------------------
export const SEED_RECIPE_TEMPLATES: RecipeTemplate[] = [
  {
    id: 1,
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    version_name: "Standard Smokery Run (Batch 50)",
    standard_batch_size: 50,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", standard_qty_per_unit: 0.02, unit: "PACK" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.08, unit: "BUNDLE" },
    ]
  },
  {
    id: 2,
    output_product_id: 44,
    output_product_name: "1 Liter Bowl Guineafowl Rice",
    version_name: "Kitchen Jollof Lunch Run (Batch 40)",
    standard_batch_size: 40,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", standard_qty_per_unit: 0.5, unit: "PIECES" },
      { raw_product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", standard_qty_per_unit: 0.075, unit: "LITRE" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", standard_qty_per_unit: 0.0375, unit: "PACK" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
    ]
  },
  {
    id: 3,
    output_product_id: 56,
    output_product_name: "Smokey Jumbo Turkey Wings (Pair)",
    version_name: "Crispy Glaze Wings Run (Batch 20)",
    standard_batch_size: 20,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 70, sku: "SKU-00036", name: "JUMBO TURKEY WINGS", standard_qty_per_unit: 0.75, unit: "KG" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 74, sku: "SKU-00040", name: "HICKORY WOOD CHIPS", standard_qty_per_unit: 0.075, unit: "SACK" },
    ]
  },
  {
    id: 4,
    output_product_id: 57,
    output_product_name: "Charcoal Roasted Whole Catfish (Family)",
    version_name: "Whole Catfish Grill Run (Batch 15)",
    standard_batch_size: 15,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 64, sku: "SKU-00030", name: "FRESH CATFISH", standard_qty_per_unit: 1.0, unit: "KG" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.08, unit: "KG" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.133, unit: "BUNDLE" },
    ]
  },
  {
    id: 5,
    output_product_id: 48,
    output_product_name: "Smokey Beef Jerkey (Kilishi)",
    version_name: "Dehydrator Dehydrated Slice Run (Batch 30)",
    standard_batch_size: 30,
    standard_yield_percent: 95,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 71, sku: "SKU-00037", name: "BEEF BRISKET CUT (PRIME)", standard_qty_per_unit: 0.667, unit: "KG" },
      { raw_product_id: 73, sku: "SKU-00039", name: "CRUSHED HABANERO FLAKES", standard_qty_per_unit: 0.067, unit: "KG" },
      { raw_product_id: 74, sku: "SKU-00040", name: "HICKORY WOOD CHIPS", standard_qty_per_unit: 0.033, unit: "SACK" },
    ]
  }
]

// -------------------------------------------------------------
// FEFO LOT TRACKING DATASETS (Section 9.3)
// -------------------------------------------------------------
export const SEED_INVENTORY_LOTS: InventoryLot[] = [
  { id: 1, product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", lot_number: "LOT-GNF-0924A", supplier_name: "MADAM POULTRY CO.", initial_qty: 100, remaining_qty: 52, unit: "PIECES", unit_cost: 6500, received_date: "2026-09-24", expiry_date: "2026-09-28", days_to_expiry: 3, status: "near_expiry" },
  { id: 2, product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", lot_number: "LOT-GNF-0926B", supplier_name: "MADAM POULTRY CO.", initial_qty: 50, remaining_qty: 20, unit: "PIECES", unit_cost: 6500, received_date: "2026-09-26", expiry_date: "2026-10-04", days_to_expiry: 9, status: "active" },
  { id: 3, product_id: 64, product_name: "FRESH CATFISH", sku: "SKU-00030", lot_number: "LOT-CAT-0925A", supplier_name: "LOCAL MARKET AGRO", initial_qty: 60, remaining_qty: 48, unit: "KG", unit_cost: 4500, received_date: "2026-09-25", expiry_date: "2026-09-29", days_to_expiry: 4, status: "near_expiry" },
  { id: 4, product_id: 70, product_name: "JUMBO TURKEY WINGS", sku: "SKU-00036", lot_number: "LOT-TRK-0924C", supplier_name: "MADAM POULTRY CO.", initial_qty: 50, remaining_qty: 45, unit: "KG", unit_cost: 7200, received_date: "2026-09-24", expiry_date: "2026-10-06", days_to_expiry: 11, status: "active" },
  { id: 5, product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", lot_number: "LOT-BRS-0925B", supplier_name: "MADAM POULTRY CO.", initial_qty: 60, remaining_qty: 54, unit: "KG", unit_cost: 8500, received_date: "2026-09-25", expiry_date: "2026-10-08", days_to_expiry: 13, status: "active" },
]

// -------------------------------------------------------------
// STOCKTAKE VARIANCE ESCROW DATASETS (Section 9.4)
// -------------------------------------------------------------
export const SEED_STOCKTAKE_VARIANCES: StocktakeVariance[] = [
  { id: 1, product_id: 53, product_name: "DRY PEPPER", sku: "SKU-00019", category: "raw", unit: "KG", unit_cost: 3300, digital_count: 17.5, physical_count: 16.0, variance_qty: -1.5, variance_value: -4950, date: "2026-09-24", counted_by: "Chioma Okonkwo", status: "pending_review", supervisor_notes: "Minor spill variance during spice blending" },
  { id: 2, product_id: 95, product_name: "BRANDED POLYBAG", sku: "PCK006", category: "packaging", unit: "PCS", unit_cost: 105, digital_count: 520, physical_count: 508, variance_qty: -12, variance_value: -1260, date: "2026-09-24", counted_by: "Emeka Nwosu", status: "reconciled", supervisor_notes: "Damaged packing seals written off" },
]

// -------------------------------------------------------------
// SEED DATASETS (AUTHENTIC SMOKEY HUT DATA)
// -------------------------------------------------------------

export const SEED_RAW_PRODUCTS: RawProduct[] = [
  { id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", product_type: "raw", unit: "PIECES", reorder_level: 50, unit_cost: 6500, stock_qty: 72, qty_allocated: 20, qty_available: 52, qty_quarantine: 0, inventory_value: 468000, is_active: 1, is_perishable: true, fefo_lot: "LOT-GNF-0924A", expiry_date: "2026-09-28" },
  { id: 65, sku: "SKU-00031", name: "FRESH KING-SIZE GUINEAFOWL", product_type: "raw", unit: "PIECES", reorder_level: 25, unit_cost: 12000, stock_qty: 39, qty_allocated: 0, qty_available: 39, qty_quarantine: 0, inventory_value: 468000, is_active: 1, is_perishable: true, fefo_lot: "LOT-GNF-0926B", expiry_date: "2026-10-04" },
  { id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", product_type: "raw", unit: "PIECES", reorder_level: 30, unit_cost: 6500, stock_qty: 31, qty_allocated: 15, qty_available: 16, qty_quarantine: 0, inventory_value: 201500, is_active: 1, is_perishable: true, fefo_lot: "LOT-CHK-0925A", expiry_date: "2026-09-30" },
  { id: 66, sku: "SKU-00032", name: "FRESH TURKEY", product_type: "raw", unit: "PIECES", reorder_level: 20, unit_cost: 9500, stock_qty: 18, qty_allocated: 0, qty_available: 18, qty_quarantine: 0, inventory_value: 171000, is_active: 1, is_perishable: true, fefo_lot: "LOT-TRK-0923A", expiry_date: "2026-10-02" },
  { id: 70, sku: "SKU-00036", name: "JUMBO TURKEY WINGS", product_type: "raw", unit: "KG", reorder_level: 25, unit_cost: 7200, stock_qty: 45, qty_allocated: 15, qty_available: 30, qty_quarantine: 0, inventory_value: 324000, is_active: 1, is_perishable: true, fefo_lot: "LOT-TRK-0924C", expiry_date: "2026-10-06" },
  { id: 64, sku: "SKU-00030", name: "FRESH CATFISH", product_type: "raw", unit: "KG", reorder_level: 40, unit_cost: 4500, stock_qty: 48, qty_allocated: 0, qty_available: 48, qty_quarantine: 0, inventory_value: 216000, is_active: 1, is_perishable: true, fefo_lot: "LOT-CAT-0925A", expiry_date: "2026-09-29" },
  { id: 71, sku: "SKU-00037", name: "BEEF BRISKET CUT (PRIME)", product_type: "raw", unit: "KG", reorder_level: 30, unit_cost: 8500, stock_qty: 54, qty_allocated: 0, qty_available: 54, qty_quarantine: 0, inventory_value: 459000, is_active: 1, is_perishable: true, fefo_lot: "LOT-BRS-0925B", expiry_date: "2026-10-08" },
  { id: 72, sku: "SKU-00038", name: "GOAT MEAT (CHEVON CUT)", product_type: "raw", unit: "KG", reorder_level: 20, unit_cost: 9200, stock_qty: 36, qty_allocated: 0, qty_available: 36, qty_quarantine: 0, inventory_value: 331200, is_active: 1, is_perishable: true, fefo_lot: "LOT-GTM-0924A", expiry_date: "2026-10-05" },
  { id: 53, sku: "SKU-00019", name: "DRY PEPPER", product_type: "raw", unit: "KG", reorder_level: 10, unit_cost: 3300, stock_qty: 16, qty_allocated: 2.5, qty_available: 13.5, qty_quarantine: 0, inventory_value: 52800, is_active: 1 },
  { id: 73, sku: "SKU-00039", name: "CRUSHED HABANERO FLAKES", product_type: "raw", unit: "KG", reorder_level: 12, unit_cost: 4100, stock_qty: 22, qty_allocated: 0, qty_available: 22, qty_quarantine: 0, inventory_value: 90200, is_active: 1 },
  { id: 52, sku: "SKU-00018", name: "FIREWOOD", product_type: "raw", unit: "BUNDLE", reorder_level: 15, unit_cost: 570, stock_qty: 24, qty_allocated: 4, qty_available: 20, qty_quarantine: 0, inventory_value: 13680, is_active: 1 },
  { id: 74, sku: "SKU-00040", name: "HICKORY WOOD CHIPS", product_type: "raw", unit: "SACK", reorder_level: 10, unit_cost: 3800, stock_qty: 15, qty_allocated: 1.5, qty_available: 13.5, qty_quarantine: 0, inventory_value: 57000, is_active: 1 },
  { id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", product_type: "raw", unit: "PACK", reorder_level: 10, unit_cost: 19900, stock_qty: 8, qty_allocated: 1.5, qty_available: 6.5, qty_quarantine: 0, inventory_value: 159200, is_active: 1 },
  { id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", product_type: "raw", unit: "LITRE", reorder_level: 20, unit_cost: 2264, stock_qty: 35, qty_allocated: 3, qty_available: 32, qty_quarantine: 0, inventory_value: 79240, is_active: 1 },
  { id: 68, sku: "SKU-00034", name: "CINNAMON STICK", product_type: "raw", unit: "PACK", reorder_level: 10, unit_cost: 500, stock_qty: 1, qty_allocated: 0, qty_available: 1, qty_quarantine: 0, inventory_value: 500, is_active: 1 },
  { id: 69, sku: "SKU-00035", name: "CLOVE", product_type: "raw", unit: "CUP", reorder_level: 5, unit_cost: 1800, stock_qty: 0, qty_allocated: 0, qty_available: 0, qty_quarantine: 0, inventory_value: 0, is_active: 1 },
  { id: 58, sku: "SKU-00024", name: "SEASONING CUBES", product_type: "raw", unit: "CARTON", reorder_level: 5, unit_cost: 14500, stock_qty: 6, qty_allocated: 0, qty_available: 6, qty_quarantine: 0, inventory_value: 87000, is_active: 1 },
  { id: 59, sku: "SKU-00025", name: "IODIZED SALT", product_type: "raw", unit: "BAG", reorder_level: 3, unit_cost: 8200, stock_qty: 4, qty_allocated: 0, qty_available: 4, qty_quarantine: 0, inventory_value: 32800, is_active: 1 },
]

export const SEED_RAW_DELIVERIES: RawDelivery[] = [
  { id: 72, delivery_ref: "RCV-00066", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 70, product_name: "JUMBO TURKEY WINGS", sku: "SKU-00036", quantity: 50, unit: "KG", unit_cost: 7200, value_amount: 360000, date_received: "2026-09-24", user_name: "OPERATION MANAGER", notes: "Fresh consignment checked for weight" },
  { id: 71, delivery_ref: "RCV-00065", supplier_id: 3, supplier_name: "LOCAL MARKET AGRO", product_id: 73, product_name: "CRUSHED HABANERO FLAKES", sku: "SKU-00039", quantity: 25, unit: "KG", unit_cost: 4100, value_amount: 102500, date_received: "2026-09-22", user_name: "Admin", notes: "Extra hot batch for suya seasoning" },
  { id: 70, delivery_ref: "RCV-00064", supplier_id: 6, supplier_name: "HARDWOOD LOGISTICS", product_id: 74, product_name: "HICKORY WOOD CHIPS", sku: "SKU-00040", quantity: 20, unit: "SACK", unit_cost: 3800, value_amount: 76000, date_received: "2026-09-20", user_name: "Pitmaster Babajide", notes: "Aromatic smoke wood for smokers" },
  { id: 69, delivery_ref: "RCV-00063", supplier_id: 3, supplier_name: "LOCAL MARKET AGRO", product_id: 68, product_name: "CINNAMON STICK", sku: "SKU-00034", quantity: 1, unit: "PACK", unit_cost: 500, value_amount: 500, date_received: "2026-09-07", user_name: "Admin", notes: "Emergency spice top-up" },
  { id: 68, delivery_ref: "RCV-00062", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 54, product_name: "SPICIES", sku: "SKU-00020", quantity: 5, unit: "PACK", unit_cost: 19900, value_amount: 99500, date_received: "2026-09-04", user_name: "OPERATION MANAGER", notes: "Standard monthly batch" },
  { id: 67, delivery_ref: "RCV-00061", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 65, product_name: "FRESH KING-SIZE GUINEAFOWL", sku: "SKU-00031", quantity: 26, unit: "PIECES", unit_cost: 12000, value_amount: 312000, date_received: "2026-09-04", user_name: "OPERATION MANAGER", notes: "Quality checked on arrival" },
  { id: 66, delivery_ref: "RCV-00060", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", quantity: 100, unit: "PIECES", unit_cost: 6500, value_amount: 650000, date_received: "2026-09-02", user_name: "OPERATION MANAGER", notes: "Live poultry processing" },
  { id: 65, delivery_ref: "RCV-00059", supplier_id: 6, supplier_name: "HARDWOOD LOGISTICS", product_id: 52, product_name: "FIREWOOD", sku: "SKU-00018", quantity: 50, unit: "BUNDLE", unit_cost: 570, value_amount: 28500, date_received: "2026-09-01", user_name: "OPERATION MANAGER", notes: "Kiln-dried oak logs" },
]

export const SEED_RAW_MOVEMENTS: RawMovement[] = [
  { id: 5755, product_id: 70, product_name: "JUMBO TURKEY WINGS", sku: "SKU-00036", unit: "KG", location: "raw", movement_type: "consumption", quantity: -15, unit_cost: 7200, value_amount: 108000, balance_after: 45, notes: "Consumed for Batch BAT-00023 (Turkey Wings)", created_at: "2026-09-25 09:30:00", user_name: "OPERATION MANAGER" },
  { id: 5754, product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", unit: "KG", location: "raw", movement_type: "consumption", quantity: -20, unit_cost: 8500, value_amount: 170000, balance_after: 54, notes: "Consumed for Kilishi Slicing Batch BAT-00021", created_at: "2026-09-25 08:20:00", user_name: "Babajide 'Pitmaster'" },
  { id: 5753, product_id: 74, product_name: "HICKORY WOOD CHIPS", sku: "SKU-00040", unit: "SACK", location: "raw", movement_type: "consumption", quantity: -3, unit_cost: 3800, value_amount: 11400, balance_after: 15, notes: "Smoker Pit #2 weekend prep", created_at: "2026-09-24 14:10:00", user_name: "Pitmaster Babajide" },
  { id: 5752, product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", unit: "PIECES", location: "raw", movement_type: "consumption", quantity: -20, unit_cost: 6500, value_amount: 130000, balance_after: 72, notes: "Consumed for Batch BAT-00020", created_at: "2026-09-09 19:55:05", user_name: "OPERATION MANAGER" },
  { id: 5751, product_id: 65, product_name: "FRESH KING-SIZE GUINEAFOWL", sku: "SKU-00031", unit: "PIECES", location: "raw", movement_type: "consumption", quantity: -10, unit_cost: 12000, value_amount: 120000, balance_after: 39, notes: "Consumed for Batch BAT-00019", created_at: "2026-09-09 19:51:39", user_name: "OPERATION MANAGER" },
  { id: 5750, product_id: 63, product_name: "FRESH CHICKEN", sku: "SKU-00029", unit: "PIECES", location: "raw", movement_type: "adjustment", quantity: -5, unit_cost: 6500, value_amount: 32500, balance_after: 31, notes: "Defrosting shrinkage audit", created_at: "2026-09-09 19:50:51", user_name: "OPERATION MANAGER" },
  { id: 5749, product_id: 52, product_name: "FIREWOOD", sku: "SKU-00018", unit: "BUNDLE", location: "raw", movement_type: "consumption", quantity: -8, unit_cost: 570, value_amount: 4560, balance_after: 24, notes: "Smoker Pit #1 fueling", created_at: "2026-09-08 08:30:12", user_name: "Pitmaster Babajide" },
]

export const SEED_RAW_USAGE: RawUsageItem[] = [
  { product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", unit: "PIECES", unit_cost: 6500, total_used: 971.97, total_value: 6317831 },
  { product_id: 63, product_name: "FRESH CHICKEN", sku: "SKU-00029", unit: "PIECES", unit_cost: 6500, total_used: 189.0, total_value: 1228500 },
  { product_id: 52, product_name: "FIREWOOD", sku: "SKU-00018", unit: "BUNDLE", unit_cost: 570, total_used: 44.0, total_value: 25080 },
  { product_id: 65, product_name: "FRESH KING-SIZE GUINEAFOWL", sku: "SKU-00031", unit: "PIECES", unit_cost: 12000, total_used: 10.0, total_value: 120000 },
  { product_id: 54, product_name: "SPICIES", sku: "SKU-00020", unit: "PACK", unit_cost: 19900, total_used: 5.0, total_value: 99500 },
  { product_id: 55, product_name: "VEGETABLE OIL", sku: "SKU-00021", unit: "LITRE", unit_cost: 2264, total_used: 5.0, total_value: 11320 },
]

export const SEED_PACKAGING_PRODUCTS: PackagingProduct[] = [
  { id: 93, sku: "PCK004", name: "BIG BRANDED BAG", product_type: "packaging", unit: "PIECES", reorder_level: 500, unit_cost: 420, stock_qty: 8, qty_allocated: 2, qty_available: 6, inventory_value: 3360, is_active: 1 },
  { id: 109, sku: "SKU-00075", name: "BIGGEST BRANDED NYLON", product_type: "packaging", unit: "PCS", reorder_level: 50, unit_cost: 150, stock_qty: 7, qty_allocated: 0, qty_available: 7, inventory_value: 1050, is_active: 1 },
  { id: 95, sku: "PCK006", name: "BRANDED POLYBAG", product_type: "packaging", unit: "PCS", reorder_level: 500, unit_cost: 105, stock_qty: 508, qty_allocated: 15, qty_available: 493, inventory_value: 53340, is_active: 1 },
  { id: 110, sku: "SKU-00076", name: "MEDIUM POLY BAG", product_type: "packaging", unit: "PCS", reorder_level: 100, unit_cost: 95, stock_qty: 320, qty_allocated: 0, qty_available: 320, inventory_value: 30400, is_active: 1 },
  { id: 96, sku: "PCK007", name: "1 LITER FOOD BOWL & LID", product_type: "packaging", unit: "SETS", reorder_level: 200, unit_cost: 280, stock_qty: 185, qty_allocated: 20, qty_available: 165, inventory_value: 51800, is_active: 1 },
  { id: 111, sku: "PCK010", name: "500ML SAUCE CUPS & CAPS", product_type: "packaging", unit: "SETS", reorder_level: 300, unit_cost: 65, stock_qty: 450, qty_allocated: 0, qty_available: 450, inventory_value: 29250, is_active: 1 },
  { id: 97, sku: "PCK008", name: "HEAVY DUTY FOIL WRAP", product_type: "packaging", unit: "ROLLS", reorder_level: 20, unit_cost: 3200, stock_qty: 14, qty_allocated: 2, qty_available: 12, inventory_value: 44800, is_active: 1 },
  { id: 112, sku: "PCK011", name: "VACUUM SEAL POUCHES (20x30CM)", product_type: "packaging", unit: "PCS", reorder_level: 250, unit_cost: 120, stock_qty: 380, qty_allocated: 10, qty_available: 370, inventory_value: 45600, is_active: 1 },
  { id: 113, sku: "PCK012", name: "TAMPER-EVIDENT SECURITY SEALS", product_type: "packaging", unit: "ROLLS", reorder_level: 25, unit_cost: 1400, stock_qty: 40, qty_allocated: 2, qty_available: 38, inventory_value: 56000, is_active: 1 },
  { id: 98, sku: "PCK009", name: "THERMAL DISPATCH LABELS", product_type: "packaging", unit: "ROLLS", reorder_level: 15, unit_cost: 1650, stock_qty: 22, qty_allocated: 1, qty_available: 21, inventory_value: 36300, is_active: 1 },
]

export const SEED_PACKAGING_RECEIPTS_TOTALS: PackagingReceiptTotal[] = [
  { product_id: 93, product_name: "BIG BRANDED BAG", sku: "PCK004", unit: "PIECES", total_qty: 2500, avg_unit_cost: 420, total_value: 1050000, receipt_count: 5, last_received: "2026-09-12" },
  { product_id: 95, product_name: "BRANDED POLYBAG", sku: "PCK006", unit: "PCS", total_qty: 10000, avg_unit_cost: 105, total_value: 1050000, receipt_count: 4, last_received: "2026-09-15" },
  { product_id: 96, product_name: "1 LITER FOOD BOWL & LID", sku: "PCK007", unit: "SETS", total_qty: 3000, avg_unit_cost: 280, total_value: 840000, receipt_count: 6, last_received: "2026-09-20" },
  { product_id: 112, product_name: "VACUUM SEAL POUCHES (20x30CM)", sku: "PCK011", unit: "PCS", total_qty: 2000, avg_unit_cost: 120, total_value: 240000, receipt_count: 2, last_received: "2026-09-22" },
  { product_id: 97, product_name: "HEAVY DUTY FOIL WRAP", sku: "PCK008", unit: "ROLLS", total_qty: 50, avg_unit_cost: 3200, total_value: 160000, receipt_count: 3, last_received: "2026-09-18" },
]

export const SEED_SALES_PRODUCTS: SalesProduct[] = [
  { id: 38, sku: "WEB-FULL-SMOKEY-GUINEAFOWL", name: "Full Smokey Guineafowl", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 6500, selling_price: 12500, stock_qty: 64, qty_allocated: 5, qty_available: 59, inventory_value: 416000, is_active: 1 },
  { id: 39, sku: "WEB-FULL-SMOKEY-GUINEAFOWL-CHOP", name: "Full Smokey Guineafowl (Chopped)", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 6500, selling_price: 12500, stock_qty: 28, qty_allocated: 2, qty_available: 26, inventory_value: 182000, is_active: 1 },
  { id: 44, sku: "WEB-1-LITER-BOWL-GUINEAFOWL", name: "1 Liter Bowl Guineafowl Rice", product_type: "sales", unit: "unit", reorder_level: 50, unit_cost: 9500, selling_price: 22000, stock_qty: 50, qty_allocated: 4, qty_available: 46, inventory_value: 475000, is_active: 1 },
  { id: 40, sku: "WEB-TRAVEL-STANDARD-DRY-GUIN", name: "Travel Standard Dry Guineafowl", product_type: "sales", unit: "unit", reorder_level: 25, unit_cost: 7000, selling_price: 13000, stock_qty: 42, qty_allocated: 0, qty_available: 42, inventory_value: 294000, is_active: 1 },
  { id: 48, sku: "WEB-SMOKEY-BEEF-JERKEY-KILISHI", name: "Smokey Beef Jerkey (Kilishi) 125g", product_type: "sales", unit: "unit", reorder_level: 30, unit_cost: 2500, selling_price: 5500, stock_qty: 85, qty_allocated: 4, qty_available: 81, inventory_value: 212500, is_active: 1 },
  { id: 56, sku: "WEB-JUMBO-TURKEY-WINGS-PAIR", name: "Smokey Jumbo Turkey Wings (Pair)", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 7500, selling_price: 14500, stock_qty: 32, qty_allocated: 0, qty_available: 32, inventory_value: 240000, is_active: 1 },
  { id: 57, sku: "WEB-ROASTED-CATFISH-FAMILY", name: "Charcoal Roasted Whole Catfish (Family)", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 5000, selling_price: 11000, stock_qty: 24, qty_allocated: 0, qty_available: 24, inventory_value: 120000, is_active: 1 },
  { id: 60, sku: "WEB-PEPPERED-GIZZARD-SKEWERS", name: "Peppered Smoked Gizzard Skewers (5 pcs)", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 2200, selling_price: 5000, stock_qty: 45, qty_allocated: 0, qty_available: 45, inventory_value: 99000, is_active: 1 },
  { id: 51, sku: "WEB-UNDILUTED-PALMWINE-50CL", name: "Undiluted Palmwine (50cl)", product_type: "sales", unit: "unit", reorder_level: 40, unit_cost: 800, selling_price: 2000, stock_qty: 95, qty_allocated: 3, qty_available: 92, inventory_value: 76000, is_active: 1 },
  { id: 61, sku: "WEB-HIBISCUS-ZOBO-50CL", name: "Spiced Hibiscus Zobo Beverage (50cl)", product_type: "sales", unit: "unit", reorder_level: 35, unit_cost: 650, selling_price: 1800, stock_qty: 80, qty_allocated: 0, qty_available: 80, inventory_value: 52000, is_active: 1 },
  { id: 50, sku: "WEB-EXTRA-BAG", name: "Extra Branded Bag", product_type: "sales", unit: "unit", reorder_level: 50, unit_cost: 250, selling_price: 600, stock_qty: 170, qty_allocated: 1, qty_available: 169, inventory_value: 42500, is_active: 1 },
]

export const SEED_DAILY_SALES: DailySalesItem[] = [
  { product_id: 38, product_name: "Full Smokey Guineafowl", sku: "WEB-FULL-SMOKEY-GUINEAFOWL", unit: "unit", qty_sold: 14, sale_count: 8, order_count: 8, total_value: 175000, channel_breakdown: "Website: 10 | POS Walk-in: 4" },
  { product_id: 48, product_name: "Smokey Beef Jerkey (Kilishi)", sku: "WEB-SMOKEY-BEEF-JERKEY-KILISHI", unit: "unit", qty_sold: 8, sale_count: 5, order_count: 5, total_value: 44000, channel_breakdown: "Website: 6 | POS Walk-in: 2" },
  { product_id: 56, product_name: "Smokey Jumbo Turkey Wings (Pair)", sku: "WEB-JUMBO-TURKEY-WINGS-PAIR", unit: "unit", qty_sold: 6, sale_count: 4, order_count: 4, total_value: 87000, channel_breakdown: "Website: 4 | POS Walk-in: 2" },
  { product_id: 57, product_name: "Charcoal Roasted Whole Catfish (Family)", sku: "WEB-ROASTED-CATFISH-FAMILY", unit: "unit", qty_sold: 5, sale_count: 3, order_count: 3, total_value: 55000, channel_breakdown: "Website: 3 | POS Walk-in: 2" },
  { product_id: 40, product_name: "Travel Standard Dry Guineafowl", sku: "WEB-TRAVEL-STANDARD-DRY-GUIN", unit: "unit", qty_sold: 5, sale_count: 3, order_count: 3, total_value: 65000, channel_breakdown: "Website: 5 | POS Walk-in: 0" },
  { product_id: 44, product_name: "1 Liter Bowl Guineafowl Rice", sku: "WEB-1-LITER-BOWL-GUINEAFOWL", unit: "unit", qty_sold: 6, sale_count: 4, order_count: 4, total_value: 132000, channel_breakdown: "Website: 4 | POS Walk-in: 2" },
  { product_id: 51, product_name: "Undiluted Palmwine (50cl)", sku: "WEB-UNDILUTED-PALMWINE-50CL", unit: "unit", qty_sold: 12, sale_count: 6, order_count: 6, total_value: 24000, channel_breakdown: "Website: 8 | POS Walk-in: 4" },
]

export const SEED_SALES_MOVEMENTS: SalesMovement[] = [
  { id: 4611, product_id: 56, product_name: "Smokey Jumbo Turkey Wings (Pair)", sku: "WEB-JUMBO-TURKEY", unit: "unit", location: "finished", movement_type: "production_output", quantity: 20, unit_cost: 7500, value_amount: 150000, balance_after: 32, notes: "Batch BAT-00023 output completion", created_at: "2026-09-25 10:45:00", user_name: "OPERATION MANAGER" },
  { id: 4610, product_id: 57, product_name: "Charcoal Roasted Whole Catfish", sku: "WEB-CATFISH", unit: "unit", location: "finished", movement_type: "production_output", quantity: 15, unit_cost: 5000, value_amount: 75000, balance_after: 24, notes: "Smoker pit #3 morning run", created_at: "2026-09-25 09:10:00", user_name: "Pitmaster Babajide" },
  { id: 4609, product_id: 38, product_name: "Full Smokey Guineafowl", sku: "GNF001", unit: "PIECES", location: "sales", movement_type: "sale", quantity: -3, unit_cost: 6500, value_amount: 19500, balance_after: 61, notes: "Order SHD-07665 dispatch to Lekki", created_at: "2026-09-25 11:20:00", user_name: "Website Storefront" },
  { id: 4608, product_id: 48, product_name: "Smokey Beef Jerkey (Kilishi)", sku: "WEB-KILISHI", unit: "unit", location: "sales", movement_type: "sale", quantity: -2, unit_cost: 2500, value_amount: 5000, balance_after: 83, notes: "Order SHD-07666 dispatch", created_at: "2026-09-25 11:35:00", user_name: "Website Storefront" },
  { id: 4607, product_id: 38, product_name: "Full Smokey Guineafowl", sku: "GNF001", unit: "PIECES", location: "finished", movement_type: "production_output", quantity: 50, unit_cost: 6500, value_amount: 325000, balance_after: 64, notes: "Production batch BAT-00020 completion", created_at: "2026-09-24 16:30:11", user_name: "OPERATION MANAGER" },
  { id: 4606, product_id: 38, product_name: "Full Smokey Guineafowl", sku: "GNF001", unit: "PIECES", location: "sales", movement_type: "sale", quantity: -2, unit_cost: 6500, value_amount: 13000, balance_after: 14, notes: "Website Order SHD-07663 dispatch", created_at: "2026-09-24 17:15:22", user_name: "Website Storefront" },
  { id: 4605, product_id: 44, product_name: "1 Liter Bowl Guineafowl Rice", sku: "WEB-1L-BOWL", unit: "unit", location: "sales", movement_type: "sale", quantity: -1, unit_cost: 9500, value_amount: 9500, balance_after: 50, notes: "Order SHD-07662 fulfillment", created_at: "2026-09-24 18:02:40", user_name: "Website Storefront" },
  { id: 4604, product_id: 48, product_name: "Smokey Beef Jerkey (Kilishi)", sku: "WEB-KILISHI", unit: "unit", location: "finished", movement_type: "production_output", quantity: 30, unit_cost: 2500, value_amount: 75000, balance_after: 85, notes: "Kitchen dehydrator rack #2 batch", created_at: "2026-09-23 14:10:00", user_name: "Pitmaster Babajide" },
]

export const SEED_SUPPLIERS: Supplier[] = [
  { id: 2, supplier_ref: "SUP-00001", name: "MADAM POULTRY CO.", phone: "09110382689", email: "smokeyhut04@gmail.com", address: "13 McNeil Str, Sabo Yaba, Lagos", category: "Fresh Poultry & Proteins", delivery_count: 42, total_spend: 8450000, is_active: 1 },
  { id: 3, supplier_ref: "SUP-00002", name: "LOCAL MARKET AGRO", phone: "09110382689", email: "agro@localmarket.ng", address: "Oyingbo Wholesale Market, Lagos", category: "Spices & Dry Peppers", delivery_count: 18, total_spend: 1240000, is_active: 1 },
  { id: 6, supplier_ref: "SUP-00005", name: "HARDWOOD LOGISTICS", phone: "08034567890", email: "timber@hardwood.ng", address: "Epe Sawmill Depot, Lagos", category: "Smoker Firewood & Charcoal", delivery_count: 12, total_spend: 342000, is_active: 1 },
  { id: 4, supplier_ref: "SUP-00003", name: "PRIME PACKAGING LTD", phone: "08099887766", email: "orders@primepack.com", address: "Ilupeju Industrial Estate, Lagos", category: "Food Grade Packaging & Bags", delivery_count: 15, total_spend: 3100000, is_active: 1 },
]

export const SEED_PRODUCTION_BATCHES: ProductionBatch[] = [
  {
    id: 31,
    batch_ref: "BAT-00020",
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    expected_output: 50,
    actual_output: 50,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-24 07:33:01",
    completed_at: "2026-09-24 16:30:11",
    remarks: "Perfect mahogany wood smoke color. QC passed.",
    created_by_name: "OPERATION MANAGER",
    recipe_template_id: 1,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 50, unit: "PIECES" },
      { product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", quantity: 2.5, unit: "KG" },
      { product_id: 54, sku: "SKU-00020", name: "SPICIES", quantity: 1.0, unit: "PACK" },
      { product_id: 52, sku: "SKU-00018", name: "FIREWOOD", quantity: 4.0, unit: "BUNDLE" },
    ]
  },
  {
    id: 34,
    batch_ref: "BAT-00023",
    output_product_id: 56,
    output_product_name: "Smokey Jumbo Turkey Wings (Pair)",
    expected_output: 20,
    actual_output: 20,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-25 06:30:00",
    completed_at: "2026-09-25 10:45:00",
    remarks: "Crispy glaze with sweet spicy honey dip finish.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 3,
    variance_pct: 0,
    raw_materials: [
      { product_id: 70, sku: "SKU-00036", name: "JUMBO TURKEY WINGS", quantity: 15, unit: "KG" },
      { product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", quantity: 1.0, unit: "KG" },
      { product_id: 74, sku: "SKU-00040", name: "HICKORY WOOD CHIPS", quantity: 1.5, unit: "SACK" },
    ]
  },
  {
    id: 32,
    batch_ref: "BAT-00021",
    output_product_id: 48,
    output_product_name: "Smokey Beef Jerkey (Kilishi)",
    expected_output: 30,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 08:15:00",
    completed_at: null,
    remarks: "Marinating in seasoned pepper paste. Smoker running at 75°C.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 5,
    variance_pct: 0,
    raw_materials: [
      { product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", quantity: 15, unit: "PIECES" },
      { product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", quantity: 1.5, unit: "KG" },
      { product_id: 52, sku: "SKU-00018", name: "FIREWOOD", quantity: 2.0, unit: "BUNDLE" },
    ]
  },
  {
    id: 33,
    batch_ref: "BAT-00022",
    output_product_id: 44,
    output_product_name: "1 Liter Bowl Guineafowl Rice",
    expected_output: 40,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Afternoon lunch catering pre-batch preparation.",
    created_by_name: "Folake Adebayo",
    recipe_template_id: 2,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 20, unit: "PIECES" },
      { product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", quantity: 3.0, unit: "LITRE" },
      { product_id: 54, sku: "SKU-00020", name: "SPICIES", quantity: 1.5, unit: "PACK" },
    ]
  }
]

export const SEED_PACKAGING_QUEUE: PackagingQueueOrder[] = [
  {
    id: 8552,
    order_ref: "SHD-07663",
    customer_name: "Ogunnowo Oyewale",
    phone: "08063314728",
    address: "Store Pickup — Lagos Mainland",
    total_amount: 15300,
    delivery_fee: 0,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Full Smokey Guineafowl × 1; Extra Bag × 1; Undiluted Palmwine (50cl) × 1",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 1, unit_price: 12500, line_total: 12500 },
      { product_name: "Extra Bag", quantity: 1, unit_price: 600, line_total: 600 },
      { product_name: "Undiluted Palmwine (50cl)", quantity: 1, unit_price: 2000, line_total: 2000 },
    ],
    created_at: "2026-09-25 09:20:59"
  },
  {
    id: 8551,
    order_ref: "SHD-07662",
    customer_name: "Jesutofunmi Bukola",
    phone: "09036054778",
    address: "8/10 Oladimeji Johnson crescent, Aboru Iyana Ipaja",
    total_amount: 28700,
    delivery_fee: 4000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "1 Liter Bowl Guineafowl Rice × 1; Travel Standard Dry Guineafowl × 1",
    items: [
      { product_name: "1 Liter Bowl Guineafowl Rice", quantity: 1, unit_price: 22000, line_total: 22000 },
      { product_name: "Travel Standard Dry Guineafowl", quantity: 1, unit_price: 13000, line_total: 13000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 1 },
      { packaging_name: "BRANDED POLYBAG", quantity: 1 },
      { packaging_name: "TAMPER-EVIDENT SECURITY SEALS", quantity: 1 }
    ],
    created_at: "2026-09-25 09:18:12"
  },
  {
    id: 8550,
    order_ref: "SHD-07661",
    customer_name: "Anita Ihaza",
    phone: "07062364644",
    address: "4 Awoseyin Lane, Shomolu",
    total_amount: 27700,
    delivery_fee: 2500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Full Smokey Guineafowl (Chopped) × 2",
    items: [
      { product_name: "Full Smokey Guineafowl (Chopped)", quantity: 2, unit_price: 12500, line_total: 25000 },
    ],
    created_at: "2026-09-25 09:10:45"
  }
]

export const SEED_PACKAGING_MATERIALS_DAILY: PackagingMaterialDaily[] = [
  { product_id: 93, product_name: "BIG BRANDED BAG", sku: "PCK004", unit: "PIECES", total_consumed: 18, total_orders: 14 },
  { product_id: 95, product_name: "BRANDED POLYBAG", sku: "PCK006", unit: "PCS", total_consumed: 26, total_orders: 22 },
  { product_id: 96, product_name: "1 LITER FOOD BOWL & LID", sku: "PCK007", unit: "SETS", total_consumed: 12, total_orders: 10 },
  { product_id: 97, product_name: "HEAVY DUTY FOIL WRAP", sku: "PCK008", unit: "SHEETS", total_consumed: 35, total_orders: 24 },
]

export const SEED_KITCHEN_TASKS: KitchenTask[] = [
  { id: 101, task_ref: "TSK-101", title: "Morning Smoker Calibration & Hardwood Chips Stock", description: "Calibrate smoker thermocouples and verify oak hardwood chip levels before batch BAT-00021.", assignee_name: "Babajide 'Pitmaster'", due_date: "2026-09-25", priority: "high", status: "in_progress" },
  { id: 102, task_ref: "TSK-102", title: "Take-Away Foil & Greaseproof Liner Inventory Audit", description: "Count remaining branded foil rolls and paper bags in packaging store.", assignee_name: "Chioma Okonkwo", due_date: "2026-09-25", priority: "normal", status: "pending" },
  { id: 103, task_ref: "TSK-103", title: "Cold Room Freezer Temperature Sensor Log", description: "Inspect main walk-in freezer temperature chart (-18°C) for HACCP regulatory compliance.", assignee_name: "Folake Adebayo", due_date: "2026-09-25", priority: "normal", status: "done" },
  { id: 104, task_ref: "TSK-104", title: "Pre-Marination Prep for 100 Guinea Fowls", description: "Trim and season 100 birds with secret dry rub blend for weekend orders.", assignee_name: "Emeka Nwosu", due_date: "2026-09-26", priority: "high", status: "pending" },
]

export const SEED_LOGISTICS_DELIVERIES: LogisticsDelivery[] = [
  {
    id: 3662,
    delivery_ref: "SHD-07642",
    order_id: 8530,
    order_ref: "SHD-07642",
    customer_name: "Joy Nwagbologu",
    phone: "08035671122",
    address: "15 Olamiko street dopemu, Iyana Ipaja",
    delivery_fee: 4000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER WASIU",
    assigned_rider_id: 453,
    status: "in_transit",
    dispatch_date: "2026-09-24",
    pickup_at: "2026-09-24 16:35:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 28500,
    items_summary: "Full Smokey Guineafowl × 2; Undiluted Palmwine × 1"
  },
  {
    id: 3665,
    delivery_ref: "SHD-07645",
    order_id: 8533,
    order_ref: "SHD-07645",
    customer_name: "Tosin Adebisi",
    phone: "08023459988",
    address: "Plot 12 Admiralty Way, Lekki Phase 1",
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER JOSHUA",
    assigned_rider_id: 454,
    status: "out_for_delivery",
    dispatch_date: "2026-09-25",
    pickup_at: "2026-09-25 10:15:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "1 Liter Bowl Guineafowl Rice × 1"
  },
  {
    id: 3668,
    delivery_ref: "SHD-07650",
    order_id: 8539,
    order_ref: "SHD-07650",
    customer_name: "Blessing Udebhu",
    phone: "07060538040",
    address: "18 Awolowo Rd, Ikoyi",
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER JOSHUA",
    assigned_rider_id: 454,
    status: "delivered",
    dispatch_date: "2026-09-24",
    pickup_at: "2026-09-24 17:10:00",
    delivered_at: "2026-09-24 18:40:32",
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 15500,
    items_summary: "Undiluted Palmwine (50cl) × 2; Full Smokey Guineafowl × 1"
  },
  {
    id: 3670,
    delivery_ref: "SHD-07655",
    order_id: 8545,
    order_ref: "SHD-07655",
    customer_name: "Femi Otedola Jr.",
    phone: "08098765432",
    address: "Victoria Garden City (VGC), Lekki",
    delivery_fee: 4500,
    booked_fee: 5200,
    rider_type: "third_party",
    assigned_rider: "GIG Logistics",
    third_party_provider: "GIG Logistics",
    status: "out_for_delivery",
    dispatch_date: "2026-09-25",
    pickup_at: "2026-09-25 11:00:00",
    delivered_at: null,
    fee_verify_status: "pending",
    fee_evidence_path: "/receipts/gig-8545.jpg",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 3; Extra Dry King Size × 1"
  },
  {
    id: 3671,
    delivery_ref: "SHD-07658",
    order_id: 8548,
    order_ref: "SHD-07658",
    customer_name: "Dr. Chioma Nnamdi",
    phone: "08123456789",
    address: "14 Isaac John Street, GRA Ikeja",
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-09-25",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Beef Jerkey × 4; Full Smokey Guineafowl × 1"
  },
  {
    id: 4982,
    delivery_ref: "SHD-08410",
    order_id: 8610,
    order_ref: "SHD-08410",
    customer_name: "Chioma Eze",
    phone: "08031234567",
    address: "15 Admiralty Way, Lekki Phase 1",
    total_amount: 32500,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "assigned",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "1L Guineafowl Rice × 1; Full Smokey Catfish × 2; Smokey Pepper Sauce × 1",
    notes: "Call when at gate, dial flat 4B intercom"
  },
  {
    id: 4971,
    delivery_ref: "SHD-08383",
    order_id: 8595,
    order_ref: "SHD-08383",
    customer_name: "Mohammed abubakar Galadima",
    phone: "07087141351",
    address: "32a Cooper Rd Ikoyi, Lagos",
    total_amount: 28200,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-10-03",
    pickup_at: "2026-10-03 13:50:00",
    delivered_at: "2026-10-03 14:41:28",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "1L Guineafowl Rice × 1; Catfish × 1",
    notes: "Delivered to security reception"
  },
  {
    id: 4965,
    delivery_ref: "SHD-08375",
    order_id: 8588,
    order_ref: "SHD-08375",
    customer_name: "Amina Bello",
    phone: "08091122334",
    address: "12 Glover Road, Ikoyi, Lagos",
    total_amount: 45000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-10-02",
    pickup_at: "2026-10-02 11:30:00",
    delivered_at: "2026-10-02 12:20:15",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Undiluted Palmwine × 2",
    notes: "Delivered directly to customer"
  }
]

export const SEED_SCHEDULED_ORDERS: ScheduledOrder[] = [
  { id: 8551, order_ref: "SHD-07662", customer_name: "Jesutofunmi Bukola", phone: "09036054778", address: "8/10 Oladimeji Johnson crescent, Iyana Ipaja", total_amount: 28700, delivery_fee: 4000, scheduled_delivery_at: "2026-09-25 12:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Afternoon lunch delivery via Website", can_start_schedule: true },
  { id: 8550, order_ref: "SHD-07661", customer_name: "Anita Ihaza", phone: "07062364644", address: "4 Awoseyin Lane, Shomolu", total_amount: 27700, delivery_fee: 2500, scheduled_delivery_at: "2026-09-25 13:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Office lunch party dispatch", can_start_schedule: true },
  { id: 8549, order_ref: "SHD-07660", customer_name: "Ahmad Sanusi", phone: "08055443322", address: "35 Glover Road, Ikoyi", total_amount: 62500, delivery_fee: 3500, scheduled_delivery_at: "2026-09-26 15:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Pre-order VIP catering package", can_start_schedule: false },
]

export const SEED_RIDER_PAYOUTS: RiderPayout[] = [
  {
    rider_user_id: 453,
    rider_name: "RIDER WASIU",
    phone: "08031234567",
    email: "wasiu.balogun@smokeyhut.com",
    staff_id: "RDR-001",
    active_assignments: 3,
    today_trips: 4,
    deliveries_today: 4,
    deliveries_week: 18,
    deliveries_month: 72,
    total_completed: 184,
    earnings_today: 12000,
    earnings_week: 54000,
    earnings_month: 215000,
    pending_payout: 12500,
    cod_cash_collected: 28500,
    cod_remitted_total: 145000,
    net_balance: -16000,
    paid_total: 145000,
    lifetime_earnings: 157500,
    status: "on_trip",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "LND-482-XA",
    operating_hub: "Yaba Head Office",
    license_number: "DL-98234-LAG",
    license_expiry: "Nov 2027",
    emergency_contact: "Rasheed Balogun (Brother)",
    emergency_phone: "08023456789",
    rating: 4.9,
    on_time_rate: 98.4,
    cod_limit: 50000,
    date_joined: "12 Feb 2025"
  },
  {
    rider_user_id: 454,
    rider_name: "RIDER JOSHUA",
    phone: "08069876543",
    email: "joshua.ade@smokeyhut.com",
    staff_id: "RDR-002",
    active_assignments: 2,
    today_trips: 5,
    deliveries_today: 5,
    deliveries_week: 21,
    deliveries_month: 84,
    total_completed: 212,
    earnings_today: 15000,
    earnings_week: 62000,
    earnings_month: 248000,
    pending_payout: 18000,
    cod_cash_collected: 15500,
    cod_remitted_total: 190000,
    net_balance: 2500,
    paid_total: 190000,
    lifetime_earnings: 208000,
    status: "on_trip",
    vehicle_type: "TVS King Tricycle Cargo",
    plate_number: "APP-829-QC",
    operating_hub: "Ikeja Kitchen Station",
    license_number: "DL-45120-LAG",
    license_expiry: "Jun 2028",
    emergency_contact: "Grace Ade (Spouse)",
    emergency_phone: "08034567890",
    rating: 4.8,
    on_time_rate: 96.8,
    cod_limit: 60000,
    date_joined: "05 Nov 2024"
  },
  {
    rider_user_id: 455,
    rider_name: "RIDER YUSUF",
    phone: "07087141351",
    email: "Ridersmokeyyusuf@gmail.com",
    staff_id: "RDR-003",
    active_assignments: 1,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 0,
    deliveries_month: 34,
    total_completed: 362,
    earnings_today: 0,
    earnings_week: 0,
    earnings_month: 185000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 1183000,
    net_balance: 0,
    paid_total: 1183000,
    lifetime_earnings: 1183000,
    status: "active",
    vehicle_type: "Honda CB125 Motorcycle",
    plate_number: "KTU-193-BD",
    operating_hub: "Yaba Head Office",
    license_number: "DL-67341-LAG",
    license_expiry: "Jan 2027",
    emergency_contact: "Musa Yusuf (Brother)",
    emergency_phone: "08129876543",
    rating: 5.0,
    on_time_rate: 99.2,
    cod_limit: 50000,
    date_joined: "18 Aug 2024"
  },
  {
    rider_user_id: 456,
    rider_name: "RIDER SUNDAY",
    phone: "09088776655",
    email: "sunday.oguns@smokeyhut.com",
    staff_id: "RDR-004",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 12,
    deliveries_month: 48,
    total_completed: 142,
    earnings_today: 0,
    earnings_week: 36000,
    earnings_month: 144000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 135000,
    net_balance: 0,
    paid_total: 135000,
    lifetime_earnings: 135000,
    status: "offline",
    vehicle_type: "Haojue 125 Motorcycle",
    plate_number: "AGL-304-XG",
    operating_hub: "Lekki Cloud Kitchen",
    license_number: "DL-88219-LAG",
    license_expiry: "Sep 2026",
    emergency_contact: "Mary Oguns (Sister)",
    emergency_phone: "08055667788",
    rating: 4.7,
    on_time_rate: 95.2,
    cod_limit: 40000,
    date_joined: "10 Jan 2025"
  },
]

export const SEED_RIDER_TASKS: RiderTask[] = [
  {
    id: 141,
    task_ref: "TSK-0012",
    title: "Pre-Shift Motorcycle Safety & Tire Pressure Check",
    description: "Inspect Honda CB125 front/rear brake pads, chain tension, fuel gauge, and tire pressure (28 PSI front, 32 PSI rear) before morning run.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-21 08:30:00",
    priority: "urgent",
    status: "done"
  },
  {
    id: 142,
    task_ref: "TSK-0014",
    title: "Insulated Thermal Cooler Bag Sanitization",
    description: "Disinfect interior thermal foil lining with food-grade sanitizing wipe; ensure heat-pack zipper seals tightly.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-21 11:00:00",
    priority: "normal",
    status: "in_progress"
  },
  {
    id: 143,
    task_ref: "TSK-0018",
    title: "Cash-on-Delivery (COD) Mid-Day Reconciliation",
    description: "Verify physical cash collected from morning runs against mobile POS receipt journal before afternoon peak dispatch.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-21 15:00:00",
    priority: "normal",
    status: "pending"
  },
  {
    id: 144,
    task_ref: "TSK-0021",
    title: "End-of-Shift Fuel Log & Kilometer Odometer Reading",
    description: "Record ending odometer reading on hub fleet logbook and submit gas refill receipts to hub cashier.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-21 19:30:00",
    priority: "low",
    status: "pending"
  }
]

export const SEED_STORE_PICKUPS: StorePickupOrder[] = [
  { id: 8511, order_ref: "SHD-07619", customer_name: "Olubunmi Cole", phone: "08023183495", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 75200, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-09-24 16:36:38", collected_at: null, collected_by: null, handover_staff: "Tunde Bakare", items_summary: "Full Smokey Guineafowl (Chopped) × 6" },
  { id: 8501, order_ref: "SHD-07605", customer_name: "Mercy Mercy", phone: "08136565021", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 43700, payment_status: "paid", order_status: "collected", packaged_at: "2026-09-24 14:15:10", collected_at: "2026-09-24 15:45:00", collected_by: "Customer Self", handover_staff: "Chioma Okonkwo", items_summary: "Full Smokey Guineafowl × 3; Palmwine × 2" },
]

export const SEED_THIRD_PARTY_SUMMARY: ThirdPartyWeeklySummary[] = [
  { week_start: "2026-09-14", week_end: "2026-09-20", label: "14 Sep – 20 Sep 2026", delivery_count: 26, order_fees: 113500, booked_fees: 126100, net: -12600, loss_count: 18, gain_count: 6, even_count: 2 },
  { week_start: "2026-09-07", week_end: "2026-09-13", label: "07 Sep – 13 Sep 2026", delivery_count: 9, order_fees: 33500, booked_fees: 33100, net: 400, loss_count: 3, gain_count: 5, even_count: 1 },
  { week_start: "2026-08-31", week_end: "2026-09-06", label: "31 Aug – 06 Sep 2026", delivery_count: 3, order_fees: 0, booked_fees: 13800, net: -13800, loss_count: 3, gain_count: 0, even_count: 0 },
  { week_start: "2026-08-24", week_end: "2026-08-30", label: "24 Aug – 30 Aug 2026", delivery_count: 1, order_fees: 1500, booked_fees: 3700, net: -2200, loss_count: 1, gain_count: 0, even_count: 0 },
]

