import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { WarehouseProvider } from '@/context/WarehouseContext'
import { SmokeyOpsProvider } from '@/context/SmokeyOpsContext'
import { AppShell } from '@/components/layout/AppShell'

// Inventory Domain
import { RawInventoryPage } from '@/features/inventory/RawInventoryPage'
import { PackagingInventoryPage } from '@/features/inventory/PackagingInventoryPage'
import { SalesInventoryPage } from '@/features/inventory/SalesInventoryPage'
import { StockMovementsPage } from '@/features/inventory/StockMovementsPage'
import { SuppliersPage } from '@/features/inventory/SuppliersPage'

// Production Domain
import { ProductionBatchesPage } from '@/features/production/ProductionBatchesPage'
import { PackagingExecutionPage } from '@/features/production/PackagingExecutionPage'
import { KitchenTasksPage } from '@/features/production/KitchenTasksPage'

// Logistics Domain
import { LogisticsBoardPage } from '@/features/logistics/LogisticsBoardPage'
import { DeliverySchedulePage } from '@/features/logistics/DeliverySchedulePage'
import { DeliveryTeamPage } from '@/features/logistics/DeliveryTeamPage'
import { StorePickupPage } from '@/features/logistics/StorePickupPage'
import { ThirdPartyLogisticsPage } from '@/features/logistics/ThirdPartyLogisticsPage'
import { RiderDashboardPage } from '@/features/logistics/RiderDashboardPage'

// Overview Domain
import { AccountHomePage } from '@/features/overview/AccountHomePage'

// Sales Domain
import { WebsiteOrdersPage } from '@/features/sales/WebsiteOrdersPage'

// Admin Domain
import { ManageAccountsPage } from '@/features/admin/ManageAccountsPage'

// Auth Screen Domain (shadcn /components/ui)
import AuthSectionThree from '@/components/ui/auth-section-3'
import Demo from '@/components/ui/demo'

export function App() {
  return (
    <ThemeProvider>
      <WarehouseProvider>
        <SmokeyOpsProvider>
          <BrowserRouter>
            <Routes>
              {/* Full-screen Authentication and Demo Screens (outside AppShell) */}
              <Route path="/auth" element={<AuthSectionThree />} />
              <Route path="/login" element={<AuthSectionThree />} />
              <Route path="/signup" element={<AuthSectionThree />} />
              <Route path="/demo" element={<Demo />} />

              <Route path="/" element={<AppShell />}>
                {/* Default Landing Page directs to Account Overview */}
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<AccountHomePage />} />

                {/* 0. SALES DOMAIN */}
                <Route path="sales" element={<Navigate to="/sales/orders" replace />} />
                <Route path="sales/orders" element={<WebsiteOrdersPage />} />

                {/* 1. INVENTORY DOMAIN */}
                <Route path="inventory" element={<Navigate to="/inventory/raw" replace />} />
                <Route path="inventory/raw" element={<RawInventoryPage />} />
                <Route path="inventory/packaging" element={<PackagingInventoryPage />} />
                <Route path="inventory/sales" element={<SalesInventoryPage />} />
                <Route path="inventory/movements" element={<StockMovementsPage />} />
                <Route path="inventory/suppliers" element={<SuppliersPage />} />

                {/* 2. PRODUCTION DOMAIN */}
                <Route path="production" element={<Navigate to="/production/batches" replace />} />
                <Route path="production/batches" element={<ProductionBatchesPage />} />
                <Route path="production/packaging" element={<PackagingExecutionPage />} />
                <Route path="production/tasks" element={<KitchenTasksPage />} />

                {/* 3. LOGISTICS DOMAIN */}
                <Route path="logistics" element={<Navigate to="/logistics/board" replace />} />
                <Route path="logistics/board" element={<LogisticsBoardPage />} />
                <Route path="logistics/schedule" element={<DeliverySchedulePage />} />
                <Route path="logistics/riders" element={<DeliveryTeamPage />} />
                <Route path="logistics/rider-portal" element={<RiderDashboardPage />} />
                <Route path="rider" element={<Navigate to="/logistics/rider-portal" replace />} />
                <Route path="logistics/pickup" element={<StorePickupPage />} />
                <Route path="logistics/third-party" element={<ThirdPartyLogisticsPage />} />

                {/* 4. SUPER ADMIN & ACCOUNT MANAGEMENT */}
                <Route path="accounts" element={<ManageAccountsPage />} />
                <Route path="accounts/invite" element={<ManageAccountsPage />} />
                <Route path="accounts/route/:email?" element={<ManageAccountsPage />} />
                <Route path="accounts/matrix" element={<ManageAccountsPage />} />
                <Route path="admin/accounts" element={<ManageAccountsPage />} />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/inventory/raw" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SmokeyOpsProvider>
      </WarehouseProvider>
    </ThemeProvider>
  )
}
export default App
