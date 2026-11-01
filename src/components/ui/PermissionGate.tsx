import React from 'react'
import { useSmokeyOps, UserRole } from '@/context/SmokeyOpsContext'

export interface PermissionGateProps {
  permission?: string
  permissions?: string[]
  roles?: UserRole[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Declarative component for gating interactive UI elements (buttons, forms, panels)
 * based on the authenticated operator's active permissions and assigned role.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  roles,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useSmokeyOps()

  // 1. Role check if specified
  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <>{fallback}</>
  }

  // 2. Single permission check
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // 3. Multi-permission check
  if (permissions && permissions.length > 0) {
    const isGranted = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    if (!isGranted) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

export interface RoleGateProps {
  roles: UserRole | UserRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * High-level component for gating UI strictly by system operational roles.
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  roles,
  fallback = null,
  children
}) => {
  const { hasRole } = useSmokeyOps()
  if (!hasRole(roles)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}

