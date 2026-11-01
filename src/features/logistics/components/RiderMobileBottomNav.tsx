import React from 'react';
import { Bike, Navigation, CheckCircle2, Wallet } from 'lucide-react';

interface RiderMobileBottomNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
  assignedCount: number;
  inTransitCount: number;
  deliveredCount: number;
}

export const RiderMobileBottomNav: React.FC<RiderMobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  assignedCount,
  inTransitCount,
  deliveredCount,
}) => {
  const tabs = [
    {
      id: 'assigned',
      label: 'Assigned',
      icon: Bike,
      badge: assignedCount > 0 ? assignedCount : null,
    },
    {
      id: 'in_transit',
      label: 'In-Transit',
      icon: Navigation,
      badge: inTransitCount > 0 ? inTransitCount : null,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      icon: CheckCircle2,
      badge: deliveredCount > 0 ? deliveredCount : null,
    },
    {
      id: 'earnings',
      label: 'Wallet',
      icon: Wallet,
      badge: null,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)] transition-all"
      aria-label="Rider Navigation"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 w-full h-full text-xs font-semibold select-none transition-colors ${
                isActive
                  ? 'text-[#c0201f] dark:text-red-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold font-mono flex items-center justify-center shadow-sm ${
                      isActive
                        ? 'bg-[#c0201f] text-white'
                        : 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
                    }`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>

              {/* Active Indicator bar */}
              {isActive && (
                <span className="absolute top-0 inset-x-4 h-0.5 bg-[#c0201f] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

