import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  const labelMap: Record<string, string> = {
    overview: 'Home overview',
    inventory: 'Inventory',
    raw: 'Raw inventory',
    packaging: 'Packaging materials',
    sales: 'Sales inventory',
    movements: 'Stock movements',
    suppliers: 'Suppliers & vendors',
    production: 'Production',
    batches: 'Production batches',
    tasks: 'Kitchen shift tasks',
    logistics: 'Logistics',
    board: 'Dispatch board',
    schedule: 'Delivery schedule',
    riders: 'Delivery fleet & riders',
    pickup: 'Store pickup counter',
    'third-party': '3PL logistics & fees',
    products: 'Products & SKUs',
    warehouses: 'Facilities & bins',
    procurement: 'Procurement (POs)',
    orders: 'Production orders',
    quality: 'Quality control',
    dispatch: 'Dispatch queue',
    shipments: 'Shipment tracking',
    returns: 'Returns & RMA',
  }

  // Helper for sentence case fallback
  const toSentenceCase = (text: string) => {
    const formatted = text.replace(/[-_]+/g, ' ').trim()
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase()
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-kumo-canvas/90 backdrop-blur-xs border-b border-kumo-line px-6 py-3.5 sm:py-4 flex items-center text-xs text-kumo-subtle select-none font-sans"
    >
      <Link
        to="/"
        className="flex items-center gap-1.5 hover:text-kumo-strong transition-colors font-medium font-sans"
      >
        <Home className="w-3.5 h-3.5 opacity-70" />
        <span>SmokeyOps</span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        
        // Handle contextual route differences (e.g. production/packaging vs inventory/packaging)
        let displayLabel = labelMap[name]
        if (name === 'packaging' && pathnames[0] === 'production') {
          displayLabel = 'Packaging execution'
        }
        if (!displayLabel) {
          displayLabel = toSentenceCase(name)
        }

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-kumo-subtle/50 shrink-0" />
            {isLast ? (
              <span className="font-medium text-kumo-strong font-sans">
                {displayLabel}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-kumo-strong transition-colors font-sans"
              >
                {displayLabel}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
