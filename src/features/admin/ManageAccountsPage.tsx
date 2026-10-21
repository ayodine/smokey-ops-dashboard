import React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import { ManageAccountsModal } from '@/components/layout/ManageAccountsModal'

export const ManageAccountsPage: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(true)

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Manage Accounts"
        subtitle="Super Admin · Operator profiles, authenticated sessions, and system role access"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Open Accounts Directory
          </Button>
        }
      />

      <ManageAccountsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {!isOpen && (
        <div className="p-12 text-center border border-dashed border-kumo-line rounded-2xl bg-kumo-base space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-kumo-strong">Accounts Directory Closed</h3>
            <p className="text-xs text-kumo-subtle mt-1">
              Click the button below to reopen the Super Admin accounts directory.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Manage Accounts
          </Button>
        </div>
      )}
    </div>
  )
}

export default ManageAccountsPage
