import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { Breadcrumbs } from './Breadcrumbs'
import { CommandMenu } from '@/components/ui/CommandMenu'

export const AppShell: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)

  // Global Command+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandMenuOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

