export type ProductionStatus = 
  | 'DRAFT' 
  | 'PLANNED' 
  | 'MATERIALS_RESERVED' 
  | 'READY_TO_PRODUCE' 
  | 'IN_PRODUCTION' 
  | 'QUALITY_CHECK' 
  | 'COMPLETED' 
  | 'CLOSED' 
  | 'ON_HOLD' 
  | 'CANCELLED';

export interface BOMComponent {
  id: string;
  bom_id: string;
  raw_material_sku: string;
  raw_material_name: string;
  required_quantity: number;
  uom: string;
  unit_cost: number;
  allow_substitution: boolean;
  substitute_sku?: string;
  scrap_allowance_percent: number;
}

export interface BillOfMaterials {
  id: string;
  bom_code: string;
  finished_product_sku: string;
  finished_product_name: string;
  version: string;
  standard_batch_size: number;
  uom: string;
  standard_yield_percent: number;
  total_batch_cost: number;
  unit_cost: number;
  is_active: boolean;
  components: BOMComponent[];
  notes?: string;
  last_modified: string;
}

export interface ProductionOrder {
  id: string;
  order_code: string;
  bom_id: string;
  finished_product_sku: string;
  finished_product_name: string;
  planned_quantity: number;
  actual_quantity_produced: number;
  scrap_quantity: number;
  uom: string;
  work_center: string;
  assigned_operator_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: ProductionStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
  created_at: string;
}

export interface QualityInspection {
  id: string;
  inspection_code: string;
  production_order_code: string;
  item_name: string;
  inspector_name: string;
  inspected_at: string;
  core_temperature_celsius: number;
  weight_check_grams: number;
  visual_inspection_passed: boolean;
  taste_aroma_passed: boolean;
  packaging_seal_intact: boolean;
  status: 'PASSED' | 'FAILED' | 'CONDITIONAL_APPROVAL';
  defects_found: number;
  defect_reason?: string;
  notes?: string;
}
