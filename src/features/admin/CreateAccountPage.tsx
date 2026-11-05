import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  Bike,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Briefcase,
  Users,
  UserCheck,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SingleDatePicker } from '@/components/ui/SingleDatePicker'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { useSmokeyOps, type UserRole, type AppUserAccount, ROLE_DEFAULT_PERMISSIONS } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { SYSTEM_ROLE_CONFIGS } from '@/components/layout/ManageAccountsModal'
import { generateNextStaffId } from '@/lib/staffId'

// Standard row component exactly matching Staff Profile & KYC reference UI
interface ProfileFieldRowProps {
  label: string
  description?: string
  required?: boolean
  children: React.ReactNode
}

const ProfileFieldRow: React.FC<ProfileFieldRowProps> = ({
  label,
  description,
  required,
  children,
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

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentAccount, createAccount, showToast, availableAccounts, customScopes } = useSmokeyOps()
  const { facilities, selectedWarehouse } = useWarehouse()

  // Account Type Switcher: Team Account (streamlined, no personal KYC) vs Staff Account (Full KYC)
  const [accountTypeTab, setAccountTypeTab] = useState<'team' | 'staff'>('team')

  // Unified Scope Options (Standard Roles + Custom Scopes)
  const roleScopeOptions = useMemo(() => {
    const defaultRoles = SYSTEM_ROLE_CONFIGS.map(r => ({
      value: r.id,
      label: `${r.label} (${(ROLE_DEFAULT_PERMISSIONS[r.id] || []).length} baseline policies)`,
      group: 'Standard Operational Scopes'
    }))

    const customOptions = (customScopes || []).map(s => ({
      value: s.id,
      label: `${s.label} (${(s.permissions || []).length} custom policies)`,
      group: 'Custom Operational Scopes'
    }))

    return [
      ...defaultRoles,
      ...customOptions
    ]
  }, [customScopes])

  // Scope selection state for Staff Account tab
  const [staffScopeSelection, setStaffScopeSelection] = useState<string>('kitchen')

  // Team Account Form State (Streamlined, strictly non-personal)
  const [teamName, setTeamName] = useState('')
  const [teamUsername, setTeamUsername] = useState('')
  const [teamPassword, setTeamPassword] = useState(() => `Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
  const [teamShowPassword, setTeamShowPassword] = useState(false)
  const [teamMustChangePassword, setTeamMustChangePassword] = useState(false)
  const [teamDepartment, setTeamDepartment] = useState('Culinary Production')
  const [teamHub, setTeamHub] = useState(selectedWarehouse?.name || facilities[0]?.name || 'Yaba Head Office')
  const [teamScopeSelection, setTeamScopeSelection] = useState<string>('kitchen')
  const [teamShiftSchedule, setTeamShiftSchedule] = useState('Morning Cook & Prep (6:00 AM - 3:00 PM)')

  // Select dropdown option arrays matching ManageAccountsPage KYC
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
    { value: 'Morning Cook & Prep (6:00 AM - 3:00 PM)', label: 'Morning Cook & Prep (6:00 AM - 3:00 PM)' },
    { value: 'Evening Smoke Shift (2:00 PM - 11:00 PM)', label: 'Evening Smoke Shift (2:00 PM - 11:00 PM)' },
    { value: 'Day Delivery Dispatch (8:00 AM - 6:00 PM)', label: 'Day Delivery Dispatch (8:00 AM - 6:00 PM)' },
    { value: 'Morning Intake & Audit (7:00 AM - 4:00 PM)', label: 'Morning Intake & Audit (7:00 AM - 4:00 PM)' },
    { value: 'All-Day Fulfillment (8:00 AM - 6:00 PM)', label: 'All-Day Fulfillment (8:00 AM - 6:00 PM)' },
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

  // 3. Branch & Employment Details (declared early for auto staff ID generation)
  const [assignedHub, setAssignedHub] = useState(selectedWarehouse?.name || facilities[0]?.name || 'Yaba Head Office')
  const [role, setRole] = useState<UserRole>('kitchen')
  const [employmentStatus, setEmploymentStatus] = useState<'full_time' | 'contract' | 'probation' | 'part_time'>('full_time')
  const [shiftSchedule, setShiftSchedule] = useState('Morning Cook & Prep (6:00 AM - 3:00 PM)')
  const [department, setDepartment] = useState('Culinary Production')

  // Auto-calculated sequential unique Staff ID for the chosen role
  const [isStaffIdCustom, setIsStaffIdCustom] = useState(false)
  const autoStaffId = useMemo(() => {
    return generateNextStaffId(role, availableAccounts)
  }, [role, availableAccounts])

  // 1. Personal Details & Identity
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [staffId, setStaffId] = useState(() => generateNextStaffId('kitchen', availableAccounts))
  const [dob, setDob] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [bvn, setBvn] = useState('')

  // Sync staffId whenever autoStaffId changes if user hasn't typed a custom override
  useEffect(() => {
    if (!isStaffIdCustom) {
      setStaffId(autoStaffId)
    }
  }, [autoStaffId, isStaffIdCustom])

  // 2. Contact & Residential Address
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Lagos Mainland')
  const [state, setState] = useState('Lagos State')

  // 4. Delivery Fleet & Driver Details (conditional for rider)
  const [vehicleType, setVehicleType] = useState('Bajaj Boxer 150 Motorcycle')
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleOwnership, setVehicleOwnership] = useState('Smokey Fleet Unit #04')
  const [assignedZone, setAssignedZone] = useState('Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')

  // 5. Emergency Contact & Guarantor
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('Spouse')
  const [guarantorName, setGuarantorName] = useState('')
  const [guarantorPhone, setGuarantorPhone] = useState('')
  const [guarantorRelationship, setGuarantorRelationship] = useState('Corporate Merchant / Landlord')
  const [guarantorStatus, setGuarantorStatus] = useState<'verified' | 'signed' | 'pending'>('verified')

  // 6. Bank Account for Payroll
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')

  // 7. Security & Login Credentials
  const [username, setUsername] = useState('')
  const [tempPassword, setTempPassword] = useState(() => `Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
  const [showPassword, setShowPassword] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(true)

  // Success view state
  const [createdAccount, setCreatedAccount] = useState<{
    name: string
    email: string
    username: string
    tempPass: string
    role: string
    staffId: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    manager: 'Operations Manager',
    sales_manager: 'Sale Manager',
    kitchen: 'Kitchen Chef / Prep Lead',
    inventory: 'Inventory & Stock Officer',
    dispatcher: 'Logistics Dispatcher',
    rider: 'Delivery Fleet Rider',
  }

  const handleCreateTeamAccount = (e: React.FormEvent) => {
    e.preventDefault()

    const rawName = teamName.trim()
    const rawUsername = teamUsername.trim()
    if (!rawName) {
      showToast('Team/Account name is required', 'error')
      return
    }
    if (!rawUsername) {
      showToast('Sign-in username or email handle is required', 'error')
      return
    }

    // Determine email and username
    const cleanUsername = rawUsername.includes('@')
      ? rawUsername.split('@')[0].toLowerCase()
      : rawUsername.toLowerCase().replace(/\s+/g, '.')
    const effectiveEmail = rawUsername.includes('@')
      ? rawUsername.toLowerCase()
      : `${cleanUsername}@smokeyhut.com`

    const finalPassword = teamPassword.trim() || `Smk@${Math.floor(1000 + Math.random() * 9000)}!`

    // Resolve Role & Scope
    const matchedCustom = (customScopes || []).find(s => s.id === teamScopeSelection)
    const matchedStandard = SYSTEM_ROLE_CONFIGS.find(r => r.id === teamScopeSelection)
    const effectiveRole: UserRole = matchedCustom ? matchedCustom.baseRole : (matchedStandard ? (matchedStandard.id as UserRole) : 'kitchen')
    const effectiveRoleLabel = matchedCustom ? matchedCustom.label : (matchedStandard?.label || roleLabels[effectiveRole])
    const effectivePermissions = matchedCustom ? matchedCustom.permissions : (ROLE_DEFAULT_PERMISSIONS[effectiveRole] || [])
    const teamStaffId = `TEAM-${cleanUsername.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`

    const newTeamAccount: AppUserAccount = {
      name: rawName,
      username: cleanUsername,
      email: effectiveEmail,
      role: effectiveRole,
      roleLabel: effectiveRoleLabel,
      scope_id: matchedCustom ? matchedCustom.id : undefined,
      permissions: effectivePermissions,
      department: teamDepartment.trim() || 'Operations',
      assigned_hub: teamHub,
      shift_schedule: teamShiftSchedule,
      account_type: 'team',
      must_change_password: teamMustChangePassword,
      staff_id: teamStaffId,
      password: finalPassword,
      temporary_password: finalPassword,
      status: 'active',
      last_active: 'Team account registered just now',
    }

    createAccount(newTeamAccount)

    setCreatedAccount({
      name: rawName,
      email: effectiveEmail,
      username: cleanUsername,
      tempPass: finalPassword,
      role: effectiveRoleLabel,
      staffId: teamStaffId,
    })

    showToast(`Team account created for ${rawName}`, 'success')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !name.trim()) {
      showToast('Full legal name and work email are required', 'error')
      return
    }

    const derivedUsername = username.trim() || email.split('@')[0].toLowerCase()
    const finalPassword = tempPassword.trim() || `Smk@${Math.floor(1000 + Math.random() * 9000)}!`
    const accName = name.trim()
    const generatedStaffId = staffId.trim() || autoStaffId

    // Resolve Role & Scope for Staff Account
    const matchedCustom = (customScopes || []).find(s => s.id === staffScopeSelection)
    const matchedStandard = SYSTEM_ROLE_CONFIGS.find(r => r.id === staffScopeSelection)
    const effectiveRole: UserRole = matchedCustom ? matchedCustom.baseRole : role
    const effectiveRoleLabel = matchedCustom ? matchedCustom.label : (matchedStandard?.label || roleLabels[effectiveRole])
    const effectivePermissions = matchedCustom ? matchedCustom.permissions : (ROLE_DEFAULT_PERMISSIONS[effectiveRole] || [])

    const newAccountData: AppUserAccount = {
      email: email.trim().toLowerCase(),
      username: derivedUsername,
      name: accName,
      role: effectiveRole,
      roleLabel: effectiveRoleLabel,
      scope_id: matchedCustom ? matchedCustom.id : undefined,
      permissions: effectivePermissions,
      account_type: 'staff',
      must_change_password: mustChangePassword,
      phone: phone.trim() || undefined,
      staff_id: generatedStaffId,
      assigned_hub: assignedHub,
      employment_status: employmentStatus,
      date_of_birth: dob.trim() || undefined,
      residential_address: address.trim() || undefined,
      national_id_nin: nationalId.trim() || undefined,
      bvn: bvn.trim() || undefined,
      emergency_contact: emergencyName.trim() || undefined,
      emergency_phone: emergencyPhone.trim() || undefined,
      emergency_relationship: emergencyRelationship.trim() || undefined,
      guarantor_name: guarantorName.trim() || undefined,
      guarantor_phone: guarantorPhone.trim() || undefined,
      guarantor_relationship: guarantorRelationship.trim() || undefined,
      bank_name: bankName.trim() || undefined,
      bank_account_number: bankAccountNumber.trim() || undefined,
      bank_account_name: bankAccountName.trim() || accName,
      vehicle_type: effectiveRole === 'rider' ? vehicleType : undefined,
      plate_number: effectiveRole === 'rider' ? (plateNumber.trim() || undefined) : undefined,
      license_number: effectiveRole === 'rider' ? (licenseNumber.trim() || undefined) : undefined,
      license_expiry: effectiveRole === 'rider' ? (licenseExpiry.trim() || undefined) : undefined,
      password: finalPassword,
      temporary_password: finalPassword,
      status: 'active',
      last_active: 'Account registered just now',
    }

    createAccount(newAccountData)

    setCreatedAccount({
      name: accName,
      email: email.trim().toLowerCase(),
      username: derivedUsername,
      tempPass: finalPassword,
      role: effectiveRoleLabel,
      staffId: generatedStaffId,
    })

    showToast(`Staff Account & KYC registered successfully for ${accName}`, 'success')
  }

  const handleCopyCredentials = () => {
    if (!createdAccount) return
    const text = `SmokeyOps Credentials\nName: ${createdAccount.name}\nStaff ID: ${createdAccount.staffId}\nEmail: ${createdAccount.email}\nUsername: ${createdAccount.username}\nTemporary Password: ${createdAccount.tempPass}\nRole: ${createdAccount.role}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('Credentials copied to clipboard', 'info')
    setTimeout(() => setCopied(false), 2500)
  }

  if (currentAccount.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 rounded-2xl border border-kumo-line bg-kumo-base text-center space-y-4 shadow-xs font-sans">
        <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/30 text-[#c0201f] flex items-center justify-center mx-auto border border-red-200 dark:border-red-900">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-kumo-strong">Super Admin Authorization Required</h2>
          <p className="text-[13px] text-kumo-subtle">
            New staff accounts can only be provisioned from the dashboard by a Super Administrator.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/accounts')}>
            Back to Team Accounts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header exactly matching Staff Profile & KYC reference UI */}
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
              <h1 className="text-xl font-bold text-kumo-strong tracking-tight">
                {accountTypeTab === 'team' ? 'Provision Team Account' : 'Staff Profile & KYC'}
              </h1>
              <span className="text-kumo-subtle text-[16px] font-normal">/</span>
              <span className="text-[16px] font-semibold text-kumo-default">
                {accountTypeTab === 'team'
                  ? (teamName.trim() || 'New Team / Department Account')
                  : (name.trim() || 'New Staff Member')}
              </span>
            </div>
            <p className="text-[13px] text-kumo-subtle mt-0.5">
              {accountTypeTab === 'team'
                ? 'Create a shared departmental or station operator account with immediate scope-based policy access. No personal KYC required.'
                : `Manage personal details, branch assignment, emergency contacts, and payroll information for ${name.trim() || 'New Staff Member'} (${email.trim() || 'staff-onboarding@smokeyhut.com'}).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[13px] text-kumo-subtle font-sans inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-kumo-line bg-kumo-base shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-kumo-subtle" />
            <span>{accountTypeTab === 'team' ? 'Account Type:' : 'Staff ID:'}</span>
            <strong className="text-kumo-strong font-mono">
              {accountTypeTab === 'team' ? 'Team / Operational' : (staffId.trim() || autoStaffId)}
            </strong>
          </span>
        </div>
      </div>

      {/* Account Type KumoTabs Switcher */}
      {!createdAccount && (
        <div className="flex items-center justify-between gap-4 border-b border-kumo-line pb-4">
          <KumoTabs
            tabs={[
              { id: 'team', label: 'Team Account' },
              { id: 'staff', label: 'Staff Account (Full KYC)' },
            ]}
            activeTab={accountTypeTab}
            onChange={(tabId) => setAccountTypeTab(tabId as 'team' | 'staff')}
            size="md"
          />
          <span className="text-[12px] text-kumo-subtle hidden sm:inline-block">
            {accountTypeTab === 'team'
              ? 'Shared departmental credentials & policy scope only'
              : 'Individual employee record with statutory KYC & payroll'}
          </span>
        </div>
      )}

      {createdAccount ? (
        <div className="border border-kumo-line rounded-2xl bg-kumo-base p-6 sm:p-8 space-y-6 shadow-xs max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-kumo-strong">Account & KYC Created Successfully</h2>
              <p className="text-[13px] text-kumo-subtle">
                Staff profile, verification details, and login credentials have been saved.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-kumo-canvas/50 border border-kumo-line space-y-3">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-kumo-subtle">Full Legal Name</span>
              <span className="font-semibold text-kumo-strong">{createdAccount.name}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-kumo-subtle">Assigned Staff ID</span>
              <span className="font-mono font-semibold text-kumo-strong">{createdAccount.staffId}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-kumo-subtle">Work Email Address</span>
              <span className="font-mono text-kumo-strong">{createdAccount.email}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-kumo-subtle">Sign-in Username</span>
              <span className="font-mono text-kumo-strong">{createdAccount.username}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-kumo-subtle">Temporary Password</span>
              <span className="font-mono font-semibold text-kumo-strong">{createdAccount.tempPass}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-kumo-subtle">Assigned Role</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-kumo-tint text-kumo-strong border border-kumo-line">
                {createdAccount.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleCopyCredentials}
              className="w-full sm:w-auto"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounts')}
              className="w-full sm:w-auto"
            >
              <span>View in Accounts Table</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : accountTypeTab === 'team' ? (
        <form onSubmit={handleCreateTeamAccount} className="space-y-6 pb-12">
          {/* Card 1: Team Account & Sign-in Credentials */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Team Identity & Sign-in Credentials</h3>
                  <p className="text-[13px] text-kumo-subtle">Shared operational team name and login credentials</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-kumo-subtle bg-kumo-tint px-2.5 py-1 rounded-md border border-kumo-line">
                No KYC Required
              </span>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Team / Account Name"
                description="Display name for this shared or departmental account"
                required
              >
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Packaging Team, Kitchen Shift Lead, Dispatch Desk"
                  required
                  aria-label="Team / Account Name"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Sign-in Username / Handle"
                description="Username or email handle used to log in (e.g. packaging.team)"
                required
              >
                <Input
                  value={teamUsername}
                  onChange={(e) => setTeamUsername(e.target.value)}
                  placeholder="e.g. packaging.team or packaging@smokeyhut.com"
                  required
                  aria-label="Sign-in Username / Handle"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Password"
                description="Credentials for operators sharing this terminal/station"
                required
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1">
                    <Input
                      type={teamShowPassword ? 'text' : 'password'}
                      value={teamPassword}
                      onChange={(e) => setTeamPassword(e.target.value)}
                      required
                      aria-label="Password"
                      className="pr-10 font-mono text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => setTeamShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer"
                      title={teamShowPassword ? 'Hide password' : 'Show password'}
                    >
                      {teamShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTeamPassword(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="shrink-0 h-10 px-3"
                    title="Generate new password"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    <span>Generate</span>
                  </Button>
                </div>
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Require Password Reset"
                description="Force password update on first login"
              >
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="teamMustChangePasswordCheck"
                    checked={teamMustChangePassword}
                    onChange={(e) => setTeamMustChangePassword(e.target.checked)}
                    className="rounded border-kumo-line text-primary focus:ring-primary size-4 cursor-pointer accent-[#c0201f]"
                  />
                  <label htmlFor="teamMustChangePasswordCheck" className="text-[13px] text-kumo-strong cursor-pointer select-none">
                    Require password change upon next login
                  </label>
                </div>
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 2: Department, Facility & Scope */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Department, Facility & Policy Scope</h3>
                  <p className="text-[13px] text-kumo-subtle">Assigned operating hub, shift roster, and RBAC permission scope</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Operational Department"
                description="Work group responsible for this shared account"
              >
                <Input
                  value={teamDepartment}
                  onChange={(e) => setTeamDepartment(e.target.value)}
                  placeholder="e.g. Packaging & Assembly, Kitchen Operations"
                  aria-label="Operational Department"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Assigned Operating Facility / Hub"
                description="Primary physical branch, kitchen, or depot"
              >
                <Select
                  value={teamHub}
                  onValueChange={(val) => setTeamHub(String(val))}
                  options={facilities.map(f => ({ value: f.name, label: f.name }))}
                  aria-label="Assigned Operating Facility / Hub"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Assigned Shift Schedule"
                description="Operating shift window"
              >
                <Select
                  value={teamShiftSchedule}
                  onValueChange={(val) => setTeamShiftSchedule(String(val))}
                  options={SHIFT_SCHEDULE_OPTIONS}
                  aria-label="Assigned Shift Schedule"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Policy & Access Scope"
                description="Standard operational role or custom scope granting system permissions"
                required
              >
                <Select
                  value={teamScopeSelection}
                  onValueChange={(val) => setTeamScopeSelection(String(val))}
                  options={roleScopeOptions}
                  aria-label="Policy & Access Scope"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Bottom Action Bar for Team Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-kumo-base border border-kumo-line rounded-xl shadow-2xs gap-3 mt-8">
            <div className="flex items-center gap-2 text-[13px] text-kumo-subtle">
              <ShieldCheck className="w-4 h-4 text-kumo-subtle shrink-0" />
              <span>Team account credentials and policy permissions will be active immediately.</span>
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
                type="submit"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Create Team Account</span>
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCreate} className="space-y-6 pb-12">
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
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!bankAccountName) setBankAccountName(e.target.value)
                  }}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yusuf.balogun@smokeyhut.com"
                  required
                  aria-label="Official Work Email"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Direct Phone Number"
                description="Mobile phone number with SMS and voice availability"
              >
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 802 345 6789"
                  aria-label="Direct Phone Number"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Staff / Employee ID"
                description="Auto-generated unique identifier (customizable if required)"
              >
                <div className="relative w-full">
                  <Input
                    value={staffId}
                    onChange={(e) => {
                      setIsStaffIdCustom(true)
                      setStaffId(e.target.value)
                    }}
                    placeholder={autoStaffId}
                    aria-label="Staff / Employee ID"
                    className="pr-8 font-mono text-[13px]"
                  />
                  {isStaffIdCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsStaffIdCustom(false)
                        setStaffId(autoStaffId)
                        showToast(`Staff ID reset to auto-generated ${autoStaffId}`, 'info')
                      }}
                      title="Reset to auto-generated Staff ID"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Date of Birth"
                description="Staff member's birth date for employment verification"
              >
                <SingleDatePicker
                  value={dob}
                  onChange={(date) => setDob(date)}
                  placeholder="Select birth date"
                  className="w-full"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="National Identity Number (NIN)"
                description="11-digit National Identity Number"
              >
                <Input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="11-digit NIN"
                  aria-label="National Identity Number (NIN)"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Bank Verification Number (BVN)"
                description="11-digit Bank Verification Number (optional)"
              >
                <Input
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value)}
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lagos Mainland"
                  aria-label="City / Local Government (LGA)"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="State / Region"
                description="State of residence"
              >
                <Select
                  value={state}
                  onValueChange={(val) => setState(String(val))}
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
                  value={assignedHub}
                  onValueChange={(val) => setAssignedHub(String(val))}
                  options={facilities.map(f => ({ value: f.name, label: f.name }))}
                  aria-label="Assigned Operating Facility / Hub"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Staff Role & Scope Assignment"
                description="Operational role or custom scope defining system access and policies"
              >
                <Select
                  value={staffScopeSelection}
                  onValueChange={(val) => {
                    const chosen = String(val)
                    setStaffScopeSelection(chosen)
                    const matchedCustom = (customScopes || []).find(s => s.id === chosen)
                    const newRole = matchedCustom ? matchedCustom.baseRole : (chosen as UserRole)
                    setRole(newRole)
                    if (!isStaffIdCustom) {
                      setStaffId(generateNextStaffId(newRole, availableAccounts))
                    }
                  }}
                  options={roleScopeOptions}
                  aria-label="Staff Role & Scope Assignment"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Employment Status"
                description="Staff engagement and contract classification"
              >
                <Select
                  value={employmentStatus}
                  onValueChange={(val) => setEmploymentStatus(val as any)}
                  options={EMPLOYMENT_STATUS_OPTIONS}
                  aria-label="Employment Status"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Primary Operational Shift"
                description="Assigned rostered shift schedule"
              >
                <Select
                  value={shiftSchedule}
                  onValueChange={(val) => setShiftSchedule(String(val))}
                  options={SHIFT_SCHEDULE_OPTIONS}
                  aria-label="Primary Operational Shift"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Operational Department"
                description="Operational work group"
              >
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Culinary Production"
                  aria-label="Operational Department"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 4: Delivery Fleet & Driver Details (conditional for rider) */}
          {role === 'rider' && (
            <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-kumo-strong">Delivery Fleet & Driver KYC</h3>
                    <p className="text-[13px] text-kumo-subtle">Motorcycle registration, route dispatch zone, and statutory driver licensing</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-kumo-line/60">
                <ProfileFieldRow
                  label="Vehicle Model / Type"
                  description="Assigned fleet motorcycle or vehicle description"
                >
                  <Input
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="e.g. Bajaj Boxer 150 Motorcycle"
                    aria-label="Vehicle Model / Type"
                  />
                </ProfileFieldRow>

                <ProfileFieldRow
                  label="License Plate Number"
                  description="State registered vehicle license plate"
                >
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. LND-482-XA"
                    aria-label="License Plate Number"
                  />
                </ProfileFieldRow>

                <ProfileFieldRow
                  label="Vehicle Ownership Model"
                  description="Company owned fleet or rider leased asset"
                >
                  <Select
                    value={vehicleOwnership}
                    onValueChange={(val) => setVehicleOwnership(String(val))}
                    options={[
                      { value: 'Company Fleet Asset (Smokey Hut Owned)', label: 'Company Fleet Asset (Smokey Hut Owned)' },
                      { value: 'Rider Owned & Maintained (Rider Asset)', label: 'Rider Owned & Maintained (Rider Asset)' },
                      { value: 'Third-Party Logistics Partner (3PL Lease)', label: 'Third-Party Logistics Partner (3PL Lease)' },
                    ]}
                    aria-label="Vehicle Ownership Model"
                  />
                </ProfileFieldRow>

                <ProfileFieldRow
                  label="Primary Delivery Zone"
                  description="Core dispatch operating territory"
                >
                  <Select
                    value={assignedZone}
                    onValueChange={(val) => setAssignedZone(String(val))}
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
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-98234-LAG"
                    aria-label="Driver's License Number"
                  />
                </ProfileFieldRow>

                <ProfileFieldRow
                  label="License Expiry Date"
                  description="Expiration date of driver's license"
                >
                  <SingleDatePicker
                    value={licenseExpiry}
                    onChange={(date) => setLicenseExpiry(date)}
                    placeholder="Select expiry date"
                    className="w-full"
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
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
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
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
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
                  value={emergencyRelationship}
                  onValueChange={(val) => setEmergencyRelationship(String(val))}
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
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
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
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
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
                  value={guarantorRelationship}
                  onChange={(e) => setGuarantorRelationship(e.target.value)}
                  placeholder="e.g. Merchant / Landlord"
                  aria-label="Guarantor Relationship / Occupation"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Guarantor Verification Status"
                description="Status of guarantor vetting and signed documentation"
              >
                <Select
                  value={guarantorStatus}
                  onValueChange={(val) => setGuarantorStatus(val as any)}
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
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. GTBank, Zenith Bank, Access Bank"
                  aria-label="Bank Name"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="10-Digit Account Number (NUBAN)"
                description="Nigerian Uniform Bank Account Number"
                required
              >
                <Input
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
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
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="e.g. Yusuf Balogun"
                  required
                  aria-label="Account Beneficiary Name"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 7: Security & Sign-in Credentials */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Security & Sign-in Credentials</h3>
                  <p className="text-[13px] text-kumo-subtle">Set up initial password and login access identifier</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-kumo-subtle bg-kumo-tint px-2.5 py-1 rounded-md border border-kumo-line">
                Auto-Provisioned
              </span>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Sign-in Username / Handle"
                description="Default username based on email or custom alias"
                required
              >
                <Input
                  value={username || (email ? email.split('@')[0].toLowerCase() : '')}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. yusuf.ops"
                  required
                  aria-label="Sign-in Username / Handle"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Temporary Password"
                description="Generated default password for initial setup"
                required
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      required
                      aria-label="Temporary Password"
                      className="pr-10 font-mono text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTempPassword(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="shrink-0 h-10 px-3"
                    title="Generate new temporary password"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    <span>Generate</span>
                  </Button>
                </div>
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Require Password Reset"
                description="Forces operator to choose a personal password on first login"
              >
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="mustChangePasswordCheck"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded border-kumo-line text-primary focus:ring-primary size-4 cursor-pointer accent-[#c0201f]"
                  />
                  <label htmlFor="mustChangePasswordCheck" className="text-[13px] text-kumo-strong cursor-pointer select-none">
                    Require password change upon next login
                  </label>
                </div>
              </ProfileFieldRow>
            </div>
          </div>

          {/* Bottom Action Bar matching Staff Profile & KYC exactly */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-kumo-base border border-kumo-line rounded-xl shadow-2xs gap-3 mt-8">
            <div className="flex items-center gap-2 text-[13px] text-kumo-subtle">
              <ShieldCheck className="w-4 h-4 text-kumo-subtle shrink-0" />
              <span>Staff account and KYC profiles are securely enrolled into operational systems immediately.</span>
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
                type="submit"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Create Account & KYC</span>
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default CreateAccountPage
