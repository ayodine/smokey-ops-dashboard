export type LogisticsStatus = 
  | 'DRAFT' 
  | 'READY_FOR_PICKING' 
  | 'PICKING' 
  | 'PACKED' 
  | 'READY_FOR_DISPATCH' 
  | 'DISPATCHED' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'CLOSED' 
  | 'ON_HOLD' 
  | 'DELAYED' 
  | 'DELIVERY_FAILED' 
  | 'RETURNED_TO_HUB' 
  | 'CANCELLED';

export interface DispatchItem {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_zone: string;
  items_summary: string;
  package_count: number;
  weight_kg: number;
  assigned_carrier_name?: string;
  assigned_rider_name?: string;
  dispatch_deadline: string;
  urgency: 'STANDARD' | 'PRIORITY' | 'EXPRESS';
  status: 'AWAITING_PICK' | 'PICKED' | 'PACKED' | 'DISPATCHED';
}

export interface TrackingEvent {
  id: string;
  timestamp: string;
  title: string;
  location: string;
  description: string;
  operator_name: string;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  order_reference: string;
  origin_facility: string;
  destination_address: string;
  destination_zone: string;
  customer_name: string;
  customer_phone: string;
  carrier_name: string;
  rider_name: string;
  rider_phone: string;
  status: LogisticsStatus;
  dispatched_at: string;
  estimated_delivery: string;
  delivered_at?: string;
  package_count: number;
  total_weight_kg: number;
  proof_of_delivery_url?: string;
  recipient_name?: string;
  events: TrackingEvent[];
}

export interface ReturnOrder {
  id: string;
  return_code: string;
  order_reference: string;
  customer_name: string;
  item_name: string;
  quantity: number;
  uom: string;
  return_reason: 'WRONG_ITEM' | 'DAMAGED_IN_TRANSIT' | 'CUSTOMER_CANCELLED' | 'QUALITY_ISSUE' | 'EXPIRED';
  condition: 'UNOPENED' | 'DAMAGED' | 'PERISHED' | 'DEFECTIVE';
  disposition: 'PENDING_INSPECTION' | 'RESTOCKED' | 'QUARANTINED' | 'SCRAPPED_WRITE_OFF';
  refund_status: 'NOT_REQUIRED' | 'PENDING' | 'PROCESSED';
  created_at: string;
  inspected_at?: string;
  inspector_name?: string;
  notes?: string;
}
