import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence, type Variants } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Download, ChevronDown, Check, ArrowDownWideNarrow } from "lucide-react";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  status: "active" | "inactive" | "on-leave";
  avatar?: string;
}

export interface ResizableTableProps {
  title?: string;
  employees?: Employee[];
  onEmployeeSelect?: (employeeId: string) => void;
  onColumnResize?: (columnKey: string, newWidth: number) => void;
  className?: string;
  enableAnimations?: boolean;
}

export const defaultEmployees: Employee[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    department: "Engineering",
    position: "Senior Software Engineer",
    salary: 125000,
    hireDate: "2022-03-15",
    status: "active"
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    email: "michael.rodriguez@company.com",
    department: "Marketing",
    position: "Marketing Manager",
    salary: 95000,
    hireDate: "2021-08-22",
    status: "active"
  },
  {
    id: "3",
    name: "Emily Watson",
    email: "emily.watson@company.com",
    department: "Design",
    position: "UX Designer",
    salary: 88000,
    hireDate: "2023-01-10",
    status: "active"
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@company.com",
    department: "Engineering",
    position: "Tech Lead",
    salary: 145000,
    hireDate: "2020-11-05",
    status: "active"
  },
  {
    id: "5",
    name: "Lisa Anderson",
    email: "lisa.anderson@company.com",
    department: "HR",
    position: "HR Director",
    salary: 110000,
    hireDate: "2019-06-12",
    status: "on-leave"
  },
  {
    id: "6",
    name: "James Mitchell",
    email: "james.mitchell@company.com",
    department: "Sales",
    position: "Sales Director",
    salary: 130000,
    hireDate: "2021-02-28",
    status: "active"
  },
  {
    id: "7",
    name: "Jennifer Lee",
    email: "jennifer.lee@company.com",
    department: "Finance",
    position: "Financial Analyst",
    salary: 75000,
    hireDate: "2023-04-18",
    status: "active"
  },
  {
    id: "8",
    name: "Robert Chang",
    email: "robert.chang@company.com",
    department: "Engineering",
    position: "DevOps Engineer",
    salary: 105000,
    hireDate: "2022-09-14",
    status: "active"
  },
  {
    id: "9",
    name: "Amanda Pierce",
    email: "amanda.pierce@company.com",
    department: "Marketing",
    position: "Content Manager",
    salary: 72000,
    hireDate: "2023-07-03",
    status: "inactive"
  },
  {
    id: "10",
    name: "Christopher Hayes",
    email: "chris.hayes@company.com",
    department: "Operations",
    position: "Operations Manager",
    salary: 98000,
    hireDate: "2021-12-01",
    status: "active"
  },
  {
    id: "11",
    name: "Victoria Moore",
    email: "victoria.moore@company.com",
    department: "Design",
    position: "Product Designer",
    salary: 92000,
    hireDate: "2022-05-20",
    status: "active"
  },
  {
    id: "12",
    name: "Nicholas Brown",
    email: "nicholas.brown@company.com",
    department: "Engineering",
    position: "Frontend Developer",
    salary: 85000,
    hireDate: "2023-03-08",
    status: "active"
  },
  {
    id: "13",
    name: "Rebecca Sullivan",
    email: "rebecca.sullivan@company.com",
    department: "Sales",
    position: "Account Executive",
    salary: 78000,
    hireDate: "2022-11-15",
    status: "active"
  },
  {
    id: "14",
    name: "Thomas Wright",
    email: "thomas.wright@company.com",
    department: "Finance",
    position: "Senior Financial Analyst",
    salary: 95000,
    hireDate: "2021-04-30",
    status: "active"
  },
  {
    id: "15",
    name: "Maria Garcia",
    email: "maria.garcia@company.com",
    department: "HR",
    position: "HR Specialist",
    salary: 68000,
    hireDate: "2023-08-12",
    status: "active"
  }
];

type SortField = "name" | "department" | "position" | "salary" | "hireDate";
type SortOrder = "asc" | "desc";

export function ResizableTable({
  title = "Employee",
  employees: initialEmployees = defaultEmployees,
  onEmployeeSelect,
  onColumnResize,
  className = "",
  enableAnimations = true
}: ResizableTableProps = {}) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Column width state with default values
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 50,
    name: 200,
    email: 220,
    department: 140,
    position: 180,
    salary: 120,
    hireDate: 120,
    status: 100
  });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
    if (onEmployeeSelect) {
      onEmployeeSelect(employeeId);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === paginatedEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(paginatedEmployees.map(e => e.id));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setShowSortMenu(false);
    setCurrentPage(1);
  };

  const sortedEmployees = useMemo(() => {
    if (!sortField) {
      return initialEmployees;
    }

    return [...initialEmployees].sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (sortField === "hireDate") {
        aVal = new Date(a.hireDate).getTime();
        bVal = new Date(b.hireDate).getTime();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [initialEmployees, sortField, sortOrder]);

  const paginatedEmployees = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedEmployees.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedEmployees, currentPage]);

  const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    if (!mounted) {
      const statusMap: Record<string, { bgColor: string; borderColor: string; textColor: string; dotColor: string }> = {
        "active": {
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          textColor: "text-green-400",
          dotColor: "bg-green-400"
        },
        "inactive": {
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          textColor: "text-red-400",
          dotColor: "bg-red-400"
        },
        "on-leave": {
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
          textColor: "text-yellow-400",
          dotColor: "bg-yellow-400"
        }
      };
      return statusMap[status];
    }

    const statusMap: Record<string, { bgColor: string; borderColor: string; textColor: string; dotColor: string }> = {
      "active": {
        bgColor: isDark ? "bg-green-500/10" : "bg-green-50",
        borderColor: isDark ? "border-green-500/30" : "border-green-200",
        textColor: isDark ? "text-green-400" : "text-green-600",
        dotColor: isDark ? "bg-green-400" : "bg-green-600"
      },
      "inactive": {
        bgColor: isDark ? "bg-red-500/10" : "bg-red-50",
        borderColor: isDark ? "border-red-500/30" : "border-red-200",
        textColor: isDark ? "text-red-400" : "text-red-600",
        dotColor: isDark ? "bg-red-400" : "bg-red-600"
      },
      "on-leave": {
        bgColor: isDark ? "bg-yellow-500/10" : "bg-yellow-50",
        borderColor: isDark ? "border-yellow-500/30" : "border-yellow-200",
        textColor: isDark ? "text-yellow-400" : "text-yellow-600",
        dotColor: isDark ? "bg-yellow-400" : "bg-yellow-600"
      }
    };

    return statusMap[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleResize = (columnKey: string, { size }: { size: { width: number } }) => {
    const newWidth = Math.max(80, Math.min(400, size.width));
    
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: newWidth
    }));
    
    if (onColumnResize) {
      onColumnResize(columnKey, newWidth);
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Department", "Position", "Salary", "Hire Date", "Status"];
    const rows = sortedEmployees.map(employee => [
      employee.name,
      employee.email,
      employee.department,
      employee.position,
      employee.salary,
      employee.hireDate,
      employee.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(sortedEmployees, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `employees-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const containerVariants: Variants = {
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    }
  };

  const rowVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.98,
      filter: "blur(4px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className={`w-full max-w-7xl mx-auto select-none ${className}`}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {title && (
            <h2 className="text-[15px] sm:text-base font-semibold text-foreground tracking-normal">
              {title}
            </h2>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Dropdown Button */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-sm hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-md cursor-pointer"
            >
                <ArrowDownWideNarrow className="w-3.5 h-3.5 text-foreground/80 shrink-0" />
              Sort {sortField && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-sm px-1.5 py-0.5">1</span>}
              <ChevronDown size={14} className="opacity-50" />
            </button>
            
            {showSortMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-background border border-border/50 shadow-lg rounded-md z-20 py-1">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors cursor-pointer ${sortField === "name" ? 'bg-muted/30 font-semibold' : ''}`}
                  >
                    Name {sortField === "name" && `(${sortOrder === "asc" ? "A-Z" : "Z-A"})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("department")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors cursor-pointer ${sortField === "department" ? 'bg-muted/30 font-semibold' : ''}`}
                  >
                    Department {sortField === "department" && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("salary")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors cursor-pointer ${sortField === "salary" ? 'bg-muted/30 font-semibold' : ''}`}
                  >
                    Salary {sortField === "salary" && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("hireDate")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors cursor-pointer ${sortField === "hireDate" ? 'bg-muted/30 font-semibold' : ''}`}
                  >
                    Hire Date {sortField === "hireDate" && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-sm hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-md cursor-pointer"
            >
              <Download size={14} />
              Export
              <ChevronDown size={14} className="opacity-50" />
            </button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-background border border-border/50 shadow-lg rounded-md z-20">
                  <button
                    type="button"
                    onClick={() => {
                      exportToCSV();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToJSON();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 border-t border-border/30 cursor-pointer"
                  >
                    JSON
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background border border-border/50 overflow-hidden rounded-lg relative shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Resizable Column Headers with Vertical Dividers */}
            <div className="flex py-3 text-xs font-medium text-muted-foreground/80 bg-muted/5 border-b border-border">
              <div className="flex items-center justify-center border-r border-border pr-3" style={{ width: columnWidths.checkbox }}>
                <button
                  type="button"
                  role="checkbox"
                  aria-label="Select all"
                  onClick={handleSelectAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 ${
                    paginatedEmployees.length > 0 && selectedEmployees.length === paginatedEmployees.length
                      ? 'border-[#c0201f]'
                      : 'border-border/80 hover:border-kumo-line-strong'
                  }`}
                >
                  {paginatedEmployees.length > 0 && selectedEmployees.length === paginatedEmployees.length && (
                    <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />
                  )}
                </button>
              </div>
              
              <Resizable
                width={columnWidths.name}
                height={0}
                onResize={(_e, data) => handleResize('name', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={<div className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-all" />}
              >
                <div className="flex items-center border-r border-border px-3 relative" style={{ width: columnWidths.name }}>
                  <span>{title}</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.email}
                height={0}
                onResize={(_e, data) => handleResize('email', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={<div className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-all" />}
              >
                <div className="flex items-center gap-1.5 border-r border-border px-3 relative" style={{ width: columnWidths.email }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-40">
                    <rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M2 6L8 9L14 6" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <span>Email</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.department}
                height={0}
                onResize={(_e, data) => handleResize('department', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={<div className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-all" />}
              >
                <div className="flex items-center gap-1.5 border-r border-border px-3 relative" style={{ width: columnWidths.department }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-40">
                    <path d="M2 2H4M2 8H6M2 14H8M10 2V14M14 4V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Department</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.position}
                height={0}
                onResize={(_e, data) => handleResize('position', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={<div className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-all" />}
              >
                <div className="flex items-center gap-1.5 border-r border-border px-3 relative" style={{ width: columnWidths.position }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-40">
                    <path d="M3 3H13M3 8H13M3 13H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Position</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.salary}
                height={0}
                onResize={(_e, data) => handleResize('salary', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={<div className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-all" />}
              >
                <div className="flex items-center gap-1.5 border-r border-border px-3 relative" style={{ width: columnWidths.salary }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-40">
                    <path d="M8 1L3 9H7L8 15L13 7H9L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Salary</span>
                </div>
              </Resizable>

              <Resizable
                width={columnWidths.hireDate}
                height={0}
                onResize={(_e, data) => handleResize('hireDate', data)}
                minConstraints={[80, 0]}
                maxConstraints={[400, 0]}
                handle={<div className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-all" />}
              >
                <div className="flex items-center gap-1.5 border-r border-border px-3 relative" style={{ width: columnWidths.hireDate }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-40">
                    <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M6 1V3M10 1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Hire Date</span>
                </div>
              </Resizable>

              <div className="flex items-center gap-1.5 px-3" style={{ width: columnWidths.status }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-40">
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Status</span>
              </div>
            </div>

            {/* Animated Rows with Light Mode Styling */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}`}
                variants={shouldAnimate ? containerVariants : {}}
                initial={shouldAnimate ? "hidden" : "visible"}
                animate="visible"
              >
                {paginatedEmployees.map((employee) => (
                  <motion.div key={employee.id} variants={shouldAnimate ? rowVariants : {}}>
                    <div
                      className={`py-3.5 group relative transition-all duration-150 border-b border-border flex ${
                        selectedEmployees.includes(employee.id)
                          ? "bg-muted/30" 
                          : "bg-muted/5 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-center border-r border-border pr-3" style={{ width: columnWidths.checkbox }}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-label={`Select ${employee.name}`}
                          onClick={() => handleEmployeeSelect(employee.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 ${
                            selectedEmployees.includes(employee.id)
                              ? 'border-[#c0201f]'
                              : 'border-border/80 hover:border-kumo-line-strong'
                          }`}
                        >
                          {selectedEmployees.includes(employee.id) && (
                            <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center min-w-0 border-r border-border px-3" style={{ width: columnWidths.name }}>
                        <span className="text-sm font-medium text-foreground truncate">{employee.name}</span>
                      </div>

                      <div className="flex items-center min-w-0 border-r border-border px-3" style={{ width: columnWidths.email }}>
                        <a 
                          href={`mailto:${employee.email}`}
                          className="text-sm text-kumo-brand hover:underline truncate font-sans text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {employee.email}
                        </a>
                      </div>

                      <div className="flex items-center border-r border-border px-3" style={{ width: columnWidths.department }}>
                        <span className="text-sm text-foreground/80 truncate">
                          {employee.department}
                        </span>
                      </div>

                      <div className="flex items-center min-w-0 border-r border-border px-3" style={{ width: columnWidths.position }}>
                        <span className="text-sm text-foreground/80 truncate">
                          {employee.position}
                        </span>
                      </div>

                      <div className="flex items-center border-r border-border px-3" style={{ width: columnWidths.salary }}>
                        <span className="text-sm font-semibold text-foreground/90 font-sans">
                          {formatCurrency(employee.salary)}
                        </span>
                      </div>

                      <div className="flex items-center border-r border-border px-3" style={{ width: columnWidths.hireDate }}>
                        <span className="text-sm text-foreground/80 font-sans text-xs">
                          {formatDate(employee.hireDate)}
                        </span>
                      </div>

                      <div className="flex items-center px-3" style={{ width: columnWidths.status }}>
                        {(() => {
                          const { bgColor, textColor, dotColor, borderColor } = getStatusColor(employee.status);
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium whitespace-nowrap border ${borderColor} ${bgColor} ${textColor} rounded-md`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace('-', ' ')}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground/70">
            Page {currentPage} of {totalPages} • {sortedEmployees.length} employees
          </div>
          
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ResizableTable;
