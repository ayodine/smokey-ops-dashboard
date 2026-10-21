import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import {
  ShieldCheck,
  Search,
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  LogOut,
  UserCheck,
  ShieldAlert
} from 'lucide-react'

export interface SignInLog {
  id: string
  when: string
  timestamp: string
  user: string
  email: string
  role: string
  country: string
  countryCode: string
  ipAddress: string
  device: string
  browser: string
  action: string
  status: 'success' | 'warning'
}

const SEED_SIGN_IN_LOGS: SignInLog[] = [
  {
    id: 'log-1',
    when: 'Today at 09:42 AM',
    timestamp: '2026-10-21 09:42:15',
    user: 'Ayobami Olowookere',
    email: 'ayodine47@gmail.com',
    role: 'Super Admin',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '102.89.44.12',
    device: 'MacBook Pro (macOS)',
    browser: 'Chrome 132.0',
    action: 'Signed in with Google',
    status: 'success'
  },
  {
    id: 'log-2',
    when: 'Today at 07:15 AM',
    timestamp: '2026-10-21 07:15:30',
    user: 'Babajide Ogundipe',
    email: 'pitmaster@smokeyhutdelight.com',
    role: 'Kitchen Lead',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '197.210.55.88',
    device: 'iPhone 15 Pro (iOS 18)',
    browser: 'Mobile Safari',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-3',
    when: 'Yesterday at 06:30 PM',
    timestamp: '2026-10-20 18:30:00',
    user: 'Ayobami Olowookere',
    email: 'ayodine47@gmail.com',
    role: 'Super Admin',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '102.89.44.12',
    device: 'MacBook Pro (macOS)',
    browser: 'Chrome 132.0',
    action: 'Session refreshed',
    status: 'success'
  },
  {
    id: 'log-4',
    when: '20 Oct at 02:10 PM',
    timestamp: '2026-10-20 14:10:45',
    user: 'Chioma Okonkwo',
    email: 'chioma@smokeyhutdelight.com',
    role: 'Inventory Manager',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '105.112.33.19',
    device: 'Windows 11 PC',
    browser: 'Microsoft Edge',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-5',
    when: '19 Oct at 08:22 PM',
    timestamp: '2026-10-19 20:22:10',
    user: 'Emeka Nwosu',
    email: 'dispatch@smokeyhutdelight.com',
    role: 'Dispatch Courier Lead',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '197.210.42.99',
    device: 'Samsung Galaxy S24',
    browser: 'Chrome Mobile',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-6',
    when: '19 Oct at 11:45 AM',
    timestamp: '2026-10-19 11:45:00',
    user: 'Ayobami Olowookere',
    email: 'ayodine47@gmail.com',
    role: 'Super Admin',
    country: 'United Kingdom 🇬🇧',
    countryCode: 'GB',
    ipAddress: '86.14.122.9',
    device: 'iPad Air (iPadOS)',
    browser: 'Safari',
    action: 'Signed in with Google',
    status: 'success'
  }
]

interface SignInActivityModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SignInActivityModal: React.FC<SignInActivityModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = SEED_SIGN_IN_LOGS.filter(log => {
    const q = searchQuery.toLowerCase().trim()
    return (
      !q ||
      log.user.toLowerCase().includes(q) ||
      log.email.toLowerCase().includes(q) ||
      log.country.toLowerCase().includes(q) ||
      log.device.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    )
  })

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Sign-in Activity & Security Log"
      description="Recent account logins, device sessions, and authentication events across your team."
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Super Admin Notice Pill */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-kumo-strong">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-kumo-strong text-xs">
                Super Admin Security Audit
              </p>
              <p className="text-[11px] text-kumo-subtle mt-0.5">
                Full visibility of all user logins. Role-based permissions and granular user management are coming soon.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary text-white shrink-0">
            Super Admin
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Search by user, email, country, device, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-link"
          />
        </div>

        {/* Table of Activity */}
        <div className="overflow-x-auto rounded-lg border border-kumo-line bg-kumo-base">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-kumo-line bg-kumo-canvas/60 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider select-none">
                <th className="py-2.5 px-3">When</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Device & Browser</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-kumo-subtle">
                    No sign-in records matched your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-kumo-tint/40 transition-colors">
                    {/* When */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-kumo-strong">{log.when}</div>
                      <div className="text-[10px] text-kumo-subtle">{log.timestamp.slice(11)}</div>
                    </td>

                    {/* User */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-kumo-strong">{log.user}</div>
                      <div className="text-[11px] text-kumo-subtle">{log.email}</div>
                    </td>

                    {/* Country */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-kumo-strong">{log.country}</span>
                      <div className="text-[10px] text-kumo-subtle">{log.ipAddress}</div>
                    </td>

                    {/* Device */}
                    <td className="py-2.5 px-3">
                      <div className="text-kumo-strong font-medium flex items-center gap-1.5">
                        {log.device.toLowerCase().includes('phone') ? (
                          <Smartphone className="w-3.5 h-3.5 text-kumo-subtle" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-kumo-subtle" />
                        )}
                        <span>{log.device}</span>
                      </div>
                      <div className="text-[10px] text-kumo-subtle">{log.browser}</div>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-kumo-line">
          <span className="text-[11px] text-kumo-subtle">
            Showing {filteredLogs.length} recent events
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
