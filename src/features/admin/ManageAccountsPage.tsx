import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Users,
  Search,
  Download,
  Trash2,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
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
  Check,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Briefcase,
  Bike,
  Flame,
  ChefHat,
  Package,
  Truck,
  Navigation,
  SlidersHorizontal,
  Wallet,
  ExternalLink
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { Select } from '@/components/ui/Select'
import { Toggle, ToggleSwitch } from '@/components/ui/Toggle'
import { useSmokeyOps, AppUserAccount, UserRole, ROLE_DEFAULT_PERMISSIONS, getStaffKycData } from '@/context/SmokeyOpsContext'
import { useWarehouse, INITIAL_FACILITY } from '@/context/WarehouseContext'
import { cn, formatNaira } from '@/lib/utils'
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
          'w-60 min-w-[230px] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 font-sans text-[13px] animate-in fade-in zoom-in-95 divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 select-none overflow-y-auto',
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
  onEditProfile: (email: string) => void
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
  onEditProfile,
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
      <Tooltip content="Edit staff profile and verified KYC dossier">
        <TableActionButton
          variant="outline"
          onClick={() => onEditProfile(acc.email)}
          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
        >
          Edit Profile
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
        <div className="py-0.5 space-y-0.5">
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onEditProfile(acc.email)
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors whitespace-nowrap block"
          >
            Edit Profile & KYC
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onChangeRole(acc)
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors whitespace-nowrap block"
          >
            Change Role & Permissions
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onInspectPermissions(acc)
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors whitespace-nowrap block"
          >
            View Policy Matrix
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenuEmail(null)
              onChangePassword(acc)
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors whitespace-nowrap block"
          >
            Change Password
          </button>
          {acc.email.toLowerCase() !== activeAccountEmail.toLowerCase() && (
            <button
              type="button"
              onClick={() => {
                setOpenMenuEmail(null)
                onSwitchAccount(acc.email)
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors whitespace-nowrap block"
            >
              Switch to Account
            </button>
          )}
        </div>
        <div className="py-0.5 pt-1">
          <button
            type="button"
            disabled={availableAccounts.length <= 1}
            onClick={() => {
              setOpenMenuEmail(null)
              onDeleteAccount(acc)
            }}
            className={cn(
              'w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap',
              availableAccounts.length <= 1
                ? 'opacity-40 cursor-not-allowed text-zinc-400'
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

interface ProfileFieldRowProps {
  label: string
  description?: React.ReactNode
  required?: boolean
  children: React.ReactNode
}

const ProfileFieldRow: React.FC<ProfileFieldRowProps> = ({
  label,
  description,
  required,
  children
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-kumo-canvas/20 transition-colors">
      <div className="min-w-0 pr-4">
        <label className="block text-[12px] font-semibold text-kumo-strong leading-4">
          {label}
          {required && <span className="text-kumo-danger ml-0.5">*</span>}
        </label>
        {description && (
          <p className="text-[13px] text-kumo-subtle mt-0.5 leading-normal">{description}</p>
        )}
      </div>
      <div className="w-full sm:w-80 shrink-0 flex justify-end">
        {children}
      </div>
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
  const isProfilePage = location.pathname.includes('/accounts/profile')
  const isRoutePage = location.pathname.includes('/accounts/route')
  const isMatrixPage = location.pathname.includes('/accounts/matrix')
  
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
  const [staffSubTab, setStaffSubTab] = useState<'policies' | 'groups'>('policies')
  const [editDepartment, setEditDepartment] = useState('')
  const [editShiftSchedule, setEditShiftSchedule] = useState('Morning Cook & Prep (06:00 - 15:00)')

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
      setEditZone(targetStaff.assigned_zone || 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
      setEditDepartment(targetStaff.department || 'Operations')
      setEditShiftSchedule(targetStaff.shift_schedule || 'Morning Cook & Prep (06:00 - 15:00)')
      setPolicyScope('Operating Office')
      setPolicyAppliesTo(officeName)
      setEditPermissions(targetStaff.permissions || ROLE_DEFAULT_PERMISSIONS[targetStaff.role] || [])
      setIsEditingPolicy(true)
    }
  }, [targetStaff, facilities])

  // -------------------------------------------------------------
  // STAFF PROFILE & KYC CONSTANTS & STATE
  // -------------------------------------------------------------
  const NIGERIAN_STATES = useMemo(() => [
    { value: 'Lagos State', label: 'Lagos State' },
    { value: 'Abuja (FCT)', label: 'Abuja (FCT)' },
    { value: 'Ogun State', label: 'Ogun State' },
    { value: 'Oyo State', label: 'Oyo State' },
    { value: 'Rivers State', label: 'Rivers State' },
    { value: 'Kano State', label: 'Kano State' },
    { value: 'Edo State', label: 'Edo State' },
    { value: 'Delta State', label: 'Delta State' },
    { value: 'Kaduna State', label: 'Kaduna State' },
    { value: 'Enugu State', label: 'Enugu State' },
  ], [])

  const EMPLOYMENT_STATUS_OPTIONS = useMemo(() => [
    { value: 'full_time', label: 'Full-Time Permanent Staff' },
    { value: 'contract', label: 'Fixed-Term Operational Contract' },
    { value: 'probation', label: 'Probationary Vetting (90 Days)' },
    { value: 'part_time', label: 'Part-Time / Weekend Operations' },
  ], [])

  const SHIFT_SCHEDULE_OPTIONS = useMemo(() => [
    { value: 'Morning Cook & Prep (06:00 - 15:00)', label: 'Morning Cook & Prep (06:00 - 15:00)' },
    { value: 'Evening Smoke Shift (14:00 - 23:00)', label: 'Evening Smoke Shift (14:00 - 23:00)' },
    { value: 'Day Delivery Dispatch (08:00 - 18:00)', label: 'Day Delivery Dispatch (08:00 - 18:00)' },
    { value: 'Morning Intake & Audit (07:00 - 16:00)', label: 'Morning Intake & Audit (07:00 - 16:00)' },
    { value: 'All-Day Fulfillment (08:00 - 18:00)', label: 'All-Day Fulfillment (08:00 - 18:00)' },
    { value: 'General Executive Operations', label: 'General Executive Operations' },
  ], [])

  const NIGERIAN_BANKS = useMemo(() => [
    { value: 'Guaranty Trust Bank (GTBank)', label: 'Guaranty Trust Bank (GTBank)' },
    { value: 'Zenith Bank', label: 'Zenith Bank' },
    { value: 'Access Bank', label: 'Access Bank' },
    { value: 'First Bank of Nigeria', label: 'First Bank of Nigeria' },
    { value: 'United Bank for Africa (UBA)', label: 'United Bank for Africa (UBA)' },
    { value: 'Kuda Microfinance Bank', label: 'Kuda Microfinance Bank' },
    { value: 'Moniepoint Microfinance Bank', label: 'Moniepoint Microfinance Bank' },
    { value: 'OPay Digital Services', label: 'OPay Digital Services' },
    { value: 'Stanbic IBTC Bank', label: 'Stanbic IBTC Bank' },
    { value: 'Fidelity Bank', label: 'Fidelity Bank' },
    { value: 'Wema Bank (ALAT)', label: 'Wema Bank (ALAT)' },
  ], [])

  const KIN_RELATIONSHIP_OPTIONS = useMemo(() => [
    { value: 'Spouse', label: 'Spouse (Husband / Wife)' },
    { value: 'Parent', label: 'Parent (Father / Mother)' },
    { value: 'Sibling', label: 'Sibling (Brother / Sister)' },
    { value: 'Child', label: 'Adult Child' },
    { value: 'Guardian', label: 'Legal Guardian' },
    { value: 'Relative', label: 'Extended Family Relative' },
  ], [])

  const GUARANTOR_STATUS_OPTIONS = useMemo(() => [
    { value: 'verified', label: 'Verified & Statutory ID on File' },
    { value: 'signed', label: 'Guarantor Form Signed (Pending Final Vetting)' },
    { value: 'pending', label: 'Awaiting Guarantor Submission' },
  ], [])

  // Profile Form States
  const [profileFullName, setProfileFullName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileDob, setProfileDob] = useState('')
  const [profileNin, setProfileNin] = useState('')
  const [profileBvn, setProfileBvn] = useState('')
  const [profileAddress, setProfileAddress] = useState('')
  const [profileCity, setProfileCity] = useState('')
  const [profileState, setProfileState] = useState('Lagos State')
  const [profileRole, setProfileRole] = useState<UserRole>('kitchen')
  const [profileHub, setProfileHub] = useState('Yaba Head Office')
  const [profileDepartment, setProfileDepartment] = useState('Culinary Production')
  const [profileEmploymentStatus, setProfileEmploymentStatus] = useState<'full_time' | 'contract' | 'probation' | 'part_time'>('full_time')
  const [profileShiftSchedule, setProfileShiftSchedule] = useState('Morning Cook & Prep (06:00 - 15:00)')
  const [profileStatus, setProfileStatus] = useState<'active' | 'suspended'>('active')

  // Next-of-Kin & Guarantor State
  const [profileEmergencyName, setProfileEmergencyName] = useState('')
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState('')
  const [profileEmergencyRelationship, setProfileEmergencyRelationship] = useState('Spouse')
  const [profileGuarantorName, setProfileGuarantorName] = useState('')
  const [profileGuarantorPhone, setProfileGuarantorPhone] = useState('')
  const [profileGuarantorRelationship, setProfileGuarantorRelationship] = useState('Corporate Merchant / Landlord')
  const [profileGuarantorStatus, setProfileGuarantorStatus] = useState<'verified' | 'signed' | 'pending'>('verified')

  // Bank & Settlement State
  const [profileBankName, setProfileBankName] = useState('Guaranty Trust Bank (GTBank)')
  const [profileBankAccountNumber, setProfileBankAccountNumber] = useState('')
  const [profileBankAccountName, setProfileBankAccountName] = useState('')

  // Role-Specific KYC States
  // Rider
  const [kycLicenseNumber, setKycLicenseNumber] = useState('')
  const [kycLicenseExpiry, setKycLicenseExpiry] = useState('')
  const [kycVehicleType, setKycVehicleType] = useState('Bajaj Boxer 150 Motorcycle')
  const [kycPlateNumber, setKycPlateNumber] = useState('')
  const [kycVehicleOwnership, setKycVehicleOwnership] = useState('Smokey Fleet Unit #04')
  const [kycCodLimit, setKycCodLimit] = useState(50000)
  const [kycAssignedZone, setKycAssignedZone] = useState('Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
  const [kycInspectionStatus, setKycInspectionStatus] = useState('Passed & Certified')


  useEffect(() => {
    if (targetStaff) {
      const data = getStaffKycData(targetStaff)
      setProfileFullName(data.name || '')
      setProfileEmail(data.email || '')
      setProfilePhone(data.phone || '')
      setProfileDob(data.date_of_birth || '')
      setProfileNin(data.national_id_nin || '')
      setProfileBvn(data.bvn || '')
      setProfileAddress(data.residential_address || '')
      setProfileCity(data.city || 'Lagos Mainland')
      setProfileState(data.state || 'Lagos State')
      setProfileRole(data.role)
      setProfileHub(data.assigned_hub || facilities[0]?.name || 'Yaba Head Office')
      setProfileDepartment(data.department || '')
      setProfileEmploymentStatus(data.employment_status || 'full_time')
      setProfileShiftSchedule(data.shift_schedule || '')
      setProfileStatus(data.status === 'suspended' ? 'suspended' : 'active')

      setProfileEmergencyName(data.emergency_contact || '')
      setProfileEmergencyPhone(data.emergency_phone || '')
      setProfileEmergencyRelationship(data.emergency_relationship || 'Spouse')
      setProfileGuarantorName(data.guarantor_name || '')
      setProfileGuarantorPhone(data.guarantor_phone || '')
      setProfileGuarantorRelationship(data.guarantor_relationship || '')
      setProfileGuarantorStatus(data.guarantor_status || 'verified')

      setProfileBankName(data.bank_name || 'Guaranty Trust Bank (GTBank)')
      setProfileBankAccountNumber(data.bank_account_number || '')
      setProfileBankAccountName(data.bank_account_name || data.name || '')

      setKycLicenseNumber(data.license_number || '')
      setKycLicenseExpiry(data.license_expiry || '')
      setKycVehicleType(data.vehicle_type || 'Bajaj Boxer 150 Motorcycle')
      setKycPlateNumber(data.plate_number || '')
      setKycVehicleOwnership(data.vehicle_ownership || 'Smokey Fleet Unit #04')
      setKycCodLimit(data.cod_limit || 50000)
      setKycAssignedZone(data.assigned_zone || 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
      setKycInspectionStatus(data.inspection_status || 'Passed & Certified')

    }
  }, [targetStaff, facilities])

  const handleSaveProfile = () => {
    if (!targetStaff) return
    const roleConfig = SYSTEM_ROLE_CONFIGS.find(r => r.id === profileRole)
    const updates: Partial<AppUserAccount> = {
      name: profileFullName.trim() || targetStaff.name,
      email: profileEmail.trim() || targetStaff.email,
      phone: profilePhone.trim(),
      date_of_birth: profileDob,
      national_id_nin: profileNin.trim(),
      bvn: profileBvn.trim(),
      residential_address: profileAddress.trim(),
      city: profileCity.trim(),
      state: profileState,
      role: profileRole,
      roleLabel: roleConfig?.label || targetStaff.roleLabel,
      assigned_hub: profileHub,
      department: profileDepartment.trim(),
      employment_status: profileEmploymentStatus,
      shift_schedule: profileShiftSchedule,
      status: profileStatus,

      emergency_contact: profileEmergencyName.trim(),
      emergency_phone: profileEmergencyPhone.trim(),
      emergency_relationship: profileEmergencyRelationship,
      guarantor_name: profileGuarantorName.trim(),
      guarantor_phone: profileGuarantorPhone.trim(),
      guarantor_relationship: profileGuarantorRelationship.trim(),
      guarantor_status: profileGuarantorStatus,

      bank_name: profileBankName,
      bank_account_number: profileBankAccountNumber.trim(),
      bank_account_name: profileBankAccountName.trim() || profileFullName.trim(),

      // Rider fields
      license_number: kycLicenseNumber.trim(),
      license_expiry: kycLicenseExpiry,
      vehicle_type: kycVehicleType,
      plate_number: kycPlateNumber.trim().toUpperCase(),
      vehicle_ownership: kycVehicleOwnership,
      cod_limit: Number(kycCodLimit) || 50000,
      assigned_zone: kycAssignedZone,
      inspection_status: kycInspectionStatus,

    }

    updateAccount(targetStaff.email, updates)
    showToast(`Saved staff KYC profile & verified dossier for ${updates.name}`, 'success', 'Profile & KYC Saved')

    if (updates.email && updates.email.toLowerCase() !== targetStaff.email.toLowerCase()) {
      navigate(`/accounts/profile/${encodeURIComponent(updates.email)}`, { replace: true })
    }
  }

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
  const [showResetPassword, setShowResetPassword] = useState(false)

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
      assigned_zone: editZone,
      department: editDepartment.trim(),
      shift_schedule: editShiftSchedule,
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
        <div
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/accounts/profile/${encodeURIComponent(acc.email)}`)
          }}
          className="cursor-pointer group select-none"
          title="Click to view & edit staff KYC profile"
        >
          <div className="font-semibold text-kumo-strong text-[14px] font-sans group-hover:text-primary group-hover:underline underline-offset-2">
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
        <span
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/accounts/profile/${encodeURIComponent(acc.email)}`)
          }}
          className="text-[13px] text-kumo-subtle font-sans hover:text-kumo-strong cursor-pointer"
          title="Click to view & edit staff KYC profile"
        >
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
          onEditProfile={(email) => navigate(`/accounts/profile/${encodeURIComponent(email)}`)}
          onChangeRole={(account) => navigate(`/accounts/route/${encodeURIComponent(account.email)}`)}
          onInspectPermissions={(account) => navigate(`/accounts/matrix`)}
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
  // VIEW 0: DEDICATED STAFF PROFILE & KYC PAGE
  // =========================================================================
  if (isProfilePage && targetStaff) {
    const roleConfig = SYSTEM_ROLE_CONFIGS.find(r => r.id === profileRole)

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto pb-16">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Staff Profile & KYC</h1>
                <span className="text-kumo-subtle text-[16px] font-normal">/</span>
                <span className="text-[16px] font-semibold text-kumo-default">{targetStaff.name}</span>
              </div>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Manage personal details, branch assignment, emergency contacts, and payroll information for <strong className="text-kumo-strong">{targetStaff.name}</strong> ({targetStaff.email}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] text-kumo-subtle font-sans inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-kumo-line bg-kumo-base shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-kumo-subtle" />
              <span>Staff ID:</span>
              <strong className="text-kumo-strong">{targetStaff.staff_id || 'SHD-STAFF'}</strong>
            </span>
          </div>
        </div>

        {/* Clean Staff Profile & KYC Form Sections */}
        <div className="space-y-6">
          {/* Card 1: Personal Details & Identity */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Personal Details & Identity</h3>
                  <p className="text-[13px] text-kumo-subtle">Full legal name, contact information, date of birth, and identity numbers</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Full Legal Name"
                description="As registered on official identification documents"
                required
              >
                <Input
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                  placeholder="e.g. Yusuf Babatunde Balogun"
                  required
                  aria-label="Full Legal Name"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Official Work Email"
                description="Primary login and communication address"
                required
              >
                <Input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="e.g. ridersmokeyyusuf@gmail.com"
                  required
                  aria-label="Official Work Email"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Direct Phone Number"
                description="Mobile phone number with SMS and voice availability"
              >
                <Input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+234 802 345 6789"
                  aria-label="Direct Phone Number"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Date of Birth"
                description="Staff member's birth date for employment verification"
              >
                <Input
                  type="date"
                  value={profileDob}
                  onChange={(e) => setProfileDob(e.target.value)}
                  aria-label="Date of Birth"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="National Identity Number (NIN)"
                description="11-digit National Identity Number"
              >
                <Input
                  value={profileNin}
                  onChange={(e) => setProfileNin(e.target.value)}
                  placeholder="11-digit NIN"
                  aria-label="National Identity Number (NIN)"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Bank Verification Number (BVN)"
                description="11-digit Bank Verification Number (optional)"
              >
                <Input
                  value={profileBvn}
                  onChange={(e) => setProfileBvn(e.target.value)}
                  placeholder="11-digit BVN"
                  aria-label="Bank Verification Number (BVN)"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 2: Contact & Residential Address */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Contact & Residential Address</h3>
                  <p className="text-[13px] text-kumo-subtle">Physical street address and state of residence</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Residential Street Address"
                description="Primary residential street and dwelling number"
                required
              >
                <Input
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="e.g. 14 Herbert Macaulay Way, Alagomeji"
                  required
                  aria-label="Residential Street Address"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="City / Local Government (LGA)"
                description="City or local government authority area"
              >
                <Input
                  value={profileCity}
                  onChange={(e) => setProfileCity(e.target.value)}
                  placeholder="e.g. Lagos Mainland"
                  aria-label="City / Local Government (LGA)"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="State / Region"
                description="State of residence"
              >
                <Select
                  value={profileState}
                  onValueChange={(val) => setProfileState(String(val))}
                  options={NIGERIAN_STATES}
                  aria-label="State / Region"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 3: Branch & Employment Details */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Branch & Employment Details</h3>
                  <p className="text-[13px] text-kumo-subtle">Primary facility, department, role authority, and shift schedule</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Assigned Operating Facility / Hub"
                description="Primary physical branch, kitchen, or depot"
              >
                <Select
                  value={profileHub}
                  onValueChange={(val) => setProfileHub(String(val))}
                  options={facilities.map(f => ({ value: f.name, label: f.name }))}
                  aria-label="Assigned Operating Facility / Hub"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Staff Role Assignment"
                description="Operational role defining system access and baseline permissions"
              >
                <Select
                  value={profileRole}
                  onValueChange={(val) => {
                    const newR = val as UserRole
                    setProfileRole(newR)
                    const rCfg = SYSTEM_ROLE_CONFIGS.find(r => r.id === newR)
                    showToast(`Updated role to ${rCfg?.label || newR}`, 'info')
                  }}
                  options={SYSTEM_ROLE_CONFIGS.map(r => ({ value: r.id, label: r.label }))}
                  aria-label="Staff Role Assignment"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Employment Status"
                description="Staff engagement and contract classification"
              >
                <Select
                  value={profileEmploymentStatus}
                  onValueChange={(val) => setProfileEmploymentStatus(val as any)}
                  options={EMPLOYMENT_STATUS_OPTIONS}
                  aria-label="Employment Status"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Primary Operational Shift"
                description="Assigned rostered shift schedule"
              >
                <Select
                  value={profileShiftSchedule}
                  onValueChange={(val) => setProfileShiftSchedule(String(val))}
                  options={SHIFT_SCHEDULE_OPTIONS}
                  aria-label="Primary Operational Shift"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Operational Department"
                description="Operational work group"
              >
                <Input
                  value={profileDepartment}
                  onChange={(e) => setProfileDepartment(e.target.value)}
                  placeholder="e.g. Culinary Production"
                  aria-label="Operational Department"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Account Status"
                description="Access status across system logins"
              >
                <Select
                  value={profileStatus}
                  onValueChange={(val) => setProfileStatus(val as any)}
                  options={[
                    { value: 'active', label: 'Active - Normal Access' },
                    { value: 'suspended', label: 'Suspended - Login Disabled' }
                  ]}
                  aria-label="Account Status"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 4: Delivery Fleet & Driver Details (Rider Only) */}
          {profileRole === 'rider' && (
            <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs animate-in fade-in">
              <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-kumo-strong">Delivery Fleet & Driver Details</h3>
                    <p className="text-[13px] text-kumo-subtle">Assigned vehicle specifications, driver's license, and cash float limit</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-kumo-line/60">
                <ProfileFieldRow
                  label="Delivery Vehicle Type"
                  description="Vehicle model used for dispatch and orders"
                >
                  <Select
                    value={kycVehicleType}
                    onValueChange={(val) => setKycVehicleType(String(val))}
                    options={[
                      { value: 'Bajaj Boxer 150 Motorcycle', label: 'Bajaj Boxer 150 Motorcycle' },
                      { value: 'TVS King Deluxe Tricycle', label: 'TVS King Deluxe Tricycle' },
                      { value: 'Suzuki Super Carry Mini-Van', label: 'Suzuki Super Carry Mini-Van' },
                      { value: 'Haojue 125 Motorcycle', label: 'Haojue 125 Motorcycle' },
                      { value: 'Honda Ace 110 Delivery Edition', label: 'Honda Ace 110 Delivery Edition' },
                      { value: 'Electric EV Delivery Bike', label: 'Electric EV Delivery Bike' }
                    ]}
                    aria-label="Delivery Vehicle Type"
                  />
                </ProfileFieldRow>
                <ProfileFieldRow
                  label="Vehicle Plate Number"
                  description="Official state vehicle licensing plate"
                >
                  <Input
                    value={kycPlateNumber}
                    onChange={(e) => setKycPlateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. LND-482-XA"
                    aria-label="Vehicle Plate Number"
                  />
                </ProfileFieldRow>
                <ProfileFieldRow
                  label="Vehicle Ownership Model"
                  description="Company owned, privately owned, or partner leased"
                >
                  <Select
                    value={kycVehicleOwnership}
                    onValueChange={(val) => setKycVehicleOwnership(String(val))}
                    options={[
                      { value: 'Smokey Fleet Unit #04', label: 'Company Owned Fleet Unit' },
                      { value: 'Privately Owned Rider Bike', label: 'Privately Owned (Mileage/Allowance)' },
                      { value: 'Third-Party Partner Leased', label: 'Third-Party Partner Leased' }
                    ]}
                    aria-label="Vehicle Ownership Model"
                  />
                </ProfileFieldRow>
                <ProfileFieldRow
                  label="Primary Delivery Zone"
                  description="Core dispatch operating territory"
                >
                  <Select
                    value={kycAssignedZone}
                    onValueChange={(val) => setKycAssignedZone(String(val))}
                    options={[
                      { value: 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)', label: 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)' },
                      { value: 'Zone 2: Island Express (Victoria Island / Lekki / Ikoyi)', label: 'Zone 2: Island Express (Victoria Island / Lekki / Ikoyi)' },
                      { value: 'Zone 3: Greater Lagos & Inter-hub Trunk', label: 'Zone 3: Greater Lagos & Inter-hub Trunk' },
                      { value: 'Zone 4: Central Production Hub', label: 'Zone 4: Central Production Hub' },
                    ]}
                    aria-label="Primary Delivery Zone"
                  />
                </ProfileFieldRow>
                <ProfileFieldRow
                  label="Driver's License Number"
                  description="Valid Federal driver's license number"
                >
                  <Input
                    value={kycLicenseNumber}
                    onChange={(e) => setKycLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-98234-LAG"
                    aria-label="Driver's License Number"
                  />
                </ProfileFieldRow>
                <ProfileFieldRow
                  label="License Expiry Date"
                  description="Expiration date of driver's license"
                >
                  <Input
                    type="date"
                    value={kycLicenseExpiry}
                    onChange={(e) => setKycLicenseExpiry(e.target.value)}
                    aria-label="License Expiry Date"
                  />
                </ProfileFieldRow>
                <ProfileFieldRow
                  label="Daily Cash-on-Delivery (COD) Limit"
                  description="Maximum cash float held before mandatory drop-off"
                >
                  <Select
                    value={String(kycCodLimit)}
                    onValueChange={(val) => setKycCodLimit(Number(val))}
                    options={[
                      { value: '30000', label: '₦30,000 - Entry Level Float' },
                      { value: '50000', label: '₦50,000 - Standard Fleet Float' },
                      { value: '75000', label: '₦75,000 - Senior Trusted Rider' },
                      { value: '100000', label: '₦100,000 - High-Volume Dispatch' }
                    ]}
                    aria-label="Daily Cash-on-Delivery (COD) Limit"
                  />
                </ProfileFieldRow>
              </div>
            </div>
          )}

          {/* Card 5: Emergency Contact & Guarantor */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Emergency Contact & Guarantor</h3>
                  <p className="text-[13px] text-kumo-subtle">Next of kin emergency contact and verified guarantor details</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Next-of-Kin Full Name"
                description="Primary contact in case of workplace emergency"
                required
              >
                <Input
                  value={profileEmergencyName}
                  onChange={(e) => setProfileEmergencyName(e.target.value)}
                  placeholder="e.g. Mrs. Funke Balogun"
                  required
                  aria-label="Next-of-Kin Full Name"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Next-of-Kin Phone Number"
                description="Direct phone number for emergency contact"
                required
              >
                <Input
                  value={profileEmergencyPhone}
                  onChange={(e) => setProfileEmergencyPhone(e.target.value)}
                  placeholder="+234 802 345 6789"
                  required
                  aria-label="Next-of-Kin Phone Number"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Relationship to Staff"
                description="Family or personal relationship"
              >
                <Select
                  value={profileEmergencyRelationship}
                  onValueChange={(val) => setProfileEmergencyRelationship(String(val))}
                  options={KIN_RELATIONSHIP_OPTIONS}
                  aria-label="Relationship to Staff"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Guarantor Full Name"
                description="Verified guarantor full name"
                required
              >
                <Input
                  value={profileGuarantorName}
                  onChange={(e) => setProfileGuarantorName(e.target.value)}
                  placeholder="e.g. Alhaji M. Adeleke"
                  required
                  aria-label="Guarantor Full Name"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Guarantor Phone Number"
                description="Active phone number of guarantor"
                required
              >
                <Input
                  value={profileGuarantorPhone}
                  onChange={(e) => setProfileGuarantorPhone(e.target.value)}
                  placeholder="+234 803 311 2233"
                  required
                  aria-label="Guarantor Phone Number"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Guarantor Relationship / Occupation"
                description="Vocation, standing, or relationship to staff"
              >
                <Input
                  value={profileGuarantorRelationship}
                  onChange={(e) => setProfileGuarantorRelationship(e.target.value)}
                  placeholder="e.g. Merchant / Landlord"
                  aria-label="Guarantor Relationship / Occupation"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Guarantor Verification Status"
                description="Status of guarantor vetting and signed documentation"
              >
                <Select
                  value={profileGuarantorStatus}
                  onValueChange={(val) => setProfileGuarantorStatus(val as any)}
                  options={GUARANTOR_STATUS_OPTIONS}
                  aria-label="Guarantor Verification Status"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 6: Bank Account for Payroll */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Bank Account for Payroll</h3>
                  <p className="text-[13px] text-kumo-subtle">Bank account details for salary and operational reimbursements</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Bank Name"
                description="Commercial bank name"
              >
                <Select
                  value={profileBankName}
                  onValueChange={(val) => setProfileBankName(String(val))}
                  options={NIGERIAN_BANKS}
                  aria-label="Bank Name"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="10-Digit Account Number (NUBAN)"
                description="Nigerian Uniform Bank Account Number"
                required
              >
                <Input
                  value={profileBankAccountNumber}
                  onChange={(e) => setProfileBankAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="e.g. 0148920194"
                  maxLength={10}
                  required
                  aria-label="10-Digit Account Number (NUBAN)"
                />
              </ProfileFieldRow>
              <ProfileFieldRow
                label="Account Beneficiary Name"
                description="Must match staff member's bank account name"
                required
              >
                <Input
                  value={profileBankAccountName}
                  onChange={(e) => setProfileBankAccountName(e.target.value)}
                  placeholder="e.g. Yusuf Balogun"
                  required
                  aria-label="Account Beneficiary Name"
                />
              </ProfileFieldRow>
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-kumo-base border border-kumo-line rounded-xl shadow-2xs gap-3 mt-8">
          <div className="flex items-center gap-2 text-[13px] text-kumo-subtle">
            <ShieldCheck className="w-4 h-4 text-kumo-subtle shrink-0" />
            <span>Staff profile and KYC changes update across operational records immediately.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => navigate('/accounts')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              onClick={handleSaveProfile}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
                <span className="text-kumo-subtle text-[16px] font-normal">/</span>
                <span className="text-[16px] font-semibold text-kumo-default">{targetStaff.name}</span>
              </div>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Define and manage role policies, authority scopes, and functional operational access for <strong className="text-kumo-strong">{targetStaff.name}</strong> ({targetStaff.email}).
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher matching Screenshot 1 & 3: [ Permission policies | Groups | Settings ] */}
        <div className="flex items-center justify-between gap-4">
          <KumoTabs
            activeTab={staffSubTab}
            onChange={(val) => setStaffSubTab(val as 'policies' | 'groups')}
            tabs={[
              { id: 'policies', label: 'Permission policies' },
              { id: 'groups', label: 'Branch & Operating Zone' },
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
                      <div className="font-semibold text-kumo-strong text-[14px]">
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
                    <h2 className="text-[16px] font-semibold text-kumo-strong">Edit policy</h2>
                    <Pencil className="w-4 h-4 text-kumo-subtle" />
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
                        Select a role from the dropdown above to view and configure its baseline permissions.
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
                              <span className="font-semibold text-[14px] text-kumo-strong">{group.name}</span>
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
                                      <span className="font-semibold text-[14px] text-kumo-strong block leading-tight">
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

        {/* TAB 2: BRANCH & OPERATING ZONE */}
        {staffSubTab === 'groups' && (
          <div className="border border-kumo-line rounded-2xl bg-kumo-base p-6 space-y-6 shadow-xs animate-in fade-in">
            <div className="pb-3 border-b border-kumo-line">
              <h2 className="text-[16px] font-semibold text-kumo-strong">Branch & Operating Zone</h2>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Configure assigned operating facility, delivery zone, department, and shift schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branch / Facility */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-kumo-strong">Operating Facility / Branch</label>
                <Select
                  value={editOffice}
                  onValueChange={(val) => setEditOffice(String(val))}
                  options={(facilities && facilities.length > 0 ? facilities : [INITIAL_FACILITY]).map(f => ({
                    value: f.name,
                    label: f.name
                  }))}
                  placeholder="Select assigned branch..."
                />
              </div>

              {/* Operating Zone */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-kumo-strong">Operating Delivery Zone</label>
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

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-kumo-strong">Operational Department</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g. Operations & Logistics"
                  className="w-full h-10 px-3.5 rounded-lg border border-kumo-line bg-kumo-base text-[14px] text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-sans"
                />
              </div>

              {/* Shift Schedule */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-kumo-strong">Operational Shift Schedule</label>
                <Select
                  value={editShiftSchedule}
                  onValueChange={(val) => setEditShiftSchedule(String(val))}
                  options={SHIFT_SCHEDULE_OPTIONS}
                  placeholder="Select assigned shift..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-kumo-line flex justify-end">
              <Button
                variant="primary"
                type="button"
                onClick={() => handleSaveRouteAndPolicies()}
                className="h-10 px-5 text-[14px] font-semibold shadow-xs"
              >
                Save Branch & Zone
              </Button>
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
              <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Role & Permission Matrix</h1>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Review and configure baseline permissions across standard operational roles.
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
              Save Baseline Policy
            </Button>
          </div>
        </div>

        {/* Create Policy Card (Exact match to Screenshot 2 & Screenshot 1) */}
        <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
          {/* Card Header: 16px (text-[16px] font-semibold) */}
          <div className="p-5 border-b border-kumo-line bg-kumo-canvas/40">
            <h2 className="text-[16px] font-semibold text-kumo-strong">Configure Role Baseline Policy</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Top Scope Selectors Row: 40px height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="w-full">
                <Select
                  value={matrixScope}
                  onValueChange={(val) => handleMatrixScopeChange(String(val))}
                  options={roleScopeOptions}
                  placeholder="Select a role..."
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
                  Select a role from the dropdown above to view and configure its baseline permissions.
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
                            <span className="font-semibold text-[14px] text-kumo-strong">{group.name}</span>
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
                                    <span className="font-semibold text-[14px] text-kumo-strong block leading-tight">
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
              Save Baseline Policy
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW: DEDICATED INVITE MEMBERS PAGE (Matching Reference Screenshot)
  // =========================================================================


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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/accounts/matrix')}
              leftIcon={<Shield className="w-4 h-4" />}
              className="h-10 px-4 text-[13px] font-medium"
            >
              Policy Matrix
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              className="h-10 px-4 text-[13px] font-medium"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/accounts/create')}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="h-10 px-4 text-[13px] font-semibold shadow-xs"
            >
              Create Account
            </Button>
          </div>
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
          onRowClick={(acc) => navigate(`/accounts/profile/${encodeURIComponent(acc.email)}`)}
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
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setAccountToChangePassword(null)}
              className="h-9 px-4 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="reset-password-form"
              className="h-9 px-4 text-[13px] font-semibold"
            >
              Update Password
            </Button>
          </div>
        }
      >
        {accountToChangePassword && (
          <form id="reset-password-form" onSubmit={handleSavePassword} className="space-y-4 font-sans text-left">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4">
                  New Password <span className="text-primary">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNewPasswordVal(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)}
                  className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="Enter or generate new password"
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer transition-colors"
                  aria-label={showResetPassword ? "Hide password" : "Show password"}
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Minimum 8 characters. Recommended to include letters, numbers, and symbols.
              </p>
            </div>

            <label htmlFor="requireReset" className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 cursor-pointer select-none">
              <input
                type="checkbox"
                id="requireReset"
                checked={requirePassReset}
                onChange={(e) => setRequirePassReset(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 dark:border-zinc-600 text-[#c0201f] focus:ring-[#c0201f] size-4 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 block">
                  Require password change upon next login
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  Forces the operator to set their own custom private password when they authenticate.
                </span>
              </div>
            </label>
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
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setAccountToDelete(null)}
              className="h-9 px-4 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={handleConfirmDelete}
              className="h-9 px-4 text-[13px] font-semibold"
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        {accountToDelete && (
          <div className="space-y-4 font-sans text-left">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-red-900 dark:text-red-200">
                <p className="font-semibold text-[15px]">{accountToDelete.name}</p>
                <p className="text-[13px] opacity-80">{accountToDelete.email}</p>
                <p className="text-[13px] opacity-80 mt-1">
                  Assigned role: <strong>{accountToDelete.roleLabel}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
export default ManageAccountsPage
