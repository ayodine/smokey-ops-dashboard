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
  stock_qty: number // Total Physical On-Hand (Ready in Warmers/Chillers)
  qty_allocated: number // Reserved for orders in packaging/dispatch
  qty_available: number // Physical stock ready for instant fulfillment (stock_qty - qty_allocated)
  inventory_value: number
  is_active: number
  // Two-Tier Inventory Pipeline (Active/Scheduled Smoker Batches Buffer)
  estimated_incoming_qty?: number // Quantity currently in smoker pits or scheduled next-day
  sellable_qty?: number // Total available for sale on online storefront = max(0, stock_qty + estimated_incoming_qty - qty_allocated)
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
  batch_schedule?: 'today' | 'tomorrow_morning'
  feed_sales_inventory?: boolean
  estimated_ready_time?: string
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
export const SEED_INVENTORY_LOTS: InventoryLot[] = []

// -------------------------------------------------------------
// STOCKTAKE VARIANCE ESCROW DATASETS (Section 9.4)
// -------------------------------------------------------------
export const SEED_STOCKTAKE_VARIANCES: StocktakeVariance[] = []

// -------------------------------------------------------------
// SEED DATASETS (AUTHENTIC SMOKEY HUT DATA)
// -------------------------------------------------------------

export const SEED_RAW_PRODUCTS: RawProduct[] = [
  {
    "id": 68,
    "sku": "SKU-00034",
    "name": "CINNAMON STICK",
    "product_type": "raw",
    "unit": "PACK",
    "reorder_level": 10,
    "unit_cost": 500,
    "stock_qty": 1,
    "qty_allocated": 0,
    "qty_available": 1,
    "qty_quarantine": 0,
    "inventory_value": 500,
    "is_active": 1
  },
  {
    "id": 69,
    "sku": "SKU-00035",
    "name": "CLOVE",
    "product_type": "raw",
    "unit": "CUP",
    "reorder_level": 5,
    "unit_cost": 1800,
    "stock_qty": 0,
    "qty_allocated": 0,
    "qty_available": 0,
    "qty_quarantine": 0,
    "inventory_value": 0,
    "is_active": 1
  },
  {
    "id": 53,
    "sku": "SKU-00019",
    "name": "DRY PEPPER",
    "product_type": "raw",
    "unit": "KG",
    "reorder_level": 10,
    "unit_cost": 3300,
    "stock_qty": 16,
    "qty_allocated": 0,
    "qty_available": 16,
    "qty_quarantine": 0,
    "inventory_value": 52800,
    "is_active": 1
  },
  {
    "id": 52,
    "sku": "SKU-00018",
    "name": "FIREWOOD",
    "product_type": "raw",
    "unit": "Bundle",
    "reorder_level": 50,
    "unit_cost": 570,
    "stock_qty": 20,
    "qty_allocated": 0,
    "qty_available": 20,
    "qty_quarantine": 0,
    "inventory_value": 11400,
    "is_active": 1
  },
  {
    "id": 63,
    "sku": "SKU-00029",
    "name": "FRESH CHICKEN",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 20,
    "unit_cost": 6500,
    "stock_qty": 31,
    "qty_allocated": 0,
    "qty_available": 31,
    "qty_quarantine": 0,
    "inventory_value": 201500,
    "is_active": 1
  },
  {
    "id": 100,
    "sku": "FRKGZ",
    "name": "FRESH EXTRA KING SIZE GF",
    "product_type": "raw",
    "unit": "PCS",
    "reorder_level": 5,
    "unit_cost": 12000,
    "stock_qty": 2,
    "qty_allocated": 0,
    "qty_available": 2,
    "qty_quarantine": 0,
    "inventory_value": 24000,
    "is_active": 1
  },
  {
    "id": 62,
    "sku": "SKU-00028",
    "name": "FRESH GUINEAFOWL",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 150,
    "unit_cost": 6500,
    "stock_qty": 52,
    "qty_allocated": 0,
    "qty_available": 52,
    "qty_quarantine": 0,
    "inventory_value": 338000,
    "is_active": 1
  },
  {
    "id": 65,
    "sku": "SKU-00031",
    "name": "FRESH KING-SIZE GUINEAFOWL",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 30,
    "unit_cost": 12000,
    "stock_qty": 39,
    "qty_allocated": 0,
    "qty_available": 39,
    "qty_quarantine": 0,
    "inventory_value": 468000,
    "is_active": 1
  },
  {
    "id": 64,
    "sku": "SKU-00030",
    "name": "FRESH RABBIT",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 10,
    "unit_cost": 7000,
    "stock_qty": 0,
    "qty_allocated": 0,
    "qty_available": 0,
    "qty_quarantine": 0,
    "inventory_value": 0,
    "is_active": 1
  },
  {
    "id": 103,
    "sku": "PMW25",
    "name": "PALMWINE 25LITRE",
    "product_type": "raw",
    "unit": "litre",
    "reorder_level": 0,
    "unit_cost": 15000,
    "stock_qty": 72,
    "qty_allocated": 0,
    "qty_available": 72,
    "qty_quarantine": 0,
    "inventory_value": 1080000,
    "is_active": 1
  },
  {
    "id": 66,
    "sku": "SKU-00032",
    "name": "PALMWINE BOTTLE",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 150,
    "unit_cost": 130,
    "stock_qty": 113,
    "qty_allocated": 0,
    "qty_available": 113,
    "qty_quarantine": 0,
    "inventory_value": 14690,
    "is_active": 1
  },
  {
    "id": 71,
    "sku": "SKU-00037",
    "name": "PALMWINE STICKER",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 200,
    "unit_cost": 40,
    "stock_qty": 645,
    "qty_allocated": 0,
    "qty_available": 645,
    "qty_quarantine": 0,
    "inventory_value": 25800,
    "is_active": 1
  },
  {
    "id": 54,
    "sku": "SKU-00020",
    "name": "SPICIES",
    "product_type": "raw",
    "unit": "PACK",
    "reorder_level": 10,
    "unit_cost": 19900,
    "stock_qty": 2,
    "qty_allocated": 0,
    "qty_available": 2,
    "qty_quarantine": 0,
    "inventory_value": 39800,
    "is_active": 1
  },
  {
    "id": 55,
    "sku": "SKU-00021",
    "name": "VEGETABLE OIL",
    "product_type": "raw",
    "unit": "LITRE",
    "reorder_level": 20,
    "unit_cost": 2264.4,
    "stock_qty": 71.5,
    "qty_allocated": 0,
    "qty_available": 71.5,
    "qty_quarantine": 0,
    "inventory_value": 161904.6,
    "is_active": 1
  },
  {
    "id": 85,
    "sku": "SKU-00051",
    "name": "YAJI NYLON",
    "product_type": "raw",
    "unit": "PACK",
    "reorder_level": 10,
    "unit_cost": 338,
    "stock_qty": 0,
    "qty_allocated": 0,
    "qty_available": 0,
    "qty_quarantine": 0,
    "inventory_value": 0,
    "is_active": 1
  },
  {
    "id": 82,
    "sku": "SKU-00048",
    "name": "YAJI PEPPER (567)",
    "product_type": "raw",
    "unit": "KG",
    "reorder_level": 10,
    "unit_cost": 1002,
    "stock_qty": 130,
    "qty_allocated": 0,
    "qty_available": 130,
    "qty_quarantine": 0,
    "inventory_value": 130260,
    "is_active": 1
  },
  {
    "id": 86,
    "sku": "SKU-00052",
    "name": "YAJI SACHET PEPPER (PER PIECES)",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 20,
    "unit_cost": 100,
    "stock_qty": 130,
    "qty_allocated": 0,
    "qty_available": 130,
    "qty_quarantine": 0,
    "inventory_value": 13000,
    "is_active": 1
  },
  {
    "id": 67,
    "sku": "SKU-00033",
    "name": "ZOBO BOTTLE",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 150,
    "unit_cost": 110,
    "stock_qty": 332,
    "qty_allocated": 0,
    "qty_available": 332,
    "qty_quarantine": 0,
    "inventory_value": 36520,
    "is_active": 1
  },
  {
    "id": 70,
    "sku": "SKU-00036",
    "name": "ZOBO STICKER",
    "product_type": "raw",
    "unit": "PIECES",
    "reorder_level": 200,
    "unit_cost": 40,
    "stock_qty": 0,
    "qty_allocated": 0,
    "qty_available": 0,
    "qty_quarantine": 0,
    "inventory_value": 0,
    "is_active": 1
  }
]

export const SEED_RAW_DELIVERIES: RawDelivery[] = []

export const SEED_RAW_MOVEMENTS: RawMovement[] = []

export const SEED_RAW_USAGE: RawUsageItem[] = []

export const SEED_PACKAGING_PRODUCTS: PackagingProduct[] = [
  {
    "id": 93,
    "sku": "PCK004",
    "name": "BIG BRANDED BAG",
    "product_type": "packaging",
    "unit": "PIECES",
    "reorder_level": 500,
    "unit_cost": 420,
    "stock_qty": 108,
    "qty_allocated": 0,
    "qty_available": 108,
    "inventory_value": 45360,
    "is_active": 1
  },
  {
    "id": 109,
    "sku": "SKU-00075",
    "name": "BIGGEST BRANDED NYLON",
    "product_type": "packaging",
    "unit": "PCS",
    "reorder_level": 50,
    "unit_cost": 150,
    "stock_qty": 137,
    "qty_allocated": 0,
    "qty_available": 137,
    "inventory_value": 20550,
    "is_active": 1
  },
  {
    "id": 95,
    "sku": "PCK006",
    "name": "BRANDED POLYBAG",
    "product_type": "packaging",
    "unit": "PCS",
    "reorder_level": 500,
    "unit_cost": 105,
    "stock_qty": 551,
    "qty_allocated": 0,
    "qty_available": 551,
    "inventory_value": 57855,
    "is_active": 1
  },
  {
    "id": 162,
    "sku": "SKU-00080",
    "name": "full guineafowl",
    "product_type": "packaging",
    "unit": "unit",
    "reorder_level": 20,
    "unit_cost": 0,
    "stock_qty": 0,
    "qty_allocated": 0,
    "qty_available": 0,
    "inventory_value": 0,
    "is_active": 1
  },
  {
    "id": 110,
    "sku": "SKU-00076",
    "name": "MEDIUM POLY BAG",
    "product_type": "packaging",
    "unit": "PCS",
    "reorder_level": 50,
    "unit_cost": 150,
    "stock_qty": 115,
    "qty_allocated": 0,
    "qty_available": 115,
    "inventory_value": 17250,
    "is_active": 1
  },
  {
    "id": 94,
    "sku": "PCK005",
    "name": "PLAIN POLYBAG",
    "product_type": "packaging",
    "unit": "PIECES",
    "reorder_level": 300,
    "unit_cost": 85,
    "stock_qty": 68,
    "qty_allocated": 0,
    "qty_available": 68,
    "inventory_value": 5780,
    "is_active": 1
  },
  {
    "id": 90,
    "sku": "PCK001",
    "name": "SIZE 12 NYLON",
    "product_type": "packaging",
    "unit": "PIECES",
    "reorder_level": 1000,
    "unit_cost": 50,
    "stock_qty": 85,
    "qty_allocated": 0,
    "qty_available": 85,
    "inventory_value": 4250,
    "is_active": 1
  },
  {
    "id": 91,
    "sku": "PCK002",
    "name": "SIZE 8 NYLON",
    "product_type": "packaging",
    "unit": "PIECES",
    "reorder_level": 500,
    "unit_cost": 20,
    "stock_qty": 53,
    "qty_allocated": 0,
    "qty_available": 53,
    "inventory_value": 1060,
    "is_active": 1
  },
  {
    "id": 96,
    "sku": "PCK007",
    "name": "SMALL BRAND NYLON",
    "product_type": "packaging",
    "unit": "PIECES",
    "reorder_level": 300,
    "unit_cost": 69,
    "stock_qty": 1335,
    "qty_allocated": 0,
    "qty_available": 1335,
    "inventory_value": 92115,
    "is_active": 1
  },
  {
    "id": 92,
    "sku": "PCK003",
    "name": "SMALL BROWN BAG",
    "product_type": "packaging",
    "unit": "PIECES",
    "reorder_level": 500,
    "unit_cost": 300,
    "stock_qty": 157,
    "qty_allocated": 0,
    "qty_available": 157,
    "inventory_value": 47100,
    "is_active": 1
  },
  {
    "id": 97,
    "sku": "PCK008",
    "name": "SMALL NON-BRANDED NYLON",
    "product_type": "packaging",
    "unit": "unit",
    "reorder_level": 300,
    "unit_cost": 42,
    "stock_qty": 793,
    "qty_allocated": 0,
    "qty_available": 793,
    "inventory_value": 33306,
    "is_active": 1
  },
  {
    "id": 99,
    "sku": "YJ",
    "name": "YAJI SACHET",
    "product_type": "packaging",
    "unit": "PCS",
    "reorder_level": 50,
    "unit_cost": 100,
    "stock_qty": 82,
    "qty_allocated": 0,
    "qty_available": 82,
    "inventory_value": 8200,
    "is_active": 1
  }
]

export const SEED_PACKAGING_RECEIPTS_TOTALS: PackagingReceiptTotal[] = []

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

export const SEED_DAILY_SALES: DailySalesItem[] = []

export const SEED_SALES_MOVEMENTS: SalesMovement[] = []

export const SEED_SUPPLIERS: Supplier[] = [
  {
    "id": 6,
    "supplier_ref": "SUP-00005",
    "name": "FIREWOOD SUPPLIER",
    "phone": "",
    "email": "",
    "address": "",
    "category": "Firewood & Smoker Wood",
    "delivery_count": 0,
    "total_spend": 0,
    "is_active": 1
  },
  {
    "id": 3,
    "supplier_ref": "SUP-00002",
    "name": "LOCAL MARKET",
    "phone": "09110382689",
    "email": "",
    "address": "",
    "category": "Market Goods & Spices",
    "delivery_count": 0,
    "total_spend": 0,
    "is_active": 1
  },
  {
    "id": 2,
    "supplier_ref": "SUP-00001",
    "name": "MADAM",
    "phone": "09110382689",
    "email": "Smokeyhut04@gmail.com",
    "address": "13 MCNEIL STR SABO YABA",
    "category": "Fresh Poultry & Live Birds",
    "delivery_count": 0,
    "total_spend": 0,
    "is_active": 1
  },
  {
    "id": 4,
    "supplier_ref": "SUP-00003",
    "name": "NYLON SUPPLIER",
    "phone": "",
    "email": "",
    "address": "",
    "category": "Packaging & Printing Materials",
    "delivery_count": 0,
    "total_spend": 0,
    "is_active": 1
  },
  {
    "id": 5,
    "supplier_ref": "SUP-00004",
    "name": "PRINTER MR HAMMED",
    "phone": "",
    "email": "",
    "address": "",
    "category": "Packaging & Printing Materials",
    "delivery_count": 0,
    "total_spend": 0,
    "is_active": 1
  }
]

export const SEED_PRODUCTION_BATCHES: ProductionBatch[] = [
  {
    id: 101,
    batch_ref: "BAT-00021",
    output_product_id: 38,
    output_product_name: "Full Smokey Guineafowl",
    expected_output: 50,
    actual_output: 0,
    wastage: 0,
    status: "in_production",
    batch_schedule: "today",
    feed_sales_inventory: true,
    estimated_ready_time: "Today 1:30 PM",
    started_at: "2026-10-30 09:15:00",
    completed_at: null,
    remarks: "Standard morning smoke run in Pit #1. Feeds active web storefront buffer.",
    created_by_name: "Babajide (Lead Pitmaster)",
    raw_materials: [
      { product_id: 1, sku: "RAW-GUINEAFOWL", name: "FRESH GUINEAFOWL", quantity: 50, unit: "pieces" },
      { product_id: 2, sku: "RAW-PEPPER", name: "DRY PEPPER", quantity: 2.5, unit: "kg" },
      { product_id: 3, sku: "RAW-SPICES", name: "SPICIES", quantity: 1, unit: "packs" },
      { product_id: 4, sku: "RAW-FIREWOOD", name: "FIREWOOD", quantity: 4, unit: "bundle" }
    ]
  },
  {
    id: 102,
    batch_ref: "BAT-00022",
    output_product_id: 39,
    output_product_name: "Full Smokey Guineafowl (Chopped)",
    expected_output: 40,
    actual_output: 0,
    wastage: 0,
    status: "draft",
    batch_schedule: "tomorrow_morning",
    feed_sales_inventory: true,
    estimated_ready_time: "Tomorrow 9:30 AM",
    started_at: null,
    completed_at: null,
    remarks: "Overnight pre-order buffer. Pit fires up at 6:00 AM tomorrow.",
    created_by_name: "Babajide (Lead Pitmaster)",
    raw_materials: [
      { product_id: 1, sku: "RAW-GUINEAFOWL", name: "FRESH GUINEAFOWL", quantity: 40, unit: "pieces" },
      { product_id: 2, sku: "RAW-PEPPER", name: "DRY PEPPER", quantity: 2, unit: "kg" },
      { product_id: 4, sku: "RAW-FIREWOOD", name: "FIREWOOD", quantity: 3, unit: "bundle" }
    ]
  },
  {
    id: 100,
    batch_ref: "BAT-00020",
    output_product_id: 57,
    output_product_name: "Charcoal Roasted Whole Catfish (Family)",
    expected_output: 25,
    actual_output: 24,
    wastage: 1,
    status: "completed",
    batch_schedule: "today",
    feed_sales_inventory: true,
    estimated_ready_time: "Today 10:00 AM",
    started_at: "2026-10-30 06:30:00",
    completed_at: "2026-10-30 09:45:00",
    remarks: "Early morning smoke cycle. Deposited +24 fish into Sales Inventory.",
    created_by_name: "Babajide (Lead Pitmaster)",
    raw_materials: [
      { product_id: 8, sku: "RAW-CATFISH", name: "FRESH CATFISH", quantity: 25, unit: "pieces" },
      { product_id: 2, sku: "RAW-PEPPER", name: "DRY PEPPER", quantity: 1.5, unit: "kg" },
      { product_id: 5, sku: "RAW-CHARCOAL", name: "HARDWOOD CHARCOAL", quantity: 2, unit: "bag" }
    ]
  }
]

export const SEED_PACKAGING_QUEUE: PackagingQueueOrder[] = []

export const SEED_PACKAGING_MATERIALS_DAILY: PackagingMaterialDaily[] = []

export const SEED_KITCHEN_TASKS: KitchenTask[] = []

export const SEED_LOGISTICS_DELIVERIES: LogisticsDelivery[] = []

export const SEED_SCHEDULED_ORDERS: ScheduledOrder[] = []

export const SEED_RIDER_PAYOUTS: RiderPayout[] = [
  {
    "rider_user_id": 513,
    "rider_name": "FRESH LOGISTICS",
    "phone": "09110382689",
    "email": "ridersmokeyhutfrlgs@gmail.com",
    "staff_id": "SHD-RDR-513",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 583,
    "rider_name": "John Doe",
    "phone": "09110382689",
    "email": "johndoe@streetmba.com",
    "staff_id": "SHD-RDR-583",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 459,
    "rider_name": "RIDER ABU",
    "phone": "09110382689",
    "email": "ridersmokeyabu@gmail.com",
    "staff_id": "SHD-RDR-459",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 458,
    "rider_name": "RIDER AMINU",
    "phone": "09110382689",
    "email": "ridersmokeyaminu@gmail.com",
    "staff_id": "SHD-RDR-458",
    "active_assignments": 2,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 457,
    "rider_name": "RIDER IDRIS",
    "phone": "09110382689",
    "email": "ridersmokeyidris@gmail.com",
    "staff_id": "SHD-RDR-457",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 454,
    "rider_name": "RIDER JOSHUA",
    "phone": "09110382689",
    "email": "ridersmokeyhutjoshua@gmail.com",
    "staff_id": "SHD-RDR-454",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 451,
    "rider_name": "RIDER PRINCE",
    "phone": "09110382689",
    "email": "ridersmokeyhutprince@gmail.com",
    "staff_id": "SHD-RDR-451",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 452,
    "rider_name": "RIDER SAM",
    "phone": "09110382689",
    "email": "ridersmokeyhutsam@gmail.com",
    "staff_id": "SHD-RDR-452",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 456,
    "rider_name": "RIDER SUNDAY",
    "phone": "09110382689",
    "email": "ridersmokeysunday@gmail.com",
    "staff_id": "SHD-RDR-456",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 453,
    "rider_name": "RIDER WASIU",
    "phone": "09110382689",
    "email": "ridersmokeyhutwasiu@gmail.com",
    "staff_id": "SHD-RDR-453",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  },
  {
    "rider_user_id": 455,
    "rider_name": "RIDER YUSUF",
    "phone": "09110382689",
    "email": "ridersmokeyyusuf@gmail.com",
    "staff_id": "SHD-RDR-455",
    "active_assignments": 0,
    "today_trips": 0,
    "deliveries_today": 0,
    "deliveries_week": 0,
    "deliveries_month": 0,
    "total_completed": 0,
    "earnings_today": 0,
    "earnings_week": 0,
    "earnings_month": 0,
    "pending_payout": 0,
    "cod_cash_collected": 0,
    "cod_remitted_total": 0,
    "net_balance": 0,
    "paid_total": 0,
    "lifetime_earnings": 0,
    "status": "active",
    "operating_hub": "Lagos Mainland HQ"
  }
]

export const SEED_RIDER_TASKS: RiderTask[] = []

export const SEED_STORE_PICKUPS: StorePickupOrder[] = []

export const SEED_THIRD_PARTY_SUMMARY: ThirdPartyWeeklySummary[] = []
