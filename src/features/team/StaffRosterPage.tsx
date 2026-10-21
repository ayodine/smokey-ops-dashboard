import React from 'react'
import { ResizableTable, defaultEmployees, Employee } from '@/components/ui/resizable-table'
import { PageHeader } from '@/components/ui/PageHeader'

const SMOKEY_OPERATIONS_STAFF: Employee[] = [
  {
    id: "emp-01",
    name: "Babajide 'Pitmaster' Ogundipe",
    email: "babajide.o@smokeyhut.com",
    department: "Pit Production",
    position: "Lead Smoker & Pitmaster",
    salary: 450000,
    hireDate: "2021-04-12",
    status: "active"
  },
  {
    id: "emp-02",
    name: "Folake Adebayo",
    email: "folake.a@smokeyhut.com",
    department: "Quality Control",
    position: "HACCP & Food Safety Lead",
    salary: 380000,
    hireDate: "2022-01-15",
    status: "active"
  },
  {
    id: "emp-03",
    name: "Tunde Bakare",
    email: "tunde.b@smokeyhut.com",
    department: "Logistics",
    position: "Fleet Lead Courier (Bike 04)",
    salary: 220000,
    hireDate: "2023-03-10",
    status: "active"
  },
  {
    id: "emp-04",
    name: "Chioma Okonkwo",
    email: "chioma.o@smokeyhut.com",
    department: "Inventory",
    position: "Cold-Chain Storekeeper",
    salary: 280000,
    hireDate: "2022-08-01",
    status: "active"
  },
  {
    id: "emp-05",
    name: "Segun Alabi",
    email: "segun.a@smokeyhut.com",
    department: "Logistics",
    position: "Dispatch Staging Supervisor",
    salary: 310000,
    hireDate: "2021-11-20",
    status: "on-leave"
  },
  {
    id: "emp-06",
    name: "Amina Yusuf",
    email: "amina.y@smokeyhut.com",
    department: "Procurement",
    position: "Vendor & Meat Sourcing Officer",
    salary: 340000,
    hireDate: "2023-06-05",
    status: "active"
  },
  {
    id: "emp-07",
    name: "Emeka Nwosu",
    email: "emeka.n@smokeyhut.com",
    department: "Pit Production",
    position: "Smoker Pit Operator (Pit 1)",
    salary: 260000,
    hireDate: "2024-02-18",
    status: "active"
  },
  {
    id: "emp-08",
    name: "Kemi Adeleke",
    email: "kemi.a@smokeyhut.com",
    department: "Logistics",
    position: "Lekki Hub Dispatcher",
    salary: 250000,
    hireDate: "2023-09-12",
    status: "inactive"
  },
  ...defaultEmployees.map(e => ({
    ...e,
    id: `staff-${e.id}`,
    email: e.email.replace('@company.com', '@smokeyhut.com')
  }))
]

export const StaffRosterPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Operations Staff Roster"
        subtitle="Manage cooks, quality control inspectors, warehouse storekeepers, and delivery drivers."
      />

      <ResizableTable
        title="Operations Staff"
        employees={SMOKEY_OPERATIONS_STAFF}
        onEmployeeSelect={(id) => console.log('Selected staff:', id)}
        onColumnResize={(col, width) => console.log(`Column ${col} resized to ${width}px`)}
      />
    </div>
  )
}
export default StaffRosterPage
