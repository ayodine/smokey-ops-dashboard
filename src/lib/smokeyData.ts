// Smokey Hut Food Processing OS (FP Enterprise) - Real Operational Data
// Extracted and mapped from /Users/ayobamiolowookere/Documents/Smartmba/data/api

export interface RawProduct {
  id: number
  sku: string
  name: string
  product_type: 'raw'
  unit: string
  reorder_level: number
  unit_cost: number // Weighted Average Cost (WAC)
  last_purchase_cost?: number // Most recent purchase unit cost from supplier
  cost_change_delta?: number // Difference between new WAC and previous cost
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
  invoice_ref?: string
  supplier_id: number
  supplier_name: string
  product_id: number
  product_name: string
  sku: string
  quantity: number
  unit: string
  unit_cost: number
  wac_after?: number
  value_amount: number
  date_received: string
  user_name: string
  notes?: string
  lot_number?: string
  expiry_date?: string
  category?: 'raw' | 'packaging'
}

export const CANONICAL_SUPPLIER_CATEGORIES = [
  { value: 'Fresh Poultry & Live Birds', label: 'Fresh Poultry & Live Birds (Guinea Fowl, Chicken, Turkey)' },
  { value: 'Market Goods & Spices', label: 'Market Goods & Spices (Peppers, Onions, Ginger, Garlic)' },
  { value: 'Firewood & Charcoal', label: 'Hardwood Firewood & Charcoal' },
  { value: 'Packaging & Printing Materials', label: 'Packaging & Printing Materials (Polybags, Boxes, Labels)' },
  { value: 'Cooking Oils & Kitchen Seasonings', label: 'Cooking Oils & Kitchen Seasonings' },
]

export interface RawMovement {
  id: number
  product_id: number
  product_name: string
  sku: string
  unit: string
  location: string
  movement_type: 'receipt' | 'consumption' | 'waste' | 'adjustment' | 'transfer'
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
  central_stock_qty: number // Stock stored in Central Store
  bench_stock_qty: number   // Active stock on Packaging Bench
  stock_qty: number         // Total On-Hand = central_stock_qty + bench_stock_qty
  qty_allocated: number     // Reserved for packaging queue orders
  qty_available: number     // stock_qty - qty_allocated
  inventory_value: number
  is_active: number
}

export interface PackagingReconciliationItem {
  product_id: number
  product_name: string
  sku: string
  unit: string
  opening_bench_stock: number
  issued_from_central: number
  used_for_orders: number
  returned_to_central: number
  damaged_wasted: number
  expected_bench_stock: number // opening + issued - used - returned - damaged
  actual_closing_bench: number
  variance: number // actual_closing_bench - expected_bench_stock (0 = balanced)
  status: 'balanced' | 'discrepancy' | 'pending'
}

export interface PackagingDailyReconciliation {
  id: number
  recon_ref: string
  date: string // YYYY-MM-DD
  status: 'balanced' | 'discrepancy' | 'open'
  items: PackagingReconciliationItem[]
  total_issued_qty: number
  total_used_qty: number
  total_returned_qty: number
  total_damaged_qty: number
  total_variance_qty: number
  reconciled_by: string
  reconciled_at?: string
  notes?: string
}

export interface IntermediatePrepAllocation {
  id: string
  batch_id?: number
  batch_ref: string
  target_product_name: string
  allocated_qty: number
  allocated_at: string
  allocated_by: string
  unit_cost?: number
  total_cost?: number
}

export interface CompoundPreparationLot {
  lot_number: string // e.g. "LOT-PRP-00042"
  prep_ref: string // "PRP-00042"
  prep_id: number
  prepared_by: string
  prepared_at: string
  initial_yield_qty: number
  remaining_qty: number
  unit_cost: number
  total_cost: number
  expiry_date: string
  source_ingredients: Array<{
    product_id: number
    product_name: string
    quantity: number
    unit: string
    unit_cost: number
    line_cost: number
  }>
}

export interface CompoundUsageAllocation {
  id: string
  batch_id?: number
  batch_ref: string
  target_product_name: string
  quantity: number
  unit_cost_at_issue: number
  total_cost: number
  issued_at: string
  issued_by: string
  source_prep_ref?: string
}

export interface CompoundSurplusReturn {
  id: string
  batch_id?: number
  batch_ref: string
  quantity: number
  unit_cost: number
  total_credited: number
  returned_at: string
  returned_by: string
  notes?: string
}

export interface CompoundInventoryItem {
  id: number
  sku: string // e.g. "CPD-0001"
  name: string // e.g. "Guinea Fowl Seasoning Blend"
  unit: string // "kg", "L"
  unit_cost: number // Prevailing Weighted Average Cost (WAC)
  stock_qty: number // Total Available in Central Store
  inventory_value: number // stock_qty * unit_cost
  is_active: number
  reorder_level?: number
  active_lot_ref?: string
  preparation_lots: CompoundPreparationLot[]
  allocations: CompoundUsageAllocation[]
  surplus_returns: CompoundSurplusReturn[]
}

export interface IntermediatePrep {
  id: number
  prep_ref: string // e.g. "PRP-042"
  recipe_name: string // e.g. "Signature Pepper Mix & Marinade"
  unit: string // "kg", "L"
  initial_yield_qty: number
  remaining_qty: number
  returned_to_hub_qty: number
  status: 'active' | 'exhausted' | 'returned_to_hub'
  prepared_by: string
  created_at: string
  source_ingredients: Array<{ product_id: number; product_name: string; quantity: number; unit: string; unit_cost?: number; line_cost?: number }>
  allocations: IntermediatePrepAllocation[]
  return_notes?: string
  returned_at?: string
  returned_by?: string
  hub_lot_id?: number
  total_cost?: number
  unit_cost?: number
  compound_id?: number
  expiry_date?: string
}

export interface InterStationTransfer {
  id: number
  transfer_ref: string
  from_station: 'central_warehouse' | 'packaging_bench' | 'production_floor'
  to_station: 'central_warehouse' | 'packaging_bench' | 'production_floor'
  transfer_type: 'issue_packaging' | 'return_packaging' | 'issue_raw_for_prep' | 'return_prep_to_hub' | 'direct_batch_issue'
  items: Array<{ product_id: number; product_name: string; quantity: number; unit: string }>
  notes: string
  authorized_by: string
  created_at: string
  status: 'completed' | 'cancelled'
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
  // Two-Tier Inventory Pipeline (Active/Scheduled Smoking Grill Batches Buffer)
  estimated_incoming_qty?: number // Quantity currently on smoking grills or scheduled next-day
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
  location: 'sales' | 'finished' | 'packaging'
  movement_type: 'receipt' | 'consumption' | 'production_output' | 'sale' | 'adjustment' | 'waste' | 'reversal'
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
  unit_cost?: number
  total_cost?: number
  source?: 'initial' | 'additional' | 'compound'
  item_type?: 'raw' | 'compound'
  prep_ref?: string
  compound_id?: number
  requisition_ref?: string
  returned_qty?: number
}

export interface BatchMaterialRequisition {
  id: string // e.g. "REQ-BAT-00012-01"
  batch_id: number
  batch_ref: string
  output_product_name: string
  raw_product_id: number
  raw_product_name: string
  sku: string
  unit: string
  requested_qty: number
  fulfilled_qty?: number
  unit_cost_at_issue?: number
  total_cost?: number
  reason: string
  requested_by: string
  requested_at: string
  status: 'pending' | 'approved' | 'partially_fulfilled' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
  warehouse_notes?: string
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
  created_at?: string
  raw_materials: RawMaterialBOM[]
  recipe_template_id?: number
  variance_pct?: number
  supervisor_override_note?: string
  additional_requisitions?: BatchMaterialRequisition[]
  initial_material_cost?: number
  additional_material_cost?: number
  total_material_cost?: number
  unit_cost_per_portion?: number
  returned_materials?: Array<{
    product_id: number
    name: string
    quantity: number
    unit: string
    value_credited: number
    item_type?: 'raw' | 'compound'
    compound_id?: number
  }>
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
  items_summary?: string
  items?: Array<{ product_name: string; quantity: number; unit_price: number; line_total: number }>
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
  net_balance: number // pending_payout
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
  delayed_deliveries?: number
  declined_dispatches?: number
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
    { packaging_name: "YAJI SACHET", quantity: 1 }
  ],
  "Full Smokey Chicken": [
    { packaging_name: "BRANDED POLYBAG", quantity: 1 },
    { packaging_name: "YAJI SACHET", quantity: 1 }
  ],
  "KING SIZE SMOKEY GUINEAFOWL": [
    { packaging_name: "BRANDED POLYBAG", quantity: 1 },
    { packaging_name: "YAJI SACHET", quantity: 1 }
  ],
  "Travel standard Dry Guineafowl": [
    { packaging_name: "SIZE 12 NYLON", quantity: 1 },
    { packaging_name: "BIG BRANDED BAG", quantity: 1 }
  ],
  "Travel Standard Dry Guineafowl": [
    { packaging_name: "SIZE 12 NYLON", quantity: 1 },
    { packaging_name: "BIG BRANDED BAG", quantity: 1 }
  ],
  "Smokey Beef Jerkey": [
    { packaging_name: "SMALL BRAND NYLON", quantity: 1 },
    { packaging_name: "YAJI SACHET", quantity: 1 }
  ],
  "Smokey Jumbo Turkey Wings": [
    { packaging_name: "MEDIUM POLY BAG", quantity: 1 },
    { packaging_name: "YAJI SACHET", quantity: 1 }
  ],
  "Charcoal Roasted Whole Catfish": [
    { packaging_name: "BIGGEST BRANDED NYLON", quantity: 1 }
  ],
  "Undiluted Palmwine": [
    { packaging_name: "SMALL BROWN BAG", quantity: 1 }
  ],
  "Zobo drink": [
    { packaging_name: "SMALL BROWN BAG", quantity: 1 }
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
      aggregated["YAJI SACHET"] = (aggregated["YAJI SACHET"] || 0) + item.quantity
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
    output_product_id: 7,
    output_product_name: "Full Smokey Guineafowl",
    version_name: "Signature Smoking Grill Run (Batch 50)",
    standard_batch_size: 50,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES", standard_qty_per_unit: 0.02, unit: "PACK" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.08, unit: "Bundle" },
    ]
  },
  {
    id: 2,
    output_product_id: 1,
    output_product_name: "1 Liter Bowl Guineafowl Rice",
    version_name: "Kitchen Jollof Broth Run (Batch 40)",
    standard_batch_size: 40,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", standard_qty_per_unit: 0.5, unit: "PIECES" },
      { raw_product_id: 106, sku: "SKU-00054", name: "LONG GRAIN RICE (BAG)", standard_qty_per_unit: 0.05, unit: "BAG" },
      { raw_product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", standard_qty_per_unit: 0.075, unit: "LITRE" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES", standard_qty_per_unit: 0.0375, unit: "PACK" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.05, unit: "Bundle" },
    ]
  },
  {
    id: 3,
    output_product_id: 9,
    output_product_name: "Full Smokey Chicken",
    version_name: "Spicy Smokey Chicken Run (Batch 30)",
    standard_batch_size: 30,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES", standard_qty_per_unit: 0.02, unit: "PACK" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.08, unit: "Bundle" },
    ]
  },
  {
    id: 4,
    output_product_id: 8,
    output_product_name: "Full Smokey Chicken (chopped)",
    version_name: "Chopped Smokey Chicken Prep (Batch 30)",
    standard_batch_size: 30,
    standard_yield_percent: 98,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", standard_qty_per_unit: 0.02, unit: "LITRE" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.08, unit: "Bundle" },
    ]
  },
  {
    id: 5,
    output_product_id: 11,
    output_product_name: "Smokey Beef Jerkey (kilishi) 125g",
    version_name: "Traditional Sun-Cured & Light-Smoked Kilishi (Batch 30)",
    standard_batch_size: 30,
    standard_yield_percent: 95,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 105, sku: "SKU-00053", name: "BEEF CUTS FOR KILISHI", standard_qty_per_unit: 0.667, unit: "KG" },
      { raw_product_id: 82, sku: "SKU-00048", name: "YAJI PEPPER (567)", standard_qty_per_unit: 0.08, unit: "KG" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.033, unit: "Bundle" },
    ]
  },
  {
    id: 7,
    output_product_id: 12,
    output_product_name: "Smokey Gizzard",
    version_name: "Peppered Smoked Gizzard Run (Batch 30)",
    standard_batch_size: 30,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 63, sku: "SKU-00029", name: "FRESH CHICKEN", standard_qty_per_unit: 0.4, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.05, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES", standard_qty_per_unit: 0.02, unit: "PACK" },
      { raw_product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", standard_qty_per_unit: 0.03, unit: "LITRE" },
    ]
  },
  {
    id: 8,
    output_product_id: 5,
    output_product_name: "Travel standard Dry Guineafowl",
    version_name: "Extended Smoke Dry Preservation (Batch 40)",
    standard_batch_size: 40,
    standard_yield_percent: 88,
    unit: "unit",
    allowed_variance_pct: 4.0,
    ingredients: [
      { raw_product_id: 62, sku: "SKU-00028", name: "FRESH GUINEAFOWL", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.07, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES", standard_qty_per_unit: 0.025, unit: "PACK" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.1, unit: "Bundle" },
    ]
  },
  {
    id: 9,
    output_product_id: 24,
    output_product_name: "KING SIZE SMOKEY GUINEAFOWL + GIZZARD",
    version_name: "King-Size Smoked Guineafowl Run (Batch 20)",
    standard_batch_size: 20,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 3.0,
    ingredients: [
      { raw_product_id: 65, sku: "SKU-00031", name: "FRESH KING-SIZE GUINEAFOWL", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.06, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES", standard_qty_per_unit: 0.03, unit: "PACK" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.08, unit: "Bundle" },
    ]
  },
  {
    id: 11,
    output_product_id: 33,
    output_product_name: "Zobo drink(6Bottle)",
    version_name: "Slow-Brewed Spiced Zobo Bottling (Batch 10 Packs / 60 Bottles)",
    standard_batch_size: 10,
    standard_yield_percent: 100,
    unit: "pack",
    allowed_variance_pct: 2.0,
    ingredients: [
      { raw_product_id: 107, sku: "SKU-00055", name: "ZOBO (HIBISCUS) LEAVES", standard_qty_per_unit: 0.3, unit: "KG" },
      { raw_product_id: 67, sku: "SKU-00033", name: "ZOBO BOTTLE", standard_qty_per_unit: 6.0, unit: "PIECES" },
      { raw_product_id: 70, sku: "SKU-00036", name: "ZOBO STICKER", standard_qty_per_unit: 6.0, unit: "PIECES" },
      { raw_product_id: 68, sku: "SKU-00034", name: "CINNAMON STICK", standard_qty_per_unit: 0.12, unit: "PACK" },
      { raw_product_id: 69, sku: "SKU-00035", name: "CLOVE", standard_qty_per_unit: 0.09, unit: "CUP" },
    ]
  },
  {
    id: 12,
    output_product_id: 10,
    output_product_name: "Full Smokey Guineafowl (chopped)",
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
  },
  {
    id: 13,
    output_product_id: 6,
    output_product_name: "Full Grill Rabbit",
    version_name: "Smoking Grill Rabbit Run (Batch 20)",
    standard_batch_size: 20,
    standard_yield_percent: 100,
    unit: "unit",
    allowed_variance_pct: 5.0,
    ingredients: [
      { raw_product_id: 64, sku: "SKU-00030", name: "FRESH RABBIT", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 53, sku: "SKU-00019", name: "DRY PEPPER", standard_qty_per_unit: 0.06, unit: "KG" },
      { raw_product_id: 54, sku: "SKU-00020", name: "SPICIES", standard_qty_per_unit: 0.03, unit: "PACK" },
      { raw_product_id: 55, sku: "SKU-00021", name: "VEGETABLE OIL", standard_qty_per_unit: 0.04, unit: "LITRE" },
      { raw_product_id: 52, sku: "SKU-00018", name: "FIREWOOD", standard_qty_per_unit: 0.08, unit: "Bundle" },
    ]
  },
  {
    id: 14,
    output_product_id: 13,
    output_product_name: "Undiluted Palmwine (50cl)",
    version_name: "Cold-Chilled Palmwine Bottling (Batch 50)",
    standard_batch_size: 50,
    standard_yield_percent: 100,
    unit: "bottle",
    allowed_variance_pct: 2.0,
    ingredients: [
      { raw_product_id: 103, sku: "PMW25", name: "PALMWINE 25LITRE", standard_qty_per_unit: 0.5, unit: "litre" },
      { raw_product_id: 66, sku: "SKU-00032", name: "PALMWINE BOTTLE", standard_qty_per_unit: 1.0, unit: "PIECES" },
      { raw_product_id: 71, sku: "SKU-00037", name: "PALMWINE STICKER", standard_qty_per_unit: 1.0, unit: "PIECES" },
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
  },
  {
    "id": 104,
    "sku": "SKU-00052",
    "name": "FRESH GUINEAFOWL EGGS (CRATE)",
    "product_type": "raw",
    "unit": "CRATE",
    "reorder_level": 20,
    "unit_cost": 3500,
    "stock_qty": 45,
    "qty_allocated": 0,
    "qty_available": 45,
    "qty_quarantine": 0,
    "inventory_value": 157500,
    "is_active": 1
  },
  {
    "id": 105,
    "sku": "SKU-00053",
    "name": "BEEF CUTS FOR KILISHI",
    "product_type": "raw",
    "unit": "KG",
    "reorder_level": 15,
    "unit_cost": 6500,
    "stock_qty": 25,
    "qty_allocated": 0,
    "qty_available": 25,
    "qty_quarantine": 0,
    "inventory_value": 162500,
    "is_active": 1
  },
  {
    "id": 106,
    "sku": "SKU-00054",
    "name": "LONG GRAIN RICE (BAG)",
    "product_type": "raw",
    "unit": "BAG",
    "reorder_level": 5,
    "unit_cost": 42000,
    "stock_qty": 8,
    "qty_allocated": 0,
    "qty_available": 8,
    "qty_quarantine": 0,
    "inventory_value": 336000,
    "is_active": 1
  },
  {
    "id": 107,
    "sku": "SKU-00055",
    "name": "ZOBO (HIBISCUS) LEAVES",
    "product_type": "raw",
    "unit": "KG",
    "reorder_level": 10,
    "unit_cost": 2500,
    "stock_qty": 18,
    "qty_allocated": 0,
    "qty_available": 18,
    "qty_quarantine": 0,
    "inventory_value": 45000,
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
    "central_stock_qty": 88,
    "bench_stock_qty": 20,
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
    "central_stock_qty": 107,
    "bench_stock_qty": 30,
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
    "central_stock_qty": 451,
    "bench_stock_qty": 100,
    "stock_qty": 551,
    "qty_allocated": 0,
    "qty_available": 551,
    "inventory_value": 57855,
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
    "central_stock_qty": 90,
    "bench_stock_qty": 25,
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
    "central_stock_qty": 48,
    "bench_stock_qty": 20,
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
    "central_stock_qty": 65,
    "bench_stock_qty": 20,
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
    "central_stock_qty": 38,
    "bench_stock_qty": 15,
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
    "central_stock_qty": 1135,
    "bench_stock_qty": 200,
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
    "central_stock_qty": 127,
    "bench_stock_qty": 30,
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
    "central_stock_qty": 693,
    "bench_stock_qty": 100,
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
    "central_stock_qty": 57,
    "bench_stock_qty": 25,
    "stock_qty": 82,
    "qty_allocated": 0,
    "qty_available": 82,
    "inventory_value": 8200,
    "is_active": 1
  }
]

export const SEED_PACKAGING_RECEIPTS_TOTALS: PackagingReceiptTotal[] = []

export const SEED_PACKAGING_RECONCILIATIONS: PackagingDailyReconciliation[] = []

export const SEED_INTERMEDIATE_PREPS: IntermediatePrep[] = []

export const SEED_COMPOUND_INVENTORY: CompoundInventoryItem[] = []

export const SEED_INTER_STATION_TRANSFERS: InterStationTransfer[] = []

export const SEED_SALES_PRODUCTS: SalesProduct[] = [
  { id: 7, sku: "WEB-PROD-7", name: "Full Smokey Guineafowl", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 6500, selling_price: 12500, stock_qty: 69, qty_allocated: 0, qty_available: 69, inventory_value: 448500, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 69 },
  { id: 10, sku: "WEB-PROD-10", name: "Full Smokey Guineafowl (chopped)", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 6500, selling_price: 12500, stock_qty: 42, qty_allocated: 0, qty_available: 42, inventory_value: 273000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 42 },
  { id: 1, sku: "WEB-PROD-1", name: "1 Liter Bowl Guineafowl Rice", product_type: "sales", unit: "unit", reorder_level: 30, unit_cost: 9500, selling_price: 20000, stock_qty: 50, qty_allocated: 0, qty_available: 50, inventory_value: 475000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 50 },
  { id: 5, sku: "WEB-PROD-5", name: "Travel standard Dry Guineafowl", product_type: "sales", unit: "unit", reorder_level: 25, unit_cost: 7000, selling_price: 13000, stock_qty: 86, qty_allocated: 0, qty_available: 86, inventory_value: 602000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 86 },
  { id: 9, sku: "WEB-PROD-9", name: "Full Smokey Chicken", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 6000, selling_price: 12000, stock_qty: 96, qty_allocated: 0, qty_available: 96, inventory_value: 576000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 96 },
  { id: 8, sku: "WEB-PROD-8", name: "Full Smokey Chicken (chopped)", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 6000, selling_price: 12000, stock_qty: 94, qty_allocated: 0, qty_available: 94, inventory_value: 564000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 94 },
  { id: 11, sku: "WEB-PROD-11", name: "Smokey Beef Jerkey (kilishi) 125g", product_type: "sales", unit: "unit", reorder_level: 30, unit_cost: 2500, selling_price: 6000, stock_qty: 66, qty_allocated: 0, qty_available: 66, inventory_value: 165000, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 66 },
  { id: 12, sku: "WEB-PROD-12", name: "Smokey Gizzard", product_type: "sales", unit: "unit", reorder_level: 20, unit_cost: 2200, selling_price: 4500, stock_qty: 87, qty_allocated: 0, qty_available: 87, inventory_value: 191400, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 87 },
  { id: 24, sku: "WEB-PROD-24", name: "KING SIZE SMOKEY GUINEAFOWL + GIZZARD", product_type: "sales", unit: "unit", reorder_level: 15, unit_cost: 8500, selling_price: 17000, stock_qty: 77, qty_allocated: 0, qty_available: 77, inventory_value: 654500, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 77 },
  { id: 13, sku: "WEB-PROD-13", name: "Undiluted Palmwine (50cl)", product_type: "sales", unit: "bottle", reorder_level: 40, unit_cost: 800, selling_price: 2000, stock_qty: 97, qty_allocated: 0, qty_available: 97, inventory_value: 77600, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 97 },
  { id: 33, sku: "WEB-PROD-33", name: "Zobo drink(6Bottle)", product_type: "sales", unit: "pack", reorder_level: 20, unit_cost: 2500, selling_price: 5500, stock_qty: 67, qty_allocated: 0, qty_available: 67, inventory_value: 167500, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 67 },
  { id: 6, sku: "WEB-PROD-6", name: "Full Grill Rabbit", product_type: "sales", unit: "unit", reorder_level: 10, unit_cost: 9000, selling_price: 22000, stock_qty: 0, qty_allocated: 0, qty_available: 0, inventory_value: 0, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 0 },
  { id: 2, sku: "WEB-PROD-2", name: "Extra Bag", product_type: "sales", unit: "unit", reorder_level: 50, unit_cost: 250, selling_price: 600, stock_qty: 166, qty_allocated: 0, qty_available: 166, inventory_value: 41500, is_active: 1, estimated_incoming_qty: 0, sellable_qty: 166 }
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
    "category": "Firewood & Charcoal",
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

export const SEED_PRODUCTION_BATCHES: ProductionBatch[] = []

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

export const SEED_WEBSITE_ORDERS: WebsiteOrder[] = []

