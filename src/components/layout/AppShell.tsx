import React, { useState, useEffect } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { Breadcrumbs } from './Breadcrumbs'
import { CommandMenu } from '@/components/ui/CommandMenu'

export const AppShell: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)
  const {
    isAuthenticated,
    currentAccount,
    isRouteAllowed,
    getRoleDefaultLandingPath,
    showToast
  } = useSmokeyOps()
  const location = useLocation()
  const navigate = useNavigate()

  // Strict RBAC Route Guard: Validates every route against the active operator's assigned role and permissions
  useEffect(() => {
    if (!isAuthenticated || !currentAccount) return

    // 1. Dedicated Rider Sandbox
    if (currentAccount.role === 'rider') {
      const allowedPaths = ['/logistics/rider-portal', '/rider', '/support']
      const isAllowed = allowedPaths.some(
        p => location.pathname === p || location.pathname.startsWith(`${p}/`)
      )
      if (!isAllowed) {
        navigate('/logistics/rider-portal', { replace: true })
      }
      return
    }

    // 2. Guard the mobile rider portal from office dashboard staff
    const isRiderRoute =
      location.pathname === '/logistics/rider-portal' ||
      location.pathname === '/rider' ||
      location.pathname.startsWith('/logistics/rider-portal/')
    if (isRiderRoute) {
      navigate('/logistics/riders', { replace: true })
      return
    }

    // 3. Strict declarative route authorization
    const isAllowed = isRouteAllowed(location.pathname, currentAccount)
    if (!isAllowed) {
      const fallbackPath = getRoleDefaultLandingPath(currentAccount.role)
      showToast(
        `Access Restricted: Your role (${currentAccount.roleLabel}) does not have permission to view this section. Redirected to your assigned workspace.`,
        'error'
      )
      navigate(fallbackPath, { replace: true })
    }
  }, [
    isAuthenticated,
    currentAccount,
    location.pathname,
    navigate,
    isRouteAllowed,
    getRoleDefaultLandingPath,
    showToast
  ])

  // Global Command+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    if (!isAuthenticated) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandMenuOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthenticated])

  // Require authentication before rendering any dashboard route
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div
      data-theme="kumo"
      className="min-h-screen flex bg-kumo-canvas text-kumo-default antialiased"
    >
      {/* Sidebar (Desktop persistent, Mobile drawer) */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Header Bar (h-58px) */}
        <TopNav 
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        />

        {/* Breadcrumb Path Context */}
        <Breadcrumbs />

        {/* Page Canvas */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1560px] w-full mx-auto space-y-6"
        >
          <Outlet />
        </main>
      </div>

      {/* Global Command Menu */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
      />
    </div>
  )
}

