import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Link2,
  ChevronRight,
  MoreHorizontal,
  History,
  Factory
} from 'lucide-react'

interface HubItem {
  id: string
  title: string
  path: string
  breadcrumbPrefix?: string
  breadcrumbBold?: string
}

export const CloudflareNavigationHub: React.FC = () => {
  const navigate = useNavigate()

  const inventoryItems: HubItem[] = [
    { id: 'raw', title: 'Raw Inventory', path: '/inventory/raw' },
    { id: 'packaging', title: 'Packaging Materials', path: '/inventory/packaging' },
    { id: 'sales', title: 'Sales Inventory', path: '/inventory/sales' },
    { id: 'movements', title: 'Stock Movements', path: '/inventory/movements' },
    { id: 'suppliers', title: 'Suppliers & Vendors', path: '/inventory/suppliers' }
  ]

  const productionItems: HubItem[] = [
    { id: 'batches', title: 'Production Batches', path: '/production/batches' },
    { id: 'pkg-exec', title: 'Packaging Execution', path: '/production/packaging' },
    { id: 'kitchen', title: 'Kitchen Shift Tasks', path: '/production/kitchen' },
    { id: 'smoker', title: 'Smoking Grill Supervisor Status', path: '/production/batches' }
  ]

  const recentItems: HubItem[] = [
    { id: 'r1', title: '', path: '/inventory/raw', breadcrumbPrefix: 'Inventory / ', breadcrumbBold: 'Raw Inventory' },
    { id: 'r2', title: '', path: '/production/batches', breadcrumbPrefix: 'Production / ', breadcrumbBold: 'Production Batches' },
    { id: 'r3', title: '', path: '/logistics/dispatch', breadcrumbPrefix: 'Logistics / ', breadcrumbBold: 'Fleet & Riders' },
    { id: 'r4', title: '', path: '/admin/accounts', breadcrumbPrefix: 'Manage account / ', breadcrumbBold: 'Members' },
    { id: 'r5', title: '', path: '/sales/orders', breadcrumbPrefix: 'Sales / ', breadcrumbBold: 'Website Orders' }
  ]

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 pt-2 pb-4">
      {/* COLUMN 1: INVENTORY CONTROL (Replacing Domains) */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#f0f0f3] dark:border-zinc-800">
          <button
            type="button"
            onClick={() => navigate('/inventory/raw')}
            className="group flex items-center gap-1.5 text-[15px] font-medium text-[#18181b] dark:text-zinc-100 hover:text-[#0051c3] dark:hover:text-blue-400 transition-colors"
          >
            <span>Inventory Control</span>
            <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-zinc-400 group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors" />
          </button>
          <button
            type="button"
            aria-label="Inventory Control options"
            className="w-7 h-7 flex items-center justify-center rounded text-[#71717a] dark:text-zinc-400 hover:text-[#18181b] dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#f0f0f3] dark:divide-zinc-800/80">
          {inventoryItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group flex items-center justify-between py-3 px-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] -mx-1.5 rounded-sm cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <button
                  type="button"
                  title={`Open ${item.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(item.path)
                  }}
                  className="w-5 h-5 flex items-center justify-center shrink-0 text-[#71717a] dark:text-zinc-400 group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <span className="text-[14px] text-[#18181b] dark:text-zinc-200 truncate font-normal group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#a1a1aa] dark:text-zinc-500 shrink-0 group-hover:text-[#18181b] dark:group-hover:text-zinc-200 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: PRODUCTION RUNS (Replacing Workers) */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#f0f0f3] dark:border-zinc-800">
          <button
            type="button"
            onClick={() => navigate('/production/batches')}
            className="group flex items-center gap-1.5 text-[15px] font-medium text-[#18181b] dark:text-zinc-100 hover:text-[#0051c3] dark:hover:text-blue-400 transition-colors"
          >
            <span>Production Runs</span>
            <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-zinc-400 group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors" />
          </button>
          <button
            type="button"
            aria-label="Production Runs options"
            className="w-7 h-7 flex items-center justify-center rounded text-[#71717a] dark:text-zinc-400 hover:text-[#18181b] dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#f0f0f3] dark:divide-zinc-800/80">
          {productionItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group flex items-center justify-between py-3 px-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] -mx-1.5 rounded-sm cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <button
                  type="button"
                  title={`Open ${item.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(item.path)
                  }}
                  className="w-5 h-5 flex items-center justify-center shrink-0 text-[#71717a] dark:text-zinc-400 group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors"
                >
                  <Factory className="w-4 h-4" />
                </button>
                <span className="text-[14px] text-[#18181b] dark:text-zinc-200 truncate font-normal group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#a1a1aa] dark:text-zinc-500 shrink-0 group-hover:text-[#18181b] dark:group-hover:text-zinc-200 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 3: RECENTS */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#f0f0f3] dark:border-zinc-800">
          <span className="text-[15px] font-medium text-[#18181b] dark:text-zinc-100">
            Recents
          </span>
          <button
            type="button"
            aria-label="Recent options"
            className="w-7 h-7 flex items-center justify-center rounded text-[#71717a] dark:text-zinc-400 hover:text-[#18181b] dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#f0f0f3] dark:divide-zinc-800/80">
          {recentItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group flex items-center justify-between py-3 px-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] -mx-1.5 rounded-sm cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[#71717a] dark:text-zinc-400 group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors">
                  <History className="w-4 h-4" />
                </div>
                <div className="text-[14px] text-[#18181b] dark:text-zinc-200 truncate font-normal">
                  <span className="text-[#52525b] dark:text-zinc-400 group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors">
                    {item.breadcrumbPrefix}
                  </span>
                  <span className="font-semibold text-[#18181b] dark:text-zinc-100 group-hover:text-[#0051c3] dark:group-hover:text-blue-400 transition-colors">
                    {item.breadcrumbBold}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#a1a1aa] dark:text-zinc-500 shrink-0 group-hover:text-[#18181b] dark:group-hover:text-zinc-200 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
