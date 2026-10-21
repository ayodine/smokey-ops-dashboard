import React, { createContext, useContext, useState, useEffect } from 'react'

export interface FacilityOption {
  id: string
  code: string
  name: string
  city: string
  address?: string
  isPrimary?: boolean
}

export const INITIAL_FACILITY: FacilityOption = {
  id: 'yaba-hq',
  code: 'HQ-YABA',
  name: 'Yaba Head Office',
  city: 'Lagos',
  address: '14 Commercial Avenue, Yaba, Lagos',
  isPrimary: true
}

interface WarehouseContextType {
  selectedWarehouse: FacilityOption
  setSelectedWarehouse: (facility: FacilityOption) => void
  facilities: FacilityOption[]
  addFacility: (facility: Omit<FacilityOption, 'id'>) => FacilityOption
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined)

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [facilities, setFacilities] = useState<FacilityOption[]>(() => {
    const saved = localStorage.getItem('ops_facilities')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize legacy 'Yaba, Lagos' redundancy to 'Lagos'
          return parsed.map((f: FacilityOption) => ({
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
          return {
            ...parsed,
            city: parsed.city === 'Yaba, Lagos' ? 'Lagos' : parsed.city
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
  }, [facilities])

  const setSelectedWarehouse = (facility: FacilityOption) => {
    setSelectedWarehouseState(facility)
    localStorage.setItem('ops_selected_warehouse', JSON.stringify(facility))
  }

  const addFacility = (newFacData: Omit<FacilityOption, 'id'>): FacilityOption => {
    const newFacility: FacilityOption = {
      ...newFacData,
      id: `fac-${Date.now()}`
    }
    const updated = [...facilities, newFacility]
    setFacilities(updated)
    setSelectedWarehouse(newFacility)
    return newFacility
  }

  return (
    <WarehouseContext.Provider value={{ selectedWarehouse, setSelectedWarehouse, facilities, addFacility }}>
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

