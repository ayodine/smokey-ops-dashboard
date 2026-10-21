import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { KitchenTask } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatDate } from '@/lib/utils'
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Play, 
  Check, 
  User 
} from 'lucide-react'

export const KitchenTasksPage: React.FC = () => {
  const { kitchenTasks, updateTaskStatus, createKitchenTask } = useSmokeyOps()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee_name: "Babajide 'Pitmaster'",
    due_date: '2026-09-26',
    priority: 'normal' as 'high' | 'normal' | 'low',
    status: 'pending' as const
  })

  const totalTasks = kitchenTasks.length
  const inProgressCount = kitchenTasks.filter(t => t.status === 'in_progress').length
  const pendingCount = kitchenTasks.filter(t => t.status === 'pending').length
  const completedCount = kitchenTasks.filter(t => t.status === 'done').length

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createKitchenTask(newTask)
    setIsCreateModalOpen(false)
  }

  const columns: ColumnDef<KitchenTask>[] = [
    {
      key: 'task_ref',
      header: 'Task ID',
      accessor: (t) => <span className="font-medium text-xs text-kumo-strong font-sans">{t.task_ref}</span>,
      sortValue: (t) => t.task_ref,
    },
    {
      key: 'title',
      header: 'Task & Description',
      accessor: (t) => (
        <div>
          <div className="font-semibold text-kumo-strong">{t.title}</div>
          <div className="text-xs text-kumo-subtle line-clamp-1">{t.description}</div>
        </div>
      ),
      sortValue: (t) => t.title,
    },
    {
      key: 'assignee_name',
      header: 'Assignee',
      accessor: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-kumo-strong">
          <User className="w-3.5 h-3.5 text-kumo-subtle" />
          <span>{t.assignee_name}</span>
        </div>
      ),
      sortValue: (t) => t.assignee_name,
    },
    {
      key: 'priority',
      header: 'Priority',
      accessor: (t) => {
        const priorityColors = {
          high: 'bg-red-50 text-red-600 border-red-200',
          normal: 'bg-blue-50 text-blue-600 border-blue-200',
          low: 'bg-gray-100 text-gray-600 border-gray-200'
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${priorityColors[t.priority]}`}>
            {t.priority.toUpperCase()}
          </span>
        )
      },
      sortValue: (t) => t.priority,
    },
    {
      key: 'due_date',
      header: 'Target Due Date',
      accessor: (t) => <span className="text-xs text-kumo-subtle">{formatDate(t.due_date)}</span>,
      sortValue: (t) => t.due_date,
    },
    {
      key: 'status',
      header: 'Task State',
      accessor: (t) => {
        const statusMap = {
          pending: { status: 'pending' as const, label: 'PENDING' },
          in_progress: { status: 'in_production' as const, label: 'IN PROGRESS' },
          done: { status: 'active' as const, label: 'COMPLETED' },
        }
        const s = statusMap[t.status]
        return <StatusBadge status={s.status} label={s.label} />
      },
      sortValue: (t) => t.status,
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (t) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          {t.status === 'pending' && (
            <Tooltip content="Start working on this task">
              <button
                type="button"
                onClick={() => updateTaskStatus(t.id, 'in_progress')}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs font-sans"
              >
                <Play className="w-3 h-3 fill-current" />
                Start Task
              </button>
            </Tooltip>
          )}
          {t.status === 'in_progress' && (
            <Tooltip content="Mark this task completed">
              <button
                type="button"
                onClick={() => updateTaskStatus(t.id, 'done')}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs font-sans"
              >
                <Check className="w-3.5 h-3.5" />
                Mark Done
              </button>
            </Tooltip>
          )}
          {t.status === 'done' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 font-sans">
              <Check className="w-3.5 h-3.5" /> Passed
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Kitchen Tasks & Shift Delegation
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Assign smoker calibration, cold room temp monitoring, pre-marination rubbing, and hygiene checklist tasks to shift operators.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="h-10 px-4 text-sm font-medium shadow-xs"
        >
          New Kitchen Task
        </Button>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Shift Tasks"
          value={totalTasks}
          description="Delegated checklist items"
          icon={<CheckSquare className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Active In Progress"
          value={inProgressCount}
          description="Currently being worked"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Pending Start"
          value={pendingCount}
          description="Awaiting shift operator"
          icon={<AlertTriangle className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Completed Today"
          value={completedCount}
          description="Verified by shift lead"
          icon={<Check className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Table */}
      <DataTable
        data={kitchenTasks}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search task title or assignee..."
        exportFilename="smokey-kitchen-tasks"
      />

      {/* Create Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign New Kitchen Task"
        description="Delegate operational tasks to pitmasters, prep cooks, or QC staff."
      >
        <form onSubmit={handleConfirmCreate} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g. Clean & re-season Smoker Pit #2 grates"
            value={newTask.title}
            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <Input
            label="Detailed Instructions"
            placeholder="e.g. Inspect wire mesh, scrape charred fat, apply vegetable oil coating"
            value={newTask.description}
            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assigned Crew Member"
              value={newTask.assignee_name}
              onChange={(e) => setNewTask(prev => ({ ...prev, assignee_name: e.target.value }))}
              options={[
                { value: "Babajide 'Pitmaster'", label: "Babajide 'Pitmaster' (Lead Smoker)" },
                { value: "Folake Adebayo", label: "Folake Adebayo (HACCP / QC Lead)" },
                { value: "Chioma Okonkwo", label: "Chioma Okonkwo (Cold-chain Store)" },
                { value: "Emeka Nwosu", label: "Emeka Nwosu (Prep Cook)" },
                { value: "Admin", label: "Admin" },
              ]}
            />

            <Select
              label="Priority Level"
              value={newTask.priority}
              onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
              options={[
                { value: 'high', label: 'High Priority (Immediate)' },
                { value: 'normal', label: 'Normal Priority' },
                { value: 'low', label: 'Low / End of Shift' },
              ]}
            />
          </div>

          <Input
            label="Target Due Date"
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Task
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
export default KitchenTasksPage
