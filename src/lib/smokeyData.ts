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
  location?: string
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
export const SEED_INVENTORY_LOTS: InventoryLot[] = [
  {
    id: 1,
    lot_number: "LOT-2026-CHICKEN-1029",
    product_id: 62,
    product_name: "FRESH GUINEAFOWL",
    sku: "SKU-00028",
    supplier_name: "MADAM COMFORT FRESH LIVE BIRDS",
    initial_qty: 50,
    remaining_qty: 45,
    unit: "PIECES",
    unit_cost: 6500,
    received_date: "2026-10-29",
    expiry_date: "2026-11-04",
    days_to_expiry: 5,
    status: "near_expiry",
    location: "Chiller 01 (Poultry Bay)"
  },
  {
    id: 2,
    lot_number: "LOT-2026-CATFISH-1030",
    product_id: 8,
    product_name: "FRESH CATFISH",
    sku: "RAW-CATFISH",
    supplier_name: "EPE COASTAL CATFISH COOPERATIVE",
    initial_qty: 30,
    remaining_qty: 25,
    unit: "PIECES",
    unit_cost: 4500,
    received_date: "2026-10-30",
    expiry_date: "2026-11-03",
    days_to_expiry: 4,
    status: "near_expiry",
    location: "Fish Holding Tank (Wet Bay)"
  },
  {
    id: 3,
    lot_number: "LOT-2026-PEPPER-1025",
    product_id: 53,
    product_name: "DRY PEPPER",
    sku: "SKU-00019",
    supplier_name: "IBADAN SPICES & DRIED PEPPER HUB",
    initial_qty: 20,
    remaining_qty: 18,
    unit: "KG",
    unit_cost: 1800,
    received_date: "2026-10-25",
    expiry_date: "2026-12-25",
    days_to_expiry: 56,
    status: "active",
    location: "Dry Spices Pantry Rack B"
  },
  {
    id: 4,
    lot_number: "LOT-2026-CHARCOAL-1027",
    product_id: 5,
    product_name: "HARDWOOD CHARCOAL",
    sku: "RAW-CHARCOAL",
    supplier_name: "FIREWOOD & HARDWOOD SUPPLIER",
    initial_qty: 35,
    remaining_qty: 30,
    unit: "BAG",
    unit_cost: 4200,
    received_date: "2026-10-27",
    expiry_date: "2027-10-27",
    days_to_expiry: 362,
    status: "active",
    location: "Outdoor Wood Yard Fuel Store"
  }
]

// -------------------------------------------------------------
// STOCKTAKE VARIANCE ESCROW DATASETS (Section 9.4)
// -------------------------------------------------------------
export const SEED_STOCKTAKE_VARIANCES: StocktakeVariance[] = [
  {
    id: 1,
    product_id: 53,
    product_name: "DRY PEPPER",
    sku: "SKU-00019",
    category: "raw",
    unit: "KG",
    unit_cost: 1800,
    digital_count: 20,
    physical_count: 18.5,
    variance_qty: -1.5,
    variance_value: -2700,
    date: "2026-10-29",
    counted_by: "Tunde Bakare (Inventory Specialist)",
    status: "pending_review",
    supervisor_notes: "Minor shrinkage due to moisture evaporation during drying cycle in pantry."
  },
  {
    id: 2,
    product_id: 93,
    product_name: "BIG BRANDED BAG",
    sku: "PCK004",
    category: "packaging",
    unit: "PIECES",
    unit_cost: 420,
    digital_count: 110,
    physical_count: 108,
    variance_qty: -2,
    variance_value: -840,
    date: "2026-10-26",
    counted_by: "Bisi Akande (Packaging Lead)",
    status: "reconciled",
    supervisor_notes: "Two bags discarded due to torn carry handle during morning packing rush."
  }
]

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

export const SEED_RAW_DELIVERIES: RawDelivery[] = [
  {
    id: 1,
    delivery_ref: "DEL-2026-1030-01",
    supplier_id: 1,
    supplier_name: "MADAM COMFORT FRESH LIVE BIRDS",
    product_id: 62,
    product_name: "FRESH GUINEAFOWL",
    sku: "SKU-00028",
    quantity: 60,
    unit: "PIECES",
    unit_cost: 5500,
    value_amount: 330000,
    date_received: "2026-10-30 06:45:00",
    user_name: "Tunde Bakare",
    notes: "Early morning fresh farm delivery. Dressed and inspected in poultry bay.",
    lot_number: "LOT-2026-CHICKEN-1030",
    expiry_date: "2026-11-05"
  },
  {
    id: 2,
    delivery_ref: "DEL-2026-1029-02",
    supplier_id: 6,
    supplier_name: "FIREWOOD & HARDWOOD SUPPLIER",
    product_id: 5,
    product_name: "HARDWOOD CHARCOAL",
    sku: "RAW-CHARCOAL",
    quantity: 20,
    unit: "BAG",
    unit_cost: 6000,
    value_amount: 120000,
    date_received: "2026-10-29 14:15:00",
    user_name: "Babajide Sanusi",
    notes: "High density dry oak and hardwood charcoal for weekend smoking cycle."
  },
  {
    id: 3,
    delivery_ref: "DEL-2026-1028-03",
    supplier_id: 4,
    supplier_name: "IBADAN SPICES & DRIED PEPPER HUB",
    product_id: 53,
    product_name: "DRY PEPPER",
    sku: "SKU-00019",
    quantity: 25,
    unit: "KG",
    unit_cost: 1800,
    value_amount: 45000,
    date_received: "2026-10-28 11:30:00",
    user_name: "Tunde Bakare",
    notes: "Coarse ground spicy hot red habanero pepper for signature glaze."
  }
]

export const SEED_RAW_MOVEMENTS: RawMovement[] = [
  {
    id: 1,
    product_id: 62,
    product_name: "FRESH GUINEAFOWL",
    sku: "SKU-00028",
    unit: "PIECES",
    location: "Central Kitchen Smoker Pits",
    movement_type: "consumption",
    quantity: -42,
    unit_cost: 5500,
    value_amount: -231000,
    balance_after: 45,
    notes: "Allocated to Production Batch BATCH-2026-001 (Signature Smoked Guineafowl).",
    created_at: "2026-10-30 07:15:00",
    user_name: "Babajide (Lead Pitmaster)"
  },
  {
    id: 2,
    product_id: 8,
    product_name: "FRESH CATFISH",
    sku: "RAW-CATFISH",
    unit: "PIECES",
    location: "Fish Prep Bay",
    movement_type: "consumption",
    quantity: -25,
    unit_cost: 2500,
    value_amount: -62500,
    balance_after: 0,
    notes: "Allocated to Production Batch BATCH-2026-003 (Charcoal Roasted Whole Catfish).",
    created_at: "2026-10-30 06:30:00",
    user_name: "Babajide (Lead Pitmaster)"
  },
  {
    id: 3,
    product_id: 5,
    product_name: "HARDWOOD CHARCOAL",
    sku: "RAW-CHARCOAL",
    unit: "BAG",
    location: "Wood Yard Store",
    movement_type: "consumption",
    quantity: -5,
    unit_cost: 6000,
    value_amount: -30000,
    balance_after: 25,
    notes: "Fuel consumption for daytime pit roasting and pre-heating smoker bays.",
    created_at: "2026-10-30 06:00:00",
    user_name: "Babajide (Lead Pitmaster)"
  }
]

export const SEED_RAW_USAGE: RawUsageItem[] = [
  {
    product_id: 62,
    product_name: "FRESH GUINEAFOWL",
    sku: "SKU-00028",
    unit: "PIECES",
    unit_cost: 5500,
    total_used: 320,
    total_value: 1760000
  },
  {
    product_id: 8,
    product_name: "FRESH CATFISH",
    sku: "RAW-CATFISH",
    unit: "PIECES",
    unit_cost: 2500,
    total_used: 180,
    total_value: 450000
  },
  {
    product_id: 5,
    product_name: "HARDWOOD CHARCOAL",
    sku: "RAW-CHARCOAL",
    unit: "BAG",
    unit_cost: 6000,
    total_used: 65,
    total_value: 390000
  },
  {
    product_id: 53,
    product_name: "DRY PEPPER",
    sku: "SKU-00019",
    unit: "KG",
    unit_cost: 1800,
    total_used: 85,
    total_value: 153000
  }
]

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

export const SEED_PACKAGING_RECEIPTS_TOTALS: PackagingReceiptTotal[] = [
  {
    product_id: 93,
    product_name: "BIG BRANDED BAG",
    sku: "PCK004",
    unit: "PIECES",
    total_qty: 500,
    avg_unit_cost: 420,
    total_value: 210000,
    receipt_count: 3,
    last_received: "2026-10-28 15:30:00"
  },
  {
    product_id: 96,
    product_name: "SMALL BRAND NYLON",
    sku: "PCK007",
    unit: "PIECES",
    total_qty: 2000,
    avg_unit_cost: 69,
    total_value: 138000,
    receipt_count: 2,
    last_received: "2026-10-27 10:15:00"
  },
  {
    product_id: 92,
    product_name: "SMALL BROWN BAG",
    sku: "PCK003",
    unit: "PIECES",
    total_qty: 400,
    avg_unit_cost: 300,
    total_value: 120000,
    receipt_count: 2,
    last_received: "2026-10-25 12:00:00"
  }
]

export const SEED_SALES_PRODUCTS: SalesProduct[] = [
  { id: 38, sku: "WEB-FULL-SMOKEY-GUINEAFOWL", name: "Full Smokey Guineafowl", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 6500, selling_price: 12500, stock_qty: 64, qty_allocated: 5, qty_available: 59, inventory_value: 416000, is_active: 1, estimated_incoming_qty: 40, sellable_qty: 99 },
  { id: 39, sku: "WEB-FULL-SMOKEY-GUINEAFOWL-CHOP", name: "Full Smokey Guineafowl (Chopped)", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 6500, selling_price: 12500, stock_qty: 28, qty_allocated: 2, qty_available: 26, inventory_value: 182000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 26 },
  { id: 44, sku: "WEB-1-LITER-BOWL-GUINEAFOWL", name: "1 Liter Bowl Guineafowl Rice", product_type: "sales", unit: "unit", reorder_level: 50, unit_cost: 9500, selling_price: 22000, stock_qty: 50, qty_allocated: 4, qty_available: 46, inventory_value: 475000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 46 },
  { id: 40, sku: "WEB-TRAVEL-STANDARD-DRY-GUIN", name: "Travel Standard Dry Guineafowl", product_type: "sales", unit: "unit", reorder_level: 25, unit_cost: 7000, selling_price: 13000, stock_qty: 42, qty_allocated: 0, qty_available: 42, inventory_value: 294000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 42 },
  { id: 48, sku: "WEB-SMOKEY-BEEF-JERKEY-KILISHI", name: "Smokey Beef Jerkey (Kilishi) 125g", product_type: "sales", unit: "unit", reorder_level: 30, unit_cost: 2500, selling_price: 5500, stock_qty: 85, qty_allocated: 4, qty_available: 81, inventory_value: 212500, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 81 },
  { id: 56, sku: "WEB-JUMBO-TURKEY-WINGS-PAIR", name: "Smokey Jumbo Turkey Wings (Pair)", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 7500, selling_price: 14500, stock_qty: 32, qty_allocated: 0, qty_available: 32, inventory_value: 240000, is_active: 1, estimated_incoming_qty: 30, sellable_qty: 62 },
  { id: 57, sku: "WEB-ROASTED-CATFISH-FAMILY", name: "Charcoal Roasted Whole Catfish (Family)", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 5000, selling_price: 11000, stock_qty: 24, qty_allocated: 0, qty_available: 24, inventory_value: 120000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 24 },
  { id: 60, sku: "WEB-PEPPERED-GIZZARD-SKEWERS", name: "Peppered Smoked Gizzard Skewers (5 pcs)", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 2200, selling_price: 5000, stock_qty: 45, qty_allocated: 0, qty_available: 45, inventory_value: 99000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 45 },
  { id: 51, sku: "WEB-UNDILUTED-PALMWINE-50CL", name: "Undiluted Palmwine (50cl)", product_type: "sales", unit: "unit", reorder_level: 40, unit_cost: 800, selling_price: 2000, stock_qty: 95, qty_allocated: 3, qty_available: 92, inventory_value: 76000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 92 },
  { id: 61, sku: "WEB-HIBISCUS-ZOBO-50CL", name: "Spiced Hibiscus Zobo Beverage (50cl)", product_type: "sales", unit: "unit", reorder_level: 35, unit_cost: 650, selling_price: 1800, stock_qty: 80, qty_allocated: 0, qty_available: 80, inventory_value: 52000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 80 },
  { id: 50, sku: "WEB-EXTRA-BAG", name: "Extra Branded Bag", product_type: "sales", unit: "unit", reorder_level: 50, unit_cost: 250, selling_price: 600, stock_qty: 170, qty_allocated: 1, qty_available: 169, inventory_value: 42500, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 169 },
  { id: 75, sku: "WEB-SMOKED-GOAT-ASUN-BOWL", name: "Smoked Goat Meat Asun (Chevon Bowl)", product_type: "sales", unit: "unit", reorder_level: 25, unit_cost: 7500, selling_price: 16000, stock_qty: 38, qty_allocated: 2, qty_available: 36, inventory_value: 285000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 36 },
  { id: 76, sku: "WEB-PEPPERED-SNAIL-PLANTAIN", name: "Peppered Jumbo Snail & Plantain Combo", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 9000, selling_price: 19500, stock_qty: 22, qty_allocated: 1, qty_available: 21, inventory_value: 198000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 21 },
  { id: 77, sku: "WEB-SMOKEY-BBQ-PLATTER", name: "Smokey Hut Feast BBQ Platter (Platter for 4)", product_type: "sales", unit: "unit", reorder_level: 10, unit_cost: 18000, selling_price: 42000, stock_qty: 18, qty_allocated: 2, qty_available: 16, inventory_value: 324000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 16 },
  { id: 78, sku: "WEB-GINGER-LEMONADE-50CL", name: "Craft Ginger Honey Lemonade (50cl)", product_type: "sales", unit: "unit", reorder_level: 30, unit_cost: 700, selling_price: 2000, stock_qty: 65, qty_allocated: 0, qty_available: 65, inventory_value: 45500, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 65 },
]

export const SEED_DAILY_SALES: DailySalesItem[] = [
  {
    product_id: 38,
    product_name: "Full Smokey Guineafowl",
    sku: "WEB-FULL-SMOKEY-GUINEAFOWL",
    unit: "unit",
    qty_sold: 42,
    sale_count: 36,
    order_count: 36,
    total_value: 525000,
    channel_breakdown: "Online Store (85%) • Counter (15%)"
  },
  {
    product_id: 44,
    product_name: "1 Liter Bowl Guineafowl Rice",
    sku: "WEB-1-LITER-BOWL-GUINEAFOWL",
    unit: "unit",
    qty_sold: 28,
    sale_count: 24,
    order_count: 24,
    total_value: 616000,
    channel_breakdown: "Online Store (90%) • Corporate Pre-orders (10%)"
  },
  {
    product_id: 48,
    product_name: "Smokey Beef Jerkey (Kilishi) 125g",
    sku: "WEB-SMOKEY-BEEF-JERKEY-KILISHI",
    unit: "unit",
    qty_sold: 35,
    sale_count: 31,
    order_count: 31,
    total_value: 192500,
    channel_breakdown: "Online Store (95%) • Counter (5%)"
  }
]

export const SEED_SALES_MOVEMENTS: SalesMovement[] = [
  {
    id: 1,
    product_id: 38,
    product_name: "Full Smokey Guineafowl",
    sku: "WEB-FULL-SMOKEY-GUINEAFOWL",
    unit: "unit",
    location: "sales",
    movement_type: "sale",
    quantity: -1,
    unit_cost: 6500,
    value_amount: -6500,
    balance_after: 59,
    notes: "Online order fulfillment for Order #SHD-10719 (Shamz Os).",
    created_at: "2026-10-30 13:45:00",
    user_name: "Sales Storefront API"
  },
  {
    id: 2,
    product_id: 39,
    product_name: "Full Smokey Guineafowl (Chopped)",
    sku: "WEB-FULL-SMOKEY-GUINEAFOWL-CHOP",
    unit: "unit",
    location: "sales",
    movement_type: "sale",
    quantity: -2,
    unit_cost: 6500,
    value_amount: -13000,
    balance_after: 26,
    notes: "Online order fulfillment for Order #SHD-10718 (Hafsat Makanju).",
    created_at: "2026-10-30 13:40:00",
    user_name: "Sales Storefront API"
  },
  {
    id: 3,
    product_id: 38,
    product_name: "Full Smokey Guineafowl",
    sku: "WEB-FULL-SMOKEY-GUINEAFOWL",
    unit: "unit",
    location: "sales",
    movement_type: "production_output",
    quantity: 40,
    unit_cost: 6500,
    value_amount: 260000,
    balance_after: 64,
    notes: "Production batch completed: Batch #BATCH-2026-001 (Signature Smoked Guineafowl).",
    created_at: "2026-10-30 09:30:00",
    user_name: "Babajide (Lead Pitmaster)"
  },
  {
    id: 4,
    product_id: 57,
    product_name: "Charcoal Roasted Whole Catfish (Family)",
    sku: "WEB-ROASTED-CATFISH-FAMILY",
    unit: "unit",
    location: "sales",
    movement_type: "production_output",
    quantity: 24,
    unit_cost: 5000,
    value_amount: 120000,
    balance_after: 24,
    notes: "Production batch completed: Batch #BATCH-2026-003 (Charcoal Roasted Whole Catfish).",
    created_at: "2026-10-30 09:45:00",
    user_name: "Babajide (Lead Pitmaster)"
  },
  {
    id: 5,
    product_id: 50,
    product_name: "Extra Branded Bag",
    sku: "WEB-EXTRA-BAG",
    unit: "unit",
    location: "sales",
    movement_type: "sale",
    quantity: -1,
    unit_cost: 250,
    value_amount: -250,
    balance_after: 169,
    notes: "Online order packaging addon for Order #SHD-10703 (Valentina Wisdom).",
    created_at: "2026-10-30 12:20:00",
    user_name: "Sales Storefront API"
  }
]

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

export const SEED_PACKAGING_QUEUE: PackagingQueueOrder[] = [
  {
    id: 10719,
    order_ref: "SHD-10719",
    customer_name: "Shamz Os",
    phone: "09065548268",
    address: "Victoria Crest Estate, Pinnock Beach Road, Osapa London",
    total_amount: 16200,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Full Smokey Guineafowl (chopped) × 1",
    items: [
      { product_name: "Full Smokey Guineafowl (chopped)", quantity: 1, unit_price: 12500, line_total: 12500 }
    ],
    created_at: "2026-10-30 13:43:55"
  },
  {
    id: 10718,
    order_ref: "SHD-10718",
    customer_name: "Hafsat Makanju",
    phone: "08033700127",
    address: "11 Fola Agoro Street, Shomolu",
    total_amount: 27700,
    delivery_fee: 2500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Full Smokey Guineafowl (chopped) × 2",
    items: [
      { product_name: "Full Smokey Guineafowl (chopped)", quantity: 2, unit_price: 12500, line_total: 25000 }
    ],
    packaging_materials_picked: [
      { packaging_name: "BIG BRANDED BAG", quantity: 1 },
      { packaging_name: "HEAVY DUTY FOIL WRAP", quantity: 2 }
    ],
    created_at: "2026-10-30 13:38:34"
  },
  {
    id: 10717,
    order_ref: "SHD-10717",
    customer_name: "Mercy Moses",
    phone: "08151819580",
    address: "35 Coker Road, Ilupeju",
    total_amount: 32700,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "KING SIZE SMOKEY GUINEAFOWL + GIZZARD × 1; Full Smokey Guineafowl × 1",
    items: [
      { product_name: "KING SIZE SMOKEY GUINEAFOWL + GIZZARD", quantity: 1, unit_price: 17000, line_total: 17000 },
      { product_name: "Full Smokey Guineafowl", quantity: 1, unit_price: 12500, line_total: 12500 }
    ],
    created_at: "2026-10-30 13:29:30"
  },
  {
    id: 10715,
    order_ref: "SHD-10715",
    customer_name: "Miracle Chioma",
    phone: "07034400542",
    address: "2 Abati George Street off Lawanson, Surulere",
    total_amount: 103200,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "in_packaging",
    items_summary: "Full Smokey Guineafowl × 8",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 8, unit_price: 12500, line_total: 100000 }
    ],
    packaging_materials_picked: [
      { packaging_name: "BIG BRANDED BAG", quantity: 3 },
      { packaging_name: "HEAVY DUTY FOIL WRAP", quantity: 8 }
    ],
    created_at: "2026-10-30 13:24:26"
  },
  {
    id: 10714,
    order_ref: "SHD-10714",
    customer_name: "Naomi Olasunkanmi",
    phone: "08157036862",
    address: "No 29 Alhaji Lambo Street, Ogudu",
    total_amount: 15200,
    delivery_fee: 3000,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "ready_for_fulfillment",
    items_summary: "Full Smokey Chicken (chopped) × 1",
    items: [
      { product_name: "Full Smokey Chicken (chopped)", quantity: 1, unit_price: 12000, line_total: 12000 }
    ],
    created_at: "2026-10-30 13:24:23"
  },
  {
    id: 10713,
    order_ref: "SHD-10713",
    customer_name: "Feyisayo Jackson",
    phone: "08025962521",
    address: "113 Huponu Wusu Street off Hakeem Dickson, Lekki Phase 1",
    total_amount: 22200,
    delivery_fee: 3500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Full Smokey Guineafowl × 1; Smokey Beef Jerkey (Kilishi) 125g × 1",
    items: [
      { product_name: "Full Smokey Guineafowl", quantity: 1, unit_price: 12500, line_total: 12500 },
      { product_name: "Smokey Beef Jerkey (Kilishi) 125g", quantity: 1, unit_price: 6000, line_total: 6000 }
    ],
    packaging_materials_picked: [
      { packaging_name: "BIG BRANDED BAG", quantity: 1 },
      { packaging_name: "BRANDED POLYBAG", quantity: 1 }
    ],
    packaged_at: "2026-10-30 13:35:00",
    packaged_by_name: "Bisi Akande (Packaging Lead)",
    created_at: "2026-10-30 13:22:34"
  },
  {
    id: 10710,
    order_ref: "SHD-10710",
    customer_name: "Bisola Larry",
    phone: "08169140041",
    address: "Plot 12 Funsho Williams Ave, Iponri, Ebute Metta",
    total_amount: 32700,
    delivery_fee: 2500,
    delivery_mode: "instant",
    payment_status: "paid",
    order_status: "packaged",
    items_summary: "Full Smokey Guineafowl (chopped) × 1; Full Smokey Chicken × 1; Zobo drink (6Bottle) × 1",
    items: [
      { product_name: "Full Smokey Guineafowl (chopped)", quantity: 1, unit_price: 12500, line_total: 12500 },
      { product_name: "Full Smokey Chicken", quantity: 1, unit_price: 12000, line_total: 12000 },
      { product_name: "Zobo drink(6Bottle)", quantity: 1, unit_price: 5500, line_total: 5500 }
    ],
    packaging_materials_picked: [
      { packaging_name: "BIG BRANDED BAG", quantity: 2 },
      { packaging_name: "BRANDED POLYBAG", quantity: 1 }
    ],
    packaged_at: "2026-10-30 13:25:00",
    packaged_by_name: "Bisi Akande (Packaging Lead)",
    created_at: "2026-10-30 13:08:06"
  }
]

export const SEED_PACKAGING_MATERIALS_DAILY: PackagingMaterialDaily[] = [
  { product_id: 93, product_name: "BIG BRANDED BAG", sku: "PCK004", unit: "PIECES", total_consumed: 28, total_orders: 22 },
  { product_id: 95, product_name: "BRANDED POLYBAG", sku: "PCK006", unit: "PCS", total_consumed: 36, total_orders: 30 },
  { product_id: 96, product_name: "1 LITER FOOD BOWL & LID", sku: "PCK007", unit: "SETS", total_consumed: 16, total_orders: 14 },
  { product_id: 97, product_name: "HEAVY DUTY FOIL WRAP", sku: "PCK008", unit: "SHEETS", total_consumed: 48, total_orders: 32 }
]

export const SEED_KITCHEN_TASKS: KitchenTask[] = [
  {
    id: 1,
    task_ref: "TASK-001",
    title: "Season & Marinate 50x Fresh Guineafowls (Batch 2026-004)",
    description: "Apply garlic, dry habanero pepper, ginger, and signature dry rub. Store in chiller for 4-hour cold cure.",
    assignee_name: "Babajide (Lead Pitmaster)",
    due_date: "Today 3:00 PM",
    priority: "high",
    status: "in_progress"
  },
  {
    id: 2,
    task_ref: "TASK-002",
    title: "Charcoal Pit Restock & Firewood Split",
    description: "Restock applewood and dry oak hardwood logs in Main Pit Bay 2 ahead of evening rush.",
    assignee_name: "Ibrahim Sanusi",
    due_date: "Today 2:30 PM",
    priority: "high",
    status: "in_progress"
  },
  {
    id: 3,
    task_ref: "TASK-003",
    title: "Clean & Butterfly 25x Fresh Catfish",
    description: "Wash with warm lime water, score flesh, and apply spiced suya oil marinade for afternoon smoke.",
    assignee_name: "Sunday Balogun",
    due_date: "Today 4:00 PM",
    priority: "normal",
    status: "in_progress"
  },
  {
    id: 4,
    task_ref: "TASK-004",
    title: "Simmer 40L Signature Herb Pepper Sauce",
    description: "Prep hot spicy dipping pepper sauce in 20L stock pots and bottle into 500ml squeeze containers.",
    assignee_name: "Chef Kemi",
    due_date: "Today 5:00 PM",
    priority: "normal",
    status: "pending"
  },
  {
    id: 5,
    task_ref: "TASK-005",
    title: "Morning Smoker Pit Ash Extraction",
    description: "Clear ash trays from overnight pit cycle, clean fire grates, and wipe ventilation hoods.",
    assignee_name: "Ibrahim Sanusi",
    due_date: "Today 8:00 AM",
    priority: "normal",
    status: "done"
  }
]

export const SEED_LOGISTICS_DELIVERIES: LogisticsDelivery[] = [
  {
    id: 10719,
    delivery_ref: "DEL-10719",
    order_id: 10719,
    order_ref: "SHD-10719",
    customer_name: "Shamz Os",
    phone: "09065548268",
    address: "Victoria Crest Estate, Pinnock Beach Road, Osapa London",
    delivery_fee: 3500,
    total_amount: 16200,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "",
    status: "pending",
    dispatch_date: "2026-10-30",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    items_summary: "Full Smokey Guineafowl (chopped) × 1"
  },
  {
    id: 10717,
    delivery_ref: "DEL-10717",
    order_id: 10717,
    order_ref: "SHD-10717",
    customer_name: "Mercy Moses",
    phone: "08151819580",
    address: "35 Coker Road, Ilupeju",
    delivery_fee: 3000,
    total_amount: 32700,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "",
    status: "pending",
    dispatch_date: "2026-10-30",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    items_summary: "KING SIZE SMOKEY GUINEAFOWL + GIZZARD × 1; Full Smokey Guineafowl × 1"
  },
  {
    id: 10714,
    delivery_ref: "DEL-10714",
    order_id: 10714,
    order_ref: "SHD-10714",
    customer_name: "Naomi Olasunkanmi",
    phone: "08157036862",
    address: "No 29 Alhaji Lambo Street, Ogudu",
    delivery_fee: 3000,
    total_amount: 15200,
    booked_fee: null,
    rider_type: "internal",
    assigned_rider: "",
    status: "pending",
    dispatch_date: "2026-10-30",
    pickup_at: null,
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    items_summary: "Full Smokey Chicken (chopped) × 1"
  },
  {
    id: 10713,
    delivery_ref: "DEL-10713",
    order_id: 10713,
    order_ref: "SHD-10713",
    customer_name: "Feyisayo Jackson",
    phone: "08025962521",
    address: "113 Huponu Wusu Street off Hakeem Dickson, Lekki Phase 1",
    delivery_fee: 3500,
    total_amount: 22200,
    booked_fee: 3500,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 453,
    status: "in_transit",
    dispatch_date: "2026-10-30",
    pickup_at: "2026-10-30 13:40:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    items_summary: "Full Smokey Guineafowl × 1; Smokey Beef Jerkey (Kilishi) 125g × 1"
  },
  {
    id: 10711,
    delivery_ref: "DEL-10711",
    order_id: 10711,
    order_ref: "SHD-10711",
    customer_name: "Korinjo Kashimana",
    phone: "07031284788",
    address: "No 51 Alhaji Usman Street, Agboyi Estate, Alapere Ketu",
    delivery_fee: 3500,
    total_amount: 34700,
    booked_fee: 3500,
    rider_type: "internal",
    assigned_rider: "RIDER ABU",
    assigned_rider_id: 459,
    status: "in_transit",
    dispatch_date: "2026-10-30",
    pickup_at: "2026-10-30 13:30:00",
    delivered_at: null,
    fee_verify_status: "none",
    payment_mode: "online",
    items_summary: "Full Smokey Guineafowl × 1; Full Smokey Guineafowl (chopped) × 1; Smokey Beef Jerkey 125g × 1"
  },
  {
    id: 10705,
    delivery_ref: "DEL-10705",
    order_id: 10705,
    order_ref: "SHD-10705",
    customer_name: "Augustina Edet",
    phone: "07080339717",
    address: "19b Dayo Adeleye Street, Lagoon Estate, Amuwo Odofin",
    delivery_fee: 4000,
    total_amount: 16700,
    booked_fee: 4500,
    rider_type: "third_party",
    assigned_rider: "InDrive Courier",
    third_party_provider: "InDrive Courier",
    status: "in_transit",
    dispatch_date: "2026-10-30",
    pickup_at: "2026-10-30 13:10:00",
    delivered_at: null,
    fee_verify_status: "pending",
    payment_mode: "online",
    items_summary: "Full Smokey Guineafowl (chopped) × 1"
  },
  {
    id: 10710,
    delivery_ref: "DEL-10710",
    order_id: 10710,
    order_ref: "SHD-10710",
    customer_name: "Bisola Larry",
    phone: "08169140041",
    address: "Plot 12 Funsho Williams Ave, Iponri, Ebute Metta",
    delivery_fee: 2500,
    total_amount: 32700,
    booked_fee: 2500,
    rider_type: "internal",
    assigned_rider: "RIDER YUSUF",
    assigned_rider_id: 453,
    status: "delivered",
    dispatch_date: "2026-10-30",
    pickup_at: "2026-10-30 13:20:00",
    delivered_at: "2026-10-30 13:48:00",
    fee_verify_status: "approved",
    payment_mode: "online",
    items_summary: "Full Smokey Guineafowl (chopped) × 1; Full Smokey Chicken × 1; Zobo drink (6Bottle) × 1"
  },
  {
    id: 10709,
    delivery_ref: "DEL-10709",
    order_id: 10709,
    order_ref: "SHD-10709",
    customer_name: "Omalicha Umeh",
    phone: "08022771081",
    address: "Broad Street, Lagos Island",
    delivery_fee: 3000,
    total_amount: 21700,
    booked_fee: 3000,
    rider_type: "internal",
    assigned_rider: "FRESH LOGISTICS",
    assigned_rider_id: 513,
    status: "delivered",
    dispatch_date: "2026-10-30",
    pickup_at: "2026-10-30 13:15:00",
    delivered_at: "2026-10-30 13:38:00",
    fee_verify_status: "approved",
    payment_mode: "online",
    items_summary: "Full Smokey Guineafowl (chopped) × 1; Smokey Beef Jerkey 125g × 1"
  }
]

export const SEED_SCHEDULED_ORDERS: ScheduledOrder[] = [
  {
    id: 10722,
    order_ref: "SHD-10722",
    customer_name: "Alhaji Tunde Sanusi",
    phone: "08033019283",
    address: "14B Admiralty Way, Lekki Phase 1",
    total_amount: 185000,
    delivery_fee: 5000,
    scheduled_delivery_at: "2026-10-31 13:00:00",
    payment_status: "paid",
    order_status: "payment_confirmed",
    notes: "Corporate Boardroom Feast. Pack individual cutlery sets and warm gravy bowls.",
    can_start_schedule: true
  },
  {
    id: 10723,
    order_ref: "SHD-10723",
    customer_name: "Dr. Ngozi Adebayo",
    phone: "08129845120",
    address: "Plot 8 Oba Akinjobi Way, Ikeja GRA",
    total_amount: 48000,
    delivery_fee: 4000,
    scheduled_delivery_at: "2026-10-31 14:30:00",
    payment_status: "paid",
    order_status: "payment_confirmed",
    notes: "Family Saturday Dinner. Please include extra spicy pepper sauce.",
    can_start_schedule: true
  },
  {
    id: 10724,
    order_ref: "SHD-10724",
    customer_name: "FCMB Operations Group",
    phone: "08091238475",
    address: "FCMB Plaza, 44 Marina, Lagos Island",
    total_amount: 237500,
    delivery_fee: 7500,
    scheduled_delivery_at: "2026-11-02 12:00:00",
    payment_status: "paid",
    order_status: "payment_confirmed",
    notes: "Monday Departmental Lunch: 25x 1-Liter Bowl Guineafowl Rice.",
    can_start_schedule: false
  }
]

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

export const SEED_RIDER_TASKS: RiderTask[] = [
  {
    id: 1,
    task_ref: "TSK-0012",
    title: "Collect COD Remittance Cash from Rider Yusuf",
    description: "Verify N42,500 collected from Osapa London & Ikoyi deliveries and reconcile with Main Cashier.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-30",
    priority: "urgent",
    status: "pending"
  },
  {
    id: 2,
    task_ref: "TSK-0013",
    title: "Mid-day Battery Swap & Fuel Top-up (Bike #3)",
    description: "Hub maintenance for delivery motorcycle running Lekki Expressway route.",
    assignee_name: "FRESH LOGISTICS",
    assignee_id: 513,
    due_date: "2026-10-30",
    priority: "normal",
    status: "done"
  },
  {
    id: 3,
    task_ref: "TSK-0014",
    title: "Pre-dispatch Thermal Bag Inspection",
    description: "Ensure all 4 hot-hold insulated bags are disinfected and ready for evening peak orders.",
    assignee_name: "RIDER YUSUF",
    assignee_id: 455,
    due_date: "2026-10-30",
    priority: "low",
    status: "in_progress"
  }
]

export const SEED_STORE_PICKUPS: StorePickupOrder[] = [
  {
    id: 10716,
    order_ref: "SHD-10716",
    customer_name: "Wale Aiyepe",
    phone: "08034567890",
    address: "Smokey Hut Central Counter (Storefront Pickup)",
    total_amount: 32500,
    payment_status: "paid",
    order_status: "ready_for_pickup",
    packaged_at: "2026-10-30 11:45:00",
    collected_at: null,
    collected_by: null,
    handover_staff: "Chioma Okon (Front Counter)",
    collector_phone: "08034567890",
    items_summary: "Full Smokey Guineafowl × 2; Smokey BBQ Sauce × 1"
  },
  {
    id: 10708,
    order_ref: "SHD-10708",
    customer_name: "Temitope Alabi",
    phone: "08145678901",
    address: "Smokey Hut Central Counter (Storefront Pickup)",
    total_amount: 22000,
    payment_status: "paid",
    order_status: "collected",
    packaged_at: "2026-10-30 10:15:00",
    collected_at: "2026-10-30 11:10:00",
    collected_by: "Temitope Alabi",
    handover_staff: "Chioma Okon (Front Counter)",
    collector_phone: "08145678901",
    items_summary: "1 Liter Bowl Guineafowl Rice × 1"
  },
  {
    id: 10698,
    order_ref: "SHD-10698",
    customer_name: "Emeka Obi",
    phone: "08056789012",
    address: "Smokey Hut Central Counter (Storefront Pickup)",
    total_amount: 48500,
    payment_status: "paid",
    order_status: "collected",
    packaged_at: "2026-10-29 16:30:00",
    collected_at: "2026-10-29 17:15:00",
    collected_by: "Chinedu (Driver)",
    handover_staff: "Chioma Okon (Front Counter)",
    collector_phone: "08056789012",
    items_summary: "Smokey Hut Feast BBQ Platter × 1; Craft Ginger Honey Lemonade × 2"
  }
]

export const SEED_THIRD_PARTY_SUMMARY: ThirdPartyWeeklySummary[] = [
  {
    week_start: "2026-10-27",
    week_end: "2026-10-30",
    label: "Week 44 (Current)",
    delivery_count: 38,
    order_fees: 152000,
    booked_fees: 148500,
    net: 3500,
    loss_count: 2,
    gain_count: 5,
    even_count: 31
  },
  {
    week_start: "2026-10-20",
    week_end: "2026-10-26",
    label: "Week 43",
    delivery_count: 64,
    order_fees: 256000,
    booked_fees: 252000,
    net: 4000,
    loss_count: 3,
    gain_count: 8,
    even_count: 53
  },
  {
    week_start: "2026-10-13",
    week_end: "2026-10-19",
    label: "Week 42",
    delivery_count: 58,
    order_fees: 232000,
    booked_fees: 235000,
    net: -3000,
    loss_count: 6,
    gain_count: 2,
    even_count: 50
  }
]

export interface WebsiteOrder {
  id: string | number
  order_ref: string
  customer_name: string
  customer_email?: string
  phone: string
  address: string
  items_summary: string
  raw_items?: any[]
  total_amount: number
  delivery_fee: number
  channel: string
  payment_status: 'paid' | 'pending' | 'refunded'
  payment_method?: string
  fulfillment_status: 'in_intake' | 'packaging' | 'ready_for_dispatch' | 'in_transit' | 'delivered'
  created_at: string
  scheduled_delivery_at: string
  paid_at?: string
  rider_name: string
  notes: string
}

export const SEED_WEBSITE_ORDERS: WebsiteOrder[] = [
  {
    "id": "SHD-10719",
    "order_ref": "SHD-10719",
    "customer_name": "Shamz \ud83c\udfbe Os",
    "customer_email": "shamillz2020@icloud.com",
    "phone": "09065548268",
    "address": "Victoria crest estate, pinnock beach road, Osapa, OSAPA LONDON",
    "items_summary": "1x Full Smokey Guineafowl (chopped)",
    "total_amount": 16200,
    "delivery_fee": 3500,
    "channel": "WhatsApp Store",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:43:55.936906+00:00",
    "scheduled_delivery_at": "2026-10-30T13:43:55.936906+00:00",
    "paid_at": "2026-10-30T13:44:49.435+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via WhatsApp Menu] Please I don\u2019t want it too dry at all.. let it juicy"
  },
  {
    "id": "SHD-10718",
    "order_ref": "SHD-10718",
    "customer_name": "Hafsat Makanju",
    "customer_email": "oluremim@yahoo.com",
    "phone": "08033700127",
    "address": "11 Fola Agoro Street, shomolu",
    "items_summary": "2x Full Smokey Guineafowl (chopped)",
    "total_amount": 27700,
    "delivery_fee": 2500,
    "channel": "WhatsApp",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:38:34.737181+00:00",
    "scheduled_delivery_at": "2026-10-30T13:38:34.737181+00:00",
    "paid_at": "2026-10-30T13:41:29.847+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website] [Source: WhatsApp | Medium: referral]"
  },
  {
    "id": "SHD-10717",
    "order_ref": "SHD-10717",
    "customer_name": "Mercy Moses",
    "customer_email": "mocymercy@gmail.com",
    "phone": "08151819580",
    "address": "35 Coker Road Ilupeju, Ilupeju",
    "items_summary": "1x KING SIZE SMOKEY GUINEAFOWL + GIZZARD + 1x Full Smokey Guineafowl",
    "total_amount": 32700,
    "delivery_fee": 3000,
    "channel": "Instagram Link",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:29:30.03592+00:00",
    "scheduled_delivery_at": "2026-10-30T13:29:30.03592+00:00",
    "paid_at": "2026-10-30T13:31:24.935+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website] [Source: Instagram Link | Medium: referral]"
  },
  {
    "id": "SHD-10716",
    "order_ref": "SHD-10716",
    "customer_name": "Wale Aiyepe",
    "customer_email": "sureboi2010@gmail.com",
    "phone": "08060392194",
    "address": "Store Pickup \u2014 Lagos Mainland HQ",
    "items_summary": "1x Full Smokey Guineafowl",
    "total_amount": 12700,
    "delivery_fee": 0,
    "channel": "WhatsApp Store",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:29:20.857911+00:00",
    "scheduled_delivery_at": "2026-10-30T13:29:20.857911+00:00",
    "paid_at": "2026-10-30T13:34:53.809+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via WhatsApp Menu] For wale"
  },
  {
    "id": "SHD-10715",
    "order_ref": "SHD-10715",
    "customer_name": "Miracle  Chioma",
    "customer_email": "maigbe25@gmail.com",
    "phone": "07034400542",
    "address": "2 abati George Street off lawanson bus stop, Surulere",
    "items_summary": "8x Full Smokey Guineafowl",
    "total_amount": 103200,
    "delivery_fee": 3000,
    "channel": "Instagram Link",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:24:26.183942+00:00",
    "scheduled_delivery_at": "2026-10-30T13:24:26.183942+00:00",
    "paid_at": "2026-10-30T13:25:31.849+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website] [Source: Instagram Link | Medium: referral] Please I want it cold\u2026."
  },
  {
    "id": "SHD-10714",
    "order_ref": "SHD-10714",
    "customer_name": "Naomi Olasunkanmi",
    "customer_email": "nojesutofunmi05@gmail.com",
    "phone": "08157036862",
    "address": "No 29 alhaji lambo street , Ogudu",
    "items_summary": "1x Full Smokey Chicken (chopped)",
    "total_amount": 15200,
    "delivery_fee": 3000,
    "channel": "Facebook",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:24:23.993159+00:00",
    "scheduled_delivery_at": "2026-10-30T13:24:23.993159+00:00",
    "paid_at": "2026-10-30T13:24:52.495+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website] [Source: Facebook | Medium: referral]"
  },
  {
    "id": "SHD-10713",
    "order_ref": "SHD-10713",
    "customer_name": "Feyisayo jackson",
    "customer_email": "drshayo007@gmail.com",
    "phone": "08025962521",
    "address": "113 huponu wusu street off Hakeem Dickson lekki phase 1, LEKKI",
    "items_summary": "1x Smokey Beef Jerkey (kilishi) 125g + 1x Full Smokey Guineafowl",
    "total_amount": 22200,
    "delivery_fee": 3500,
    "channel": "WhatsApp Store",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:22:34.589257+00:00",
    "scheduled_delivery_at": "2026-10-30T13:22:34.589257+00:00",
    "paid_at": "2026-10-30T13:37:25.609+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via WhatsApp Menu]"
  },
  {
    "id": "SHD-10711",
    "order_ref": "SHD-10711",
    "customer_name": "Korinjo  Kashimana",
    "customer_email": "korinjokashi@gmail.com",
    "phone": "07031284788",
    "address": "No 51 Alhaji Usman street, Agboyi estate alapere Ketu , Ketu",
    "items_summary": "1x Full Smokey Guineafowl + 1x Full Smokey Guineafowl (chopped) + 1x Smokey Beef Jerkey (kilishi) 125g",
    "total_amount": 34700,
    "delivery_fee": 3500,
    "channel": "Instagram Link",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:14:20.557482+00:00",
    "scheduled_delivery_at": "2026-10-30T13:14:20.557482+00:00",
    "paid_at": "2026-10-30T13:16:31.443+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website] [Source: Instagram Link | Medium: referral] Use first gate  Estate gate access ends  6pm "
  },
  {
    "id": "SHD-10710",
    "order_ref": "SHD-10710",
    "customer_name": "Bisola Larry",
    "customer_email": "oguntis@hotmail.com",
    "phone": "08169140041",
    "address": "Plot 12 Funsho Williams Ave, Iponri, Ebutemetta",
    "items_summary": "1x Full Smokey Guineafowl (chopped) + 1x Full Smokey Chicken + 1x Zobo drink(6Bottle)",
    "total_amount": 32700,
    "delivery_fee": 2500,
    "channel": "Instagram Link",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:08:06.256321+00:00",
    "scheduled_delivery_at": "2026-10-30T13:08:06.256321+00:00",
    "paid_at": "2026-10-30T13:10:07.475+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website] [Source: Instagram Link | Medium: referral]"
  },
  {
    "id": "SHD-10709",
    "order_ref": "SHD-10709",
    "customer_name": "Omalicha Umeh",
    "customer_email": "a.adaobiumeh@gmail.com",
    "phone": "08022771081",
    "address": "Broad , Lagos Island",
    "items_summary": "1x Full Smokey Guineafowl (chopped) + 1x Smokey Beef Jerkey (kilishi) 125g",
    "total_amount": 21700,
    "delivery_fee": 3000,
    "channel": "WhatsApp Store",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T13:07:13.55776+00:00",
    "scheduled_delivery_at": "2026-10-30T13:07:13.55776+00:00",
    "paid_at": "2026-10-30T13:08:35.239+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via WhatsApp Menu] Very dry"
  },
  {
    "id": "SHD-10707",
    "order_ref": "SHD-10707",
    "customer_name": "Nwokedinma  Eke",
    "customer_email": "ekeonemillion@yahoo.com",
    "phone": "07083819767",
    "address": "Eden Garden Estate, After Abraham Adesanya Roundabout. Beside Total filling station. , AJAH",
    "items_summary": "1x PARTY PACK",
    "total_amount": 122700,
    "delivery_fee": 4500,
    "channel": "WhatsApp Store",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T12:54:27.014153+00:00",
    "scheduled_delivery_at": "2026-10-30T12:54:27.014153+00:00",
    "paid_at": "2026-10-30T12:56:18.167+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via WhatsApp Menu]"
  },
  {
    "id": "SHD-10705",
    "order_ref": "SHD-10705",
    "customer_name": "Augustina  Edet",
    "customer_email": "tidet27@gmail.com",
    "phone": "07080339717",
    "address": "19b Dayo Adeleye street lagoon estate off shalom street amuwo odofin Lagos, Amuwo Odofin",
    "items_summary": "1x Full Smokey Guineafowl (chopped)",
    "total_amount": 16700,
    "delivery_fee": 4000,
    "channel": "WhatsApp Store",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T12:40:00.944404+00:00",
    "scheduled_delivery_at": "2026-10-30T12:40:00.944404+00:00",
    "paid_at": "2026-10-30T12:40:27.939+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via WhatsApp Menu]"
  },
  {
    "id": "SHD-10704",
    "order_ref": "SHD-10704",
    "customer_name": "Chidera  Michael",
    "customer_email": "mikedera4@gmail.com",
    "phone": "08102984564",
    "address": "No 26 akinmorin street okota, Okota",
    "items_summary": "1x KING SIZE SMOKEY GUINEAFOWL + GIZZARD",
    "total_amount": 21200,
    "delivery_fee": 4000,
    "channel": "WhatsApp Store",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T12:35:50.395431+00:00",
    "scheduled_delivery_at": "2026-10-30T12:35:50.395431+00:00",
    "paid_at": "2026-10-30T12:36:44.942+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via WhatsApp Menu]"
  },
  {
    "id": "SHD-10703",
    "order_ref": "SHD-10703",
    "customer_name": "Valentina Wisdom",
    "customer_email": "wisdomvalentina680@gmail.com",
    "phone": "07043398446",
    "address": "Olatunbosun furniture , Oshodi",
    "items_summary": "1x Full Smokey Guineafowl + 1x Extra Bag",
    "total_amount": 16800,
    "delivery_fee": 3500,
    "channel": "Website Storefront",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T12:15:56.745752+00:00",
    "scheduled_delivery_at": "2026-10-30T12:15:56.745752+00:00",
    "paid_at": "2026-10-30T12:17:40.204+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website]"
  },
  {
    "id": "SHD-10701",
    "order_ref": "SHD-10701",
    "customer_name": "Ibukun Oluwa",
    "customer_email": "babysjej@gmail.com",
    "phone": "09046379240",
    "address": "OluMide madariola st, AJAH",
    "items_summary": "1x Full Smokey Guineafowl",
    "total_amount": 17200,
    "delivery_fee": 4500,
    "channel": "WhatsApp",
    "payment_status": "paid",
    "payment_method": "paystack",
    "fulfillment_status": "packaging",
    "created_at": "2026-10-30T12:08:17.308111+00:00",
    "scheduled_delivery_at": "2026-10-30T12:08:17.308111+00:00",
    "paid_at": "2026-10-30T12:09:37.297+00:00",
    "rider_name": "Pending Rider",
    "notes": "[via Website] [Source: WhatsApp | Medium: referral] Seside estate baodre "
  }
]

