export type StockStatus = 
  | 'IN_STOCK' 
  | 'LOW_STOCK' 
  | 'OUT_OF_STOCK' 
  | 'INCOMING' 
  | 'RESERVED' 
  | 'QUARANTINED' 
  | 'RECONCILIATION_REQUIRED';

export type MovementType = 
  | 'RECEIPT' 
  | 'PRODUCTION_ISSUE' 
  | 'PRODUCTION_RETURN' 
  | 'FINISHED_GOODS_RECEIPT' 
  | 'DISPATCH' 
  | 'TRANSFER_OUT' 
  | 'TRANSFER_IN' 
  | 'CYCLE_COUNT_ADJUST' 
  | 'DAMAGED_WRITE_OFF';

export interface ProductSKU {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  category: 'raw_material' | 'consumable' | 'finished_good' | 'packaging';
  uom: 'kg' | 'grams' | 'litres' | 'units' | 'packs' | 'crates';
  unit_cost: number;
  retail_price: number;
  stock_on_hand: number;
  reserved_stock: number;
  available_stock: number;
  reorder_threshold: number;
  target_stock: number;
  warehouse_name: string;
  bin_location: string;
  status: StockStatus;
  is_active: boolean;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  item_sku: string;
  item_name: string;
  type: MovementType;
  quantity_delta: number;
  uom: string;
  warehouse_name: string;
  reference_id: string;
  reason_code: string;
  note?: string;
  created_by: string;
  created_at: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  type: 'central_kitchen' | 'warehouse' | 'retail_hub' | 'cold_storage';
  total_skus: number;
  capacity_utilization: number;
  manager_name: string;
  contact_phone: string;
  is_active: boolean;
}

export interface PurchaseOrderItem {
  id: string;
  sku: string;
  name: string;
  quantity_ordered: number;
  quantity_received: number;
  uom: string;
  unit_price: number;
  total_price: number;
}

export type POStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  supplier_email: string;
  order_date: string;
  expected_delivery: string;
  total_amount: number;
  status: POStatus;
  items_count: number;
  warehouse_name: string;
  items: PurchaseOrderItem[];
  notes?: string;
}
