import React, { useState } from 'react';
import { LogisticsDelivery } from '@/lib/smokeyData';
import { formatNaira } from '@/lib/utils';
import {
  Phone,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Package,
  Check,
  XCircle,
} from 'lucide-react';

interface RiderDeliveryMobileCardProps {
  order: LogisticsDelivery;
  tab: 'assigned' | 'in_transit' | 'delivered';
  onAccept?: (orderId: number) => void;
  onDecline?: (order: LogisticsDelivery) => void;
  onConfirmDelivered?: (order: LogisticsDelivery) => void;
  onViewDetails?: (order: LogisticsDelivery) => void;
}

export const RiderDeliveryMobileCard: React.FC<RiderDeliveryMobileCardProps> = ({
  order,
  tab,
  onAccept,
  onDecline,
  onConfirmDelivered,
  onViewDetails,
}) => {
  const [expanded, setExpanded] = useState(false);

  const cleanPhone = (order.phone || '').replace(/[^0-9+]/g, '');

  return (
    <div
      onClick={() => onViewDetails?.(order)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
    >
      {/* Top Header: Order Ref, Fee Badge & Status */}
      <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-sm text-slate-900 dark:text-white font-mono tracking-tight truncate">
            #{order.order_ref}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans shrink-0">
            {order.dispatch_date}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-red-50 text-[#c0201f] dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-900/60">
            {formatNaira(order.delivery_fee)}
          </span>
        </div>
      </div>

      {/* Body: Destination, Customer & Quick Actions */}
      <div className="p-4 space-y-3">
        {/* Destination Address */}
        <div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#c0201f] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                {order.address}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {order.customer_name}
          </span>
          <span className="font-mono text-slate-500 text-[11px] shrink-0">{order.phone}</span>
        </div>

        {/* 1-Tap Ergonomic Action Pills (Call & GPS Maps) */}
        <div
          className="grid grid-cols-2 gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {cleanPhone ? (
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold active:scale-[0.98] transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Call Customer</span>
            </a>
          ) : (
            <div className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-medium">
              <Phone className="w-3.5 h-3.5" />
              <span>No phone</span>
            </div>
          )}

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold active:scale-[0.98] transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Maps Route</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </a>
        </div>

        {/* Collapsible Kitchen Package Details */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="pt-2 border-t border-slate-100 dark:border-slate-800/80"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 select-none">
            <span className="flex items-center gap-1.5 font-medium">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              {expanded ? 'Hide Package Items' : 'View Package Items'}
            </span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>

          {expanded && (
            <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-200">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {order.items_summary || 'Standard Meal Package'}
              </p>
              {order.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Note: {order.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Primary Touch Actions (Min height 48px for thumb comfort) */}
      <div
        className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {tab === 'assigned' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDecline?.(order)}
              className="h-12 flex items-center justify-center gap-1.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold active:scale-[0.98] transition-all shadow-sm"
            >
              <XCircle className="w-4 h-4" />
              <span>Decline</span>
            </button>

            <button
              type="button"
              onClick={() => onAccept?.(order.id)}
              className="h-12 flex items-center justify-center gap-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Accept Order</span>
            </button>
          </div>
        )}

        {tab === 'in_transit' && (
          <button
            type="button"
            onClick={() => onConfirmDelivered?.(order)}
            className="w-full h-12 flex items-center justify-center gap-2 px-4 rounded-xl bg-[#c0201f] hover:bg-[#a01817] text-white text-sm font-bold shadow-md shadow-red-700/20 active:scale-[0.98] transition-all"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            <span>Confirm Handover & Complete</span>
          </button>
        )}

        {tab === 'delivered' && (
          <div className="flex items-center justify-between text-xs py-1 px-1">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Delivered & Settled
            </span>
            <span className="text-[11px] text-slate-500 font-sans">
              {order.delivered_at || `${order.dispatch_date} (Completed)`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
