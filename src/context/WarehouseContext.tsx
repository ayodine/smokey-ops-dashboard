import React, { createContext, useContext, useState, useEffect } from 'react'

export interface FacilityOption {
  id: string
  code: string
  name: string
  city: string
  address?: string
  state?: string
  type?: 'central_kitchen' | 'warehouse' | 'retail_hub' | 'cold_storage'
  total_skus?: number
  capacity_utilization?: number
  manager_name?: string
  contact_phone?: string
  isPrimary?: boolean
  is_active?: boolean
}

export const INITIAL_FACILITY: FacilityOption = {
  id: 'yaba-hq',
  code: 'HQ-YABA',
  name: 'Yaba Head Office',
  city: 'Lagos',
  state: 'Lagos State',
  address: '14 Commercial Avenue, Yaba, Lagos',
  type: 'central_kitchen',
  total_skus: 36,
  capacity_utilization: 74,
  manager_name: 'Babajide Ogundipe',
  contact_phone: '+234 803 123 4567',
  isPrimary: true,
  is_active: true
}

interface WarehouseContextType {
  selectedWarehouse: FacilityOption
  setSelectedWarehouse: (facility: FacilityOption) => void
  facilities: FacilityOption[]
  addFacility: (facility: Omit<FacilityOption, 'id'>) => FacilityOption
  updateFacility: (id: string, updates: Partial<FacilityOption>) => void
  deleteFacility: (id: string) => void
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined)

// List of known legacy fake mock branches to purge from localStorage
const FAKE_BRANCH_KEYWORDS = [
  'central kitchen',
  'central hub',
  'lekki distribution',
  'lekki dispatch',
  'lekki cloud',
  'victoria island',
  'cold storage',
  'oregun cold',
  'surulere transit',
  'surulere distribution',
  'magodo',
  'festac',
  'maryland staging',
  'ajah regional'
]

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [facilities, setFacilities] = useState<FacilityOption[]>(() => {
    const saved = localStorage.getItem('ops_facilities')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep Yaba HQ and only genuine custom user-created branches (filter out mock legacy fake branches)
          const filtered = parsed.filter((f: FacilityOption) => {
            if (f.id === INITIAL_FACILITY.id || f.code === INITIAL_FACILITY.code || f.name === INITIAL_FACILITY.name) {
              return true
            }
            const nameLower = (f.name || '').toLowerCase()
            return !FAKE_BRANCH_KEYWORDS.some(keyword => nameLower.includes(keyword))
          })

          const hasYaba = filtered.some((f: FacilityOption) => f.id === INITIAL_FACILITY.id || f.name === INITIAL_FACILITY.name)
          const result = hasYaba ? filtered : [INITIAL_FACILITY, ...filtered]

          return result.map((f: FacilityOption) => ({
            ...f,
            city: f.city === 'Yaba, Lagos' ? 'Lagos' : f.city
          }))
        }
      } catch (err) {
        console.error('Failed to parse facilities', err)
      }
    }
    return [INITIAL_FACILITY]
  })

  const [selectedWarehouse, setSelectedWarehouseState] = useState<FacilityOption>(() => {
    const saved = localStorage.getItem('ops_selected_warehouse')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.id) {
          const nameLower = (parsed.name || '').toLowerCase()
          const isFake = FAKE_BRANCH_KEYWORDS.some(k => nameLower.includes(k))
          if (!isFake) {
            return {
              ...parsed,
              city: parsed.city === 'Yaba, Lagos' ? 'Lagos' : parsed.city
            }
          }
        }
      } catch {
        return INITIAL_FACILITY
      }
    }
    return INITIAL_FACILITY
  })

  // Ensure current selection is always valid among facilities
  useEffect(() => {
    localStorage.setItem('ops_facilities', JSON.stringify(facilities))
    if (!facilities.some(f => f.id === selectedWarehouse.id)) {
      setSelectedWarehouseState(facilities[0] || INITIAL_FACILITY)
    }
  }, [facilities, selectedWarehouse.id])

  const setSelectedWarehouse = (facility: FacilityOption) => {
    setSelectedWarehouseState(facility)
    localStorage.setItem('ops_selected_warehouse', JSON.stringify(facility))
  }

  const addFacility = (newFacData: Omit<FacilityOption, 'id'>): FacilityOption => {
    const newFacility: FacilityOption = {
      type: 'warehouse',
      total_skus: 24,
      capacity_utilization: 50,
      manager_name: 'Operations Lead',
      contact_phone: '+234 800 000 0000',
      is_active: true,
      ...newFacData,
      id: `fac-${Date.now()}`
    }
    const updated = [...facilities, newFacility]
    setFacilities(updated)
    setSelectedWarehouse(newFacility)
    return newFacility
  }

  const updateFacility = (id: string, updates: Partial<FacilityOption>) => {
    setFacilities(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          return { ...f, ...updates }
        }
        return f
      })
      return updated
    })
    if (selectedWarehouse.id === id) {
      setSelectedWarehouseState(prev => ({ ...prev, ...updates }))
    }
  }

  const deleteFacility = (id: string) => {
    if (id === INITIAL_FACILITY.id || facilities.length <= 1) return
    const updated = facilities.filter(f => f.id !== id)
    setFacilities(updated)
    if (selectedWarehouse.id === id) {
      setSelectedWarehouse(updated[0])
    }
  }

  return (
    <WarehouseContext.Provider value={{ selectedWarehouse, setSelectedWarehouse, facilities, addFacility, updateFacility, deleteFacility }}>
      {children}
    </WarehouseContext.Provider>
  )
}

export const useWarehouse = () => {
  const context = useContext(WarehouseContext)
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider')
  }
  return context
}

