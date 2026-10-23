import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Users,
  Search,
  Download,
  Trash2,
  Key,
  ShieldCheck,
  Shield,
  UserPlus,
  Edit2,
  Copy,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  MoreVertical,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  X,
  Globe,
  Pencil,
  Info,
  Plus,
  Building2,
  Check
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { Select } from '@/components/ui/Select'
import { Toggle, ToggleSwitch } from '@/components/ui/Toggle'
import { useSmokeyOps, AppUserAccount, UserRole, ROLE_DEFAULT_PERMISSIONS } from '@/context/SmokeyOpsContext'
import { useWarehouse, INITIAL_FACILITY } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'
import {
  ALL_SYSTEM_PERMISSIONS,
  SYSTEM_ROLE_CONFIGS,
  SystemPermissionItem
} from '@/components/layout/ManageAccountsModal'

// Enterprise Policy Groupings matching the Cloudflare screenshots
export interface PolicyCategoryGroup {
  id: string
  name: string
  permissions: SystemPermissionItem[]
}

// Portal-based action dropdown menu with dynamic collision detection (opens upwards when near bottom)
const AccountActionDropdown: React.FC<{
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
  children: React.ReactNode
}> = ({ isOpen, onClose, buttonRef, children }) => {
  const menuRef = useRef<HTMLDivElement>(null)

  const getPosition = useCallback(() => {
    if (!buttonRef.current) return { right: 12, openUp: false }
    const rect = buttonRef.current.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight || 250
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    // Open upwards if not enough space below, and there is more space above
    const openUp = spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow

    if (openUp) {
      return {
        bottom: Math.max(8, window.innerHeight - rect.top + 4),
        right: Math.max(12, window.innerWidth - rect.right),
        openUp: true,
        maxHeight: Math.max(160, rect.top - 16),
      }
    }
    return {
      top: rect.bottom + 4,
      right: Math.max(12, window.innerWidth - rect.right),
      openUp: false,
      maxHeight: Math.max(160, spaceBelow - 16),
    }
  }, [buttonRef])

  const [position, setPosition] = useState(getPosition)

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const update = () => {
      setPosition(getPosition())
    }

    update()
    const animId = requestAnimationFrame(update)

    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [isOpen, buttonRef, getPosition])

  if (!isOpen) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          ...(position.openUp
            ? { bottom: `${position.bottom}px` }
            : { top: `${position.top}px` }),
          right: `${position.right}px`,
          maxHeight: position.maxHeight ? `${position.maxHeight}px` : undefined,
          zIndex: 9999,
        }}
        className={cn(
          'w-48 rounded-xl border border-kumo-line bg-kumo-base shadow-2xl p-1 font-sans text-[13px] animate-in fade-in zoom-in-95 divide-y divide-kumo-line/60 bg-white dark:bg-zinc-900 select-none overflow-y-auto',
          position.openUp ? 'origin-bottom-right' : 'origin-top-right'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  )
}

const AccountRowActionCell: React.FC<{
  acc: AppUserAccount
  activeAccountEmail: string
  availableAccounts: AppUserAccount[]
  openMenuEmail: string | null
  setOpenMenuEmail: (email: string | null) => void
  onEditRoute: (email: string) => void
  onChangeRole: (acc: AppUserAccount) => void
  onInspectPermissions: (acc: AppUserAccount) => void
  onChangePassword: (acc: AppUserAccount) => void
  onSwitchAccount: (email: string) => void
  onDeleteAccount: (acc: AppUserAccount) => void
}> = ({
  acc,
  activeAccountEmail,
  availableAccounts,
  openMenuEmail,
  setOpenMenuEmail,
  onEditRoute,
  onChangeRole,
  onInspectPermissions,
  onChangePassword,
  onSwitchAccount,
  onDeleteAccount
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isOpen = openMenuEmail === acc.email

  return (
    <div className="flex items-center justify-end gap-1.5 relative">
      <Tooltip content="Edit staff profile and permissions">
        <TableActionButton
          variant="outline"
          onClick={() => onEditRoute(acc.email)}
          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </TableActionButton>
      </Tooltip>

      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpenMenuEmail(isOpen ? null : acc.email)
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer"
        aria-label={`Options for ${acc.name}`}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      <AccountActionDropdown
        isOpen={isOpen}
        onClose={() => setOpenMenuEmail(null)}
        buttonRef={buttonRef}
      >
        <div className="py-0.5">
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onEditRoute(acc.email)
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
            <span>Edit Route Page</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onChangeRole(acc)
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
            <span>Change Role</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onInspectPermissions(acc)
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
            <span>View Permissions</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onChangePassword(acc)
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
            <span>Change Password</span>
          </button>
          {acc.email.toLowerCase() !== activeAccountEmail.toLowerCase() && (
            <button
              type="button"
              onClick={() => {
                setOpenMenuEmail(null)
                onSwitchAccount(acc.email)
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
              <span>Switch to Account</span>
            </button>
          )}
        </div>
        <div className="py-0.5">
          <button
            type="button"
            disabled={availableAccounts.length <= 1}
            onClick={() => {
              setOpenMenuEmail(null)
              onDeleteAccount(acc)
            }}
            className={cn(
              'w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors',
              availableAccounts.length <= 1
                ? 'opacity-40 cursor-not-allowed text-kumo-subtle'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
            )}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Remove</span>
          </button>
        </div>
      </AccountActionDropdown>
    </div>
  )
}

export const ManageAccountsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { email: urlEmail } = useParams<{ email?: string }>()

  const {
    availableAccounts,
    activeAccountEmail,
    switchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    changePassword,
    showToast,
  } = useSmokeyOps()

  const { facilities } = useWarehouse()

  // Route detection
  const isRoutePage = location.pathname.includes('/accounts/route')
  const isMatrixPage = location.pathname.includes('/accounts/matrix')
  const isInvitePage = location.pathname.includes('/accounts/invite')

  // Kumo Tabs State for Accounts Table: 'all' | 'active' | 'inactive'
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all')

  // Filter state for DataTable
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('all')

  // Sub-modal states
  const [openMenuEmail, setOpenMenuEmail] = useState<string | null>(null)
  const [accountToChangePassword, setAccountToChangePassword] = useState<AppUserAccount | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<AppUserAccount | null>(null)

  // Standardized role scope options showing baseline policies count matching Cloudflare reference
  const roleScopeOptions = useMemo(() => [
    { value: '', label: 'Select a scope...' },
    ...SYSTEM_ROLE_CONFIGS.map(r => ({
      value: r.id,
      label: `${r.label} (${(ROLE_DEFAULT_PERMISSIONS[r.id] || []).length} baseline policies)`,
    }))
  ], [])

  // -------------------------------------------------------------
  // INVITE MEMBERS PAGE STATE (Matching Reference Screenshot)
  // -------------------------------------------------------------
  const [inviteEmails, setInviteEmails] = useState<string>('')
  const [inviteScope, setInviteScope] = useState<string>("Ayodine47@gmail.com's Account")
  const [inviteResourceScope, setInviteResourceScope] = useState<string>('Entire account')
  const [inviteSearchQuery, setInviteSearchQuery] = useState<string>('')
  const [invitePermissions, setInvitePermissions] = useState<string[]>([])
  const [inviteExpandedCats, setInviteExpandedCats] = useState<Record<string, boolean>>({
    'overall': true,
    'Kitchen & Production Operations': true,
    'Inventory & Warehouse Control': false,
    'Logistics & Fleet Dispatch': false,
    'Finance & Cash Remittance': false,
    'Administration & Security Controls': false,
  })

  // -------------------------------------------------------------
  // EDIT ROUTE & PERMISSION POLICIES PAGE STATE (Screenshots 1, 2, 3)
  // -------------------------------------------------------------
  const targetStaff = useMemo(() => {
    if (urlEmail) {
      const decoded = decodeURIComponent(urlEmail)
      return availableAccounts.find(a => a.email.toLowerCase() === decoded.toLowerCase()) || availableAccounts[0]
    }
    return availableAccounts[0]
  }, [availableAccounts, urlEmail])

  // Sub-tabs on the staff page matching Screenshot 1 & 3:
  // [ Permission policies | Groups & Zone | Settings ]
  const [staffSubTab, setStaffSubTab] = useState<'policies' | 'groups' | 'settings'>('policies')

  // Inside "Permission policies", whether editing/creating a policy or viewing overview table
  const [isEditingPolicy, setIsEditingPolicy] = useState<boolean>(true)
  const [showInfoBanner, setShowInfoBanner] = useState<boolean>(true)

  // Form State for Policy Scope
  const [policyScope, setPolicyScope] = useState<string>('Operating Office')
  const [policyAppliesTo, setPolicyAppliesTo] = useState<string>('Yaba Head Office')
  const [editRole, setEditRole] = useState<UserRole>('kitchen')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editZone, setEditZone] = useState('Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
  const [editOffice, setEditOffice] = useState('Yaba Head Office')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [policySearchQuery, setPolicySearchQuery] = useState('')

  // Accordion Expand/Collapse state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Kitchen & Production Operations': true,
    'Inventory & Warehouse Control': true,
    'Logistics & Fleet Dispatch': false,
    'Finance & Cash Remittance': false,
    'Administration & Security Controls': false,
  })

  // Initialize Edit Route State when target staff changes
  useEffect(() => {
    if (targetStaff) {
      setEditRole(targetStaff.role)
      setEditName(targetStaff.name)
      setEditEmail(targetStaff.email)
      const matchingFac = facilities.find(f => 
        f.name.toLowerCase() === targetStaff.assigned_hub?.toLowerCase() ||
        (targetStaff.assigned_hub && f.name.toLowerCase().startsWith(targetStaff.assigned_hub.toLowerCase())) ||
        (targetStaff.assigned_hub && targetStaff.assigned_hub.toLowerCase().startsWith(f.name.toLowerCase()))
      )
      const officeName = matchingFac?.name || targetStaff.assigned_hub || facilities[0]?.name || 'Yaba Head Office'
      setEditOffice(officeName)
      setEditZone('Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
      setPolicyScope('Operating Office')
      setPolicyAppliesTo(officeName)
      setEditPermissions(targetStaff.permissions || ROLE_DEFAULT_PERMISSIONS[targetStaff.role] || [])
      setIsEditingPolicy(true)
    }
  }, [targetStaff, facilities])

  // -------------------------------------------------------------
  // ROLE MATRIX PAGE STATE (Screenshot 2 / Screenshot 1)
  // -------------------------------------------------------------
  const [matrixScope, setMatrixScope] = useState<string>('')
  const [matrixAppliesTo, setMatrixAppliesTo] = useState<string>('Entire account')
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('')
  const [matrixPermissions, setMatrixPermissions] = useState<string[]>([])
  const [matrixExpandedCats, setMatrixExpandedCats] = useState<Record<string, boolean>>({
    'Kitchen & Production Operations': true,
    'Inventory & Warehouse Control': true,
    'Logistics & Fleet Dispatch': false,
    'Finance & Cash Remittance': false,
    'Administration & Security Controls': false,
  })

  const handleMatrixScopeChange = (scopeId: string) => {
    setMatrixScope(scopeId)
    const matchedRole = SYSTEM_ROLE_CONFIGS.find(r => r.id === scopeId)
    if (matchedRole) {
      setMatrixPermissions(ROLE_DEFAULT_PERMISSIONS[matchedRole.id] || [])
    } else {
      setMatrixPermissions([])
    }
  }

  // Change Password Form State
  const [newPasswordVal, setNewPasswordVal] = useState('')
  const [requirePassReset, setRequirePassReset] = useState(true)

  // Real SmokeyOps Operational Policy Categories matching core modules
  const policyCategoryGroups = useMemo<PolicyCategoryGroup[]>(() => {
    return [
      {
        id: 'production',
        name: 'Kitchen & Production Operations',
        permissions: [
          {
            id: 'perm_batches',
            label: 'Batch Scheduling & Cook Approvals',
            category: 'Production',
            description: 'Schedule pit smoke cooks, modify recipes, and sign off completed operational runs.'
          },
          {
            id: 'perm_cook',
            label: 'Start & Complete Batches',
            category: 'Production',
            description: 'Record real-time cook progress, internal meat temps, pit smoker timings, and yield outputs.'
          },
          {
            id: 'perm_raw_deplete',
            label: 'Raw Materials Depletion',
            category: 'Production',
            description: 'Auto-deplete raw cuts of meat, seasoning packs, marinades, and wood chips during runs.'
          },
          {
            id: 'perm_packout',
            label: 'Portion Pack-out Logging',
            category: 'Production',
            description: 'Log sealed units into vacuum pouches and carton cases ready for sales inventory.'
          },
          {
            id: 'perm_spoilage',
            label: 'Waste & Spoilage Incident Reports',
            category: 'Production',
            description: 'Submit and approve burned portions, expired cuts, or compromised kitchen batches.'
          }
        ]
      },
      {
        id: 'inventory',
        name: 'Inventory & Warehouse Control',
        permissions: [
          {
            id: 'perm_intake',
            label: 'Stock Intake PO Receipts',
            category: 'Inventory',
            description: 'Receive vendor deliveries at loading dock, confirm item quantities, and verify lot batch numbers.'
          },
          {
            id: 'perm_cycle_counts',
            label: 'Periodic Cycle Counts',
            category: 'Inventory',
            description: 'Perform physical warehouse stock reconciliations and adjustments against system tallies.'
          },
          {
            id: 'perm_transfers',
            label: 'Packaging Unit Transfers',
            category: 'Inventory',
            description: 'Transfer foil trays, branded thermal bags, and boxes across kitchens, depots, and hubs.'
          },
          {
            id: 'perm_expiry',
            label: 'Lot Expiry Monitoring',
            category: 'Inventory',
            description: 'Track meat and spice freshness dates, send urgent reorder notifications, and quarantine aging lots.'
          },
          {
            id: 'perm_thresholds',
            label: 'Inventory Threshold Overrides',
            category: 'Inventory',
            description: 'Adjust safety stock minimums, maximum storage capacities, and critical reorder threshold parameters.'
          }
        ]
      },
      {
        id: 'logistics',
        name: 'Logistics & Fleet Dispatch',
        permissions: [
          {
            id: 'perm_dispatch_ctrl',
            label: 'Logistics Dispatch Controls',
            category: 'Logistics',
            description: 'Full supervisory control over courier allocation, rider assignment, and emergency re-routes.'
          },
          {
            id: 'perm_queue_assign',
            label: 'Dispatch Queue Assignment',
            category: 'Logistics',
            description: 'Assign ready cooked orders to available couriers waiting at the dispatch staging dock.'
          },
          {
            id: 'perm_tracking',
            label: 'Rider Location & Route Tracking',
            category: 'Logistics',
            description: 'Live GPS tracking of delivery couriers, transit ETA monitoring, and delivery route compliance.'
          },
          {
            id: 'perm_3pl',
            label: 'Third-party Courier Bookings',
            category: 'Logistics',
            description: 'Dispatch overflow delivery orders to Gozem, Gokada, or private 3PL courier fleets.'
          },
          {
            id: 'perm_delivery_transit',
            label: 'Accept & Transit Delivery',
            category: 'Logistics',
            description: 'Rider interface permissions to accept assigned trips and initiate waypoint delivery transit.'
          },
          {
            id: 'perm_otp_dropoff',
            label: 'Customer OTP Drop-off Sign-off',
            category: 'Logistics',
            description: 'Validate customer delivery OTP code and electronic signature before concluding drop-off handover.'
          },
          {
            id: 'perm_shifts',
            label: 'Staff Shift Assignments',
            category: 'Logistics',
            description: 'Manage courier shift rotas, check-in schedules, and dispatch station coverage plans.'
          }
        ]
      },
      {
        id: 'finance',
        name: 'Finance & Cash Remittance',
        permissions: [
          {
            id: 'perm_finance',
            label: 'Finance & Payout Remittances',
            category: 'Finance',
            description: 'Process batch payouts, approve cash disbursements, and clear delivery rider ledgers.'
          },
          {
            id: 'perm_invoices',
            label: 'Supplier Invoice Verification',
            category: 'Finance',
            description: 'Review purchase order billing, confirm line item unit costs, and approve inventory payments.'
          },
          {
            id: 'perm_cod_checkin',
            label: 'COD Cash Remittance Check-in',
            category: 'Finance',
            description: 'Verify and reconcile physical cash turned in by delivery couriers at dispatch hub counters.'
          },
          {
            id: 'perm_cod_collect',
            label: 'COD Cash Collection',
            category: 'Finance',
            description: 'Collect physical cash payment from customers upon arrival at delivery destinations.'
          },
          {
            id: 'perm_wallet',
            label: 'Wallet & Payout History',
            category: 'Finance',
            description: 'Inspect individual courier earnings ledger, trip commissions, tips, and account deductions.'
          }
        ]
      },
      {
        id: 'admin',
        name: 'Administration & Security Controls',
        permissions: [
          {
            id: 'perm_rbac',
            label: 'Role & Permission Management',
            category: 'Administration',
            description: 'Assign roles, adjust privilege scopes, and configure custom operational security grants.'
          },
          {
            id: 'perm_users',
            label: 'User Onboarding & Deletion',
            category: 'Administration',
            description: 'Create, update credentials, deactivate and delete dashboard operator accounts.'
          },
          {
            id: 'perm_records',
            label: 'Full Database & Records Access',
            category: 'Administration',
            description: 'Access master database records, audit trails, and operational raw data tables.'
          },
          {
            id: 'perm_facility_config',
            label: 'Office & Facility Settings',
            category: 'Administration',
            description: 'Configure kitchen operating facilities, bin allocations, hub geofences, and store pickup options.'
          }
        ]
      }
    ]
  }, [])

  // Flattened permission items
  const allPolicyItems = useMemo(() => {
    return policyCategoryGroups.flatMap(g => g.permissions)
  }, [policyCategoryGroups])

  // Formatted realistic last activities
  const getActivityTimestamp = (acc: AppUserAccount) => {
    if (acc.role === 'admin') return 'Today, 3:52 PM'
    if (acc.role === 'manager') return 'Today, 3:24 PM'
    if (acc.role === 'rider') return 'Today, 1:15 PM'
    if (acc.role === 'kitchen') return 'Yesterday, 8:21 AM'
    if (acc.role === 'inventory') return 'Sep 24, 2026 at 2:10 PM'
    if (acc.role === 'dispatcher') return 'Sep 23, 2026 at 1:30 PM'
    return acc.last_active || 'Today, 12:00 PM'
  }

  // Counts for tabs
  const activeCount = useMemo(() => {
    return availableAccounts.filter(a => a.status !== 'suspended').length
  }, [availableAccounts])

  const inactiveCount = useMemo(() => {
    return availableAccounts.filter(a => a.status === 'suspended').length
  }, [availableAccounts])

  // Table Data filtered by Tab & Filters
  const tableData = useMemo(() => {
    return availableAccounts.filter((acc) => {
      if (activeTab === 'active' && acc.status === 'suspended') return false
      if (activeTab === 'inactive' && acc.status !== 'suspended') return false

      if (selectedRoleFilter !== 'all' && acc.role !== selectedRoleFilter) {
        return false
      }

      if (selectedOfficeFilter !== 'all') {
        const accOffice = acc.assigned_hub || facilities[0]?.name || 'Yaba Head Office'
        if (!accOffice.toLowerCase().includes(selectedOfficeFilter.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [availableAccounts, activeTab, selectedRoleFilter, selectedOfficeFilter])

  // Handlers for Edit Route Page
  const handleEditRoleChange = (newRole: UserRole) => {
    setEditRole(newRole)
    const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] || []
    setEditPermissions(defaults)
  }

  const togglePolicyPermission = (permLabel: string) => {
    setEditPermissions(prev =>
      prev.includes(permLabel) ? prev.filter(p => p !== permLabel) : [...prev, permLabel]
    )
  }

  const toggleCategoryGroup = (categoryPerms: string[], allActive: boolean) => {
    if (allActive) {
      setEditPermissions(prev => prev.filter(p => !categoryPerms.includes(p)))
    } else {
      setEditPermissions(prev => Array.from(new Set([...prev, ...categoryPerms])))
    }
  }

  const handleSaveRouteAndPolicies = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!targetStaff) return

    const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === editRole)
    const roleLabel = roleConfig ? roleConfig.label : editRole

    updateAccount(targetStaff.email, {
      name: editName.trim() || targetStaff.name,
      email: editEmail.trim() || targetStaff.email,
      role: editRole,
      roleLabel,
      assigned_hub: editOffice,
      permissions: editPermissions,
    })

    showToast(`Saved role and policies for ${targetStaff.name || targetStaff.email}`, 'success')
    navigate('/accounts')
  }

  const handleDeletePolicy = () => {
    setEditPermissions([])
    showToast(`Cleared assigned policies for ${targetStaff?.email}`, 'info')
    setIsEditingPolicy(false)
  }

  // Handlers for Role Matrix Page
  const toggleMatrixPolicy = (permLabel: string) => {
    setMatrixPermissions(prev =>
      prev.includes(permLabel) ? prev.filter(p => p !== permLabel) : [...prev, permLabel]
    )
  }

  const toggleMatrixCategory = (categoryPerms: string[], allActive: boolean) => {
    if (allActive) {
      setMatrixPermissions(prev => prev.filter(p => !categoryPerms.includes(p)))
    } else {
      setMatrixPermissions(prev => Array.from(new Set([...prev, ...categoryPerms])))
    }
  }

  const handleSaveMatrixPolicy = () => {
    if (!matrixScope) {
      showToast('Please select a scope to create policy', 'error')
      return
    }
    const matchedRole = SYSTEM_ROLE_CONFIGS.find(r => r.id === matrixScope)
    // Persist updated policy permissions to matching accounts
    availableAccounts.forEach(acc => {
      if (acc.role === matrixScope) {
        updateAccount(acc.email, {
          permissions: [...matrixPermissions]
        })
      }
    })
    showToast(`Policy successfully saved and applied to ${matchedRole?.label || matrixScope}`, 'success')
    navigate('/accounts')
  }

  // Overall roles list for Invite Members page matching Screenshot
  const overallRolesList = useMemo<Array<{ id: string; label: string; description: string; permissions: string[] }>>(() => [
    {
      id: 'super_admin',
      label: 'Super Administrator - All Privileges',
      description: 'Can edit any SmokeyOps platform setting, make purchases, update billing, and manage staff memberships. Super Administrators can revoke access of other Super Administrators.',
      permissions: ALL_SYSTEM_PERMISSIONS.map(p => p.label)
    },
    {
      id: 'minimal_access',
      label: 'Minimal Account Access',
      description: 'Can view account, and nothing else',
      permissions: ['Full Database & Records Access']
    },
    {
      id: 'ops_manager',
      label: 'Operations General Manager',
      description: 'Can access full operational hubs, supervise multi-hub kitchens, modify menus, and oversee dispatch shifts.',
      permissions: ROLE_DEFAULT_PERMISSIONS['manager'] || []
    },
    {
      id: 'kitchen_lead',
      label: 'Central Kitchen Production Lead',
      description: 'Can manage kitchen queue, log cooking batches, deplete raw materials, and override station alerts.',
      permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
    },
    {
      id: 'warehouse_lead',
      label: 'Inventory & Warehouse Custodian',
      description: 'Can manage purchase order receipts, inventory intake, transfer manifests, and cycle counts.',
      permissions: ROLE_DEFAULT_PERMISSIONS['inventory'] || []
    },
    {
      id: 'fleet_lead',
      label: 'Logistics & Fleet Dispatcher',
      description: 'Can manage rider assignments, dispatch queue, live transit monitoring, and third-party courier integrations.',
      permissions: ROLE_DEFAULT_PERMISSIONS['dispatcher'] || []
    },
    {
      id: 'delivery_courier',
      label: 'Delivery Courier / Rider',
      description: 'Can view assigned delivery drops, update waypoint progress, and sign off customer OTP handovers.',
      permissions: ROLE_DEFAULT_PERMISSIONS['rider'] || []
    },
    {
      id: 'read_only',
      label: 'Operations Read Only Auditor',
      description: 'Can access the full account in read only mode without modification privileges.',
      permissions: ['Full Database & Records Access']
    }
  ], [])

  // Parse comma / space / newline separated emails
  const parsedInviteEmails = useMemo(() => {
    if (!inviteEmails.trim()) return []
    return inviteEmails
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0)
  }, [inviteEmails])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const validEmails = useMemo(() => {
    return parsedInviteEmails.filter(e => emailRegex.test(e))
  }, [parsedInviteEmails])

  // Handle Invite Members Submit
  const handleInviteSubmit = () => {
    if (validEmails.length === 0) {
      showToast('Please enter at least one valid email address', 'error')
      return
    }

    const finalPermissions = invitePermissions.length > 0
      ? invitePermissions
      : ROLE_DEFAULT_PERMISSIONS['kitchen'] || []

    const cleanedOffice = inviteScope.includes('Office')
      ? inviteScope.replace(/\s+Office$/i, '').trim()
      : 'Central Kitchen'

    validEmails.forEach((emailStr) => {
      const email = emailStr.trim()
      const username = email.split('@')[0]
      const derivedName = username
        .split(/[._-]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Team Member'

      let derivedRole: UserRole = 'kitchen'
      if (invitePermissions.some(p => p.includes('Super Administrator') || p.includes('Role & Permission') || p.includes('User Onboarding'))) {
        derivedRole = 'admin'
      } else if (invitePermissions.some(p => p.includes('Supervise') || p.includes('Variance') || p.includes('Operations General Manager'))) {
        derivedRole = 'manager'
      } else if (invitePermissions.some(p => p.includes('Logistics') || p.includes('Dispatch'))) {
        derivedRole = 'dispatcher'
      } else if (invitePermissions.some(p => p.includes('Transit') || p.includes('Delivery Courier') || p.includes('OTP'))) {
        derivedRole = 'rider'
      } else if (invitePermissions.some(p => p.includes('Stock Intake') || p.includes('Warehouse'))) {
        derivedRole = 'inventory'
      } else if (invitePermissions.some(p => p.includes('Read Only') || p.includes('Auditor'))) {
        derivedRole = 'admin'
      }

      const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === derivedRole)
      const roleLabel = roleConfig ? roleConfig.label : derivedRole

      const newAccount: AppUserAccount = {
        email,
        name: derivedName,
        role: derivedRole,
        roleLabel,
        assigned_hub: cleanedOffice,
        permissions: finalPermissions,
        department:
          derivedRole === 'kitchen'
            ? 'Culinary Operations'
            : derivedRole === 'rider' || derivedRole === 'dispatcher'
            ? 'Logistics'
            : derivedRole === 'inventory'
            ? 'Warehouse'
            : 'Administration',
        staff_id: `SHD-${derivedRole.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
        status: 'active',
        last_active: 'Invited just now',
        temporary_password: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
        created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      }

      createAccount(newAccount)
    })

    showToast(`Successfully invited ${validEmails.length} member${validEmails.length === 1 ? '' : 's'} to ${inviteScope}`, 'success')
    navigate('/accounts')
  }

  // Handle Change Password Submit
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountToChangePassword) return
    if (!newPasswordVal.trim()) {
      showToast('Password cannot be blank', 'error')
      return
    }

    changePassword(accountToChangePassword.email, newPasswordVal)
    setAccountToChangePassword(null)
    setNewPasswordVal('')
  }

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!accountToDelete) return
    deleteAccount(accountToDelete.email)
    setAccountToDelete(null)
    setOpenMenuEmail(null)
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Full Name', 'Staff ID', 'Email Address', 'Role', 'Office', 'Last Activity', 'Permissions Count', 'Status']
    const rows = tableData.map(a => [
      `"${a.name}"`,
      `"${a.staff_id || 'SHD-OP'}"`,
      `"${a.email}"`,
      `"${a.roleLabel}"`,
      `"${a.assigned_hub || facilities[0]?.name || 'Yaba Head Office'}"`,
      `"${getActivityTimestamp(a)}"`,
      `"${(a.permissions || ROLE_DEFAULT_PERMISSIONS[a.role] || []).length}"`,
      `"${a.status || 'active'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smokey_team_accounts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Exported ${tableData.length} team members to CSV`, 'success')
  }

  const handleBulkExport = (selectedItems: AppUserAccount[]) => {
    const headers = ['Full Name', 'Email Address', 'Role', 'Office', 'Status']
    const rows = selectedItems.map(a => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.roleLabel}"`,
      `"${a.assigned_hub || facilities[0]?.name || 'Yaba Head Office'}"`,
      `"${a.status || 'active'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smokey_selected_accounts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Exported ${selectedItems.length} selected accounts`, 'success')
  }

  // DataTable Column Definitions
  // NO profile icon per instructions
  const accountColumns: ColumnDef<AppUserAccount>[] = [
    {
      key: 'name',
      header: 'Member Full Name',
      defaultWidth: 240,
      accessor: (acc) => (
        <div>
          <div className="font-semibold text-kumo-strong text-sm font-sans">
            {acc.name}
          </div>
          <div className="text-[13px] text-kumo-subtle font-sans mt-0.5">
            {acc.staff_id || acc.department || 'Operations'}
          </div>
        </div>
      ),
      sortValue: (acc) => acc.name,
    },
    {
      key: 'email',
      header: 'Email Address',
      defaultWidth: 220,
      accessor: (acc) => (
        <span className="text-[13px] text-kumo-subtle font-sans">
          {acc.email}
        </span>
      ),
      sortValue: (acc) => acc.email,
    },
    {
      key: 'activity',
      header: 'Last Activity',
      defaultWidth: 160,
      accessor: (acc) => (
        <span className="text-[13px] text-kumo-default font-sans whitespace-nowrap">
          {getActivityTimestamp(acc)}
        </span>
      ),
      sortValue: (acc) => getActivityTimestamp(acc),
    },
    {
      key: 'role',
      header: 'Role',
      defaultWidth: 180,
      accessor: (acc) => (
        <button
          type="button"
          onClick={() => navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-[13px] font-medium text-kumo-strong shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
          title="Click to view and configure role & permissions"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{acc.roleLabel}</span>
        </button>
      ),
      sortValue: (acc) => acc.roleLabel,
    },
    {
      key: 'permissions',
      header: 'Active Permissions',
      defaultWidth: 200,
      accessor: (acc) => {
        const perms = acc.permissions || ROLE_DEFAULT_PERMISSIONS[acc.role] || []
        return (
          <button
            type="button"
            onClick={() => navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)}
            className="group/perms flex items-center gap-1.5 cursor-pointer max-w-full text-left"
            title="Click to view and configure granted permissions on Role & Permission page"
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[12px] font-semibold rounded-md bg-kumo-canvas border border-kumo-line text-kumo-strong group-hover/perms:border-primary/50 group-hover/perms:text-primary transition-colors shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{perms.length} Policies</span>
            </span>
            <span className="text-[12px] text-kumo-subtle truncate max-w-[100px]">
              {perms.slice(0, 1).join(', ')}
              {perms.length > 1 && ` +${perms.length - 1}`}
            </span>
          </button>
        )
      },
      sortValue: (acc) => (acc.permissions || ROLE_DEFAULT_PERMISSIONS[acc.role] || []).length,
    },
    {
      key: 'office',
      header: 'Office',
      defaultWidth: 200,
      accessor: (acc) => (
        <span className="text-[13px] text-kumo-default font-sans whitespace-nowrap">
          {acc.assigned_hub || facilities[0]?.name || 'Yaba Head Office'}
        </span>
      ),
      sortValue: (acc) => acc.assigned_hub || '',
    },
    {
      key: 'status',
      header: 'Status',
      defaultWidth: 120,
      accessor: (acc) => {
        const isActive = acc.status !== 'suspended'
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium border whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            {isActive ? 'Active' : 'Suspended'}
          </span>
        )
      },
      sortValue: (acc) => acc.status || 'active',
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 160,
      accessor: (acc) => (
        <AccountRowActionCell
          acc={acc}
          activeAccountEmail={activeAccountEmail}
          availableAccounts={availableAccounts}
          openMenuEmail={openMenuEmail}
          setOpenMenuEmail={setOpenMenuEmail}
          onEditRoute={(email) => navigate(`/accounts/route/${encodeURIComponent(email)}`)}
          onChangeRole={(account) => navigate(`/accounts/route/${encodeURIComponent(account.email)}`)}
          onInspectPermissions={(account) => navigate(`/accounts/route/${encodeURIComponent(account.email)}`)}
          onChangePassword={(account) => {
            setAccountToChangePassword(account)
            setNewPasswordVal(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
          }}
          onSwitchAccount={(email) => switchAccount(email)}
          onDeleteAccount={(account) => setAccountToDelete(account)}
        />
      ),
    },
  ]

  // =========================================================================
  // VIEW 1: DEDICATED EDIT ROUTE & PERMISSION POLICIES PAGE (Screenshots 1, 2, 3)
  // =========================================================================
  if (isRoutePage && targetStaff) {
    // Semicolon-separated string of active policy labels matching Screenshot 3
    const activePoliciesString = editPermissions.length > 0
      ? editPermissions.join('; ')
      : 'Batch Scheduling & Cook Approvals; Stock Intake PO Receipts; Logistics Dispatch Controls; Role & Permission Management'

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto pb-16">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Back to team accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Role & Permission</h1>
                <span className="text-kumo-subtle text-base font-normal">/</span>
                <span className="text-base font-semibold text-kumo-default">{targetStaff.name}</span>
              </div>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Define and manage role policies, authority scopes, and functional operational access for <strong className="text-kumo-strong">{targetStaff.name}</strong> ({targetStaff.email}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => navigate('/accounts')}
              className="h-10 px-4 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => handleSaveRouteAndPolicies()}
              className="h-10 px-4 text-[13px] font-semibold shadow-xs"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Tab Switcher matching Screenshot 1 & 3: [ Permission policies | Groups | Settings ] */}
        <div className="flex items-center justify-between gap-4">
          <KumoTabs
            activeTab={staffSubTab}
            onChange={(val) => setStaffSubTab(val as 'policies' | 'groups' | 'settings')}
            tabs={[
              { id: 'policies', label: 'Permission policies' },
              { id: 'groups', label: 'Groups & Zone' },
              { id: 'settings', label: 'Settings' },
            ]}
          />

          <div className="flex items-center gap-2">
            <span className="text-[13px] text-kumo-subtle font-sans hidden sm:inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>View member ID:</span>
              <strong className="text-kumo-strong">{targetStaff.staff_id || 'SHD-STAFF'}</strong>
            </span>
          </div>
        </div>

        {/* TAB 1: PERMISSION POLICIES (Screenshots 1, 2, 3) */}
        {staffSubTab === 'policies' && (
          <div className="space-y-6">
            {/* If NOT actively editing policy: Display Overview Table (Screenshot 3) */}
            {!isEditingPolicy ? (
              <div className="space-y-4">
                {/* Search Bar & Create a Policy Button matching Screenshot 3 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-kumo-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search policies..."
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPolicy(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="h-9 px-4 text-[13px] font-semibold rounded-xl"
                  >
                    Create a policy
                  </Button>
                </div>

                {/* Table of assigned policies matching Screenshot 3 */}
                <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
                  <div className="grid grid-cols-[1.2fr_1.8fr_3.5fr_1fr_1fr_44px] items-center px-5 py-3 bg-kumo-canvas/50 border-b border-kumo-line text-[13px] font-semibold text-kumo-subtle select-none">
                    <span>Scope ↑</span>
                    <span>Applies to ⇅</span>
                    <span>Roles & Permissions ⇅</span>
                    <span className="flex items-center gap-1">Granted by <Info className="w-3 h-3" /></span>
                    <span>Date Added</span>
                    <span className="sr-only">Actions</span>
                  </div>

                  <div className="divide-y divide-kumo-line/60">
                    <div
                      onClick={() => setIsEditingPolicy(true)}
                      className="grid grid-cols-[1.2fr_1.8fr_3.5fr_1fr_1fr_44px] items-center px-5 py-4 hover:bg-kumo-tint/40 transition-colors cursor-pointer text-[13px]"
                    >
                      <div className="font-semibold text-kumo-strong text-sm">
                        {policyScope}
                      </div>

                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-kumo-line bg-kumo-canvas text-[13px] font-sans text-kumo-strong">
                          <Building2 className="w-3.5 h-3.5 text-kumo-subtle" />
                          <span>{policyAppliesTo}</span>
                        </span>
                      </div>

                      <div className="pr-4 text-kumo-default text-[13px] leading-relaxed line-clamp-3">
                        {activePoliciesString}
                      </div>

                      <div className="text-kumo-subtle font-medium text-[13px]">
                        Office Admin
                      </div>

                      <div className="text-kumo-default font-sans text-[13px]">
                        {targetStaff.created_at || '10 Jan 2026'}
                      </div>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditingPolicy(true)
                          }}
                          className="p-1 rounded text-kumo-subtle hover:text-kumo-strong"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* If actively editing policy: Display Edit Policy Form (Screenshots 1 & 2) */
              <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs animate-in fade-in duration-200">
                {/* Header matching Screenshot 1: "Edit policy ✎" */}
                <div className="p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-kumo-strong">Edit policy</h2>
                    <Pencil className="w-3.5 h-3.5 text-kumo-subtle" />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-[12px] font-sans font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Active · Added {targetStaff.created_at || '10 Jan 2026'}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingPolicy(false)}
                    className="text-[13px] text-kumo-subtle hover:text-kumo-strong flex items-center gap-1 cursor-pointer font-sans"
                  >
                    <span>View all policies</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Scope Selector Dropdown & Target Selector matching Cloudflare reference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="w-full">
                      <Select
                        value={editRole}
                        onValueChange={(val) => {
                          const chosen = String(val)
                          if (!chosen) {
                            setEditRole('' as any)
                            setEditPermissions([])
                            return
                          }
                          const newRole = chosen as UserRole
                          setEditRole(newRole)
                          const roleConfig = SYSTEM_ROLE_CONFIGS.find(r => r.id === newRole)
                          const roleDefaults = ROLE_DEFAULT_PERMISSIONS[newRole] || []
                          setEditPermissions(roleDefaults)
                          showToast(`Assigned ${roleConfig?.label || newRole} baseline policies`, 'info')
                        }}
                        options={roleScopeOptions}
                        placeholder="Select a scope..."
                        buttonClassName="h-10 text-[13px] font-medium rounded-xl"
                      />
                    </div>

                    <div className="w-full">
                      <Select
                        value={policyAppliesTo}
                        onValueChange={(val) => {
                          const chosen = String(val)
                          setPolicyAppliesTo(chosen)
                          setEditOffice(chosen)
                        }}
                        groups={[
                          {
                            label: 'ACCOUNT-LEVEL',
                            options: [
                              { value: 'Entire account', label: 'Entire account' },
                            ]
                          },
                          {
                            label: 'RESOURCE-SPECIFIC',
                            options: (facilities && facilities.length > 0 ? facilities : [INITIAL_FACILITY]).map(f => ({
                              value: f.name,
                              label: f.name
                            }))
                          }
                        ]}
                        placeholder="Applies to..."
                        buttonClassName="h-10 text-[13px] rounded-xl"
                      />
                    </div>
                  </div>

                  {!editRole ? (
                    <div className="border-2 border-dashed border-kumo-line rounded-2xl p-16 text-center my-6">
                      <p className="text-[13px] text-kumo-subtle select-none font-medium">
                        Roles will appear after you select a scope.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Light Blue Info Banner with (i) circle and dismiss (x) */}
                      {showInfoBanner && (
                        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start justify-between gap-3 text-[13px] text-blue-900 dark:text-blue-200 animate-in fade-in">
                          <div className="flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              These role permissions only grant access within the selected scope: <strong className="font-semibold">{policyAppliesTo}</strong>. To grant access across all operational kitchens, inventory facilities, and dispatch stations, change the scope to <strong className="font-semibold">All Operating Facilities</strong>.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowInfoBanner(false)}
                            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Explanatory text */}
                      <p className="text-[13px] text-kumo-default leading-relaxed">
                        Define what operational permissions <strong className="text-kumo-strong font-semibold">{SYSTEM_ROLE_CONFIGS.find(r => r.id === editRole)?.label || editRole}</strong> should have for <strong className="text-kumo-strong font-semibold">{targetStaff.email}</strong> within the scope: <strong className="text-kumo-strong font-semibold">{policyAppliesTo}</strong>.
                      </p>

                      {/* Search bar matching Screenshot 1 */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-kumo-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={policySearchQuery}
                          onChange={(e) => setPolicySearchQuery(e.target.value)}
                          placeholder="Search by role or permission name..."
                          className="w-full h-10 pl-10 pr-10 rounded-xl border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand transition-colors"
                        />
                        {policySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPolicySearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                  {/* Collapsible Accordion Groups with Counters & Master Toggle matching Screenshot 1 & 2 */}
                  <div className="border border-kumo-line rounded-xl overflow-hidden bg-kumo-base divide-y divide-kumo-line">
                    {policyCategoryGroups.map((group) => {
                      const isExpanded = expandedCategories[group.name] ?? false
                      const categoryPermLabels = group.permissions.map(p => p.label)
                      const activeInGroup = categoryPermLabels.filter(label => editPermissions.includes(label))
                      const isAllGroupActive = activeInGroup.length === categoryPermLabels.length && categoryPermLabels.length > 0

                      // Filtered items in this group
                      const filteredInGroup = group.permissions.filter(p => {
                        const q = policySearchQuery.toLowerCase().trim()
                        if (!q) return true
                        return p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
                      })

                      if (policySearchQuery && filteredInGroup.length === 0) {
                        return null
                      }

                      return (
                        <div key={group.id} className="divide-y divide-kumo-line/60">
                          {/* Category Header Row matching Screenshot 1 */}
                          <div
                            onClick={() => setExpandedCategories(prev => ({
                              ...prev,
                              [group.name]: !isExpanded
                            }))}
                            className="flex items-center justify-between px-5 py-3.5 bg-kumo-canvas/40 hover:bg-kumo-canvas/80 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-kumo-subtle" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-kumo-subtle" />
                              )}
                              <span className="font-semibold text-sm text-kumo-strong">{group.name}</span>
                            </div>

                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[13px] font-sans text-kumo-subtle font-medium">
                                {activeInGroup.length}/{group.permissions.length}
                              </span>
                              <ToggleSwitch
                                checked={isAllGroupActive}
                                onChange={() => toggleCategoryGroup(categoryPermLabels, isAllGroupActive)}
                                ariaLabel={`Toggle all ${group.name}`}
                              />
                            </div>
                          </div>

                          {/* Expanded Policy Rows with Dashed Dividers matching Screenshot 2 */}
                          {isExpanded && (
                            <div className="divide-y divide-dashed divide-kumo-line/80 bg-kumo-base">
                              {filteredInGroup.map((perm) => {
                                const isChecked = editPermissions.includes(perm.label)
                                return (
                                  <div
                                    key={perm.id}
                                    className="grid grid-cols-[1.5fr_2.5fr_auto] items-center gap-4 px-6 py-4 hover:bg-kumo-tint/20 transition-colors"
                                  >
                                    {/* Role Name (Left) */}
                                    <div className="min-w-0 pr-2">
                                      <span className="font-semibold text-sm text-kumo-strong block leading-tight">
                                        {perm.label}
                                      </span>
                                    </div>

                                    {/* Description (Center) */}
                                    <div className="min-w-0 pr-3">
                                      <p className="text-[13px] text-kumo-default leading-relaxed">
                                        {perm.description}
                                      </p>
                                    </div>

                                    {/* Toggle Switch (Right) */}
                                    <div className="flex items-center justify-end pl-2">
                                      <ToggleSwitch
                                        checked={isChecked}
                                        onChange={() => togglePolicyPermission(perm.label)}
                                        ariaLabel={`Toggle ${perm.label}`}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                    </>
                  )}
                </div>

                {/* Bottom Footer Actions matching Screenshot 1 & 2 */}
                <div className="p-4 border-t border-kumo-line bg-kumo-canvas/40 flex items-center justify-between gap-3">
                  {/* Red Delete Button (Far Left) */}
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={handleDeletePolicy}
                    className="h-9 px-4 text-[13px] font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs"
                  >
                    Delete
                  </Button>

                  {/* Cancel & Save (Right) */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => navigate('/accounts')}
                      className="h-9 px-4 text-[13px] font-medium"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="button"
                      disabled={!editRole}
                      onClick={() => handleSaveRouteAndPolicies()}
                      className="h-9 px-5 text-[13px] font-semibold shadow-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GROUPS & ZONE CONFIGURATION */}
        {staffSubTab === 'groups' && (
          <div className="border border-kumo-line rounded-2xl bg-kumo-base p-6 space-y-6 shadow-xs animate-in fade-in">
            <div className="pb-3 border-b border-kumo-line">
              <h2 className="text-sm font-bold text-kumo-strong">Zone & Operating Office Assignment</h2>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Configure physical office presence, dynamic routing patterns, and logistics delivery zone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-kumo-strong">Operating Zone</label>
                <Select
                  value={editZone}
                  onValueChange={(val) => setEditZone(String(val))}
                  options={[
                    { value: 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)', label: 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)' },
                    { value: 'Zone 2: Island Express (Victoria Island / Lekki / Ikoyi)', label: 'Zone 2: Island Express (Victoria Island / Lekki / Ikoyi)' },
                    { value: 'Zone 3: Greater Lagos & Inter-hub Trunk', label: 'Zone 3: Greater Lagos & Inter-hub Trunk' },
                    { value: 'Zone 4: Central Production Hub', label: 'Zone 4: Central Production Hub' },
                  ]}
                  placeholder="Select operating zone..."
                />
              </div>

              {/* Office */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-kumo-strong">Office</label>
                <Select
                  value={editOffice}
                  onValueChange={(val) => setEditOffice(String(val))}
                  options={(facilities && facilities.length > 0 ? facilities : [INITIAL_FACILITY]).map(f => ({
                    value: f.name,
                    label: f.name
                  }))}
                  placeholder="Select assigned office..."
                />
              </div>

              {/* Route Input with Green Validation Checkmark */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-kumo-strong">Route Pattern</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. ops.smokeyhut.com/kitchen/*"
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-sans"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                  </div>
                </div>
                <p className="text-[13px] text-kumo-subtle leading-relaxed">
                  Use wildcard patterns (*) to define operator terminal bindings and station routing.
                </p>
              </div>

              {/* Email Address with Green Checkmark */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-kumo-strong">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="operator@smokeyhut.com"
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-sans"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-kumo-line flex justify-end">
              <Button
                variant="primary"
                type="button"
                onClick={() => handleSaveRouteAndPolicies()}
                className="h-9 px-5 text-[13px] font-semibold shadow-xs"
              >
                Save Group Changes
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNT SETTINGS */}
        {staffSubTab === 'settings' && (
          <div className="border border-kumo-line rounded-2xl bg-kumo-base p-6 space-y-6 shadow-xs animate-in fade-in">
            <div className="pb-3 border-b border-kumo-line">
              <h2 className="text-sm font-bold text-kumo-strong">Account Security & Credentials</h2>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Reset passwords, inspect audit logs, and toggle account access state.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-xl border border-kumo-line bg-kumo-canvas/50">
                <div>
                  <h3 className="text-sm font-bold text-kumo-strong">Change Staff Password</h3>
                  <p className="text-[13px] text-kumo-subtle mt-0.5">
                    Issue a temporary password or generate a random high-entropy token.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAccountToChangePassword(targetStaff)
                    setNewPasswordVal(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
                  }}
                  leftIcon={<Key className="w-3.5 h-3.5" />}
                  className="text-[13px]"
                >
                  Reset
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-kumo-line bg-kumo-canvas/50">
                <div>
                  <h3 className="text-sm font-bold text-kumo-strong">Account Status</h3>
                  <p className="text-[13px] text-kumo-subtle mt-0.5">
                    Currently <strong>{targetStaff.status === 'suspended' ? 'Suspended' : 'Active'}</strong>.
                  </p>
                </div>
                <Button
                  variant={targetStaff.status === 'suspended' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateAccount(targetStaff.email, {
                      status: targetStaff.status === 'suspended' ? 'active' : 'suspended'
                    })
                    showToast(`Updated account status to ${targetStaff.status === 'suspended' ? 'active' : 'suspended'}`, 'info')
                  }}
                  className="text-[13px]"
                >
                  {targetStaff.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: DEDICATED ROLE MATRIX PAGE (Screenshot 2 & Screenshot 1 style)
  // =========================================================================
  if (isMatrixPage) {
    const isScopeSelected = Boolean(matrixScope)
    const totalCount = allPolicyItems.length
    const activeMatrixCount = matrixPermissions.length

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto pb-16">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Back to team accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Role & Permission</h1>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Define and manage system-wide role policies, authority scopes, and functional operational access across all offices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => navigate('/accounts')}
              className="h-10 px-4 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!isScopeSelected}
              onClick={handleSaveMatrixPolicy}
              className="h-10 px-4 text-[13px] font-semibold shadow-xs"
            >
              Create policy
            </Button>
          </div>
        </div>

        {/* Create Policy Card (Exact match to Screenshot 2 & Screenshot 1) */}
        <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
          {/* Card Header: 16px (text-base font-semibold) */}
          <div className="p-5 border-b border-kumo-line bg-kumo-canvas/40">
            <h2 className="text-base font-semibold text-kumo-strong">Create policy</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Top Scope Selectors Row: 40px height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="w-full">
                <Select
                  value={matrixScope}
                  onValueChange={(val) => handleMatrixScopeChange(String(val))}
                  options={roleScopeOptions}
                  placeholder="Select a scope..."
                  buttonClassName="h-10 text-[13px]"
                />
              </div>

              <div className="w-full">
                <Select
                  value={matrixAppliesTo}
                  onValueChange={(val) => setMatrixAppliesTo(String(val))}
                  groups={[
                    {
                      label: 'ACCOUNT-LEVEL',
                      options: [
                        { value: 'Entire account', label: 'Entire account' },
                      ]
                    },
                    {
                      label: 'RESOURCE-SPECIFIC',
                      options: (facilities && facilities.length > 0 ? facilities : [INITIAL_FACILITY]).map(f => ({
                        value: f.name,
                        label: f.name
                      }))
                    }
                  ]}
                  placeholder="Applies to..."
                  buttonClassName="h-10 text-[13px]"
                />
              </div>
            </div>

            {/* When NO scope is selected yet: EXACT MATCH TO SCREENSHOT 2 */}
            {!isScopeSelected ? (
              <div className="border-2 border-dashed border-kumo-line rounded-2xl p-16 text-center my-6">
                <p className="text-[13px] text-kumo-subtle select-none font-medium">
                  Roles will appear after you select a scope.
                </p>
              </div>
            ) : (
              /* When Scope IS Selected: EXACT MATCH TO SCREENSHOT 1 */
              <div className="space-y-5 animate-in fade-in duration-200">
                <p className="text-[13px] text-kumo-default leading-relaxed">
                  Define what permissions <strong className="text-kumo-strong font-semibold">{SYSTEM_ROLE_CONFIGS.find(r => r.id === matrixScope)?.label || matrixScope}</strong> should have within the account-level scope: <strong className="text-kumo-strong font-semibold">{matrixAppliesTo}</strong>.
                </p>

                {/* Search Input matching Screenshot 1 */}
                <div className="relative">
                  <Search className="w-4 h-4 text-kumo-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                    placeholder="Search by role or permission name..."
                    className="w-full h-10 pl-10 pr-10 rounded-xl border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand transition-colors"
                  />
                  {matrixSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMatrixSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Accordion Categories matching Screenshot 1 */}
                <div className="border border-kumo-line rounded-xl overflow-hidden bg-kumo-base divide-y divide-kumo-line">
                  {policyCategoryGroups.map((group) => {
                    const isExpanded = matrixExpandedCats[group.name] ?? false
                    const categoryPermLabels = group.permissions.map(p => p.label)
                    const activeInGroup = categoryPermLabels.filter(label => matrixPermissions.includes(label))
                    const isAllGroupActive = activeInGroup.length === categoryPermLabels.length && categoryPermLabels.length > 0

                    const filteredInGroup = group.permissions.filter(p => {
                      const q = matrixSearchQuery.toLowerCase().trim()
                      if (!q) return true
                      return p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
                    })

                    if (matrixSearchQuery && filteredInGroup.length === 0) {
                      return null
                    }

                    return (
                      <div key={group.id} className="divide-y divide-kumo-line/60">
                        <div
                          onClick={() => setMatrixExpandedCats(prev => ({
                            ...prev,
                            [group.name]: !isExpanded
                          }))}
                          className="flex items-center justify-between px-5 py-3.5 bg-kumo-canvas/40 hover:bg-kumo-canvas/80 transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-kumo-subtle" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-kumo-subtle" />
                            )}
                            <span className="font-semibold text-sm text-kumo-strong">{group.name}</span>
                          </div>

                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[13px] font-sans text-kumo-subtle font-medium">
                              {activeInGroup.length}/{group.permissions.length}
                            </span>
                            <ToggleSwitch
                              checked={isAllGroupActive}
                              onChange={() => toggleMatrixCategory(categoryPermLabels, isAllGroupActive)}
                              ariaLabel={`Toggle all ${group.name}`}
                            />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="divide-y divide-dashed divide-kumo-line/80 bg-kumo-base">
                            {filteredInGroup.map((perm) => {
                              const isChecked = matrixPermissions.includes(perm.label)
                              return (
                                <div
                                  key={perm.id}
                                  className="grid grid-cols-[1.5fr_2.5fr_auto] items-center gap-4 px-6 py-4 hover:bg-kumo-tint/20 transition-colors"
                                >
                                  <div className="min-w-0 pr-2">
                                    <span className="font-semibold text-sm text-kumo-strong block leading-tight">
                                      {perm.label}
                                    </span>
                                  </div>

                                  <div className="min-w-0 pr-3">
                                    <p className="text-[13px] text-kumo-default leading-relaxed">
                                      {perm.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-end pl-2">
                                    <ToggleSwitch
                                      checked={isChecked}
                                      onChange={() => toggleMatrixPolicy(perm.label)}
                                      ariaLabel={`Toggle ${perm.label}`}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Actions matching Screenshot 2 */}
          <div className="p-4 border-t border-kumo-line bg-kumo-canvas/40 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/accounts')}
              className="h-10 px-5 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={!isScopeSelected}
              onClick={handleSaveMatrixPolicy}
              className="h-10 px-6 text-[13px] font-semibold shadow-xs"
            >
              Create policy
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW: DEDICATED INVITE MEMBERS PAGE (Matching Reference Screenshot)
  // =========================================================================
  if (isInvitePage) {
    const activeOverallRolesCount = overallRolesList.filter(
      (r) => r.permissions.length > 0 && r.permissions.every((p: string) => invitePermissions.includes(p))
    ).length
    const isOverallMasterActive =
      overallRolesList.length > 0 && activeOverallRolesCount === overallRolesList.length

    const handleToggleOverallMaster = (checked: boolean) => {
      if (checked) {
        const allRolesPerms = overallRolesList.flatMap((r) => r.permissions)
        setInvitePermissions((prev) => Array.from(new Set([...prev, ...allRolesPerms])))
      } else {
        const allRolesPerms = new Set(overallRolesList.flatMap((r) => r.permissions))
        setInvitePermissions((prev) => prev.filter((p) => !allRolesPerms.has(p)))
      }
    }

    const filteredOverallRoles = overallRolesList.filter((r) => {
      if (!inviteSearchQuery.trim()) return true
      const q = inviteSearchQuery.toLowerCase()
      return r.label.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    })

    const filteredCategories = policyCategoryGroups.filter((cat) => {
      if (!inviteSearchQuery.trim()) return true
      const q = inviteSearchQuery.toLowerCase()
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.permissions.some(
          (p) => p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        )
      )
    })

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto pb-16">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Back to team accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-kumo-strong">
              Invite members
            </h1>
          </div>
        </div>

        {/* 1. CARD: Add email addresses */}
        <div className="rounded-2xl border border-kumo-line bg-kumo-base p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-kumo-strong">
            <span>Add email addresses</span>
            <Tooltip content="Enter one or multiple email addresses separated by commas, spaces, or lines.">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-kumo-line text-[11px] font-medium text-kumo-subtle hover:text-kumo-strong cursor-help transition-colors">
                i
              </span>
            </Tooltip>
          </div>
          <div>
            <textarea
              rows={2}
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="first@example.com, second@example.com"
              className="w-full px-4 py-3 text-[13px] font-sans rounded-xl border border-kumo-line bg-kumo-base text-kumo-strong placeholder:text-kumo-subtle/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none shadow-2xs"
            />
            {parsedInviteEmails.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[13px] font-medium text-kumo-subtle mr-1">
                  {validEmails.length} valid {validEmails.length === 1 ? 'recipient' : 'recipients'}:
                </span>
                {parsedInviteEmails.map((email, idx) => {
                  const isValid = emailRegex.test(email)
                  return (
                    <span
                      key={idx}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium border",
                        isValid
                          ? "bg-kumo-tint border-kumo-line text-kumo-strong"
                          : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                      )}
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = parsedInviteEmails.filter((_, i) => i !== idx).join(', ')
                          setInviteEmails(updated)
                        }}
                        className="hover:text-red-500 ml-0.5 cursor-pointer"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. CARD: Add permission policies */}
        <div className="rounded-2xl border border-kumo-line bg-kumo-base p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-kumo-strong">
            <span>Add permission policies</span>
            <Tooltip content="Define access boundaries and operational permissions granted to the invited members.">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-kumo-line text-[11px] font-medium text-kumo-subtle hover:text-kumo-strong cursor-help transition-colors">
                i
              </span>
            </Tooltip>
          </div>

          {/* Top Scope Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              value={inviteScope}
              onValueChange={(val) => setInviteScope(String(val))}
              groups={[
                {
                  label: 'ACCOUNT-LEVEL',
                  options: [
                    { label: "Ayodine47@gmail.com's Account", value: "Ayodine47@gmail.com's Account" },
                    { label: 'SmokeyOps Core Enterprise', value: 'SmokeyOps Core Enterprise' },
                  ]
                },
                {
                  label: 'RESOURCE-SPECIFIC',
                  options: (facilities && facilities.length > 0 ? facilities : [INITIAL_FACILITY]).map(f => ({
                    label: f.name,
                    value: f.name
                  }))
                }
              ]}
              className="w-full"
            />
            <Select
              value={inviteResourceScope}
              onValueChange={(val) => setInviteResourceScope(String(val))}
              options={[
                { label: 'Entire account', value: 'Entire account' },
                { label: 'Central Kitchen Production Unit', value: 'Central Kitchen Production Unit' },
                { label: 'Logistics & Fleet Dispatch Staging', value: 'Logistics & Fleet Dispatch Staging' },
                { label: 'Main Storage Warehouse & Cold Depots', value: 'Main Storage Warehouse & Cold Depots' },
                { label: 'Retail & Counter Ordering', value: 'Retail & Counter Ordering' }
              ]}
              className="w-full"
            />
          </div>

          {/* Dynamic description matching screenshot */}
          <p className="text-[13px] text-kumo-subtle font-normal">
            Define what permissions <strong className="text-kumo-strong font-semibold">{validEmails.length} {validEmails.length === 1 ? 'member' : 'members'}</strong> should have within the account-level scope: <strong className="text-kumo-strong font-semibold">{inviteScope}</strong>.
          </p>

          {/* Search by role name */}
          <div className="relative">
            <Search className="w-4 h-4 text-kumo-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inviteSearchQuery}
              onChange={(e) => setInviteSearchQuery(e.target.value)}
              placeholder="Search by role name..."
              className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-xl border border-kumo-line bg-kumo-base text-kumo-strong placeholder:text-kumo-subtle/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-2xs"
            />
            {inviteSearchQuery && (
              <button
                type="button"
                onClick={() => setInviteSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Accordion Categories */}
          <div className="border border-kumo-line rounded-xl overflow-hidden divide-y divide-kumo-line bg-kumo-base">
            {/* 1. OVERALL ROLES ACCORDION */}
            {filteredOverallRoles.length > 0 && (
              <div className="transition-colors">
                <div className="flex items-center justify-between px-4 py-3 bg-kumo-tint/20 hover:bg-kumo-tint/30 transition-colors">
                  <button
                    type="button"
                    onClick={() =>
                      setInviteExpandedCats((prev) => ({ ...prev, overall: !prev['overall'] }))
                    }
                    className="flex items-center gap-2 text-left cursor-pointer grow select-none"
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-kumo-subtle transition-transform duration-200",
                        !inviteExpandedCats['overall'] && "-rotate-90"
                      )}
                    />
                    <span className="text-sm font-semibold text-kumo-strong">Overall roles</span>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13px] font-mono text-kumo-subtle font-medium">
                      {activeOverallRolesCount}/{overallRolesList.length}
                    </span>
                    <Toggle
                      checked={isOverallMasterActive}
                      onChange={handleToggleOverallMaster}
                      size="md"
                    />
                  </div>
                </div>

                {inviteExpandedCats['overall'] && (
                  <div className="px-4 py-1 divide-y divide-dashed divide-kumo-line/60">
                    {filteredOverallRoles.map((role) => {
                      const isRoleActive =
                        role.permissions.length > 0 &&
                        role.permissions.every((p: string) => invitePermissions.includes(p))

                      const handleRoleToggle = (checked: boolean) => {
                        if (checked) {
                          setInvitePermissions((prev) => Array.from(new Set([...prev, ...role.permissions])))
                        } else {
                          const removeSet = new Set(role.permissions)
                          setInvitePermissions((prev) => prev.filter((p) => !removeSet.has(p)))
                        }
                      }

                      return (
                        <div
                          key={role.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-3.5 hover:bg-kumo-tint/10 transition-colors"
                        >
                          <div className="md:col-span-4">
                            <span className="text-sm font-semibold text-kumo-strong block">
                              {role.label}
                            </span>
                          </div>
                          <div className="md:col-span-7">
                            <span className="text-[13px] text-kumo-subtle leading-relaxed block">
                              {role.description}
                            </span>
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            <Toggle
                              checked={isRoleActive}
                              onChange={handleRoleToggle}
                              size="md"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. OPERATIONAL POLICY CATEGORIES */}
            {filteredCategories.map((category) => {
              const totalInCat = category.permissions.length
              const activeInCat = category.permissions.filter((p) =>
                invitePermissions.includes(p.label)
              ).length
              const isCategoryMasterActive = totalInCat > 0 && activeInCat === totalInCat
              const isCatExpanded = Boolean(inviteExpandedCats[category.name])

              const handleCategoryMasterToggle = (checked: boolean) => {
                const labels = category.permissions.map((p) => p.label)
                if (checked) {
                  setInvitePermissions((prev) => Array.from(new Set([...prev, ...labels])))
                } else {
                  const set = new Set(labels)
                  setInvitePermissions((prev) => prev.filter((p) => !set.has(p)))
                }
              }

              const visiblePermissions = category.permissions.filter((p) => {
                if (!inviteSearchQuery.trim()) return true
                const q = inviteSearchQuery.toLowerCase()
                return p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
              })

              if (visiblePermissions.length === 0) return null

              return (
                <div key={category.id} className="transition-colors">
                  <div className="flex items-center justify-between px-4 py-3 bg-kumo-tint/20 hover:bg-kumo-tint/30 transition-colors">
                    <button
                      type="button"
                      onClick={() =>
                        setInviteExpandedCats((prev) => ({
                          ...prev,
                          [category.name]: !prev[category.name],
                        }))
                      }
                      className="flex items-center gap-2 text-left cursor-pointer grow select-none"
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-kumo-subtle transition-transform duration-200",
                          !isCatExpanded && "-rotate-90"
                        )}
                      />
                      <span className="text-sm font-semibold text-kumo-strong">{category.name}</span>
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[13px] font-mono text-kumo-subtle font-medium">
                        {activeInCat}/{totalInCat}
                      </span>
                      <Toggle
                        checked={isCategoryMasterActive}
                        onChange={handleCategoryMasterToggle}
                        size="md"
                      />
                    </div>
                  </div>

                  {isCatExpanded && (
                    <div className="px-4 py-1 divide-y divide-dashed divide-kumo-line/60">
                      {visiblePermissions.map((perm) => {
                        const isPermActive = invitePermissions.includes(perm.label)

                        const handlePermToggle = (checked: boolean) => {
                          if (checked) {
                            setInvitePermissions((prev) => Array.from(new Set([...prev, perm.label])))
                          } else {
                            setInvitePermissions((prev) => prev.filter((p) => p !== perm.label))
                          }
                        }

                        return (
                          <div
                            key={perm.id}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-3.5 hover:bg-kumo-tint/10 transition-colors"
                          >
                            <div className="md:col-span-4">
                              <span className="text-sm font-semibold text-kumo-strong block">
                                {perm.label}
                              </span>
                            </div>
                            <div className="md:col-span-7">
                              <span className="text-[13px] text-kumo-subtle leading-relaxed block">
                                {perm.description}
                              </span>
                            </div>
                            <div className="md:col-span-1 flex justify-end">
                              <Toggle
                                checked={isPermActive}
                                onChange={handlePermToggle}
                                size="md"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center justify-between pt-4 border-t border-kumo-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounts')}
              className="h-10 px-5 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-kumo-subtle hidden sm:inline">
                {validEmails.length > 0
                  ? `Ready to invite ${validEmails.length} member${validEmails.length === 1 ? '' : 's'}`
                  : 'Enter email address to continue'}
              </span>
              <Button
                type="button"
                variant="primary"
                disabled={validEmails.length === 0}
                onClick={handleInviteSubmit}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="h-10 px-6 text-[13px] font-semibold shadow-xs"
              >
                Invite members
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 3: MAIN TEAM ACCOUNTS TABLE PAGE
  // =========================================================================
  return (
    <div className="space-y-6 font-sans">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Manage Accounts"
        subtitle="Display team members, configure system permissions, and manage access credentials across all offices."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/accounts/matrix')}
              leftIcon={<Shield className="w-4 h-4 text-kumo-subtle" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Role & Permission
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/accounts/invite')}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-semibold shadow-xs"
            >
              Invite Members
            </Button>
          </>
        }
      />

      {/* 2. KUMO TABS */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Accounts', badge: availableAccounts.length },
            { id: 'active', label: 'Active', badge: activeCount },
            { id: 'inactive', label: 'Inactive', badge: inactiveCount > 0 ? inactiveCount : undefined },
          ]}
        />
      </div>

      {/* 3. MAIN DATA TABLE */}
      <div>
        <DataTable<AppUserAccount>
          data={tableData}
          columns={accountColumns}
          searchable={true}
          searchPlaceholder="Filter team members by name, email, role, office..."
          searchFilter={(acc, q) =>
            Boolean(
              acc.name.toLowerCase().includes(q) ||
              acc.email.toLowerCase().includes(q) ||
              acc.roleLabel.toLowerCase().includes(q) ||
              (acc.assigned_hub && acc.assigned_hub.toLowerCase().includes(q)) ||
              (acc.permissions && acc.permissions.some(p => p.toLowerCase().includes(q)))
            )
          }
          title="Team Members"
          exportFilename="smokey-team-accounts.csv"
          enableRowSelection={true}
          onRowClick={(acc) => navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)}
          filterCategories={[
            {
              name: 'Role Scope',
              key: 'role',
              options: [
                { label: 'All Roles', value: 'all' },
                ...SYSTEM_ROLE_CONFIGS.map(r => ({ label: r.label, value: r.id }))
              ],
              activeValue: selectedRoleFilter,
              onChange: setSelectedRoleFilter
            },
            {
              name: 'Office',
              key: 'office',
              options: [
                { label: 'All Offices', value: 'all' },
                ...(facilities && facilities.length > 0 ? facilities : [INITIAL_FACILITY]).map(f => ({
                  label: f.name,
                  value: f.name
                }))
              ],
              activeValue: selectedOfficeFilter,
              onChange: setSelectedOfficeFilter
            }
          ]}
          bulkActions={[
            {
              label: 'Export Selected',
              icon: <Download className="w-3.5 h-3.5" />,
              onClick: handleBulkExport
            }
          ]}
        />
      </div>

      {/* 4. SUB-MODALS */}

      {/* CHANGE PASSWORD MODAL */}
      <Dialog
        isOpen={Boolean(accountToChangePassword)}
        onClose={() => setAccountToChangePassword(null)}
        title="Reset Operator Password"
        description={`Set a new secure access credential for ${accountToChangePassword?.name}.`}
        maxWidth="md"
      >
        {accountToChangePassword && (
          <form onSubmit={handleSavePassword} className="space-y-4 font-sans text-left">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-kumo-strong">New Password</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full h-9 pl-3 pr-20 rounded-lg border border-kumo-line bg-kumo-base text-[13px] font-sans text-kumo-strong focus:outline-none focus:border-kumo-brand"
                />
                <button
                  type="button"
                  onClick={() => setNewPasswordVal(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireReset"
                checked={requirePassReset}
                onChange={(e) => setRequirePassReset(e.target.checked)}
                className="rounded border-kumo-line text-primary focus:ring-primary size-3.5"
              />
              <label htmlFor="requireReset" className="text-[13px] text-kumo-default cursor-pointer select-none">
                Require password change upon next login
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAccountToChangePassword(null)}
                className="h-9 px-4 text-[13px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="h-9 px-4 text-[13px] font-semibold"
              >
                Update Password
              </Button>
            </div>
          </form>
        )}
      </Dialog>



      {/* DELETE ACCOUNT CONFIRMATION */}
      <Dialog
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        title="Remove Team Member"
        description="Are you sure you want to permanently remove this operator account? Access privileges will be revoked immediately."
        maxWidth="sm"
      >
        {accountToDelete && (
          <div className="space-y-4 font-sans text-left">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-red-900 dark:text-red-200">
                <p className="font-semibold text-base">{accountToDelete.name}</p>
                <p className="text-sm opacity-80">{accountToDelete.email}</p>
                <p className="text-sm opacity-80 mt-1">
                  Assigned role: <strong>{accountToDelete.roleLabel}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="h-10 px-4 text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 px-4 text-sm font-semibold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
export default ManageAccountsPage
