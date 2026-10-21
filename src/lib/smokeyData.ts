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
  },
  {
    id: 6,
    output_product_id: 72,
    output_product_name: "Smoked Goat Meat Asun (Spiced Chevon)",
    version_name: "Spiced Pit Asun Run (Batch 25)",
    standard_batch_size: 25,
    standard_yield_percent: 92,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 72, sku: "SKU-00038", name: "GOAT MEAT (CHEVON CUT)", standard_qty_per_unit: 0.8, unit: "KG" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.06, unit: "KG" },
      { raw_product_id: 73, sku: "SKU-00039", name: "CRUSHED HABANERO FLAKES", standard_qty_per_unit: 0.04, unit: "KG" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.12, unit: "BUNDLE" },
    ]
  },
  {
    id: 7,
    output_product_id: 60,
    output_product_name: "Peppered Smoked Gizzard Skewers",
    version_name: "Skewered Gizzard Snack Run (Batch 30)",
    standard_batch_size: 30,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", standard_qty_per_unit: 0.4, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", standard_qty_per_unit: 0.02, unit: "PACK" },
      { raw_product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", standard_qty_per_unit: 0.03, unit: "LITRE" },
    ]
  },
  {
    id: 8,
    output_product_id: 40,
    output_product_name: "Travel Standard Dry Guineafowl",
    version_name: "Extended Smoke Dry Preservation (Batch 40)",
    standard_batch_size: 40,
    standard_yield_percent: 88,
    unit: "unit",
    allowed_variance_pct: 4.0,
    ingredients: [
      { raw_product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.07, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", standard_qty_per_unit: 0.025, unit: "PACK" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.1, unit: "BUNDLE" },
    ]
  },
  {
    id: 9,
    output_product_id: 65,
    output_product_name: "Fresh King-Size Smoked Guineafowl",
    version_name: "VIP Prime Jumbo Smoked Run (Batch 20)",
    standard_batch_size: 20,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 3.0,
    ingredients: [
      { raw_product_id: 65, sku: "SKU-00031", name: "FRESH KING-SIZE GUINEAFOWL", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.06, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", standard_qty_per_unit: 0.03, unit: "PACK" },
      { raw_product_id: 74, sku: "SKU-00040", name: "HICKORY WOOD CHIPS", standard_qty_per_unit: 0.08, unit: "SACK" },
    ]
  },
  {
    id: 10,
    output_product_id: 66,
    output_product_name: "Charcoal Smoked Whole Turkey",
    version_name: "Whole Holiday Turkey Pit Run (Batch 12)",
    standard_batch_size: 12,
    standard_yield_percent: 96,
    unit: "unit",
    allowed_variance_pct: 4.0,
    ingredients: [
      { raw_product_id: 66, sku: "SKU-00032", name: "FRESH TURKEY", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.09, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", standard_qty_per_unit: 0.04, unit: "PACK" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.15, unit: "BUNDLE" },
    ]
  },
  {
    id: 11,
    output_product_id: 61,
    output_product_name: "Spiced Hibiscus Zobo Beverage (50cl)",
    version_name: "Artisan Brew & Botanical Infusion (Batch 60)",
    standard_batch_size: 60,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 2.0,
    ingredients: [
      { raw_product_id: 68, sku: "SKU-00034", name: "CINNAMON STICK", standard_qty_per_unit: 0.02, unit: "PACK" },
      { raw_product_id: 69, sku: "SKU-00035", name: "CLOVE", standard_qty_per_unit: 0.015, unit: "CUP" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES (SECRET BLEND)", standard_qty_per_unit: 0.01, unit: "PACK" },
    ]
  },
  {
    id: 12,
    output_product_id: 39,
    output_product_name: "Full Smokey Guineafowl (Chopped)",
    version_name: "Fast-Casual Chopped Combo Prep (Batch 35)",
    standard_batch_size: 35,
    standard_yield_percent: 98,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", standard_qty_per_unit: 0.02, unit: "LITRE" },
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
  { id: 6, product_id: 63, product_name: "FRESH CHICKEN", sku: "SKU-00029", lot_number: "LOT-CHK-0925A", supplier_name: "MADAM POULTRY CO.", initial_qty: 80, remaining_qty: 31, unit: "PIECES", unit_cost: 6500, received_date: "2026-09-25", expiry_date: "2026-09-30", days_to_expiry: 5, status: "active" },
  { id: 7, product_id: 66, product_name: "FRESH TURKEY", sku: "SKU-00032", lot_number: "LOT-TRK-0923A", supplier_name: "MADAM POULTRY CO.", initial_qty: 40, remaining_qty: 18, unit: "PIECES", unit_cost: 9500, received_date: "2026-09-23", expiry_date: "2026-10-02", days_to_expiry: 7, status: "active" },
  { id: 8, product_id: 72, product_name: "GOAT MEAT (CHEVON CUT)", sku: "SKU-00038", lot_number: "LOT-GTM-0924A", supplier_name: "OYINGBO MEAT DEPOT", initial_qty: 50, remaining_qty: 36, unit: "KG", unit_cost: 9200, received_date: "2026-09-24", expiry_date: "2026-10-05", days_to_expiry: 10, status: "active" },
  { id: 9, product_id: 53, product_name: "DRY PEPPER", sku: "SKU-00019", lot_number: "LOT-PEP-0920A", supplier_name: "LOCAL MARKET AGRO", initial_qty: 30, remaining_qty: 16, unit: "KG", unit_cost: 3300, received_date: "2026-09-20", expiry_date: "2026-11-20", days_to_expiry: 56, status: "active" },
  { id: 10, product_id: 73, product_name: "CRUSHED HABANERO FLAKES", sku: "SKU-00039", lot_number: "LOT-HAB-0922A", supplier_name: "LOCAL MARKET AGRO", initial_qty: 35, remaining_qty: 22, unit: "KG", unit_cost: 4100, received_date: "2026-09-22", expiry_date: "2026-11-25", days_to_expiry: 61, status: "active" },
  { id: 11, product_id: 54, product_name: "SPICIES (SECRET BLEND)", sku: "SKU-00020", lot_number: "LOT-SPC-0915A", supplier_name: "SUPREME SPICE MILLS", initial_qty: 15, remaining_qty: 8, unit: "PACK", unit_cost: 19900, received_date: "2026-09-15", expiry_date: "2026-12-15", days_to_expiry: 81, status: "active" },
  { id: 12, product_id: 55, product_name: "VEGETABLE OIL", sku: "SKU-00021", lot_number: "LOT-OIL-0918A", supplier_name: "AGRO-ALLIED PRODUCE", initial_qty: 50, remaining_qty: 35, unit: "LITRE", unit_cost: 2264, received_date: "2026-09-18", expiry_date: "2027-03-18", days_to_expiry: 174, status: "active" },
  { id: 13, product_id: 74, product_name: "HICKORY WOOD CHIPS", sku: "SKU-00040", lot_number: "LOT-WOD-0920B", supplier_name: "HARDWOOD LOGISTICS", initial_qty: 25, remaining_qty: 15, unit: "SACK", unit_cost: 3800, received_date: "2026-09-20", expiry_date: "2027-09-20", days_to_expiry: 360, status: "active" },
]

// -------------------------------------------------------------
// STOCKTAKE VARIANCE ESCROW DATASETS (Section 9.4)
// -------------------------------------------------------------
export const SEED_STOCKTAKE_VARIANCES: StocktakeVariance[] = [
  { id: 1, product_id: 53, product_name: "DRY PEPPER", sku: "SKU-00019", category: "raw", unit: "KG", unit_cost: 3300, digital_count: 17.5, physical_count: 16.0, variance_qty: -1.5, variance_value: -4950, date: "2026-09-24", counted_by: "Chioma Okonkwo", status: "pending_review", supervisor_notes: "Minor spill variance during spice blending" },
  { id: 2, product_id: 95, product_name: "BRANDED POLYBAG", sku: "PCK006", category: "packaging", unit: "PCS", unit_cost: 105, digital_count: 520, physical_count: 508, variance_qty: -12, variance_value: -1260, date: "2026-09-24", counted_by: "Emeka Nwosu", status: "reconciled", supervisor_notes: "Damaged packing seals written off" },
  { id: 3, product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", category: "raw", unit: "PIECES", unit_cost: 6500, digital_count: 74, physical_count: 72, variance_qty: -2, variance_value: -13000, date: "2026-09-25", counted_by: "Babajide 'Pitmaster'", status: "reconciled", supervisor_notes: "Weight defrosting loss verified" },
  { id: 4, product_id: 70, product_name: "JUMBO TURKEY WINGS", sku: "SKU-00036", category: "raw", unit: "KG", unit_cost: 7200, digital_count: 46.5, physical_count: 45.0, variance_qty: -1.5, variance_value: -10800, date: "2026-09-25", counted_by: "Folake Adebayo", status: "pending_review", supervisor_notes: "Pre-marinade trimming loss" },
  { id: 5, product_id: 52, product_name: "FIREWOOD", sku: "SKU-00018", category: "raw", unit: "BUNDLE", unit_cost: 570, digital_count: 26, physical_count: 24, variance_qty: -2, variance_value: -1140, date: "2026-09-24", counted_by: "Emeka Nwosu", status: "reconciled", supervisor_notes: "Smoker pre-heating fuel usage" },
  { id: 6, product_id: 55, product_name: "VEGETABLE OIL", sku: "SKU-00021", category: "raw", unit: "LITRE", unit_cost: 2264, digital_count: 36.0, physical_count: 35.0, variance_qty: -1.0, variance_value: -2264, date: "2026-09-24", counted_by: "Chioma Okonkwo", status: "reconciled", supervisor_notes: "Grill grate brushing allocation" },
  { id: 7, product_id: 93, product_name: "BIG BRANDED BAG", sku: "PCK004", category: "packaging", unit: "PIECES", unit_cost: 420, digital_count: 12, physical_count: 8, variance_qty: -4, variance_value: -1680, date: "2026-09-25", counted_by: "Segun Alabi", status: "pending_review", supervisor_notes: "Counter packaging tear during packing" },
  { id: 8, product_id: 96, product_name: "1 LITER FOOD BOWL & LID", sku: "PCK007", category: "packaging", unit: "SETS", unit_cost: 280, digital_count: 190, physical_count: 185, variance_qty: -5, variance_value: -1400, date: "2026-09-25", counted_by: "Folake Adebayo", status: "reconciled", supervisor_notes: "Cracked lids during transit unloading" },
  { id: 9, product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", category: "raw", unit: "KG", unit_cost: 8500, digital_count: 55.0, physical_count: 54.0, variance_qty: -1.0, variance_value: -8500, date: "2026-09-23", counted_by: "Babajide 'Pitmaster'", status: "reconciled", supervisor_notes: "Fat cap trimming adjustment" },
  { id: 10, product_id: 97, product_name: "HEAVY DUTY FOIL WRAP", sku: "PCK008", category: "packaging", unit: "ROLLS", unit_cost: 3200, digital_count: 15, physical_count: 14, variance_qty: -1, variance_value: -3200, date: "2026-09-23", counted_by: "Chioma Okonkwo", status: "reconciled", supervisor_notes: "Depleted roll replaced on line #1" },
  { id: 11, product_id: 38, product_name: "Full Smokey Guineafowl", sku: "WEB-FULL-SMOKEY-GUINEAFOWL", category: "sales", unit: "unit", unit_cost: 6500, digital_count: 65, physical_count: 64, variance_qty: -1, variance_value: -6500, date: "2026-09-24", counted_by: "Segun Alabi", status: "reconciled", supervisor_notes: "Quality assurance sensory sample check" },
  { id: 12, product_id: 111, product_name: "500ML SAUCE CUPS & CAPS", sku: "PCK010", category: "packaging", unit: "SETS", unit_cost: 65, digital_count: 460, physical_count: 450, variance_qty: -10, variance_value: -650, date: "2026-09-22", counted_by: "Emeka Nwosu", status: "reconciled", supervisor_notes: "Faulty clip caps discarded" },
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
  { id: 73, delivery_ref: "RCV-00067", supplier_id: 7, supplier_name: "EPE ARTISANAL FISHERIES", product_id: 64, product_name: "FRESH CATFISH", sku: "SKU-00030", quantity: 60, unit: "KG", unit_cost: 4500, value_amount: 270000, date_received: "2026-09-25", user_name: "OPERATION MANAGER", notes: "Live fish dock receipt in oxygenated tanks" },
  { id: 74, delivery_ref: "RCV-00068", supplier_id: 8, supplier_name: "OYINGBO MEAT DEPOT", product_id: 72, product_name: "GOAT MEAT (CHEVON CUT)", sku: "SKU-00038", quantity: 50, unit: "KG", unit_cost: 9200, value_amount: 460000, date_received: "2026-09-24", user_name: "Pitmaster Babajide", notes: "Veterinary certified prime chevon quarters" },
  { id: 75, delivery_ref: "RCV-00069", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", quantity: 60, unit: "KG", unit_cost: 8500, value_amount: 510000, date_received: "2026-09-25", user_name: "OPERATION MANAGER", notes: "Grade-A beef briskets for kilishi dehydration" },
  { id: 76, delivery_ref: "RCV-00070", supplier_id: 9, supplier_name: "AGRO-ALLIED PRODUCE", product_id: 55, product_name: "VEGETABLE OIL", sku: "SKU-00021", quantity: 50, unit: "LITRE", unit_cost: 2264, value_amount: 113200, date_received: "2026-09-18", user_name: "Chioma Okonkwo", notes: "Cholesterol-free refined vegetable oil kegs" },
  { id: 77, delivery_ref: "RCV-00071", supplier_id: 10, supplier_name: "DANGOTE REFINED SUGAR & SALT", product_id: 59, product_name: "IODIZED SALT", sku: "SKU-00025", quantity: 10, unit: "BAG", unit_cost: 8200, value_amount: 82000, date_received: "2026-09-15", user_name: "Chioma Okonkwo", notes: "Standard 25kg iodized cooking salt" },
  { id: 78, delivery_ref: "RCV-00072", supplier_id: 3, supplier_name: "LOCAL MARKET AGRO", product_id: 53, product_name: "DRY PEPPER", sku: "SKU-00019", quantity: 30, unit: "KG", unit_cost: 3300, value_amount: 99000, date_received: "2026-09-20", user_name: "Admin", notes: "Selected dry habanero pods" },
  { id: 79, delivery_ref: "RCV-00073", supplier_id: 11, supplier_name: "SUPREME SPICE MILLS", product_id: 58, product_name: "SEASONING CUBES", sku: "SKU-00024", quantity: 12, unit: "CARTON", unit_cost: 14500, value_amount: 174000, date_received: "2026-09-16", user_name: "OPERATION MANAGER", notes: "Chicken & beef stock cubes delivery" },
  { id: 80, delivery_ref: "RCV-00074", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 63, product_name: "FRESH CHICKEN", sku: "SKU-00029", quantity: 80, unit: "PIECES", unit_cost: 6500, value_amount: 520000, date_received: "2026-09-25", user_name: "OPERATION MANAGER", notes: "Farm-gate dressed broilers" },
  { id: 81, delivery_ref: "RCV-00075", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", quantity: 120, unit: "PIECES", unit_cost: 6500, value_amount: 780000, date_received: "2026-09-26", user_name: "OPERATION MANAGER", notes: "Weekend prime roast intake" },
  { id: 82, delivery_ref: "RCV-00076", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 63, product_name: "FRESH CHICKEN", sku: "SKU-00029", quantity: 100, unit: "PIECES", unit_cost: 6500, value_amount: 650000, date_received: "2026-09-27", user_name: "OPERATION MANAGER", notes: "Fresh dressed broilers batch" },
  { id: 83, delivery_ref: "RCV-00077", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 65, product_name: "FRESH KING-SIZE GUINEAFOWL", sku: "SKU-00031", quantity: 30, unit: "PIECES", unit_cost: 12000, value_amount: 360000, date_received: "2026-09-28", user_name: "OPERATION MANAGER", notes: "VIP banquet reservation allocation" },
  { id: 84, delivery_ref: "RCV-00078", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 70, product_name: "JUMBO TURKEY WINGS", sku: "SKU-00036", quantity: 60, unit: "KG", unit_cost: 7200, value_amount: 432000, date_received: "2026-09-29", user_name: "OPERATION MANAGER", notes: "Extra large turkey wings delivery" },
  { id: 85, delivery_ref: "RCV-00079", supplier_id: 2, supplier_name: "MADAM POULTRY CO.", product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", quantity: 75, unit: "KG", unit_cost: 8500, value_amount: 637500, date_received: "2026-09-30", user_name: "OPERATION MANAGER", notes: "Certified chilled beef briskets" },
]

export const SEED_RAW_MOVEMENTS: RawMovement[] = [
  { id: 5755, product_id: 70, product_name: "JUMBO TURKEY WINGS", sku: "SKU-00036", unit: "KG", location: "raw", movement_type: "consumption", quantity: -15, unit_cost: 7200, value_amount: 108000, balance_after: 45, notes: "Consumed for Batch BAT-00023 (Turkey Wings)", created_at: "2026-09-25 09:30:00", user_name: "OPERATION MANAGER" },
  { id: 5754, product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", unit: "KG", location: "raw", movement_type: "consumption", quantity: -20, unit_cost: 8500, value_amount: 170000, balance_after: 54, notes: "Consumed for Kilishi Slicing Batch BAT-00021", created_at: "2026-09-25 08:20:00", user_name: "Babajide 'Pitmaster'" },
  { id: 5753, product_id: 74, product_name: "HICKORY WOOD CHIPS", sku: "SKU-00040", unit: "SACK", location: "raw", movement_type: "consumption", quantity: -3, unit_cost: 3800, value_amount: 11400, balance_after: 15, notes: "Smoker Pit #2 weekend prep", created_at: "2026-09-24 14:10:00", user_name: "Pitmaster Babajide" },
  { id: 5752, product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", unit: "PIECES", location: "raw", movement_type: "consumption", quantity: -20, unit_cost: 6500, value_amount: 130000, balance_after: 72, notes: "Consumed for Batch BAT-00020", created_at: "2026-09-09 19:55:05", user_name: "OPERATION MANAGER" },
  { id: 5751, product_id: 65, product_name: "FRESH KING-SIZE GUINEAFOWL", sku: "SKU-00031", unit: "PIECES", location: "raw", movement_type: "consumption", quantity: -10, unit_cost: 12000, value_amount: 120000, balance_after: 39, notes: "Consumed for Batch BAT-00019", created_at: "2026-09-09 19:51:39", user_name: "OPERATION MANAGER" },
  { id: 5750, product_id: 63, product_name: "FRESH CHICKEN", sku: "SKU-00029", unit: "PIECES", location: "raw", movement_type: "adjustment", quantity: -5, unit_cost: 6500, value_amount: 32500, balance_after: 31, notes: "Defrosting shrinkage audit", created_at: "2026-09-09 19:50:51", user_name: "OPERATION MANAGER" },
  { id: 5749, product_id: 52, product_name: "FIREWOOD", sku: "SKU-00018", unit: "BUNDLE", location: "raw", movement_type: "consumption", quantity: -8, unit_cost: 570, value_amount: 4560, balance_after: 24, notes: "Smoker Pit #1 fueling", created_at: "2026-09-08 08:30:12", user_name: "Pitmaster Babajide" },
  { id: 5756, product_id: 64, product_name: "FRESH CATFISH", sku: "SKU-00030", unit: "KG", location: "raw", movement_type: "consumption", quantity: -12, unit_cost: 4500, value_amount: 54000, balance_after: 48, notes: "Fish grill prep for Batch BAT-00024", created_at: "2026-09-25 09:15:00", user_name: "Pitmaster Babajide" },
  { id: 5757, product_id: 72, product_name: "GOAT MEAT (CHEVON CUT)", sku: "SKU-00038", unit: "KG", location: "raw", movement_type: "consumption", quantity: -14, unit_cost: 9200, value_amount: 128800, balance_after: 36, notes: "Asun prep run Batch BAT-00025", created_at: "2026-09-25 08:45:00", user_name: "Babajide 'Pitmaster'" },
  { id: 5758, product_id: 53, product_name: "DRY PEPPER", sku: "SKU-00019", unit: "KG", location: "raw", movement_type: "consumption", quantity: -2.5, unit_cost: 3300, value_amount: 8250, balance_after: 16, notes: "Daily spice rub grinding", created_at: "2026-09-25 07:40:00", user_name: "Chioma Okonkwo" },
  { id: 5759, product_id: 55, product_name: "VEGETABLE OIL", sku: "SKU-00021", unit: "LITRE", location: "raw", movement_type: "consumption", quantity: -3, unit_cost: 2264, value_amount: 6792, balance_after: 35, notes: "Jollof rice & marinade emulsion", created_at: "2026-09-24 15:20:00", user_name: "Folake Adebayo" },
  { id: 5760, product_id: 73, product_name: "CRUSHED HABANERO FLAKES", sku: "SKU-00039", unit: "KG", location: "raw", movement_type: "consumption", quantity: -3, unit_cost: 4100, value_amount: 12300, balance_after: 22, notes: "Kilishi dry pepper dust seasoning", created_at: "2026-09-24 11:30:00", user_name: "Emeka Nwosu" },
  { id: 5761, product_id: 54, product_name: "SPICIES (SECRET BLEND)", sku: "SKU-00020", unit: "PACK", location: "raw", movement_type: "consumption", quantity: -1.5, unit_cost: 19900, value_amount: 29850, balance_after: 8, notes: "Guineafowl marinade tubs prep", created_at: "2026-09-24 08:10:00", user_name: "Babajide 'Pitmaster'" },
  { id: 5762, product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", unit: "PIECES", location: "raw", movement_type: "waste", quantity: -1, unit_cost: 6500, value_amount: 6500, balance_after: 71, notes: "Bruised carcass discarded during QC", created_at: "2026-09-23 16:00:00", user_name: "Folake Adebayo" },
  { id: 5763, product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", unit: "KG", location: "raw", movement_type: "adjustment", quantity: -1, unit_cost: 8500, value_amount: 8500, balance_after: 54, notes: "Fat trimming shrinkage correction", created_at: "2026-09-23 10:15:00", user_name: "Chioma Okonkwo" },
  { id: 5764, product_id: 52, product_name: "FIREWOOD", sku: "SKU-00018", unit: "BUNDLE", location: "raw", movement_type: "consumption", quantity: -4, unit_cost: 570, value_amount: 2280, balance_after: 24, notes: "Pit #3 overnight warm hold", created_at: "2026-09-22 21:00:00", user_name: "Emeka Nwosu" },
]

export const SEED_RAW_USAGE: RawUsageItem[] = [
  { product_id: 62, product_name: "FRESH GUINEAFOWL", sku: "SKU-00028", unit: "PIECES", unit_cost: 6500, total_used: 971.97, total_value: 6317831 },
  { product_id: 63, product_name: "FRESH CHICKEN", sku: "SKU-00029", unit: "PIECES", unit_cost: 6500, total_used: 189.0, total_value: 1228500 },
  { product_id: 52, product_name: "FIREWOOD", sku: "SKU-00018", unit: "BUNDLE", unit_cost: 570, total_used: 44.0, total_value: 25080 },
  { product_id: 65, product_name: "FRESH KING-SIZE GUINEAFOWL", sku: "SKU-00031", unit: "PIECES", unit_cost: 12000, total_used: 10.0, total_value: 120000 },
  { product_id: 54, product_name: "SPICIES", sku: "SKU-00020", unit: "PACK", unit_cost: 19900, total_used: 5.0, total_value: 99500 },
  { product_id: 55, product_name: "VEGETABLE OIL", sku: "SKU-00021", unit: "LITRE", unit_cost: 2264, total_used: 5.0, total_value: 11320 },
  { product_id: 64, product_name: "FRESH CATFISH", sku: "SKU-00030", unit: "KG", unit_cost: 4500, total_used: 48.0, total_value: 216000 },
  { product_id: 70, product_name: "JUMBO TURKEY WINGS", sku: "SKU-00036", unit: "KG", unit_cost: 7200, total_used: 35.0, total_value: 252000 },
  { product_id: 71, product_name: "BEEF BRISKET CUT (PRIME)", sku: "SKU-00037", unit: "KG", unit_cost: 8500, total_used: 42.0, total_value: 357000 },
  { product_id: 72, product_name: "GOAT MEAT (CHEVON CUT)", sku: "SKU-00038", unit: "KG", unit_cost: 9200, total_used: 28.0, total_value: 257600 },
  { product_id: 73, product_name: "CRUSHED HABANERO FLAKES", sku: "SKU-00039", unit: "KG", unit_cost: 4100, total_used: 12.0, total_value: 49200 },
  { product_id: 74, product_name: "HICKORY WOOD CHIPS", sku: "SKU-00040", unit: "SACK", unit_cost: 3800, total_used: 14.0, total_value: 53200 },
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
  { id: 114, sku: "PCK013", name: "FOIL TAKE-OUT FOOD CONTAINERS", product_type: "packaging", unit: "SETS", reorder_level: 150, unit_cost: 210, stock_qty: 280, qty_allocated: 12, qty_available: 268, inventory_value: 58800, is_active: 1 },
  { id: 115, sku: "PCK014", name: "ECO BROWN KRAFT BAGS (LARGE)", product_type: "packaging", unit: "PCS", reorder_level: 200, unit_cost: 180, stock_qty: 310, qty_allocated: 8, qty_available: 302, inventory_value: 55800, is_active: 1 },
  { id: 116, sku: "PCK015", name: "WOODEN DISPOSABLE CUTLERY PACKS", product_type: "packaging", unit: "SETS", reorder_level: 300, unit_cost: 85, stock_qty: 540, qty_allocated: 25, qty_available: 515, inventory_value: 45900, is_active: 1 },
  { id: 117, sku: "PCK016", name: "PROPRIETARY BRAND STICKER ROLLS", product_type: "packaging", unit: "ROLLS", reorder_level: 20, unit_cost: 1250, stock_qty: 32, qty_allocated: 2, qty_available: 30, inventory_value: 40000, is_active: 1 },
]

export const SEED_PACKAGING_RECEIPTS_TOTALS: PackagingReceiptTotal[] = [
  { product_id: 93, product_name: "BIG BRANDED BAG", sku: "PCK004", unit: "PIECES", total_qty: 2500, avg_unit_cost: 420, total_value: 1050000, receipt_count: 5, last_received: "2026-09-12" },
  { product_id: 95, product_name: "BRANDED POLYBAG", sku: "PCK006", unit: "PCS", total_qty: 10000, avg_unit_cost: 105, total_value: 1050000, receipt_count: 4, last_received: "2026-09-15" },
  { product_id: 96, product_name: "1 LITER FOOD BOWL & LID", sku: "PCK007", unit: "SETS", total_qty: 3000, avg_unit_cost: 280, total_value: 840000, receipt_count: 6, last_received: "2026-09-20" },
  { product_id: 112, product_name: "VACUUM SEAL POUCHES (20x30CM)", sku: "PCK011", unit: "PCS", total_qty: 2000, avg_unit_cost: 120, total_value: 240000, receipt_count: 2, last_received: "2026-09-22" },
  { product_id: 97, product_name: "HEAVY DUTY FOIL WRAP", sku: "PCK008", unit: "ROLLS", total_qty: 50, avg_unit_cost: 3200, total_value: 160000, receipt_count: 3, last_received: "2026-09-18" },
  { product_id: 110, product_name: "MEDIUM POLY BAG", sku: "SKU-00076", unit: "PCS", total_qty: 4000, avg_unit_cost: 95, total_value: 380000, receipt_count: 3, last_received: "2026-09-16" },
  { product_id: 111, product_name: "500ML SAUCE CUPS & CAPS", sku: "PCK010", unit: "SETS", total_qty: 5000, avg_unit_cost: 65, total_value: 325000, receipt_count: 4, last_received: "2026-09-21" },
  { product_id: 113, product_name: "TAMPER-EVIDENT SECURITY SEALS", sku: "PCK012", unit: "ROLLS", total_qty: 60, avg_unit_cost: 1400, total_value: 84000, receipt_count: 2, last_received: "2026-09-23" },
  { product_id: 98, product_name: "THERMAL DISPATCH LABELS", sku: "PCK009", unit: "ROLLS", total_qty: 40, avg_unit_cost: 1650, total_value: 66000, receipt_count: 2, last_received: "2026-09-19" },
  { product_id: 114, product_name: "FOIL TAKE-OUT FOOD CONTAINERS", sku: "PCK013", unit: "SETS", total_qty: 1500, avg_unit_cost: 210, total_value: 315000, receipt_count: 3, last_received: "2026-09-24" },
  { product_id: 115, product_name: "ECO BROWN KRAFT BAGS (LARGE)", sku: "PCK014", unit: "PCS", total_qty: 2000, avg_unit_cost: 180, total_value: 360000, receipt_count: 2, last_received: "2026-09-22" },
  { product_id: 116, product_name: "WOODEN DISPOSABLE CUTLERY PACKS", sku: "PCK015", unit: "SETS", total_qty: 3000, avg_unit_cost: 85, total_value: 255000, receipt_count: 3, last_received: "2026-09-24" },
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
  { id: 75, sku: "WEB-SMOKED-GOAT-ASUN-BOWL", name: "Smoked Goat Meat Asun (Chevon Bowl)", product_type: "sales", unit: "unit", reorder_level: 25, unit_cost: 7500, selling_price: 16000, stock_qty: 38, qty_allocated: 2, qty_available: 36, inventory_value: 285000, is_active: 1 },
  { id: 76, sku: "WEB-PEPPERED-SNAIL-PLANTAIN", name: "Peppered Jumbo Snail & Plantain Combo", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 9000, selling_price: 19500, stock_qty: 22, qty_allocated: 1, qty_available: 21, inventory_value: 198000, is_active: 1 },
  { id: 77, sku: "WEB-SMOKEY-BBQ-PLATTER", name: "Smokey Hut Feast BBQ Platter (Platter for 4)", product_type: "sales", unit: "unit", reorder_level: 10, unit_cost: 18000, selling_price: 42000, stock_qty: 18, qty_allocated: 2, qty_available: 16, inventory_value: 324000, is_active: 1 },
  { id: 78, sku: "WEB-GINGER-LEMONADE-50CL", name: "Craft Ginger Honey Lemonade (50cl)", product_type: "sales", unit: "unit", reorder_level: 30, unit_cost: 700, selling_price: 2000, stock_qty: 65, qty_allocated: 0, qty_available: 65, inventory_value: 45500, is_active: 1 },
]

export const SEED_DAILY_SALES: DailySalesItem[] = [
  { product_id: 38, product_name: "Full Smokey Guineafowl", sku: "WEB-FULL-SMOKEY-GUINEAFOWL", unit: "unit", qty_sold: 14, sale_count: 8, order_count: 8, total_value: 175000, channel_breakdown: "Website: 10 | POS Walk-in: 4" },
  { product_id: 48, product_name: "Smokey Beef Jerkey (Kilishi)", sku: "WEB-SMOKEY-BEEF-JERKEY-KILISHI", unit: "unit", qty_sold: 8, sale_count: 5, order_count: 5, total_value: 44000, channel_breakdown: "Website: 6 | POS Walk-in: 2" },
  { product_id: 56, product_name: "Smokey Jumbo Turkey Wings (Pair)", sku: "WEB-JUMBO-TURKEY-WINGS-PAIR", unit: "unit", qty_sold: 6, sale_count: 4, order_count: 4, total_value: 87000, channel_breakdown: "Website: 4 | POS Walk-in: 2" },
  { product_id: 57, product_name: "Charcoal Roasted Whole Catfish (Family)", sku: "WEB-ROASTED-CATFISH-FAMILY", unit: "unit", qty_sold: 5, sale_count: 3, order_count: 3, total_value: 55000, channel_breakdown: "Website: 3 | POS Walk-in: 2" },
  { product_id: 40, product_name: "Travel Standard Dry Guineafowl", sku: "WEB-TRAVEL-STANDARD-DRY-GUIN", unit: "unit", qty_sold: 5, sale_count: 3, order_count: 3, total_value: 65000, channel_breakdown: "Website: 5 | POS Walk-in: 0" },
  { product_id: 44, product_name: "1 Liter Bowl Guineafowl Rice", sku: "WEB-1-LITER-BOWL-GUINEAFOWL", unit: "unit", qty_sold: 6, sale_count: 4, order_count: 4, total_value: 132000, channel_breakdown: "Website: 4 | POS Walk-in: 2" },
  { product_id: 51, product_name: "Undiluted Palmwine (50cl)", sku: "WEB-UNDILUTED-PALMWINE-50CL", unit: "unit", qty_sold: 12, sale_count: 6, order_count: 6, total_value: 24000, channel_breakdown: "Website: 8 | POS Walk-in: 4" },
  { product_id: 75, product_name: "Smoked Goat Meat Asun (Chevon Bowl)", sku: "WEB-SMOKED-GOAT-ASUN-BOWL", unit: "unit", qty_sold: 7, sale_count: 5, order_count: 5, total_value: 112000, channel_breakdown: "Website: 5 | POS Walk-in: 2" },
  { product_id: 76, product_name: "Peppered Jumbo Snail & Plantain Combo", sku: "WEB-PEPPERED-SNAIL-PLANTAIN", unit: "unit", qty_sold: 4, sale_count: 3, order_count: 3, total_value: 78000, channel_breakdown: "Website: 3 | POS Walk-in: 1" },
  { product_id: 77, product_name: "Smokey Hut Feast BBQ Platter", sku: "WEB-SMOKEY-BBQ-PLATTER", unit: "unit", qty_sold: 3, sale_count: 2, order_count: 2, total_value: 126000, channel_breakdown: "Website: 2 | POS Walk-in: 1" },
  { product_id: 60, product_name: "Peppered Smoked Gizzard Skewers", sku: "WEB-PEPPERED-GIZZARD-SKEWERS", unit: "unit", qty_sold: 9, sale_count: 6, order_count: 6, total_value: 45000, channel_breakdown: "Website: 6 | POS Walk-in: 3" },
  { product_id: 61, product_name: "Spiced Hibiscus Zobo Beverage (50cl)", sku: "WEB-HIBISCUS-ZOBO-50CL", unit: "unit", qty_sold: 15, sale_count: 8, order_count: 8, total_value: 27000, channel_breakdown: "Website: 9 | POS Walk-in: 6" },
  { product_id: 78, product_name: "Craft Ginger Honey Lemonade (50cl)", sku: "WEB-GINGER-LEMONADE-50CL", unit: "unit", qty_sold: 10, sale_count: 5, order_count: 5, total_value: 20000, channel_breakdown: "Website: 7 | POS Walk-in: 3" },
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
  { id: 4612, product_id: 75, product_name: "Smoked Goat Meat Asun", sku: "WEB-SMOKED-GOAT-ASUN-BOWL", unit: "unit", location: "finished", movement_type: "production_output", quantity: 25, unit_cost: 7500, value_amount: 187500, balance_after: 38, notes: "Batch BAT-00025 Asun run finished", created_at: "2026-09-25 11:45:00", user_name: "Babajide 'Pitmaster'" },
  { id: 4613, product_id: 75, product_name: "Smoked Goat Meat Asun", sku: "WEB-SMOKED-GOAT-ASUN-BOWL", unit: "unit", location: "sales", movement_type: "sale", quantity: -2, unit_cost: 7500, value_amount: 15000, balance_after: 36, notes: "Website Order SHD-07667 dispatch", created_at: "2026-09-25 12:10:00", user_name: "Website Storefront" },
  { id: 4614, product_id: 60, product_name: "Peppered Smoked Gizzard Skewers", sku: "WEB-PEPPERED-GIZZARD-SKEWERS", unit: "unit", location: "finished", movement_type: "production_output", quantity: 30, unit_cost: 2200, value_amount: 66000, balance_after: 45, notes: "Afternoon skewer run completed", created_at: "2026-09-25 12:30:00", user_name: "Folake Adebayo" },
  { id: 4615, product_id: 76, product_name: "Peppered Jumbo Snail & Plantain", sku: "WEB-PEPPERED-SNAIL-PLANTAIN", unit: "unit", location: "sales", movement_type: "sale", quantity: -1, unit_cost: 9000, value_amount: 9000, balance_after: 21, notes: "VIP order SHD-07668 dispatch", created_at: "2026-09-25 13:00:00", user_name: "Website Storefront" },
  { id: 4616, product_id: 44, product_name: "1 Liter Bowl Guineafowl Rice", sku: "WEB-1L-BOWL", unit: "unit", location: "finished", movement_type: "production_output", quantity: 40, unit_cost: 9500, value_amount: 380000, balance_after: 50, notes: "Batch BAT-00022 Jollof lunch run", created_at: "2026-09-25 13:15:00", user_name: "Folake Adebayo" },
  { id: 4617, product_id: 51, product_name: "Undiluted Palmwine (50cl)", sku: "WEB-UNDILUTED-PALMWINE-50CL", unit: "unit", location: "sales", movement_type: "sale", quantity: -4, unit_cost: 800, value_amount: 3200, balance_after: 92, notes: "Order SHD-07669 combo delivery", created_at: "2026-09-25 13:40:00", user_name: "Website Storefront" },
  { id: 4618, product_id: 77, product_name: "Smokey Hut Feast BBQ Platter", sku: "WEB-SMOKEY-BBQ-PLATTER", unit: "unit", location: "finished", movement_type: "production_output", quantity: 10, unit_cost: 18000, value_amount: 180000, balance_after: 18, notes: "Weekend catering platter run", created_at: "2026-09-25 14:00:00", user_name: "OPERATION MANAGER" },
  { id: 4619, product_id: 38, product_name: "Full Smokey Guineafowl", sku: "GNF001", unit: "PIECES", location: "sales", movement_type: "adjustment", quantity: -1, unit_cost: 6500, value_amount: 6500, balance_after: 63, notes: "QC sensory inspection audit sample", created_at: "2026-09-25 14:30:00", user_name: "Folake Adebayo" },
]

export const SEED_SUPPLIERS: Supplier[] = [
  { id: 2, supplier_ref: "SUP-00001", name: "MADAM POULTRY CO.", phone: "09110382689", email: "smokeyhut04@gmail.com", address: "13 McNeil Str, Sabo Yaba, Lagos", category: "Fresh Poultry & Proteins", delivery_count: 42, total_spend: 8450000, is_active: 1 },
  { id: 3, supplier_ref: "SUP-00002", name: "LOCAL MARKET AGRO", phone: "09110382689", email: "agro@localmarket.ng", address: "Oyingbo Wholesale Market, Lagos", category: "Spices & Dry Peppers", delivery_count: 18, total_spend: 1240000, is_active: 1 },
  { id: 6, supplier_ref: "SUP-00005", name: "HARDWOOD LOGISTICS", phone: "08034567890", email: "timber@hardwood.ng", address: "Epe Sawmill Depot, Lagos", category: "Smoker Firewood & Charcoal", delivery_count: 12, total_spend: 342000, is_active: 1 },
  { id: 4, supplier_ref: "SUP-00003", name: "PRIME PACKAGING LTD", phone: "08099887766", email: "orders@primepack.com", address: "Ilupeju Industrial Estate, Lagos", category: "Food Grade Packaging & Bags", delivery_count: 15, total_spend: 3100000, is_active: 1 },
  { id: 7, supplier_ref: "SUP-00004", name: "EPE ARTISANAL FISHERIES", phone: "08022334455", email: "fish@epefisheries.ng", address: "Epe Fish Landing Jetty, Lagos", category: "Fresh Catfish & Aquaculture", delivery_count: 14, total_spend: 1890000, is_active: 1 },
  { id: 8, supplier_ref: "SUP-00006", name: "OYINGBO MEAT DEPOT", phone: "08077665544", email: "sales@oyingbomeat.ng", address: "Oyingbo Abattoir Complex, Lagos", category: "Prime Chevon & Beef Brisket", delivery_count: 22, total_spend: 4250000, is_active: 1 },
  { id: 9, supplier_ref: "SUP-00007", name: "AGRO-ALLIED PRODUCE", phone: "08133445566", email: "info@agroallied.ng", address: "Mile 12 International Market, Lagos", category: "Vegetable Oils & Cooking Fats", delivery_count: 16, total_spend: 2150000, is_active: 1 },
  { id: 10, supplier_ref: "SUP-00008", name: "DANGOTE REFINED SUGAR & SALT", phone: "08055667788", email: "orders@dangoteagro.com", address: "Apapa Wharf Industrial Zone, Lagos", category: "Refined Iodized Salt & Seasoning", delivery_count: 9, total_spend: 850000, is_active: 1 },
  { id: 11, supplier_ref: "SUP-00009", name: "SUPREME SPICE MILLS", phone: "08099001122", email: "spices@suprememills.ng", address: "Bompai Industrial Area, Kano", category: "Specialty Spice Rubs & Botanical Pods", delivery_count: 11, total_spend: 1680000, is_active: 1 },
  { id: 12, supplier_ref: "SUP-00010", name: "CROWN PACKAGING SOLUTIONS", phone: "08122334455", email: "service@crownpack.ng", address: "Oregun Industrial Estate, Ikeja, Lagos", category: "Foil Trays & Eco Kraft Paper Bags", delivery_count: 13, total_spend: 2450000, is_active: 1 },
  { id: 13, supplier_ref: "SUP-00011", name: "LAGOS COLD CHAIN LOGISTICS", phone: "08044556677", email: "reefer@lagoscoldchain.com", address: "Iganmu Cold Storage Terminal, Lagos", category: "Refrigerated Inbound Haulage", delivery_count: 20, total_spend: 3800000, is_active: 1 },
  { id: 14, supplier_ref: "SUP-00012", name: "GREENFIELD FARMS OYO", phone: "08155667788", email: "poultry@greenfieldfarms.ng", address: "Oyo Farm Settlement, Oyo State", category: "Organic Broilers & Guinea Fowl Hatchery", delivery_count: 17, total_spend: 5600000, is_active: 1 },
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
    id: 35,
    batch_ref: "BAT-00024",
    output_product_id: 57,
    output_product_name: "Charcoal Roasted Whole Catfish (Family)",
    expected_output: 15,
    actual_output: 15,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-25 07:00:00",
    completed_at: "2026-09-25 11:30:00",
    remarks: "Moist flake texture with signature smokey rub aroma.",
    created_by_name: "Pitmaster Babajide",
    recipe_template_id: 4,
    variance_pct: 0,
    raw_materials: [
      { product_id: 64, sku: "SKU-00030", name: "FRESH CATFISH", quantity: 15, unit: "KG" },
      { product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", quantity: 1.2, unit: "KG" },
      { product_id: 52, sku: "SKU-00018", name: "FIREWOOD", quantity: 2.0, unit: "BUNDLE" },
    ]
  },
  {
    id: 36,
    batch_ref: "BAT-00025",
    output_product_id: 72,
    output_product_name: "Smoked Goat Meat Asun (Chevon Bowl)",
    expected_output: 25,
    actual_output: 25,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-25 08:00:00",
    completed_at: "2026-09-25 12:15:00",
    remarks: "Tender goat meat infused with scotch bonnet pepper & onions.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 6,
    variance_pct: 0,
    raw_materials: [
      { product_id: 72, sku: "SKU-00038", name: "GOAT MEAT (CHEVON CUT)", quantity: 20, unit: "KG" },
      { product_id: 73, sku: "SKU-00039", name: "CRUSHED HABANERO FLAKES", quantity: 1.0, unit: "KG" },
    ]
  },
  {
    id: 37,
    batch_ref: "BAT-00018",
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    expected_output: 45,
    actual_output: 45,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-23 07:15:00",
    completed_at: "2026-09-23 15:45:00",
    remarks: "Batch passed laboratory salmonella & core temp testing.",
    created_by_name: "Folake Adebayo",
    recipe_template_id: 1,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 45, unit: "PIECES" },
      { product_id: 52, sku: "SKU-00018", name: "FIREWOOD", quantity: 3.5, unit: "BUNDLE" },
    ]
  },
  {
    id: 38,
    batch_ref: "BAT-00019",
    output_product_id: 65,
    output_product_name: "Fresh King-Size Smoked Guineafowl",
    expected_output: 20,
    actual_output: 20,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-23 09:30:00",
    completed_at: "2026-09-23 17:00:00",
    remarks: "Premium VIP whole jumbo birds.",
    created_by_name: "OPERATION MANAGER",
    recipe_template_id: 9,
    variance_pct: 0,
    raw_materials: [
      { product_id: 65, sku: "SKU-00031", name: "FRESH KING-SIZE GUINEAFOWL", quantity: 20, unit: "PIECES" },
      { product_id: 74, sku: "SKU-00040", name: "HICKORY WOOD CHIPS", quantity: 1.5, unit: "SACK" },
    ]
  },
  {
    id: 39,
    batch_ref: "BAT-00017",
    output_product_id: 48,
    output_product_name: "Smokey Beef Jerkey (Kilishi)",
    expected_output: 30,
    actual_output: 30,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-22 08:00:00",
    completed_at: "2026-09-22 18:30:00",
    remarks: "10-hour low-heat dehydrator run. Moisture content under 12%.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 5,
    variance_pct: 0,
    raw_materials: [
      { product_id: 71, sku: "SKU-00037", name: "BEEF BRISKET CUT (PRIME)", quantity: 20, unit: "KG" },
      { product_id: 73, sku: "SKU-00039", name: "CRUSHED HABANERO FLAKES", quantity: 2.0, unit: "KG" },
    ]
  },
  {
    id: 40,
    batch_ref: "BAT-00016",
    output_product_id: 44,
    output_product_name: "1 Liter Bowl Guineafowl Rice",
    expected_output: 40,
    actual_output: 40,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-22 10:00:00",
    completed_at: "2026-09-22 13:30:00",
    remarks: "Lunch catering corporate order batch complete.",
    created_by_name: "Folake Adebayo",
    recipe_template_id: 2,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 20, unit: "PIECES" },
      { product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", quantity: 3.0, unit: "LITRE" },
    ]
  },
  {
    id: 41,
    batch_ref: "BAT-00015",
    output_product_id: 60,
    output_product_name: "Peppered Smoked Gizzard Skewers",
    expected_output: 30,
    actual_output: 30,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-21 11:00:00",
    completed_at: "2026-09-21 14:15:00",
    remarks: "Quick bite skewers batch for bar stock.",
    created_by_name: "Emeka Nwosu",
    recipe_template_id: 7,
    variance_pct: 0,
    raw_materials: [
      { product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", quantity: 12, unit: "PIECES" },
      { product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", quantity: 1.5, unit: "KG" },
    ]
  },
  {
    id: 42,
    batch_ref: "BAT-00014",
    output_product_id: 61,
    output_product_name: "Spiced Hibiscus Zobo Beverage (50cl)",
    expected_output: 60,
    actual_output: 60,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-21 07:30:00",
    completed_at: "2026-09-21 11:00:00",
    remarks: "Slow-brewed hibiscus leaves with ginger & pineapple essence.",
    created_by_name: "Chioma Okonkwo",
    recipe_template_id: 11,
    variance_pct: 0,
    raw_materials: [
      { product_id: 68, sku: "SKU-00034", name: "CINNAMON STICK", quantity: 1.0, unit: "PACK" },
    ]
  },
  {
    id: 43,
    batch_ref: "BAT-00013",
    output_product_id: 56,
    output_product_name: "Smokey Jumbo Turkey Wings (Pair)",
    expected_output: 25,
    actual_output: 25,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-20 06:45:00",
    completed_at: "2026-09-20 11:30:00",
    remarks: "Sunday peak delivery wing inventory batch.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 3,
    variance_pct: 0,
    raw_materials: [
      { product_id: 70, sku: "SKU-00036", name: "JUMBO TURKEY WINGS", quantity: 18, unit: "KG" },
    ]
  },
  {
    id: 44,
    batch_ref: "BAT-00012",
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    expected_output: 50,
    actual_output: 50,
    wastage: 0,
    status: "completed",
    started_at: "2026-09-19 07:00:00",
    completed_at: "2026-09-19 16:00:00",
    remarks: "Saturday market dispatch run complete.",
    created_by_name: "OPERATION MANAGER",
    recipe_template_id: 1,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 50, unit: "PIECES" },
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
  },
  {
    id: 45,
    batch_ref: "BAT-00026",
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    expected_output: 50,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 11:30:00",
    completed_at: null,
    remarks: "Pit #1 loaded with 50 birds; smoke chamber at 115°C.",
    created_by_name: "OPERATION MANAGER",
    recipe_template_id: 1,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 50, unit: "PIECES" },
    ]
  },
  {
    id: 46,
    batch_ref: "BAT-00027",
    output_product_id: 57,
    output_product_name: "Charcoal Roasted Whole Catfish",
    expected_output: 20,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 12:00:00",
    completed_at: null,
    remarks: "Grill staging on pit #2; baste marinade applied.",
    created_by_name: "Pitmaster Babajide",
    recipe_template_id: 4,
    variance_pct: 0,
    raw_materials: [
      { product_id: 64, sku: "SKU-00030", name: "FRESH CATFISH", quantity: 20, unit: "KG" },
    ]
  },
  {
    id: 47,
    batch_ref: "BAT-00028",
    output_product_id: 60,
    output_product_name: "Peppered Smoked Gizzard Skewers",
    expected_output: 40,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 13:00:00",
    completed_at: null,
    remarks: "Par-steamed gizzards threaded onto bamboo skewers.",
    created_by_name: "Emeka Nwosu",
    recipe_template_id: 7,
    variance_pct: 0,
    raw_materials: [
      { product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", quantity: 16, unit: "PIECES" },
    ]
  },
  {
    id: 48,
    batch_ref: "BAT-00029",
    output_product_id: 66,
    output_product_name: "Charcoal Smoked Whole Turkey",
    expected_output: 10,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Pre-order for weekend event catering awaiting poultry defrost.",
    created_by_name: "Folake Adebayo",
    recipe_template_id: 10,
    variance_pct: 0,
    raw_materials: [
      { product_id: 66, sku: "SKU-00032", name: "FRESH TURKEY", quantity: 10, unit: "PIECES" },
    ]
  },
  {
    id: 49,
    batch_ref: "BAT-00030",
    output_product_id: 72,
    output_product_name: "Smoked Goat Meat Asun",
    expected_output: 30,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Evening lounge order preparation schedule.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 6,
    variance_pct: 0,
    raw_materials: [
      { product_id: 72, sku: "SKU-00038", name: "GOAT MEAT (CHEVON CUT)", quantity: 24, unit: "KG" },
    ]
  },
  {
    id: 50,
    batch_ref: "BAT-00031",
    output_product_id: 40,
    output_product_name: "Travel Standard Dry Guineafowl",
    expected_output: 30,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Export dried poultry vacuum pack run schedule.",
    created_by_name: "OPERATION MANAGER",
    recipe_template_id: 8,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 30, unit: "PIECES" },
    ]
  },
  {
    id: 51,
    batch_ref: "BAT-00032",
    output_product_id: 61,
    output_product_name: "Spiced Hibiscus Zobo Beverage",
    expected_output: 80,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 13:30:00",
    completed_at: null,
    remarks: "Boiling stainless vat #2; cooling before bottling.",
    created_by_name: "Chioma Okonkwo",
    recipe_template_id: 11,
    variance_pct: 0,
    raw_materials: [
      { product_id: 68, sku: "SKU-00034", name: "CINNAMON STICK", quantity: 1.5, unit: "PACK" },
    ]
  },
  {
    id: 52,
    batch_ref: "BAT-00033",
    output_product_id: 56,
    output_product_name: "Smokey Jumbo Turkey Wings (Pair)",
    expected_output: 25,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Friday dinner crowd prep planned for 4 PM start.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 3,
    variance_pct: 0,
    raw_materials: [
      { product_id: 70, sku: "SKU-00036", name: "JUMBO TURKEY WINGS", quantity: 18, unit: "KG" },
    ]
  },
  {
    id: 53,
    batch_ref: "BAT-00034",
    output_product_id: 39,
    output_product_name: "Full Smokey Guineafowl (Chopped)",
    expected_output: 35,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 14:00:00",
    completed_at: null,
    remarks: "Cleaver chopping station #1 busy processing batch.",
    created_by_name: "Emeka Nwosu",
    recipe_template_id: 12,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 35, unit: "PIECES" },
    ]
  },
  {
    id: 54,
    batch_ref: "BAT-00035",
    output_product_id: 44,
    output_product_name: "1 Liter Bowl Guineafowl Rice",
    expected_output: 50,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Saturday lunch rush batch scheduled.",
    created_by_name: "Folake Adebayo",
    recipe_template_id: 2,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 25, unit: "PIECES" },
    ]
  },
  {
    id: 55,
    batch_ref: "BAT-00036",
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    expected_output: 40,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Sunday pre-order queue allocation awaiting smoker ignition.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 1,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 40, unit: "PIECES" },
      { product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", quantity: 2.0, unit: "KG" },
    ]
  },
  {
    id: 56,
    batch_ref: "BAT-00037",
    output_product_id: 48,
    output_product_name: "Smokey Beef Jerkey (Kilishi)",
    expected_output: 35,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Spiced beef strips arranged on dehydrator trays.",
    created_by_name: "Chioma Okonkwo",
    recipe_template_id: 5,
    variance_pct: 0,
    raw_materials: [
      { product_id: 71, sku: "SKU-00037", name: "BEEF BRISKET CUT (PRIME)", quantity: 25, unit: "KG" },
    ]
  },
  {
    id: 57,
    batch_ref: "BAT-00038",
    output_product_id: 57,
    output_product_name: "Charcoal Roasted Whole Catfish",
    expected_output: 25,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Cleaned and scored catfish awaiting secret dry rub marinade.",
    created_by_name: "Pitmaster Babajide",
    recipe_template_id: 4,
    variance_pct: 0,
    raw_materials: [
      { product_id: 64, sku: "SKU-00030", name: "FRESH CATFISH", quantity: 25, unit: "KG" },
    ]
  },
  {
    id: 58,
    batch_ref: "BAT-00039",
    output_product_id: 60,
    output_product_name: "Peppered Smoked Gizzard Skewers",
    expected_output: 45,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Marinated gizzard batch ready for skewering.",
    created_by_name: "Emeka Nwosu",
    recipe_template_id: 7,
    variance_pct: 0,
    raw_materials: [
      { product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", quantity: 18, unit: "PIECES" },
    ]
  },
  {
    id: 59,
    batch_ref: "BAT-00040",
    output_product_id: 61,
    output_product_name: "Spiced Hibiscus Zobo Beverage",
    expected_output: 100,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    started_at: null,
    completed_at: null,
    remarks: "Dried hibiscus calyces rinsed and measured with clove-ginger infusion.",
    created_by_name: "Folake Adebayo",
    recipe_template_id: 11,
    variance_pct: 0,
    raw_materials: [
      { product_id: 68, sku: "SKU-00034", name: "CINNAMON STICK", quantity: 2.0, unit: "PACK" },
    ]
  },
  {
    id: 60,
    batch_ref: "BAT-00041",
    output_product_id: 72,
    output_product_name: "Smoked Goat Meat Asun",
    expected_output: 30,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 14:15:00",
    completed_at: null,
    remarks: "Roasting over glowing hardwood charcoal with sliced habaneros and onions.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 6,
    variance_pct: 0,
    raw_materials: [
      { product_id: 72, sku: "SKU-00038", name: "GOAT MEAT (CHEVON CUT)", quantity: 25, unit: "KG" },
    ]
  },
  {
    id: 61,
    batch_ref: "BAT-00042",
    output_product_id: 40,
    output_product_name: "Travel Standard Dry Guineafowl",
    expected_output: 35,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 14:30:00",
    completed_at: null,
    remarks: "In pit chamber #3 for moisture reduction and hardwood dehydration.",
    created_by_name: "OPERATION MANAGER",
    recipe_template_id: 8,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 35, unit: "PIECES" },
    ]
  },
  {
    id: 62,
    batch_ref: "BAT-00043",
    output_product_id: 66,
    output_product_name: "Charcoal Smoked Whole Turkey",
    expected_output: 12,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 14:45:00",
    completed_at: null,
    remarks: "Slow smoking at 105°C; internal breast temperature checked at 68°C.",
    created_by_name: "Pitmaster Babajide",
    recipe_template_id: 10,
    variance_pct: 0,
    raw_materials: [
      { product_id: 66, sku: "SKU-00032", name: "FRESH TURKEY", quantity: 12, unit: "PIECES" },
    ]
  },
  {
    id: 63,
    batch_ref: "BAT-00044",
    output_product_id: 44,
    output_product_name: "1 Liter Bowl Guineafowl Rice",
    expected_output: 40,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 15:00:00",
    completed_at: null,
    remarks: "Simmering in concentrated smoked guineafowl stock.",
    created_by_name: "Folake Adebayo",
    recipe_template_id: 2,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 20, unit: "PIECES" },
    ]
  },
  {
    id: 64,
    batch_ref: "BAT-00045",
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    expected_output: 50,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    started_at: "2026-09-25 15:15:00",
    completed_at: null,
    remarks: "Final smoking phase; brushing with spiced garlic basting oil.",
    created_by_name: "Babajide 'Pitmaster'",
    recipe_template_id: 1,
    variance_pct: 0,
    raw_materials: [
      { product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", quantity: 50, unit: "PIECES" },
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
  },
  {
    id: 8553,
    order_ref: "SHD-07664",
    customer_name: "Kolawole Durojaiye",
    phone: "08023456789",
    address: "12 Isaac John Street, GRA Ikeja",
    total_amount: 32000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Smokey Jumbo Turkey Wings (Pair) × 2; Undiluted Palmwine × 2",
    items: [
      { product_name: "Smokey Jumbo Turkey Wings (Pair)", quantity: 2, unit_price: 14500, line_total: 29000 },
    ],
    created_at: "2026-09-25 09:30:15"
  },
  {
    id: 8554,
    order_ref: "SHD-07665",
    customer_name: "Fatima Aliko",
    phone: "08123459988",
    address: "Plot 18 Admiralty Way, Lekki Phase 1",
    total_amount: 44000,
    delivery_fee: 4000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "1 Liter Bowl Guineafowl Rice × 2",
    items: [
      { product_name: "1 Liter Bowl Guineafowl Rice", quantity: 2, unit_price: 22000, line_total: 44000 },
    ],
    created_at: "2026-09-25 09:45:00"
  },
  {
    id: 8555,
    order_ref: "SHD-07666",
    customer_name: "Chukwudi Eze",
    phone: "07033445566",
    address: "22 Marine Road, Apapa, Lagos",
    total_amount: 23500,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Charcoal Roasted Whole Catfish × 1; Zobo Beverage × 2",
    items: [
      { product_name: "Charcoal Roasted Whole Catfish (Family)", quantity: 1, unit_price: 11000, line_total: 11000 },
    ],
    created_at: "2026-09-25 10:00:22"
  },
  {
    id: 8556,
    order_ref: "SHD-07667",
    customer_name: "Bolaji Tinubu",
    phone: "08099881122",
    address: "5 Bourdillon Road, Ikoyi",
    total_amount: 42000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Smokey Hut Feast BBQ Platter × 1",
    items: [
      { product_name: "Smokey Hut Feast BBQ Platter (Platter for 4)", quantity: 1, unit_price: 42000, line_total: 42000 },
    ],
    created_at: "2026-09-25 10:15:40"
  },
  {
    id: 8557,
    order_ref: "SHD-07668",
    customer_name: "Ngozi Okafor",
    phone: "08055661100",
    address: "14 Awolowo Road, Ikoyi",
    total_amount: 28500,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Smoked Goat Meat Asun (Chevon Bowl) × 1; Full Smokey Guineafowl × 1",
    items: [
      { product_name: "Smoked Goat Meat Asun (Chevon Bowl)", quantity: 1, unit_price: 16000, line_total: 16000 },
    ],
    created_at: "2026-09-25 10:30:10"
  },
  {
    id: 8558,
    order_ref: "SHD-07669",
    customer_name: "Dapo Abiodun Jr.",
    phone: "08144556677",
    address: "7 Agoro Odiyan Street, Victoria Island",
    total_amount: 35000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Peppered Jumbo Snail Combo × 1; Travel Dry Guineafowl × 1",
    items: [
      { product_name: "Peppered Jumbo Snail & Plantain Combo", quantity: 1, unit_price: 19500, line_total: 19500 },
    ],
    created_at: "2026-09-25 10:45:00"
  },
  {
    id: 8559,
    order_ref: "SHD-07670",
    customer_name: "Hauwa Ibrahim",
    phone: "08066778899",
    address: "Block 4, 1004 Estates, Victoria Island",
    total_amount: 19500,
    delivery_fee: 2500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Smokey Beef Jerkey (Kilishi) × 3; Palmwine × 1",
    items: [
      { product_name: "Smokey Beef Jerkey (Kilishi) 125g", quantity: 3, unit_price: 5500, line_total: 16500 },
    ],
    created_at: "2026-09-25 11:00:15"
  },
  {
    id: 8560,
    order_ref: "SHD-07671",
    customer_name: "Tariq Danjuma",
    phone: "07011223344",
    address: "16 Alexander Avenue, Ikoyi",
    total_amount: 50000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Full Smokey Guineafowl × 4",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 4, unit_price: 12500, line_total: 50000 },
    ],
    created_at: "2026-09-25 11:15:30"
  },
  {
    id: 8561,
    order_ref: "SHD-07672",
    customer_name: "Folashade Coker",
    phone: "08088990011",
    address: "24 Lugard Avenue, Ikoyi",
    total_amount: 22000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "1 Liter Bowl Guineafowl Rice × 1",
    items: [
      { product_name: "1 Liter Bowl Guineafowl Rice", quantity: 1, unit_price: 22000, line_total: 22000 },
    ],
    created_at: "2026-09-25 11:30:45"
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
    id: 8562,
    order_ref: "SHD-07673",
    customer_name: "Dare Art Alade",
    phone: "08022114433",
    address: "9 Oba Akinjobi Way, GRA Ikeja",
    total_amount: 38000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Full Smokey Guineafowl × 2; Palmwine × 3",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 2, unit_price: 12500, line_total: 25000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "BIG BRANDED BAG", quantity: 1 },
      { packaging_name: "HEAVY DUTY FOIL WRAP", quantity: 2 }
    ],
    created_at: "2026-09-25 09:50:00"
  },
  {
    id: 8563,
    order_ref: "SHD-07674",
    customer_name: "Yinka Davies",
    phone: "08133221100",
    address: "15 Fola Osibo Street, Lekki Phase 1",
    total_amount: 31000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Smoked Goat Meat Asun × 1; Turkey Wings × 1",
    items: [
      { product_name: "Smoked Goat Meat Asun (Chevon Bowl)", quantity: 1, unit_price: 16000, line_total: 16000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 1 },
      { packaging_name: "BRANDED POLYBAG", quantity: 1 }
    ],
    created_at: "2026-09-25 10:05:00"
  },
  {
    id: 8564,
    order_ref: "SHD-07675",
    customer_name: "Olumide Bakare",
    phone: "08099887700",
    address: "32 Adeola Odeku, Victoria Island",
    total_amount: 27500,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Charcoal Roasted Whole Catfish × 1; Zobo × 2",
    items: [
      { product_name: "Charcoal Roasted Whole Catfish (Family)", quantity: 1, unit_price: 11000, line_total: 11000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "FOIL TAKE-OUT FOOD CONTAINERS", quantity: 1 },
      { packaging_name: "BIG BRANDED BAG", quantity: 1 }
    ],
    created_at: "2026-09-25 10:20:15"
  },
  {
    id: 8565,
    order_ref: "SHD-07676",
    customer_name: "Simi Ogunleye",
    phone: "07088991122",
    address: "2B Cowrie Creek Estate, Ikate Lekki",
    total_amount: 34000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "1 Liter Bowl Guineafowl Rice × 1; Gizzard Skewers × 2",
    items: [
      { product_name: "1 Liter Bowl Guineafowl Rice", quantity: 1, unit_price: 22000, line_total: 22000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 1 },
      { packaging_name: "WOODEN DISPOSABLE CUTLERY PACKS", quantity: 2 }
    ],
    created_at: "2026-09-25 10:35:00"
  },
  {
    id: 8566,
    order_ref: "SHD-07677",
    customer_name: "Kelechi Iheanacho",
    phone: "08033221199",
    address: "18 Cooper Road, Ikoyi, Lagos",
    total_amount: 45000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Smokey Hut Feast BBQ Platter × 1; Extra Bags × 2",
    items: [
      { product_name: "Smokey Hut Feast BBQ Platter (Platter for 4)", quantity: 1, unit_price: 42000, line_total: 42000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "BIGGEST BRANDED NYLON", quantity: 1 },
      { packaging_name: "HEAVY DUTY FOIL WRAP", quantity: 3 }
    ],
    created_at: "2026-09-25 10:50:30"
  },
  {
    id: 8567,
    order_ref: "SHD-07678",
    customer_name: "Zainab Ahmed",
    phone: "08155443322",
    address: "6 Temple Road, Ikoyi",
    total_amount: 25000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Full Smokey Guineafowl (Chopped) × 2",
    items: [
      { product_name: "Full Smokey Guineafowl (Chopped)", quantity: 2, unit_price: 12500, line_total: 25000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 2 },
      { packaging_name: "TAMPER-EVIDENT SECURITY SEALS", quantity: 2 }
    ],
    created_at: "2026-09-25 11:05:00"
  },
  {
    id: 8568,
    order_ref: "SHD-07679",
    customer_name: "Folarin Falana",
    phone: "08066554433",
    address: "12 Queen's Drive, Ikoyi",
    total_amount: 32000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Smoked Goat Meat Asun × 2",
    items: [
      { product_name: "Smoked Goat Meat Asun (Chevon Bowl)", quantity: 2, unit_price: 16000, line_total: 32000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "1 LITER FOOD BOWL & LID", quantity: 2 }
    ],
    created_at: "2026-09-25 11:20:15"
  },
  {
    id: 8569,
    order_ref: "SHD-07680",
    customer_name: "Uche Jombo",
    phone: "07099887766",
    address: "21 Ogundana Street, Allen Avenue, Ikeja",
    total_amount: 29000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Smokey Jumbo Turkey Wings (Pair) × 2",
    items: [
      { product_name: "Smokey Jumbo Turkey Wings (Pair)", quantity: 2, unit_price: 14500, line_total: 29000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "FOIL TAKE-OUT FOOD CONTAINERS", quantity: 2 },
      { packaging_name: "BRANDED POLYBAG", quantity: 1 }
    ],
    created_at: "2026-09-25 11:35:40"
  },
  {
    id: 8570,
    order_ref: "SHD-07681",
    customer_name: "Babatunde Raji",
    phone: "08033112244",
    address: "10 Marina Street, Lagos Island",
    total_amount: 39500,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Peppered Jumbo Snail Combo × 2",
    items: [
      { product_name: "Peppered Jumbo Snail & Plantain Combo", quantity: 2, unit_price: 19500, line_total: 39000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "FOIL TAKE-OUT FOOD CONTAINERS", quantity: 2 },
      { packaging_name: "TAMPER-EVIDENT SECURITY SEALS", quantity: 2 }
    ],
    created_at: "2026-09-25 11:50:00"
  },
  {
    id: 8571,
    order_ref: "SHD-07682",
    customer_name: "Aisha Yesufu",
    phone: "08122334466",
    address: "17 Osho Street, Opebi Ikeja",
    total_amount: 27000,
    delivery_fee: 2500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Full Smokey Guineafowl × 2; Palmwine × 1",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 2, unit_price: 12500, line_total: 25000 },
    ],
    packaging_materials_picked: [
      { packaging_name: "BIG BRANDED BAG", quantity: 1 },
      { packaging_name: "HEAVY DUTY FOIL WRAP", quantity: 2 }
    ],
    created_at: "2026-09-25 12:05:20"
  },
  {
    id: 8540,
    order_ref: "SHD-07651",
    customer_name: "Dr. Chioma Nnamdi",
    phone: "08123456789",
    address: "14 Isaac John Street, GRA Ikeja",
    total_amount: 35000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Smokey Beef Jerkey × 4; Full Smokey Guineafowl × 1",
    items: [
      { product_name: "Smokey Beef Jerkey (Kilishi) 125g", quantity: 4, unit_price: 5500, line_total: 22000 },
      { product_name: "Full Smokey Guineafowl", quantity: 1, unit_price: 12500, line_total: 12500 }
    ],
    packaged_at: "2026-09-25 08:45:00",
    packaged_by_name: "Chioma Okonkwo",
    created_at: "2026-09-25 08:15:00"
  },
  {
    id: 8541,
    order_ref: "SHD-07652",
    customer_name: "Tosin Adebisi",
    phone: "08023459988",
    address: "Plot 12 Admiralty Way, Lekki Phase 1",
    total_amount: 25000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "1 Liter Bowl Guineafowl Rice × 1; Zobo × 2",
    items: [
      { product_name: "1 Liter Bowl Guineafowl Rice", quantity: 1, unit_price: 22000, line_total: 22000 }
    ],
    packaged_at: "2026-09-25 09:00:00",
    packaged_by_name: "Segun Alabi",
    created_at: "2026-09-25 08:20:00"
  },
  {
    id: 8542,
    order_ref: "SHD-07653",
    customer_name: "Blessing Udebhu",
    phone: "07060538040",
    address: "18 Awolowo Rd, Ikoyi",
    total_amount: 18500,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Undiluted Palmwine × 2; Full Smokey Guineafowl × 1",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 1, unit_price: 12500, line_total: 12500 }
    ],
    packaged_at: "2026-09-25 09:15:00",
    packaged_by_name: "Folake Adebayo",
    created_at: "2026-09-25 08:35:00"
  },
  {
    id: 8543,
    order_ref: "SHD-07654",
    customer_name: "Femi Otedola Jr.",
    phone: "08098765432",
    address: "Victoria Garden City (VGC), Lekki",
    total_amount: 52000,
    delivery_fee: 4500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Full Smokey Guineafowl × 3; Extra Dry King Size × 1",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 3, unit_price: 12500, line_total: 37500 }
    ],
    packaged_at: "2026-09-25 09:30:00",
    packaged_by_name: "Chioma Okonkwo",
    created_at: "2026-09-25 08:50:00"
  },
  {
    id: 8544,
    order_ref: "SHD-07655",
    customer_name: "Joy Nwagbologu",
    phone: "08035671122",
    address: "15 Olamiko street dopemu, Iyana Ipaja",
    total_amount: 28500,
    delivery_fee: 4000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Full Smokey Guineafowl × 2; Undiluted Palmwine × 1",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 2, unit_price: 12500, line_total: 25000 }
    ],
    packaged_at: "2026-09-24 16:15:00",
    packaged_by_name: "Emeka Nwosu",
    created_at: "2026-09-24 15:30:00"
  },
  {
    id: 8545,
    order_ref: "SHD-07656",
    customer_name: "Mohammed Galadima",
    phone: "07087141351",
    address: "32a Cooper Rd Ikoyi, Lagos",
    total_amount: 28200,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "1L Guineafowl Rice × 1; Catfish × 1",
    items: [
      { product_name: "1 Liter Bowl Guineafowl Rice", quantity: 1, unit_price: 22000, line_total: 22000 }
    ],
    packaged_at: "2026-09-24 16:45:00",
    packaged_by_name: "Folake Adebayo",
    created_at: "2026-09-24 15:45:00"
  },
  {
    id: 8546,
    order_ref: "SHD-07657",
    customer_name: "Amina Bello",
    phone: "08091122334",
    address: "12 Glover Road, Ikoyi, Lagos",
    total_amount: 45000,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Full Smokey Guineafowl × 2; Undiluted Palmwine × 2",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 2, unit_price: 12500, line_total: 25000 }
    ],
    packaged_at: "2026-09-24 17:00:00",
    packaged_by_name: "Chioma Okonkwo",
    created_at: "2026-09-24 16:10:00"
  },
  {
    id: 8547,
    order_ref: "SHD-07658",
    customer_name: "Olubunmi Cole",
    phone: "08023183495",
    address: "Storefront Pickup Counter (Sabo Yaba)",
    total_amount: 75200,
    delivery_fee: 0,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Full Smokey Guineafowl (Chopped) × 6",
    items: [
      { product_name: "Full Smokey Guineafowl (Chopped)", quantity: 6, unit_price: 12500, line_total: 75000 }
    ],
    packaged_at: "2026-09-24 17:15:00",
    packaged_by_name: "Tunde Bakare",
    created_at: "2026-09-24 16:25:00"
  },
  {
    id: 8548,
    order_ref: "SHD-07659",
    customer_name: "Mercy Mercy",
    phone: "08136565021",
    address: "Storefront Pickup Counter (Sabo Yaba)",
    total_amount: 43700,
    delivery_fee: 0,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Full Smokey Guineafowl × 3; Palmwine × 2",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 3, unit_price: 12500, line_total: 37500 }
    ],
    packaged_at: "2026-09-24 17:30:00",
    packaged_by_name: "Chioma Okonkwo",
    created_at: "2026-09-24 16:40:00"
  },
  {
    id: 8549,
    order_ref: "SHD-07660",
    customer_name: "Ahmad Sanusi",
    phone: "08055443322",
    address: "35 Glover Road, Ikoyi",
    total_amount: 62500,
    delivery_fee: 3500,
    delivery_mode: "scheduled",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "VIP Smoked Turkey Wings × 3; Whole Catfish × 2",
    items: [
      { product_name: "Smokey Jumbo Turkey Wings (Pair)", quantity: 3, unit_price: 14500, line_total: 43500 }
    ],
    packaged_at: "2026-09-24 18:00:00",
    packaged_by_name: "Segun Alabi",
    created_at: "2026-09-24 17:00:00"
  },
  {
    id: 8538,
    order_ref: "SHD-07649",
    customer_name: "Adeola Adeleke",
    phone: "08022446688",
    address: "10 Keffi Street, Ikoyi, Lagos",
    total_amount: 32000,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Smoked Goat Meat Asun × 2",
    items: [
      { product_name: "Smoked Goat Meat Asun (Chevon Bowl)", quantity: 2, unit_price: 16000, line_total: 32000 }
    ],
    packaged_at: "2026-09-24 18:20:00",
    packaged_by_name: "Folake Adebayo",
    created_at: "2026-09-24 17:15:00"
  }
]

export const SEED_PACKAGING_MATERIALS_DAILY: PackagingMaterialDaily[] = [
  { product_id: 93, product_name: "BIG BRANDED BAG", sku: "PCK004", unit: "PIECES", total_consumed: 18, total_orders: 14 },
  { product_id: 95, product_name: "BRANDED POLYBAG", sku: "PCK006", unit: "PCS", total_consumed: 26, total_orders: 22 },
  { product_id: 96, product_name: "1 LITER FOOD BOWL & LID", sku: "PCK007", unit: "SETS", total_consumed: 12, total_orders: 10 },
  { product_id: 97, product_name: "HEAVY DUTY FOIL WRAP", sku: "PCK008", unit: "SHEETS", total_consumed: 35, total_orders: 24 },
  { product_id: 110, product_name: "MEDIUM POLY BAG", sku: "SKU-00076", unit: "PCS", total_consumed: 30, total_orders: 20 },
  { product_id: 111, product_name: "500ML SAUCE CUPS & CAPS", sku: "PCK010", unit: "SETS", total_consumed: 42, total_orders: 28 },
  { product_id: 112, product_name: "VACUUM SEAL POUCHES (20x30CM)", sku: "PCK011", unit: "PCS", total_consumed: 16, total_orders: 12 },
  { product_id: 113, product_name: "TAMPER-EVIDENT SECURITY SEALS", sku: "PCK012", unit: "SEALS", total_consumed: 48, total_orders: 34 },
  { product_id: 98, product_name: "THERMAL DISPATCH LABELS", sku: "PCK009", unit: "LABELS", total_consumed: 52, total_orders: 38 },
  { product_id: 114, product_name: "FOIL TAKE-OUT FOOD CONTAINERS", sku: "PCK013", unit: "SETS", total_consumed: 24, total_orders: 16 },
  { product_id: 115, product_name: "ECO BROWN KRAFT BAGS (LARGE)", sku: "PCK014", unit: "PCS", total_consumed: 22, total_orders: 15 },
  { product_id: 116, product_name: "WOODEN DISPOSABLE CUTLERY PACKS", sku: "PCK015", unit: "SETS", total_consumed: 38, total_orders: 26 },
]

export const SEED_KITCHEN_TASKS: KitchenTask[] = [
  { id: 101, task_ref: "TSK-101", title: "Morning Smoker Calibration & Hardwood Chips Stock", description: "Calibrate smoker thermocouples and verify oak hardwood chip levels before batch BAT-00021.", assignee_name: "Babajide 'Pitmaster'", due_date: "2026-09-25", priority: "high", status: "in_progress" },
  { id: 102, task_ref: "TSK-102", title: "Take-Away Foil & Greaseproof Liner Inventory Audit", description: "Count remaining branded foil rolls and paper bags in packaging store.", assignee_name: "Chioma Okonkwo", due_date: "2026-09-25", priority: "normal", status: "pending" },
  { id: 103, task_ref: "TSK-103", title: "Cold Room Freezer Temperature Sensor Log", description: "Inspect main walk-in freezer temperature chart (-18°C) for HACCP regulatory compliance.", assignee_name: "Folake Adebayo", due_date: "2026-09-25", priority: "normal", status: "done" },
  { id: 104, task_ref: "TSK-104", title: "Pre-Marination Prep for 100 Guinea Fowls", description: "Trim and season 100 birds with secret dry rub blend for weekend orders.", assignee_name: "Emeka Nwosu", due_date: "2026-09-26", priority: "high", status: "pending" },
  { id: 105, task_ref: "TSK-105", title: "Charcoal Ash Pit Cleanout & Chimney Flue Inspection", description: "Scrape and remove accumulated charcoal ash from Pit #1 and Pit #2 fireboxes.", assignee_name: "Babajide 'Pitmaster'", due_date: "2026-09-25", priority: "high", status: "done" },
  { id: 106, task_ref: "TSK-106", title: "Suya Pepper Blend Grinding & Packaging", description: "Mill 25kg dry habanero pods, ginger, and garlic into airtight condiment canisters.", assignee_name: "Chioma Okonkwo", due_date: "2026-09-25", priority: "normal", status: "in_progress" },
  { id: 107, task_ref: "TSK-107", title: "Sous-Vide Water Bath Temperature Validation", description: "Check precision cooker calibration with secondary calibrated reference thermometer.", assignee_name: "Folake Adebayo", due_date: "2026-09-25", priority: "normal", status: "done" },
  { id: 108, task_ref: "TSK-108", title: "Catfish Brining Tank Sanitization & Water Exchange", description: "Scrub and sanitize 500L brining tanks with approved food-grade chlorine solution.", assignee_name: "Emeka Nwosu", due_date: "2026-09-25", priority: "high", status: "in_progress" },
  { id: 109, task_ref: "TSK-109", title: "Vacuum Sealer Heat Element Tape Replacement", description: "Replace worn Teflon heating element tape on vacuum chamber machine #2.", assignee_name: "Segun Alabi", due_date: "2026-09-26", priority: "normal", status: "pending" },
  { id: 110, task_ref: "TSK-110", title: "Chef Knife Sharpening & Steel Honing Shift Rotation", description: "Sharpen cleavers, boning knives, and chef knives on Japanese 1000/6000 whetstone.", assignee_name: "Babajide 'Pitmaster'", due_date: "2026-09-26", priority: "low", status: "pending" },
  { id: 111, task_ref: "TSK-111", title: "Weekend Packaging Station Box & Seal Pre-Staging", description: "Fold 150 thermal takeaway cartons and attach delivery routing stickers.", assignee_name: "Chioma Okonkwo", due_date: "2026-09-26", priority: "normal", status: "pending" },
  { id: 112, task_ref: "TSK-112", title: "Smoker Exhaust Hood & Grease Trap Degreasing", description: "Apply heavy duty citrus degreaser to commercial exhaust baffles and hood filters.", assignee_name: "Emeka Nwosu", due_date: "2026-09-26", priority: "high", status: "pending" },
  { id: 113, task_ref: "TSK-113", title: "Morning Poultry Weight Discrepancy Verification", description: "Re-weighed crate intake of 50kg dressed broiler carcasses against delivery note.", assignee_name: "Folake Adebayo", due_date: "2026-09-24", priority: "normal", status: "done" },
  { id: 114, task_ref: "TSK-114", title: "Charcoal Moisture Content Hygrometer Test", description: "Checked hardwood charcoal batches; verified < 8% moisture for clean burning.", assignee_name: "Babajide 'Pitmaster'", due_date: "2026-09-24", priority: "high", status: "done" },
  { id: 115, task_ref: "TSK-115", title: "Vegetable Oil Keg Storage Pallet Restacking", description: "Rotated stock of 50L refined cooking oil kegs onto heavy-duty plastic skids.", assignee_name: "Emeka Nwosu", due_date: "2026-09-24", priority: "low", status: "done" },
  { id: 116, task_ref: "TSK-116", title: "Zobo Boiling Stainless Tank Deep Descaling", description: "Descaled 100L brew tank using food-grade citric acid wash.", assignee_name: "Chioma Okonkwo", due_date: "2026-09-24", priority: "normal", status: "done" },
  { id: 117, task_ref: "TSK-117", title: "HACCP Meat Probe Calibration Check", description: "Submerged thermocouple probes into ice-water slurry to verify 0°C baseline.", assignee_name: "Folake Adebayo", due_date: "2026-09-23", priority: "high", status: "done" },
  { id: 118, task_ref: "TSK-118", title: "Takeaway Carrier Bag Handle Tensile Testing", description: "Random batch sample tested for 8kg payload durability without tearing.", assignee_name: "Segun Alabi", due_date: "2026-09-23", priority: "normal", status: "done" },
  { id: 119, task_ref: "TSK-119", title: "Smoker Pit Smokehouse Floor Power Scrub", description: "Alkaline detergent power wash of fire-retardant epoxy pit floor.", assignee_name: "Babajide 'Pitmaster'", due_date: "2026-09-23", priority: "high", status: "done" },
  { id: 120, task_ref: "TSK-120", title: "Spice Measuring Scoop Precision Calibration", description: "Checked digital scales with 500g brass calibration weights.", assignee_name: "Chioma Okonkwo", due_date: "2026-09-23", priority: "low", status: "done" },
  { id: 121, task_ref: "TSK-121", title: "Evening Fire Marshall Night Watch Handover", description: "Inspected all fire extinguisher tags and verified firebox draft dampers shut.", assignee_name: "Emeka Nwosu", due_date: "2026-09-22", priority: "high", status: "done" },
  { id: 122, task_ref: "TSK-122", title: "Emergency Backup Generator Diesel Dipstick Reading", description: "Logged 420 liters in 50kVA standby generator tank for unbroken cold chain.", assignee_name: "Segun Alabi", due_date: "2026-09-26", priority: "high", status: "pending" },
  { id: 123, task_ref: "TSK-123", title: "Walk-in Chiller Evaporator Fan Coil Frost Inspection", description: "Confirmed automatic defrost cycle cleared all ice on evaporator fins.", assignee_name: "Folake Adebayo", due_date: "2026-09-26", priority: "normal", status: "in_progress" },
]

export const SEED_LOGISTICS_DELIVERIES: LogisticsDelivery[] = [
  // 1. Internal Fleet - Active Trips (Rider Wasiu, Rider Joshua)
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

  // 2. Unassigned Pending Deliveries (for LogisticsBoardPage "Unassigned Deliveries" tab - 12 items)
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
    id: 3672,
    delivery_ref: "SHD-07663",
    order_id: 8552,
    order_ref: "SHD-07663",
    customer_name: "Bolanle Shonubi",
    phone: "08034567812",
    address: "24 Fola Osibo St, Lekki Phase 1",
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Smokey Pepper Sauce × 2"
  },
  {
    id: 3673,
    delivery_ref: "SHD-07664",
    order_id: 8553,
    order_ref: "SHD-07664",
    customer_name: "Chukwudi Eze",
    phone: "08028765432",
    address: "42 Bode Thomas St, Surulere",
    delivery_fee: 2500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 32000,
    items_summary: "1L Guineafowl Rice × 2; Smokey Catfish × 1"
  },
  {
    id: 3674,
    delivery_ref: "SHD-07665",
    order_id: 8554,
    order_ref: "SHD-07665",
    customer_name: "Fatima Danjuma",
    phone: "08139871122",
    address: "Plot 8 Adeola Odeku St, Victoria Island",
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 3; Palmwine (50cl) × 3"
  },
  {
    id: 3675,
    delivery_ref: "SHD-07666",
    order_id: 8555,
    order_ref: "SHD-07666",
    customer_name: "Tunde Oladipo",
    phone: "08051239876",
    address: "18 Joel Ogunnaike St, GRA Ikeja",
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Asun Peppered Bowl × 2; Fried Plantain × 2"
  },
  {
    id: 3676,
    delivery_ref: "SHD-07667",
    order_id: 8556,
    order_ref: "SHD-07667",
    customer_name: "Kehinde Balogun",
    phone: "07065544332",
    address: "12 Valley View Estate, Magodo Phase 2",
    delivery_fee: 4000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 27500,
    items_summary: "Full Smokey Guineafowl × 1; 2L Rice Bowl × 1"
  },
  {
    id: 3677,
    delivery_ref: "SHD-07668",
    order_id: 8557,
    order_ref: "SHD-07668",
    customer_name: "Ngozi Maduka",
    phone: "08092348877",
    address: "5 Anthony Village Road, Maryland",
    delivery_fee: 2500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Gizzard Skewers × 4; Zobo Tea Bottle × 2"
  },
  {
    id: 3678,
    delivery_ref: "SHD-07669",
    order_id: 8558,
    order_ref: "SHD-07669",
    customer_name: "Segun Adeyemi",
    phone: "08147766554",
    address: "9 Montgomery Road, Yaba",
    delivery_fee: 2000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 1; Extra Pepper Dip × 2"
  },
  {
    id: 3679,
    delivery_ref: "SHD-07670",
    order_id: 8559,
    order_ref: "SHD-07670",
    customer_name: "Zainab Aliyu",
    phone: "08083322110",
    address: "Zone A, Banana Island Estate, Ikoyi",
    delivery_fee: 4500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Hut VIP Feast Box × 1; Palmwine (1L) × 2"
  },
  {
    id: 3680,
    delivery_ref: "SHD-07671",
    order_id: 8560,
    order_ref: "SHD-07671",
    customer_name: "Emeka Okafor",
    phone: "08021199887",
    address: "31 Diya Street, Gbagada Phase 2",
    delivery_fee: 2500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Catfish × 2; 1L Jollof Rice × 1"
  },
  {
    id: 3681,
    delivery_ref: "SHD-07672",
    order_id: 8561,
    order_ref: "SHD-07672",
    customer_name: "Folake Solanke",
    phone: "07038899001",
    address: "16 Town Planning Way, Ilupeju",
    delivery_fee: 2500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 19800,
    items_summary: "Smokey Beef Suya Pack × 3; Palmwine × 1"
  },
  {
    id: 3682,
    delivery_ref: "SHD-07673",
    order_id: 8562,
    order_ref: "SHD-07673",
    customer_name: "Rasheed Sanusi",
    phone: "08184455667",
    address: "Plot 104, 21 Road, Festac Town",
    delivery_fee: 4000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "Unassigned",
    status: "pending",
    dispatch_date: "2026-10-21",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Smokey Pepper Sauce × 2"
  },

  // 3. Third-Party Outsourced Deliveries (for ThirdPartyLogisticsPage - 12 items)
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
    id: 3683,
    delivery_ref: "SHD-07674",
    order_id: 8563,
    order_ref: "SHD-07674",
    customer_name: "Halima Bello",
    phone: "08032211990",
    address: "Crown Estate, Sangotedo, Ajah",
    delivery_fee: 4500,
    booked_fee: 5500,
    rider_type: "third_party",
    assigned_rider: "Uber Connect",
    third_party_provider: "Uber Connect",
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 12:45:00",
    delivered_at: null,
    fee_verify_status: "pending",
    fee_evidence_path: "/receipts/uber-8563.png",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Hut VIP Feast Box × 1"
  },
  {
    id: 3684,
    delivery_ref: "SHD-07675",
    order_id: 8564,
    order_ref: "SHD-07675",
    customer_name: "David Mark",
    phone: "08076655443",
    address: "Alpha Beach Road, Lekki Phase 2",
    delivery_fee: 4000,
    booked_fee: 4200,
    rider_type: "third_party",
    assigned_rider: "Bolt Delivery",
    third_party_provider: "Bolt Delivery",
    status: "delivered",
    dispatch_date: "2026-10-20",
    pickup_at: "2026-10-20 18:20:00",
    delivered_at: "2026-10-20 19:10:00",
    fee_verify_status: "approved",
    fee_evidence_path: "/receipts/bolt-8564.jpg",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Palmwine × 2"
  },
  {
    id: 3685,
    delivery_ref: "SHD-07676",
    order_id: 8565,
    order_ref: "SHD-07676",
    customer_name: "Funmi Adeleke",
    phone: "08123344556",
    address: "29 Opebi Road, Ikeja",
    delivery_fee: 3000,
    booked_fee: 3000,
    rider_type: "third_party",
    assigned_rider: "Kwik Delivery",
    third_party_provider: "Kwik Delivery",
    status: "delivered",
    dispatch_date: "2026-10-20",
    pickup_at: "2026-10-20 14:30:00",
    delivered_at: "2026-10-20 15:40:00",
    fee_verify_status: "approved",
    fee_evidence_path: "/receipts/kwik-8565.png",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "1L Guineafowl Rice Bowl × 2"
  },
  {
    id: 3686,
    delivery_ref: "SHD-07677",
    order_id: 8566,
    order_ref: "SHD-07677",
    customer_name: "Rotimi Williams",
    phone: "08091188223",
    address: "Marina Street, Lagos Island",
    delivery_fee: 3500,
    booked_fee: 3800,
    rider_type: "third_party",
    assigned_rider: "Gokada Express",
    third_party_provider: "Gokada Express",
    status: "out_for_delivery",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 11:15:00",
    delivered_at: null,
    fee_verify_status: "pending",
    fee_evidence_path: "/receipts/gokada-8566.jpg",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Catfish × 2"
  },
  {
    id: 3687,
    delivery_ref: "SHD-07678",
    order_id: 8567,
    order_ref: "SHD-07678",
    customer_name: "Sandra Briggs",
    phone: "07054433221",
    address: "8 Queens Drive, Ikoyi",
    delivery_fee: 4000,
    booked_fee: 4500,
    rider_type: "third_party",
    assigned_rider: "DHL Express",
    third_party_provider: "DHL Express",
    status: "delivered",
    dispatch_date: "2026-10-19",
    pickup_at: "2026-10-19 16:15:00",
    delivered_at: "2026-10-19 17:30:00",
    fee_verify_status: "flagged",
    fee_evidence_path: "/receipts/dhl-8567.jpg",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 4; Zobo Tea × 4"
  },
  {
    id: 3688,
    delivery_ref: "SHD-07679",
    order_id: 8568,
    order_ref: "SHD-07679",
    customer_name: "Kunle Coker",
    phone: "08182233445",
    address: "Abijo GRA, Ibeju Lekki",
    delivery_fee: 5500,
    booked_fee: 6500,
    rider_type: "third_party",
    assigned_rider: "Uber Connect",
    third_party_provider: "Uber Connect",
    status: "out_for_delivery",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 10:00:00",
    delivered_at: null,
    fee_verify_status: "pending",
    fee_evidence_path: "/receipts/uber-8568.png",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Feast Family Platter × 1"
  },
  {
    id: 3689,
    delivery_ref: "SHD-07680",
    order_id: 8569,
    order_ref: "SHD-07680",
    customer_name: "Aisha Mohammed",
    phone: "08035544112",
    address: "Magodo Phase 1, Isheri Road",
    delivery_fee: 4000,
    booked_fee: 4200,
    rider_type: "third_party",
    assigned_rider: "GIG Logistics",
    third_party_provider: "GIG Logistics",
    status: "delivered",
    dispatch_date: "2026-10-18",
    pickup_at: "2026-10-18 13:00:00",
    delivered_at: "2026-10-18 14:15:00",
    fee_verify_status: "approved",
    fee_evidence_path: "/receipts/gig-8569.jpg",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Palmwine × 1"
  },
  {
    id: 3690,
    delivery_ref: "SHD-07681",
    order_id: 8570,
    order_ref: "SHD-07681",
    customer_name: "Peter Obioma",
    phone: "07081122334",
    address: "Adelabu Street, Surulere",
    delivery_fee: 2500,
    booked_fee: 2800,
    rider_type: "third_party",
    assigned_rider: "Bolt Delivery",
    third_party_provider: "Bolt Delivery",
    status: "delivered",
    dispatch_date: "2026-10-17",
    pickup_at: "2026-10-17 17:00:00",
    delivered_at: "2026-10-17 18:20:00",
    fee_verify_status: "approved",
    fee_evidence_path: "/receipts/bolt-8570.png",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Gizzard Bowl × 2; 1L Rice Bowl × 1"
  },
  {
    id: 3691,
    delivery_ref: "SHD-07682",
    order_id: 8571,
    order_ref: "SHD-07682",
    customer_name: "Grace Danladi",
    phone: "08169988776",
    address: "21 Bishop Aboyade Cole St, VI",
    delivery_fee: 3500,
    booked_fee: 3600,
    rider_type: "third_party",
    assigned_rider: "Kwik Delivery",
    third_party_provider: "Kwik Delivery",
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 13:10:00",
    delivered_at: null,
    fee_verify_status: "pending",
    fee_evidence_path: "/receipts/kwik-8571.png",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 1; Extra Pepper Sauce × 3"
  },
  {
    id: 3692,
    delivery_ref: "SHD-07683",
    order_id: 8572,
    order_ref: "SHD-07683",
    customer_name: "Obinna Uzor",
    phone: "08027788990",
    address: "Chevron Drive, Lekki",
    delivery_fee: 4500,
    booked_fee: 4800,
    rider_type: "third_party",
    assigned_rider: "FedEx Urban",
    third_party_provider: "FedEx Urban",
    status: "delivered",
    dispatch_date: "2026-10-16",
    pickup_at: "2026-10-16 15:30:00",
    delivered_at: "2026-10-16 16:50:00",
    fee_verify_status: "flagged",
    fee_evidence_path: "/receipts/fedex-8572.jpg",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Asun Bowl × 3; Palmwine × 2"
  },
  {
    id: 3693,
    delivery_ref: "SHD-07684",
    order_id: 8573,
    order_ref: "SHD-07684",
    customer_name: "Maryam Sani",
    phone: "09031122445",
    address: "Ogudu Foreshore Estate, Ojota",
    delivery_fee: 3500,
    booked_fee: 3500,
    rider_type: "third_party",
    assigned_rider: "Gokada Express",
    third_party_provider: "Gokada Express",
    status: "delivered",
    dispatch_date: "2026-10-15",
    pickup_at: "2026-10-15 19:00:00",
    delivered_at: "2026-10-15 20:05:00",
    fee_verify_status: "approved",
    fee_evidence_path: "/receipts/gokada-8573.jpg",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Catfish × 1; 1L Rice Bowl × 1"
  },

  // 4. Rider Yusuf (user_id: 455) - Active Trips (for RiderDashboardPage Assigned tab - 11 items)
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
    id: 4983,
    delivery_ref: "SHD-08411",
    order_id: 8611,
    order_ref: "SHD-08411",
    customer_name: "Ibrahim Tanko",
    phone: "08029988776",
    address: "10 Awolowo Road, Ikoyi, Lagos",
    total_amount: 27000,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "out_for_delivery",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 11:30:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 27000,
    items_summary: "Full Smokey Guineafowl × 2; Undiluted Palmwine × 1",
    notes: "Customer paying with cash at corporate office front desk"
  },
  {
    id: 4984,
    delivery_ref: "SHD-08412",
    order_id: 8612,
    order_ref: "SHD-08412",
    customer_name: "Sharon Davies",
    phone: "07068877665",
    address: "24 Adeola Odeku St, Victoria Island",
    total_amount: 38500,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 12:00:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; 1L Jollof Bowl × 2; Zobo Bottle × 2",
    notes: "Leave with security guards if in meeting"
  },
  {
    id: 4985,
    delivery_ref: "SHD-08413",
    order_id: 8613,
    order_ref: "SHD-08413",
    customer_name: "Kayode Ajayi",
    phone: "08143322119",
    address: "Plot 8 Karimu Kotun St, Victoria Island",
    total_amount: 19500,
    delivery_fee: 3000,
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
    items_summary: "Smokey Asun Bowl × 2; Fried Plantain × 1",
    notes: "Call when passing Eko Hotel roundabout"
  },
  {
    id: 4986,
    delivery_ref: "SHD-08414",
    order_id: 8614,
    order_ref: "SHD-08414",
    customer_name: "Nneka Okoli",
    phone: "08051122334",
    address: "17 Bourdillon Road, Ikoyi",
    total_amount: 45000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "out_for_delivery",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 11:45:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 45000,
    items_summary: "Full Smokey Guineafowl × 3; Palmwine × 3",
    notes: "Deliver to penthouse suite reception"
  },
  {
    id: 4987,
    delivery_ref: "SHD-08415",
    order_id: 8615,
    order_ref: "SHD-08415",
    customer_name: "Victor Oshodi",
    phone: "08097766554",
    address: "4 Alexander Avenue, Ikoyi",
    total_amount: 22000,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 12:15:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Catfish × 1; 1L Guineafowl Rice × 1",
    notes: "Ring bell at black gate"
  },
  {
    id: 4988,
    delivery_ref: "SHD-08416",
    order_id: 8616,
    order_ref: "SHD-08416",
    customer_name: "Hauwa Garba",
    phone: "07034455667",
    address: "5 Walter Carrington Crescent, Victoria Island",
    total_amount: 34000,
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
    items_summary: "Full Smokey Guineafowl × 2; Smokey Pepper Dip × 2",
    notes: "Embassy area security clearance required"
  },
  {
    id: 4989,
    delivery_ref: "SHD-08417",
    order_id: 8617,
    order_ref: "SHD-08417",
    customer_name: "Babatunde Lawal",
    phone: "08162233445",
    address: "14 Ozumba Mbadiwe Ave, Victoria Island",
    total_amount: 29500,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "out_for_delivery",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 12:30:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 29500,
    items_summary: "1L Guineafowl Rice Bowl × 2; Gizzard Skewers × 2",
    notes: "Cash on delivery - prepare change for 30k"
  },
  {
    id: 4990,
    delivery_ref: "SHD-08418",
    order_id: 8618,
    order_ref: "SHD-08418",
    customer_name: "Chidinma Anya",
    phone: "08025566778",
    address: "8 Lugard Avenue, Ikoyi",
    total_amount: 41000,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 12:50:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 3; Extra Hot Dip × 2",
    notes: "Security has guest pass ready"
  },
  {
    id: 4991,
    delivery_ref: "SHD-08419",
    order_id: 8619,
    order_ref: "SHD-08419",
    customer_name: "Kolawole Balogun",
    phone: "08189900112",
    address: "21 Kofo Abayomi St, Victoria Island",
    total_amount: 26000,
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
    items_summary: "Full Smokey Catfish × 1; 1L Guineafowl Rice × 1; Palmwine × 1",
    notes: "Deliver to 3rd floor office"
  },
  {
    id: 4992,
    delivery_ref: "SHD-08420",
    order_id: 8620,
    order_ref: "SHD-08420",
    customer_name: "Damilola Ojo",
    phone: "09087766554",
    address: "31 Queens Drive, Ikoyi",
    total_amount: 36000,
    delivery_fee: 3000,
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
    items_summary: "Smokey Feast Box × 1; Undiluted Palmwine × 2",
    notes: "Call upon arrival"
  },
  {
    id: 4993,
    delivery_ref: "SHD-08421",
    order_id: 8621,
    order_ref: "SHD-08421",
    customer_name: "Chukwudi Obi",
    phone: "08039911223",
    address: "7 Glover Road, Ikoyi, Lagos",
    total_amount: 28500,
    delivery_fee: 3000,
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
    items_summary: "Full Smokey Guineafowl × 2; Zobo Bottle × 1",
    notes: "Leave with front desk security"
  },
  {
    id: 4994,
    delivery_ref: "SHD-08422",
    order_id: 8622,
    order_ref: "SHD-08422",
    customer_name: "Amina Bello",
    phone: "08123344556",
    address: "19 Lugard Ave, Ikoyi",
    total_amount: 34000,
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
    payment_mode: "cod",
    cod_amount: 34000,
    items_summary: "1L Guineafowl Rice Bowl × 2; Asun Portion × 2",
    notes: "Cash on delivery - customer will pay cash"
  },
  {
    id: 4995,
    delivery_ref: "SHD-08423",
    order_id: 8623,
    order_ref: "SHD-08423",
    customer_name: "Femi Adesina",
    phone: "08076655443",
    address: "12 Bishop Oluwole St, Victoria Island",
    total_amount: 42000,
    delivery_fee: 3000,
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
    items_summary: "Full Smokey Catfish × 2; Fried Yam × 2",
    notes: "Call when you reach gate"
  },
  {
    id: 4996,
    delivery_ref: "SHD-08424",
    order_id: 8624,
    order_ref: "SHD-08424",
    customer_name: "Zainab Usman",
    phone: "08145566778",
    address: "8 Idejo Street, Victoria Island",
    total_amount: 19500,
    delivery_fee: 3000,
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
    items_summary: "Smokey Asun Bowl × 1; Zobo Bottle × 2",
    notes: "Suite 4B, 2nd floor"
  },
  {
    id: 4997,
    delivery_ref: "SHD-08425",
    order_id: 8625,
    order_ref: "SHD-08425",
    customer_name: "Tunde Bakare",
    phone: "08034455998",
    address: "14 Onikoyi Road, Parkview Estate, Ikoyi",
    total_amount: 37500,
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
    items_summary: "Full Smokey Guineafowl × 2; Palmwine × 2",
    notes: "Gate code #4491 at estate entrance"
  },
  {
    id: 4998,
    delivery_ref: "SHD-08426",
    order_id: 8626,
    order_ref: "SHD-08426",
    customer_name: "Bukola Saraki",
    phone: "07061122998",
    address: "26 Cameron Road, Ikoyi",
    total_amount: 48000,
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
    items_summary: "Smokey Feast Platter × 2; Chilled Zobo × 4",
    notes: "Security gate pass registered"
  },
  {
    id: 4999,
    delivery_ref: "SHD-08427",
    order_id: 8627,
    order_ref: "SHD-08427",
    customer_name: "Emeka Anozie",
    phone: "08092233441",
    address: "11 Maduike Street, SW Ikoyi",
    total_amount: 31000,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 13:10:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Pepper Sauce × 2",
    notes: "Rider picked up from Yaba central kitchen"
  },
  {
    id: 5000,
    delivery_ref: "SHD-08428",
    order_id: 8628,
    order_ref: "SHD-08428",
    customer_name: "Grace Ekanem",
    phone: "08137788990",
    address: "5 Idowu Martins St, Victoria Island",
    total_amount: 29000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 13:20:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "cod",
    cod_amount: 29000,
    items_summary: "1L Guineafowl Rice × 2; Gizzard Skewers × 1",
    notes: "En route to corporate office"
  },
  {
    id: 5001,
    delivery_ref: "SHD-08429",
    order_id: 8629,
    order_ref: "SHD-08429",
    customer_name: "Oluwaseun Balogun",
    phone: "08056677889",
    address: "22 Gerard Road, Ikoyi",
    total_amount: 36500,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "out_for_delivery",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 13:00:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Catfish × 2; Extra Hot Pepper Sauce × 2",
    notes: "Approaching delivery gate"
  },
  {
    id: 5002,
    delivery_ref: "SHD-08430",
    order_id: 8630,
    order_ref: "SHD-08430",
    customer_name: "Fatima Aliyu",
    phone: "07089900112",
    address: "9 Ribadu Road, SW Ikoyi",
    total_amount: 44000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "out_for_delivery",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 13:05:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Feast Platter × 1; Zobo Drinks × 3",
    notes: "At estate security barrier"
  },
  {
    id: 5003,
    delivery_ref: "SHD-08431",
    order_id: 8631,
    order_ref: "SHD-08431",
    customer_name: "Segun Obasanjo",
    phone: "08023344112",
    address: "3 Queens Drive, Ikoyi",
    total_amount: 52000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "in_transit",
    dispatch_date: "2026-10-21",
    pickup_at: "2026-10-21 13:25:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 3; Palmwine × 3",
    notes: "VIP residence - handle with care"
  },

  // 5. Rider Yusuf (user_id: 455) - Delivered Trips (for RiderDashboardPage Delivered & Earnings tabs - 12 items)
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
  },
  {
    id: 4966,
    delivery_ref: "SHD-08370",
    order_id: 8583,
    order_ref: "SHD-08370",
    customer_name: "Tayo Bankole",
    phone: "08034455112",
    address: "6 Parkview Estate, Ikoyi",
    total_amount: 34000,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-10-02",
    pickup_at: "2026-10-02 14:10:00",
    delivered_at: "2026-10-02 15:02:40",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Smokey Pepper Sauce × 2",
    notes: "Signed for by house manager"
  },
  {
    id: 4967,
    delivery_ref: "SHD-08365",
    order_id: 8578,
    order_ref: "SHD-08365",
    customer_name: "Gloria Eke",
    phone: "07062233441",
    address: "19 Bishop Oluwole St, Victoria Island",
    total_amount: 25500,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-10-01",
    pickup_at: "2026-10-01 12:15:00",
    delivered_at: "2026-10-01 13:05:18",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "1L Guineafowl Rice × 1; Catfish × 1; Zobo × 1",
    notes: "Handed over at office front lobby"
  },
  {
    id: 4968,
    delivery_ref: "SHD-08360",
    order_id: 8575,
    order_ref: "SHD-08360",
    customer_name: "Musa Bello",
    phone: "08149988772",
    address: "25 Kingsway Road, Ikoyi",
    total_amount: 52000,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-10-01",
    pickup_at: "2026-10-01 15:30:00",
    delivered_at: "2026-10-01 16:22:10",
    fee_verify_status: "approved",
    payment_mode: "cod",
    cod_amount: 52000,
    items_summary: "Full Smokey Guineafowl × 3; Palmwine (1L) × 2",
    notes: "Cash payment confirmed and remitted"
  },
  {
    id: 4969,
    delivery_ref: "SHD-08355",
    order_id: 8570,
    order_ref: "SHD-08355",
    customer_name: "Jennifer Peters",
    phone: "08096655441",
    address: "11 Idowu Martins St, Victoria Island",
    total_amount: 31000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-09-30",
    pickup_at: "2026-09-30 11:20:00",
    delivered_at: "2026-09-30 12:12:45",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Smokey Pepper Dip × 1",
    notes: "Direct handover"
  },
  {
    id: 4970,
    delivery_ref: "SHD-08350",
    order_id: 8565,
    order_ref: "SHD-08350",
    customer_name: "Samuel Ade",
    phone: "07038899112",
    address: "7 Thompson Avenue, Ikoyi",
    total_amount: 24500,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-09-30",
    pickup_at: "2026-09-30 13:45:00",
    delivered_at: "2026-09-30 14:38:00",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "1L Guineafowl Rice × 1; Gizzard Skewers × 2",
    notes: "Left with estate gate reception"
  },
  {
    id: 4972,
    delivery_ref: "SHD-08345",
    order_id: 8560,
    order_ref: "SHD-08345",
    customer_name: "Patience Umeh",
    phone: "08127766550",
    address: "14 Sanusi Fafunwa St, Victoria Island",
    total_amount: 42000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-09-29",
    pickup_at: "2026-09-29 16:00:00",
    delivered_at: "2026-09-29 16:55:12",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 3; Palmwine × 1",
    notes: "Handed to customer outside bank premises"
  },
  {
    id: 4973,
    delivery_ref: "SHD-08340",
    order_id: 8555,
    order_ref: "SHD-08340",
    customer_name: "Kabir Dangote",
    phone: "08083344559",
    address: "22 Gerard Road, Ikoyi",
    total_amount: 65000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-09-29",
    pickup_at: "2026-09-29 17:30:00",
    delivered_at: "2026-09-29 18:25:30",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Smokey Hut VIP Feast Box × 2; Palmwine × 4",
    notes: "Delivered to private residence security desk"
  },
  {
    id: 4974,
    delivery_ref: "SHD-08335",
    order_id: 8550,
    order_ref: "SHD-08335",
    customer_name: "Rita Dominic",
    phone: "08164455887",
    address: "9 Ahmadu Bello Way, Victoria Island",
    total_amount: 29000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-09-28",
    pickup_at: "2026-09-28 12:30:00",
    delivered_at: "2026-09-28 13:21:50",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 2; Zobo Tea Bottle × 2",
    notes: "Customer came down to meet rider"
  },
  {
    id: 4975,
    delivery_ref: "SHD-08330",
    order_id: 8545,
    order_ref: "SHD-08330",
    customer_name: "Ahmed Kalu",
    phone: "07051122998",
    address: "30 Cooper Road, Ikoyi",
    total_amount: 37500,
    delivery_fee: 3000,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-09-28",
    pickup_at: "2026-09-28 14:40:00",
    delivered_at: "2026-09-28 15:35:10",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Catfish × 2; 1L Rice Bowl × 1",
    notes: "Confirmed on customer phone"
  },
  {
    id: 4976,
    delivery_ref: "SHD-08325",
    order_id: 8540,
    order_ref: "SHD-08325",
    customer_name: "Grace Bassey",
    phone: "08039988110",
    address: "16 Osborne Foreshore Estate, Ikoyi",
    total_amount: 48000,
    delivery_fee: 3500,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 455,
    status: "delivered",
    dispatch_date: "2026-09-27",
    pickup_at: "2026-09-27 16:15:00",
    delivered_at: "2026-09-27 17:10:45",
    fee_verify_status: "approved",
    payment_mode: "online",
    cod_amount: 0,
    items_summary: "Full Smokey Guineafowl × 3; Palmwine (1L) × 1",
    notes: "Delivered to estate main gate reception"
  }
]

export const SEED_SCHEDULED_ORDERS: ScheduledOrder[] = [
  { id: 8551, order_ref: "SHD-07662", customer_name: "Jesutofunmi Bukola", phone: "09036054778", address: "8/10 Oladimeji Johnson crescent, Iyana Ipaja", total_amount: 28700, delivery_fee: 4000, scheduled_delivery_at: "2026-09-25 12:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Afternoon lunch delivery via Website", can_start_schedule: true },
  { id: 8550, order_ref: "SHD-07661", customer_name: "Anita Ihaza", phone: "07062364644", address: "4 Awoseyin Lane, Shomolu", total_amount: 27700, delivery_fee: 2500, scheduled_delivery_at: "2026-09-25 13:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Office lunch party dispatch", can_start_schedule: true },
  { id: 8549, order_ref: "SHD-07660", customer_name: "Ahmad Sanusi", phone: "08055443322", address: "35 Glover Road, Ikoyi", total_amount: 62500, delivery_fee: 3500, scheduled_delivery_at: "2026-09-26 15:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Pre-order VIP catering package", can_start_schedule: false },
  { id: 8552, order_ref: "SHD-07663", customer_name: "Dr. Funsho Williams", phone: "08023456789", address: "14 Kingsway Rd, Ikoyi", total_amount: 54000, delivery_fee: 3500, scheduled_delivery_at: "2026-10-22 12:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Executive medical board lunch buffet", can_start_schedule: true },
  { id: 8553, order_ref: "SHD-07664", customer_name: "Kemi Adebayo", phone: "08139876543", address: "Plot 19 Admiralty Way, Lekki Phase 1", total_amount: 38200, delivery_fee: 3000, scheduled_delivery_at: "2026-10-22 13:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Corporate lunch meeting package", can_start_schedule: true },
  { id: 8554, order_ref: "SHD-07665", customer_name: "Emeka Okonkwo", phone: "07061122334", address: "42 Bode Thomas St, Surulere", total_amount: 45000, delivery_fee: 2500, scheduled_delivery_at: "2026-10-22 13:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Birthday gathering smokey platter", can_start_schedule: true },
  { id: 8555, order_ref: "SHD-07666", customer_name: "Halima Abubakar", phone: "08092233445", address: "22 Walter Carrington Cres, VI", total_amount: 72000, delivery_fee: 3500, scheduled_delivery_at: "2026-10-22 14:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Diplomatic mission lunch delivery", can_start_schedule: true },
  { id: 8556, order_ref: "SHD-07667", customer_name: "Tunde Bakare Jr.", phone: "08145566778", address: "16 Isaac John St, GRA Ikeja", total_amount: 31500, delivery_fee: 3000, scheduled_delivery_at: "2026-10-22 14:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Family dinner advance order", can_start_schedule: true },
  { id: 8557, order_ref: "SHD-07668", customer_name: "Zainab Dantata", phone: "08037788990", address: "Zone B, Banana Island, Ikoyi", total_amount: 88000, delivery_fee: 4500, scheduled_delivery_at: "2026-10-22 15:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "VIP catering banquet boxes", can_start_schedule: true },
  { id: 8558, order_ref: "SHD-07669", customer_name: "Chinedu Anya", phone: "08059900112", address: "11 Toyin Street, Ikeja", total_amount: 29800, delivery_fee: 2500, scheduled_delivery_at: "2026-10-22 15:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Staff appreciation celebration", can_start_schedule: true },
  { id: 8559, order_ref: "SHD-07670", customer_name: "Amina Danjuma", phone: "07083344556", address: "28 Adeola Hopewell St, VI", total_amount: 41200, delivery_fee: 3500, scheduled_delivery_at: "2026-10-22 16:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Evening cocktail event catering", can_start_schedule: true },
  { id: 8560, order_ref: "SHD-07671", customer_name: "Olumide Fashola", phone: "08182233441", address: "55 Marina Road, Lagos Island", total_amount: 63000, delivery_fee: 3500, scheduled_delivery_at: "2026-10-22 16:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Bank headquarters conference snacks", can_start_schedule: true },
  { id: 8561, order_ref: "SHD-07672", customer_name: "Fatima Balarabe", phone: "08031199223", address: "Plot 10 Bisway St, Maroko VI", total_amount: 51000, delivery_fee: 3500, scheduled_delivery_at: "2026-10-23 11:30:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Advance reservation weekend lunch", can_start_schedule: false },
  { id: 8562, order_ref: "SHD-07673", customer_name: "Segun Obasanjo Jr.", phone: "09081122334", address: "8 Alexander Ave, Ikoyi", total_amount: 95000, delivery_fee: 4000, scheduled_delivery_at: "2026-10-24 13:00:00", payment_status: "paid", order_status: "payment_confirmed", notes: "Weekend family reunion banquet", can_start_schedule: false },
]

export const SEED_RIDER_PAYOUTS: RiderPayout[] = [
  // 1. Rider Wasiu (on_trip, cash_held)
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
  // 2. Rider Joshua (on_trip, cash_held)
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
  // 3. Rider Yusuf (active, settled)
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
  // 4. Rider Sunday (offline)
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
  // 5. Rider Emmanuel (on_trip, cash_held)
  {
    rider_user_id: 457,
    rider_name: "RIDER EMMANUEL",
    phone: "08021112233",
    email: "emmanuel.nwankwo@smokeyhut.com",
    staff_id: "RDR-005",
    active_assignments: 2,
    today_trips: 3,
    deliveries_today: 3,
    deliveries_week: 15,
    deliveries_month: 62,
    total_completed: 198,
    earnings_today: 9500,
    earnings_week: 46000,
    earnings_month: 192000,
    pending_payout: 9500,
    cod_cash_collected: 35000,
    cod_remitted_total: 160000,
    net_balance: -25500,
    paid_total: 160000,
    lifetime_earnings: 169500,
    status: "on_trip",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "KJA-492-TY",
    operating_hub: "Yaba Head Office",
    license_number: "DL-12093-LAG",
    license_expiry: "May 2028",
    emergency_contact: "Chidinma Nwankwo (Wife)",
    emergency_phone: "08039988776",
    rating: 4.9,
    on_time_rate: 97.6,
    cod_limit: 50000,
    date_joined: "14 Dec 2024"
  },
  // 6. Rider Taiwo (on_trip, cash_held)
  {
    rider_user_id: 458,
    rider_name: "RIDER TAIWO",
    phone: "08134445566",
    email: "taiwo.alabi@smokeyhut.com",
    staff_id: "RDR-006",
    active_assignments: 2,
    today_trips: 4,
    deliveries_today: 4,
    deliveries_week: 19,
    deliveries_month: 78,
    total_completed: 245,
    earnings_today: 13000,
    earnings_week: 58000,
    earnings_month: 236000,
    pending_payout: 13000,
    cod_cash_collected: 22000,
    cod_remitted_total: 210000,
    net_balance: -9000,
    paid_total: 210000,
    lifetime_earnings: 223000,
    status: "on_trip",
    vehicle_type: "Yamaha Crux 110",
    plate_number: "GGE-104-XX",
    operating_hub: "Ikeja Kitchen Station",
    license_number: "DL-33412-LAG",
    license_expiry: "Aug 2027",
    emergency_contact: "Kehinde Alabi (Twin Brother)",
    emergency_phone: "08071122334",
    rating: 4.8,
    on_time_rate: 98.1,
    cod_limit: 50000,
    date_joined: "02 Oct 2024"
  },
  // 7. Rider Kehinde (on_trip, cash_held)
  {
    rider_user_id: 459,
    rider_name: "RIDER KEHINDE",
    phone: "08145556677",
    email: "kehinde.alabi@smokeyhut.com",
    staff_id: "RDR-007",
    active_assignments: 1,
    today_trips: 3,
    deliveries_today: 3,
    deliveries_week: 16,
    deliveries_month: 66,
    total_completed: 210,
    earnings_today: 10500,
    earnings_week: 49000,
    earnings_month: 201000,
    pending_payout: 10500,
    cod_cash_collected: 18000,
    cod_remitted_total: 175000,
    net_balance: -7500,
    paid_total: 175000,
    lifetime_earnings: 185500,
    status: "on_trip",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "GGE-105-XY",
    operating_hub: "Ikeja Kitchen Station",
    license_number: "DL-33413-LAG",
    license_expiry: "Aug 2027",
    emergency_contact: "Taiwo Alabi (Brother)",
    emergency_phone: "08134445566",
    rating: 4.8,
    on_time_rate: 97.4,
    cod_limit: 50000,
    date_joined: "02 Oct 2024"
  },
  // 8. Rider Segun (on_trip, cash_held)
  {
    rider_user_id: 460,
    rider_name: "RIDER SEGUN",
    phone: "08056667788",
    email: "segun.adesanya@smokeyhut.com",
    staff_id: "RDR-008",
    active_assignments: 3,
    today_trips: 5,
    deliveries_today: 5,
    deliveries_week: 22,
    deliveries_month: 89,
    total_completed: 310,
    earnings_today: 16000,
    earnings_week: 67000,
    earnings_month: 275000,
    pending_payout: 16000,
    cod_cash_collected: 42000,
    cod_remitted_total: 250000,
    net_balance: -26000,
    paid_total: 250000,
    lifetime_earnings: 266000,
    status: "on_trip",
    vehicle_type: "TVS Star HLX 125",
    plate_number: "EKY-782-BC",
    operating_hub: "Yaba Head Office",
    license_number: "DL-55419-LAG",
    license_expiry: "Feb 2028",
    emergency_contact: "Folasade Adesanya (Mother)",
    emergency_phone: "08028899001",
    rating: 4.9,
    on_time_rate: 98.9,
    cod_limit: 60000,
    date_joined: "15 Jul 2024"
  },
  // 9. Rider Chinedu (on_trip, cash_held)
  {
    rider_user_id: 461,
    rider_name: "RIDER CHINEDU",
    phone: "07067778899",
    email: "chinedu.okorie@smokeyhut.com",
    staff_id: "RDR-009",
    active_assignments: 2,
    today_trips: 4,
    deliveries_today: 4,
    deliveries_week: 17,
    deliveries_month: 70,
    total_completed: 185,
    earnings_today: 12500,
    earnings_week: 51000,
    earnings_month: 218000,
    pending_payout: 12500,
    cod_cash_collected: 31000,
    cod_remitted_total: 195000,
    net_balance: -18500,
    paid_total: 195000,
    lifetime_earnings: 207500,
    status: "on_trip",
    vehicle_type: "Honda Ace 125",
    plate_number: "FKJ-903-AA",
    operating_hub: "Victoria Island Express Hub",
    license_number: "DL-66128-LAG",
    license_expiry: "Oct 2027",
    emergency_contact: "Ngozi Okorie (Sister)",
    emergency_phone: "08091122445",
    rating: 4.9,
    on_time_rate: 99.0,
    cod_limit: 50000,
    date_joined: "20 Sep 2024"
  },
  // 10. Rider Mustapha (on_trip, cash_held)
  {
    rider_user_id: 462,
    rider_name: "RIDER MUSTAPHA",
    phone: "08098889900",
    email: "mustapha.lawal@smokeyhut.com",
    staff_id: "RDR-010",
    active_assignments: 2,
    today_trips: 3,
    deliveries_today: 3,
    deliveries_week: 14,
    deliveries_month: 58,
    total_completed: 160,
    earnings_today: 9000,
    earnings_week: 43000,
    earnings_month: 178000,
    pending_payout: 9000,
    cod_cash_collected: 19500,
    cod_remitted_total: 160000,
    net_balance: -10500,
    paid_total: 160000,
    lifetime_earnings: 169000,
    status: "on_trip",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "MUS-442-LA",
    operating_hub: "Surulere Distribution Center",
    license_number: "DL-88301-LAG",
    license_expiry: "Mar 2028",
    emergency_contact: "Khadija Lawal (Wife)",
    emergency_phone: "08034455112",
    rating: 4.8,
    on_time_rate: 96.9,
    cod_limit: 45000,
    date_joined: "05 Nov 2024"
  },
  // 11. Rider Ibrahim (on_trip, cash_held)
  {
    rider_user_id: 463,
    rider_name: "RIDER IBRAHIM",
    phone: "08129990011",
    email: "ibrahim.kareem@smokeyhut.com",
    staff_id: "RDR-011",
    active_assignments: 1,
    today_trips: 4,
    deliveries_today: 4,
    deliveries_week: 18,
    deliveries_month: 74,
    total_completed: 230,
    earnings_today: 13500,
    earnings_week: 56000,
    earnings_month: 228000,
    pending_payout: 13500,
    cod_cash_collected: 24000,
    cod_remitted_total: 205000,
    net_balance: -10500,
    paid_total: 205000,
    lifetime_earnings: 218500,
    status: "on_trip",
    vehicle_type: "TVS King Tricycle Cargo",
    plate_number: "LSR-820-BB",
    operating_hub: "Lekki Cloud Kitchen",
    license_number: "DL-90412-LAG",
    license_expiry: "Dec 2027",
    emergency_contact: "Bashir Kareem (Brother)",
    emergency_phone: "08082233441",
    rating: 4.9,
    on_time_rate: 98.2,
    cod_limit: 60000,
    date_joined: "18 Aug 2024"
  },
  // 12. Rider Femi (active, available)
  {
    rider_user_id: 464,
    rider_name: "RIDER FEMI",
    phone: "08031122334",
    email: "femi.ojo@smokeyhut.com",
    staff_id: "RDR-012",
    active_assignments: 0,
    today_trips: 2,
    deliveries_today: 2,
    deliveries_week: 14,
    deliveries_month: 55,
    total_completed: 165,
    earnings_today: 6000,
    earnings_week: 42000,
    earnings_month: 168000,
    pending_payout: 6000,
    cod_cash_collected: 0,
    cod_remitted_total: 160000,
    net_balance: 6000,
    paid_total: 160000,
    lifetime_earnings: 166000,
    status: "active",
    vehicle_type: "Honda CB125 Motorcycle",
    plate_number: "BDG-382-XA",
    operating_hub: "Yaba Head Office",
    license_number: "DL-11928-LAG",
    license_expiry: "Apr 2028",
    emergency_contact: "Ronke Ojo (Spouse)",
    emergency_phone: "08027788990",
    rating: 4.8,
    on_time_rate: 97.2,
    cod_limit: 50000,
    date_joined: "10 Jan 2025"
  },
  // 13. Rider Babatunde (active, available)
  {
    rider_user_id: 465,
    rider_name: "RIDER BABATUNDE",
    phone: "08142233445",
    email: "babatunde.fash@smokeyhut.com",
    staff_id: "RDR-013",
    active_assignments: 0,
    today_trips: 1,
    deliveries_today: 1,
    deliveries_week: 12,
    deliveries_month: 50,
    total_completed: 150,
    earnings_today: 3500,
    earnings_week: 36000,
    earnings_month: 152000,
    pending_payout: 3500,
    cod_cash_collected: 0,
    cod_remitted_total: 145000,
    net_balance: 3500,
    paid_total: 145000,
    lifetime_earnings: 148500,
    status: "active",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "SMK-901-LA",
    operating_hub: "Ikeja Kitchen Station",
    license_number: "DL-22394-LAG",
    license_expiry: "Jan 2028",
    emergency_contact: "Titilayo Fash (Wife)",
    emergency_phone: "08035566778",
    rating: 4.7,
    on_time_rate: 96.5,
    cod_limit: 45000,
    date_joined: "12 Feb 2025"
  },
  // 14. Rider Victor (active, available)
  {
    rider_user_id: 466,
    rider_name: "RIDER VICTOR",
    phone: "07063344556",
    email: "victor.umoh@smokeyhut.com",
    staff_id: "RDR-014",
    active_assignments: 0,
    today_trips: 3,
    deliveries_today: 3,
    deliveries_week: 16,
    deliveries_month: 68,
    total_completed: 220,
    earnings_today: 9500,
    earnings_week: 48000,
    earnings_month: 205000,
    pending_payout: 9500,
    cod_cash_collected: 0,
    cod_remitted_total: 195000,
    net_balance: 9500,
    paid_total: 195000,
    lifetime_earnings: 204500,
    status: "active",
    vehicle_type: "Yamaha Crux 110",
    plate_number: "IKJ-294-TT",
    operating_hub: "Victoria Island Express Hub",
    license_number: "DL-44812-LAG",
    license_expiry: "Jun 2027",
    emergency_contact: "Anietie Umoh (Brother)",
    emergency_phone: "08092233441",
    rating: 4.9,
    on_time_rate: 98.7,
    cod_limit: 50000,
    date_joined: "01 Sep 2024"
  },
  // 15. Rider Kayode (active, available)
  {
    rider_user_id: 467,
    rider_name: "RIDER KAYODE",
    phone: "08054455667",
    email: "kayode.bello@smokeyhut.com",
    staff_id: "RDR-015",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 11,
    deliveries_month: 46,
    total_completed: 135,
    earnings_today: 0,
    earnings_week: 33000,
    earnings_month: 138000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 132000,
    net_balance: 0,
    paid_total: 132000,
    lifetime_earnings: 132000,
    status: "active",
    vehicle_type: "Haojue 125 Motorcycle",
    plate_number: "AGL-882-QQ",
    operating_hub: "Surulere Distribution Center",
    license_number: "DL-77291-LAG",
    license_expiry: "Sep 2027",
    emergency_contact: "Kemi Bello (Sister)",
    emergency_phone: "08021188223",
    rating: 4.8,
    on_time_rate: 97.0,
    cod_limit: 40000,
    date_joined: "15 Jan 2025"
  },
  // 16. Rider Chigozie (active, available)
  {
    rider_user_id: 468,
    rider_name: "RIDER CHIGOZIE",
    phone: "08165566778",
    email: "chigozie.nnamdi@smokeyhut.com",
    staff_id: "RDR-016",
    active_assignments: 0,
    today_trips: 2,
    deliveries_today: 2,
    deliveries_week: 15,
    deliveries_month: 60,
    total_completed: 190,
    earnings_today: 7000,
    earnings_week: 45000,
    earnings_month: 182000,
    pending_payout: 7000,
    cod_cash_collected: 0,
    cod_remitted_total: 175000,
    net_balance: 7000,
    paid_total: 175000,
    lifetime_earnings: 182000,
    status: "active",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "LND-110-PP",
    operating_hub: "Lekki Cloud Kitchen",
    license_number: "DL-88192-LAG",
    license_expiry: "Nov 2027",
    emergency_contact: "Uche Nnamdi (Brother)",
    emergency_phone: "08037766554",
    rating: 4.9,
    on_time_rate: 98.4,
    cod_limit: 50000,
    date_joined: "20 Nov 2024"
  },
  // 17. Rider Olumide (active, available)
  {
    rider_user_id: 469,
    rider_name: "RIDER OLUMIDE",
    phone: "08026677889",
    email: "olumide.adeyemi@smokeyhut.com",
    staff_id: "RDR-017",
    active_assignments: 0,
    today_trips: 1,
    deliveries_today: 1,
    deliveries_week: 13,
    deliveries_month: 52,
    total_completed: 155,
    earnings_today: 3000,
    earnings_week: 39000,
    earnings_month: 156000,
    pending_payout: 3000,
    cod_cash_collected: 0,
    cod_remitted_total: 150000,
    net_balance: 3000,
    paid_total: 150000,
    lifetime_earnings: 153000,
    status: "active",
    vehicle_type: "Honda CB125 Motorcycle",
    plate_number: "KJA-832-SS",
    operating_hub: "Yaba Head Office",
    license_number: "DL-55283-LAG",
    license_expiry: "Feb 2028",
    emergency_contact: "Bisi Adeyemi (Mother)",
    emergency_phone: "08084455112",
    rating: 4.8,
    on_time_rate: 96.8,
    cod_limit: 45000,
    date_joined: "05 Dec 2024"
  },
  // 18. Rider Haruna (active, available)
  {
    rider_user_id: 470,
    rider_name: "RIDER HARUNA",
    phone: "07087788990",
    email: "haruna.sule@smokeyhut.com",
    staff_id: "RDR-018",
    active_assignments: 0,
    today_trips: 2,
    deliveries_today: 2,
    deliveries_week: 14,
    deliveries_month: 59,
    total_completed: 175,
    earnings_today: 6500,
    earnings_week: 42000,
    earnings_month: 177000,
    pending_payout: 6500,
    cod_cash_collected: 0,
    cod_remitted_total: 170000,
    net_balance: 6500,
    paid_total: 170000,
    lifetime_earnings: 176500,
    status: "active",
    vehicle_type: "TVS Star HLX 125",
    plate_number: "APP-402-JJ",
    operating_hub: "Ikeja Kitchen Station",
    license_number: "DL-66382-LAG",
    license_expiry: "May 2027",
    emergency_contact: "Zainab Sule (Spouse)",
    emergency_phone: "08139988771",
    rating: 4.8,
    on_time_rate: 97.5,
    cod_limit: 50000,
    date_joined: "14 Oct 2024"
  },
  // 19. Rider Samuel (active, available)
  {
    rider_user_id: 471,
    rider_name: "RIDER SAMUEL",
    phone: "08098899001",
    email: "samuel.ekene@smokeyhut.com",
    staff_id: "RDR-019",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 10,
    deliveries_month: 42,
    total_completed: 125,
    earnings_today: 0,
    earnings_week: 30000,
    earnings_month: 126000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 122000,
    net_balance: 0,
    paid_total: 122000,
    lifetime_earnings: 122000,
    status: "active",
    vehicle_type: "Yamaha Crux 110",
    plate_number: "GGE-910-MM",
    operating_hub: "Victoria Island Express Hub",
    license_number: "DL-77382-LAG",
    license_expiry: "Jul 2027",
    emergency_contact: "Grace Ekene (Wife)",
    emergency_phone: "08023344991",
    rating: 4.7,
    on_time_rate: 96.0,
    cod_limit: 40000,
    date_joined: "22 Jan 2025"
  },
  // 20. Rider Sikiru (active, available)
  {
    rider_user_id: 472,
    rider_name: "RIDER SIKIRU",
    phone: "08139900112",
    email: "sikiru.sanusi@smokeyhut.com",
    staff_id: "RDR-020",
    active_assignments: 0,
    today_trips: 1,
    deliveries_today: 1,
    deliveries_week: 12,
    deliveries_month: 51,
    total_completed: 162,
    earnings_today: 3500,
    earnings_week: 36000,
    earnings_month: 153000,
    pending_payout: 3500,
    cod_cash_collected: 0,
    cod_remitted_total: 148000,
    net_balance: 3500,
    paid_total: 148000,
    lifetime_earnings: 151500,
    status: "active",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "KTU-402-NN",
    operating_hub: "Surulere Distribution Center",
    license_number: "DL-88491-LAG",
    license_expiry: "Oct 2027",
    emergency_contact: "Moriamo Sanusi (Mother)",
    emergency_phone: "08051122883",
    rating: 4.8,
    on_time_rate: 97.1,
    cod_limit: 45000,
    date_joined: "18 Nov 2024"
  },
  // 21. Rider Chidi (active, available)
  {
    rider_user_id: 473,
    rider_name: "RIDER CHIDI",
    phone: "07061133445",
    email: "chidi.okeke@smokeyhut.com",
    staff_id: "RDR-021",
    active_assignments: 0,
    today_trips: 2,
    deliveries_today: 2,
    deliveries_week: 15,
    deliveries_month: 64,
    total_completed: 205,
    earnings_today: 6000,
    earnings_week: 45000,
    earnings_month: 192000,
    pending_payout: 6000,
    cod_cash_collected: 0,
    cod_remitted_total: 185000,
    net_balance: 6000,
    paid_total: 185000,
    lifetime_earnings: 191000,
    status: "active",
    vehicle_type: "Honda CB125 Motorcycle",
    plate_number: "EKY-193-ZZ",
    operating_hub: "Lekki Cloud Kitchen",
    license_number: "DL-99382-LAG",
    license_expiry: "Dec 2027",
    emergency_contact: "Nkiru Okeke (Sister)",
    emergency_phone: "08149988221",
    rating: 4.9,
    on_time_rate: 98.6,
    cod_limit: 50000,
    date_joined: "12 Aug 2024"
  },
  // 22. Rider Kola (offline)
  {
    rider_user_id: 474,
    rider_name: "RIDER KOLA",
    phone: "08052244556",
    email: "kola.ajayi@smokeyhut.com",
    staff_id: "RDR-022",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 8,
    deliveries_month: 35,
    total_completed: 110,
    earnings_today: 0,
    earnings_week: 24000,
    earnings_month: 105000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 105000,
    net_balance: 0,
    paid_total: 105000,
    lifetime_earnings: 105000,
    status: "offline",
    vehicle_type: "Haojue 125 Motorcycle",
    plate_number: "FKJ-482-KK",
    operating_hub: "Yaba Head Office",
    license_number: "DL-11093-LAG",
    license_expiry: "Mar 2028",
    emergency_contact: "Tayo Ajayi (Brother)",
    emergency_phone: "08031144559",
    rating: 4.7,
    on_time_rate: 95.8,
    cod_limit: 40000,
    date_joined: "02 Feb 2025"
  },
  // 23. Rider David (offline)
  {
    rider_user_id: 475,
    rider_name: "RIDER DAVID",
    phone: "08183355667",
    email: "david.mark@smokeyhut.com",
    staff_id: "RDR-023",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 9,
    deliveries_month: 38,
    total_completed: 120,
    earnings_today: 0,
    earnings_week: 27000,
    earnings_month: 114000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 114000,
    net_balance: 0,
    paid_total: 114000,
    lifetime_earnings: 114000,
    status: "offline",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "MUS-301-LL",
    operating_hub: "Ikeja Kitchen Station",
    license_number: "DL-22184-LAG",
    license_expiry: "Apr 2028",
    emergency_contact: "Esther Mark (Sister)",
    emergency_phone: "07062233991",
    rating: 4.8,
    on_time_rate: 96.4,
    cod_limit: 40000,
    date_joined: "18 Jan 2025"
  },
  // 24. Rider Francis (offline)
  {
    rider_user_id: 476,
    rider_name: "RIDER FRANCIS",
    phone: "07034466778",
    email: "francis.okafor@smokeyhut.com",
    staff_id: "RDR-024",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 7,
    deliveries_month: 32,
    total_completed: 98,
    earnings_today: 0,
    earnings_week: 21000,
    earnings_month: 96000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 96000,
    net_balance: 0,
    paid_total: 96000,
    lifetime_earnings: 96000,
    status: "offline",
    vehicle_type: "TVS Star HLX 125",
    plate_number: "LSR-194-CC",
    operating_hub: "Victoria Island Express Hub",
    license_number: "DL-33291-LAG",
    license_expiry: "May 2028",
    emergency_contact: "Blessing Okafor (Wife)",
    emergency_phone: "08091188334",
    rating: 4.7,
    on_time_rate: 95.5,
    cod_limit: 35000,
    date_joined: "25 Feb 2025"
  },
  // 25. Rider Gabriel (offline)
  {
    rider_user_id: 477,
    rider_name: "RIDER GABRIEL",
    phone: "08165577889",
    email: "gabriel.ade@smokeyhut.com",
    staff_id: "RDR-025",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 11,
    deliveries_month: 45,
    total_completed: 140,
    earnings_today: 0,
    earnings_week: 33000,
    earnings_month: 135000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 135000,
    net_balance: 0,
    paid_total: 135000,
    lifetime_earnings: 135000,
    status: "offline",
    vehicle_type: "Yamaha Crux 110",
    plate_number: "BDG-992-VV",
    operating_hub: "Surulere Distribution Center",
    license_number: "DL-44391-LAG",
    license_expiry: "Jul 2027",
    emergency_contact: "Ruth Ade (Sister)",
    emergency_phone: "08027766112",
    rating: 4.8,
    on_time_rate: 97.0,
    cod_limit: 45000,
    date_joined: "10 Nov 2024"
  },
  // 26. Rider Hassan (offline)
  {
    rider_user_id: 478,
    rider_name: "RIDER HASSAN",
    phone: "08026688990",
    email: "hassan.musa@smokeyhut.com",
    staff_id: "RDR-026",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 8,
    deliveries_month: 36,
    total_completed: 115,
    earnings_today: 0,
    earnings_week: 24000,
    earnings_month: 108000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 108000,
    net_balance: 0,
    paid_total: 108000,
    lifetime_earnings: 108000,
    status: "offline",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "SMK-482-BB",
    operating_hub: "Lekki Cloud Kitchen",
    license_number: "DL-55192-LAG",
    license_expiry: "Aug 2027",
    emergency_contact: "Amina Musa (Wife)",
    emergency_phone: "08083322771",
    rating: 4.7,
    on_time_rate: 96.2,
    cod_limit: 40000,
    date_joined: "15 Dec 2024"
  },
  // 27. Rider Ismail (offline)
  {
    rider_user_id: 479,
    rider_name: "RIDER ISMAIL",
    phone: "07087799001",
    email: "ismail.bakare@smokeyhut.com",
    staff_id: "RDR-027",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 9,
    deliveries_month: 40,
    total_completed: 128,
    earnings_today: 0,
    earnings_week: 27000,
    earnings_month: 120000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 120000,
    net_balance: 0,
    paid_total: 120000,
    lifetime_earnings: 120000,
    status: "offline",
    vehicle_type: "Honda Ace 125",
    plate_number: "IKJ-501-RR",
    operating_hub: "Yaba Head Office",
    license_number: "DL-66491-LAG",
    license_expiry: "Oct 2027",
    emergency_contact: "Kafayat Bakare (Mother)",
    emergency_phone: "08124455889",
    rating: 4.8,
    on_time_rate: 96.9,
    cod_limit: 45000,
    date_joined: "05 Jan 2025"
  },
  // 28. Rider Jamiu (offline)
  {
    rider_user_id: 480,
    rider_name: "RIDER JAMIU",
    phone: "08098800112",
    email: "jamiu.olawale@smokeyhut.com",
    staff_id: "RDR-028",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 6,
    deliveries_month: 28,
    total_completed: 88,
    earnings_today: 0,
    earnings_week: 18000,
    earnings_month: 84000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 84000,
    net_balance: 0,
    paid_total: 84000,
    lifetime_earnings: 84000,
    status: "offline",
    vehicle_type: "Haojue 125 Motorcycle",
    plate_number: "AGL-102-HH",
    operating_hub: "Ikeja Kitchen Station",
    license_number: "DL-77582-LAG",
    license_expiry: "Nov 2027",
    emergency_contact: "Rukayat Olawale (Sister)",
    emergency_phone: "08039911223",
    rating: 4.6,
    on_time_rate: 95.0,
    cod_limit: 35000,
    date_joined: "12 Mar 2025"
  },
  // 29. Rider Lukman (offline)
  {
    rider_user_id: 481,
    rider_name: "RIDER LUKMAN",
    phone: "08139911223",
    email: "lukman.gbadamosi@smokeyhut.com",
    staff_id: "RDR-029",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 10,
    deliveries_month: 44,
    total_completed: 138,
    earnings_today: 0,
    earnings_week: 30000,
    earnings_month: 132000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 132000,
    net_balance: 0,
    paid_total: 132000,
    lifetime_earnings: 132000,
    status: "offline",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "LND-882-QQ",
    operating_hub: "Victoria Island Express Hub",
    license_number: "DL-88691-LAG",
    license_expiry: "Jan 2028",
    emergency_contact: "Fausat Gbadamosi (Wife)",
    emergency_phone: "08053322114",
    rating: 4.8,
    on_time_rate: 97.4,
    cod_limit: 45000,
    date_joined: "18 Oct 2024"
  },
  // 30. Rider Michael (offline)
  {
    rider_user_id: 482,
    rider_name: "RIDER MICHAEL",
    phone: "07061144556",
    email: "michael.obinna@smokeyhut.com",
    staff_id: "RDR-030",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 8,
    deliveries_month: 34,
    total_completed: 102,
    earnings_today: 0,
    earnings_week: 24000,
    earnings_month: 102000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 102000,
    net_balance: 0,
    paid_total: 102000,
    lifetime_earnings: 102000,
    status: "offline",
    vehicle_type: "TVS King Tricycle Cargo",
    plate_number: "KJA-204-MM",
    operating_hub: "Surulere Distribution Center",
    license_number: "DL-99781-LAG",
    license_expiry: "Feb 2028",
    emergency_contact: "Chinyere Obinna (Sister)",
    emergency_phone: "08082211994",
    rating: 4.7,
    on_time_rate: 96.0,
    cod_limit: 50000,
    date_joined: "08 Jan 2025"
  },
  // 31. Rider Nurudeen (offline)
  {
    rider_user_id: 483,
    rider_name: "RIDER NURUDEEN",
    phone: "08052255667",
    email: "nurudeen.ali@smokeyhut.com",
    staff_id: "RDR-031",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 7,
    deliveries_month: 30,
    total_completed: 92,
    earnings_today: 0,
    earnings_week: 21000,
    earnings_month: 90000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 90000,
    net_balance: 0,
    paid_total: 90000,
    lifetime_earnings: 90000,
    status: "offline",
    vehicle_type: "Yamaha Crux 110",
    plate_number: "GGE-382-WW",
    operating_hub: "Lekki Cloud Kitchen",
    license_number: "DL-11293-LAG",
    license_expiry: "Mar 2028",
    emergency_contact: "Fatima Ali (Wife)",
    emergency_phone: "08147788112",
    rating: 4.8,
    on_time_rate: 96.8,
    cod_limit: 40000,
    date_joined: "22 Feb 2025"
  },
  // 32. Rider Patrick (offline)
  {
    rider_user_id: 484,
    rider_name: "RIDER PATRICK",
    phone: "08183366778",
    email: "patrick.idoko@smokeyhut.com",
    staff_id: "RDR-032",
    active_assignments: 0,
    today_trips: 0,
    deliveries_today: 0,
    deliveries_week: 9,
    deliveries_month: 39,
    total_completed: 122,
    earnings_today: 0,
    earnings_week: 27000,
    earnings_month: 117000,
    pending_payout: 0,
    cod_cash_collected: 0,
    cod_remitted_total: 117000,
    net_balance: 0,
    paid_total: 117000,
    lifetime_earnings: 117000,
    status: "offline",
    vehicle_type: "Bajaj Boxer 150 Motorcycle",
    plate_number: "EKY-904-TT",
    operating_hub: "Yaba Head Office",
    license_number: "DL-22481-LAG",
    license_expiry: "Apr 2028",
    emergency_contact: "Mercy Idoko (Sister)",
    emergency_phone: "07051144223",
    rating: 4.7,
    on_time_rate: 95.9,
    cod_limit: 40000,
    date_joined: "14 Nov 2024"
  }
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
  },
  {
    id: 145,
    task_ref: "TSK-0022",
    title: "Delivery Helmet Visor & Strap Fastener Inspection",
    description: "Check helmet visor clarity, remove insect residue, and ensure chin strap safety fastener clicks securely.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-22 08:00:00",
    priority: "normal",
    status: "pending"
  },
  {
    id: 146,
    task_ref: "TSK-0023",
    title: "Route GPS Navigation Offline Cache Update",
    description: "Pre-download offline Google Maps tiles for Lekki Phase 1, Ikoyi, and VI grid zones to conserve data and prevent route stalls.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-22 09:15:00",
    priority: "low",
    status: "pending"
  },
  {
    id: 147,
    task_ref: "TSK-0024",
    title: "Emergency Rain Poncho & Waterproof Box Seal Inspection",
    description: "Examine heavy-duty rain poncho for tears and check rubber seal on cargo delivery box ahead of afternoon shower forecast.",
    assignee_name: "RIDER WASIU",
    assignee_id: 453,
    due_date: "2026-10-21 10:00:00",
    priority: "normal",
    status: "done"
  },
  {
    id: 148,
    task_ref: "TSK-0025",
    title: "Engine Oil Level & Spark Plug Check",
    description: "Verify engine oil dipstick clarity and color on Bajaj Boxer 150; top up 20W-50 motorcycle lubricant if below mark.",
    assignee_name: "RIDER WASIU",
    assignee_id: 453,
    due_date: "2026-10-21 14:00:00",
    priority: "urgent",
    status: "in_progress"
  },
  {
    id: 149,
    task_ref: "TSK-0026",
    title: "Cargo Tricycle Rear Brake Shoe Adjustment",
    description: "Tighten rear cable drum brakes on TVS King Tricycle at Ikeja hub maintenance workshop.",
    assignee_name: "RIDER JOSHUA",
    assignee_id: 454,
    due_date: "2026-10-21 13:30:00",
    priority: "urgent",
    status: "done"
  },
  {
    id: 150,
    task_ref: "TSK-0027",
    title: "Customer Handover Protocol & Thermal Bag Repositioning",
    description: "Ensure thermal bags remain upright on rear rack; verify customer names on sealed receipts before order release.",
    assignee_name: "RIDER JOSHUA",
    assignee_id: 454,
    due_date: "2026-10-21 16:30:00",
    priority: "normal",
    status: "pending"
  },
  {
    id: 151,
    task_ref: "TSK-0028",
    title: "Rider ID Card & Driving License Physical Document Check",
    description: "Verify valid LASAA rider rider permit, driver license, and national NIN card are present in rider wallet.",
    assignee_name: "RIDER SUNDAY",
    assignee_id: 456,
    due_date: "2026-10-22 08:30:00",
    priority: "low",
    status: "pending"
  },
  {
    id: 152,
    task_ref: "TSK-0029",
    title: "Weekly Fleet Safety & Defensive Driving Briefing",
    description: "Attend 30-minute safety briefing at Yaba operations bay conducted by Fleet Logistics Manager.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-23 07:30:00",
    priority: "urgent",
    status: "pending"
  }
]

export const SEED_STORE_PICKUPS: StorePickupOrder[] = [
  // Ready for pickup (11 orders)
  { id: 8511, order_ref: "SHD-07619", customer_name: "Olubunmi Cole", phone: "08023183495", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 75200, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-09-24 16:36:38", collected_at: null, collected_by: null, handover_staff: "Tunde Bakare", items_summary: "Full Smokey Guineafowl (Chopped) × 6" },
  { id: 8512, order_ref: "SHD-07621", customer_name: "Fadekemi Alao", phone: "08034455112", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 32000, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 10:15:00", collected_at: null, collected_by: null, handover_staff: "Tunde Bakare", items_summary: "Full Smokey Guineafowl × 2; Smokey Pepper Dip × 2" },
  { id: 8513, order_ref: "SHD-07623", customer_name: "Kunle Ajibade", phone: "08129988776", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 28500, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 11:00:20", collected_at: null, collected_by: null, handover_staff: "Chioma Okonkwo", items_summary: "1L Guineafowl Rice Bowl × 2; Zobo Bottle × 2" },
  { id: 8514, order_ref: "SHD-07625", customer_name: "Damilola Coker", phone: "07065544331", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 45000, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 11:30:45", collected_at: null, collected_by: null, handover_staff: "Tunde Bakare", items_summary: "Full Smokey Catfish × 2; 1L Jollof Rice × 1" },
  { id: 8515, order_ref: "SHD-07627", customer_name: "Ngozi Obi", phone: "08051122339", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 19800, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 12:10:00", collected_at: null, collected_by: null, handover_staff: "Chioma Okonkwo", items_summary: "Smokey Asun Peppered Bowl × 2" },
  { id: 8516, order_ref: "SHD-07629", customer_name: "Segun Martins", phone: "08184455662", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 54000, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 12:45:10", collected_at: null, collected_by: null, handover_staff: "Tunde Bakare", items_summary: "Full Smokey Guineafowl × 4; Palmwine × 2" },
  { id: 8517, order_ref: "SHD-07631", customer_name: "Amina Yusuf", phone: "08092233114", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 36500, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 13:20:00", collected_at: null, collected_by: null, handover_staff: "Chioma Okonkwo", items_summary: "Smokey Gizzard Bowl × 3; Fried Plantain × 2" },
  { id: 8518, order_ref: "SHD-07633", customer_name: "Chukwuma Kalu", phone: "07083344991", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 62000, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 13:50:30", collected_at: null, collected_by: null, handover_staff: "Tunde Bakare", items_summary: "Smokey Hut Feast Box × 1; Palmwine (1L) × 2" },
  { id: 8519, order_ref: "SHD-07635", customer_name: "Folake Balogun", phone: "08027788112", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 27000, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 14:15:00", collected_at: null, collected_by: null, handover_staff: "Chioma Okonkwo", items_summary: "Full Smokey Catfish × 1; 1L Rice Bowl × 1" },
  { id: 8520, order_ref: "SHD-07637", customer_name: "Kehinde Ogundele", phone: "08138899223", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 41500, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 14:40:15", collected_at: null, collected_by: null, handover_staff: "Tunde Bakare", items_summary: "Full Smokey Guineafowl × 3; Extra Hot Pepper Dip × 2" },
  { id: 8521, order_ref: "SHD-07639", customer_name: "Tosin Williams", phone: "08059900221", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 33500, payment_status: "paid", order_status: "ready_for_pickup", packaged_at: "2026-10-21 15:05:00", collected_at: null, collected_by: null, handover_staff: "Chioma Okonkwo", items_summary: "Smokey Beef Suya Pack × 4; Zobo Bottle × 2" },

  // Collected history (11 orders)
  { id: 8501, order_ref: "SHD-07605", customer_name: "Mercy Mercy", phone: "08136565021", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 43700, payment_status: "paid", order_status: "collected", packaged_at: "2026-09-24 14:15:10", collected_at: "2026-09-24 15:45:00", collected_by: "Customer Self", handover_staff: "Chioma Okonkwo", items_summary: "Full Smokey Guineafowl × 3; Palmwine × 2" },
  { id: 8502, order_ref: "SHD-07606", customer_name: "Babatunde George", phone: "08021122334", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 29500, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-20 11:00:00", collected_at: "2026-10-20 11:45:12", collected_by: "Customer Self", handover_staff: "Tunde Bakare", items_summary: "Full Smokey Guineafowl × 2; Smokey Pepper Dip × 1" },
  { id: 8503, order_ref: "SHD-07607", customer_name: "Ronke Adeleke", phone: "08149988771", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 51000, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-20 12:30:00", collected_at: "2026-10-20 13:20:45", collected_by: "Customer Self", handover_staff: "Chioma Okonkwo", items_summary: "Full Smokey Catfish × 2; 1L Guineafowl Rice × 2" },
  { id: 8504, order_ref: "SHD-07608", customer_name: "Ibrahim Sanni", phone: "07062233889", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 18500, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-20 13:45:00", collected_at: "2026-10-20 14:35:10", collected_by: "Driver (Sunday)", handover_staff: "Tunde Bakare", items_summary: "Smokey Asun Peppered Bowl × 2" },
  { id: 8505, order_ref: "SHD-07609", customer_name: "Sharon Briggs", phone: "08093344112", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 67000, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-20 15:10:00", collected_at: "2026-10-20 16:05:00", collected_by: "Customer Self", handover_staff: "Chioma Okonkwo", items_summary: "Smokey Hut VIP Feast Box × 1; Palmwine × 2" },
  { id: 8506, order_ref: "SHD-07610", customer_name: "Victor Nwosu", phone: "08051188334", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 34000, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-19 11:20:00", collected_at: "2026-10-19 12:15:20", collected_by: "Customer Self", handover_staff: "Tunde Bakare", items_summary: "Full Smokey Guineafowl × 2; Zobo Bottle × 2" },
  { id: 8507, order_ref: "SHD-07611", customer_name: "Hauwa Mohammed", phone: "08182233991", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 42500, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-19 13:00:00", collected_at: "2026-10-19 14:10:00", collected_by: "Personal Assistant", handover_staff: "Chioma Okonkwo", items_summary: "Full Smokey Catfish × 2; Fried Plantain × 2" },
  { id: 8508, order_ref: "SHD-07612", customer_name: "Tayo Oladipo", phone: "07038899221", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 26000, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-19 15:30:00", collected_at: "2026-10-19 16:25:40", collected_by: "Customer Self", handover_staff: "Tunde Bakare", items_summary: "1L Guineafowl Rice Bowl × 2; Smokey Pepper Dip × 1" },
  { id: 8509, order_ref: "SHD-07613", customer_name: "Blessing Danjuma", phone: "08027788334", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 58000, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-18 12:15:00", collected_at: "2026-10-18 13:10:00", collected_by: "Customer Self", handover_staff: "Chioma Okonkwo", items_summary: "Full Smokey Guineafowl × 4; Palmwine × 2" },
  { id: 8510, order_ref: "SHD-07614", customer_name: "Kolawole Sanusi", phone: "08131199445", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 31000, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-18 14:40:00", collected_at: "2026-10-18 15:35:15", collected_by: "Customer Self", handover_staff: "Tunde Bakare", items_summary: "Smokey Beef Suya Pack × 3; 1L Jollof Rice × 1" },
  { id: 8522, order_ref: "SHD-07615", customer_name: "Chidinma Eze", phone: "09082233110", address: "Storefront Pickup Counter (Sabo Yaba)", total_amount: 48500, payment_status: "paid", order_status: "collected", packaged_at: "2026-10-18 16:20:00", collected_at: "2026-10-18 17:15:00", collected_by: "Customer Self", handover_staff: "Chioma Okonkwo", items_summary: "Full Smokey Guineafowl × 3; Zobo Bottle × 3" }
]

export const SEED_THIRD_PARTY_SUMMARY: ThirdPartyWeeklySummary[] = [
  { week_start: "2026-09-14", week_end: "2026-09-20", label: "14 Sep – 20 Sep 2026", delivery_count: 26, order_fees: 113500, booked_fees: 126100, net: -12600, loss_count: 18, gain_count: 6, even_count: 2 },
  { week_start: "2026-09-07", week_end: "2026-09-13", label: "07 Sep – 13 Sep 2026", delivery_count: 19, order_fees: 83500, booked_fees: 83100, net: 400, loss_count: 7, gain_count: 10, even_count: 2 },
  { week_start: "2026-08-31", week_end: "2026-09-06", label: "31 Aug – 06 Sep 2026", delivery_count: 15, order_fees: 62000, booked_fees: 75800, net: -13800, loss_count: 11, gain_count: 3, even_count: 1 },
  { week_start: "2026-08-24", week_end: "2026-08-30", label: "24 Aug – 30 Aug 2026", delivery_count: 14, order_fees: 58500, booked_fees: 60700, net: -2200, loss_count: 8, gain_count: 5, even_count: 1 },
  { week_start: "2026-08-17", week_end: "2026-08-23", label: "17 Aug – 23 Aug 2026", delivery_count: 22, order_fees: 98000, booked_fees: 104500, net: -6500, loss_count: 14, gain_count: 6, even_count: 2 },
  { week_start: "2026-08-10", week_end: "2026-08-16", label: "10 Aug – 16 Aug 2026", delivery_count: 18, order_fees: 79500, booked_fees: 78000, net: 1500, loss_count: 6, gain_count: 10, even_count: 2 },
  { week_start: "2026-08-03", week_end: "2026-08-09", label: "03 Aug – 09 Aug 2026", delivery_count: 25, order_fees: 110000, booked_fees: 118200, net: -8200, loss_count: 16, gain_count: 7, even_count: 2 },
  { week_start: "2026-07-27", week_end: "2026-08-02", label: "27 Jul – 02 Aug 2026", delivery_count: 20, order_fees: 88500, booked_fees: 91400, net: -2900, loss_count: 12, gain_count: 6, even_count: 2 },
  { week_start: "2026-07-20", week_end: "2026-07-26", label: "20 Jul – 26 Jul 2026", delivery_count: 17, order_fees: 74000, booked_fees: 72800, net: 1200, loss_count: 5, gain_count: 10, even_count: 2 },
  { week_start: "2026-07-13", week_end: "2026-07-19", label: "13 Jul – 19 Jul 2026", delivery_count: 23, order_fees: 102500, booked_fees: 109800, net: -7300, loss_count: 15, gain_count: 6, even_count: 2 },
  { week_start: "2026-07-06", week_end: "2026-07-12", label: "06 Jul – 12 Jul 2026", delivery_count: 16, order_fees: 71000, booked_fees: 73500, net: -2500, loss_count: 9, gain_count: 5, even_count: 2 },
  { week_start: "2026-06-29", week_end: "2026-07-05", label: "29 Jun – 05 Jul 2026", delivery_count: 21, order_fees: 94000, booked_fees: 97800, net: -3800, loss_count: 13, gain_count: 7, even_count: 1 },
]


