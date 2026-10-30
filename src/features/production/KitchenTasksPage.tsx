import React, { useState } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { KitchenTask } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tooltip } from '@/components/ui/Tooltip'
import { SingleDatePicker } from '@/components/ui/SingleDatePicker'
import { formatDate } from '@/lib/utils'
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Play, 
  Check, 
  User,
  Eye
} from 'lucide-react'

export const KitchenTasksPage: React.FC = () => {
  const { kitchenTasks, updateTaskStatus, createKitchenTask } = useSmokeyOps()
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<KitchenTask | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee_name: "Babajide 'Pitmaster'",
    due_date: '2026-09-26',
    priority: 'normal' as 'high' | 'normal' | 'low',
    status: 'pending' as const
  })

  const handleOpenDetails = (task: KitchenTask) => {
    setSelectedTask(task)
    setIsDetailsModalOpen(true)
  }

  const totalTasks = kitchenTasks.length
  const inProgressCount = kitchenTasks.filter(t => t.status === 'in_progress').length
  const pendingCount = kitchenTasks.filter(t => t.status === 'pending').length
  const completedCount = kitchenTasks.filter(t => t.status === 'done').length

  const pendingTasks = kitchenTasks.filter(t => t.status === 'pending')
  const ongoingTasks = kitchenTasks.filter(t => t.status === 'in_progress')
  const completedTasks = kitchenTasks.filter(t => t.status === 'done')

  const displayedTasks = activeTab === 'pending' 
    ? pendingTasks 
    : activeTab === 'ongoing'
    ? ongoingTasks
    : activeTab === 'completed' 
    ? completedTasks 
    : kitchenTasks

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
          pending: { status: 'pending' as const, label: 'pending' },
          in_progress: { status: 'in_production' as const, label: 'in-progress' },
          done: { status: 'active' as const, label: 'completed' },
        }
        const s = statusMap[t.status]
        return <StatusBadge status={s.status} label={s.label} />
      },
      sortValue: (t) => t.status,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 220,
      accessor: (t) => (
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip content="View full task details and instructions">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenDetails(t)}
              leftIcon={<Eye className="w-3.5 h-3.5 text-zinc-500" />}
            >
              Details
            </TableActionButton>
          </Tooltip>
          {t.status === 'pending' && (
            <Tooltip content="Start working on this task">
              <TableActionButton
                variant="primary"
                icon={<Play className="fill-current" />}
                iconStrokeWidth={2}
                onClick={() => updateTaskStatus(t.id, 'in_progress')}
              >
                Start Task
              </TableActionButton>
            </Tooltip>
          )}
          {t.status === 'in_progress' && (
            <Tooltip content="Mark this task completed">
              <TableActionButton
                variant="success"
                icon={<Check />}
                iconStrokeWidth={2.5}
                onClick={() => updateTaskStatus(t.id, 'done')}
              >
                Mark Done
              </TableActionButton>
            </Tooltip>
          )}
          {t.status === 'done' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 font-sans whitespace-nowrap shrink-0 px-2">
              <Check className="w-3.5 h-3.5" /> Passed
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Kitchen Tasks & Shift Delegation"
        subtitle="Assign smoker calibration, cold room temp monitoring, pre-marination rubbing, and hygiene checklist tasks to shift operators."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="h-10 px-4 text-sm font-medium shadow-xs"
          >
            New Kitchen Task
          </Button>
        }
      />

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Shift Tasks"
          value={totalTasks}
          description="Delegated checklist items"
          icon={<CheckSquare className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="On-going Tasks"
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

      {/* Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Tasks', badge: kitchenTasks.length },
            { id: 'pending', label: 'Pending', badge: pendingTasks.length },
            { id: 'ongoing', label: 'On-going', badge: ongoingTasks.length },
            { id: 'completed', label: 'Completed', badge: completedTasks.length },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        data={displayedTasks}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search task title or assignee..."
        onRowClick={(task) => handleOpenDetails(task)}
        title={
          activeTab === 'all' 
            ? 'All Kitchen Tasks' 
            : activeTab === 'pending' 
            ? 'Pending Tasks' 
            : activeTab === 'ongoing'
            ? 'On-going Tasks'
            : 'Completed Tasks'
        }
        exportFilename={`smokey-kitchen-tasks-${activeTab}`}
      />

      {/* Create Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign New Kitchen Task"
        description="Delegate operational tasks to pitmasters, prep cooks, or QC staff."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="md" type="submit" form="assign-kitchen-task-form">
              Assign Task
            </Button>
          </div>
        }
      >
        <form id="assign-kitchen-task-form" onSubmit={handleConfirmCreate} className="space-y-4">
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

          <SingleDatePicker
            label="Target Due Date"
            value={newTask.due_date}
            onChange={(date) => setNewTask(prev => ({ ...prev, due_date: date }))}
            required
          />
        </form>
      </Dialog>

      {/* Task Details Modal — Desaturated Grey Layout with Clean Aligned Rows */}
      {selectedTask && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Kitchen Task: ${selectedTask.title}`}
          description="Operational shift delegation instructions, priority, and completion workflow."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                {selectedTask.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      updateTaskStatus(selectedTask.id, 'in_progress')
                      setIsDetailsModalOpen(false)
                    }}
                  >
                    Start Task
                  </Button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      updateTaskStatus(selectedTask.id, 'done')
                      setIsDetailsModalOpen(false)
                    }}
                  >
                    Mark Task Completed
                  </Button>
                )}
                {selectedTask.status === 'done' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsDetailsModalOpen(false)}
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              {/* Section 1: Task Specifications */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Task Specification
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Task Title</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedTask.title}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Assigned Crew Member</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedTask.assignee_name}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Priority Level</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                      {selectedTask.priority} priority
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Current State</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Target Due Date</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{formatDate(selectedTask.due_date)}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Instructions & Operating Guidelines */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Operating Instructions
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Detailed Directives</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed">{selectedTask.description || 'Follow standard operating procedure.'}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Station Scope</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">Central Kitchen Prep & Smoker Line</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Quality Sign-Off</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">Shift Supervisor Inspection Required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default KitchenTasksPage
