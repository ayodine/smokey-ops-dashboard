import type { UserRole, AppUserAccount } from '@/context/SmokeyOpsContext'

export const ROLE_STAFF_PREFIXES: Record<UserRole, string> = {
  admin: 'SHD-ADM',
  manager: 'SHD-OPS',
  kitchen: 'SHD-KIT',
  inventory: 'SHD-INV',
  dispatcher: 'SHD-LOG',
  rider: 'SHD-RDR',
}

// Historical or departmental aliases to detect used numbers
const ROLE_ALIASES: Record<UserRole, string[]> = {
  admin: ['SHD-ADM', 'ADM'],
  manager: ['SHD-OPS', 'SHD-MGT', 'OPS', 'MGT'],
  kitchen: ['SHD-KIT', 'SHD-PKG', 'KIT', 'PKG'],
  inventory: ['SHD-INV', 'SHD-SLS', 'INV', 'SLS'],
  dispatcher: ['SHD-LOG', 'SHD-DSP', 'LOG', 'DSP'],
  rider: ['SHD-RDR', 'RDR'],
}

/**
 * Generates the next sequential unique Staff ID for a given user role,
 * preventing collisions with existing user accounts.
 */
export function generateNextStaffId(
  role: UserRole = 'kitchen',
  existingAccounts: AppUserAccount[] = []
): string {
  const primaryPrefix = ROLE_STAFF_PREFIXES[role] || 'SHD-STF'
  const prefixesToCheck = ROLE_ALIASES[role] || [primaryPrefix]

  const usedNumbers: number[] = []

  existingAccounts.forEach((acc) => {
    if (!acc.staff_id) return
    const id = acc.staff_id.toUpperCase().trim()

    for (const p of prefixesToCheck) {
      const regex = new RegExp(`^${p}-(\\d+)`, 'i')
      const match = id.match(regex)
      if (match && match[1]) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num)) {
          usedNumbers.push(num)
        }
      }
    }
  })

  let nextNum: number
  if (role === 'rider') {
    const maxRider = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 583
    nextNum = maxRider + 1
  } else {
    const maxExisting = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0
    nextNum = maxExisting + 1
  }

  let candidate = `${primaryPrefix}-${String(nextNum).padStart(3, '0')}`
  const existingSet = new Set(
    existingAccounts.map((a) => (a.staff_id || '').toUpperCase().trim())
  )

  while (existingSet.has(candidate)) {
    nextNum++
    candidate = `${primaryPrefix}-${String(nextNum).padStart(3, '0')}`
  }

  return candidate
}

